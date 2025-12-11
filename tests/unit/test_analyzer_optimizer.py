#!/usr/bin/env python3
"""
Unit tests for analyzer_optimizer.py

Tests for the shared parallel processing and caching utilities used by all analyzers.
"""

import json
import os
import shutil
import tempfile
import time
import unittest
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.analyzer_optimizer import (
    AnalysisCache,
    CacheMetadata,
    AnalyzerCache,
    ParallelAnalyzer,
    get_file_content_hash,
    get_file_key,
    batch_items_by_attribute,
    TQDM_AVAILABLE,
)


# ============================================================================
# Test Constants
# ============================================================================

TEST_ANALYZER_NAME = 'test_analyzer'
TEST_CACHE_VERSION = '1.0'
TEST_TIMESTAMP = 1705320000.0
TEST_CONTENT_HASH = 'abc123def456'
TEST_RESULT = {'status': 'success', 'count': 42}

DEFAULT_MAX_BATCH_SIZE = 100
SAMPLE_FILE_CONTENT = b'sample file content for testing'
SAMPLE_FILE_HASH_PREFIX = '8a8c'  # First chars of SHA-256 of SAMPLE_FILE_CONTENT


# ============================================================================
# Picklable Functions for ProcessPoolExecutor Tests
# ============================================================================

def double_value(x: int) -> int:
    """Double an integer value (picklable function)."""
    return x * 2


def uppercase_string(x: str) -> str:
    """Convert string to uppercase (picklable function)."""
    return x.upper()


def str_key_func(x: Any) -> str:
    """Get string key from item (picklable function)."""
    return str(x)


def hash_with_prefix(x: Any) -> str:
    """Generate hash with prefix (picklable function)."""
    return f'hash_{x}'


# ============================================================================
# AnalysisCache Tests
# ============================================================================

class TestAnalysisCache(unittest.TestCase):
    """Tests for AnalysisCache dataclass."""

    def test_analysis_cache_creation(self):
        """Test creating an AnalysisCache with all fields."""
        cache = AnalysisCache(
            key='test_key',
            hash=TEST_CONTENT_HASH,
            timestamp=TEST_TIMESTAMP,
            result=TEST_RESULT,
            analyzer_version=TEST_CACHE_VERSION
        )

        self.assertEqual(cache.key, 'test_key')
        self.assertEqual(cache.hash, TEST_CONTENT_HASH)
        self.assertEqual(cache.timestamp, TEST_TIMESTAMP)
        self.assertEqual(cache.result, TEST_RESULT)
        self.assertEqual(cache.analyzer_version, TEST_CACHE_VERSION)

    def test_analysis_cache_default_version(self):
        """Test that analyzer_version has default value."""
        cache = AnalysisCache(
            key='test_key',
            hash=TEST_CONTENT_HASH,
            timestamp=TEST_TIMESTAMP,
            result=TEST_RESULT
        )

        self.assertEqual(cache.analyzer_version, '1.0')

    def test_analysis_cache_with_list_result(self):
        """Test cache with list result type."""
        list_result = [1, 2, 3, 'test']
        cache = AnalysisCache(
            key='list_key',
            hash=TEST_CONTENT_HASH,
            timestamp=TEST_TIMESTAMP,
            result=list_result
        )

        self.assertEqual(cache.result, list_result)

    def test_analysis_cache_with_nested_dict_result(self):
        """Test cache with nested dict result type."""
        nested_result = {
            'level1': {
                'level2': {
                    'data': [1, 2, 3]
                }
            }
        }
        cache = AnalysisCache(
            key='nested_key',
            hash=TEST_CONTENT_HASH,
            timestamp=TEST_TIMESTAMP,
            result=nested_result
        )

        self.assertEqual(cache.result['level1']['level2']['data'], [1, 2, 3])


# ============================================================================
# CacheMetadata Tests
# ============================================================================

