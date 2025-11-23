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
        repositories: Optional[List[str]] = None
    ):
        self.root_dir = root_dir
        self.output_dir = output_dir or root_dir / 'analysis_reports'
        self.output_dir.mkdir(exist_ok=True)

        # Create logs directory for error capture
        self.logs_dir = self.output_dir / 'logs'
        self.logs_dir.mkdir(exist_ok=True)

        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.results = {}

        # Merge custom timeouts with defaults
        self.timeouts = DEFAULT_TIMEOUTS.copy()
        if timeouts:
            self.timeouts.update(timeouts)

        # Store repository filter
        self.repositories = repositories

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
                lines = result.stdout.split('\n')[:20]
                logger.info('\n'.join(lines))
                if len(result.stdout.split('\n')) > 20:
                    logger.info(f"... ({len(result.stdout.split('\n')) - 20} more lines)")
        else:
            logger.error(f"❌ {description} failed (exit code: {result.returncode})")
            if result.stderr:
                # Show first 10 lines of error
                lines = result.stderr.split('\n')[:10]
                logger.error('\n'.join(lines))
                if len(result.stderr.split('\n')) > 10:
                    logger.error(f"... (see full log: {self.logs_dir / f'{name}_{self.timestamp}.log'})")

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
        logger.info(f"{'='*80}\n")

    def _run_schema_generation(self):
        """Run schema generation analysis with optimization"""
        command = [
            'python3', '-m', 'src.generators.schema',
            '--root', str(self.root_dir),
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
        quality_output = self.output_dir / f'quality_report_{self.timestamp}.json'
        quality_text = self.output_dir / f'quality_report_{self.timestamp}.txt'

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
        coverage_output = self.output_dir / f'coverage_report_{self.timestamp}.json'
        coverage_text = self.output_dir / f'coverage_report_{self.timestamp}.txt'

        return self.run_command(
            'coverage_analysis',
            [
                'python3', '-m', 'src.analyzers.test_coverage',
                str(self.root_dir),
                '--json', str(coverage_output),
                '--text', str(coverage_text)
            ],
            'Test Coverage Analysis'
        )

    def _run_dependency_analysis(self):
        """Run dependency analysis"""
        dependency_output = self.output_dir / f'dependency_report_{self.timestamp}.json'
        dependency_text = self.output_dir / f'dependency_report_{self.timestamp}.txt'

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
        schemas_file = self.root_dir / 'Inventory' / 'schemas_enhanced.json'
        quality_output = self.output_dir / f'quality_report_{self.timestamp}.json'
        coverage_output = self.output_dir / f'coverage_report_{self.timestamp}.json'
        dependency_output = self.output_dir / f'dependency_report_{self.timestamp}.json'
        dashboard_output = self.output_dir / f'dashboard_{self.timestamp}.html'

        return self.run_command(
            'dashboard_generation',
            [
                'python3', '-m', 'src.generators.dashboard',
                '--schemas', str(schemas_file),
                '--quality', str(quality_output),
                '--coverage', str(coverage_output),
                '--dependency', str(dependency_output),
                '--output', str(dashboard_output)
            ],
            'Dashboard Generation'
        )

    def _generate_rss_feed(self):
        """Generate RSS feed"""
        schemas_file = self.root_dir / 'Inventory' / 'schemas_enhanced.json'
        rss_output = self.output_dir / f'code_updates_{self.timestamp}.xml'

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
        """Validate Schema.org markup"""
        return self.run_command(
            'schema_validation',
            [
                'python3', '-m', 'src.validators.schema',
                '--json',
                str(self.root_dir / 'Inventory' / 'schema.org.jsonld')
            ],
            'Schema.org Validation'
        )

    def run_all_analysis(self):
        """Run complete analysis pipeline"""
        self._print_analysis_header()

        # Run all analyses
        self._run_schema_generation()
        self._run_quality_analysis()
        self._run_coverage_analysis()
        self._run_dependency_analysis()
        self._generate_dashboard()
        self._generate_rss_feed()
        self._validate_schema()

        # Generate Summary Report
        self.generate_summary_report()

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
                    error_lines = result['stderr'].split('\n')[:5]
                    lines.extend(error_lines)
                    if len(result['stderr'].split('\n')) > 5:
                        lines.append(f"... ({len(result['stderr'].split('\n')) - 5} more lines in log file)")
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
    # Configure logging for CLI output
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s'  # Keep simple format for CLI tools
    )

    import argparse

    parser = argparse.ArgumentParser(
        description='Run All Code Analysis',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze single repository
  %(prog)s --root /path/to/Inventory

  # Analyze with custom timeout
  %(prog)s --root /path/to/code --timeout 1800

  # Analyze specific repositories only
  %(prog)s --root /path/to/code --repositories Inventory,financial-hub-system

  # Skip dependency verification (not recommended)
  %(prog)s --root /path/to/code --skip-dependency-check
        """
    )
    parser.add_argument(
        '--root',
        default='/Users/alyshialedlie/code',
        help='Root directory to analyze (default: /Users/alyshialedlie/code)'
    )
    parser.add_argument(
        '--output-dir',
        help='Output directory for reports (default: ROOT/analysis_reports)'
    )
    parser.add_argument(
        '--timeout',
        type=int,
        help='Override default timeout for all analyses (in seconds)'
    )
    parser.add_argument(
        '--repositories',
        help='Comma-separated list of repository names to analyze (default: all)'
    )
    parser.add_argument(
        '--skip-dependency-check',
        action='store_true',
        help='Skip dependency verification (not recommended)'
    )

    args = parser.parse_args()

    # Verify dependencies unless explicitly skipped
    if not args.skip_dependency_check:
        if not verify_dependencies():
            logger.error("Dependency check failed. Fix issues or use --skip-dependency-check to bypass.")
            sys.exit(1)

    root_dir = Path(args.root)
    output_dir = Path(args.output_dir) if args.output_dir else None

    # Parse repository filter
    repositories = None
    if args.repositories:
        repositories = [r.strip() for r in args.repositories.split(',')]

    # Build custom timeouts if specified
    timeouts = None
    if args.timeout:
        timeouts = {key: args.timeout for key in DEFAULT_TIMEOUTS.keys()}

    # Change to Inventory directory to run scripts
    inventory_dir = root_dir / 'Inventory'
    if not inventory_dir.exists():
        logger.error(f"Error: Inventory directory not found at {inventory_dir}")
        logger.error(f"The analysis tools must be run from within the Inventory project.")
        sys.exit(1)

    runner = AnalysisRunner(
        root_dir,
        output_dir,
        timeouts=timeouts,
        repositories=repositories
    )
    runner.run_all_analysis()

if __name__ == '__main__':
    main()
