"""Tests for the similarity scoring utilities."""
import pytest

from src.analyzers.preprocessing.utils.similarity import (
    SimilarityScore,
    SimilarityCalculator,
    compute_similarity,
    is_duplicate,
    find_duplicates,
)


class TestSimilarityScore:
    """Tests for SimilarityScore dataclass."""

    def test_to_dict(self):
        score = SimilarityScore(
            overall=0.85,
            name_similarity=0.9,
            signature_similarity=0.8,
            dependency_similarity=0.7,
            location_similarity=0.6,
        )

        d = score.to_dict()
        assert d['overall'] == 0.85
        assert d['name_similarity'] == 0.9
        assert d['signature_similarity'] == 0.8
        assert d['dependency_similarity'] == 0.7
        assert d['location_similarity'] == 0.6


class TestSimilarityCalculator:
    """Tests for SimilarityCalculator."""

    def test_init_default_weights(self):
        calc = SimilarityCalculator()
        assert calc.weights['name'] == 0.35
        assert calc.weights['signature'] == 0.30
        assert calc.weights['dependency'] == 0.20
        assert calc.weights['location'] == 0.15

    def test_init_custom_weights(self):
        custom_weights = {'name': 0.5, 'signature': 0.3, 'dependency': 0.1, 'location': 0.1}
        calc = SimilarityCalculator(weights=custom_weights)
        assert calc.weights['name'] == 0.5

    # Name similarity tests
    def test_name_similarity_exact_match(self):
        calc = SimilarityCalculator()
        result = calc._name_similarity('validate_email', 'validate_email')
        assert result == 1.0

    def test_name_similarity_case_insensitive(self):
        calc = SimilarityCalculator()
        result = calc._name_similarity('ValidateEmail', 'validateemail')
        assert result == 0.95

    def test_name_similarity_similar_names(self):
        calc = SimilarityCalculator()
        result = calc._name_similarity('validate_email', 'validate_phone')
        assert result > 0.5  # Should have good similarity due to common prefix

    def test_name_similarity_different_names(self):
        calc = SimilarityCalculator()
        result = calc._name_similarity('foo', 'bar')
        assert result < 0.5

    def test_name_similarity_empty_names(self):
        calc = SimilarityCalculator()
        assert calc._name_similarity('', 'foo') == 0.0
        assert calc._name_similarity('foo', '') == 0.0
        assert calc._name_similarity('', '') == 0.0

    def test_name_similarity_prefix_boost(self):
        calc = SimilarityCalculator()
        # Names with common prefix should get a boost
        result = calc._name_similarity('get_user_by_id', 'get_user_by_email')
        assert result > 0.7

    # Signature similarity tests
    def test_signature_similarity_same_type(self):
        calc = SimilarityCalculator()
        a = {'type': 'function', 'parameters': ['x', 'y']}
        b = {'type': 'function', 'parameters': ['a', 'b']}
        result = calc._signature_similarity(a, b)
        assert result > 0.5

    def test_signature_similarity_different_type(self):
        calc = SimilarityCalculator()
        a = {'type': 'function'}
        b = {'type': 'class'}
        result = calc._signature_similarity(a, b)
        assert result < 1.0  # Different types should reduce similarity

    def test_signature_similarity_same_param_count(self):
        calc = SimilarityCalculator()
        a = {'parameters': ['x', 'y', 'z']}
        b = {'parameters': ['a', 'b', 'c']}
        result = calc._signature_similarity(a, b)
        assert result >= 0.5  # Same param count contributes to similarity

    def test_signature_similarity_different_param_count(self):
        calc = SimilarityCalculator()
        a = {'parameters': ['x']}
        b = {'parameters': ['a', 'b', 'c', 'd', 'e']}
        result = calc._signature_similarity(a, b)
        assert result < 0.5

    def test_signature_similarity_matching_param_names(self):
        calc = SimilarityCalculator()
        a = {'parameters': ['user_id', 'name', 'email']}
        b = {'parameters': ['user_id', 'name', 'phone']}
        result = calc._signature_similarity(a, b)
        assert result > 0.6

    def test_signature_similarity_same_return_type(self):
        calc = SimilarityCalculator()
        a = {'return_type': 'str'}
        b = {'return_type': 'str'}
        result = calc._signature_similarity(a, b)
        assert result > 0.5

    def test_signature_similarity_dict_params(self):
        calc = SimilarityCalculator()
        a = {'parameters': [{'name': 'user_id'}, {'name': 'email'}]}
        b = {'parameters': [{'name': 'user_id'}, {'name': 'phone'}]}
        result = calc._signature_similarity(a, b)
        assert result > 0.5

    # Dependency similarity tests
    def test_dependency_similarity_identical(self):
        calc = SimilarityCalculator()
        deps = ['os', 'json', 'typing']
        result = calc._dependency_similarity(deps, deps)
        assert result == 1.0

    def test_dependency_similarity_no_overlap(self):
        calc = SimilarityCalculator()
        result = calc._dependency_similarity(['os', 'sys'], ['numpy', 'pandas'])
        assert result == 0.0

    def test_dependency_similarity_partial_overlap(self):
        calc = SimilarityCalculator()
        result = calc._dependency_similarity(['os', 'json', 'typing'], ['os', 'json', 'requests'])
        assert result == pytest.approx(2/4)  # Jaccard: 2 common / 4 total unique

    def test_dependency_similarity_both_empty(self):
        calc = SimilarityCalculator()
        result = calc._dependency_similarity([], [])
        assert result == 1.0

    def test_dependency_similarity_one_empty(self):
        calc = SimilarityCalculator()
        assert calc._dependency_similarity(['os'], []) == 0.0
        assert calc._dependency_similarity([], ['os']) == 0.0

    def test_dependency_similarity_normalizes_paths(self):
        calc = SimilarityCalculator()
        # Should match despite different formats
        result = calc._dependency_similarity(['os.path'], ['os'])
        assert result > 0.0

    # Location similarity tests
    def test_location_similarity_same_file(self):
        calc = SimilarityCalculator()
        result = calc._location_similarity('src/utils/helpers.py', 'src/utils/helpers.py')
        assert result == 1.0

    def test_location_similarity_same_directory(self):
        calc = SimilarityCalculator()
        result = calc._location_similarity('src/utils/helpers.py', 'src/utils/format.py')
        assert result == 0.8

    def test_location_similarity_different_directories(self):
        calc = SimilarityCalculator()
        result = calc._location_similarity('src/utils/helpers.py', 'src/api/client.py')
        assert result > 0.4
        assert result < 0.8

    def test_location_similarity_completely_different(self):
        calc = SimilarityCalculator()
        result = calc._location_similarity('lib/utils.py', 'src/api/client.py')
        assert result < 0.5

    def test_location_similarity_empty_paths(self):
        calc = SimilarityCalculator()
        assert calc._location_similarity('', 'src/foo.py') == 0.0
        assert calc._location_similarity('src/foo.py', '') == 0.0

    def test_location_similarity_normalizes_windows_paths(self):
        calc = SimilarityCalculator()
        result = calc._location_similarity('src\\utils\\helpers.py', 'src/utils/format.py')
        assert result == 0.8

    # Full calculate tests
    def test_calculate_identical_candidates(self):
        calc = SimilarityCalculator()
        candidate = {
            'name': 'validate_email',
            'type': 'function',
            'file_path': 'src/validators/email.py',
            'dependencies': ['re', 'typing'],
            'parameters': ['email: str'],
            'return_type': 'bool',
        }

        result = calc.calculate(candidate, candidate)
        assert result.overall == pytest.approx(1.0)

    def test_calculate_similar_candidates(self):
        calc = SimilarityCalculator()
        a = {
            'name': 'validate_email',
            'type': 'function',
            'file_path': 'src/validators/email.py',
            'dependencies': ['re', 'typing'],
            'parameters': ['email: str'],
        }
        b = {
            'name': 'validate_phone',
            'type': 'function',
            'file_path': 'src/validators/phone.py',
            'dependencies': ['re', 'typing'],
            'parameters': ['phone: str'],
        }

        result = calc.calculate(a, b)
        assert result.overall > 0.6
        assert result.name_similarity > 0.5
        assert result.dependency_similarity == 1.0

    def test_calculate_different_candidates(self):
        calc = SimilarityCalculator()
        a = {
            'name': 'fetch_user',
            'type': 'function',
            'file_path': 'src/api/users.py',
            'dependencies': ['requests', 'json'],
        }
        b = {
            'name': 'format_date',
            'type': 'function',
            'file_path': 'lib/utils/date.py',
            'dependencies': ['datetime'],
        }

        result = calc.calculate(a, b)
        assert result.overall < 0.5


