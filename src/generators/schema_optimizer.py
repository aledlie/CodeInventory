#!/usr/bin/env python3
"""
Schema Generation Optimizer - Parallel processing and caching for schema generation

This module provides optimizations for schema generation including:
- Parallel file processing using multiprocessing
- Caching mechanism to avoid re-processing unchanged files
- Git-based change detection
- Performance metrics tracking
"""

import os
import json
import hashlib
import time
import subprocess
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple, Any
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, asdict

# Try to import tqdm for progress bars
try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    TQDM_AVAILABLE = False
    # Fallback: create a dummy tqdm that does nothing
    class tqdm:  # type: ignore[no-redef]
        def __init__(self, iterable: Any = None, *args: Any, **kwargs: Any) -> None:
            self.iterable = iterable
            self.n = 0
            self.total = kwargs.get('total', 0)

        def __iter__(self) -> Any:
            return iter(self.iterable) if self.iterable else iter([])

        def __enter__(self) -> 'tqdm':
            return self

        def __exit__(self, *args: Any) -> None:
            pass

        def update(self, n: int = 1) -> None:
            self.n += n

        def set_description(self, desc: str) -> None:
            pass

# Import centralized logging
try:
    from src.utils.logging_config import get_logger, log_exception, log_performance_metric
    logger = get_logger(__name__)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


@dataclass
class FileCache:
    """Cache entry for a processed file"""
    path: str
    hash: str
    timestamp: float
    schema: Dict[str, Any]


@dataclass
class CacheMetadata:
    """Cache metadata"""
    version: str = "1.0"
    last_update: float = 0.0
    git_commit: Optional[str] = None
    files: Dict[str, FileCache] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.files is None:
            self.files = {}


class SchemaCache:
    """Cache manager for schema generation"""

    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_file = self.cache_dir / 'schema_cache.json'
        self.metadata = self._load_cache()

    def _load_cache(self) -> CacheMetadata:
        """Load cache from disk"""
        if not self.cache_file.exists():
            logger.info("No existing cache found, starting fresh")
            return CacheMetadata()

        try:
            with open(self.cache_file, 'r') as f:
                data = json.load(f)

            # Convert file entries to FileCache objects
            files = {}
            for path, entry in data.get('files', {}).items():
                files[path] = FileCache(**entry)

            metadata = CacheMetadata(
                version=data.get('version', '1.0'),
                last_update=data.get('last_update', 0.0),
                git_commit=data.get('git_commit'),
                files=files
            )

            logger.info(f"✅ Loaded cache with {len(files)} entries")
            logger.info(f"   Last update: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(metadata.last_update))}")

            return metadata

        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'load_cache',
                'cache_file': str(self.cache_file)
            })
            return CacheMetadata()

    def save_cache(self) -> None:
        """Save cache to disk"""
        try:
            # Convert to dict for JSON serialization
            data = {
                'version': self.metadata.version,
                'last_update': time.time(),
                'git_commit': self.metadata.git_commit,
                'files': {
                    path: {
                        'path': entry.path,
                        'hash': entry.hash,
                        'timestamp': entry.timestamp,
                        'schema': entry.schema
                    }
                    for path, entry in self.metadata.files.items()
                }
            }

            with open(self.cache_file, 'w') as f:
                json.dump(data, f, indent=2)

            logger.info(f"✅ Cache saved with {len(self.metadata.files)} entries")

        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'save_cache',
                'cache_file': str(self.cache_file)
            })

    def get_file_hash(self, file_path: Path) -> str:
        """Calculate hash of file contents"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()
        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'calculate_file_hash',
                'file_path': str(file_path)
            })
            return ""

    def is_file_cached(self, file_path: Path) -> bool:
        """Check if file is cached and unchanged"""
        file_str = str(file_path)

        if file_str not in self.metadata.files:
            return False

        cached = self.metadata.files[file_str]

        # Check if file still exists
        if not file_path.exists():
            return False

        # Check if file has been modified
        current_hash = self.get_file_hash(file_path)
        if current_hash != cached.hash:
            return False

        # Check timestamp
        file_mtime = file_path.stat().st_mtime
        if file_mtime > cached.timestamp:
            # File modified, but hash might be same (false positive on timestamp)
            return current_hash == cached.hash

        return True

    def get_cached_schema(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Get cached schema for a file"""
        file_str = str(file_path)
        if self.is_file_cached(file_path):
            return self.metadata.files[file_str].schema
        return None

    def update_cache(self, file_path: Path, schema: Dict[str, Any]) -> None:
        """Update cache entry for a file"""
        file_str = str(file_path)
        self.metadata.files[file_str] = FileCache(
            path=file_str,
            hash=self.get_file_hash(file_path),
            timestamp=time.time(),
            schema=schema
        )

    def get_git_commit(self, repo_path: Path) -> Optional[str]:
        """Get current git commit hash"""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'get_git_commit',
                'repo_path': str(repo_path)
            })
        return None

    def get_changed_files_since_commit(self, repo_path: Path, commit: str) -> Set[str]:
        """Get list of files changed since a commit"""
        try:
            result = subprocess.run(
                ['git', 'diff', '--name-only', commit, 'HEAD'],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                changed = set(line.strip() for line in result.stdout.split('\n') if line.strip())
                logger.info(f"📝 Found {len(changed)} files changed since {commit[:8]}")
                return changed
        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'get_changed_files',
                'repo_path': str(repo_path),
                'commit': commit
            })
        return set()


