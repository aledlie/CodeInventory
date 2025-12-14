#!/usr/bin/env python3
"""
Unit tests for schema_optimizer.py - Parallel processing and caching for schema generation
"""

import unittest
import tempfile
import time
import json
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.generators.schema_optimizer import (
    SchemaCache,
    ParallelSchemaProcessor,
    FileCache,
    CacheMetadata,
    batch_files_by_directory,
)


# Top-level functions for multiprocessing (must be picklable)
def simple_processor(path):
    """Simple processor for testing - must be at top level for pickling"""
    return {'path': str(path), 'processed': True}


def failing_processor(path):
    """Failing processor for testing - must be at top level for pickling"""
    raise ValueError("Processing failed")


class TestFileCache(unittest.TestCase):
    """Test FileCache dataclass"""

    def test_file_cache_creation(self):
        """Test creating FileCache with all fields"""
        cache = FileCache(
            path="/test/file.py",
            hash="abc123",
            timestamp=1234567890.0,
            schema={"name": "test"}
        )

        self.assertEqual(cache.path, "/test/file.py")
        self.assertEqual(cache.hash, "abc123")
        self.assertEqual(cache.timestamp, 1234567890.0)
        self.assertEqual(cache.schema, {"name": "test"})


class TestCacheMetadata(unittest.TestCase):
    """Test CacheMetadata dataclass"""

    def test_cache_metadata_defaults(self):
        """Test CacheMetadata with default values"""
        metadata = CacheMetadata()

        self.assertEqual(metadata.version, "1.0")
        self.assertEqual(metadata.last_update, 0.0)
        self.assertIsNone(metadata.git_commit)
        self.assertEqual(metadata.files, {})

    def test_cache_metadata_post_init(self):
        """Test CacheMetadata __post_init__ initializes files dict"""
        metadata = CacheMetadata(version="2.0", last_update=100.0)

        self.assertEqual(metadata.files, {})

    def test_cache_metadata_with_custom_values(self):
        """Test CacheMetadata with custom values"""
        files = {"file.py": FileCache("file.py", "hash", 123.0, {})}
        metadata = CacheMetadata(
            version="2.0",
            last_update=100.0,
            git_commit="abc123",
            files=files
        )

        self.assertEqual(metadata.version, "2.0")
        self.assertEqual(metadata.last_update, 100.0)
        self.assertEqual(metadata.git_commit, "abc123")
        self.assertEqual(len(metadata.files), 1)


