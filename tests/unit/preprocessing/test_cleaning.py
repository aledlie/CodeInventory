"""Unit tests for cleaning stage and utilities."""
import pytest
from pathlib import Path

from src.analyzers.preprocessing.utils.path_utils import PathNormalizer
from src.analyzers.preprocessing.stages.cleaning import (
    NameNormalizer,
    MetaVariableCleaner,
    CleaningStage,
    NamingConvention,
)
from src.analyzers.preprocessing.config import (
    CleaningConfig,
    PathNormalizerConfig,
)


class TestPathNormalizer:
    """Tests for PathNormalizer utility."""

    def test_default_config(self):
        normalizer = PathNormalizer()
        assert normalizer.config.normalize_separators is True
        assert normalizer.config.relative_to is None

    def test_normalize_separators_backslash_to_forward(self):
        normalizer = PathNormalizer()
        result = normalizer.normalize('src\\analyzers\\identify_tools.py')
        assert result == 'src/analyzers/identify_tools.py'

    def test_normalize_separators_mixed(self):
        normalizer = PathNormalizer()
        result = normalizer.normalize('src/analyzers\\preprocessing/utils\\path.py')
        assert result == 'src/analyzers/preprocessing/utils/path.py'

    def test_normalize_multiple_separators(self):
        normalizer = PathNormalizer()
        result = normalizer.normalize('src//analyzers///identify_tools.py')
        assert result == 'src/analyzers/identify_tools.py'

    def test_make_relative_from_absolute(self):
        config = PathNormalizerConfig(relative_to=Path('/home/user/project'))
        normalizer = PathNormalizer(config)
        result = normalizer.normalize('/home/user/project/src/main.py')
        assert result == 'src/main.py'

    def test_make_relative_not_under_base(self):
        config = PathNormalizerConfig(relative_to=Path('/home/user/project'))
        normalizer = PathNormalizer(config)
        # Path not under base should be unchanged (with separator normalization)
        result = normalizer.normalize('/other/path/file.py')
        assert 'other' in result and 'path' in result

    def test_already_relative_unchanged(self):
        config = PathNormalizerConfig(relative_to=Path('/home/user/project'))
        normalizer = PathNormalizer(config)
        result = normalizer.normalize('src/main.py')
        assert result == 'src/main.py'

    def test_strip_extension(self):
        config = PathNormalizerConfig(strip_extensions=True)
        normalizer = PathNormalizer(config)
        result = normalizer.normalize('src/main.py')
        assert result == 'src/main'

    def test_strip_extension_multiple_dots(self):
        config = PathNormalizerConfig(strip_extensions=True)
        normalizer = PathNormalizer(config)
        result = normalizer.normalize('src/test.spec.py')
        assert result == 'src/test.spec'

    def test_case_insensitive(self):
        config = PathNormalizerConfig(case_sensitive=False)
        normalizer = PathNormalizer(config)
        result = normalizer.normalize('SRC/Main.PY')
        assert result == 'src/main.py'

    def test_normalize_empty_string(self):
        normalizer = PathNormalizer()
        assert normalizer.normalize('') == ''

    def test_normalize_batch(self):
        normalizer = PathNormalizer()
        paths = ['src\\a.py', 'src\\b.py', 'lib\\c.py']
        results = normalizer.normalize_batch(paths)
        assert results == ['src/a.py', 'src/b.py', 'lib/c.py']

    def test_get_relative_depth(self):
        normalizer = PathNormalizer()
        assert normalizer.get_relative_depth('main.py') == 0
        assert normalizer.get_relative_depth('src/main.py') == 1
        assert normalizer.get_relative_depth('src/analyzers/main.py') == 2

    def test_get_directory(self):
        normalizer = PathNormalizer()
        assert normalizer.get_directory('src/analyzers/main.py') == 'src/analyzers'
        assert normalizer.get_directory('main.py') == '.'

    def test_get_filename_with_extension(self):
        normalizer = PathNormalizer()
        assert normalizer.get_filename('src/main.py') == 'main.py'

    def test_get_filename_without_extension(self):
        normalizer = PathNormalizer()
        assert normalizer.get_filename('src/main.py', with_extension=False) == 'main'

    def test_is_python_file(self):
        normalizer = PathNormalizer()
        assert normalizer.is_python_file('main.py') is True
        assert normalizer.is_python_file('main.pyi') is True
        assert normalizer.is_python_file('main.js') is False
        assert normalizer.is_python_file('main.PY') is True  # Case insensitive

    def test_is_typescript_file(self):
        normalizer = PathNormalizer()
        assert normalizer.is_typescript_file('main.ts') is True
        assert normalizer.is_typescript_file('main.tsx') is True
        assert normalizer.is_typescript_file('main.js') is True
        assert normalizer.is_typescript_file('main.jsx') is True
        assert normalizer.is_typescript_file('main.py') is False

    def test_detect_project_root_src(self):
        normalizer = PathNormalizer()
        result = normalizer.detect_project_root('project/src/analyzers/main.py')
        assert result == 'project'

    def test_detect_project_root_lib(self):
        normalizer = PathNormalizer()
        result = normalizer.detect_project_root('myapp/lib/utils/helper.py')
        assert result == 'myapp'

    def test_clean_dot_components(self):
        normalizer = PathNormalizer()
        result = normalizer.normalize('./src/../src/main.py')
        assert 'main.py' in result