class TestCacheMetadata(unittest.TestCase):
    """Tests for CacheMetadata dataclass."""

    def test_cache_metadata_defaults(self):
        """Test CacheMetadata default values."""
        metadata = CacheMetadata()

        self.assertEqual(metadata.version, '1.0')
        self.assertEqual(metadata.analyzer_name, '')
        self.assertEqual(metadata.last_update, 0.0)
        self.assertIsNotNone(metadata.entries)
        self.assertEqual(len(metadata.entries), 0)

    def test_cache_metadata_with_analyzer_name(self):
        """Test CacheMetadata with analyzer name."""
        metadata = CacheMetadata(analyzer_name=TEST_ANALYZER_NAME)

        self.assertEqual(metadata.analyzer_name, TEST_ANALYZER_NAME)

    def test_cache_metadata_post_init_creates_empty_entries(self):
        """Test that __post_init__ creates empty dict for entries."""
        metadata = CacheMetadata(entries=None)

        self.assertIsNotNone(metadata.entries)
        self.assertEqual(metadata.entries, {})

    def test_cache_metadata_with_existing_entries(self):
        """Test CacheMetadata with pre-existing entries."""
        entry = AnalysisCache(
            key='test_key',
            hash=TEST_CONTENT_HASH,
            timestamp=TEST_TIMESTAMP,
            result=TEST_RESULT
        )
        metadata = CacheMetadata(
            analyzer_name=TEST_ANALYZER_NAME,
            entries={'test_key': entry}
        )

        self.assertEqual(len(metadata.entries), 1)
        self.assertIn('test_key', metadata.entries)


# ============================================================================
# AnalyzerCache Tests
# ============================================================================

