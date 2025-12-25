"""Similarity scoring utilities for deduplication.

This module provides algorithms for computing similarity between tool candidates
based on various criteria including name, signature, dependencies, and location.
"""
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any, Optional


@dataclass
class SimilarityScore:
    """Detailed similarity score between two candidates."""
    overall: float  # Combined similarity score (0.0 to 1.0)
    name_similarity: float
    signature_similarity: float
    dependency_similarity: float
    location_similarity: float

    def to_dict(self) -> dict[str, float]:
        """Convert to dictionary for JSON serialization."""
        return {
            'overall': self.overall,
            'name_similarity': self.name_similarity,
            'signature_similarity': self.signature_similarity,
            'dependency_similarity': self.dependency_similarity,
            'location_similarity': self.location_similarity,
        }


class SimilarityCalculator:
    """Calculates similarity between tool candidates.

    Uses a weighted combination of multiple similarity metrics:
    - Name similarity: How similar the function/class names are
    - Signature similarity: Parameter count, types, return type
    - Dependency similarity: Jaccard similarity of dependencies
    - Location similarity: Whether they're in the same module/package
    """

    # Default weights for combining similarity scores
    DEFAULT_WEIGHTS = {
        'name': 0.35,
        'signature': 0.30,
        'dependency': 0.20,
        'location': 0.15,
    }

    def __init__(self, weights: Optional[dict[str, float]] = None):
        """Initialize the similarity calculator.

        Args:
            weights: Optional custom weights for similarity components.
                     Keys: 'name', 'signature', 'dependency', 'location'
                     Values should sum to 1.0 for normalized scores.
        """
        self.weights = weights or self.DEFAULT_WEIGHTS.copy()

    def calculate(
        self,
        candidate_a: dict[str, Any],
        candidate_b: dict[str, Any],
    ) -> SimilarityScore:
        """Calculate similarity between two candidates.

        Args:
            candidate_a: First tool candidate dictionary.
            candidate_b: Second tool candidate dictionary.

        Returns:
            SimilarityScore with detailed breakdown.
        """
        name_sim = self._name_similarity(
            candidate_a.get('name', ''),
            candidate_b.get('name', ''),
        )

        sig_sim = self._signature_similarity(candidate_a, candidate_b)
        dep_sim = self._dependency_similarity(
            candidate_a.get('dependencies', []),
            candidate_b.get('dependencies', []),
        )
        loc_sim = self._location_similarity(
            candidate_a.get('file_path', ''),
            candidate_b.get('file_path', ''),
        )

        # Weighted combination
        overall = (
            self.weights['name'] * name_sim +
            self.weights['signature'] * sig_sim +
            self.weights['dependency'] * dep_sim +
            self.weights['location'] * loc_sim
        )

        return SimilarityScore(
            overall=min(overall, 1.0),  # Cap at 1.0
            name_similarity=name_sim,
            signature_similarity=sig_sim,
            dependency_similarity=dep_sim,
            location_similarity=loc_sim,
        )

    def _name_similarity(self, name_a: str, name_b: str) -> float:
        """Calculate name similarity using sequence matching.

        Handles common naming patterns:
        - Exact match: 1.0
        - Case-insensitive match: 0.95
        - Prefix/suffix matches (e.g., get_user vs get_users): boosted

        Args:
            name_a: First name.
            name_b: Second name.

        Returns:
            Similarity score from 0.0 to 1.0.
        """
        if not name_a or not name_b:
            return 0.0

        # Exact match
        if name_a == name_b:
            return 1.0

        # Case-insensitive match
        if name_a.lower() == name_b.lower():
            return 0.95

        # Normalize: convert to lowercase for comparison
        a_lower = name_a.lower()
        b_lower = name_b.lower()

        # Use SequenceMatcher for fuzzy matching
        base_similarity = SequenceMatcher(None, a_lower, b_lower).ratio()

        # Boost for prefix matches (common in related functions)
        # e.g., 'validate_email' and 'validate_phone'
        common_prefix_len = 0
        for i, (ca, cb) in enumerate(zip(a_lower, b_lower)):
            if ca == cb:
                common_prefix_len = i + 1
            else:
                break

        prefix_ratio = common_prefix_len / max(len(a_lower), len(b_lower))
        if prefix_ratio > 0.3:
            base_similarity = min(base_similarity + 0.1, 1.0)

        return base_similarity

    def _signature_similarity(
        self,
        candidate_a: dict[str, Any],
        candidate_b: dict[str, Any],
    ) -> float:
        """Calculate signature similarity.

        Compares:
        - Function type (function vs method vs class)
        - Parameter count
        - Parameter names (if available)
        - Return type (if available)

        Args:
            candidate_a: First candidate.
            candidate_b: Second candidate.

        Returns:
            Similarity score from 0.0 to 1.0.
        """
        scores = []

        # Type match (function, method, class)
        type_a = candidate_a.get('type', '').lower()
        type_b = candidate_b.get('type', '').lower()
        if type_a and type_b:
            scores.append(1.0 if type_a == type_b else 0.3)

        # Parameter count similarity
        params_a = candidate_a.get('parameters', [])
        params_b = candidate_b.get('parameters', [])

        if isinstance(params_a, list) and isinstance(params_b, list):
            count_a = len(params_a)
            count_b = len(params_b)
            if count_a == 0 and count_b == 0:
                scores.append(1.0)
            elif count_a == 0 or count_b == 0:
                scores.append(0.5)
            else:
                param_sim = 1.0 - abs(count_a - count_b) / max(count_a, count_b)
                scores.append(param_sim)

                # Parameter name similarity (Jaccard on names)
                names_a = set(self._extract_param_names(params_a))
                names_b = set(self._extract_param_names(params_b))
                if names_a and names_b:
                    jaccard = len(names_a & names_b) / len(names_a | names_b)
                    scores.append(jaccard)

        # Return type similarity
        return_a = candidate_a.get('return_type', '')
        return_b = candidate_b.get('return_type', '')
        if return_a and return_b:
            scores.append(1.0 if return_a == return_b else 0.3)

        return sum(scores) / len(scores) if scores else 0.5

    def _extract_param_names(self, params: list) -> list[str]:
        """Extract parameter names from a parameter list.

        Handles various formats:
        - List of strings: ['param1', 'param2']
        - List of dicts: [{'name': 'param1'}, {'name': 'param2'}]

        Args:
            params: Parameter list in any format.

        Returns:
            List of parameter names.
        """
        names = []
        for param in params:
            if isinstance(param, str):
                # Handle 'name: type' format
                name = param.split(':')[0].strip()
                names.append(name.lower())
            elif isinstance(param, dict):
                name = param.get('name', '')
                if name:
                    names.append(name.lower())
        return names

    def _dependency_similarity(
        self,
        deps_a: list[str],
        deps_b: list[str],
    ) -> float:
        """Calculate dependency similarity using Jaccard index.

        Args:
            deps_a: Dependencies of first candidate.
            deps_b: Dependencies of second candidate.

        Returns:
            Jaccard similarity score from 0.0 to 1.0.
        """
        if not deps_a and not deps_b:
            return 1.0  # Both have no dependencies

        if not deps_a or not deps_b:
            return 0.0  # One has dependencies, other doesn't

        # Normalize dependencies (lowercase, root module only)
        set_a = set(self._normalize_dep(d) for d in deps_a if d)
        set_b = set(self._normalize_dep(d) for d in deps_b if d)

        if not set_a or not set_b:
            return 0.0

        # Jaccard similarity
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)

        return intersection / union if union > 0 else 0.0

    def _normalize_dep(self, dep: str) -> str:
        """Normalize a dependency name for comparison.

        Args:
            dep: Dependency name or path.

        Returns:
            Normalized root module name.
        """
        if not isinstance(dep, str):
            return ''

        # Get root module
        dep = dep.lower().strip()

        # Handle relative imports
        dep = dep.lstrip('.')

        # Get first component
        if '.' in dep:
            dep = dep.split('.')[0]
        if '/' in dep:
            dep = dep.split('/')[0]

        return dep

    def _location_similarity(self, path_a: str, path_b: str) -> float:
        """Calculate location similarity based on file paths.

        Higher scores for:
        - Same file: 1.0
        - Same directory: 0.8
        - Same package (parent directory): 0.6
        - Same root module: 0.4

        Args:
            path_a: First file path.
            path_b: Second file path.

        Returns:
            Location similarity score from 0.0 to 1.0.
        """
        if not path_a or not path_b:
            return 0.0

        # Normalize paths
        path_a = path_a.replace('\\', '/').lower()
        path_b = path_b.replace('\\', '/').lower()

        # Same file
        if path_a == path_b:
            return 1.0

        # Split into components
        parts_a = [p for p in path_a.split('/') if p]
        parts_b = [p for p in path_b.split('/') if p]

        if not parts_a or not parts_b:
            return 0.0

        # Compare directories (excluding filename)
        dir_a = parts_a[:-1]
        dir_b = parts_b[:-1]

        # Same directory
        if dir_a == dir_b:
            return 0.8

        # Count common path components
        common = 0
        for a, b in zip(dir_a, dir_b):
            if a == b:
                common += 1
            else:
                break

        if common == 0:
            return 0.0

        # Similarity based on common path depth
        max_depth = max(len(dir_a), len(dir_b))
        return 0.4 + 0.4 * (common / max_depth)


