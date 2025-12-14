#!/usr/bin/env python3
"""
Run All Analysis - Master script to run all code analysis tools
"""

import subprocess
import logging
from pathlib import Path
from datetime import datetime
import sys
import shutil
from typing import List, Dict, Optional

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import cache and checkpoint managers
from src.cache import AnalysisCache, CheckpointManager

# Set up logger
logger = logging.getLogger(__name__)

# Default timeout configurations (in seconds)
DEFAULT_TIMEOUTS = {
    'schema_generation': 1800,  # 30 minutes - most intensive
    'quality_analysis': 600,     # 10 minutes
    'coverage_analysis': 600,    # 10 minutes
    'dependency_analysis': 600,  # 10 minutes
    'dashboard_generation': 300, # 5 minutes
    'rss_generation': 60,        # 1 minute
    'schema_validation': 60,     # 1 minute
    'default': 900               # 15 minutes fallback
}

def verify_dependencies() -> bool:
    """
    Verify required tools and dependencies are available
    Returns True if all dependencies are met, False otherwise
    """
    logger.info("Verifying dependencies...")

    # Required command-line tools
    required_tools = {
        'python3': 'Python 3 interpreter',
        'ast-grep': 'AST-based code search tool (install: brew install ast-grep)',
        'git': 'Git version control (install: brew install git)'
    }

    missing_tools = []
    for tool, description in required_tools.items():
        if not shutil.which(tool):
            missing_tools.append(f"  ❌ {tool}: {description}")
            logger.error(f"Missing required tool: {tool}")
        else:
            logger.info(f"  ✅ {tool} found")

    # Check Python modules
    required_modules = {
        'pathlib': 'Path manipulation (built-in)',
        'subprocess': 'Process execution (built-in)',
        'logging': 'Logging (built-in)',
    }

    optional_modules = {
        'sentry_sdk': 'Error tracking (install: pip install sentry-sdk)',
    }

    missing_modules = []
    for module, description in required_modules.items():
        try:
            __import__(module)
            logger.info(f"  ✅ {module} module available")
        except ImportError:
            missing_modules.append(f"  ❌ {module}: {description}")
            logger.error(f"Missing required module: {module}")

    # Check optional modules (warnings only)
    for module, description in optional_modules.items():
        try:
            __import__(module)
            logger.info(f"  ✅ {module} module available (optional)")
        except ImportError:
            logger.warning(f"  ⚠️  {module} not available (optional): {description}")

    if missing_tools or missing_modules:
        logger.error("\n" + "="*80)
        logger.error("DEPENDENCY CHECK FAILED")
        logger.error("="*80)
        if missing_tools:
            logger.error("\nMissing tools:")
            for tool in missing_tools:
                logger.error(tool)
        if missing_modules:
            logger.error("\nMissing modules:")
            for module in missing_modules:
                logger.error(module)
        logger.error("\nPlease install missing dependencies and try again.")
        logger.error("="*80 + "\n")
        return False

    logger.info("✅ All required dependencies are available\n")
    return True

