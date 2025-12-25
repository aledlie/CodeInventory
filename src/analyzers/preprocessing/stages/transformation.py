"""Transformation stage for preprocessing pipeline.

This module provides data transformation functionality including:
- Dependency resolution (categorizing internal/external dependencies)
- Pattern detection (caching, validation, error handling, logging, etc.)
- Complexity calculation (enhanced metrics beyond basic counts)
"""
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from .base import PreprocessingStage, StageResult
from ..config import TransformationConfig


class DependencyType(Enum):
    """Types of dependencies."""
    INTERNAL = "internal"  # Same project
    EXTERNAL = "external"  # Third-party package
    STDLIB = "stdlib"      # Python standard library
    UNKNOWN = "unknown"    # Cannot determine


@dataclass
class ResolvedDependency:
    """A resolved dependency with metadata."""
    name: str
    type: DependencyType
    module_path: Optional[str] = None
    is_direct: bool = True
    usage_count: int = 1


@dataclass
class DependencyGraph:
    """Graph of dependencies for a tool candidate."""
    dependencies: list[ResolvedDependency]
    internal_count: int = 0
    external_count: int = 0
    stdlib_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'dependencies': [
                {
                    'name': d.name,
                    'type': d.type.value,
                    'module_path': d.module_path,
                    'is_direct': d.is_direct,
                    'usage_count': d.usage_count,
                }
                for d in self.dependencies
            ],
            'counts': {
                'internal': self.internal_count,
                'external': self.external_count,
                'stdlib': self.stdlib_count,
                'total': len(self.dependencies),
            }
        }


