#!/usr/bin/env python3
"""
Analyzer Optimizer - Shared parallel processing and caching for all analyzers

This module provides generic optimization utilities that can be used by:
- Code Quality Analyzer
- Test Coverage Analyzer
- Dependency Analyzer
- Any future analyzers

Features:
- Generic parallel file processing
- Flexible caching with custom keys
- Performance metrics tracking
- Progress bar support with tqdm
"""

import os
import json
import hashlib
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable, Tuple
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
class AnalysisCache:
    """Generic cache entry for any analyzer"""
    key: str  # Unique identifier (file path, function name, etc.)
    hash: str  # Hash of content being analyzed
    timestamp: float
    result: Any  # Analysis result (can be dict, list, etc.)
    analyzer_version: str = "1.0"  # Track analyzer version for compatibility


@dataclass
class CacheMetadata:
    """Cache metadata for an analyzer"""
    version: str = "1.0"
    analyzer_name: str = ""
    last_update: float = 0.0
    entries: Dict[str, 'AnalysisCache'] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.entries is None:
            self.entries = {}


class AnalyzerCache:
    """Generic cache manager for any analyzer"""

    def __init__(self, analyzer_name: str, cache_dir: Path):
        """
        Initialize cache for a specific analyzer

        Args:
            analyzer_name: Name of the analyzer (e.g., 'code_quality', 'test_coverage')
            cache_dir: Directory to store cache files
        """
        self.analyzer_name = analyzer_name
        self._setup_cache_directory(cache_dir)
        self.metadata = self._load_cache()

    def _setup_cache_directory(self, cache_dir: Path) -> None:
        """Set up cache directory and file paths."""
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_file = self.cache_dir / f'{self.analyzer_name}_cache.json'

    def _load_cache(self) -> CacheMetadata:
        """Load cache from disk"""
        if not self.cache_file.exists():
            logger.info(f"No existing {self.analyzer_name} cache found, starting fresh")
            return CacheMetadata(analyzer_name=self.analyzer_name)

        try:
            with open(self.cache_file, 'r') as f:
                data = json.load(f)

            # Convert entries to AnalysisCache objects
            entries = {}
            for key, entry_data in data.get('entries', {}).items():
                entries[key] = AnalysisCache(**entry_data)

            metadata = CacheMetadata(
                version=data.get('version', '1.0'),
                analyzer_name=data.get('analyzer_name', self.analyzer_name),
                last_update=data.get('last_update', 0.0),
                entries=entries
            )

            logger.info(f"✅ Loaded {self.analyzer_name} cache with {len(entries)} entries")

            return metadata

        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'load_analyzer_cache',
                'cache_file': str(self.cache_file),
                'analyzer_name': self.analyzer_name
            })
            return CacheMetadata(analyzer_name=self.analyzer_name)

    def save_cache(self) -> None:
        """Save cache to disk"""
        try:
            # Convert to dict for JSON serialization
            data = {
                'version': self.metadata.version,
                'analyzer_name': self.metadata.analyzer_name,
                'last_update': time.time(),
                'entries': {
                    key: {
                        'key': entry.key,
                        'hash': entry.hash,
                        'timestamp': entry.timestamp,
                        'result': entry.result,
                        'analyzer_version': entry.analyzer_version
                    }
                    for key, entry in self.metadata.entries.items()
                }
            }

            with open(self.cache_file, 'w') as f:
                json.dump(data, f, indent=2)

            logger.info(f"✅ {self.analyzer_name} cache saved with {len(self.metadata.entries)} entries")

        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'save_analyzer_cache',
                'cache_file': str(self.cache_file),
                'analyzer_name': self.analyzer_name
            })

    def calculate_hash(self, content: Any) -> str:
        """
        Calculate hash of content

        Args:
            content: Content to hash (can be string, bytes, or dict)

        Returns:
            SHA-256 hash as hex string
        """
        try:
            if isinstance(content, dict):
                content = json.dumps(content, sort_keys=True)
            if isinstance(content, str):
                content = content.encode('utf-8')
            return hashlib.sha256(content).hexdigest()
        except Exception as e:
            log_exception(logger, e, context={
                'operation': 'calculate_hash',
                'analyzer_name': self.analyzer_name
            })
            return ""

    def is_cached(self, key: str, content_hash: str) -> bool:
        """Check if analysis result is cached and valid"""
        if key not in self.metadata.entries:
            return False

        cached = self.metadata.entries[key]

        # Check if hash matches
        return cached.hash == content_hash

    def get_cached_result(self, key: str) -> Optional[Any]:
        """Get cached result for a key"""
        if key in self.metadata.entries:
            return self.metadata.entries[key].result
        return None

    def update_cache(self, key: str, content_hash: str, result: Any) -> None:
        """Update cache entry"""
        self.metadata.entries[key] = AnalysisCache(
            key=key,
            hash=content_hash,
            timestamp=time.time(),
            result=result
        )

    def clear_cache(self) -> None:
        """Clear entire cache"""
        self.metadata.entries = {}
        self.save_cache()
        logger.info(f"🗑️  {self.analyzer_name} cache cleared")


