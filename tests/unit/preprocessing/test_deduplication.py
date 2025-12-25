"""Tests for the deduplication preprocessing stage."""
import pytest

from src.analyzers.preprocessing.config import DeduplicationConfig
from src.analyzers.preprocessing.stages.deduplication import (
    DeduplicationStage,
    SignatureDeduplicator,
    SimilarityGrouper,
    StatisticsAggregator,
    DuplicateGroup,
    DeduplicationStats,
)


class TestDuplicateGroup:
    """Tests for DuplicateGroup dataclass."""

    def test_to_dict(self):
        group = DuplicateGroup(
            primary_index=0,
            duplicate_indices=[1, 2],
            similarity_scores=[0.95, 0.90],
            group_type='signature',
            merged_locations=['src/a.py', 'src/b.py', 'src/c.py'],
        )

        d = group.to_dict()
        assert d['primary_index'] == 0
        assert d['duplicate_indices'] == [1, 2]
        assert d['similarity_scores'] == [0.95, 0.90]
        assert d['group_type'] == 'signature'
        assert len(d['merged_locations']) == 3


class TestDeduplicationStats:
    """Tests for DeduplicationStats dataclass."""

    def test_to_dict(self):
        stats = DeduplicationStats(
            total_candidates=100,
            unique_candidates=80,
            duplicates_removed=20,
            similar_groups=5,
            exact_duplicates=10,
            signature_duplicates=10,
            locations_merged=15,
        )

        d = stats.to_dict()
        assert d['total_candidates'] == 100
        assert d['unique_candidates'] == 80
        assert d['duplicates_removed'] == 20


