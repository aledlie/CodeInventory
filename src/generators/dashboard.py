#!/usr/bin/env python3
"""
Dashboard Generator - Creates interactive HTML dashboard for code analysis
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

class DashboardGenerator:
    """Generates interactive code analysis dashboard"""

    def __init__(self, schemas_path: Path, quality_path: Path = None,
                 coverage_path: Path = None, dependency_path: Path = None):
        self.schemas_path = schemas_path
        self.quality_path = quality_path
        self.coverage_path = coverage_path
        self.dependency_path = dependency_path

        # Load data
        self.schemas_data = self._load_json(schemas_path)
        self.quality_data = self._load_json(quality_path) if quality_path else None
        self.coverage_data = self._load_json(coverage_path) if coverage_path else None
        self.dependency_data = self._load_json(dependency_path) if dependency_path else None

    def _load_json(self, path: Path) -> Dict[str, Any]:
        """Load JSON file"""
        if path and path.exists():
            with open(path, 'r') as f:
                return json.load(f)
        return {}

    def generate_html(self) -> str:
        """Generate complete HTML dashboard"""

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Inventory Dashboard</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f7;
            color: #1d1d1f;
            line-height: 1.6;
        }}

        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}

        .header h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }}

        .header p {{
            opacity: 0.9;
        }}

        .container {{
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
        }}

        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}

        .metric-card {{
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
        }}

        .metric-card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }}

        .metric-value {{
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin: 0.5rem 0;
        }}

        .metric-label {{
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .section {{
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 2rem;
        }}

        .section h2 {{
            margin-bottom: 1rem;
            color: #1d1d1f;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }}

        .progress-bar {{
            background: #e0e0e0;
            border-radius: 10px;
            height: 24px;
            overflow: hidden;
            margin: 1rem 0;
        }}

        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8rem;
            transition: width 0.3s ease;
        }}

        .issue-list {{
            list-style: none;
        }}

        .issue-item {{
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
            border-radius: 4px;
        }}

        .issue-error {{
            border-left-color: #e74c3c;
        }}

        .issue-warning {{
            border-left-color: #f39c12;
        }}

        .issue-info {{
            border-left-color: #3498db;
        }}

        .badge {{
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
        }}

        .badge-error {{
            background: #e74c3c;
            color: white;
        }}

        .badge-warning {{
            background: #f39c12;
            color: white;
        }}

        .badge-info {{
            background: #3498db;
            color: white;
        }}

        .badge-success {{
            background: #27ae60;
            color: white;
        }}

        .footer {{
            text-align: center;
            padding: 2rem;
            color: #666;
            font-size: 0.9rem;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
        }}

        th, td {{
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }}

        th {{
            background: #f8f9fa;
            font-weight: 600;
            color: #1d1d1f;
        }}

        tr:hover {{
            background: #f8f9fa;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Code Inventory Dashboard</h1>
        <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>

    <div class="container">
        {self._generate_metrics_section()}
        {self._generate_schemas_section()}
        {self._generate_quality_section()}
        {self._generate_coverage_section()}
        {self._generate_dependency_section()}
    </div>

    <div class="footer">
        <p>Generated by Enhanced Schema Generator with schema.org markup</p>
        <p>✨ Powered by ast-grep and Schema.org MCP</p>
    </div>
</body>
</html>
"""
        return html

    def _generate_metrics_section(self) -> str:
        """Generate metrics overview section"""
        # Count statistics from schemas
        total_dirs = len(self.schemas_data.get('directories', {}))
        total_files = sum(
            len(dir_data.get('files', []))
            for dir_data in self.schemas_data.get('directories', {}).values()
        )
        total_classes = sum(
            len(file.get('classes', []))
            for dir_data in self.schemas_data.get('directories', {}).values()
            for file in dir_data.get('files', [])
        )
        total_functions = sum(
            len(file.get('functions', []))
            for dir_data in self.schemas_data.get('directories', {}).values()
            for file in dir_data.get('files', [])
        )

        # Quality metrics
        quality_score = "N/A"
        if self.quality_data:
            total_issues = self.quality_data.get('summary', {}).get('total_issues', 0)
            quality_score = f"{total_issues} issues"

        # Coverage metrics
        coverage = "N/A"
        if self.coverage_data:
            coverage = f"{self.coverage_data.get('summary', {}).get('coverage_percentage', 0):.1f}%"

        return f"""
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Directories Scanned</div>
                <div class="metric-value">{total_dirs}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Code Files</div>
                <div class="metric-value">{total_files}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Classes</div>
                <div class="metric-value">{total_classes}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Functions</div>
                <div class="metric-value">{total_functions}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Code Quality</div>
                <div class="metric-value" style="font-size: 1.5rem;">{quality_score}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Test Coverage</div>
                <div class="metric-value" style="font-size: 1.5rem;">{coverage}</div>
            </div>
        </div>
        """

    def _generate_schemas_section(self) -> str:
        """Generate schemas overview section"""
        return """
        <div class="section">
            <h2>📁 Repository Overview</h2>
            <p>Schema data generated with ast-grep and schema.org markup</p>
        </div>
        """

    def _generate_quality_section(self) -> str:
        """Generate code quality section"""
        if not self.quality_data:
            return ""

        summary = self.quality_data.get('summary', {})
        errors = summary.get('issues_by_severity', {}).get('error', 0)
        warnings = summary.get('issues_by_severity', {}).get('warning', 0)
        infos = summary.get('issues_by_severity', {}).get('info', 0)

        return f"""
        <div class="section">
            <h2>🔍 Code Quality Analysis</h2>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0;">
                <div style="text-align: center;">
                    <span class="badge badge-error">Errors: {errors}</span>
                </div>
                <div style="text-align: center;">
                    <span class="badge badge-warning">Warnings: {warnings}</span>
                </div>
                <div style="text-align: center;">
                    <span class="badge badge-info">Info: {infos}</span>
                </div>
            </div>

            <p style="margin-top: 1rem;">
                Total Issues Found: <strong>{summary.get('total_issues', 0)}</strong>
                across <strong>{summary.get('total_files_scanned', 0)}</strong> files
            </p>
        </div>
        """

    def _generate_coverage_section(self) -> str:
        """Generate test coverage section"""
        if not self.coverage_data:
            return ""

        summary = self.coverage_data.get('summary', {})
        coverage_pct = summary.get('coverage_percentage', 0)

        # Determine color based on coverage
        if coverage_pct >= 80:
            badge_class = "badge-success"
            status = "GOOD"
        elif coverage_pct >= 70:
            badge_class = "badge-warning"
            status = "WARNING"
        else:
            badge_class = "badge-error"
            status = "CRITICAL"

        return f"""
        <div class="section">
            <h2>✅ Test Coverage</h2>

            <div style="margin: 1rem 0;">
                <span class="badge {badge_class}">{status}: {coverage_pct:.1f}% Coverage</span>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: {coverage_pct}%;">
                    {coverage_pct:.1f}%
                </div>
            </div>

            <p style="margin-top: 1rem;">
                <strong>{summary.get('tested_functions', 0)}</strong> tested /
                <strong>{summary.get('total_functions', 0)}</strong> total functions
            </p>
        </div>
        """

    def _generate_dependency_section(self) -> str:
        """Generate dependency analysis section"""
        if not self.dependency_data:
            return ""

        summary = self.dependency_data.get('summary', {})

        return f"""
        <div class="section">
            <h2>📦 Dependencies</h2>

            <table>
                <tr>
                    <th>Metric</th>
                    <th>Count</th>
                </tr>
                <tr>
                    <td>Total Dependencies</td>
                    <td><strong>{summary.get('total_dependencies', 0)}</strong></td>
                </tr>
                <tr>
                    <td>External Dependencies</td>
                    <td>{summary.get('external_dependencies', 0)}</td>
                </tr>
                <tr>
                    <td>Internal Dependencies</td>
                    <td>{summary.get('internal_dependencies', 0)}</td>
                </tr>
                <tr>
                    <td>Circular Dependencies</td>
                    <td>{summary.get('circular_dependencies_count', 0)}</td>
                </tr>
            </table>
        </div>
        """

    def save_dashboard(self, output_path: Path):
        """Save dashboard to file"""
        html = self.generate_html()

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"✅ Dashboard saved to {output_path}")
        print(f"   Open in browser: file://{output_path.absolute()}")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Dashboard Generator')
    parser.add_argument('--schemas', required=True, help='Path to schemas.json')
    parser.add_argument('--quality', help='Path to quality report JSON')
    parser.add_argument('--coverage', help='Path to coverage report JSON')
    parser.add_argument('--dependency', help='Path to dependency report JSON')
    parser.add_argument('--output', default='dashboard.html', help='Output HTML file')

    args = parser.parse_args()

    generator = DashboardGenerator(
        schemas_path=Path(args.schemas),
        quality_path=Path(args.quality) if args.quality else None,
        coverage_path=Path(args.coverage) if args.coverage else None,
        dependency_path=Path(args.dependency) if args.dependency else None
    )

    output_path = Path(args.output)
    generator.save_dashboard(output_path)

if __name__ == '__main__':
    main()
