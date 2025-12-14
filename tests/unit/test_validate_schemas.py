#!/usr/bin/env python3
"""
Unit tests for validate_schemas.py
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.validators.schema import SchemaValidator

class TestSchemaValidator(unittest.TestCase):
    """Test SchemaValidator class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.validator = SchemaValidator()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test validator initialization"""
        self.assertEqual(len(self.validator.errors), 0)
        self.assertEqual(len(self.validator.warnings), 0)
        self.assertGreater(len(self.validator.valid_types), 0)

    def test_validate_valid_schema(self):
        """Test validating a valid schema"""
        valid_schema = {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": "Test Project",
            "description": "A test project",
            "programmingLanguage": "Python"
        }

        result = self.validator.validate_schema(valid_schema)

        self.assertTrue(result)
        self.assertEqual(len(self.validator.errors), 0)

    def test_validate_schema_missing_type(self):
        """Test validating schema missing @type"""
        invalid_schema = {
            "@context": "https://schema.org",
            "name": "Test"
        }

        result = self.validator.validate_schema(invalid_schema)

        self.assertFalse(result)
        self.assertGreater(len(self.validator.errors), 0)

    def test_validate_software_source_code(self):
        """Test validating SoftwareSourceCode schema"""
        schema = {
            "@type": "SoftwareSourceCode",
            "name": "My Project"
        }

        self.validator._validate_software_source_code(schema, "test")

        # Should have warnings for missing recommended properties
        self.assertGreater(len(self.validator.warnings), 0)

    def test_validate_dataset(self):
        """Test validating Dataset schema"""
        # Missing required properties
        schema = {
            "@type": "Dataset"
        }

        result = self.validator._validate_dataset(schema, "test")

        self.assertFalse(result)

        # Valid dataset
        self.validator.errors.clear()
        valid_schema = {
            "@type": "Dataset",
            "name": "Test Dataset",
            "description": "A test dataset"
        }

        result = self.validator._validate_dataset(valid_schema, "test")
        self.assertTrue(result)

    def test_validate_file_with_schema(self):
        """Test validating file with schema.org markup"""
        test_file = Path(self.temp_dir) / "test.md"
        test_file.write_text("""
# Test

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Test"
}
</script>
""")

        result = self.validator.validate_file(test_file)

        self.assertTrue(result)

    def test_validate_file_without_schema(self):
        """Test validating file without schema markup"""
        test_file = Path(self.temp_dir) / "test.md"
        test_file.write_text("# Test\n\nNo schema here")

        result = self.validator.validate_file(test_file)

        # Should be true but with warning
        self.assertTrue(result)
        self.assertGreater(len(self.validator.warnings), 0)

    def test_validate_file_with_invalid_json(self):
        """Test validating file with invalid JSON"""
        test_file = Path(self.temp_dir) / "test.md"
        test_file.write_text("""
