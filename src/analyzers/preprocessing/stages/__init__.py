"""Preprocessing stages."""
from .base import PreprocessingStage, StageResult, IdentityStage
from .cleaning import CleaningStage, NameNormalizer, MetaVariableCleaner
from .transformation import (
    TransformationStage,
    DependencyResolver,
    DependencyType,
    DependencyGraph,
    ResolvedDependency,
    PatternDetector,
    PatternMatch,
    UtilityPattern,
    ComplexityCalculator,
    ComplexityMetrics,
)
from .deduplication import (
    DeduplicationStage,
    SignatureDeduplicator,
    SimilarityGrouper,
    StatisticsAggregator,
    DuplicateGroup,
    DeduplicationStats,
)
from .optimization import (
    DashboardOptimizationStage,
    ChartData,
    ChartDataBuilder,
    DashboardData,
)

__all__ = [
    # Base
    'PreprocessingStage',
    'StageResult',
    'IdentityStage',
    # Cleaning
    'CleaningStage',
    'NameNormalizer',
    'MetaVariableCleaner',
    # Transformation
    'TransformationStage',
    'DependencyResolver',
    'DependencyType',
    'DependencyGraph',
    'ResolvedDependency',
    'PatternDetector',
    'PatternMatch',
    'UtilityPattern',
    'ComplexityCalculator',
    'ComplexityMetrics',
    # Deduplication
    'DeduplicationStage',
    'SignatureDeduplicator',
    'SimilarityGrouper',
    'StatisticsAggregator',
    'DuplicateGroup',
    'DeduplicationStats',
    # Optimization
    'DashboardOptimizationStage',
    'ChartData',
    'ChartDataBuilder',
    'DashboardData',
]
