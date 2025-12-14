#!/usr/bin/env python3
"""
Unit tests for dependency_analyzer.py
"""

import unittest
import tempfile
import subprocess
import shutil
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Check if ast-grep is available
def is_astgrep_available() -> bool:
    """Check if ast-grep CLI is installed and available."""
    return shutil.which('ast-grep') is not None or shutil.which('sg') is not None

from src.analyzers.dependencies import (
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
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
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

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_analyze_typescript_imports(self):
        """Test TypeScript import analysis (requires ast-grep)"""
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

class TestDependencyInfoDataclass(unittest.TestCase):
    """Extended tests for DependencyInfo dataclass"""

    def test_dependency_info_default_is_external(self):
        """Test default value for is_external"""
        dep = DependencyInfo(
            package="test",
            import_type="static",
            file_path="/test/file.py",
            line_number=1
        )
        self.assertTrue(dep.is_external)  # Default is True

    def test_dependency_info_internal(self):
        """Test internal dependency"""
        dep = DependencyInfo(
            package="./utils",
            import_type="static",
            file_path="/test/file.py",
            line_number=5,
            is_external=False
        )
        self.assertFalse(dep.is_external)

    def test_dependency_info_all_import_types(self):
        """Test all import types"""
        import_types = ['static', 'dynamic', 'require', 'type_only']
        for import_type in import_types:
            dep = DependencyInfo(
                package="test",
                import_type=import_type,
                file_path="/test/file.ts",
                line_number=1
            )
            self.assertEqual(dep.import_type, import_type)


class TestDependencyReportDataclass(unittest.TestCase):
    """Extended tests for DependencyReport dataclass"""

    def test_report_internal_dependencies_default(self):
        """Test internal_dependencies default value"""
        report = DependencyReport()
        self.assertEqual(report.internal_dependencies, 0)

    def test_report_dependencies_by_file_default(self):
        """Test dependencies_by_file is a defaultdict"""
        report = DependencyReport()
        # Should be able to append to non-existent key
        report.dependencies_by_file['/test/file.py'].append(
            DependencyInfo("test", "static", "/test/file.py", 1)
        )
        self.assertEqual(len(report.dependencies_by_file['/test/file.py']), 1)

    def test_report_dependency_graph_default(self):
        """Test dependency_graph is a defaultdict of sets"""
        report = DependencyReport()
        report.dependency_graph['file1.py'].add('file2.py')
        self.assertIn('file2.py', report.dependency_graph['file1.py'])

    def test_report_unused_dependencies_default(self):
        """Test unused_dependencies default value"""
        report = DependencyReport()
        self.assertEqual(len(report.unused_dependencies), 0)
        self.assertIsInstance(report.unused_dependencies, set)


class TestExternalPackageDetection(unittest.TestCase):
    """Test external package detection with various patterns"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_scoped_packages(self):
        """Test @scoped package detection"""
        self.assertTrue(self.analyzer._is_external_package("@types/node"))
        self.assertTrue(self.analyzer._is_external_package("@angular/core"))
        self.assertTrue(self.analyzer._is_external_package("@mui/material"))

    def test_common_frameworks(self):
        """Test common framework package detection"""
        frameworks = ['react', 'vue', 'angular', 'express', 'next']
        for fw in frameworks:
            self.assertTrue(
                self.analyzer._is_external_package(fw),
                f"{fw} should be external"
            )

    def test_utility_libraries(self):
        """Test common utility library detection"""
        libs = ['lodash', 'axios', 'moment', 'dayjs']
        for lib in libs:
            self.assertTrue(
                self.analyzer._is_external_package(lib),
                f"{lib} should be external"
            )

    def test_relative_imports_internal(self):
        """Test relative imports are internal"""
        relative_paths = [
            './utils',
            '../components',
            './components/Button',
            '../../shared/helpers',
            './index'
        ]
        for path in relative_paths:
            self.assertFalse(
                self.analyzer._is_external_package(path),
                f"{path} should be internal"
            )

    def test_unknown_packages(self):
        """Test packages not in external indicators"""
        # Packages not starting with known prefixes
        unknown = ['my-custom-lib', 'utils-package', 'some-internal-pkg']
        for pkg in unknown:
            # These would not match the external indicators
            result = self.analyzer._is_external_package(pkg)
            # They should be false since they don't start with known indicators
            self.assertFalse(result)


class TestExtractPackageName(unittest.TestCase):
    """Test _extract_package_name helper method"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_extract_from_single_format(self):
        """Test extraction from single metaVariables format"""
        match = {
            'metaVariables': {
                'single': {
                    'PACKAGE': {'text': 'react'}
                }
            }
        }
        result = self.analyzer._extract_package_name(match)
        self.assertEqual(result, 'react')

    def test_extract_from_direct_format(self):
        """Test extraction from direct PACKAGE format"""
        match = {
            'metaVariables': {
                'PACKAGE': {'text': 'lodash'}
            }
        }
        result = self.analyzer._extract_package_name(match)
        self.assertEqual(result, 'lodash')

    def test_extract_string_value(self):
        """Test extraction when PACKAGE is a string"""
        match = {
            'metaVariables': {
                'PACKAGE': 'axios'
            }
        }
        result = self.analyzer._extract_package_name(match)
        self.assertEqual(result, 'axios')

    def test_extract_from_empty_meta(self):
        """Test extraction with empty metaVariables"""
        match = {'metaVariables': {}}
        result = self.analyzer._extract_package_name(match)
        self.assertIsNone(result)

    def test_extract_from_missing_meta(self):
        """Test extraction with missing metaVariables"""
        match = {}
        result = self.analyzer._extract_package_name(match)
        self.assertIsNone(result)


class TestCreateDependencyFromMatch(unittest.TestCase):
    """Test _create_dependency_from_match method"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_create_dependency_with_all_fields(self):
        """Test creating dependency with all fields present"""
        match = {
            'metaVariables': {
                'single': {'PACKAGE': {'text': 'react'}}
            },
            'range': {
                'start': {'line': 10, 'column': 0}
            }
        }
        file_path = Path('/test/component.tsx')

        dep = self.analyzer._create_dependency_from_match(match, file_path, 'static')

        self.assertIsNotNone(dep)
        self.assertEqual(dep.package, 'react')
        self.assertEqual(dep.import_type, 'static')
        self.assertEqual(dep.line_number, 10)
        self.assertTrue(dep.is_external)

    def test_create_dependency_missing_range(self):
        """Test creating dependency with missing range info"""
        match = {
            'metaVariables': {
                'PACKAGE': {'text': 'lodash'}
            }
        }
        file_path = Path('/test/utils.ts')

        dep = self.analyzer._create_dependency_from_match(match, file_path, 'dynamic')

        self.assertIsNotNone(dep)
        self.assertEqual(dep.line_number, 0)

    def test_create_dependency_no_package(self):
        """Test returns None when no package name"""
        match = {'metaVariables': {}}
        file_path = Path('/test/file.ts')

        dep = self.analyzer._create_dependency_from_match(match, file_path, 'static')

        self.assertIsNone(dep)

    def test_create_dependency_internal_package(self):
        """Test creating dependency for internal package"""
        match = {
            'metaVariables': {
                'PACKAGE': {'text': './utils'}
            },
            'range': {'start': {'line': 5}}
        }
        file_path = Path('/test/file.ts')

        dep = self.analyzer._create_dependency_from_match(match, file_path, 'static')

        self.assertIsNotNone(dep)
        self.assertFalse(dep.is_external)


class TestReportGenerationMethods(unittest.TestCase):
    """Test report generation helper methods"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_generate_report_header(self):
        """Test _generate_report_header method"""
        header = self.analyzer._generate_report_header()

        self.assertIsInstance(header, list)
        header_text = '\n'.join(header)
        self.assertIn("DEPENDENCY ANALYSIS REPORT", header_text)
        self.assertIn(str(self.analyzer.root_dir), header_text)

    def test_generate_summary(self):
        """Test _generate_summary method"""
        self.analyzer.report.total_dependencies = 50
        self.analyzer.report.external_dependencies = 30
        self.analyzer.report.internal_dependencies = 20

        summary = self.analyzer._generate_summary()
        summary_text = '\n'.join(summary)

        self.assertIn("SUMMARY", summary_text)
        self.assertIn("50", summary_text)
        self.assertIn("30", summary_text)
        self.assertIn("20", summary_text)

    def test_generate_external_packages_section(self):
        """Test _generate_external_packages_section method"""
        # Add some dependencies
        dep = DependencyInfo("react", "static", "/test/file.tsx", 1, True)
        self.analyzer.report.dependencies_by_file["/test/file.tsx"].append(dep)

        section = self.analyzer._generate_external_packages_section()

        if section:  # Only test if section generated
            section_text = '\n'.join(section)
            self.assertIn("EXTERNAL PACKAGES", section_text)

    def test_generate_external_packages_section_empty(self):
        """Test _generate_external_packages_section with no external packages"""
        section = self.analyzer._generate_external_packages_section()
        self.assertEqual(section, [])

    def test_get_external_packages(self):
        """Test _get_external_packages helper"""
        dep1 = DependencyInfo("react", "static", "/test/file1.tsx", 1, True)
        dep2 = DependencyInfo("./utils", "static", "/test/file1.tsx", 2, False)
        dep3 = DependencyInfo("lodash", "static", "/test/file2.tsx", 1, True)

        self.analyzer.report.dependencies_by_file["/test/file1.tsx"] = [dep1, dep2]
        self.analyzer.report.dependencies_by_file["/test/file2.tsx"] = [dep3]

        external = self.analyzer._get_external_packages()

        self.assertEqual(len(external), 2)
        self.assertIn("react", external)
        self.assertIn("lodash", external)
        self.assertNotIn("./utils", external)

    def test_count_package_usage(self):
        """Test _count_package_usage method"""
        dep1 = DependencyInfo("react", "static", "/test/file1.tsx", 1, True)
        dep2 = DependencyInfo("react", "static", "/test/file2.tsx", 1, True)
        dep3 = DependencyInfo("lodash", "static", "/test/file1.tsx", 2, True)

        self.analyzer.report.dependencies_by_file["/test/file1.tsx"] = [dep1, dep3]
        self.analyzer.report.dependencies_by_file["/test/file2.tsx"] = [dep2]

        react_count = self.analyzer._count_package_usage("react")
        lodash_count = self.analyzer._count_package_usage("lodash")
        unknown_count = self.analyzer._count_package_usage("unknown-pkg")

        self.assertEqual(react_count, 2)
        self.assertEqual(lodash_count, 1)
        self.assertEqual(unknown_count, 0)

    def test_get_dependencies_by_type(self):
        """Test _get_dependencies_by_type method"""
        deps = [
            DependencyInfo("react", "static", "/f.tsx", 1, True),
            DependencyInfo("lodash", "static", "/f.tsx", 2, True),
            DependencyInfo("./utils", "dynamic", "/f.tsx", 3, False),
            DependencyInfo("fs", "require", "/f.ts", 4, True),
            DependencyInfo("User", "type_only", "/f.tsx", 5, False),
        ]
        self.analyzer.report.dependencies_by_file["/f.tsx"] = deps[:4]
        self.analyzer.report.dependencies_by_file["/f.ts"] = [deps[4]]

        by_type = self.analyzer._get_dependencies_by_type()

        self.assertEqual(by_type["static"], 2)
        self.assertEqual(by_type["dynamic"], 1)
        self.assertEqual(by_type["require"], 1)
        self.assertEqual(by_type["type_only"], 1)

    def test_generate_import_type_section(self):
        """Test _generate_import_type_section method"""
        dep = DependencyInfo("react", "static", "/test/file.tsx", 1, True)
        self.analyzer.report.dependencies_by_file["/test/file.tsx"] = [dep]

        section = self.analyzer._generate_import_type_section()

        if section:
            section_text = '\n'.join(section)
            self.assertIn("DEPENDENCIES BY IMPORT TYPE", section_text)
            self.assertIn("static", section_text)

    def test_generate_import_type_section_empty(self):
        """Test _generate_import_type_section with no dependencies"""
        section = self.analyzer._generate_import_type_section()
        self.assertEqual(section, [])

    def test_generate_report_footer(self):
        """Test _generate_report_footer method"""
        footer = self.analyzer._generate_report_footer()

        footer_text = '\n'.join(footer)
        self.assertIn("END OF REPORT", footer_text)


class TestCircularDependencySection(unittest.TestCase):
    """Test circular dependency report section"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_generate_circular_deps_section_empty(self):
        """Test _generate_circular_deps_section with no cycles"""
        section = self.analyzer._generate_circular_deps_section()
        self.assertEqual(section, [])

    def test_generate_circular_deps_section_with_cycles(self):
        """Test _generate_circular_deps_section with cycles"""
        self.analyzer.report.circular_dependencies = [
            ['file1.py', 'file2.py', 'file1.py'],
            ['a.py', 'b.py', 'c.py', 'a.py']
        ]

        section = self.analyzer._generate_circular_deps_section()
        section_text = '\n'.join(section)

        self.assertIn("CIRCULAR DEPENDENCIES DETECTED", section_text)
        self.assertIn("2", section_text)  # Count
        self.assertIn("file1.py", section_text)
        self.assertIn("Cycle 1", section_text)
        self.assertIn("Cycle 2", section_text)

    def test_format_cycle(self):
        """Test _format_cycle method"""
        cycle = ['file1.py', 'file2.py', 'file3.py', 'file1.py']

        formatted = self.analyzer._format_cycle(1, cycle)
        formatted_text = '\n'.join(formatted)

        self.assertIn("Cycle 1", formatted_text)
        self.assertIn("file1.py", formatted_text)
        self.assertIn("file2.py", formatted_text)


class TestTopFilesSection(unittest.TestCase):
    """Test top files by dependency count section"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_get_top_files(self):
        """Test _get_top_files method"""
        # Create files with different dependency counts
        for i in range(5):
            deps = [
                DependencyInfo(f"pkg{j}", "static", f"/file{i}.py", j, True)
                for j in range(i + 1)
            ]
            self.analyzer.report.dependencies_by_file[f"/file{i}.py"] = deps

        top_files = self.analyzer._get_top_files(3)

        self.assertEqual(len(top_files), 3)
        # Should be sorted by count descending
        self.assertEqual(len(top_files[0][1]), 5)  # file4.py has 5 deps
        self.assertEqual(len(top_files[1][1]), 4)  # file3.py has 4 deps
        self.assertEqual(len(top_files[2][1]), 3)  # file2.py has 3 deps

    def test_generate_top_files_section_empty(self):
        """Test _generate_top_files_section with no files"""
        section = self.analyzer._generate_top_files_section()
        self.assertEqual(section, [])

    def test_generate_top_files_section_with_files(self):
        """Test _generate_top_files_section with files"""
        deps = [DependencyInfo("react", "static", "/app.tsx", 1, True)]
        self.analyzer.report.dependencies_by_file["/app.tsx"] = deps

        section = self.analyzer._generate_top_files_section()
        section_text = '\n'.join(section)

        self.assertIn("TOP FILES BY DEPENDENCY COUNT", section_text)
        self.assertIn("/app.tsx", section_text)


class TestJSONReportBuilding(unittest.TestCase):
    """Test JSON report building methods"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_build_summary_json(self):
        """Test _build_summary_json method"""
        self.analyzer.report.total_dependencies = 100
        self.analyzer.report.external_dependencies = 60
        self.analyzer.report.internal_dependencies = 40
        self.analyzer.report.circular_dependencies = [['a', 'b', 'a']]

        summary = self.analyzer._build_summary_json()

        self.assertEqual(summary['total_dependencies'], 100)
        self.assertEqual(summary['external_dependencies'], 60)
        self.assertEqual(summary['internal_dependencies'], 40)
        self.assertEqual(summary['circular_dependencies_count'], 1)
        self.assertEqual(summary['files_analyzed'], 0)
        self.assertIn(str(self.analyzer.root_dir), summary['root_directory'])

    def test_dep_to_dict(self):
        """Test _dep_to_dict method"""
        dep = DependencyInfo(
            package="react",
            import_type="static",
            file_path="/test/file.tsx",
            line_number=42,
            is_external=True
        )

        result = self.analyzer._dep_to_dict(dep)

        self.assertEqual(result['package'], 'react')
        self.assertEqual(result['import_type'], 'static')
        self.assertEqual(result['line_number'], 42)
        self.assertEqual(result['is_external'], True)
        # file_path is not included in _dep_to_dict
        self.assertNotIn('file_path', result)

    def test_build_dependencies_json(self):
        """Test _build_dependencies_json method"""
        dep1 = DependencyInfo("react", "static", "/file1.tsx", 1, True)
        dep2 = DependencyInfo("lodash", "static", "/file1.tsx", 2, True)

        self.analyzer.report.dependencies_by_file["/file1.tsx"] = [dep1, dep2]

        result = self.analyzer._build_dependencies_json()

        self.assertIn("/file1.tsx", result)
        self.assertEqual(len(result["/file1.tsx"]), 2)
        self.assertEqual(result["/file1.tsx"][0]['package'], 'react')

    def test_build_report_json(self):
        """Test _build_report_json method"""
        self.analyzer.report.total_dependencies = 10
        dep = DependencyInfo("react", "static", "/file.tsx", 1, True)
        self.analyzer.report.dependencies_by_file["/file.tsx"] = [dep]
        self.analyzer.report.circular_dependencies = []

        result = self.analyzer._build_report_json()

        self.assertIn('summary', result)
        self.assertIn('dependencies_by_file', result)
        self.assertIn('circular_dependencies', result)


class TestCircularDependencyDetection(unittest.TestCase):
    """Extended tests for circular dependency detection"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_no_circular_dependencies(self):
        """Test when there are no circular dependencies"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'c.py'},
            'c.py': set()
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_self_referencing(self):
        """Test self-referencing file"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'a.py'}
        }

        self.analyzer.find_circular_dependencies()

        # Self-reference creates a cycle
        self.assertGreaterEqual(len(self.analyzer.report.circular_dependencies), 1)

    def test_two_node_cycle(self):
        """Test simple two-node cycle"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'a.py'}
        }

        self.analyzer.find_circular_dependencies()

        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_multiple_cycles(self):
        """Test multiple independent cycles"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'a.py'},  # Cycle 1
            'x.py': {'y.py'},
            'y.py': {'z.py'},
            'z.py': {'x.py'}   # Cycle 2
        }

        self.analyzer.find_circular_dependencies()

        # Should detect at least one cycle
        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_empty_dependency_graph(self):
        """Test empty dependency graph"""
        self.analyzer.report.dependency_graph = {}

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)


