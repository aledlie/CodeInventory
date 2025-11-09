#!/usr/bin/env python3
"""
Unit tests for dependency_analyzer.py
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dependency_analyzer import (
    DependencyAnalyzer,
    DependencyInfo,
    DependencyReport
)

class TestDependencyInfo(unittest.TestCase):
    """Test DependencyInfo dataclass"""

    def test_dependency_info_creation(self):
        """Test creating dependency info"""
        dep = DependencyInfo(
            package="react",
            import_type="static",
            file_path="/test/component.tsx",
            line_number=1,
            is_external=True
        )

        self.assertEqual(dep.package, "react")
        self.assertEqual(dep.import_type, "static")
        self.assertTrue(dep.is_external)

class TestDependencyReport(unittest.TestCase):
    """Test DependencyReport dataclass"""

    def test_dependency_report_initialization(self):
        """Test report initialization"""
        report = DependencyReport()

        self.assertEqual(report.total_dependencies, 0)
        self.assertEqual(report.external_dependencies, 0)
        self.assertEqual(len(report.circular_dependencies), 0)

class TestDependencyAnalyzer(unittest.TestCase):
    """Test DependencyAnalyzer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test analyzer initialization"""
        self.assertEqual(self.analyzer.root_dir, Path(self.temp_dir))
        self.assertIsNotNone(self.analyzer.external_indicators)

    def test_is_external_package(self):
        """Test external package detection"""
        # External packages
        self.assertTrue(self.analyzer._is_external_package("react"))
        self.assertTrue(self.analyzer._is_external_package("@types/node"))
        self.assertTrue(self.analyzer._is_external_package("express"))

        # Internal/relative imports
        self.assertFalse(self.analyzer._is_external_package("./utils"))
        self.assertFalse(self.analyzer._is_external_package("../components"))

    def test_analyze_python_imports(self):
        """Test Python import analysis"""
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("""
import os
import sys
from pathlib import Path
from .utils import helper
""")

        deps = self.analyzer.analyze_python_imports(test_file)

        self.assertGreater(len(deps), 0)
        packages = [d.package for d in deps]
        self.assertIn("os", packages)
        self.assertIn("sys", packages)

    def test_analyze_typescript_imports(self):
        """Test TypeScript import analysis"""
        test_file = Path(self.temp_dir) / "test.ts"
        test_file.write_text("""
import React from 'react';
import { useState } from 'react';
import type { User } from './types';
const module = require('./module');
""")

        deps = self.analyzer.analyze_typescript_imports(test_file, 'typescript')

        self.assertGreater(len(deps), 0)

    def test_analyze_file_python(self):
        """Test analyzing Python file"""
        test_file = Path(self.temp_dir) / "module.py"
        test_file.write_text("""
import json
import requests
from .local import helper
""")

        self.analyzer.analyze_file(test_file)

        self.assertGreater(self.analyzer.report.total_dependencies, 0)

    def test_analyze_directory(self):
        """Test analyzing directory"""
        # Create test files
        py_file = Path(self.temp_dir) / "test.py"
        py_file.write_text("import os\nimport sys")

        ts_file = Path(self.temp_dir) / "test.ts"
        ts_file.write_text("import React from 'react';")

        self.analyzer.analyze_directory(Path(self.temp_dir))

        self.assertGreater(self.analyzer.report.total_dependencies, 0)

    def test_find_circular_dependencies(self):
        """Test circular dependency detection"""
        # Create simple dependency graph
        self.analyzer.report.dependency_graph = {
            'file1.py': {'file2.py'},
            'file2.py': {'file3.py'},
            'file3.py': {'file1.py'}  # Creates a cycle
        }

        self.analyzer.find_circular_dependencies()

        # Should detect at least one circular dependency
        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_generate_report_text(self):
        """Test text report generation"""
        self.analyzer.report.total_dependencies = 100
        self.analyzer.report.external_dependencies = 75
        self.analyzer.report.internal_dependencies = 25

        report_text = self.analyzer.generate_report_text()

        self.assertIn("DEPENDENCY ANALYSIS REPORT", report_text)
        self.assertIn("100", report_text)
        self.assertIn("75", report_text)

    def test_save_report_json(self):
        """Test JSON report saving"""
        output_file = Path(self.temp_dir) / "dependency_report.json"

        self.analyzer.report.total_dependencies = 50
        self.analyzer.report.external_dependencies = 40

        self.analyzer.save_report_json(output_file)

        self.assertTrue(output_file.exists())

        with open(output_file, 'r') as f:
            data = json.load(f)

        self.assertEqual(data["summary"]["total_dependencies"], 50)

if __name__ == '__main__':
    unittest.main()