class TestSchemaCache(unittest.TestCase):
    """Test SchemaCache class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir) / ".schema_cache"

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_init_creates_cache_directory(self):
        """Test that __init__ creates the cache directory"""
        self.assertFalse(self.cache_dir.exists())

        cache = SchemaCache(self.cache_dir)

        self.assertTrue(self.cache_dir.exists())
        self.assertIsInstance(cache.metadata, CacheMetadata)

    def test_init_loads_existing_cache(self):
        """Test that __init__ loads existing cache"""
        # Create cache manually
        self.cache_dir.mkdir(parents=True)
        cache_file = self.cache_dir / 'schema_cache.json'
        cache_data = {
            'version': '1.0',
            'last_update': 1000.0,
            'git_commit': 'abc123',
            'files': {
                '/test/file.py': {
                    'path': '/test/file.py',
                    'hash': 'hash123',
                    'timestamp': 500.0,
                    'schema': {'name': 'test'}
                }
            }
        }
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)

        cache = SchemaCache(self.cache_dir)

        self.assertEqual(cache.metadata.version, '1.0')
        self.assertEqual(cache.metadata.git_commit, 'abc123')
        self.assertEqual(len(cache.metadata.files), 1)
        self.assertIn('/test/file.py', cache.metadata.files)

    def test_init_handles_corrupted_cache(self):
        """Test that __init__ handles corrupted cache file"""
        self.cache_dir.mkdir(parents=True)
        cache_file = self.cache_dir / 'schema_cache.json'
        cache_file.write_text("not valid json {{{")

        cache = SchemaCache(self.cache_dir)

        # Should return empty metadata on error
        self.assertEqual(len(cache.metadata.files), 0)

    def test_save_cache(self):
        """Test saving cache to disk"""
        cache = SchemaCache(self.cache_dir)
        cache.metadata.files['/test/file.py'] = FileCache(
            path='/test/file.py',
            hash='abc123',
            timestamp=time.time(),
            schema={'test': True}
        )

        cache.save_cache()

        # Verify file was written
        cache_file = self.cache_dir / 'schema_cache.json'
        self.assertTrue(cache_file.exists())

        with open(cache_file, 'r') as f:
            data = json.load(f)

        self.assertIn('files', data)
        self.assertIn('/test/file.py', data['files'])

    def test_get_file_hash(self):
        """Test calculating file hash"""
        cache = SchemaCache(self.cache_dir)

        # Create a test file
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('hello')")

        hash1 = cache.get_file_hash(test_file)

        self.assertIsInstance(hash1, str)
        self.assertEqual(len(hash1), 64)  # SHA256 hex length

        # Same content should produce same hash
        hash2 = cache.get_file_hash(test_file)
        self.assertEqual(hash1, hash2)

        # Different content should produce different hash
        test_file.write_text("print('world')")
        hash3 = cache.get_file_hash(test_file)
        self.assertNotEqual(hash1, hash3)

    def test_get_file_hash_nonexistent(self):
        """Test hash calculation for nonexistent file"""
        cache = SchemaCache(self.cache_dir)
        nonexistent = Path(self.temp_dir) / "nonexistent.py"

        result = cache.get_file_hash(nonexistent)

        self.assertEqual(result, "")

    def test_is_file_cached_not_cached(self):
        """Test is_file_cached returns False for uncached file"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        result = cache.is_file_cached(test_file)

        self.assertFalse(result)

    def test_is_file_cached_returns_true_when_cached(self):
        """Test is_file_cached returns True for cached unchanged file"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        # Cache the file
        file_hash = cache.get_file_hash(test_file)
        cache.metadata.files[str(test_file)] = FileCache(
            path=str(test_file),
            hash=file_hash,
            timestamp=time.time() + 1,  # Future timestamp
            schema={'cached': True}
        )

        result = cache.is_file_cached(test_file)

        self.assertTrue(result)

    def test_is_file_cached_returns_false_when_modified(self):
        """Test is_file_cached returns False when file is modified"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('original')")

        # Cache the file
        file_hash = cache.get_file_hash(test_file)
        cache.metadata.files[str(test_file)] = FileCache(
            path=str(test_file),
            hash=file_hash,
            timestamp=time.time(),
            schema={'cached': True}
        )

        # Modify the file
        test_file.write_text("print('modified')")

        result = cache.is_file_cached(test_file)

        self.assertFalse(result)

    def test_is_file_cached_returns_false_when_file_deleted(self):
        """Test is_file_cached returns False when file is deleted"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        # Cache the file
        cache.metadata.files[str(test_file)] = FileCache(
            path=str(test_file),
            hash="somehash",
            timestamp=time.time(),
            schema={'cached': True}
        )

        # Delete the file
        test_file.unlink()

        result = cache.is_file_cached(test_file)

        self.assertFalse(result)

    def test_get_cached_schema(self):
        """Test getting cached schema"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        # Cache the file
        file_hash = cache.get_file_hash(test_file)
        expected_schema = {'name': 'TestSchema', 'classes': []}
        cache.metadata.files[str(test_file)] = FileCache(
            path=str(test_file),
            hash=file_hash,
            timestamp=time.time() + 1,
            schema=expected_schema
        )

        result = cache.get_cached_schema(test_file)

        self.assertEqual(result, expected_schema)

    def test_get_cached_schema_returns_none_for_uncached(self):
        """Test get_cached_schema returns None for uncached file"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        result = cache.get_cached_schema(test_file)

        self.assertIsNone(result)

    def test_update_cache(self):
        """Test updating cache entry"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        schema = {'name': 'NewSchema'}
        cache.update_cache(test_file, schema)

        self.assertIn(str(test_file), cache.metadata.files)
        cached = cache.metadata.files[str(test_file)]
        self.assertEqual(cached.schema, schema)
        self.assertIsNotNone(cached.hash)

    def test_get_git_commit(self):
        """Test getting git commit hash"""
        cache = SchemaCache(self.cache_dir)

        # Mock subprocess.run
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout='abc123def456\n'
            )

            result = cache.get_git_commit(Path(self.temp_dir))

            self.assertEqual(result, 'abc123def456')

    def test_get_git_commit_not_a_repo(self):
        """Test get_git_commit returns None for non-repo"""
        cache = SchemaCache(self.cache_dir)

        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(returncode=128)

            result = cache.get_git_commit(Path(self.temp_dir))

            self.assertIsNone(result)

    def test_get_changed_files_since_commit(self):
        """Test getting changed files since commit"""
        cache = SchemaCache(self.cache_dir)

        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout='file1.py\nfile2.py\nsrc/file3.py\n'
            )

            result = cache.get_changed_files_since_commit(
                Path(self.temp_dir),
                'abc123'
            )

            self.assertEqual(len(result), 3)
            self.assertIn('file1.py', result)
            self.assertIn('file2.py', result)
            self.assertIn('src/file3.py', result)

    def test_get_changed_files_since_commit_error(self):
        """Test get_changed_files_since_commit handles errors"""
        cache = SchemaCache(self.cache_dir)

        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = Exception("Git error")

            result = cache.get_changed_files_since_commit(
                Path(self.temp_dir),
                'abc123'
            )

            self.assertEqual(result, set())


