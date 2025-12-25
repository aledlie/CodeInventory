"""Preprocessing pipeline orchestrator."""
from dataclasses import dataclass, field
from typing import Any, Optional
import logging
import time

from .config import PreprocessingConfig
from .stages.base import PreprocessingStage, StageResult
from .stages.cleaning import CleaningStage
from .stages.transformation import TransformationStage
from .stages.deduplication import DeduplicationStage
from .stages.optimization import DashboardOptimizationStage

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    """Result from running the preprocessing pipeline."""
    data: Any
    success: bool
    stages_run: list[str]
    stages_skipped: list[str]
    total_duration_ms: float
    stage_metrics: dict[str, dict[str, Any]]
    errors: list[str]
    warnings: list[str]

    @property
    def summary(self) -> str:
        """Return a summary of the pipeline run."""
        status = "SUCCESS" if self.success else "FAILED"
        return (
            f"Pipeline {status}: "
            f"{len(self.stages_run)} stages run, "
            f"{len(self.stages_skipped)} skipped, "
            f"{self.total_duration_ms:.2f}ms total"
        )


class PreprocessingPipeline:
    """Main preprocessing pipeline orchestrator.

    The pipeline runs a series of preprocessing stages on the input data.
    Each stage transforms the data in some way, and the output of one
    stage becomes the input to the next.

    Stages can be enabled/disabled through configuration. If a stage
    is disabled, its data passes through unchanged.
    """

    def __init__(self, config: PreprocessingConfig):
        """Initialize the pipeline with configuration.

        Args:
            config: Pipeline configuration object.
        """
        self.config = config
        self._stages: list[PreprocessingStage] = []
        self._setup_stages()

    def _setup_stages(self) -> None:
        """Initialize the stages based on configuration.

        Stages are added in order:
        1. Cleaning (path normalization, name normalization)
        2. Transformation (dependency resolution, pattern detection)
        3. Deduplication (signature matching, similarity grouping)
        4. Dashboard optimization (indexes, chart data)

        Each stage is only added if enabled in configuration.
        """
        # Stage 1: Cleaning
        if self.config.cleaning.enabled:
            self._stages.append(CleaningStage(self.config.cleaning))
            logger.debug("Added CleaningStage to pipeline")

        # Stage 2: Transformation
        if self.config.transformation.enabled:
            self._stages.append(TransformationStage(self.config.transformation))
            logger.debug("Added TransformationStage to pipeline")

        # Stage 3: Deduplication
        if self.config.deduplication.enabled:
            self._stages.append(DeduplicationStage(self.config.deduplication))
            logger.debug("Added DeduplicationStage to pipeline")

        # Stage 4: Dashboard optimization
        if self.config.dashboard.enabled:
            self._stages.append(DashboardOptimizationStage(self.config.dashboard))
            logger.debug("Added DashboardOptimizationStage to pipeline")

    def add_stage(self, stage: PreprocessingStage) -> 'PreprocessingPipeline':
        """Add a stage to the pipeline.

        Args:
            stage: The preprocessing stage to add.

        Returns:
            Self for method chaining.
        """
        self._stages.append(stage)
        logger.debug(f"Added stage '{stage.name}' to pipeline")
        return self

    def remove_stage(self, stage_name: str) -> bool:
        """Remove a stage from the pipeline by name.

        Args:
            stage_name: Name of the stage to remove.

        Returns:
            True if stage was removed, False if not found.
        """
        for i, stage in enumerate(self._stages):
            if stage.name == stage_name:
                self._stages.pop(i)
                logger.debug(f"Removed stage '{stage_name}' from pipeline")
                return True
        return False

    def get_stage(self, stage_name: str) -> Optional[PreprocessingStage]:
        """Get a stage by name.

        Args:
            stage_name: Name of the stage to get.

        Returns:
            The stage if found, None otherwise.
        """
        for stage in self._stages:
            if stage.name == stage_name:
                return stage
        return None

    @property
    def stage_names(self) -> list[str]:
        """Return the names of all stages in order."""
        return [stage.name for stage in self._stages]

    def process(self, data: Any) -> PipelineResult:
        """Run all stages on the input data.

        Args:
            data: The input data to process.

        Returns:
            PipelineResult containing the processed data and metrics.
        """
        start_time = time.time()
        current_data = data
        stages_run: list[str] = []
        stages_skipped: list[str] = []
        stage_metrics: dict[str, dict[str, Any]] = {}
        all_errors: list[str] = []
        all_warnings: list[str] = []

        logger.info(f"Starting preprocessing pipeline with {len(self._stages)} stages")

        for stage in self._stages:
            stage_start = time.time()

            # Check if stage should be skipped based on config
            if self._should_skip_stage(stage):
                result = stage.skip(current_data)
                stages_skipped.append(stage.name)
            else:
                result = stage.run(current_data)
                stages_run.append(stage.name)

            stage_metrics[stage.name] = result.metrics

            # Collect warnings
            all_warnings.extend(result.warnings)

            # Handle errors
            if not result.success:
                all_errors.extend(result.errors)
                logger.error(f"Stage '{stage.name}' failed: {result.errors}")

                # For now, we continue on error but mark pipeline as failed
                # Future: could add fail-fast option in config
                continue

            current_data = result.data

        total_duration = (time.time() - start_time) * 1000

        pipeline_result = PipelineResult(
            data=current_data,
            success=len(all_errors) == 0,
            stages_run=stages_run,
            stages_skipped=stages_skipped,
            total_duration_ms=total_duration,
            stage_metrics=stage_metrics,
            errors=all_errors,
            warnings=all_warnings,
        )

        logger.info(pipeline_result.summary)
        return pipeline_result

    def _should_skip_stage(self, stage: PreprocessingStage) -> bool:
        """Determine if a stage should be skipped based on configuration.

        Args:
            stage: The stage to check.

        Returns:
            True if the stage should be skipped.
        """
        stage_config_map = {
            'cleaning': self.config.cleaning.enabled,
            'transformation': self.config.transformation.enabled,
            'deduplication': self.config.deduplication.enabled,
            'dashboard_optimization': self.config.dashboard.enabled,
        }

        # Check if stage name matches a known config
        for config_name, enabled in stage_config_map.items():
            if stage.name == config_name or stage.name.startswith(config_name):
                return not enabled

        # Default to running unknown stages
        return False

    def __len__(self) -> int:
        """Return the number of stages in the pipeline."""
        return len(self._stages)

    def __repr__(self) -> str:
        """Return a string representation of the pipeline."""
        return f"PreprocessingPipeline(stages={self.stage_names})"
