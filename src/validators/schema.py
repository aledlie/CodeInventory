#!/usr/bin/env python3
"""
Schema Validator - Validates schema.org JSON-LD markup
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import argparse
import re

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

class SchemaValidator:
    """Validates schema.org markup"""

    def __init__(self) -> None:
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.valid_types = {
            'SoftwareSourceCode', 'SoftwareApplication', 'Dataset', 'TechArticle',
            'HowTo', 'APIReference', 'DataFeed', 'BlogPosting', 'Article',
            'ComputerLanguage', 'Person', 'Organization', 'CreativeWork'
        }

    def validate_schema(self, schema: Dict[str, Any], context: str = "root") -> bool:
        """Validate a schema.org object"""
        is_valid = True

        self._validate_context(schema, context)
        is_valid &= self._validate_type(schema, context)

        if is_valid:
            is_valid &= self._validate_by_type(schema, context)

        return is_valid

    def _validate_context(self, schema: Dict[str, Any], context: str) -> None:
        """Validate @context field"""
        if '@context' in schema:
            if schema['@context'] != 'https://schema.org':
                self.warnings.append(f"{context}: @context should be 'https://schema.org'")

    def _validate_type(self, schema: Dict[str, Any], context: str) -> bool:
        """Validate @type field"""
        if '@type' not in schema:
            self.errors.append(f"{context}: Missing @type")
            return False
        elif schema['@type'] not in self.valid_types:
            self.warnings.append(f"{context}: Uncommon @type '{schema['@type']}'")
        return True

    def _validate_by_type(self, schema: Dict[str, Any], context: str) -> bool:
        """Route validation by schema type"""
        schema_type = schema.get('@type')

        if schema_type == 'SoftwareSourceCode':
            return self._validate_software_source_code(schema, context)
        elif schema_type == 'Dataset':
            return self._validate_dataset(schema, context)
        elif schema_type == 'TechArticle':
            return self._validate_tech_article(schema, context)

        return True

    def _validate_software_source_code(self, schema: Dict[str, Any], context: str) -> bool:
        """Validate SoftwareSourceCode schema"""
        is_valid = True

        self._check_recommended_properties(
            schema, context,
            ['name', 'description', 'programmingLanguage']
        )

        if 'codeRepository' in schema:
            is_valid &= self._validate_url_format(
                schema['codeRepository'], context, 'codeRepository'
            )

        return is_valid

    def _check_recommended_properties(self, schema: Dict[str, Any],
                                     context: str, properties: List[str]) -> None:
        """Check for recommended properties"""
        for prop in properties:
            if prop not in schema:
                self.warnings.append(f"{context}: Recommended property '{prop}' missing")

    def _validate_url_format(self, url: str, context: str, field_name: str) -> bool:
        """Validate URL format"""
        if not url or not (url.startswith('http://') or url.startswith('https://')):
            self.errors.append(f"{context}: {field_name} should be a valid URL")
            return False
        return True

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
        self._check_recommended_properties(
            schema, context + " from TechArticle",
            ['name', 'description', 'datePublished']
        )
        return True

    def validate_file(self, file_path: Path) -> bool:
        """Validate schema.org markup in a file"""
        logger.info(f"\nValidating: {file_path}")

        content = self._read_file_content(file_path)
        if content is None:
            return False

        matches = self._extract_jsonld_scripts(content)
        if not matches:
            self.warnings.append(f"{file_path}: No schema.org markup found")
            return True

        return self._validate_json_schemas(matches, file_path)

    def _read_file_content(self, file_path: Path) -> Optional[str]:
        """Read file content safely"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            self.errors.append(f"{file_path}: Error reading file - {e}")
            return None

    def _extract_jsonld_scripts(self, content: str) -> List[str]:
        """Extract JSON-LD script tags from content"""
        pattern = r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>'
        return re.findall(pattern, content, re.DOTALL)

    def _validate_json_schemas(self, matches: List[str], file_path: Path) -> bool:
        """Validate extracted JSON schemas"""
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

    def validate_json_file(self, file_path: Path) -> bool:
        """Validate pure JSON-LD file"""
        logger.info(f"\nValidating JSON file: {file_path}")

        data = self._load_json_file(file_path)
        if data is None:
            return False

        if '@graph' in data:
            return self._validate_graph_schemas(data['@graph'], file_path)
        else:
            return self.validate_schema(data, str(file_path))

    def _load_json_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Load JSON file safely"""
        try:
            with open(file_path, 'r') as f:
                data: Dict[str, Any] = json.load(f)
                return data
        except json.JSONDecodeError as e:
            self.errors.append(f"{file_path}: Invalid JSON - {e}")
            return None
        except Exception as e:
            self.errors.append(f"{file_path}: Error - {e}")
            return None

    def _validate_graph_schemas(self, graph: List[Dict[str, Any]],
                               file_path: Path) -> bool:
        """Validate schemas in @graph"""
        all_valid = True
        for idx, schema in enumerate(graph, 1):
            is_valid = self.validate_schema(schema, f"{file_path}[@graph[{idx}]]")
            all_valid &= is_valid
        return all_valid

    def generate_report(self) -> str:
        """Generate validation report"""
        lines = self._format_header()

        if not self.errors and not self.warnings:
            lines.append("✅ All schemas are valid!")
        else:
            if self.errors:
                lines.extend(self._format_errors())
            if self.warnings:
                lines.extend(self._format_warnings())

        lines.append("="*80)
        return '\n'.join(lines)

    def _format_header(self) -> List[str]:
        """Format report header"""
        return [
            "="*80,
            "SCHEMA.ORG VALIDATION REPORT",
            "="*80,
            ""
        ]

    def _format_errors(self) -> List[str]:
        """Format error section"""
        lines = [
            f"❌ ERRORS ({len(self.errors)}):",
            "-"*80
        ]
        for error in self.errors:
            lines.append(f"  • {error}")
        lines.append("")
        return lines

    def _format_warnings(self) -> List[str]:
        """Format warning section"""
        lines = [
            f"⚠️  WARNINGS ({len(self.warnings)}):",
            "-"*80
        ]
        for warning in self.warnings:
            lines.append(f"  • {warning}")
        lines.append("")
        return lines

def main() -> int:
    args = _parse_arguments()
    validator = SchemaValidator()

    _print_header()
    all_valid = _process_files(validator, args)

    logger.info("\n" + validator.generate_report())
    return 0 if all_valid else 1

def _parse_arguments() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Schema.org Validator')
    parser.add_argument('files', nargs='+', help='Files to validate')
    parser.add_argument('--json', action='store_true',
                       help='Validate pure JSON-LD files')
    return parser.parse_args()

def _print_header() -> None:
    """Print program header"""
    logger.info("="*80)
    logger.info("Schema.org Markup Validator")
    logger.info("="*80)

def _process_files(validator: SchemaValidator, args: argparse.Namespace) -> bool:
    """Process all input files"""
    all_valid = True

    for file_path in args.files:
        path = Path(file_path)

        if _should_process_as_json(path, args):
            is_valid = validator.validate_json_file(path)
        else:
            is_valid = validator.validate_file(path)

        all_valid &= is_valid

    return all_valid

def _should_process_as_json(path: Path, args: argparse.Namespace) -> bool:
    """Check if file should be processed as JSON"""
    return args.json or path.suffix in ['.jsonld', '.json']

if __name__ == '__main__':
    exit(main())