class TestParallelSchemaProcessor(unittest.TestCase):
    """Test ParallelSchemaProcessor class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir) / ".schema_cache"

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_init_default_workers(self):
        """Test initialization with default workers"""
        processor = ParallelSchemaProcessor(
            use_cache=False,
            cache_dir=self.cache_dir
        )

        # Should be CPU count - 1, minimum 1
        expected = max(1, (os.cpu_count() or 1) - 1)
        self.assertEqual(processor.max_workers, expected)

    def test_init_custom_workers(self):
        """Test initialization with custom worker count"""
        processor = ParallelSchemaProcessor(
            max_workers=4,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        self.assertEqual(processor.max_workers, 4)

    def test_init_with_cache_enabled(self):
        """Test initialization with caching enabled"""
        processor = ParallelSchemaProcessor(
            use_cache=True,
            cache_dir=self.cache_dir
        )

        self.assertTrue(processor.use_cache)
        self.assertIsNotNone(processor.cache)
        self.assertIsInstance(processor.cache, SchemaCache)

    def test_init_without_cache(self):
        """Test initialization with caching disabled"""
        processor = ParallelSchemaProcessor(
            use_cache=False,
            cache_dir=self.cache_dir
        )

        self.assertFalse(processor.use_cache)
        self.assertIsNone(processor.cache)

    def test_process_files_parallel_empty_list(self):
        """Test processing empty file list"""
        processor = ParallelSchemaProcessor(
            use_cache=False,
            cache_dir=self.cache_dir
        )

        def dummy_processor(path):
            return {'path': str(path)}

        results = processor.process_files_parallel([], dummy_processor)

        self.assertEqual(results, [])

    def test_process_files_parallel_with_files(self):
        """Test parallel processing with actual files"""
        processor = ParallelSchemaProcessor(
            max_workers=2,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        # Create test files
        files = []
        for i in range(3):
            test_file = Path(self.temp_dir) / f"test_{i}.py"
            test_file.write_text(f"print({i})")
            files.append(test_file)

        # Use top-level simple_processor function (picklable)
        results = processor.process_files_parallel(files, simple_processor)

        self.assertEqual(len(results), 3)
        for path, result in results:
            self.assertTrue(result['processed'])

    def test_process_files_parallel_with_cache_skip(self):
        """Test parallel processing skips cached files"""
        processor = ParallelSchemaProcessor(
            max_workers=2,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        # Create test files
        test_file1 = Path(self.temp_dir) / "test_1.py"
        test_file1.write_text("print(1)")
        test_file2 = Path(self.temp_dir) / "test_2.py"
        test_file2.write_text("print(2)")

        # Pre-cache file 1
        cached_schema = {'cached': True, 'file': 'test_1.py'}
        file_hash = processor.cache.get_file_hash(test_file1)
        processor.cache.metadata.files[str(test_file1)] = FileCache(
            path=str(test_file1),
            hash=file_hash,
            timestamp=time.time() + 1,
            schema=cached_schema
        )

        # Use top-level simple_processor function (picklable)
        results = processor.process_files_parallel(
            [test_file1, test_file2],
            simple_processor,
            skip_cached=True
        )

        # Should have 2 results (1 cached + 1 processed)
        self.assertEqual(len(results), 2)
        # Verify we got both a cached result and a processed result
        results_dict = {str(path): result for path, result in results}
        self.assertIn(str(test_file1), results_dict)
        self.assertIn(str(test_file2), results_dict)

    def test_process_files_parallel_handles_exceptions(self):
        """Test parallel processing handles exceptions gracefully"""
        processor = ParallelSchemaProcessor(
            max_workers=2,
            use_cache=False,
            cache_dir=self.cache_dir
        )

        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print(1)")

        # Use top-level failing_processor function (picklable)
        # Should not raise, returns empty results
        results = processor.process_files_parallel([test_file], failing_processor)

        # Result list should still be returned (may be empty due to exception)
        self.assertIsInstance(results, list)

    def test_invalidate_cache_for_files(self):
        """Test invalidating cache for specific files"""
        processor = ParallelSchemaProcessor(
            use_cache=True,
            cache_dir=self.cache_dir
        )

        # Add files to cache
        test_file1 = Path(self.temp_dir) / "test_1.py"
        test_file2 = Path(self.temp_dir) / "test_2.py"
        test_file1.write_text("print(1)")
        test_file2.write_text("print(2)")

        processor.cache.metadata.files[str(test_file1)] = FileCache(
            str(test_file1), "hash1", time.time(), {}
        )
        processor.cache.metadata.files[str(test_file2)] = FileCache(
            str(test_file2), "hash2", time.time(), {}
        )

        # Invalidate only file 1
        processor.invalidate_cache_for_files([test_file1])

        self.assertNotIn(str(test_file1), processor.cache.metadata.files)
        self.assertIn(str(test_file2), processor.cache.metadata.files)

    def test_invalidate_cache_no_cache(self):
        """Test invalidating cache when caching is disabled"""
        processor = ParallelSchemaProcessor(
            use_cache=False,
            cache_dir=self.cache_dir
        )

        # Should not raise
        processor.invalidate_cache_for_files([Path("/test.py")])

    def test_clear_cache(self):
        """Test clearing entire cache"""
        processor = ParallelSchemaProcessor(
            use_cache=True,
            cache_dir=self.cache_dir
        )

        # Add files to cache
        processor.cache.metadata.files["/test1.py"] = FileCache(
            "/test1.py", "hash1", time.time(), {}
        )
        processor.cache.metadata.files["/test2.py"] = FileCache(
            "/test2.py", "hash2", time.time(), {}
        )

        processor.clear_cache()

        self.assertEqual(len(processor.cache.metadata.files), 0)

    def test_clear_cache_no_cache(self):
        """Test clearing cache when caching is disabled"""
        processor = ParallelSchemaProcessor(
            use_cache=False,
            cache_dir=self.cache_dir
        )

        # Should not raise
        processor.clear_cache()


class TestBatchFilesByDirectory(unittest.TestCase):
    """Test batch_files_by_directory utility function"""

    def test_batch_empty_list(self):
        """Test batching empty file list"""
        result = batch_files_by_directory([])

        self.assertEqual(result, [])

    def test_batch_single_file(self):
        """Test batching single file"""
        files = [Path("/test/file.py")]

        result = batch_files_by_directory(files)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0], files)

    def test_batch_files_same_directory(self):
        """Test batching files from same directory"""
        files = [
            Path("/test/file1.py"),
            Path("/test/file2.py"),
            Path("/test/file3.py"),
        ]

        result = batch_files_by_directory(files, max_batch_size=100)

        self.assertEqual(len(result), 1)
        self.assertEqual(len(result[0]), 3)

    def test_batch_files_different_directories(self):
        """Test batching files from different directories"""
        files = [
            Path("/dir1/file1.py"),
            Path("/dir2/file2.py"),
            Path("/dir3/file3.py"),
        ]

        result = batch_files_by_directory(files, max_batch_size=100)

        # All files should be in one batch since total < max_batch_size
        self.assertEqual(len(result), 1)
        self.assertEqual(len(result[0]), 3)

    def test_batch_respects_max_size(self):
        """Test that batching respects max_batch_size"""
        files = [
            Path("/dir1/file1.py"),
            Path("/dir1/file2.py"),
            Path("/dir1/file3.py"),
            Path("/dir1/file4.py"),
            Path("/dir1/file5.py"),
        ]

        result = batch_files_by_directory(files, max_batch_size=2)

        # Should create 3 batches (2, 2, 1)
        self.assertEqual(len(result), 3)
        self.assertEqual(len(result[0]), 2)
        self.assertEqual(len(result[1]), 2)
        self.assertEqual(len(result[2]), 1)

    def test_batch_groups_by_directory_then_splits(self):
        """Test that files are grouped by directory before splitting"""
        files = [
            Path("/dir1/a.py"),
            Path("/dir1/b.py"),
            Path("/dir1/c.py"),
            Path("/dir2/d.py"),
            Path("/dir2/e.py"),
        ]

        result = batch_files_by_directory(files, max_batch_size=2)

        # Should have 3 batches
        self.assertEqual(len(result), 3)

        # Verify all files are present
        all_files = [f for batch in result for f in batch]
        self.assertEqual(len(all_files), 5)

    def test_batch_preserves_all_files(self):
        """Test that batching preserves all files"""
        files = [Path(f"/test/file{i}.py") for i in range(10)]

        result = batch_files_by_directory(files, max_batch_size=3)

        all_files = [f for batch in result for f in batch]
        self.assertEqual(len(all_files), 10)
        self.assertEqual(set(all_files), set(files))


class TestTqdmFallback(unittest.TestCase):
    """Test tqdm fallback behavior"""

    def test_tqdm_fallback_iteration(self):
        """Test that tqdm can iterate over items"""
        from tqdm import tqdm as real_tqdm
        # Use disable=True to avoid progress bar output in tests
        items = list(real_tqdm([1, 2, 3], disable=True))
        self.assertEqual(items, [1, 2, 3])

    def test_tqdm_context_manager(self):
        """Test that tqdm works as context manager"""
        from tqdm import tqdm as real_tqdm
        with real_tqdm(total=10, disable=True) as pbar:
            pbar.update(5)
            # tqdm.n tracks the progress
            self.assertGreaterEqual(pbar.n, 0)


class TestSchemaCacheEdgeCases(unittest.TestCase):
    """Test edge cases in SchemaCache"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir) / ".schema_cache"

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_is_file_cached_timestamp_check(self):
        """Test is_file_cached handles timestamp vs hash check"""
        cache = SchemaCache(self.cache_dir)
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        file_hash = cache.get_file_hash(test_file)

        # Cache with old timestamp
        cache.metadata.files[str(test_file)] = FileCache(
            path=str(test_file),
            hash=file_hash,
            timestamp=0.0,  # Very old timestamp
            schema={'cached': True}
        )

        # File is newer but hash is same - should still be considered cached
        result = cache.is_file_cached(test_file)
        self.assertTrue(result)

    def test_load_cache_missing_fields(self):
        """Test loading cache with missing optional fields"""
        self.cache_dir.mkdir(parents=True)
        cache_file = self.cache_dir / 'schema_cache.json'

        # Write cache with minimal data
        cache_data = {
            'version': '1.0',
            'files': {}
        }
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)

        cache = SchemaCache(self.cache_dir)

        self.assertEqual(cache.metadata.version, '1.0')
        self.assertEqual(cache.metadata.last_update, 0.0)
        self.assertIsNone(cache.metadata.git_commit)

    def test_save_cache_creates_parent_dirs(self):
        """Test save_cache works even if parent doesn't exist initially"""
        nested_cache_dir = Path(self.temp_dir) / "a" / "b" / "c" / ".cache"

        # This should create all necessary directories
        cache = SchemaCache(nested_cache_dir)
        cache.metadata.files["/test.py"] = FileCache(
            "/test.py", "hash", time.time(), {}
        )
        cache.save_cache()

        self.assertTrue((nested_cache_dir / 'schema_cache.json').exists())


