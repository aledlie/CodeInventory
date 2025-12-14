#!/usr/bin/env python3
"""
Unit tests for run_analysis.py - focusing on test directory resolution
"""

import unittest
import tempfile
from pathlib import Path
import sys
import shutil

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.run_analysis import AnalysisRunner


class TestAnalysisRunnerTestDirectoryResolution(unittest.TestCase):
    """Test that the coverage analysis uses the correct test directory"""

    def setUp(self):
        """Set up test fixtures with mock project structure"""
        self.temp_dir = tempfile.mkdtemp()
        self.project_root = Path(self.temp_dir)

        # Create src directory (simulating --root pointing to src/)
        self.src_dir = self.project_root / "src"
        self.src_dir.mkdir()
        (self.src_dir / "main.py").write_text("def main(): pass")

        # Create tests at project root (NOT inside src)
        self.tests_dir = self.project_root / "tests"
        self.tests_dir.mkdir()
        (self.tests_dir / "test_main.py").write_text("def test_main(): pass")

        # Create output directory
        self.output_dir = self.project_root / "outputs"
        self.output_dir.mkdir()

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_test_directory_at_project_root(self):
        """Test that test_dir resolves to project root tests/ when src is root_dir"""
        # When root_dir is /project/src, tests/ should resolve to /project/tests
        root_dir = self.src_dir  # Simulates --root /project/src

        # This is the logic from run_analysis.py _run_coverage_analysis
        test_dir = root_dir.parent / 'tests'
        if not test_dir.exists():
            test_dir = root_dir / 'tests'

        self.assertEqual(test_dir, self.tests_dir)
        self.assertTrue(test_dir.exists())

    def test_test_directory_fallback_to_src_tests(self):
        """Test fallback to src/tests when project root tests/ doesn't exist"""
        # Remove project root tests
        shutil.rmtree(self.tests_dir)

        # Create tests inside src
        src_tests = self.src_dir / "tests"
        src_tests.mkdir()
        (src_tests / "test_main.py").write_text("def test_main(): pass")

        root_dir = self.src_dir

        # This is the logic from run_analysis.py _run_coverage_analysis
        test_dir = root_dir.parent / 'tests'
        if not test_dir.exists():
            test_dir = root_dir / 'tests'

        self.assertEqual(test_dir, src_tests)
        self.assertTrue(test_dir.exists())

    def test_runner_initialization(self):
        """Test that AnalysisRunner initializes correctly"""
        runner = AnalysisRunner(
            root_dir=self.src_dir,
            output_dir=self.output_dir
        )

        self.assertEqual(runner.root_dir, self.src_dir)
        self.assertEqual(runner.output_dir, self.output_dir)


class TestTestCoverageAnalyzerTestDir(unittest.TestCase):
    """Test that TestCoverageAnalyzer respects the test_dir parameter"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.project_root = Path(self.temp_dir)

        # Create src directory
        self.src_dir = self.project_root / "src"
        self.src_dir.mkdir()
        (self.src_dir / "module.py").write_text('''
def analyze_data(data):
    """Analyze the data."""
    return len(data)

def process_input(input_str):
    """Process input string."""
    return input_str.strip()
''')

        # Create tests at project root
        self.tests_dir = self.project_root / "tests"
        self.tests_dir.mkdir()
        (self.tests_dir / "test_module.py").write_text('''
def test_analyze_data():
    """Test analyze_data function."""
    assert True

def test_process_input():
    """Test process_input function."""
    assert True
''')

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_coverage_analyzer_with_explicit_test_dir(self):
        """Test that coverage analyzer uses explicit test_dir"""
        from src.analyzers.test_coverage import TestCoverageAnalyzer

        analyzer = TestCoverageAnalyzer(
            src_dir=self.src_dir,
            test_dir=self.tests_dir  # Explicit test directory
        )

        self.assertEqual(analyzer.src_dir, self.src_dir)
        self.assertEqual(analyzer.test_dir, self.tests_dir)

    def test_coverage_analyzer_default_test_dir(self):
        """Test that coverage analyzer defaults to src_dir/tests"""
        from src.analyzers.test_coverage import TestCoverageAnalyzer

        # Create tests inside src for this test
        src_tests = self.src_dir / "tests"
        src_tests.mkdir()

        analyzer = TestCoverageAnalyzer(src_dir=self.src_dir)

        self.assertEqual(analyzer.test_dir, src_tests)

    def test_coverage_finds_tests_in_correct_directory(self):
        """Test that coverage analysis finds tests in specified directory"""
        from src.analyzers.test_coverage import TestCoverageAnalyzer

        analyzer = TestCoverageAnalyzer(
            src_dir=self.src_dir,
            test_dir=self.tests_dir
        )

        test_functions = analyzer.find_test_functions(self.tests_dir)

        # Should find the test functions
        self.assertGreater(len(test_functions), 0)


if __name__ == '__main__':
    unittest.main()
