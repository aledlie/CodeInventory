#!/usr/bin/env python3
"""
Unit tests for src/cache/analysis_cache.py

Tests the AnalysisCache and CheckpointManager classes for incremental
analysis support and resume capability.
"""

import pytest
import sys
import subprocess
import tempfile
import shutil
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.cache.analysis_cache import AnalysisCache, CheckpointManager


class TestAnalysisCacheInitialization:
    """Test AnalysisCache initialization and loading"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_initialization_creates_fresh_cache(self, temp_dir):
        """Test that initialization creates a fresh cache when no cache exists"""
        cache = AnalysisCache(temp_dir)

        assert cache.root_dir == temp_dir
        assert cache.cache_file == temp_dir / '.analysis-cache.json'
        assert cache.cache_data['last_run'] is None
        assert cache.cache_data['last_commit'] is None
        assert cache.cache_data['analyzed_files'] == {}

    def test_initialization_with_custom_cache_file(self, temp_dir):
        """Test initialization with custom cache file path"""
        custom_cache = temp_dir / 'custom-cache.json'
        cache = AnalysisCache(temp_dir, cache_file=custom_cache)

        assert cache.cache_file == custom_cache

    def test_initialization_loads_existing_cache(self, temp_dir):
        """Test that initialization loads existing cache data"""
        cache_file = temp_dir / '.analysis-cache.json'
        cache_data = {
            'last_run': '2025-01-01T12:00:00',
            'last_commit': 'abc123',
            'root_dir': str(temp_dir),
            'analyzed_files': {
                'test.py': {
                    'hash': 'sha256:testHash',
                    'last_modified': '2025-01-01T10:00:00',
                    'analysis_results': {'issues': []}
                }
            },
            'metadata': {
                'total_files': 1,
                'cache_hits': 5,
                'cache_misses': 2
            }
        }
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)

        cache = AnalysisCache(temp_dir)

        assert cache.cache_data['last_run'] == '2025-01-01T12:00:00'
        assert cache.cache_data['last_commit'] == 'abc123'
        assert 'test.py' in cache.cache_data['analyzed_files']

    def test_initialization_handles_corrupted_cache(self, temp_dir):
        """Test that corrupted cache file is handled gracefully"""
        cache_file = temp_dir / '.analysis-cache.json'
        with open(cache_file, 'w') as f:
            f.write("{ invalid json }")

        cache = AnalysisCache(temp_dir)

        # Should create fresh cache
        assert cache.cache_data['last_run'] is None
        assert cache.cache_data['analyzed_files'] == {}


class TestAnalysisCacheSaveAndLoad:
    """Test AnalysisCache save and load operations"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    @patch('src.cache.analysis_cache.AnalysisCache._get_current_commit')
    def test_save_cache_creates_file(self, mock_commit, temp_dir):
        """Test that save_cache creates the cache file"""
        mock_commit.return_value = 'abc123'
        cache = AnalysisCache(temp_dir)
        cache.update_file_cache(temp_dir / 'test.py', {'issues': []})

        # Create a test file to hash
        test_file = temp_dir / 'test.py'
        test_file.write_text('print("hello")')

        cache.save_cache()

        assert cache.cache_file.exists()

    @patch('src.cache.analysis_cache.AnalysisCache._get_current_commit')
    def test_save_cache_updates_last_run(self, mock_commit, temp_dir):
        """Test that save_cache updates the last_run timestamp"""
        mock_commit.return_value = 'abc123'
        cache = AnalysisCache(temp_dir)

        before = datetime.now().isoformat()
        cache.save_cache()
        after = datetime.now().isoformat()

        assert cache.cache_data['last_run'] >= before
        assert cache.cache_data['last_run'] <= after

    @patch('src.cache.analysis_cache.AnalysisCache._get_current_commit')
    def test_save_and_reload_preserves_data(self, mock_commit, temp_dir):
        """Test that saving and reloading preserves cache data"""
        mock_commit.return_value = 'abc123'

        # Create test file
        test_file = temp_dir / 'test.py'
        test_file.write_text('def foo(): pass')

        # Create cache and add data
        cache1 = AnalysisCache(temp_dir)
        cache1.update_file_cache(test_file, {'issues': [{'line': 1}]})
        cache1.save_cache()

        # Reload in new instance
        cache2 = AnalysisCache(temp_dir)

        assert 'test.py' in cache2.cache_data['analyzed_files']
        assert cache2.cache_data['analyzed_files']['test.py']['analysis_results'] == {'issues': [{'line': 1}]}


