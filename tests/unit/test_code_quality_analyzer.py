#!/usr/bin/env python3
"""
Unit tests for code_quality_analyzer.py
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.code_quality import (
    CodeQualityAnalyzer,
    QualityIssue,
    QualityReport
)

class TestQualityIssue(unittest.TestCase):
    """Test QualityIssue dataclass"""

    def test_quality_issue_creation(self):
        """Test creating a quality issue"""
        issue = QualityIssue(
            severity="error",
            category="security",
            rule_id="hardcoded-password",
            message="Potential hardcoded credential",
            file_path="/test/file.py",
            line_number=42,
            code_snippet='API_KEY = "secret"',
            suggestion="Use environment variables"
        )

        self.assertEqual(issue.severity, "error")
        self.assertEqual(issue.category, "security")
        self.assertEqual(issue.line_number, 42)
        self.assertIsNotNone(issue.suggestion)

class TestQualityReport(unittest.TestCase):
    """Test QualityReport dataclass"""

    def test_quality_report_initialization(self):
        """Test report initialization"""
        report = QualityReport()

        self.assertEqual(report.total_files_scanned, 0)
        self.assertEqual(report.total_issues, 0)
        self.assertEqual(len(report.issues), 0)

    def test_quality_report_aggregation(self):
        """Test report issue aggregation"""
        report = QualityReport()

        issue1 = QualityIssue("error", "security", "test-rule", "Test", "file.py", 1)
        issue2 = QualityIssue("warning", "code_smell", "test-rule", "Test", "file.py", 2)

        report.issues.append(issue1)
        report.issues.append(issue2)
        report.total_issues = 2
        report.issues_by_severity["error"] = 1
        report.issues_by_severity["warning"] = 1

        self.assertEqual(len(report.issues), 2)
        self.assertEqual(report.issues_by_severity["error"], 1)

class TestCodeQualityAnalyzer(unittest.TestCase):
    """Test CodeQualityAnalyzer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test analyzer initialization"""
        self.assertEqual(self.analyzer.root_path, Path(self.temp_dir))
        self.assertIsNotNone(self.analyzer.python_rules)
        self.assertIsNotNone(self.analyzer.typescript_rules)
        self.assertGreater(len(self.analyzer.python_rules), 0)
        self.assertGreater(len(self.analyzer.typescript_rules), 0)

    def test_python_rules_loaded(self):
        """Test Python rules are loaded"""
        rule_ids = {rule['id'] for rule in self.analyzer.python_rules}

        self.assertIn('bare-except', rule_ids)
        self.assertIn('print-statement', rule_ids)
        self.assertIn('many-parameters', rule_ids)

    def test_typescript_rules_loaded(self):
        """Test TypeScript rules are loaded"""
        rule_ids = {rule['id'] for rule in self.analyzer.typescript_rules}

        self.assertIn('console-log', rule_ids)
        self.assertIn('any-type', rule_ids)
        self.assertIn('eval-usage', rule_ids)

    def test_analyze_python_file_with_issues(self):
        """Test analyzing Python file with issues"""
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("""
def test_function():
    print("Debug message")

try:
    something()
except:
    pass
""")

        self.analyzer.analyze_file(test_file)

        self.assertEqual(self.analyzer.report.total_files_scanned, 1)
        # May have issues depending on ast-grep availability

    def test_analyze_typescript_file_with_issues(self):
        """Test analyzing TypeScript file with issues"""
        test_file = Path(self.temp_dir) / "test.ts"
        test_file.write_text("""
function debug(data: any): void {
    console.log(data);
}

