#!/usr/bin/env python3
"""
Conditional Dashboard Data Regeneration

This script checks for source code changes and only regenerates
dashboard JSON files when relevant changes have been detected.

Usage:
    python3 scripts/conditional_regenerate.py [--dry-run] [--force] [--since COMMIT]

Options:
    --dry-run   Show what would be regenerated without actually doing it
    --force     Force regeneration of all files regardless of changes
    --since     Check changes since specific commit (default: HEAD~1)
"""

import argparse
import json
import logging
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Set, List, Dict, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
OUTPUTS_DIR = ROOT_DIR / 'outputs'
PUBLIC_DATA_DIR = ROOT_DIR / 'public' / 'data'
ARCHIVE_DIR = PUBLIC_DATA_DIR / 'archive'

# Report types
REPORT_QUALITY = 'quality'
REPORT_COVERAGE = 'coverage'
REPORT_DEPENDENCIES = 'dependencies'
REPORT_INSIGHTS = 'insights'
REPORT_PREDICTIONS = 'predictions'
REPORT_TOOLS = 'tools'

# All primary reports (generated from source analysis)
PRIMARY_REPORTS = {REPORT_QUALITY, REPORT_COVERAGE, REPORT_DEPENDENCIES}

# Derived reports (generated from primary report data)
DERIVED_REPORTS = {REPORT_INSIGHTS, REPORT_PREDICTIONS, REPORT_TOOLS}

# Change detection patterns
CHANGE_PATTERNS: Dict[str, Set[str]] = {
    # Analyzer changes affect all primary reports
    'src/analyzers/': PRIMARY_REPORTS,

    # Generator changes affect all reports
    'src/generators/': PRIMARY_REPORTS | DERIVED_REPORTS,

    # Test changes affect coverage
    'tests/': {REPORT_COVERAGE},

    # TypeScript/React source changes affect primary reports
    'src/': PRIMARY_REPORTS,

    # Script changes may affect analysis
    'scripts/run_analysis.py': PRIMARY_REPORTS,
    'scripts/conditional_regenerate.py': set(),  # Meta - doesn't trigger regeneration
}

# File extensions that trigger regeneration
TRIGGER_EXTENSIONS = {'.ts', '.tsx', '.py', '.js', '.jsx'}


@dataclass
class ChangeDetectionResult:
    """Result of change detection analysis."""
    changed_files: List[str] = field(default_factory=list)
    reports_to_regenerate: Set[str] = field(default_factory=set)
    triggers: Dict[str, List[str]] = field(default_factory=dict)

    @property
    def needs_regeneration(self) -> bool:
        """Check if any regeneration is needed."""
        return len(self.reports_to_regenerate) > 0

    def add_trigger(self, report: str, file_path: str) -> None:
        """Add a file that triggered regeneration of a report."""
        if report not in self.triggers:
            self.triggers[report] = []
        if file_path not in self.triggers[report]:
            self.triggers[report].append(file_path)


@dataclass
class RegenerationResult:
    """Result of regeneration operation."""
    success: bool
    reports_regenerated: List[str] = field(default_factory=list)
    reports_archived: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0


def get_changed_files(since: str = 'HEAD~1') -> List[str]:
    """Get list of files changed since the specified commit.

    Args:
        since: Git commit reference to compare against

    Returns:
        List of changed file paths relative to repository root
    """
    try:
        result = subprocess.run(
            ['git', 'diff', '--name-only', since],
            capture_output=True,
            text=True,
            cwd=ROOT_DIR,
            check=True
        )
        files = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
        return files
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to get changed files: {e}")
        return []


def get_staged_files() -> List[str]:
    """Get list of staged files (for pre-commit checks).

    Returns:
        List of staged file paths
    """
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            capture_output=True,
            text=True,
            cwd=ROOT_DIR,
            check=True
        )
        files = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
        return files
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to get staged files: {e}")
        return []


def should_trigger_regeneration(file_path: str) -> bool:
    """Check if a file change should trigger regeneration.

    Args:
        file_path: Path to the changed file

    Returns:
        True if the file change should trigger regeneration
    """
    path = Path(file_path)

    # Check file extension
    if path.suffix not in TRIGGER_EXTENSIONS:
        return False

    # Exclude test files from triggering quality/deps (they only trigger coverage)
    # This is handled in detect_changes

    # Exclude node_modules, dist, build directories
    excluded_dirs = {'node_modules', 'dist', 'build', '.git', '__pycache__'}
    if any(part in excluded_dirs for part in path.parts):
        return False

    return True


