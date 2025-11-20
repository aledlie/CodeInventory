#!/usr/bin/env python3
"""
Code Quality Analyzer - Uses ast-grep to find code smells, security issues, and best practice violations
"""

import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional
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
            {
                'id': 'long-function',
                'pattern': 'def $NAME($$$):\n  $$$',
                'severity': 'warning',
                'category': 'code_smell',
                'message': 'Function may be too long (consider breaking down)',
                'suggestion': 'Break down into smaller, focused functions'
            },
            {
                'id': 'missing-docstring',
                'pattern': 'def $NAME($$$):\n  $BODY',
                'severity': 'info',
                'category': 'documentation',
                'message': 'Function missing docstring',
                'suggestion': 'Add docstring describing purpose, args, and return value'
            },
            {
                'id': 'bare-except',
                'pattern': 'try:\n  $$$\nexcept:\n  $$$',
                'severity': 'warning',
                'category': 'best_practice',
                'message': 'Bare except clause catches all exceptions',
                'suggestion': 'Specify exception types or use "except Exception:"'
            },
            {
                'id': 'print-statement',
                'pattern': 'print($$$)',
                'severity': 'info',
                'category': 'best_practice',
                'message': 'Using print() instead of logging',
                'suggestion': 'Consider using logging module for better control'
            },
            {
                'id': 'hardcoded-password',
                'pattern': '$VAR = "$PASSWORD"',
                'severity': 'error',
                'category': 'security',
                'message': 'Potential hardcoded credential',
                'suggestion': 'Use environment variables or secure credential storage',
                'check': lambda code: any(word in code.lower() for word in ['password', 'secret', 'api_key', 'token'])
            },
            {
                'id': 'many-parameters',
                'pattern': 'def $NAME($P1, $P2, $P3, $P4, $P5, $P6, $$$):',
                'severity': 'warning',
                'category': 'code_smell',
                'message': 'Function has too many parameters (6+)',
                'suggestion': 'Consider using a config object or dataclass'
            },
            {
                'id': 'todo-comment',
                'pattern': '# TODO',
                'severity': 'info',
                'category': 'documentation',
                'message': 'TODO comment found',
                'suggestion': 'Create a tracking issue for this TODO'
            }
        ]

    def _get_typescript_rules(self) -> List[Dict[str, Any]]:
        """Define TypeScript/JavaScript quality rules"""
        return [
            {
                'id': 'console-log',
                'pattern': 'console.log($$$)',
                'severity': 'warning',
                'category': 'best_practice',
                'message': 'console.log() statement found',
                'suggestion': 'Remove debug logs or use proper logging library'
            },
            {
                'id': 'any-type',
                'pattern': '$VAR: any',
                'severity': 'warning',
                'category': 'best_practice',
                'message': 'Using "any" type defeats TypeScript type checking',
                'suggestion': 'Define proper type or use unknown with type guards'
            },
            {
                'id': 'no-async-await',
                'pattern': 'async function $NAME($$$) { $$$ }',
                'severity': 'info',
                'category': 'best_practice',
                'message': 'Async function should use await or return Promise',
                'suggestion': 'Ensure async functions actually use await'
            },
            {
                'id': 'eval-usage',
                'pattern': 'eval($$$)',
                'severity': 'error',
                'category': 'security',
                'message': 'eval() is dangerous and should be avoided',
                'suggestion': 'Find alternative approach without eval()'
            },
            {
                'id': 'empty-catch',
                'pattern': 'catch ($E) {}',
                'severity': 'warning',
                'category': 'best_practice',
                'message': 'Empty catch block silently swallows errors',
                'suggestion': 'At minimum, log the error'
            },
            {
                'id': 'no-explicit-return-type',
                'pattern': 'function $NAME($$$) {',
                'severity': 'info',
                'category': 'best_practice',
                'message': 'Function missing explicit return type',
                'suggestion': 'Add return type annotation for better type safety'
            }
        ]

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
        # Determine language and rules
        if file_path.suffix == '.py':
            language = 'python'
            rules = self.python_rules
        elif file_path.suffix in ['.ts', '.tsx']:
            language = 'typescript'
            rules = self.typescript_rules
        elif file_path.suffix in ['.js', '.jsx']:
            language = 'javascript'
            rules = self.typescript_rules
        else:
            return

        self.report.total_files_scanned += 1

        # Run each rule
        for rule in rules:
            matches = self._run_astgrep_rule(file_path, rule['pattern'], language)

            for match in matches:
                # Additional check if specified
                if 'check' in rule:
                    code_text = match.get('text', '')
                    if not rule['check'](code_text):
                        continue

                line_num = match.get('range', {}).get('start', {}).get('line', 0)
                code_snippet = match.get('text', '')[:100]  # First 100 chars

                issue = QualityIssue(
                    severity=rule['severity'],
                    category=rule['category'],
                    rule_id=rule['id'],
                    message=rule['message'],
                    file_path=str(file_path),
                    line_number=line_num,
                    code_snippet=code_snippet,
                    suggestion=rule.get('suggestion')
                )

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
        lines = [
            "="*80,
            "CODE QUALITY ANALYSIS REPORT",
            "="*80,
            "",
            f"Files Scanned: {self.report.total_files_scanned}",
            f"Total Issues Found: {self.report.total_issues}",
            ""
        ]

        # Summary by severity
        lines.append("Issues by Severity:")
        for severity in ['error', 'warning', 'info']:
            count = self.report.issues_by_severity.get(severity, 0)
            if count > 0:
                lines.append(f"  {severity.upper()}: {count}")
        lines.append("")

        # Summary by category
        lines.append("Issues by Category:")
        for category, count in sorted(self.report.issues_by_category.items()):
            lines.append(f"  {category.replace('_', ' ').title()}: {count}")
        lines.append("")

        # Detailed issues grouped by severity
        for severity in ['error', 'warning', 'info']:
            severity_issues = [i for i in self.report.issues if i.severity == severity]

            if severity_issues:
                lines.append("="*80)
                lines.append(f"{severity.upper()} Issues ({len(severity_issues)})")
                lines.append("="*80)
                lines.append("")

                # Group by file
                by_file = defaultdict(list)
                for issue in severity_issues:
                    by_file[issue.file_path].append(issue)

                for file_path, issues in sorted(by_file.items()):
                    lines.append(f"📄 {file_path}")
                    lines.append("-"*80)

                    for issue in sorted(issues, key=lambda x: x.line_number):
                        lines.append(f"  Line {issue.line_number}: [{issue.rule_id}] {issue.message}")
                        if issue.code_snippet:
                            lines.append(f"    Code: {issue.code_snippet}")
                        if issue.suggestion:
                            lines.append(f"    💡 {issue.suggestion}")
                        lines.append("")

        lines.append("="*80)
        lines.append("END OF REPORT")
        lines.append("="*80)

        return '\n'.join(lines)

    def save_report_json(self, output_path: Path):
        """Save report as JSON"""
        data = {
            'summary': {
                'total_files_scanned': self.report.total_files_scanned,
                'total_issues': self.report.total_issues,
                'issues_by_severity': dict(self.report.issues_by_severity),
                'issues_by_category': dict(self.report.issues_by_category)
            },
            'issues': [
                {
                    'severity': issue.severity,
                    'category': issue.category,
                    'rule_id': issue.rule_id,
                    'message': issue.message,
                    'file_path': issue.file_path,
                    'line_number': issue.line_number,
                    'code_snippet': issue.code_snippet,
                    'suggestion': issue.suggestion
                }
                for issue in self.report.issues
            ]
        }

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✅ Quality report saved to {output_path}")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Code Quality Analyzer')
    parser.add_argument('path', help='File or directory to analyze')
    parser.add_argument('--json', help='Output JSON report to file')
    parser.add_argument('--text', help='Output text report to file')

    args = parser.parse_args()

    path = Path(args.path)
    analyzer = CodeQualityAnalyzer(path)

    print(f"\n{'='*80}")
    print("Code Quality Analyzer")
    print(f"{'='*80}\n")
    print(f"Analyzing: {path}\n")

    if path.is_file():
        analyzer.analyze_file(path)
    elif path.is_dir():
        analyzer.analyze_directory(path)
    else:
        print(f"Error: {path} is not a valid file or directory")
        return

    # Generate text report
    text_report = analyzer.generate_report_text()
    print(text_report)

    # Save reports if requested
    if args.json:
        analyzer.save_report_json(Path(args.json))

    if args.text:
        with open(args.text, 'w') as f:
            f.write(text_report)
        print(f"\n✅ Text report saved to {args.text}")

if __name__ == '__main__':
    main()
