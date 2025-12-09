#!/usr/bin/env python3
"""
Integration tests for cache behavior

Tests caching functionality, invalidation, and persistence.
"""

import pytest
import sys
import tempfile
import shutil
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.analyzer_optimizer import AnalyzerCache, AnalysisCache, CacheMetadata


class TestCacheBehavior:
    """Test suite for cache behavior"""

    @pytest.fixture
    def temp_cache_dir(self):
        """Create temporary cache directory"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)

    def test_cache_initialization_creates_directory(self, temp_cache_dir):
        """Test that cache initialization creates cache directory"""
        cache_dir = temp_cache_dir / 'new_cache'
        assert not cache_dir.exists()

        cache = AnalyzerCache('test', cache_dir)

        assert cache_dir.exists()
        assert cache_dir.is_dir()

    def test_cache_file_created_on_save(self, temp_cache_dir):
        """Test that cache file is created when saving"""
        cache = AnalyzerCache('test', temp_cache_dir)
        cache_file = temp_cache_dir / 'test_cache.json'

        assert not cache_file.exists()

        cache.save_cache()

        assert cache_file.exists()

    def test_cache_persists_across_instances(self, temp_cache_dir):
        """Test that cache data persists across different instances"""
        # Create cache and add data
        cache1 = AnalyzerCache('test', temp_cache_dir)
        cache1.update_cache('key1', 'hash1', {'data': 'value1'})
        cache1.update_cache('key2', 'hash2', {'data': 'value2'})
        cache1.save_cache()

        # Load cache in new instance
        cache2 = AnalyzerCache('test', temp_cache_dir)

        # Verify data was loaded
        assert len(cache2.metadata.entries) == 2
        assert cache2.get_cached_result('key1') == {'data': 'value1'}
        assert cache2.get_cached_result('key2') == {'data': 'value2'}

    def test_cache_invalidation_on_hash_mismatch(self, temp_cache_dir):
        """Test that cache is invalidated when content hash changes"""
        cache = AnalyzerCache('test', temp_cache_dir)

        # Add entry with old hash
        cache.update_cache('file1', 'old_hash', {'old': 'data'})

        # Check with old hash
        assert cache.is_cached('file1', 'old_hash') is True

        # Check with new hash
        assert cache.is_cached('file1', 'new_hash') is False

    def test_cache_hit_returns_correct_data(self, temp_cache_dir):
        """Test that cache hit returns the correct cached data"""
        cache = AnalyzerCache('test', temp_cache_dir)

        test_data = {
            'functions': ['func1', 'func2'],
            'classes': ['Class1'],
            'metadata': {'count': 2}
        }

        cache.update_cache('key1', 'hash1', test_data)

        retrieved = cache.get_cached_result('key1')

        assert retrieved == test_data

    def test_cache_miss_returns_none(self, temp_cache_dir):
        """Test that cache miss returns None"""
        cache = AnalyzerCache('test', temp_cache_dir)

        result = cache.get_cached_result('nonexistent_key')

        assert result is None

    def test_cache_calculate_hash_consistency(self, temp_cache_dir):
        """Test that hash calculation is consistent"""
        cache = AnalyzerCache('test', temp_cache_dir)

        # Test with string
        hash1 = cache.calculate_hash("test content")
        hash2 = cache.calculate_hash("test content")
        assert hash1 == hash2

        # Test with dict
        test_dict = {'key': 'value', 'number': 42}
        hash3 = cache.calculate_hash(test_dict)
        hash4 = cache.calculate_hash(test_dict)
        assert hash3 == hash4

    def test_cache_calculate_hash_different_for_different_content(self, temp_cache_dir):
        """Test that different content produces different hashes"""
        cache = AnalyzerCache('test', temp_cache_dir)

        hash1 = cache.calculate_hash("content 1")
        hash2 = cache.calculate_hash("content 2")

        assert hash1 != hash2

    def test_cache_clear_removes_all_entries(self, temp_cache_dir):
        """Test that clear_cache removes all entries"""
        cache = AnalyzerCache('test', temp_cache_dir)

        # Add multiple entries
        for i in range(10):
            cache.update_cache(f'key{i}', f'hash{i}', {'index': i})

        cache.save_cache()
        assert len(cache.metadata.entries) == 10

        # Clear cache
        cache.clear_cache()

        assert len(cache.metadata.entries) == 0

        # Verify cache file reflects the clearing
        cache2 = AnalyzerCache('test', temp_cache_dir)
        assert len(cache2.metadata.entries) == 0

    def test_cache_json_structure(self, temp_cache_dir):
        """Test that cache JSON has correct structure"""
        cache = AnalyzerCache('test', temp_cache_dir)
        cache.update_cache('key1', 'hash1', {'data': 'test'})
        cache.save_cache()

        cache_file = temp_cache_dir / 'test_cache.json'

        with open(cache_file, 'r') as f:
            data = json.load(f)

        # Verify structure
        assert 'version' in data
        assert 'analyzer_name' in data
        assert 'last_update' in data
        assert 'entries' in data

        # Verify entries structure
        assert 'key1' in data['entries']
        entry = data['entries']['key1']
        assert 'key' in entry
        assert 'hash' in entry
        assert 'timestamp' in entry
        assert 'result' in entry
        assert 'analyzer_version' in entry

    def test_cache_handles_corrupted_file_gracefully(self, temp_cache_dir):
        """Test that corrupted cache file is handled gracefully"""
        cache_file = temp_cache_dir / 'test_cache.json'

        # Create corrupted cache file
        with open(cache_file, 'w') as f:
            f.write("{ invalid json content }")

        # Should not crash when loading corrupted cache
        cache = AnalyzerCache('test', temp_cache_dir)

        # Should start with empty cache
        assert len(cache.metadata.entries) == 0

    def test_cache_timestamp_tracking(self, temp_cache_dir):
        """Test that cache tracks timestamps correctly"""
        import time

        cache = AnalyzerCache('test', temp_cache_dir)

        before = time.time()
        cache.update_cache('key1', 'hash1', {'data': 'test'})
        after = time.time()

        entry = cache.metadata.entries['key1']

        # Timestamp should be between before and after
        assert before <= entry.timestamp <= after

    def test_cache_analyzer_version_tracking(self, temp_cache_dir):
        """Test that cache tracks analyzer version"""
        cache = AnalyzerCache('test', temp_cache_dir)
        cache.update_cache('key1', 'hash1', {'data': 'test'})

        entry = cache.metadata.entries['key1']

        assert entry.analyzer_version == "1.0"

    def test_cache_with_complex_data_structures(self, temp_cache_dir):
        """Test caching with complex nested data structures"""
        cache = AnalyzerCache('test', temp_cache_dir)

        complex_data = {
            'functions': [
                {'name': 'func1', 'args': ['a', 'b'], 'line': 10},
                {'name': 'func2', 'args': ['x'], 'line': 20}
            ],
            'classes': [
                {
                    'name': 'Class1',
                    'methods': ['method1', 'method2'],
                    'properties': {'prop1': 'value1'}
                }
            ],
            'imports': ['os', 'sys', 'pathlib'],
            'metadata': {
                'total_lines': 100,
                'complexity': 5
            }
        }

        cache.update_cache('complex_key', 'hash1', complex_data)
        cache.save_cache()

        # Load in new instance
        cache2 = AnalyzerCache('test', temp_cache_dir)
        retrieved = cache2.get_cached_result('complex_key')

        assert retrieved == complex_data

    def test_multiple_analyzers_share_cache_directory(self, temp_cache_dir):
        """Test that multiple analyzers can share the same cache directory"""
        cache1 = AnalyzerCache('analyzer1', temp_cache_dir)
        cache2 = AnalyzerCache('analyzer2', temp_cache_dir)

        cache1.update_cache('key1', 'hash1', {'analyzer': 1})
        cache2.update_cache('key1', 'hash1', {'analyzer': 2})

        cache1.save_cache()
        cache2.save_cache()

        # Verify separate cache files
        assert (temp_cache_dir / 'analyzer1_cache.json').exists()
        assert (temp_cache_dir / 'analyzer2_cache.json').exists()

        # Verify data is isolated
        assert cache1.get_cached_result('key1') == {'analyzer': 1}
        assert cache2.get_cached_result('key1') == {'analyzer': 2}

    def test_cache_update_overwrites_existing_entry(self, temp_cache_dir):
        """Test that updating cache overwrites existing entries"""
        cache = AnalyzerCache('test', temp_cache_dir)

        # Add initial entry
        cache.update_cache('key1', 'hash1', {'version': 1})

        # Update with new data
        cache.update_cache('key1', 'hash2', {'version': 2})

        # Should have only one entry with new data
        assert len(cache.metadata.entries) == 1
        result = cache.get_cached_result('key1')
        assert result == {'version': 2}

        # Hash should be updated
        entry = cache.metadata.entries['key1']
        assert entry.hash == 'hash2'

    def test_cache_with_empty_result(self, temp_cache_dir):
        """Test caching with empty result (no functions/dependencies found)"""
        cache = AnalyzerCache('test', temp_cache_dir)

        # Cache empty list
        cache.update_cache('empty_file', 'hash1', [])
        cache.save_cache()

        # Load and verify
        cache2 = AnalyzerCache('test', temp_cache_dir)
        result = cache2.get_cached_result('empty_file')

        assert result == []

    def test_cache_metadata_structure(self, temp_cache_dir):
        """Test CacheMetadata structure"""
        metadata = CacheMetadata(
            version="1.0",
            analyzer_name="test_analyzer",
            last_update=1234567890.0
        )

        assert metadata.version == "1.0"
        assert metadata.analyzer_name == "test_analyzer"
        assert metadata.last_update == 1234567890.0
        assert metadata.entries == {}

    def test_analysis_cache_structure(self):
        """Test AnalysisCache dataclass structure"""
        cache_entry = AnalysisCache(
            key="test_file.py",
            hash="abc123",
            timestamp=1234567890.0,
            result={'functions': ['func1']},
            analyzer_version="1.0"
        )

        assert cache_entry.key == "test_file.py"
        assert cache_entry.hash == "abc123"
        assert cache_entry.timestamp == 1234567890.0
        assert cache_entry.result == {'functions': ['func1']}
        assert cache_entry.analyzer_version == "1.0"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