try {
    riskyOperation();
} catch (e) {}
""")

        self.analyzer.analyze_file(test_file)

        self.assertEqual(self.analyzer.report.total_files_scanned, 1)

    def test_analyze_directory(self):
        """Test analyzing entire directory"""
        # Create test files
        py_file = Path(self.temp_dir) / "test.py"
        py_file.write_text("def test(): pass")

        ts_file = Path(self.temp_dir) / "test.ts"
        ts_file.write_text("function test() {}")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        self.assertGreaterEqual(self.analyzer.report.total_files_scanned, 2)

    def test_generate_report_text(self):
        """Test text report generation"""
        # Add a test issue
        issue = QualityIssue(
            severity="warning",
            category="code_smell",
            rule_id="test-rule",
            message="Test issue",
            file_path="/test/file.py",
            line_number=10
        )
        self.analyzer.report.issues.append(issue)
        self.analyzer.report.total_issues = 1
        self.analyzer.report.issues_by_severity["warning"] = 1

        report_text = self.analyzer.generate_report_text()

        self.assertIn("CODE QUALITY ANALYSIS REPORT", report_text)
        self.assertIn("Total Issues Found: 1", report_text)
        self.assertIn("WARNING", report_text)

    def test_save_report_json(self):
        """Test JSON report saving"""
        output_file = Path(self.temp_dir) / "quality_report.json"

        self.analyzer.report.total_files_scanned = 5
        self.analyzer.report.total_issues = 10

        self.analyzer.save_report_json(output_file)

        self.assertTrue(output_file.exists())

        with open(output_file, 'r') as f:
            data = json.load(f)

        self.assertIn("summary", data)
        self.assertEqual(data["summary"]["total_files_scanned"], 5)

    def test_skip_excluded_directories(self):
        """Test that excluded directories are skipped"""
        # Create node_modules directory
        node_modules = Path(self.temp_dir) / "node_modules"
        node_modules.mkdir()
        (node_modules / "test.js").write_text("console.log('test');")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        # Should not scan node_modules
        scanned_files = [issue.file_path for issue in self.analyzer.report.issues]
        self.assertFalse(any('node_modules' in f for f in scanned_files))


class TestHardcodedCredentialDetection(unittest.TestCase):
    """Test false positive exclusions for hardcoded credential detection"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_enum_style_assignment_excluded(self):
        """Test that enum-style assignments are not flagged as credentials"""
        # This is an enum value, not a credential
        code = 'TOKEN_USAGE = "token_usage"'
        result = self.analyzer._is_likely_hardcoded_credential(code)
        self.assertFalse(result, "Enum-style TOKEN_USAGE should not be flagged")

    def test_process_env_excluded(self):
        """Test that process.env references are not flagged"""
        code = 'const secret = process.env.MY_SECRET'
        result = self.analyzer._is_likely_hardcoded_credential(code)
        self.assertFalse(result, "process.env references should not be flagged")

    def test_os_getenv_excluded(self):
        """Test that os.getenv references are not flagged"""
        code = 'secret = os.getenv("MY_SECRET")'
        result = self.analyzer._is_likely_hardcoded_credential(code)
        self.assertFalse(result, "os.getenv references should not be flagged")

    def test_url_patterns_excluded(self):
        """Test that OAuth URLs are not flagged as credentials"""
        code = 'oauth_url = "https://apis.example.com/oauth/v2/token"'
        result = self.analyzer._is_likely_hardcoded_credential(code)
        self.assertFalse(result, "OAuth URLs should not be flagged")

    def test_test_values_excluded(self):
        """Test that fake/mock/test values are not flagged"""
        test_cases = [
            'password = "fake_password"',
            'token = "mock_token_123"',
            'api_key = "test_api_key"',
            'secret = "dummy_secret"',
            'credential = "invalid_credential"',
        ]
        for code in test_cases:
            result = self.analyzer._is_likely_hardcoded_credential(code)
            self.assertFalse(result, f"Test value should not be flagged: {code}")

    def test_config_key_names_excluded(self):
        """Test that configuration key names are not flagged"""
        test_cases = [
            'PASSWORD_KEY = "password_key"',
            'SECRET_NAME = "my_secret_name"',
            'TOKEN_TYPE = "bearer"',
        ]
        for code in test_cases:
            result = self.analyzer._is_likely_hardcoded_credential(code)
            self.assertFalse(result, f"Config key name should not be flagged: {code}")

    def test_real_hardcoded_credential_flagged(self):
        """Test that actual hardcoded credentials ARE flagged"""
        # These should be flagged as real credentials
        test_cases = [
            'api_key = "sk-abc123xyz789"',
            'password = "MyR3alP@ssword!"',
            'secret = "a1b2c3d4e5f6g7h8i9j0"',
        ]
        for code in test_cases:
            result = self.analyzer._is_likely_hardcoded_credential(code)
            self.assertTrue(result, f"Real credential should be flagged: {code}")

    def test_is_enum_style_assignment(self):
        """Test enum-style assignment detection"""
        # Should be detected as enum
        self.assertTrue(self.analyzer._is_enum_style_assignment('TOKEN_USAGE = "token_usage"'))
        self.assertTrue(self.analyzer._is_enum_style_assignment('PASSWORD = "password"'))

        # Should NOT be detected as enum (different value)
        self.assertFalse(self.analyzer._is_enum_style_assignment('API_KEY = "sk-abc123"'))

    def test_is_test_or_example_file(self):
        """Test detection of test/example files"""
        # Should be detected as test files
        test_paths = [
            Path('/project/tests/test_auth.py'),
            Path('/project/__tests__/auth.test.ts'),
            Path('/project/spec/auth_spec.rb'),
            Path('/project/examples/demo.py'),
            Path('/project/fixtures/test_data.py'),
        ]
        for path in test_paths:
            self.assertTrue(
                self.analyzer._is_test_or_example_file(path),
                f"Should be detected as test file: {path}"
            )

        # Should NOT be detected as test files
        regular_paths = [
            Path('/project/src/auth.py'),
            Path('/project/lib/utils.ts'),
            Path('/project/app/main.py'),
        ]
        for path in regular_paths:
            self.assertFalse(
                self.analyzer._is_test_or_example_file(path),
                f"Should NOT be detected as test file: {path}"
            )

    def test_constant_label_detection(self):
        """Test detection of constant labels vs secrets"""
        # These are labels (descriptive constants)
        self.assertTrue(self.analyzer._is_constant_label('TOKEN_USAGE = "token_usage"'))
        self.assertTrue(self.analyzer._is_constant_label('EVENT_TYPE = "auth_event"'))
        self.assertTrue(self.analyzer._is_constant_label('SECRET_NAME = "my_secret"'))

        # These are NOT labels (actual values)
        self.assertFalse(self.analyzer._is_constant_label('API_KEY = "sk-abc123"'))
        self.assertFalse(self.analyzer._is_constant_label('password = "secret123"'))