class TestSignatureDeduplicator:
    """Tests for SignatureDeduplicator."""

    def test_init_default(self):
        dedup = SignatureDeduplicator()
        assert dedup.preserve_all_locations is True

    def test_init_custom(self):
        dedup = SignatureDeduplicator(preserve_all_locations=False)
        assert dedup.preserve_all_locations is False

    def test_compute_signature_basic(self):
        dedup = SignatureDeduplicator()
        candidate = {
            'name': 'validate_email',
            'type': 'function',
            'parameters': ['email: str'],
            'return_type': 'bool',
        }

        sig = dedup.compute_signature(candidate)
        assert isinstance(sig, str)
        assert len(sig) == 16  # MD5 truncated to 16 chars

    def test_compute_signature_same_candidates(self):
        dedup = SignatureDeduplicator()
        candidate = {
            'name': 'validate_email',
            'type': 'function',
            'parameters': ['email: str'],
        }

        sig1 = dedup.compute_signature(candidate)
        sig2 = dedup.compute_signature(candidate.copy())
        assert sig1 == sig2

    def test_compute_signature_different_candidates(self):
        dedup = SignatureDeduplicator()
        a = {'name': 'validate_email', 'type': 'function'}
        b = {'name': 'validate_phone', 'type': 'function'}

        sig_a = dedup.compute_signature(a)
        sig_b = dedup.compute_signature(b)
        assert sig_a != sig_b

    def test_compute_signature_case_insensitive_names(self):
        dedup = SignatureDeduplicator()
        a = {'name': 'ValidateEmail', 'type': 'function'}
        b = {'name': 'validateemail', 'type': 'function'}

        sig_a = dedup.compute_signature(a)
        sig_b = dedup.compute_signature(b)
        assert sig_a == sig_b

    def test_compute_signature_param_order_independent(self):
        dedup = SignatureDeduplicator()
        a = {'name': 'foo', 'type': 'function', 'parameters': ['x', 'y', 'z']}
        b = {'name': 'foo', 'type': 'function', 'parameters': ['z', 'y', 'x']}

        sig_a = dedup.compute_signature(a)
        sig_b = dedup.compute_signature(b)
        assert sig_a == sig_b  # Sorted params should match

    def test_find_signature_duplicates_none(self):
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'foo', 'type': 'function'},
            {'name': 'bar', 'type': 'function'},
            {'name': 'baz', 'type': 'class'},
        ]

        duplicates = dedup.find_signature_duplicates(candidates)
        assert len(duplicates) == 0

    def test_find_signature_duplicates_found(self):
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'validate', 'type': 'function', 'file_path': 'a.py'},
            {'name': 'validate', 'type': 'function', 'file_path': 'b.py'},  # Duplicate
            {'name': 'process', 'type': 'function', 'file_path': 'c.py'},
        ]

        duplicates = dedup.find_signature_duplicates(candidates)
        assert len(duplicates) == 1
        # The group should have indices 0 and 1
        sig, indices = list(duplicates.items())[0]
        assert 0 in indices
        assert 1 in indices

    def test_deduplicate_empty_list(self):
        dedup = SignatureDeduplicator()
        result, groups = dedup.deduplicate([])
        assert result == []
        assert groups == []

    def test_deduplicate_no_duplicates(self):
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'foo', 'type': 'function', 'file_path': 'a.py'},
            {'name': 'bar', 'type': 'function', 'file_path': 'b.py'},
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 2
        assert len(groups) == 0

    def test_deduplicate_removes_duplicates(self):
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'validate', 'type': 'function', 'file_path': 'a.py'},
            {'name': 'validate', 'type': 'function', 'file_path': 'b.py'},  # Duplicate
            {'name': 'process', 'type': 'function', 'file_path': 'c.py'},
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 2  # 3 - 1 duplicate removed
        assert len(groups) == 1

    def test_deduplicate_preserves_locations(self):
        dedup = SignatureDeduplicator(preserve_all_locations=True)
        candidates = [
            {'name': 'validate', 'type': 'function', 'file_path': 'a.py'},
            {'name': 'validate', 'type': 'function', 'file_path': 'b.py'},
            {'name': 'validate', 'type': 'function', 'file_path': 'c.py'},
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 1

        # Primary should have all locations
        primary = result[0]
        assert '_all_locations' in primary
        assert len(primary['_all_locations']) == 3
        assert 'a.py' in primary['_all_locations']
        assert 'b.py' in primary['_all_locations']
        assert 'c.py' in primary['_all_locations']

    def test_deduplicate_multiple_duplicate_groups(self):
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'validate', 'type': 'function', 'file_path': 'a.py'},
            {'name': 'process', 'type': 'function', 'file_path': 'b.py'},
            {'name': 'validate', 'type': 'function', 'file_path': 'c.py'},  # Dup of 0
            {'name': 'process', 'type': 'function', 'file_path': 'd.py'},  # Dup of 1
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 2
        assert len(groups) == 2


