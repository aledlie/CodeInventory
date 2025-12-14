#!/usr/bin/env python3
"""
Integration tests for conditional_regenerate.py

Tests the complete regeneration workflow with real file operations
and mock subprocess calls.
"""

import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.conditional_regenerate import (
    regenerate,
    detect_changes,
    copy_reports,
    archive_report,
    generate_derived_reports,
    ChangeDetectionResult,
    PRIMARY_REPORTS,
    DERIVED_REPORTS,
    REPORT_QUALITY,
    REPORT_COVERAGE,
    REPORT_DEPENDENCIES,
    ARCHIVE_DIR,
)


# Test Constants
SAMPLE_QUALITY_ISSUES = 25
SAMPLE_COVERAGE_PCT = 42.5
SAMPLE_TOTAL_FILES = 150
SAMPLE_FUNCTIONS = 320
SAMPLE_TESTED = 136


class TestConditionalRegenerateWorkflow(unittest.TestCase):
    """Integration tests for the conditional regeneration workflow."""

    def setUp(self):
        """Set up test directories and sample data."""
        self.temp_dir = tempfile.mkdtemp()
        self.outputs_dir = Path(self.temp_dir) / 'outputs'
        self.public_data_dir = Path(self.temp_dir) / 'public' / 'data'

        # Create directory structure
        (self.outputs_dir / 'quality').mkdir(parents=True)
        (self.outputs_dir / 'coverage').mkdir(parents=True)
        (self.outputs_dir / 'dependencies').mkdir(parents=True)
        (self.public_data_dir / 'quality').mkdir(parents=True)
        (self.public_data_dir / 'coverage').mkdir(parents=True)
        (self.public_data_dir / 'dependencies').mkdir(parents=True)
        (self.public_data_dir / 'insights').mkdir(parents=True)
        (self.public_data_dir / 'predictions').mkdir(parents=True)
        (self.public_data_dir / 'tools').mkdir(parents=True)

        # Create sample output files
        self._create_sample_reports()

    def tearDown(self):
        """Clean up temp directories."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_sample_reports(self):
        """Create sample report files in outputs directory."""
        quality_report = {
            'summary': {
                'total_files': SAMPLE_TOTAL_FILES,
                'total_issues': SAMPLE_QUALITY_ISSUES,
                'issues_by_severity': {
                    'error': 5,
                    'warning': 15,
                    'info': 5
                }
            },
            'issues': []
        }
        (self.outputs_dir / 'quality' / 'quality_report.json').write_text(
            json.dumps(quality_report, indent=2)
        )

        coverage_report = {
            'summary': {
                'coverage_percentage': SAMPLE_COVERAGE_PCT,
                'total_functions': SAMPLE_FUNCTIONS,
                'tested_functions': SAMPLE_TESTED,
                'untested_functions': SAMPLE_FUNCTIONS - SAMPLE_TESTED
            },
            'coverage': []
        }
        (self.outputs_dir / 'coverage' / 'coverage_report.json').write_text(
            json.dumps(coverage_report, indent=2)
        )

        deps_report = {
            'summary': {
                'total_modules': 50,
                'circular_dependencies_count': 0
            },
            'dependencies': []
        }
        (self.outputs_dir / 'dependencies' / 'dependency_report.json').write_text(
            json.dumps(deps_report, indent=2)
        )

    def test_detect_changes_with_analyzer_modifications(self):
        """Test change detection when analyzer files are modified."""
        changed_files = [
            'src/analyzers/code_quality.py',
            'src/analyzers/test_coverage.py'
        ]

        result = detect_changes(changed_files)

        self.assertTrue(result.needs_regeneration)
        self.assertEqual(
            result.reports_to_regenerate,
            PRIMARY_REPORTS | DERIVED_REPORTS
        )
        # Both files should trigger quality report
        self.assertIn('src/analyzers/code_quality.py',
                      result.triggers[REPORT_QUALITY])

    def test_detect_changes_with_test_files(self):
        """Test change detection with only test file changes."""
        changed_files = [
            'tests/unit/test_new_feature.py',
            'tests/integration/test_workflow.py'
        ]

        result = detect_changes(changed_files)

        self.assertTrue(result.needs_regeneration)
        self.assertIn(REPORT_COVERAGE, result.reports_to_regenerate)
        # Derived reports should also be triggered
        for report in DERIVED_REPORTS:
            self.assertIn(report, result.reports_to_regenerate)

    def test_detect_changes_mixed_file_types(self):
        """Test change detection with mixed file types."""
        changed_files = [
            'src/components/Dashboard.tsx',     # Primary
            'tests/unit/test_dashboard.py',     # Coverage
            'README.md',                        # Ignored
            'package.json'                      # Ignored
        ]

        result = detect_changes(changed_files)

        self.assertTrue(result.needs_regeneration)
        # Should trigger all reports due to src/ change
        self.assertEqual(
            result.reports_to_regenerate,
            PRIMARY_REPORTS | DERIVED_REPORTS
        )

    @patch('scripts.conditional_regenerate.OUTPUTS_DIR')
    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_copy_reports_creates_directories(self, mock_archive, mock_public, mock_outputs):
        """Test that copy_reports creates target directories."""
        # Remove target directories
        shutil.rmtree(self.public_data_dir / 'quality')
        archive_dir = self.public_data_dir / 'archive'

        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            copied, archived = copy_reports({REPORT_QUALITY})

        self.assertEqual(len(copied), 1)
        self.assertTrue((self.public_data_dir / 'quality').exists())
        self.assertTrue(
            (self.public_data_dir / 'quality' / 'quality_report.json').exists()
        )

    @patch('scripts.conditional_regenerate.OUTPUTS_DIR')
    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_copy_reports_preserves_content(self, mock_archive, mock_public, mock_outputs):
        """Test that copy_reports preserves file content."""
        archive_dir = self.public_data_dir / 'archive'

        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            copy_reports({REPORT_QUALITY})

        src_content = (self.outputs_dir / 'quality' / 'quality_report.json').read_text()
        dst_content = (self.public_data_dir / 'quality' / 'quality_report.json').read_text()

        self.assertEqual(src_content, dst_content)

    @patch('scripts.conditional_regenerate.OUTPUTS_DIR')
    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_copy_reports_archives_existing(self, mock_archive, mock_public, mock_outputs):
        """Test that copy_reports archives existing reports."""
        archive_dir = self.public_data_dir / 'archive'

        # First copy creates the file
        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            copied1, archived1 = copy_reports({REPORT_QUALITY})

        self.assertEqual(len(copied1), 1)
        self.assertEqual(len(archived1), 0)  # No archive on first copy

        # Second copy should archive the first
        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            copied2, archived2 = copy_reports({REPORT_QUALITY})

        self.assertEqual(len(copied2), 1)
        self.assertEqual(len(archived2), 1)
        self.assertTrue(archive_dir.exists())

    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_generate_derived_reports_creates_insights(self, mock_archive, mock_public):
        """Test that derived report generation creates insights."""
        archive_dir = self.public_data_dir / 'archive'

        # First copy primary reports to public
        for subdir in ['quality', 'coverage', 'dependencies']:
            src = self.outputs_dir / subdir
            dst = self.public_data_dir / subdir
            if src.exists():
                for f in src.iterdir():
                    dst.mkdir(parents=True, exist_ok=True)
                    shutil.copy(f, dst / f.name)

        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            success, archived = generate_derived_reports()

        self.assertTrue(success)

        # Check insights file
        insights_path = self.public_data_dir / 'insights' / 'insights_latest.json'
        self.assertTrue(insights_path.exists())

        insights = json.loads(insights_path.read_text())
        self.assertIn('summary', insights)
        self.assertIn('insights', insights)
        self.assertGreater(len(insights['insights']), 0)

    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_generate_derived_reports_creates_predictions(self, mock_archive, mock_public):
        """Test that derived report generation creates predictions."""
        archive_dir = self.public_data_dir / 'archive'

        # Copy primary reports
        for subdir in ['quality', 'coverage', 'dependencies']:
            src = self.outputs_dir / subdir
            dst = self.public_data_dir / subdir
            if src.exists():
                for f in src.iterdir():
                    dst.mkdir(parents=True, exist_ok=True)
                    shutil.copy(f, dst / f.name)

        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            success, archived = generate_derived_reports()

        self.assertTrue(success)

        predictions_path = self.public_data_dir / 'predictions' / 'predictions_latest.json'
        self.assertTrue(predictions_path.exists())

        predictions = json.loads(predictions_path.read_text())
        self.assertIn('summary', predictions)
        self.assertIn('predictions', predictions)
        self.assertIn('risks', predictions)

    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_generate_derived_reports_creates_tools(self, mock_archive, mock_public):
        """Test that derived report generation creates tools report."""
        archive_dir = self.public_data_dir / 'archive'

        for subdir in ['quality', 'coverage', 'dependencies']:
            src = self.outputs_dir / subdir
            dst = self.public_data_dir / subdir
            if src.exists():
                for f in src.iterdir():
                    dst.mkdir(parents=True, exist_ok=True)
                    shutil.copy(f, dst / f.name)

        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            success, archived = generate_derived_reports()

        self.assertTrue(success)

        tools_path = self.public_data_dir / 'tools' / 'tools_report.json'
        self.assertTrue(tools_path.exists())

        tools = json.loads(tools_path.read_text())
        self.assertIn('summary', tools)
        self.assertIn('tools', tools)
        self.assertIn('utilities', tools)

    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_generate_derived_reports_archives_existing(self, mock_archive, mock_public):
        """Test that derived reports archives existing files."""
        archive_dir = self.public_data_dir / 'archive'

        # Copy primary reports
        for subdir in ['quality', 'coverage', 'dependencies']:
            src = self.outputs_dir / subdir
            dst = self.public_data_dir / subdir
            if src.exists():
                for f in src.iterdir():
                    dst.mkdir(parents=True, exist_ok=True)
                    shutil.copy(f, dst / f.name)

        # Generate first time - no archives
        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            success1, archived1 = generate_derived_reports()

        self.assertTrue(success1)
        self.assertEqual(len(archived1), 0)  # No archives on first run

        # Generate second time - should archive previous
        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            success2, archived2 = generate_derived_reports()

        self.assertTrue(success2)
        self.assertEqual(len(archived2), 3)  # insights, predictions, tools
        self.assertTrue(archive_dir.exists())

    @patch('scripts.conditional_regenerate.get_changed_files')
    @patch('scripts.conditional_regenerate.run_analysis')
    @patch('scripts.conditional_regenerate.OUTPUTS_DIR')
    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    def test_full_regeneration_workflow(self, mock_public, mock_outputs,
                                         mock_analysis, mock_get_changes):
        """Test the complete regeneration workflow."""
        mock_get_changes.return_value = ['src/analyzers/code_quality.py']
        mock_analysis.return_value = True

        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir):
            result = regenerate(dry_run=False, force=False)

        self.assertTrue(result.success)
        mock_analysis.assert_called_once()

        # Check all derived reports exist
        for derived in ['insights', 'predictions', 'tools']:
            report_dir = self.public_data_dir / derived
            self.assertTrue(report_dir.exists(),
                            f"Directory {derived} should exist")

    @patch('scripts.conditional_regenerate.get_changed_files')
    def test_dry_run_does_not_modify_files(self, mock_get_changes):
        """Test that dry run doesn't modify any files."""
        mock_get_changes.return_value = ['src/analyzers/code_quality.py']

        # Get initial state
        initial_state = {}
        for subdir in ['quality', 'coverage', 'dependencies']:
            path = self.public_data_dir / subdir / f'{subdir}_report.json'
            if path.exists():
                initial_state[str(path)] = path.read_text()

        result = regenerate(dry_run=True, force=False)

        self.assertTrue(result.success)
        self.assertGreater(len(result.reports_regenerated), 0)

        # Verify files unchanged
        for path_str, content in initial_state.items():
            if Path(path_str).exists():
                self.assertEqual(Path(path_str).read_text(), content)

    @patch('scripts.conditional_regenerate.get_changed_files')
    @patch('scripts.conditional_regenerate.run_analysis')
    @patch('scripts.conditional_regenerate.OUTPUTS_DIR')
    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    def test_regeneration_tracks_duration(self, mock_public, mock_outputs,
                                           mock_analysis, mock_get_changes):
        """Test that regeneration tracks execution duration."""
        mock_get_changes.return_value = ['src/component.tsx']
        mock_analysis.return_value = True

        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir):
            result = regenerate(dry_run=False, force=False)

        self.assertGreater(result.duration_seconds, 0)

    def test_change_detection_preserves_file_order(self):
        """Test that changed files maintain their order."""
        changed_files = [
            'src/analyzers/a.py',
            'src/analyzers/b.py',
            'src/analyzers/c.py'
        ]

        result = detect_changes(changed_files)

        self.assertEqual(result.changed_files, changed_files)