class TestDocstringDetection(unittest.TestCase):
    """Test the _has_no_docstring method to prevent false positives"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_function_with_docstring_not_flagged(self):
        """Test that functions WITH docstrings are NOT flagged"""
        # Standard docstring on next line
        code_with_docstring = '''def my_function(arg1, arg2):
    """This is a docstring."""
    return arg1 + arg2'''
        result = self.analyzer._has_no_docstring(code_with_docstring)
        self.assertFalse(result, "Function with docstring should NOT be flagged")

    def test_function_with_multiline_docstring_not_flagged(self):
        """Test that functions with multiline docstrings are NOT flagged"""
        code_with_multiline = '''def __init__(self, root_dir: Path):
        """
        Initialize the analyzer.

        Args:
            root_dir: Root directory to analyze
        """
        self.root_dir = root_dir'''
        result = self.analyzer._has_no_docstring(code_with_multiline)
        self.assertFalse(result, "Function with multiline docstring should NOT be flagged")

    def test_function_with_single_quotes_docstring_not_flagged(self):
        """Test that functions with single-quote docstrings are NOT flagged"""
        code_with_single_quotes = """def my_function():
    '''Single quote docstring.'''
    pass"""
        result = self.analyzer._has_no_docstring(code_with_single_quotes)
        self.assertFalse(result, "Function with single-quote docstring should NOT be flagged")

    def test_function_without_docstring_flagged(self):
        """Test that functions WITHOUT docstrings ARE flagged"""
        code_without_docstring = '''def my_function(arg1, arg2):
    return arg1 + arg2'''
        result = self.analyzer._has_no_docstring(code_without_docstring)
        self.assertTrue(result, "Function without docstring SHOULD be flagged")

    def test_init_with_docstring_not_flagged(self):
        """Test __init__ with docstring is NOT flagged (regression test)"""
        # This was the false positive case - multiline __init__ with docstring
        code = '''def __init__(self, analyzer_name: str, cache_dir: Path):
        """
        Initialize cache for a specific analyzer

        Args:
            analyzer_name: Name of the analyzer
            cache_dir: Directory to store cache files
        """
        self.analyzer_name = analyzer_name'''
        result = self.analyzer._has_no_docstring(code)
        self.assertFalse(result, "__init__ with docstring should NOT be flagged")

    def test_multiarg_init_with_docstring_not_flagged(self):
        """Test multi-argument __init__ with docstring is NOT flagged"""
        code = '''def __init__(
        self,
        analyzer_name: str,
        max_workers: Optional[int] = None,
        use_cache: bool = True
    ):
        """
        Initialize parallel analyzer

        Args:
            analyzer_name: Name of the analyzer
            max_workers: Maximum number of workers
            use_cache: Whether to use caching
        """
        self.analyzer_name = analyzer_name'''
        result = self.analyzer._has_no_docstring(code)
        self.assertFalse(result, "Multi-arg __init__ with docstring should NOT be flagged")

    def test_inline_docstring_not_flagged(self):
        """Test inline docstring is NOT flagged"""
        code = 'def simple(): """Inline doc.""" pass'
        result = self.analyzer._has_no_docstring(code)
        self.assertFalse(result, "Inline docstring should NOT be flagged")


class TestGetLanguageAndRules(unittest.TestCase):
    """Test _get_language_and_rules method for file type detection"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_python_file_detection(self):
        """Test Python file returns python language and rules"""
        file_path = Path("/test/file.py")
        language, rules = self.analyzer._get_language_and_rules(file_path)

        self.assertEqual(language, "python")
        self.assertEqual(rules, self.analyzer.python_rules)

    def test_typescript_file_detection(self):
        """Test TypeScript file returns typescript language and rules"""
        for ext in [".ts", ".tsx"]:
            file_path = Path(f"/test/file{ext}")
            language, rules = self.analyzer._get_language_and_rules(file_path)

            self.assertEqual(language, "typescript")
            self.assertEqual(rules, self.analyzer.typescript_rules)

    def test_javascript_file_detection(self):
        """Test JavaScript file returns javascript language and typescript rules"""
        for ext in [".js", ".jsx"]:
            file_path = Path(f"/test/file{ext}")
            language, rules = self.analyzer._get_language_and_rules(file_path)

            self.assertEqual(language, "javascript")
            self.assertEqual(rules, self.analyzer.typescript_rules)

    def test_unknown_file_type_returns_none(self):
        """Test unknown file types return None"""
        unknown_extensions = [".txt", ".md", ".html", ".css", ".json", ".yaml", ".rb", ".go"]
        for ext in unknown_extensions:
            file_path = Path(f"/test/file{ext}")
            language, rules = self.analyzer._get_language_and_rules(file_path)

            self.assertIsNone(language, f"Expected None language for {ext}")
            self.assertIsNone(rules, f"Expected None rules for {ext}")


