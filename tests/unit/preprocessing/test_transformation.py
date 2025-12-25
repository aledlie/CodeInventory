"""Tests for the transformation preprocessing stage."""
import pytest

from src.analyzers.preprocessing.config import TransformationConfig
from src.analyzers.preprocessing.stages.transformation import (
    DependencyResolver,
    DependencyType,
    DependencyGraph,
    ResolvedDependency,
    PatternDetector,
    PatternMatch,
    UtilityPattern,
    ComplexityCalculator,
    ComplexityMetrics,
    TransformationStage,
)


class TestDependencyResolver:
    """Tests for DependencyResolver."""

    def test_init_default(self):
        resolver = DependencyResolver()
        assert resolver.project_modules == set()

    def test_init_with_project_modules(self):
        resolver = DependencyResolver(project_modules={'myapp', 'utils'})
        assert resolver.project_modules == {'myapp', 'utils'}

    def test_resolve_empty_list(self):
        resolver = DependencyResolver()
        result = resolver.resolve([])
        assert isinstance(result, DependencyGraph)
        assert len(result.dependencies) == 0
        assert result.internal_count == 0
        assert result.external_count == 0
        assert result.stdlib_count == 0

    def test_resolve_stdlib_dependency(self):
        resolver = DependencyResolver()
        result = resolver.resolve(['os', 'sys', 'json'])

        assert result.stdlib_count == 3
        assert result.external_count == 0
        assert result.internal_count == 0

        for dep in result.dependencies:
            assert dep.type == DependencyType.STDLIB

    def test_resolve_external_dependency(self):
        resolver = DependencyResolver()
        result = resolver.resolve(['numpy', 'pandas', 'requests'])

        assert result.external_count == 3
        assert result.stdlib_count == 0

        for dep in result.dependencies:
            assert dep.type == DependencyType.EXTERNAL

    def test_resolve_internal_project_module(self):
        resolver = DependencyResolver(project_modules={'myapp'})
        result = resolver.resolve(['myapp.utils', 'myapp.models'])

        assert result.internal_count == 2
        assert result.external_count == 0

        for dep in result.dependencies:
            assert dep.type == DependencyType.INTERNAL

    def test_resolve_relative_import(self):
        resolver = DependencyResolver()
        result = resolver.resolve(['.utils', '..models', '.'])

        assert result.internal_count == 3

        for dep in result.dependencies:
            assert dep.type == DependencyType.INTERNAL

    def test_resolve_path_like_dependency(self):
        resolver = DependencyResolver()
        result = resolver.resolve(['src/utils/helpers.py', 'lib/core.py'])

        assert result.internal_count == 2

        for dep in result.dependencies:
            assert dep.type == DependencyType.INTERNAL

    def test_resolve_mixed_dependencies(self):
        resolver = DependencyResolver(project_modules={'myapp'})
        result = resolver.resolve([
            'os',          # stdlib
            'numpy',       # external
            'myapp.core',  # internal (project module)
            '.utils',      # internal (relative)
        ])

        assert result.stdlib_count == 1
        assert result.external_count == 1
        assert result.internal_count == 2
        assert len(result.dependencies) == 4

    def test_resolve_unknown_dependency(self):
        resolver = DependencyResolver()
        result = resolver.resolve(['some_unknown_package'])

        assert len(result.dependencies) == 1
        assert result.dependencies[0].type == DependencyType.UNKNOWN

    def test_resolve_filters_empty_strings(self):
        resolver = DependencyResolver()
        result = resolver.resolve(['os', '', None, 'sys'])

        assert len(result.dependencies) == 2

    def test_dependency_graph_to_dict(self):
        resolver = DependencyResolver()
        result = resolver.resolve(['os', 'numpy'])

        d = result.to_dict()
        assert 'dependencies' in d
        assert 'counts' in d
        assert d['counts']['total'] == 2
        assert len(d['dependencies']) == 2

        for dep in d['dependencies']:
            assert 'name' in dep
            assert 'type' in dep
            assert 'is_direct' in dep

    def test_extract_module_path_dotted(self):
        resolver = DependencyResolver()
        path = resolver._extract_module_path('myapp.utils.helpers')
        assert path == 'myapp/utils/helpers'

    def test_extract_module_path_with_slashes(self):
        resolver = DependencyResolver()
        path = resolver._extract_module_path('src/utils/helpers.py')
        assert path == 'src/utils/helpers.py'