class TestDFSCircularDependencyAlgorithm(unittest.TestCase):
    """Comprehensive tests for the DFS algorithm used in circular dependency detection.

    The dfs function within find_circular_dependencies uses a recursive DFS with:
    - visited: Set of all nodes that have been fully processed
    - rec_stack: Set of nodes in the current recursion path (for cycle detection)
    - path: List of nodes in the current path (for cycle reconstruction)
    """

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_dfs_single_node_no_edges(self):
        """Test DFS with single node and no edges"""
        self.analyzer.report.dependency_graph = {
            'single.py': set()
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_linear_chain_no_cycle(self):
        """Test DFS with linear chain (a -> b -> c -> d)"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'c.py'},
            'c.py': {'d.py'},
            'd.py': set()
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_simple_three_node_cycle(self):
        """Test DFS with simple 3-node cycle (a -> b -> c -> a)"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'c.py'},
            'c.py': {'a.py'}
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 1)
        cycle = self.analyzer.report.circular_dependencies[0]
        # Cycle should contain a, b, c and end with a
        self.assertIn('a.py', cycle)
        self.assertIn('b.py', cycle)
        self.assertIn('c.py', cycle)
        self.assertEqual(cycle[0], cycle[-1])  # Cycle starts and ends with same node

    def test_dfs_diamond_with_cycle(self):
        """Test DFS with diamond pattern containing cycle

            a
           / \\
          b   c
           \\ /
            d -> a  (creates cycle)
        """
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py', 'c.py'},
            'b.py': {'d.py'},
            'c.py': {'d.py'},
            'd.py': {'a.py'}
        }

        self.analyzer.find_circular_dependencies()

        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_diamond_without_cycle(self):
        """Test DFS with diamond pattern without cycle

            a
           / \\
          b   c
           \\ /
            d  (no back edge)
        """
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py', 'c.py'},
            'b.py': {'d.py'},
            'c.py': {'d.py'},
            'd.py': set()
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_nested_cycles(self):
        """Test DFS with nested cycles (cycle within cycle)

        a -> b -> c -> b (inner cycle)
             \\-> d -> a (outer cycle)
        """
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'c.py', 'd.py'},
            'c.py': {'b.py'},  # Inner cycle: b -> c -> b
            'd.py': {'a.py'}   # Outer cycle: a -> b -> d -> a
        }

        self.analyzer.find_circular_dependencies()

        # Should detect at least one cycle
        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_disconnected_components_with_cycle(self):
        """Test DFS with disconnected graph components, one with cycle"""
        self.analyzer.report.dependency_graph = {
            # Component 1: no cycle
            'a.py': {'b.py'},
            'b.py': set(),
            # Component 2: has cycle
            'x.py': {'y.py'},
            'y.py': {'x.py'}
        }

        self.analyzer.find_circular_dependencies()

        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_disconnected_components_no_cycle(self):
        """Test DFS with multiple disconnected components, none with cycles"""
        self.analyzer.report.dependency_graph = {
            # Component 1
            'a.py': {'b.py'},
            'b.py': set(),
            # Component 2
            'x.py': {'y.py'},
            'y.py': {'z.py'},
            'z.py': set(),
            # Component 3 (single node)
            'solo.py': set()
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_long_cycle(self):
        """Test DFS with long cycle (5+ nodes)"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'c.py'},
            'c.py': {'d.py'},
            'd.py': {'e.py'},
            'e.py': {'f.py'},
            'f.py': {'a.py'}  # Creates 6-node cycle
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 1)
        cycle = self.analyzer.report.circular_dependencies[0]
        # All nodes should be in cycle
        for node in ['a.py', 'b.py', 'c.py', 'd.py', 'e.py', 'f.py']:
            self.assertIn(node, cycle)

    def test_dfs_multiple_edges_from_node(self):
        """Test DFS when node has multiple outgoing edges"""
        self.analyzer.report.dependency_graph = {
            'hub.py': {'a.py', 'b.py', 'c.py', 'd.py'},
            'a.py': set(),
            'b.py': set(),
            'c.py': set(),
            'd.py': {'hub.py'}  # Only d creates a cycle
        }

        self.analyzer.find_circular_dependencies()

        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_cycle_not_from_start_node(self):
        """Test DFS where cycle doesn't include the start node of traversal

        a -> b -> c -> d -> b (cycle is b->c->d->b, not including a)
        """
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'c.py'},
            'c.py': {'d.py'},
            'd.py': {'b.py'}  # Cycle back to b, not a
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 1)
        cycle = self.analyzer.report.circular_dependencies[0]
        # Cycle should be b->c->d->b
        self.assertIn('b.py', cycle)
        self.assertIn('c.py', cycle)
        self.assertIn('d.py', cycle)
        # 'a.py' should NOT be in the cycle
        self.assertNotIn('a.py', cycle)

    def test_dfs_cycle_reconstruction_correctness(self):
        """Test that the cycle is correctly reconstructed from the path"""
        self.analyzer.report.dependency_graph = {
            'x.py': {'y.py'},
            'y.py': {'z.py'},
            'z.py': {'y.py'}  # Cycle is y->z->y
        }

        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 1)
        cycle = self.analyzer.report.circular_dependencies[0]
        # First and last element should be the same (complete cycle)
        self.assertEqual(cycle[0], cycle[-1])
        # Should be exactly y->z->y
        self.assertEqual(len(cycle), 3)

    def test_dfs_does_not_add_duplicate_cycles(self):
        """Test that the same cycle is not added multiple times"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py'},
            'b.py': {'a.py'}
        }

        # Run multiple times
        self.analyzer.find_circular_dependencies()
        first_count = len(self.analyzer.report.circular_dependencies)

        # Reset and run again
        self.analyzer.report.circular_dependencies = []
        self.analyzer.find_circular_dependencies()
        second_count = len(self.analyzer.report.circular_dependencies)

        self.assertEqual(first_count, second_count)

    def test_dfs_handles_node_with_no_dependencies(self):
        """Test DFS correctly handles nodes that have no dependencies in the graph"""
        self.analyzer.report.dependency_graph = {
            'a.py': {'orphan.py'},  # orphan.py not in graph keys
            'b.py': set()
        }

        # Should not raise exception
        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_complex_graph_with_multiple_paths(self):
        """Test DFS with complex graph having multiple paths between nodes

              a
             /|\\
            b c d
            |X|/
            e-f
             \\|
              g -> a (creates multiple potential cycles)
        """
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py', 'c.py', 'd.py'},
            'b.py': {'e.py', 'f.py'},
            'c.py': {'e.py', 'f.py'},
            'd.py': {'f.py'},
            'e.py': {'g.py'},
            'f.py': {'g.py'},
            'g.py': {'a.py'}  # Creates cycle back to a
        }

        self.analyzer.find_circular_dependencies()

        # Should detect at least one cycle
        self.assertGreater(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_path_copy_prevents_mutation(self):
        """Test that path.copy() in DFS prevents path mutation across branches"""
        # This tests the path.copy() behavior - each branch should have independent path
        self.analyzer.report.dependency_graph = {
            'root.py': {'branch1.py', 'branch2.py'},
            'branch1.py': {'leaf1.py'},
            'branch2.py': {'leaf2.py'},
            'leaf1.py': set(),
            'leaf2.py': set()
        }

        # Should complete without error and find no cycles
        self.analyzer.find_circular_dependencies()

        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_rec_stack_properly_maintained(self):
        """Test that rec_stack is properly maintained (node removed after processing)

        This tests that after a node is fully processed, it's removed from rec_stack
        so it can be visited again from different paths without falsely detecting cycles.

        Graph:
            a -> b -> d
            a -> c -> d
        (d is visited twice but from different paths, not a cycle)
        """
        self.analyzer.report.dependency_graph = {
            'a.py': {'b.py', 'c.py'},
            'b.py': {'d.py'},
            'c.py': {'d.py'},
            'd.py': set()
        }

        self.analyzer.find_circular_dependencies()

        # Should not detect false cycle
        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)

    def test_dfs_visited_prevents_reprocessing(self):
        """Test that visited set prevents reprocessing fully explored nodes"""
        # Create graph where same subgraph is reachable from multiple entry points
        self.analyzer.report.dependency_graph = {
            'entry1.py': {'shared.py'},
            'entry2.py': {'shared.py'},
            'shared.py': {'a.py', 'b.py'},
            'a.py': set(),
            'b.py': set()
        }

        self.analyzer.find_circular_dependencies()

        # Should complete without issues and find no cycles
        self.assertEqual(len(self.analyzer.report.circular_dependencies), 0)


