#!/usr/bin/env python3
"""
Enhanced Schema Generator - Creates comprehensive schemas using AST parsing and ast-grep
Includes schema.org markup, code quality analysis, and advanced features
"""

import os
import ast
import json
import re
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import subprocess
import sys

@dataclass
class FunctionDef:
    name: str
    args: List[str]
    return_type: Optional[str] = None
    docstring: Optional[str] = None
    line_number: int = 0
    is_async: bool = False
    is_exported: bool = False

@dataclass
class ClassDef:
    name: str
    bases: List[str]
    methods: List[FunctionDef] = field(default_factory=list)
    attributes: List[str] = field(default_factory=list)
    docstring: Optional[str] = None
    line_number: int = 0
    is_exported: bool = False

@dataclass
class FileDef:
    path: str
    language: str
    classes: List[ClassDef] = field(default_factory=list)
    functions: List[FunctionDef] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    schema_org_type: str = "SoftwareSourceCode"

@dataclass
class DirectorySchema:
    path: str
    files: List[FileDef] = field(default_factory=list)
    subdirectories: List[str] = field(default_factory=list)
    has_git: bool = False
    git_remote: Optional[str] = None
    schema_org_markup: Optional[Dict[str, Any]] = None

class AstGrepHelper:
    """Helper class for ast-grep operations"""

    @staticmethod
    def check_available() -> bool:
        """Check if ast-grep CLI is available"""
        try:
            result = subprocess.run(
                ['ast-grep', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    @staticmethod
    def find_pattern(file_path: Path, pattern: str, language: str) -> List[Dict[str, Any]]:
        """Find code patterns using ast-grep"""
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
            print(f"  ast-grep warning for {file_path}: {e}")
            return []

    @staticmethod
    def get_meta_var(match: Dict[str, Any], var_name: str) -> Optional[str]:
        """Extract meta variable from match, handling both old and new ast-grep formats"""
        meta = match.get('metaVariables', {})
        # New format: metaVariables.single.VAR_NAME.text
        if 'single' in meta and var_name in meta['single']:
            var_node = meta['single'][var_name]
            return var_node.get('text') if isinstance(var_node, dict) else str(var_node)
        # Old format: metaVariables.VAR_NAME (direct)
        elif var_name in meta:
            var_node = meta[var_name]
            return var_node.get('text') if isinstance(var_node, dict) else str(var_node)
        return None

    @staticmethod
    def find_with_rule(file_path: Path, rule: Dict[str, Any], language: str) -> List[Dict[str, Any]]:
        """Find code using ast-grep YAML rule"""
        try:
            # Create temporary rule file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
                import yaml
                yaml.dump({'rule': rule}, f)
                rule_file = f.name

            try:
                result = subprocess.run(
                    ['ast-grep', 'scan', '-r', rule_file, '--json', str(file_path)],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                if result.returncode == 0 and result.stdout.strip():
                    return json.loads(result.stdout)
                return []
            finally:
                os.unlink(rule_file)
        except Exception as e:
            print(f"  ast-grep rule warning for {file_path}: {e}")
            return []

class SchemaOrgGenerator:
    """Generate schema.org JSON-LD markup"""

    @staticmethod
    def generate_software_source_code(dir_schema: DirectorySchema, dir_name: str) -> Dict[str, Any]:
        """Generate SoftwareSourceCode schema"""

        # Count statistics
        total_classes = sum(len(f.classes) for f in dir_schema.files)
        total_functions = sum(len(f.functions) for f in dir_schema.files)
        languages = list(set(f.language for f in dir_schema.files))

        schema = {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": dir_name,
            "description": f"Directory containing {len(dir_schema.files)} code files with {total_classes} classes and {total_functions} functions",
            "programmingLanguage": [
                {"@type": "ComputerLanguage", "name": lang.capitalize()}
                for lang in languages
            ],
            "codeRepository": dir_schema.git_remote if dir_schema.git_remote else None,
        }

        # Add feature list
        features = []
        if total_classes > 0:
            features.append(f"{total_classes} class definitions")
        if total_functions > 0:
            features.append(f"{total_functions} function definitions")

        if features:
            schema["featureList"] = features

        # Clean None values
        return {k: v for k, v in schema.items() if v is not None}

    @staticmethod
    def generate_jsonld_script(schema: Dict[str, Any]) -> str:
        """Generate JSON-LD script tag for HTML/Markdown"""
        json_str = json.dumps(schema, indent=2)
        return f'<script type="application/ld+json">\n{json_str}\n</script>'

class EnhancedSchemaGenerator:
    def __init__(self, root_path: str, use_astgrep: bool = True):
        self.root_path = Path(root_path)
        self.schemas: Dict[str, DirectorySchema] = {}
        self.skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                         '_site', '.venv', 'venv', 'env', '.cache', 'coverage'}
        self.use_astgrep = use_astgrep and AstGrepHelper.check_available()

        if not self.use_astgrep:
            print("⚠️  ast-grep not available - falling back to regex for TypeScript/JavaScript")
            print("   Install with: brew install ast-grep")
        else:
            print("✅ ast-grep available - using AST-based parsing")

    def extract_python_schema(self, file_path: Path) -> FileDef:
        """Extract schema from Python files using AST"""
        file_def = FileDef(path=str(file_path), language='python')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            tree = ast.parse(content)

            for node in ast.walk(tree):
                # Extract imports
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            file_def.imports.append(alias.name)
                    elif isinstance(node, ast.ImportFrom) and node.module:
                        file_def.imports.append(node.module)

                # Extract classes
                elif isinstance(node, ast.ClassDef):
                    bases = [self._get_name(base) for base in node.bases]
                    class_def = ClassDef(
                        name=node.name,
                        bases=bases,
                        docstring=ast.get_docstring(node),
                        line_number=node.lineno
                    )

                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            method = self._extract_function(item)
                            class_def.methods.append(method)
                        elif isinstance(item, ast.Assign):
                            for target in item.targets:
                                if isinstance(target, ast.Name):
                                    class_def.attributes.append(target.id)

                    file_def.classes.append(class_def)

            # Extract top-level functions
            for node in tree.body:
                if isinstance(node, ast.FunctionDef):
                    file_def.functions.append(self._extract_function(node))

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return file_def

    def _extract_function(self, node: ast.FunctionDef) -> FunctionDef:
        """Extract function definition from AST node"""
        args = [arg.arg for arg in node.args.args]
        return_type = None
        if node.returns:
            return_type = self._get_name(node.returns)

        # Check if async
        is_async = isinstance(node, ast.AsyncFunctionDef)

        return FunctionDef(
            name=node.name,
            args=args,
            return_type=return_type,
            docstring=ast.get_docstring(node),
            line_number=node.lineno,
            is_async=is_async
        )

    def _get_name(self, node) -> str:
        """Get name from AST node"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        elif isinstance(node, ast.Subscript):
            return f"{self._get_name(node.value)}[...]"
        return str(node)

    def extract_typescript_schema_astgrep(self, file_path: Path) -> FileDef:
        """Extract schema from TypeScript/JavaScript using ast-grep"""
        file_def = FileDef(path=str(file_path), language='typescript')
        lang = 'typescript' if file_path.suffix in ['.ts', '.tsx'] else 'javascript'

        try:
            self._extract_ts_imports_astgrep(file_path, file_def, lang)
            self._extract_ts_classes_astgrep(file_path, file_def, lang)
            self._extract_ts_interfaces_astgrep(file_path, file_def, lang)
            self._extract_ts_functions_astgrep(file_path, file_def, lang)
            self._extract_ts_arrow_functions_astgrep(file_path, file_def, lang)
        except Exception as e:
            print(f"  Error with ast-grep parsing {file_path}: {e}")
            return self.extract_typescript_schema_regex(file_path)

        return file_def

    def _extract_ts_imports_astgrep(self, file_path: Path, file_def: FileDef, lang: str):
        """Extract TypeScript imports using ast-grep"""
        # Extract default imports
        import_matches = AstGrepHelper.find_pattern(
            file_path,
            'import $$ from "$PACKAGE"',
            lang
        )
        for match in import_matches:
            package = AstGrepHelper.get_meta_var(match, 'PACKAGE')
            if package:
                file_def.imports.append(package)

        # Extract named imports
        named_import_matches = AstGrepHelper.find_pattern(
            file_path,
            'import { $$ } from "$PACKAGE"',
            lang
        )
        for match in named_import_matches:
            package = AstGrepHelper.get_meta_var(match, 'PACKAGE')
            if package and package not in file_def.imports:
                file_def.imports.append(package)

    def _extract_ts_classes_astgrep(self, file_path: Path, file_def: FileDef, lang: str):
        """Extract TypeScript classes using ast-grep"""
        class_matches = AstGrepHelper.find_pattern(
            file_path,
            'class $NAME { $$$ }',
            lang
        )
        for match in class_matches:
            class_name = AstGrepHelper.get_meta_var(match, 'NAME')
            if class_name:
                line_num = match.get('range', {}).get('start', {}).get('line', 0)
                class_def = ClassDef(
                    name=class_name,
                    bases=[],
                    line_number=line_num,
                    is_exported='export' in match.get('text', '')
                )
                file_def.classes.append(class_def)

    def _extract_ts_interfaces_astgrep(self, file_path: Path, file_def: FileDef, lang: str):
        """Extract TypeScript interfaces using ast-grep"""
        interface_matches = AstGrepHelper.find_pattern(
            file_path,
            'interface $NAME { $$$ }',
            lang
        )
        for match in interface_matches:
            interface_name = AstGrepHelper.get_meta_var(match, 'NAME')
            if interface_name:
                line_num = match.get('range', {}).get('start', {}).get('line', 0)
                class_def = ClassDef(
                    name=interface_name,
                    bases=[],
                    line_number=line_num,
                    is_exported='export' in match.get('text', '')
                )
                file_def.classes.append(class_def)

    def _extract_ts_functions_astgrep(self, file_path: Path, file_def: FileDef, lang: str):
        """Extract TypeScript regular functions using ast-grep"""
        func_matches = AstGrepHelper.find_pattern(
            file_path,
            'function $NAME($$$) { $$$ }',
            lang
        )
        for match in func_matches:
            func_name = AstGrepHelper.get_meta_var(match, 'NAME')
            if func_name:
                line_num = match.get('range', {}).get('start', {}).get('line', 0)
                func_def = FunctionDef(
                    name=func_name,
                    args=[],
                    line_number=line_num,
                    is_exported='export' in match.get('text', ''),
                    is_async='async' in match.get('text', '')
                )
                file_def.functions.append(func_def)

    def _extract_ts_arrow_functions_astgrep(self, file_path: Path, file_def: FileDef, lang: str):
        """Extract TypeScript arrow functions using ast-grep"""
        arrow_matches = AstGrepHelper.find_pattern(
            file_path,
            'const $NAME = ($$$) => $$$',
            lang
        )
        for match in arrow_matches:
            func_name = AstGrepHelper.get_meta_var(match, 'NAME')
            if func_name:
                line_num = match.get('range', {}).get('start', {}).get('line', 0)
                func_def = FunctionDef(
                    name=func_name,
                    args=[],
                    line_number=line_num,
                    is_exported='export' in match.get('text', '')
                )
                file_def.functions.append(func_def)

    def extract_typescript_schema_regex(self, file_path: Path) -> FileDef:
        """Extract schema from TypeScript/JavaScript files using regex (fallback)"""
        file_def = FileDef(path=str(file_path), language='typescript')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            self._extract_ts_imports_regex(content, file_def)
            self._extract_ts_classes_regex(content, file_def)
            self._extract_ts_interfaces_regex(content, file_def)
            self._extract_ts_functions_regex(content, file_def)
            self._extract_ts_arrow_functions_regex(content, file_def)

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return file_def

    def _extract_ts_imports_regex(self, content: str, file_def: FileDef):
        """Extract TypeScript imports using regex"""
        import_pattern = r'import\s+(?:{[^}]+}|[^;\n]+)\s+from\s+["\']([^"\']+)["\']'
        for match in re.finditer(import_pattern, content):
            file_def.imports.append(match.group(1))

    def _extract_ts_classes_regex(self, content: str, file_def: FileDef):
        """Extract TypeScript classes using regex"""
        class_pattern = r'(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+([\w,\s]+))?(?:\s+implements\s+([\w,\s]+))?\s*{'
        for match in re.finditer(class_pattern, content):
            class_name = match.group(1)
            bases = []
            if match.group(2):
                bases.append(match.group(2).strip())
            if match.group(3):
                bases.extend([x.strip() for x in match.group(3).split(',')])

            class_def = ClassDef(
                name=class_name,
                bases=bases,
                line_number=content[:match.start()].count('\n') + 1,
                is_exported='export' in match.group(0)
            )
            file_def.classes.append(class_def)

    def _extract_ts_interfaces_regex(self, content: str, file_def: FileDef):
        """Extract TypeScript interfaces using regex"""
        interface_pattern = r'(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*{'
        for match in re.finditer(interface_pattern, content):
            interface_name = match.group(1)
            bases = []
            if match.group(2):
                bases.extend([x.strip() for x in match.group(2).split(',')])

            class_def = ClassDef(
                name=interface_name,
                bases=bases,
                line_number=content[:match.start()].count('\n') + 1,
                is_exported='export' in match.group(0)
            )
            file_def.classes.append(class_def)

    def _extract_ts_functions_regex(self, content: str, file_def: FileDef):
        """Extract TypeScript functions using regex"""
        func_pattern = r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?'
        for match in re.finditer(func_pattern, content):
            func_name = match.group(1)
            args_str = match.group(2)
            return_type = match.group(3).strip() if match.group(3) else None
            args = [arg.strip().split(':')[0].strip() for arg in args_str.split(',') if arg.strip()]

            func_def = FunctionDef(
                name=func_name,
                args=args,
                return_type=return_type,
                line_number=content[:match.start()].count('\n') + 1,
                is_async='async' in match.group(0)
            )
            file_def.functions.append(func_def)

    def _extract_ts_arrow_functions_regex(self, content: str, file_def: FileDef):
        """Extract TypeScript arrow functions using regex"""
        arrow_pattern = r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>'
        for match in re.finditer(arrow_pattern, content):
            func_name = match.group(1)
            func_def = FunctionDef(
                name=func_name,
                args=[],
                line_number=content[:match.start()].count('\n') + 1,
                is_async='async' in match.group(0)
            )
            file_def.functions.append(func_def)

    def extract_typescript_schema(self, file_path: Path) -> FileDef:
        """Extract TypeScript/JavaScript schema using best available method"""
        if self.use_astgrep:
            return self.extract_typescript_schema_astgrep(file_path)
        else:
            return self.extract_typescript_schema_regex(file_path)

    def scan_directory(self, dir_path: Path) -> DirectorySchema:
        """Scan a directory and extract schemas"""
        schema = DirectorySchema(path=str(dir_path))

        # Check for git
        git_dir = dir_path / '.git'
        if git_dir.exists():
            schema.has_git = True
            try:
                result = subprocess.run(
                    ['git', 'remote', 'get-url', 'origin'],
                    cwd=dir_path,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    schema.git_remote = result.stdout.strip()
            except Exception:
                pass

        if not dir_path.exists():
            return schema

        try:
            for item in dir_path.iterdir():
                # Skip hidden files and excluded directories
                if item.name.startswith('.') and item.name not in ['.git']:
                    continue

                if item.is_dir():
                    if item.name not in self.skip_dirs:
                        schema.subdirectories.append(item.name)
                elif item.is_file():
                    # Process code files
                    if item.suffix == '.py':
                        file_schema = self.extract_python_schema(item)
                        if file_schema.classes or file_schema.functions:
                            schema.files.append(file_schema)
                    elif item.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                        file_schema = self.extract_typescript_schema(item)
                        if file_schema.classes or file_schema.functions:
                            schema.files.append(file_schema)
        except PermissionError:
            print(f"Permission denied: {dir_path}")

        return schema

    def scan_all_directories(self):
        """Recursively scan all directories"""
        for root, dirs, files in os.walk(self.root_path):
            root_path = Path(root)

            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in self.skip_dirs and not d.startswith('.')]

            schema = self.scan_directory(root_path)
            if schema.files or schema.subdirectories or schema.has_git:
                rel_path = root_path.relative_to(self.root_path)

                # Generate schema.org markup for this directory
                dir_name = root_path.name if root_path != self.root_path else 'Code Repository'
                schema.schema_org_markup = SchemaOrgGenerator.generate_software_source_code(
                    schema, dir_name
                )

                self.schemas[str(rel_path)] = schema

    def generate_readme(self, dir_rel_path: str, schema: DirectorySchema, include_schema_org: bool = True) -> str:
        """Generate README.md content for a directory with optional schema.org markup"""
        dir_name = Path(dir_rel_path).name if dir_rel_path != '.' else 'Code Repository'

        lines = []
        self._add_readme_header(lines, dir_name, schema, include_schema_org)
        self._add_readme_overview(lines, schema)
        self._add_readme_subdirectories(lines, schema)
        self._add_readme_files(lines, schema)
        self._add_readme_footer(lines)

        return '\n'.join(lines)

    def _add_readme_header(self, lines: List[str], dir_name: str, schema: DirectorySchema, include_schema_org: bool):
        """Add header section to README"""
        lines.extend([
            f"# {dir_name}",
            ""
        ])

        # Add schema.org JSON-LD if requested
        if include_schema_org and schema.schema_org_markup:
            jsonld_script = SchemaOrgGenerator.generate_jsonld_script(schema.schema_org_markup)
            lines.extend([
                jsonld_script,
                ""
            ])

    def _add_readme_overview(self, lines: List[str], schema: DirectorySchema):
        """Add overview section to README"""
        lines.extend([
            "## Overview",
            "",
            f"This directory contains {len(schema.files)} code file(s) with extracted schemas.",
            ""
        ])

        if schema.git_remote:
            lines.extend([
                f"**Git Remote:** {schema.git_remote}",
                ""
            ])

    def _add_readme_subdirectories(self, lines: List[str], schema: DirectorySchema):
        """Add subdirectories section to README"""
        if schema.subdirectories:
            lines.extend([
                "## Subdirectories",
                ""
            ])
            for subdir in sorted(schema.subdirectories):
                lines.append(f"- `{subdir}/`")
            lines.append("")

    def _add_readme_files(self, lines: List[str], schema: DirectorySchema):
        """Add files and schemas section to README"""
        if not schema.files:
            return

        lines.extend([
            "## Files and Schemas",
            ""
        ])

        for file_def in sorted(schema.files, key=lambda x: x.path):
            file_name = Path(file_def.path).name
            lines.extend([
                f"### `{file_name}` ({file_def.language})",
                ""
            ])

            self._add_readme_classes(lines, file_def)
            self._add_readme_functions(lines, file_def)
            self._add_readme_imports(lines, file_def)

    def _add_readme_classes(self, lines: List[str], file_def: FileDef):
        """Add classes information to README"""
        if not file_def.classes:
            return

        lines.append("**Classes:**")
        for cls in file_def.classes:
            bases_str = f" (extends: {', '.join(cls.bases)})" if cls.bases else ""
            export_str = " [exported]" if cls.is_exported else ""
            lines.append(f"- `{cls.name}`{bases_str}{export_str} - Line {cls.line_number}")

            if cls.docstring:
                lines.append(f"  - {cls.docstring.split(chr(10))[0]}")

            if cls.methods:
                method_names = ', '.join(m.name for m in cls.methods[:5])
                lines.append(f"  - Methods: {method_names}")
                if len(cls.methods) > 5:
                    lines[-1] += f" (+{len(cls.methods) - 5} more)"
        lines.append("")

    def _add_readme_functions(self, lines: List[str], file_def: FileDef):
        """Add functions information to README"""
        if not file_def.functions:
            return

        lines.append("**Functions:**")
        for func in file_def.functions[:10]:
            args_str = f"({', '.join(func.args)})" if func.args else "()"
            return_str = f" -> {func.return_type}" if func.return_type else ""
            async_str = "async " if func.is_async else ""
            export_str = " [exported]" if func.is_exported else ""
            lines.append(f"- `{async_str}{func.name}{args_str}{return_str}`{export_str} - Line {func.line_number}")

        if len(file_def.functions) > 10:
            lines.append(f"- ... and {len(file_def.functions) - 10} more functions")
        lines.append("")

    def _add_readme_imports(self, lines: List[str], file_def: FileDef):
        """Add imports information to README"""
        if not file_def.imports:
            return

        top_imports = sorted(set(file_def.imports))[:5]
        imports_str = ', '.join(f'`{i}`' for i in top_imports)
        lines.append(f"**Key Imports:** {imports_str}")

        if len(file_def.imports) > 5:
            lines[-1] += f" (+{len(set(file_def.imports)) - 5} more)"
        lines.append("")

    def _add_readme_footer(self, lines: List[str]):
        """Add footer to README"""
        lines.extend([
            "---",
            "*Generated by Enhanced Schema Generator with schema.org markup*"
        ])

    def save_schemas_json(self, output_path: Path, include_schema_org: bool = True):
        """Save all schemas to a JSON file with schema.org vocabulary"""
        data = self._build_schemas_json_data(include_schema_org)
        self._write_json_file(output_path, data)
        self._print_save_summary(output_path, include_schema_org)

    def _build_schemas_json_data(self, include_schema_org: bool) -> Dict[str, Any]:
        """Build the JSON data structure for schemas"""
        data = {
            "@context": "https://schema.org" if include_schema_org else None,
            "directories": {}
        }

        for path, schema in self.schemas.items():
            dir_data = self._build_directory_data(schema, include_schema_org)
            data['directories'][path] = dir_data

        # Clean root None values
        return {k: v for k, v in data.items() if v is not None}

    def _build_directory_data(self, schema: DirectorySchema, include_schema_org: bool) -> Dict[str, Any]:
        """Build directory data for JSON export"""
        dir_data = {
            'path': schema.path,
            'has_git': schema.has_git,
            'git_remote': schema.git_remote,
            'subdirectories': schema.subdirectories,
            'files': [self._build_file_data(f, include_schema_org) for f in schema.files]
        }

        # Add schema.org markup
        if include_schema_org and schema.schema_org_markup:
            dir_data['schema_org'] = schema.schema_org_markup

        # Clean None values
        return {k: v for k, v in dir_data.items() if v is not None}

    def _build_file_data(self, file_def: FileDef, include_schema_org: bool) -> Dict[str, Any]:
        """Build file data for JSON export"""
        return {
            '@type': 'SoftwareSourceCode' if include_schema_org else None,
            'path': file_def.path,
            'language': file_def.language,
            'classes': [self._build_class_data(c) for c in file_def.classes],
            'functions': [self._build_function_data(fn) for fn in file_def.functions],
            'imports': file_def.imports
        }

    def _build_class_data(self, class_def: ClassDef) -> Dict[str, Any]:
        """Build class data for JSON export"""
        return {
            'name': class_def.name,
            'bases': class_def.bases,
            'methods': [{'name': m.name, 'args': m.args, 'isAsync': m.is_async} for m in class_def.methods],
            'line_number': class_def.line_number,
            'is_exported': class_def.is_exported
        }

    def _build_function_data(self, func_def: FunctionDef) -> Dict[str, Any]:
        """Build function data for JSON export"""
        return {
            'name': func_def.name,
            'args': func_def.args,
            'return_type': func_def.return_type,
            'line_number': func_def.line_number,
            'is_async': func_def.is_async,
            'is_exported': func_def.is_exported
        }

    def _write_json_file(self, output_path: Path, data: Dict[str, Any]):
        """Write JSON data to file"""
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

    def _print_save_summary(self, output_path: Path, include_schema_org: bool):
        """Print summary after saving schemas"""
        print(f"✅ Schemas saved to {output_path}")
        print(f"   Total directories: {len(self.schemas)}")
        print(f"   Schema.org markup: {'Included' if include_schema_org else 'Not included'}")

def main():
    args = _parse_arguments()
    root = Path(args.root)
    generator = EnhancedSchemaGenerator(str(root), use_astgrep=not args.no_astgrep)

    _print_header(generator, root, args)
    _run_scanner(generator)

    schema_json_path = _get_output_path(root)
    generator.save_schemas_json(schema_json_path, include_schema_org=not args.no_schema_org)
    print()

    readme_files = _generate_readme_files(generator, root, args)
    _print_git_remotes(generator)
    _handle_quality_report(args)
    _print_footer()

    return readme_files, _get_git_directories(generator)

def _parse_arguments():
    """Parse command line arguments"""
    import argparse
    parser = argparse.ArgumentParser(description='Enhanced Schema Generator')
    parser.add_argument('--root', default='/Users/alyshialedlie/code', help='Root directory to scan')
    parser.add_argument('--no-astgrep', action='store_true', help='Disable ast-grep (use regex fallback)')
    parser.add_argument('--no-schema-org', action='store_true', help='Disable schema.org markup in READMEs')
    parser.add_argument('--quality-report', action='store_true', help='Generate code quality report')
    return parser.parse_args()

def _print_header(generator: 'EnhancedSchemaGenerator', root: Path, args):
    """Print header information"""
    print(f"\n{'='*60}")
    print("Enhanced Schema Generator")
    print(f"{'='*60}\n")
    print(f"Root path: {root}")
    print(f"AST-grep: {'Enabled' if generator.use_astgrep else 'Disabled (regex fallback)'}")
    print(f"Schema.org: {'Enabled' if not args.no_schema_org else 'Disabled'}")
    print()

def _run_scanner(generator: 'EnhancedSchemaGenerator'):
    """Run directory scanning"""
    print("Scanning directories...")
    generator.scan_all_directories()
    print(f"✅ Found {len(generator.schemas)} directories to process\n")

def _get_output_path(root: Path) -> Path:
    """Determine output path for schemas.json"""
    if root.name == 'Inventory':
        return root / 'schemas_enhanced.json'
    else:
        inventory_dir = root / 'Inventory'
        inventory_dir.mkdir(exist_ok=True)
        return inventory_dir / 'schemas_enhanced.json'

def _generate_readme_files(generator: 'EnhancedSchemaGenerator', root: Path, args) -> List[str]:
    """Generate README files for directories"""
    readme_files = []
    for dir_path, schema in generator.schemas.items():
        if not schema.files:
            continue

        full_path = root / dir_path
        readme_path = full_path / 'README_ENHANCED.md'
        readme_content = generator.generate_readme(
            dir_path,
            schema,
            include_schema_org=not args.no_schema_org
        )

        if _should_write_readme(readme_path, readme_content):
            with open(readme_path, 'w') as f:
                f.write(readme_content)
            readme_files.append(str(readme_path))

    print(f"✅ Generated/updated {len(readme_files)} README_ENHANCED.md files\n")
    return readme_files

def _should_write_readme(readme_path: Path, content: str) -> bool:
    """Check if README should be written"""
    if not readme_path.exists():
        return True

    with open(readme_path, 'r') as f:
        existing = f.read()
    return existing != content

def _print_git_remotes(generator: 'EnhancedSchemaGenerator'):
    """Print directories with git remotes"""
    git_dirs = _get_git_directories(generator)
    if git_dirs:
        print("Directories with git remotes:")
        for path, remote in git_dirs:
            print(f"  • {path}: {remote}")
        print()

def _get_git_directories(generator: 'EnhancedSchemaGenerator') -> List[Tuple[str, str]]:
    """Get list of directories with git remotes"""
    return [(path, schema.git_remote) for path, schema in generator.schemas.items()
            if schema.has_git and schema.git_remote]

def _handle_quality_report(args):
    """Handle quality report generation"""
    if args.quality_report:
        print("\n" + "="*60)
        print("Code Quality Report")
        print("="*60)
        print("\nℹ️  Quality report feature requires code_quality_analyzer.py")
        print("   This will be implemented next.")

def _print_footer():
    """Print footer information"""
    print("\n" + "="*60)
    print("✅ Schema generation complete!")
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