class ParallelAnalyzer:
    """Generic parallel processor for any analyzer"""

    # Default cache directory name
    DEFAULT_CACHE_DIR = '.analyzer_cache'

    def __init__(
        self,
        analyzer_name: str,
        max_workers: Optional[int] = None,
        use_cache: bool = True,
        cache_dir: Optional[Path] = None
    ):
        """
        Initialize parallel analyzer

        Args:
            analyzer_name: Name of the analyzer
            max_workers: Maximum number of worker processes (default: CPU count - 1)
            use_cache: Whether to use caching
            cache_dir: Directory for cache files (default: .analyzer_cache)
        """
        self.analyzer_name = analyzer_name
        self.max_workers = self._calculate_max_workers(max_workers)
        self.use_cache = use_cache
        self.cache = self._initialize_cache(cache_dir) if use_cache else None
        self._log_initialization()

    def _calculate_max_workers(self, max_workers: Optional[int]) -> int:
        """Calculate the number of worker processes."""
        cpu_count = os.cpu_count() or 1
        return max_workers or max(1, cpu_count - 1)

    def _initialize_cache(self, cache_dir: Optional[Path]) -> AnalyzerCache:
        """Initialize the cache manager."""
        resolved_cache_dir = cache_dir or Path.cwd() / self.DEFAULT_CACHE_DIR
        return AnalyzerCache(self.analyzer_name, resolved_cache_dir)

    def _log_initialization(self) -> None:
        """Log initialization status."""
        logger.info(f"🚀 Parallel {self.analyzer_name} initialized")
        logger.info(f"   Workers: {self.max_workers}")
        logger.info(f"   Cache enabled: {self.use_cache}")

    def process_items_parallel(
        self,
        items: List[Any],
        processor_func: Callable,
        key_func: Callable[[Any], str],
        hash_func: Optional[Callable[[Any], str]] = None,
        skip_cached: bool = True,
        description: str = "Processing items"
    ) -> List[Tuple[Any, Any]]:
        """
        Process items in parallel with optional caching

        Args:
            items: List of items to process
            processor_func: Function to process each item (must be picklable)
            key_func: Function to generate cache key from item
            hash_func: Function to generate hash from item (optional)
            skip_cached: Whether to skip cached items
            description: Description for progress bar

        Returns:
            List of (item, result) tuples
        """
        start_time = time.time()

        # Filter items if using cache
        items_to_process = []
        cached_results = []

        if self.use_cache and skip_cached and hash_func and self.cache:
            for item in items:
                key = key_func(item)
                content_hash = hash_func(item)

                if self.cache.is_cached(key, content_hash):
                    cached_result = self.cache.get_cached_result(key)
                    cached_results.append((item, cached_result))
                    logger.debug(f"💾 Using cached result for {key}")
                else:
                    items_to_process.append(item)

            logger.info(f"📊 {self.analyzer_name} cache stats:")
            logger.info(f"   Total items: {len(items)}")
            logger.info(f"   Cached: {len(cached_results)}")
            logger.info(f"   To process: {len(items_to_process)}")
        else:
            items_to_process = items

        # Process items in parallel
        results = cached_results.copy()

        if items_to_process:
            logger.info(f"⚙️  Processing {len(items_to_process)} items with {self.max_workers} workers...")

            if not TQDM_AVAILABLE:
                logger.warning("⚠️  tqdm not installed - progress bars disabled")

            with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit all tasks
                future_to_item = {
                    executor.submit(processor_func, item): item
                    for item in items_to_process
                }

                # Collect results as they complete with progress bar
                pbar_desc = f"{description} ({self.max_workers} workers)"
                with tqdm(total=len(items_to_process), desc=pbar_desc, unit="items",
                         disable=not TQDM_AVAILABLE) as pbar:
                    for future in as_completed(future_to_item):
                        item = future_to_item[future]
                        try:
                            result = future.result()
                            results.append((item, result))

                            # Update cache if enabled
                            if self.use_cache and result and hash_func and self.cache:
                                key = key_func(item)
                                content_hash = hash_func(item)
                                self.cache.update_cache(key, content_hash, result)

                            pbar.update(1)
                            # Show current item in progress bar
                            try:
                                item_name = str(item) if hasattr(item, '__str__') else str(key_func(item))
                                if len(item_name) > 50:
                                    item_name = item_name[:47] + "..."
                                pbar.set_description(f"{pbar_desc} - {item_name}")
                            except Exception:
                                pass

                        except Exception as e:
                            log_exception(logger, e, context={
                                'operation': 'parallel_item_processing',
                                'analyzer_name': self.analyzer_name,
                                'item': str(item)
                            })
                            pbar.update(1)

        # Save cache if enabled
        if self.use_cache and self.cache:
            self.cache.save_cache()

        # Log performance metrics
        duration_ms = (time.time() - start_time) * 1000
        log_performance_metric(
            logger,
            f'{self.analyzer_name}_parallel_processing',
            duration_ms,
            metadata={
                'total_items': len(items),
                'cached_items': len(cached_results),
                'processed_items': len(items_to_process),
                'workers': self.max_workers,
                'cache_enabled': self.use_cache
            }
        )

        return results

    def invalidate_cache_for_items(self, keys: List[str]) -> None:
        """Invalidate cache entries for specific keys"""
        if not self.use_cache or not self.cache:
            return

        for key in keys:
            if key in self.cache.metadata.entries:
                del self.cache.metadata.entries[key]

        logger.info(f"🗑️  Invalidated {self.analyzer_name} cache for {len(keys)} items")

    def clear_cache(self) -> None:
        """Clear entire cache"""
        if self.use_cache and self.cache:
            self.cache.clear_cache()


# Utility functions for common patterns

def get_file_content_hash(file_path: Path) -> str:
    """Get SHA-256 hash of file contents"""
    try:
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception as e:
        logger.error(f"Error hashing file {file_path}: {e}")
        return ""


def get_file_key(file_path: Path) -> str:
    """Get cache key from file path"""
    return str(file_path)


def batch_items_by_attribute(
    items: List[Any],
    attr_func: Callable[[Any], Any],
    max_batch_size: int = 100
) -> List[List[Any]]:
    """
    Group items into batches by attribute for better locality

    Args:
        items: List of items
        attr_func: Function to extract grouping attribute from item
        max_batch_size: Maximum items per batch

    Returns:
        List of item batches
    """
    # Group by attribute
    groups: Dict[Any, List[Any]] = {}
    for item in items:
        attr = attr_func(item)
        if attr not in groups:
            groups[attr] = []
        groups[attr].append(item)

    # Create batches
    batches = []
    current_batch = []

    for attr, attr_items in groups.items():
        for item in attr_items:
            current_batch.append(item)
            if len(current_batch) >= max_batch_size:
                batches.append(current_batch)
                current_batch = []

    if current_batch:
        batches.append(current_batch)

    return batches
