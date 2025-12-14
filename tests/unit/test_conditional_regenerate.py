#!/usr/bin/env python3
"""
Unit tests for conditional_regenerate.py

Tests the change detection logic, file filtering, and report regeneration logic.
"""

import json
import tempfile
import unittest
from pathlib import Path
from typing import List
from unittest.mock import MagicMock, patch, call

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.conditional_regenerate import (
    ChangeDetectionResult,
    RegenerationResult,
    detect_changes,
    should_trigger_regeneration,
    get_changed_files,
    get_staged_files,
    copy_reports,
    archive_report,
    generate_derived_reports,
    regenerate,
    _generate_insights,
    _generate_predictions,
    _generate_tools_report,
    PRIMARY_REPORTS,
    DERIVED_REPORTS,
    REPORT_QUALITY,
    REPORT_COVERAGE,
    REPORT_DEPENDENCIES,
    REPORT_INSIGHTS,
    REPORT_PREDICTIONS,
    REPORT_TOOLS,
    TRIGGER_EXTENSIONS,
    ARCHIVE_DIR,
)


# Test Constants
TEST_TIMESTAMP = '2024-01-15T12:00:00Z'
QUALITY_TOTAL_ISSUES = 45
QUALITY_WARNINGS = 30
COVERAGE_PERCENTAGE = 35.5
CIRCULAR_DEPS_COUNT = 0


class TestChangeDetectionResult(unittest.TestCase):
    """Tests for the ChangeDetectionResult dataclass."""

    def test_empty_result_needs_no_regeneration(self):
        """Empty result should not need regeneration."""
        result = ChangeDetectionResult()
        self.assertFalse(result.needs_regeneration)
        self.assertEqual(len(result.changed_files), 0)
        self.assertEqual(len(result.reports_to_regenerate), 0)

    def test_result_with_reports_needs_regeneration(self):
        """Result with reports should need regeneration."""
        result = ChangeDetectionResult(
            reports_to_regenerate={REPORT_QUALITY, REPORT_COVERAGE}
        )
        self.assertTrue(result.needs_regeneration)
        self.assertEqual(len(result.reports_to_regenerate), 2)

    def test_add_trigger_creates_list(self):
        """add_trigger should create list if not exists."""
        result = ChangeDetectionResult()
        result.add_trigger(REPORT_QUALITY, 'src/file.ts')

        self.assertIn(REPORT_QUALITY, result.triggers)
        self.assertEqual(result.triggers[REPORT_QUALITY], ['src/file.ts'])

    def test_add_trigger_appends_to_list(self):
        """add_trigger should append to existing list."""
        result = ChangeDetectionResult()
        result.add_trigger(REPORT_QUALITY, 'src/file1.ts')
        result.add_trigger(REPORT_QUALITY, 'src/file2.ts')

        self.assertEqual(len(result.triggers[REPORT_QUALITY]), 2)

    def test_add_trigger_no_duplicates(self):
        """add_trigger should not add duplicate files."""
        result = ChangeDetectionResult()
        result.add_trigger(REPORT_QUALITY, 'src/file.ts')
        result.add_trigger(REPORT_QUALITY, 'src/file.ts')

        self.assertEqual(len(result.triggers[REPORT_QUALITY]), 1)


class TestRegenerationResult(unittest.TestCase):
    """Tests for the RegenerationResult dataclass."""

    def test_default_values(self):
        """Default values should be set correctly."""
        result = RegenerationResult(success=True)

        self.assertTrue(result.success)
        self.assertEqual(result.reports_regenerated, [])
        self.assertEqual(result.reports_archived, [])
        self.assertEqual(result.errors, [])
        self.assertEqual(result.duration_seconds, 0.0)

    def test_with_errors(self):
        """Result with errors should track them."""
        result = RegenerationResult(
            success=False,
            errors=['Analysis failed', 'Copy failed']
        )

        self.assertFalse(result.success)
        self.assertEqual(len(result.errors), 2)

    def test_with_archived_reports(self):
        """Result with archived reports should track them."""
        result = RegenerationResult(
            success=True,
            reports_regenerated=['/path/to/quality_report.json'],
            reports_archived=['/path/to/archive/quality_report_20240115_120000.json']
        )

        self.assertTrue(result.success)
        self.assertEqual(len(result.reports_regenerated), 1)
        self.assertEqual(len(result.reports_archived), 1)


