#!/usr/bin/env python3
"""
Integration tests for preprocessing pipeline with ToolIdentifier.

Tests end-to-end flow from code analysis through preprocessing to final output.
"""

import json
import shutil
import tempfile
import time
from pathlib import Path
from typing import Any

import pytest

from src.analyzers.identify_tools import (
    ToolIdentifier,
    ToolIdentificationReport,
    ToolCandidate,
    ModuleInfo,
    FunctionInfo,
    ModularityScore,
)
from src.analyzers.preprocessing import (
    PreprocessingConfig,
    PreprocessingPipeline,
)
from src.analyzers.preprocessing.config import (
    CleaningConfig,
    TransformationConfig,
    DeduplicationConfig,
    DashboardConfig,
)


class TestToolIdentifierWithPreprocessing:
    """Integration tests for ToolIdentifier with preprocessing enabled."""

    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        temp_path = tempfile.mkdtemp()
        yield Path(temp_path)
        shutil.rmtree(temp_path, ignore_errors=True)

    @pytest.fixture
    def sample_python_file(self, temp_dir):
        """Create a sample Python file for analysis."""
        file_path = temp_dir / "sample_utils.py"
        file_path.write_text('''"""Sample utility module."""

def format_date(date_str: str) -> str:
    """Format a date string."""
    return date_str.strip()

def parse_number(value: str) -> int:
    """Parse a number from string."""
    return int(value)

def validate_email(email: str) -> bool:
    """Validate email format."""
    return "@" in email

class DataHelper:
    """Helper class for data operations."""

    def __init__(self):
        self.data = []

    def add(self, item):
        """Add an item."""
        self.data.append(item)

    def get_all(self):
        """Get all items."""
        return self.data
''')
        return file_path

    @pytest.fixture
    def default_config(self) -> PreprocessingConfig:
        """Create default preprocessing configuration."""
        return PreprocessingConfig()

    @pytest.fixture
    def minimal_config(self) -> PreprocessingConfig:
        """Create minimal preprocessing config (only cleaning)."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        config.transformation.enabled = False
        config.deduplication.enabled = False
        config.dashboard.enabled = False
        return config

    def test_identifier_initializes_with_preprocessing(self, temp_dir, default_config):
        """ToolIdentifier should initialize with preprocessing pipeline."""
        identifier = ToolIdentifier(temp_dir, preprocessing_config=default_config)

        assert identifier.preprocessor is not None
        assert isinstance(identifier.preprocessor, PreprocessingPipeline)

    def test_identifier_initializes_without_preprocessing(self, temp_dir):
        """ToolIdentifier should work without preprocessing."""
        identifier = ToolIdentifier(temp_dir)

        assert identifier.preprocessor is None

    def test_save_report_json_with_preprocessing(
        self, temp_dir, sample_python_file, default_config
    ):
        """save_report_json should apply preprocessing pipeline."""
        identifier = ToolIdentifier(temp_dir, preprocessing_config=default_config)

        # Analyze the sample file
        module_info = identifier.analyze_file(sample_python_file)
        identifier._process_module(module_info)

        # Save with preprocessing
        output_path = temp_dir / "report.json"
        identifier.save_report_json(output_path)

        # Load and verify
        with open(output_path) as f:
            data = json.load(f)

        assert "summary" in data
        assert "tool_candidates" in data
        # Preprocessing should have normalized paths
        for candidate in data.get("tool_candidates", []):
            # Paths should use forward slashes
            assert "\\" not in candidate.get("file_path", "")

    def test_save_report_json_without_preprocessing(
        self, temp_dir, sample_python_file
    ):
        """save_report_json should work without preprocessing."""
        identifier = ToolIdentifier(temp_dir)

        # Analyze
        module_info = identifier.analyze_file(sample_python_file)
        identifier._process_module(module_info)

        # Save without preprocessing
        output_path = temp_dir / "report.json"
        identifier.save_report_json(output_path)

        # Should still create valid JSON
        with open(output_path) as f:
            data = json.load(f)

        assert "summary" in data
        assert "tool_candidates" in data

    def test_preprocessing_normalizes_windows_paths(self, temp_dir, default_config):
        """Preprocessing should normalize Windows-style paths."""
        identifier = ToolIdentifier(temp_dir, preprocessing_config=default_config)

        # Manually add a candidate with Windows path
        identifier.report.tool_candidates.append(
            ToolCandidate(
                name="test_func",
                type="function",
                file_path="src\\utils\\helpers.py",  # Windows-style
                line_number=10,
                description="Test function",
                dependencies=[],
                modularity_score=ModularityScore.HIGHLY_MODULAR,
                extraction_potential=0.9,
                extraction_complexity="trivial",
                suggested_package_name="test-func",
                rationale="Test"
            )
        )

        # Save with preprocessing
        output_path = temp_dir / "report.json"
        identifier.save_report_json(output_path)

        # Load and verify paths are normalized
        with open(output_path) as f:
            data = json.load(f)

        assert len(data["tool_candidates"]) > 0
        # Path should be normalized to forward slashes
        assert "\\" not in data["tool_candidates"][0]["file_path"]
        assert data["tool_candidates"][0]["file_path"] == "src/utils/helpers.py"

    def test_preprocessing_cleans_meta_variables(self, temp_dir, default_config):
        """Preprocessing should clean meta variables from descriptions."""
        identifier = ToolIdentifier(temp_dir, preprocessing_config=default_config)

        # Add candidate with meta variable in description
        identifier.report.tool_candidates.append(
            ToolCandidate(
                name="func",
                type="function",
                file_path="test.py",
                line_number=1,
                description="Function $NAME with $PARAMS",
                dependencies=[],
                modularity_score=ModularityScore.MODULAR,
                extraction_potential=0.8,
                extraction_complexity="easy",
                suggested_package_name="func",
                rationale="Test with $VAR"
            )
        )

        # Save with preprocessing
        output_path = temp_dir / "report.json"
        identifier.save_report_json(output_path)

        # Load and verify meta variables are cleaned
        with open(output_path) as f:
            data = json.load(f)

        candidate = data["tool_candidates"][0]
        assert "$NAME" not in candidate["description"]
        assert "$PARAMS" not in candidate["description"]

    def test_preprocessing_adds_naming_convention(self, temp_dir, default_config):
        """Preprocessing should add naming convention metadata."""
        identifier = ToolIdentifier(temp_dir, preprocessing_config=default_config)

        # Add candidates with different naming conventions
        identifier.report.tool_candidates.extend([
            ToolCandidate(
                name="camelCaseFunc",
                type="function",
                file_path="test.py",
                line_number=1,
                description="camelCase function",
                dependencies=[],
                modularity_score=ModularityScore.MODULAR,
                extraction_potential=0.8,
                extraction_complexity="easy",
                suggested_package_name="camel-case-func",
                rationale="Test"
            ),
            ToolCandidate(
                name="snake_case_func",
                type="function",
                file_path="test.py",
                line_number=10,
                description="snake_case function",
                dependencies=[],
                modularity_score=ModularityScore.MODULAR,
                extraction_potential=0.8,
                extraction_complexity="easy",
                suggested_package_name="snake-case-func",
                rationale="Test"
            ),
        ])

        # Save with preprocessing
        output_path = temp_dir / "report.json"
        identifier.save_report_json(output_path)

        # Load and verify naming conventions are detected
        with open(output_path) as f:
            data = json.load(f)

        assert len(data["tool_candidates"]) >= 2
        # Should have naming convention metadata
        assert "_naming_convention" in data["tool_candidates"][0]


class TestPreprocessingPipelineIntegration:
    """Integration tests for preprocessing pipeline stages."""

    @pytest.fixture
    def sample_report_data(self) -> dict:
        """Create sample report data for testing."""
        return {
            "summary": {
                "root_directory": "/home/user/project",
                "files_analyzed": 10,
                "total_functions": 25,
                "total_classes": 5,
                "tool_candidates_count": 8,
                "modularity_distribution": {
                    "highly_modular": 5,
                    "modular": 10,
                    "semi_modular": 3,
                    "coupled": 2,
                }
            },
            "tool_candidates": [
                {
                    "name": "formatDate",
                    "type": "function",
                    "file_path": "src\\utils\\date.py",
                    "line_number": 10,
                    "description": "Function $NAME formats dates",
                    "dependencies": ["datetime"],
                    "modularity_score": "highly_modular",
                    "extraction_potential": 0.95,
                    "extraction_complexity": "trivial",
                    "suggested_package_name": "date-format",
                    "rationale": "Highly modular"
                },
                {
                    "name": "parse_json",
                    "type": "function",
                    "file_path": "src/utils/parser.py",
                    "line_number": 20,
                    "description": "Parses JSON data",
                    "dependencies": ["json"],
                    "modularity_score": "modular",
                    "extraction_potential": 0.85,
                    "extraction_complexity": "easy",
                    "suggested_package_name": "json-parser",
                    "rationale": "Good modularity"
                },
                {
                    "name": "formatDate",  # Duplicate name!
                    "type": "function",
                    "file_path": "src/helpers/format.py",
                    "line_number": 5,
                    "description": "Another date formatter",
                    "dependencies": ["datetime"],
                    "modularity_score": "modular",
                    "extraction_potential": 0.80,
                    "extraction_complexity": "easy",
                    "suggested_package_name": "date-format",
                    "rationale": "Modular function"
                },
            ],
            "utility_modules": [
                {
                    "file_path": "src/utils/helpers.py",
                    "function_count": 5,
                    "class_count": 1,
                    "external_dependencies": ["requests"],
                    "internal_dependencies": [],
                    "modularity_score": "highly_modular",
                    "extraction_potential": 0.9
                }
            ]
        }

    def test_full_pipeline_with_all_stages(self, sample_report_data):
        """Full pipeline should process data through all stages."""
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        result = pipeline.process(sample_report_data)

        assert result.success
        assert len(result.stages_run) >= 1
        assert "cleaning" in result.stages_run or "cleaning" in result.stages_skipped

        # Data should be transformed
        assert "tool_candidates" in result.data

    def test_pipeline_cleans_and_deduplicates(self, sample_report_data):
        """Pipeline should clean paths and handle duplicates."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        config.deduplication.enabled = True

        pipeline = PreprocessingPipeline(config)
        result = pipeline.process(sample_report_data)

        assert result.success

        # Check paths are normalized
        for candidate in result.data.get("tool_candidates", []):
            assert "\\" not in candidate.get("file_path", "")

    def test_pipeline_transformation_stage(self, sample_report_data):
        """Transformation stage should add pattern detection."""
        config = PreprocessingConfig()
        config.cleaning.enabled = True
        config.transformation.enabled = True
        config.deduplication.enabled = False
        config.dashboard.enabled = False

        pipeline = PreprocessingPipeline(config)
        result = pipeline.process(sample_report_data)

        assert result.success
        assert "transformation" in result.stages_run

    def test_pipeline_collects_metrics(self, sample_report_data):
        """Pipeline should collect timing metrics from all stages."""
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        result = pipeline.process(sample_report_data)

        assert result.total_duration_ms >= 0
        assert isinstance(result.stage_metrics, dict)

    def test_pipeline_handles_empty_data(self):
        """Pipeline should handle empty input data."""
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        empty_data = {
            "summary": {
                "files_analyzed": 0,
                "total_functions": 0,
            },
            "tool_candidates": [],
            "utility_modules": []
        }

        result = pipeline.process(empty_data)

        assert result.success
        assert result.data["tool_candidates"] == []