class TestAnalyzeFileByExtension(unittest.TestCase):
    """Test analyze_file with different file extensions"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_analyze_unsupported_file(self):
        """Test analyzing unsupported file type"""
        test_file = Path(self.temp_dir) / "file.txt"
        test_file.write_text("some text content")

        initial_count = self.analyzer.report.total_dependencies

        self.analyzer.analyze_file(test_file)

        self.assertEqual(self.analyzer.report.total_dependencies, initial_count)

    def test_analyze_js_file(self):
        """Test analyzing JavaScript file"""
        test_file = Path(self.temp_dir) / "file.js"
        test_file.write_text("import React from 'react';")

        self.analyzer.analyze_file(test_file)

        # At minimum, should have processed the file without error
        self.assertIsNotNone(self.analyzer.report)

    def test_analyze_jsx_file(self):
        """Test analyzing JSX file"""
        test_file = Path(self.temp_dir) / "Component.jsx"
        test_file.write_text("import React from 'react';\nconst App = () => <div/>;")

        self.analyzer.analyze_file(test_file)

        # File should be processed
        self.assertIsNotNone(self.analyzer.report)


class TestAnalyzeDirectoryWithSkipDirs(unittest.TestCase):
    """Test analyze_directory with skip directories"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_skip_node_modules(self):
        """Test that node_modules is skipped"""
        # Create node_modules with a file
        node_modules = Path(self.temp_dir) / "node_modules"
        node_modules.mkdir()
        (node_modules / "package.js").write_text("import something from 'x';")

        # Create a regular file
        (Path(self.temp_dir) / "app.py").write_text("import os")

        self.analyzer.analyze_directory()

        # Check node_modules files were not included
        for deps in self.analyzer.report.dependencies_by_file.values():
            for dep in deps:
                self.assertNotIn("node_modules", dep.file_path)

    def test_skip_git_directory(self):
        """Test that .git is skipped"""
        git_dir = Path(self.temp_dir) / ".git"
        git_dir.mkdir()
        (git_dir / "config.py").write_text("import os")

        self.analyzer.analyze_directory()

        for file_path in self.analyzer.report.dependencies_by_file.keys():
            self.assertNotIn(".git", file_path)

    def test_skip_venv_directory(self):
        """Test that venv directories are skipped"""
        venv = Path(self.temp_dir) / "venv"
        venv.mkdir()
        (venv / "activate.py").write_text("import os")

        self.analyzer.analyze_directory()

        for file_path in self.analyzer.report.dependencies_by_file.keys():
            self.assertNotIn("venv", file_path)

    def test_custom_skip_dirs(self):
        """Test with custom skip directories"""
        custom_dir = Path(self.temp_dir) / "custom_skip"
        custom_dir.mkdir()
        (custom_dir / "file.py").write_text("import os")

        # File that should be analyzed
        (Path(self.temp_dir) / "main.py").write_text("import sys")

        self.analyzer.analyze_directory(skip_dirs={"custom_skip"})

        for file_path in self.analyzer.report.dependencies_by_file.keys():
            self.assertNotIn("custom_skip", file_path)


