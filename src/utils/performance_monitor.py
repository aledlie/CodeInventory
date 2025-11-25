#!/usr/bin/env python3
"""
Performance Monitoring and Reporting

Tracks and analyzes performance metrics from optimized analyzers.
Generates performance reports with recommendations for tuning.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import statistics

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    """Single performance metric"""
    analyzer_name: str
    metric_type: str  # 'duration', 'cache_hit_rate', 'throughput'
    value: float
    unit: str  # 'ms', 'percent', 'items/sec'
    timestamp: float

@dataclass
class PerformanceReport:
    """Complete performance report"""
    timestamp: str
    summary: Dict[str, Any]
    metrics: List[PerformanceMetric]
    recommendations: List[str]
    cache_statistics: Dict[str, Any]

class PerformanceMonitor:
    """Monitor and analyze analyzer performance"""

    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or Path.cwd() / '.analyzer_cache'
        self.metrics: List[PerformanceMetric] = []

    def load_cache_statistics(self) -> Dict[str, Any]:
        """Load cache statistics from analyzer cache files"""
        stats = {}

        # Load test_coverage cache
        tc_cache_path = self.cache_dir / 'test_coverage_cache.json'
        if tc_cache_path.exists():
            with open(tc_cache_path, 'r') as f:
                tc_cache = json.load(f)
                entries = tc_cache.get('entries', {})
                stats['test_coverage'] = {
                    'analyzer_name': tc_cache.get('analyzer_name', 'test_coverage'),
                    'version': tc_cache.get('version', '1.0'),
                    'total_cached_files': len(entries),
                    'last_update': tc_cache.get('last_update', 0),
                    'entries': entries
                }

        # Load dependencies cache
        dep_cache_path = self.cache_dir / 'dependencies_cache.json'
        if dep_cache_path.exists():
            with open(dep_cache_path, 'r') as f:
                dep_cache = json.load(f)
                entries = dep_cache.get('entries', {})
                stats['dependencies'] = {
                    'analyzer_name': dep_cache.get('analyzer_name', 'dependencies'),
                    'version': dep_cache.get('version', '1.0'),
                    'total_cached_files': len(entries),
                    'last_update': dep_cache.get('last_update', 0),
                    'entries': entries
                }

        return stats

    def calculate_cache_hit_rate(self, analyzer_name: str, total_files: int, cached_files: int) -> float:
        """Calculate cache hit rate percentage"""
        if total_files == 0:
            return 0.0
        return (cached_files / total_files) * 100

    def analyze_performance(self, benchmark_data: Optional[Dict[str, Any]] = None) -> PerformanceReport:
        """Analyze performance and generate report with recommendations"""
        cache_stats = self.load_cache_statistics()

        # Extract metrics
        summary = {
            'total_analyzers': len(cache_stats),
            'total_cached_files': sum(
                stats['total_cached_files'] for stats in cache_stats.values()
            ),
            'cache_enabled': len(cache_stats) > 0
        }

        # Add benchmark data if available
        if benchmark_data:
            summary['benchmark_speedup'] = benchmark_data.get('speedup_ratios', {})
            summary['optimization_improvement'] = benchmark_data.get('summary', {})

        # Generate recommendations
        recommendations = self._generate_recommendations(cache_stats, benchmark_data)

        # Create report
        report = PerformanceReport(
            timestamp=datetime.now().isoformat(),
            summary=summary,
            metrics=self.metrics,
            recommendations=recommendations,
            cache_statistics=cache_stats
        )

        return report

    def _generate_recommendations(self, cache_stats: Dict[str, Any],
                                 benchmark_data: Optional[Dict[str, Any]]) -> List[str]:
        """Generate performance tuning recommendations"""
        recommendations = []

        # Check cache usage
        total_cached = sum(stats['total_cached_files'] for stats in cache_stats.values())

        if total_cached == 0:
            recommendations.append(
                "⚠️ Caching is not being used. Enable caching with --cache flag for significant speedup (2-10x faster)."
            )
        elif total_cached < 10:
            recommendations.append(
                "💡 Cache is enabled but has few entries. Performance will improve significantly on subsequent runs."
            )
        else:
            recommendations.append(
                f"✅ Cache is active with {total_cached} cached files. Subsequent runs will be much faster."
            )

        # Check parallel processing
        if benchmark_data:
            speedup_ratios = benchmark_data.get('speedup_ratios', {})

            tc_speedup = speedup_ratios.get('test_coverage_parallel_vs_sequential', 0)
            if tc_speedup < 1.2:
                recommendations.append(
                    "⚠️ Test coverage parallel processing shows minimal speedup. Consider using sequential mode for small codebases."
                )
            elif tc_speedup > 2.0:
                recommendations.append(
                    f"✅ Test coverage parallel processing is highly effective ({tc_speedup:.1f}x speedup)."
                )

            dep_speedup = speedup_ratios.get('dependencies_parallel_vs_sequential', 0)
            if dep_speedup < 1.2:
                recommendations.append(
                    "⚠️ Dependency analysis parallel processing shows minimal speedup. Consider using sequential mode."
                )
            elif dep_speedup > 2.0:
                recommendations.append(
                    f"✅ Dependency analysis parallel processing is highly effective ({dep_speedup:.1f}x speedup)."
                )

            # Cache speedup recommendations
            tc_cache_speedup = speedup_ratios.get('test_coverage_cache_speedup', 0)
            if tc_cache_speedup > 5.0:
                recommendations.append(
                    f"✅ Test coverage cache providing excellent speedup ({tc_cache_speedup:.1f}x faster on cached runs)."
                )

            dep_cache_speedup = speedup_ratios.get('dependencies_cache_speedup', 0)
            if dep_cache_speedup > 5.0:
                recommendations.append(
                    f"✅ Dependency cache providing excellent speedup ({dep_cache_speedup:.1f}x faster on cached runs)."
                )

        # Worker count recommendations
        recommendations.append(
            "💡 Adjust worker count with --workers flag. Default is CPU count - 1. Try different values for optimal performance."
        )

        # Cache management recommendations
        if total_cached > 100:
            recommendations.append(
                "💡 Large cache detected. Consider clearing cache after major refactoring: --clear-cache"
            )

        # General best practices
        recommendations.append(
            "📚 Best Practice: Use --parallel --cache for optimal performance on medium to large codebases."
        )

        return recommendations

    def save_report(self, report: PerformanceReport, output_path: Path) -> None:
        """Save performance report to JSON file"""
        report_dict = {
            'timestamp': report.timestamp,
            'summary': report.summary,
            'metrics': [asdict(m) for m in report.metrics],
            'recommendations': report.recommendations,
            'cache_statistics': report.cache_statistics
        }

        with open(output_path, 'w') as f:
            json.dump(report_dict, f, indent=2)

        logger.info(f"✅ Performance report saved to {output_path}")

    def print_report(self, report: PerformanceReport) -> None:
        """Print performance report to console"""
        print("\n" + "="*80)
        print("PERFORMANCE MONITORING REPORT")
        print("="*80 + "\n")

        print(f"Generated: {report.timestamp}\n")

        # Summary
        print("📊 SUMMARY")
        print("-" * 80)
        print(f"Total Analyzers: {report.summary['total_analyzers']}")
        print(f"Total Cached Files: {report.summary['total_cached_files']}")
        print(f"Caching Enabled: {report.summary['cache_enabled']}")

        if 'benchmark_speedup' in report.summary:
            print("\n⚡ SPEEDUP RATIOS")
            print("-" * 80)
            for key, value in report.summary['benchmark_speedup'].items():
                name = key.replace('_', ' ').title()
                print(f"{name}: {value:.2f}x")

        # Cache Statistics
        print("\n📦 CACHE STATISTICS")
        print("-" * 80)
        for analyzer, stats in report.cache_statistics.items():
            print(f"\n{analyzer.upper()} Analyzer:")
            print(f"  Cached Files: {stats['total_cached_files']}")
            print(f"  Version: {stats['version']}")
            if stats['last_update']:
                import time
                last_update = time.strftime('%Y-%m-%d %H:%M:%S',
                                          time.localtime(stats['last_update']))
                print(f"  Last Update: {last_update}")

        # Recommendations
        print("\n💡 RECOMMENDATIONS")
        print("-" * 80)
        for i, rec in enumerate(report.recommendations, 1):
            print(f"{i}. {rec}")

        print("\n" + "="*80 + "\n")


def main() -> None:
    """Command-line entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Performance Monitoring Report')
    parser.add_argument('--cache-dir', type=Path, default=Path.cwd() / '.analyzer_cache',
                       help='Cache directory path')
    parser.add_argument('--benchmark', type=Path,
                       help='Path to benchmark report JSON')
    parser.add_argument('--output', type=Path, default='performance_monitor_report.json',
                       help='Output report path')

    args = parser.parse_args()

    monitor = PerformanceMonitor(cache_dir=args.cache_dir)

    # Load benchmark data if provided
    benchmark_data = None
    if args.benchmark and args.benchmark.exists():
        with open(args.benchmark, 'r') as f:
            benchmark_data = json.load(f)

    # Generate report
    report = monitor.analyze_performance(benchmark_data)

    # Print to console
    monitor.print_report(report)

    # Save to file
    monitor.save_report(report, args.output)


if __name__ == '__main__':
    main()
