"""Unit tests for preprocessing pipeline."""
import pytest
from typing import Any

from src.analyzers.preprocessing.pipeline import (
    PreprocessingPipeline,
    PipelineResult,
)
from src.analyzers.preprocessing.stages.base import (
    PreprocessingStage,
    StageResult,
    IdentityStage,
)
from src.analyzers.preprocessing.config import PreprocessingConfig, CleaningConfig


def make_empty_pipeline_config() -> PreprocessingConfig:
    """Create a config that results in an empty pipeline (all stages disabled)."""
    config = PreprocessingConfig()
    config.cleaning.enabled = False
    config.transformation.enabled = False
    config.deduplication.enabled = False
    config.dashboard.enabled = False
    return config


class CounterStage(PreprocessingStage[dict, dict]):
    """Test stage that counts invocations."""

    def __init__(self, config: Any, name: str = "counter"):
        super().__init__(config)
        self._name = name
        self.call_count = 0

    @property
    def name(self) -> str:
        return self._name

    def process(self, data: dict) -> StageResult[dict]:
        self.call_count += 1
        data = dict(data)
        data[f"{self._name}_count"] = self.call_count
        return StageResult.ok(data)

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        return True, []


class FailingStage(PreprocessingStage[dict, dict]):
    """Test stage that always fails."""

    @property
    def name(self) -> str:
        return "failing"

    def process(self, data: dict) -> StageResult[dict]:
        return StageResult.error(["Stage failed intentionally"])

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        return True, []


class TransformStage(PreprocessingStage[dict, dict]):
    """Test stage that transforms data."""

    def __init__(self, config: Any, transform_fn):
        super().__init__(config)
        self.transform_fn = transform_fn

    @property
    def name(self) -> str:
        return "transform"

    def process(self, data: dict) -> StageResult[dict]:
        return StageResult.ok(self.transform_fn(data))

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        return True, []


class TestPipelineResult:
    """Tests for PipelineResult."""

    def test_summary_success(self):
        result = PipelineResult(
            data={},
            success=True,
            stages_run=["stage1", "stage2"],
            stages_skipped=["stage3"],
            total_duration_ms=100.5,
            stage_metrics={},
            errors=[],
            warnings=[],
        )
        summary = result.summary
        assert "SUCCESS" in summary
        assert "2 stages run" in summary
        assert "1 skipped" in summary

    def test_summary_failed(self):
        result = PipelineResult(
            data={},
            success=False,
            stages_run=["stage1"],
            stages_skipped=[],
            total_duration_ms=50.0,
            stage_metrics={},
            errors=["Something went wrong"],
            warnings=[],
        )
        assert "FAILED" in result.summary


