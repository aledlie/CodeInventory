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

from validate_schemas import SchemaValidator

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

if __name__ == '__main__':
    unittest.main()