class TestPatternDetector:
    """Tests for PatternDetector."""

    def test_init_default(self):
        detector = PatternDetector()
        assert detector.min_confidence == 0.3

    def test_init_custom_confidence(self):
        detector = PatternDetector(min_confidence=0.5)
        assert detector.min_confidence == 0.5

    def test_detect_caching_pattern_by_name(self):
        detector = PatternDetector()
        matches = detector.detect('cache_result')

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.CACHING in pattern_names

    def test_detect_caching_pattern_by_dependency(self):
        detector = PatternDetector()
        matches = detector.detect('get_data', dependencies=['functools'])

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.CACHING in pattern_names

    def test_detect_validation_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('validate_email')

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.VALIDATION in pattern_names

    def test_detect_error_handling_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('handle_exception')

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.ERROR_HANDLING in pattern_names

    def test_detect_logging_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('log_event', dependencies=['logging'])

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.LOGGING in pattern_names

    def test_detect_retry_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('retry_with_backoff')

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.RETRY_LOGIC in pattern_names

    def test_detect_http_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('fetch_api_data', dependencies=['requests'])

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.HTTP_OPERATIONS in pattern_names

    def test_detect_database_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('execute_query', dependencies=['sqlalchemy'])

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.DATABASE_OPERATIONS in pattern_names

    def test_detect_file_operations_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('read_config_file')

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.FILE_OPERATIONS in pattern_names

    def test_detect_async_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('async_fetch', dependencies=['asyncio'])

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.ASYNC_OPERATIONS in pattern_names

    def test_detect_serialization_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('to_json')

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.SERIALIZATION in pattern_names

    def test_detect_parsing_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('parse_response')

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.PARSING in pattern_names

    def test_detect_datetime_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('get_timestamp', dependencies=['datetime'])

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.DATE_TIME in pattern_names

    def test_detect_encryption_pattern(self):
        detector = PatternDetector()
        matches = detector.detect('encrypt_password', dependencies=['hashlib'])

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.ENCRYPTION in pattern_names

    def test_detect_multiple_patterns(self):
        detector = PatternDetector()
        matches = detector.detect(
            'validate_and_cache',
            description='Validates input and caches result'
        )

        pattern_names = [m.pattern for m in matches]
        assert len(matches) >= 2
        assert UtilityPattern.VALIDATION in pattern_names
        assert UtilityPattern.CACHING in pattern_names

    def test_detect_by_description(self):
        detector = PatternDetector(min_confidence=0.2)  # Lower threshold for description-only
        matches = detector.detect(
            'process_data',
            description='Validates user input data'
        )

        pattern_names = [m.pattern for m in matches]
        assert UtilityPattern.VALIDATION in pattern_names

    def test_detect_no_patterns(self):
        detector = PatternDetector()
        matches = detector.detect('foo_bar_baz')

        assert len(matches) == 0

    def test_detect_respects_min_confidence(self):
        detector = PatternDetector(min_confidence=0.9)
        matches = detector.detect('validate')  # Only name match = 0.5 confidence

        assert len(matches) == 0

    def test_detect_sorted_by_confidence(self):
        detector = PatternDetector()
        matches = detector.detect(
            'cache_validation',
            dependencies=['functools', 'pydantic'],
            description='Cache validated results'
        )

        if len(matches) >= 2:
            confidences = [m.confidence for m in matches]
            assert confidences == sorted(confidences, reverse=True)

    def test_pattern_match_to_dict(self):
        match = PatternMatch(
            pattern=UtilityPattern.CACHING,
            confidence=0.8,
            evidence=['name matches cache']
        )

        d = match.to_dict()
        assert d['pattern'] == 'caching'
        assert d['confidence'] == 0.8
        assert 'name matches cache' in d['evidence']


