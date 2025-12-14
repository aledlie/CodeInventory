#!/usr/bin/env python3
"""
Test Coverage Analyzer - Identifies untested code using ast-grep

Supports parallel processing and caching for improved performance.
"""

import argparse
import json
import logging
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple, Optional, Iterator
from dataclasses import dataclass, field
from collections import defaultdict

# Import centralized logging
try:
    from src.utils.logging_config import get_logger, log_exception, log_performance_metric
    logger = get_logger(__name__)
except ImportError:
    # Fallback to basic logging
    logger = logging.getLogger(__name__)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

# Import optimization utilities
try:
    from src.analyzers.analyzer_optimizer import (
        ParallelAnalyzer,
        get_file_content_hash,
        get_file_key
    )
    OPTIMIZER_AVAILABLE = True
except ImportError:
    logger.warning("⚠️  Optimizer module not available - parallel processing disabled")
    OPTIMIZER_AVAILABLE = False

@dataclass
class FunctionInfo:
    """Information about a function"""
    name: str
    file_path: str
    line_number: int
    is_async: bool = False
    is_tested: bool = False
    test_file: Optional[str] = None

@dataclass
class CoverageReport:
    """Test coverage analysis report"""
    total_functions: int = 0
    tested_functions: int = 0
    untested_functions: int = 0
    coverage_percentage: float = 0.0
    functions: List[FunctionInfo] = field(default_factory=list)
    untested_by_file: Dict[str, List[FunctionInfo]] = field(default_factory=lambda: defaultdict(list))


# Top-level worker function for parallel processing (must be picklable)
def _analyze_file_worker(file_path: Path) -> List[Dict[str, Any]]:
    """
    Worker function to analyze a single file for functions.

    This function must be at module level to be picklable for ProcessPoolExecutor.
    Optimized to use regex fallback when ast-grep is slow, and batch pattern matching.

    Args:
        file_path: Path to file to analyze

    Returns:
        List of function data dicts (JSON-serializable)
    """
    try:
        # Determine language and patterns
        language = None
        patterns = []

        if file_path.suffix == '.py':
            language = 'python'
            patterns = [
                'def $NAME($$$)',
                'async def $NAME($$$)'
            ]
        elif file_path.suffix == '.tsx':
            # ast-grep requires 'tsx' for JSX files, not 'typescript'
            language = 'tsx'
            patterns = [
                'function $NAME($$$)',
                'const $NAME = ($$$) =>',
                'export function $NAME($$$)',
                'async function $NAME($$$)'
            ]
        elif file_path.suffix == '.ts':
            language = 'typescript'
            patterns = [
                'function $NAME($$$)',
                'const $NAME = ($$$) =>',
                'export function $NAME($$$)',
                'async function $NAME($$$)'
            ]
        elif file_path.suffix == '.jsx':
            # ast-grep requires 'jsx' for JSX files, not 'javascript'
            language = 'jsx'
            patterns = [
                'function $NAME($$$)',
                'const $NAME = ($$$) =>',
                'export function $NAME($$$)'
            ]
        elif file_path.suffix == '.js':
            language = 'javascript'
            patterns = [
                'function $NAME($$$)',
                'const $NAME = ($$$) =>',
                'export function $NAME($$$)'
            ]

        if not language:
            return []

        # Try fast regex-based extraction first for simple cases
        functions_data = _extract_functions_regex(file_path, language)
        if functions_data:
            return functions_data

        # Fall back to ast-grep for complex cases (with timeout)
        return _extract_functions_astgrep(file_path, language, patterns)

    except Exception as e:
        logger.error(f"Worker error processing {file_path}: {e}")
        return []


def _extract_functions_regex(file_path: Path, language: str) -> List[Dict[str, Any]]:
    """
    Fast regex-based function extraction for common patterns.
    Returns empty list if file is too complex for regex parsing.
    """
    import re

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Skip files that are too large or have complex syntax
        if len(content) > 500000:  # 500KB limit for regex
            return []

        functions_data = []
        seen_names = set()  # Avoid duplicates

        if language == 'python':
            # Match Python function definitions
            pattern = r'^[ \t]*(async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\('
            for match in re.finditer(pattern, content, re.MULTILINE):
                is_async = match.group(1) is not None
                func_name = match.group(2)
                if func_name and not func_name.startswith('_') and func_name not in seen_names:
                    line_num = content[:match.start()].count('\n') + 1
                    functions_data.append({
                        'name': func_name,
                        'file_path': str(file_path),
                        'line_number': line_num,
                        'is_async': is_async
                    })
                    seen_names.add(func_name)

        elif language in ['typescript', 'javascript', 'tsx', 'jsx']:
            # Match JS/TS function definitions
            patterns = [
                # Regular functions: function name(
                r'(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(',
                # Arrow functions: const name = (
                r'(?:export\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>',
            ]

            for pat in patterns:
                for match in re.finditer(pat, content, re.MULTILINE):
                    func_name = match.group(1)
                    if func_name and not func_name.startswith('_') and func_name not in seen_names:
                        line_num = content[:match.start()].count('\n') + 1
                        is_async = 'async' in match.group(0)
                        functions_data.append({
                            'name': func_name,
                            'file_path': str(file_path),
                            'line_number': line_num,
                            'is_async': is_async
                        })
                        seen_names.add(func_name)

        return functions_data

    except Exception:
        return []  # Fall back to ast-grep


