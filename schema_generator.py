#!/usr/bin/env python3
"""
Schema Generator - Creates Pydantic schemas for all code files and updates README.md files
"""

import os
import ast
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict
import subprocess

@dataclass
class FunctionDef:
    name: str
    args: List[str]
    return_type: Optional[str] = None
    docstring: Optional[str] = None
    line_number: int = 0

@dataclass
class ClassDef:
    name: str
    bases: List[str]
    methods: List[FunctionDef] = field(default_factory=list)
    attributes: List[str] = field(default_factory=list)
    docstring: Optional[str] = None
    line_number: int = 0

@dataclass
class FileDef:
    path: str
    language: str
    classes: List[ClassDef] = field(default_factory=list)
    functions: List[FunctionDef] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)

@dataclass
class DirectorySchema:
    path: str
    files: List[FileDef] = field(default_factory=list)
    subdirectories: List[str] = field(default_factory=list)
    has_git: bool = False
    git_remote: Optional[str] = None

class SchemaGenerator:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.schemas: Dict[str, DirectorySchema] = {}
        self.skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                         '_site', '.venv', 'venv', 'env', '.cache', 'coverage'}

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

        return FunctionDef(
            name=node.name,
            args=args,
            return_type=return_type,
            docstring=ast.get_docstring(node),
            line_number=node.lineno
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

    def extract_typescript_schema(self, file_path: Path) -> FileDef:
        """Extract schema from TypeScript/JavaScript files using regex"""
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
                    line_number=content[:match.start()].count('\n') + 1
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
                    line_number=content[:match.start()].count('\n') + 1
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
                    line_number=content[:match.start()].count('\n') + 1
                )
                file_def.functions.append(func_def)

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return file_def

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
                    text=True
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
                self.schemas[str(rel_path)] = schema

    def generate_readme(self, dir_rel_path: str, schema: DirectorySchema) -> str:
        """Generate README.md content for a directory"""
        dir_name = Path(dir_rel_path).name if dir_rel_path != '.' else 'Code Repository'

        lines = [
            f"# {dir_name}",
            "",
            "## Overview",
            "",
            f"This directory contains {len(schema.files)} code file(s) with extracted schemas.",
            ""
        ]

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
                        lines.append(f"- `{cls.name}`{bases_str} - Line {cls.line_number}")
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
                        lines.append(f"- `{func.name}{args_str}{return_str}` - Line {func.line_number}")
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
            "*Generated by Schema Generator*"
        ])

        return '\n'.join(lines)

    def save_schemas_json(self, output_path: Path):
        """Save all schemas to a JSON file"""
        data = {}
        for path, schema in self.schemas.items():
            data[path] = {
                'path': schema.path,
                'has_git': schema.has_git,
                'git_remote': schema.git_remote,
                'subdirectories': schema.subdirectories,
                'files': [
                    {
                        'path': f.path,
                        'language': f.language,
                        'classes': [
                            {
                                'name': c.name,
                                'bases': c.bases,
                                'methods': [{'name': m.name, 'args': m.args} for m in c.methods],
                                'line_number': c.line_number
                            } for c in f.classes
                        ],
                        'functions': [
                            {
                                'name': fn.name,
                                'args': fn.args,
                                'return_type': fn.return_type,
                                'line_number': fn.line_number
                            } for fn in f.functions
                        ]
                    } for f in schema.files
                ]
            }

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"Schemas saved to {output_path}")

def main():
    root = Path('/Users/alyshialedlie/code')
    generator = SchemaGenerator(str(root))

    print("Scanning directories...")
    generator.scan_all_directories()

    print(f"Found {len(generator.schemas)} directories to process")

    # Save schemas to JSON
    schema_json_path = root / 'schemas.json'
    generator.save_schemas_json(schema_json_path)

    # Generate README files
    readme_files = []
    for dir_path, schema in generator.schemas.items():
        if schema.files:  # Only create README if there are code files
            full_path = root / dir_path
            readme_path = full_path / 'README.md'

            readme_content = generator.generate_readme(dir_path, schema)

            # Check if README exists and if we should update it
            should_write = True
            if readme_path.exists():
                with open(readme_path, 'r') as f:
                    existing = f.read()
                    # Only update if different
                    should_write = existing != readme_content

            if should_write:
                with open(readme_path, 'w') as f:
                    f.write(readme_content)
                readme_files.append(str(readme_path))
                print(f"Updated: {readme_path}")

    print(f"\nGenerated/updated {len(readme_files)} README.md files")

    # Output list of directories with git remotes
    git_dirs = [(path, schema.git_remote) for path, schema in generator.schemas.items()
                if schema.has_git and schema.git_remote]

    if git_dirs:
        print("\nDirectories with git remotes:")
        for path, remote in git_dirs:
            print(f"  {path}: {remote}")

    return readme_files, git_dirs

if __name__ == '__main__':
    main()