class DependencyResolver:
    """Resolves and categorizes dependencies for tool candidates.

    Analyzes dependency lists and categorizes them as:
    - Internal: Dependencies from the same project
    - External: Third-party packages
    - Stdlib: Python standard library modules
    """

    # Common Python standard library modules
    STDLIB_MODULES = frozenset({
        'os', 'sys', 're', 'json', 'typing', 'pathlib', 'collections',
        'itertools', 'functools', 'abc', 'dataclasses', 'enum', 'logging',
        'time', 'datetime', 'math', 'random', 'copy', 'io', 'contextlib',
        'warnings', 'traceback', 'inspect', 'ast', 'operator', 'string',
        'textwrap', 'difflib', 'hashlib', 'hmac', 'secrets', 'struct',
        'codecs', 'unicodedata', 'html', 'xml', 'urllib', 'http', 'email',
        'base64', 'binascii', 'pickle', 'shelve', 'sqlite3', 'csv',
        'configparser', 'tomllib', 'argparse', 'getpass', 'platform',
        'shutil', 'glob', 'fnmatch', 'tempfile', 'gzip', 'bz2', 'lzma',
        'zipfile', 'tarfile', 'threading', 'multiprocessing', 'concurrent',
        'subprocess', 'asyncio', 'socket', 'ssl', 'select', 'selectors',
        'signal', 'mmap', 'queue', 'unittest', 'doctest', 'pdb', 'profile',
        'timeit', 'trace', 'gc', 'weakref', 'types', 'array', 'bisect',
        'heapq', 'statistics', 'fractions', 'decimal', 'numbers', 'cmath',
        'contextvars', 'graphlib',
    })

    # Common third-party packages
    KNOWN_EXTERNAL = frozenset({
        'numpy', 'pandas', 'scipy', 'matplotlib', 'seaborn', 'plotly',
        'sklearn', 'tensorflow', 'torch', 'keras', 'xgboost', 'lightgbm',
        'requests', 'httpx', 'aiohttp', 'urllib3', 'beautifulsoup4', 'bs4',
        'lxml', 'selenium', 'scrapy', 'flask', 'django', 'fastapi', 'starlette',
        'sqlalchemy', 'alembic', 'pymongo', 'redis', 'celery', 'pytest',
        'click', 'typer', 'rich', 'tqdm', 'pydantic', 'attrs', 'cattrs',
        'yaml', 'pyyaml', 'toml', 'dotenv', 'python-dotenv', 'boto3',
        'botocore', 'google-cloud', 'azure', 'pillow', 'PIL', 'cv2', 'opencv',
        'networkx', 'sympy', 'nltk', 'spacy', 'transformers', 'huggingface',
        'openai', 'anthropic', 'langchain', 'llama-index',
    })

    def __init__(self, project_modules: Optional[set[str]] = None):
        """Initialize the dependency resolver.

        Args:
            project_modules: Set of known project module names.
                If provided, dependencies matching these are marked as internal.
        """
        self.project_modules = project_modules or set()

    def resolve(self, dependencies: list[str]) -> DependencyGraph:
        """Resolve a list of dependencies.

        Args:
            dependencies: List of dependency names/paths.

        Returns:
            DependencyGraph with categorized dependencies.
        """
        resolved: list[ResolvedDependency] = []
        internal_count = 0
        external_count = 0
        stdlib_count = 0

        for dep in dependencies:
            if not dep or not isinstance(dep, str):
                continue

            dep_type = self._categorize(dep)

            resolved.append(ResolvedDependency(
                name=dep,
                type=dep_type,
                module_path=self._extract_module_path(dep),
            ))

            if dep_type == DependencyType.INTERNAL:
                internal_count += 1
            elif dep_type == DependencyType.EXTERNAL:
                external_count += 1
            elif dep_type == DependencyType.STDLIB:
                stdlib_count += 1

        return DependencyGraph(
            dependencies=resolved,
            internal_count=internal_count,
            external_count=external_count,
            stdlib_count=stdlib_count,
        )

    def _categorize(self, dep: str) -> DependencyType:
        """Categorize a single dependency.

        Args:
            dep: Dependency name or path.

        Returns:
            DependencyType classification.
        """
        # Extract the root module name
        root_module = dep.split('.')[0].split('/')[0].lower()

        # Check project modules first (highest priority)
        if root_module in self.project_modules:
            return DependencyType.INTERNAL

        # Check for relative imports (start with .)
        if dep.startswith('.'):
            return DependencyType.INTERNAL

        # Check stdlib
        if root_module in self.STDLIB_MODULES:
            return DependencyType.STDLIB

        # Check known external packages
        if root_module in self.KNOWN_EXTERNAL:
            return DependencyType.EXTERNAL

        # Heuristics for internal vs external
        # Internal: contains path separators or matches common internal patterns
        if '/' in dep or '\\' in dep:
            return DependencyType.INTERNAL

        # If starts with underscore, likely internal
        if dep.startswith('_'):
            return DependencyType.INTERNAL

        # Default to unknown
        return DependencyType.UNKNOWN

    def _extract_module_path(self, dep: str) -> Optional[str]:
        """Extract the module path from a dependency.

        Args:
            dep: Dependency name or path.

        Returns:
            Module path if it can be extracted.
        """
        # If it looks like a path, return it
        if '/' in dep or '\\' in dep:
            return dep

        # If it's a dotted module path, convert to path-like
        if '.' in dep:
            return dep.replace('.', '/')

        return None


class UtilityPattern(Enum):
    """Common utility patterns in code."""
    CACHING = "caching"
    VALIDATION = "validation"
    ERROR_HANDLING = "error_handling"
    LOGGING = "logging"
    RETRY_LOGIC = "retry_logic"
    RATE_LIMITING = "rate_limiting"
    SERIALIZATION = "serialization"
    PARSING = "parsing"
    STRING_MANIPULATION = "string_manipulation"
    FILE_OPERATIONS = "file_operations"
    HTTP_OPERATIONS = "http_operations"
    DATABASE_OPERATIONS = "database_operations"
    ASYNC_OPERATIONS = "async_operations"
    TESTING = "testing"
    CONFIGURATION = "configuration"
    FORMATTING = "formatting"
    MATH_OPERATIONS = "math_operations"
    DATE_TIME = "date_time"
    ENCRYPTION = "encryption"
    COMPRESSION = "compression"


@dataclass
class PatternMatch:
    """A detected pattern match."""
    pattern: UtilityPattern
    confidence: float  # 0.0 to 1.0
    evidence: list[str]  # What triggered the match

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'pattern': self.pattern.value,
            'confidence': self.confidence,
            'evidence': self.evidence,
        }