class TestAnalysisCacheFileHash:
    """Test AnalysisCache file hash calculation"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_calculate_file_hash_consistent(self, temp_dir):
        """Test that file hash is consistent for same content"""
        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('content')

        hash1 = cache._calculate_file_hash(test_file)
        hash2 = cache._calculate_file_hash(test_file)

        assert hash1 == hash2

    def test_calculate_file_hash_different_for_different_content(self, temp_dir):
        """Test that different content produces different hashes"""
        cache = AnalysisCache(temp_dir)

        file1 = temp_dir / 'file1.py'
        file1.write_text('content1')

        file2 = temp_dir / 'file2.py'
        file2.write_text('content2')

        hash1 = cache._calculate_file_hash(file1)
        hash2 = cache._calculate_file_hash(file2)

        assert hash1 != hash2

    def test_calculate_file_hash_handles_missing_file(self, temp_dir):
        """Test that missing file returns empty string"""
        cache = AnalysisCache(temp_dir)
        missing_file = temp_dir / 'nonexistent.py'

        result = cache._calculate_file_hash(missing_file)

        assert result == ''


class TestAnalysisCacheFileOperations:
    """Test AnalysisCache file caching operations"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_is_file_cached_returns_false_for_uncached(self, temp_dir):
        """Test is_file_cached returns False for uncached files"""
        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('content')

        result = cache.is_file_cached(test_file)

        assert result is False
        assert cache.cache_data['metadata']['cache_misses'] == 1

    def test_is_file_cached_returns_true_for_cached_unchanged(self, temp_dir):
        """Test is_file_cached returns True for cached unchanged files"""
        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('content')

        # Cache the file
        cache.update_file_cache(test_file, {'issues': []})

        result = cache.is_file_cached(test_file)

        assert result is True
        assert cache.cache_data['metadata']['cache_hits'] == 1

    def test_is_file_cached_returns_false_for_changed_file(self, temp_dir):
        """Test is_file_cached returns False when file content changed"""
        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('original content')

        # Cache the file
        cache.update_file_cache(test_file, {'issues': []})

        # Modify the file
        test_file.write_text('modified content')

        result = cache.is_file_cached(test_file)

        assert result is False

    def test_update_file_cache_stores_data(self, temp_dir):
        """Test update_file_cache stores analysis results"""
        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('content')

        analysis_results = {'issues': [{'line': 1, 'message': 'test'}]}
        cache.update_file_cache(test_file, analysis_results)

        assert 'test.py' in cache.cache_data['analyzed_files']
        entry = cache.cache_data['analyzed_files']['test.py']
        assert entry['analysis_results'] == analysis_results
        assert 'hash' in entry
        assert 'last_modified' in entry

    def test_update_file_cache_updates_total_files(self, temp_dir):
        """Test update_file_cache updates total_files metadata"""
        cache = AnalysisCache(temp_dir)

        for i in range(3):
            test_file = temp_dir / f'test{i}.py'
            test_file.write_text(f'content{i}')
            cache.update_file_cache(test_file, {'issues': []})

        assert cache.cache_data['metadata']['total_files'] == 3

    def test_get_cached_result_returns_cached_data(self, temp_dir):
        """Test get_cached_result returns cached analysis results"""
        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('content')

        analysis_results = {'issues': [{'line': 5}]}
        cache.update_file_cache(test_file, analysis_results)

        result = cache.get_cached_result(test_file)

        assert result == analysis_results

    def test_get_cached_result_returns_none_for_uncached(self, temp_dir):
        """Test get_cached_result returns None for uncached files"""
        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('content')

        result = cache.get_cached_result(test_file)

        assert result is None