class TestComplexityCalculator:
    """Tests for ComplexityCalculator."""

    def test_calculate_basic(self):
        calculator = ComplexityCalculator()
        candidate = {
            'name': 'process_data',
            'modularity_score': 0.8,
            'reusability_score': 0.7,
        }

        result = calculator.calculate(candidate)

        assert isinstance(result, ComplexityMetrics)
        assert result.modularity_score == 0.8
        assert result.reusability_score == 0.7

    def test_calculate_string_modularity_score(self):
        calculator = ComplexityCalculator()
        candidate = {
            'name': 'process_data',
            'modularity_score': 'highly_modular',
        }

        result = calculator.calculate(candidate)
        assert result.modularity_score == 0.9

    def test_calculate_with_dependency_graph(self):
        calculator = ComplexityCalculator()
        candidate = {'name': 'fetch_data'}

        dep_graph = DependencyGraph(
            dependencies=[
                ResolvedDependency('requests', DependencyType.EXTERNAL),
                ResolvedDependency('json', DependencyType.STDLIB),
                ResolvedDependency('.utils', DependencyType.INTERNAL),
            ],
            internal_count=1,
            external_count=1,
            stdlib_count=1,
        )

        result = calculator.calculate(candidate, dependency_graph=dep_graph)

        assert result.dependency_count == 3
        assert result.internal_dependency_ratio == pytest.approx(1/3)
        assert result.external_dependency_ratio == pytest.approx(1/3)

    def test_calculate_with_patterns(self):
        calculator = ComplexityCalculator()
        candidate = {'name': 'cache_data'}

        patterns = [
            PatternMatch(UtilityPattern.CACHING, 0.8, ['name']),
            PatternMatch(UtilityPattern.SERIALIZATION, 0.5, ['desc']),
        ]

        result = calculator.calculate(candidate, patterns=patterns)

        assert result.pattern_count == 2
        assert result.primary_pattern == 'caching'
        assert result.pattern_confidence == 0.8

    def test_calculate_abstraction_level_high(self):
        calculator = ComplexityCalculator()
        candidate = {'name': 'BaseServiceFactory'}

        result = calculator.calculate(candidate)
        assert result.abstraction_level == 'high'

    def test_calculate_abstraction_level_medium(self):
        calculator = ComplexityCalculator()
        candidate = {'name': 'UserService'}

        result = calculator.calculate(candidate)
        assert result.abstraction_level == 'medium'

    def test_calculate_abstraction_level_low(self):
        calculator = ComplexityCalculator()
        candidate = {'name': 'add_numbers'}

        result = calculator.calculate(candidate)
        assert result.abstraction_level == 'low'

    def test_calculate_coupling_score_high_external(self):
        calculator = ComplexityCalculator()
        candidate = {'name': 'fetch_all'}

        dep_graph = DependencyGraph(
            dependencies=[
                ResolvedDependency('numpy', DependencyType.EXTERNAL),
                ResolvedDependency('pandas', DependencyType.EXTERNAL),
                ResolvedDependency('requests', DependencyType.EXTERNAL),
            ],
            internal_count=0,
            external_count=3,
            stdlib_count=0,
        )

        result = calculator.calculate(candidate, dependency_graph=dep_graph)

        assert result.coupling_score == 1.0  # High coupling with all external

    def test_calculate_coupling_score_low_external(self):
        calculator = ComplexityCalculator()
        candidate = {'name': 'process_internal'}

        dep_graph = DependencyGraph(
            dependencies=[
                ResolvedDependency('.core', DependencyType.INTERNAL),
                ResolvedDependency('.utils', DependencyType.INTERNAL),
            ],
            internal_count=2,
            external_count=0,
            stdlib_count=0,
        )

        result = calculator.calculate(candidate, dependency_graph=dep_graph)

        assert result.coupling_score == 0.0  # Low coupling with no external

    def test_calculate_utility_score(self):
        calculator = ComplexityCalculator()
        candidate = {
            'name': 'validate_input',
            'modularity_score': 0.9,
            'reusability_score': 0.8,
        }

        patterns = [PatternMatch(UtilityPattern.VALIDATION, 0.9, ['name'])]

        result = calculator.calculate(candidate, patterns=patterns)

        assert result.utility_score > 0.0
        assert result.utility_score <= 1.0

    def test_normalize_score_float(self):
        calculator = ComplexityCalculator()
        assert calculator._normalize_score(0.75) == 0.75

    def test_normalize_score_int(self):
        calculator = ComplexityCalculator()
        assert calculator._normalize_score(1) == 1.0

    def test_normalize_score_string_mapped(self):
        calculator = ComplexityCalculator()
        assert calculator._normalize_score('highly_modular') == 0.9
        assert calculator._normalize_score('modular') == 0.7
        assert calculator._normalize_score('somewhat_modular') == 0.5
        assert calculator._normalize_score('not_modular') == 0.2

    def test_normalize_score_string_numeric(self):
        calculator = ComplexityCalculator()
        assert calculator._normalize_score('0.75') == 0.75

    def test_normalize_score_invalid(self):
        calculator = ComplexityCalculator()
        assert calculator._normalize_score('invalid_value') == 0.0
        assert calculator._normalize_score(None) == 0.0

    def test_complexity_metrics_to_dict(self):
        metrics = ComplexityMetrics(
            modularity_score=0.8,
            reusability_score=0.7,
            dependency_count=5,
            pattern_count=2,
            primary_pattern='caching',
            abstraction_level='medium',
            utility_score=0.65,
        )

        d = metrics.to_dict()
        assert d['modularity_score'] == 0.8
        assert d['pattern_count'] == 2
        assert d['primary_pattern'] == 'caching'
        assert d['abstraction_level'] == 'medium'