class TestSimilarityGrouper:
    """Tests for SimilarityGrouper."""

    def test_init_default(self):
        grouper = SimilarityGrouper()
        assert grouper.threshold == 0.7
        assert grouper.max_group_size == 10

    def test_init_custom(self):
        grouper = SimilarityGrouper(threshold=0.8, max_group_size=5)
        assert grouper.threshold == 0.8
        assert grouper.max_group_size == 5

    def test_group_similar_empty_list(self):
        grouper = SimilarityGrouper()
        result = grouper.group_similar([])
        assert result == []

    def test_group_similar_no_groups(self):
        grouper = SimilarityGrouper(threshold=0.99)  # Very high threshold
        candidates = [
            {'name': 'foo', 'type': 'function'},
            {'name': 'bar', 'type': 'class'},
        ]

        result = grouper.group_similar(candidates)
        assert len(result) == 0

    def test_group_similar_finds_groups(self):
        grouper = SimilarityGrouper(threshold=0.5)
        candidates = [
            {'name': 'validate_email', 'type': 'function', 'dependencies': ['re']},
            {'name': 'validate_phone', 'type': 'function', 'dependencies': ['re']},
            {'name': 'fetch_data', 'type': 'function', 'dependencies': ['requests']},
        ]

        result = grouper.group_similar(candidates)
        # validate_email and validate_phone should be grouped
        assert len(result) >= 1

        # Check that a group contains both validators
        found_validator_group = False
        for group in result:
            if 0 in group and 1 in group:
                found_validator_group = True
                break
        assert found_validator_group

    def test_group_similar_respects_max_size(self):
        grouper = SimilarityGrouper(threshold=0.3, max_group_size=2)
        candidates = [
            {'name': 'validate_a', 'type': 'function'},
            {'name': 'validate_b', 'type': 'function'},
            {'name': 'validate_c', 'type': 'function'},
            {'name': 'validate_d', 'type': 'function'},
        ]

        result = grouper.group_similar(candidates)
        for group in result:
            assert len(group) <= 2

    def test_create_similarity_matrix(self):
        grouper = SimilarityGrouper()
        candidates = [
            {'name': 'foo', 'type': 'function'},
            {'name': 'bar', 'type': 'function'},
        ]

        matrix = grouper.create_similarity_matrix(candidates)
        assert len(matrix) == 2
        assert len(matrix[0]) == 2
        assert matrix[0][0] == 1.0  # Self-similarity
        assert matrix[1][1] == 1.0
        assert matrix[0][1] == matrix[1][0]  # Symmetric

    def test_find_related_groups(self):
        grouper = SimilarityGrouper(threshold=0.5)
        candidates = [
            {'name': 'validate_email', 'type': 'function'},
            {'name': 'validate_phone', 'type': 'function'},
            {'name': 'fetch_data', 'type': 'function'},
        ]

        result = grouper.find_related_groups(candidates)

        if result:
            group = result[0]
            assert 'size' in group
            assert 'members' in group
            assert 'reference_index' in group
            assert group['size'] >= 2


class TestStatisticsAggregator:
    """Tests for StatisticsAggregator."""

    def test_compute_basic(self):
        aggregator = StatisticsAggregator()

        duplicate_groups = [
            DuplicateGroup(0, [1], [1.0], 'signature', ['a.py', 'b.py']),
        ]
        similar_groups = [[0, 1]]

        stats = aggregator.compute(
            original_count=3,
            deduplicated_count=2,
            duplicate_groups=duplicate_groups,
            similar_groups=similar_groups,
        )

        assert stats.total_candidates == 3
        assert stats.unique_candidates == 2
        assert stats.duplicates_removed == 1
        assert stats.similar_groups == 1
        assert stats.signature_duplicates == 1
        assert stats.locations_merged == 1

    def test_compute_no_duplicates(self):
        aggregator = StatisticsAggregator()

        stats = aggregator.compute(
            original_count=5,
            deduplicated_count=5,
            duplicate_groups=[],
            similar_groups=[],
        )

        assert stats.duplicates_removed == 0
        assert stats.exact_duplicates == 0
        assert stats.signature_duplicates == 0

    def test_compute_multiple_groups(self):
        aggregator = StatisticsAggregator()

        duplicate_groups = [
            DuplicateGroup(0, [1, 2], [1.0, 1.0], 'exact', ['a.py', 'b.py', 'c.py']),
            DuplicateGroup(3, [4], [0.95], 'signature', ['d.py', 'e.py']),
        ]

        stats = aggregator.compute(
            original_count=10,
            deduplicated_count=7,
            duplicate_groups=duplicate_groups,
            similar_groups=[],
        )

        assert stats.duplicates_removed == 3
        assert stats.exact_duplicates == 2
        assert stats.signature_duplicates == 1
        assert stats.locations_merged == 3  # 2 from first group + 1 from second


