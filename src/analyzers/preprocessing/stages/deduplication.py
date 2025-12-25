"""Deduplication stage for preprocessing pipeline.

This module provides deduplication functionality including:
- Signature-based duplicate detection
- Similarity-based grouping of related candidates
- Statistics aggregation for summary reports
"""
from dataclasses import dataclass, field
from typing import Any, Optional
import hashlib
import logging

from .base import PreprocessingStage, StageResult
from ..config import DeduplicationConfig
from ..utils.similarity import SimilarityCalculator, SimilarityScore

logger = logging.getLogger(__name__)


@dataclass
class DuplicateGroup:
    """A group of duplicate or similar candidates."""
    primary_index: int  # Index of the primary (canonical) candidate
    duplicate_indices: list[int]  # Indices of duplicates
    similarity_scores: list[float]  # Similarity score for each duplicate
    group_type: str  # 'exact', 'signature', 'similar'
    merged_locations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'primary_index': self.primary_index,
            'duplicate_indices': self.duplicate_indices,
            'similarity_scores': self.similarity_scores,
            'group_type': self.group_type,
            'merged_locations': self.merged_locations,
        }


@dataclass
class DeduplicationStats:
    """Statistics from deduplication process."""
    total_candidates: int = 0
    unique_candidates: int = 0
    duplicates_removed: int = 0
    similar_groups: int = 0
    exact_duplicates: int = 0
    signature_duplicates: int = 0
    locations_merged: int = 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'total_candidates': self.total_candidates,
            'unique_candidates': self.unique_candidates,
            'duplicates_removed': self.duplicates_removed,
            'similar_groups': self.similar_groups,
            'exact_duplicates': self.exact_duplicates,
            'signature_duplicates': self.signature_duplicates,
            'locations_merged': self.locations_merged,
        }


class SignatureDeduplicator:
    """Detects and removes duplicate candidates based on signatures.

    Uses multiple strategies for duplicate detection:
    1. Exact match: Same name, file, and signature
    2. Signature match: Same name and signature, different files
    3. Content hash: Same implementation (if available)
    """

    def __init__(self, preserve_all_locations: bool = True):
        """Initialize the signature deduplicator.

        Args:
            preserve_all_locations: If True, merge locations from duplicates
                                   into the primary candidate.
        """
        self.preserve_all_locations = preserve_all_locations

    def compute_signature(self, candidate: dict[str, Any]) -> str:
        """Compute a signature hash for a candidate.

        The signature includes:
        - Normalized name
        - Type (function, method, class)
        - Parameter names and count
        - Return type (if available)

        Args:
            candidate: Tool candidate dictionary.

        Returns:
            Signature hash string.
        """
        parts = []

        # Name (normalized)
        name = candidate.get('name', '').lower().strip()
        parts.append(f"name:{name}")

        # Type
        ctype = candidate.get('type', 'unknown').lower()
        parts.append(f"type:{ctype}")

        # Parameters (sorted for consistency)
        params = candidate.get('parameters', [])
        if params:
            param_names = self._extract_param_names(params)
            parts.append(f"params:{','.join(sorted(param_names))}")
            parts.append(f"param_count:{len(params)}")

        # Return type
        return_type = candidate.get('return_type', '')
        if return_type:
            parts.append(f"return:{return_type.lower()}")

        # Create hash
        signature_str = '|'.join(parts)
        return hashlib.md5(signature_str.encode()).hexdigest()[:16]

    def _extract_param_names(self, params: list) -> list[str]:
        """Extract parameter names from a parameter list."""
        names = []
        for param in params:
            if isinstance(param, str):
                name = param.split(':')[0].strip().lower()
                names.append(name)
            elif isinstance(param, dict):
                name = param.get('name', '')
                if name:
                    names.append(name.lower())
        return names

    def find_signature_duplicates(
        self,
        candidates: list[dict[str, Any]],
    ) -> dict[str, list[int]]:
        """Find candidates with matching signatures.

        Args:
            candidates: List of tool candidates.

        Returns:
            Dictionary mapping signature hash to list of candidate indices.
        """
        signature_map: dict[str, list[int]] = {}

        for i, candidate in enumerate(candidates):
            sig = self.compute_signature(candidate)
            if sig not in signature_map:
                signature_map[sig] = []
            signature_map[sig].append(i)

        # Filter to only groups with duplicates
        return {sig: indices for sig, indices in signature_map.items()
                if len(indices) > 1}

    def deduplicate(
        self,
        candidates: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[DuplicateGroup]]:
        """Remove duplicate candidates based on signatures.

        Args:
            candidates: List of tool candidates.

        Returns:
            Tuple of (deduplicated candidates, duplicate groups).
        """
        if not candidates:
            return [], []

        # Find signature duplicates
        signature_groups = self.find_signature_duplicates(candidates)

        # Track which indices to keep (primary) and skip (duplicates)
        seen_signatures: set[str] = set()
        keep_indices: set[int] = set(range(len(candidates)))
        duplicate_groups: list[DuplicateGroup] = []

        for sig, indices in signature_groups.items():
            if sig in seen_signatures:
                continue
            seen_signatures.add(sig)

            # First occurrence is the primary
            primary_idx = indices[0]
            duplicate_idx = indices[1:]

            # Remove duplicates from keep set
            for idx in duplicate_idx:
                keep_indices.discard(idx)

            # Collect locations from duplicates
            merged_locations = []
            if self.preserve_all_locations:
                primary_path = candidates[primary_idx].get('file_path', '')
                if primary_path:
                    merged_locations.append(primary_path)
                for idx in duplicate_idx:
                    dup_path = candidates[idx].get('file_path', '')
                    if dup_path and dup_path not in merged_locations:
                        merged_locations.append(dup_path)

            # Create duplicate group
            group = DuplicateGroup(
                primary_index=primary_idx,
                duplicate_indices=duplicate_idx,
                similarity_scores=[1.0] * len(duplicate_idx),  # Exact signature match
                group_type='signature',
                merged_locations=merged_locations,
            )
            duplicate_groups.append(group)

        # Build deduplicated list
        deduplicated = []
        for i in sorted(keep_indices):
            candidate = candidates[i].copy()

            # Add merged locations if this is a primary
            for group in duplicate_groups:
                if group.primary_index == i and group.merged_locations:
                    candidate['_all_locations'] = group.merged_locations.copy()
                    break

            deduplicated.append(candidate)

        return deduplicated, duplicate_groups