class ParallelSchemaProcessor:
    """Process files in parallel for schema generation"""

    def __init__(self, max_workers: Optional[int] = None, use_cache: bool = True, cache_dir: Optional[Path] = None):
        """
        Initialize parallel processor

        Args:
            max_workers: Maximum number of worker processes (default: CPU count - 1)
            use_cache: Whether to use caching
            cache_dir: Directory for cache files (default: .schema_cache)
        """
        cpu_count = os.cpu_count() or 1
        self.max_workers = max_workers or max(1, cpu_count - 1)
        self.use_cache = use_cache

        if cache_dir is None:
            cache_dir = Path.cwd() / '.schema_cache'

        self.cache = SchemaCache(cache_dir) if use_cache else None

        logger.info(f"🚀 Parallel processor initialized")
        logger.info(f"   Workers: {self.max_workers}")
        logger.info(f"   Cache enabled: {use_cache}")

    def process_files_parallel(
        self,
        files: List[Path],
        processor_func: Any,
        skip_cached: bool = True
    ) -> List[Tuple[Path, Any]]:
        """
        Process files in parallel

        Args:
            files: List of file paths to process
            processor_func: Function to process each file (must be picklable)
            skip_cached: Whether to skip cached files

        Returns:
            List of (file_path, result) tuples
        """
        start_time = time.time()

        # Filter files if using cache
        files_to_process = []
        cached_results = []

        if self.use_cache and skip_cached and self.cache:
            for file_path in files:
                cached_schema = self.cache.get_cached_schema(file_path)
                if cached_schema:
                    cached_results.append((file_path, cached_schema))
                    logger.debug(f"💾 Using cached schema for {file_path}")
                else:
                    files_to_process.append(file_path)

            logger.info(f"📊 Cache stats:")
            logger.info(f"   Total files: {len(files)}")
            logger.info(f"   Cached: {len(cached_results)}")
            logger.info(f"   To process: {len(files_to_process)}")
        else:
            files_to_process = files

        # Process files in parallel
        results = cached_results.copy()

        if files_to_process:
            logger.info(f"⚙️  Processing {len(files_to_process)} files with {self.max_workers} workers...")
            if not TQDM_AVAILABLE:
                logger.warning("⚠️  tqdm not installed - progress bars disabled")
                logger.warning("   Install with: pip install tqdm")

            with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit all tasks
                future_to_file = {
                    executor.submit(processor_func, file_path): file_path
                    for file_path in files_to_process
                }

                # Collect results as they complete with progress bar
                pbar_desc = f"Processing files ({self.max_workers} workers)"
                with tqdm(total=len(files_to_process), desc=pbar_desc, unit="files",
                         disable=not TQDM_AVAILABLE) as pbar:
                    for future in as_completed(future_to_file):
                        file_path = future_to_file[future]
                        try:
                            result = future.result()
                            results.append((file_path, result))

                            # Update cache if enabled
                            if self.use_cache and result and self.cache:
                                self.cache.update_cache(file_path, result)

                            pbar.update(1)
                            pbar.set_description(f"{pbar_desc} - {file_path.name}")

                        except Exception as e:
                            log_exception(logger, e, context={
                                'operation': 'parallel_file_processing',
                                'file_path': str(file_path)
                            })
                            pbar.update(1)

        # Save cache if enabled
        if self.use_cache and self.cache:
            self.cache.save_cache()

        # Log performance metrics
        duration_ms = (time.time() - start_time) * 1000
        log_performance_metric(
            logger,
            'process_files_parallel',
            duration_ms,
            metadata={
                'total_files': len(files),
                'cached_files': len(cached_results),
                'processed_files': len(files_to_process),
                'workers': self.max_workers,
                'cache_enabled': self.use_cache
            }
        )

        return results

    def invalidate_cache_for_files(self, files: List[Path]) -> None:
        """Invalidate cache entries for specific files"""
        if not self.use_cache or not self.cache:
            return

        for file_path in files:
            file_str = str(file_path)
            if file_str in self.cache.metadata.files:
                del self.cache.metadata.files[file_str]

        logger.info(f"🗑️  Invalidated cache for {len(files)} files")

    def clear_cache(self) -> None:
        """Clear entire cache"""
        if not self.use_cache or not self.cache:
            return

        self.cache.metadata.files = {}
        self.cache.save_cache()
        logger.info("🗑️  Cache cleared")


def batch_files_by_directory(files: List[Path], max_batch_size: int = 100) -> List[List[Path]]:
    """
    Group files into batches by directory for better locality

    Args:
        files: List of file paths
        max_batch_size: Maximum files per batch

    Returns:
        List of file batches
    """
    # Group by directory
    dir_groups: Dict[Path, List[Path]] = {}
    for file_path in files:
        dir_path = file_path.parent
        if dir_path not in dir_groups:
            dir_groups[dir_path] = []
        dir_groups[dir_path].append(file_path)

    # Create batches
    batches = []
    current_batch = []

    for dir_path, dir_files in dir_groups.items():
        for file_path in dir_files:
            current_batch.append(file_path)
            if len(current_batch) >= max_batch_size:
                batches.append(current_batch)
                current_batch = []

    if current_batch:
        batches.append(current_batch)

    return batches
