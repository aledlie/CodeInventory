#!/usr/bin/env python3
"""
Unit tests for identify_tools.py

Tests the save_report_html function and _generate_html_report method
including the pct percentage calculation helper.
"""

import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.identify_tools import (
    ToolIdentifier,
    ToolIdentificationReport,
    ToolCandidate,
    ModuleInfo,
    FunctionInfo,
    ClassInfo,
    ImportInfo,
    ModularityScore,
)


class TestSaveReportHtml(unittest.TestCase):
    """Tests for save_report_html function."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.identifier = ToolIdentifier(Path(self.temp_dir))

        # Add some test data to the report
        self._setup_sample_report()

    def tearDown(self):
        """Clean up temp directories."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _setup_sample_report(self):
        """Set up a sample report with test data."""
        # Add sample modularity counts
        self.identifier.report.highly_modular_count = 5
        self.identifier.report.modular_count = 10
        self.identifier.report.semi_modular_count = 3
        self.identifier.report.coupled_count = 2
        self.identifier.report.total_files_analyzed = 20
        self.identifier.report.total_functions = 50
        self.identifier.report.total_classes = 15

        # Add sample tool candidates
        self.identifier.report.tool_candidates = [
            ToolCandidate(
                name='format_date',
                type='function',
                file_path='/src/utils/dates.py',
                line_number=42,
                description='Standalone function with 2 parameters',
                dependencies=['datetime'],
                modularity_score=ModularityScore.HIGHLY_MODULAR,
                extraction_potential=0.95,
                extraction_complexity='trivial',
                suggested_package_name='utils-format-date',
                rationale='This function is highly modular with minimal dependencies.'
            ),
            ToolCandidate(
                name='DataValidator',
                type='class',
                file_path='/src/validators/data.py',
                line_number=10,
                description='Class with 5 methods',
                dependencies=['pydantic'],
                modularity_score=ModularityScore.MODULAR,
                extraction_potential=0.75,
                extraction_complexity='easy',
                suggested_package_name='validators-data-validator',
                rationale='This class has good modularity.'
            ),
        ]

        # Add sample utility modules
        self.identifier.report.modules = [
            ModuleInfo(
                file_path='/src/utils/helpers.py',
                functions=[],
                classes=[],
                imports=[],
                external_dependencies={'requests'},
                internal_dependencies=set(),
                stdlib_dependencies={'json', 'datetime'},
                exports=['helper_func'],
                modularity_score=ModularityScore.HIGHLY_MODULAR,
                is_utility_module=True,
                extraction_potential=0.9
            ),
        ]

    def test_save_report_html_creates_file(self):
        """Should create HTML file at specified path."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        self.assertTrue(output_path.exists())

    def test_save_report_html_contains_html_structure(self):
        """Should create valid HTML with proper structure."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        content = output_path.read_text()
        self.assertIn('<!DOCTYPE html>', content)
        self.assertIn('<html', content)
        self.assertIn('</html>', content)
        self.assertIn('<head>', content)
        self.assertIn('<body>', content)

    def test_save_report_html_contains_report_title(self):
        """Should include the report title."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        content = output_path.read_text()
        self.assertIn('Tool Identification Report', content)

    def test_save_report_html_contains_statistics(self):
        """Should include statistics from the report."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        content = output_path.read_text()
        self.assertIn('20', content)  # total_files_analyzed
        self.assertIn('50', content)  # total_functions
        self.assertIn('15', content)  # total_classes

    def test_save_report_html_contains_candidates(self):
        """Should include tool candidates in the HTML."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        content = output_path.read_text()
        self.assertIn('format_date', content)
        self.assertIn('DataValidator', content)
        self.assertIn('function', content)
        self.assertIn('class', content)

    def test_save_report_html_contains_modularity_chart(self):
        """Should include modularity distribution chart."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        content = output_path.read_text()
        self.assertIn('Modularity Distribution', content)
        self.assertIn('highly-modular', content)
        self.assertIn('modular', content)

    def test_save_report_html_contains_utility_modules(self):
        """Should include utility modules section."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        content = output_path.read_text()
        self.assertIn('Utility Modules', content)
        self.assertIn('helpers.py', content)

    def test_save_report_html_contains_javascript(self):
        """Should include JavaScript for interactivity."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        content = output_path.read_text()
        self.assertIn('<script>', content)
        self.assertIn('filterTable', content)
        self.assertIn('filterByType', content)

    def test_save_report_html_with_custom_path(self):
        """Should save to nested directory structure."""
        nested_dir = Path(self.temp_dir) / 'reports' / 'tools'
        nested_dir.mkdir(parents=True)
        output_path = nested_dir / 'analysis.html'

        self.identifier.save_report_html(output_path)

        self.assertTrue(output_path.exists())