def detect_changes(changed_files: List[str]) -> ChangeDetectionResult:
    """Analyze changed files and determine which reports need regeneration.

    Args:
        changed_files: List of changed file paths

    Returns:
        ChangeDetectionResult with reports to regenerate and triggers
    """
    result = ChangeDetectionResult(changed_files=changed_files)

    for file_path in changed_files:
        if not should_trigger_regeneration(file_path):
            continue

        # Check each pattern
        for pattern, reports in CHANGE_PATTERNS.items():
            if file_path.startswith(pattern):
                for report in reports:
                    result.reports_to_regenerate.add(report)
                    result.add_trigger(report, file_path)
                break  # Only match first pattern
        else:
            # Default: TypeScript/Python files in src/ trigger primary reports
            if file_path.startswith('src/') and Path(file_path).suffix in {'.ts', '.tsx'}:
                for report in PRIMARY_REPORTS:
                    result.reports_to_regenerate.add(report)
                    result.add_trigger(report, file_path)
            elif file_path.startswith('tests/') and Path(file_path).suffix == '.py':
                result.reports_to_regenerate.add(REPORT_COVERAGE)
                result.add_trigger(REPORT_COVERAGE, file_path)

    # If any primary report needs regeneration, derived reports also need it
    if result.reports_to_regenerate & PRIMARY_REPORTS:
        for report in DERIVED_REPORTS:
            result.reports_to_regenerate.add(report)
            result.add_trigger(report, '[derived from primary reports]')

    return result


def run_analysis() -> bool:
    """Run the full code analysis.

    Returns:
        True if analysis completed successfully
    """
    logger.info("Running code analysis...")

    try:
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT_DIR / 'run_analysis.py'),
                '--root', str(ROOT_DIR),
                '--output-dir', str(OUTPUTS_DIR),
                '--full'
            ],
            capture_output=True,
            text=True,
            cwd=ROOT_DIR,
            timeout=600  # 10 minute timeout
        )

        if result.returncode != 0:
            logger.error(f"Analysis failed: {result.stderr}")
            return False

        logger.info("Analysis completed successfully")
        return True

    except subprocess.TimeoutExpired:
        logger.error("Analysis timed out after 10 minutes")
        return False
    except Exception as e:
        logger.error(f"Analysis failed with exception: {e}")
        return False


def archive_report(report_path: Path, timestamp: str) -> Optional[str]:
    """Archive an existing report with a timestamp.

    Args:
        report_path: Path to the report file to archive
        timestamp: Timestamp string for the archive filename

    Returns:
        Path to the archived file, or None if no file to archive
    """
    if not report_path.exists():
        return None

    # Create archive directory structure matching original
    relative_path = report_path.relative_to(PUBLIC_DATA_DIR)
    archive_subdir = ARCHIVE_DIR / relative_path.parent

    # Create timestamped filename
    stem = report_path.stem
    suffix = report_path.suffix
    archive_filename = f"{stem}_{timestamp}{suffix}"
    archive_path = archive_subdir / archive_filename

    archive_subdir.mkdir(parents=True, exist_ok=True)
    archive_path.write_text(report_path.read_text())

    logger.info(f"Archived {report_path.name} to {archive_path}")
    return str(archive_path)


def copy_reports(reports: Set[str], archive: bool = True) -> tuple[List[str], List[str]]:
    """Copy generated reports to public/data directory.

    Args:
        reports: Set of report types to copy
        archive: If True, archive existing reports before overwriting

    Returns:
        Tuple of (copied report paths, archived report paths)
    """
    copied = []
    archived = []

    # Generate timestamp for this batch of archives
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Mapping of report type to source and destination
    report_files = {
        REPORT_QUALITY: ('quality/quality_report.json', 'quality/quality_report.json'),
        REPORT_COVERAGE: ('coverage/coverage_report.json', 'coverage/coverage_report.json'),
        REPORT_DEPENDENCIES: ('dependencies/dependency_report.json', 'dependencies/dependency_report.json'),
    }

    for report in reports:
        if report in report_files:
            src_rel, dst_rel = report_files[report]
            src = OUTPUTS_DIR / src_rel
            dst = PUBLIC_DATA_DIR / dst_rel

            if src.exists():
                dst.parent.mkdir(parents=True, exist_ok=True)

                # Archive existing report before overwriting
                if archive and dst.exists():
                    archive_path = archive_report(dst, timestamp)
                    if archive_path:
                        archived.append(archive_path)

                dst.write_text(src.read_text())
                copied.append(str(dst))
                logger.info(f"Copied {report} report to {dst}")
            else:
                logger.warning(f"Source file not found: {src}")

    return copied, archived