class TestTransformationStage:
    """Tests for TransformationStage."""

    @pytest.fixture
    def default_config(self):
        return TransformationConfig()

    @pytest.fixture
    def sample_report(self):
        return {
            'summary': {
                'root_directory': '/home/user/project',
                'files_analyzed': 10,
            },
            'tool_candidates': [
                {
                    'name': 'cache_result',
                    'type': 'function',
                    'file_path': 'src/utils/cache.py',
                    'description': 'Caches function results using memoization',
                    'dependencies': ['functools', 'typing', '.helpers'],
                    'modularity_score': 0.85,
                    'reusability_score': 0.9,
                },
                {
                    'name': 'validate_email',
                    'type': 'function',
                    'file_path': 'src/validators/email.py',
                    'description': 'Validates email format',
                    'dependencies': ['re', 'typing'],
                    'modularity_score': 0.7,
                    'reusability_score': 0.8,
                },
                {
                    'name': 'fetch_api_data',
                    'type': 'function',
                    'file_path': 'src/api/client.py',
                    'description': 'Fetches data from REST API',
                    'dependencies': ['requests', 'json', 'logging'],
                    'modularity_score': 0.6,
                    'reusability_score': 0.7,
                },
            ],
            'utility_modules': [
                {
                    'file_path': 'src/utils/helpers.py',
                    'function_count': 5,
                },
            ],
        }

    def test_stage_name(self, default_config):
        stage = TransformationStage(default_config)
        assert stage.name == 'transformation'

    def test_validate_input_valid(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        is_valid, errors = stage.validate_input(sample_report)
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_input_invalid_not_dict(self, default_config):
        stage = TransformationStage(default_config)
        is_valid, errors = stage.validate_input([1, 2, 3])
        assert is_valid is False
        assert len(errors) > 0

    def test_validate_input_missing_keys(self, default_config):
        stage = TransformationStage(default_config)
        is_valid, errors = stage.validate_input({'random': 'data'})
        assert is_valid is False

    def test_process_resolves_dependencies(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        for candidate in candidates:
            assert '_dependency_graph' in candidate
            graph = candidate['_dependency_graph']
            assert 'dependencies' in graph
            assert 'counts' in graph

    def test_process_detects_patterns(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        # cache_result should have caching pattern
        cache_candidate = next(c for c in candidates if c['name'] == 'cache_result')
        assert '_patterns' in cache_candidate
        pattern_names = [p['pattern'] for p in cache_candidate['_patterns']]
        assert 'caching' in pattern_names

        # validate_email should have validation pattern
        validate_candidate = next(c for c in candidates if c['name'] == 'validate_email')
        assert '_patterns' in validate_candidate
        pattern_names = [p['pattern'] for p in validate_candidate['_patterns']]
        assert 'validation' in pattern_names

    def test_process_calculates_complexity(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        for candidate in candidates:
            assert '_complexity' in candidate
            complexity = candidate['_complexity']
            assert 'modularity_score' in complexity
            assert 'reusability_score' in complexity
            assert 'abstraction_level' in complexity
            assert 'utility_score' in complexity

    def test_process_metrics(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        result = stage.process(sample_report)

        assert 'dependencies_resolved' in result.metrics
        assert 'patterns_detected' in result.metrics
        assert 'complexity_calculated' in result.metrics
        assert 'pattern_distribution' in result.metrics

        assert result.metrics['dependencies_resolved'] == 3
        assert result.metrics['complexity_calculated'] == 3
        assert result.metrics['patterns_detected'] > 0

    def test_process_disabled_dependency_resolution(self, sample_report):
        config = TransformationConfig(resolve_dependencies=False)
        stage = TransformationStage(config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        for candidate in candidates:
            assert '_dependency_graph' not in candidate

    def test_process_disabled_pattern_detection(self, sample_report):
        config = TransformationConfig(detect_patterns=False)
        stage = TransformationStage(config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        for candidate in candidates:
            assert '_patterns' not in candidate

    def test_process_disabled_complexity_calculation(self, sample_report):
        config = TransformationConfig(calculate_complexity=False)
        stage = TransformationStage(config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        for candidate in candidates:
            assert '_complexity' not in candidate

    def test_process_extracts_project_modules(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        modules = stage._extract_project_modules(sample_report)

        # Should extract 'utils' from 'src/utils/helpers.py'
        assert 'utils' in modules
        # 'helpers.py' includes extension, which is expected behavior
        assert any('helpers' in m for m in modules)

    def test_process_empty_candidates(self, default_config):
        stage = TransformationStage(default_config)
        data = {
            'summary': {'files_analyzed': 0},
            'tool_candidates': [],
            'utility_modules': [],
        }

        result = stage.process(data)

        assert result.success is True
        assert result.data['tool_candidates'] == []

    def test_process_preserves_original_data(self, default_config, sample_report):
        stage = TransformationStage(default_config)

        # Make copies to compare
        original_name = sample_report['tool_candidates'][0]['name']
        original_deps = sample_report['tool_candidates'][0]['dependencies'].copy()

        result = stage.process(sample_report)

        # Original should be unchanged
        assert sample_report['tool_candidates'][0]['name'] == original_name
        assert sample_report['tool_candidates'][0]['dependencies'] == original_deps

        # Result should have transformation data
        assert '_dependency_graph' in result.data['tool_candidates'][0]

    def test_process_pattern_distribution(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        result = stage.process(sample_report)

        pattern_dist = result.metrics.get('pattern_distribution', {})
        assert isinstance(pattern_dist, dict)
        # Should have at least caching and validation patterns
        assert len(pattern_dist) >= 2

    def test_run_adds_timing_metrics(self, default_config, sample_report):
        stage = TransformationStage(default_config)
        result = stage.run(sample_report)

        assert 'duration_ms' in result.metrics
        assert 'stage_name' in result.metrics
        assert result.metrics['stage_name'] == 'transformation'

    def test_process_with_string_scores(self, default_config):
        """Test that string modularity/reusability scores are handled."""
        stage = TransformationStage(default_config)
        data = {
            'summary': {'files_analyzed': 1},
            'tool_candidates': [
                {
                    'name': 'test_function',
                    'type': 'function',
                    'file_path': 'test.py',
                    'dependencies': [],
                    'modularity_score': 'highly_modular',
                    'reusability_score': 'reusable',
                },
            ],
            'utility_modules': [],
        }

        result = stage.process(data)

        assert result.success is True
        complexity = result.data['tool_candidates'][0]['_complexity']
        assert complexity['modularity_score'] == 0.9
        assert complexity['reusability_score'] == 0.7


class TestTransformationStageIntegration:
    """Integration tests for TransformationStage with pipeline."""

    def test_transformation_stage_in_pipeline(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        config.cleaning.enabled = False  # Disable cleaning for this test

        pipeline = PreprocessingPipeline(config)

        assert 'transformation' in pipeline.stage_names

    def test_full_pipeline_with_transformation(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        data = {
            'summary': {'root_directory': '/project', 'files_analyzed': 1},
            'tool_candidates': [
                {
                    'name': 'validate_input',
                    'type': 'function',
                    'file_path': 'src\\validators\\input.py',  # Windows path
                    'description': 'Validates $NAME input',  # Meta variable
                    'dependencies': ['pydantic', 'typing'],
                    'modularity_score': 'modular',
                },
            ],
            'utility_modules': [],
        }

        result = pipeline.process(data)

        assert result.success is True
        assert 'cleaning' in result.stages_run
        assert 'transformation' in result.stages_run

        candidate = result.data['tool_candidates'][0]

        # Cleaning should have normalized path
        assert '\\' not in candidate['file_path']

        # Cleaning should have removed meta variable
        assert '$NAME' not in candidate['description']

        # Transformation should have added enrichment
        assert '_dependency_graph' in candidate
        assert '_patterns' in candidate
        assert '_complexity' in candidate
