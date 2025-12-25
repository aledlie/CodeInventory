"""Base class for preprocessing stages."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Generic, TypeVar, Optional
import time
import logging

logger = logging.getLogger(__name__)

# Type variables for input and output types
InputT = TypeVar('InputT')
OutputT = TypeVar('OutputT')


@dataclass
class StageResult(Generic[OutputT]):
    """Result from a preprocessing stage."""
    data: OutputT
    success: bool
    errors: list[str]
    warnings: list[str]
    metrics: dict[str, Any]

    @classmethod
    def ok(cls, data: OutputT, warnings: Optional[list[str]] = None,
           metrics: Optional[dict[str, Any]] = None) -> 'StageResult[OutputT]':
        """Create a successful result."""
        return cls(
            data=data,
            success=True,
            errors=[],
            warnings=warnings or [],
            metrics=metrics or {},
        )

    @classmethod
    def error(cls, errors: list[str], data: Optional[OutputT] = None) -> 'StageResult[OutputT]':
        """Create an error result."""
        return cls(
            data=data,  # type: ignore
            success=False,
            errors=errors,
            warnings=[],
            metrics={},
        )


class PreprocessingStage(ABC, Generic[InputT, OutputT]):
    """Abstract base class for preprocessing stages.

    Each stage in the pipeline must implement this interface.
    Stages transform data from one form to another, with validation
    and error handling built in.
    """

    def __init__(self, config: Any):
        """Initialize the stage with configuration.

        Args:
            config: Stage-specific configuration object.
        """
        self.config = config
        self._start_time: Optional[float] = None

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the stage name for logging and metrics."""
        pass

    @abstractmethod
    def process(self, data: InputT) -> StageResult[OutputT]:
        """Process the input data and return a result.

        Args:
            data: Input data to process.

        Returns:
            StageResult containing the processed data or errors.
        """
        pass

    @abstractmethod
    def validate_input(self, data: InputT) -> tuple[bool, list[str]]:
        """Validate the input data before processing.

        Args:
            data: Input data to validate.

        Returns:
            Tuple of (is_valid, list of error messages).
        """
        pass

    def validate_output(self, data: OutputT) -> tuple[bool, list[str]]:
        """Validate the output data after processing.

        Override this method to add output validation.
        Default implementation always returns valid.

        Args:
            data: Output data to validate.

        Returns:
            Tuple of (is_valid, list of error messages).
        """
        return True, []

    def run(self, data: InputT) -> StageResult[OutputT]:
        """Run the stage with validation and timing.

        This is the main entry point for running a stage.
        It handles input validation, timing, and error handling.

        Args:
            data: Input data to process.

        Returns:
            StageResult containing the processed data or errors.
        """
        self._start_time = time.time()

        # Validate input
        is_valid, errors = self.validate_input(data)
        if not is_valid:
            logger.error(f"Stage '{self.name}' input validation failed: {errors}")
            return StageResult.error(errors)

        try:
            # Process data
            result = self.process(data)

            # Add timing metrics
            elapsed = time.time() - self._start_time
            result.metrics['duration_ms'] = elapsed * 1000
            result.metrics['stage_name'] = self.name

            # Validate output if processing succeeded
            if result.success:
                is_valid, output_errors = self.validate_output(result.data)
                if not is_valid:
                    logger.warning(
                        f"Stage '{self.name}' output validation failed: {output_errors}"
                    )
                    result.warnings.extend(output_errors)

            logger.info(f"Stage '{self.name}' completed in {elapsed*1000:.2f}ms")
            return result

        except Exception as e:
            elapsed = time.time() - self._start_time
            logger.exception(f"Stage '{self.name}' failed after {elapsed*1000:.2f}ms")
            return StageResult.error([str(e)])

    def skip(self, data: InputT) -> StageResult[OutputT]:
        """Skip this stage and pass data through unchanged.

        Useful when a stage is disabled in configuration.

        Args:
            data: Input data to pass through.

        Returns:
            StageResult with the input data unchanged.
        """
        logger.debug(f"Stage '{self.name}' skipped")
        return StageResult.ok(
            data,  # type: ignore
            metrics={'skipped': True, 'stage_name': self.name}
        )


class IdentityStage(PreprocessingStage[Any, Any]):
    """A no-op stage that passes data through unchanged.

    Useful for testing or as a placeholder.
    """

    @property
    def name(self) -> str:
        return "identity"

    def process(self, data: Any) -> StageResult[Any]:
        return StageResult.ok(data)

    def validate_input(self, data: Any) -> tuple[bool, list[str]]:
        return True, []