class TestShouldTriggerRegeneration(unittest.TestCase):
    """Tests for should_trigger_regeneration function."""

    def test_typescript_files_trigger(self):
        """TypeScript files should trigger regeneration."""
        self.assertTrue(should_trigger_regeneration('src/component.ts'))
        self.assertTrue(should_trigger_regeneration('src/component.tsx'))

    def test_python_files_trigger(self):
        """Python files should trigger regeneration."""
        self.assertTrue(should_trigger_regeneration('src/analyzers/quality.py'))

    def test_javascript_files_trigger(self):
        """JavaScript files should trigger regeneration."""
        self.assertTrue(should_trigger_regeneration('src/utils.js'))
        self.assertTrue(should_trigger_regeneration('src/utils.jsx'))

    def test_non_code_files_dont_trigger(self):
        """Non-code files should not trigger regeneration."""
        self.assertFalse(should_trigger_regeneration('README.md'))
        self.assertFalse(should_trigger_regeneration('package.json'))
        self.assertFalse(should_trigger_regeneration('styles.css'))
        self.assertFalse(should_trigger_regeneration('image.png'))

    def test_excluded_directories_dont_trigger(self):
        """Files in excluded directories should not trigger."""
        self.assertFalse(should_trigger_regeneration('node_modules/react/index.ts'))
        self.assertFalse(should_trigger_regeneration('dist/bundle.js'))
        self.assertFalse(should_trigger_regeneration('build/output.js'))
        self.assertFalse(should_trigger_regeneration('.git/objects/abc.ts'))
        self.assertFalse(should_trigger_regeneration('__pycache__/module.py'))

    def test_trigger_extensions_constant(self):
        """TRIGGER_EXTENSIONS should contain expected values."""
        expected = {'.ts', '.tsx', '.py', '.js', '.jsx'}
        self.assertEqual(TRIGGER_EXTENSIONS, expected)