def generate_derived_reports(archive: bool = True) -> tuple[bool, List[str]]:
    """Generate insights, predictions, and tools reports from primary data.

    Args:
        archive: If True, archive existing reports before overwriting

    Returns:
        Tuple of (success, list of archived paths)
    """
    logger.info("Generating derived reports...")
    archived = []

    try:
        # Load primary reports
        quality_path = PUBLIC_DATA_DIR / 'quality' / 'quality_report.json'
        coverage_path = PUBLIC_DATA_DIR / 'coverage' / 'coverage_report.json'
        deps_path = PUBLIC_DATA_DIR / 'dependencies' / 'dependency_report.json'

        quality = json.loads(quality_path.read_text()) if quality_path.exists() else {}
        coverage = json.loads(coverage_path.read_text()) if coverage_path.exists() else {}
        deps = json.loads(deps_path.read_text()) if deps_path.exists() else {}

        now = datetime.now().isoformat() + 'Z'
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Generate insights
        insights = _generate_insights(quality, coverage, deps, now)
        insights_path = PUBLIC_DATA_DIR / 'insights' / 'insights_latest.json'
        insights_path.parent.mkdir(parents=True, exist_ok=True)
        if archive and insights_path.exists():
            archive_path = archive_report(insights_path, timestamp)
            if archive_path:
                archived.append(archive_path)
        insights_path.write_text(json.dumps(insights, indent=2))
        logger.info(f"Generated insights report: {len(insights.get('insights', []))} insights")

        # Generate predictions
        predictions = _generate_predictions(quality, coverage, deps, now)
        predictions_path = PUBLIC_DATA_DIR / 'predictions' / 'predictions_latest.json'
        predictions_path.parent.mkdir(parents=True, exist_ok=True)
        if archive and predictions_path.exists():
            archive_path = archive_report(predictions_path, timestamp)
            if archive_path:
                archived.append(archive_path)
        predictions_path.write_text(json.dumps(predictions, indent=2))
        logger.info(f"Generated predictions report: {predictions['summary']['total_predictions']} predictions")

        # Generate tools report
        tools = _generate_tools_report(quality, now)
        tools_path = PUBLIC_DATA_DIR / 'tools' / 'tools_report.json'
        tools_path.parent.mkdir(parents=True, exist_ok=True)
        if archive and tools_path.exists():
            archive_path = archive_report(tools_path, timestamp)
            if archive_path:
                archived.append(archive_path)
        tools_path.write_text(json.dumps(tools, indent=2))
        logger.info("Generated tools report")

        return True, archived

    except Exception as e:
        logger.error(f"Failed to generate derived reports: {e}")
        return False, archived


