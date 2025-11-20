#!/usr/bin/env python3
"""
Run All Analysis - Master script to run all code analysis tools
"""

import subprocess
from pathlib import Path
from datetime import datetime
import sys
from typing import List

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

class AnalysisRunner:
    """Runs all analysis tools and generates reports"""

    def __init__(self, root_dir: Path, output_dir: Path = None):
        self.root_dir = root_dir
        self.output_dir = output_dir or root_dir / 'analysis_reports'
        self.output_dir.mkdir(exist_ok=True)

        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.results = {}

    def _print_command_header(self, description: str):
        """Print command execution header"""
        print(f"\n{'='*80}")
        print(f"Running: {description}")
        print(f"{'='*80}\n")

    def _execute_subprocess(self, command: list, timeout: int = 300):
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
        self.results[name] = {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr
        }

        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            print(result.stdout)
        else:
            print(f"❌ {description} failed")
            print(result.stderr)

        return result.returncode == 0

    def run_command(self, name: str, command: list, description: str) -> bool:
        """Run a command and capture result"""
        self._print_command_header(description)

        try:
            result = self._execute_subprocess(command)
            return self._handle_command_result(name, result, description)

        except subprocess.TimeoutExpired:
            print(f"⏱️  {description} timed out")
            self.results[name] = {'success': False, 'error': 'Timeout'}
            return False
        except Exception as e:
            print(f"❌ {description} error: {e}")
            self.results[name] = {'success': False, 'error': str(e)}
            return False

    def _print_analysis_header(self):
        """Print analysis header information"""
        print(f"\n{'='*80}")
        print("CODE INVENTORY - COMPREHENSIVE ANALYSIS")
        print(f"{'='*80}")
        print(f"Root Directory: {self.root_dir}")
        print(f"Output Directory: {self.output_dir}")
        print(f"Timestamp: {self.timestamp}")
        print(f"{'='*80}\n")

    def _run_schema_generation(self):
        """Run schema generation analysis"""
        return self.run_command(
            'schema_generation',
            [
                'python3', '-m', 'src.generators.schema',
                '--root', str(self.root_dir)
            ],
            'Enhanced Schema Generation'
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
        print(f"\n{'='*80}")
        print("ANALYSIS COMPLETE!")
        print(f"{'='*80}")
        print(f"\n📊 Summary report: {self.output_dir / f'ANALYSIS_SUMMARY_{self.timestamp}.md'}")
        print(f"📁 All reports saved to: {self.output_dir}\n")

        # Print quick stats
        successful = sum(1 for r in self.results.values() if r.get('success'))
        total = len(self.results)
        print(f"Results: {successful}/{total} analyses completed successfully\n")

    def generate_summary_report(self):
        """Generate summary of all analysis"""
        summary_path = self.output_dir / f'ANALYSIS_SUMMARY_{self.timestamp}.md'

        # Build report sections
        lines = []
        lines.extend(self._build_report_header())
        lines.extend(self._build_results_table())
        lines.extend(self._build_files_section())

        # Save report
        self._save_report(lines, summary_path)

        # Print completion statistics
        self._print_completion_stats()

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Run All Code Analysis')
    parser.add_argument('--root', default='/Users/alyshialedlie/code', help='Root directory to analyze')
    parser.add_argument('--output-dir', help='Output directory for reports')

    args = parser.parse_args()

    root_dir = Path(args.root)
    output_dir = Path(args.output_dir) if args.output_dir else None

    # Change to Inventory directory to run scripts
    inventory_dir = root_dir / 'Inventory'
    if not inventory_dir.exists():
        print(f"Error: Inventory directory not found at {inventory_dir}")
        sys.exit(1)

    runner = AnalysisRunner(root_dir, output_dir)
    runner.run_all_analysis()

if __name__ == '__main__':
    main()
