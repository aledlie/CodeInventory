#!/usr/bin/env python3
"""
Unit tests for schema_generator_enhanced.py
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from schema_generator_enhanced import (
    EnhancedSchemaGenerator,
    AstGrepHelper,
    SchemaOrgGenerator,
    FunctionDef,
    ClassDef,
    FileDef,
    DirectorySchema
)

class TestAstGrepHelper(unittest.TestCase):
    """Test AstGrepHelper class"""

    def test_check_available(self):
        """Test ast-grep availability check"""
        result = AstGrepHelper.check_available()
        self.assertIsInstance(result, bool)

    def test_find_pattern_with_valid_file(self):
        """Test pattern finding with valid file"""
        # Create a test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write("def test_function():\n    pass\n")
            test_file = Path(f.name)

        try:
            # This may return empty if ast-grep not available
            result = AstGrepHelper.find_pattern(test_file, "def $NAME($$$):", "python")
            self.assertIsInstance(result, list)
        finally:
            test_file.unlink()

class TestSchemaOrgGenerator(unittest.TestCase):
    """Test SchemaOrgGenerator class"""

    def test_generate_software_source_code(self):
        """Test SoftwareSourceCode schema generation"""
        dir_schema = DirectorySchema(path="/test/path")

        # Add some test data
        file_def = FileDef(path="/test/file.py", language="python")
        file_def.classes.append(ClassDef(name="TestClass", bases=[], line_number=1))
        file_def.functions.append(FunctionDef(name="test_func", args=[], line_number=10))
        dir_schema.files.append(file_def)

        schema = SchemaOrgGenerator.generate_software_source_code(dir_schema, "TestDir")

        self.assertEqual(schema["@context"], "https://schema.org")
        self.assertEqual(schema["@type"], "SoftwareSourceCode")
        self.assertEqual(schema["name"], "TestDir")
        self.assertIn("programmingLanguage", schema)
        self.assertIn("featureList", schema)

    def test_generate_jsonld_script(self):
        """Test JSON-LD script tag generation"""
        schema = {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": "Test"
        }

        script = SchemaOrgGenerator.generate_jsonld_script(schema)

        self.assertIn('<script type="application/ld+json">', script)
        self.assertIn('</script>', script)
        self.assertIn('"@context": "https://schema.org"', script)

class TestEnhancedSchemaGenerator(unittest.TestCase):
    """Test EnhancedSchemaGenerator class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EnhancedSchemaGenerator(self.temp_dir, use_astgrep=False)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test generator initialization"""
        self.assertEqual(self.generator.root_path, Path(self.temp_dir))
        self.assertIsInstance(self.generator.schemas, dict)
        self.assertFalse(self.generator.use_astgrep)  # We disabled it

    def test_extract_python_schema(self):
        """Test Python schema extraction"""
        # Create a test Python file
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("""
def test_function(arg1, arg2):
    '''Test function'''
    return arg1 + arg2

class TestClass:
    '''Test class'''
    def method(self):
        pass
""")

        schema = self.generator.extract_python_schema(test_file)

        self.assertEqual(schema.language, "python")
        self.assertEqual(len(schema.functions), 1)
        self.assertEqual(schema.functions[0].name, "test_function")
        self.assertEqual(len(schema.classes), 1)
        self.assertEqual(schema.classes[0].name, "TestClass")

    def test_extract_typescript_schema_regex(self):
        """Test TypeScript schema extraction with regex fallback"""
        test_file = Path(self.temp_dir) / "test.ts"
        test_file.write_text("""
export interface User {
    id: number;
    name: string;
}

export class UserService {
    getUser(id: number): User {
        return { id, name: 'Test' };
    }
}

export function processUser(user: User): void {
    console.log(user);
}
""")

        schema = self.generator.extract_typescript_schema_regex(test_file)

        self.assertEqual(schema.language, "typescript")
        self.assertGreater(len(schema.classes), 0)
        self.assertGreater(len(schema.functions), 0)

    def test_scan_directory(self):
        """Test directory scanning"""
        # Create test structure
        test_file = Path(self.temp_dir) / "test.py"
        test_file.write_text("def test(): pass")

        subdir = Path(self.temp_dir) / "subdir"
        subdir.mkdir()

        schema = self.generator.scan_directory(Path(self.temp_dir))

        self.assertEqual(schema.path, str(self.temp_dir))
        self.assertGreater(len(schema.files), 0)
        self.assertIn("subdir", schema.subdirectories)

    def test_generate_readme(self):
        """Test README generation"""
        dir_schema = DirectorySchema(path="/test")
        file_def = FileDef(path="/test/file.py", language="python")
        file_def.functions.append(FunctionDef(name="test", args=[], line_number=1))
        dir_schema.files.append(file_def)

        # Add schema.org markup
        dir_schema.schema_org_markup = SchemaOrgGenerator.generate_software_source_code(dir_schema, "test")

        readme = self.generator.generate_readme("test", dir_schema, include_schema_org=True)

        self.assertIn("# test", readme)
        self.assertIn('<script type="application/ld+json">', readme)
        self.assertIn("## Files and Schemas", readme)

    def test_save_schemas_json(self):
        """Test saving schemas to JSON"""
        # Add test data
        dir_schema = DirectorySchema(path="/test")
        file_def = FileDef(path="/test/file.py", language="python")
        dir_schema.files.append(file_def)
        self.generator.schemas["."] = dir_schema

        output_file = Path(self.temp_dir) / "test_schemas.json"
        self.generator.save_schemas_json(output_file, include_schema_org=True)

        self.assertTrue(output_file.exists())

        with open(output_file, 'r') as f:
            data = json.load(f)

        self.assertIn("@context", data)
        self.assertIn("directories", data)

class TestDataClasses(unittest.TestCase):
    """Test data classes"""

    def test_function_def(self):
        """Test FunctionDef dataclass"""
        func = FunctionDef(
            name="test_func",
            args=["arg1", "arg2"],
            return_type="int",
            line_number=10,
            is_async=True,
            is_exported=True
        )

        self.assertEqual(func.name, "test_func")
        self.assertEqual(len(func.args), 2)
        self.assertTrue(func.is_async)
        self.assertTrue(func.is_exported)

    def test_class_def(self):
        """Test ClassDef dataclass"""
        cls = ClassDef(
            name="TestClass",
            bases=["BaseClass"],
            line_number=5,
            is_exported=True
        )

        self.assertEqual(cls.name, "TestClass")
        self.assertEqual(cls.bases, ["BaseClass"])
        self.assertEqual(len(cls.methods), 0)

    def test_file_def(self):
        """Test FileDef dataclass"""
        file_def = FileDef(
            path="/test/file.py",
            language="python"
        )

        self.assertEqual(file_def.path, "/test/file.py")
        self.assertEqual(file_def.language, "python")
        self.assertEqual(file_def.schema_org_type, "SoftwareSourceCode")

    def test_directory_schema(self):
        """Test DirectorySchema dataclass"""
        schema = DirectorySchema(
            path="/test",
            has_git=True,
            git_remote="https://github.com/user/repo.git"
        )

        self.assertEqual(schema.path, "/test")
        self.assertTrue(schema.has_git)
        self.assertIsNotNone(schema.git_remote)

if __name__ == '__main__':
    unittest.main()
