"""Unit tests for preprocessing stages."""
import pytest
from typing import Any

from src.analyzers.preprocessing.stages.base import (
    PreprocessingStage,
    StageResult,
    IdentityStage,
)
from src.analyzers.preprocessing.config import PreprocessingConfig


class TestStageResult:
    """Tests for StageResult."""

    def test_ok_result(self):
        result = StageResult.ok(data={"key": "value"})
        assert result.success is True
        assert result.data == {"key": "value"}
        assert result.errors == []
        assert result.warnings == []

    def test_ok_result_with_warnings(self):
        result = StageResult.ok(
            data="test",
            warnings=["warning 1", "warning 2"]
        )
        assert result.success is True
        assert result.warnings == ["warning 1", "warning 2"]

    def test_ok_result_with_metrics(self):
        result = StageResult.ok(
            data="test",
            metrics={"count": 10, "duration_ms": 5.5}
        )
        assert result.success is True
        assert result.metrics["count"] == 10
        assert result.metrics["duration_ms"] == 5.5

    def test_error_result(self):
        result = StageResult.error(errors=["error 1", "error 2"])
        assert result.success is False
        assert result.errors == ["error 1", "error 2"]
        assert result.data is None

    def test_error_result_with_data(self):
        result = StageResult.error(
            errors=["partial failure"],
            data={"partial": "data"}
        )
        assert result.success is False
        assert result.data == {"partial": "data"}


class ConcreteStage(PreprocessingStage[dict, dict]):
    """Concrete implementation for testing."""

    def __init__(self, config: Any, should_fail: bool = False):
        super().__init__(config)
        self.should_fail = should_fail

    @property
    def name(self) -> str:
        return "test_stage"

    def process(self, data: dict) -> StageResult[dict]:
        if self.should_fail:
            return StageResult.error(["Intentional failure"])
        return StageResult.ok(
            data={**data, "processed": True},
            metrics={"items_processed": len(data)}
        )

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        if not isinstance(data, dict):
            return False, ["Input must be a dictionary"]
        return True, []


class TestPreprocessingStage:
    """Tests for PreprocessingStage abstract class."""

    def test_run_successful(self):
        stage = ConcreteStage(config=None)
        result = stage.run({"key": "value"})

        assert result.success is True
        assert result.data["processed"] is True
        assert result.data["key"] == "value"
        assert "duration_ms" in result.metrics
        assert result.metrics["stage_name"] == "test_stage"

    def test_run_validation_failure(self):
        stage = ConcreteStage(config=None)
        result = stage.run("not a dict")  # type: ignore

        assert result.success is False
        assert "Input must be a dictionary" in result.errors

    def test_run_processing_failure(self):
        stage = ConcreteStage(config=None, should_fail=True)
        result = stage.run({"key": "value"})

        assert result.success is False
        assert "Intentional failure" in result.errors

    def test_skip(self):
        stage = ConcreteStage(config=None)
        result = stage.skip({"key": "value"})

        assert result.success is True
        assert result.data == {"key": "value"}
        assert result.metrics.get("skipped") is True


class TestIdentityStage:
    """Tests for IdentityStage."""

    def test_name(self):
        stage = IdentityStage(config=None)
        assert stage.name == "identity"

    def test_process_passes_through(self):
        stage = IdentityStage(config=None)
        data = {"test": "data", "nested": {"value": 123}}
        result = stage.process(data)

        assert result.success is True
        assert result.data == data

    def test_run_with_any_input(self):
        stage = IdentityStage(config=None)

        # Test with various input types
        assert stage.run({"dict": "value"}).success is True
        assert stage.run([1, 2, 3]).success is True
        assert stage.run("string").success is True
        assert stage.run(123).success is True
        assert stage.run(None).success is True

    def test_validate_input_always_valid(self):
        stage = IdentityStage(config=None)
        is_valid, errors = stage.validate_input("anything")
        assert is_valid is True
        assert errors == []
