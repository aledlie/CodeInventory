#!/usr/bin/env python3
"""
Performance Benchmarking Suite

Measures performance improvements from parallel processing and caching.
Generates performance reports comparing optimized vs baseline performance.
"""

import pytest
import sys
import time
import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.test_coverage import TestCoverageAnalyzer
from src.analyzers.dependencies import DependencyAnalyzer


@dataclass
class BenchmarkResult:
    """Single benchmark result"""
    name: str
    duration_ms: float
    items_processed: int
    throughput: float  # items per second
    cache_hits: int = 0
    cache_misses: int = 0
    worker_count: int = 1


@dataclass
class BenchmarkReport:
    """Complete benchmark report"""
    timestamp: str
    results: List[BenchmarkResult]
    speedup_ratios: Dict[str, float]
    summary: Dict[str, Any]


class PerformanceBenchmark:
    """Performance benchmarking utilities"""

    def __init__(self):
        self.results: List[BenchmarkResult] = []
        self.src_dir = Path(__file__).parent.parent.parent / 'src'
        self.test_dir = Path(__file__).parent.parent

    def benchmark_test_coverage_sequential(self) -> BenchmarkResult:
        """Benchmark test coverage analysis in sequential mode"""
        analyzer = TestCoverageAnalyzer(self.src_dir, self.test_dir)

        start = time.time()
        analyzer.analyze_coverage()
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name="test_coverage_sequential",
            duration_ms=duration,
            items_processed=analyzer.report.total_functions,
            throughput=analyzer.report.total_functions / (duration / 1000) if duration > 0 else 0,
            worker_count=1
        )

    def benchmark_test_coverage_parallel_no_cache(self, workers: int = 4) -> BenchmarkResult:
        """Benchmark test coverage with parallel processing, no cache"""
        analyzer = TestCoverageAnalyzer(self.src_dir, self.test_dir)

        start = time.time()
        analyzer.analyze_coverage_optimized(use_parallel=True, use_cache=False, max_workers=workers)
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name=f"test_coverage_parallel_{workers}workers_no_cache",
            duration_ms=duration,
            items_processed=analyzer.report.total_functions,
            throughput=analyzer.report.total_functions / (duration / 1000) if duration > 0 else 0,
            worker_count=workers
        )

    def benchmark_test_coverage_parallel_with_cache_first_run(self, workers: int = 4) -> BenchmarkResult:
        """Benchmark test coverage with parallel + cache (first run)"""
        # Clear cache first
        from src.analyzers.analyzer_optimizer import AnalyzerCache
        cache = AnalyzerCache('test_coverage', Path.cwd() / '.analyzer_cache')
        cache.clear_cache()

        analyzer = TestCoverageAnalyzer(self.src_dir, self.test_dir)

        start = time.time()
        analyzer.analyze_coverage_optimized(use_parallel=True, use_cache=True, max_workers=workers)
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name=f"test_coverage_parallel_{workers}workers_cache_first",
            duration_ms=duration,
            items_processed=analyzer.report.total_functions,
            throughput=analyzer.report.total_functions / (duration / 1000) if duration > 0 else 0,
            worker_count=workers
        )

    def benchmark_test_coverage_parallel_with_cache_second_run(self, workers: int = 4) -> BenchmarkResult:
        """Benchmark test coverage with parallel + cache (second run - cache hits)"""
        analyzer = TestCoverageAnalyzer(self.src_dir, self.test_dir)

        start = time.time()
        analyzer.analyze_coverage_optimized(use_parallel=True, use_cache=True, max_workers=workers)
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name=f"test_coverage_parallel_{workers}workers_cache_second",
            duration_ms=duration,
            items_processed=analyzer.report.total_functions,
            throughput=analyzer.report.total_functions / (duration / 1000) if duration > 0 else 0,
            worker_count=workers
        )

    def benchmark_dependencies_sequential(self) -> BenchmarkResult:
        """Benchmark dependency analysis in sequential mode"""
        analyzer = DependencyAnalyzer(self.src_dir)

        start = time.time()
        analyzer.analyze_directory()
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name="dependencies_sequential",
            duration_ms=duration,
            items_processed=analyzer.report.total_dependencies,
            throughput=analyzer.report.total_dependencies / (duration / 1000) if duration > 0 else 0,
            worker_count=1
        )

    def benchmark_dependencies_parallel_no_cache(self, workers: int = 4) -> BenchmarkResult:
        """Benchmark dependencies with parallel processing, no cache"""
        analyzer = DependencyAnalyzer(self.src_dir)

        start = time.time()
        analyzer.analyze_directory_optimized(use_parallel=True, use_cache=False, max_workers=workers)
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name=f"dependencies_parallel_{workers}workers_no_cache",
            duration_ms=duration,
            items_processed=analyzer.report.total_dependencies,
            throughput=analyzer.report.total_dependencies / (duration / 1000) if duration > 0 else 0,
            worker_count=workers
        )

    def benchmark_dependencies_parallel_with_cache_first_run(self, workers: int = 4) -> BenchmarkResult:
        """Benchmark dependencies with parallel + cache (first run)"""
        # Clear cache first
        from src.analyzers.analyzer_optimizer import AnalyzerCache
        cache = AnalyzerCache('dependencies', Path.cwd() / '.analyzer_cache')
        cache.clear_cache()

        analyzer = DependencyAnalyzer(self.src_dir)

        start = time.time()
        analyzer.analyze_directory_optimized(use_parallel=True, use_cache=True, max_workers=workers)
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name=f"dependencies_parallel_{workers}workers_cache_first",
            duration_ms=duration,
            items_processed=analyzer.report.total_dependencies,
            throughput=analyzer.report.total_dependencies / (duration / 1000) if duration > 0 else 0,
            worker_count=workers
        )

    def benchmark_dependencies_parallel_with_cache_second_run(self, workers: int = 4) -> BenchmarkResult:
        """Benchmark dependencies with parallel + cache (second run - cache hits)"""
        analyzer = DependencyAnalyzer(self.src_dir)

        start = time.time()
        analyzer.analyze_directory_optimized(use_parallel=True, use_cache=True, max_workers=workers)
        duration = (time.time() - start) * 1000

        return BenchmarkResult(
            name=f"dependencies_parallel_{workers}workers_cache_second",
            duration_ms=duration,
            items_processed=analyzer.report.total_dependencies,
            throughput=analyzer.report.total_dependencies / (duration / 1000) if duration > 0 else 0,
            worker_count=workers
        )

    def run_complete_benchmark(self) -> BenchmarkReport:
        """Run complete benchmark suite"""
        import datetime

        print("\n" + "="*80)
        print("PERFORMANCE BENCHMARK SUITE")
        print("="*80 + "\n")

        # Test Coverage Benchmarks
        print("Running Test Coverage Benchmarks...")
        tc_seq = self.benchmark_test_coverage_sequential()
        print(f"  Sequential: {tc_seq.duration_ms:.0f}ms")

        tc_par = self.benchmark_test_coverage_parallel_no_cache(workers=4)
        print(f"  Parallel (4 workers, no cache): {tc_par.duration_ms:.0f}ms")

        tc_cache1 = self.benchmark_test_coverage_parallel_with_cache_first_run(workers=4)
        print(f"  Parallel (4 workers, cache first run): {tc_cache1.duration_ms:.0f}ms")

        tc_cache2 = self.benchmark_test_coverage_parallel_with_cache_second_run(workers=4)
        print(f"  Parallel (4 workers, cache second run): {tc_cache2.duration_ms:.0f}ms")

        # Dependencies Benchmarks
        print("\nRunning Dependencies Benchmarks...")
        dep_seq = self.benchmark_dependencies_sequential()
        print(f"  Sequential: {dep_seq.duration_ms:.0f}ms")

        dep_par = self.benchmark_dependencies_parallel_no_cache(workers=4)
        print(f"  Parallel (4 workers, no cache): {dep_par.duration_ms:.0f}ms")

        dep_cache1 = self.benchmark_dependencies_parallel_with_cache_first_run(workers=4)
        print(f"  Parallel (4 workers, cache first run): {dep_cache1.duration_ms:.0f}ms")

        dep_cache2 = self.benchmark_dependencies_parallel_with_cache_second_run(workers=4)
        print(f"  Parallel (4 workers, cache second run): {dep_cache2.duration_ms:.0f}ms")

        # Calculate speedup ratios
        speedup_ratios = {
            'test_coverage_parallel_vs_sequential': tc_seq.duration_ms / tc_par.duration_ms if tc_par.duration_ms > 0 else 0,
            'test_coverage_cache_speedup': tc_cache1.duration_ms / tc_cache2.duration_ms if tc_cache2.duration_ms > 0 else 0,
            'test_coverage_total_speedup': tc_seq.duration_ms / tc_cache2.duration_ms if tc_cache2.duration_ms > 0 else 0,
            'dependencies_parallel_vs_sequential': dep_seq.duration_ms / dep_par.duration_ms if dep_par.duration_ms > 0 else 0,
            'dependencies_cache_speedup': dep_cache1.duration_ms / dep_cache2.duration_ms if dep_cache2.duration_ms > 0 else 0,
            'dependencies_total_speedup': dep_seq.duration_ms / dep_cache2.duration_ms if dep_cache2.duration_ms > 0 else 0,
        }

        # Generate summary
        summary = {
            'test_coverage': {
                'baseline_ms': tc_seq.duration_ms,
                'optimized_ms': tc_cache2.duration_ms,
                'speedup': speedup_ratios['test_coverage_total_speedup'],
                'improvement_percent': (1 - tc_cache2.duration_ms / tc_seq.duration_ms) * 100 if tc_seq.duration_ms > 0 else 0
            },
            'dependencies': {
                'baseline_ms': dep_seq.duration_ms,
                'optimized_ms': dep_cache2.duration_ms,
                'speedup': speedup_ratios['dependencies_total_speedup'],
                'improvement_percent': (1 - dep_cache2.duration_ms / dep_seq.duration_ms) * 100 if dep_seq.duration_ms > 0 else 0
            }
        }

        # Create report
        report = BenchmarkReport(
            timestamp=datetime.datetime.now().isoformat(),
            results=[tc_seq, tc_par, tc_cache1, tc_cache2, dep_seq, dep_par, dep_cache1, dep_cache2],
            speedup_ratios=speedup_ratios,
            summary=summary
        )

        self.print_summary(report)

        return report

    def print_summary(self, report: BenchmarkReport):
        """Print benchmark summary"""
        print("\n" + "="*80)
        print("PERFORMANCE SUMMARY")
        print("="*80 + "\n")

        print("Test Coverage Analyzer:")
        print(f"  Baseline (sequential):    {report.summary['test_coverage']['baseline_ms']:.0f}ms")
        print(f"  Optimized (parallel+cache): {report.summary['test_coverage']['optimized_ms']:.0f}ms")
        print(f"  Speedup:                   {report.summary['test_coverage']['speedup']:.2f}x")
        print(f"  Improvement:               {report.summary['test_coverage']['improvement_percent']:.1f}%")

        print("\nDependency Analyzer:")
        print(f"  Baseline (sequential):    {report.summary['dependencies']['baseline_ms']:.0f}ms")
        print(f"  Optimized (parallel+cache): {report.summary['dependencies']['optimized_ms']:.0f}ms")
        print(f"  Speedup:                   {report.summary['dependencies']['speedup']:.2f}x")
        print(f"  Improvement:               {report.summary['dependencies']['improvement_percent']:.1f}%")

        print("\n" + "="*80)

    def save_report(self, report: BenchmarkReport, output_path: Path):
        """Save benchmark report to JSON file"""
        report_dict = {
            'timestamp': report.timestamp,
            'results': [asdict(r) for r in report.results],
            'speedup_ratios': report.speedup_ratios,
            'summary': report.summary
        }

        with open(output_path, 'w') as f:
            json.dump(report_dict, f, indent=2)

        print(f"\n✅ Benchmark report saved to {output_path}")