class TestGenerateHtmlReportPctCalculation(unittest.TestCase):
    """Tests for the pct calculation in _generate_html_report."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.identifier = ToolIdentifier(Path(self.temp_dir))

    def tearDown(self):
        """Clean up."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_pct_calculation_with_zero_total(self):
        """pct should return 0 when total is zero."""
        # All counts are 0 by default
        self.identifier.report.highly_modular_count = 0
        self.identifier.report.modular_count = 0
        self.identifier.report.semi_modular_count = 0
        self.identifier.report.coupled_count = 0

        html = self.identifier._generate_html_report()

        # The chart bars should not have width percentages when total is 0
        # (they just won't be rendered due to conditional)
        self.assertIn('chart-bars', html)

    def test_pct_calculation_with_equal_distribution(self):
        """pct should calculate 25% each when equally distributed."""
        self.identifier.report.highly_modular_count = 10
        self.identifier.report.modular_count = 10
        self.identifier.report.semi_modular_count = 10
        self.identifier.report.coupled_count = 10

        html = self.identifier._generate_html_report()

        # Should have chart bars with 25% width each
        self.assertIn('style="width: 25.0%"', html)

    def test_pct_calculation_with_single_category(self):
        """pct should show 100% for single non-zero category."""
        self.identifier.report.highly_modular_count = 50
        self.identifier.report.modular_count = 0
        self.identifier.report.semi_modular_count = 0
        self.identifier.report.coupled_count = 0

        html = self.identifier._generate_html_report()

        self.assertIn('style="width: 100.0%"', html)

    def test_pct_calculation_with_varying_distribution(self):
        """pct should correctly calculate varying percentages."""
        self.identifier.report.highly_modular_count = 5   # 50%
        self.identifier.report.modular_count = 3          # 30%
        self.identifier.report.semi_modular_count = 1     # 10%
        self.identifier.report.coupled_count = 1          # 10%

        html = self.identifier._generate_html_report()

        self.assertIn('style="width: 50.0%"', html)
        self.assertIn('style="width: 30.0%"', html)
        self.assertIn('style="width: 10.0%"', html)

    def test_html_report_shows_correct_modularity_counts(self):
        """HTML should display correct modularity count numbers."""
        self.identifier.report.highly_modular_count = 25
        self.identifier.report.modular_count = 15
        self.identifier.report.semi_modular_count = 8
        self.identifier.report.coupled_count = 2

        html = self.identifier._generate_html_report()

        # Check the legend displays correct counts
        self.assertIn('Highly Modular (25)', html)
        self.assertIn('Modular (15)', html)
        self.assertIn('Semi-Modular (8)', html)
        self.assertIn('Coupled (2)', html)


class TestGenerateCandidateRows(unittest.TestCase):
    """Tests for _generate_candidate_rows helper."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.identifier = ToolIdentifier(Path(self.temp_dir))

    def tearDown(self):
        """Clean up."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_generate_candidate_rows_empty_list(self):
        """Should return empty string for empty candidates list."""
        result = self.identifier._generate_candidate_rows([])
        self.assertEqual(result, '')

    def test_generate_candidate_rows_single_candidate(self):
        """Should generate table row for single candidate."""
        candidates = [
            ToolCandidate(
                name='test_func',
                type='function',
                file_path='/src/test.py',
                line_number=10,
                description='Test function',
                dependencies=[],
                modularity_score=ModularityScore.HIGHLY_MODULAR,
                extraction_potential=0.9,
                extraction_complexity='trivial',
                suggested_package_name='test-func',
                rationale='Highly modular function.'
            )
        ]

        result = self.identifier._generate_candidate_rows(candidates)

        self.assertIn('<tr', result)
        self.assertIn('test_func', result)
        self.assertIn('function', result)
        self.assertIn('highly-modular', result)
        self.assertIn('90%', result)
        self.assertIn('trivial', result)

    def test_generate_candidate_rows_multiple_candidates(self):
        """Should generate multiple table rows."""
        candidates = [
            ToolCandidate(
                name='func1',
                type='function',
                file_path='/src/a.py',
                line_number=1,
                description='First function',
                dependencies=['dep1'],
                modularity_score=ModularityScore.MODULAR,
                extraction_potential=0.7,
                extraction_complexity='easy',
                suggested_package_name='func1',
                rationale='Good modularity.'
            ),
            ToolCandidate(
                name='Class1',
                type='class',
                file_path='/src/b.py',
                line_number=5,
                description='First class',
                dependencies=['dep1', 'dep2'],
                modularity_score=ModularityScore.SEMI_MODULAR,
                extraction_potential=0.5,
                extraction_complexity='moderate',
                suggested_package_name='class1',
                rationale='Some coupling.'
            ),
        ]

        result = self.identifier._generate_candidate_rows(candidates)

        self.assertIn('func1', result)
        self.assertIn('Class1', result)
        self.assertEqual(result.count('<tr'), 2)


