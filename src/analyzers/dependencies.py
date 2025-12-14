#!/usr/bin/env python3
"""
Dependency Analyzer - Analyzes project dependencies using ast-grep
Finds imports, detects circular dependencies, and creates dependency graphs

Supports parallel processing and caching for improved performance.
"""

import argparse
import json
import logging
import os
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple, Optional
from dataclasses import dataclass, field
from collections import defaultdict, deque

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
class DependencyInfo:
    """Information about a dependency"""
    package: str
    import_type: str  # 'static', 'dynamic', 'require', 'type_only'
    file_path: str
    line_number: int
    is_external: bool = True

@dataclass
class DependencyReport:
    """Complete dependency analysis report"""
    total_dependencies: int = 0
    external_dependencies: int = 0
    internal_dependencies: int = 0
    dependencies_by_file: Dict[str, List[DependencyInfo]] = field(default_factory=lambda: defaultdict(list))
    dependency_graph: Dict[str, Set[str]] = field(default_factory=lambda: defaultdict(set))
    circular_dependencies: List[List[str]] = field(default_factory=list)
    unused_dependencies: Set[str] = field(default_factory=set)


# Top-level worker function for parallel processing (must be picklable)
def _analyze_file_dependencies_worker(file_path: Path) -> List[Dict[str, Any]]:
    """
    Worker function to analyze dependencies in a single file.

    This function must be at module level to be picklable for ProcessPoolExecutor.

    Args:
        file_path: Path to file to analyze

    Returns:
        List of dependency data dicts (JSON-serializable)
    """
    external_indicators = [
        '@', 'react', 'vue', 'angular', 'express', 'next',
        'lodash', 'axios', 'moment', 'dayjs'
    ]

    def is_external(package: str) -> bool:
        """Determine if package is external"""
        if package.startswith('.'):
            return False
        return any(package.startswith(ind) for ind in external_indicators)

    def run_astgrep(pattern: str, language: str) -> List[Dict[str, Any]]:
        """Run ast-grep pattern"""
        try:
            result = subprocess.run(
                ['ast-grep', 'run', '-p', pattern, '--lang', language, '--json', str(file_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0 and result.stdout.strip():
                parsed: List[Dict[str, Any]] = json.loads(result.stdout)
                return parsed
            return []
        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
            return []

    def extract_package(match: Dict) -> Optional[str]:
        """Extract package name from match"""
        meta = match.get('metaVariables', {})
        if 'single' in meta and 'PACKAGE' in meta['single']:
            pkg_node = meta['single']['PACKAGE']
            return pkg_node.get('text') if isinstance(pkg_node, dict) else str(pkg_node)
        elif 'PACKAGE' in meta:
            pkg_node = meta['PACKAGE']
            return pkg_node.get('text') if isinstance(pkg_node, dict) else str(pkg_node)
        return None

    try:
        dependencies_data = []

        # Determine file type and patterns
        if file_path.suffix == '.py':
            patterns = [
                ('import $PACKAGE', 'static'),
                ('from $PACKAGE import $$$', 'static'),
                ('import $PACKAGE as $ALIAS', 'static')
            ]
            language = 'python'

        elif file_path.suffix in ['.ts', '.tsx']:
            patterns = [
                ('import $$ from "$PACKAGE"', 'static'),
                ('import { $$ } from "$PACKAGE"', 'static'),
                ('import * as $$ from "$PACKAGE"', 'static'),
                ('import "$PACKAGE"', 'static'),
                ('import("$PACKAGE")', 'dynamic'),
                ('require("$PACKAGE")', 'require'),
                ('import type { $$ } from "$PACKAGE"', 'type_only')
            ]
            language = 'typescript'

        elif file_path.suffix in ['.js', '.jsx']:
            patterns = [
                ('import $$ from "$PACKAGE"', 'static'),
                ('import { $$ } from "$PACKAGE"', 'static'),
                ('import * as $$ from "$PACKAGE"', 'static'),
                ('import "$PACKAGE"', 'static'),
                ('import("$PACKAGE")', 'dynamic'),
                ('require("$PACKAGE")', 'require')
            ]
            language = 'javascript'
        else:
            return []

        # Process all patterns
        for pattern, import_type in patterns:
            matches = run_astgrep(pattern, language)
            for match in matches:
                package = extract_package(match)
                if package:
                    line_num = match.get('range', {}).get('start', {}).get('line', 0)
                    dependencies_data.append({
                        'package': package,
                        'import_type': import_type,
                        'file_path': str(file_path),
                        'line_number': line_num,
                        'is_external': is_external(package)
                    })

        return dependencies_data

    except Exception as e:
        logger.error(f"Worker error processing {file_path}: {e}")
        return []


class DependencyAnalyzer:
    """Analyzes project dependencies"""

    # Class-level external package indicators
    DEFAULT_EXTERNAL_INDICATORS = (
        '@', 'react', 'vue', 'angular', 'express', 'next',
        'lodash', 'axios', 'moment', 'dayjs'
    )

    def __init__(self, root_dir: Path):
        """Initialize the dependency analyzer.

        Args:
            root_dir: Root directory of the project to analyze
        """
        self.root_dir = root_dir
        self.report = DependencyReport()
        self.external_indicators = list(self.DEFAULT_EXTERNAL_INDICATORS)

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
            return []
        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
            return []

    def _is_external_package(self, package: str) -> bool:
        """Determine if a package is external"""
        # Relative imports are internal
        if package.startswith('.'):
            return False

        # Check against known external indicators
        return any(package.startswith(indicator) for indicator in self.external_indicators)

    def analyze_python_imports(self, file_path: Path) -> List[DependencyInfo]:
        """Analyze Python imports"""
        dependencies = []

        patterns = [
            'import $PACKAGE',
            'from $PACKAGE import $$$',
            'import $PACKAGE as $ALIAS'
        ]

        for pattern in patterns:
            deps = self._process_python_pattern(file_path, pattern)
            dependencies.extend(deps)

        return dependencies

    def _process_python_pattern(self, file_path: Path, pattern: str) -> List[DependencyInfo]:
        """Process a single Python import pattern"""
        dependencies = []
        matches = self._run_astgrep(file_path, pattern, 'python')

        for match in matches:
            dep = self._create_python_dependency(match, file_path)
            if dep:
                dependencies.append(dep)

        return dependencies

    def _create_python_dependency(self, match: Dict[str, Any], file_path: Path) -> Optional[DependencyInfo]:
        """Create a DependencyInfo from a Python import match"""
        package = self._extract_package_name(match)
        if not package:
            return None

        line_num = match.get('range', {}).get('start', {}).get('line', 0)

        return DependencyInfo(
            package=package,
            import_type='static',
            file_path=str(file_path),
            line_number=line_num,
            is_external=self._is_external_package(package)
        )

    def analyze_typescript_imports(self, file_path: Path, language: str = 'typescript') -> List[DependencyInfo]:
        """Analyze TypeScript/JavaScript imports"""
        dependencies = []

        # Process different import types
        dependencies.extend(self._process_static_imports(file_path, language))
        dependencies.extend(self._process_dynamic_imports(file_path, language))
        dependencies.extend(self._process_require_statements(file_path, language))
        dependencies.extend(self._process_type_imports(file_path, language))

        return dependencies

    def _process_static_imports(self, file_path: Path, language: str) -> List[DependencyInfo]:
        """Process static import statements"""
        # Patterns for both double and single quoted imports
        static_patterns = [
            'import $$ from "$PACKAGE"',
            "import $$ from '$PACKAGE'",
            'import { $$ } from "$PACKAGE"',
            "import { $$ } from '$PACKAGE'",
            'import * as $$ from "$PACKAGE"',
            "import * as $$ from '$PACKAGE'",
            'import "$PACKAGE"',
            "import '$PACKAGE'"
        ]

        dependencies = []
        for pattern in static_patterns:
            matches = self._run_astgrep(file_path, pattern, language)
            for match in matches:
                dep = self._create_dependency_from_match(match, file_path, 'static')
                if dep:
                    dependencies.append(dep)
        return dependencies

    def _process_dynamic_imports(self, file_path: Path, language: str) -> List[DependencyInfo]:
        """Process dynamic import() statements"""
        dependencies = []
        # Handle both quote styles
        for pattern in ['import("$PACKAGE")', "import('$PACKAGE')"]:
            matches = self._run_astgrep(file_path, pattern, language)
            for match in matches:
                dep = self._create_dependency_from_match(match, file_path, 'dynamic')
                if dep:
                    dependencies.append(dep)
        return dependencies

    def _process_require_statements(self, file_path: Path, language: str) -> List[DependencyInfo]:
        """Process require() statements"""
        dependencies = []
        # Handle both quote styles
        for pattern in ['require("$PACKAGE")', "require('$PACKAGE')"]:
            matches = self._run_astgrep(file_path, pattern, language)
            for match in matches:
                dep = self._create_dependency_from_match(match, file_path, 'require')
                if dep:
                    dependencies.append(dep)
        return dependencies

    def _process_type_imports(self, file_path: Path, language: str) -> List[DependencyInfo]:
        """Process TypeScript type-only imports"""
        dependencies = []
        # Handle both quote styles
        for pattern in ['import type { $$ } from "$PACKAGE"', "import type { $$ } from '$PACKAGE'"]:
            matches = self._run_astgrep(file_path, pattern, language)
            for match in matches:
                dep = self._create_dependency_from_match(match, file_path, 'type_only')
                if dep:
                    dependencies.append(dep)
        return dependencies

    def _create_dependency_from_match(self, match: Dict[str, Any], file_path: Path,
                                     import_type: str) -> Optional[DependencyInfo]:
        """Create a DependencyInfo object from an ast-grep match"""
        package = self._extract_package_name(match)
        if not package:
            return None

        line_num = match.get('range', {}).get('start', {}).get('line', 0)

        return DependencyInfo(
            package=package,
            import_type=import_type,
            file_path=str(file_path),
            line_number=line_num,
            is_external=self._is_external_package(package)
        )

    def _extract_package_name(self, match: Dict[str, Any]) -> Optional[str]:
        """Extract package name from ast-grep match metadata"""
        meta = match.get('metaVariables', {})

        # Handle both old and new ast-grep formats
        if 'single' in meta and 'PACKAGE' in meta['single']:
            package_node = meta['single']['PACKAGE']
            return package_node.get('text') if isinstance(package_node, dict) else str(package_node)
        elif 'PACKAGE' in meta:
            package_node = meta['PACKAGE']
            return package_node.get('text') if isinstance(package_node, dict) else str(package_node)

        return None

    def analyze_file(self, file_path: Path) -> None:
        """Analyze dependencies in a single file"""
        if file_path.suffix == '.py':
            deps = self.analyze_python_imports(file_path)
        elif file_path.suffix in ['.ts', '.tsx']:
            deps = self.analyze_typescript_imports(file_path, 'typescript')
        elif file_path.suffix in ['.js', '.jsx']:
            deps = self.analyze_typescript_imports(file_path, 'javascript')
        else:
            return

        # Add to report
        for dep in deps:
            self.report.dependencies_by_file[dep.file_path].append(dep)
            self.report.total_dependencies += 1

            if dep.is_external:
                self.report.external_dependencies += 1
            else:
                self.report.internal_dependencies += 1

            # Build dependency graph (for internal deps)
            if not dep.is_external:
                src_file = str(file_path)
                self.report.dependency_graph[src_file].add(dep.package)

    def analyze_directory(self, directory: Optional[Path] = None, skip_dirs: Optional[Set[str]] = None) -> None:
        """Analyze all files in a directory"""
        if directory is None:
            directory = self.root_dir

        if skip_dirs is None:
            skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                        '_site', '.venv', 'venv', 'env', '.cache', 'coverage'}

        for root, dirs, files in os.walk(directory):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            for file_name in files:
                file_path = Path(root) / file_name
                if file_path.suffix in ['.py', '.ts', '.tsx', '.js', '.jsx']:
                    self.analyze_file(file_path)

    def analyze_directory_optimized(self, directory: Optional[Path] = None, skip_dirs: Optional[Set[str]] = None,
                                   use_parallel: bool = True, use_cache: bool = True,
                                   max_workers: Optional[int] = None,
                                   cache_dir: Optional[Path] = None) -> None:
        """
        Analyze all files in a directory with parallel processing and caching

        Args:
            directory: Directory to analyze (default: root_dir)
            skip_dirs: Set of directory names to skip
            use_parallel: Enable parallel file processing
            use_cache: Enable caching of analysis results
            max_workers: Number of worker processes (default: CPU count - 1)
            cache_dir: Directory for cache files (default: .analyzer_cache)
        """
        import time
        start_time = time.time()

        if directory is None:
            directory = self.root_dir

        if skip_dirs is None:
            skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                        '_site', '.venv', 'venv', 'env', '.cache', 'coverage'}

        # Check if optimizer is available
        if not OPTIMIZER_AVAILABLE:
            logger.warning("⚠️  Optimizer not available, falling back to sequential processing")
            return self.analyze_directory(directory, skip_dirs)

        if not use_parallel and not use_cache:
            logger.info("ℹ️  Optimizations disabled, using sequential processing")
            return self.analyze_directory(directory, skip_dirs)

        # Initialize parallel analyzer
        optimizer = ParallelAnalyzer(
            analyzer_name='dependencies',
            max_workers=max_workers,
            use_cache=use_cache,
            cache_dir=cache_dir
        )

        logger.info(f"\n🚀 Parallel dependency analysis enabled")
        logger.info(f"   Workers: {optimizer.max_workers}")
        logger.info(f"   Cache enabled: {use_cache}\n")

        # Collect all source files
        source_files = []
        for root, dirs, files in os.walk(directory):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            for file_name in files:
                file_path = Path(root) / file_name
                if file_path.suffix in ['.py', '.ts', '.tsx', '.js', '.jsx']:
                    source_files.append(file_path)

        logger.info(f"📂 Found {len(source_files)} source files to analyze\n")

        # Process files in parallel
        if use_parallel and source_files:
            results = optimizer.process_items_parallel(
                items=source_files,
                processor_func=_analyze_file_dependencies_worker,
                key_func=get_file_key,
                hash_func=get_file_content_hash if use_cache else None,
                skip_cached=use_cache,
                description="Analyzing dependencies"
            )

            # Convert results to DependencyInfo objects and update report
            for file_path, dependencies_data in results:
                if dependencies_data:  # Only process if we got results
                    for dep_data in dependencies_data:
                        dep_info = DependencyInfo(
                            package=dep_data['package'],
                            import_type=dep_data['import_type'],
                            file_path=dep_data['file_path'],
                            line_number=dep_data['line_number'],
                            is_external=dep_data['is_external']
                        )

                        # Add to report
                        self.report.dependencies_by_file[dep_info.file_path].append(dep_info)
                        self.report.total_dependencies += 1

                        if dep_info.is_external:
                            self.report.external_dependencies += 1
                        else:
                            self.report.internal_dependencies += 1

                        # Build dependency graph (for internal deps)
                        if not dep_info.is_external:
                            src_file = str(file_path)
                            self.report.dependency_graph[src_file].add(dep_info.package)

            logger.info(f"\n✅ Found {self.report.total_dependencies} dependencies\n")
        else:
            # Fallback to sequential if no files or parallel disabled
            self.analyze_directory(directory, skip_dirs)

        # Log performance metrics
        duration_ms = (time.time() - start_time) * 1000
        try:
            log_performance_metric(
                logger,
                'dependencies_optimized',
                duration_ms,
                metadata={
                    'total_files': len(source_files),
                    'total_dependencies': self.report.total_dependencies,
                    'external_dependencies': self.report.external_dependencies,
                    'internal_dependencies': self.report.internal_dependencies,
                    'parallel_enabled': use_parallel,
                    'cache_enabled': use_cache,
                    'workers': optimizer.max_workers if use_parallel else 1
                }
            )
        except NameError:
            # log_performance_metric not available, skip
            pass

        logger.info(f"⏱️  Analysis completed in {duration_ms:.0f}ms")

    def find_circular_dependencies(self) -> None:
        """Detect circular dependencies using DFS"""
        def dfs(node: str, path: List[str], visited: Set[str], rec_stack: Set[str]) -> None:
            visited.add(node)
            rec_stack.add(node)
            path.append(node)

            for neighbor in self.report.dependency_graph.get(node, set()):
                if neighbor not in visited:
                    dfs(neighbor, path.copy(), visited, rec_stack)
                elif neighbor in rec_stack:
                    # Found a cycle
                    cycle_start = path.index(neighbor)
                    cycle = path[cycle_start:] + [neighbor]
                    if cycle not in self.report.circular_dependencies:
                        self.report.circular_dependencies.append(cycle)

            rec_stack.remove(node)

        visited: Set[str] = set()
        for node in self.report.dependency_graph:
            if node not in visited:
                dfs(node, [], visited, set())

    def generate_report_text(self) -> str:
        """Generate human-readable dependency report"""
        lines = []
        lines.extend(self._generate_report_header())
        lines.extend(self._generate_summary())
        lines.extend(self._generate_external_packages_section())
        lines.extend(self._generate_import_type_section())
        lines.extend(self._generate_circular_deps_section())
        lines.extend(self._generate_top_files_section())
        lines.extend(self._generate_report_footer())
        return '\n'.join(lines)

    def _generate_report_header(self) -> List[str]:
        """Generate report header"""
        return [
            "="*80,
            "DEPENDENCY ANALYSIS REPORT",
            "="*80,
            "",
            f"Root Directory: {self.root_dir}",
            ""
        ]

    def _generate_summary(self) -> List[str]:
        """Generate summary section"""
        return [
            "="*80,
            "SUMMARY",
            "="*80,
            "",
            f"Total Dependencies: {self.report.total_dependencies}",
            f"External Dependencies: {self.report.external_dependencies}",
            f"Internal Dependencies: {self.report.internal_dependencies}",
            f"Files Analyzed: {len(self.report.dependencies_by_file)}",
            ""
        ]

    def _generate_external_packages_section(self) -> List[str]:
        """Generate external packages section"""
        external_packages = self._get_external_packages()

        if not external_packages:
            return []

        lines = [
            "="*80,
            f"EXTERNAL PACKAGES ({len(external_packages)})",
            "="*80,
            ""
        ]

        for package in sorted(external_packages):
            usage_count = self._count_package_usage(package)
            lines.append(f"  📦 {package} (used {usage_count}x)")

        lines.append("")
        return lines

    def _get_external_packages(self) -> Set[str]:
        """Get all external package names"""
        external_packages = set()
        for deps in self.report.dependencies_by_file.values():
            for dep in deps:
                if dep.is_external:
                    external_packages.add(dep.package)
        return external_packages

    def _count_package_usage(self, package: str) -> int:
        """Count how many times a package is used"""
        return sum(
            1 for deps in self.report.dependencies_by_file.values()
            for dep in deps
            if dep.package == package
        )

    def _generate_import_type_section(self) -> List[str]:
        """Generate import type statistics section"""
        by_type = self._get_dependencies_by_type()

        if not by_type:
            return []

        lines = [
            "="*80,
            "DEPENDENCIES BY IMPORT TYPE",
            "="*80,
            ""
        ]

        for import_type, count in sorted(by_type.items()):
            lines.append(f"  {import_type}: {count}")

        lines.append("")
        return lines

    def _get_dependencies_by_type(self) -> Dict[str, int]:
        """Count dependencies by import type"""
        by_type: Dict[str, int] = defaultdict(int)
        for deps in self.report.dependencies_by_file.values():
            for dep in deps:
                by_type[dep.import_type] += 1
        return by_type

    def _generate_circular_deps_section(self) -> List[str]:
        """Generate circular dependencies section"""
        if not self.report.circular_dependencies:
            return []

        lines = [
            "="*80,
            f"⚠️  CIRCULAR DEPENDENCIES DETECTED ({len(self.report.circular_dependencies)})",
            "="*80,
            ""
        ]

        for idx, cycle in enumerate(self.report.circular_dependencies, 1):
            lines.extend(self._format_cycle(idx, cycle))

        return lines

    def _format_cycle(self, idx: int, cycle: List[str]) -> List[str]:
        """Format a single circular dependency cycle"""
        lines = [f"  Cycle {idx}:"]
        for file in cycle:
            lines.append(f"    → {file}")
        lines.append("")
        return lines

    def _generate_top_files_section(self) -> List[str]:
        """Generate top files by dependency count section"""
        top_files = self._get_top_files(10)

        if not top_files:
            return []

        lines = [
            "="*80,
            "TOP FILES BY DEPENDENCY COUNT",
            "="*80,
            ""
        ]

        for file_path, deps in top_files:
            lines.append(f"  📄 {file_path}")
            lines.append(f"     {len(deps)} dependencies")
            lines.append("")

        return lines

    def _get_top_files(self, limit: int) -> List[Tuple[str, List[DependencyInfo]]]:
        """Get top files by dependency count"""
        return sorted(
            self.report.dependencies_by_file.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:limit]

    def _generate_report_footer(self) -> List[str]:
        """Generate report footer"""
        return [
            "="*80,
            "END OF REPORT",
            "="*80
        ]

    def save_report_json(self, output_path: Path) -> None:
        """Save dependency report as JSON"""
        data = self._build_report_json()
        self._write_json_file(output_path, data)
        logger.info(f"✅ Dependency report saved to {output_path}")

    def _build_report_json(self) -> Dict[str, Any]:
        """Build JSON data structure for report"""
        return {
            'summary': self._build_summary_json(),
            'dependencies_by_file': self._build_dependencies_json(),
            'circular_dependencies': self.report.circular_dependencies
        }

    def _build_summary_json(self) -> Dict[str, Any]:
        """Build summary section for JSON"""
        return {
            'root_directory': str(self.root_dir),
            'total_dependencies': self.report.total_dependencies,
            'external_dependencies': self.report.external_dependencies,
            'internal_dependencies': self.report.internal_dependencies,
            'files_analyzed': len(self.report.dependencies_by_file),
            'circular_dependencies_count': len(self.report.circular_dependencies)
        }

    def _build_dependencies_json(self) -> Dict[str, List[Dict[str, Any]]]:
        """Build dependencies by file for JSON"""
        return {
            file_path: [self._dep_to_dict(dep) for dep in deps]
            for file_path, deps in self.report.dependencies_by_file.items()
        }

    def _dep_to_dict(self, dep: DependencyInfo) -> Dict[str, Any]:
        """Convert DependencyInfo to dictionary"""
        return {
            'package': dep.package,
            'import_type': dep.import_type,
            'line_number': dep.line_number,
            'is_external': dep.is_external
        }

    def _write_json_file(self, path: Path, data: Dict[str, Any]) -> None:
        """Write JSON data to file"""
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)

