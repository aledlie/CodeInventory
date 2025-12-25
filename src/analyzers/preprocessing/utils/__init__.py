"""Preprocessing utilities."""
from .path_utils import PathNormalizer
from .similarity import (
    SimilarityScore,
    SimilarityCalculator,
    compute_similarity,
    is_duplicate,
    find_duplicates,
)
from .indexing import (
    IndexEntry,
    Index,
    SearchIndex,
    PaginationMeta,
    IndexBuilder,
)

__all__ = [
    # Path utilities
    'PathNormalizer',
    # Similarity utilities
    'SimilarityScore',
    'SimilarityCalculator',
    'compute_similarity',
    'is_duplicate',
    'find_duplicates',
    # Indexing utilities
    'IndexEntry',
    'Index',
    'SearchIndex',
    'PaginationMeta',
    'IndexBuilder',
]
