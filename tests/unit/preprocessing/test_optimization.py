"""Tests for the dashboard optimization preprocessing stage."""
import pytest

from src.analyzers.preprocessing.config import DashboardConfig
from src.analyzers.preprocessing.stages.optimization import (
    DashboardOptimizationStage,
    ChartData,
    ChartDataBuilder,
    DashboardData,
)
from src.analyzers.preprocessing.utils.indexing import (
    IndexBuilder,
    Index,
    SearchIndex,
    PaginationMeta,
    IndexEntry,
)


class TestIndexEntry:
    """Tests for IndexEntry."""

    def test_init(self):
        entry = IndexEntry(key='test', indices=[0, 1, 2])
        assert entry.key == 'test'
        assert entry.indices == [0, 1, 2]
        assert entry.count == 3

    def test_to_dict(self):
        entry = IndexEntry(key='test', indices=[0, 1])
        d = entry.to_dict()
        assert d['key'] == 'test'
        assert d['indices'] == [0, 1]
        assert d['count'] == 2


class TestIndex:
    """Tests for Index."""

    def test_init(self):
        index = Index(
            name='by_type',
            entries={'function': [0, 1], 'class': [2, 3]},
            total_items=4,
        )
        assert index.name == 'by_type'
        assert index.unique_keys == 2
        assert index.total_items == 4

    def test_get(self):
        index = Index(
            name='by_type',
            entries={'function': [0, 1], 'class': [2]},
            total_items=3,
        )
        assert index.get('function') == [0, 1]
        assert index.get('class') == [2]
        assert index.get('nonexistent') == []

    def test_keys(self):
        index = Index(
            name='by_type',
            entries={'function': [0], 'class': [1]},
            total_items=2,
        )
        keys = index.keys()
        assert 'function' in keys
        assert 'class' in keys

    def test_to_dict(self):
        index = Index(
            name='by_type',
            entries={'function': [0, 1]},
            total_items=2,
        )
        d = index.to_dict()
        assert d['name'] == 'by_type'
        assert d['entries'] == {'function': [0, 1]}
        assert d['total_items'] == 2
        assert d['unique_keys'] == 1


class TestSearchIndex:
    """Tests for SearchIndex."""

    def test_init(self):
        search_index = SearchIndex(
            terms={'test': [0, 1], 'data': [2]},
            total_items=3,
        )
        assert search_index.total_terms == 2
        assert search_index.total_items == 3

    def test_search_exact_match(self):
        search_index = SearchIndex(
            terms={'cache': [0, 2], 'validate': [1, 3]},
            total_items=4,
        )
        result = search_index.search('cache')
        assert 0 in result
        assert 2 in result

    def test_search_prefix_match(self):
        search_index = SearchIndex(
            terms={'cached': [0], 'cache_data': [1], 'cache': [2]},
            total_items=3,
        )
        # Searching for 'cache' should find exact match and terms starting with 'cache'
        result = search_index.search('cache')
        assert 0 in result  # 'cached' starts with 'cache'
        assert 1 in result  # 'cache_data' starts with 'cache'
        assert 2 in result  # 'cache' is exact match

    def test_search_multiple_terms(self):
        search_index = SearchIndex(
            terms={'cache': [0, 1, 2], 'data': [0, 2, 3]},
            total_items=4,
        )
        result = search_index.search('cache data')
        # Should return items matching both terms
        assert 0 in result
        assert 2 in result
        assert 1 not in result  # Only has 'cache'
        assert 3 not in result  # Only has 'data'

    def test_search_no_match(self):
        search_index = SearchIndex(
            terms={'cache': [0]},
            total_items=1,
        )
        result = search_index.search('nonexistent')
        assert result == []

    def test_search_empty_query(self):
        search_index = SearchIndex(terms={'cache': [0]}, total_items=1)
        result = search_index.search('')
        assert result == []

    def test_to_dict(self):
        search_index = SearchIndex(
            terms={'test': [0]},
            total_items=1,
        )
        d = search_index.to_dict()
        assert 'terms' in d
        assert 'total_items' in d
        assert 'total_terms' in d


