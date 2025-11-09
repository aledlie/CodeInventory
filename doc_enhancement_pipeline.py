#!/usr/bin/env python3
"""
Documentation Enhancement Pipeline - Automatically adds schema.org markup to documentation
"""

import json
from pathlib import Path
from typing import Dict, Any, List
import subprocess

class DocumentationEnhancer:
    """Enhances documentation with schema.org markup"""

    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.enhanced_count = 0
        self.skipped_count = 0

    def generate_schema_for_readme(self, readme_path: Path, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate appropriate schema.org markup based on README context"""

        # Determine type based on content
        schema_type = "TechArticle"

        if "test" in str(readme_path).lower():
            schema_type = "HowTo"
        elif any(word in str(readme_path).lower() for word in ['api', 'reference']):
            schema_type = "APIReference"

        schema = {
            "@context": "https://schema.org",
            "@type": schema_type,
            "name": readme_path.parent.name,
            "description": f"Documentation for {readme_path.parent.name}",
        }

        # Add git remote if available
        if context.get('git_remote'):
            schema["codeRepository"] = context['git_remote']

        # Add programming languages
        if context.get('languages'):
            schema["programmingLanguage"] = [
                {"@type": "ComputerLanguage", "name": lang}
                for lang in context['languages']
            ]

        return schema

    def create_jsonld_script(self, schema: Dict[str, Any]) -> str:
        """Create JSON-LD script tag"""
        json_str = json.dumps(schema, indent=2)
        return f'<script type="application/ld+json">\n{json_str}\n</script>'

    def has_schema_markup(self, content: str) -> bool:
        """Check if README already has schema.org markup"""
        return '<script type="application/ld+json">' in content

    def inject_schema(self, readme_path: Path, schema: Dict[str, Any]) -> bool:
        """Inject schema.org markup into README"""
        try:
            # Read existing content
            with open(readme_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check if already has schema
            if self.has_schema_markup(content):
                print(f"  ℹ️  Skipped (already has schema): {readme_path}")
                self.skipped_count += 1
                return False

            # Find the first heading
            lines = content.split('\n')
            insert_index = 0

            for i, line in enumerate(lines):
                if line.startswith('#'):
                    insert_index = i + 1
                    break

            # Create JSON-LD script
            jsonld = self.create_jsonld_script(schema)

            # Insert after first heading
            lines.insert(insert_index, '')
            lines.insert(insert_index + 1, jsonld)
            lines.insert(insert_index + 2, '')

            # Write back
            enhanced_content = '\n'.join(lines)
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(enhanced_content)

            print(f"  ✅ Enhanced: {readme_path}")
            self.enhanced_count += 1
            return True

        except Exception as e:
            print(f"  ❌ Error enhancing {readme_path}: {e}")
            return False

    def enhance_directory(self, directory: Path = None, skip_dirs: set = None):
        """Enhance all README files in directory"""
        if directory is None:
            directory = self.root_dir

        if skip_dirs is None:
            skip_dirs = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                        '_site', '.venv', 'venv', 'env', '.cache', 'coverage'}

        for root, dirs, files in directory.walk():
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            for file_name in files:
                if file_name.lower() in ['readme.md', 'readme_enhanced.md']:
                    readme_path = Path(root) / file_name

                    # Gather context
                    context = self._gather_context(readme_path.parent)

                    # Generate schema
                    schema = self.generate_schema_for_readme(readme_path, context)

                    # Inject
                    self.inject_schema(readme_path, schema)

    def _gather_context(self, directory: Path) -> Dict[str, Any]:
        """Gather context about a directory"""
        context = {
            'languages': set(),
            'git_remote': None
        }

        # Check for git
        git_dir = directory / '.git'
        if git_dir.exists():
            try:
                result = subprocess.run(
                    ['git', 'remote', 'get-url', 'origin'],
                    cwd=directory,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    context['git_remote'] = result.stdout.strip()
            except Exception:
                pass

        # Detect languages
        for file_path in directory.glob('*'):
            if file_path.is_file():
                if file_path.suffix == '.py':
                    context['languages'].add('Python')
                elif file_path.suffix in ['.ts', '.tsx']:
                    context['languages'].add('TypeScript')
                elif file_path.suffix in ['.js', '.jsx']:
                    context['languages'].add('JavaScript')

        context['languages'] = list(context['languages'])
        return context

    def generate_report(self) -> str:
        """Generate enhancement report"""
        lines = [
            "="*80,
            "DOCUMENTATION ENHANCEMENT REPORT",
            "="*80,
            "",
            f"Files Enhanced: {self.enhanced_count}",
            f"Files Skipped: {self.skipped_count}",
            f"Total Processed: {self.enhanced_count + self.skipped_count}",
            "",
            "="*80
        ]
        return '\n'.join(lines)

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Documentation Enhancement Pipeline')
    parser.add_argument('directory', help='Directory to enhance')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')

    args = parser.parse_args()

    directory = Path(args.directory)
    enhancer = DocumentationEnhancer(directory)

    print(f"\n{'='*80}")
    print("Documentation Enhancement Pipeline")
    print(f"{'='*80}\n")
    print(f"Root Directory: {directory}")
    print(f"Dry Run: {args.dry_run}\n")

    if not args.dry_run:
        enhancer.enhance_directory()
        print("\n" + enhancer.generate_report())
    else:
        print("ℹ️  Dry run mode - no files will be modified\n")

if __name__ == '__main__':
    main()
