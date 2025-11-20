#!/usr/bin/env python3
"""
Code Quality Analyzer - Uses ast-grep to find code smells, security issues, and best practice violations
"""

import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict

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
            'suggestion': 'Add docstring describing purpose, args, and return value'
        }

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
            'check': lambda code: any(word in code.lower()
                                    for word in ['password', 'secret', 'api_key', 'token'])
        }

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
                return json.loads(result.stdout)
            return []
        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
            return []

    def analyze_file(self, file_path: Path):
        """Analyze a single file for quality issues"""
        language, rules = self._get_language_and_rules(file_path)
        if not language:
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

    def _process_rule_matches(self, file_path: Path, rule: Dict[str, Any], language: str):
        """Process matches for a single rule"""
        matches = self._run_astgrep_rule(file_path, rule['pattern'], language)

        for match in matches:
            if self._should_skip_match(match, rule):
                continue

            issue = self._create_issue_from_match(match, rule, file_path)
            self._record_issue(issue, rule)

    def _should_skip_match(self, match: Dict[str, Any], rule: Dict[str, Any]) -> bool:
        """Check if a match should be skipped based on additional checks"""
        if 'check' not in rule:
            return False

        code_text = match.get('text', '')
        return not rule['check'](code_text)

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

    def _record_issue(self, issue: QualityIssue, rule: Dict[str, Any]):
        """Record an issue in the report"""
        self.report.issues.append(issue)
        self.report.total_issues += 1
        self.report.issues_by_severity[rule['severity']] += 1
        self.report.issues_by_category[rule['category']] += 1

    def analyze_directory(self, directory: Path, skip_dirs: set = None):
        """Analyze all files in a directory recursively"""
        if skip_dirs is None:
            skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                        '_site', '.venv', 'venv', 'env', '.cache', 'coverage'}

        for root, dirs, files in os.walk(directory):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

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

    def save_report_json(self, output_path: Path):
        """Save report as JSON"""
        data = self._build_report_data()
        self._write_json_file(output_path, data)
        print(f"✅ Quality report saved to {output_path}")

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

    def _write_json_file(self, path: Path, data: Dict[str, Any]):
        """Write data to JSON file"""
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)

def main():
    import argparse
    args = _parse_arguments()
    _run_analysis(args)

def _parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Code Quality Analyzer')
    parser.add_argument('path', help='File or directory to analyze')
    parser.add_argument('--json', help='Output JSON report to file')
    parser.add_argument('--text', help='Output text report to file')
    return parser.parse_args()

def _run_analysis(args):
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

def _print_header(path: Path):
    """Print analysis header"""
    print(f"\n{'='*80}")
    print("Code Quality Analyzer")
    print(f"{'='*80}\n")
    print(f"Analyzing: {path}\n")

def _analyze_path(analyzer: 'CodeQualityAnalyzer', path: Path) -> bool:
    """Analyze the given path"""
    if path.is_file():
        analyzer.analyze_file(path)
        return True
    elif path.is_dir():
        analyzer.analyze_directory(path)
        return True
    else:
        print(f"Error: {path} is not a valid file or directory")
        return False

def _generate_and_save_reports(analyzer: 'CodeQualityAnalyzer', args):
    """Generate and save reports"""
    text_report = analyzer.generate_report_text()
    print(text_report)

    if args.json:
        analyzer.save_report_json(Path(args.json))

    if args.text:
        _save_text_report(args.text, text_report)

def _save_text_report(filepath: str, content: str):
    """Save text report to file"""
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"\n✅ Text report saved to {filepath}")

if __name__ == '__main__':
    main()
