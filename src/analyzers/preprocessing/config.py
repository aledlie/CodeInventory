"""Configuration classes for preprocessing pipeline."""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
import json


@dataclass
class PathNormalizerConfig:
    """Configuration for path normalization."""
    relative_to: Optional[Path] = None
    normalize_separators: bool = True
    strip_extensions: bool = False
    case_sensitive: bool = True


@dataclass
class CleaningConfig:
    """Configuration for cleaning stage."""
    enabled: bool = True
    normalize_paths: bool = True
    normalize_names: bool = True
    clean_meta_variables: bool = True
    path_config: PathNormalizerConfig = field(default_factory=PathNormalizerConfig)


@dataclass
class TransformationConfig:
    """Configuration for transformation stage."""
    enabled: bool = True
    resolve_dependencies: bool = True
    detect_patterns: bool = True
    calculate_complexity: bool = True
    # Pattern detection options
    min_pattern_confidence: float = 0.3
    max_patterns_per_candidate: int = 5
    # Dependency resolution options
    project_modules: list[str] = field(default_factory=list)


@dataclass
class DeduplicationConfig:
    """Configuration for deduplication stage."""
    enabled: bool = True
    threshold: float = 0.85
    group_similar: bool = True
    preserve_all_locations: bool = True


@dataclass
class DashboardConfig:
    """Configuration for dashboard optimization stage."""
    enabled: bool = True
    page_size: int = 50
    build_search_index: bool = True
    precompute_charts: bool = True


@dataclass
class PreprocessingConfig:
    """Main configuration for the preprocessing pipeline."""
    cleaning: CleaningConfig = field(default_factory=CleaningConfig)
    transformation: TransformationConfig = field(default_factory=TransformationConfig)
    deduplication: DeduplicationConfig = field(default_factory=DeduplicationConfig)
    dashboard: DashboardConfig = field(default_factory=DashboardConfig)

    # Performance settings
    parallel: bool = False
    cache_enabled: bool = True

    @classmethod
    def from_file(cls, path: Path) -> 'PreprocessingConfig':
        """Load configuration from a JSON file."""
        with open(path, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: dict) -> 'PreprocessingConfig':
        """Create configuration from a dictionary."""
        config = cls()

        if 'cleaning' in data:
            cleaning_data = data['cleaning']
            config.cleaning = CleaningConfig(
                enabled=cleaning_data.get('enabled', True),
                normalize_paths=cleaning_data.get('normalize_paths', True),
                normalize_names=cleaning_data.get('normalize_names', True),
                clean_meta_variables=cleaning_data.get('clean_meta_variables', True),
                path_config=PathNormalizerConfig(
                    relative_to=Path(cleaning_data['path_relative_to'])
                        if cleaning_data.get('path_relative_to') else None,
                    normalize_separators=cleaning_data.get('normalize_separators', True),
                )
            )

        if 'transformation' in data:
            trans_data = data['transformation']
            config.transformation = TransformationConfig(
                enabled=trans_data.get('enabled', True),
                resolve_dependencies=trans_data.get('resolve_dependencies', True),
                detect_patterns=trans_data.get('detect_patterns', True),
                calculate_complexity=trans_data.get('calculate_complexity', True),
                min_pattern_confidence=trans_data.get('min_pattern_confidence', 0.3),
                max_patterns_per_candidate=trans_data.get('max_patterns_per_candidate', 5),
                project_modules=trans_data.get('project_modules', []),
            )

        if 'deduplication' in data:
            dedup_data = data['deduplication']
            config.deduplication = DeduplicationConfig(
                enabled=dedup_data.get('enabled', True),
                threshold=dedup_data.get('threshold', 0.85),
                group_similar=dedup_data.get('group_similar', True),
                preserve_all_locations=dedup_data.get('preserve_all_locations', True),
            )

        if 'dashboard' in data:
            dash_data = data['dashboard']
            config.dashboard = DashboardConfig(
                enabled=dash_data.get('enabled', True),
                page_size=dash_data.get('page_size', 50),
                build_search_index=dash_data.get('build_search_index', True),
                precompute_charts=dash_data.get('precompute_charts', True),
            )

        config.parallel = data.get('parallel', False)
        config.cache_enabled = data.get('cache_enabled', True)

        return config

    def to_dict(self) -> dict:
        """Convert configuration to a dictionary."""
        return {
            'cleaning': {
                'enabled': self.cleaning.enabled,
                'normalize_paths': self.cleaning.normalize_paths,
                'normalize_names': self.cleaning.normalize_names,
                'clean_meta_variables': self.cleaning.clean_meta_variables,
                'path_relative_to': str(self.cleaning.path_config.relative_to)
                    if self.cleaning.path_config.relative_to else None,
                'normalize_separators': self.cleaning.path_config.normalize_separators,
            },
            'transformation': {
                'enabled': self.transformation.enabled,
                'resolve_dependencies': self.transformation.resolve_dependencies,
                'detect_patterns': self.transformation.detect_patterns,
                'calculate_complexity': self.transformation.calculate_complexity,
                'min_pattern_confidence': self.transformation.min_pattern_confidence,
                'max_patterns_per_candidate': self.transformation.max_patterns_per_candidate,
                'project_modules': self.transformation.project_modules,
            },
            'deduplication': {
                'enabled': self.deduplication.enabled,
                'threshold': self.deduplication.threshold,
                'group_similar': self.deduplication.group_similar,
                'preserve_all_locations': self.deduplication.preserve_all_locations,
            },
            'dashboard': {
                'enabled': self.dashboard.enabled,
                'page_size': self.dashboard.page_size,
                'build_search_index': self.dashboard.build_search_index,
                'precompute_charts': self.dashboard.precompute_charts,
            },
            'parallel': self.parallel,
            'cache_enabled': self.cache_enabled,
        }


# Convenience aliases for backward compatibility
PathNormalizerConfig = PathNormalizerConfig