class TestShouldSkipMatch(unittest.TestCase):
    """Test _should_skip_match method for match filtering"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_skip_security_check_in_test_file(self):
        """Test security rules are skipped in test files"""
        match = {"text": "password = \"test123\""}
        rule = {"category": "security", "id": "hardcoded-password"}
        file_path = Path("/project/tests/test_auth.py")

        result = self.analyzer._should_skip_match(match, rule, file_path)

        self.assertTrue(result, "Security issues should be skipped in test files")

    def test_security_check_in_regular_file(self):
        """Test security rules are NOT skipped in regular files"""
        match = {"text": "password = \"test123\""}
        rule = {"category": "security", "id": "hardcoded-password"}
        file_path = Path("/project/src/auth.py")

        result = self.analyzer._should_skip_match(match, rule, file_path)

        # Without a check function, should not skip
        self.assertFalse(result, "Security issues should NOT be skipped in regular files")

    def test_skip_match_without_check_function(self):
        """Test matches without check function are not skipped"""
        match = {"text": "console.log('test')"}
        rule = {"category": "best_practice", "id": "console-log"}

        result = self.analyzer._should_skip_match(match, rule)

        self.assertFalse(result, "Matches without check function should not be skipped")

    def test_skip_match_with_failing_check(self):
        """Test matches where check returns False are skipped"""
        match = {"text": "def foo():\n    \"\"\"Docstring.\"\"\"\n    pass"}
        rule = {
            "category": "documentation",
            "id": "missing-docstring",
            "check": self.analyzer._has_no_docstring
        }

        result = self.analyzer._should_skip_match(match, rule)

        self.assertTrue(result, "Matches where check returns False should be skipped")

    def test_do_not_skip_match_with_passing_check(self):
        """Test matches where check returns True are NOT skipped"""
        match = {"text": "def foo():\n    pass"}
        rule = {
            "category": "documentation",
            "id": "missing-docstring",
            "check": self.analyzer._has_no_docstring
        }

        result = self.analyzer._should_skip_match(match, rule)

        self.assertFalse(result, "Matches where check returns True should NOT be skipped")


class TestCreateIssueFromMatch(unittest.TestCase):
    """Test _create_issue_from_match method"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_create_issue_with_all_fields(self):
        """Test creating an issue with all fields populated"""
        match = {
            "text": "console.log('debug')",
            "range": {
                "start": {"line": 42, "column": 4}
            }
        }
        rule = {
            "id": "console-log",
            "severity": "warning",
            "category": "best_practice",
            "message": "console.log() statement found",
            "suggestion": "Remove debug logs"
        }
        file_path = Path("/test/file.ts")

        issue = self.analyzer._create_issue_from_match(match, rule, file_path)

        self.assertEqual(issue.severity, "warning")
        self.assertEqual(issue.category, "best_practice")
        self.assertEqual(issue.rule_id, "console-log")
        self.assertEqual(issue.message, "console.log() statement found")
        self.assertEqual(issue.file_path, "/test/file.ts")
        self.assertEqual(issue.line_number, 42)
        self.assertEqual(issue.code_snippet, "console.log('debug')")
        self.assertEqual(issue.suggestion, "Remove debug logs")

    def test_create_issue_without_suggestion(self):
        """Test creating an issue without suggestion"""
        match = {"text": "eval('code')", "range": {"start": {"line": 10}}}
        rule = {
            "id": "eval-usage",
            "severity": "error",
            "category": "security",
            "message": "eval() is dangerous"
        }
        file_path = Path("/test/file.js")

        issue = self.analyzer._create_issue_from_match(match, rule, file_path)

        self.assertIsNone(issue.suggestion)

    def test_create_issue_with_missing_range(self):
        """Test creating an issue with missing range info"""
        match = {"text": "print('hello')"}
        rule = {
            "id": "print-statement",
            "severity": "info",
            "category": "best_practice",
            "message": "Using print()"
        }
        file_path = Path("/test/file.py")

        issue = self.analyzer._create_issue_from_match(match, rule, file_path)

        self.assertEqual(issue.line_number, 0)

    def test_create_issue_truncates_long_snippet(self):
        """Test that code snippets are truncated to 100 chars"""
        long_code = "x = " + "a" * 200  # Over 100 chars
        match = {"text": long_code, "range": {"start": {"line": 1}}}
        rule = {
            "id": "test-rule",
            "severity": "info",
            "category": "code_smell",
            "message": "Test"
        }
        file_path = Path("/test/file.py")

        issue = self.analyzer._create_issue_from_match(match, rule, file_path)

        self.assertEqual(len(issue.code_snippet), 100)


