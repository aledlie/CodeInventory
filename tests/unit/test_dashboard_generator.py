#!/usr/bin/env python3
"""
Unit tests for dashboard_generator.py
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dashboard_generator import DashboardGenerator

class TestDashboardGenerator(unittest.TestCase):
    """Test DashboardGenerator class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()

        # Create sample schemas file
        self.schemas_file = Path(self.temp_dir) / "schemas.json"
        with open(self.schemas_file, 'w') as f:
            json.dump({
                "@context": "https://schema.org",
                "directories": {
                    "src": {
                        "files": [
                            {
                                "path": "src/main.py",
                                "classes": [{"name": "App"}],
                                "functions": [{"name": "main"}]
                            }
                        ]
                    }
                }
            }, f)

        # Create sample quality report
        self.quality_file = Path(self.temp_dir) / "quality.json"
        with open(self.quality_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_issues": 10,
                    "total_files_scanned": 5,
                    "issues_by_severity": {
                        "error": 2,
                        "warning": 5,
                        "info": 3
                    }
                }
            }, f)

        # Create sample coverage report
        self.coverage_file = Path(self.temp_dir) / "coverage.json"
        with open(self.coverage_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_functions": 100,
                    "tested_functions": 85,
                    "coverage_percentage": 85.0
                }
            }, f)

        # Create sample dependency report
        self.dependency_file = Path(self.temp_dir) / "dependency.json"
        with open(self.dependency_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_dependencies": 50,
                    "external_dependencies": 40,
                    "internal_dependencies": 10,
                    "circular_dependencies_count": 1
                }
            }, f)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test generator initialization"""
        generator = DashboardGenerator(
            schemas_path=self.schemas_file,
            quality_path=self.quality_file,
            coverage_path=self.coverage_file,
            dependency_path=self.dependency_file
        )

        self.assertIsNotNone(generator.schemas_data)
        self.assertIsNotNone(generator.quality_data)
        self.assertIsNotNone(generator.coverage_data)
        self.assertIsNotNone(generator.dependency_data)

    def test_initialization_without_optional_reports(self):
        """Test initialization with only schemas"""
        generator = DashboardGenerator(schemas_path=self.schemas_file)

        self.assertIsNotNone(generator.schemas_data)
        self.assertIsNone(generator.quality_data)
        self.assertIsNone(generator.coverage_data)

    def test_generate_html(self):
        """Test HTML dashboard generation"""
        generator = DashboardGenerator(
            schemas_path=self.schemas_file,
            quality_path=self.quality_file,
            coverage_path=self.coverage_file,
            dependency_path=self.dependency_file
        )

        html = generator.generate_html()

        # Check for key HTML elements
        self.assertIn("<!DOCTYPE html>", html)
        self.assertIn("Code Inventory Dashboard", html)
        self.assertIn("Metrics Overview", html)

    def test_generate_metrics_section(self):
        """Test metrics section generation"""
        generator = DashboardGenerator(
            schemas_path=self.schemas_file,
            quality_path=self.quality_file,
            coverage_path=self.coverage_file
        )

        metrics_html = generator._generate_metrics_section()

        self.assertIn("Directories Scanned", metrics_html)
        self.assertIn("Code Files", metrics_html)
        self.assertIn("Test Coverage", metrics_html)
        self.assertIn("85.0%", metrics_html)  # From coverage data

    def test_generate_quality_section(self):
        """Test quality section generation"""
        generator = DashboardGenerator(
            schemas_path=self.schemas_file,
            quality_path=self.quality_file
        )

        quality_html = generator._generate_quality_section()

        self.assertIn("Code Quality Analysis", quality_html)
        self.assertIn("Errors: 2", quality_html)
        self.assertIn("Warnings: 5", quality_html)

    def test_generate_coverage_section(self):
        """Test coverage section generation"""
        generator = DashboardGenerator(
            schemas_path=self.schemas_file,
            coverage_path=self.coverage_file
        )

        coverage_html = generator._generate_coverage_section()

        self.assertIn("Test Coverage", coverage_html)
        self.assertIn("85.0%", coverage_html)
        self.assertIn("GOOD", coverage_html)  # 85% is good coverage

    def test_generate_dependency_section(self):
        """Test dependency section generation"""
        generator = DashboardGenerator(
            schemas_path=self.schemas_file,
            dependency_path=self.dependency_file
        )

        dependency_html = generator._generate_dependency_section()

        self.assertIn("Dependencies", dependency_html)
        self.assertIn("50", dependency_html)  # Total dependencies

    def test_save_dashboard(self):
        """Test saving dashboard to file"""
        generator = DashboardGenerator(
            schemas_path=self.schemas_file,
            quality_path=self.quality_file
        )

        output_file = Path(self.temp_dir) / "dashboard.html"
        generator.save_dashboard(output_file)

        self.assertTrue(output_file.exists())

        # Verify it's valid HTML
        with open(output_file, 'r') as f:
            content = f.read()
            self.assertIn("<!DOCTYPE html>", content)
            self.assertIn("</html>", content)

    def test_dashboard_responsive_design(self):
        """Test dashboard includes responsive CSS"""
        generator = DashboardGenerator(schemas_path=self.schemas_file)
        html = generator.generate_html()

        self.assertIn("viewport", html)
        self.assertIn("grid-template-columns", html)

    def test_dashboard_with_no_data(self):
        """Test dashboard generation with minimal data"""
        # Create empty schemas file
        empty_schemas = Path(self.temp_dir) / "empty_schemas.json"
        with open(empty_schemas, 'w') as f:
            json.dump({"directories": {}}, f)

        generator = DashboardGenerator(schemas_path=empty_schemas)
        html = generator.generate_html()

        # Should still generate valid HTML
        self.assertIn("<!DOCTYPE html>", html)
        self.assertIn("Code Inventory Dashboard", html)

if __name__ == '__main__':
    unittest.main()
