#!/usr/bin/env python3
"""
Integration tests for parallel analyzer functionality

Tests parallel processing with different worker counts and configurations.
"""

import pytest
import sys
import tempfile
import shutil
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.analyzer_optimizer import ParallelAnalyzer, get_file_content_hash, get_file_key
from src.analyzers.test_coverage import _analyze_file_worker
from src.analyzers.dependencies import _analyze_file_dependencies_worker


class TestParallelAnalyzers:
    """Test suite for parallel processing functionality"""

    @pytest.fixture
    def temp_cache_dir(self):
        """Create temporary cache directory"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def sample_files(self):
        """Get sample Python files from src directory"""
        src_dir = Path(__file__).parent.parent.parent / 'src' / 'analyzers'
        return list(src_dir.glob('*.py'))[:5]  # Use first 5 files

    def test_parallel_analyzer_with_different_worker_counts(self, sample_files, temp_cache_dir):
        """Test parallel processing with 1, 2, 4, and 8 workers"""
        worker_counts = [1, 2, 4, 8]

        for worker_count in worker_counts:
            optimizer = ParallelAnalyzer(
                analyzer_name=f'test_{worker_count}workers',
                max_workers=worker_count,
                use_cache=False,
                cache_dir=temp_cache_dir
            )

            results = optimizer.process_items_parallel(
                items=sample_files,
                processor_func=_analyze_file_worker,
                key_func=get_file_key,
                skip_cached=False,
                description=f"Testing {worker_count} workers"
            )

            # Verify all files were processed
            assert len(results) == len(sample_files)
            # Verify each result is a tuple (file_path, data)
            for file_path, data in results:
                assert isinstance(file_path, Path)
                assert isinstance(data, list)

    def test_parallel_processing_maintains_order_independence(self, sample_files, temp_cache_dir):
        """Test that parallel processing produces consistent results regardless of order"""
        optimizer = ParallelAnalyzer(
            analyzer_name='order_test',
            max_workers=4,
            use_cache=False,
            cache_dir=temp_cache_dir
        )

        # Run twice with same files
        results1 = optimizer.process_items_parallel(
            items=sample_files,
            processor_func=_analyze_file_worker,
            key_func=get_file_key,
            skip_cached=False,
            description="Run 1"
        )

        results2 = optimizer.process_items_parallel(
            items=sample_files,
            processor_func=_analyze_file_worker,
            key_func=get_file_key,
            skip_cached=False,
            description="Run 2"
        )

        # Convert to dicts for comparison
        results1_dict = {str(f): data for f, data in results1}
        results2_dict = {str(f): data for f, data in results2}

        # Results should be identical
        assert results1_dict.keys() == results2_dict.keys()

        # Compare data for each file
        for file_path in results1_dict.keys():
            assert len(results1_dict[file_path]) == len(results2_dict[file_path])

    def test_worker_function_is_picklable(self):
        """Test that worker functions can be pickled for multiprocessing"""
        import pickle

        # Test coverage worker
        pickled_tc = pickle.dumps(_analyze_file_worker)
        unpickled_tc = pickle.loads(pickled_tc)
        assert callable(unpickled_tc)

        # Test dependencies worker
        pickled_dep = pickle.dumps(_analyze_file_dependencies_worker)
        unpickled_dep = pickle.loads(pickled_dep)
        assert callable(unpickled_dep)

    def test_parallel_processing_handles_errors_gracefully(self, temp_cache_dir):
        """Test that parallel processing continues even if some files fail"""
        # Create a mix of valid and invalid paths
        valid_file = Path(__file__).parent.parent.parent / 'src' / 'analyzers' / 'test_coverage.py'
        invalid_file = Path('/nonexistent/file.py')

        items = [valid_file, invalid_file, valid_file]

        optimizer = ParallelAnalyzer(
            analyzer_name='error_test',
            max_workers=2,
            use_cache=False,
            cache_dir=temp_cache_dir
        )

        results = optimizer.process_items_parallel(
            items=items,
            processor_func=_analyze_file_worker,
            key_func=get_file_key,
            skip_cached=False,
            description="Testing error handling"
        )

        # Should get results for all items (even if some failed)
        assert len(results) == len(items)

    def test_parallel_analyzer_with_cache_enabled(self, sample_files, temp_cache_dir):
        """Test parallel processing with caching enabled"""
        optimizer = ParallelAnalyzer(
            analyzer_name='cache_test',
            max_workers=4,
            use_cache=True,
            cache_dir=temp_cache_dir
        )

        # First run - no cache
        results1 = optimizer.process_items_parallel(
            items=sample_files,
            processor_func=_analyze_file_worker,
            key_func=get_file_key,
            hash_func=get_file_content_hash,
            skip_cached=True,
            description="First run"
        )

        # Second run - with cache
        results2 = optimizer.process_items_parallel(
            items=sample_files,
            processor_func=_analyze_file_worker,
            key_func=get_file_key,
            hash_func=get_file_content_hash,
            skip_cached=True,
            description="Second run"
        )

        # Should get same number of results
        assert len(results1) == len(results2)

        # Cache should have entries
        assert len(optimizer.cache.metadata.entries) > 0

    def test_file_content_hash_consistency(self):
        """Test that file content hash is consistent"""
        test_file = Path(__file__)

        hash1 = get_file_content_hash(test_file)
        hash2 = get_file_content_hash(test_file)

        # Same file should produce same hash
        assert hash1 == hash2
        # Hash should be a hex string
        assert len(hash1) == 64  # SHA-256 produces 64-character hex string

    def test_get_file_key_returns_string(self):
        """Test that get_file_key returns string representation"""
        test_file = Path(__file__)
        key = get_file_key(test_file)

        assert isinstance(key, str)
        assert str(test_file) == key

    def test_parallel_processing_with_no_items(self, temp_cache_dir):
        """Test parallel processing with empty item list"""
        optimizer = ParallelAnalyzer(
            analyzer_name='empty_test',
            max_workers=4,
            use_cache=False,
            cache_dir=temp_cache_dir
        )

        results = optimizer.process_items_parallel(
            items=[],
            processor_func=_analyze_file_worker,
            key_func=get_file_key,
            skip_cached=False,
            description="Testing empty list"
        )

        assert results == []

    def test_max_workers_respects_configuration(self, temp_cache_dir):
        """Test that max_workers configuration is respected"""
        # Test default (CPU count - 1)
        optimizer_default = ParallelAnalyzer(
            analyzer_name='default_workers',
            use_cache=False,
            cache_dir=temp_cache_dir
        )
        import os
        expected_default = max(1, os.cpu_count() - 1)
        assert optimizer_default.max_workers == expected_default

        # Test custom value
        optimizer_custom = ParallelAnalyzer(
            analyzer_name='custom_workers',
            max_workers=2,
            use_cache=False,
            cache_dir=temp_cache_dir
        )
        assert optimizer_custom.max_workers == 2

    def test_dependencies_worker_function_execution(self, sample_files):
        """Test dependencies worker function on real files"""
        for file_path in sample_files:
            result = _analyze_file_dependencies_worker(file_path)

            # Should return a list
            assert isinstance(result, list)

            # If file has dependencies, they should be dicts
            if result:
                for dep in result:
                    assert isinstance(dep, dict)
                    assert 'package' in dep
                    assert 'import_type' in dep
                    assert 'file_path' in dep
                    assert 'line_number' in dep
                    assert 'is_external' in dep

    def test_test_coverage_worker_function_execution(self, sample_files):
        """Test test coverage worker function on real files"""
        for file_path in sample_files:
            result = _analyze_file_worker(file_path)

            # Should return a list
            assert isinstance(result, list)

            # If file has functions, they should be dicts
            if result:
                for func in result:
                    assert isinstance(func, dict)
                    assert 'name' in func
                    assert 'file_path' in func
                    assert 'line_number' in func
                    assert 'is_async' in func


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