class TestConvenienceFunctions:
    """Tests for module-level convenience functions."""

    def test_compute_similarity(self):
        a = {'name': 'foo', 'type': 'function'}
        b = {'name': 'foo', 'type': 'function'}

        result = compute_similarity(a, b)
        assert isinstance(result, SimilarityScore)
        assert result.overall > 0.5

    def test_compute_similarity_with_weights(self):
        a = {'name': 'foo', 'type': 'function'}
        b = {'name': 'bar', 'type': 'function'}

        # With high name weight, different names should result in lower score
        weights = {'name': 0.9, 'signature': 0.05, 'dependency': 0.025, 'location': 0.025}
        result = compute_similarity(a, b, weights=weights)
        assert result.overall < 0.5

    def test_is_duplicate_true(self):
        a = {
            'name': 'validate_input',
            'type': 'function',
            'file_path': 'src/validators.py',
            'dependencies': ['typing'],
            'parameters': ['data: dict'],
        }
        b = a.copy()  # Identical

        assert is_duplicate(a, b, threshold=0.85) is True

    def test_is_duplicate_false(self):
        a = {'name': 'foo', 'type': 'function'}
        b = {'name': 'bar', 'type': 'class'}

        assert is_duplicate(a, b, threshold=0.85) is False

    def test_is_duplicate_custom_threshold(self):
        a = {'name': 'validate_email', 'type': 'function'}
        b = {'name': 'validate_phone', 'type': 'function'}

        # Should be duplicate with low threshold
        assert is_duplicate(a, b, threshold=0.3) is True
        # Should not be duplicate with high threshold
        assert is_duplicate(a, b, threshold=0.95) is False

    def test_find_duplicates_empty_list(self):
        result = find_duplicates([])
        assert result == []

    def test_find_duplicates_no_duplicates(self):
        candidates = [
            {'name': 'foo', 'type': 'function'},
            {'name': 'bar', 'type': 'class'},
            {'name': 'baz', 'type': 'method'},
        ]

        result = find_duplicates(candidates, threshold=0.9)
        assert len(result) == 0

    def test_find_duplicates_with_duplicates(self):
        # Create candidates where 0 and 3 are identical (exact duplicates)
        candidates = [
            {'name': 'validate_email', 'type': 'function', 'dependencies': ['re'], 'file_path': 'a.py'},
            {'name': 'validate_phone', 'type': 'function', 'dependencies': ['re'], 'file_path': 'b.py'},
            {'name': 'fetch_data', 'type': 'function', 'dependencies': ['requests'], 'file_path': 'c.py'},
            {'name': 'validate_email', 'type': 'function', 'dependencies': ['re'], 'file_path': 'd.py'},  # Similar to 0
        ]

        result = find_duplicates(candidates, threshold=0.7)  # Use lower threshold

        # Should find at least one pair
        assert len(result) >= 1
        # Check that pairs with validate_email are found
        pairs_found = [(r[0], r[1]) for r in result]
        # Either (0,3) should be found or at least some duplicate pair
        has_validate_pair = (0, 3) in pairs_found or any(
            candidates[i]['name'] == candidates[j]['name'] for i, j, _ in result
        )
        assert has_validate_pair

    def test_find_duplicates_returns_scores(self):
        candidates = [
            {'name': 'validate', 'type': 'function'},
            {'name': 'validate', 'type': 'function'},  # Exact duplicate
        ]

        result = find_duplicates(candidates, threshold=0.5)
        assert len(result) == 1

        idx_a, idx_b, score = result[0]
        assert idx_a == 0
        assert idx_b == 1
        assert isinstance(score, SimilarityScore)
        assert score.overall > 0.5


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_empty_candidate(self):
        calc = SimilarityCalculator()
        result = calc.calculate({}, {})
        assert isinstance(result, SimilarityScore)

    def test_missing_fields(self):
        calc = SimilarityCalculator()
        a = {'name': 'foo'}
        b = {'type': 'function'}

        result = calc.calculate(a, b)
        assert isinstance(result, SimilarityScore)

    def test_none_values_in_dependencies(self):
        calc = SimilarityCalculator()
        result = calc._dependency_similarity(['os', None, 'sys'], ['os', 'sys'])
        assert result > 0.5

    def test_mixed_param_formats(self):
        calc = SimilarityCalculator()
        a = {'parameters': ['x: int', 'y: str']}
        b = {'parameters': [{'name': 'x'}, {'name': 'y'}]}

        result = calc._signature_similarity(a, b)
        assert result > 0.5

    def test_very_long_names(self):
        calc = SimilarityCalculator()
        long_name = 'very_long_function_name_that_describes_what_it_does_in_detail'
        result = calc._name_similarity(long_name, long_name + '_extended')
        assert result > 0.8