class PatternDetector:
    """Detects common utility patterns in tool candidates.

    Analyzes function names, descriptions, and dependencies to identify
    common patterns like caching, validation, error handling, etc.
    """

    # Pattern detection rules: name patterns and dependency indicators
    PATTERN_RULES: dict[UtilityPattern, dict[str, Any]] = {
        UtilityPattern.CACHING: {
            'name_patterns': [
                r'cache', r'memoize', r'memo', r'lru', r'ttl',
            ],
            'dep_indicators': ['functools', 'cachetools', 'redis', 'memcache'],
            'desc_patterns': [r'cache', r'memoiz', r'store.*result'],
        },
        UtilityPattern.VALIDATION: {
            'name_patterns': [
                r'valid', r'check', r'verify', r'assert', r'ensure',
                r'is_valid', r'validate', r'sanitize',
            ],
            'dep_indicators': ['pydantic', 'cerberus', 'marshmallow', 'voluptuous'],
            'desc_patterns': [r'valid', r'check', r'verify', r'ensure'],
        },
        UtilityPattern.ERROR_HANDLING: {
            'name_patterns': [
                r'error', r'exception', r'handle', r'catch', r'raise',
                r'try', r'except', r'safe_',
            ],
            'dep_indicators': ['sentry', 'rollbar', 'bugsnag'],
            'desc_patterns': [r'error', r'exception', r'handle.*fail', r'graceful'],
        },
        UtilityPattern.LOGGING: {
            'name_patterns': [
                r'log', r'debug', r'info', r'warn', r'trace', r'audit',
            ],
            'dep_indicators': ['logging', 'loguru', 'structlog'],
            'desc_patterns': [r'log', r'record', r'trace', r'audit'],
        },
        UtilityPattern.RETRY_LOGIC: {
            'name_patterns': [
                r'retry', r'backoff', r'exponential', r'attempt',
            ],
            'dep_indicators': ['tenacity', 'retrying', 'backoff'],
            'desc_patterns': [r'retry', r'attempt', r'backoff'],
        },
        UtilityPattern.RATE_LIMITING: {
            'name_patterns': [
                r'rate', r'limit', r'throttle', r'quota', r'bucket',
            ],
            'dep_indicators': ['ratelimit', 'limits', 'slowapi'],
            'desc_patterns': [r'rate', r'limit', r'throttle'],
        },
        UtilityPattern.SERIALIZATION: {
            'name_patterns': [
                r'serial', r'deserial', r'to_json', r'from_json',
                r'to_dict', r'from_dict', r'encode', r'decode', r'marshal',
            ],
            'dep_indicators': ['json', 'pickle', 'msgpack', 'protobuf'],
            'desc_patterns': [r'serial', r'convert.*json', r'encode', r'decode'],
        },
        UtilityPattern.PARSING: {
            'name_patterns': [
                r'parse', r'extract', r'tokenize', r'lex', r'read_',
            ],
            'dep_indicators': ['lxml', 'beautifulsoup', 'pyparsing', 'ply'],
            'desc_patterns': [r'parse', r'extract', r'read'],
        },
        UtilityPattern.STRING_MANIPULATION: {
            'name_patterns': [
                r'format', r'strip', r'clean', r'normalize', r'sanitize',
                r'slug', r'camel', r'snake', r'title', r'upper', r'lower',
            ],
            'dep_indicators': ['inflection', 'slugify', 'unidecode'],
            'desc_patterns': [r'string', r'format', r'clean', r'normalize'],
        },
        UtilityPattern.FILE_OPERATIONS: {
            'name_patterns': [
                r'file', r'read', r'write', r'load', r'save', r'path',
                r'copy', r'move', r'delete', r'mkdir', r'exists',
            ],
            'dep_indicators': ['pathlib', 'shutil', 'os.path', 'aiofiles'],
            'desc_patterns': [r'file', r'read', r'write', r'path', r'directory'],
        },
        UtilityPattern.HTTP_OPERATIONS: {
            'name_patterns': [
                r'http', r'request', r'fetch', r'get_', r'post_', r'api',
                r'download', r'upload', r'webhook', r'url',
            ],
            'dep_indicators': ['requests', 'httpx', 'aiohttp', 'urllib'],
            'desc_patterns': [r'http', r'request', r'api', r'download', r'fetch'],
        },
        UtilityPattern.DATABASE_OPERATIONS: {
            'name_patterns': [
                r'db', r'database', r'sql', r'query', r'insert', r'update',
                r'delete', r'select', r'connect', r'cursor', r'transaction',
            ],
            'dep_indicators': ['sqlalchemy', 'psycopg', 'pymysql', 'sqlite3', 'pymongo'],
            'desc_patterns': [r'database', r'query', r'sql', r'insert', r'connect'],
        },
        UtilityPattern.ASYNC_OPERATIONS: {
            'name_patterns': [
                r'async', r'await', r'concurrent', r'parallel', r'worker',
                r'task', r'future', r'coroutine', r'gather',
            ],
            'dep_indicators': ['asyncio', 'aiohttp', 'trio', 'anyio', 'concurrent'],
            'desc_patterns': [r'async', r'concurrent', r'parallel', r'await'],
        },
        UtilityPattern.TESTING: {
            'name_patterns': [
                r'test', r'mock', r'fixture', r'assert', r'expect',
            ],
            'dep_indicators': ['pytest', 'unittest', 'mock', 'hypothesis'],
            'desc_patterns': [r'test', r'mock', r'assert'],
        },
        UtilityPattern.CONFIGURATION: {
            'name_patterns': [
                r'config', r'setting', r'env', r'option', r'param',
            ],
            'dep_indicators': ['configparser', 'dotenv', 'pydantic', 'dynaconf'],
            'desc_patterns': [r'config', r'setting', r'environment'],
        },
        UtilityPattern.FORMATTING: {
            'name_patterns': [
                r'format', r'pretty', r'display', r'render', r'template',
            ],
            'dep_indicators': ['jinja2', 'mako', 'rich', 'tabulate'],
            'desc_patterns': [r'format', r'display', r'render', r'template'],
        },
        UtilityPattern.MATH_OPERATIONS: {
            'name_patterns': [
                r'calc', r'compute', r'sum', r'avg', r'mean', r'median',
                r'min', r'max', r'round', r'ceil', r'floor', r'percent',
            ],
            'dep_indicators': ['math', 'numpy', 'scipy', 'statistics'],
            'desc_patterns': [r'calculat', r'compute', r'math', r'statistic'],
        },
        UtilityPattern.DATE_TIME: {
            'name_patterns': [
                r'date', r'time', r'timestamp', r'now', r'today',
                r'utc', r'timezone', r'duration', r'period',
            ],
            'dep_indicators': ['datetime', 'dateutil', 'arrow', 'pendulum'],
            'desc_patterns': [r'date', r'time', r'timestamp', r'duration'],
        },
        UtilityPattern.ENCRYPTION: {
            'name_patterns': [
                r'encrypt', r'decrypt', r'hash', r'sign', r'verify',
                r'secret', r'password', r'token', r'key',
            ],
            'dep_indicators': ['hashlib', 'cryptography', 'bcrypt', 'passlib'],
            'desc_patterns': [r'encrypt', r'hash', r'secret', r'password'],
        },
        UtilityPattern.COMPRESSION: {
            'name_patterns': [
                r'compress', r'decompress', r'zip', r'unzip', r'gzip',
            ],
            'dep_indicators': ['gzip', 'bz2', 'lzma', 'zipfile', 'tarfile'],
            'desc_patterns': [r'compress', r'zip', r'archive'],
        },
    }

    def __init__(self, min_confidence: float = 0.3):
        """Initialize the pattern detector.

        Args:
            min_confidence: Minimum confidence threshold for reporting patterns.
        """
        self.min_confidence = min_confidence
        # Compile regex patterns for efficiency
        self._compiled_patterns: dict[UtilityPattern, dict[str, list[re.Pattern]]] = {}
        self._compile_patterns()

    def _compile_patterns(self) -> None:
        """Compile regex patterns for efficient matching."""
        for pattern, rules in self.PATTERN_RULES.items():
            self._compiled_patterns[pattern] = {
                'name': [re.compile(p, re.IGNORECASE) for p in rules.get('name_patterns', [])],
                'desc': [re.compile(p, re.IGNORECASE) for p in rules.get('desc_patterns', [])],
            }

    def detect(
        self,
        name: str,
        description: Optional[str] = None,
        dependencies: Optional[list[str]] = None,
    ) -> list[PatternMatch]:
        """Detect patterns in a tool candidate.

        Args:
            name: Function/class name.
            description: Optional description text.
            dependencies: Optional list of dependencies.

        Returns:
            List of detected patterns above the confidence threshold.
        """
        matches: list[PatternMatch] = []
        dependencies = dependencies or []
        deps_lower = [d.lower() for d in dependencies]

        for pattern, rules in self.PATTERN_RULES.items():
            confidence = 0.0
            evidence: list[str] = []

            # Check name patterns (high weight: 0.5)
            compiled = self._compiled_patterns.get(pattern, {})
            for regex in compiled.get('name', []):
                if regex.search(name):
                    confidence += 0.5
                    evidence.append(f"name matches '{regex.pattern}'")
                    break  # Only count once per category

            # Check dependency indicators (medium weight: 0.3)
            dep_indicators = rules.get('dep_indicators', [])
            matched_deps = [d for d in dep_indicators if any(d in dep for dep in deps_lower)]
            if matched_deps:
                confidence += 0.3
                evidence.append(f"dependencies: {matched_deps}")

            # Check description patterns (medium weight: 0.2)
            if description:
                for regex in compiled.get('desc', []):
                    if regex.search(description):
                        confidence += 0.2
                        evidence.append(f"description matches '{regex.pattern}'")
                        break  # Only count once per category

            # Only report if above threshold
            if confidence >= self.min_confidence:
                matches.append(PatternMatch(
                    pattern=pattern,
                    confidence=min(confidence, 1.0),  # Cap at 1.0
                    evidence=evidence,
                ))

        # Sort by confidence descending
        matches.sort(key=lambda m: m.confidence, reverse=True)
        return matches


