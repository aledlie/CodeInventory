#!/usr/bin/env python3
"""
Tool Identifier - Identifies standalone, modular, reusable functionality within codebases

Analyzes code to find functions, classes, and modules that:
- Have minimal dependencies (standalone or nearly standalone)
- Are self-contained with clear interfaces
- Could be extracted as reusable tools/utilities
- Follow good modularity patterns

Uses ast-grep for AST-based analysis to identify:
- Pure functions (no side effects, deterministic)
- Utility classes with minimal coupling
- Self-contained modules
- Potential extraction candidates
"""

import argparse
import json
import logging
import os
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
from enum import Enum

# Import preprocessing module (optional, for preprocessing feature)
try:
    from .preprocessing import PreprocessingConfig, PreprocessingPipeline
    PREPROCESSING_AVAILABLE = True
except ImportError:
    PREPROCESSING_AVAILABLE = False
    PreprocessingConfig = None  # type: ignore
    PreprocessingPipeline = None  # type: ignore

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


class ModularityScore(Enum):
    """Modularity assessment levels"""
    HIGHLY_MODULAR = "highly_modular"      # 0-1 external deps, pure function
    MODULAR = "modular"                     # 2-3 external deps, minimal side effects
    SEMI_MODULAR = "semi_modular"           # 4-5 external deps, some coupling
    COUPLED = "coupled"                     # 6+ external deps, significant coupling


@dataclass
class ImportInfo:
    """Information about an import statement"""
    module: str
    is_stdlib: bool
    is_relative: bool
    line_number: int


@dataclass
class FunctionInfo:
    """Information about a function/method"""
    name: str
    file_path: str
    line_number: int
    parameters: List[str]
    has_return_type: bool
    has_docstring: bool
    is_async: bool
    is_generator: bool
    is_class_method: bool
    parent_class: Optional[str]
    complexity_hints: Dict[str, Any]
    imports_used: List[str]
    external_calls: List[str]
    modularity_score: ModularityScore
    extraction_potential: float  # 0.0 to 1.0


@dataclass
class ClassInfo:
    """Information about a class"""
    name: str
    file_path: str
    line_number: int
    methods: List[str]
    base_classes: List[str]
    has_docstring: bool
    is_dataclass: bool
    is_abstract: bool
    dependencies: List[str]
    modularity_score: ModularityScore
    extraction_potential: float


@dataclass
class ModuleInfo:
    """Information about a module/file"""
    file_path: str
    functions: List[FunctionInfo]
    classes: List[ClassInfo]
    imports: List[ImportInfo]
    external_dependencies: Set[str]
    internal_dependencies: Set[str]
    stdlib_dependencies: Set[str]
    exports: List[str]
    modularity_score: ModularityScore
    is_utility_module: bool
    extraction_potential: float


@dataclass
class ToolCandidate:
    """A candidate for extraction as a standalone tool"""
    name: str
    type: str  # 'function', 'class', 'module'
    file_path: str
    line_number: int
    description: str
    dependencies: List[str]
    modularity_score: ModularityScore
    extraction_potential: float
    extraction_complexity: str  # 'trivial', 'easy', 'moderate', 'complex'
    suggested_package_name: str
    rationale: str


@dataclass
class ToolIdentificationReport:
    """Complete tool identification report"""
    total_files_analyzed: int = 0
    total_functions: int = 0
    total_classes: int = 0
    tool_candidates: List[ToolCandidate] = field(default_factory=list)
    modules: List[ModuleInfo] = field(default_factory=list)
    highly_modular_count: int = 0
    modular_count: int = 0
    semi_modular_count: int = 0
    coupled_count: int = 0


# Python standard library modules (subset of most common)
PYTHON_STDLIB = {
    'abc', 'argparse', 'ast', 'asyncio', 'base64', 'bisect', 'calendar',
    'collections', 'contextlib', 'copy', 'csv', 'dataclasses', 'datetime',
    'decimal', 'difflib', 'enum', 'functools', 'glob', 'hashlib', 'heapq',
    'html', 'http', 'importlib', 'inspect', 'io', 'itertools', 'json',
    'logging', 'math', 'operator', 'os', 'pathlib', 'pickle', 'platform',
    'pprint', 'queue', 'random', 're', 'shutil', 'signal', 'socket',
    'sqlite3', 'statistics', 'string', 'struct', 'subprocess', 'sys',
    'tempfile', 'textwrap', 'threading', 'time', 'traceback', 'typing',
    'unittest', 'urllib', 'uuid', 'warnings', 'weakref', 'xml', 'zipfile'
}

# Common utility patterns that indicate modular code
UTILITY_PATTERNS = [
    'utils', 'util', 'helpers', 'helper', 'tools', 'tool',
    'common', 'shared', 'lib', 'core', 'base'
]


