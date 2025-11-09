#!/usr/bin/env python3
"""
Dependency Analyzer - Analyzes project dependencies using ast-grep
Finds imports, detects circular dependencies, and creates dependency graphs
"""

import json
import os
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict, deque

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

class DependencyAnalyzer:
    """Analyzes project dependencies"""

    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.report = DependencyReport()

        # Common external package prefixes
        self.external_indicators = [
            '@', 'react', 'vue', 'angular', 'express', 'next',
            'lodash', 'axios', 'moment', 'dayjs'
        ]

    def _run_astgrep(self, file_path: Path, pattern: str, language: str) -> List[Dict[str, Any]]:
        """Run ast-grep pattern"""
        try:
            result = subprocess.run(
                ['ast-grep', 'run', '-p', pattern, '--lang', language, '--json', str(file_path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout.strip():
                return json.loads(result.stdout)
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
            matches = self._run_astgrep(file_path, pattern, 'python')

            for match in matches:
                meta = match.get('metaVariables', {})
                # Handle both old and new ast-grep formats
                if 'single' in meta and 'PACKAGE' in meta['single']:
                    package_node = meta['single']['PACKAGE']
                    package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
                elif 'PACKAGE' in meta:
                    package_node = meta['PACKAGE']
                    package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
                else:
                    continue

                line_num = match.get('range', {}).get('start', {}).get('line', 0)

                # Determine if external
                is_external = self._is_external_package(package)

                dep = DependencyInfo(
                    package=package,
                    import_type='static',
                    file_path=str(file_path),
                    line_number=line_num,
                    is_external=is_external
                )
                dependencies.append(dep)

        return dependencies

    def analyze_typescript_imports(self, file_path: Path, language: str = 'typescript') -> List[DependencyInfo]:
        """Analyze TypeScript/JavaScript imports"""
        dependencies = []

        # Static imports
        static_patterns = [
            'import $$ from "$PACKAGE"',
            'import { $$ } from "$PACKAGE"',
            'import * as $$ from "$PACKAGE"',
            'import "$PACKAGE"'
        ]

        for pattern in static_patterns:
            matches = self._run_astgrep(file_path, pattern, language)

            for match in matches:
                meta = match.get('metaVariables', {})
                # Handle both old and new ast-grep formats
                if 'single' in meta and 'PACKAGE' in meta['single']:
                    package_node = meta['single']['PACKAGE']
                    package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
                elif 'PACKAGE' in meta:
                    package_node = meta['PACKAGE']
                    package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
                else:
                    continue

                line_num = match.get('range', {}).get('start', {}).get('line', 0)

                is_external = self._is_external_package(package)

                dep = DependencyInfo(
                    package=package,
                    import_type='static',
                    file_path=str(file_path),
                    line_number=line_num,
                    is_external=is_external
                )
                dependencies.append(dep)

        # Dynamic imports
        dynamic_matches = self._run_astgrep(file_path, 'import("$PACKAGE")', language)
        for match in dynamic_matches:
            meta = match.get('metaVariables', {})
            # Handle both old and new ast-grep formats
            if 'single' in meta and 'PACKAGE' in meta['single']:
                package_node = meta['single']['PACKAGE']
                package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
            elif 'PACKAGE' in meta:
                package_node = meta['PACKAGE']
                package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
            else:
                continue

            line_num = match.get('range', {}).get('start', {}).get('line', 0)

            dep = DependencyInfo(
                package=package,
                import_type='dynamic',
                file_path=str(file_path),
                line_number=line_num,
                is_external=self._is_external_package(package)
            )
            dependencies.append(dep)

        # Require statements
        require_matches = self._run_astgrep(file_path, 'require("$PACKAGE")', language)
        for match in require_matches:
            meta = match.get('metaVariables', {})
            # Handle both old and new ast-grep formats
            if 'single' in meta and 'PACKAGE' in meta['single']:
                package_node = meta['single']['PACKAGE']
                package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
            elif 'PACKAGE' in meta:
                package_node = meta['PACKAGE']
                package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
            else:
                continue

            line_num = match.get('range', {}).get('start', {}).get('line', 0)

            dep = DependencyInfo(
                package=package,
                import_type='require',
                file_path=str(file_path),
                line_number=line_num,
                is_external=self._is_external_package(package)
            )
            dependencies.append(dep)

        # Type-only imports
        type_matches = self._run_astgrep(file_path, 'import type { $$ } from "$PACKAGE"', language)
        for match in type_matches:
            meta = match.get('metaVariables', {})
            # Handle both old and new ast-grep formats
            if 'single' in meta and 'PACKAGE' in meta['single']:
                package_node = meta['single']['PACKAGE']
                package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
            elif 'PACKAGE' in meta:
                package_node = meta['PACKAGE']
                package = package_node.get('text') if isinstance(package_node, dict) else str(package_node)
            else:
                continue

            line_num = match.get('range', {}).get('start', {}).get('line', 0)

            dep = DependencyInfo(
                package=package,
                import_type='type_only',
                file_path=str(file_path),
                line_number=line_num,
                is_external=self._is_external_package(package)
            )
            dependencies.append(dep)

        return dependencies

    def analyze_file(self, file_path: Path):
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

    def analyze_directory(self, directory: Path = None, skip_dirs: set = None):
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

    def find_circular_dependencies(self):
        """Detect circular dependencies using DFS"""
        def dfs(node, path, visited, rec_stack):
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

        visited = set()
        for node in self.report.dependency_graph:
            if node not in visited:
                dfs(node, [], visited, set())

    def generate_report_text(self) -> str:
        """Generate human-readable dependency report"""
        lines = [
            "="*80,
            "DEPENDENCY ANALYSIS REPORT",
            "="*80,
            "",
            f"Root Directory: {self.root_dir}",
            "",
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

        # External dependencies summary
        external_packages = set()
        for deps in self.report.dependencies_by_file.values():
            for dep in deps:
                if dep.is_external:
                    external_packages.add(dep.package)

        if external_packages:
            lines.append("="*80)
            lines.append(f"EXTERNAL PACKAGES ({len(external_packages)})")
            lines.append("="*80)
            lines.append("")

            for package in sorted(external_packages):
                # Count usage
                usage_count = sum(
                    1 for deps in self.report.dependencies_by_file.values()
                    for dep in deps
                    if dep.package == package
                )
                lines.append(f"  📦 {package} (used {usage_count}x)")

            lines.append("")

        # Dependencies by import type
        by_type = defaultdict(int)
        for deps in self.report.dependencies_by_file.values():
            for dep in deps:
                by_type[dep.import_type] += 1

        if by_type:
            lines.append("="*80)
            lines.append("DEPENDENCIES BY IMPORT TYPE")
            lines.append("="*80)
            lines.append("")

            for import_type, count in sorted(by_type.items()):
                lines.append(f"  {import_type}: {count}")

            lines.append("")

        # Circular dependencies
        if self.report.circular_dependencies:
            lines.append("="*80)
            lines.append(f"⚠️  CIRCULAR DEPENDENCIES DETECTED ({len(self.report.circular_dependencies)})")
            lines.append("="*80)
            lines.append("")

            for idx, cycle in enumerate(self.report.circular_dependencies, 1):
                lines.append(f"  Cycle {idx}:")
                for file in cycle:
                    lines.append(f"    → {file}")
                lines.append("")

        # Top files by dependency count
        top_files = sorted(
            self.report.dependencies_by_file.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:10]

        if top_files:
            lines.append("="*80)
            lines.append("TOP FILES BY DEPENDENCY COUNT")
            lines.append("="*80)
            lines.append("")

            for file_path, deps in top_files:
                lines.append(f"  📄 {file_path}")
                lines.append(f"     {len(deps)} dependencies")
                lines.append("")

        lines.append("="*80)
        lines.append("END OF REPORT")
        lines.append("="*80)

        return '\n'.join(lines)

    def save_report_json(self, output_path: Path):
        """Save dependency report as JSON"""
        data = {
            'summary': {
                'root_directory': str(self.root_dir),
                'total_dependencies': self.report.total_dependencies,
                'external_dependencies': self.report.external_dependencies,
                'internal_dependencies': self.report.internal_dependencies,
                'files_analyzed': len(self.report.dependencies_by_file),
                'circular_dependencies_count': len(self.report.circular_dependencies)
            },
            'dependencies_by_file': {
                file_path: [
                    {
                        'package': dep.package,
                        'import_type': dep.import_type,
                        'line_number': dep.line_number,
                        'is_external': dep.is_external
                    }
                    for dep in deps
                ]
                for file_path, deps in self.report.dependencies_by_file.items()
            },
            'circular_dependencies': self.report.circular_dependencies
        }

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✅ Dependency report saved to {output_path}")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Dependency Analyzer')
    parser.add_argument('directory', help='Directory to analyze')
    parser.add_argument('--json', help='Output JSON report to file')
    parser.add_argument('--text', help='Output text report to file')
    parser.add_argument('--detect-circular', action='store_true', help='Detect circular dependencies')

    args = parser.parse_args()

    directory = Path(args.directory)
    analyzer = DependencyAnalyzer(directory)

    print(f"\n{'='*80}")
    print("Dependency Analyzer")
    print(f"{'='*80}\n")
    print(f"Analyzing: {directory}\n")

    analyzer.analyze_directory()

    if args.detect_circular:
        print("Detecting circular dependencies...\n")
        analyzer.find_circular_dependencies()

    # Generate text report
    text_report = analyzer.generate_report_text()
    print(text_report)

    # Save reports if requested
    if args.json:
        analyzer.save_report_json(Path(args.json))

    if args.text:
        with open(args.text, 'w') as f:
            f.write(text_report)
        print(f"\n✅ Text report saved to {args.text}")

if __name__ == '__main__':
    main()