class TestAnalysisCacheGitOperations:
    """Test AnalysisCache git-related operations"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    @patch('subprocess.run')
    def test_get_current_commit_success(self, mock_run, temp_dir):
        """Test _get_current_commit returns commit hash on success"""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='abc123def456\n'
        )

        cache = AnalysisCache(temp_dir)
        result = cache._get_current_commit()

        assert result == 'abc123def456'
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_get_current_commit_not_git_repo(self, mock_run, temp_dir):
        """Test _get_current_commit returns None for non-git directory"""
        mock_run.return_value = MagicMock(
            returncode=128,
            stdout=''
        )

        cache = AnalysisCache(temp_dir)
        result = cache._get_current_commit()

        assert result is None

    @patch('subprocess.run')
    def test_get_changed_files_since_commit(self, mock_run, temp_dir):
        """Test get_changed_files_since_commit returns changed files"""
        # Create test files
        file1 = temp_dir / 'file1.py'
        file2 = temp_dir / 'file2.py'
        file1.write_text('content1')
        file2.write_text('content2')

        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='file1.py\nfile2.py\n'
        )

        cache = AnalysisCache(temp_dir)
        result = cache.get_changed_files_since_commit('abc123')

        assert len(result) == 2
        assert file1 in result
        assert file2 in result

    @patch('subprocess.run')
    def test_get_changed_files_since_commit_filters_nonexistent(self, mock_run, temp_dir):
        """Test get_changed_files_since_commit filters non-existent files"""
        file1 = temp_dir / 'exists.py'
        file1.write_text('content')

        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='exists.py\ndeleted.py\n'
        )

        cache = AnalysisCache(temp_dir)
        result = cache.get_changed_files_since_commit('abc123')

        assert len(result) == 1
        assert file1 in result

    @patch('subprocess.run')
    def test_get_changed_files_since_last_run_no_previous(self, mock_run, temp_dir):
        """Test returns None when no previous analysis exists"""
        cache = AnalysisCache(temp_dir)
        result = cache.get_changed_files_since_last_run()

        assert result is None

    @patch('subprocess.run')
    def test_get_changed_files_since_last_run_same_commit(self, mock_run, temp_dir):
        """Test handles same commit scenario (checks working directory)"""
        mock_run.side_effect = [
            MagicMock(returncode=0, stdout='abc123\n'),  # get current commit
            MagicMock(returncode=0, stdout='')  # git diff --name-only (no changes)
        ]

        cache = AnalysisCache(temp_dir)
        cache.cache_data['last_commit'] = 'abc123'

        result = cache.get_changed_files_since_last_run()

        assert result == set()


class TestAnalysisCacheClearAndStats:
    """Test AnalysisCache clear and statistics operations"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    @patch('src.cache.analysis_cache.AnalysisCache._get_current_commit')
    def test_clear_cache_removes_all_data(self, mock_commit, temp_dir):
        """Test clear_cache removes all cached data"""
        mock_commit.return_value = 'abc123'

        cache = AnalysisCache(temp_dir)
        test_file = temp_dir / 'test.py'
        test_file.write_text('content')
        cache.update_file_cache(test_file, {'issues': []})
        cache.save_cache()

        assert cache.cache_file.exists()

        cache.clear_cache()

        assert not cache.cache_file.exists()
        assert cache.cache_data['analyzed_files'] == {}
        assert cache.cache_data['last_run'] is None

    def test_get_cache_stats_empty_cache(self, temp_dir):
        """Test get_cache_stats for empty cache"""
        cache = AnalysisCache(temp_dir)
        stats = cache.get_cache_stats()

        assert stats['total_cached_files'] == 0
        assert stats['cache_hits'] == 0
        assert stats['cache_misses'] == 0
        assert stats['hit_rate_percent'] == 0

    def test_get_cache_stats_with_data(self, temp_dir):
        """Test get_cache_stats with cached data"""
        cache = AnalysisCache(temp_dir)

        # Simulate some cache operations
        for i in range(5):
            test_file = temp_dir / f'file{i}.py'
            test_file.write_text(f'content{i}')
            cache.update_file_cache(test_file, {'issues': []})

        # Simulate hits and misses
        cache.cache_data['metadata']['cache_hits'] = 8
        cache.cache_data['metadata']['cache_misses'] = 2

        stats = cache.get_cache_stats()

        assert stats['total_cached_files'] == 5
        assert stats['cache_hits'] == 8
        assert stats['cache_misses'] == 2
        assert stats['hit_rate_percent'] == 80.0


