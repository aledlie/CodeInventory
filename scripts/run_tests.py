#!/usr/bin/env python3
"""
Test Runner - Runs all tests and generates coverage report
"""

import unittest
import sys
import logging
from pathlib import Path
import subprocess
import json
from datetime import datetime
from typing import List

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set up logger
logger = logging.getLogger(__name__)

class TestRunner:
    """Runs all tests and generates comprehensive coverage report"""

    def __init__(self, coverage_enabled=True):
        self.coverage_enabled = coverage_enabled
        # Script is now in scripts/, so go up one level to find tests
        self.test_dir = Path(__file__).parent.parent / 'tests'
        self.results = {}

    def discover_tests(self):
        """Discover all test files"""
        loader = unittest.TestLoader()
        suite = loader.discover(str(self.test_dir), pattern='test_*.py')
        return suite

    def _print_test_header(self):
        """Print test suite header"""
        logger.info("="*80)
        logger.info("CODE INVENTORY - TEST SUITE")
        logger.info("="*80)
        logger.info(f"\nDiscovering tests in: {self.test_dir}")
        logger.info(f"Coverage enabled: {self.coverage_enabled}\n")

    def _execute_test_suite(self, suite):
        """Execute the test suite"""
        test_count = suite.countTestCases()
        logger.info(f"Found {test_count} tests\n")

        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)

        return result, test_count

    def _calculate_results(self, result, test_count):
        """Calculate test results statistics"""
        self.results = {
            'total': test_count,
            'passed': test_count - len(result.failures) - len(result.errors),
            'failed': len(result.failures),
            'errors': len(result.errors),
            'skipped': len(result.skipped) if hasattr(result, 'skipped') else 0,
            'success_rate': ((test_count - len(result.failures) - len(result.errors)) / test_count * 100) if test_count > 0 else 0
        }

    def run_tests(self):
        """Run all tests and collect results"""
        self._print_test_header()

        suite = self.discover_tests()
        result, test_count = self._execute_test_suite(suite)
        self._calculate_results(result, test_count)

        return result.wasSuccessful()

    def _check_coverage_available(self):
        """Check if coverage module is available"""
        try:
            import coverage
            return True
        except ImportError:
            logger.warning("\n⚠️  coverage.py not installed. Install with: pip install coverage")
            return False

    def _setup_coverage(self):
        """Setup coverage object"""
        import coverage
        cov = coverage.Coverage(source=[str(Path(__file__).parent.parent / 'src')])
        cov.start()
        return cov

    def _run_tests_with_coverage(self, cov):
        """Run tests with coverage tracking"""
        suite = self.discover_tests()
        runner = unittest.TextTestRunner(verbosity=1)
        result = runner.run(suite)

        cov.stop()
        cov.save()
        return result

    def _generate_coverage_reports(self, cov):
        """Generate coverage reports"""
        logger.info("\n" + "="*80)
        logger.info("COVERAGE REPORT")
        logger.info("="*80 + "\n")

        cov.report()

        # Generate HTML report
        html_dir = Path(__file__).parent.parent / 'htmlcov'
        cov.html_report(directory=str(html_dir))
        logger.info(f"\n✅ HTML coverage report: {html_dir}/index.html")

        # Generate JSON report
        json_file = Path(__file__).parent.parent / 'coverage.json'
        cov.json_report(outfile=str(json_file))

    def run_coverage_analysis(self):
        """Run tests with coverage if available"""
        if not self.coverage_enabled:
            return None

        if not self._check_coverage_available():
            return None

        logger.info("\n" + "="*80)
        logger.info("RUNNING TESTS WITH COVERAGE")
        logger.info("="*80 + "\n")

        cov = self._setup_coverage()
        self._run_tests_with_coverage(cov)
        self._generate_coverage_reports(cov)

        return cov

    def _build_summary_lines(self) -> List[str]:
        """Build summary report lines"""
        return [
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

    def _add_progress_bar(self, lines: List[str]):
        """Add visual progress bar to report"""
        if self.results['total'] > 0:
            bar_width = 50
            filled = int(bar_width * self.results['success_rate'] / 100)
            bar = '█' * filled + '░' * (bar_width - filled)
            lines.append(f"[{bar}] {self.results['success_rate']:.1f}%")
            lines.append("")

    def _add_status_message(self, lines: List[str]):
        """Add status message based on results"""
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

    def _save_summary_report(self, report: str):
        """Save summary report to file"""
        report_file = Path(__file__).parent.parent / 'test_results.txt'
        with open(report_file, 'w') as f:
            f.write(report)

    def generate_summary_report(self):
        """Generate summary report"""
        lines = self._build_summary_lines()
        self._add_progress_bar(lines)
        self._add_status_message(lines)

        report = '\n'.join(lines)
        logger.info(report)

        self._save_summary_report(report)
        return report

    def generate_json_report(self):
        """Generate JSON report of test results"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': self.results,
            'test_directory': str(self.test_dir),
            'coverage_enabled': self.coverage_enabled
        }

        report_file = Path(__file__).parent.parent / 'test_results.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"✅ JSON report saved to: {report_file}")

        return report_file

def _parse_arguments():
    """Parse command line arguments"""
    import argparse

    parser = argparse.ArgumentParser(description='Run Code Inventory Tests')
    parser.add_argument('--no-coverage', action='store_true', help='Disable coverage analysis')
    parser.add_argument('--unit-only', action='store_true', help='Run only unit tests')
    parser.add_argument('--integration-only', action='store_true', help='Run only integration tests')

    return parser.parse_args()

def _configure_test_directory(runner, args):
    """Configure test directory based on arguments"""
    if args.unit_only:
        logger.info("Running unit tests only...")
        runner.test_dir = runner.test_dir / 'unit'
    elif args.integration_only:
        logger.info("Running integration tests only...")
        runner.test_dir = runner.test_dir / 'integration'

def _run_test_pipeline(runner, args):
    """Run the complete test pipeline"""
    # Run tests
    success = runner.run_tests()

    # Generate reports
    runner.generate_summary_report()
    runner.generate_json_report()

    # Run coverage if enabled
    if not args.no_coverage:
        runner.run_coverage_analysis()

    logger.info("\n" + "="*80)
    logger.info("TEST RUN COMPLETE")
    logger.info("="*80 + "\n")

    return success

def main():
    # Configure logging for CLI output
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s'  # Keep simple format for CLI tools
    )

    args = _parse_arguments()

    runner = TestRunner(coverage_enabled=not args.no_coverage)
    _configure_test_directory(runner, args)
    success = _run_test_pipeline(runner, args)

    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
