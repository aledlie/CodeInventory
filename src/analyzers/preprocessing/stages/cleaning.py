"""Cleaning stage for preprocessing pipeline.

This module provides data cleaning functionality including:
- Name normalization (camelCase, snake_case, PascalCase)
- Meta variable cleaning (removing ast-grep placeholders)
- Path normalization (via PathNormalizer utility)
"""
import re
from dataclasses import dataclass
from typing import Any, Optional

from .base import PreprocessingStage, StageResult
from ..config import CleaningConfig
from ..utils.path_utils import PathNormalizer


@dataclass
class NamingConvention:
    """Detected naming convention information."""
    original: str
    normalized: str
    convention: str  # 'snake_case', 'camelCase', 'PascalCase', 'kebab-case', 'unknown'
    is_valid: bool


class NameNormalizer:
    """Normalizes identifier names for consistency.

    Detects and optionally converts between naming conventions:
    - snake_case: my_function_name
    - camelCase: myFunctionName
    - PascalCase: MyFunctionName
    - kebab-case: my-function-name
    """

    # Patterns for detecting naming conventions
    SNAKE_CASE_PATTERN = re.compile(r'^[a-z][a-z0-9]*(_[a-z0-9]+)*$')
    CAMEL_CASE_PATTERN = re.compile(r'^[a-z][a-zA-Z0-9]*$')
    PASCAL_CASE_PATTERN = re.compile(r'^[A-Z][a-zA-Z0-9]*$')
    KEBAB_CASE_PATTERN = re.compile(r'^[a-z][a-z0-9]*(-[a-z0-9]+)*$')

    # Pattern for splitting camelCase/PascalCase
    CAMEL_SPLIT_PATTERN = re.compile(r'(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])')

    def __init__(self, target_convention: str = 'detect'):
        """Initialize the name normalizer.

        Args:
            target_convention: Target naming convention for normalization.
                Options: 'snake_case', 'camelCase', 'PascalCase', 'kebab-case', 'detect'
                If 'detect', names are not converted, only analyzed.
        """
        self.target_convention = target_convention

    def detect_convention(self, name: str) -> str:
        """Detect the naming convention of an identifier.

        Args:
            name: The identifier name to analyze.

        Returns:
            The detected convention name.
        """
        if not name or not isinstance(name, str):
            return 'unknown'

        # Check for dunder/magic methods
        if name.startswith('__') and name.endswith('__'):
            return 'dunder'

        # Check for private names (leading underscore)
        clean_name = name.lstrip('_')
        if not clean_name:
            return 'unknown'

        # Test patterns
        if self.SNAKE_CASE_PATTERN.match(clean_name):
            return 'snake_case'
        elif self.PASCAL_CASE_PATTERN.match(clean_name):
            return 'PascalCase'
        elif self.CAMEL_CASE_PATTERN.match(clean_name):
            return 'camelCase'
        elif self.KEBAB_CASE_PATTERN.match(clean_name):
            return 'kebab-case'
        else:
            return 'mixed'

    def normalize(self, name: str) -> NamingConvention:
        """Normalize a name according to target convention.

        Args:
            name: The identifier name to normalize.

        Returns:
            NamingConvention with original and normalized names.
        """
        if not name or not isinstance(name, str):
            return NamingConvention(
                original=name or '',
                normalized=name or '',
                convention='unknown',
                is_valid=False
            )

        detected = self.detect_convention(name)

        # If target is 'detect' or same as detected, don't convert
        if self.target_convention == 'detect' or detected == self.target_convention:
            return NamingConvention(
                original=name,
                normalized=name,
                convention=detected,
                is_valid=True
            )

        # Convert to target convention
        normalized = self._convert(name, detected, self.target_convention)

        return NamingConvention(
            original=name,
            normalized=normalized,
            convention=detected,
            is_valid=True
        )

    def _convert(self, name: str, from_conv: str, to_conv: str) -> str:
        """Convert a name from one convention to another.

        Args:
            name: The name to convert.
            from_conv: Source convention.
            to_conv: Target convention.

        Returns:
            Converted name.
        """
        # Preserve leading underscores
        leading_underscores = len(name) - len(name.lstrip('_'))
        prefix = '_' * leading_underscores
        clean_name = name.lstrip('_')

        # Split into words
        words = self._split_into_words(clean_name, from_conv)

        # Join according to target convention
        converted = self._join_words(words, to_conv)

        return prefix + converted

    def _split_into_words(self, name: str, convention: str) -> list[str]:
        """Split a name into words based on its convention.

        Args:
            name: The name to split.
            convention: The naming convention of the name.

        Returns:
            List of lowercase words.
        """
        if convention == 'snake_case':
            return [w.lower() for w in name.split('_') if w]
        elif convention == 'kebab-case':
            return [w.lower() for w in name.split('-') if w]
        elif convention in ('camelCase', 'PascalCase'):
            # Split on case boundaries
            words = self.CAMEL_SPLIT_PATTERN.split(name)
            return [w.lower() for w in words if w]
        else:
            # For mixed/unknown, try to intelligently split
            # First try underscores/hyphens, then case boundaries
            if '_' in name:
                words = name.split('_')
            elif '-' in name:
                words = name.split('-')
            else:
                words = self.CAMEL_SPLIT_PATTERN.split(name)
            return [w.lower() for w in words if w]

    def _join_words(self, words: list[str], convention: str) -> str:
        """Join words according to a naming convention.

        Args:
            words: List of lowercase words.
            convention: Target naming convention.

        Returns:
            Joined name in target convention.
        """
        if not words:
            return ''

        if convention == 'snake_case':
            return '_'.join(words)
        elif convention == 'kebab-case':
            return '-'.join(words)
        elif convention == 'camelCase':
            return words[0] + ''.join(w.capitalize() for w in words[1:])
        elif convention == 'PascalCase':
            return ''.join(w.capitalize() for w in words)
        else:
            # Default to snake_case
            return '_'.join(words)

    def get_convention_stats(self, names: list[str]) -> dict[str, int]:
        """Analyze naming convention distribution across a list of names.

        Args:
            names: List of identifier names.

        Returns:
            Dictionary mapping convention names to counts.
        """
        stats: dict[str, int] = {}
        for name in names:
            conv = self.detect_convention(name)
            stats[conv] = stats.get(conv, 0) + 1
        return stats


