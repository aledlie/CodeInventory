"""Unit tests for preprocessing configuration."""
import json
import pytest
from pathlib import Path
from tempfile import NamedTemporaryFile

from src.analyzers.preprocessing.config import (
    PreprocessingConfig,
    PathNormalizerConfig,
    CleaningConfig,
    TransformationConfig,
    DeduplicationConfig,
    DashboardConfig,
)


class TestPathNormalizerConfig:
    """Tests for PathNormalizerConfig."""

    def test_default_values(self):
        config = PathNormalizerConfig()
        assert config.relative_to is None
        assert config.normalize_separators is True
        assert config.strip_extensions is False
        assert config.case_sensitive is True

    def test_custom_values(self):
        config = PathNormalizerConfig(
            relative_to=Path("/project"),
            normalize_separators=False,
            strip_extensions=True,
            case_sensitive=False,
        )
        assert config.relative_to == Path("/project")
        assert config.normalize_separators is False
        assert config.strip_extensions is True
        assert config.case_sensitive is False


class TestCleaningConfig:
    """Tests for CleaningConfig."""

    def test_default_values(self):
        config = CleaningConfig()
        assert config.enabled is True
        assert config.normalize_paths is True
        assert config.normalize_names is True
        assert config.clean_meta_variables is True
        assert isinstance(config.path_config, PathNormalizerConfig)

    def test_disabled(self):
        config = CleaningConfig(enabled=False)
        assert config.enabled is False


class TestTransformationConfig:
    """Tests for TransformationConfig."""

    def test_default_values(self):
        config = TransformationConfig()
        assert config.enabled is True
        assert config.resolve_dependencies is True
        assert config.detect_patterns is True
        assert config.calculate_complexity is True


class TestDeduplicationConfig:
    """Tests for DeduplicationConfig."""

    def test_default_values(self):
        config = DeduplicationConfig()
        assert config.enabled is True
        assert config.threshold == 0.85
        assert config.group_similar is True
        assert config.preserve_all_locations is True

    def test_custom_threshold(self):
        config = DeduplicationConfig(threshold=0.9)
        assert config.threshold == 0.9


class TestDashboardConfig:
    """Tests for DashboardConfig."""

    def test_default_values(self):
        config = DashboardConfig()
        assert config.enabled is True
        assert config.page_size == 50
        assert config.build_search_index is True
        assert config.precompute_charts is True


class TestPreprocessingConfig:
    """Tests for PreprocessingConfig."""

    def test_default_values(self):
        config = PreprocessingConfig()
        assert isinstance(config.cleaning, CleaningConfig)
        assert isinstance(config.transformation, TransformationConfig)
        assert isinstance(config.deduplication, DeduplicationConfig)
        assert isinstance(config.dashboard, DashboardConfig)
        assert config.parallel is False
        assert config.cache_enabled is True

    def test_from_dict_empty(self):
        config = PreprocessingConfig.from_dict({})
        assert config.cleaning.enabled is True
        assert config.transformation.enabled is True

    def test_from_dict_with_values(self):
        data = {
            "cleaning": {
                "enabled": False,
                "normalize_paths": True,
            },
            "deduplication": {
                "threshold": 0.9,
            },
            "parallel": True,
        }
        config = PreprocessingConfig.from_dict(data)
        assert config.cleaning.enabled is False
        assert config.deduplication.threshold == 0.9
        assert config.parallel is True

    def test_from_file(self, tmp_path):
        config_data = {
            "cleaning": {"enabled": True},
            "deduplication": {"threshold": 0.75},
            "dashboard": {"page_size": 100},
        }
        config_file = tmp_path / "config.json"
        config_file.write_text(json.dumps(config_data))

        config = PreprocessingConfig.from_file(config_file)
        assert config.cleaning.enabled is True
        assert config.deduplication.threshold == 0.75
        assert config.dashboard.page_size == 100

    def test_to_dict(self):
        config = PreprocessingConfig()
        data = config.to_dict()

        assert "cleaning" in data
        assert "transformation" in data
        assert "deduplication" in data
        assert "dashboard" in data
        assert data["parallel"] is False
        assert data["cache_enabled"] is True

    def test_round_trip(self):
        """Test that from_dict(to_dict()) preserves values."""
        original = PreprocessingConfig()
        original.deduplication.threshold = 0.8
        original.dashboard.page_size = 25

        data = original.to_dict()
        restored = PreprocessingConfig.from_dict(data)

        assert restored.deduplication.threshold == 0.8
        assert restored.dashboard.page_size == 25
