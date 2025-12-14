#!/usr/bin/env python3
"""
Unit tests for src/validators/schema.py - Schema.org JSON-LD Validator
"""

import unittest
import tempfile
import json
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.validators.schema import SchemaValidator


class TestSchemaValidatorInit(unittest.TestCase):
    """Test SchemaValidator initialization"""

    def test_init_creates_empty_errors_and_warnings(self):
        """Test that validator initializes with empty error/warning lists"""
        validator = SchemaValidator()

        self.assertEqual(validator.errors, [])
        self.assertEqual(validator.warnings, [])

    def test_init_has_valid_types(self):
        """Test that validator has valid schema.org types"""
        validator = SchemaValidator()

        self.assertIn('SoftwareSourceCode', validator.valid_types)
        self.assertIn('SoftwareApplication', validator.valid_types)
        self.assertIn('Dataset', validator.valid_types)
        self.assertIn('TechArticle', validator.valid_types)


class TestValidateSchema(unittest.TestCase):
    """Test validate_schema method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_valid_software_source_code_schema(self):
        """Test validating a valid SoftwareSourceCode schema"""
        schema = {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": "Test Project",
            "description": "A test project",
            "programmingLanguage": [{"@type": "ComputerLanguage", "name": "Python"}],
            "codeRepository": "https://github.com/user/repo"
        }

        result = self.validator.validate_schema(schema)

        self.assertTrue(result)
        self.assertEqual(len(self.validator.errors), 0)

    def test_missing_type_adds_error(self):
        """Test that missing @type adds an error"""
        schema = {
            "@context": "https://schema.org",
            "name": "Test"
        }

        result = self.validator.validate_schema(schema)

        self.assertFalse(result)
        self.assertTrue(any("Missing @type" in e for e in self.validator.errors))

    def test_invalid_context_adds_warning(self):
        """Test that non-standard @context adds a warning"""
        schema = {
            "@context": "http://schema.org",  # Not https
            "@type": "SoftwareSourceCode"
        }

        self.validator.validate_schema(schema)

        self.assertTrue(any("@context should be 'https://schema.org'" in w
                           for w in self.validator.warnings))

    def test_uncommon_type_adds_warning(self):
        """Test that uncommon @type adds a warning"""
        schema = {
            "@type": "UnknownType"
        }

        self.validator.validate_schema(schema)

        self.assertTrue(any("Uncommon @type" in w for w in self.validator.warnings))


class TestValidateSoftwareSourceCode(unittest.TestCase):
    """Test _validate_software_source_code method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_missing_recommended_properties_adds_warnings(self):
        """Test that missing recommended properties add warnings"""
        schema = {
            "@type": "SoftwareSourceCode"
        }

        self.validator.validate_schema(schema)

        # Should warn about name, description, programmingLanguage
        self.assertTrue(any("'name' missing" in w for w in self.validator.warnings))
        self.assertTrue(any("'description' missing" in w for w in self.validator.warnings))
        self.assertTrue(any("'programmingLanguage' missing" in w for w in self.validator.warnings))

    def test_invalid_code_repository_url_adds_error(self):
        """Test that invalid codeRepository URL adds an error"""
        schema = {
            "@type": "SoftwareSourceCode",
            "name": "Test",
            "codeRepository": "not-a-valid-url"
        }

        result = self.validator.validate_schema(schema)

        self.assertFalse(result)
        self.assertTrue(any("codeRepository should be a valid URL" in e
                           for e in self.validator.errors))

    def test_valid_code_repository_url(self):
        """Test that valid codeRepository URL passes"""
        schema = {
            "@type": "SoftwareSourceCode",
            "name": "Test",
            "description": "Test description",
            "programmingLanguage": "Python",
            "codeRepository": "https://github.com/user/repo"
        }

        result = self.validator.validate_schema(schema)

        self.assertTrue(result)
        self.assertFalse(any("codeRepository" in e for e in self.validator.errors))