class MetaVariableCleaner:
    """Cleans meta variables from ast-grep matches.

    Removes or replaces meta variable placeholders like:
    - $NAME, $MODULE, $PARAMS, $BODY
    - $$$MULTI for multi-capture variables
    - Single/multi variations from metaVariables dict
    """

    # Pattern for ast-grep meta variables
    META_VAR_PATTERN = re.compile(r'\$+[A-Z_]+')

    # Common meta variable names from ast-grep
    KNOWN_META_VARS = {
        'NAME', 'MODULE', 'PARAMS', 'BODY', 'TYPE',
        'VALUE', 'ARGS', 'BASE', 'BASES', 'NAMES',
        'CONDITION', 'EXPR', 'STATEMENT'
    }

    def __init__(self, replacement: str = ''):
        """Initialize the meta variable cleaner.

        Args:
            replacement: String to replace meta variables with.
                Empty string removes them entirely.
        """
        self.replacement = replacement

    def clean(self, text: str) -> str:
        """Remove meta variable placeholders from text.

        Args:
            text: Text potentially containing meta variables.

        Returns:
            Cleaned text with meta variables removed/replaced.
        """
        if not text or not isinstance(text, str):
            return text or ''

        return self.META_VAR_PATTERN.sub(self.replacement, text)

    def clean_dict(self, data: dict[str, Any]) -> dict[str, Any]:
        """Clean meta variables from all string values in a dictionary.

        Args:
            data: Dictionary with potentially contaminated string values.

        Returns:
            Dictionary with cleaned string values.
        """
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = self.clean(value)
            elif isinstance(value, dict):
                result[key] = self.clean_dict(value)
            elif isinstance(value, list):
                result[key] = self.clean_list(value)
            else:
                result[key] = value
        return result

    def clean_list(self, data: list[Any]) -> list[Any]:
        """Clean meta variables from all string values in a list.

        Args:
            data: List with potentially contaminated string values.

        Returns:
            List with cleaned string values.
        """
        result = []
        for item in data:
            if isinstance(item, str):
                result.append(self.clean(item))
            elif isinstance(item, dict):
                result.append(self.clean_dict(item))
            elif isinstance(item, list):
                result.append(self.clean_list(item))
            else:
                result.append(item)
        return result

    def has_meta_variables(self, text: str) -> bool:
        """Check if text contains meta variable placeholders.

        Args:
            text: Text to check.

        Returns:
            True if meta variables are present.
        """
        if not text or not isinstance(text, str):
            return False
        return bool(self.META_VAR_PATTERN.search(text))

    def extract_meta_variables(self, text: str) -> list[str]:
        """Extract all meta variable names from text.

        Args:
            text: Text to extract from.

        Returns:
            List of meta variable names found.
        """
        if not text or not isinstance(text, str):
            return []
        return self.META_VAR_PATTERN.findall(text)