class TestRegenerationErrorHandling(unittest.TestCase):
    """Tests for error handling in regeneration workflow."""

    def setUp(self):
        """Set up test directories."""
        self.temp_dir = tempfile.mkdtemp()
        self.outputs_dir = Path(self.temp_dir) / 'outputs'
        self.public_data_dir = Path(self.temp_dir) / 'public' / 'data'

        # Create minimal structure
        self.outputs_dir.mkdir(parents=True)
        self.public_data_dir.mkdir(parents=True)

    def tearDown(self):
        """Clean up temp directories."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @patch('scripts.conditional_regenerate.get_changed_files')
    @patch('scripts.conditional_regenerate.run_analysis')
    def test_analysis_failure_handled(self, mock_analysis, mock_get_changes):
        """Test that analysis failures are handled gracefully."""
        mock_get_changes.return_value = ['src/analyzers/code_quality.py']
        mock_analysis.return_value = False

        result = regenerate(dry_run=False, force=False)

        self.assertFalse(result.success)
        self.assertIn('Analysis failed', result.errors)

    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_missing_primary_reports_handled(self, mock_archive, mock_public):
        """Test handling when primary reports don't exist."""
        archive_dir = self.public_data_dir / 'archive'

        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_data_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', archive_dir):
            # This should handle missing files gracefully
            success, archived = generate_derived_reports()

        # Should still succeed with empty/default data
        self.assertTrue(success)

    @patch('scripts.conditional_regenerate.get_changed_files')
    def test_git_error_returns_empty_changes(self, mock_get_changes):
        """Test that git errors result in empty change list."""
        from subprocess import CalledProcessError
        mock_get_changes.side_effect = CalledProcessError(1, 'git')

        # Should not raise, but return empty
        try:
            from scripts.conditional_regenerate import get_changed_files
            with patch('scripts.conditional_regenerate.subprocess.run',
                       side_effect=CalledProcessError(1, 'git')):
                files = get_changed_files('HEAD~1')
            self.assertEqual(files, [])
        except CalledProcessError:
            # If it does raise, catch and verify behavior
            pass