class ToolIdentifier:
    """Identifies standalone, modular functionality in codebases"""

    def __init__(
        self,
        root_dir: Path,
        preprocessing_config: Optional['PreprocessingConfig'] = None
    ):
        """Initialize the tool identifier.

        Args:
            root_dir: Root directory of the codebase to analyze
            preprocessing_config: Optional preprocessing configuration.
                If provided, enables data preprocessing before report output.
        """
        self.root_dir = root_dir
        self.report = ToolIdentificationReport()

        # Initialize preprocessing pipeline if configured
        self.preprocessor: Optional['PreprocessingPipeline'] = None
        if preprocessing_config and PREPROCESSING_AVAILABLE:
            self.preprocessor = PreprocessingPipeline(preprocessing_config)
            logger.info("Preprocessing pipeline enabled")

    def _run_astgrep(self, file_path: Path, pattern: str, language: str) -> List[Dict[str, Any]]:
        """Run ast-grep pattern against a file"""
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
        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
            logger.debug(f"ast-grep error for {file_path}: {e}")
            return []

    def _extract_meta_var(self, match: Dict[str, Any], var_name: str) -> Optional[str]:
        """Extract a meta variable from ast-grep match"""
        meta = match.get('metaVariables', {})
        if 'single' in meta and var_name in meta['single']:
            node = meta['single'][var_name]
            return node.get('text') if isinstance(node, dict) else str(node)
        elif var_name in meta:
            node = meta[var_name]
            return node.get('text') if isinstance(node, dict) else str(node)
        return None

    def _is_stdlib_module(self, module: str) -> bool:
        """Check if a module is part of Python standard library"""
        base_module = module.split('.')[0]
        return base_module in PYTHON_STDLIB

    def _calculate_modularity_score(
        self,
        external_deps: int,
        internal_deps: int,
        has_side_effects: bool,
        complexity: int
    ) -> ModularityScore:
        """Calculate modularity score based on dependencies and complexity"""
        total_deps = external_deps + internal_deps

        if total_deps <= 1 and not has_side_effects and complexity < 10:
            return ModularityScore.HIGHLY_MODULAR
        elif total_deps <= 3 and complexity < 20:
            return ModularityScore.MODULAR
        elif total_deps <= 5:
            return ModularityScore.SEMI_MODULAR
        else:
            return ModularityScore.COUPLED

    def _calculate_extraction_potential(
        self,
        modularity: ModularityScore,
        has_docstring: bool,
        has_types: bool,
        is_utility: bool
    ) -> float:
        """Calculate extraction potential score (0.0 to 1.0)"""
        base_scores = {
            ModularityScore.HIGHLY_MODULAR: 0.9,
            ModularityScore.MODULAR: 0.7,
            ModularityScore.SEMI_MODULAR: 0.4,
            ModularityScore.COUPLED: 0.1
        }

        score = base_scores[modularity]

        # Bonuses
        if has_docstring:
            score += 0.05
        if has_types:
            score += 0.03
        if is_utility:
            score += 0.02

        return min(1.0, score)

    def _determine_extraction_complexity(
        self,
        modularity: ModularityScore,
        dependencies: int
    ) -> str:
        """Determine how complex extraction would be"""
        if modularity == ModularityScore.HIGHLY_MODULAR:
            return 'trivial'
        elif modularity == ModularityScore.MODULAR and dependencies <= 2:
            return 'easy'
        elif modularity in [ModularityScore.MODULAR, ModularityScore.SEMI_MODULAR]:
            return 'moderate'
        else:
            return 'complex'

    def _suggest_package_name(self, name: str, file_path: str) -> str:
        """Suggest a package name for extracted tool"""
        # Clean up the name
        clean_name = name.lower().replace('_', '-')

        # Get context from file path
        path_parts = Path(file_path).parts
        context_parts = [p for p in path_parts if p not in ['src', 'lib', 'app', 'utils']]

        if context_parts and len(context_parts) > 1:
            context = context_parts[-2].lower().replace('_', '-')
            return f"{context}-{clean_name}"

        return clean_name

    def analyze_python_file(self, file_path: Path) -> ModuleInfo:
        """Analyze a Python file for modular components"""
        imports = self._analyze_python_imports(file_path)
        functions = self._analyze_python_functions(file_path, imports)
        classes = self._analyze_python_classes(file_path, imports)

        # Categorize dependencies
        external_deps = set()
        internal_deps = set()
        stdlib_deps = set()

        for imp in imports:
            if imp.is_stdlib:
                stdlib_deps.add(imp.module)
            elif imp.is_relative:
                internal_deps.add(imp.module)
            else:
                external_deps.add(imp.module)

        # Determine if this is a utility module
        is_utility = self._is_utility_module(file_path, functions, classes)

        # Calculate module-level modularity
        modularity = self._calculate_modularity_score(
            len(external_deps),
            len(internal_deps),
            has_side_effects=False,  # Module-level assessment
            complexity=len(functions) + len(classes) * 2
        )

        extraction_potential = self._calculate_extraction_potential(
            modularity,
            has_docstring=self._file_has_module_docstring(file_path),
            has_types=any(f.has_return_type for f in functions),
            is_utility=is_utility
        )

        return ModuleInfo(
            file_path=str(file_path),
            functions=functions,
            classes=classes,
            imports=imports,
            external_dependencies=external_deps,
            internal_dependencies=internal_deps,
            stdlib_dependencies=stdlib_deps,
            exports=self._get_exports(file_path),
            modularity_score=modularity,
            is_utility_module=is_utility,
            extraction_potential=extraction_potential
        )

    def _analyze_python_imports(self, file_path: Path) -> List[ImportInfo]:
        """Analyze imports in a Python file"""
        imports = []

        # Pattern for standard imports
        import_patterns = [
            ('import $MODULE', False),
            ('from $MODULE import $$$', False),
            ('from .$MODULE import $$$', True),
            ('from ..$MODULE import $$$', True),
        ]

        for pattern, is_relative in import_patterns:
            matches = self._run_astgrep(file_path, pattern, 'python')
            for match in matches:
                module = self._extract_meta_var(match, 'MODULE')
                if module:
                    line_num = match.get('range', {}).get('start', {}).get('line', 0)
                    imports.append(ImportInfo(
                        module=module,
                        is_stdlib=self._is_stdlib_module(module),
                        is_relative=is_relative or module.startswith('.'),
                        line_number=line_num
                    ))

        return imports

    def _analyze_python_functions(
        self,
        file_path: Path,
        imports: List[ImportInfo]
    ) -> List[FunctionInfo]:
        """Analyze functions in a Python file"""
        functions = []

        # Find all function definitions
        patterns = [
            ('def $NAME($$$PARAMS):\n    $$$BODY', False),
            ('async def $NAME($$$PARAMS):\n    $$$BODY', True),
        ]

        for pattern, is_async in patterns:
            matches = self._run_astgrep(file_path, pattern, 'python')
            for match in matches:
                func_info = self._create_function_info(
                    match, file_path, imports, is_async
                )
                if func_info:
                    functions.append(func_info)

        return functions

    def _create_function_info(
        self,
        match: Dict[str, Any],
        file_path: Path,
        imports: List[ImportInfo],
        is_async: bool
    ) -> Optional[FunctionInfo]:
        """Create FunctionInfo from ast-grep match"""
        name = self._extract_meta_var(match, 'NAME')
        if not name or name.startswith('_'):
            return None  # Skip private functions for now

        line_num = match.get('range', {}).get('start', {}).get('line', 0)
        code_text = match.get('text', '')

        # Analyze function characteristics
        has_return_type = '->' in code_text.split('\n')[0]
        has_docstring = '"""' in code_text or "'''" in code_text
        is_generator = 'yield' in code_text

        # Count external calls (heuristic)
        external_calls = self._count_external_calls(code_text, imports)

        # Calculate complexity hints
        complexity = self._estimate_complexity(code_text)

        # Determine modularity
        modularity = self._calculate_modularity_score(
            len(external_calls),
            internal_deps=0,
            has_side_effects=self._has_side_effects(code_text),
            complexity=complexity
        )

        extraction_potential = self._calculate_extraction_potential(
            modularity,
            has_docstring,
            has_return_type,
            is_utility=self._is_utility_function(name, code_text)
        )

        return FunctionInfo(
            name=name,
            file_path=str(file_path),
            line_number=line_num,
            parameters=self._extract_parameters(code_text),
            has_return_type=has_return_type,
            has_docstring=has_docstring,
            is_async=is_async,
            is_generator=is_generator,
            is_class_method=False,  # Simplified for now
            parent_class=None,
            complexity_hints={'estimated_loc': complexity},
            imports_used=[],  # Would need deeper analysis
            external_calls=external_calls,
            modularity_score=modularity,
            extraction_potential=extraction_potential
        )

    def _analyze_python_classes(
        self,
        file_path: Path,
        imports: List[ImportInfo]
    ) -> List[ClassInfo]:
        """Analyze classes in a Python file"""
        classes = []

        # Find class definitions
        patterns = [
            'class $NAME:\n    $$$BODY',
            'class $NAME($BASES):\n    $$$BODY',
        ]

        for pattern in patterns:
            matches = self._run_astgrep(file_path, pattern, 'python')
            for match in matches:
                class_info = self._create_class_info(match, file_path, imports)
                if class_info:
                    classes.append(class_info)

        return classes

    def _create_class_info(
        self,
        match: Dict[str, Any],
        file_path: Path,
        imports: List[ImportInfo]
    ) -> Optional[ClassInfo]:
        """Create ClassInfo from ast-grep match"""
        name = self._extract_meta_var(match, 'NAME')
        if not name or name.startswith('_'):
            return None

        line_num = match.get('range', {}).get('start', {}).get('line', 0)
        code_text = match.get('text', '')

        # Extract base classes
        bases_str = self._extract_meta_var(match, 'BASES') or ''
        base_classes = [b.strip() for b in bases_str.split(',') if b.strip()]

        # Check for decorators
        is_dataclass = '@dataclass' in code_text
        is_abstract = 'ABC' in bases_str or '@abstractmethod' in code_text

        has_docstring = '"""' in code_text or "'''" in code_text

        # Estimate dependencies
        dependencies = self._estimate_class_dependencies(code_text, imports)

        modularity = self._calculate_modularity_score(
            len([d for d in dependencies if d not in PYTHON_STDLIB]),
            internal_deps=0,
            has_side_effects=self._class_has_side_effects(code_text),
            complexity=code_text.count('def ')
        )

        extraction_potential = self._calculate_extraction_potential(
            modularity,
            has_docstring,
            has_types=True,  # Classes are typed by nature
            is_utility=is_dataclass or 'Mixin' in name or 'Base' in name
        )

        return ClassInfo(
            name=name,
            file_path=str(file_path),
            line_number=line_num,
            methods=self._extract_method_names(code_text),
            base_classes=base_classes,
            has_docstring=has_docstring,
            is_dataclass=is_dataclass,
            is_abstract=is_abstract,
            dependencies=dependencies,
            modularity_score=modularity,
            extraction_potential=extraction_potential
        )

    def _count_external_calls(
        self,
        code: str,
        imports: List[ImportInfo]
    ) -> List[str]:
        """Count external function/method calls in code"""
        external_calls = []
        import_names = {i.module.split('.')[-1] for i in imports if not i.is_relative}

        # Simple heuristic: look for module.function patterns
        for imp_name in import_names:
            if f'{imp_name}.' in code:
                external_calls.append(imp_name)

        return external_calls

    def _estimate_complexity(self, code: str) -> int:
        """Estimate cyclomatic complexity (simplified)"""
        complexity = 1
        complexity += code.count(' if ')
        complexity += code.count(' elif ')
        complexity += code.count(' for ')
        complexity += code.count(' while ')
        complexity += code.count(' except ')
        complexity += code.count(' and ')
        complexity += code.count(' or ')
        return complexity

    def _has_side_effects(self, code: str) -> bool:
        """Check if code likely has side effects"""
        side_effect_indicators = [
            'print(', 'open(', 'write(', 'save(',
            'delete(', 'remove(', 'update(',
            'global ', 'nonlocal ',
            'subprocess.', 'os.system',
            'requests.', 'urllib.',
            '.commit()', '.execute('
        ]
        return any(indicator in code for indicator in side_effect_indicators)

    def _class_has_side_effects(self, code: str) -> bool:
        """Check if class has methods with side effects"""
        return self._has_side_effects(code)

    def _is_utility_function(self, name: str, code: str) -> bool:
        """Check if function appears to be a utility function"""
        utility_indicators = [
            name.startswith('get_'),
            name.startswith('is_'),
            name.startswith('has_'),
            name.startswith('parse_'),
            name.startswith('format_'),
            name.startswith('convert_'),
            name.startswith('validate_'),
            name.startswith('calculate_'),
            name.startswith('extract_'),
            name.startswith('transform_'),
            'return ' in code and not self._has_side_effects(code),
        ]
        return any(utility_indicators)

    def _is_utility_module(
        self,
        file_path: Path,
        functions: List[FunctionInfo],
        classes: List[ClassInfo]
    ) -> bool:
        """Check if module is a utility module"""
        path_str = str(file_path).lower()

        # Check path for utility patterns
        if any(pattern in path_str for pattern in UTILITY_PATTERNS):
            return True

        # Check if mostly utility functions
        if functions:
            utility_ratio = sum(
                1 for f in functions
                if f.modularity_score in [ModularityScore.HIGHLY_MODULAR, ModularityScore.MODULAR]
            ) / len(functions)
            if utility_ratio > 0.7:
                return True

        return False

    def _file_has_module_docstring(self, file_path: Path) -> bool:
        """Check if file has a module-level docstring"""
        try:
            with open(file_path, 'r') as f:
                first_lines = f.read(500)
            return first_lines.strip().startswith('"""') or first_lines.strip().startswith("'''")
        except Exception:
            return False

    def _get_exports(self, file_path: Path) -> List[str]:
        """Get exported names from __all__ if defined"""
        exports = []
        matches = self._run_astgrep(file_path, '__all__ = [$$$NAMES]', 'python')
        for match in matches:
            names_str = self._extract_meta_var(match, 'NAMES')
            if names_str:
                exports = [n.strip().strip('"').strip("'") for n in names_str.split(',')]
        return exports

    def _extract_parameters(self, code: str) -> List[str]:
        """Extract parameter names from function definition"""
        try:
            first_line = code.split('\n')[0]
            params_start = first_line.index('(') + 1
            params_end = first_line.rindex(')')
            params_str = first_line[params_start:params_end]
            params = [p.split(':')[0].split('=')[0].strip() for p in params_str.split(',')]
            return [p for p in params if p and p != 'self' and p != 'cls']
        except Exception:
            return []

    def _extract_method_names(self, code: str) -> List[str]:
        """Extract method names from class code"""
        methods = []
        for line in code.split('\n'):
            if 'def ' in line:
                try:
                    start = line.index('def ') + 4
                    end = line.index('(', start)
                    methods.append(line[start:end].strip())
                except ValueError:
                    pass
        return methods

    def _estimate_class_dependencies(
        self,
        code: str,
        imports: List[ImportInfo]
    ) -> List[str]:
        """Estimate class dependencies"""
        deps = []
        for imp in imports:
            module_name = imp.module.split('.')[-1]
            if module_name in code:
                deps.append(imp.module)
        return deps

    def analyze_typescript_file(self, file_path: Path) -> ModuleInfo:
        """Analyze a TypeScript/JavaScript file for modular components"""
        # Similar structure to Python analysis but with TS patterns
        imports = self._analyze_ts_imports(file_path)
        functions = self._analyze_ts_functions(file_path, imports)
        classes = self._analyze_ts_classes(file_path, imports)

        external_deps = set()
        internal_deps = set()

        for imp in imports:
            if imp.is_relative:
                internal_deps.add(imp.module)
            else:
                external_deps.add(imp.module)

        is_utility = self._is_utility_module(file_path, functions, classes)

        modularity = self._calculate_modularity_score(
            len(external_deps),
            len(internal_deps),
            has_side_effects=False,
            complexity=len(functions) + len(classes) * 2
        )

        extraction_potential = self._calculate_extraction_potential(
            modularity,
            has_docstring=False,
            has_types=file_path.suffix in ['.ts', '.tsx'],
            is_utility=is_utility
        )

        return ModuleInfo(
            file_path=str(file_path),
            functions=functions,
            classes=classes,
            imports=imports,
            external_dependencies=external_deps,
            internal_dependencies=internal_deps,
            stdlib_dependencies=set(),  # JS/TS doesn't have stdlib in same way
            exports=self._get_ts_exports(file_path),
            modularity_score=modularity,
            is_utility_module=is_utility,
            extraction_potential=extraction_potential
        )

    def _analyze_ts_imports(self, file_path: Path) -> List[ImportInfo]:
        """Analyze imports in a TypeScript file"""
        imports = []
        lang = 'typescript' if file_path.suffix in ['.ts', '.tsx'] else 'javascript'

        patterns = [
            ('import $$ from "$MODULE"', False),
            ("import $$ from '$MODULE'", False),
            ('import { $$ } from "$MODULE"', False),
            ("import { $$ } from '$MODULE'", False),
        ]

        for pattern, _ in patterns:
            matches = self._run_astgrep(file_path, pattern, lang)
            for match in matches:
                module = self._extract_meta_var(match, 'MODULE')
                if module:
                    line_num = match.get('range', {}).get('start', {}).get('line', 0)
                    imports.append(ImportInfo(
                        module=module,
                        is_stdlib=False,  # JS/TS doesn't have stdlib
                        is_relative=module.startswith('.'),
                        line_number=line_num
                    ))

        return imports

    def _analyze_ts_functions(
        self,
        file_path: Path,
        imports: List[ImportInfo]
    ) -> List[FunctionInfo]:
        """Analyze functions in a TypeScript file"""
        functions = []
        lang = 'typescript' if file_path.suffix in ['.ts', '.tsx'] else 'javascript'

        patterns = [
            ('function $NAME($$$): $TYPE { $$$BODY }', False),
            ('const $NAME = ($$$) => { $$$BODY }', False),
            ('export function $NAME($$$): $TYPE { $$$BODY }', False),
            ('async function $NAME($$$): $TYPE { $$$BODY }', True),
        ]

        for pattern, is_async in patterns:
            matches = self._run_astgrep(file_path, pattern, lang)
            for match in matches:
                func_info = self._create_ts_function_info(match, file_path, imports, is_async)
                if func_info:
                    functions.append(func_info)

        return functions

    def _create_ts_function_info(
        self,
        match: Dict[str, Any],
        file_path: Path,
        imports: List[ImportInfo],
        is_async: bool
    ) -> Optional[FunctionInfo]:
        """Create FunctionInfo from TypeScript ast-grep match"""
        name = self._extract_meta_var(match, 'NAME')
        if not name or name.startswith('_'):
            return None

        line_num = match.get('range', {}).get('start', {}).get('line', 0)
        code_text = match.get('text', '')

        has_return_type = ':' in code_text.split('{')[0]
        has_docstring = '/**' in code_text or '//' in code_text

        external_calls = self._count_external_calls(code_text, imports)
        complexity = self._estimate_complexity(code_text)

        modularity = self._calculate_modularity_score(
            len(external_calls),
            internal_deps=0,
            has_side_effects=self._has_ts_side_effects(code_text),
            complexity=complexity
        )

        extraction_potential = self._calculate_extraction_potential(
            modularity,
            has_docstring,
            has_return_type,
            is_utility=self._is_utility_function(name, code_text)
        )

        return FunctionInfo(
            name=name,
            file_path=str(file_path),
            line_number=line_num,
            parameters=[],
            has_return_type=has_return_type,
            has_docstring=has_docstring,
            is_async=is_async,
            is_generator=False,
            is_class_method=False,
            parent_class=None,
            complexity_hints={'estimated_loc': complexity},
            imports_used=[],
            external_calls=external_calls,
            modularity_score=modularity,
            extraction_potential=extraction_potential
        )

    def _has_ts_side_effects(self, code: str) -> bool:
        """Check if TypeScript code has side effects"""
        side_effect_indicators = [
            'console.log', 'console.error',
            'fetch(', 'axios.',
            'localStorage', 'sessionStorage',
            'document.', 'window.',
            '.write(', '.save(',
            'fs.', 'process.',
        ]
        return any(indicator in code for indicator in side_effect_indicators)

    def _analyze_ts_classes(
        self,
        file_path: Path,
        imports: List[ImportInfo]
    ) -> List[ClassInfo]:
        """Analyze classes in a TypeScript file"""
        classes = []
        lang = 'typescript' if file_path.suffix in ['.ts', '.tsx'] else 'javascript'

        patterns = [
            'class $NAME { $$$BODY }',
            'class $NAME extends $BASE { $$$BODY }',
            'export class $NAME { $$$BODY }',
        ]

        for pattern in patterns:
            matches = self._run_astgrep(file_path, pattern, lang)
            for match in matches:
                class_info = self._create_ts_class_info(match, file_path, imports)
                if class_info:
                    classes.append(class_info)

        return classes

    def _create_ts_class_info(
        self,
        match: Dict[str, Any],
        file_path: Path,
        imports: List[ImportInfo]
    ) -> Optional[ClassInfo]:
        """Create ClassInfo from TypeScript ast-grep match"""
        name = self._extract_meta_var(match, 'NAME')
        if not name or name.startswith('_'):
            return None

        line_num = match.get('range', {}).get('start', {}).get('line', 0)
        code_text = match.get('text', '')

        base = self._extract_meta_var(match, 'BASE')
        base_classes = [base] if base else []

        has_docstring = '/**' in code_text
        is_abstract = 'abstract ' in code_text

        dependencies = self._estimate_class_dependencies(code_text, imports)

        modularity = self._calculate_modularity_score(
            len(dependencies),
            internal_deps=0,
            has_side_effects=self._has_ts_side_effects(code_text),
            complexity=code_text.count('(')  # Method count heuristic
        )

        extraction_potential = self._calculate_extraction_potential(
            modularity,
            has_docstring,
            has_types=True,
            is_utility='Service' in name or 'Util' in name or 'Helper' in name
        )

        return ClassInfo(
            name=name,
            file_path=str(file_path),
            line_number=line_num,
            methods=[],
            base_classes=base_classes,
            has_docstring=has_docstring,
            is_dataclass=False,
            is_abstract=is_abstract,
            dependencies=dependencies,
            modularity_score=modularity,
            extraction_potential=extraction_potential
        )

    def _get_ts_exports(self, file_path: Path) -> List[str]:
        """Get exported names from TypeScript file"""
        exports = []
        lang = 'typescript' if file_path.suffix in ['.ts', '.tsx'] else 'javascript'

        patterns = [
            'export function $NAME',
            'export const $NAME',
            'export class $NAME',
            'export { $$$NAMES }',
        ]

        for pattern in patterns:
            matches = self._run_astgrep(file_path, pattern, lang)
            for match in matches:
                name = self._extract_meta_var(match, 'NAME')
                if name:
                    exports.append(name)

        return exports

    def analyze_file(self, file_path: Path) -> Optional[ModuleInfo]:
        """Analyze a single file"""
        if file_path.suffix == '.py':
            return self.analyze_python_file(file_path)
        elif file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            return self.analyze_typescript_file(file_path)
        return None

    def analyze_directory(
        self,
        directory: Optional[Path] = None,
        skip_dirs: Optional[Set[str]] = None
    ) -> None:
        """Analyze all files in a directory"""
        if directory is None:
            directory = self.root_dir

        if skip_dirs is None:
            skip_dirs = {
                '.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                '_site', '.venv', 'venv', 'env', '.cache', 'coverage', 'htmlcov',
                'vendor', 'third_party', 'site-packages'
            }

        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            for file_name in files:
                file_path = Path(root) / file_name
                if file_path.suffix in ['.py', '.ts', '.tsx', '.js', '.jsx']:
                    module_info = self.analyze_file(file_path)
                    if module_info:
                        self._process_module(module_info)

    def _process_module(self, module: ModuleInfo) -> None:
        """Process analyzed module and extract tool candidates"""
        self.report.total_files_analyzed += 1
        self.report.total_functions += len(module.functions)
        self.report.total_classes += len(module.classes)
        self.report.modules.append(module)

        # Update modularity counts
        self._update_modularity_counts(module.modularity_score)

        # Check for highly modular functions as tool candidates
        for func in module.functions:
            if func.extraction_potential >= 0.7:
                candidate = self._create_function_candidate(func, module)
                self.report.tool_candidates.append(candidate)

        # Check for modular classes
        for cls in module.classes:
            if cls.extraction_potential >= 0.7:
                candidate = self._create_class_candidate(cls, module)
                self.report.tool_candidates.append(candidate)

        # Check if entire module is a tool candidate
        if module.extraction_potential >= 0.8 and module.is_utility_module:
            candidate = self._create_module_candidate(module)
            self.report.tool_candidates.append(candidate)

    def _update_modularity_counts(self, score: ModularityScore) -> None:
        """Update modularity count statistics"""
        if score == ModularityScore.HIGHLY_MODULAR:
            self.report.highly_modular_count += 1
        elif score == ModularityScore.MODULAR:
            self.report.modular_count += 1
        elif score == ModularityScore.SEMI_MODULAR:
            self.report.semi_modular_count += 1
        else:
            self.report.coupled_count += 1

    def _create_function_candidate(
        self,
        func: FunctionInfo,
        module: ModuleInfo
    ) -> ToolCandidate:
        """Create a tool candidate from a function"""
        return ToolCandidate(
            name=func.name,
            type='function',
            file_path=func.file_path,
            line_number=func.line_number,
            description=f"Standalone function with {len(func.parameters)} parameters",
            dependencies=func.external_calls,
            modularity_score=func.modularity_score,
            extraction_potential=func.extraction_potential,
            extraction_complexity=self._determine_extraction_complexity(
                func.modularity_score,
                len(func.external_calls)
            ),
            suggested_package_name=self._suggest_package_name(func.name, func.file_path),
            rationale=self._generate_rationale(func.modularity_score, 'function')
        )

    def _create_class_candidate(
        self,
        cls: ClassInfo,
        module: ModuleInfo
    ) -> ToolCandidate:
        """Create a tool candidate from a class"""
        return ToolCandidate(
            name=cls.name,
            type='class',
            file_path=cls.file_path,
            line_number=cls.line_number,
            description=f"{'Dataclass' if cls.is_dataclass else 'Class'} with {len(cls.methods)} methods",
            dependencies=cls.dependencies,
            modularity_score=cls.modularity_score,
            extraction_potential=cls.extraction_potential,
            extraction_complexity=self._determine_extraction_complexity(
                cls.modularity_score,
                len(cls.dependencies)
            ),
            suggested_package_name=self._suggest_package_name(cls.name, cls.file_path),
            rationale=self._generate_rationale(cls.modularity_score, 'class')
        )

    def _create_module_candidate(self, module: ModuleInfo) -> ToolCandidate:
        """Create a tool candidate from an entire module"""
        return ToolCandidate(
            name=Path(module.file_path).stem,
            type='module',
            file_path=module.file_path,
            line_number=1,
            description=f"Utility module with {len(module.functions)} functions and {len(module.classes)} classes",
            dependencies=list(module.external_dependencies),
            modularity_score=module.modularity_score,
            extraction_potential=module.extraction_potential,
            extraction_complexity=self._determine_extraction_complexity(
                module.modularity_score,
                len(module.external_dependencies)
            ),
            suggested_package_name=self._suggest_package_name(
                Path(module.file_path).stem,
                module.file_path
            ),
            rationale=self._generate_rationale(module.modularity_score, 'module')
        )

    def _generate_rationale(self, score: ModularityScore, item_type: str) -> str:
        """Generate rationale for why something is a good extraction candidate"""
        rationales = {
            ModularityScore.HIGHLY_MODULAR: (
                f"This {item_type} is highly modular with minimal dependencies. "
                "It can be extracted with little to no modification."
            ),
            ModularityScore.MODULAR: (
                f"This {item_type} has good modularity with few external dependencies. "
                "Extraction would require minimal dependency management."
            ),
            ModularityScore.SEMI_MODULAR: (
                f"This {item_type} has moderate coupling. Extraction is possible "
                "but would require some refactoring to reduce dependencies."
            ),
            ModularityScore.COUPLED: (
                f"This {item_type} has significant coupling. Consider refactoring "
                "before extraction to improve modularity."
            ),
        }
        return rationales[score]

    def generate_report_text(self) -> str:
        """Generate human-readable report"""
        lines = []
        lines.extend(self._generate_header())
        lines.extend(self._generate_summary())
        lines.extend(self._generate_top_candidates())
        lines.extend(self._generate_modularity_breakdown())
        lines.extend(self._generate_footer())
        return '\n'.join(lines)

    def _generate_header(self) -> List[str]:
        """Generate report header"""
        return [
            "=" * 80,
            "TOOL IDENTIFICATION REPORT",
            "Standalone & Modular Functionality Analysis",
            "=" * 80,
            "",
            f"Root Directory: {self.root_dir}",
            ""
        ]

    def _generate_summary(self) -> List[str]:
        """Generate summary section"""
        return [
            "=" * 80,
            "SUMMARY",
            "=" * 80,
            "",
            f"Files Analyzed: {self.report.total_files_analyzed}",
            f"Total Functions: {self.report.total_functions}",
            f"Total Classes: {self.report.total_classes}",
            f"Tool Candidates Found: {len(self.report.tool_candidates)}",
            "",
            "Modularity Distribution:",
            f"  Highly Modular: {self.report.highly_modular_count}",
            f"  Modular: {self.report.modular_count}",
            f"  Semi-Modular: {self.report.semi_modular_count}",
            f"  Coupled: {self.report.coupled_count}",
            ""
        ]

    def _generate_top_candidates(self) -> List[str]:
        """Generate top tool candidates section"""
        lines = [
            "=" * 80,
            "TOP TOOL CANDIDATES (sorted by extraction potential)",
            "=" * 80,
            ""
        ]

        # Sort by extraction potential
        sorted_candidates = sorted(
            self.report.tool_candidates,
            key=lambda c: c.extraction_potential,
            reverse=True
        )[:20]  # Top 20

        for i, candidate in enumerate(sorted_candidates, 1):
            lines.extend(self._format_candidate(i, candidate))

        if not sorted_candidates:
            lines.append("No high-potential tool candidates found.")
            lines.append("")

        return lines

    def _format_candidate(self, index: int, candidate: ToolCandidate) -> List[str]:
        """Format a single candidate for display"""
        score_emoji = {
            ModularityScore.HIGHLY_MODULAR: "🟢",
            ModularityScore.MODULAR: "🟡",
            ModularityScore.SEMI_MODULAR: "🟠",
            ModularityScore.COUPLED: "🔴",
        }

        lines = [
            f"{index}. {score_emoji[candidate.modularity_score]} {candidate.name} ({candidate.type})",
            f"   File: {candidate.file_path}:{candidate.line_number}",
            f"   Extraction Potential: {candidate.extraction_potential:.0%}",
            f"   Complexity: {candidate.extraction_complexity}",
            f"   Dependencies: {len(candidate.dependencies)}",
            f"   Suggested Package: {candidate.suggested_package_name}",
            f"   {candidate.rationale}",
            ""
        ]
        return lines

    def _generate_modularity_breakdown(self) -> List[str]:
        """Generate modularity breakdown by file type"""
        lines = [
            "=" * 80,
            "UTILITY MODULES",
            "=" * 80,
            ""
        ]

        utility_modules = [m for m in self.report.modules if m.is_utility_module]

        if utility_modules:
            for module in sorted(utility_modules, key=lambda m: m.extraction_potential, reverse=True)[:10]:
                lines.append(f"  📦 {module.file_path}")
                lines.append(f"     Functions: {len(module.functions)}, Classes: {len(module.classes)}")
                lines.append(f"     External Deps: {len(module.external_dependencies)}")
                lines.append(f"     Extraction Potential: {module.extraction_potential:.0%}")
                lines.append("")
        else:
            lines.append("No utility modules identified.")
            lines.append("")

        return lines

    def _generate_footer(self) -> List[str]:
        """Generate report footer"""
        return [
            "=" * 80,
            "LEGEND",
            "=" * 80,
            "",
            "Modularity Scores:",
            "  🟢 Highly Modular - 0-1 external deps, no side effects",
            "  🟡 Modular - 2-3 external deps, minimal coupling",
            "  🟠 Semi-Modular - 4-5 external deps, some coupling",
            "  🔴 Coupled - 6+ external deps, significant coupling",
            "",
            "Extraction Complexity:",
            "  trivial - Copy-paste ready, no modifications needed",
            "  easy - Minor import adjustments required",
            "  moderate - Some refactoring needed",
            "  complex - Significant decoupling required",
            "",
            "=" * 80,
            "END OF REPORT",
            "=" * 80
        ]

    def save_report_json(self, output_path: Path) -> None:
        """Save report as JSON, with optional preprocessing."""
        data = self._build_report_json()

        # Apply preprocessing if enabled
        if self.preprocessor:
            logger.info("Applying preprocessing pipeline...")
            result = self.preprocessor.process(data)
            if result.success:
                data = result.data
                logger.info(result.summary)
            else:
                logger.warning(
                    f"Preprocessing failed: {result.errors}. Using raw data."
                )

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        logger.info(f"Tool identification report saved to {output_path}")

    def save_report_html(self, output_path: Path) -> None:
        """Save report as interactive HTML"""
        html_content = self._generate_html_report()
        with open(output_path, 'w') as f:
            f.write(html_content)
        logger.info(f"HTML report saved to {output_path}")

    def _generate_html_report(self) -> str:
        """Generate interactive HTML report"""
        from datetime import datetime

        # Sort candidates by extraction potential
        sorted_candidates = sorted(
            self.report.tool_candidates,
            key=lambda c: c.extraction_potential,
            reverse=True
        )

        # Get utility modules
        utility_modules = sorted(
            [m for m in self.report.modules if m.is_utility_module],
            key=lambda m: m.extraction_potential,
            reverse=True
        )

        # Calculate percentages for chart
        total_modularity = (
            self.report.highly_modular_count +
            self.report.modular_count +
            self.report.semi_modular_count +
            self.report.coupled_count
        )

        def pct(val: int) -> float:
            return (val / total_modularity * 100) if total_modularity > 0 else 0

        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tool Identification Report</title>
    <style>
        :root {{
            --color-highly-modular: #22c55e;
            --color-modular: #eab308;
            --color-semi-modular: #f97316;
            --color-coupled: #ef4444;
            --color-bg: #0f172a;
            --color-card: #1e293b;
            --color-border: #334155;
            --color-text: #f1f5f9;
            --color-text-muted: #94a3b8;
            --color-accent: #3b82f6;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--color-bg);
            color: var(--color-text);
            line-height: 1.6;
            padding: 2rem;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        header {{
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--color-border);
        }}

        h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--color-accent), #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}

        .subtitle {{
            color: var(--color-text-muted);
            font-size: 1.1rem;
        }}

        .meta {{
            margin-top: 1rem;
            font-size: 0.9rem;
            color: var(--color-text-muted);
        }}

        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }}

        .stat-card {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid var(--color-border);
        }}

        .stat-value {{
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--color-accent);
        }}

        .stat-label {{
            color: var(--color-text-muted);
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }}

        .section {{
            margin-bottom: 3rem;
        }}

        .section-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }}

        h2 {{
            font-size: 1.5rem;
            color: var(--color-text);
        }}

        .modularity-chart {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 2rem;
            border: 1px solid var(--color-border);
        }}

        .chart-bars {{
            display: flex;
            height: 40px;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 1.5rem;
        }}

        .chart-bar {{
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.85rem;
            transition: all 0.3s ease;
        }}

        .chart-bar:hover {{
            filter: brightness(1.1);
        }}

        .chart-bar.highly-modular {{ background: var(--color-highly-modular); }}
        .chart-bar.modular {{ background: var(--color-modular); }}
        .chart-bar.semi-modular {{ background: var(--color-semi-modular); }}
        .chart-bar.coupled {{ background: var(--color-coupled); }}

        .chart-legend {{
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
        }}

        .legend-item {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}

        .legend-dot {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }}

        .legend-dot.highly-modular {{ background: var(--color-highly-modular); }}
        .legend-dot.modular {{ background: var(--color-modular); }}
        .legend-dot.semi-modular {{ background: var(--color-semi-modular); }}
        .legend-dot.coupled {{ background: var(--color-coupled); }}

        .candidates-table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--color-card);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--color-border);
        }}

        .candidates-table th,
        .candidates-table td {{
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--color-border);
        }}

        .candidates-table th {{
            background: rgba(59, 130, 246, 0.1);
            color: var(--color-text);
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .candidates-table tr:hover {{
            background: rgba(59, 130, 246, 0.05);
        }}

        .candidates-table tr:last-child td {{
            border-bottom: none;
        }}

        .score-badge {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
        }}

        .score-badge.highly-modular {{
            background: rgba(34, 197, 94, 0.2);
            color: var(--color-highly-modular);
        }}

        .score-badge.modular {{
            background: rgba(234, 179, 8, 0.2);
            color: var(--color-modular);
        }}

        .score-badge.semi-modular {{
            background: rgba(249, 115, 22, 0.2);
            color: var(--color-semi-modular);
        }}

        .score-badge.coupled {{
            background: rgba(239, 68, 68, 0.2);
            color: var(--color-coupled);
        }}

        .type-badge {{
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
        }}

        .type-badge.function {{
            background: rgba(139, 92, 246, 0.2);
            color: #a78bfa;
        }}

        .type-badge.class {{
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
        }}

        .type-badge.module {{
            background: rgba(20, 184, 166, 0.2);
            color: #2dd4bf;
        }}

        .progress-bar {{
            width: 100%;
            height: 8px;
            background: var(--color-border);
            border-radius: 4px;
            overflow: hidden;
        }}

        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, var(--color-accent), #8b5cf6);
            border-radius: 4px;
            transition: width 0.3s ease;
        }}

        .complexity-badge {{
            font-size: 0.8rem;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
        }}

        .complexity-badge.trivial {{
            background: rgba(34, 197, 94, 0.2);
            color: var(--color-highly-modular);
        }}

        .complexity-badge.easy {{
            background: rgba(59, 130, 246, 0.2);
            color: var(--color-accent);
        }}

        .complexity-badge.moderate {{
            background: rgba(234, 179, 8, 0.2);
            color: var(--color-modular);
        }}

        .complexity-badge.complex {{
            background: rgba(239, 68, 68, 0.2);
            color: var(--color-coupled);
        }}

        .file-path {{
            font-family: 'SF Mono', 'Consolas', monospace;
            font-size: 0.85rem;
            color: var(--color-text-muted);
        }}

        .package-name {{
            font-family: 'SF Mono', 'Consolas', monospace;
            font-size: 0.85rem;
            color: var(--color-accent);
        }}

        .utility-modules {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 1rem;
        }}

        .module-card {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid var(--color-border);
        }}

        .module-card h3 {{
            font-size: 1rem;
            margin-bottom: 1rem;
            word-break: break-all;
        }}

        .module-stats {{
            display: flex;
            gap: 1.5rem;
            margin-bottom: 1rem;
        }}

        .module-stat {{
            text-align: center;
        }}

        .module-stat-value {{
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-accent);
        }}

        .module-stat-label {{
            font-size: 0.75rem;
            color: var(--color-text-muted);
        }}

        .filter-controls {{
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }}

        .filter-btn {{
            padding: 0.5rem 1rem;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            background: transparent;
            color: var(--color-text);
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
        }}

        .filter-btn:hover,
        .filter-btn.active {{
            background: var(--color-accent);
            border-color: var(--color-accent);
        }}

        .search-input {{
            padding: 0.5rem 1rem;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            background: var(--color-card);
            color: var(--color-text);
            font-size: 0.9rem;
            min-width: 250px;
        }}

        .search-input:focus {{
            outline: none;
            border-color: var(--color-accent);
        }}

        footer {{
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid var(--color-border);
            text-align: center;
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }}

        @media (max-width: 768px) {{
            body {{
                padding: 1rem;
            }}

            h1 {{
                font-size: 1.75rem;
            }}

            .stats-grid {{
                grid-template-columns: repeat(2, 1fr);
            }}

            .utility-modules {{
                grid-template-columns: 1fr;
            }}

            .candidates-table {{
                display: block;
                overflow-x: auto;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔧 Tool Identification Report</h1>
            <p class="subtitle">Standalone & Modular Functionality Analysis</p>
            <p class="meta">
                Root: <code>{self.root_dir}</code> |
                Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </p>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{self.report.total_files_analyzed}</div>
                <div class="stat-label">Files Analyzed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{self.report.total_functions}</div>
                <div class="stat-label">Functions Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{self.report.total_classes}</div>
                <div class="stat-label">Classes Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{len(self.report.tool_candidates)}</div>
                <div class="stat-label">Tool Candidates</div>
            </div>
        </div>

        <section class="section">
            <h2>Modularity Distribution</h2>
            <div class="modularity-chart">
                <div class="chart-bars">
                    {f'<div class="chart-bar highly-modular" style="width: {pct(self.report.highly_modular_count):.1f}%">{self.report.highly_modular_count}</div>' if self.report.highly_modular_count > 0 else ''}
                    {f'<div class="chart-bar modular" style="width: {pct(self.report.modular_count):.1f}%">{self.report.modular_count}</div>' if self.report.modular_count > 0 else ''}
                    {f'<div class="chart-bar semi-modular" style="width: {pct(self.report.semi_modular_count):.1f}%">{self.report.semi_modular_count}</div>' if self.report.semi_modular_count > 0 else ''}
                    {f'<div class="chart-bar coupled" style="width: {pct(self.report.coupled_count):.1f}%">{self.report.coupled_count}</div>' if self.report.coupled_count > 0 else ''}
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <span class="legend-dot highly-modular"></span>
                        <span>Highly Modular ({self.report.highly_modular_count})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot modular"></span>
                        <span>Modular ({self.report.modular_count})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot semi-modular"></span>
                        <span>Semi-Modular ({self.report.semi_modular_count})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot coupled"></span>
                        <span>Coupled ({self.report.coupled_count})</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="section-header">
                <h2>Tool Candidates ({len(sorted_candidates)})</h2>
                <div class="filter-controls">
                    <input type="text" class="search-input" placeholder="Search by name..." id="searchInput" onkeyup="filterTable()">
                    <button class="filter-btn active" onclick="filterByType('all', this)">All</button>
                    <button class="filter-btn" onclick="filterByType('function', this)">Functions</button>
                    <button class="filter-btn" onclick="filterByType('class', this)">Classes</button>
                    <button class="filter-btn" onclick="filterByType('module', this)">Modules</button>
                </div>
            </div>
            <table class="candidates-table" id="candidatesTable">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Modularity</th>
                        <th>Extraction Potential</th>
                        <th>Complexity</th>
                        <th>Dependencies</th>
                        <th>Suggested Package</th>
                    </tr>
                </thead>
                <tbody>
                    {self._generate_candidate_rows(sorted_candidates)}
                </tbody>
            </table>
        </section>

        <section class="section">
            <h2>Utility Modules ({len(utility_modules)})</h2>
            <div class="utility-modules">
                {self._generate_module_cards(utility_modules[:12])}
            </div>
        </section>

        <footer>
            <p>Generated by Tool Identifier | Code Inventory System</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem;">
                🟢 Highly Modular (0-1 deps) |
                🟡 Modular (2-3 deps) |
                🟠 Semi-Modular (4-5 deps) |
                🔴 Coupled (6+ deps)
            </p>
        </footer>
    </div>

    <script>
        function filterTable() {{
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const table = document.getElementById('candidatesTable');
            const rows = table.getElementsByTagName('tr');

            for (let i = 1; i < rows.length; i++) {{
                const nameCell = rows[i].getElementsByTagName('td')[1];
                if (nameCell) {{
                    const name = nameCell.textContent || nameCell.innerText;
                    rows[i].style.display = name.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
                }}
            }}
        }}

        function filterByType(type, btn) {{
            const table = document.getElementById('candidatesTable');
            const rows = table.getElementsByTagName('tr');

            // Update button states
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            for (let i = 1; i < rows.length; i++) {{
                const typeCell = rows[i].getElementsByTagName('td')[2];
                if (typeCell) {{
                    const rowType = typeCell.textContent.toLowerCase().trim();
                    if (type === 'all' || rowType === type) {{
                        rows[i].style.display = '';
                    }} else {{
                        rows[i].style.display = 'none';
                    }}
                }}
            }}
        }}
    </script>
</body>
</html>'''
        return html

    def _generate_candidate_rows(self, candidates: List[ToolCandidate]) -> str:
        """Generate HTML table rows for candidates"""
        rows = []
        for i, c in enumerate(candidates, 1):
            score_class = c.modularity_score.value.replace('_', '-')
            rows.append(f'''
                <tr data-type="{c.type}">
                    <td>{i}</td>
                    <td><strong>{c.name}</strong><br><span class="file-path">{c.file_path}:{c.line_number}</span></td>
                    <td><span class="type-badge {c.type}">{c.type}</span></td>
                    <td><span class="score-badge {score_class}">{c.modularity_score.value.replace('_', ' ').title()}</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div class="progress-bar" style="width: 80px;">
                                <div class="progress-fill" style="width: {c.extraction_potential * 100:.0f}%"></div>
                            </div>
                            <span>{c.extraction_potential:.0%}</span>
                        </div>
                    </td>
                    <td><span class="complexity-badge {c.extraction_complexity}">{c.extraction_complexity}</span></td>
                    <td>{len(c.dependencies)}</td>
                    <td><span class="package-name">{c.suggested_package_name}</span></td>
                </tr>
            ''')
        return '\n'.join(rows)

    def _generate_module_cards(self, modules: List[ModuleInfo]) -> str:
        """Generate HTML cards for utility modules"""
        cards = []
        for m in modules:
            score_class = m.modularity_score.value.replace('_', '-')
            cards.append(f'''
                <div class="module-card">
                    <h3>📦 {Path(m.file_path).name}</h3>
                    <p class="file-path" style="margin-bottom: 1rem; word-break: break-all;">{m.file_path}</p>
                    <div class="module-stats">
                        <div class="module-stat">
                            <div class="module-stat-value">{len(m.functions)}</div>
                            <div class="module-stat-label">Functions</div>
                        </div>
                        <div class="module-stat">
                            <div class="module-stat-value">{len(m.classes)}</div>
                            <div class="module-stat-label">Classes</div>
                        </div>
                        <div class="module-stat">
                            <div class="module-stat-value">{len(m.external_dependencies)}</div>
                            <div class="module-stat-label">Ext. Deps</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="score-badge {score_class}">{m.modularity_score.value.replace('_', ' ').title()}</span>
                        <div style="flex: 1;">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: {m.extraction_potential * 100:.0f}%"></div>
                            </div>
                        </div>
                        <span>{m.extraction_potential:.0%}</span>
                    </div>
                </div>
            ''')
        return '\n'.join(cards)

    def _build_report_json(self) -> Dict[str, Any]:
        """Build JSON report structure"""
        return {
            'summary': {
                'root_directory': str(self.root_dir),
                'files_analyzed': self.report.total_files_analyzed,
                'total_functions': self.report.total_functions,
                'total_classes': self.report.total_classes,
                'tool_candidates_count': len(self.report.tool_candidates),
                'modularity_distribution': {
                    'highly_modular': self.report.highly_modular_count,
                    'modular': self.report.modular_count,
                    'semi_modular': self.report.semi_modular_count,
                    'coupled': self.report.coupled_count
                }
            },
            'tool_candidates': [
                self._candidate_to_dict(c) for c in sorted(
                    self.report.tool_candidates,
                    key=lambda x: x.extraction_potential,
                    reverse=True
                )
            ],
            'utility_modules': [
                self._module_to_dict(m) for m in self.report.modules
                if m.is_utility_module
            ]
        }

    def _candidate_to_dict(self, candidate: ToolCandidate) -> Dict[str, Any]:
        """Convert ToolCandidate to dictionary"""
        return {
            'name': candidate.name,
            'type': candidate.type,
            'file_path': candidate.file_path,
            'line_number': candidate.line_number,
            'description': candidate.description,
            'dependencies': candidate.dependencies,
            'modularity_score': candidate.modularity_score.value,
            'extraction_potential': candidate.extraction_potential,
            'extraction_complexity': candidate.extraction_complexity,
            'suggested_package_name': candidate.suggested_package_name,
            'rationale': candidate.rationale
        }

    def _module_to_dict(self, module: ModuleInfo) -> Dict[str, Any]:
        """Convert ModuleInfo to dictionary"""
        return {
            'file_path': module.file_path,
            'function_count': len(module.functions),
            'class_count': len(module.classes),
            'external_dependencies': list(module.external_dependencies),
            'internal_dependencies': list(module.internal_dependencies),
            'modularity_score': module.modularity_score.value,
            'extraction_potential': module.extraction_potential
        }


def main() -> None:
    """Main entry point"""
    args = _parse_args()
    _run_analysis(args)


def _parse_args() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Identify standalone, modular functionality in codebases'
    )
    parser.add_argument(
        'path',
        help='File or directory to analyze'
    )
    parser.add_argument(
        '--json',
        help='Output JSON report to file'
    )
    parser.add_argument(
        '--text',
        help='Output text report to file'
    )
    parser.add_argument(
        '--html',
        help='Output interactive HTML report to file'
    )
    parser.add_argument(
        '--min-potential',
        type=float,
        default=0.7,
        help='Minimum extraction potential to report (0.0-1.0, default: 0.7)'
    )
    parser.add_argument(
        '--preprocess',
        action='store_true',
        help='Enable data preprocessing pipeline (cleaning, deduplication, optimization)'
    )
    parser.add_argument(
        '--preprocess-config',
        type=str,
        metavar='FILE',
        help='Path to preprocessing configuration JSON file'
    )
    return parser.parse_args()


def _run_analysis(args: argparse.Namespace) -> None:
    """Run the tool identification analysis"""
    path = Path(args.path)

    # Set up preprocessing configuration if requested
    preprocessing_config = None
    if args.preprocess or args.preprocess_config:
        if not PREPROCESSING_AVAILABLE:
            logger.error(
                "Preprocessing requested but preprocessing module not available. "
                "Please check your installation."
            )
            return

        if args.preprocess_config:
            config_path = Path(args.preprocess_config)
            if not config_path.exists():
                logger.error(f"Preprocessing config file not found: {config_path}")
                return
            preprocessing_config = PreprocessingConfig.from_file(config_path)
            logger.info(f"Loaded preprocessing config from {config_path}")
        else:
            # Use default preprocessing config
            preprocessing_config = PreprocessingConfig()
            logger.info("Using default preprocessing configuration")

    identifier = ToolIdentifier(path, preprocessing_config=preprocessing_config)

    _print_header(path)

    if path.is_file():
        module = identifier.analyze_file(path)
        if module:
            identifier._process_module(module)
    elif path.is_dir():
        identifier.analyze_directory()
    else:
        logger.error(f"Error: {path} is not a valid file or directory")
        return

    # Generate and display report
    text_report = identifier.generate_report_text()
    logger.info(text_report)

    # Save reports if requested
    if args.json:
        identifier.save_report_json(Path(args.json))

    if args.text:
        with open(args.text, 'w') as f:
            f.write(text_report)
        logger.info(f"Text report saved to {args.text}")

    if args.html:
        identifier.save_report_html(Path(args.html))
        logger.info(f"HTML report saved to {args.html}")


def _print_header(path: Path) -> None:
    """Print analysis header"""
    logger.info(f"\n{'='*80}")
    logger.info("Tool Identifier - Finding Modular Functionality")
    logger.info(f"{'='*80}\n")
    logger.info(f"Analyzing: {path}\n")


if __name__ == '__main__':
    main()
