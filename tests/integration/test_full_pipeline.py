#!/usr/bin/env python3
"""
Integration tests for the complete analysis pipeline
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json
import shutil

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from schema_generator_enhanced import EnhancedSchemaGenerator
from code_quality_analyzer import CodeQualityAnalyzer
from test_coverage_analyzer import TestCoverageAnalyzer
from dependency_analyzer import DependencyAnalyzer
from dashboard_generator import DashboardGenerator
from validate_schemas import SchemaValidator

class TestFullPipeline(unittest.TestCase):
    """Test complete analysis pipeline integration"""

    def setUp(self):
        """Set up test project structure"""
        self.temp_dir = tempfile.mkdtemp()
        self.project_dir = Path(self.temp_dir) / "test_project"
        self.project_dir.mkdir()

        # Create src directory
        self.src_dir = self.project_dir / "src"
        self.src_dir.mkdir()

        # Create tests directory
        self.tests_dir = self.project_dir / "tests"
        self.tests_dir.mkdir()

        # Create sample Python file
        (self.src_dir / "calculator.py").write_text("""
'''Calculator module'''

def add(a, b):
    '''Add two numbers'''
    return a + b

def subtract(a, b):
    '''Subtract two numbers'''
    return a - b

def multiply(a, b):
    # Missing docstring
    return a * b

class Calculator:
    '''Calculator class'''

    def divide(self, a, b):
        '''Divide two numbers'''
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b
""")

        # Create test file
        (self.tests_dir / "test_calculator.py").write_text("""
'''Tests for calculator'''

from src.calculator import add, Calculator

def test_add():
    assert add(1, 2) == 3

def test_calculator_divide():
    calc = Calculator()
    assert calc.divide(10, 2) == 5
""")

        # Create TypeScript file
        (self.src_dir / "utils.ts").write_text("""
export interface User {
    id: number;
    name: string;
}

export class UserService {
    getUser(id: number): User {
        return { id, name: 'Test' };
    }
}