class TestValidateDataset(unittest.TestCase):
    """Test _validate_dataset method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_valid_dataset_schema(self):
        """Test validating a valid Dataset schema"""
        schema = {
            "@type": "Dataset",
            "name": "Test Dataset",
            "description": "A test dataset"
        }

        result = self.validator.validate_schema(schema)

        self.assertTrue(result)
        self.assertEqual(len(self.validator.errors), 0)

    def test_missing_name_adds_error(self):
        """Test that missing name adds an error"""
        schema = {
            "@type": "Dataset",
            "description": "A test dataset"
        }

        result = self.validator.validate_schema(schema)

        self.assertFalse(result)
        self.assertTrue(any("'name' missing from Dataset" in e
                           for e in self.validator.errors))

    def test_missing_description_adds_error(self):
        """Test that missing description adds an error"""
        schema = {
            "@type": "Dataset",
            "name": "Test Dataset"
        }

        result = self.validator.validate_schema(schema)

        self.assertFalse(result)
        self.assertTrue(any("'description' missing from Dataset" in e
                           for e in self.validator.errors))


class TestValidateTechArticle(unittest.TestCase):
    """Test _validate_tech_article method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_valid_tech_article_schema(self):
        """Test validating a valid TechArticle schema"""
        schema = {
            "@type": "TechArticle",
            "name": "How to Code",
            "description": "A tutorial",
            "datePublished": "2024-01-15"
        }

        result = self.validator.validate_schema(schema)

        self.assertTrue(result)

    def test_missing_recommended_adds_warnings(self):
        """Test that missing recommended properties add warnings"""
        schema = {
            "@type": "TechArticle"
        }

        self.validator.validate_schema(schema)

        self.assertTrue(any("'name' missing" in w for w in self.validator.warnings))
        self.assertTrue(any("'datePublished' missing" in w for w in self.validator.warnings))


class TestValidateFile(unittest.TestCase):
    """Test validate_file method for HTML/Markdown files"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_valid_file_with_jsonld(self):
        """Test validating file with valid JSON-LD"""
        test_file = Path(self.temp_dir) / "test.html"
        content = '''<!DOCTYPE html>
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Test",
  "description": "Test project",
  "programmingLanguage": "Python"
}
</script>
</head>
<body>Content</body>
</html>'''
        test_file.write_text(content)

        result = self.validator.validate_file(test_file)

        self.assertTrue(result)

    def test_file_with_no_schema(self):
        """Test validating file with no schema.org markup"""
        test_file = Path(self.temp_dir) / "test.html"
        test_file.write_text("<html><body>No schema here</body></html>")

        result = self.validator.validate_file(test_file)

        self.assertTrue(result)  # No schema is not an error
        self.assertTrue(any("No schema.org markup found" in w
                           for w in self.validator.warnings))

    def test_file_with_invalid_json(self):
        """Test validating file with invalid JSON"""
        test_file = Path(self.temp_dir) / "test.html"
        content = '''<script type="application/ld+json">
{not valid json}
</script>'''
        test_file.write_text(content)

        result = self.validator.validate_file(test_file)

        self.assertFalse(result)
        self.assertTrue(any("Invalid JSON" in e for e in self.validator.errors))

    def test_nonexistent_file(self):
        """Test validating non-existent file"""
        test_file = Path(self.temp_dir) / "nonexistent.html"

        result = self.validator.validate_file(test_file)

        self.assertFalse(result)
        self.assertTrue(any("Error reading file" in e for e in self.validator.errors))

    def test_file_with_multiple_schemas(self):
        """Test validating file with multiple JSON-LD schemas"""
        test_file = Path(self.temp_dir) / "test.html"
        content = '''<!DOCTYPE html>
<html>
<head>
<script type="application/ld+json">
{"@type": "SoftwareSourceCode", "name": "Test1", "description": "Desc1", "programmingLanguage": "Python"}
</script>
<script type="application/ld+json">
{"@type": "Dataset", "name": "Test2", "description": "Desc2"}
</script>
</head>
</html>'''
        test_file.write_text(content)

        result = self.validator.validate_file(test_file)

        self.assertTrue(result)


class TestValidateJsonFile(unittest.TestCase):
    """Test validate_json_file method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_valid_jsonld_file(self):
        """Test validating pure JSON-LD file"""
        test_file = Path(self.temp_dir) / "test.jsonld"
        data = {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": "Test",
            "description": "Test project",
            "programmingLanguage": "Python"
        }
        with open(test_file, 'w') as f:
            json.dump(data, f)

        result = self.validator.validate_json_file(test_file)

        self.assertTrue(result)

    def test_jsonld_with_graph(self):
        """Test validating JSON-LD with @graph"""
        test_file = Path(self.temp_dir) / "test.jsonld"
        data = {
            "@context": "https://schema.org",
            "@graph": [
                {"@type": "SoftwareSourceCode", "name": "Test1", "description": "D1", "programmingLanguage": "Py"},
                {"@type": "Dataset", "name": "Test2", "description": "D2"}
            ]
        }
        with open(test_file, 'w') as f:
            json.dump(data, f)

        result = self.validator.validate_json_file(test_file)

        self.assertTrue(result)

    def test_inventory_schema_format(self):
        """Test validating inventory schema format with embedded schema.org"""
        test_file = Path(self.temp_dir) / "schemas.json"
        data = {
            "@context": "https://schema.org",
            "directories": {
                "src": {
                    "path": "/test/src",
                    "schema_org": {
                        "@context": "https://schema.org",
                        "@type": "SoftwareSourceCode",
                        "name": "Source",
                        "description": "Source code",
                        "programmingLanguage": "TypeScript"
                    },
                    "files": [
                        {"@type": "SoftwareSourceCode", "path": "file.ts"}
                    ]
                }
            }
        }
        with open(test_file, 'w') as f:
            json.dump(data, f)

        result = self.validator.validate_json_file(test_file)

        self.assertTrue(result)

    def test_invalid_json_file(self):
        """Test validating invalid JSON file"""
        test_file = Path(self.temp_dir) / "invalid.json"
        test_file.write_text("{invalid json")

        result = self.validator.validate_json_file(test_file)

        self.assertFalse(result)
        self.assertTrue(any("Invalid JSON" in e for e in self.validator.errors))

    def test_nonexistent_json_file(self):
        """Test validating non-existent JSON file"""
        test_file = Path(self.temp_dir) / "nonexistent.json"

        result = self.validator.validate_json_file(test_file)

        self.assertFalse(result)
        self.assertTrue(any("Error" in e for e in self.validator.errors))

    def test_inventory_with_uncommon_file_type(self):
        """Test inventory format with uncommon @type in files"""
        test_file = Path(self.temp_dir) / "schemas.json"
        data = {
            "directories": {
                "src": {
                    "files": [
                        {"@type": "UnknownFileType", "path": "file.xyz"}
                    ]
                }
            }
        }
        with open(test_file, 'w') as f:
            json.dump(data, f)

        self.validator.validate_json_file(test_file)

        self.assertTrue(any("Uncommon @type" in w for w in self.validator.warnings))