def _extract_functions_astgrep(file_path: Path, language: str, patterns: List[str]) -> List[Dict[str, Any]]:
    """
    Extract functions using ast-grep (more accurate but slower).
    Used as fallback when regex fails or for complex files.
    """
    functions_data = []
    seen_names = set()

    for pattern in patterns:
        try:
            result = subprocess.run(
                ['ast-grep', 'run', '-p', pattern, '--lang', language, '--json', str(file_path)],
                capture_output=True,
                text=True,
                timeout=10  # Reduced timeout per pattern
            )

            if result.returncode == 0 and result.stdout.strip():
                matches = json.loads(result.stdout)
                for match in matches:
                    # Extract function name
                    meta = match.get('metaVariables', {})
                    func_name = None

                    if 'single' in meta and 'NAME' in meta['single']:
                        func_node = meta['single']['NAME']
                        func_name = func_node.get('text') if isinstance(func_node, dict) else str(func_node)
                    elif 'NAME' in meta:
                        func_node = meta['NAME']
                        func_name = func_node.get('text') if isinstance(func_node, dict) else str(func_node)

                    # Skip private functions and duplicates
                    if func_name and not func_name.startswith('_') and func_name not in seen_names:
                        line_num = match.get('range', {}).get('start', {}).get('line', 0)
                        is_async = 'async' in pattern or 'async' in match.get('text', '')

                        functions_data.append({
                            'name': func_name,
                            'file_path': str(file_path),
                            'line_number': line_num,
                            'is_async': is_async
                        })
                        seen_names.add(func_name)

        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
            logger.debug(f"ast-grep error for {file_path}: {e}")
            continue

    return functions_data