@dataclass
class ComplexityMetrics:
    """Enhanced complexity metrics for a tool candidate."""
    # Existing metrics (pass-through)
    modularity_score: float = 0.0
    reusability_score: float = 0.0

    # Dependency-based metrics
    dependency_count: int = 0
    internal_dependency_ratio: float = 0.0
    external_dependency_ratio: float = 0.0

    # Pattern-based metrics
    pattern_count: int = 0
    primary_pattern: Optional[str] = None
    pattern_confidence: float = 0.0

    # Computed scores
    abstraction_level: str = "low"  # low, medium, high
    coupling_score: float = 0.0     # 0.0 (loose) to 1.0 (tight)
    utility_score: float = 0.0      # Overall utility assessment

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'modularity_score': self.modularity_score,
            'reusability_score': self.reusability_score,
            'dependency_count': self.dependency_count,
            'internal_dependency_ratio': self.internal_dependency_ratio,
            'external_dependency_ratio': self.external_dependency_ratio,
            'pattern_count': self.pattern_count,
            'primary_pattern': self.primary_pattern,
            'pattern_confidence': self.pattern_confidence,
            'abstraction_level': self.abstraction_level,
            'coupling_score': self.coupling_score,
            'utility_score': self.utility_score,
        }


class ComplexityCalculator:
    """Calculates enhanced complexity metrics for tool candidates.

    Combines dependency analysis, pattern detection, and existing metrics
    to produce comprehensive complexity assessments.
    """

    # Map string scores to numeric values
    SCORE_MAP = {
        'highly_modular': 0.9,
        'modular': 0.7,
        'somewhat_modular': 0.5,
        'not_modular': 0.2,
        'highly_reusable': 0.9,
        'reusable': 0.7,
        'somewhat_reusable': 0.5,
        'not_reusable': 0.2,
        'high': 0.8,
        'medium': 0.5,
        'low': 0.2,
    }

    def __init__(self):
        """Initialize the complexity calculator."""
        pass

    def _normalize_score(self, value: Any) -> float:
        """Normalize a score value to a float.

        Args:
            value: Score value (can be float, int, or string).

        Returns:
            Normalized float value between 0.0 and 1.0.
        """
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Check known string mappings
            normalized = value.lower().replace(' ', '_').replace('-', '_')
            if normalized in self.SCORE_MAP:
                return self.SCORE_MAP[normalized]
            # Try to parse as float
            try:
                return float(value)
            except ValueError:
                pass
        return 0.0

    def calculate(
        self,
        candidate: dict[str, Any],
        dependency_graph: Optional[DependencyGraph] = None,
        patterns: Optional[list[PatternMatch]] = None,
    ) -> ComplexityMetrics:
        """Calculate complexity metrics for a tool candidate.

        Args:
            candidate: Tool candidate dictionary.
            dependency_graph: Optional resolved dependency graph.
            patterns: Optional detected patterns.

        Returns:
            ComplexityMetrics with calculated values.
        """
        metrics = ComplexityMetrics()

        # Pass through existing metrics (handle both numeric and string values)
        modularity = candidate.get('modularity_score', 0.0)
        metrics.modularity_score = self._normalize_score(modularity)

        reusability = candidate.get('reusability_score', 0.0)
        metrics.reusability_score = self._normalize_score(reusability)

        # Calculate dependency-based metrics
        if dependency_graph:
            total_deps = len(dependency_graph.dependencies)
            metrics.dependency_count = total_deps

            if total_deps > 0:
                metrics.internal_dependency_ratio = dependency_graph.internal_count / total_deps
                metrics.external_dependency_ratio = dependency_graph.external_count / total_deps

            # Coupling score: higher with more external dependencies
            metrics.coupling_score = min(
                metrics.external_dependency_ratio * 1.5,  # External deps increase coupling
                1.0
            )

        # Calculate pattern-based metrics
        if patterns:
            metrics.pattern_count = len(patterns)
            if patterns:
                metrics.primary_pattern = patterns[0].pattern.value
                metrics.pattern_confidence = patterns[0].confidence

        # Calculate abstraction level based on name and patterns
        metrics.abstraction_level = self._calculate_abstraction_level(candidate, patterns)

        # Calculate overall utility score
        metrics.utility_score = self._calculate_utility_score(metrics)

        return metrics

    def _calculate_abstraction_level(
        self,
        candidate: dict[str, Any],
        patterns: Optional[list[PatternMatch]],
    ) -> str:
        """Calculate the abstraction level of a candidate.

        Args:
            candidate: Tool candidate dictionary.
            patterns: Detected patterns.

        Returns:
            "low", "medium", or "high"
        """
        score = 0.0

        # Name-based heuristics
        name = candidate.get('name', '').lower()

        # High abstraction indicators
        high_indicators = ['base', 'abstract', 'interface', 'factory', 'builder', 'manager']
        if any(ind in name for ind in high_indicators):
            score += 0.4

        # Medium abstraction indicators
        medium_indicators = ['service', 'handler', 'processor', 'controller', 'util']
        if any(ind in name for ind in medium_indicators):
            score += 0.3

        # Pattern-based boost
        if patterns:
            # More patterns = likely more abstract
            score += min(len(patterns) * 0.1, 0.3)

        # Determine level
        if score >= 0.5:
            return "high"
        elif score >= 0.2:
            return "medium"
        else:
            return "low"

    def _calculate_utility_score(self, metrics: ComplexityMetrics) -> float:
        """Calculate overall utility score.

        Args:
            metrics: Current metrics.

        Returns:
            Utility score from 0.0 to 1.0.
        """
        score = 0.0

        # Modularity contributes positively
        score += metrics.modularity_score * 0.3

        # Reusability contributes positively
        score += metrics.reusability_score * 0.3

        # Low coupling is good
        score += (1 - metrics.coupling_score) * 0.2

        # Having recognized patterns is good
        if metrics.pattern_count > 0:
            score += min(metrics.pattern_confidence * 0.2, 0.2)

        return min(score, 1.0)