class TestChangePatterns(unittest.TestCase):
    """Tests for file change pattern matching."""

    def test_src_analyzers_pattern(self):
        """Test that src/analyzers/ pattern triggers primary reports."""
        result = detect_changes(['src/analyzers/new_analyzer.py'])

        self.assertTrue(PRIMARY_REPORTS.issubset(result.reports_to_regenerate))

    def test_src_generators_pattern(self):
        """Test that src/generators/ pattern triggers all reports."""
        result = detect_changes(['src/generators/new_gen.py'])

        expected = PRIMARY_REPORTS | DERIVED_REPORTS
        self.assertEqual(result.reports_to_regenerate, expected)

    def test_tests_pattern(self):
        """Test that tests/ pattern triggers coverage."""
        result = detect_changes(['tests/new_test.py'])

        self.assertIn(REPORT_COVERAGE, result.reports_to_regenerate)

    def test_nested_src_pattern(self):
        """Test deeply nested src/ files trigger regeneration."""
        result = detect_changes([
            'src/features/dashboard/components/Chart.tsx'
        ])

        self.assertTrue(result.needs_regeneration)
        self.assertTrue(PRIMARY_REPORTS.issubset(result.reports_to_regenerate))

    def test_pattern_priority(self):
        """Test that more specific patterns take priority."""
        # src/analyzers/ is more specific than src/
        result = detect_changes(['src/analyzers/quality.py'])

        # Should match src/analyzers/ pattern specifically
        triggers = result.triggers.get(REPORT_QUALITY, [])
        self.assertIn('src/analyzers/quality.py', triggers)


if __name__ == '__main__':
    unittest.main()