class TestGenerateReport(unittest.TestCase):
    """Test generate_report method"""

    def test_report_no_errors_or_warnings(self):
        """Test report generation with no errors or warnings"""
        validator = SchemaValidator()

        report = validator.generate_report()

        self.assertIn("All schemas are valid", report)
        self.assertIn("SCHEMA.ORG VALIDATION REPORT", report)

    def test_report_with_errors(self):
        """Test report generation with errors"""
        validator = SchemaValidator()
        validator.errors = ["Error 1", "Error 2"]

        report = validator.generate_report()

        self.assertIn("ERRORS (2)", report)
        self.assertIn("Error 1", report)
        self.assertIn("Error 2", report)

    def test_report_with_warnings(self):
        """Test report generation with warnings"""
        validator = SchemaValidator()
        validator.warnings = ["Warning 1", "Warning 2", "Warning 3"]

        report = validator.generate_report()

        self.assertIn("WARNINGS (3)", report)
        self.assertIn("Warning 1", report)
        self.assertIn("Warning 2", report)
        self.assertIn("Warning 3", report)

    def test_report_with_both_errors_and_warnings(self):
        """Test report generation with both errors and warnings"""
        validator = SchemaValidator()
        validator.errors = ["Critical error"]
        validator.warnings = ["Minor warning"]

        report = validator.generate_report()

        self.assertIn("ERRORS (1)", report)
        self.assertIn("WARNINGS (1)", report)
        self.assertIn("Critical error", report)
        self.assertIn("Minor warning", report)


class TestValidateUrlFormat(unittest.TestCase):
    """Test _validate_url_format method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_valid_https_url(self):
        """Test validation of valid HTTPS URL"""
        result = self.validator._validate_url_format(
            "https://example.com", "test", "field"
        )

        self.assertTrue(result)
        self.assertEqual(len(self.validator.errors), 0)

    def test_valid_http_url(self):
        """Test validation of valid HTTP URL"""
        result = self.validator._validate_url_format(
            "http://example.com", "test", "field"
        )

        self.assertTrue(result)

    def test_invalid_url_no_protocol(self):
        """Test validation of URL without protocol"""
        result = self.validator._validate_url_format(
            "example.com", "test", "field"
        )

        self.assertFalse(result)
        self.assertTrue(any("should be a valid URL" in e for e in self.validator.errors))

    def test_empty_url(self):
        """Test validation of empty URL"""
        result = self.validator._validate_url_format("", "test", "field")

        self.assertFalse(result)

    def test_none_url(self):
        """Test validation of None URL"""
        result = self.validator._validate_url_format(None, "test", "field")

        self.assertFalse(result)


class TestExtractJsonldScripts(unittest.TestCase):
    """Test _extract_jsonld_scripts method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_extract_single_script(self):
        """Test extracting single JSON-LD script"""
        content = '''<script type="application/ld+json">
{"@type": "Test"}
</script>'''

        result = self.validator._extract_jsonld_scripts(content)

        self.assertEqual(len(result), 1)
        self.assertIn("Test", result[0])

    def test_extract_multiple_scripts(self):
        """Test extracting multiple JSON-LD scripts"""
        content = '''<script type="application/ld+json">
{"@type": "Test1"}
</script>
<script type="application/ld+json">
{"@type": "Test2"}
</script>'''

        result = self.validator._extract_jsonld_scripts(content)

        self.assertEqual(len(result), 2)

    def test_extract_no_scripts(self):
        """Test extracting from content with no JSON-LD"""
        content = '<html><body>No scripts here</body></html>'

        result = self.validator._extract_jsonld_scripts(content)

        self.assertEqual(result, [])

    def test_extract_ignores_other_scripts(self):
        """Test that extraction ignores non-JSON-LD scripts"""
        content = '''<script type="text/javascript">
console.log("hello");
</script>
<script type="application/ld+json">
{"@type": "Test"}
</script>'''

        result = self.validator._extract_jsonld_scripts(content)

        self.assertEqual(len(result), 1)
        self.assertIn("Test", result[0])