class TestDetectChanges(unittest.TestCase):
    """Tests for detect_changes function."""

    def test_empty_changes_returns_empty_result(self):
        """No changes should return empty result."""
        result = detect_changes([])
        self.assertFalse(result.needs_regeneration)

    def test_analyzer_changes_trigger_primary_reports(self):
        """Changes to analyzers should trigger all primary reports."""
        changed_files = ['src/analyzers/code_quality.py']
        result = detect_changes(changed_files)

        self.assertTrue(result.needs_regeneration)
        self.assertTrue(PRIMARY_REPORTS.issubset(result.reports_to_regenerate))
        # Derived reports should also be triggered
        self.assertTrue(DERIVED_REPORTS.issubset(result.reports_to_regenerate))

    def test_generator_changes_trigger_all_reports(self):
        """Changes to generators should trigger all reports."""
        changed_files = ['src/generators/dashboard.py']
        result = detect_changes(changed_files)

        self.assertTrue(result.needs_regeneration)
        expected_reports = PRIMARY_REPORTS | DERIVED_REPORTS
        self.assertEqual(result.reports_to_regenerate, expected_reports)

    def test_test_changes_trigger_coverage(self):
        """Changes to tests should trigger coverage report."""
        changed_files = ['tests/test_module.py']
        result = detect_changes(changed_files)

        self.assertTrue(result.needs_regeneration)
        self.assertIn(REPORT_COVERAGE, result.reports_to_regenerate)

    def test_typescript_src_changes_trigger_primary(self):
        """TypeScript changes in src/ should trigger primary reports."""
        changed_files = ['src/features/dashboard/api/client.ts']
        result = detect_changes(changed_files)

        self.assertTrue(result.needs_regeneration)
        self.assertTrue(PRIMARY_REPORTS.issubset(result.reports_to_regenerate))

    def test_non_code_changes_dont_trigger(self):
        """Non-code file changes should not trigger regeneration."""
        changed_files = ['README.md', 'package.json', 'tsconfig.json']
        result = detect_changes(changed_files)

        self.assertFalse(result.needs_regeneration)

    def test_conditional_regenerate_script_doesnt_trigger(self):
        """Changes to this script should not trigger regeneration."""
        changed_files = ['scripts/conditional_regenerate.py']
        result = detect_changes(changed_files)

        self.assertFalse(result.needs_regeneration)

    def test_triggers_track_files(self):
        """Triggers should track which files caused regeneration."""
        changed_files = ['src/analyzers/code_quality.py', 'src/analyzers/deps.py']
        result = detect_changes(changed_files)

        # Both files should be tracked as triggers
        quality_triggers = result.triggers.get(REPORT_QUALITY, [])
        self.assertIn('src/analyzers/code_quality.py', quality_triggers)
        self.assertIn('src/analyzers/deps.py', quality_triggers)

    def test_derived_reports_triggered_by_primary(self):
        """Derived reports should be triggered when primary reports change."""
        changed_files = ['src/component.tsx']
        result = detect_changes(changed_files)

        # Primary triggers should cause derived regeneration
        if result.reports_to_regenerate & PRIMARY_REPORTS:
            for report in DERIVED_REPORTS:
                self.assertIn(report, result.reports_to_regenerate)
                self.assertIn('[derived from primary reports]',
                              result.triggers.get(report, []))

    def test_multiple_file_types_combined(self):
        """Multiple file types should combine their triggers."""
        changed_files = [
            'src/analyzers/quality.py',  # Triggers all primary
            'tests/test_new.py',          # Triggers coverage
        ]
        result = detect_changes(changed_files)

        self.assertTrue(PRIMARY_REPORTS.issubset(result.reports_to_regenerate))
        self.assertTrue(DERIVED_REPORTS.issubset(result.reports_to_regenerate))


class TestGetChangedFiles(unittest.TestCase):
    """Tests for get_changed_files function."""

    @patch('scripts.conditional_regenerate.subprocess.run')
    def test_returns_changed_files(self, mock_run):
        """Should return list of changed files from git."""
        mock_run.return_value = MagicMock(
            stdout='src/file1.ts\nsrc/file2.tsx\n',
            returncode=0
        )

        files = get_changed_files('HEAD~1')

        self.assertEqual(len(files), 2)
        self.assertIn('src/file1.ts', files)
        self.assertIn('src/file2.tsx', files)

    @patch('scripts.conditional_regenerate.subprocess.run')
    def test_handles_empty_output(self, mock_run):
        """Should handle empty git output."""
        mock_run.return_value = MagicMock(stdout='', returncode=0)

        files = get_changed_files('HEAD~1')

        self.assertEqual(files, [])

    @patch('scripts.conditional_regenerate.subprocess.run')
    def test_handles_git_error(self, mock_run):
        """Should handle git errors gracefully."""
        from subprocess import CalledProcessError
        mock_run.side_effect = CalledProcessError(1, 'git')

        files = get_changed_files('HEAD~1')

        self.assertEqual(files, [])

    @patch('scripts.conditional_regenerate.subprocess.run')
    def test_uses_correct_since_parameter(self, mock_run):
        """Should use the since parameter in git command."""
        mock_run.return_value = MagicMock(stdout='', returncode=0)

        get_changed_files('abc123')

        call_args = mock_run.call_args
        self.assertIn('abc123', call_args[0][0])