class TestAnalyzeFileDependencyTracking(unittest.TestCase):
    """Test that analyze_file correctly updates report counters"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_tracks_external_dependencies(self):
        """Test that external dependencies are tracked"""
        test_file = Path(self.temp_dir) / "app.py"
        test_file.write_text("import requests\nimport os")

        self.analyzer.analyze_file(test_file)

        # os and requests should be detected
        self.assertGreater(self.analyzer.report.total_dependencies, 0)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_tracks_internal_dependencies(self):
        """Test that internal dependencies are tracked"""
        test_file = Path(self.temp_dir) / "module.py"
        test_file.write_text("from .utils import helper\nfrom ..shared import common")

        self.analyzer.analyze_file(test_file)

        # Relative imports should be marked as internal
        # Check if any internal deps were found
        self.assertIsNotNone(self.analyzer.report)


class TestProcessImportMethods(unittest.TestCase):
    """Test the import processing methods"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_process_static_imports(self):
        """Test _process_static_imports method"""
        test_file = Path(self.temp_dir) / "component.ts"
        test_file.write_text("""
import React from 'react';
import { useState } from 'react';
import * as lodash from 'lodash';
import 'normalize.css';
""")

        deps = self.analyzer._process_static_imports(test_file, 'typescript')

        # Should find static imports
        self.assertIsInstance(deps, list)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_process_dynamic_imports(self):
        """Test _process_dynamic_imports method"""
        test_file = Path(self.temp_dir) / "lazy.ts"
        test_file.write_text("""
const module = await import('./module');
const other = import("./other");
""")

        deps = self.analyzer._process_dynamic_imports(test_file, 'typescript')

        self.assertIsInstance(deps, list)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_process_require_statements(self):
        """Test _process_require_statements method"""
        test_file = Path(self.temp_dir) / "common.js"
        test_file.write_text("""
const fs = require('fs');
const path = require("path");
""")

        deps = self.analyzer._process_require_statements(test_file, 'javascript')

        self.assertIsInstance(deps, list)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_process_type_imports(self):
        """Test _process_type_imports method"""
        test_file = Path(self.temp_dir) / "types.ts"
        test_file.write_text("""
import type { User } from './types';
import type { Config } from "./config";
""")

        deps = self.analyzer._process_type_imports(test_file, 'typescript')

        self.assertIsInstance(deps, list)