class TestNameNormalizer:
    """Tests for NameNormalizer."""

    def test_detect_snake_case(self):
        normalizer = NameNormalizer()
        assert normalizer.detect_convention('my_function_name') == 'snake_case'
        assert normalizer.detect_convention('get_value') == 'snake_case'
        assert normalizer.detect_convention('x') == 'snake_case'

    def test_detect_camel_case(self):
        normalizer = NameNormalizer()
        assert normalizer.detect_convention('myFunctionName') == 'camelCase'
        assert normalizer.detect_convention('getValue') == 'camelCase'

    def test_detect_pascal_case(self):
        normalizer = NameNormalizer()
        assert normalizer.detect_convention('MyClassName') == 'PascalCase'
        assert normalizer.detect_convention('HttpClient') == 'PascalCase'

    def test_detect_kebab_case(self):
        normalizer = NameNormalizer()
        assert normalizer.detect_convention('my-component-name') == 'kebab-case'

    def test_detect_dunder(self):
        normalizer = NameNormalizer()
        assert normalizer.detect_convention('__init__') == 'dunder'
        assert normalizer.detect_convention('__name__') == 'dunder'

    def test_detect_mixed(self):
        normalizer = NameNormalizer()
        # Mixed case patterns
        assert normalizer.detect_convention('my_camelCase') == 'mixed'
        assert normalizer.detect_convention('MyClass_helper') == 'mixed'

    def test_detect_private_name(self):
        normalizer = NameNormalizer()
        # Private names should detect the underlying convention
        assert normalizer.detect_convention('_private_func') == 'snake_case'
        assert normalizer.detect_convention('__very_private') == 'snake_case'
        assert normalizer.detect_convention('_PrivateClass') == 'PascalCase'

    def test_detect_empty_string(self):
        normalizer = NameNormalizer()
        assert normalizer.detect_convention('') == 'unknown'
        assert normalizer.detect_convention(None) == 'unknown'  # type: ignore

    def test_normalize_detect_mode(self):
        normalizer = NameNormalizer(target_convention='detect')
        result = normalizer.normalize('my_function')
        assert result.original == 'my_function'
        assert result.normalized == 'my_function'
        assert result.convention == 'snake_case'
        assert result.is_valid is True

    def test_normalize_to_snake_case(self):
        normalizer = NameNormalizer(target_convention='snake_case')

        # From camelCase
        result = normalizer.normalize('myFunctionName')
        assert result.normalized == 'my_function_name'

        # From PascalCase
        result = normalizer.normalize('MyClassName')
        assert result.normalized == 'my_class_name'

    def test_normalize_to_camel_case(self):
        normalizer = NameNormalizer(target_convention='camelCase')

        # From snake_case
        result = normalizer.normalize('my_function_name')
        assert result.normalized == 'myFunctionName'

        # From PascalCase
        result = normalizer.normalize('MyClassName')
        assert result.normalized == 'myClassName'

    def test_normalize_to_pascal_case(self):
        normalizer = NameNormalizer(target_convention='PascalCase')

        # From snake_case
        result = normalizer.normalize('my_function_name')
        assert result.normalized == 'MyFunctionName'

        # From camelCase
        result = normalizer.normalize('myFunctionName')
        assert result.normalized == 'MyFunctionName'

    def test_normalize_preserves_leading_underscores(self):
        normalizer = NameNormalizer(target_convention='snake_case')

        result = normalizer.normalize('_privateMethod')
        assert result.normalized.startswith('_')

        result = normalizer.normalize('__veryPrivate')
        assert result.normalized.startswith('__')

    def test_normalize_same_convention_unchanged(self):
        normalizer = NameNormalizer(target_convention='snake_case')
        result = normalizer.normalize('already_snake_case')
        assert result.normalized == 'already_snake_case'

    def test_get_convention_stats(self):
        normalizer = NameNormalizer()
        names = ['my_func', 'MyClass', 'getValue', 'another_func']
        stats = normalizer.get_convention_stats(names)
        assert stats['snake_case'] == 2
        assert stats['PascalCase'] == 1
        assert stats['camelCase'] == 1