def main() -> None:
    args = _parse_args()
    _run_dependency_analysis(args)

def _parse_args() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Dependency Analyzer with parallel processing and caching'
    )
    parser.add_argument('directory', help='Directory to analyze')
    parser.add_argument('--json', help='Output JSON report to file')
    parser.add_argument('--text', help='Output text report to file')
    parser.add_argument('--detect-circular', action='store_true',
                       help='Detect circular dependencies')

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

def _run_dependency_analysis(args: argparse.Namespace) -> None:
    """Run the dependency analysis"""
    directory = Path(args.directory)
    analyzer = _init_dependency_analyzer(directory)

    # Handle cache clearing
    if args.clear_cache and OPTIMIZER_AVAILABLE:
        from src.analyzers.analyzer_optimizer import AnalyzerCache
        cache = AnalyzerCache('dependencies', Path.cwd() / '.analyzer_cache')
        cache.clear_cache()

    _print_analysis_header(directory)
    _perform_analysis(analyzer, args)
    _output_reports(analyzer, args)

def _init_dependency_analyzer(directory: Path) -> 'DependencyAnalyzer':
    """Initialize dependency analyzer"""
    return DependencyAnalyzer(directory)

def _print_analysis_header(directory: Path) -> None:
    """Print analysis header"""
    logger.info(f"\n{'='*80}")
    logger.info("Dependency Analyzer")
    logger.info(f"{'='*80}\n")
    logger.info(f"Analyzing: {directory}\n")