class TestGetStagedFiles(unittest.TestCase):
    """Tests for get_staged_files function."""

    @patch('scripts.conditional_regenerate.subprocess.run')
    def test_returns_staged_files(self, mock_run):
        """Should return list of staged files."""
        mock_run.return_value = MagicMock(
            stdout='src/staged.ts\nsrc/another.tsx\n',
            returncode=0
        )

        files = get_staged_files()

        self.assertEqual(len(files), 2)
        self.assertIn('src/staged.ts', files)

    @patch('scripts.conditional_regenerate.subprocess.run')
    def test_uses_cached_flag(self, mock_run):
        """Should use --cached flag for staged files."""
        mock_run.return_value = MagicMock(stdout='', returncode=0)

        get_staged_files()

        call_args = mock_run.call_args
        self.assertIn('--cached', call_args[0][0])


class TestGenerateInsights(unittest.TestCase):
    """Tests for _generate_insights function."""

    def setUp(self):
        """Set up test data."""
        self.quality = {
            'summary': {
                'total_issues': QUALITY_TOTAL_ISSUES,
                'issues_by_severity': {'warning': QUALITY_WARNINGS}
            }
        }
        self.coverage = {
            'summary': {'coverage_percentage': COVERAGE_PERCENTAGE}
        }
        self.deps = {
            'summary': {'circular_dependencies_count': CIRCULAR_DEPS_COUNT}
        }

    def test_generates_coverage_insight_below_threshold(self):
        """Should generate coverage concern when below 50%."""
        insights = _generate_insights(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        coverage_insights = [i for i in insights['insights']
                            if 'Coverage' in i['title']]
        self.assertEqual(len(coverage_insights), 1)
        self.assertEqual(coverage_insights[0]['type'], 'concern')
        self.assertEqual(coverage_insights[0]['severity'], 'high')

    def test_no_coverage_insight_above_threshold(self):
        """Should not generate coverage concern when above 50%."""
        self.coverage['summary']['coverage_percentage'] = 65.0

        insights = _generate_insights(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        coverage_insights = [i for i in insights['insights']
                            if 'Coverage Below' in i.get('title', '')]
        self.assertEqual(len(coverage_insights), 0)

    def test_generates_quality_insight(self):
        """Should generate quality recommendation when issues exist."""
        insights = _generate_insights(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        quality_insights = [i for i in insights['insights']
                           if 'Quality' in i['title']]
        self.assertEqual(len(quality_insights), 1)
        self.assertEqual(quality_insights[0]['type'], 'recommendation')

    def test_generates_no_circular_deps_insight(self):
        """Should generate positive insight when no circular deps."""
        insights = _generate_insights(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        dep_insights = [i for i in insights['insights']
                       if 'Circular' in i['title']]
        self.assertEqual(len(dep_insights), 1)
        self.assertEqual(dep_insights[0]['type'], 'improvement')

    def test_summary_counts_correct(self):
        """Summary should have correct counts."""
        insights = _generate_insights(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        summary = insights['summary']
        self.assertEqual(summary['total'], len(insights['insights']))
        self.assertIn('by_type', summary)
        self.assertIn('by_severity', summary)

    def test_timestamp_used(self):
        """Timestamp should be used in insights."""
        insights = _generate_insights(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        self.assertEqual(insights['summary']['last_updated'], TEST_TIMESTAMP)
        for insight in insights['insights']:
            self.assertEqual(insight['created_at'], TEST_TIMESTAMP)


class TestGeneratePredictions(unittest.TestCase):
    """Tests for _generate_predictions function."""

    def setUp(self):
        """Set up test data."""
        self.quality = {'summary': {'total_issues': QUALITY_TOTAL_ISSUES}}
        self.coverage = {'summary': {'coverage_percentage': COVERAGE_PERCENTAGE}}
        self.deps = {}

    def test_generates_coverage_prediction(self):
        """Should generate coverage prediction."""
        predictions = _generate_predictions(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        coverage_preds = [p for p in predictions['predictions']
                         if p['type'] == 'coverage']
        self.assertEqual(len(coverage_preds), 1)
        self.assertEqual(coverage_preds[0]['predicted_value'], 70)

    def test_generates_quality_prediction(self):
        """Should generate quality prediction."""
        predictions = _generate_predictions(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        quality_preds = [p for p in predictions['predictions']
                        if p['type'] == 'quality']
        self.assertEqual(len(quality_preds), 1)
        expected_value = int(QUALITY_TOTAL_ISSUES * 0.85)
        self.assertEqual(quality_preds[0]['predicted_value'], expected_value)

    def test_generates_risk_for_low_coverage(self):
        """Should generate risk when coverage below 50%."""
        predictions = _generate_predictions(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        self.assertGreater(len(predictions['risks']), 0)
        risk = predictions['risks'][0]
        self.assertEqual(risk['category'], 'testing')
        self.assertEqual(risk['severity'], 'high')

    def test_no_risk_for_good_coverage(self):
        """Should not generate risk when coverage above 50%."""
        self.coverage['summary']['coverage_percentage'] = 75.0

        predictions = _generate_predictions(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        testing_risks = [r for r in predictions['risks']
                        if r['category'] == 'testing']
        self.assertEqual(len(testing_risks), 0)

    def test_summary_health_status(self):
        """Summary should have correct health status."""
        predictions = _generate_predictions(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        # Low coverage and high issues = needs_attention
        self.assertEqual(predictions['summary']['overall_health'], 'needs_attention')

    def test_summary_with_good_metrics(self):
        """Summary should show good health with good metrics."""
        self.coverage['summary']['coverage_percentage'] = 75.0
        self.quality['summary']['total_issues'] = 50

        predictions = _generate_predictions(
            self.quality, self.coverage, self.deps, TEST_TIMESTAMP
        )

        self.assertEqual(predictions['summary']['overall_health'], 'good')


class TestGenerateToolsReport(unittest.TestCase):
    """Tests for _generate_tools_report function."""

    def test_generates_report_structure(self):
        """Should generate correct report structure."""
        quality = {'issues': []}

        report = _generate_tools_report(quality, TEST_TIMESTAMP)

        self.assertIn('summary', report)
        self.assertIn('tools', report)
        self.assertIn('utilities', report)
        self.assertEqual(report['summary']['last_updated'], TEST_TIMESTAMP)

    def test_extracts_utilities_from_issues(self):
        """Should extract utilities from quality issues."""
        quality = {
            'issues': [
                {'file': 'src/utils/helpers.ts'},
                {'file': 'src/tools/analyzer.py'},
                {'file': 'src/component.tsx'},  # Not a util
            ]
        }

        report = _generate_tools_report(quality, TEST_TIMESTAMP)

        self.assertEqual(len(report['utilities']), 2)


class TestArchiveReport(unittest.TestCase):
    """Tests for archive_report function."""

    def setUp(self):
        """Set up temp directories."""
        import shutil
        self.temp_dir = tempfile.mkdtemp()
        self.public_dir = Path(self.temp_dir) / 'public' / 'data'
        self.archive_dir = self.public_dir / 'archive'

        # Create directories
        (self.public_dir / 'quality').mkdir(parents=True)

    def tearDown(self):
        """Clean up temp directories."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_archives_existing_report(self):
        """Should archive existing report with timestamp."""
        report_path = self.public_dir / 'quality' / 'quality_report.json'
        report_path.write_text('{"test": "original"}')

        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', self.archive_dir):
            result = archive_report(report_path, '20240115_120000')

        self.assertIsNotNone(result)
        self.assertIn('quality_report_20240115_120000.json', result)
        archived_path = Path(result)
        self.assertTrue(archived_path.exists())
        self.assertEqual(archived_path.read_text(), '{"test": "original"}')

    def test_returns_none_for_missing_file(self):
        """Should return None if report doesn't exist."""
        report_path = self.public_dir / 'quality' / 'nonexistent.json'

        result = archive_report(report_path, '20240115_120000')

        self.assertIsNone(result)

    def test_creates_archive_subdirectory(self):
        """Should create archive subdirectory structure."""
        report_path = self.public_dir / 'quality' / 'quality_report.json'
        report_path.write_text('{"test": true}')

        with patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', self.archive_dir):
            archive_report(report_path, '20240115_120000')

        self.assertTrue((self.archive_dir / 'quality').exists())


class TestCopyReports(unittest.TestCase):
    """Tests for copy_reports function."""

    def setUp(self):
        """Set up temp directories."""
        import shutil
        self.temp_dir = tempfile.mkdtemp()
        self.outputs_dir = Path(self.temp_dir) / 'outputs'
        self.public_dir = Path(self.temp_dir) / 'public' / 'data'
        self.archive_dir = self.public_dir / 'archive'

        # Create source directories
        (self.outputs_dir / 'quality').mkdir(parents=True)
        (self.outputs_dir / 'coverage').mkdir(parents=True)

    def tearDown(self):
        """Clean up temp directories."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @patch('scripts.conditional_regenerate.OUTPUTS_DIR')
    @patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR')
    @patch('scripts.conditional_regenerate.ARCHIVE_DIR')
    def test_copies_quality_report(self, mock_archive, mock_public, mock_outputs):
        """Should copy quality report."""
        # Create source file
        src = self.outputs_dir / 'quality' / 'quality_report.json'
        src.write_text('{"test": true}')

        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', self.archive_dir):
            copied, archived = copy_reports({REPORT_QUALITY})

        self.assertEqual(len(copied), 1)
        dst = self.public_dir / 'quality' / 'quality_report.json'
        self.assertTrue(dst.exists())

    def test_archives_before_overwriting(self):
        """Should archive existing report before overwriting."""
        # Create source file
        src = self.outputs_dir / 'quality' / 'quality_report.json'
        src.write_text('{"version": "new"}')

        # Create existing destination file
        dst_dir = self.public_dir / 'quality'
        dst_dir.mkdir(parents=True)
        dst = dst_dir / 'quality_report.json'
        dst.write_text('{"version": "old"}')

        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', self.archive_dir):
            copied, archived = copy_reports({REPORT_QUALITY}, archive=True)

        self.assertEqual(len(copied), 1)
        self.assertEqual(len(archived), 1)
        # Verify archive was created
        archive_file = Path(archived[0])
        self.assertTrue(archive_file.exists())
        self.assertEqual(archive_file.read_text(), '{"version": "old"}')
        # Verify new file was copied
        self.assertEqual(dst.read_text(), '{"version": "new"}')

    def test_no_archive_when_disabled(self):
        """Should not archive when archive=False."""
        # Create source file
        src = self.outputs_dir / 'quality' / 'quality_report.json'
        src.write_text('{"version": "new"}')

        # Create existing destination file
        dst_dir = self.public_dir / 'quality'
        dst_dir.mkdir(parents=True)
        dst = dst_dir / 'quality_report.json'
        dst.write_text('{"version": "old"}')

        with patch('scripts.conditional_regenerate.OUTPUTS_DIR', self.outputs_dir), \
             patch('scripts.conditional_regenerate.PUBLIC_DATA_DIR', self.public_dir), \
             patch('scripts.conditional_regenerate.ARCHIVE_DIR', self.archive_dir):
            copied, archived = copy_reports({REPORT_QUALITY}, archive=False)

        self.assertEqual(len(copied), 1)
        self.assertEqual(len(archived), 0)  # No archives
        # Verify new file was still copied
        self.assertEqual(dst.read_text(), '{"version": "new"}')


class TestRegenerateFunction(unittest.TestCase):
    """Tests for the main regenerate function."""

    @patch('scripts.conditional_regenerate.get_changed_files')
    def test_no_changes_returns_early(self, mock_get_changes):
        """Should return early when no changes detected."""
        mock_get_changes.return_value = []

        result = regenerate(dry_run=False, force=False)

        self.assertTrue(result.success)
        self.assertEqual(len(result.reports_regenerated), 0)

    @patch('scripts.conditional_regenerate.get_changed_files')
    def test_dry_run_doesnt_regenerate(self, mock_get_changes):
        """Dry run should not actually regenerate."""
        mock_get_changes.return_value = ['src/analyzers/quality.py']

        result = regenerate(dry_run=True, force=False)

        self.assertTrue(result.success)
        # Reports listed but not actually regenerated
        self.assertGreater(len(result.reports_regenerated), 0)

    @patch('scripts.conditional_regenerate.get_changed_files')
    @patch('scripts.conditional_regenerate.run_analysis')
    @patch('scripts.conditional_regenerate.copy_reports')
    @patch('scripts.conditional_regenerate.generate_derived_reports')
    def test_force_regenerates_all(self, mock_derived, mock_copy,
                                    mock_analysis, mock_get_changes):
        """Force should regenerate all reports."""
        mock_analysis.return_value = True
        # Return tuple: (copied, archived)
        mock_copy.return_value = (['quality.json', 'coverage.json', 'deps.json'], [])
        # Return tuple: (success, archived)
        mock_derived.return_value = (True, [])

        result = regenerate(dry_run=False, force=True)

        self.assertTrue(result.success)
        mock_analysis.assert_called_once()
        mock_copy.assert_called_once()
        mock_derived.assert_called_once()

    @patch('scripts.conditional_regenerate.get_changed_files')
    @patch('scripts.conditional_regenerate.run_analysis')
    @patch('scripts.conditional_regenerate.copy_reports')
    @patch('scripts.conditional_regenerate.generate_derived_reports')
    def test_tracks_archived_reports(self, mock_derived, mock_copy,
                                      mock_analysis, mock_get_changes):
        """Should track archived reports in result."""
        mock_analysis.return_value = True
        mock_copy.return_value = (
            ['quality.json'],
            ['quality_20240115.json']  # Archived file
        )
        mock_derived.return_value = (True, ['insights_20240115.json'])

        result = regenerate(dry_run=False, force=True)

        self.assertTrue(result.success)
        self.assertEqual(len(result.reports_archived), 2)
        self.assertIn('quality_20240115.json', result.reports_archived)
        self.assertIn('insights_20240115.json', result.reports_archived)

    @patch('scripts.conditional_regenerate.get_changed_files')
    @patch('scripts.conditional_regenerate.run_analysis')
    def test_analysis_failure_returns_error(self, mock_analysis, mock_get_changes):
        """Should return error when analysis fails."""
        mock_get_changes.return_value = ['src/analyzers/quality.py']
        mock_analysis.return_value = False

        result = regenerate(dry_run=False, force=False)

        self.assertFalse(result.success)
        self.assertIn('Analysis failed', result.errors)


class TestReportConstants(unittest.TestCase):
    """Tests for report type constants."""

    def test_primary_reports_defined(self):
        """Primary reports should be defined correctly."""
        expected = {REPORT_QUALITY, REPORT_COVERAGE, REPORT_DEPENDENCIES}
        self.assertEqual(PRIMARY_REPORTS, expected)

    def test_derived_reports_defined(self):
        """Derived reports should be defined correctly."""
        expected = {REPORT_INSIGHTS, REPORT_PREDICTIONS, REPORT_TOOLS}
        self.assertEqual(DERIVED_REPORTS, expected)

    def test_no_overlap_between_primary_and_derived(self):
        """Primary and derived reports should not overlap."""
        overlap = PRIMARY_REPORTS & DERIVED_REPORTS
        self.assertEqual(len(overlap), 0)


if __name__ == '__main__':
    unittest.main()