class TestCheckpointManagerInitialization:
    """Test CheckpointManager initialization"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_initialization_creates_fresh_checkpoint(self, temp_dir):
        """Test that initialization creates fresh checkpoint when none exists"""
        manager = CheckpointManager(temp_dir)

        assert manager.root_dir == temp_dir
        assert manager.checkpoint_file == temp_dir / '.analysis-checkpoint.json'
        assert manager.checkpoint_data['timestamp'] is None
        assert manager.checkpoint_data['completed'] == []
        assert manager.checkpoint_data['in_progress'] is None
        assert manager.checkpoint_data['pending'] == []

    def test_initialization_with_custom_file(self, temp_dir):
        """Test initialization with custom checkpoint file"""
        custom_file = temp_dir / 'custom-checkpoint.json'
        manager = CheckpointManager(temp_dir, checkpoint_file=custom_file)

        assert manager.checkpoint_file == custom_file

    def test_initialization_loads_existing_checkpoint(self, temp_dir):
        """Test that initialization loads existing checkpoint"""
        checkpoint_file = temp_dir / '.analysis-checkpoint.json'
        checkpoint_data = {
            'timestamp': '2025-01-01T12:00:00',
            'root_dir': str(temp_dir),
            'completed': ['step1', 'step2'],
            'in_progress': 'step3',
            'pending': ['step4', 'step5'],
            'results': {
                'step1': {'success': True},
                'step2': {'success': True}
            },
            'metadata': {
                'total_steps': 5,
                'completed_steps': 2
            }
        }
        with open(checkpoint_file, 'w') as f:
            json.dump(checkpoint_data, f)

        manager = CheckpointManager(temp_dir)

        assert manager.checkpoint_data['completed'] == ['step1', 'step2']
        assert manager.checkpoint_data['in_progress'] == 'step3'
        assert len(manager.checkpoint_data['results']) == 2


class TestCheckpointManagerStepManagement:
    """Test CheckpointManager step management"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_initialize_steps_sets_pending(self, temp_dir):
        """Test initialize_steps sets up pending steps"""
        manager = CheckpointManager(temp_dir)
        steps = ['step1', 'step2', 'step3', 'step4']

        manager.initialize_steps(steps)

        assert manager.checkpoint_data['pending'] == steps
        assert manager.checkpoint_data['metadata']['total_steps'] == 4

    def test_initialize_steps_preserves_existing_checkpoint(self, temp_dir):
        """Test initialize_steps preserves existing checkpoint on resume"""
        manager = CheckpointManager(temp_dir)
        manager.checkpoint_data['completed'] = ['step1']
        manager.checkpoint_data['pending'] = ['step2', 'step3']
        manager.checkpoint_data['metadata']['total_steps'] = 3
        manager.save_checkpoint()

        # Reload and initialize
        manager2 = CheckpointManager(temp_dir)
        manager2.initialize_steps(['step1', 'step2', 'step3'])

        # Should preserve existing state
        assert manager2.checkpoint_data['completed'] == ['step1']

    def test_mark_step_in_progress(self, temp_dir):
        """Test mark_step_in_progress updates state correctly"""
        manager = CheckpointManager(temp_dir)
        manager.initialize_steps(['step1', 'step2', 'step3'])

        manager.mark_step_in_progress('step1')

        assert manager.checkpoint_data['in_progress'] == 'step1'
        assert 'step1' not in manager.checkpoint_data['pending']

    def test_mark_step_completed(self, temp_dir):
        """Test mark_step_completed updates state correctly"""
        manager = CheckpointManager(temp_dir)
        manager.initialize_steps(['step1', 'step2'])
        manager.mark_step_in_progress('step1')

        result = {'success': True, 'data': 'test'}
        manager.mark_step_completed('step1', result)

        assert 'step1' in manager.checkpoint_data['completed']
        assert manager.checkpoint_data['in_progress'] is None
        assert manager.checkpoint_data['results']['step1'] == result

    def test_is_step_completed(self, temp_dir):
        """Test is_step_completed returns correct status"""
        manager = CheckpointManager(temp_dir)
        manager.checkpoint_data['completed'] = ['step1', 'step2']

        assert manager.is_step_completed('step1') is True
        assert manager.is_step_completed('step2') is True
        assert manager.is_step_completed('step3') is False

    def test_get_pending_steps(self, temp_dir):
        """Test get_pending_steps returns copy of pending list"""
        manager = CheckpointManager(temp_dir)
        manager.checkpoint_data['pending'] = ['step1', 'step2']

        pending = manager.get_pending_steps()

        assert pending == ['step1', 'step2']
        # Should be a copy
        pending.append('step3')
        assert 'step3' not in manager.checkpoint_data['pending']

    def test_get_completed_steps(self, temp_dir):
        """Test get_completed_steps returns copy of completed list"""
        manager = CheckpointManager(temp_dir)
        manager.checkpoint_data['completed'] = ['step1', 'step2']

        completed = manager.get_completed_steps()

        assert completed == ['step1', 'step2']

    def test_get_step_result(self, temp_dir):
        """Test get_step_result returns correct result"""
        manager = CheckpointManager(temp_dir)
        manager.checkpoint_data['results'] = {
            'step1': {'success': True, 'data': 'test1'},
            'step2': {'success': False, 'error': 'failed'}
        }

        assert manager.get_step_result('step1') == {'success': True, 'data': 'test1'}
        assert manager.get_step_result('step2') == {'success': False, 'error': 'failed'}
        assert manager.get_step_result('step3') is None


