#!/usr/bin/env python3
"""
Documentation Enhancement Pipeline - Automatically adds schema.org markup to documentation
"""

import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, List
import subprocess
import sys

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

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

    def _read_file_content(self, file_path: Path) -> str:
        """Read file content"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def _find_insertion_point(self, lines: List[str]) -> int:
        """Find the insertion point after the first heading"""
        for i, line in enumerate(lines):
            if line.startswith('#'):
                return i + 1
        return 0

    def _insert_schema_markup(self, lines: List[str], schema: Dict[str, Any], insert_index: int) -> List[str]:
        """Insert schema markup at the specified index"""
        jsonld = self.create_jsonld_script(schema)
        lines.insert(insert_index, '')
        lines.insert(insert_index + 1, jsonld)
        lines.insert(insert_index + 2, '')
        return lines

    def _write_file_content(self, file_path: Path, content: str) -> None:
        """Write content back to file"""
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def inject_schema(self, readme_path: Path, schema: Dict[str, Any]) -> bool:
        """Inject schema.org markup into README"""
        try:
            # Read existing content
            content = self._read_file_content(readme_path)

            # Check if already has schema
            if self.has_schema_markup(content):
                logger.info(f"  ℹ️  Skipped (already has schema): {readme_path}")
                self.skipped_count += 1
                return False

            # Process lines
            lines = content.split('\n')
            insert_index = self._find_insertion_point(lines)

            # Insert schema markup
            lines = self._insert_schema_markup(lines, schema, insert_index)

            # Write back
            enhanced_content = '\n'.join(lines)
            self._write_file_content(readme_path, enhanced_content)

            logger.info(f"  ✅ Enhanced: {readme_path}")
            self.enhanced_count += 1
            return True

        except Exception as e:
            logger.error(f"  ❌ Error enhancing {readme_path}: {e}")
            return False

    def _get_default_skip_dirs(self) -> set:
        """Get default directories to skip"""
        return {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build',
                '_site', '.venv', 'venv', 'env', '.cache', 'coverage'}

    def _get_readme_files(self, directory: Path, skip_dirs: set) -> List[Path]:
        """Get all README files in directory tree"""
        readme_files = []
        for root, dirs, files in os.walk(directory):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]

            for file_name in files:
                if file_name.lower() in ['readme.md', 'readme_enhanced.md']:
                    readme_files.append(Path(root) / file_name)

        return readme_files

    def enhance_directory(self, directory: Path = None, skip_dirs: set = None):
        """Enhance all README files in directory"""
        if directory is None:
            directory = self.root_dir

        if skip_dirs is None:
            skip_dirs = self._get_default_skip_dirs()

        # Get all README files
        readme_files = self._get_readme_files(directory, skip_dirs)

        # Process each README
        for readme_path in readme_files:
            # Gather context
            context = self._gather_context(readme_path.parent)

            # Generate schema
            schema = self.generate_schema_for_readme(readme_path, context)

            # Inject
            self.inject_schema(readme_path, schema)

    def _get_git_remote(self, directory: Path) -> str:
        """Get git remote URL if available"""
        git_dir = directory / '.git'
        if not git_dir.exists():
            return None

        try:
            result = subprocess.run(
                ['git', 'remote', 'get-url', 'origin'],
                cwd=directory,
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except Exception:
            pass

        return None

    def _detect_languages(self, directory: Path) -> List[str]:
        """Detect programming languages in directory"""
        language_extensions = {
            '.py': 'Python',
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript'
        }

        languages = set()
        for file_path in directory.glob('*'):
            if file_path.is_file():
                language = language_extensions.get(file_path.suffix)
                if language:
                    languages.add(language)

        return list(languages)

    def _gather_context(self, directory: Path) -> Dict[str, Any]:
        """Gather context about a directory"""
        context = {
            'languages': self._detect_languages(directory),
            'git_remote': self._get_git_remote(directory)
        }
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

    logger.info(f"\n{'='*80}")
    logger.info("Documentation Enhancement Pipeline")
    logger.info(f"{'='*80}\n")
    logger.info(f"Root Directory: {directory}")
    logger.info(f"Dry Run: {args.dry_run}\n")

    if not args.dry_run:
        enhancer.enhance_directory()
        logger.info("\n" + enhancer.generate_report())
    else:
        logger.info("ℹ️  Dry run mode - no files will be modified\n")

if __name__ == '__main__':
    main()