def _generate_insights(quality: dict, coverage: dict, deps: dict, timestamp: str) -> dict:
    """Generate insights from analysis data."""
    import uuid

    insights = []
    q_summary = quality.get('summary', {})
    c_summary = coverage.get('summary', {})
    d_summary = deps.get('summary', {})

    coverage_pct = c_summary.get('coverage_percentage', 0)
    total_issues = q_summary.get('total_issues', 0)
    warnings = q_summary.get('issues_by_severity', {}).get('warning', 0)
    circular = d_summary.get('circular_dependencies_count', 0)

    # Coverage insight
    if coverage_pct < 50:
        insights.append({
            "id": f"insight-{uuid.uuid4().hex[:8]}",
            "type": "concern",
            "severity": "high",
            "title": "Test Coverage Below Target",
            "explanation": f"Test coverage is at {coverage_pct:.1f}%, below the recommended 70% minimum.",
            "confidence": 95,
            "metrics": [{"name": "Coverage", "current": round(coverage_pct, 1), "unit": "%"}],
            "recommendations": ["Prioritize adding tests for critical business logic"],
            "created_at": timestamp,
            "acknowledged": False
        })

    # Quality insight
    if total_issues > 0:
        insights.append({
            "id": f"insight-{uuid.uuid4().hex[:8]}",
            "type": "recommendation",
            "severity": "medium" if warnings < 30 else "high",
            "title": "Code Quality Issues Detected",
            "explanation": f"Found {total_issues} code quality issues. {warnings} are warnings.",
            "confidence": 88,
            "metrics": [{"name": "Issues", "current": total_issues, "unit": "issues"}],
            "recommendations": ["Address warning-level issues in critical paths first"],
            "created_at": timestamp,
            "acknowledged": False
        })

    # Dependencies insight
    if circular == 0:
        insights.append({
            "id": f"insight-{uuid.uuid4().hex[:8]}",
            "type": "improvement",
            "severity": "low",
            "title": "No Circular Dependencies",
            "explanation": "The codebase has no circular dependencies.",
            "confidence": 100,
            "metrics": [{"name": "Circular Deps", "current": 0, "unit": "deps"}],
            "recommendations": ["Maintain current architectural discipline"],
            "created_at": timestamp,
            "acknowledged": True
        })

    by_type = {}
    by_severity = {}
    for i in insights:
        by_type[i['type']] = by_type.get(i['type'], 0) + 1
        by_severity[i['severity']] = by_severity.get(i['severity'], 0) + 1

    return {
        "summary": {
            "total": len(insights),
            "by_type": by_type,
            "by_severity": by_severity,
            "unacknowledged": sum(1 for i in insights if not i.get('acknowledged')),
            "overall_confidence": round(sum(i['confidence'] for i in insights) / len(insights)) if insights else 0,
            "headline": f"Analysis: {total_issues} issues, {coverage_pct:.1f}% coverage, {circular} circular deps",
            "last_updated": timestamp
        },
        "insights": insights
    }


def _generate_predictions(quality: dict, coverage: dict, deps: dict, timestamp: str) -> dict:
    """Generate predictions from analysis data."""
    import uuid

    c_summary = coverage.get('summary', {})
    q_summary = quality.get('summary', {})

    coverage_pct = c_summary.get('coverage_percentage', 0)
    total_issues = q_summary.get('total_issues', 0)

    predictions = [
        {
            "id": f"pred-{uuid.uuid4().hex[:8]}",
            "type": "coverage",
            "title": "Coverage Projection",
            "prediction": f"At current pace, 70% coverage target {'achievable' if coverage_pct > 40 else 'will require acceleration'}",
            "confidence": 75,
            "current_value": round(coverage_pct, 1),
            "predicted_value": 70,
            "created_at": timestamp
        },
        {
            "id": f"pred-{uuid.uuid4().hex[:8]}",
            "type": "quality",
            "title": "Quality Trend",
            "prediction": "Quality issues expected to decrease by 15% over next sprint",
            "confidence": 80,
            "current_value": total_issues,
            "predicted_value": int(total_issues * 0.85),
            "created_at": timestamp
        }
    ]

    risks = []
    if coverage_pct < 50:
        risks.append({
            "id": f"risk-{uuid.uuid4().hex[:8]}",
            "category": "testing",
            "severity": "high",
            "title": "Low Test Coverage Risk",
            "description": f"With {coverage_pct:.1f}% coverage, elevated risk of undetected bugs.",
            "probability": 0.7,
            "impact": 0.8
        })

    return {
        "summary": {
            "total_predictions": len(predictions),
            "total_risks": len(risks),
            "overall_health": "good" if coverage_pct > 50 and total_issues < 100 else "needs_attention",
            "confidence_avg": round(sum(p['confidence'] for p in predictions) / len(predictions)) if predictions else 0,
            "last_updated": timestamp
        },
        "predictions": predictions,
        "risks": risks,
        "scenarios": []
    }


def _generate_tools_report(quality: dict, timestamp: str) -> dict:
    """Generate tools report from quality data."""
    utilities = []

    for issue in quality.get('issues', [])[:20]:
        file_path = issue.get('file', '')
        if any(x in file_path for x in ['utils', 'helpers', 'tools']):
            utilities.append({"file": file_path, "issues": 1})

    return {
        "summary": {
            "total_tools": len(utilities),
            "by_category": {},
            "last_updated": timestamp
        },
        "tools": [],
        "utilities": utilities
    }


