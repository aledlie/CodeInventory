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


if __name__ == '__main__':
    unittest.main()