class TestCoverageAnalyzer:
    """Analyzes test coverage by matching functions with test cases"""
    __test__ = False  # Prevent pytest from collecting this as a test class

    def __init__(self, src_dir: Path, test_dir: Optional[Path] = None):
        """Initialize the test coverage analyzer.

        Args:
            src_dir: Root directory containing source files to analyze
            test_dir: Directory containing test files. Defaults to src_dir/tests
        """
        self.src_dir = src_dir
        self.test_dir = test_dir or src_dir / 'tests'
        self.report = CoverageReport()

        # Common test patterns
        self.test_patterns = [
            'tests/',
            '__tests__/',
            'test_',
            '.test.',
            '.spec.',
            '_test.py',
            '_spec.ts',
            '_spec.js'
        ]

    def _is_test_file(self, file_path: Path) -> bool:
        """Check if a file is a test file based on filename and directory patterns"""
        filename = file_path.name

        # Check filename patterns (test_ prefix, _test/_spec suffix, .test./.spec. in name)
        if filename.startswith('test_'):
            return True
        if any(filename.endswith(suffix) for suffix in ['_test.py', '_spec.ts', '_spec.js']):
            return True
        if '.test.' in filename or '.spec.' in filename:
            return True

        # Check directory patterns (tests/ or __tests__/ as path segments)
        return any(part in ['tests', '__tests__'] for part in file_path.parts)

    def _run_astgrep(self, file_path: Path, pattern: str, language: str) -> List[Dict[str, Any]]:
        """Run ast-grep pattern"""
        try:
            result = subprocess.run(
                ['ast-grep', 'run', '-p', pattern, '-l', language, '--json', str(file_path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout.strip():
                parsed: List[Dict[str, Any]] = json.loads(result.stdout)
                return parsed
            # Optionally log stderr for debugging
            if result.returncode != 0 and result.stderr:
                logger.error(f"ast-grep error: {result.stderr[:200]}")
            return []
        except subprocess.TimeoutExpired as e:
            logger.error(f"ast-grep timeout: {e}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response from ast-grep: {e}")
            return []
        except Exception as e:
            logger.exception(f"Unexpected error running ast-grep: {e}")
            return []

    def find_functions_in_file(self, file_path: Path) -> List[FunctionInfo]:
        """Find all functions in a file"""
        language, patterns = self._get_language_patterns(file_path)
        if not language or not patterns:
            return []

        functions = []
        for pattern in patterns:
            found = self._find_functions_with_pattern(file_path, pattern, language)
            functions.extend(found)

        return functions

    def _get_language_patterns(self, file_path: Path) -> Tuple[Optional[str], Optional[List[str]]]:
        """Get language and patterns for file type.

        Note: ast-grep requires 'tsx' for .tsx files and 'jsx' for .jsx files,
        not 'typescript' or 'javascript'.
        """
        if file_path.suffix == '.py':
            return 'python', self._get_python_patterns()
        elif file_path.suffix == '.tsx':
            # ast-grep requires 'tsx' for JSX files
            return 'tsx', self._get_typescript_patterns()
        elif file_path.suffix == '.ts':
            return 'typescript', self._get_typescript_patterns()
        elif file_path.suffix == '.jsx':
            # ast-grep requires 'jsx' for JSX files
            return 'jsx', self._get_javascript_patterns()
        elif file_path.suffix == '.js':
            return 'javascript', self._get_javascript_patterns()
        return None, None

    def _get_python_patterns(self) -> List[str]:
        """Get Python function patterns - simpler patterns to match all variants"""
        return [
            'def $NAME($$$)',
            'async def $NAME($$$)'
        ]

    def _get_typescript_patterns(self) -> List[str]:
        """Get TypeScript function patterns.

        Note: Using simpler patterns without ($$$) because ast-grep doesn't
        match TypeScript's complex parameter syntax (destructuring, type annotations)
        with the $$$  metavariable.
        """
        return [
            'function $NAME',
            'const $NAME =',
            'export function $NAME',
            'async function $NAME'
        ]

    def _get_javascript_patterns(self) -> List[str]:
        """Get JavaScript function patterns.

        Note: Using simpler patterns without ($$$) for consistency with TypeScript.
        """
        return [
            'function $NAME',
            'const $NAME =',
            'export function $NAME'
        ]

    def _find_functions_with_pattern(self, file_path: Path, pattern: str,
                                    language: str) -> List[FunctionInfo]:
        """Find functions using a specific pattern"""
        functions = []
        matches = self._run_astgrep(file_path, pattern, language)

        for match in matches:
            func_info = self._create_function_info(match, file_path, pattern)
            if func_info and not func_info.name.startswith('_'):
                functions.append(func_info)

        return functions

    def _create_function_info(self, match: Dict[str, Any], file_path: Path,
                            pattern: str) -> Optional[FunctionInfo]:
        """Create FunctionInfo from match"""
        func_name = self._extract_function_name(match)
        if not func_name:
            return None

        line_num = match.get('range', {}).get('start', {}).get('line', 0)
        is_async = 'async' in pattern or 'async' in match.get('text', '')

        return FunctionInfo(
            name=func_name,
            file_path=str(file_path),
            line_number=line_num,
            is_async=is_async
        )

    def _extract_function_name(self, match: Dict[str, Any]) -> Optional[str]:
        """Extract function name from match metadata"""
        meta = match.get('metaVariables', {})

        if 'single' in meta and 'NAME' in meta['single']:
            func_node = meta['single']['NAME']
            return func_node.get('text') if isinstance(func_node, dict) else str(func_node)
        elif 'NAME' in meta:
            func_node = meta['NAME']
            return func_node.get('text') if isinstance(func_node, dict) else str(func_node)

        return None

    def find_test_functions(self, test_dir: Path) -> Set[str]:
        """Find all test function names - optimized with regex and parallel processing"""
        if not test_dir.exists():
            return set()

        test_functions = set()

        # Collect all test files first
        test_files = [
            f for f in test_dir.rglob('*')
            if f.is_file() and f.suffix in ['.py', '.ts', '.tsx', '.js', '.jsx']
        ]

        # Use fast regex extraction for all files
        for file_path in test_files:
            names = self._find_test_names_fast(file_path)
            test_functions.update(names)

        return test_functions

    def _find_test_names_fast(self, file_path: Path) -> Set[str]:
        """Fast regex-based test name extraction"""
        import re

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            test_names = set()

            if file_path.suffix == '.py':
                # Match Python test functions: def test_something(
                pattern = r'def\s+(test_[a-zA-Z0-9_]+)\s*\('
                for match in re.finditer(pattern, content):
                    test_name = match.group(1)
                    clean_names = self._clean_test_name(test_name)
                    test_names.update(clean_names)

            elif file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                # Match JS/TS test patterns
                patterns = [
                    r'it\s*\(\s*[\'"]([^"\']+)[\'"]',       # it("test name"
                    r'test\s*\(\s*[\'"]([^"\']+)[\'"]',     # test("test name"
                    r'describe\s*\(\s*[\'"]([^"\']+)[\'"]', # describe("suite name"
                ]
                for pat in patterns:
                    for match in re.finditer(pat, content):
                        test_name = match.group(1)
                        clean_names = self._clean_test_name(test_name)
                        test_names.update(clean_names)

            return test_names

        except Exception:
            # Fall back to ast-grep method
            return self._find_test_names_in_file(file_path)

    def _find_test_names_in_file(self, file_path: Path) -> Set[str]:
        """Find test function names in a single file"""
        language = self._get_file_language(file_path)
        if not language:
            return set()

        patterns = self._get_test_patterns(language)
        test_names = set()

        for pattern in patterns:
            names = self._extract_test_names(file_path, pattern, language)
            test_names.update(names)

        return test_names

    def _get_file_language(self, file_path: Path) -> Optional[str]:
        """Determine language from file extension.

        Note: ast-grep requires 'tsx' for .tsx files and 'jsx' for .jsx files,
        not 'typescript' or 'javascript'.
        """
        if file_path.suffix == '.py':
            return 'python'
        elif file_path.suffix == '.tsx':
            return 'tsx'
        elif file_path.suffix == '.ts':
            return 'typescript'
        elif file_path.suffix == '.jsx':
            return 'jsx'
        elif file_path.suffix == '.js':
            return 'javascript'
        return None

    def _get_test_patterns(self, language: str) -> List[str]:
        """Get test patterns for language"""
        patterns = {
            'python': ['def $NAME($$$): $$$'],
            'javascript': ['it("$NAME", $$$)', 'test("$NAME", $$$)', 'describe("$NAME", $$$)'],
            'jsx': ['it("$NAME", $$$)', 'test("$NAME", $$$)', 'describe("$NAME", $$$)'],
            'typescript': ['it("$NAME", $$$)', 'test("$NAME", $$$)', 'describe("$NAME", $$$)'],
            'tsx': ['it("$NAME", $$$)', 'test("$NAME", $$$)', 'describe("$NAME", $$$)']
        }
        return patterns.get(language, [])

    def _extract_test_names(self, file_path: Path, pattern: str, language: str) -> Set[str]:
        """Extract test names using pattern"""
        test_names = set()
        matches = self._run_astgrep(file_path, pattern, language)

        for match in matches:
            test_name = self._extract_test_name(match)
            if test_name:
                if not self._should_skip_test(test_name, language):
                    clean_names = self._clean_test_name(test_name)
                    test_names.update(clean_names)

        return test_names

    def _extract_test_name(self, match: Dict[str, Any]) -> Optional[str]:
        """Extract test name from match"""
        meta = match.get('metaVariables', {})

        if 'single' in meta and 'NAME' in meta['single']:
            test_node = meta['single']['NAME']
            return test_node.get('text') if isinstance(test_node, dict) else str(test_node)
        elif 'NAME' in meta:
            test_node = meta['NAME']
            return test_node.get('text') if isinstance(test_node, dict) else str(test_node)

        return None

    def _should_skip_test(self, test_name: str, language: str) -> bool:
        """Check if test should be skipped"""
        return language == 'python' and not test_name.startswith('test_')

    def _clean_test_name(self, test_name: str) -> Set[str]:
        """Clean and process test name to extract searchable keywords.

        Returns multiple variations of the test name to improve matching:
        - Original lowercased
        - Cleaned version with common prefixes removed
        - Individual words extracted from the test name
        """
        import re

        results = set()

        # Add original lowercase
        results.add(test_name.lower())

        # Clean common prefixes/patterns
        clean_name = (test_name
                     .replace('test_', '')
                     .replace('_test', '')
                     .replace('should ', '')
                     .replace('should_', '')
                     .replace(' ', '_')
                     .lower())
        results.add(clean_name)

        # Extract individual words (split on spaces, underscores, and camelCase boundaries)
        # This helps match "useSavedViews" with "saved views" test description
        words = re.split(r'[\s_\-]+', test_name.lower())
        for word in words:
            if len(word) > 2:  # Skip very short words
                results.add(word)

        return results

    def _split_camel_case(self, name: str) -> List[str]:
        """Split a camelCase or PascalCase name into individual words.

        Examples:
            useSavedViews -> ['use', 'saved', 'views']
            fetchWidgetMetadata -> ['fetch', 'widget', 'metadata']
            useUpdateNotificationSettings -> ['use', 'update', 'notification', 'settings']
        """
        import re
        # Insert underscore before uppercase letters, then split and lowercase
        split_name = re.sub(r'([a-z])([A-Z])', r'\1_\2', name)
        return [word.lower() for word in split_name.split('_') if word]

    def analyze_coverage(self) -> None:
        """Analyze test coverage for the source directory"""
        self._print_analysis_header()

        test_functions = self._find_all_test_functions()
        source_functions = self._find_all_source_functions()

        self._match_functions_with_tests(source_functions, test_functions)
        self._calculate_coverage_percentage()

    def _print_analysis_header(self) -> None:
        """Print analysis header information"""
        logger.info(f"\nAnalyzing source directory: {self.src_dir}")
        logger.info(f"Looking for tests in: {self.test_dir}\n")

    def _find_all_test_functions(self) -> Set[str]:
        """Find all test function names from multiple locations"""
        test_functions = set()

        # 1. Search the explicit test_dir if it exists
        if self.test_dir.exists():
            test_functions.update(self.find_test_functions(self.test_dir))
            logger.info(f"Found {len(test_functions)} test patterns in {self.test_dir}")

        # 2. Search the entire source tree for test files
        additional_tests = self._find_test_functions_in_source_tree()
        if additional_tests:
            new_tests = additional_tests - test_functions
            if new_tests:
                logger.info(f"Found {len(new_tests)} additional test patterns in source tree")
            test_functions.update(additional_tests)

        logger.info(f"Found {len(test_functions)} total test patterns\n")
        return test_functions

    def _find_test_functions_in_source_tree(self) -> Set[str]:
        """Find test files scattered throughout the source tree (e.g., __tests__ directories)"""
        import os

        test_functions = set()

        # Directories that indicate test files
        test_dir_patterns = {'tests', '__tests__', 'test', 'spec', 'fixtures'}

        # File patterns that indicate test files
        test_file_patterns = ['.test.', '.spec.', '_test.', 'test_']

        # Skip these directories entirely
        skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                     '_site', '.venv', 'venv', 'env', '.cache', 'coverage', 'htmlcov',
                     'vendor', 'third_party', 'site-packages', '.idea', '.vscode'}

        valid_extensions = {'.py', '.ts', '.tsx', '.js', '.jsx'}

        for root, dirs, files in os.walk(self.src_dir):
            # Skip unwanted directories but keep test directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            # Check if we're in a test directory
            current_dir = Path(root).name
            in_test_dir = current_dir in test_dir_patterns

            for filename in files:
                file_path = Path(root) / filename

                # Skip non-code files
                if file_path.suffix not in valid_extensions:
                    continue

                # Check if this is a test file
                is_test_file = (
                    in_test_dir or
                    any(pattern in filename for pattern in test_file_patterns)
                )

                if is_test_file:
                    names = self._find_test_names_fast(file_path)
                    test_functions.update(names)

        return test_functions

    def _find_all_source_functions(self) -> List[FunctionInfo]:
        """Find all source functions"""
        source_functions = []

        for file_path in self._iterate_source_files():
            functions = self.find_functions_in_file(file_path)
            source_functions.extend(functions)

        logger.info(f"Found {len(source_functions)} functions in source code\n")
        return source_functions

    def _iterate_source_files(self) -> Iterator[Path]:
        """Iterate through valid source files - optimized to skip directories early"""
        import os

        # Directories to skip entirely
        skip_dirs = {
            '.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
            '_site', '.venv', 'venv', 'env', '.cache', 'coverage', 'htmlcov',
            'vendor', 'third_party', 'site-packages', '.idea', '.vscode',
            'tests', '__tests__', 'test', 'spec', 'fixtures', 'mocks'
        }

        # Valid extensions
        valid_extensions = {'.py', '.ts', '.tsx', '.js', '.jsx'}

        for root, dirs, files in os.walk(self.src_dir):
            # Prune directories we don't want to traverse
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            for filename in files:
                file_path = Path(root) / filename

                # Quick extension check first (fastest)
                if file_path.suffix not in valid_extensions:
                    continue

                # Skip test files by name pattern
                if self._is_test_file(file_path):
                    continue

                yield file_path

    def _is_valid_source_file(self, file_path: Path) -> bool:
        """Check if file is a valid source file"""
        if not file_path.is_file():
            return False
        if self._is_test_file(file_path):
            return False
        return file_path.suffix in ['.py', '.ts', '.tsx', '.js', '.jsx']

    def _match_functions_with_tests(self, source_functions: List[FunctionInfo],
                                   test_functions: Set[str]) -> None:
        """Match source functions with their tests"""
        for func in source_functions:
            is_tested = self._is_function_tested(func, test_functions)
            self._record_function_coverage(func, is_tested)

        self.report.total_functions = len(source_functions)

    def _is_function_tested(self, func: FunctionInfo, test_functions: Set[str]) -> bool:
        """Check if a function has tests using multiple matching strategies.

        Matching strategies (in order):
        1. Exact match: function name appears in test name
        2. Word match: all significant words from function name appear in test names
        3. Core word match: main words (excluding common prefixes) appear in tests

        Examples that should match:
        - useSavedViews <-> "should fetch saved views successfully"
        - useCreateSavedView <-> "useCreateSavedView should create a new saved view"
        - fetchWidgetMetadata <-> "widget metadata fetching"
        """
        func_name_lower = func.name.lower()

        # Strategy 1: Direct match (original behavior)
        if any(func_name_lower in test_name for test_name in test_functions):
            return True

        # Strategy 2: Split camelCase and check if significant words appear in tests
        func_words = self._split_camel_case(func.name)

        # Filter out common prefixes that don't add meaning
        common_prefixes = {'use', 'get', 'set', 'is', 'has', 'can', 'do', 'on', 'handle'}
        significant_words = [w for w in func_words if w not in common_prefixes and len(w) > 2]

        if not significant_words:
            # If no significant words, use all words except very common ones
            significant_words = [w for w in func_words if len(w) > 2]

        if not significant_words:
            return False

        # Check if all significant words appear in any test name
        # Join test_functions into a single searchable string for efficiency
        all_tests_text = ' '.join(test_functions)

        # Strategy 2a: All significant words must be present
        if all(word in all_tests_text for word in significant_words):
            return True

        # Strategy 2b: For longer function names, require most words (75%+)
        if len(significant_words) >= 3:
            matches = sum(1 for word in significant_words if word in all_tests_text)
            if matches >= len(significant_words) * 0.75:
                return True

        return False

    def _record_function_coverage(self, func: FunctionInfo, is_tested: bool) -> None:
        """Record coverage for a function"""
        func.is_tested = is_tested
        self.report.functions.append(func)

        if is_tested:
            self.report.tested_functions += 1
        else:
            self.report.untested_functions += 1
            self.report.untested_by_file[func.file_path].append(func)

    def _calculate_coverage_percentage(self) -> None:
        """Calculate coverage percentage"""
        if self.report.total_functions > 0:
            self.report.coverage_percentage = (
                self.report.tested_functions / self.report.total_functions * 100
            )

    def analyze_coverage_optimized(self, use_parallel: bool = True, use_cache: bool = True,
                                   max_workers: Optional[int] = None) -> None:
        """
        Analyze test coverage with parallel processing and caching

        Args:
            use_parallel: Enable parallel file processing
            use_cache: Enable caching of analysis results
            max_workers: Number of worker processes (default: CPU count - 1)
        """
        import time
        start_time = time.time()

        self._print_analysis_header()

        # Check if optimizer is available
        if not OPTIMIZER_AVAILABLE:
            logger.warning("⚠️  Optimizer not available, falling back to sequential processing")
            return self.analyze_coverage()

        if not use_parallel and not use_cache:
            logger.info("ℹ️  Optimizations disabled, using sequential processing")
            return self.analyze_coverage()

        # Initialize parallel analyzer
        optimizer = ParallelAnalyzer(
            analyzer_name='test_coverage',
            max_workers=max_workers,
            use_cache=use_cache
        )

        logger.info(f"🚀 Parallel test coverage analysis enabled")
        logger.info(f"   Workers: {optimizer.max_workers}")
        logger.info(f"   Cache enabled: {use_cache}\n")

        # Find test functions (same as sequential)
        test_functions = self._find_all_test_functions()

        # Collect all source files
        source_files = list(self._iterate_source_files())
        logger.info(f"📂 Found {len(source_files)} source files to analyze\n")

        # Process files in parallel
        if use_parallel and source_files:
            results = optimizer.process_items_parallel(
                items=source_files,
                processor_func=_analyze_file_worker,
                key_func=get_file_key,
                hash_func=get_file_content_hash if use_cache else None,
                skip_cached=use_cache,
                description="Analyzing source files"
            )

            # Convert results to FunctionInfo objects
            # Results are tuples of (file_path: Path, functions_data: List[Dict])
            source_functions = []
            for file_path, functions_data in results:
                if functions_data:  # Only process if we got results
                    for func_data in functions_data:
                        func_info = FunctionInfo(
                            name=func_data['name'],
                            file_path=func_data['file_path'],
                            line_number=func_data['line_number'],
                            is_async=func_data['is_async']
                        )
                        source_functions.append(func_info)

            logger.info(f"\n✅ Found {len(source_functions)} functions in source code\n")
        else:
            # Fallback to sequential if no files or parallel disabled
            source_functions = self._find_all_source_functions()

        # Match with tests and calculate coverage (same as sequential)
        self._match_functions_with_tests(source_functions, test_functions)
        self._calculate_coverage_percentage()

        # Log performance metrics
        duration_ms = (time.time() - start_time) * 1000
        try:
            log_performance_metric(
                logger,
                'test_coverage_optimized',
                duration_ms,
                metadata={
                    'total_files': len(source_files),
                    'total_functions': self.report.total_functions,
                    'parallel_enabled': use_parallel,
                    'cache_enabled': use_cache,
                    'workers': optimizer.max_workers if use_parallel else 1
                }
            )
        except NameError:
            # log_performance_metric not available, skip
            pass

        logger.info(f"⏱️  Analysis completed in {duration_ms:.0f}ms")

    def generate_report_text(self) -> str:
        """Generate human-readable coverage report"""
        lines = []
        lines.extend(self._generate_coverage_header())
        lines.extend(self._generate_coverage_summary())
        lines.extend(self._generate_coverage_bar())
        lines.extend(self._generate_untested_functions())
        lines.extend(self._generate_recommendations())
        lines.extend(self._generate_coverage_footer())
        return '\n'.join(lines)

    def _generate_coverage_header(self) -> List[str]:
        """Generate report header"""
        return [
            "="*80,
            "TEST COVERAGE ANALYSIS REPORT",
            "="*80,
            "",
            f"Source Directory: {self.src_dir}",
            f"Test Directory: {self.test_dir}",
            ""
        ]

    def _generate_coverage_summary(self) -> List[str]:
        """Generate coverage summary"""
        return [
            "="*80,
            "SUMMARY",
            "="*80,
            "",
            f"Total Functions: {self.report.total_functions}",
            f"Tested Functions: {self.report.tested_functions}",
            f"Untested Functions: {self.report.untested_functions}",
            f"Coverage: {self.report.coverage_percentage:.1f}%",
            ""
        ]

    def _generate_coverage_bar(self) -> List[str]:
        """Generate visual coverage bar"""
        bar_width = 50
        filled = int(bar_width * self.report.coverage_percentage / 100)
        bar = '█' * filled + '░' * (bar_width - filled)
        return [
            f"[{bar}] {self.report.coverage_percentage:.1f}%",
            ""
        ]

    def _generate_untested_functions(self) -> List[str]:
        """Generate untested functions section"""
        if not self.report.untested_by_file:
            return []

        lines = [
            "="*80,
            "UNTESTED FUNCTIONS BY FILE",
            "="*80,
            ""
        ]

        for file_path, functions in sorted(self.report.untested_by_file.items()):
            lines.extend(self._format_file_functions(file_path, functions))

        return lines

    def _format_file_functions(self, file_path: str, functions: List[FunctionInfo]) -> List[str]:
        """Format untested functions for a file"""
        lines = [
            f"📄 {file_path}",
            f"   {len(functions)} untested function(s)",
            "-"*80
        ]

        for func in sorted(functions, key=lambda x: x.line_number):
            async_marker = " (async)" if func.is_async else ""
            lines.append(f"  ❌ Line {func.line_number}: {func.name}(){async_marker}")

        lines.append("")
        return lines

    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations section"""
        lines = [
            "="*80,
            "RECOMMENDATIONS",
            "="*80,
            ""
        ]

        lines.extend(self._get_coverage_status())
        lines.append("")

        if self.report.untested_functions > 0:
            lines.extend(self._get_next_steps())

        lines.append("")
        return lines

    def _get_coverage_status(self) -> List[str]:
        """Get coverage status message"""
        if self.report.coverage_percentage < 70:
            return [
                "🔴 CRITICAL: Test coverage is below 70%",
                "   Priority: Add tests for core functionality"
            ]
        elif self.report.coverage_percentage < 80:
            return [
                "🟡 WARNING: Test coverage is below 80%",
                "   Goal: Increase coverage to 80%+"
            ]
        else:
            return [
                "🟢 GOOD: Test coverage is above 80%",
                "   Maintain current coverage level"
            ]

    def _get_next_steps(self) -> List[str]:
        """Get next steps for improving coverage"""
        return [
            "Next Steps:",
            f"  1. Add tests for {self.report.untested_functions} untested functions",
            "  2. Focus on functions with complex logic first",
            "  3. Consider edge cases and error handling"
        ]

    def _generate_coverage_footer(self) -> List[str]:
        """Generate report footer"""
        return [
            "="*80,
            "END OF REPORT",
            "="*80
        ]

    def save_report_json(self, output_path: Path) -> None:
        """Save coverage report as JSON"""
        data = self._build_json_report()
        self._write_json_to_file(output_path, data)
        logger.info(f"✅ Coverage report saved to {output_path}")

    def _build_json_report(self) -> Dict[str, Any]:
        """Build JSON report structure"""
        return {
            'summary': self._build_json_summary(),
            'functions': self._build_functions_list(),
            'untested_by_file': self._build_untested_by_file()
        }

    def _build_json_summary(self) -> Dict[str, Any]:
        """Build summary section for JSON"""
        return {
            'source_directory': str(self.src_dir),
            'test_directory': str(self.test_dir),
            'total_functions': self.report.total_functions,
            'tested_functions': self.report.tested_functions,
            'untested_functions': self.report.untested_functions,
            'coverage_percentage': round(self.report.coverage_percentage, 2)
        }

    def _build_functions_list(self) -> List[Dict[str, Any]]:
        """Build functions list for JSON"""
        return [self._function_to_dict(func) for func in self.report.functions]

    def _function_to_dict(self, func: FunctionInfo) -> Dict[str, Any]:
        """Convert FunctionInfo to dictionary"""
        return {
            'name': func.name,
            'file_path': func.file_path,
            'line_number': func.line_number,
            'is_async': func.is_async,
            'is_tested': func.is_tested
        }

    def _build_untested_by_file(self) -> Dict[str, List[Dict[str, Any]]]:
        """Build untested functions by file for JSON"""
        return {
            file_path: [self._untested_func_to_dict(func) for func in functions]
            for file_path, functions in self.report.untested_by_file.items()
        }

    def _untested_func_to_dict(self, func: FunctionInfo) -> Dict[str, Any]:
        """Convert untested function to dictionary"""
        return {
            'name': func.name,
            'line_number': func.line_number,
            'is_async': func.is_async
        }

    def _write_json_to_file(self, path: Path, data: Dict[str, Any]) -> None:
        """Write JSON data to file"""
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)

def main() -> None:
    args = _parse_coverage_args()
    _run_coverage_analysis(args)

def _parse_coverage_args() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Test Coverage Analyzer with parallel processing and caching'
    )
    parser.add_argument('src_dir', help='Source code directory')
    parser.add_argument('--test-dir', help='Test directory (default: src_dir/tests)')
    parser.add_argument('--json', help='Output JSON report to file')
    parser.add_argument('--text', help='Output text report to file')

    # Optimization options
    parser.add_argument('--parallel', action='store_true',
                       help='Enable parallel file processing (default: enabled)')
    parser.add_argument('--no-parallel', action='store_true',
                       help='Disable parallel file processing')
    parser.add_argument('--cache', action='store_true',
                       help='Enable caching of analysis results (default: enabled)')
    parser.add_argument('--no-cache', action='store_true',
                       help='Disable caching')
    parser.add_argument('--workers', type=int,
                       help='Number of worker processes (default: CPU count - 1)')
    parser.add_argument('--clear-cache', action='store_true',
                       help='Clear cache before running')

    return parser.parse_args()

def _run_coverage_analysis(args: argparse.Namespace) -> None:
    """Run coverage analysis"""
    src_dir, test_dir = _setup_directories(args)
    analyzer = _create_coverage_analyzer(src_dir, test_dir)

    # Handle cache clearing
    if args.clear_cache and OPTIMIZER_AVAILABLE:
        from src.analyzers.analyzer_optimizer import AnalyzerCache
        from pathlib import Path
        cache = AnalyzerCache('test_coverage', Path.cwd() / '.analyzer_cache')
        cache.clear_cache()

    # Determine optimization settings (enabled by default)
    use_parallel = not args.no_parallel if hasattr(args, 'no_parallel') else True
    use_cache = not args.no_cache if hasattr(args, 'no_cache') else True
    max_workers = args.workers if hasattr(args, 'workers') else None

    # Use optimized analysis if available and enabled
    if OPTIMIZER_AVAILABLE and (use_parallel or use_cache):
        _print_coverage_header()
        analyzer.analyze_coverage_optimized(
            use_parallel=use_parallel,
            use_cache=use_cache,
            max_workers=max_workers
        )
    else:
        _print_coverage_header()
        _perform_coverage_analysis(analyzer)

    _save_coverage_reports(analyzer, args)

def _setup_directories(args: argparse.Namespace) -> Tuple[Path, Optional[Path]]:
    """Setup source and test directories"""
    src_dir = Path(args.src_dir)
    test_dir = Path(args.test_dir) if args.test_dir else None
    return src_dir, test_dir

def _create_coverage_analyzer(src_dir: Path, test_dir: Optional[Path]) -> 'TestCoverageAnalyzer':
    """Create coverage analyzer instance"""
    return TestCoverageAnalyzer(src_dir, test_dir)

def _print_coverage_header() -> None:
    """Print coverage analysis header"""
    logger.info(f"\n{'='*80}")
    logger.info("Test Coverage Analyzer")
    logger.info(f"{'='*80}")

def _perform_coverage_analysis(analyzer: 'TestCoverageAnalyzer') -> None:
    """Perform the coverage analysis"""
    analyzer.analyze_coverage()

def _save_coverage_reports(analyzer: 'TestCoverageAnalyzer', args: argparse.Namespace) -> None:
    """Save coverage reports"""
    text_report = analyzer.generate_report_text()
    logger.info(text_report)

    if args.json:
        analyzer.save_report_json(Path(args.json))

    if args.text:
        _save_text_coverage_report(args.text, text_report)

def _save_text_coverage_report(filepath: str, content: str) -> None:
    """Save text coverage report to file"""
    with open(filepath, 'w') as f:
        f.write(content)
    logger.info(f"\n✅ Text report saved to {filepath}")

if __name__ == '__main__':
    main()