class AnalysisRunner:
    """Runs all analysis tools and generates reports"""

    def __init__(
        self,
        root_dir: Path,
        output_dir: Path = None,
        timeouts: Dict[str, int] = None,
        repositories: Optional[List[str]] = None,
        incremental: bool = False,
        full: bool = False,
        since: Optional[str] = None,
        resume: bool = False
    ):
        """Initialize the analysis runner.

        Args:
            root_dir: Root directory to analyze
            output_dir: Directory for output reports. Defaults to root_dir/analysis_reports
            timeouts: Custom timeout values for each analysis step
            repositories: List of repository paths to analyze
            incremental: Run incremental analysis on changed files only
            full: Force full analysis even with incremental flag
            since: Git commit hash to compare against for incremental analysis
            resume: Resume from last checkpoint if available
        """
        self._setup_directories(root_dir, output_dir)
        self._initialize_tracking()
        self._setup_timeouts(timeouts)
        self._setup_analysis_mode(repositories, incremental, full, since, resume, root_dir)

    def _setup_directories(self, root_dir, output_dir):
        """Set up directory structure"""
        self.root_dir = root_dir
        self.output_dir = output_dir or root_dir / 'analysis_reports'
        self.output_dir.mkdir(exist_ok=True)

        self.logs_dir = self.output_dir / 'logs'
        self.logs_dir.mkdir(exist_ok=True)

    def _initialize_tracking(self):
        """Initialize tracking variables"""
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.results = {}
        self.start_time = None
        self.end_time = None
        self.total_files_processed = 0

    def _setup_timeouts(self, timeouts):
        """Set up timeout configuration"""
        self.timeouts = DEFAULT_TIMEOUTS.copy()
        if timeouts:
            self.timeouts.update(timeouts)

    def _setup_analysis_mode(self, repositories, incremental, full, since, resume, root_dir):
        """Set up analysis mode and cache managers"""
        self.repositories = repositories
        self.incremental = incremental
        self.full = full
        self.since = since
        self.resume = resume

        self.cache = AnalysisCache(root_dir) if (incremental or since) and not full else None
        self.checkpoint = CheckpointManager(root_dir) if resume or not full else None

        self.analysis_steps = [
            'schema_generation',
            'quality_analysis',
            'coverage_analysis',
            'dependency_analysis',
            'dashboard_generation',
            'rss_generation',
            'schema_validation'
        ]

    def _print_command_header(self, description: str, timeout: int):
        """Print command execution header"""
        logger.info(f"\n{'='*80}")
        logger.info(f"Running: {description}")
        logger.info(f"Timeout: {timeout}s ({timeout // 60}m {timeout % 60}s)")
        logger.info(f"{'='*80}\n")

    def _execute_subprocess(self, command: list, timeout: int):
        """Execute subprocess command"""
        inventory_dir = Path(__file__).parent.parent
        return subprocess.run(
            command,
            cwd=inventory_dir,
            capture_output=True,
            text=True,
            timeout=timeout
        )

    def _handle_command_result(self, name: str, result, description: str):
        """Handle and store command result"""
        # Save stderr to log file for debugging
        if result.stderr:
            log_file = self.logs_dir / f'{name}_{self.timestamp}.log'
            with open(log_file, 'w') as f:
                f.write(f"Command: {description}\n")
                f.write(f"Return Code: {result.returncode}\n")
                f.write(f"{'='*80}\n")
                f.write(f"STDERR:\n{result.stderr}\n")
                f.write(f"{'='*80}\n")
                f.write(f"STDOUT:\n{result.stdout}\n")

        self.results[name] = {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
            'log_file': str(self.logs_dir / f'{name}_{self.timestamp}.log') if result.stderr else None
        }

        if result.returncode == 0:
            logger.info(f"✅ {description} completed successfully")
            if result.stdout:
                # Show first 20 lines of output
                stdout_lines = result.stdout.split('\n')
                logger.info('\n'.join(stdout_lines[:20]))
                if len(stdout_lines) > 20:
                    remaining = len(stdout_lines) - 20
                    logger.info(f"... ({remaining} more lines)")
        else:
            logger.error(f"❌ {description} failed (exit code: {result.returncode})")
            if result.stderr:
                # Show first 10 lines of error
                stderr_lines = result.stderr.split('\n')
                logger.error('\n'.join(stderr_lines[:10]))
                if len(stderr_lines) > 10:
                    log_file = self.logs_dir / f'{name}_{self.timestamp}.log'
                    logger.error(f"... (see full log: {log_file})")

        return result.returncode == 0

    def run_command(
        self,
        name: str,
        command: list,
        description: str,
        timeout: Optional[int] = None
    ) -> bool:
        """Run a command and capture result"""
        # Use configured timeout for this analysis type, or default
        if timeout is None:
            timeout = self.timeouts.get(name, self.timeouts['default'])

        self._print_command_header(description, timeout)

        try:
            result = self._execute_subprocess(command, timeout)
            return self._handle_command_result(name, result, description)

        except subprocess.TimeoutExpired as e:
            logger.warning(f"⏱️  {description} timed out after {timeout}s")
            log_file = self.logs_dir / f'{name}_{self.timestamp}.log'
            with open(log_file, 'w') as f:
                f.write(f"Command: {description}\n")
                f.write(f"Error: Timeout after {timeout}s\n")
                if e.stdout:
                    f.write(f"{'='*80}\n")
                    f.write(f"STDOUT (partial):\n{e.stdout}\n")
                if e.stderr:
                    f.write(f"{'='*80}\n")
                    f.write(f"STDERR (partial):\n{e.stderr}\n")
            self.results[name] = {
                'success': False,
                'error': f'Timeout after {timeout}s',
                'log_file': str(log_file)
            }
            return False
        except Exception as e:
            logger.error(f"❌ {description} error: {e}")
            log_file = self.logs_dir / f'{name}_{self.timestamp}.log'
            with open(log_file, 'w') as f:
                f.write(f"Command: {description}\n")
                f.write(f"Error: {str(e)}\n")
            self.results[name] = {
                'success': False,
                'error': str(e),
                'log_file': str(log_file)
            }
            return False

    def _print_analysis_header(self):
        """Print analysis header information"""
        logger.info(f"\n{'='*80}")
        logger.info("CODE INVENTORY - COMPREHENSIVE ANALYSIS")
        logger.info(f"{'='*80}")
        logger.info(f"Root Directory: {self.root_dir}")
        logger.info(f"Output Directory: {self.output_dir}")
        logger.info(f"Logs Directory: {self.logs_dir}")
        logger.info(f"Timestamp: {self.timestamp}")
        if self.repositories:
            logger.info(f"Repository Filter: {', '.join(self.repositories)}")

        # Show incremental/resume status
        if self.full:
            logger.info("Mode: Full analysis (ignoring cache)")
        elif self.since:
            logger.info(f"Mode: Incremental (since {self.since})")
        elif self.incremental:
            logger.info("Mode: Incremental (since last run)")
        else:
            logger.info("Mode: Full analysis")

        if self.resume:
            logger.info("Resume: Enabled")
            if self.checkpoint and self.checkpoint.has_checkpoint():
                stats = self.checkpoint.get_checkpoint_stats()
                logger.info(f"         Resuming from {stats['completed_steps']}/{stats['total_steps']} completed steps")

        # Show cache stats if available
        if self.cache:
            stats = self.cache.get_cache_stats()
            logger.info(f"Cache: Enabled ({stats['total_cached_files']} files cached)")

        logger.info(f"{'='*80}\n")

    def _count_source_files(self) -> int:
        """Count source files in the root directory"""
        import os

        count = 0
        valid_extensions = {'.py', '.ts', '.tsx', '.js', '.jsx', '.rb'}
        skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                     '_site', '.venv', 'venv', 'env', '.cache', 'coverage', 'htmlcov'}

        for root, dirs, files in os.walk(self.root_dir):
            # Skip unwanted directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            for filename in files:
                if Path(filename).suffix in valid_extensions:
                    count += 1

        return count

    def _get_elapsed_time(self) -> str:
        """Get formatted elapsed time"""
        if self.start_time and self.end_time:
            elapsed = self.end_time - self.start_time
            if elapsed < 60:
                return f"{elapsed:.1f}s"
            else:
                minutes = int(elapsed // 60)
                seconds = elapsed % 60
                return f"{minutes}m {seconds:.1f}s"
        return "N/A"

    def _run_schema_generation(self):
        """Run schema generation analysis with optimization"""
        # Ensure schemas directory exists
        schemas_dir = self.output_dir / 'schemas'
        schemas_dir.mkdir(parents=True, exist_ok=True)
        schemas_output = schemas_dir / 'schemas_enhanced.json'

        command = [
            'python3', '-m', 'src.generators.schema',
            '--root', str(self.root_dir),
            '--output', str(schemas_output),  # Output to analysis_reports/schemas/
            '--parallel',  # Enable parallel processing for speed
            '--cache'      # Enable caching to skip unchanged files
        ]

        return self.run_command(
            'schema_generation',
            command,
            'Enhanced Schema Generation (parallel + cache)'
        )

    def _run_quality_analysis(self):
        """Run code quality analysis"""
        quality_dir = self.output_dir / 'quality'
        quality_dir.mkdir(parents=True, exist_ok=True)
        quality_output = quality_dir / f'quality_report_{self.timestamp}.json'
        quality_text = quality_dir / f'quality_report_{self.timestamp}.txt'

        return self.run_command(
            'quality_analysis',
            [
                'python3', '-m', 'src.analyzers.code_quality',
                str(self.root_dir),
                '--json', str(quality_output),
                '--text', str(quality_text)
            ],
            'Code Quality Analysis'
        )

    def _run_coverage_analysis(self):
        """Run test coverage analysis"""
        coverage_dir = self.output_dir / 'coverage'
        coverage_dir.mkdir(parents=True, exist_ok=True)
        coverage_output = coverage_dir / f'coverage_report_{self.timestamp}.json'
        coverage_text = coverage_dir / f'coverage_report_{self.timestamp}.txt'

        # Determine test directory - look for tests/ at project root (parent of src/)
        # If root_dir is /project/src, tests are likely at /project/tests
        test_dir = self.root_dir.parent / 'tests'
        if not test_dir.exists():
            # Fallback to root_dir/tests if project root tests/ doesn't exist
            test_dir = self.root_dir / 'tests'

        cmd = [
            'python3', '-m', 'src.analyzers.test_coverage',
            str(self.root_dir),
            '--json', str(coverage_output),
            '--text', str(coverage_text)
        ]

        # Add test-dir if it exists
        if test_dir.exists():
            cmd.extend(['--test-dir', str(test_dir)])

        return self.run_command(
            'coverage_analysis',
            cmd,
            'Test Coverage Analysis'
        )

    def _run_dependency_analysis(self):
        """Run dependency analysis"""
        dependency_dir = self.output_dir / 'dependencies'
        dependency_dir.mkdir(parents=True, exist_ok=True)
        dependency_output = dependency_dir / f'dependency_report_{self.timestamp}.json'
        dependency_text = dependency_dir / f'dependency_report_{self.timestamp}.txt'

        return self.run_command(
            'dependency_analysis',
            [
                'python3', '-m', 'src.analyzers.dependencies',
                str(self.root_dir),
                '--detect-circular',
                '--json', str(dependency_output),
                '--text', str(dependency_text)
            ],
            'Dependency Analysis'
        )

    def _generate_dashboard(self):
        """Generate interactive dashboard"""
        schemas_file = self.output_dir / 'schemas' / 'schemas_enhanced.json'
        quality_output = self.output_dir / 'quality' / f'quality_report_{self.timestamp}.json'
        coverage_output = self.output_dir / 'coverage' / f'coverage_report_{self.timestamp}.json'
        dependency_output = self.output_dir / 'dependencies' / f'dependency_report_{self.timestamp}.json'
        dashboard_dir = self.output_dir / 'dashboards'
        dashboard_dir.mkdir(parents=True, exist_ok=True)
        dashboard_output = dashboard_dir / f'dashboard_{self.timestamp}.html'

        # Build command with optional timing/file count args
        command = [
            'python3', '-m', 'src.generators.dashboard',
            '--schemas', str(schemas_file),
            '--quality', str(quality_output),
            '--coverage', str(coverage_output),
            '--dependency', str(dependency_output),
            '--output', str(dashboard_output),
            '--files-processed', str(self.total_files_processed)
        ]

        # Add elapsed time if available (will be computed at generation time)
        if self.start_time:
            import time
            elapsed = time.time() - self.start_time
            command.extend(['--elapsed-time', f"{elapsed:.1f}"])

        return self.run_command(
            'dashboard_generation',
            command,
            'Dashboard Generation'
        )

    def _generate_rss_feed(self):
        """Generate RSS feed"""
        schemas_file = self.output_dir / 'schemas' / 'schemas_enhanced.json'

        # Skip RSS generation if schemas file doesn't exist
        if not schemas_file.exists():
            logger.warning(f"⚠️  Skipping RSS generation - schemas file not found: {schemas_file}")
            return True  # Don't fail the pipeline

        rss_dir = self.output_dir / 'rss'
        rss_dir.mkdir(parents=True, exist_ok=True)
        rss_output = rss_dir / f'code_updates_{self.timestamp}.xml'

        return self.run_command(
            'rss_generation',
            [
                'python3', '-m', 'src.generators.rss',
                '--schemas', str(schemas_file),
                '--git-repo', str(self.root_dir),
                '--output', str(rss_output),
                '--title', 'Code Inventory Updates',
                '--link', 'https://github.com/yourusername/Inventory'
            ],
            'RSS Feed Generation'
        )

    def _validate_schema(self):
        """Validate Schema.org markup in the generated schemas file"""
        schemas_file = self.output_dir / 'schemas' / 'schemas_enhanced.json'

        # Skip validation if schemas file doesn't exist
        if not schemas_file.exists():
            logger.warning(f"⚠️  Skipping schema validation - schemas file not found: {schemas_file}")
            return True  # Don't fail the pipeline

        return self.run_command(
            'schema_validation',
            [
                'python3', '-m', 'src.validators.schema',
                '--json',
                str(schemas_file)
            ],
            'Schema.org Validation'
        )

    def run_all_analysis(self):
        """Run complete analysis pipeline with checkpoint support"""
        import time

        # Start timing
        self.start_time = time.time()

        self._print_analysis_header()

        # Count files to be processed
        self.total_files_processed = self._count_source_files()

        # Initialize checkpoint manager if enabled
        if self.checkpoint:
            self.checkpoint.initialize_steps(self.analysis_steps)

        # Define analysis methods mapping
        analysis_methods = {
            'schema_generation': self._run_schema_generation,
            'quality_analysis': self._run_quality_analysis,
            'coverage_analysis': self._run_coverage_analysis,
            'dependency_analysis': self._run_dependency_analysis,
            'dashboard_generation': self._generate_dashboard,
            'rss_generation': self._generate_rss_feed,
            'schema_validation': self._validate_schema
        }

        # Run analyses with checkpoint support
        for step_name in self.analysis_steps:
            # Skip if already completed (resume mode)
            if self.checkpoint and self.checkpoint.is_step_completed(step_name):
                logger.info(f"⏩ Skipping {step_name} (already completed)")
                # Restore result from checkpoint
                self.results[step_name] = self.checkpoint.get_step_result(step_name)
                continue

            # Mark step as in progress
            if self.checkpoint:
                self.checkpoint.mark_step_in_progress(step_name)

            # Run the analysis
            analysis_method = analysis_methods[step_name]
            success = analysis_method()

            # Mark step as completed and save checkpoint
            if self.checkpoint:
                self.checkpoint.mark_step_completed(step_name, self.results.get(step_name, {}))

        # Record end time
        self.end_time = time.time()

        # Generate Summary Report
        self.generate_summary_report()

        # Clear checkpoint on successful completion
        if self.checkpoint:
            self.checkpoint.clear_checkpoint()
            logger.info("✅ Analysis pipeline completed successfully")

        # Save cache if incremental analysis was used
        if self.cache:
            self.cache.save_cache()

    def _build_report_header(self) -> List[str]:
        """Build report header lines"""
        return [
            f"# Comprehensive Code Analysis Report",
            f"",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Root Directory:** {self.root_dir}",
            f"",
            "## Analysis Results",
            ""
        ]

    def _build_results_table(self) -> List[str]:
        """Build results table lines"""
        lines = [
            "| Analysis | Status |",
            "|----------|--------|"
        ]

        for name, result in self.results.items():
            status = "✅ Success" if result.get('success') else "❌ Failed"
            lines.append(f"| {name.replace('_', ' ').title()} | {status} |")

        return lines

    def _build_error_details(self) -> List[str]:
        """Build error details section"""
        lines = [
            "",
            "## Error Details",
            ""
        ]

        has_errors = False
        for name, result in self.results.items():
            if not result.get('success'):
                has_errors = True
                title = name.replace('_', ' ').title()
                lines.append(f"### {title} (Failed)")
                lines.append("")

                if 'returncode' in result:
                    lines.append(f"**Exit Code:** {result['returncode']}")
                elif 'error' in result:
                    lines.append(f"**Error:** {result['error']}")

                if result.get('log_file'):
                    lines.append(f"**Log File:** `{result['log_file']}`")

                # Show first few lines of error
                if result.get('stderr'):
                    lines.append("")
                    lines.append("**Error Output (first 5 lines):**")
                    lines.append("```")
                    stderr_lines = result['stderr'].split('\n')
                    lines.extend(stderr_lines[:5])
                    if len(stderr_lines) > 5:
                        remaining = len(stderr_lines) - 5
                        lines.append(f"... ({remaining} more lines in log file)")
                    lines.append("```")

                lines.append("")

        if not has_errors:
            lines.append("No errors occurred during analysis.")
            lines.append("")

        return lines

    def _build_files_section(self) -> List[str]:
        """Build generated files section"""
        return [
            "",
            "## Generated Files",
            "",
            f"- Schemas: `Inventory/schemas_enhanced.json`",
            f"- Dashboard: `analysis_reports/dashboard_{self.timestamp}.html`",
            f"- Quality Report: `analysis_reports/quality_report_{self.timestamp}.txt`",
            f"- Coverage Report: `analysis_reports/coverage_report_{self.timestamp}.txt`",
            f"- Dependency Report: `analysis_reports/dependency_report_{self.timestamp}.txt`",
            f"- RSS Feed: `analysis_reports/code_updates_{self.timestamp}.xml`",
            "",
            "## Next Steps",
            "",
            "1. Open the dashboard in your browser to view interactive results",
            "2. Review quality issues and prioritize fixes",
            "3. Improve test coverage for untested functions",
            "4. Resolve circular dependencies",
            "5. Update documentation with schema.org markup",
            "",
            "---",
            "*Generated by Enhanced Code Inventory System*"
        ]

    def _save_report(self, lines: List[str], path: Path):
        """Save report to file"""
        with open(path, 'w') as f:
            f.write('\n'.join(lines))

    def _print_completion_stats(self):
        """Print completion statistics"""
        logger.info(f"\n{'='*80}")
        logger.info("ANALYSIS COMPLETE!")
        logger.info(f"{'='*80}")
        logger.info(f"\n📊 Summary report: {self.output_dir / f'ANALYSIS_SUMMARY_{self.timestamp}.md'}")
        logger.info(f"📁 All reports saved to: {self.output_dir}\n")

        # Print quick stats
        successful = sum(1 for r in self.results.values() if r.get('success'))
        total = len(self.results)
        logger.info(f"Results: {successful}/{total} analyses completed successfully\n")

    def generate_summary_report(self):
        """Generate summary of all analysis"""
        summary_path = self.output_dir / f'ANALYSIS_SUMMARY_{self.timestamp}.md'

        # Build report sections
        lines = []
        lines.extend(self._build_report_header())
        lines.extend(self._build_results_table())
        lines.extend(self._build_error_details())  # Add error details
        lines.extend(self._build_files_section())

        # Save report
        self._save_report(lines, summary_path)

        # Print completion statistics
        self._print_completion_stats()

def main():
    """CLI entry point for running code analysis."""
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    args = _parse_cli_arguments()
    _verify_environment(args)
    root_dir, output_dir = _parse_directories(args)
    repositories = _parse_repositories(args)
    timeouts = _parse_timeouts(args)
    _handle_cleanup(args, root_dir)
    _validate_arguments(args)

    runner = AnalysisRunner(
        root_dir,
        output_dir,
        timeouts=timeouts,
        repositories=repositories,
        incremental=args.incremental,
        full=args.full,
        since=args.since,
        resume=args.resume
    )
    runner.run_all_analysis()


def _parse_cli_arguments():
    """Parse command line arguments"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Run All Code Analysis with incremental and resume capabilities',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full analysis (default)
  %(prog)s --root /path/to/Inventory

  # Incremental analysis (only changed files since last run)
  %(prog)s --root /path/to/Inventory --incremental

  # Analyze changes since specific commit
  %(prog)s --root /path/to/Inventory --since HEAD~5

  # Resume interrupted analysis
  %(prog)s --root /path/to/Inventory --resume

  # Clear cache and run fresh analysis
  %(prog)s --root /path/to/Inventory --clear-cache

  # Analyze with custom timeout
  %(prog)s --root /path/to/code --timeout 1800

  # Analyze specific repositories only
  %(prog)s --root /path/to/code --repositories Inventory,financial-hub-system

Advanced:
  # Full analysis with custom timeout and specific repositories
  %(prog)s --root /path/to/code --full --timeout 3600 --repositories Inventory

  # Clear checkpoint and start fresh
  %(prog)s --root /path/to/code --clear-checkpoint --clear-cache
        """
    )
    _add_cli_arguments(parser)
    return parser.parse_args()