class TransformationStage(PreprocessingStage[dict, dict]):
    """Preprocessing stage that transforms and enriches data.

    This stage applies:
    1. Dependency resolution (categorize internal/external dependencies)
    2. Pattern detection (identify utility patterns)
    3. Complexity calculation (enhanced metrics)

    Input: Cleaned tool identification report
    Output: Transformed report with enriched metadata
    """

    def __init__(self, config: TransformationConfig):
        """Initialize the transformation stage.

        Args:
            config: Configuration for transformation behavior.
        """
        super().__init__(config)
        self.dependency_resolver = DependencyResolver()
        self.pattern_detector = PatternDetector()
        self.complexity_calculator = ComplexityCalculator()

    @property
    def name(self) -> str:
        """Return the stage name."""
        return "transformation"

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
        """Process the input data through all transformation operations.

        Args:
            data: Cleaned report dictionary.

        Returns:
            StageResult with transformed data.
        """
        config: TransformationConfig = self.config
        transformed = data.copy()
        metrics: dict[str, Any] = {
            'dependencies_resolved': 0,
            'patterns_detected': 0,
            'complexity_calculated': 0,
        }
        warnings: list[str] = []

        # Extract project modules from utility_modules for better dependency resolution
        project_modules = self._extract_project_modules(data)
        self.dependency_resolver.project_modules = project_modules

        # Transform tool candidates
        if 'tool_candidates' in transformed:
            transformed['tool_candidates'], candidate_metrics = self._transform_candidates(
                transformed['tool_candidates'],
                config
            )
            metrics['dependencies_resolved'] += candidate_metrics.get('dependencies_resolved', 0)
            metrics['patterns_detected'] += candidate_metrics.get('patterns_detected', 0)
            metrics['complexity_calculated'] += candidate_metrics.get('complexity_calculated', 0)

        # Add summary statistics
        if 'tool_candidates' in transformed:
            pattern_stats = self._compute_pattern_statistics(transformed['tool_candidates'])
            metrics['pattern_distribution'] = pattern_stats

        return StageResult.ok(transformed, warnings=warnings, metrics=metrics)

    def _extract_project_modules(self, data: dict) -> set[str]:
        """Extract project module names from utility_modules.

        Args:
            data: Report dictionary.

        Returns:
            Set of project module names.
        """
        modules = set()

        for module in data.get('utility_modules', []):
            file_path = module.get('file_path', '')
            if file_path:
                # Extract potential module names from path
                parts = file_path.replace('\\', '/').split('/')
                # Common patterns: src/module/file.py, module/submodule/file.py
                for part in parts:
                    if part and not part.startswith('.') and part != 'src':
                        modules.add(part.lower())

        return modules

    def _transform_candidates(
        self,
        candidates: list[dict],
        config: TransformationConfig
    ) -> tuple[list[dict], dict[str, int]]:
        """Transform a list of tool candidates.

        Args:
            candidates: List of candidate dictionaries.
            config: Transformation configuration.

        Returns:
            Tuple of (transformed candidates, metrics).
        """
        transformed = []
        metrics = {
            'dependencies_resolved': 0,
            'patterns_detected': 0,
            'complexity_calculated': 0,
        }

        for candidate in candidates:
            trans_candidate = candidate.copy()

            # Resolve dependencies
            dependency_graph: Optional[DependencyGraph] = None
            if config.resolve_dependencies and 'dependencies' in trans_candidate:
                deps = trans_candidate.get('dependencies', [])
                dependency_graph = self.dependency_resolver.resolve(deps)
                trans_candidate['_dependency_graph'] = dependency_graph.to_dict()
                metrics['dependencies_resolved'] += 1

            # Detect patterns
            patterns: Optional[list[PatternMatch]] = None
            if config.detect_patterns:
                patterns = self.pattern_detector.detect(
                    name=trans_candidate.get('name', ''),
                    description=trans_candidate.get('description', ''),
                    dependencies=trans_candidate.get('dependencies', []),
                )
                if patterns:
                    trans_candidate['_patterns'] = [p.to_dict() for p in patterns]
                    metrics['patterns_detected'] += len(patterns)

            # Calculate complexity
            if config.calculate_complexity:
                complexity = self.complexity_calculator.calculate(
                    candidate=trans_candidate,
                    dependency_graph=dependency_graph,
                    patterns=patterns,
                )
                trans_candidate['_complexity'] = complexity.to_dict()
                metrics['complexity_calculated'] += 1

            transformed.append(trans_candidate)

        return transformed, metrics

    def _compute_pattern_statistics(self, candidates: list[dict]) -> dict[str, int]:
        """Compute pattern distribution statistics.

        Args:
            candidates: List of transformed candidates.

        Returns:
            Dictionary mapping pattern names to counts.
        """
        stats: dict[str, int] = {}

        for candidate in candidates:
            patterns = candidate.get('_patterns', [])
            for pattern in patterns:
                pattern_name = pattern.get('pattern', 'unknown')
                stats[pattern_name] = stats.get(pattern_name, 0) + 1

        return stats