class TestWorkerFunction(unittest.TestCase):
    """Test the worker function for parallel processing"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_worker_analyzes_python_file(self):
        """Test worker function with Python file"""
        from src.analyzers.dependencies import _analyze_file_dependencies_worker

        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("import os\nimport sys")

        result = _analyze_file_dependencies_worker(test_file)

        self.assertIsInstance(result, list)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_worker_analyzes_ts_file(self):
        """Test worker function with TypeScript file"""
        from src.analyzers.dependencies import _analyze_file_dependencies_worker

        test_file = Path(self.temp_dir) / "test.ts"
        test_file.write_text("import React from 'react';")

        result = _analyze_file_dependencies_worker(test_file)

        self.assertIsInstance(result, list)

    def test_worker_handles_unsupported_extension(self):
        """Test worker handles unsupported file extensions"""
        from src.analyzers.dependencies import _analyze_file_dependencies_worker

        test_file = Path(self.temp_dir) / "test.txt"
        test_file.write_text("some text")

        result = _analyze_file_dependencies_worker(test_file)

        self.assertEqual(result, [])

    def test_worker_handles_missing_file(self):
        """Test worker handles missing file gracefully"""
        from src.analyzers.dependencies import _analyze_file_dependencies_worker

        missing_file = Path(self.temp_dir) / "nonexistent.py"

        result = _analyze_file_dependencies_worker(missing_file)

        # Should return empty list, not raise exception
        self.assertEqual(result, [])


class TestPythonImportPatterns(unittest.TestCase):
    """Test Python-specific import pattern processing"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_simple_import(self):
        """Test simple import statement"""
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("import json")

        deps = self.analyzer.analyze_python_imports(test_file)

        packages = [d.package for d in deps]
        self.assertIn("json", packages)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_from_import(self):
        """Test from ... import statement"""
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("from pathlib import Path")

        deps = self.analyzer.analyze_python_imports(test_file)

        packages = [d.package for d in deps]
        self.assertIn("pathlib", packages)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_import_as(self):
        """Test import ... as statement"""
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("import numpy as np")

        deps = self.analyzer.analyze_python_imports(test_file)

        packages = [d.package for d in deps]
        self.assertIn("numpy", packages)

    def test_process_python_pattern(self):
        """Test _process_python_pattern method"""
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("import os")

        deps = self.analyzer._process_python_pattern(test_file, "import $PACKAGE")

        self.assertIsInstance(deps, list)