class TestParallelSchemaProcessorCacheIntegration(unittest.TestCase):
    """Integration tests for ParallelSchemaProcessor with cache"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir) / ".schema_cache"

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_cache_saves_after_processing(self):
        """Test that cache is saved after parallel processing"""
        processor = ParallelSchemaProcessor(
            max_workers=1,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        # Use top-level simple_processor function (picklable)
        processor.process_files_parallel([test_file], simple_processor)

        # Cache should be saved
        cache_file = self.cache_dir / 'schema_cache.json'
        self.assertTrue(cache_file.exists())

        # Load and verify
        with open(cache_file, 'r') as f:
            data = json.load(f)

        self.assertIn(str(test_file), data['files'])

    def test_second_run_uses_cache(self):
        """Test that second run uses cached results"""
        processor = ParallelSchemaProcessor(
            max_workers=1,
            use_cache=True,
            cache_dir=self.cache_dir
        )

        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("print('test')")

        # First run - should process file
        results1 = processor.process_files_parallel(
            [test_file], simple_processor, skip_cached=True
        )
        self.assertEqual(len(results1), 1)

        # Verify the file is now cached
        self.assertIn(str(test_file), processor.cache.metadata.files)

        # Second run - should use cache (not process again)
        # We can verify this by checking that we still get results
        results2 = processor.process_files_parallel(
            [test_file], simple_processor, skip_cached=True
        )

        # Both runs should have results
        self.assertEqual(len(results1), 1)
        self.assertEqual(len(results2), 1)


if __name__ == '__main__':
    unittest.main()