class TestPaginationMeta:
    """Tests for PaginationMeta."""

    def test_init(self):
        pagination = PaginationMeta(total_items=100, page_size=20)
        assert pagination.total_items == 100
        assert pagination.page_size == 20
        assert pagination.total_pages == 5

    def test_init_partial_page(self):
        pagination = PaginationMeta(total_items=55, page_size=20)
        assert pagination.total_pages == 3

    def test_page_ranges(self):
        pagination = PaginationMeta(total_items=55, page_size=20)
        assert pagination.page_ranges[0] == (0, 20)
        assert pagination.page_ranges[1] == (20, 40)
        assert pagination.page_ranges[2] == (40, 55)

    def test_get_page_range(self):
        pagination = PaginationMeta(total_items=100, page_size=25)
        assert pagination.get_page_range(0) == (0, 25)
        assert pagination.get_page_range(1) == (25, 50)
        assert pagination.get_page_range(3) == (75, 100)
        assert pagination.get_page_range(10) == (0, 0)  # Out of range

    def test_empty_pagination(self):
        pagination = PaginationMeta(total_items=0, page_size=20)
        assert pagination.total_pages == 0
        assert pagination.page_ranges == []

    def test_to_dict(self):
        pagination = PaginationMeta(total_items=50, page_size=20)
        d = pagination.to_dict()
        assert d['total_items'] == 50
        assert d['page_size'] == 20
        assert d['total_pages'] == 3
        assert len(d['page_ranges']) == 3


class TestIndexBuilder:
    """Tests for IndexBuilder."""

    @pytest.fixture
    def sample_items(self):
        return [
            {'name': 'cache_result', 'type': 'function', 'modularity_score': 0.9},
            {'name': 'validate_email', 'type': 'function', 'modularity_score': 0.7},
            {'name': 'UserService', 'type': 'class', 'modularity_score': 0.5},
            {'name': 'DataProcessor', 'type': 'class', 'modularity_score': 0.3},
        ]

    def test_build_categorical_index(self, sample_items):
        builder = IndexBuilder()
        index = builder.build_categorical_index(sample_items, 'type')

        assert 'function' in index.entries
        assert 'class' in index.entries
        assert index.entries['function'] == [0, 1]
        assert index.entries['class'] == [2, 3]

    def test_build_categorical_index_with_name(self, sample_items):
        builder = IndexBuilder()
        index = builder.build_categorical_index(sample_items, 'type', name='custom_name')
        assert index.name == 'custom_name'

    def test_build_categorical_index_missing_field(self):
        builder = IndexBuilder()
        items = [{'name': 'test'}, {'name': 'test2', 'type': 'function'}]
        index = builder.build_categorical_index(items, 'type')
        assert 'unknown' in index.entries
        assert 'function' in index.entries

    def test_build_range_index(self, sample_items):
        builder = IndexBuilder()
        ranges = [
            ('low', 0.0, 0.5),
            ('medium', 0.5, 0.8),
            ('high', 0.8, 1.0),
        ]
        index = builder.build_range_index(sample_items, 'modularity_score', ranges)

        assert 'high' in index.entries
        assert 'medium' in index.entries
        assert 'low' in index.entries
        assert 0 in index.entries['high']  # 0.9
        assert 1 in index.entries['medium']  # 0.7
        assert 2 in index.entries['low']  # 0.5
        assert 3 in index.entries['low']  # 0.3

    def test_build_multi_value_index(self):
        builder = IndexBuilder()
        items = [
            {'name': 'a', 'tags': ['api', 'http']},
            {'name': 'b', 'tags': ['api', 'database']},
            {'name': 'c', 'tags': ['database']},
        ]
        index = builder.build_multi_value_index(items, 'tags')

        assert 'api' in index.entries
        assert 'http' in index.entries
        assert 'database' in index.entries
        assert index.entries['api'] == [0, 1]
        assert index.entries['database'] == [1, 2]

    def test_build_search_index(self, sample_items):
        builder = IndexBuilder()
        search_index = builder.build_search_index(sample_items, fields=['name', 'type'])

        assert 'cache' in search_index.terms
        assert 'result' in search_index.terms
        assert 'validate' in search_index.terms
        assert 'function' in search_index.terms
        assert 'class' in search_index.terms

    def test_build_search_index_tokenizes_camel_case(self):
        builder = IndexBuilder()
        items = [{'name': 'UserServiceManager'}]
        search_index = builder.build_search_index(items, fields=['name'])

        assert 'user' in search_index.terms
        assert 'service' in search_index.terms
        assert 'manager' in search_index.terms

    def test_build_search_index_handles_list_values(self):
        builder = IndexBuilder()
        items = [{'name': 'test', 'tags': ['api', 'http']}]
        search_index = builder.build_search_index(items, fields=['name', 'tags'])

        assert 'test' in search_index.terms
        assert 'api' in search_index.terms
        assert 'http' in search_index.terms

    def test_build_pagination_meta(self, sample_items):
        builder = IndexBuilder()
        pagination = builder.build_pagination_meta(sample_items, page_size=2)

        assert pagination.total_items == 4
        assert pagination.page_size == 2
        assert pagination.total_pages == 2

    def test_build_composite_index(self):
        builder = IndexBuilder()
        items = [
            {'type': 'function', 'modularity': 'high'},
            {'type': 'function', 'modularity': 'low'},
            {'type': 'class', 'modularity': 'high'},
        ]
        index = builder.build_composite_index(items, ['type', 'modularity'])

        assert 'function:high' in index.entries
        assert 'function:low' in index.entries
        assert 'class:high' in index.entries