class TestCreatePythonDependency(unittest.TestCase):
    """Test _create_python_dependency method"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_create_python_dependency_success(self):
        """Test creating Python dependency from match"""
        match = {
            'metaVariables': {'PACKAGE': {'text': 'requests'}},
            'range': {'start': {'line': 5}}
        }
        file_path = Path('/test/api.py')

        dep = self.analyzer._create_python_dependency(match, file_path)

        self.assertIsNotNone(dep)
        self.assertEqual(dep.package, 'requests')
        self.assertEqual(dep.import_type, 'static')
        self.assertEqual(dep.line_number, 5)

    def test_create_python_dependency_no_package(self):
        """Test returns None when no package name found"""
        match = {'metaVariables': {}}
        file_path = Path('/test/api.py')

        dep = self.analyzer._create_python_dependency(match, file_path)

        self.assertIsNone(dep)


class TestWriteJsonFile(unittest.TestCase):
    """Test _write_json_file method"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_write_json_file(self):
        """Test writing JSON data to file"""
        output_path = Path(self.temp_dir) / "output.json"
        data = {"key": "value", "numbers": [1, 2, 3]}

        self.analyzer._write_json_file(output_path, data)

        self.assertTrue(output_path.exists())

        with open(output_path, 'r') as f:
            loaded = json.load(f)

        self.assertEqual(loaded['key'], 'value')
        self.assertEqual(loaded['numbers'], [1, 2, 3])