<script type="application/ld+json">
{
  invalid json
}
</script>
""")

        result = self.validator.validate_file(test_file)

        self.assertFalse(result)
        self.assertGreater(len(self.validator.errors), 0)

    def test_validate_json_file(self):
        """Test validating pure JSON-LD file"""
        test_file = Path(self.temp_dir) / "schema.jsonld"
        with open(test_file, 'w') as f:
            json.dump({
                "@context": "https://schema.org",
                "@type": "SoftwareSourceCode",
                "name": "Test"
            }, f)

        result = self.validator.validate_json_file(test_file)

        self.assertTrue(result)

    def test_validate_json_file_with_graph(self):
        """Test validating JSON-LD file with @graph"""
        test_file = Path(self.temp_dir) / "schema.jsonld"
        with open(test_file, 'w') as f:
            json.dump({
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "SoftwareSourceCode",
                        "name": "Test 1"
                    },
                    {
                        "@type": "Dataset",
                        "name": "Test 2",
                        "description": "Test"
                    }
                ]
            }, f)

        result = self.validator.validate_json_file(test_file)

        # Both schemas should be validated
        self.assertTrue(result)

    def test_generate_report(self):
        """Test report generation"""
        # Add some errors and warnings
        self.validator.errors.append("Test error")
        self.validator.warnings.append("Test warning")

        report = self.validator.generate_report()

        self.assertIn("SCHEMA.ORG VALIDATION REPORT", report)
        self.assertIn("ERRORS", report)
        self.assertIn("WARNINGS", report)
        self.assertIn("Test error", report)
        self.assertIn("Test warning", report)

    def test_generate_report_no_issues(self):
        """Test report generation with no issues"""
        report = self.validator.generate_report()

        self.assertIn("All schemas are valid", report)

    def test_invalid_context(self):
        """Test schema with invalid context"""
        schema = {
            "@context": "https://wrong-url.com",
            "@type": "SoftwareSourceCode",
            "name": "Test"
        }

        self.validator.validate_schema(schema)

        # Should have warning about context
        warnings = [w for w in self.validator.warnings if "context" in w.lower()]
        self.assertGreater(len(warnings), 0)

class TestSchemaValidatorPrivateMethods(unittest.TestCase):
    """Test SchemaValidator private methods"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.validator = SchemaValidator()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_validate_context_correct(self):
        """Test _validate_context with correct context"""
        schema = {"@context": "https://schema.org"}
        self.validator._validate_context(schema, "test")
        self.assertEqual(len(self.validator.warnings), 0)

    def test_validate_context_incorrect(self):
        """Test _validate_context with incorrect context"""
        schema = {"@context": "https://wrong-url.com"}
        self.validator._validate_context(schema, "test")
        self.assertGreater(len(self.validator.warnings), 0)

    def test_validate_context_missing(self):
        """Test _validate_context with missing context"""
        schema = {}
        self.validator._validate_context(schema, "test")
        # Should not add warning for missing context
        self.assertEqual(len(self.validator.warnings), 0)

    def test_validate_type_valid(self):
        """Test _validate_type with valid type"""
        schema = {"@type": "SoftwareSourceCode"}
        result = self.validator._validate_type(schema, "test")
        self.assertTrue(result)
        self.assertEqual(len(self.validator.errors), 0)

    def test_validate_type_missing(self):
        """Test _validate_type with missing type"""
        schema = {}
        result = self.validator._validate_type(schema, "test")
        self.assertFalse(result)
        self.assertGreater(len(self.validator.errors), 0)

    def test_validate_type_uncommon(self):
        """Test _validate_type with uncommon type"""
        schema = {"@type": "UnknownType"}
        result = self.validator._validate_type(schema, "test")
        self.assertTrue(result)  # Valid but uncommon
        self.assertGreater(len(self.validator.warnings), 0)

    def test_validate_url_format_valid_https(self):
        """Test _validate_url_format with valid HTTPS URL"""
        result = self.validator._validate_url_format(
            "https://github.com/user/repo", "test", "codeRepository"
        )
        self.assertTrue(result)

    def test_validate_url_format_valid_http(self):
        """Test _validate_url_format with valid HTTP URL"""
        result = self.validator._validate_url_format(
            "http://example.com", "test", "field"
        )
        self.assertTrue(result)

    def test_validate_url_format_invalid(self):
        """Test _validate_url_format with invalid URL"""
        result = self.validator._validate_url_format(
            "not-a-url", "test", "field"
        )
        self.assertFalse(result)
        self.assertGreater(len(self.validator.errors), 0)

    def test_validate_url_format_empty(self):
        """Test _validate_url_format with empty URL"""
        result = self.validator._validate_url_format(
            "", "test", "field"
        )
        self.assertFalse(result)

    def test_check_recommended_properties_all_present(self):
        """Test _check_recommended_properties with all properties present"""
        schema = {"name": "Test", "description": "Desc", "programmingLanguage": "Python"}
        self.validator._check_recommended_properties(
            schema, "test", ["name", "description", "programmingLanguage"]
        )
        self.assertEqual(len(self.validator.warnings), 0)

    def test_check_recommended_properties_missing(self):
        """Test _check_recommended_properties with missing properties"""
        schema = {"name": "Test"}
        self.validator._check_recommended_properties(
            schema, "test", ["name", "description", "programmingLanguage"]
        )
        # Should have 2 warnings for missing properties
        self.assertEqual(len(self.validator.warnings), 2)

    def test_read_file_content_success(self):
        """Test _read_file_content with valid file"""
        test_file = Path(self.temp_dir) / "test.txt"
        test_file.write_text("test content")

        content = self.validator._read_file_content(test_file)

        self.assertEqual(content, "test content")

    def test_read_file_content_nonexistent(self):
        """Test _read_file_content with non-existent file"""
        test_file = Path(self.temp_dir) / "nonexistent.txt"

        content = self.validator._read_file_content(test_file)

        self.assertIsNone(content)
        self.assertGreater(len(self.validator.errors), 0)

    def test_extract_jsonld_scripts_found(self):
        """Test _extract_jsonld_scripts with scripts present"""
        content = '''
<script type="application/ld+json">
{"@type": "SoftwareSourceCode", "name": "Test"}
</script>
'''
        matches = self.validator._extract_jsonld_scripts(content)
        self.assertEqual(len(matches), 1)

    def test_extract_jsonld_scripts_multiple(self):
        """Test _extract_jsonld_scripts with multiple scripts"""
        content = '''
<script type="application/ld+json">
{"@type": "SoftwareSourceCode"}
</script>
<script type="application/ld+json">
{"@type": "Dataset"}
</script>
'''
        matches = self.validator._extract_jsonld_scripts(content)
        self.assertEqual(len(matches), 2)

    def test_extract_jsonld_scripts_none(self):
        """Test _extract_jsonld_scripts with no scripts"""
        content = "No JSON-LD here"
        matches = self.validator._extract_jsonld_scripts(content)
        self.assertEqual(len(matches), 0)

    def test_load_json_file_success(self):
        """Test _load_json_file with valid JSON"""
        test_file = Path(self.temp_dir) / "test.json"
        with open(test_file, 'w') as f:
            json.dump({"test": "data"}, f)

        data = self.validator._load_json_file(test_file)

        self.assertEqual(data, {"test": "data"})

    def test_load_json_file_invalid_json(self):
        """Test _load_json_file with invalid JSON"""
        test_file = Path(self.temp_dir) / "invalid.json"
        test_file.write_text("{invalid json}")

        data = self.validator._load_json_file(test_file)

        self.assertIsNone(data)
        self.assertGreater(len(self.validator.errors), 0)

    def test_validate_by_type_software_source_code(self):
        """Test _validate_by_type routes to correct validator"""
        schema = {"@type": "SoftwareSourceCode", "name": "Test"}
        result = self.validator._validate_by_type(schema, "test")
        self.assertTrue(result)

    def test_validate_by_type_dataset(self):
        """Test _validate_by_type routes to Dataset validator"""
        schema = {"@type": "Dataset", "name": "Test", "description": "Desc"}
        result = self.validator._validate_by_type(schema, "test")
        self.assertTrue(result)

    def test_validate_by_type_tech_article(self):
        """Test _validate_by_type routes to TechArticle validator"""
        schema = {"@type": "TechArticle", "name": "Test"}
        result = self.validator._validate_by_type(schema, "test")
        self.assertTrue(result)

    def test_validate_by_type_unknown(self):
        """Test _validate_by_type with unknown type"""
        schema = {"@type": "UnknownType"}
        result = self.validator._validate_by_type(schema, "test")
        self.assertTrue(result)  # Unknown types pass through


