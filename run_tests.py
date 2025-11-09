#!/usr/bin/env python3
"""
Test Runner - Runs all tests and generates coverage report
"""

import unittest
import sys
from pathlib import Path
import subprocess
import json
from datetime import datetime

class TestRunner:
    """Runs all tests and generates comprehensive coverage report"""

    def __init__(self, coverage_enabled=True):
        self.coverage_enabled = coverage_enabled
        self.test_dir = Path(__file__).parent / 'tests'
        self.results = {}

    def discover_tests(self):
        """Discover all test files"""
        loader = unittest.TestLoader()
        suite = loader.discover(str(self.test_dir), pattern='test_*.py')
        return suite

    def run_tests(self):
        """Run all tests and collect results"""
        print("="*80)
        print("CODE INVENTORY - TEST SUITE")
        print("="*80)
        print(f"\nDiscovering tests in: {self.test_dir}")
        print(f"Coverage enabled: {self.coverage_enabled}\n")

        suite = self.discover_tests()

        # Count tests
        test_count = suite.countTestCases()
        print(f"Found {test_count} tests\n")

        # Run tests
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)

        # Store results
        self.results = {
            'total': test_count,
            'passed': test_count - len(result.failures) - len(result.errors),
            'failed': len(result.failures),
            'errors': len(result.errors),
            'skipped': len(result.skipped) if hasattr(result, 'skipped') else 0,
            'success_rate': ((test_count - len(result.failures) - len(result.errors)) / test_count * 100) if test_count > 0 else 0
        }

        return result.wasSuccessful()

    def run_coverage_analysis(self):
        """Run tests with coverage if available"""
        if not self.coverage_enabled:
            return None

        try:
            # Try to import coverage
            import coverage
        except ImportError:
            print("\n⚠️  coverage.py not installed. Install with: pip install coverage")
            return None

        print("\n" + "="*80)
        print("RUNNING TESTS WITH COVERAGE")
        print("="*80 + "\n")

        # Create coverage object
        cov = coverage.Coverage(source=[str(Path(__file__).parent)])
        cov.start()

        # Run tests
        suite = self.discover_tests()
        runner = unittest.TextTestRunner(verbosity=1)
        result = runner.run(suite)

        # Stop coverage
        cov.stop()
        cov.save()

        # Generate reports
        print("\n" + "="*80)
        print("COVERAGE REPORT")
        print("="*80 + "\n")

        cov.report()

        # Generate HTML report
        html_dir = Path(__file__).parent / 'coverage_html'
        cov.html_report(directory=str(html_dir))
        print(f"\n✅ HTML coverage report: {html_dir}/index.html")

        # Generate JSON report
        json_file = Path(__file__).parent / 'coverage.json'
        cov.json_report(outfile=str(json_file))

        return cov

    def generate_summary_report(self):
        """Generate summary report"""
        lines = [
            "",
            "="*80,
            "TEST SUMMARY REPORT",
            "="*80,
            "",
            f"Total Tests: {self.results['total']}",
            f"Passed: {self.results['passed']} ✅",
            f"Failed: {self.results['failed']} ❌",
            f"Errors: {self.results['errors']} ⚠️",
            f"Skipped: {self.results['skipped']}",
            "",
            f"Success Rate: {self.results['success_rate']:.1f}%",
            ""
        ]

        # Visual progress bar
        if self.results['total'] > 0:
            bar_width = 50
            filled = int(bar_width * self.results['success_rate'] / 100)
            bar = '█' * filled + '░' * (bar_width - filled)
            lines.append(f"[{bar}] {self.results['success_rate']:.1f}%")
            lines.append("")

        # Status
        if self.results['success_rate'] == 100:
            lines.extend([
                "🎉 ALL TESTS PASSED!",
                ""
            ])
        elif self.results['success_rate'] >= 80:
            lines.extend([
                "✅ Most tests passed",
                "⚠️  Some failures need attention",
                ""
            ])
        else:
            lines.extend([
                "❌ Multiple test failures",
                "⚠️  Immediate attention required",
                ""
            ])

        lines.append("="*80)

        report = '\n'.join(lines)
        print(report)

        # Save to file
        report_file = Path(__file__).parent / 'test_results.txt'
        with open(report_file, 'w') as f:
            f.write(report)

        return report

    def generate_json_report(self):
        """Generate JSON report of test results"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': self.results,
            'test_directory': str(self.test_dir),
            'coverage_enabled': self.coverage_enabled
        }

        report_file = Path(__file__).parent / 'test_results.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"✅ JSON report saved to: {report_file}")

        return report_file

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Run Code Inventory Tests')
    parser.add_argument('--no-coverage', action='store_true', help='Disable coverage analysis')
    parser.add_argument('--unit-only', action='store_true', help='Run only unit tests')
    parser.add_argument('--integration-only', action='store_true', help='Run only integration tests')

    args = parser.parse_args()

    runner = TestRunner(coverage_enabled=not args.no_coverage)

    # Run tests based on arguments
    if args.unit_only:
        print("Running unit tests only...")
        runner.test_dir = runner.test_dir / 'unit'
    elif args.integration_only:
        print("Running integration tests only...")
        runner.test_dir = runner.test_dir / 'integration'

    # Run tests
    success = runner.run_tests()

    # Generate reports
    runner.generate_summary_report()
    runner.generate_json_report()

    # Run coverage if enabled
    if not args.no_coverage:
        runner.run_coverage_analysis()

    print("\n" + "="*80)
    print("TEST RUN COMPLETE")
    print("="*80 + "\n")

    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