class TestCheckpointManagerPersistence:
    """Test CheckpointManager save and load operations"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_save_checkpoint_creates_file(self, temp_dir):
        """Test save_checkpoint creates checkpoint file"""
        manager = CheckpointManager(temp_dir)
        manager.initialize_steps(['step1', 'step2'])

        manager.save_checkpoint()

        assert manager.checkpoint_file.exists()

    def test_save_checkpoint_updates_timestamp(self, temp_dir):
        """Test save_checkpoint updates timestamp"""
        manager = CheckpointManager(temp_dir)

        before = datetime.now().isoformat()
        manager.save_checkpoint()
        after = datetime.now().isoformat()

        assert manager.checkpoint_data['timestamp'] >= before
        assert manager.checkpoint_data['timestamp'] <= after

    def test_has_checkpoint_false_when_empty(self, temp_dir):
        """Test has_checkpoint returns False for empty checkpoint"""
        manager = CheckpointManager(temp_dir)

        assert manager.has_checkpoint() is False

    def test_has_checkpoint_true_when_completed_steps(self, temp_dir):
        """Test has_checkpoint returns True when steps are completed"""
        manager = CheckpointManager(temp_dir)
        manager.checkpoint_data['completed'] = ['step1']
        manager.save_checkpoint()

        assert manager.has_checkpoint() is True

    def test_clear_checkpoint_removes_file(self, temp_dir):
        """Test clear_checkpoint removes checkpoint file"""
        manager = CheckpointManager(temp_dir)
        manager.checkpoint_data['completed'] = ['step1']
        manager.save_checkpoint()

        assert manager.checkpoint_file.exists()

        manager.clear_checkpoint()

        assert not manager.checkpoint_file.exists()
        assert manager.checkpoint_data['completed'] == []
        assert manager.checkpoint_data['results'] == {}


class TestCheckpointManagerStatistics:
    """Test CheckpointManager statistics"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_get_checkpoint_stats_empty(self, temp_dir):
        """Test get_checkpoint_stats for empty checkpoint"""
        manager = CheckpointManager(temp_dir)
        stats = manager.get_checkpoint_stats()

        assert stats['has_checkpoint'] is False
        assert stats['total_steps'] == 0
        assert stats['completed_steps'] == 0
        assert stats['pending_steps'] == 0
        assert stats['in_progress'] is None
        assert stats['completion_percent'] == 0

    def test_get_checkpoint_stats_with_progress(self, temp_dir):
        """Test get_checkpoint_stats with progress"""
        manager = CheckpointManager(temp_dir)
        manager.initialize_steps(['step1', 'step2', 'step3', 'step4'])
        manager.mark_step_in_progress('step1')
        manager.mark_step_completed('step1', {'success': True})
        manager.mark_step_in_progress('step2')

        stats = manager.get_checkpoint_stats()

        assert stats['has_checkpoint'] is True
        assert stats['total_steps'] == 4
        assert stats['completed_steps'] == 1
        assert stats['pending_steps'] == 2  # step3, step4
        assert stats['in_progress'] == 'step2'
        assert stats['completion_percent'] == 25.0