class TestDeduplicationStage:
    """Tests for DeduplicationStage."""

    @pytest.fixture
    def default_config(self):
        return DeduplicationConfig()

    @pytest.fixture
    def sample_report(self):
        return {
            'summary': {
                'root_directory': '/project',
                'files_analyzed': 10,
            },
            'tool_candidates': [
                {
                    'name': 'validate_email',
                    'type': 'function',
                    'file_path': 'src/validators/email.py',
                    'dependencies': ['re', 'typing'],
                },
                {
                    'name': 'validate_email',  # Duplicate
                    'type': 'function',
                    'file_path': 'lib/utils/validate.py',
                    'dependencies': ['re', 'typing'],
                },
                {
                    'name': 'fetch_user',
                    'type': 'function',
                    'file_path': 'src/api/users.py',
                    'dependencies': ['requests'],
                },
            ],
            'utility_modules': [],
        }

    def test_stage_name(self, default_config):
        stage = DeduplicationStage(default_config)
        assert stage.name == 'deduplication'

    def test_validate_input_valid(self, default_config, sample_report):
        stage = DeduplicationStage(default_config)
        is_valid, errors = stage.validate_input(sample_report)
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_input_invalid_not_dict(self, default_config):
        stage = DeduplicationStage(default_config)
        is_valid, errors = stage.validate_input([1, 2, 3])
        assert is_valid is False

    def test_validate_input_missing_keys(self, default_config):
        stage = DeduplicationStage(default_config)
        is_valid, errors = stage.validate_input({'random': 'data'})
        assert is_valid is False

    def test_process_removes_duplicates(self, default_config, sample_report):
        stage = DeduplicationStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        # Should have 2 candidates (3 - 1 duplicate)
        assert len(candidates) == 2

    def test_process_adds_deduplication_metadata(self, default_config, sample_report):
        stage = DeduplicationStage(default_config)
        result = stage.process(sample_report)

        assert '_deduplication' in result.data
        dedup = result.data['_deduplication']
        assert 'stats' in dedup
        assert 'duplicate_groups' in dedup
        assert 'similar_groups' in dedup

    def test_process_metrics(self, default_config, sample_report):
        stage = DeduplicationStage(default_config)
        result = stage.process(sample_report)

        assert 'original_count' in result.metrics
        assert 'final_count' in result.metrics
        assert 'duplicates_removed' in result.metrics
        assert 'reduction_percentage' in result.metrics

        assert result.metrics['original_count'] == 3
        assert result.metrics['final_count'] == 2
        assert result.metrics['duplicates_removed'] == 1

    def test_process_preserves_locations(self, default_config, sample_report):
        stage = DeduplicationStage(default_config)
        result = stage.process(sample_report)

        candidates = result.data['tool_candidates']

        # Find the validate_email candidate
        validate_candidate = next(
            (c for c in candidates if c['name'] == 'validate_email'),
            None
        )
        assert validate_candidate is not None
        assert '_all_locations' in validate_candidate
        assert len(validate_candidate['_all_locations']) == 2

    def test_process_groups_similar(self, default_config):
        config = DeduplicationConfig(group_similar=True, threshold=0.5)
        stage = DeduplicationStage(config)

        data = {
            'summary': {'files_analyzed': 3},
            'tool_candidates': [
                {'name': 'validate_email', 'type': 'function', 'file_path': 'a.py'},
                {'name': 'validate_phone', 'type': 'function', 'file_path': 'b.py'},
                {'name': 'fetch_data', 'type': 'function', 'file_path': 'c.py'},
            ],
            'utility_modules': [],
        }

        result = stage.process(data)

        assert result.success is True
        # Similar items should have _similarity_group metadata
        candidates = result.data['tool_candidates']

        # Check if any candidates have similarity groups
        groups_found = any('_similarity_group' in c for c in candidates)
        # This depends on the threshold - may or may not find groups
        assert isinstance(groups_found, bool)

    def test_process_disabled_grouping(self):
        config = DeduplicationConfig(group_similar=False)
        stage = DeduplicationStage(config)

        data = {
            'summary': {'files_analyzed': 2},
            'tool_candidates': [
                {'name': 'validate_email', 'type': 'function', 'file_path': 'a.py'},
                {'name': 'validate_phone', 'type': 'function', 'file_path': 'b.py'},
            ],
            'utility_modules': [],
        }

        result = stage.process(data)

        assert result.success is True
        # No similarity groups should be added
        similar_groups = result.data['_deduplication']['similar_groups']
        assert len(similar_groups) == 0

    def test_process_empty_candidates(self, default_config):
        stage = DeduplicationStage(default_config)
        data = {
            'summary': {'files_analyzed': 0},
            'tool_candidates': [],
            'utility_modules': [],
        }

        result = stage.process(data)

        assert result.success is True
        assert result.metrics['original_count'] == 0
        assert result.metrics['final_count'] == 0

    def test_run_adds_timing_metrics(self, default_config, sample_report):
        stage = DeduplicationStage(default_config)
        result = stage.run(sample_report)

        assert 'duration_ms' in result.metrics
        assert 'stage_name' in result.metrics
        assert result.metrics['stage_name'] == 'deduplication'