class TestRecordIssue(unittest.TestCase):
    """Test _record_issue method"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_record_issue_increments_counters(self):
        """Test that recording an issue updates all counters"""
        issue = QualityIssue(
            severity="error",
            category="security",
            rule_id="test-rule",
            message="Test issue",
            file_path="/test/file.py",
            line_number=1
        )
        rule = {"severity": "error", "category": "security"}

        initial_total = self.analyzer.report.total_issues

        self.analyzer._record_issue(issue, rule)

        self.assertEqual(self.analyzer.report.total_issues, initial_total + 1)
        self.assertEqual(self.analyzer.report.issues_by_severity["error"], 1)
        self.assertEqual(self.analyzer.report.issues_by_category["security"], 1)
        self.assertIn(issue, self.analyzer.report.issues)

    def test_record_multiple_issues_with_same_severity(self):
        """Test recording multiple issues with the same severity"""
        for i in range(3):
            issue = QualityIssue(
                severity="warning",
                category="code_smell",
                rule_id=f"rule-{i}",
                message=f"Issue {i}",
                file_path="/test/file.py",
                line_number=i
            )
            rule = {"severity": "warning", "category": "code_smell"}
            self.analyzer._record_issue(issue, rule)

        self.assertEqual(self.analyzer.report.total_issues, 3)
        self.assertEqual(self.analyzer.report.issues_by_severity["warning"], 3)
        self.assertEqual(self.analyzer.report.issues_by_category["code_smell"], 3)

    def test_record_issues_with_different_categories(self):
        """Test recording issues with different categories"""
        categories = ["security", "code_smell", "documentation", "best_practice"]

        for cat in categories:
            issue = QualityIssue(
                severity="info",
                category=cat,
                rule_id=f"rule-{cat}",
                message=f"Issue in {cat}",
                file_path="/test/file.py",
                line_number=1
            )
            rule = {"severity": "info", "category": cat}
            self.analyzer._record_issue(issue, rule)

        self.assertEqual(self.analyzer.report.total_issues, 4)
        for cat in categories:
            self.assertEqual(self.analyzer.report.issues_by_category[cat], 1)


class TestReportGeneration(unittest.TestCase):
    """Test report generation methods"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_generate_report_header(self):
        """Test report header generation"""
        self.analyzer.report.total_files_scanned = 10
        self.analyzer.report.total_issues = 5

        header = self.analyzer._generate_report_header()

        self.assertIn("CODE QUALITY ANALYSIS REPORT", header)
        self.assertIn("Files Scanned: 10", '\n'.join(header))
        self.assertIn("Total Issues Found: 5", '\n'.join(header))

    def test_generate_severity_summary(self):
        """Test severity summary generation"""
        self.analyzer.report.issues_by_severity["error"] = 2
        self.analyzer.report.issues_by_severity["warning"] = 5
        self.analyzer.report.issues_by_severity["info"] = 3

        summary = self.analyzer._generate_severity_summary()
        summary_text = '\n'.join(summary)

        self.assertIn("ERROR: 2", summary_text)
        self.assertIn("WARNING: 5", summary_text)
        self.assertIn("INFO: 3", summary_text)

    def test_generate_severity_summary_skips_zero_counts(self):
        """Test severity summary skips severities with zero count"""
        self.analyzer.report.issues_by_severity["error"] = 0
        self.analyzer.report.issues_by_severity["warning"] = 3

        summary = self.analyzer._generate_severity_summary()
        summary_text = '\n'.join(summary)

        self.assertNotIn("ERROR: 0", summary_text)
        self.assertIn("WARNING: 3", summary_text)

    def test_generate_category_summary(self):
        """Test category summary generation"""
        self.analyzer.report.issues_by_category["code_smell"] = 4
        self.analyzer.report.issues_by_category["security"] = 2

        summary = self.analyzer._generate_category_summary()
        summary_text = '\n'.join(summary)

        self.assertIn("Code Smell: 4", summary_text)
        self.assertIn("Security: 2", summary_text)

    def test_generate_severity_section_empty(self):
        """Test severity section generation when no issues"""
        section = self.analyzer._generate_severity_section("error")

        self.assertEqual(section, [])

    def test_generate_severity_section_with_issues(self):
        """Test severity section generation with issues"""
        issue = QualityIssue(
            severity="error",
            category="security",
            rule_id="test-rule",
            message="Security vulnerability",
            file_path="/test/file.py",
            line_number=10,
            code_snippet="dangerous_code()",
            suggestion="Fix the issue"
        )
        self.analyzer.report.issues.append(issue)

        section = self.analyzer._generate_severity_section("error")
        section_text = '\n'.join(section)

        self.assertIn("ERROR Issues", section_text)
        self.assertIn("/test/file.py", section_text)
        self.assertIn("Line 10", section_text)
        self.assertIn("[test-rule]", section_text)
        self.assertIn("dangerous_code()", section_text)
        self.assertIn("Fix the issue", section_text)

    def test_generate_file_issues(self):
        """Test file issues generation"""
        issues = [
            QualityIssue("warning", "code_smell", "rule-1", "Issue 1", "/test/file.py", 5),
            QualityIssue("warning", "code_smell", "rule-2", "Issue 2", "/test/file.py", 10),
        ]

        file_issues = self.analyzer._generate_file_issues("/test/file.py", issues)
        file_text = '\n'.join(file_issues)

        self.assertIn("/test/file.py", file_text)
        self.assertIn("Line 5", file_text)
        self.assertIn("Line 10", file_text)

    def test_generate_report_footer(self):
        """Test report footer generation"""
        footer = self.analyzer._generate_report_footer()
        footer_text = '\n'.join(footer)

        self.assertIn("END OF REPORT", footer_text)

    def test_build_report_data(self):
        """Test building report data for JSON export"""
        self.analyzer.report.total_files_scanned = 15
        self.analyzer.report.total_issues = 3
        issue = QualityIssue("error", "security", "test-rule", "Test", "/test.py", 1)
        self.analyzer.report.issues.append(issue)

        data = self.analyzer._build_report_data()

        self.assertIn("summary", data)
        self.assertIn("issues", data)
        self.assertEqual(data["summary"]["total_files_scanned"], 15)
        self.assertEqual(len(data["issues"]), 1)

    def test_build_summary_data(self):
        """Test building summary data"""
        self.analyzer.report.total_files_scanned = 20
        self.analyzer.report.total_issues = 8
        self.analyzer.report.issues_by_severity["warning"] = 5
        self.analyzer.report.issues_by_category["code_smell"] = 3

        summary = self.analyzer._build_summary_data()

        self.assertEqual(summary["total_files_scanned"], 20)
        self.assertEqual(summary["total_issues"], 8)
        self.assertEqual(summary["issues_by_severity"]["warning"], 5)
        self.assertEqual(summary["issues_by_category"]["code_smell"], 3)

    def test_issue_to_dict(self):
        """Test converting QualityIssue to dictionary"""
        issue = QualityIssue(
            severity="error",
            category="security",
            rule_id="hardcoded-password",
            message="Hardcoded credential found",
            file_path="/test/auth.py",
            line_number=42,
            code_snippet="password = 'secret'",
            suggestion="Use environment variables"
        )

        result = self.analyzer._issue_to_dict(issue)

        self.assertEqual(result["severity"], "error")
        self.assertEqual(result["category"], "security")
        self.assertEqual(result["rule_id"], "hardcoded-password")
        self.assertEqual(result["message"], "Hardcoded credential found")
        self.assertEqual(result["file_path"], "/test/auth.py")
        self.assertEqual(result["line_number"], 42)
        self.assertEqual(result["code_snippet"], "password = 'secret'")
        self.assertEqual(result["suggestion"], "Use environment variables")