class TestCheckpointManagerEdgeCases:
    """Test CheckpointManager edge cases"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_handles_corrupted_checkpoint(self, temp_dir):
        """Test handling of corrupted checkpoint file"""
        checkpoint_file = temp_dir / '.analysis-checkpoint.json'
        with open(checkpoint_file, 'w') as f:
            f.write("{ invalid json }")

        manager = CheckpointManager(temp_dir)

        # Should create fresh checkpoint
        assert manager.checkpoint_data['completed'] == []
        assert manager.checkpoint_data['pending'] == []

    def test_mark_step_completed_prevents_duplicates(self, temp_dir):
        """Test that marking step completed doesn't create duplicates"""
        manager = CheckpointManager(temp_dir)
        manager.initialize_steps(['step1'])

        manager.mark_step_completed('step1', {'success': True})
        manager.mark_step_completed('step1', {'success': True})

        assert manager.checkpoint_data['completed'].count('step1') == 1

    def test_workflow_simulation(self, temp_dir):
        """Test a complete workflow simulation"""
        manager = CheckpointManager(temp_dir)
        steps = ['schema_generation', 'quality_analysis', 'coverage', 'dashboard']

        # Initialize
        manager.initialize_steps(steps)
        assert len(manager.get_pending_steps()) == 4

        # Process step 1
        manager.mark_step_in_progress('schema_generation')
        manager.mark_step_completed('schema_generation', {'files': 10})

        # Process step 2
        manager.mark_step_in_progress('quality_analysis')
        manager.mark_step_completed('quality_analysis', {'issues': 5})

        # Simulate interruption and resume
        manager2 = CheckpointManager(temp_dir)
        assert manager2.is_step_completed('schema_generation')
        assert manager2.is_step_completed('quality_analysis')
        assert not manager2.is_step_completed('coverage')

        # Get result from completed step
        result = manager2.get_step_result('quality_analysis')
        assert result == {'issues': 5}

        stats = manager2.get_checkpoint_stats()
        assert stats['completed_steps'] == 2
        assert stats['completion_percent'] == 50.0


class TestAnalysisCacheSaveErrorHandling:
    """Test AnalysisCache save_cache error handling"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    @patch('builtins.open', side_effect=IOError("Permission denied"))
    @patch('src.cache.analysis_cache.AnalysisCache._get_current_commit')
    @patch('src.cache.analysis_cache.AnalysisCache._load_cache')
    def test_save_cache_handles_io_error(self, mock_load, mock_commit, mock_open, temp_dir):
        """Test that save_cache handles IOError gracefully"""
        mock_commit.return_value = 'abc123'
        mock_load.return_value = {
            'last_run': None,
            'last_commit': None,
            'root_dir': str(temp_dir),
            'analyzed_files': {},
            'metadata': {'total_files': 0, 'cache_hits': 0, 'cache_misses': 0}
        }

        cache = AnalysisCache(temp_dir)
        # Should not raise - errors are logged
        cache.save_cache()


class TestAnalysisCacheGitExceptionHandling:
    """Test AnalysisCache git-related exception handling"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    @patch('subprocess.run')
    def test_get_current_commit_handles_timeout(self, mock_run, temp_dir):
        """Test _get_current_commit handles TimeoutExpired"""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd='git', timeout=5)

        cache = AnalysisCache(temp_dir)
        result = cache._get_current_commit()

        assert result is None

    @patch('subprocess.run')
    def test_get_current_commit_handles_file_not_found(self, mock_run, temp_dir):
        """Test _get_current_commit handles FileNotFoundError (git not installed)"""
        mock_run.side_effect = FileNotFoundError("git not found")

        cache = AnalysisCache(temp_dir)
        result = cache._get_current_commit()

        assert result is None

    @patch('subprocess.run')
    def test_get_changed_files_since_commit_git_diff_failure(self, mock_run, temp_dir):
        """Test get_changed_files_since_commit handles git diff failure"""
        mock_run.return_value = MagicMock(
            returncode=1,
            stderr='fatal: bad revision'
        )

        cache = AnalysisCache(temp_dir)
        result = cache.get_changed_files_since_commit('nonexistent')

        assert result == set()

    @patch('subprocess.run')
    def test_get_changed_files_since_commit_timeout(self, mock_run, temp_dir):
        """Test get_changed_files_since_commit handles TimeoutExpired"""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd='git', timeout=30)

        cache = AnalysisCache(temp_dir)
        result = cache.get_changed_files_since_commit('abc123')

        assert result == set()

    @patch('subprocess.run')
    def test_get_changed_files_since_commit_file_not_found(self, mock_run, temp_dir):
        """Test get_changed_files_since_commit handles FileNotFoundError"""
        mock_run.side_effect = FileNotFoundError("git not found")

        cache = AnalysisCache(temp_dir)
        result = cache.get_changed_files_since_commit('abc123')

        assert result == set()