def _perform_analysis(analyzer: 'DependencyAnalyzer', args: argparse.Namespace) -> None:
    """Perform the dependency analysis"""
    # Determine optimization settings (enabled by default)
    use_parallel = not args.no_parallel if hasattr(args, 'no_parallel') else True
    use_cache = not args.no_cache if hasattr(args, 'no_cache') else True
    max_workers = args.workers if hasattr(args, 'workers') else None

    # Use optimized analysis if available and enabled
    if OPTIMIZER_AVAILABLE and (use_parallel or use_cache):
        analyzer.analyze_directory_optimized(
            use_parallel=use_parallel,
            use_cache=use_cache,
            max_workers=max_workers
        )
    else:
        analyzer.analyze_directory()

    if args.detect_circular:
        logger.info("\nDetecting circular dependencies...\n")
        analyzer.find_circular_dependencies()

def _output_reports(analyzer: 'DependencyAnalyzer', args: argparse.Namespace) -> None:
    """Generate and save reports"""
    text_report = analyzer.generate_report_text()
    logger.info(text_report)

    if args.json:
        analyzer.save_report_json(Path(args.json))

    if args.text:
        _save_text_file(args.text, text_report)

def _save_text_file(filepath: str, content: str) -> None:
    """Save text content to file"""
    with open(filepath, 'w') as f:
        f.write(content)
    logger.info(f"\n✅ Text report saved to {filepath}")

if __name__ == '__main__':
    main()