class TestChartData:
    """Tests for ChartData."""

    def test_init(self):
        chart = ChartData(
            name='test_chart',
            type='pie',
            data=[{'label': 'A', 'value': 10}],
            labels=['A'],
            colors=['#ff0000'],
        )
        assert chart.name == 'test_chart'
        assert chart.type == 'pie'
        assert len(chart.data) == 1

    def test_to_dict(self):
        chart = ChartData(
            name='test_chart',
            type='bar',
            data=[{'label': 'A', 'value': 5}],
            labels=['A'],
            colors=['#00ff00'],
        )
        d = chart.to_dict()
        assert d['name'] == 'test_chart'
        assert d['type'] == 'bar'
        assert d['data'] == [{'label': 'A', 'value': 5}]


class TestChartDataBuilder:
    """Tests for ChartDataBuilder."""

    @pytest.fixture
    def sample_candidates(self):
        return [
            {
                'name': 'cache_result',
                'type': 'function',
                '_complexity': {'modularity_score': 0.9, 'utility_score': 0.8, 'abstraction_level': 'low'},
                '_patterns': [{'pattern': 'caching', 'confidence': 0.9}],
                '_dependency_graph': {'counts': {'internal': 2, 'external': 1, 'stdlib': 3}},
            },
            {
                'name': 'validate_email',
                'type': 'function',
                '_complexity': {'modularity_score': 0.7, 'utility_score': 0.6, 'abstraction_level': 'medium'},
                '_patterns': [{'pattern': 'validation', 'confidence': 0.8}],
                '_dependency_graph': {'counts': {'internal': 1, 'external': 0, 'stdlib': 2}},
            },
            {
                'name': 'UserService',
                'type': 'class',
                '_complexity': {'modularity_score': 0.5, 'utility_score': 0.4, 'abstraction_level': 'high'},
                '_patterns': [],
                '_dependency_graph': {'counts': {'internal': 5, 'external': 2, 'stdlib': 1}},
            },
        ]

    def test_build_modularity_chart(self, sample_candidates):
        builder = ChartDataBuilder()
        chart = builder.build_modularity_chart(sample_candidates)

        assert chart.name == 'modularity_distribution'
        assert chart.type == 'donut'
        assert len(chart.data) > 0

        # Check that we have expected categories
        labels = [d['label'] for d in chart.data]
        assert any('Modular' in label for label in labels)

    def test_build_modularity_chart_with_numeric_scores(self):
        builder = ChartDataBuilder()
        candidates = [
            {'_complexity': {'modularity_score': 0.95}},  # highly_modular
            {'_complexity': {'modularity_score': 0.65}},  # modular
            {'_complexity': {'modularity_score': 0.45}},  # somewhat_modular
            {'_complexity': {'modularity_score': 0.25}},  # not_modular
        ]
        chart = builder.build_modularity_chart(candidates)

        keys = [d['key'] for d in chart.data]
        assert 'highly_modular' in keys
        assert 'modular' in keys
        assert 'somewhat_modular' in keys
        assert 'not_modular' in keys

    def test_build_pattern_chart(self, sample_candidates):
        builder = ChartDataBuilder()
        chart = builder.build_pattern_chart(sample_candidates)

        assert chart.name == 'pattern_distribution'
        assert chart.type == 'bar'

        keys = [d['key'] for d in chart.data]
        assert 'caching' in keys
        assert 'validation' in keys

    def test_build_pattern_chart_empty_patterns(self):
        builder = ChartDataBuilder()
        candidates = [{'_patterns': []}, {'_patterns': []}]
        chart = builder.build_pattern_chart(candidates)

        assert chart.data == []

    def test_build_type_chart(self, sample_candidates):
        builder = ChartDataBuilder()
        chart = builder.build_type_chart(sample_candidates)

        assert chart.name == 'type_distribution'
        assert chart.type == 'pie'

        keys = [d['key'] for d in chart.data]
        assert 'function' in keys
        assert 'class' in keys

    def test_build_complexity_chart(self, sample_candidates):
        builder = ChartDataBuilder()
        chart = builder.build_complexity_chart(sample_candidates)

        assert chart.name == 'utility_score_distribution'
        assert chart.type == 'bar'
        assert len(chart.data) == 5  # 5 ranges

    def test_build_abstraction_chart(self, sample_candidates):
        builder = ChartDataBuilder()
        chart = builder.build_abstraction_chart(sample_candidates)

        assert chart.name == 'abstraction_level_distribution'
        assert chart.type == 'donut'

        keys = [d['key'] for d in chart.data]
        assert 'low' in keys
        assert 'medium' in keys
        assert 'high' in keys

    def test_build_dependency_chart(self, sample_candidates):
        builder = ChartDataBuilder()
        chart = builder.build_dependency_chart(sample_candidates)

        assert chart.name == 'dependency_type_distribution'
        assert chart.type == 'pie'

        keys = [d['key'] for d in chart.data]
        assert 'internal' in keys
        assert 'stdlib' in keys
        assert 'external' in keys