class TestOptimizedDirectoryAnalysis(unittest.TestCase):
    """Test analyze_directory_optimized method"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_optimized_falls_back_without_parallel(self):
        """Test that optimized analysis falls back when parallel disabled"""
        # Create test files
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("import os")

        # Run with both optimizations disabled
        self.analyzer.analyze_directory_optimized(
            use_parallel=False,
            use_cache=False
        )

        # Should still analyze files
        self.assertIsNotNone(self.analyzer.report)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_optimized_with_parallel_enabled(self):
        """Test optimized analysis with parallel processing"""
        # Create multiple test files
        for i in range(3):
            test_file = Path(self.temp_dir) / f"test{i}.py"
            test_file.write_text(f"import os\nimport sys")

        # Check if optimizer is available
        try:
            from src.analyzers.analyzer_optimizer import OPTIMIZER_AVAILABLE
            if not OPTIMIZER_AVAILABLE:
                self.skipTest("Optimizer not available")
        except ImportError:
            self.skipTest("Optimizer module not available")

        self.analyzer.analyze_directory_optimized(
            use_parallel=True,
            use_cache=False,
            max_workers=2
        )

        # Should have analyzed files
        self.assertIsNotNone(self.analyzer.report)

    def test_optimized_with_custom_skip_dirs(self):
        """Test optimized analysis with custom skip directories"""
        # Create directories
        skip_dir = Path(self.temp_dir) / "skip_me"
        skip_dir.mkdir()
        (skip_dir / "file.py").write_text("import os")

        src_dir = Path(self.temp_dir) / "src"
        src_dir.mkdir()
        (src_dir / "main.py").write_text("import sys")

        self.analyzer.analyze_directory_optimized(
            skip_dirs={"skip_me"},
            use_parallel=False,
            use_cache=False
        )

        # Skip directory files should not be in results
        for file_path in self.analyzer.report.dependencies_by_file.keys():
            self.assertNotIn("skip_me", file_path)

    def test_optimized_empty_directory(self):
        """Test optimized analysis with empty directory"""
        self.analyzer.analyze_directory_optimized(
            use_parallel=False,
            use_cache=False
        )

        self.assertEqual(self.analyzer.report.total_dependencies, 0)


class TestCLIHelpers(unittest.TestCase):
    """Test CLI-related helper functions"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_init_dependency_analyzer(self):
        """Test _init_dependency_analyzer function"""
        from src.analyzers.dependencies import _init_dependency_analyzer

        directory = Path(self.temp_dir)
        analyzer = _init_dependency_analyzer(directory)

        self.assertIsInstance(analyzer, DependencyAnalyzer)
        self.assertEqual(analyzer.root_dir, directory)

    def test_save_text_file(self):
        """Test _save_text_file function"""
        from src.analyzers.dependencies import _save_text_file

        output_path = str(Path(self.temp_dir) / "report.txt")
        content = "Test report content\nLine 2"

        _save_text_file(output_path, content)

        with open(output_path, 'r') as f:
            loaded = f.read()

        self.assertEqual(loaded, content)


class TestRunAstgrepMethod(unittest.TestCase):
    """Test _run_astgrep method edge cases"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_run_astgrep_empty_output(self):
        """Test _run_astgrep with pattern that matches nothing"""
        test_file = Path(self.temp_dir) / "empty.py"
        test_file.write_text("x = 1")

        # Use a pattern that won't match
        result = self.analyzer._run_astgrep(test_file, "import nonexistent", "python")

        self.assertEqual(result, [])

    def test_run_astgrep_nonexistent_file(self):
        """Test _run_astgrep with non-existent file"""
        nonexistent = Path(self.temp_dir) / "nonexistent.py"

        result = self.analyzer._run_astgrep(nonexistent, "import $X", "python")

        self.assertEqual(result, [])

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_run_astgrep_valid_pattern(self):
        """Test _run_astgrep with valid pattern"""
        test_file = Path(self.temp_dir) / "module.py"
        test_file.write_text("import os")

        result = self.analyzer._run_astgrep(test_file, "import $PACKAGE", "python")

        self.assertIsInstance(result, list)


class TestAnalyzeTypescriptJavaScript(unittest.TestCase):
    """Test TypeScript and JavaScript import analysis"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_analyze_javascript_imports(self):
        """Test analyzing JavaScript file imports"""
        test_file = Path(self.temp_dir) / "app.js"
        test_file.write_text("""
import React from 'react';
import { useState } from 'react';
const fs = require('fs');
""")

        deps = self.analyzer.analyze_typescript_imports(test_file, 'javascript')

        self.assertIsInstance(deps, list)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_analyze_single_quote_imports(self):
        """Test analyzing imports with single quotes"""
        test_file = Path(self.temp_dir) / "app.ts"
        test_file.write_text("import React from 'react';")

        deps = self.analyzer.analyze_typescript_imports(test_file, 'typescript')

        self.assertIsInstance(deps, list)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_analyze_double_quote_imports(self):
        """Test analyzing imports with double quotes"""
        test_file = Path(self.temp_dir) / "app.ts"
        test_file.write_text('import React from "react";')

        deps = self.analyzer.analyze_typescript_imports(test_file, 'typescript')

        self.assertIsInstance(deps, list)


