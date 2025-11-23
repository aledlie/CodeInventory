#!/usr/bin/env python3
"""
Integration tests for optimized analysis pipeline

Tests the complete pipeline with parallel processing and caching enabled.
"""

import pytest
import sys
import tempfile
import shutil
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.test_coverage import TestCoverageAnalyzer
from src.analyzers.dependencies import DependencyAnalyzer
from src.analyzers.analyzer_optimizer import ParallelAnalyzer, AnalyzerCache


class TestOptimizedPipeline:
    """Test suite for optimized analysis pipeline"""

    @pytest.fixture
    def temp_cache_dir(self):
        """Create temporary cache directory"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def sample_src_dir(self):
        """Use the actual src directory for testing"""
        return Path(__file__).parent.parent.parent / 'src'

    @pytest.fixture
    def sample_test_dir(self):
        """Use the actual tests directory"""
        return Path(__file__).parent.parent

    def test_test_coverage_optimized_completes(self, sample_src_dir, sample_test_dir, temp_cache_dir):
        """Test that optimized test coverage analysis completes successfully"""
        analyzer = TestCoverageAnalyzer(sample_src_dir, sample_test_dir)

        # Run optimized analysis
        analyzer.analyze_coverage_optimized(
            use_parallel=True,
            use_cache=True,
            max_workers=2  # Use fewer workers for testing
        )

        # Verify results
        assert analyzer.report.total_functions > 0
        assert analyzer.report.coverage_percentage >= 0
        assert len(analyzer.report.functions) > 0

    def test_dependencies_optimized_completes(self, sample_src_dir, temp_cache_dir):
        """Test that optimized dependency analysis completes successfully"""
        analyzer = DependencyAnalyzer(sample_src_dir)

        # Run optimized analysis
        analyzer.analyze_directory_optimized(
            use_parallel=True,
            use_cache=True,
            max_workers=2
        )

        # Verify results
        assert analyzer.report.total_dependencies > 0
        assert len(analyzer.report.dependencies_by_file) > 0

    def test_parallel_faster_than_sequential_test_coverage(self, sample_src_dir, sample_test_dir):
        """Test that parallel processing is actually faster"""
        import time

        # Sequential run
        analyzer_seq = TestCoverageAnalyzer(sample_src_dir, sample_test_dir)
        start = time.time()
        analyzer_seq.analyze_coverage()
        sequential_time = time.time() - start

        # Parallel run
        analyzer_par = TestCoverageAnalyzer(sample_src_dir, sample_test_dir)
        start = time.time()
        analyzer_par.analyze_coverage_optimized(use_parallel=True, use_cache=False, max_workers=4)
        parallel_time = time.time() - start

        # Parallel should be faster or at least not significantly slower
        # Allow 20% margin for overhead in small codebases
        assert parallel_time <= sequential_time * 1.2

    def test_cache_speeds_up_subsequent_runs(self, sample_src_dir, temp_cache_dir):
        """Test that caching provides speedup on subsequent runs"""
        import time

        # First run (no cache)
        analyzer1 = DependencyAnalyzer(sample_src_dir)
        start = time.time()
        analyzer1.analyze_directory_optimized(use_parallel=True, use_cache=True, max_workers=2)
        first_run_time = time.time() - start

        # Second run (with cache)
        analyzer2 = DependencyAnalyzer(sample_src_dir)
        start = time.time()
        analyzer2.analyze_directory_optimized(use_parallel=True, use_cache=True, max_workers=2)
        second_run_time = time.time() - start

        # Second run should be faster
        assert second_run_time < first_run_time

        # Results should be identical
        assert analyzer1.report.total_dependencies == analyzer2.report.total_dependencies

    def test_optimizations_can_be_disabled(self, sample_src_dir, sample_test_dir):
        """Test that optimizations can be disabled gracefully"""
        analyzer = TestCoverageAnalyzer(sample_src_dir, sample_test_dir)

        # Run with optimizations disabled
        analyzer.analyze_coverage_optimized(
            use_parallel=False,
            use_cache=False
        )

        # Should still work and produce results
        assert analyzer.report.total_functions > 0

    def test_parallel_analyzer_initialization(self, temp_cache_dir):
        """Test ParallelAnalyzer initialization"""
        optimizer = ParallelAnalyzer(
            analyzer_name='test',
            max_workers=4,
            use_cache=True,
            cache_dir=temp_cache_dir
        )

        assert optimizer.analyzer_name == 'test'
        assert optimizer.max_workers == 4
        assert optimizer.use_cache is True
        assert optimizer.cache is not None

    def test_cache_manager_operations(self, temp_cache_dir):
        """Test AnalyzerCache save and load operations"""
        cache = AnalyzerCache('test_analyzer', temp_cache_dir)

        # Update cache
        cache.update_cache('test_key', 'test_hash', {'result': 'test_data'})

        # Save cache
        cache.save_cache()

        # Load cache in new instance
        cache2 = AnalyzerCache('test_analyzer', temp_cache_dir)

        # Verify cache was loaded
        assert 'test_key' in cache2.metadata.entries
        assert cache2.metadata.entries['test_key'].hash == 'test_hash'
        assert cache2.get_cached_result('test_key') == {'result': 'test_data'}

    def test_cache_invalidation_on_content_change(self, temp_cache_dir):
        """Test that cache is invalidated when content changes"""
        cache = AnalyzerCache('test_analyzer', temp_cache_dir)

        # Add cached entry
        cache.update_cache('test_file', 'old_hash', {'old': 'data'})

        # Check with old hash - should be cached
        assert cache.is_cached('test_file', 'old_hash') is True

        # Check with new hash - should not be cached
        assert cache.is_cached('test_file', 'new_hash') is False

    def test_clear_cache_removes_all_entries(self, temp_cache_dir):
        """Test that clear_cache removes all cached entries"""
        cache = AnalyzerCache('test_analyzer', temp_cache_dir)

        # Add multiple entries
        cache.update_cache('key1', 'hash1', {'data': 1})
        cache.update_cache('key2', 'hash2', {'data': 2})
        cache.save_cache()

        # Clear cache
        cache.clear_cache()

        # Verify cache is empty
        assert len(cache.metadata.entries) == 0

    def test_graceful_fallback_when_optimizer_unavailable(self, sample_src_dir, sample_test_dir, monkeypatch):
        """Test graceful fallback to sequential mode when optimizer unavailable"""
        # Temporarily set OPTIMIZER_AVAILABLE to False
        import src.analyzers.test_coverage as tc_module
        original_value = tc_module.OPTIMIZER_AVAILABLE
        monkeypatch.setattr(tc_module, 'OPTIMIZER_AVAILABLE', False)

        try:
            analyzer = TestCoverageAnalyzer(sample_src_dir, sample_test_dir)

            # Should fall back to sequential processing
            analyzer.analyze_coverage_optimized(use_parallel=True, use_cache=True)

            # Should still produce results
            assert analyzer.report.total_functions > 0
        finally:
            # Restore original value
            monkeypatch.setattr(tc_module, 'OPTIMIZER_AVAILABLE', original_value)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