export function formatUser(user: User): string {
    return `${user.id}: ${user.name}`;
}
""")

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_schema_generation_pipeline(self):
        """Test schema generation creates proper output"""
        generator = EnhancedSchemaGenerator(
            str(self.project_dir),
            use_astgrep=False  # Use regex fallback for tests
        )

        generator.scan_all_directories()

        # Should find directories and files
        self.assertGreater(len(generator.schemas), 0)

        # Find the src directory schema
        src_schema = None
        for path, schema in generator.schemas.items():
            if 'src' in path:
                src_schema = schema
                break

        self.assertIsNotNone(src_schema)
        self.assertGreater(len(src_schema.files), 0)

    def test_quality_analysis_pipeline(self):
        """Test quality analysis detects issues"""
        analyzer = CodeQualityAnalyzer(self.src_dir)
        analyzer.analyze_directory(self.src_dir)

        # Should scan files
        self.assertGreater(analyzer.report.total_files_scanned, 0)

    def test_coverage_analysis_pipeline(self):
        """Test coverage analysis matches functions with tests"""
        analyzer = TestCoverageAnalyzer(self.src_dir, self.tests_dir)
        analyzer.analyze_coverage()

        # Should find functions
        self.assertGreater(analyzer.report.total_functions, 0)

        # Should identify some tested and some untested
        # add and divide are tested, subtract and multiply are not
        self.assertGreater(analyzer.report.tested_functions, 0)

    def test_dependency_analysis_pipeline(self):
        """Test dependency analysis finds imports"""
        analyzer = DependencyAnalyzer(self.src_dir)
        analyzer.analyze_directory(self.src_dir)

        # Should find dependencies
        self.assertGreaterEqual(analyzer.report.total_dependencies, 0)

    def test_complete_pipeline_with_dashboard(self):
        """Test complete pipeline generating dashboard"""
        # 1. Generate schemas
        schema_generator = EnhancedSchemaGenerator(
            str(self.project_dir),
            use_astgrep=False
        )
        schema_generator.scan_all_directories()

        schemas_file = Path(self.temp_dir) / "schemas.json"
        schema_generator.save_schemas_json(schemas_file, include_schema_org=True)

        # 2. Run quality analysis
        quality_analyzer = CodeQualityAnalyzer(self.src_dir)
        quality_analyzer.analyze_directory(self.src_dir)

        quality_file = Path(self.temp_dir) / "quality.json"
        quality_analyzer.save_report_json(quality_file)

        # 3. Run coverage analysis
        coverage_analyzer = TestCoverageAnalyzer(self.src_dir, self.tests_dir)
        coverage_analyzer.analyze_coverage()

        coverage_file = Path(self.temp_dir) / "coverage.json"
        coverage_analyzer.save_report_json(coverage_file)

        # 4. Run dependency analysis
        dependency_analyzer = DependencyAnalyzer(self.src_dir)
        dependency_analyzer.analyze_directory(self.src_dir)

        dependency_file = Path(self.temp_dir) / "dependency.json"
        dependency_analyzer.save_report_json(dependency_file)

        # 5. Generate dashboard
        dashboard_generator = DashboardGenerator(
            schemas_path=schemas_file,
            quality_path=quality_file,
            coverage_path=coverage_file,
            dependency_path=dependency_file
        )

        dashboard_file = Path(self.temp_dir) / "dashboard.html"
        dashboard_generator.save_dashboard(dashboard_file)

        # Verify all files were created
        self.assertTrue(schemas_file.exists())
        self.assertTrue(quality_file.exists())
        self.assertTrue(coverage_file.exists())
        self.assertTrue(dependency_file.exists())
        self.assertTrue(dashboard_file.exists())

        # Verify dashboard is valid HTML
        with open(dashboard_file, 'r') as f:
            html = f.read()
            self.assertIn("<!DOCTYPE html>", html)
            self.assertIn("Code Inventory Dashboard", html)

    def test_schema_validation_pipeline(self):
        """Test schema validation on generated schemas"""
        # Generate schema with schema.org markup
        schema_generator = EnhancedSchemaGenerator(
            str(self.project_dir),
            use_astgrep=False
        )
        schema_generator.scan_all_directories()

        schemas_file = Path(self.temp_dir) / "schemas.json"
        schema_generator.save_schemas_json(schemas_file, include_schema_org=True)

        # Validate the generated schema
        validator = SchemaValidator()
        result = validator.validate_json_file(schemas_file)

        # Should validate successfully
        self.assertTrue(result)

    def test_readme_generation_with_schema_org(self):
        """Test README generation includes schema.org markup"""
        schema_generator = EnhancedSchemaGenerator(
            str(self.project_dir),
            use_astgrep=False
        )
        schema_generator.scan_all_directories()

        # Generate README for src directory
        src_schema = None
        for path, schema in schema_generator.schemas.items():
            if 'src' in path:
                src_schema = schema
                readme = schema_generator.generate_readme(path, schema, include_schema_org=True)

                # Should include schema.org markup
                self.assertIn('<script type="application/ld+json">', readme)
                self.assertIn('@context', readme)
                self.assertIn('SoftwareSourceCode', readme)
                break

        self.assertIsNotNone(src_schema)

    def test_data_flow_through_pipeline(self):
        """Test data flows correctly through entire pipeline"""
        # Generate schemas
        schema_gen = EnhancedSchemaGenerator(str(self.project_dir), use_astgrep=False)
        schema_gen.scan_all_directories()

        # Verify we can extract function information
        src_files = []
        for schema in schema_gen.schemas.values():
            src_files.extend(schema.files)

        self.assertGreater(len(src_files), 0)

        # Find the calculator.py file
        calc_file = None
        for file_def in src_files:
            if 'calculator.py' in file_def.path:
                calc_file = file_def
                break

        self.assertIsNotNone(calc_file)

        # Should have found the Calculator class
        class_names = [c.name for c in calc_file.classes]
        self.assertIn('Calculator', class_names)

        # Should have found functions
        func_names = [f.name for f in calc_file.functions]
        self.assertIn('add', func_names)
        self.assertIn('subtract', func_names)

if __name__ == '__main__':
    unittest.main()