class TestPreprocessingPipeline:
    """Tests for PreprocessingPipeline."""

    def test_init_with_config(self):
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)
        assert pipeline.config == config

    def test_init_with_cleaning_enabled_adds_stage(self):
        """When cleaning is enabled, pipeline should auto-add CleaningStage."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        pipeline = PreprocessingPipeline(config)

        assert len(pipeline) >= 1
        assert "cleaning" in pipeline.stage_names

    def test_init_with_cleaning_disabled_no_stage(self):
        """When cleaning is disabled, pipeline should not add CleaningStage."""
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        assert len(pipeline) == 0
        assert "cleaning" not in pipeline.stage_names

    def test_add_stage(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        stage = IdentityStage(config=None)
        result = pipeline.add_stage(stage)

        assert result is pipeline  # Returns self for chaining
        assert len(pipeline) == 1
        assert "identity" in pipeline.stage_names

    def test_add_multiple_stages(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        pipeline.add_stage(CounterStage(config=None, name="counter1"))
        pipeline.add_stage(CounterStage(config=None, name="counter2"))
        pipeline.add_stage(CounterStage(config=None, name="counter3"))

        assert len(pipeline) == 3
        assert pipeline.stage_names == ["counter1", "counter2", "counter3"]

    def test_remove_stage(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)
        pipeline.add_stage(CounterStage(config=None, name="counter1"))
        pipeline.add_stage(CounterStage(config=None, name="counter2"))

        removed = pipeline.remove_stage("counter1")
        assert removed is True
        assert len(pipeline) == 1
        assert "counter1" not in pipeline.stage_names

    def test_remove_nonexistent_stage(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        removed = pipeline.remove_stage("nonexistent")
        assert removed is False

    def test_get_stage(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)
        stage = CounterStage(config=None, name="test")
        pipeline.add_stage(stage)

        retrieved = pipeline.get_stage("test")
        assert retrieved is stage

    def test_get_nonexistent_stage(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        retrieved = pipeline.get_stage("nonexistent")
        assert retrieved is None

    def test_process_empty_pipeline(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)
        data = {"key": "value"}

        result = pipeline.process(data)

        assert result.success is True
        assert result.data == data
        assert len(result.stages_run) == 0

    def test_process_single_stage(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)
        pipeline.add_stage(IdentityStage(config=None))

        result = pipeline.process({"key": "value"})

        assert result.success is True
        assert result.data == {"key": "value"}
        assert "identity" in result.stages_run

    def test_process_multiple_stages_in_order(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        # Add stages that transform data sequentially
        pipeline.add_stage(TransformStage(
            config=None,
            transform_fn=lambda d: {**d, "step1": True}
        ))
        pipeline.add_stage(TransformStage(
            config=None,
            transform_fn=lambda d: {**d, "step2": True}
        ))

        result = pipeline.process({"initial": True})

        assert result.success is True
        assert result.data["initial"] is True
        assert result.data["step1"] is True
        assert result.data["step2"] is True

    def test_process_continues_on_failure(self):
        """Pipeline continues on stage failure but marks result as failed."""
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        counter_before = CounterStage(config=None, name="before")
        counter_after = CounterStage(config=None, name="after")

        pipeline.add_stage(counter_before)
        pipeline.add_stage(FailingStage(config=None))
        pipeline.add_stage(counter_after)

        result = pipeline.process({"key": "value"})

        assert result.success is False
        assert "Stage failed intentionally" in result.errors
        assert counter_before.call_count == 1
        # After stage still runs (pipeline doesn't fail-fast by default)
        assert counter_after.call_count == 1

    def test_process_collects_metrics(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)
        pipeline.add_stage(CounterStage(config=None, name="counter"))

        result = pipeline.process({})

        assert "counter" in result.stage_metrics
        assert result.total_duration_ms > 0

    def test_repr(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)
        pipeline.add_stage(CounterStage(config=None, name="stage1"))
        pipeline.add_stage(CounterStage(config=None, name="stage2"))

        repr_str = repr(pipeline)
        assert "PreprocessingPipeline" in repr_str
        assert "stage1" in repr_str
        assert "stage2" in repr_str

    def test_len(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        assert len(pipeline) == 0
        pipeline.add_stage(IdentityStage(config=None))
        assert len(pipeline) == 1


class TestPipelineWithDisabledStages:
    """Tests for pipeline behavior with disabled stages in config."""

    def test_skip_disabled_cleaning_stage(self):
        config = make_empty_pipeline_config()
        pipeline = PreprocessingPipeline(config)

        # Add a stage that starts with "cleaning"
        class CleaningTestStage(PreprocessingStage[dict, dict]):
            @property
            def name(self):
                return "cleaning_test"

            def process(self, data):
                return StageResult.ok({**data, "cleaned": True})

            def validate_input(self, data):
                return True, []

        pipeline.add_stage(CleaningTestStage(config=None))

        result = pipeline.process({"key": "value"})

        # Stage should be skipped since cleaning is disabled
        assert "cleaning_test" in result.stages_skipped
        assert "cleaned" not in result.data


class TestPipelineWithCleaningStage:
    """Tests for pipeline with auto-added CleaningStage."""

    @pytest.fixture
    def sample_report(self):
        """Sample tool identification report for testing."""
        return {
            'summary': {
                'root_directory': '/home/user/project',
                'files_analyzed': 10,
            },
            'tool_candidates': [
                {
                    'name': 'myFunction',
                    'type': 'function',
                    'file_path': 'src\\utils\\math.py',
                    'line_number': 42,
                    'description': 'Function $NAME calculates sum',
                    'dependencies': ['numpy'],
                    'modularity_score': 'highly_modular',
                    'extraction_potential': 0.95,
                    'extraction_complexity': 'trivial',
                    'suggested_package_name': 'math-utils',
                    'rationale': 'Highly modular',
                },
            ],
            'utility_modules': [],
        }

    def test_pipeline_runs_cleaning_stage(self, sample_report):
        """Pipeline should run CleaningStage on valid report data."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        pipeline = PreprocessingPipeline(config)

        result = pipeline.process(sample_report)

        assert result.success is True
        assert "cleaning" in result.stages_run

    def test_pipeline_normalizes_paths(self, sample_report):
        """CleaningStage should normalize paths in the report."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        pipeline = PreprocessingPipeline(config)

        result = pipeline.process(sample_report)

        # Backslashes should be converted to forward slashes
        assert '\\' not in result.data['tool_candidates'][0]['file_path']
        assert result.data['tool_candidates'][0]['file_path'] == 'src/utils/math.py'

    def test_pipeline_cleans_meta_variables(self, sample_report):
        """CleaningStage should clean meta variables from descriptions."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        pipeline = PreprocessingPipeline(config)

        result = pipeline.process(sample_report)

        # $NAME should be removed
        assert '$NAME' not in result.data['tool_candidates'][0]['description']

    def test_pipeline_adds_naming_convention(self, sample_report):
        """CleaningStage should add naming convention info."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        pipeline = PreprocessingPipeline(config)

        result = pipeline.process(sample_report)

        assert '_naming_convention' in result.data['tool_candidates'][0]
        assert result.data['tool_candidates'][0]['_naming_convention'] == 'camelCase'