class TestCheckRecommendedProperties(unittest.TestCase):
    """Test _check_recommended_properties method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_all_properties_present(self):
        """Test with all recommended properties present"""
        schema = {"name": "Test", "description": "Desc", "version": "1.0"}

        self.validator._check_recommended_properties(
            schema, "test", ["name", "description", "version"]
        )

        self.assertEqual(len(self.validator.warnings), 0)

    def test_some_properties_missing(self):
        """Test with some recommended properties missing"""
        schema = {"name": "Test"}

        self.validator._check_recommended_properties(
            schema, "test", ["name", "description", "version"]
        )

        self.assertEqual(len(self.validator.warnings), 2)
        self.assertTrue(any("description" in w for w in self.validator.warnings))
        self.assertTrue(any("version" in w for w in self.validator.warnings))

    def test_all_properties_missing(self):
        """Test with all recommended properties missing"""
        schema = {}

        self.validator._check_recommended_properties(
            schema, "test", ["name", "description"]
        )

        self.assertEqual(len(self.validator.warnings), 2)


class TestValidateByType(unittest.TestCase):
    """Test _validate_by_type routing method"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_routes_to_software_source_code(self):
        """Test routing to SoftwareSourceCode validation"""
        schema = {
            "@type": "SoftwareSourceCode",
            "name": "Test",
            "description": "Desc",
            "programmingLanguage": "Python"
        }

        result = self.validator._validate_by_type(schema, "test")

        self.assertTrue(result)

    def test_routes_to_dataset(self):
        """Test routing to Dataset validation"""
        schema = {
            "@type": "Dataset",
            "name": "Test",
            "description": "Desc"
        }

        result = self.validator._validate_by_type(schema, "test")

        self.assertTrue(result)

    def test_routes_to_tech_article(self):
        """Test routing to TechArticle validation"""
        schema = {
            "@type": "TechArticle",
            "name": "Test",
            "description": "Desc",
            "datePublished": "2024-01-01"
        }

        result = self.validator._validate_by_type(schema, "test")

        self.assertTrue(result)

    def test_unknown_type_returns_true(self):
        """Test that unknown types return True (pass through)"""
        schema = {
            "@type": "CustomType"
        }

        result = self.validator._validate_by_type(schema, "test")

        self.assertTrue(result)


class TestValidatorContext(unittest.TestCase):
    """Test context string handling in validation"""

    def setUp(self):
        """Set up test fixtures"""
        self.validator = SchemaValidator()

    def test_custom_context_in_errors(self):
        """Test that custom context appears in error messages"""
        schema = {}  # Missing @type

        self.validator.validate_schema(schema, context="my_custom_context")

        self.assertTrue(any("my_custom_context" in e for e in self.validator.errors))

    def test_nested_context(self):
        """Test nested context strings"""
        schema = {"@type": "Dataset"}  # Missing name and description

        self.validator.validate_schema(schema, context="file.json[dir1]")

        # Errors should reference the nested context
        self.assertTrue(any("file.json[dir1]" in e for e in self.validator.errors))


class TestValidatorResetState(unittest.TestCase):
    """Test that validator state accumulates correctly"""

    def test_errors_accumulate(self):
        """Test that errors accumulate across multiple validations"""
        validator = SchemaValidator()

        validator.validate_schema({})  # Missing @type
        validator.validate_schema({})  # Missing @type again

        self.assertEqual(len(validator.errors), 2)

    def test_warnings_accumulate(self):
        """Test that warnings accumulate across multiple validations"""
        validator = SchemaValidator()

        validator.validate_schema({"@type": "UnknownType1"})
        validator.validate_schema({"@type": "UnknownType2"})

        self.assertGreaterEqual(len(validator.warnings), 2)


if __name__ == '__main__':
    unittest.main()