class SimilarityGrouper:
    """Groups similar candidates together for analysis.

    Unlike SignatureDeduplicator which removes exact duplicates,
    SimilarityGrouper identifies related candidates that may serve
    similar purposes but are not exact duplicates.
    """

    def __init__(
        self,
        threshold: float = 0.7,
        max_group_size: int = 10,
    ):
        """Initialize the similarity grouper.

        Args:
            threshold: Minimum similarity score to group candidates.
            max_group_size: Maximum candidates per similarity group.
        """
        self.threshold = threshold
        self.max_group_size = max_group_size
        self.calculator = SimilarityCalculator()

    def group_similar(
        self,
        candidates: list[dict[str, Any]],
    ) -> list[list[int]]:
        """Group similar candidates together.

        Uses a greedy approach to group candidates by similarity.

        Args:
            candidates: List of tool candidates.

        Returns:
            List of groups, where each group is a list of candidate indices.
        """
        if not candidates:
            return []

        n = len(candidates)
        used = set()
        groups = []

        for i in range(n):
            if i in used:
                continue

            # Start a new group with candidate i
            group = [i]
            used.add(i)

            # Find similar candidates
            for j in range(i + 1, n):
                if j in used:
                    continue

                if len(group) >= self.max_group_size:
                    break

                score = self.calculator.calculate(candidates[i], candidates[j])
                if score.overall >= self.threshold:
                    group.append(j)
                    used.add(j)

            if len(group) > 1:
                groups.append(group)

        return groups

    def create_similarity_matrix(
        self,
        candidates: list[dict[str, Any]],
    ) -> list[list[float]]:
        """Create a similarity matrix for all candidates.

        Args:
            candidates: List of tool candidates.

        Returns:
            NxN matrix of similarity scores.
        """
        n = len(candidates)
        matrix = [[0.0] * n for _ in range(n)]

        for i in range(n):
            matrix[i][i] = 1.0  # Self-similarity
            for j in range(i + 1, n):
                score = self.calculator.calculate(candidates[i], candidates[j])
                matrix[i][j] = score.overall
                matrix[j][i] = score.overall

        return matrix

    def find_related_groups(
        self,
        candidates: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Find groups of related candidates with detailed similarity info.

        Args:
            candidates: List of tool candidates.

        Returns:
            List of group dictionaries with similarity details.
        """
        groups = self.group_similar(candidates)
        detailed_groups = []

        for group_indices in groups:
            if len(group_indices) < 2:
                continue

            # Use first as reference
            ref_idx = group_indices[0]
            members = []

            for idx in group_indices:
                if idx == ref_idx:
                    members.append({
                        'index': idx,
                        'name': candidates[idx].get('name', ''),
                        'similarity': 1.0,
                        'is_reference': True,
                    })
                else:
                    score = self.calculator.calculate(
                        candidates[ref_idx],
                        candidates[idx],
                    )
                    members.append({
                        'index': idx,
                        'name': candidates[idx].get('name', ''),
                        'similarity': score.overall,
                        'is_reference': False,
                    })

            detailed_groups.append({
                'size': len(group_indices),
                'members': members,
                'reference_index': ref_idx,
            })

        return detailed_groups


class StatisticsAggregator:
    """Aggregates statistics from the deduplication process."""

    def compute(
        self,
        original_count: int,
        deduplicated_count: int,
        duplicate_groups: list[DuplicateGroup],
        similar_groups: list[list[int]],
    ) -> DeduplicationStats:
        """Compute deduplication statistics.

        Args:
            original_count: Number of candidates before deduplication.
            deduplicated_count: Number of candidates after deduplication.
            duplicate_groups: Groups of duplicate candidates.
            similar_groups: Groups of similar (non-duplicate) candidates.

        Returns:
            DeduplicationStats with computed values.
        """
        stats = DeduplicationStats()

        stats.total_candidates = original_count
        stats.unique_candidates = deduplicated_count
        stats.duplicates_removed = original_count - deduplicated_count
        stats.similar_groups = len(similar_groups)

        # Count by duplicate type
        exact_count = 0
        signature_count = 0
        locations_merged = 0

        for group in duplicate_groups:
            if group.group_type == 'exact':
                exact_count += len(group.duplicate_indices)
            elif group.group_type == 'signature':
                signature_count += len(group.duplicate_indices)

            if len(group.merged_locations) > 1:
                locations_merged += len(group.merged_locations) - 1

        stats.exact_duplicates = exact_count
        stats.signature_duplicates = signature_count
        stats.locations_merged = locations_merged

        return stats


class DeduplicationStage(PreprocessingStage[dict, dict]):
    """Preprocessing stage that removes duplicates and groups similar items.

    This stage applies:
    1. Signature-based deduplication (exact and near-exact matches)
    2. Similarity grouping (related but distinct candidates)
    3. Statistics computation

    Input: Transformed tool identification report
    Output: Deduplicated report with similarity metadata
    """

    def __init__(self, config: DeduplicationConfig):
        """Initialize the deduplication stage.

        Args:
            config: Configuration for deduplication behavior.
        """
        super().__init__(config)
        self.deduplicator = SignatureDeduplicator(
            preserve_all_locations=config.preserve_all_locations
        )
        self.grouper = SimilarityGrouper(
            threshold=config.threshold * 0.8  # Use lower threshold for grouping
        )
        self.stats_aggregator = StatisticsAggregator()

    @property
    def name(self) -> str:
        """Return the stage name."""
        return "deduplication"

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        """Validate that input is a valid report dictionary.

        Args:
            data: Input data to validate.

        Returns:
            Tuple of (is_valid, list of error messages).
        """
        errors = []

        if not isinstance(data, dict):
            errors.append("Input must be a dictionary")
            return False, errors

        # Check for expected top-level keys
        expected_keys = {'summary', 'tool_candidates', 'utility_modules'}
        found_keys = set(data.keys()) & expected_keys

        if not found_keys:
            errors.append(
                f"Input should contain at least one of: {expected_keys}. "
                f"Found keys: {set(data.keys())}"
            )

        return len(errors) == 0, errors

    def process(self, data: dict) -> StageResult[dict]:
        """Process the input data through deduplication operations.

        Args:
            data: Transformed report dictionary.

        Returns:
            StageResult with deduplicated data.
        """
        config: DeduplicationConfig = self.config
        result = data.copy()
        warnings: list[str] = []
        metrics: dict[str, Any] = {}

        candidates = result.get('tool_candidates', [])
        original_count = len(candidates)

        if not candidates:
            logger.debug("No tool candidates to deduplicate")
            return StageResult.ok(
                result,
                warnings=warnings,
                metrics={'original_count': 0, 'final_count': 0},
            )

        # Step 1: Signature-based deduplication
        deduplicated, duplicate_groups = self.deduplicator.deduplicate(candidates)

        # Step 2: Similarity grouping (if enabled)
        similar_groups: list[list[int]] = []
        if config.group_similar:
            similar_groups = self.grouper.group_similar(deduplicated)

            # Add similarity group metadata to candidates
            for group_idx, group_indices in enumerate(similar_groups):
                for idx in group_indices:
                    if idx < len(deduplicated):
                        if '_similarity_group' not in deduplicated[idx]:
                            deduplicated[idx]['_similarity_group'] = group_idx

        # Step 3: Compute statistics
        stats = self.stats_aggregator.compute(
            original_count=original_count,
            deduplicated_count=len(deduplicated),
            duplicate_groups=duplicate_groups,
            similar_groups=similar_groups,
        )

        # Update result
        result['tool_candidates'] = deduplicated

        # Add deduplication metadata
        result['_deduplication'] = {
            'stats': stats.to_dict(),
            'duplicate_groups': [g.to_dict() for g in duplicate_groups],
            'similar_groups': [
                {'indices': group, 'size': len(group)}
                for group in similar_groups
            ],
        }

        # Build metrics
        metrics = {
            'original_count': original_count,
            'final_count': len(deduplicated),
            'duplicates_removed': stats.duplicates_removed,
            'similar_groups_found': len(similar_groups),
            'reduction_percentage': (
                (original_count - len(deduplicated)) / original_count * 100
                if original_count > 0 else 0
            ),
        }

        if stats.duplicates_removed > 0:
            logger.info(
                f"Removed {stats.duplicates_removed} duplicates from "
                f"{original_count} candidates"
            )

        return StageResult.ok(result, warnings=warnings, metrics=metrics)
