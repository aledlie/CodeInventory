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

        # Determine language for ast-grep
        lang = 'typescript' if file_path.suffix in ['.ts', '.tsx'] else 'javascript'

        try:
            # Extract imports
            import_matches = AstGrepHelper.find_pattern(
                file_path,
                'import $$ from "$PACKAGE"',
                lang
            )
            for match in import_matches:
                package = AstGrepHelper.get_meta_var(match, 'PACKAGE')
                if package:
                    file_def.imports.append(package)

            # Also catch named imports
            named_import_matches = AstGrepHelper.find_pattern(
                file_path,
                'import { $$ } from "$PACKAGE"',
                lang
            )
            for match in named_import_matches:
                package = AstGrepHelper.get_meta_var(match, 'PACKAGE')
                if package and package not in file_def.imports:
                    file_def.imports.append(package)

            # Extract classes
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

            # Extract interfaces
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

            # Extract regular functions
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
                        args=[],  # ast-grep doesn't easily extract args in pattern
                        line_number=line_num,
                        is_exported='export' in match.get('text', ''),
                        is_async='async' in match.get('text', '')
                    )
                    file_def.functions.append(func_def)

            # Extract arrow functions assigned to const
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

        except Exception as e:
            print(f"  Error with ast-grep parsing {file_path}: {e}")
            # Fall back to regex if ast-grep fails
            return self.extract_typescript_schema_regex(file_path)

        return file_def

    def extract_typescript_schema_regex(self, file_path: Path) -> FileDef:
        """Extract schema from TypeScript/JavaScript files using regex (fallback)"""
        file_def = FileDef(path=str(file_path), language='typescript')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract imports
            import_pattern = r'import\s+(?:{[^}]+}|[^;\n]+)\s+from\s+["\']([^"\']+)["\']'
            for match in re.finditer(import_pattern, content):
                file_def.imports.append(match.group(1))

            # Extract classes
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

            # Extract interfaces
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

            # Extract functions
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

            # Extract arrow functions
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

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return file_def

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

        lines = [
            f"# {dir_name}",
            ""
        ]

        # Add schema.org JSON-LD if requested
        if include_schema_org and schema.schema_org_markup:
            jsonld_script = SchemaOrgGenerator.generate_jsonld_script(schema.schema_org_markup)
            lines.extend([
                jsonld_script,
                ""
            ])

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

        if schema.subdirectories:
            lines.extend([
                "## Subdirectories",
                ""
            ])
            for subdir in sorted(schema.subdirectories):
                lines.append(f"- `{subdir}/`")
            lines.append("")

        if schema.files:
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

                if file_def.classes:
                    lines.append("**Classes:**")
                    for cls in file_def.classes:
                        bases_str = f" (extends: {', '.join(cls.bases)})" if cls.bases else ""
                        export_str = " [exported]" if cls.is_exported else ""
                        lines.append(f"- `{cls.name}`{bases_str}{export_str} - Line {cls.line_number}")
                        if cls.docstring:
                            lines.append(f"  - {cls.docstring.split(chr(10))[0]}")
                        if cls.methods:
                            lines.append(f"  - Methods: {', '.join(m.name for m in cls.methods[:5])}")
                            if len(cls.methods) > 5:
                                lines[-1] += f" (+{len(cls.methods) - 5} more)"
                    lines.append("")

                if file_def.functions:
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

                if file_def.imports:
                    top_imports = sorted(set(file_def.imports))[:5]
                    lines.append(f"**Key Imports:** {', '.join(f'`{i}`' for i in top_imports)}")
                    if len(file_def.imports) > 5:
                        lines[-1] += f" (+{len(set(file_def.imports)) - 5} more)"
                    lines.append("")

        lines.extend([
            "---",
            "*Generated by Enhanced Schema Generator with schema.org markup*"
        ])

        return '\n'.join(lines)

    def save_schemas_json(self, output_path: Path, include_schema_org: bool = True):
        """Save all schemas to a JSON file with schema.org vocabulary"""
        data = {
            "@context": "https://schema.org" if include_schema_org else None,
            "directories": {}
        }

        for path, schema in self.schemas.items():
            dir_data = {
                'path': schema.path,
                'has_git': schema.has_git,
                'git_remote': schema.git_remote,
                'subdirectories': schema.subdirectories,
                'files': [
                    {
                        '@type': 'SoftwareSourceCode' if include_schema_org else None,
                        'path': f.path,
                        'language': f.language,
                        'classes': [
                            {
                                'name': c.name,
                                'bases': c.bases,
                                'methods': [{'name': m.name, 'args': m.args, 'isAsync': m.is_async} for m in c.methods],
                                'line_number': c.line_number,
                                'is_exported': c.is_exported
                            } for c in f.classes
                        ],
                        'functions': [
                            {
                                'name': fn.name,
                                'args': fn.args,
                                'return_type': fn.return_type,
                                'line_number': fn.line_number,
                                'is_async': fn.is_async,
                                'is_exported': fn.is_exported
                            } for fn in f.functions
                        ],
                        'imports': f.imports
                    } for f in schema.files
                ]
            }

            # Add schema.org markup
            if include_schema_org and schema.schema_org_markup:
                dir_data['schema_org'] = schema.schema_org_markup

            # Clean None values
            dir_data = {k: v for k, v in dir_data.items() if v is not None}
            data['directories'][path] = dir_data

        # Clean root None
        data = {k: v for k, v in data.items() if v is not None}

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✅ Schemas saved to {output_path}")
        print(f"   Total directories: {len(self.schemas)}")
        print(f"   Schema.org markup: {'Included' if include_schema_org else 'Not included'}")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Enhanced Schema Generator')
    parser.add_argument('--root', default='/Users/alyshialedlie/code', help='Root directory to scan')
    parser.add_argument('--no-astgrep', action='store_true', help='Disable ast-grep (use regex fallback)')
    parser.add_argument('--no-schema-org', action='store_true', help='Disable schema.org markup in READMEs')
    parser.add_argument('--quality-report', action='store_true', help='Generate code quality report')

    args = parser.parse_args()

    root = Path(args.root)
    generator = EnhancedSchemaGenerator(str(root), use_astgrep=not args.no_astgrep)

    print(f"\n{'='*60}")
    print("Enhanced Schema Generator")
    print(f"{'='*60}\n")
    print(f"Root path: {root}")
    print(f"AST-grep: {'Enabled' if generator.use_astgrep else 'Disabled (regex fallback)'}")
    print(f"Schema.org: {'Enabled' if not args.no_schema_org else 'Disabled'}")
    print()

    print("Scanning directories...")
    generator.scan_all_directories()

    print(f"✅ Found {len(generator.schemas)} directories to process\n")

    # Save schemas to JSON
    # If root is already Inventory directory, save directly; otherwise save to Inventory subdirectory
    if root.name == 'Inventory':
        schema_json_path = root / 'schemas_enhanced.json'
    else:
        inventory_dir = root / 'Inventory'
        inventory_dir.mkdir(exist_ok=True)
        schema_json_path = inventory_dir / 'schemas_enhanced.json'

    generator.save_schemas_json(schema_json_path, include_schema_org=not args.no_schema_org)
    print()

    # Generate README files
    readme_files = []
    for dir_path, schema in generator.schemas.items():
        if schema.files:  # Only create README if there are code files
            full_path = root / dir_path
            readme_path = full_path / 'README_ENHANCED.md'

            readme_content = generator.generate_readme(
                dir_path,
                schema,
                include_schema_org=not args.no_schema_org
            )

            # Check if README exists and if we should update it
            should_write = True
            if readme_path.exists():
                with open(readme_path, 'r') as f:
                    existing = f.read()
                    should_write = existing != readme_content

            if should_write:
                with open(readme_path, 'w') as f:
                    f.write(readme_content)
                readme_files.append(str(readme_path))

    print(f"✅ Generated/updated {len(readme_files)} README_ENHANCED.md files\n")

    # Output list of directories with git remotes
    git_dirs = [(path, schema.git_remote) for path, schema in generator.schemas.items()
                if schema.has_git and schema.git_remote]

    if git_dirs:
        print("Directories with git remotes:")
        for path, remote in git_dirs:
            print(f"  • {path}: {remote}")
        print()

    # Quality report
    if args.quality_report:
        print("\n" + "="*60)
        print("Code Quality Report")
        print("="*60)
        print("\nℹ️  Quality report feature requires code_quality_analyzer.py")
        print("   This will be implemented next.")

    print("\n" + "="*60)
    print("✅ Schema generation complete!")
    print("="*60 + "\n")

    return readme_files, git_dirs

if __name__ == '__main__':
    main()