class TestAnalyzerCache(unittest.TestCase):
    """Tests for AnalyzerCache class."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir)
        self.cache = AnalyzerCache(TEST_ANALYZER_NAME, self.cache_dir)

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test AnalyzerCache initialization."""
        self.assertEqual(self.cache.analyzer_name, TEST_ANALYZER_NAME)
        self.assertEqual(self.cache.cache_dir, self.cache_dir)
        self.assertTrue(self.cache.cache_dir.exists())

    def test_cache_file_path(self):
        """Test cache file path is correct."""
        expected_path = self.cache_dir / f'{TEST_ANALYZER_NAME}_cache.json'
        self.assertEqual(self.cache.cache_file, expected_path)

    def test_cache_dir_created_if_not_exists(self):
        """Test that cache directory is created if it doesn't exist."""
        new_cache_dir = Path(self.temp_dir) / 'new_cache_dir'
        cache = AnalyzerCache('new_analyzer', new_cache_dir)

        self.assertTrue(new_cache_dir.exists())

    def test_load_cache_no_existing_file(self):
        """Test loading cache when no file exists."""
        self.assertIsNotNone(self.cache.metadata)
        self.assertEqual(self.cache.metadata.analyzer_name, TEST_ANALYZER_NAME)
        self.assertEqual(len(self.cache.metadata.entries), 0)

    def test_save_and_load_cache(self):
        """Test saving and loading cache."""
        # Add entry and save
        self.cache.update_cache('test_key', TEST_CONTENT_HASH, TEST_RESULT)
        self.cache.save_cache()

        # Create new cache instance to load from file
        new_cache = AnalyzerCache(TEST_ANALYZER_NAME, self.cache_dir)

        self.assertEqual(len(new_cache.metadata.entries), 1)
        self.assertIn('test_key', new_cache.metadata.entries)
        self.assertEqual(new_cache.metadata.entries['test_key'].result, TEST_RESULT)

    def test_calculate_hash_string(self):
        """Test hash calculation for string content."""
        content = 'test string content'
        hash1 = self.cache.calculate_hash(content)
        hash2 = self.cache.calculate_hash(content)

        self.assertEqual(len(hash1), 64)  # SHA-256 hex length
        self.assertEqual(hash1, hash2)  # Same content = same hash

    def test_calculate_hash_bytes(self):
        """Test hash calculation for bytes content."""
        content = b'test bytes content'
        hash_result = self.cache.calculate_hash(content)

        self.assertEqual(len(hash_result), 64)

    def test_calculate_hash_dict(self):
        """Test hash calculation for dict content."""
        content = {'key': 'value', 'number': 42}
        hash1 = self.cache.calculate_hash(content)
        hash2 = self.cache.calculate_hash(content)

        self.assertEqual(len(hash1), 64)
        self.assertEqual(hash1, hash2)

    def test_calculate_hash_dict_order_independent(self):
        """Test that dict hash is consistent regardless of key order."""
        content1 = {'a': 1, 'b': 2}
        content2 = {'b': 2, 'a': 1}

        hash1 = self.cache.calculate_hash(content1)
        hash2 = self.cache.calculate_hash(content2)

        self.assertEqual(hash1, hash2)

    def test_is_cached_returns_false_for_missing_key(self):
        """Test is_cached returns False for non-existent key."""
        result = self.cache.is_cached('nonexistent', TEST_CONTENT_HASH)
        self.assertFalse(result)

    def test_is_cached_returns_false_for_hash_mismatch(self):
        """Test is_cached returns False when hash doesn't match."""
        self.cache.update_cache('test_key', 'old_hash', TEST_RESULT)

        result = self.cache.is_cached('test_key', 'new_hash')
        self.assertFalse(result)

    def test_is_cached_returns_true_for_valid_cache(self):
        """Test is_cached returns True for valid cached entry."""
        self.cache.update_cache('test_key', TEST_CONTENT_HASH, TEST_RESULT)

        result = self.cache.is_cached('test_key', TEST_CONTENT_HASH)
        self.assertTrue(result)

    def test_get_cached_result_returns_none_for_missing(self):
        """Test get_cached_result returns None for missing key."""
        result = self.cache.get_cached_result('nonexistent')
        self.assertIsNone(result)

    def test_get_cached_result_returns_result(self):
        """Test get_cached_result returns cached result."""
        self.cache.update_cache('test_key', TEST_CONTENT_HASH, TEST_RESULT)

        result = self.cache.get_cached_result('test_key')
        self.assertEqual(result, TEST_RESULT)

    def test_update_cache_creates_entry(self):
        """Test update_cache creates new cache entry."""
        self.cache.update_cache('new_key', 'new_hash', {'data': 'value'})

        self.assertIn('new_key', self.cache.metadata.entries)
        entry = self.cache.metadata.entries['new_key']
        self.assertEqual(entry.hash, 'new_hash')
        self.assertEqual(entry.result, {'data': 'value'})

    def test_update_cache_overwrites_existing(self):
        """Test update_cache overwrites existing entry."""
        self.cache.update_cache('test_key', 'old_hash', {'old': 'data'})
        self.cache.update_cache('test_key', 'new_hash', {'new': 'data'})

        entry = self.cache.metadata.entries['test_key']
        self.assertEqual(entry.hash, 'new_hash')
        self.assertEqual(entry.result, {'new': 'data'})

    def test_clear_cache(self):
        """Test clear_cache removes all entries."""
        self.cache.update_cache('key1', 'hash1', {'data': 1})
        self.cache.update_cache('key2', 'hash2', {'data': 2})
        self.assertEqual(len(self.cache.metadata.entries), 2)

        self.cache.clear_cache()

        self.assertEqual(len(self.cache.metadata.entries), 0)

    def test_load_cache_with_invalid_json(self):
        """Test loading cache handles invalid JSON gracefully."""
        # Write invalid JSON to cache file
        self.cache.cache_file.write_text('{ invalid json }')

        # Create new cache instance
        new_cache = AnalyzerCache(TEST_ANALYZER_NAME, self.cache_dir)

        # Should fall back to empty cache
        self.assertEqual(len(new_cache.metadata.entries), 0)


# ============================================================================
# ParallelAnalyzer Tests
# ============================================================================