class TestAnalysisCacheGetChangedFilesEdgeCases:
    """Test AnalysisCache get_changed_files_since_last_run edge cases"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    @patch('subprocess.run')
    def test_get_changed_files_since_last_run_no_git_repo(self, mock_run, temp_dir):
        """Test returns None when current commit cannot be determined"""
        # First call returns last commit, second returns None for current
        mock_run.return_value = MagicMock(
            returncode=128,  # Not a git repo
            stdout=''
        )

        cache = AnalysisCache(temp_dir)
        cache.cache_data['last_commit'] = 'abc123'

        result = cache.get_changed_files_since_last_run()

        assert result is None

    @patch('subprocess.run')
    def test_get_changed_files_since_last_run_with_uncommitted_changes(self, mock_run, temp_dir):
        """Test returns uncommitted changes when at same commit"""
        # Create test files
        file1 = temp_dir / 'modified.py'
        file1.write_text('content')

        mock_run.side_effect = [
            MagicMock(returncode=0, stdout='abc123\n'),  # get current commit
            MagicMock(returncode=0, stdout='modified.py\n')  # git diff --name-only
        ]

        cache = AnalysisCache(temp_dir)
        cache.cache_data['last_commit'] = 'abc123'

        result = cache.get_changed_files_since_last_run()

        assert result is not None
        assert file1 in result

    @patch('subprocess.run')
    def test_get_changed_files_since_last_run_working_dir_check_failure(self, mock_run, temp_dir):
        """Test handles failure when checking working directory changes"""
        mock_run.side_effect = [
            MagicMock(returncode=0, stdout='abc123\n'),  # get current commit
            subprocess.TimeoutExpired(cmd='git', timeout=30)  # git diff fails
        ]

        cache = AnalysisCache(temp_dir)
        cache.cache_data['last_commit'] = 'abc123'

        result = cache.get_changed_files_since_last_run()

        assert result is None

    @patch('subprocess.run')
    def test_get_changed_files_since_last_run_filters_deleted_uncommitted(self, mock_run, temp_dir):
        """Test filters out deleted files from uncommitted changes"""
        # Only create one file (simulating the other was deleted)
        file1 = temp_dir / 'exists.py'
        file1.write_text('content')

        mock_run.side_effect = [
            MagicMock(returncode=0, stdout='abc123\n'),  # get current commit
            MagicMock(returncode=0, stdout='exists.py\ndeleted.py\n')  # git diff
        ]

        cache = AnalysisCache(temp_dir)
        cache.cache_data['last_commit'] = 'abc123'

        result = cache.get_changed_files_since_last_run()

        assert result is not None
        assert len(result) == 1
        assert file1 in result

    @patch('subprocess.run')
    def test_get_changed_files_since_last_run_different_commits(self, mock_run, temp_dir):
        """Test calls get_changed_files_since_commit when commits differ"""
        # Create test file
        file1 = temp_dir / 'changed.py'
        file1.write_text('content')

        mock_run.side_effect = [
            MagicMock(returncode=0, stdout='def456\n'),  # get current commit (different)
            MagicMock(returncode=0, stdout='changed.py\n')  # git diff between commits
        ]

        cache = AnalysisCache(temp_dir)
        cache.cache_data['last_commit'] = 'abc123'  # Previous commit

        result = cache.get_changed_files_since_last_run()

        assert result is not None
        assert file1 in result


class TestCheckpointManagerSaveErrorHandling:
    """Test CheckpointManager save_checkpoint error handling"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir, ignore_errors=True)

    @patch('builtins.open', side_effect=IOError("Permission denied"))
    @patch('src.cache.analysis_cache.CheckpointManager._load_checkpoint')
    def test_save_checkpoint_handles_io_error(self, mock_load, mock_open, temp_dir):
        """Test that save_checkpoint handles IOError gracefully"""
        mock_load.return_value = {
            'timestamp': None,
            'root_dir': str(temp_dir),
            'completed': [],
            'in_progress': None,
            'pending': [],
            'results': {},
            'metadata': {'total_steps': 0, 'completed_steps': 0}
        }

        manager = CheckpointManager(temp_dir)
        # Should not raise - errors are logged
        manager.save_checkpoint()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
