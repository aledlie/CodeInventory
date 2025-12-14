#!/usr/bin/env python3
"""
Dashboard Generator - Creates interactive HTML dashboard for code analysis
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

class DashboardGenerator:
    """Generates interactive code analysis dashboard"""

    # Default cache directory name
    DEFAULT_CACHE_DIR = '.analyzer_cache'

    def __init__(self, schemas_path: Path, quality_path: Optional[Path] = None,
                 coverage_path: Optional[Path] = None, dependency_path: Optional[Path] = None,
                 cache_dir: Optional[Path] = None, files_processed: int = 0,
                 elapsed_time: float = 0):
        """Initialize the dashboard generator.

        Args:
            schemas_path: Path to the schemas JSON file
            quality_path: Optional path to quality report JSON
            coverage_path: Optional path to coverage report JSON
            dependency_path: Optional path to dependency report JSON
            cache_dir: Directory for analyzer cache. Defaults to .analyzer_cache
            files_processed: Number of files processed in analysis
            elapsed_time: Time taken for analysis in seconds
        """
        self._setup_paths(schemas_path, quality_path, coverage_path, dependency_path, cache_dir)
        self.files_processed = files_processed
        self.elapsed_time = elapsed_time
        self._load_all_data()

    def _setup_paths(self, schemas_path: Path, quality_path: Optional[Path],
                     coverage_path: Optional[Path], dependency_path: Optional[Path],
                     cache_dir: Optional[Path]) -> None:
        """Set up all file paths."""
        self.schemas_path = schemas_path
        self.quality_path = quality_path
        self.coverage_path = coverage_path
        self.dependency_path = dependency_path
        self.cache_dir = cache_dir or Path.cwd() / self.DEFAULT_CACHE_DIR

    def _load_all_data(self) -> None:
        """Load all JSON data files."""
        self.schemas_data = self._load_json(self.schemas_path)
        self.quality_data = self._load_json(self.quality_path) if self.quality_path else None
        self.coverage_data = self._load_json(self.coverage_path) if self.coverage_path else None
        self.dependency_data = self._load_json(self.dependency_path) if self.dependency_path else None
        self.performance_data = self._load_performance_data()

    def _load_json(self, path: Optional[Path]) -> Dict[str, Any]:
        """Load JSON file"""
        if path and path.exists():
            with open(path, 'r') as f:
                return json.load(f)  # type: ignore[no-any-return]
        return {}

    def _load_performance_data(self) -> Dict[str, Any]:
        """Load performance data from cache files"""
        performance = {}

        # Load test_coverage cache
        tc_cache_path = self.cache_dir / 'test_coverage_cache.json'
        if tc_cache_path.exists():
            tc_cache = self._load_json(tc_cache_path)
            performance['test_coverage'] = {
                'cached_files': len(tc_cache.get('entries', {})),
                'last_update': tc_cache.get('last_update', 0),
                'analyzer_name': tc_cache.get('analyzer_name', 'test_coverage')
            }

        # Load dependencies cache
        dep_cache_path = self.cache_dir / 'dependencies_cache.json'
        if dep_cache_path.exists():
            dep_cache = self._load_json(dep_cache_path)
            performance['dependencies'] = {
                'cached_files': len(dep_cache.get('entries', {})),
                'last_update': dep_cache.get('last_update', 0),
                'analyzer_name': dep_cache.get('analyzer_name', 'dependencies')
            }

        return performance

    def generate_html(self) -> str:
        """Generate complete HTML dashboard"""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    {self._generate_head()}
</head>
<body>
    {self._generate_body()}
</body>
</html>
"""

    def _generate_head(self) -> str:
        """Generate HTML head section with styles"""
        return f"""
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Inventory Dashboard</title>
    <style>
        {self._generate_css()}
    </style>
"""

    def _generate_css(self) -> str:
        """Generate CSS styles"""
        return """
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f7;
            color: #1d1d1f;
            line-height: 1.6;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .header p {
            opacity: 0.9;
        }

        .container {
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .metric-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin: 0.5rem 0;
        }

        .metric-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .section {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 2rem;
        }

        .section h2 {
            margin-bottom: 1rem;
            color: #1d1d1f;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }

        .progress-bar {
            background: #e0e0e0;
            border-radius: 10px;
            height: 24px;
            overflow: hidden;
            margin: 1rem 0;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8rem;
            transition: width 0.3s ease;
        }

        .issue-list {
            list-style: none;
        }

        .issue-item {
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .issue-error {
            border-left-color: #e74c3c;
        }

        .issue-warning {
            border-left-color: #f39c12;
        }

        .issue-info {
            border-left-color: #3498db;
        }

        .badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-error {
            background: #e74c3c;
            color: white;
        }

        .badge-warning {
            background: #f39c12;
            color: white;
        }

        .badge-info {
            background: #3498db;
            color: white;
        }

        .badge-success {
            background: #27ae60;
            color: white;
        }

        .footer {
            text-align: center;
            padding: 2rem;
            color: #666;
            font-size: 0.9rem;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #1d1d1f;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .performance-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .performance-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .performance-card-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .performance-card-header h3 {
            margin: 0;
            font-size: 1.1rem;
        }

        .performance-card-body {
            padding: 1.5rem;
        }

        .performance-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }

        .performance-label {
            color: #666;
            font-size: 0.9rem;
        }

        .performance-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }

        .performance-value-small {
            font-size: 0.85rem;
            color: #666;
            font-family: monospace;
        }

        .performance-progress {
            margin-top: 1rem;
        }
    """

    def _format_elapsed_time(self) -> str:
        """Format elapsed time for display"""
        if self.elapsed_time <= 0:
            return ""
        if self.elapsed_time < 60:
            return f"{self.elapsed_time:.1f}s"
        minutes = int(self.elapsed_time // 60)
        seconds = self.elapsed_time % 60
        return f"{minutes}m {seconds:.1f}s"

    def _generate_processing_stats(self) -> str:
        """Generate processing stats line"""
        if self.files_processed > 0 and self.elapsed_time > 0:
            return f"<p style=\"opacity: 0.8; font-size: 0.9rem;\">Processed {self.files_processed} files in {self._format_elapsed_time()}</p>"
        elif self.files_processed > 0:
            return f"<p style=\"opacity: 0.8; font-size: 0.9rem;\">Processed {self.files_processed} files</p>"
        return ""

    def _generate_body(self) -> str:
        """Generate HTML body content"""
        return f"""
    <div class="header">
        <h1>📊 Code Inventory Dashboard</h1>
        <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        {self._generate_processing_stats()}
    </div>

    <div class="container">
        {self._generate_metrics_section()}
        {self._generate_performance_section()}
        {self._generate_schemas_section()}
        {self._generate_quality_section()}
        {self._generate_coverage_section()}
        {self._generate_dependency_section()}
    </div>

    <div class="footer">
        <p>Generated by Enhanced Schema Generator with schema.org markup</p>
        <p>✨ Powered by ast-grep and Schema.org MCP</p>
    </div>
"""

    def _generate_metrics_section(self) -> str:
        """Generate metrics overview section"""
        metrics = self._calculate_metrics()
        return self._render_metrics_grid(metrics)

    def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate all dashboard metrics"""
        return {
            'total_dirs': self._count_directories(),
            'total_files': self._count_files(),
            'total_classes': self._count_classes(),
            'total_functions': self._count_functions(),
            'quality_score': self._get_quality_score(),
            'coverage': self._get_coverage_percentage()
        }

    def _count_directories(self) -> int:
        """Count total directories"""
        return len(self.schemas_data.get('directories', {}))

    def _count_files(self) -> int:
        """Count total code files"""
        return sum(
            len(dir_data.get('files', []))
            for dir_data in self.schemas_data.get('directories', {}).values()
        )

    def _count_classes(self) -> int:
        """Count total classes"""
        return sum(
            len(file.get('classes', []))
            for dir_data in self.schemas_data.get('directories', {}).values()
            for file in dir_data.get('files', [])
        )

    def _count_functions(self) -> int:
        """Count total functions"""
        return sum(
            len(file.get('functions', []))
            for dir_data in self.schemas_data.get('directories', {}).values()
            for file in dir_data.get('files', [])
        )

    def _get_quality_score(self) -> str:
        """Get code quality score"""
        if not self.quality_data:
            return "N/A"
        total_issues = self.quality_data.get('summary', {}).get('total_issues', 0)
        return f"{total_issues} issues"

    def _get_coverage_percentage(self) -> str:
        """Get test coverage percentage"""
        if not self.coverage_data:
            return "N/A"
        coverage = self.coverage_data.get('summary', {}).get('coverage_percentage', 0)
        return f"{coverage:.1f}%"

    def _render_metrics_grid(self, metrics: Dict[str, Any]) -> str:
        """Render metrics grid HTML"""
        return f"""
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Directories</div>
                <div class="metric-value">{metrics['total_dirs']}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Classes</div>
                <div class="metric-value">{metrics['total_classes']}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Functions</div>
                <div class="metric-value">{metrics['total_functions']}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Code Files</div>
                <div class="metric-value">{metrics['total_files']}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Code Quality</div>
                <div class="metric-value" style="font-size: 1.5rem;">{metrics['quality_score']}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Test Coverage</div>
                <div class="metric-value" style="font-size: 1.5rem;">{metrics['coverage']}</div>
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

    def _generate_performance_section(self) -> str:
        """Generate performance metrics section"""
        if not self.performance_data:
            return ""

        tc_data = self.performance_data.get('test_coverage', {})
        dep_data = self.performance_data.get('dependencies', {})

        # Calculate cache statistics
        tc_cached = tc_data.get('cached_files', 0)
        dep_cached = dep_data.get('cached_files', 0)
        total_cached = tc_cached + dep_cached

        # Format timestamps
        import time
        tc_last_update = time.strftime('%Y-%m-%d %H:%M:%S',
                                       time.localtime(tc_data.get('last_update', 0))) if tc_data.get('last_update') else 'Never'
        dep_last_update = time.strftime('%Y-%m-%d %H:%M:%S',
                                        time.localtime(dep_data.get('last_update', 0))) if dep_data.get('last_update') else 'Never'

        return f"""
        <div class="section">
            <h2>⚡ Performance Metrics</h2>

            <div style="margin: 1rem 0;">
                <p style="color: #666; margin-bottom: 1rem;">
                    Optimization features include parallel processing and intelligent caching for faster analysis.
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;">
                <div class="performance-card">
                    <div class="performance-card-header">
                        <h3>🧪 Test Coverage Analyzer</h3>
                        <span class="badge badge-success">Optimized</span>
                    </div>
                    <div class="performance-card-body">
                        <div class="performance-stat">
                            <span class="performance-label">Cached Files:</span>
                            <span class="performance-value">{tc_cached}</span>
                        </div>
                        <div class="performance-stat">
                            <span class="performance-label">Last Update:</span>
                            <span class="performance-value-small">{tc_last_update}</span>
                        </div>
                        <div class="performance-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: {min(100, tc_cached * 5)}%;">
                                    Cache Active
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="performance-card">
                    <div class="performance-card-header">
                        <h3>📦 Dependency Analyzer</h3>
                        <span class="badge badge-success">Optimized</span>
                    </div>
                    <div class="performance-card-body">
                        <div class="performance-stat">
                            <span class="performance-label">Cached Files:</span>
                            <span class="performance-value">{dep_cached}</span>
                        </div>
                        <div class="performance-stat">
                            <span class="performance-label">Last Update:</span>
                            <span class="performance-value-small">{dep_last_update}</span>
                        </div>
                        <div class="performance-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: {min(100, dep_cached * 5)}%;">
                                    Cache Active
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 0.5rem 0; color: #1d1d1f;">Optimization Features</h4>
                <ul style="margin: 0; padding-left: 1.5rem; color: #666;">
                    <li><strong>Parallel Processing:</strong> Multi-core file analysis for faster results</li>
                    <li><strong>Intelligent Caching:</strong> SHA-256 content-based cache invalidation</li>
                    <li><strong>Total Cached Files:</strong> {total_cached} files cached for instant retrieval</li>
                </ul>
            </div>
        </div>
        """

    def save_dashboard(self, output_path: Path) -> None:
        """Save dashboard to file"""
        html = self.generate_html()

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)

        logger.info(f"✅ Dashboard saved to {output_path}")
        logger.info(f"   Open in browser: file://{output_path.absolute()}")

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description='Dashboard Generator')
    parser.add_argument('--schemas', required=True, help='Path to schemas.json')
    parser.add_argument('--quality', help='Path to quality report JSON')
    parser.add_argument('--coverage', help='Path to coverage report JSON')
    parser.add_argument('--dependency', help='Path to dependency report JSON')
    parser.add_argument('--output', default='dashboard.html', help='Output HTML file')
    parser.add_argument('--files-processed', type=int, default=0, help='Number of files processed')
    parser.add_argument('--elapsed-time', type=float, default=0, help='Elapsed time in seconds')

    args = parser.parse_args()

    generator = DashboardGenerator(
        schemas_path=Path(args.schemas),
        quality_path=Path(args.quality) if args.quality else None,
        coverage_path=Path(args.coverage) if args.coverage else None,
        dependency_path=Path(args.dependency) if args.dependency else None,
        files_processed=args.files_processed,
        elapsed_time=args.elapsed_time
    )

    output_path = Path(args.output)
    generator.save_dashboard(output_path)

if __name__ == '__main__':
    main()