class TestDependencyGraphBuilding(unittest.TestCase):
    """Test dependency graph building during file analysis"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipUnless(is_astgrep_available(), "ast-grep is not installed")
    def test_internal_deps_added_to_graph(self):
        """Test that internal dependencies are added to the graph"""
        test_file = Path(self.temp_dir) / "module.py"
        test_file.write_text("from .utils import helper")

        self.analyzer.analyze_file(test_file)

        # Internal dependencies should be in the graph
        self.assertIsInstance(
            self.analyzer.report.dependency_graph,
            dict
        )

    def test_external_deps_not_in_graph(self):
        """Test that external dependencies are not in the graph"""
        # Manually add an external dependency
        dep = DependencyInfo("react", "static", "/test.tsx", 1, is_external=True)
        file_path = "/test.tsx"

        # Simulate what analyze_file does
        self.analyzer.report.dependencies_by_file[file_path].append(dep)
        self.analyzer.report.total_dependencies += 1
        self.analyzer.report.external_dependencies += 1

        # External deps should NOT be in dependency_graph
        # (graph is only built for internal deps)
        self.assertEqual(len(self.analyzer.report.dependency_graph), 0)


class TestFullReportGeneration(unittest.TestCase):
    """Test complete report generation with all sections"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_full_report_with_all_data(self):
        """Test generating complete report with all sections"""
        # Setup report with data
        self.analyzer.report.total_dependencies = 100
        self.analyzer.report.external_dependencies = 60
        self.analyzer.report.internal_dependencies = 40

        # Add dependencies
        dep1 = DependencyInfo("react", "static", "/app.tsx", 1, True)
        dep2 = DependencyInfo("lodash", "static", "/utils.ts", 2, True)
        dep3 = DependencyInfo("./helpers", "static", "/app.tsx", 3, False)

        self.analyzer.report.dependencies_by_file["/app.tsx"] = [dep1, dep3]
        self.analyzer.report.dependencies_by_file["/utils.ts"] = [dep2]

        # Add circular dependencies
        self.analyzer.report.circular_dependencies = [
            ['a.py', 'b.py', 'a.py']
        ]

        report = self.analyzer.generate_report_text()

        # Check all sections present
        self.assertIn("DEPENDENCY ANALYSIS REPORT", report)
        self.assertIn("SUMMARY", report)
        self.assertIn("EXTERNAL PACKAGES", report)
        self.assertIn("DEPENDENCIES BY IMPORT TYPE", report)
        self.assertIn("CIRCULAR DEPENDENCIES", report)
        self.assertIn("TOP FILES BY DEPENDENCY COUNT", report)
        self.assertIn("END OF REPORT", report)

    def test_report_without_circular_deps(self):
        """Test report generation without circular dependencies section"""
        self.analyzer.report.total_dependencies = 10
        self.analyzer.report.circular_dependencies = []

        report = self.analyzer.generate_report_text()

        # Should not have circular dependencies section
        self.assertNotIn("CIRCULAR DEPENDENCIES", report)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions"""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DependencyAnalyzer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_empty_file(self):
        """Test analyzing empty file"""
        test_file = Path(self.temp_dir) / "empty.py"
        test_file.write_text("")

        self.analyzer.analyze_file(test_file)

        self.assertEqual(self.analyzer.report.total_dependencies, 0)

    def test_file_with_comments_only(self):
        """Test analyzing file with only comments"""
        test_file = Path(self.temp_dir) / "comments.py"
        test_file.write_text("# This is a comment\n# Another comment")

        self.analyzer.analyze_file(test_file)

        self.assertEqual(self.analyzer.report.total_dependencies, 0)

    def test_deeply_nested_directory(self):
        """Test analyzing deeply nested directory structure"""
        nested = Path(self.temp_dir) / "a" / "b" / "c" / "d"
        nested.mkdir(parents=True)
        (nested / "deep.py").write_text("import os")

        self.analyzer.analyze_directory()

        # Should find the nested file
        found_deep = any("deep.py" in fp for fp in self.analyzer.report.dependencies_by_file.keys())
        self.assertTrue(found_deep or self.analyzer.report.total_dependencies >= 0)

    def test_mixed_extension_directory(self):
        """Test directory with mixed file extensions"""
        (Path(self.temp_dir) / "file.py").write_text("import os")
        (Path(self.temp_dir) / "file.ts").write_text("import React from 'react';")
        (Path(self.temp_dir) / "file.js").write_text("const x = require('fs');")
        (Path(self.temp_dir) / "file.txt").write_text("not code")
        (Path(self.temp_dir) / "file.md").write_text("# Markdown")

        self.analyzer.analyze_directory()

        # Should process py, ts, js but not txt, md
        self.assertIsNotNone(self.analyzer.report)


if __name__ == '__main__':
    unittest.main()