class TestSchemaValidatorReportFormatting(unittest.TestCase):
    """Test report formatting methods"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_format_header(self):
        """Test _format_header"""
        lines = self.validator._format_header()
        self.assertTrue(any("SCHEMA.ORG VALIDATION REPORT" in line for line in lines))

    def test_format_errors(self):
        """Test _format_errors"""
        self.validator.errors = ["Error 1", "Error 2"]
        lines = self.validator._format_errors()
        self.assertTrue(any("ERRORS" in line for line in lines))
        self.assertTrue(any("Error 1" in line for line in lines))
        self.assertTrue(any("Error 2" in line for line in lines))

    def test_format_warnings(self):
        """Test _format_warnings"""
        self.validator.warnings = ["Warning 1", "Warning 2"]
        lines = self.validator._format_warnings()
        self.assertTrue(any("WARNINGS" in line for line in lines))
        self.assertTrue(any("Warning 1" in line for line in lines))


class TestSchemaValidatorInventoryFormat(unittest.TestCase):
    """Test inventory schema format validation"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.validator = SchemaValidator()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_validate_inventory_schema_valid(self):
        """Test _validate_inventory_schema with valid data"""
        data = {
            "@context": "https://schema.org",
            "directories": {
                "src": {
                    "schema_org": {
                        "@type": "SoftwareSourceCode",
                        "name": "Source"
                    },
                    "files": [
                        {"@type": "SoftwareSourceCode", "path": "src/main.py"}
                    ]
                }
            }
        }

        result = self.validator._validate_inventory_schema(data, Path("/test.json"))
        self.assertTrue(result)

    def test_validate_inventory_schema_invalid_schema_org(self):
        """Test _validate_inventory_schema with invalid schema_org entry"""
        data = {
            "directories": {
                "src": {
                    "schema_org": {
                        # Missing @type
                        "name": "Source"
                    }
                }
            }
        }

        result = self.validator._validate_inventory_schema(data, Path("/test.json"))
        self.assertFalse(result)
        self.assertGreater(len(self.validator.errors), 0)

    def test_validate_inventory_schema_uncommon_file_type(self):
        """Test _validate_inventory_schema with uncommon file @type"""
        data = {
            "directories": {
                "src": {
                    "files": [
                        {"@type": "WeirdType", "path": "src/main.py"}
                    ]
                }
            }
        }

        self.validator._validate_inventory_schema(data, Path("/test.json"))
        # Should have warning about uncommon type
        self.assertGreater(len(self.validator.warnings), 0)

    def test_validate_graph_schemas(self):
        """Test _validate_graph_schemas"""
        graph = [
            {"@type": "SoftwareSourceCode", "name": "Test1"},
            {"@type": "Dataset", "name": "Test2", "description": "Desc"}
        ]

        result = self.validator._validate_graph_schemas(graph, Path("/test.json"))
        self.assertTrue(result)

    def test_validate_graph_schemas_with_invalid(self):
        """Test _validate_graph_schemas with invalid entry"""
        graph = [
            {"@type": "SoftwareSourceCode", "name": "Test1"},
            {"name": "Missing Type"}  # Missing @type
        ]

        result = self.validator._validate_graph_schemas(graph, Path("/test.json"))
        self.assertFalse(result)