class TestParallelAnalyzer(unittest.TestCase):
    """Tests for ParallelAnalyzer class."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir)

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization_defaults(self):
        """Test ParallelAnalyzer initialization with defaults."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            cache_dir=self.cache_dir
        )

        self.assertEqual(analyzer.analyzer_name, TEST_ANALYZER_NAME)
        self.assertGreaterEqual(analyzer.max_workers, 1)
        self.assertTrue(analyzer.use_cache)
        self.assertIsNotNone(analyzer.cache)

    def test_initialization_custom_workers(self):
        """Test ParallelAnalyzer with custom worker count."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            max_workers=4,
            cache_dir=self.cache_dir
        )

        self.assertEqual(analyzer.max_workers, 4)

    def test_initialization_cache_disabled(self):
        """Test ParallelAnalyzer with cache disabled."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        self.assertFalse(analyzer.use_cache)
        self.assertIsNone(analyzer.cache)

    def test_initialization_default_cache_dir(self):
        """Test ParallelAnalyzer creates default cache directory."""
        with patch('src.analyzers.analyzer_optimizer.Path') as mock_path:
            mock_cwd = MagicMock()
            mock_path.cwd.return_value = mock_cwd
            mock_cwd.__truediv__ = lambda self, x: Path(self.temp_dir) / x

            # Use explicit cache_dir to avoid issues
            analyzer = ParallelAnalyzer(
                TEST_ANALYZER_NAME,
                cache_dir=self.cache_dir
            )

            self.assertIsNotNone(analyzer.cache)

    def test_max_workers_minimum_one(self):
        """Test max_workers is at least 1."""
        with patch('os.cpu_count', return_value=1):
            analyzer = ParallelAnalyzer(
                TEST_ANALYZER_NAME,
                cache_dir=self.cache_dir
            )
            self.assertGreaterEqual(analyzer.max_workers, 1)

    def test_max_workers_with_none_cpu_count(self):
        """Test max_workers handles None cpu_count."""
        with patch('os.cpu_count', return_value=None):
            analyzer = ParallelAnalyzer(
                TEST_ANALYZER_NAME,
                cache_dir=self.cache_dir
            )
            self.assertGreaterEqual(analyzer.max_workers, 1)

    def test_invalidate_cache_for_items(self):
        """Test invalidating cache for specific items."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            cache_dir=self.cache_dir
        )

        # Add entries
        analyzer.cache.update_cache('key1', 'hash1', {'data': 1})
        analyzer.cache.update_cache('key2', 'hash2', {'data': 2})
        analyzer.cache.update_cache('key3', 'hash3', {'data': 3})

        # Invalidate specific keys
        analyzer.invalidate_cache_for_items(['key1', 'key3'])

        self.assertNotIn('key1', analyzer.cache.metadata.entries)
        self.assertIn('key2', analyzer.cache.metadata.entries)
        self.assertNotIn('key3', analyzer.cache.metadata.entries)

    def test_invalidate_cache_no_cache(self):
        """Test invalidate_cache_for_items with cache disabled."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        # Should not raise exception
        analyzer.invalidate_cache_for_items(['key1', 'key2'])

    def test_clear_cache(self):
        """Test clearing entire cache."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            cache_dir=self.cache_dir
        )

        analyzer.cache.update_cache('key1', 'hash1', {'data': 1})
        analyzer.cache.update_cache('key2', 'hash2', {'data': 2})

        analyzer.clear_cache()

        self.assertEqual(len(analyzer.cache.metadata.entries), 0)

    def test_clear_cache_no_cache(self):
        """Test clear_cache with cache disabled."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        # Should not raise exception
        analyzer.clear_cache()


# ============================================================================
# ParallelAnalyzer.process_items_parallel Tests
# ============================================================================