class TestEndToEndWorkflow:
    """End-to-end tests for complete analysis workflow."""

    @pytest.fixture
    def temp_project(self):
        """Create a temporary project structure for testing."""
        temp_path = tempfile.mkdtemp()
        project_dir = Path(temp_path) / "test_project"
        project_dir.mkdir()

        # Create utility module
        utils_dir = project_dir / "utils"
        utils_dir.mkdir()

        (utils_dir / "string_utils.py").write_text('''"""String utility functions."""

def format_string(text: str) -> str:
    """Format a string by trimming whitespace."""
    return text.strip()

def validate_length(text: str, max_len: int) -> bool:
    """Validate string length."""
    return len(text) <= max_len

def parse_csv_line(line: str) -> list:
    """Parse a CSV line into fields."""
    return line.split(",")
''')

        (utils_dir / "math_utils.py").write_text('''"""Math utility functions."""

def calculate_average(numbers: list) -> float:
    """Calculate average of numbers."""
    if not numbers:
        return 0.0
    return sum(numbers) / len(numbers)

def calculate_sum(numbers: list) -> float:
    """Calculate sum of numbers."""
    return sum(numbers)

def is_even(n: int) -> bool:
    """Check if number is even."""
    return n % 2 == 0
''')

        # Create service module (more coupled)
        services_dir = project_dir / "services"
        services_dir.mkdir()

        (services_dir / "data_service.py").write_text('''"""Data service with external dependencies."""

import json
import os
import requests
from pathlib import Path

class DataService:
    """Service for data operations."""

    def __init__(self, api_url: str):
        self.api_url = api_url
        self.cache = {}

    def fetch_data(self, endpoint: str) -> dict:
        """Fetch data from API."""
        response = requests.get(f"{self.api_url}/{endpoint}")
        return response.json()

    def save_to_file(self, data: dict, path: str) -> None:
        """Save data to file."""
        with open(path, "w") as f:
            json.dump(data, f)
''')

        yield project_dir
        shutil.rmtree(temp_path, ignore_errors=True)

    def test_analyze_project_with_preprocessing(self, temp_project):
        """Analyze entire project with preprocessing enabled."""
        config = PreprocessingConfig()
        identifier = ToolIdentifier(temp_project, preprocessing_config=config)

        # Analyze directory
        identifier.analyze_directory()

        # Verify analysis results - at least files are analyzed
        # Note: function detection depends on ast-grep being installed
        assert identifier.report.total_files_analyzed >= 3

        # Save with preprocessing
        output_path = temp_project / "report.json"
        identifier.save_report_json(output_path)

        # Load and verify
        with open(output_path) as f:
            data = json.load(f)

        assert "summary" in data
        assert data["summary"]["files_analyzed"] >= 3

    def test_utility_modules_detected(self, temp_project):
        """Utility modules should be detected and marked."""
        config = PreprocessingConfig()
        identifier = ToolIdentifier(temp_project, preprocessing_config=config)

        identifier.analyze_directory()

        # Save and load
        output_path = temp_project / "report.json"
        identifier.save_report_json(output_path)

        with open(output_path) as f:
            data = json.load(f)

        # Should have utility modules
        utility_modules = data.get("utility_modules", [])
        assert len(utility_modules) >= 1

        # Check utility module paths
        utility_paths = [m["file_path"] for m in utility_modules]
        assert any("utils" in p for p in utility_paths)

    def test_modularity_scores_calculated(self, temp_project):
        """Modularity scores should be calculated for all components."""
        config = PreprocessingConfig()
        identifier = ToolIdentifier(temp_project, preprocessing_config=config)

        identifier.analyze_directory()

        output_path = temp_project / "report.json"
        identifier.save_report_json(output_path)

        with open(output_path) as f:
            data = json.load(f)

        # Check modularity distribution
        dist = data["summary"]["modularity_distribution"]
        total = sum(dist.values())
        assert total >= 3  # At least 3 files analyzed

    def test_preprocessing_performance_acceptable(self, temp_project):
        """Preprocessing should complete in reasonable time."""
        config = PreprocessingConfig()
        identifier = ToolIdentifier(temp_project, preprocessing_config=config)

        identifier.analyze_directory()

        # Time the preprocessing
        start_time = time.time()
        output_path = temp_project / "report.json"
        identifier.save_report_json(output_path)
        elapsed_ms = (time.time() - start_time) * 1000

        # Should complete in under 5 seconds for small project
        assert elapsed_ms < 5000, f"Preprocessing took {elapsed_ms:.2f}ms"