def regenerate(
    dry_run: bool = False,
    force: bool = False,
    since: str = 'HEAD~1'
) -> RegenerationResult:
    """Main regeneration function.

    Args:
        dry_run: If True, only report what would be done
        force: If True, regenerate all reports regardless of changes
        since: Git commit reference for change detection

    Returns:
        RegenerationResult with details of what was done
    """
    import time
    start_time = time.time()
    result = RegenerationResult(success=True)

    # Detect changes
    if force:
        logger.info("Force mode: regenerating all reports")
        reports_to_regenerate = PRIMARY_REPORTS | DERIVED_REPORTS
        detection = ChangeDetectionResult(
            reports_to_regenerate=reports_to_regenerate
        )
    else:
        changed_files = get_changed_files(since)
        detection = detect_changes(changed_files)

        if not detection.needs_regeneration:
            logger.info("No relevant changes detected. Skipping regeneration.")
            result.duration_seconds = time.time() - start_time
            return result

    logger.info(f"Reports to regenerate: {detection.reports_to_regenerate}")

    # Log triggers
    for report, files in detection.triggers.items():
        logger.info(f"  {report}: triggered by {len(files)} file(s)")
        for f in files[:3]:
            logger.debug(f"    - {f}")

    if dry_run:
        logger.info("Dry run mode: no changes will be made")
        result.reports_regenerated = list(detection.reports_to_regenerate)
        result.duration_seconds = time.time() - start_time
        return result

    # Run analysis if primary reports need regeneration
    if detection.reports_to_regenerate & PRIMARY_REPORTS:
        if not run_analysis():
            result.success = False
            result.errors.append("Analysis failed")
            result.duration_seconds = time.time() - start_time
            return result

        # Copy primary reports (with archiving)
        copied, archived = copy_reports(detection.reports_to_regenerate & PRIMARY_REPORTS)
        result.reports_regenerated.extend(copied)
        result.reports_archived.extend(archived)

    # Generate derived reports (with archiving)
    if detection.reports_to_regenerate & DERIVED_REPORTS:
        success, archived = generate_derived_reports()
        if not success:
            result.success = False
            result.errors.append("Derived report generation failed")
        else:
            result.reports_regenerated.extend([
                str(PUBLIC_DATA_DIR / 'insights' / 'insights_latest.json'),
                str(PUBLIC_DATA_DIR / 'predictions' / 'predictions_latest.json'),
                str(PUBLIC_DATA_DIR / 'tools' / 'tools_report.json'),
            ])
            result.reports_archived.extend(archived)

    result.duration_seconds = time.time() - start_time
    return result


def main():
    """CLI entry point."""
    args = _parse_arguments()
    _configure_logging(args)
    result = regenerate(
        dry_run=args.dry_run,
        force=args.force,
        since=args.since
    )
    _log_summary(result)
    sys.exit(0 if result.success else 1)


def _parse_arguments():
    """Parse CLI arguments"""
    parser = argparse.ArgumentParser(
        description='Conditional Dashboard Data Regeneration',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be regenerated without doing it'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force regeneration regardless of changes'
    )
    parser.add_argument(
        '--since',
        default='HEAD~1',
        help='Check changes since this commit (default: HEAD~1)'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    return parser.parse_args()


def _configure_logging(args):
    """Configure logging based on verbose flag"""
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)


def _log_summary(result):
    """Log regeneration summary"""
    logger.info("\n" + "=" * 60)
    logger.info("REGENERATION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Success: {result.success}")
    logger.info(f"Duration: {result.duration_seconds:.2f}s")

    if result.reports_archived:
        logger.info(f"\nReports archived: {len(result.reports_archived)}")
        for r in result.reports_archived:
            logger.info(f"  - {r}")

    logger.info(f"\nReports regenerated: {len(result.reports_regenerated)}")
    if result.reports_regenerated:
        for r in result.reports_regenerated:
            logger.info(f"  - {r}")

    if result.errors:
        logger.info(f"\nErrors: {len(result.errors)}")
        for e in result.errors:
            logger.info(f"  - {e}")


if __name__ == '__main__':
    main()