class TestMetaVariableCleaner:
    """Tests for MetaVariableCleaner."""

    def test_clean_single_meta_var(self):
        cleaner = MetaVariableCleaner()
        result = cleaner.clean('function $NAME is defined')
        assert result == 'function  is defined'

    def test_clean_multi_meta_var(self):
        cleaner = MetaVariableCleaner()
        result = cleaner.clean('$$$BODY contains multiple statements')
        assert result == ' contains multiple statements'

    def test_clean_multiple_meta_vars(self):
        cleaner = MetaVariableCleaner()
        result = cleaner.clean('$NAME takes $PARAMS and returns $TYPE')
        assert result == ' takes  and returns '

    def test_clean_with_replacement(self):
        cleaner = MetaVariableCleaner(replacement='<var>')
        result = cleaner.clean('function $NAME takes $PARAMS')
        assert result == 'function <var> takes <var>'

    def test_clean_no_meta_vars(self):
        cleaner = MetaVariableCleaner()
        original = 'This is a normal description'
        result = cleaner.clean(original)
        assert result == original

    def test_clean_empty_string(self):
        cleaner = MetaVariableCleaner()
        assert cleaner.clean('') == ''
        assert cleaner.clean(None) == ''  # type: ignore

    def test_clean_dict(self):
        cleaner = MetaVariableCleaner()
        data = {
            'name': 'test',
            'description': 'Function $NAME is great',
            'nested': {
                'value': '$VALUE here'
            }
        }
        result = cleaner.clean_dict(data)
        assert result['name'] == 'test'
        assert result['description'] == 'Function  is great'
        assert result['nested']['value'] == ' here'

    def test_clean_list(self):
        cleaner = MetaVariableCleaner()
        data = ['$NAME', 'normal', {'key': '$VALUE'}]
        result = cleaner.clean_list(data)
        assert result[0] == ''
        assert result[1] == 'normal'
        assert result[2]['key'] == ''

    def test_has_meta_variables_true(self):
        cleaner = MetaVariableCleaner()
        assert cleaner.has_meta_variables('Contains $NAME') is True
        assert cleaner.has_meta_variables('Contains $$$BODY') is True

    def test_has_meta_variables_false(self):
        cleaner = MetaVariableCleaner()
        assert cleaner.has_meta_variables('No meta vars here') is False
        assert cleaner.has_meta_variables('') is False
        assert cleaner.has_meta_variables(None) is False  # type: ignore

    def test_extract_meta_variables(self):
        cleaner = MetaVariableCleaner()
        result = cleaner.extract_meta_variables('$NAME takes $PARAMS returns $TYPE')
        assert '$NAME' in result
        assert '$PARAMS' in result
        assert '$TYPE' in result
        assert len(result) == 3