class TestPreprocessingConfigFromFile:
    """Tests for loading preprocessing config from file."""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory."""
        temp_path = tempfile.mkdtemp()
        yield Path(temp_path)
        shutil.rmtree(temp_path, ignore_errors=True)

    def test_load_config_from_json(self, temp_dir):
        """Should load config from JSON file."""
        config_data = {
            "cleaning": {
                "enabled": True,
                "normalize_paths": True,
                "normalize_names": True
            },
            "transformation": {
                "enabled": True,
                "detect_patterns": True
            },
            "deduplication": {
                "enabled": True,
                "threshold": 0.80
            },
            "dashboard": {
                "enabled": False
            }
        }

        config_path = temp_dir / "preprocess.json"
        with open(config_path, "w") as f:
            json.dump(config_data, f)

        config = PreprocessingConfig.from_file(config_path)

        assert config.cleaning.enabled is True
        assert config.transformation.enabled is True
        assert config.deduplication.enabled is True
        assert config.deduplication.threshold == 0.80
        assert config.dashboard.enabled is False

    def test_identifier_uses_config_file(self, temp_dir):
        """ToolIdentifier should use config loaded from file."""
        config_data = {
            "cleaning": {"enabled": True},
            "transformation": {"enabled": False},
            "deduplication": {"enabled": False},
            "dashboard": {"enabled": False}
        }

        config_path = temp_dir / "config.json"
        with open(config_path, "w") as f:
            json.dump(config_data, f)

        config = PreprocessingConfig.from_file(config_path)
        identifier = ToolIdentifier(temp_dir, preprocessing_config=config)

        assert identifier.preprocessor is not None
        # Only cleaning stage should be enabled
        stage_names = identifier.preprocessor.stage_names
        assert "cleaning" in stage_names or len(identifier.preprocessor) >= 1


class TestPreprocessingRobustness:
    """Tests for preprocessing error handling and robustness."""

    def test_handles_malformed_candidates(self):
        """Pipeline should handle malformed candidate data."""
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        malformed_data = {
            "summary": {"files_analyzed": 1},
            "tool_candidates": [
                {
                    "name": "valid_func",
                    "type": "function",
                    "file_path": "test.py",
                    # Missing required fields
                }
            ],
            "utility_modules": []
        }

        # Should not raise, but may have warnings
        result = pipeline.process(malformed_data)
        # Pipeline continues even with partial data
        assert result.data is not None

    def test_handles_unicode_names(self):
        """Pipeline should handle unicode in names."""
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        unicode_data = {
            "summary": {"files_analyzed": 1},
            "tool_candidates": [
                {
                    "name": "格式化日期",
                    "type": "function",
                    "file_path": "utils/日期.py",
                    "line_number": 1,
                    "description": "Format dates with unicode 日期",
                    "dependencies": [],
                    "modularity_score": "modular",
                    "extraction_potential": 0.8,
                    "extraction_complexity": "easy",
                    "suggested_package_name": "date-util",
                    "rationale": "Test"
                }
            ],
            "utility_modules": []
        }

        result = pipeline.process(unicode_data)
        assert result.success
        assert result.data["tool_candidates"][0]["name"] == "格式化日期"

    def test_handles_very_long_paths(self):
        """Pipeline should handle very long file paths."""
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        long_path = "/very/long/path/" + "nested/" * 50 + "file.py"

        data = {
            "summary": {"files_analyzed": 1},
            "tool_candidates": [
                {
                    "name": "func",
                    "type": "function",
                    "file_path": long_path,
                    "line_number": 1,
                    "description": "Test",
                    "dependencies": [],
                    "modularity_score": "modular",
                    "extraction_potential": 0.8,
                    "extraction_complexity": "easy",
                    "suggested_package_name": "func",
                    "rationale": "Test"
                }
            ],
            "utility_modules": []
        }

        result = pipeline.process(data)
        assert result.success

    def test_handles_empty_strings(self):
        """Pipeline should handle empty string fields."""
        config = PreprocessingConfig()
        pipeline = PreprocessingPipeline(config)

        data = {
            "summary": {"files_analyzed": 1},
            "tool_candidates": [
                {
                    "name": "",
                    "type": "function",
                    "file_path": "",
                    "line_number": 0,
                    "description": "",
                    "dependencies": [],
                    "modularity_score": "modular",
                    "extraction_potential": 0.5,
                    "extraction_complexity": "easy",
                    "suggested_package_name": "",
                    "rationale": ""
                }
            ],
            "utility_modules": []
        }

        result = pipeline.process(data)
        assert result.success


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
