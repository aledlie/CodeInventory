#!/usr/bin/env python3
"""
Code Quality Analyzer - Uses ast-grep to find code smells, security issues, and best practice violations
"""

import argparse
import json
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

@dataclass
class QualityIssue:
    """Represents a code quality issue"""
    severity: str  # 'error', 'warning', 'info'
    category: str  # 'code_smell', 'security', 'documentation', 'best_practice'
    rule_id: str
    message: str
    file_path: str
    line_number: int
    code_snippet: Optional[str] = None
    suggestion: Optional[str] = None

@dataclass
class QualityReport:
    """Complete quality analysis report"""
    total_files_scanned: int = 0
    total_issues: int = 0
    issues_by_severity: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    issues_by_category: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    issues: List[QualityIssue] = field(default_factory=list)

class CodeQualityAnalyzer:
    """Analyzes code quality using ast-grep patterns"""

    def __init__(self, root_path: Path):
        """Initialize the code quality analyzer.

        Args:
            root_path: Root directory of the codebase to analyze
        """
        self.root_path = root_path
        self.report = QualityReport()

        # Define quality rules
        self.python_rules = self._get_python_rules()
        self.typescript_rules = self._get_typescript_rules()

    def _get_python_rules(self) -> List[Dict[str, Any]]:
        """Define Python quality rules"""
        return [
            self._create_long_function_rule(),
            self._create_missing_docstring_rule(),
            self._create_bare_except_rule(),
            self._create_print_statement_rule(),
            self._create_hardcoded_password_rule(),
            self._create_many_parameters_rule(),
            self._create_todo_comment_rule()
        ]

    def _create_long_function_rule(self) -> Dict[str, Any]:
        """Create rule for detecting long functions"""
        return {
            'id': 'long-function',
            'pattern': 'def $NAME($$$):\n  $$$',
            'severity': 'warning',
            'category': 'code_smell',
            'message': 'Function may be too long (consider breaking down)',
            'suggestion': 'Break down into smaller, focused functions'
        }

    def _create_missing_docstring_rule(self) -> Dict[str, Any]:
        """Create rule for detecting missing docstrings"""
        return {
            'id': 'missing-docstring',
            'pattern': 'def $NAME($$$):\n  $BODY',
            'severity': 'info',
            'category': 'documentation',
            'message': 'Function missing docstring',
            'suggestion': 'Add docstring describing purpose, args, and return value',
            'check': self._has_no_docstring
        }

    def _has_no_docstring(self, code: str) -> bool:
        """Check if code snippet lacks a docstring.

        Returns True if the function is MISSING a docstring (should be flagged).
        Returns False if the function HAS a docstring (should be skipped).
        """
        # Look for docstring patterns following the function definition
        # Docstrings can be on the same line or next line after the colon
        import re

        # Match the function body after the def line
        # Look for triple quotes at the start of the body
        body_match = re.search(r':\s*\n?\s*("""|\'\'\')' , code)
        if body_match:
            return False  # Has docstring, skip this match

        # Also check for single-line docstrings like: def foo(): """doc"""
        inline_docstring = re.search(r':\s*("""|\'\'\')' , code)
        if inline_docstring:
            return False  # Has inline docstring, skip

        return True  # No docstring found, flag this

    def _create_bare_except_rule(self) -> Dict[str, Any]:
        """Create rule for detecting bare except clauses"""
        return {
            'id': 'bare-except',
            'pattern': 'try:\n  $$$\nexcept:\n  $$$',
            'severity': 'warning',
            'category': 'best_practice',
            'message': 'Bare except clause catches all exceptions',
            'suggestion': 'Specify exception types or use "except Exception:"'
        }

    def _create_print_statement_rule(self) -> Dict[str, Any]:
        """Create rule for detecting print statements"""
        return {
            'id': 'print-statement',
            'pattern': 'print($$$)',
            'severity': 'info',
            'category': 'best_practice',
            'message': 'Using print() instead of logging',
            'suggestion': 'Consider using logging module for better control'
        }

    def _create_hardcoded_password_rule(self) -> Dict[str, Any]:
        """Create rule for detecting hardcoded credentials"""
        return {
            'id': 'hardcoded-password',
            'pattern': '$VAR = "$PASSWORD"',
            'severity': 'error',
            'category': 'security',
            'message': 'Potential hardcoded credential',
            'suggestion': 'Use environment variables or secure credential storage',
            'check': self._is_likely_hardcoded_credential
        }

    def _is_likely_hardcoded_credential(self, code: str) -> bool:
        """
        Check if code snippet is likely a hardcoded credential.
        Returns False for common false positive patterns.
        """
        code_lower = code.lower()

        # Must contain a credential-related keyword
        credential_keywords = ['password', 'secret', 'api_key', 'apikey', 'token', 'credential']
        if not any(word in code_lower for word in credential_keywords):
            return False

        # ===== FALSE POSITIVE EXCLUSIONS =====

        # 1. Enum values (e.g., TOKEN_USAGE = "token_usage")
        # Pattern: VAR_NAME = "var_name" where both contain the keyword
        if self._is_enum_style_assignment(code):
            return False

        # 2. Environment variable references
        env_patterns = [
            'process.env',
            'os.getenv',
            'os.environ',
            'env[',
            'getenv(',
            'environ.get',
        ]
        if any(pattern in code for pattern in env_patterns):
            return False

        # 3. Configuration key names (not actual values)
        # e.g., PASSWORD_KEY = "password_key", SECRET_NAME = "my_secret"
        config_key_patterns = [
            '_key"',
            '_name"',
            '_field"',
            '_column"',
            '_type"',
            '_usage"',
            '_event"',
        ]
        if any(pattern in code_lower for pattern in config_key_patterns):
            return False

        # 4. Test file patterns (fake credentials in tests are expected)
        test_patterns = [
            'fake',
            'mock',
            'test',
            'dummy',
            'example',
            'invalid',
            'wrong',
            'placeholder',
        ]
        # Only exclude if it looks like a test value
        value_match = self._extract_string_value(code)
        if value_match and any(pattern in value_match.lower() for pattern in test_patterns):
            return False

        # 5. URL patterns (oauth URLs, token endpoints are not credentials)
        url_patterns = [
            'http://',
            'https://',
            '/oauth/',
            '/token',
            '/auth/',
        ]
        if any(pattern in code_lower for pattern in url_patterns):
            return False

        # 6. Schema/type definitions (not actual values)
        schema_patterns = [
            'schema',
            'typedef',
            'interface',
            'type =',
            'enum',
            'class ',
        ]
        if any(pattern in code_lower for pattern in schema_patterns):
            return False

        # 7. Constants that are clearly labels/identifiers, not secrets
        # Pattern: ALL_CAPS = "matching_value"
        if self._is_constant_label(code):
            return False

        # 8. Documentation strings
        if '"""' in code or "'''" in code or '* @' in code or '// ' in code:
            return False

        # If we get here, it's likely a real hardcoded credential
        return True

    def _is_enum_style_assignment(self, code: str) -> bool:
        """Check if code looks like an enum assignment (VAR = 'var' or VAR = 'different_but_descriptive')"""
        import re
        # Match patterns like: TOKEN_USAGE = "token_usage" or PASSWORD = "password"
        match = re.search(r'(\w+)\s*=\s*["\']([^"\']+)["\']', code)
        if match:
            var_name = match.group(1).lower().replace('_', '')
            value = match.group(2).lower().replace('_', '')
            # If variable name and value are very similar, it's likely an enum
            if var_name == value or var_name in value or value in var_name:
                return True
        return False

    def _is_constant_label(self, code: str) -> bool:
        """Check if this is a constant label definition, not a secret"""
        import re
        # Match CONSTANT_NAME = "value" patterns
        match = re.search(r'^([A-Z][A-Z0-9_]+)\s*=\s*["\']([^"\']+)["\']', code.strip())
        if match:
            const_name = match.group(1)
            value = match.group(2)
            # If the constant name describes what it IS (not what it HOLDS), it's likely a label
            # e.g., TOKEN_USAGE = "token_usage" vs API_KEY = "sk-abc123..."
            descriptive_suffixes = ['_USAGE', '_TYPE', '_NAME', '_EVENT', '_ACTION', '_STATUS', '_STATE']
            if any(const_name.endswith(suffix) for suffix in descriptive_suffixes):
                return True
        return False

    def _extract_string_value(self, code: str) -> Optional[str]:
        """Extract the string value from an assignment"""
        import re
        match = re.search(r'=\s*["\']([^"\']+)["\']', code)
        return match.group(1) if match else None

    def _create_many_parameters_rule(self) -> Dict[str, Any]:
        """Create rule for detecting functions with too many parameters"""
        return {
            'id': 'many-parameters',
            'pattern': 'def $NAME($P1, $P2, $P3, $P4, $P5, $P6, $$$):',
            'severity': 'warning',
            'category': 'code_smell',
            'message': 'Function has too many parameters (6+)',
            'suggestion': 'Consider using a config object or dataclass'
        }

    def _create_todo_comment_rule(self) -> Dict[str, Any]:
        """Create rule for detecting TODO comments"""
        return {
            'id': 'todo-comment',
            'pattern': '# TODO',
            'severity': 'info',
            'category': 'documentation',
            'message': 'TODO comment found',
            'suggestion': 'Create a tracking issue for this TODO'
        }

    def _get_typescript_rules(self) -> List[Dict[str, Any]]:
        """Define TypeScript/JavaScript quality rules"""
        return [
            self._create_console_log_rule(),
            self._create_any_type_rule(),
            self._create_no_async_await_rule(),
            self._create_eval_usage_rule(),
            self._create_empty_catch_rule(),
            self._create_no_return_type_rule()
        ]

    def _create_console_log_rule(self) -> Dict[str, Any]:
        """Create rule for detecting console.log statements"""
        return {
            'id': 'console-log',
            'pattern': 'console.log($$$)',
            'severity': 'warning',
            'category': 'best_practice',
            'message': 'console.log() statement found',
            'suggestion': 'Remove debug logs or use proper logging library'
        }

    def _create_any_type_rule(self) -> Dict[str, Any]:
        """Create rule for detecting 'any' type usage"""
        return {
            'id': 'any-type',
            'pattern': '$VAR: any',
            'severity': 'warning',
            'category': 'best_practice',
            'message': 'Using "any" type defeats TypeScript type checking',
            'suggestion': 'Define proper type or use unknown with type guards'
        }

    def _create_no_async_await_rule(self) -> Dict[str, Any]:
        """Create rule for detecting async functions without await"""
        return {
            'id': 'no-async-await',
            'pattern': 'async function $NAME($$$) { $$$ }',
            'severity': 'info',
            'category': 'best_practice',
            'message': 'Async function should use await or return Promise',
            'suggestion': 'Ensure async functions actually use await'
        }

    def _create_eval_usage_rule(self) -> Dict[str, Any]:
        """Create rule for detecting eval() usage"""
        return {
            'id': 'eval-usage',
            'pattern': 'eval($$$)',
            'severity': 'error',
            'category': 'security',
            'message': 'eval() is dangerous and should be avoided',
            'suggestion': 'Find alternative approach without eval()'
        }

    def _create_empty_catch_rule(self) -> Dict[str, Any]:
        """Create rule for detecting empty catch blocks"""
        return {
            'id': 'empty-catch',
            'pattern': 'catch ($E) {}',
            'severity': 'warning',
            'category': 'best_practice',
            'message': 'Empty catch block silently swallows errors',
            'suggestion': 'At minimum, log the error'
        }

    def _create_no_return_type_rule(self) -> Dict[str, Any]:
        """Create rule for detecting missing return types"""
        return {
            'id': 'no-explicit-return-type',
            'pattern': 'function $NAME($$$) {',
            'severity': 'info',
            'category': 'best_practice',
            'message': 'Function missing explicit return type',
            'suggestion': 'Add return type annotation for better type safety'
        }

    def _run_astgrep_rule(self, file_path: Path, pattern: str, language: str) -> List[Dict[str, Any]]:
        """Run ast-grep pattern against a file"""
        try:
            result = subprocess.run(
                ['ast-grep', 'run', '-p', pattern, '--lang', language, '--json', str(file_path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout.strip():
                parsed: List[Dict[str, Any]] = json.loads(result.stdout)
                return parsed
            return []
        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
            return []

    def analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for quality issues"""
        language, rules = self._get_language_and_rules(file_path)
        if not language or not rules:
            return

        self.report.total_files_scanned += 1

        for rule in rules:
            self._process_rule_matches(file_path, rule, language)

    def _get_language_and_rules(self, file_path: Path) -> Tuple[Optional[str], Optional[List[Dict[str, Any]]]]:
        """Determine language and applicable rules for a file"""
        if file_path.suffix == '.py':
            return 'python', self.python_rules
        elif file_path.suffix in ['.ts', '.tsx']:
            return 'typescript', self.typescript_rules
        elif file_path.suffix in ['.js', '.jsx']:
            return 'javascript', self.typescript_rules
        return None, None

    def _process_rule_matches(self, file_path: Path, rule: Dict[str, Any], language: str) -> None:
        """Process matches for a single rule"""
        matches = self._run_astgrep_rule(file_path, rule['pattern'], language)

        for match in matches:
            if self._should_skip_match(match, rule, file_path):
                continue

            issue = self._create_issue_from_match(match, rule, file_path)
            self._record_issue(issue, rule)

    def _should_skip_match(self, match: Dict[str, Any], rule: Dict[str, Any],
                           file_path: Optional[Path] = None) -> bool:
        """Check if a match should be skipped based on additional checks"""
        # Skip security checks in test files (test credentials are expected)
        if rule.get('category') == 'security' and file_path:
            if self._is_test_or_example_file(file_path):
                return True

        if 'check' not in rule:
            return False

        code_text = match.get('text', '')
        return not rule['check'](code_text)

    def _is_test_or_example_file(self, file_path: Path) -> bool:
        """Check if file is a test, example, or fixture file"""
        path_str = str(file_path).lower()

        # Test directories and files
        test_patterns = [
            '/tests/',
            '/test/',
            '/__tests__/',
            '/spec/',
            '/fixtures/',
            '/examples/',
            '/example/',
            '/mocks/',
            '/mock/',
            '.test.',
            '.spec.',
            '_test.',
            '_spec.',
            'test_',
            'spec_',
        ]

        return any(pattern in path_str for pattern in test_patterns)

    def _create_issue_from_match(self, match: Dict[str, Any], rule: Dict[str, Any],
                                 file_path: Path) -> QualityIssue:
        """Create a QualityIssue from a match"""
        line_num = match.get('range', {}).get('start', {}).get('line', 0)
        code_snippet = match.get('text', '')[:100]  # First 100 chars

        return QualityIssue(
            severity=rule['severity'],
            category=rule['category'],
            rule_id=rule['id'],
            message=rule['message'],
            file_path=str(file_path),
            line_number=line_num,
            code_snippet=code_snippet,
            suggestion=rule.get('suggestion')
        )

    def _record_issue(self, issue: QualityIssue, rule: Dict[str, Any]) -> None:
        """Record an issue in the report"""
        self.report.issues.append(issue)
        self.report.total_issues += 1
        self.report.issues_by_severity[rule['severity']] += 1
        self.report.issues_by_category[rule['category']] += 1

    def analyze_directory(self, directory: Path, skip_dirs: Optional[Set[str]] = None) -> None:
        """Analyze all files in a directory recursively"""
        if skip_dirs is None:
            skip_dirs = {
                # Version control
                '.git',
                # Package managers / dependencies
                'node_modules', '__pycache__', '.next', 'dist', 'build',
                # Virtual environments
                '.venv', 'venv', 'env', 'virtualenv',
                # Build outputs
                '_site', '.cache', 'coverage', 'htmlcov',
                # Third-party code directories
                'vendor', 'third_party', 'third-party', 'external',
                # Ruby gems (common false positive source)
                'gems', 'ruby', 'bundler',
                # Python site-packages
                'site-packages', 'lib', 'lib64',
                # IDE directories
                '.idea', '.vscode',
            }

        # Additional path patterns to skip (partial matches)
        skip_path_patterns = [
            '/site-packages/',
            '/gems/',
            '/vendor/',
            '/third_party/',
            '/external/',
            '/lib/ruby/',
            '/code-env/',
        ]

        for root, dirs, files in os.walk(directory):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            # Skip if path matches any skip pattern
            if any(pattern in root for pattern in skip_path_patterns):
                continue

            for file_name in files:
                file_path = Path(root) / file_name
                if file_path.suffix in ['.py', '.ts', '.tsx', '.js', '.jsx']:
                    self.analyze_file(file_path)

    def generate_report_text(self) -> str:
        """Generate human-readable report"""
        lines = []
        lines.extend(self._generate_report_header())
        lines.extend(self._generate_severity_summary())
        lines.extend(self._generate_category_summary())
        lines.extend(self._generate_detailed_issues())
        lines.extend(self._generate_report_footer())
        return '\n'.join(lines)

    def _generate_report_header(self) -> List[str]:
        """Generate report header section"""
        return [
            "="*80,
            "CODE QUALITY ANALYSIS REPORT",
            "="*80,
            "",
            f"Files Scanned: {self.report.total_files_scanned}",
            f"Total Issues Found: {self.report.total_issues}",
            ""
        ]

    def _generate_severity_summary(self) -> List[str]:
        """Generate severity summary section"""
        lines = ["Issues by Severity:"]
        for severity in ['error', 'warning', 'info']:
            count = self.report.issues_by_severity.get(severity, 0)
            if count > 0:
                lines.append(f"  {severity.upper()}: {count}")
        lines.append("")
        return lines

    def _generate_category_summary(self) -> List[str]:
        """Generate category summary section"""
        lines = ["Issues by Category:"]
        for category, count in sorted(self.report.issues_by_category.items()):
            lines.append(f"  {category.replace('_', ' ').title()}: {count}")
        lines.append("")
        return lines

    def _generate_detailed_issues(self) -> List[str]:
        """Generate detailed issues section grouped by severity"""
        lines = []
        for severity in ['error', 'warning', 'info']:
            severity_lines = self._generate_severity_section(severity)
            lines.extend(severity_lines)
        return lines

    def _generate_severity_section(self, severity: str) -> List[str]:
        """Generate issues for a specific severity level"""
        severity_issues = [i for i in self.report.issues if i.severity == severity]

        if not severity_issues:
            return []

        lines = [
            "="*80,
            f"{severity.upper()} Issues ({len(severity_issues)})",
            "="*80,
            ""
        ]

        # Group by file
        by_file = defaultdict(list)
        for issue in severity_issues:
            by_file[issue.file_path].append(issue)

        for file_path, issues in sorted(by_file.items()):
            lines.extend(self._generate_file_issues(file_path, issues))

        return lines

    def _generate_file_issues(self, file_path: str, issues: List[QualityIssue]) -> List[str]:
        """Generate issues for a specific file"""
        lines = [
            f"📄 {file_path}",
            "-"*80
        ]

        for issue in sorted(issues, key=lambda x: x.line_number):
            lines.append(f"  Line {issue.line_number}: [{issue.rule_id}] {issue.message}")
            if issue.code_snippet:
                lines.append(f"    Code: {issue.code_snippet}")
            if issue.suggestion:
                lines.append(f"    💡 {issue.suggestion}")
            lines.append("")

        return lines

    def _generate_report_footer(self) -> List[str]:
        """Generate report footer section"""
        return [
            "="*80,
            "END OF REPORT",
            "="*80
        ]

    def save_report_json(self, output_path: Path) -> None:
        """Save report as JSON"""
        data = self._build_report_data()
        self._write_json_file(output_path, data)
        logger.info(f"✅ Quality report saved to {output_path}")

    def _build_report_data(self) -> Dict[str, Any]:
        """Build report data structure for JSON export"""
        return {
            'summary': self._build_summary_data(),
            'issues': self._build_issues_data()
        }

    def _build_summary_data(self) -> Dict[str, Any]:
        """Build summary section of report data"""
        return {
            'total_files_scanned': self.report.total_files_scanned,
            'total_issues': self.report.total_issues,
            'issues_by_severity': dict(self.report.issues_by_severity),
            'issues_by_category': dict(self.report.issues_by_category)
        }

    def _build_issues_data(self) -> List[Dict[str, Any]]:
        """Build issues list for report data"""
        return [self._issue_to_dict(issue) for issue in self.report.issues]

    def _issue_to_dict(self, issue: QualityIssue) -> Dict[str, Any]:
        """Convert a QualityIssue to a dictionary"""
        return {
            'severity': issue.severity,
            'category': issue.category,
            'rule_id': issue.rule_id,
            'message': issue.message,
            'file_path': issue.file_path,
            'line_number': issue.line_number,
            'code_snippet': issue.code_snippet,
            'suggestion': issue.suggestion
        }

    def _write_json_file(self, path: Path, data: Dict[str, Any]) -> None:
        """Write data to JSON file"""
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)

def main() -> None:
    args = _parse_arguments()
    _run_analysis(args)

def _parse_arguments() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Code Quality Analyzer')
    parser.add_argument('path', help='File or directory to analyze')
    parser.add_argument('--json', help='Output JSON report to file')
    parser.add_argument('--text', help='Output text report to file')
    return parser.parse_args()

def _run_analysis(args: argparse.Namespace) -> None:
    """Run the code quality analysis"""
    path = Path(args.path)
    analyzer = _initialize_analyzer(path)

    _print_header(path)

    if not _analyze_path(analyzer, path):
        return

    _generate_and_save_reports(analyzer, args)

def _initialize_analyzer(path: Path) -> 'CodeQualityAnalyzer':
    """Initialize the analyzer"""
    return CodeQualityAnalyzer(path)

def _print_header(path: Path) -> None:
    """Print analysis header"""
    logger.info(f"\n{'='*80}")
    logger.info("Code Quality Analyzer")
    logger.info(f"{'='*80}\n")
    logger.info(f"Analyzing: {path}\n")

def _analyze_path(analyzer: 'CodeQualityAnalyzer', path: Path) -> bool:
    """Analyze the given path"""
    if path.is_file():
        analyzer.analyze_file(path)
        return True
    elif path.is_dir():
        analyzer.analyze_directory(path)
        return True
    else:
        logger.error(f"Error: {path} is not a valid file or directory")
        return False

def _generate_and_save_reports(analyzer: 'CodeQualityAnalyzer', args: argparse.Namespace) -> None:
    """Generate and save reports"""
    text_report = analyzer.generate_report_text()
    logger.info(text_report)

    if args.json:
        analyzer.save_report_json(Path(args.json))

    if args.text:
        _save_text_report(args.text, text_report)

def _save_text_report(filepath: str, content: str) -> None:
    """Save text report to file"""
    with open(filepath, 'w') as f:
        f.write(content)
    logger.info(f"\n✅ Text report saved to {filepath}")

if __name__ == '__main__':
    main()
