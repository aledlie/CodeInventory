"""Indexing utilities for dashboard optimization.

This module provides utilities for building indexes that enable fast
filtering, searching, and pagination in dashboard views.
"""
from dataclasses import dataclass, field
from typing import Any, Callable, Optional
import re


@dataclass
class IndexEntry:
    """An entry in an index mapping a key to item indices."""
    key: str
    indices: list[int]
    count: int = 0

    def __post_init__(self):
        self.count = len(self.indices)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'key': self.key,
            'indices': self.indices,
            'count': self.count,
        }


@dataclass
class Index:
    """A complete index with entries and metadata."""
    name: str
    entries: dict[str, list[int]]
    total_items: int = 0
    unique_keys: int = 0

    def __post_init__(self):
        self.unique_keys = len(self.entries)

    def get(self, key: str) -> list[int]:
        """Get indices for a key."""
        return self.entries.get(key, [])

    def keys(self) -> list[str]:
        """Get all keys in the index."""
        return list(self.entries.keys())

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'name': self.name,
            'entries': self.entries,
            'total_items': self.total_items,
            'unique_keys': self.unique_keys,
        }


@dataclass
class SearchIndex:
    """A search index for text-based lookups.

    Maps normalized terms to lists of item indices for fast full-text search.
    """
    terms: dict[str, list[int]]
    total_items: int = 0
    total_terms: int = 0

    def __post_init__(self):
        self.total_terms = len(self.terms)

    def search(self, query: str) -> list[int]:
        """Search for items matching the query.

        Args:
            query: Search query string.

        Returns:
            List of item indices matching the query, sorted by relevance.
        """
        query_terms = self._tokenize(query)
        if not query_terms:
            return []

        # Find items matching all query terms
        result_sets: list[set[int]] = []

        for term in query_terms:
            matching_indices: set[int] = set()

            # Exact match
            if term in self.terms:
                matching_indices.update(self.terms[term])

            # Prefix match for partial searches
            for index_term, indices in self.terms.items():
                if index_term.startswith(term) or term in index_term:
                    matching_indices.update(indices)

            if matching_indices:
                result_sets.append(matching_indices)

        if not result_sets:
            return []

        # Intersect all result sets (AND logic)
        result = result_sets[0]
        for rs in result_sets[1:]:
            result = result.intersection(rs)

        return sorted(result)

    def _tokenize(self, text: str) -> list[str]:
        """Tokenize text into normalized terms."""
        # Convert to lowercase and extract words
        text = text.lower()
        words = re.findall(r'[a-z0-9_]+', text)
        return [w for w in words if len(w) >= 2]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'terms': self.terms,
            'total_items': self.total_items,
            'total_terms': self.total_terms,
        }


@dataclass
class PaginationMeta:
    """Pagination metadata for a dataset."""
    total_items: int
    page_size: int
    total_pages: int = 0
    page_ranges: list[tuple[int, int]] = field(default_factory=list)

    def __post_init__(self):
        if self.page_size > 0:
            self.total_pages = (self.total_items + self.page_size - 1) // self.page_size
            self._compute_page_ranges()

    def _compute_page_ranges(self) -> None:
        """Compute start/end indices for each page."""
        self.page_ranges = []
        for page in range(self.total_pages):
            start = page * self.page_size
            end = min(start + self.page_size, self.total_items)
            self.page_ranges.append((start, end))

    def get_page_range(self, page: int) -> tuple[int, int]:
        """Get the index range for a page (0-indexed).

        Args:
            page: Page number (0-indexed).

        Returns:
            Tuple of (start_index, end_index).
        """
        if 0 <= page < len(self.page_ranges):
            return self.page_ranges[page]
        return (0, 0)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'total_items': self.total_items,
            'page_size': self.page_size,
            'total_pages': self.total_pages,
            'page_ranges': self.page_ranges,
        }