# Pytest integration
class TestPerformanceBenchmarks:
    """Pytest-compatible performance benchmarks"""

    @pytest.mark.benchmark
    def test_run_full_benchmark_suite(self):
        """Run full benchmark suite as pytest test"""
        benchmark = PerformanceBenchmark()
        report = benchmark.run_complete_benchmark()

        # Verify that optimizations provide speedup
        assert report.speedup_ratios['test_coverage_parallel_vs_sequential'] > 0.8  # At least some benefit
        assert report.speedup_ratios['dependencies_parallel_vs_sequential'] > 0.8

    @pytest.mark.benchmark
    def test_cache_provides_speedup(self):
        """Test that caching provides measurable speedup"""
        benchmark = PerformanceBenchmark()

        # Run with cache twice
        first = benchmark.benchmark_test_coverage_parallel_with_cache_first_run()
        second = benchmark.benchmark_test_coverage_parallel_with_cache_second_run()

        # Second run should be faster
        assert second.duration_ms < first.duration_ms


def main():
    """Command-line entry point"""
    benchmark = PerformanceBenchmark()
    report = benchmark.run_complete_benchmark()

    # Save report
    output_path = Path.cwd() / 'performance_report.json'
    benchmark.save_report(report, output_path)


if __name__ == '__main__':
    main()
