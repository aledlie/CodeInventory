"""
Analysis Cache and Checkpoint Management

Provides incremental analysis support and resume capability for long-running analyses.

Features:
- Git-aware change detection
- File-based caching with hash validation
- Checkpoint management for interrupted analyses
- Merge results from previous runs
"""

import json
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Set, Any
import logging

logger = logging.getLogger(__name__)


class AnalysisCache:
    """
    Manages incremental analysis caching using git for change detection

    Cache Structure:
    {
        "last_run": "2025-11-23T01:00:00Z",
        "last_commit": "abc123def456",
        "root_dir": "/path/to/code",
        "analyzed_files": {
            "path/to/file.py": {
                "hash": "sha256:...",
                "last_modified": "2025-11-22T10:30:00Z",
                "issues_count": 12,
                "analysis_results": {...}
            }
        },
        "metadata": {
            "total_files": 150,
            "cache_hits": 120,
            "cache_misses": 30
        }
    }
    """
    def __init__(self, root_dir: Path, cache_file: Optional[Path] = None):
        """
        Initialize analysis cache

        Args:
            root_dir: Root directory being analyzed
            cache_file: Path to cache file (default: root_dir/.analysis-cache.json)
        """
        self.root_dir = root_dir
        self.cache_file = cache_file or (root_dir / '.analysis-cache.json')
        self.cache_data = self._load_cache()

    def _load_cache(self) -> Dict[str, Any]:
        """Load cache from disk or create new cache"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    cache: Dict[str, Any] = json.load(f)
                    logger.info(f"✅ Loaded cache from {self.cache_file}")
                    logger.info(f"   Last run: {cache.get('last_run', 'Never')}")
                    logger.info(f"   Cached files: {len(cache.get('analyzed_files', {}))}")
                    return cache
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"⚠️  Failed to load cache: {e}")
                logger.warning("   Starting with fresh cache")

        return {
            'last_run': None,
            'last_commit': None,
            'root_dir': str(self.root_dir),
            'analyzed_files': {},
            'metadata': {
                'total_files': 0,
                'cache_hits': 0,
                'cache_misses': 0
            }
        }

    def save_cache(self) -> None:
        """Save cache to disk"""
        try:
            self.cache_data['last_run'] = datetime.now().isoformat()
            self.cache_data['last_commit'] = self._get_current_commit()

            with open(self.cache_file, 'w') as f:
                json.dump(self.cache_data, f, indent=2)

            logger.info(f"✅ Cache saved to {self.cache_file}")
            logger.info(f"   Total cached files: {len(self.cache_data['analyzed_files'])}")
        except IOError as e:
            logger.error(f"❌ Failed to save cache: {e}")

    def _get_current_commit(self) -> Optional[str]:
        """Get current git commit hash"""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=self.root_dir,
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return None

    def get_changed_files_since_commit(self, commit: str) -> Set[Path]:
        """
        Get files changed since a specific commit

        Args:
            commit: Git commit hash or reference (e.g., 'HEAD~5', 'abc123')

        Returns:
            Set of absolute file paths that changed
        """
        try:
            # Get list of changed files
            result = subprocess.run(
                ['git', 'diff', '--name-only', commit, 'HEAD'],
                cwd=self.root_dir,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode != 0:
                logger.warning(f"⚠️  Git diff failed: {result.stderr}")
                return set()

            changed_files = set()
            for line in result.stdout.strip().split('\n'):
                if line:
                    file_path = self.root_dir / line.strip()
                    if file_path.exists() and file_path.is_file():
                        changed_files.add(file_path)

            logger.info(f"📊 Found {len(changed_files)} changed files since {commit}")
            return changed_files

        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            logger.error(f"❌ Failed to get changed files: {e}")
            return set()

    def get_changed_files_since_last_run(self) -> Optional[Set[Path]]:
        """
        Get files changed since last analysis run

        Returns:
            Set of changed file paths, or None if incremental analysis not possible
        """
        last_commit = self.cache_data.get('last_commit')
        if not last_commit:
            logger.info("📊 No previous analysis commit found - full analysis required")
            return None

        current_commit = self._get_current_commit()
        if not current_commit:
            logger.warning("⚠️  Not a git repository - incremental analysis not available")
            return None

        if last_commit == current_commit:
            logger.info("📊 No commits since last analysis - checking working directory")
            # Check for uncommitted changes
            try:
                result = subprocess.run(
                    ['git', 'diff', '--name-only'],
                    cwd=self.root_dir,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0 and result.stdout.strip():
                    changed_files = set()
                    for line in result.stdout.strip().split('\n'):
                        if line:
                            file_path = self.root_dir / line.strip()
                            if file_path.exists() and file_path.is_file():
                                changed_files.add(file_path)
                    logger.info(f"📊 Found {len(changed_files)} uncommitted changes")
                    return changed_files
                else:
                    logger.info("✅ No changes detected - analysis up to date")
                    return set()
            except (subprocess.TimeoutExpired, FileNotFoundError):
                logger.warning("⚠️  Failed to check working directory changes")
                return None

        return self.get_changed_files_since_commit(last_commit)

    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()
        except IOError as e:
            logger.warning(f"⚠️  Failed to hash {file_path}: {e}")
            return ''

    def is_file_cached(self, file_path: Path) -> bool:
        """
        Check if file is in cache and hasn't changed

        Args:
            file_path: File to check

        Returns:
            True if file is cached and unchanged
        """
        file_key = str(file_path.relative_to(self.root_dir))
        cached_entry = self.cache_data['analyzed_files'].get(file_key)

        if not cached_entry:
            self.cache_data['metadata']['cache_misses'] += 1
            return False

        # Verify file hasn't changed
        current_hash = self._calculate_file_hash(file_path)
        if current_hash != cached_entry.get('hash', ''):
            logger.debug(f"Cache miss (hash mismatch): {file_path.name}")
            self.cache_data['metadata']['cache_misses'] += 1
            return False

        self.cache_data['metadata']['cache_hits'] += 1
        return True

    def get_cached_result(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """
        Get cached analysis result for a file

        Args:
            file_path: File to retrieve

        Returns:
            Cached analysis results or None if not cached
        """
        file_key = str(file_path.relative_to(self.root_dir))
        cached_entry = self.cache_data['analyzed_files'].get(file_key)

        if cached_entry and self.is_file_cached(file_path):
            result: Optional[Dict[str, Any]] = cached_entry.get('analysis_results')
            return result

        return None

    def update_file_cache(self, file_path: Path, analysis_results: Dict[str, Any]) -> None:
        """
        Update cache with new analysis results

        Args:
            file_path: File that was analyzed
            analysis_results: Results to cache
        """
        file_key = str(file_path.relative_to(self.root_dir))

        self.cache_data['analyzed_files'][file_key] = {
            'hash': self._calculate_file_hash(file_path),
            'last_modified': datetime.now().isoformat(),
            'analysis_results': analysis_results
        }

        self.cache_data['metadata']['total_files'] = len(self.cache_data['analyzed_files'])

    def clear_cache(self) -> None:
        """Clear all cached data"""
        logger.info("🗑️  Clearing analysis cache...")
        self.cache_data = {
            'last_run': None,
            'last_commit': None,
            'root_dir': str(self.root_dir),
            'analyzed_files': {},
            'metadata': {
                'total_files': 0,
                'cache_hits': 0,
                'cache_misses': 0
            }
        }
        if self.cache_file.exists():
            self.cache_file.unlink()
        logger.info("✅ Cache cleared")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        metadata = self.cache_data['metadata']
        total_requests = metadata['cache_hits'] + metadata['cache_misses']
        hit_rate = (metadata['cache_hits'] / total_requests * 100) if total_requests > 0 else 0

        return {
            'total_cached_files': len(self.cache_data['analyzed_files']),
            'cache_hits': metadata['cache_hits'],
            'cache_misses': metadata['cache_misses'],
            'hit_rate_percent': round(hit_rate, 1),
            'last_run': self.cache_data.get('last_run'),
            'last_commit': self.cache_data.get('last_commit')
        }


class CheckpointManager:
    """
    Manages analysis checkpoints for resume capability

    Checkpoint Structure:
    {
        "timestamp": "2025-11-23T01:00:00Z",
        "root_dir": "/path/to/code",
        "completed": ["schema_generation", "quality_analysis"],
        "in_progress": "coverage_analysis",
        "pending": ["dependency_analysis", "dashboard", "rss", "validation"],
        "results": {
            "schema_generation": {"success": true, ...},
            "quality_analysis": {"success": true, ...}
        },
        "metadata": {
            "total_steps": 7,
            "completed_steps": 2
        }
    }
    """
    def __init__(self, root_dir: Path, checkpoint_file: Optional[Path] = None):
        """
        Initialize checkpoint manager

        Args:
            root_dir: Root directory being analyzed
            checkpoint_file: Path to checkpoint file (default: root_dir/.analysis-checkpoint.json)
        """
        self.root_dir = root_dir
        self.checkpoint_file = checkpoint_file or (root_dir / '.analysis-checkpoint.json')
        self.checkpoint_data = self._load_checkpoint()

    def _load_checkpoint(self) -> Dict[str, Any]:
        """Load checkpoint from disk or create new checkpoint"""
        if self.checkpoint_file.exists():
            try:
                with open(self.checkpoint_file, 'r') as f:
                    checkpoint: Dict[str, Any] = json.load(f)
                    logger.info(f"✅ Found existing checkpoint from {checkpoint.get('timestamp')}")
                    logger.info(f"   Completed: {len(checkpoint.get('completed', []))}/{checkpoint['metadata']['total_steps']} steps")
                    return checkpoint
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"⚠️  Failed to load checkpoint: {e}")

        return {
            'timestamp': None,
            'root_dir': str(self.root_dir),
            'completed': [],
            'in_progress': None,
            'pending': [],
            'results': {},
            'metadata': {
                'total_steps': 0,
                'completed_steps': 0
            }
        }

    def save_checkpoint(self) -> None:
        """Save checkpoint to disk"""
        try:
            self.checkpoint_data['timestamp'] = datetime.now().isoformat()
            self.checkpoint_data['metadata']['completed_steps'] = len(self.checkpoint_data['completed'])

            with open(self.checkpoint_file, 'w') as f:
                json.dump(self.checkpoint_data, f, indent=2)

            completed = len(self.checkpoint_data['completed'])
            total = self.checkpoint_data['metadata']['total_steps']
            logger.debug(f"💾 Checkpoint saved ({completed}/{total} complete)")
        except IOError as e:
            logger.error(f"❌ Failed to save checkpoint: {e}")

    def initialize_steps(self, all_steps: List[str]) -> None:
        """
        Initialize checkpoint with list of all analysis steps

        Args:
            all_steps: List of analysis step names
        """
        if not self.has_checkpoint():
            self.checkpoint_data['pending'] = all_steps.copy()
            self.checkpoint_data['metadata']['total_steps'] = len(all_steps)
            logger.info(f"🔄 Initialized checkpoint with {len(all_steps)} steps")
        else:
            # Resuming - keep existing state
            logger.info(f"🔄 Resuming from checkpoint...")

    def mark_step_in_progress(self, step_name: str) -> None:
        """
        Mark a step as currently in progress

        Args:
            step_name: Name of the step
        """
        self.checkpoint_data['in_progress'] = step_name
        if step_name in self.checkpoint_data['pending']:
            self.checkpoint_data['pending'].remove(step_name)
        self.save_checkpoint()
        logger.info(f"🔄 Started: {step_name}")

    def mark_step_completed(self, step_name: str, result: Dict[str, Any]) -> None:
        """
        Mark a step as completed

        Args:
            step_name: Name of the step
            result: Analysis result to store
        """
        if step_name not in self.checkpoint_data['completed']:
            self.checkpoint_data['completed'].append(step_name)

        self.checkpoint_data['results'][step_name] = result
        self.checkpoint_data['in_progress'] = None

        self.save_checkpoint()

        completed = len(self.checkpoint_data['completed'])
        total = self.checkpoint_data['metadata']['total_steps']
        logger.info(f"✅ Completed: {step_name} ({completed}/{total})")

    def is_step_completed(self, step_name: str) -> bool:
        """
        Check if a step has been completed

        Args:
            step_name: Name of the step

        Returns:
            True if step is completed
        """
        return step_name in self.checkpoint_data['completed']

    def get_pending_steps(self) -> List[str]:
        """Get list of pending steps"""
        pending: List[str] = self.checkpoint_data['pending']
        return pending.copy()

    def get_completed_steps(self) -> List[str]:
        """Get list of completed steps"""
        completed: List[str] = self.checkpoint_data['completed']
        return completed.copy()

    def get_step_result(self, step_name: str) -> Optional[Dict[str, Any]]:
        """
        Get result for a completed step

        Args:
            step_name: Name of the step

        Returns:
            Step result or None if not completed
        """
        result: Optional[Dict[str, Any]] = self.checkpoint_data['results'].get(step_name)
        return result

    def has_checkpoint(self) -> bool:
        """Check if a valid checkpoint exists"""
        return (
            self.checkpoint_file.exists() and
            len(self.checkpoint_data.get('completed', [])) > 0
        )

    def clear_checkpoint(self) -> None:
        """Clear checkpoint after successful completion"""
        logger.info("🗑️  Clearing checkpoint...")
        if self.checkpoint_file.exists():
            self.checkpoint_file.unlink()

        self.checkpoint_data = {
            'timestamp': None,
            'root_dir': str(self.root_dir),
            'completed': [],
            'in_progress': None,
            'pending': [],
            'results': {},
            'metadata': {
                'total_steps': 0,
                'completed_steps': 0
            }
        }
        logger.info("✅ Checkpoint cleared")

    def get_checkpoint_stats(self) -> Dict[str, Any]:
        """Get checkpoint statistics"""
        return {
            'has_checkpoint': self.has_checkpoint(),
            'total_steps': self.checkpoint_data['metadata']['total_steps'],
            'completed_steps': len(self.checkpoint_data['completed']),
            'pending_steps': len(self.checkpoint_data['pending']),
            'in_progress': self.checkpoint_data.get('in_progress'),
            'completion_percent': round(
                len(self.checkpoint_data['completed']) /
                max(self.checkpoint_data['metadata']['total_steps'], 1) * 100,
                1
            )
        }