class IndexBuilder:
    """Builds indexes for dashboard optimization.

    Provides methods to create various types of indexes for fast
    filtering, searching, and pagination in dashboard views.
    """

    def __init__(self):
        """Initialize the index builder."""
        pass

    def build_categorical_index(
        self,
        items: list[dict[str, Any]],
        key_field: str,
        name: Optional[str] = None,
    ) -> Index:
        """Build an index based on a categorical field.

        Args:
            items: List of item dictionaries.
            key_field: Field name to index by.
            name: Optional name for the index.

        Returns:
            Index mapping field values to item indices.
        """
        entries: dict[str, list[int]] = {}

        for idx, item in enumerate(items):
            value = item.get(key_field)

            # Handle None and missing values
            if value is None:
                value = 'unknown'

            # Convert to string key
            key = str(value).lower().replace(' ', '_')

            if key not in entries:
                entries[key] = []
            entries[key].append(idx)

        return Index(
            name=name or f'by_{key_field}',
            entries=entries,
            total_items=len(items),
        )

    def build_range_index(
        self,
        items: list[dict[str, Any]],
        key_field: str,
        ranges: list[tuple[str, float, float]],
        name: Optional[str] = None,
    ) -> Index:
        """Build an index based on numeric ranges.

        Args:
            items: List of item dictionaries.
            key_field: Numeric field name to index by.
            ranges: List of (label, min_value, max_value) tuples.
            name: Optional name for the index.

        Returns:
            Index mapping range labels to item indices.
        """
        entries: dict[str, list[int]] = {label: [] for label, _, _ in ranges}

        for idx, item in enumerate(items):
            value = item.get(key_field)

            if value is None:
                continue

            try:
                num_value = float(value)
            except (ValueError, TypeError):
                continue

            for label, min_val, max_val in ranges:
                if min_val <= num_value <= max_val:
                    entries[label].append(idx)
                    break  # Only add to first matching range

        return Index(
            name=name or f'by_{key_field}_range',
            entries=entries,
            total_items=len(items),
        )

    def build_multi_value_index(
        self,
        items: list[dict[str, Any]],
        key_field: str,
        name: Optional[str] = None,
    ) -> Index:
        """Build an index for fields with multiple values (lists).

        Args:
            items: List of item dictionaries.
            key_field: Field name containing a list of values.
            name: Optional name for the index.

        Returns:
            Index mapping each unique value to item indices.
        """
        entries: dict[str, list[int]] = {}

        for idx, item in enumerate(items):
            values = item.get(key_field, [])

            if not isinstance(values, list):
                values = [values] if values else []

            for value in values:
                if value is None:
                    continue

                key = str(value).lower().replace(' ', '_')

                if key not in entries:
                    entries[key] = []
                entries[key].append(idx)

        return Index(
            name=name or f'by_{key_field}',
            entries=entries,
            total_items=len(items),
        )

    def build_search_index(
        self,
        items: list[dict[str, Any]],
        fields: list[str],
        weights: Optional[dict[str, float]] = None,
    ) -> SearchIndex:
        """Build a search index for full-text search.

        Args:
            items: List of item dictionaries.
            fields: Field names to include in the search index.
            weights: Optional field weights (not used for indexing, for future use).

        Returns:
            SearchIndex for text-based lookups.
        """
        terms: dict[str, list[int]] = {}

        for idx, item in enumerate(items):
            # Collect all text from specified fields
            text_parts: list[str] = []

            for field in fields:
                value = item.get(field)

                if value is None:
                    continue

                if isinstance(value, str):
                    text_parts.append(value)
                elif isinstance(value, list):
                    text_parts.extend(str(v) for v in value if v)

            # Tokenize all collected text
            all_text = ' '.join(text_parts)
            tokens = self._tokenize(all_text)

            # Add to index
            for token in set(tokens):  # Use set to avoid duplicate entries
                if token not in terms:
                    terms[token] = []
                terms[token].append(idx)

        return SearchIndex(
            terms=terms,
            total_items=len(items),
        )

    def build_pagination_meta(
        self,
        items: list[dict[str, Any]],
        page_size: int = 50,
    ) -> PaginationMeta:
        """Build pagination metadata.

        Args:
            items: List of items.
            page_size: Number of items per page.

        Returns:
            PaginationMeta with page ranges.
        """
        return PaginationMeta(
            total_items=len(items),
            page_size=page_size,
        )

    def build_composite_index(
        self,
        items: list[dict[str, Any]],
        key_fields: list[str],
        separator: str = ':',
        name: Optional[str] = None,
    ) -> Index:
        """Build a composite index from multiple fields.

        Args:
            items: List of item dictionaries.
            key_fields: Field names to combine.
            separator: Separator for combining field values.
            name: Optional name for the index.

        Returns:
            Index mapping composite keys to item indices.
        """
        entries: dict[str, list[int]] = {}

        for idx, item in enumerate(items):
            key_parts = []

            for field in key_fields:
                value = item.get(field, 'unknown')
                key_parts.append(str(value).lower().replace(' ', '_'))

            key = separator.join(key_parts)

            if key not in entries:
                entries[key] = []
            entries[key].append(idx)

        field_name = '_'.join(key_fields)
        return Index(
            name=name or f'by_{field_name}',
            entries=entries,
            total_items=len(items),
        )

    def _tokenize(self, text: str) -> list[str]:
        """Tokenize text into normalized terms.

        Args:
            text: Input text.

        Returns:
            List of normalized tokens.
        """
        # Split on camelCase BEFORE lowercasing (important!)
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)

        # Convert to lowercase
        text = text.lower()

        # Split on snake_case
        text = text.replace('_', ' ')

        # Extract words
        words = re.findall(r'[a-z0-9]+', text)

        # Filter short words
        return [w for w in words if len(w) >= 2]