class TestGenerateModuleCards(unittest.TestCase):
    """Tests for _generate_module_cards helper."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.identifier = ToolIdentifier(Path(self.temp_dir))

    def tearDown(self):
        """Clean up."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_generate_module_cards_empty_list(self):
        """Should return empty string for empty modules list."""
        result = self.identifier._generate_module_cards([])
        self.assertEqual(result, '')

    def test_generate_module_cards_single_module(self):
        """Should generate card for single module."""
        modules = [
            ModuleInfo(
                file_path='/src/utils/helpers.py',
                functions=[MagicMock() for _ in range(5)],
                classes=[MagicMock()],
                imports=[],
                external_dependencies={'requests'},
                internal_dependencies=set(),
                stdlib_dependencies={'json'},
                exports=[],
                modularity_score=ModularityScore.MODULAR,
                is_utility_module=True,
                extraction_potential=0.8
            )
        ]

        result = self.identifier._generate_module_cards(modules)

        self.assertIn('module-card', result)
        self.assertIn('helpers.py', result)
        self.assertIn('5', result)  # function count
        self.assertIn('1', result)  # class count
        self.assertIn('80%', result)  # extraction potential

    def test_generate_module_cards_limits_to_12(self):
        """_generate_html_report should limit to 12 module cards."""
        modules = []
        for i in range(15):
            modules.append(
                ModuleInfo(
                    file_path=f'/src/utils/module{i}.py',
                    functions=[],
                    classes=[],
                    imports=[],
                    external_dependencies=set(),
                    internal_dependencies=set(),
                    stdlib_dependencies=set(),
                    exports=[],
                    modularity_score=ModularityScore.MODULAR,
                    is_utility_module=True,
                    extraction_potential=0.8
                )
            )

        result = self.identifier._generate_module_cards(modules[:12])

        # Should have at most 12 cards
        self.assertEqual(result.count('module-card'), 12)


class TestHtmlReportEdgeCases(unittest.TestCase):
    """Tests for edge cases in HTML report generation."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.identifier = ToolIdentifier(Path(self.temp_dir))

    def tearDown(self):
        """Clean up."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_html_report_with_empty_report(self):
        """Should generate valid HTML even with empty report."""
        html = self.identifier._generate_html_report()

        self.assertIn('<!DOCTYPE html>', html)
        self.assertIn('Tool Identification Report', html)
        self.assertIn('0', html)  # Zero counts

    def test_html_report_with_special_characters_in_names(self):
        """Should handle special characters in candidate names."""
        self.identifier.report.tool_candidates = [
            ToolCandidate(
                name='format_date_<T>',
                type='function',
                file_path='/src/utils/dates.py',
                line_number=42,
                description='Function with <generic> type',
                dependencies=[],
                modularity_score=ModularityScore.HIGHLY_MODULAR,
                extraction_potential=0.95,
                extraction_complexity='trivial',
                suggested_package_name='utils-format-date',
                rationale='Test special chars: <>&"'
            ),
        ]

        html = self.identifier._generate_html_report()

        # Should not raise and should contain the name
        self.assertIn('format_date_', html)

    def test_html_report_with_long_file_paths(self):
        """Should handle very long file paths."""
        long_path = '/very/long/path/' + 'nested/' * 20 + 'file.py'
        self.identifier.report.tool_candidates = [
            ToolCandidate(
                name='func',
                type='function',
                file_path=long_path,
                line_number=1,
                description='Test',
                dependencies=[],
                modularity_score=ModularityScore.MODULAR,
                extraction_potential=0.7,
                extraction_complexity='easy',
                suggested_package_name='func',
                rationale='Test'
            ),
        ]

        html = self.identifier._generate_html_report()

        self.assertIn('file.py', html)

    def test_html_report_with_coupled_only(self):
        """Should generate chart with only coupled count."""
        self.identifier.report.highly_modular_count = 0
        self.identifier.report.modular_count = 0
        self.identifier.report.semi_modular_count = 0
        self.identifier.report.coupled_count = 100

        html = self.identifier._generate_html_report()

        self.assertIn('style="width: 100.0%"', html)
        self.assertIn('Coupled (100)', html)


class TestSaveReportHtmlLogging(unittest.TestCase):
    """Tests for logging in save_report_html."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.identifier = ToolIdentifier(Path(self.temp_dir))

    def tearDown(self):
        """Clean up."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @patch('src.analyzers.identify_tools.logger')
    def test_save_report_html_logs_success(self, mock_logger):
        """Should log success message after saving."""
        output_path = Path(self.temp_dir) / 'report.html'

        self.identifier.save_report_html(output_path)

        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args[0][0]
        self.assertIn('HTML report saved', call_args)
        self.assertIn(str(output_path), call_args)


if __name__ == '__main__':
    unittest.main()
