#!/usr/bin/env python3
"""
Schema Validator - Validates schema.org JSON-LD markup
"""

import json
from pathlib import Path
from typing import Dict, Any, List
import re

class SchemaValidator:
    """Validates schema.org markup"""

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.valid_types = {
            'SoftwareSourceCode', 'SoftwareApplication', 'Dataset', 'TechArticle',
            'HowTo', 'APIReference', 'DataFeed', 'BlogPosting', 'Article',
            'ComputerLanguage', 'Person', 'Organization', 'CreativeWork'
        }

    def validate_schema(self, schema: Dict[str, Any], context: str = "root") -> bool:
        """Validate a schema.org object"""
        is_valid = True

        # Check @context
        if '@context' in schema:
            if schema['@context'] != 'https://schema.org':
                self.warnings.append(f"{context}: @context should be 'https://schema.org'")

        # Check @type
        if '@type' not in schema:
            self.errors.append(f"{context}: Missing @type")
            is_valid = False
        elif schema['@type'] not in self.valid_types:
            self.warnings.append(f"{context}: Uncommon @type '{schema['@type']}'")

        # Type-specific validation
        schema_type = schema.get('@type')

        if schema_type == 'SoftwareSourceCode':
            is_valid &= self._validate_software_source_code(schema, context)
        elif schema_type == 'Dataset':
            is_valid &= self._validate_dataset(schema, context)
        elif schema_type == 'TechArticle':
            is_valid &= self._validate_tech_article(schema, context)

        return is_valid

    def _validate_software_source_code(self, schema: Dict[str, Any], context: str) -> bool:
        """Validate SoftwareSourceCode schema"""
        is_valid = True

        # Recommended properties
        recommended = ['name', 'description', 'programmingLanguage']
        for prop in recommended:
            if prop not in schema:
                self.warnings.append(f"{context}: Recommended property '{prop}' missing")

        # Validate URL format
        if 'codeRepository' in schema:
            url = schema['codeRepository']
            if not url or not (url.startswith('http://') or url.startswith('https://')):
                self.errors.append(f"{context}: codeRepository should be a valid URL")
                is_valid = False

        return is_valid

    def _validate_dataset(self, schema: Dict[str, Any], context: str) -> bool:
        """Validate Dataset schema"""
        is_valid = True

        required = ['name', 'description']
        for prop in required:
            if prop not in schema:
                self.errors.append(f"{context}: Required property '{prop}' missing from Dataset")
                is_valid = False

        return is_valid

    def _validate_tech_article(self, schema: Dict[str, Any], context: str) -> bool:
        """Validate TechArticle schema"""
        is_valid = True

        recommended = ['name', 'description', 'datePublished']
        for prop in recommended:
            if prop not in schema:
                self.warnings.append(f"{context}: Recommended property '{prop}' missing from TechArticle")

        return is_valid

    def validate_file(self, file_path: Path) -> bool:
        """Validate schema.org markup in a file"""
        print(f"\nValidating: {file_path}")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find JSON-LD script tags
            pattern = r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>'
            matches = re.findall(pattern, content, re.DOTALL)

            if not matches:
                self.warnings.append(f"{file_path}: No schema.org markup found")
                return True

            all_valid = True
            for idx, match in enumerate(matches, 1):
                try:
                    schema = json.loads(match)
                    is_valid = self.validate_schema(schema, f"{file_path}[{idx}]")
                    all_valid &= is_valid
                except json.JSONDecodeError as e:
                    self.errors.append(f"{file_path}[{idx}]: Invalid JSON - {e}")
                    all_valid = False

            return all_valid

        except Exception as e:
            self.errors.append(f"{file_path}: Error reading file - {e}")
            return False

    def validate_json_file(self, file_path: Path) -> bool:
        """Validate pure JSON-LD file"""
        print(f"\nValidating JSON file: {file_path}")

        try:
            with open(file_path, 'r') as f:
                data = json.load(f)

            # Handle @graph
            if '@graph' in data:
                all_valid = True
                for idx, schema in enumerate(data['@graph'], 1):
                    is_valid = self.validate_schema(schema, f"{file_path}[@graph[{idx}]]")
                    all_valid &= is_valid
                return all_valid
            else:
                return self.validate_schema(data, str(file_path))

        except json.JSONDecodeError as e:
            self.errors.append(f"{file_path}: Invalid JSON - {e}")
            return False
        except Exception as e:
            self.errors.append(f"{file_path}: Error - {e}")
            return False

    def generate_report(self) -> str:
        """Generate validation report"""
        lines = [
            "="*80,
            "SCHEMA.ORG VALIDATION REPORT",
            "="*80,
            ""
        ]

        if not self.errors and not self.warnings:
            lines.append("✅ All schemas are valid!")
        else:
            if self.errors:
                lines.append(f"❌ ERRORS ({len(self.errors)}):")
                lines.append("-"*80)
                for error in self.errors:
                    lines.append(f"  • {error}")
                lines.append("")

            if self.warnings:
                lines.append(f"⚠️  WARNINGS ({len(self.warnings)}):")
                lines.append("-"*80)
                for warning in self.warnings:
                    lines.append(f"  • {warning}")
                lines.append("")

        lines.append("="*80)
        return '\n'.join(lines)

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Schema.org Validator')
    parser.add_argument('files', nargs='+', help='Files to validate')
    parser.add_argument('--json', action='store_true', help='Validate pure JSON-LD files')

    args = parser.parse_args()

    validator = SchemaValidator()

    print("="*80)
    print("Schema.org Markup Validator")
    print("="*80)

    all_valid = True
    for file_path in args.files:
        path = Path(file_path)

        if args.json or path.suffix == '.jsonld' or path.suffix == '.json':
            is_valid = validator.validate_json_file(path)
        else:
            is_valid = validator.validate_file(path)

        all_valid &= is_valid

    print("\n" + validator.generate_report())

    return 0 if all_valid else 1

if __name__ == '__main__':
    exit(main())