class TestDashboardData:
    """Tests for DashboardData."""

    def test_to_dict(self):
        data = DashboardData(
            indexes={'by_type': {'function': [0, 1]}},
            search_index={'test': [0]},
            charts={'chart1': {'name': 'chart1', 'data': []}},
            pagination={'total_items': 10, 'page_size': 5},
        )
        d = data.to_dict()

        assert 'indexes' in d
        assert 'search_index' in d
        assert 'charts' in d
        assert 'pagination' in d


class TestDashboardOptimizationStage:
    """Tests for DashboardOptimizationStage."""

    @pytest.fixture
    def default_config(self):
        return DashboardConfig()

    @pytest.fixture
    def sample_report(self):
        return {
            'summary': {
                'root_directory': '/project',
                'files_analyzed': 3,
            },
            'tool_candidates': [
                {
                    'name': 'cache_result',
                    'type': 'function',
                    'file_path': 'src/utils/cache.py',
                    'description': 'Caches function results',
                    '_complexity': {
                        'modularity_score': 0.9,
                        'utility_score': 0.8,
                        'abstraction_level': 'low',
                    },
                    '_patterns': [{'pattern': 'caching', 'confidence': 0.9}],
                    '_dependency_graph': {
                        'counts': {'internal': 2, 'external': 1, 'stdlib': 3},
                    },
                },
                {
                    'name': 'validate_email',
                    'type': 'function',
                    'file_path': 'src/validators/email.py',
                    'description': 'Validates email format',
                    '_complexity': {
                        'modularity_score': 0.7,
                        'utility_score': 0.6,
                        'abstraction_level': 'medium',
                    },
                    '_patterns': [{'pattern': 'validation', 'confidence': 0.8}],
                    '_dependency_graph': {
                        'counts': {'internal': 1, 'external': 0, 'stdlib': 2},
                    },
                },
                {
                    'name': 'UserService',
                    'type': 'class',
                    'file_path': 'src/services/user.py',
                    'description': 'Manages user operations',
                    '_complexity': {
                        'modularity_score': 0.5,
                        'utility_score': 0.4,
                        'abstraction_level': 'high',
                    },
                    '_patterns': [],
                    '_dependency_graph': {
                        'counts': {'internal': 5, 'external': 2, 'stdlib': 1},
                    },
                },
            ],
            'utility_modules': [],
        }

    def test_stage_name(self, default_config):
        stage = DashboardOptimizationStage(default_config)
        assert stage.name == 'dashboard_optimization'

    def test_validate_input_valid(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        is_valid, errors = stage.validate_input(sample_report)
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_input_invalid_not_dict(self, default_config):
        stage = DashboardOptimizationStage(default_config)
        is_valid, errors = stage.validate_input([1, 2, 3])
        assert is_valid is False

    def test_validate_input_missing_candidates(self, default_config):
        stage = DashboardOptimizationStage(default_config)
        is_valid, errors = stage.validate_input({'summary': {}})
        assert is_valid is False
        assert 'tool_candidates' in errors[0]

    def test_process_adds_dashboard_section(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        assert '_dashboard' in result.data

    def test_process_builds_indexes(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        dashboard = result.data['_dashboard']
        assert 'indexes' in dashboard
        assert 'by_modularity' in dashboard['indexes']
        assert 'by_type' in dashboard['indexes']
        assert 'by_pattern' in dashboard['indexes']
        assert 'by_file' in dashboard['indexes']
        assert 'by_abstraction' in dashboard['indexes']

    def test_process_builds_search_index(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        dashboard = result.data['_dashboard']
        assert 'search_index' in dashboard
        assert len(dashboard['search_index']) > 0

    def test_process_builds_charts(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        dashboard = result.data['_dashboard']
        assert 'charts' in dashboard
        assert 'modularity_distribution' in dashboard['charts']
        assert 'pattern_distribution' in dashboard['charts']
        assert 'type_distribution' in dashboard['charts']
        assert 'utility_score_distribution' in dashboard['charts']
        assert 'abstraction_level_distribution' in dashboard['charts']
        assert 'dependency_type_distribution' in dashboard['charts']

    def test_process_builds_pagination(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        dashboard = result.data['_dashboard']
        assert 'pagination' in dashboard
        assert dashboard['pagination']['total_items'] == 3

    def test_process_metrics(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        assert 'indexes_built' in result.metrics
        assert 'search_terms' in result.metrics
        assert 'charts_generated' in result.metrics

        assert result.metrics['indexes_built'] == 5
        assert result.metrics['charts_generated'] == 6
        assert result.metrics['search_terms'] > 0

    def test_process_disabled_search_index(self, sample_report):
        config = DashboardConfig(build_search_index=False)
        stage = DashboardOptimizationStage(config)
        result = stage.process(sample_report)

        dashboard = result.data['_dashboard']
        assert dashboard['search_index'] == {}
        assert result.metrics['search_terms'] == 0

    def test_process_disabled_charts(self, sample_report):
        config = DashboardConfig(precompute_charts=False)
        stage = DashboardOptimizationStage(config)
        result = stage.process(sample_report)

        dashboard = result.data['_dashboard']
        assert dashboard['charts'] == {}
        assert result.metrics['charts_generated'] == 0

    def test_process_custom_page_size(self, sample_report):
        config = DashboardConfig(page_size=2)
        stage = DashboardOptimizationStage(config)
        result = stage.process(sample_report)

        pagination = result.data['_dashboard']['pagination']
        assert pagination['page_size'] == 2
        assert pagination['total_pages'] == 2  # 3 items / 2 per page

    def test_process_empty_candidates(self, default_config):
        stage = DashboardOptimizationStage(default_config)
        data = {
            'summary': {'files_analyzed': 0},
            'tool_candidates': [],
        }
        result = stage.process(data)

        assert result.success is True
        dashboard = result.data['_dashboard']
        assert dashboard['pagination']['total_items'] == 0

    def test_process_preserves_original_data(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)

        original_name = sample_report['tool_candidates'][0]['name']
        result = stage.process(sample_report)

        assert sample_report['tool_candidates'][0]['name'] == original_name
        assert result.data['tool_candidates'][0]['name'] == original_name

    def test_run_adds_timing_metrics(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.run(sample_report)

        assert 'duration_ms' in result.metrics
        assert 'stage_name' in result.metrics
        assert result.metrics['stage_name'] == 'dashboard_optimization'

    def test_modularity_index_categories(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        by_modularity = result.data['_dashboard']['indexes']['by_modularity']

        # 0.9 -> highly_modular, 0.7 -> modular, 0.5 -> somewhat_modular
        assert 0 in by_modularity.get('highly_modular', [])
        assert 1 in by_modularity.get('modular', [])
        assert 2 in by_modularity.get('somewhat_modular', [])

    def test_pattern_index(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        by_pattern = result.data['_dashboard']['indexes']['by_pattern']

        assert 'caching' in by_pattern
        assert 'validation' in by_pattern
        assert 0 in by_pattern['caching']
        assert 1 in by_pattern['validation']

    def test_abstraction_index(self, default_config, sample_report):
        stage = DashboardOptimizationStage(default_config)
        result = stage.process(sample_report)

        by_abstraction = result.data['_dashboard']['indexes']['by_abstraction']

        assert 'low' in by_abstraction
        assert 'medium' in by_abstraction
        assert 'high' in by_abstraction
        assert 0 in by_abstraction['low']
        assert 1 in by_abstraction['medium']
        assert 2 in by_abstraction['high']


class TestDashboardOptimizationStageIntegration:
    """Integration tests for DashboardOptimizationStage with pipeline."""

    def test_optimization_stage_in_pipeline(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        assert 'dashboard_optimization' in pipeline.stage_names

    def test_full_pipeline_with_optimization(self):
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
                    'file_path': 'src/validators/input.py',
                    'description': 'Validates user input data',
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
        assert 'deduplication' in result.stages_run
        assert 'dashboard_optimization' in result.stages_run

        # Check dashboard data was added
        assert '_dashboard' in result.data
        dashboard = result.data['_dashboard']

        # Verify all components
        assert 'indexes' in dashboard
        assert 'search_index' in dashboard
        assert 'charts' in dashboard
        assert 'pagination' in dashboard

    def test_pipeline_with_disabled_optimization(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        config.dashboard.enabled = False

        pipeline = PreprocessingPipeline(config)

        assert 'dashboard_optimization' not in pipeline.stage_names

    def test_pipeline_stages_order(self):
        from src.analyzers.preprocessing.config import PreprocessingConfig
        from src.analyzers.preprocessing.pipeline import PreprocessingPipeline

        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        stages = pipeline.stage_names

        # Verify order: cleaning -> transformation -> deduplication -> optimization
        assert stages.index('cleaning') < stages.index('transformation')
        assert stages.index('transformation') < stages.index('deduplication')
        assert stages.index('deduplication') < stages.index('dashboard_optimization')
