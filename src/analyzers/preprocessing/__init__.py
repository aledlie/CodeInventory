"""Preprocessing pipeline for identify_tools analyzer."""
from .config import (
    PreprocessingConfig,
    PathNormalizerConfig,
    CleaningConfig,
    TransformationConfig,
    DeduplicationConfig,
    DashboardConfig,
)
from .pipeline import PreprocessingPipeline, PipelineResult
from .stages.base import PreprocessingStage, StageResult, IdentityStage
from .stages.cleaning import CleaningStage, NameNormalizer, MetaVariableCleaner
from .stages.optimization import (
    DashboardOptimizationStage,
    ChartData,
    ChartDataBuilder,
    DashboardData,
)
from .utils.path_utils import PathNormalizer
from .utils.indexing import IndexBuilder, Index, SearchIndex, PaginationMeta

__all__ = [
    # Config classes
    'PreprocessingConfig',
    'PathNormalizerConfig',
    'CleaningConfig',
    'TransformationConfig',
    'DeduplicationConfig',
    'DashboardConfig',
    # Pipeline
    'PreprocessingPipeline',
    'PipelineResult',
    # Base stage classes
    'PreprocessingStage',
    'StageResult',
    'IdentityStage',
    # Cleaning stage
    'CleaningStage',
    'NameNormalizer',
    'MetaVariableCleaner',
    # Optimization stage
    'DashboardOptimizationStage',
    'ChartData',
    'ChartDataBuilder',
    'DashboardData',
    # Utilities
    'PathNormalizer',
    'IndexBuilder',
    'Index',
    'SearchIndex',
    'PaginationMeta',
]
