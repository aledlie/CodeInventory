#!/usr/bin/env python3
"""
Unit tests for test_coverage_analyzer.py
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from test_coverage_analyzer import (
    TestCoverageAnalyzer,
    FunctionInfo,
    CoverageReport
)

class TestFunctionInfo(unittest.TestCase):
    """Test FunctionInfo dataclass"""

    def test_function_info_creation(self):
        """Test creating function info"""
        func = FunctionInfo(
            name="test_function",
            file_path="/test/file.py",
            line_number=42,
            is_async=True,
            is_tested=True,
            test_file="/test/test_file.py"
        )

        self.assertEqual(func.name, "test_function")
        self.assertTrue(func.is_async)
        self.assertTrue(func.is_tested)

class TestCoverageReport(unittest.TestCase):
    """Test CoverageReport dataclass"""

    def test_coverage_report_initialization(self):
        """Test report initialization"""
        report = CoverageReport()

        self.assertEqual(report.total_functions, 0)
        self.assertEqual(report.tested_functions, 0)
        self.assertEqual(report.coverage_percentage, 0.0)

    def test_coverage_calculation(self):
        """Test coverage percentage calculation"""
        report = CoverageReport()
        report.total_functions = 100
        report.tested_functions = 85
        report.coverage_percentage = 85.0

        self.assertEqual(report.coverage_percentage, 85.0)

class TestTestCoverageAnalyzer(unittest.TestCase):
    """Test TestCoverageAnalyzer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.src_dir = Path(self.temp_dir) / "src"
        self.test_dir = Path(self.temp_dir) / "tests"
        self.src_dir.mkdir()
        self.test_dir.mkdir()

        self.analyzer = TestCoverageAnalyzer(self.src_dir, self.test_dir)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test analyzer initialization"""
        self.assertEqual(self.analyzer.src_dir, self.src_dir)
        self.assertEqual(self.analyzer.test_dir, self.test_dir)
        self.assertIsNotNone(self.analyzer.test_patterns)

    def test_is_test_file(self):
        """Test test file detection"""
        self.assertTrue(self.analyzer._is_test_file(Path("tests/test_module.py")))
        self.assertTrue(self.analyzer._is_test_file(Path("module.test.ts")))
        self.assertFalse(self.analyzer._is_test_file(Path("src/module.py")))

    def test_find_functions_in_python_file(self):
        """Test finding functions in Python file"""
        test_file = self.src_dir / "module.py"
        test_file.write_text("""
def public_function():
    pass

def _private_function():
    pass

async def async_function():
    pass
""")

        functions = self.analyzer.find_functions_in_file(test_file)

        # Should find public and async functions, not private
        func_names = [f.name for f in functions]
        self.assertIn("public_function", func_names)
        self.assertIn("async_function", func_names)
        # Private functions should be skipped
        self.assertNotIn("_private_function", func_names)

    def test_find_test_functions(self):
        """Test finding test function patterns"""
        test_file = self.test_dir / "test_module.py"
        test_file.write_text("""
def test_public_function():
    assert True

def test_async_function():
    assert True
""")

        test_patterns = self.analyzer.find_test_functions(self.test_dir)

        # Should find patterns like "public_function"
        self.assertGreater(len(test_patterns), 0)

    def test_analyze_coverage(self):
        """Test coverage analysis"""
        # Create source file
        src_file = self.src_dir / "calc.py"
        src_file.write_text("""
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b
""")

        # Create test file (only tests add and multiply)
        test_file = self.test_dir / "test_calc.py"
        test_file.write_text("""
def test_add():
    from calc import add
    assert add(1, 2) == 3

def test_multiply():
    from calc import multiply
    assert multiply(2, 3) == 6
""")

        self.analyzer.analyze_coverage()

        # Should find 3 functions total
        self.assertGreater(self.analyzer.report.total_functions, 0)

    def test_generate_report_text(self):
        """Test text report generation"""
        self.analyzer.report.total_functions = 100
        self.analyzer.report.tested_functions = 85
        self.analyzer.report.untested_functions = 15
        self.analyzer.report.coverage_percentage = 85.0

        report_text = self.analyzer.generate_report_text()

        self.assertIn("TEST COVERAGE ANALYSIS REPORT", report_text)
        self.assertIn("85.0%", report_text)
        self.assertIn("GOOD", report_text)  # 85% is good coverage

    def test_save_report_json(self):
        """Test JSON report saving"""
        output_file = Path(self.temp_dir) / "coverage_report.json"

        self.analyzer.report.total_functions = 50
        self.analyzer.report.tested_functions = 40
        self.analyzer.report.coverage_percentage = 80.0

        self.analyzer.save_report_json(output_file)

        self.assertTrue(output_file.exists())

        with open(output_file, 'r') as f:
            data = json.load(f)

        self.assertEqual(data["summary"]["total_functions"], 50)
        self.assertEqual(data["summary"]["coverage_percentage"], 80.0)

    def test_coverage_recommendations(self):
        """Test coverage recommendations"""
        # Low coverage
        self.analyzer.report.coverage_percentage = 60.0
        report = self.analyzer.generate_report_text()
        self.assertIn("CRITICAL", report)

        # Medium coverage
        self.analyzer.report.coverage_percentage = 75.0
        report = self.analyzer.generate_report_text()
        self.assertIn("WARNING", report)

        # Good coverage
        self.analyzer.report.coverage_percentage = 85.0
        report = self.analyzer.generate_report_text()
        self.assertIn("GOOD", report)

if __name__ == '__main__':
    unittest.main()