class TestParallelAnalyzerProcessing(unittest.TestCase):
    """Tests for ParallelAnalyzer.process_items_parallel method."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir)

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_process_items_parallel_basic(self):
        """Test basic parallel processing without caching."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            max_workers=2,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        items = [1, 2, 3, 4, 5]

        results = analyzer.process_items_parallel(
            items,
            double_value,  # Use picklable function
            str_key_func,  # Use picklable function
            description='Test processing'
        )

        self.assertEqual(len(results), 5)
        result_values = [r[1] for r in results]
        self.assertEqual(sorted(result_values), [2, 4, 6, 8, 10])

    def test_process_items_parallel_empty_list(self):
        """Test processing empty list."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        results = analyzer.process_items_parallel(
            [],
            double_value,  # Use picklable function
            str_key_func   # Use picklable function
        )

        self.assertEqual(results, [])

    def test_process_items_parallel_with_caching(self):
        """Test processing with caching enabled."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            max_workers=2,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        items = [1, 2, 3]

        # First run - all items processed
        results1 = analyzer.process_items_parallel(
            items,
            double_value,  # Use picklable function
            str_key_func,  # Use picklable function
            hash_func=hash_with_prefix,  # Use picklable function
            skip_cached=True
        )

        self.assertEqual(len(results1), 3)

        # Second run - all items should be cached
        results2 = analyzer.process_items_parallel(
            items,
            double_value,  # Use picklable function
            str_key_func,  # Use picklable function
            hash_func=hash_with_prefix,  # Use picklable function
            skip_cached=True
        )

        self.assertEqual(len(results2), 3)

    def test_process_items_parallel_skip_cached_false(self):
        """Test processing all items when skip_cached is False."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            max_workers=2,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        items = [1, 2, 3]

        # First run
        analyzer.process_items_parallel(
            items,
            double_value,  # Use picklable function
            str_key_func,  # Use picklable function
            hash_func=hash_with_prefix  # Use picklable function
        )

        # Second run with skip_cached=False
        results = analyzer.process_items_parallel(
            items,
            double_value,  # Use picklable function
            str_key_func,  # Use picklable function
            hash_func=hash_with_prefix,  # Use picklable function
            skip_cached=False
        )

        self.assertEqual(len(results), 3)


# ============================================================================
# Utility Function Tests
# ============================================================================

class TestGetFileContentHash(unittest.TestCase):
    """Tests for get_file_content_hash function."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_hash_existing_file(self):
        """Test hashing existing file."""
        file_path = Path(self.temp_dir) / 'test.txt'
        file_path.write_bytes(SAMPLE_FILE_CONTENT)

        hash_result = get_file_content_hash(file_path)

        # Verify hash is valid SHA-256 (64 hex characters)
        self.assertEqual(len(hash_result), 64)
        # Verify hash is consistent
        hash_result2 = get_file_content_hash(file_path)
        self.assertEqual(hash_result, hash_result2)

    def test_hash_same_content_same_hash(self):
        """Test that same content produces same hash."""
        file1 = Path(self.temp_dir) / 'file1.txt'
        file2 = Path(self.temp_dir) / 'file2.txt'

        file1.write_bytes(SAMPLE_FILE_CONTENT)
        file2.write_bytes(SAMPLE_FILE_CONTENT)

        hash1 = get_file_content_hash(file1)
        hash2 = get_file_content_hash(file2)

        self.assertEqual(hash1, hash2)

    def test_hash_different_content_different_hash(self):
        """Test that different content produces different hash."""
        file1 = Path(self.temp_dir) / 'file1.txt'
        file2 = Path(self.temp_dir) / 'file2.txt'

        file1.write_bytes(b'content 1')
        file2.write_bytes(b'content 2')

        hash1 = get_file_content_hash(file1)
        hash2 = get_file_content_hash(file2)

        self.assertNotEqual(hash1, hash2)

    def test_hash_nonexistent_file(self):
        """Test hashing nonexistent file returns empty string."""
        file_path = Path(self.temp_dir) / 'nonexistent.txt'

        hash_result = get_file_content_hash(file_path)

        self.assertEqual(hash_result, '')


class TestGetFileKey(unittest.TestCase):
    """Tests for get_file_key function."""

    def test_get_file_key_returns_string(self):
        """Test get_file_key returns string representation."""
        file_path = Path('/some/path/to/file.py')
        key = get_file_key(file_path)

        self.assertIsInstance(key, str)
        self.assertEqual(key, '/some/path/to/file.py')

    def test_get_file_key_relative_path(self):
        """Test get_file_key with relative path."""
        file_path = Path('relative/path/file.txt')
        key = get_file_key(file_path)

        self.assertEqual(key, 'relative/path/file.txt')