def _add_cli_arguments(parser):
    """Add arguments to parser"""
    parser.add_argument('--root', default='/Users/alyshialedlie/code',
                       help='Root directory to analyze (default: /Users/alyshialedlie/code)')
    parser.add_argument('--output-dir', help='Output directory for reports (default: ROOT/analysis_reports)')
    parser.add_argument('--timeout', type=int, help='Override default timeout for all analyses (in seconds)')
    parser.add_argument('--repositories', help='Comma-separated list of repository names to analyze (default: all)')
    parser.add_argument('--skip-dependency-check', action='store_true',
                       help='Skip dependency verification (not recommended)')
    parser.add_argument('--incremental', action='store_true',
                       help='Run incremental analysis (only analyze changed files since last run)')
    parser.add_argument('--full', action='store_true', help='Force full analysis (ignore cache, default behavior)')
    parser.add_argument('--since', type=str, metavar='COMMIT',
                       help='Analyze changes since specific git commit (e.g., HEAD~5, abc123)')
    parser.add_argument('--resume', action='store_true',
                       help='Resume from last checkpoint if analysis was interrupted')
    parser.add_argument('--clear-cache', action='store_true', help='Clear analysis cache before running')
    parser.add_argument('--clear-checkpoint', action='store_true', help='Clear checkpoint before running (start fresh)')