class TestRuleCreation(unittest.TestCase):
    """Test rule creation methods"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_create_long_function_rule(self):
        """Test long function rule creation"""
        rule = self.analyzer._create_long_function_rule()

        self.assertEqual(rule['id'], 'long-function')
        self.assertEqual(rule['severity'], 'warning')
        self.assertEqual(rule['category'], 'code_smell')
        self.assertIn('pattern', rule)
        self.assertIn('suggestion', rule)

    def test_create_missing_docstring_rule(self):
        """Test missing docstring rule creation"""
        rule = self.analyzer._create_missing_docstring_rule()

        self.assertEqual(rule['id'], 'missing-docstring')
        self.assertEqual(rule['severity'], 'info')
        self.assertEqual(rule['category'], 'documentation')
        self.assertIn('check', rule)
        self.assertTrue(callable(rule['check']))

    def test_create_bare_except_rule(self):
        """Test bare except rule creation"""
        rule = self.analyzer._create_bare_except_rule()

        self.assertEqual(rule['id'], 'bare-except')
        self.assertEqual(rule['severity'], 'warning')
        self.assertEqual(rule['category'], 'best_practice')

    def test_create_print_statement_rule(self):
        """Test print statement rule creation"""
        rule = self.analyzer._create_print_statement_rule()

        self.assertEqual(rule['id'], 'print-statement')
        self.assertEqual(rule['severity'], 'info')
        self.assertEqual(rule['category'], 'best_practice')

    def test_create_hardcoded_password_rule(self):
        """Test hardcoded password rule creation"""
        rule = self.analyzer._create_hardcoded_password_rule()

        self.assertEqual(rule['id'], 'hardcoded-password')
        self.assertEqual(rule['severity'], 'error')
        self.assertEqual(rule['category'], 'security')
        self.assertIn('check', rule)

    def test_create_many_parameters_rule(self):
        """Test many parameters rule creation"""
        rule = self.analyzer._create_many_parameters_rule()

        self.assertEqual(rule['id'], 'many-parameters')
        self.assertEqual(rule['severity'], 'warning')
        self.assertEqual(rule['category'], 'code_smell')

    def test_create_todo_comment_rule(self):
        """Test TODO comment rule creation"""
        rule = self.analyzer._create_todo_comment_rule()

        self.assertEqual(rule['id'], 'todo-comment')
        self.assertEqual(rule['severity'], 'info')
        self.assertEqual(rule['category'], 'documentation')

    def test_create_console_log_rule(self):
        """Test console.log rule creation"""
        rule = self.analyzer._create_console_log_rule()

        self.assertEqual(rule['id'], 'console-log')
        self.assertEqual(rule['severity'], 'warning')
        self.assertEqual(rule['category'], 'best_practice')

    def test_create_any_type_rule(self):
        """Test any type rule creation"""
        rule = self.analyzer._create_any_type_rule()

        self.assertEqual(rule['id'], 'any-type')
        self.assertEqual(rule['severity'], 'warning')
        self.assertEqual(rule['category'], 'best_practice')

    def test_create_no_async_await_rule(self):
        """Test no async await rule creation"""
        rule = self.analyzer._create_no_async_await_rule()

        self.assertEqual(rule['id'], 'no-async-await')
        self.assertEqual(rule['severity'], 'info')
        self.assertEqual(rule['category'], 'best_practice')

    def test_create_eval_usage_rule(self):
        """Test eval usage rule creation"""
        rule = self.analyzer._create_eval_usage_rule()

        self.assertEqual(rule['id'], 'eval-usage')
        self.assertEqual(rule['severity'], 'error')
        self.assertEqual(rule['category'], 'security')

    def test_create_empty_catch_rule(self):
        """Test empty catch rule creation"""
        rule = self.analyzer._create_empty_catch_rule()

        self.assertEqual(rule['id'], 'empty-catch')
        self.assertEqual(rule['severity'], 'warning')
        self.assertEqual(rule['category'], 'best_practice')

    def test_create_no_return_type_rule(self):
        """Test no return type rule creation"""
        rule = self.analyzer._create_no_return_type_rule()

        self.assertEqual(rule['id'], 'no-explicit-return-type')
        self.assertEqual(rule['severity'], 'info')
        self.assertEqual(rule['category'], 'best_practice')


class TestExtractStringValue(unittest.TestCase):
    """Test _extract_string_value helper method"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_extract_double_quoted_value(self):
        """Test extracting double-quoted string value"""
        code = 'password = "secret123"'
        result = self.analyzer._extract_string_value(code)

        self.assertEqual(result, "secret123")

    def test_extract_single_quoted_value(self):
        """Test extracting single-quoted string value"""
        code = "api_key = 'abc123'"
        result = self.analyzer._extract_string_value(code)

        self.assertEqual(result, "abc123")

    def test_extract_value_with_spaces(self):
        """Test extracting value with spaces around equals"""
        code = "token  =   \"my_token\""
        result = self.analyzer._extract_string_value(code)

        self.assertEqual(result, "my_token")

    def test_no_string_value_returns_none(self):
        """Test that code without string value returns None"""
        code = "count = 42"
        result = self.analyzer._extract_string_value(code)

        self.assertIsNone(result)