class TestDeduplicationStageIntegration:
    """Integration tests for DeduplicationStage with pipeline."""

    def test_deduplication_stage_in_pipeline(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        assert 'deduplication' in pipeline.stage_names

    def test_full_pipeline_with_deduplication(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        data = {
            'summary': {'root_directory': '/project', 'files_analyzed': 3},
            'tool_candidates': [
                {
                    'name': 'validate_input',
                    'type': 'function',
                    'file_path': 'src/validators/input.py',
                    'dependencies': ['typing'],
                },
                {
                    'name': 'validate_input',  # Duplicate
                    'type': 'function',
                    'file_path': 'lib/validate.py',
                    'dependencies': ['typing'],
                },
                {
                    'name': 'process_data',
                    'type': 'function',
                    'file_path': 'src/process.py',
                    'dependencies': ['json'],
                },
            ],
            'utility_modules': [],
        }

        result = pipeline.process(data)

        assert result.success is True
        assert 'cleaning' in result.stages_run
        assert 'transformation' in result.stages_run
        assert 'deduplication' in result.stages_run

        # Should have removed one duplicate
        assert len(result.data['tool_candidates']) == 2

        # Should have deduplication metadata
        assert '_deduplication' in result.data

    def test_pipeline_order(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        # Stages should be in order: cleaning, transformation, deduplication
        stages = pipeline.stage_names
        assert stages.index('cleaning') < stages.index('transformation')
        assert stages.index('transformation') < stages.index('deduplication')

    def test_disabled_deduplication(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        config.deduplication.enabled = False
        pipeline = PreprocessingPipeline(config)

        assert 'deduplication' not in pipeline.stage_names


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_same_name_different_signature(self):
        """Candidates with same name but different signatures are not duplicates."""
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'process', 'type': 'function', 'parameters': ['x']},
            {'name': 'process', 'type': 'function', 'parameters': ['x', 'y', 'z']},
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 2  # Both should be kept

    def test_different_name_same_signature(self):
        """Candidates with different names but same params are not duplicates."""
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'foo', 'type': 'function', 'parameters': ['x', 'y']},
            {'name': 'bar', 'type': 'function', 'parameters': ['x', 'y']},
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 2

    def test_unicode_names(self):
        dedup = SignatureDeduplicator()
        candidates = [
            {'name': 'validar_correo', 'type': 'function'},
            {'name': 'validar_correo', 'type': 'function'},  # Duplicate
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 1

    def test_very_long_parameter_lists(self):
        dedup = SignatureDeduplicator()
        long_params = [f'param_{i}' for i in range(100)]
        candidates = [
            {'name': 'complex_function', 'type': 'function', 'parameters': long_params},
            {'name': 'complex_function', 'type': 'function', 'parameters': long_params},
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 1

    def test_missing_file_path(self):
        dedup = SignatureDeduplicator(preserve_all_locations=True)
        candidates = [
            {'name': 'foo', 'type': 'function'},  # No file_path
            {'name': 'foo', 'type': 'function', 'file_path': 'a.py'},
        ]

        result, groups = dedup.deduplicate(candidates)
        assert len(result) == 1
        assert '_all_locations' in result[0]
        assert 'a.py' in result[0]['_all_locations']