class TestCleaningStage:
    """Tests for CleaningStage."""

    @pytest.fixture
    def default_config(self):
        return CleaningConfig()

    @pytest.fixture
    def sample_report(self):
        """Sample tool identification report for testing."""
        return {
            'summary': {
                'root_directory': '/home/user/project',
                'files_analyzed': 10,
                'total_functions': 50,
                'total_classes': 20,
            },
            'tool_candidates': [
                {
                    'name': 'calculateTotal',
                    'type': 'function',
                    'file_path': '/home/user/project/src\\utils\\math.py',
                    'line_number': 42,
                    'description': 'Function $NAME calculates sum',
                    'dependencies': ['$MODULE', 'numpy'],
                    'modularity_score': 'highly_modular',
                    'extraction_potential': 0.95,
                    'extraction_complexity': 'trivial',
                    'suggested_package_name': 'math-utils',
                    'rationale': 'This $NAME is highly modular',
                },
                {
                    'name': 'DataProcessor',
                    'type': 'class',
                    'file_path': '/home/user/project/src\\processing\\data.py',
                    'line_number': 10,
                    'description': 'Class for processing data',
                    'dependencies': ['pandas'],
                    'modularity_score': 'modular',
                    'extraction_potential': 0.85,
                    'extraction_complexity': 'easy',
                    'suggested_package_name': 'data-processor',
                    'rationale': 'Good modularity',
                },
            ],
            'utility_modules': [
                {
                    'file_path': '/home/user/project/src\\utils\\helpers.py',
                    'function_count': 5,
                    'class_count': 1,
                    'external_dependencies': ['$MODULE_dep', 'json'],
                    'internal_dependencies': [],
                    'modularity_score': 'highly_modular',
                    'extraction_potential': 0.90,
                }
            ],
        }

    def test_stage_name(self, default_config):
        stage = CleaningStage(default_config)
        assert stage.name == 'cleaning'

    def test_validate_input_valid(self, default_config, sample_report):
        stage = CleaningStage(default_config)
        is_valid, errors = stage.validate_input(sample_report)
        assert is_valid is True
        assert errors == []

    def test_validate_input_invalid_not_dict(self, default_config):
        stage = CleaningStage(default_config)
        is_valid, errors = stage.validate_input("not a dict")  # type: ignore
        assert is_valid is False
        assert "Input must be a dictionary" in errors[0]

    def test_validate_input_missing_keys(self, default_config):
        stage = CleaningStage(default_config)
        is_valid, errors = stage.validate_input({'other_key': 'value'})
        assert is_valid is False
        assert 'should contain at least one of' in errors[0]

    def test_process_normalizes_paths(self, default_config, sample_report):
        stage = CleaningStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        # Check paths are normalized (forward slashes)
        for candidate in candidates:
            assert '\\' not in candidate['file_path']

    def test_process_analyzes_names(self, default_config, sample_report):
        stage = CleaningStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        # Check naming convention was detected
        for candidate in candidates:
            assert '_naming_convention' in candidate

        # First candidate is camelCase
        assert candidates[0]['_naming_convention'] == 'camelCase'
        # Second candidate is PascalCase
        assert candidates[1]['_naming_convention'] == 'PascalCase'

    def test_process_cleans_meta_variables(self, default_config, sample_report):
        stage = CleaningStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        candidates = result.data['tool_candidates']

        # Check meta variables removed from description
        assert '$NAME' not in candidates[0]['description']
        assert '$NAME' not in candidates[0]['rationale']

        # Check dependencies cleaned
        assert '$MODULE' not in candidates[0]['dependencies']

    def test_process_metrics(self, default_config, sample_report):
        stage = CleaningStage(default_config)
        result = stage.process(sample_report)

        assert result.success is True
        assert 'paths_normalized' in result.metrics
        assert 'names_analyzed' in result.metrics
        assert 'meta_vars_cleaned' in result.metrics
        assert 'naming_conventions' in result.metrics

    def test_process_with_relative_paths(self, sample_report):
        config = CleaningConfig(
            path_config=PathNormalizerConfig(
                relative_to=Path('/home/user/project')
            )
        )
        stage = CleaningStage(config)
        result = stage.process(sample_report)

        assert result.success is True

        # Paths should be relative now
        candidates = result.data['tool_candidates']
        assert candidates[0]['file_path'] == 'src/utils/math.py'
        assert candidates[1]['file_path'] == 'src/processing/data.py'

    def test_process_disabled_path_normalization(self, sample_report):
        config = CleaningConfig(normalize_paths=False)
        stage = CleaningStage(config)
        result = stage.process(sample_report)

        # Paths should still have original backslashes
        candidates = result.data['tool_candidates']
        assert '\\' in candidates[0]['file_path']

    def test_process_disabled_meta_variable_cleaning(self, sample_report):
        config = CleaningConfig(clean_meta_variables=False)
        stage = CleaningStage(config)
        result = stage.process(sample_report)

        # Meta variables should still be present
        candidates = result.data['tool_candidates']
        assert '$NAME' in candidates[0]['description']

    def test_run_adds_timing_metrics(self, default_config, sample_report):
        stage = CleaningStage(default_config)
        result = stage.run(sample_report)

        assert result.success is True
        assert 'duration_ms' in result.metrics
        assert 'stage_name' in result.metrics
        assert result.metrics['stage_name'] == 'cleaning'

    def test_process_preserves_original_data(self, default_config, sample_report):
        stage = CleaningStage(default_config)

        # Make a copy to compare
        original_path = sample_report['tool_candidates'][0]['file_path']

        result = stage.process(sample_report)

        # Original should be unchanged
        assert sample_report['tool_candidates'][0]['file_path'] == original_path

        # Result should be different (normalized)
        assert result.data['tool_candidates'][0]['file_path'] != original_path

    def test_process_empty_candidates(self, default_config):
        stage = CleaningStage(default_config)
        data = {
            'summary': {'files_analyzed': 0},
            'tool_candidates': [],
            'utility_modules': [],
        }
        result = stage.process(data)

        assert result.success is True
        assert result.data['tool_candidates'] == []

    def test_process_utility_modules(self, default_config, sample_report):
        stage = CleaningStage(default_config)
        result = stage.process(sample_report)

        modules = result.data['utility_modules']
        assert len(modules) == 1

        # Path normalized
        assert '\\' not in modules[0]['file_path']

        # Dependencies cleaned
        assert '$MODULE_dep' not in modules[0]['external_dependencies']
