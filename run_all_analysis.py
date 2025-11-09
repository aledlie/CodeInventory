#!/usr/bin/env python3
"""
Run All Analysis - Master script to run all code analysis tools
"""

import subprocess
from pathlib import Path
from datetime import datetime
import sys

class AnalysisRunner:
    """Runs all analysis tools and generates reports"""

    def __init__(self, root_dir: Path, output_dir: Path = None):
        self.root_dir = root_dir
        self.output_dir = output_dir or root_dir / 'analysis_reports'
        self.output_dir.mkdir(exist_ok=True)

        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.results = {}

    def run_command(self, name: str, command: list, description: str) -> bool:
        """Run a command and capture result"""
        print(f"\n{'='*80}")
        print(f"Running: {description}")
        print(f"{'='*80}\n")

        try:
            result = subprocess.run(
                command,
                cwd=self.root_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

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

        except subprocess.TimeoutExpired:
            print(f"⏱️  {description} timed out")
            self.results[name] = {'success': False, 'error': 'Timeout'}
            return False
        except Exception as e:
            print(f"❌ {description} error: {e}")
            self.results[name] = {'success': False, 'error': str(e)}
            return False

    def run_all_analysis(self):
        """Run complete analysis pipeline"""
        print(f"\n{'='*80}")
        print("CODE INVENTORY - COMPREHENSIVE ANALYSIS")
        print(f"{'='*80}")
        print(f"Root Directory: {self.root_dir}")
        print(f"Output Directory: {self.output_dir}")
        print(f"Timestamp: {self.timestamp}")
        print(f"{'='*80}\n")

        # 1. Enhanced Schema Generation
        self.run_command(
            'schema_generation',
            [
                'python3', 'schema_generator_enhanced.py',
                '--root', str(self.root_dir)
            ],
            'Enhanced Schema Generation'
        )

        schemas_file = self.root_dir / 'Inventory' / 'schemas_enhanced.json'

        # 2. Code Quality Analysis
        quality_output = self.output_dir / f'quality_report_{self.timestamp}.json'
        quality_text = self.output_dir / f'quality_report_{self.timestamp}.txt'

        self.run_command(
            'quality_analysis',
            [
                'python3', 'code_quality_analyzer.py',
                str(self.root_dir),
                '--json', str(quality_output),
                '--text', str(quality_text)
            ],
            'Code Quality Analysis'
        )

        # 3. Test Coverage Analysis
        coverage_output = self.output_dir / f'coverage_report_{self.timestamp}.json'
        coverage_text = self.output_dir / f'coverage_report_{self.timestamp}.txt'

        self.run_command(
            'coverage_analysis',
            [
                'python3', 'test_coverage_analyzer.py',
                str(self.root_dir),
                '--json', str(coverage_output),
                '--text', str(coverage_text)
            ],
            'Test Coverage Analysis'
        )

        # 4. Dependency Analysis
        dependency_output = self.output_dir / f'dependency_report_{self.timestamp}.json'
        dependency_text = self.output_dir / f'dependency_report_{self.timestamp}.txt'

        self.run_command(
            'dependency_analysis',
            [
                'python3', 'dependency_analyzer.py',
                str(self.root_dir),
                '--detect-circular',
                '--json', str(dependency_output),
                '--text', str(dependency_text)
            ],
            'Dependency Analysis'
        )

        # 5. Generate Interactive Dashboard
        dashboard_output = self.output_dir / f'dashboard_{self.timestamp}.html'

        self.run_command(
            'dashboard_generation',
            [
                'python3', 'dashboard_generator.py',
                '--schemas', str(schemas_file),
                '--quality', str(quality_output),
                '--coverage', str(coverage_output),
                '--dependency', str(dependency_output),
                '--output', str(dashboard_output)
            ],
            'Dashboard Generation'
        )

        # 6. Generate RSS Feed
        rss_output = self.output_dir / f'code_updates_{self.timestamp}.xml'

        self.run_command(
            'rss_generation',
            [
                'python3', 'rss_generator.py',
                '--schemas', str(schemas_file),
                '--git-repo', str(self.root_dir),
                '--output', str(rss_output),
                '--title', 'Code Inventory Updates',
                '--link', 'https://github.com/yourusername/Inventory'
            ],
            'RSS Feed Generation'
        )

        # 7. Validate Schema.org Markup
        self.run_command(
            'schema_validation',
            [
                'python3', 'validate_schemas.py',
                '--json',
                str(self.root_dir / 'Inventory' / 'schema.org.jsonld')
            ],
            'Schema.org Validation'
        )

        # Generate Summary Report
        self.generate_summary_report()

    def generate_summary_report(self):
        """Generate summary of all analysis"""
        summary_path = self.output_dir / f'ANALYSIS_SUMMARY_{self.timestamp}.md'

        lines = [
            f"# Comprehensive Code Analysis Report",
            f"",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Root Directory:** {self.root_dir}",
            f"",
            "## Analysis Results",
            ""
        ]

        # Results table
        lines.append("| Analysis | Status |")
        lines.append("|----------|--------|")

        for name, result in self.results.items():
            status = "✅ Success" if result.get('success') else "❌ Failed"
            lines.append(f"| {name.replace('_', ' ').title()} | {status} |")

        lines.extend([
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
        ])

        with open(summary_path, 'w') as f:
            f.write('\n'.join(lines))

        print(f"\n{'='*80}")
        print("ANALYSIS COMPLETE!")
        print(f"{'='*80}")
        print(f"\n📊 Summary report: {summary_path}")
        print(f"📁 All reports saved to: {self.output_dir}\n")

        # Print quick stats
        successful = sum(1 for r in self.results.values() if r.get('success'))
        total = len(self.results)
        print(f"Results: {successful}/{total} analyses completed successfully\n")

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