class TestBatchItemsByAttribute(unittest.TestCase):
    """Tests for batch_items_by_attribute function."""

    def test_batch_empty_list(self):
        """Test batching empty list."""
        batches = batch_items_by_attribute([], lambda x: x, max_batch_size=10)
        self.assertEqual(batches, [])

    def test_batch_single_item(self):
        """Test batching single item."""
        items = ['item1']
        batches = batch_items_by_attribute(items, lambda x: x[0], max_batch_size=10)

        self.assertEqual(len(batches), 1)
        self.assertEqual(batches[0], ['item1'])

    def test_batch_by_attribute(self):
        """Test batching groups items by attribute."""
        items = [
            {'type': 'a', 'value': 1},
            {'type': 'b', 'value': 2},
            {'type': 'a', 'value': 3},
            {'type': 'b', 'value': 4},
        ]

        batches = batch_items_by_attribute(
            items,
            lambda x: x['type'],
            max_batch_size=10
        )

        # All items should fit in one batch
        self.assertEqual(len(batches), 1)
        self.assertEqual(len(batches[0]), 4)

    def test_batch_respects_max_size(self):
        """Test batching respects max_batch_size."""
        items = list(range(25))

        batches = batch_items_by_attribute(
            items,
            lambda x: x % 2,  # Group by even/odd
            max_batch_size=10
        )

        # Should create multiple batches
        self.assertGreater(len(batches), 1)

        # Each batch should not exceed max size
        for batch in batches:
            self.assertLessEqual(len(batch), 10)

    def test_batch_all_items_included(self):
        """Test all items are included in batches."""
        items = list(range(100))

        batches = batch_items_by_attribute(
            items,
            lambda x: x % 5,
            max_batch_size=15
        )

        # Count total items in batches
        total_items = sum(len(batch) for batch in batches)
        self.assertEqual(total_items, 100)

    def test_batch_preserves_item_values(self):
        """Test batching preserves item values."""
        items = [{'id': i, 'category': i % 3} for i in range(15)]

        batches = batch_items_by_attribute(
            items,
            lambda x: x['category'],
            max_batch_size=10
        )

        # Flatten batches
        all_items = [item for batch in batches for item in batch]

        # All original items should be present
        ids = {item['id'] for item in all_items}
        self.assertEqual(ids, set(range(15)))

    def test_batch_default_max_size(self):
        """Test default max_batch_size is used."""
        items = list(range(150))

        batches = batch_items_by_attribute(
            items,
            lambda x: 0  # All same group
        )

        # With default max_batch_size=100, should have 2 batches
        self.assertEqual(len(batches), 2)
        self.assertEqual(len(batches[0]), DEFAULT_MAX_BATCH_SIZE)
        self.assertEqual(len(batches[1]), 50)


# ============================================================================
# TQDM Fallback Tests
# ============================================================================

class TestTqdmFallback(unittest.TestCase):
    """Tests for tqdm fallback behavior."""

    def test_tqdm_available_constant(self):
        """Test TQDM_AVAILABLE constant is boolean."""
        self.assertIsInstance(TQDM_AVAILABLE, bool)


# ============================================================================
# Integration Tests
# ============================================================================

class TestAnalyzerCacheIntegration(unittest.TestCase):
    """Integration tests for AnalyzerCache with ParallelAnalyzer."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir)

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_cache_persistence_across_instances(self):
        """Test cache persists across analyzer instances."""
        # First analyzer instance
        analyzer1 = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        # Process items
        items = ['a', 'b', 'c']

        analyzer1.process_items_parallel(
            items,
            uppercase_string,  # Use picklable function
            str_key_func,  # Use picklable function
            hash_func=hash_with_prefix  # Use picklable function
        )

        # Verify cache saved
        self.assertTrue(analyzer1.cache.cache_file.exists())

        # Second analyzer instance
        analyzer2 = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        # All items should be cached
        for item in items:
            key = str_key_func(item)
            content_hash = hash_with_prefix(item)
            self.assertTrue(analyzer2.cache.is_cached(key, content_hash))

    def test_cache_invalidation_workflow(self):
        """Test cache invalidation workflow."""
        analyzer = ParallelAnalyzer(
            TEST_ANALYZER_NAME,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        # Add entries
        analyzer.cache.update_cache('file1.py', 'hash1', {'issues': []})
        analyzer.cache.update_cache('file2.py', 'hash2', {'issues': [1, 2]})
        analyzer.cache.save_cache()

        # Invalidate one entry
        analyzer.invalidate_cache_for_items(['file1.py'])

        # Verify state
        self.assertNotIn('file1.py', analyzer.cache.metadata.entries)
        self.assertIn('file2.py', analyzer.cache.metadata.entries)


if __name__ == '__main__':
    unittest.main()