def _verify_environment(args):
    """Verify dependencies and environment"""
    if not args.skip_dependency_check:
        if not verify_dependencies():
            logger.error("Dependency check failed. Fix issues or use --skip-dependency-check to bypass.")
            sys.exit(1)

    script_dir = Path(__file__).parent.parent.resolve()
    if not (script_dir / 'src' / 'analyzers').exists():
        logger.error(f"Error: This script must be run from the Inventory project directory")
        logger.error(f"Script location: {script_dir}")
        sys.exit(1)


def _parse_directories(args):
    """Parse and validate directories"""
    root_dir = Path(args.root)
    output_dir = Path(args.output_dir) if args.output_dir else None

    if not root_dir.exists():
        logger.error(f"Error: Target directory not found at {root_dir}")
        sys.exit(1)

    return root_dir, output_dir


def _parse_repositories(args):
    """Parse repository filter"""
    if args.repositories:
        return [r.strip() for r in args.repositories.split(',')]
    return None


def _parse_timeouts(args):
    """Parse timeout configuration"""
    if args.timeout:
        return {key: args.timeout for key in DEFAULT_TIMEOUTS.keys()}
    return None


def _handle_cleanup(args, root_dir):
    """Handle cache and checkpoint cleanup"""
    if args.clear_cache:
        cache_file = root_dir / '.analysis-cache.json'
        if cache_file.exists():
            cache_file.unlink()
            logger.info("🗑️  Cache cleared")

    if args.clear_checkpoint:
        checkpoint_file = root_dir / '.analysis-checkpoint.json'
        if checkpoint_file.exists():
            checkpoint_file.unlink()
            logger.info("🗑️  Checkpoint cleared")


def _validate_arguments(args):
    """Validate argument combinations"""
    if args.full and args.incremental:
        logger.error("❌ Error: --full and --incremental cannot be used together")
        sys.exit(1)

    if args.full and args.since:
        logger.error("❌ Error: --full and --since cannot be used together")
        sys.exit(1)

if __name__ == '__main__':
    main()