class TestAnalyzeDirectorySkipPatterns(unittest.TestCase):
    """Test directory analysis with various skip patterns"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_skip_venv_directory(self):
        """Test that venv directories are skipped"""
        venv_dir = Path(self.temp_dir) / ".venv"
        venv_dir.mkdir()
        (venv_dir / "test.py").write_text("print('in venv')")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        scanned = [issue.file_path for issue in self.analyzer.report.issues]
        self.assertFalse(any('.venv' in f for f in scanned))

    def test_skip_pycache_directory(self):
        """Test that __pycache__ directories are skipped"""
        pycache_dir = Path(self.temp_dir) / "__pycache__"
        pycache_dir.mkdir()
        (pycache_dir / "module.py").write_text("print('cached')")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        scanned = [issue.file_path for issue in self.analyzer.report.issues]
        self.assertFalse(any('__pycache__' in f for f in scanned))

    def test_skip_dist_directory(self):
        """Test that dist directories are skipped"""
        dist_dir = Path(self.temp_dir) / "dist"
        dist_dir.mkdir()
        (dist_dir / "bundle.js").write_text("console.log('bundled')")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        scanned = [issue.file_path for issue in self.analyzer.report.issues]
        self.assertFalse(any('dist' in f for f in scanned))

    def test_skip_site_packages_pattern(self):
        """Test that site-packages paths are skipped"""
        site_pkg = Path(self.temp_dir) / "lib" / "site-packages"
        site_pkg.mkdir(parents=True)
        (site_pkg / "package.py").write_text("print('package')")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        scanned = [issue.file_path for issue in self.analyzer.report.issues]
        self.assertFalse(any('site-packages' in f for f in scanned))

    def test_skip_hidden_directories(self):
        """Test that hidden directories (starting with .) are skipped"""
        hidden_dir = Path(self.temp_dir) / ".hidden"
        hidden_dir.mkdir()
        (hidden_dir / "secret.py").write_text("print('hidden')")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        scanned = [issue.file_path for issue in self.analyzer.report.issues]
        self.assertFalse(any('.hidden' in f for f in scanned))

    def test_custom_skip_dirs(self):
        """Test providing custom skip directories"""
        custom_dir = Path(self.temp_dir) / "custom_skip"
        custom_dir.mkdir()
        (custom_dir / "file.py").write_text("print('should skip')")

        normal_dir = Path(self.temp_dir) / "src"
        normal_dir.mkdir()
        (normal_dir / "main.py").write_text("print('should scan')")

        self.analyzer.analyze_directory(
            Path(self.temp_dir),
            skip_dirs={"custom_skip"}
        )

        # The normal dir should be scanned
        self.assertGreaterEqual(self.analyzer.report.total_files_scanned, 1)


class TestCredentialDetectionEdgeCases(unittest.TestCase):
    """Test edge cases for hardcoded credential detection"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = CodeQualityAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_no_credential_keyword_returns_false(self):
        """Test that code without credential keywords returns False"""
        code = 'name = "John"'
        result = self.analyzer._is_likely_hardcoded_credential(code)

        self.assertFalse(result)

    def test_schema_patterns_excluded(self):
        """Test that schema/typedef patterns are excluded"""
        test_cases = [
            'schema = {"password": string}',
            'type = "password_field"',
            'interface TokenConfig {}',
            'class SecretManager:',
            'enum PasswordStrength {',
        ]
        for code in test_cases:
            result = self.analyzer._is_likely_hardcoded_credential(code)
            self.assertFalse(result, f"Schema pattern should not be flagged: {code}")

    def test_documentation_strings_excluded(self):
        """Test that documentation strings are excluded"""
        test_cases = [
            '"""Set the password field"""',
            "'''Token configuration'''",
            '// Set the api_key here',
            '* @param token The auth token',
        ]
        for code in test_cases:
            result = self.analyzer._is_likely_hardcoded_credential(code)
            self.assertFalse(result, f"Documentation should not be flagged: {code}")

    def test_environ_get_excluded(self):
        """Test that environ.get patterns are excluded"""
        code = 'secret = os.environ.get("MY_SECRET")'
        result = self.analyzer._is_likely_hardcoded_credential(code)

        self.assertFalse(result)

    def test_env_bracket_access_excluded(self):
        """Test that env[key] access is excluded"""
        code = 'token = env["AUTH_TOKEN"]'
        result = self.analyzer._is_likely_hardcoded_credential(code)

        self.assertFalse(result)

    def test_example_placeholder_values_excluded(self):
        """Test that example/placeholder values are excluded"""
        code = 'password = "example_password"'
        result = self.analyzer._is_likely_hardcoded_credential(code)

        self.assertFalse(result)

    def test_wrong_placeholder_values_excluded(self):
        """Test that 'wrong' placeholder values are excluded"""
        code = 'password = "wrong_password"'
        result = self.analyzer._is_likely_hardcoded_credential(code)

        self.assertFalse(result)


class TestQualityIssueDefaults(unittest.TestCase):
    """Test QualityIssue default values"""

    def test_optional_fields_default_to_none(self):
        """Test that optional fields default to None"""
        issue = QualityIssue(
            severity="warning",
            category="code_smell",
            rule_id="test-rule",
            message="Test message",
            file_path="/test/file.py",
            line_number=1
        )

        self.assertIsNone(issue.code_snippet)
        self.assertIsNone(issue.suggestion)


class TestQualityReportDefaults(unittest.TestCase):
    """Test QualityReport default values"""

    def test_default_values(self):
        """Test that default values are properly initialized"""
        report = QualityReport()

        self.assertEqual(report.total_files_scanned, 0)
        self.assertEqual(report.total_issues, 0)
        self.assertEqual(len(report.issues), 0)
        # defaultdict should return 0 for missing keys
        self.assertEqual(report.issues_by_severity["nonexistent"], 0)
        self.assertEqual(report.issues_by_category["nonexistent"], 0)


if __name__ == '__main__':
    unittest.main()