class CleaningStage(PreprocessingStage[dict, dict]):
    """Preprocessing stage that cleans and normalizes data.

    This stage applies:
    1. Path normalization (absolute to relative, separator normalization)
    2. Name normalization (consistent naming conventions)
    3. Meta variable cleaning (remove ast-grep placeholders)

    Input: Raw tool identification report as dictionary
    Output: Cleaned report dictionary with normalized data
    """

    def __init__(self, config: CleaningConfig):
        """Initialize the cleaning stage.

        Args:
            config: Configuration for cleaning behavior.
        """
        super().__init__(config)
        self.path_normalizer = PathNormalizer(config.path_config)
        self.name_normalizer = NameNormalizer(target_convention='detect')
        self.meta_cleaner = MetaVariableCleaner()

    @property
    def name(self) -> str:
        """Return the stage name."""
        return "cleaning"

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        """Validate that input is a valid report dictionary.

        Args:
            data: Input data to validate.

        Returns:
            Tuple of (is_valid, list of error messages).
        """
        errors = []

        if not isinstance(data, dict):
            errors.append("Input must be a dictionary")
            return False, errors

        # Check for expected top-level keys (at least one should be present)
        expected_keys = {'summary', 'tool_candidates', 'utility_modules'}
        found_keys = set(data.keys()) & expected_keys

        if not found_keys:
            errors.append(
                f"Input should contain at least one of: {expected_keys}. "
                f"Found keys: {set(data.keys())}"
            )

        return len(errors) == 0, errors

    def process(self, data: dict) -> StageResult[dict]:
        """Process the input data through all cleaning operations.

        Args:
            data: Raw report dictionary.

        Returns:
            StageResult with cleaned data.
        """
        config: CleaningConfig = self.config
        cleaned = data.copy()
        metrics: dict[str, Any] = {
            'paths_normalized': 0,
            'names_analyzed': 0,
            'meta_vars_cleaned': 0,
        }
        warnings: list[str] = []

        # Clean tool candidates
        if 'tool_candidates' in cleaned:
            cleaned['tool_candidates'], candidate_metrics = self._clean_candidates(
                cleaned['tool_candidates'],
                config
            )
            metrics['paths_normalized'] += candidate_metrics.get('paths_normalized', 0)
            metrics['names_analyzed'] += candidate_metrics.get('names_analyzed', 0)
            metrics['meta_vars_cleaned'] += candidate_metrics.get('meta_vars_cleaned', 0)

        # Clean utility modules
        if 'utility_modules' in cleaned:
            cleaned['utility_modules'], module_metrics = self._clean_modules(
                cleaned['utility_modules'],
                config
            )
            metrics['paths_normalized'] += module_metrics.get('paths_normalized', 0)

        # Clean summary paths if present
        if 'summary' in cleaned and config.normalize_paths:
            cleaned['summary'] = self._clean_summary(cleaned['summary'])

        # Add naming convention statistics
        if 'tool_candidates' in cleaned:
            names = [c.get('name', '') for c in cleaned.get('tool_candidates', [])]
            metrics['naming_conventions'] = self.name_normalizer.get_convention_stats(names)

        return StageResult.ok(cleaned, warnings=warnings, metrics=metrics)

    def _clean_candidates(
        self,
        candidates: list[dict],
        config: CleaningConfig
    ) -> tuple[list[dict], dict[str, int]]:
        """Clean a list of tool candidates.

        Args:
            candidates: List of candidate dictionaries.
            config: Cleaning configuration.

        Returns:
            Tuple of (cleaned candidates, metrics).
        """
        cleaned = []
        metrics = {'paths_normalized': 0, 'names_analyzed': 0, 'meta_vars_cleaned': 0}

        for candidate in candidates:
            clean_candidate = candidate.copy()

            # Normalize file path
            if config.normalize_paths and 'file_path' in clean_candidate:
                original_path = clean_candidate['file_path']
                clean_candidate['file_path'] = self.path_normalizer.normalize(original_path)
                if clean_candidate['file_path'] != original_path:
                    metrics['paths_normalized'] += 1

            # Analyze name (don't convert, just detect convention)
            if config.normalize_names and 'name' in clean_candidate:
                name_info = self.name_normalizer.normalize(clean_candidate['name'])
                clean_candidate['_naming_convention'] = name_info.convention
                metrics['names_analyzed'] += 1

            # Clean meta variables from string fields
            if config.clean_meta_variables:
                for field in ['description', 'rationale', 'suggested_package_name']:
                    if field in clean_candidate and isinstance(clean_candidate[field], str):
                        original = clean_candidate[field]
                        clean_candidate[field] = self.meta_cleaner.clean(original)
                        if clean_candidate[field] != original:
                            metrics['meta_vars_cleaned'] += 1

                # Clean dependencies list
                if 'dependencies' in clean_candidate:
                    clean_candidate['dependencies'] = [
                        self.meta_cleaner.clean(d) if isinstance(d, str) else d
                        for d in clean_candidate['dependencies']
                    ]

            cleaned.append(clean_candidate)

        return cleaned, metrics

    def _clean_modules(
        self,
        modules: list[dict],
        config: CleaningConfig
    ) -> tuple[list[dict], dict[str, int]]:
        """Clean a list of utility modules.

        Args:
            modules: List of module dictionaries.
            config: Cleaning configuration.

        Returns:
            Tuple of (cleaned modules, metrics).
        """
        cleaned = []
        metrics = {'paths_normalized': 0}

        for module in modules:
            clean_module = module.copy()

            # Normalize file path
            if config.normalize_paths and 'file_path' in clean_module:
                original_path = clean_module['file_path']
                clean_module['file_path'] = self.path_normalizer.normalize(original_path)
                if clean_module['file_path'] != original_path:
                    metrics['paths_normalized'] += 1

            # Clean dependency lists
            for dep_field in ['external_dependencies', 'internal_dependencies']:
                if dep_field in clean_module:
                    clean_deps = []
                    for dep in clean_module[dep_field]:
                        if isinstance(dep, str):
                            clean_deps.append(self.meta_cleaner.clean(dep))
                        else:
                            clean_deps.append(dep)
                    clean_module[dep_field] = clean_deps

            cleaned.append(clean_module)

        return cleaned, metrics

    def _clean_summary(self, summary: dict) -> dict:
        """Clean the summary section.

        Args:
            summary: Summary dictionary.

        Returns:
            Cleaned summary dictionary.
        """
        cleaned = summary.copy()

        # Normalize root directory path
        if 'root_directory' in cleaned:
            cleaned['root_directory'] = self.path_normalizer.normalize(
                cleaned['root_directory']
            )

        return cleaned
