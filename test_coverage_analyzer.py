#!/usr/bin/env python3
"""
Test Coverage Analyzer - Identifies untested code using ast-grep
"""

import json
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple, Optional
from dataclasses import dataclass, field
from collections import defaultdict

@dataclass
class FunctionInfo:
    """Information about a function"""
    name: str
    file_path: str
    line_number: int
    is_async: bool = False
    is_tested: bool = False
    test_file: Optional[str] = None

@dataclass
class CoverageReport:
    """Test coverage analysis report"""
    total_functions: int = 0
    tested_functions: int = 0
    untested_functions: int = 0
    coverage_percentage: float = 0.0
    functions: List[FunctionInfo] = field(default_factory=list)
    untested_by_file: Dict[str, List[FunctionInfo]] = field(default_factory=lambda: defaultdict(list))

class TestCoverageAnalyzer:
    """Analyzes test coverage by matching functions with test cases"""

    def __init__(self, src_dir: Path, test_dir: Path = None):
        self.src_dir = src_dir
        self.test_dir = test_dir or src_dir / 'tests'
        self.report = CoverageReport()

        # Common test patterns
        self.test_patterns = [
            'tests/',
            '__tests__/',
            'test_',
            '.test.',
            '.spec.',
            '_test.py',
            '_spec.ts',
            '_spec.js'
        ]

    def _is_test_file(self, file_path: Path) -> bool:
        """Check if a file is a test file"""
        path_str = str(file_path)
        return any(pattern in path_str for pattern in self.test_patterns)

    def _run_astgrep(self, file_path: Path, pattern: str, language: str) -> List[Dict[str, Any]]:
        """Run ast-grep pattern"""
        try:
            result = subprocess.run(
                ['ast-grep', 'run', '-p', pattern, '--lang', language, '--json', str(file_path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout.strip():
                return json.loads(result.stdout)
            # Optionally log stderr for debugging
            if result.returncode != 0 and result.stderr:
                print(f"  ast-grep error: {result.stderr[:200]}")
            return []
        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
            print(f"  ast-grep exception: {e}")
            return []

    def find_functions_in_file(self, file_path: Path) -> List[FunctionInfo]:
        """Find all functions in a file"""
        functions = []

        # Determine language
        if file_path.suffix == '.py':
            language = 'python'
            patterns = [
                'def $NAME($$$):',
                'async def $NAME($$$):'
            ]
        elif file_path.suffix in ['.ts', '.tsx']:
            language = 'typescript'
            patterns = [
                'function $NAME($$$) { $$$ }',
                'const $NAME = ($$$) => $$$',
                'export function $NAME($$$) { $$$ }',
                'async function $NAME($$$) { $$$ }'
            ]
        elif file_path.suffix in ['.js', '.jsx']:
            language = 'javascript'
            patterns = [
                'function $NAME($$$) { $$$ }',
                'const $NAME = ($$$) => $$$',
                'export function $NAME($$$) { $$$ }'
            ]
        else:
            return functions

        # Find functions using each pattern
        for pattern in patterns:
            matches = self._run_astgrep(file_path, pattern, language)

            for match in matches:
                meta = match.get('metaVariables', {})
                # Handle both old and new ast-grep formats
                func_name = None
                if 'single' in meta and 'NAME' in meta['single']:
                    func_node = meta['single']['NAME']
                    func_name = func_node.get('text') if isinstance(func_node, dict) else str(func_node)
                elif 'NAME' in meta:
                    func_node = meta['NAME']
                    func_name = func_node.get('text') if isinstance(func_node, dict) else str(func_node)

                if func_name:
                    line_num = match.get('range', {}).get('start', {}).get('line', 0)
                    is_async = 'async' in pattern or 'async' in match.get('text', '')

                    # Skip private/internal functions (starting with _)
                    if not func_name.startswith('_'):
                        func_info = FunctionInfo(
                            name=func_name,
                            file_path=str(file_path),
                            line_number=line_num,
                            is_async=is_async
                        )
                        functions.append(func_info)

        return functions

    def find_test_functions(self, test_dir: Path) -> Set[str]:
        """Find all test function names"""
        test_functions = set()

        if not test_dir.exists():
            return test_functions

        # Patterns that indicate test functions
        test_patterns_search = [
            'def test_$NAME($$$):',
            'it("$NAME", $$$)',
            'test("$NAME", $$$)',
            'describe("$NAME", $$$)'
        ]

        for file_path in test_dir.rglob('*'):
            if not file_path.is_file():
                continue

            # Determine language
            if file_path.suffix == '.py':
                language = 'python'
            elif file_path.suffix in ['.ts', '.tsx']:
                language = 'typescript'
            elif file_path.suffix in ['.js', '.jsx']:
                language = 'javascript'
            else:
                continue

            for pattern in test_patterns_search:
                matches = self._run_astgrep(file_path, pattern, language)

                for match in matches:
                    meta = match.get('metaVariables', {})
                    # Handle both old and new ast-grep formats
                    test_name = None
                    if 'single' in meta and 'NAME' in meta['single']:
                        test_node = meta['single']['NAME']
                        test_name = test_node.get('text') if isinstance(test_node, dict) else str(test_node)
                    elif 'NAME' in meta:
                        test_node = meta['NAME']
                        test_name = test_node.get('text') if isinstance(test_node, dict) else str(test_node)

                    if test_name:
                        # Extract the actual function name being tested
                        # e.g., "test_calculate_total" -> "calculate_total"
                        # e.g., "should calculate total" -> "calculate"
                        clean_name = (test_name
                                     .replace('test_', '')
                                     .replace('_test', '')
                                     .replace('should ', '')
                                     .replace(' ', '_')
                                     .lower())

                        test_functions.add(clean_name)
                        test_functions.add(test_name.lower())

        return test_functions

    def analyze_coverage(self):
        """Analyze test coverage for the source directory"""
        print(f"\nAnalyzing source directory: {self.src_dir}")
        print(f"Looking for tests in: {self.test_dir}\n")

        # Find all test function names
        test_functions = self.find_test_functions(self.test_dir)
        print(f"Found {len(test_functions)} test patterns\n")

        # Find all source functions
        source_functions = []

        for file_path in self.src_dir.rglob('*'):
            if not file_path.is_file():
                continue

            # Skip test files
            if self._is_test_file(file_path):
                continue

            # Skip non-code files
            if file_path.suffix not in ['.py', '.ts', '.tsx', '.js', '.jsx']:
                continue

            functions = self.find_functions_in_file(file_path)
            source_functions.extend(functions)

        print(f"Found {len(source_functions)} functions in source code\n")

        # Match functions with tests
        for func in source_functions:
            func_name_lower = func.name.lower()

            # Check if function name appears in test names
            is_tested = any(func_name_lower in test_name for test_name in test_functions)
            func.is_tested = is_tested

            self.report.functions.append(func)

            if is_tested:
                self.report.tested_functions += 1
            else:
                self.report.untested_functions += 1
                # Group by file
                self.report.untested_by_file[func.file_path].append(func)

        self.report.total_functions = len(source_functions)

        # Calculate coverage percentage
        if self.report.total_functions > 0:
            self.report.coverage_percentage = (
                self.report.tested_functions / self.report.total_functions * 100
            )

    def generate_report_text(self) -> str:
        """Generate human-readable coverage report"""
        lines = [
            "="*80,
            "TEST COVERAGE ANALYSIS REPORT",
            "="*80,
            "",
            f"Source Directory: {self.src_dir}",
            f"Test Directory: {self.test_dir}",
            "",
            "="*80,
            "SUMMARY",
            "="*80,
            "",
            f"Total Functions: {self.report.total_functions}",
            f"Tested Functions: {self.report.tested_functions}",
            f"Untested Functions: {self.report.untested_functions}",
            f"Coverage: {self.report.coverage_percentage:.1f}%",
            ""
        ]

        # Coverage bar
        bar_width = 50
        filled = int(bar_width * self.report.coverage_percentage / 100)
        bar = '█' * filled + '░' * (bar_width - filled)
        lines.append(f"[{bar}] {self.report.coverage_percentage:.1f}%")
        lines.append("")

        # Untested functions by file
        if self.report.untested_by_file:
            lines.append("="*80)
            lines.append("UNTESTED FUNCTIONS BY FILE")
            lines.append("="*80)
            lines.append("")

            for file_path, functions in sorted(self.report.untested_by_file.items()):
                lines.append(f"📄 {file_path}")
                lines.append(f"   {len(functions)} untested function(s)")
                lines.append("-"*80)

                for func in sorted(functions, key=lambda x: x.line_number):
                    async_marker = " (async)" if func.is_async else ""
                    lines.append(f"  ❌ Line {func.line_number}: {func.name}(){async_marker}")

                lines.append("")

        # Recommendations
        lines.append("="*80)
        lines.append("RECOMMENDATIONS")
        lines.append("="*80)
        lines.append("")

        if self.report.coverage_percentage < 70:
            lines.append("🔴 CRITICAL: Test coverage is below 70%")
            lines.append("   Priority: Add tests for core functionality")
        elif self.report.coverage_percentage < 80:
            lines.append("🟡 WARNING: Test coverage is below 80%")
            lines.append("   Goal: Increase coverage to 80%+")
        else:
            lines.append("🟢 GOOD: Test coverage is above 80%")
            lines.append("   Maintain current coverage level")

        lines.append("")

        if self.report.untested_functions > 0:
            lines.append("Next Steps:")
            lines.append(f"  1. Add tests for {self.report.untested_functions} untested functions")
            lines.append("  2. Focus on functions with complex logic first")
            lines.append("  3. Consider edge cases and error handling")

        lines.append("")
        lines.append("="*80)
        lines.append("END OF REPORT")
        lines.append("="*80)

        return '\n'.join(lines)

    def save_report_json(self, output_path: Path):
        """Save coverage report as JSON"""
        data = {
            'summary': {
                'source_directory': str(self.src_dir),
                'test_directory': str(self.test_dir),
                'total_functions': self.report.total_functions,
                'tested_functions': self.report.tested_functions,
                'untested_functions': self.report.untested_functions,
                'coverage_percentage': round(self.report.coverage_percentage, 2)
            },
            'functions': [
                {
                    'name': func.name,
                    'file_path': func.file_path,
                    'line_number': func.line_number,
                    'is_async': func.is_async,
                    'is_tested': func.is_tested
                }
                for func in self.report.functions
            ],
            'untested_by_file': {
                file_path: [
                    {
                        'name': func.name,
                        'line_number': func.line_number,
                        'is_async': func.is_async
                    }
                    for func in functions
                ]
                for file_path, functions in self.report.untested_by_file.items()
            }
        }

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✅ Coverage report saved to {output_path}")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Test Coverage Analyzer')
    parser.add_argument('src_dir', help='Source code directory')
    parser.add_argument('--test-dir', help='Test directory (default: src_dir/tests)')
    parser.add_argument('--json', help='Output JSON report to file')
    parser.add_argument('--text', help='Output text report to file')

    args = parser.parse_args()

    src_dir = Path(args.src_dir)
    test_dir = Path(args.test_dir) if args.test_dir else None

    analyzer = TestCoverageAnalyzer(src_dir, test_dir)

    print(f"\n{'='*80}")
    print("Test Coverage Analyzer")
    print(f"{'='*80}")

    analyzer.analyze_coverage()

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