class TestSchemaValidatorTechArticle(unittest.TestCase):
    """Test TechArticle validation"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_validate_tech_article_full(self):
        """Test _validate_tech_article with all recommended properties"""
        schema = {
            "@type": "TechArticle",
            "name": "How to Build Apps",
            "description": "A guide to building applications",
            "datePublished": "2024-01-15"
        }

        result = self.validator._validate_tech_article(schema, "test")
        self.assertTrue(result)
        self.assertEqual(len(self.validator.warnings), 0)

    def test_validate_tech_article_minimal(self):
        """Test _validate_tech_article with minimal properties"""
        schema = {"@type": "TechArticle"}

        result = self.validator._validate_tech_article(schema, "test")
        self.assertTrue(result)
        # Should have warnings for missing recommended properties
        self.assertEqual(len(self.validator.warnings), 3)


class TestShouldProcessAsJson(unittest.TestCase):
    """Test _should_process_as_json helper function"""

    def test_json_flag(self):
        """Test with --json flag"""
        from src.validators.schema import _should_process_as_json
        import argparse
        args = argparse.Namespace(json=True)
        path = Path("/test.txt")

        result = _should_process_as_json(path, args)
        self.assertTrue(result)

    def test_jsonld_extension(self):
        """Test with .jsonld extension"""
        from src.validators.schema import _should_process_as_json
        import argparse
        args = argparse.Namespace(json=False)
        path = Path("/test.jsonld")

        result = _should_process_as_json(path, args)
        self.assertTrue(result)

    def test_json_extension(self):
        """Test with .json extension"""
        from src.validators.schema import _should_process_as_json
        import argparse
        args = argparse.Namespace(json=False)
        path = Path("/test.json")

        result = _should_process_as_json(path, args)
        self.assertTrue(result)

    def test_other_extension(self):
        """Test with other extension"""
        from src.validators.schema import _should_process_as_json
        import argparse
        args = argparse.Namespace(json=False)
        path = Path("/test.md")

        result = _should_process_as_json(path, args)
        self.assertFalse(result)


if __name__ == '__main__':
    unittest.main()