def compute_similarity(
    candidate_a: dict[str, Any],
    candidate_b: dict[str, Any],
    weights: Optional[dict[str, float]] = None,
) -> SimilarityScore:
    """Convenience function to compute similarity between two candidates.

    Args:
        candidate_a: First tool candidate.
        candidate_b: Second tool candidate.
        weights: Optional custom weights for similarity components.

    Returns:
        SimilarityScore with detailed breakdown.
    """
    calculator = SimilarityCalculator(weights)
    return calculator.calculate(candidate_a, candidate_b)


def is_duplicate(
    candidate_a: dict[str, Any],
    candidate_b: dict[str, Any],
    threshold: float = 0.85,
) -> bool:
    """Check if two candidates are likely duplicates.

    Args:
        candidate_a: First tool candidate.
        candidate_b: Second tool candidate.
        threshold: Similarity threshold for duplicate detection.

    Returns:
        True if candidates are likely duplicates.
    """
    score = compute_similarity(candidate_a, candidate_b)
    return score.overall >= threshold


def find_duplicates(
    candidates: list[dict[str, Any]],
    threshold: float = 0.85,
) -> list[tuple[int, int, SimilarityScore]]:
    """Find all duplicate pairs in a list of candidates.

    Args:
        candidates: List of tool candidates.
        threshold: Similarity threshold for duplicate detection.

    Returns:
        List of tuples (index_a, index_b, similarity_score) for duplicates.
    """
    calculator = SimilarityCalculator()
    duplicates = []

    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            score = calculator.calculate(candidates[i], candidates[j])
            if score.overall >= threshold:
                duplicates.append((i, j, score))

    return duplicates
