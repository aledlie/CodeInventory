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

from src.generators.schema import (
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

class TestConvertGitUrlToHttps(unittest.TestCase):
    """Test convert_git_url_to_https function"""

    def test_https_url_unchanged(self):
        """Test that HTTPS URLs are returned unchanged"""
        from src.generators.schema import convert_git_url_to_https
        url = "https://github.com/user/repo"
        self.assertEqual(convert_git_url_to_https(url), url)

    def test_https_url_with_git_suffix_removed(self):
        """Test that .git suffix is removed from HTTPS URLs"""
        from src.generators.schema import convert_git_url_to_https
        url = "https://github.com/user/repo.git"
        self.assertEqual(convert_git_url_to_https(url), "https://github.com/user/repo")

    def test_http_url_unchanged(self):
        """Test that HTTP URLs are returned unchanged"""
        from src.generators.schema import convert_git_url_to_https
        url = "http://github.com/user/repo"
        self.assertEqual(convert_git_url_to_https(url), url)

    def test_ssh_url_converted(self):
        """Test SSH URL conversion to HTTPS"""
        from src.generators.schema import convert_git_url_to_https
        ssh_url = "git@github.com:user/repo.git"
        expected = "https://github.com/user/repo"
        self.assertEqual(convert_git_url_to_https(ssh_url), expected)

    def test_ssh_url_without_git_suffix(self):
        """Test SSH URL conversion without .git suffix"""
        from src.generators.schema import convert_git_url_to_https
        ssh_url = "git@github.com:user/repo"
        expected = "https://github.com/user/repo"
        self.assertEqual(convert_git_url_to_https(ssh_url), expected)

    def test_git_protocol_url_converted(self):
        """Test git:// protocol URL conversion"""
        from src.generators.schema import convert_git_url_to_https
        git_url = "git://github.com/user/repo.git"
        expected = "https://github.com/user/repo"
        self.assertEqual(convert_git_url_to_https(git_url), expected)

    def test_empty_url_returns_empty(self):
        """Test empty URL returns empty string"""
        from src.generators.schema import convert_git_url_to_https
        self.assertEqual(convert_git_url_to_https(""), "")

    def test_none_url_returns_none(self):
        """Test None URL returns None"""
        from src.generators.schema import convert_git_url_to_https
        self.assertIsNone(convert_git_url_to_https(None))

    def test_unparseable_url_returned_as_is(self):
        """Test unparseable URL is returned unchanged"""
        from src.generators.schema import convert_git_url_to_https
        weird_url = "some://weird/url/format"
        self.assertEqual(convert_git_url_to_https(weird_url), weird_url)

    def test_gitlab_ssh_url(self):
        """Test GitLab SSH URL conversion"""
        from src.generators.schema import convert_git_url_to_https
        ssh_url = "git@gitlab.com:group/project.git"
        expected = "https://gitlab.com/group/project"
        self.assertEqual(convert_git_url_to_https(ssh_url), expected)


class TestAstGrepHelperGetMetaVar(unittest.TestCase):
    """Test AstGrepHelper.get_meta_var method"""

    def test_get_meta_var_new_format_with_text(self):
        """Test extracting meta variable from new format with text property"""
        match = {
            'metaVariables': {
                'single': {
                    'NAME': {'text': 'testFunction'}
                }
            }
        }
        result = AstGrepHelper.get_meta_var(match, 'NAME')
        self.assertEqual(result, 'testFunction')

    def test_get_meta_var_old_format_with_text(self):
        """Test extracting meta variable from old format with text property"""
        match = {
            'metaVariables': {
                'NAME': {'text': 'testFunction'}
            }
        }
        result = AstGrepHelper.get_meta_var(match, 'NAME')
        self.assertEqual(result, 'testFunction')

    def test_get_meta_var_old_format_direct_value(self):
        """Test extracting meta variable from old format with direct value"""
        match = {
            'metaVariables': {
                'NAME': 'testFunction'
            }
        }
        result = AstGrepHelper.get_meta_var(match, 'NAME')
        self.assertEqual(result, 'testFunction')

    def test_get_meta_var_missing_variable(self):
        """Test extracting non-existent meta variable"""
        match = {
            'metaVariables': {
                'single': {
                    'OTHER': {'text': 'value'}
                }
            }
        }
        result = AstGrepHelper.get_meta_var(match, 'NAME')
        self.assertIsNone(result)

    def test_get_meta_var_empty_meta_variables(self):
        """Test extracting from empty metaVariables"""
        match = {'metaVariables': {}}
        result = AstGrepHelper.get_meta_var(match, 'NAME')
        self.assertIsNone(result)

    def test_get_meta_var_no_meta_variables(self):
        """Test extracting when metaVariables key is missing"""
        match = {}
        result = AstGrepHelper.get_meta_var(match, 'NAME')
        self.assertIsNone(result)


class TestEnhancedSchemaGeneratorPrivateMethods(unittest.TestCase):
    """Test EnhancedSchemaGenerator private methods"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EnhancedSchemaGenerator(self.temp_dir, use_astgrep=False)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_get_name_from_ast_name_node(self):
        """Test _get_name with AST Name node"""
        import ast
        node = ast.Name(id='test_var', ctx=ast.Load())
        result = self.generator._get_name(node)
        self.assertEqual(result, 'test_var')

    def test_get_name_from_ast_attribute_node(self):
        """Test _get_name with AST Attribute node"""
        import ast
        # Create self.attribute
        node = ast.Attribute(
            value=ast.Name(id='self', ctx=ast.Load()),
            attr='method',
            ctx=ast.Load()
        )
        result = self.generator._get_name(node)
        self.assertEqual(result, 'self.method')

    def test_get_name_from_ast_subscript_node(self):
        """Test _get_name with AST Subscript node"""
        import ast
        # Create List[int] type hint
        node = ast.Subscript(
            value=ast.Name(id='List', ctx=ast.Load()),
            slice=ast.Index(value=ast.Name(id='int', ctx=ast.Load())),
            ctx=ast.Load()
        )
        result = self.generator._get_name(node)
        self.assertEqual(result, 'List[...]')

    def test_extract_function_with_return_type(self):
        """Test _extract_function with return type annotation"""
        import ast
        code = "def test_func(arg1: int, arg2: str) -> bool:\n    pass"
        tree = ast.parse(code)
        func_node = tree.body[0]
        result = self.generator._extract_function(func_node)

        self.assertEqual(result.name, 'test_func')
        self.assertIn('arg1', result.args)
        self.assertIn('arg2', result.args)
        self.assertEqual(result.return_type, 'bool')

    def test_extract_function_without_return_type(self):
        """Test _extract_function without return type annotation"""
        import ast
        code = "def test_func():\n    pass"
        tree = ast.parse(code)
        func_node = tree.body[0]
        result = self.generator._extract_function(func_node)

        self.assertEqual(result.name, 'test_func')
        self.assertIsNone(result.return_type)

    def test_extract_ts_imports_regex(self):
        """Test _extract_ts_imports_regex"""
        content = '''
import React from 'react';
import { useState, useEffect } from 'react';
import type { FC } from 'react';
'''
        file_def = FileDef(path="/test.ts", language="typescript")
        self.generator._extract_ts_imports_regex(content, file_def)

        self.assertIn('react', file_def.imports)

    def test_extract_ts_classes_regex(self):
        """Test _extract_ts_classes_regex"""
        content = '''
export class UserService {
    getUser(): void {}
}

class InternalClass extends BaseClass {
}
'''
        file_def = FileDef(path="/test.ts", language="typescript")
        self.generator._extract_ts_classes_regex(content, file_def)

        self.assertEqual(len(file_def.classes), 2)
        class_names = [c.name for c in file_def.classes]
        self.assertIn('UserService', class_names)
        self.assertIn('InternalClass', class_names)

    def test_extract_ts_interfaces_regex(self):
        """Test _extract_ts_interfaces_regex"""
        content = '''
export interface User {
    id: number;
}

interface InternalConfig extends BaseConfig {
    timeout: number;
}
'''
        file_def = FileDef(path="/test.ts", language="typescript")
        self.generator._extract_ts_interfaces_regex(content, file_def)

        self.assertEqual(len(file_def.classes), 2)
        class_names = [c.name for c in file_def.classes]
        self.assertIn('User', class_names)
        self.assertIn('InternalConfig', class_names)

    def test_extract_ts_functions_regex(self):
        """Test _extract_ts_functions_regex"""
        content = '''
export function processData(data: any): void {
    console.log(data);
}

async function fetchUser(id: number): Promise<User> {
    return {} as User;
}
'''
        file_def = FileDef(path="/test.ts", language="typescript")
        self.generator._extract_ts_functions_regex(content, file_def)

        self.assertEqual(len(file_def.functions), 2)
        func_names = [f.name for f in file_def.functions]
        self.assertIn('processData', func_names)
        self.assertIn('fetchUser', func_names)

    def test_extract_ts_arrow_functions_regex(self):
        """Test _extract_ts_arrow_functions_regex"""
        content = '''
export const handleClick = () => {
    console.log('clicked');
};

const asyncFetch = async (url: string) => {
    return fetch(url);
};
'''
        file_def = FileDef(path="/test.ts", language="typescript")
        self.generator._extract_ts_arrow_functions_regex(content, file_def)

        self.assertEqual(len(file_def.functions), 2)
        func_names = [f.name for f in file_def.functions]
        self.assertIn('handleClick', func_names)
        self.assertIn('asyncFetch', func_names)


class TestEnhancedSchemaGeneratorReadmeHelpers(unittest.TestCase):
    """Test README generation helper methods"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EnhancedSchemaGenerator(self.temp_dir, use_astgrep=False)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_add_readme_header_with_schema_org(self):
        """Test _add_readme_header with schema.org markup"""
        dir_schema = DirectorySchema(path="/test")
        dir_schema.schema_org_markup = {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": "Test"
        }
        lines = []
        self.generator._add_readme_header(lines, "TestDir", dir_schema, True)

        self.assertIn("# TestDir", lines)
        # Check for JSON-LD script tag
        self.assertTrue(any('<script type="application/ld+json">' in line for line in lines))

    def test_add_readme_header_without_schema_org(self):
        """Test _add_readme_header without schema.org markup"""
        dir_schema = DirectorySchema(path="/test")
        lines = []
        self.generator._add_readme_header(lines, "TestDir", dir_schema, False)

        self.assertIn("# TestDir", lines)
        # Should not have JSON-LD script tag
        self.assertFalse(any('<script type="application/ld+json">' in line for line in lines))

    def test_add_readme_overview_with_git_remote(self):
        """Test _add_readme_overview with git remote"""
        dir_schema = DirectorySchema(path="/test")
        dir_schema.files = [FileDef(path="/test/file.py", language="python")]
        dir_schema.git_remote = "https://github.com/user/repo"
        lines = []
        self.generator._add_readme_overview(lines, dir_schema)

        self.assertTrue(any("Git Remote" in line for line in lines))

    def test_add_readme_subdirectories(self):
        """Test _add_readme_subdirectories"""
        dir_schema = DirectorySchema(path="/test")
        dir_schema.subdirectories = ["src", "tests", "docs"]
        lines = []
        self.generator._add_readme_subdirectories(lines, dir_schema)

        self.assertTrue(any("Subdirectories" in line for line in lines))
        self.assertTrue(any("src" in line for line in lines))

    def test_add_readme_subdirectories_empty(self):
        """Test _add_readme_subdirectories with no subdirectories"""
        dir_schema = DirectorySchema(path="/test")
        dir_schema.subdirectories = []
        lines = []
        self.generator._add_readme_subdirectories(lines, dir_schema)

        self.assertEqual(len(lines), 0)

    def test_add_readme_classes_with_docstring(self):
        """Test _add_readme_classes with class docstring"""
        file_def = FileDef(path="/test.py", language="python")
        cls = ClassDef(
            name="MyClass",
            bases=["BaseClass"],
            docstring="This is a test class.\nWith multiple lines.",
            line_number=10,
            is_exported=True
        )
        cls.methods = [FunctionDef(name="method1", args=[], line_number=12)]
        file_def.classes.append(cls)

        lines = []
        self.generator._add_readme_classes(lines, file_def)

        self.assertTrue(any("MyClass" in line for line in lines))
        self.assertTrue(any("exported" in line for line in lines))
        self.assertTrue(any("Methods" in line for line in lines))

    def test_add_readme_functions_with_many_functions(self):
        """Test _add_readme_functions limits output to 10"""
        file_def = FileDef(path="/test.py", language="python")
        for i in range(15):
            file_def.functions.append(FunctionDef(
                name=f"func_{i}",
                args=["arg1"],
                return_type="int",
                line_number=i * 10,
                is_async=i % 2 == 0
            ))

        lines = []
        self.generator._add_readme_functions(lines, file_def)

        # Should mention "and X more functions"
        self.assertTrue(any("more functions" in line for line in lines))

    def test_add_readme_imports_limits_to_five(self):
        """Test _add_readme_imports limits to 5 imports"""
        file_def = FileDef(path="/test.py", language="python")
        file_def.imports = [f"module_{i}" for i in range(10)]

        lines = []
        self.generator._add_readme_imports(lines, file_def)

        # Should mention "+X more"
        self.assertTrue(any("more" in line for line in lines))


class TestSchemaOrgGeneratorEdgeCases(unittest.TestCase):
    """Test SchemaOrgGenerator edge cases"""

    def test_generate_software_source_code_no_classes(self):
        """Test with no classes but has functions"""
        dir_schema = DirectorySchema(path="/test")
        file_def = FileDef(path="/test/file.py", language="python")
        file_def.functions.append(FunctionDef(name="test_func", args=[], line_number=1))
        dir_schema.files.append(file_def)

        schema = SchemaOrgGenerator.generate_software_source_code(dir_schema, "TestDir")

        self.assertIn("featureList", schema)
        features = schema["featureList"]
        self.assertTrue(any("function" in f.lower() for f in features))

    def test_generate_software_source_code_no_functions(self):
        """Test with no functions but has classes"""
        dir_schema = DirectorySchema(path="/test")
        file_def = FileDef(path="/test/file.py", language="python")
        file_def.classes.append(ClassDef(name="TestClass", bases=[], line_number=1))
        dir_schema.files.append(file_def)

        schema = SchemaOrgGenerator.generate_software_source_code(dir_schema, "TestDir")

        self.assertIn("featureList", schema)
        features = schema["featureList"]
        self.assertTrue(any("class" in f.lower() for f in features))

    def test_generate_software_source_code_empty_dir(self):
        """Test with empty directory (no files)"""
        dir_schema = DirectorySchema(path="/test")

        schema = SchemaOrgGenerator.generate_software_source_code(dir_schema, "EmptyDir")

        self.assertEqual(schema["@type"], "SoftwareSourceCode")
        self.assertEqual(schema["name"], "EmptyDir")
        # No featureList if no classes/functions
        self.assertNotIn("featureList", schema)

    def test_generate_software_source_code_with_git_remote(self):
        """Test with git remote URL"""
        dir_schema = DirectorySchema(path="/test")
        dir_schema.git_remote = "https://github.com/user/repo"

        schema = SchemaOrgGenerator.generate_software_source_code(dir_schema, "TestDir")

        self.assertEqual(schema["codeRepository"], "https://github.com/user/repo")

    def test_generate_software_source_code_without_git_remote(self):
        """Test without git remote URL"""
        dir_schema = DirectorySchema(path="/test")

        schema = SchemaOrgGenerator.generate_software_source_code(dir_schema, "TestDir")

        # codeRepository should not be in schema if None
        self.assertNotIn("codeRepository", schema)

    def test_generate_software_source_code_multiple_languages(self):
        """Test with multiple programming languages"""
        dir_schema = DirectorySchema(path="/test")
        dir_schema.files = [
            FileDef(path="/test/file.py", language="python"),
            FileDef(path="/test/file.ts", language="typescript"),
            FileDef(path="/test/file.js", language="javascript")
        ]

        schema = SchemaOrgGenerator.generate_software_source_code(dir_schema, "MultiLang")

        languages = schema["programmingLanguage"]
        lang_names = [l["name"] for l in languages]
        self.assertEqual(len(lang_names), 3)


class TestEnhancedSchemaGeneratorErrorHandling(unittest.TestCase):
    """Test error handling in EnhancedSchemaGenerator"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EnhancedSchemaGenerator(self.temp_dir, use_astgrep=False)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_extract_python_schema_invalid_syntax(self):
        """Test extracting from Python file with syntax error"""
        test_file = Path(self.temp_dir) / "invalid.py"
        test_file.write_text("def broken(:\n    pass")

        # Should not raise, returns empty schema
        schema = self.generator.extract_python_schema(test_file)

        self.assertEqual(schema.language, "python")
        self.assertEqual(len(schema.classes), 0)
        self.assertEqual(len(schema.functions), 0)

    def test_extract_python_schema_nonexistent_file(self):
        """Test extracting from non-existent file"""
        test_file = Path(self.temp_dir) / "nonexistent.py"

        schema = self.generator.extract_python_schema(test_file)

        self.assertEqual(len(schema.classes), 0)
        self.assertEqual(len(schema.functions), 0)

    def test_scan_directory_nonexistent(self):
        """Test scanning non-existent directory"""
        nonexistent = Path(self.temp_dir) / "nonexistent_dir"

        schema = self.generator.scan_directory(nonexistent)

        self.assertEqual(len(schema.files), 0)
        self.assertEqual(len(schema.subdirectories), 0)

    def test_extract_python_with_imports(self):
        """Test extracting imports from Python file"""
        test_file = Path(self.temp_dir) / "test_imports.py"
        test_file.write_text("""
import os
import sys
from pathlib import Path
from typing import List, Dict

def test(): pass
""")

        schema = self.generator.extract_python_schema(test_file)

        self.assertIn('os', schema.imports)
        self.assertIn('sys', schema.imports)
        self.assertIn('pathlib', schema.imports)
        self.assertIn('typing', schema.imports)

    def test_extract_python_class_with_attributes(self):
        """Test extracting class attributes"""
        test_file = Path(self.temp_dir) / "test_class.py"
        test_file.write_text("""
class MyClass:
    class_attr = 10
    another_attr = "test"

    def __init__(self):
        self.instance_attr = 5
""")

        schema = self.generator.extract_python_schema(test_file)

        self.assertEqual(len(schema.classes), 1)
        cls = schema.classes[0]
        self.assertIn('class_attr', cls.attributes)
        self.assertIn('another_attr', cls.attributes)


class TestBuildHelperMethods(unittest.TestCase):
    """Test _build_* helper methods for JSON export"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EnhancedSchemaGenerator(self.temp_dir, use_astgrep=False)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_build_function_data(self):
        """Test _build_function_data"""
        func = FunctionDef(
            name="testFunc",
            args=["arg1", "arg2"],
            return_type="str",
            line_number=10,
            is_async=True,
            is_exported=True
        )

        result = self.generator._build_function_data(func)

        self.assertEqual(result["name"], "testFunc")
        self.assertEqual(result["args"], ["arg1", "arg2"])
        self.assertEqual(result["return_type"], "str")
        self.assertEqual(result["line_number"], 10)
        self.assertTrue(result["is_async"])
        self.assertTrue(result["is_exported"])

    def test_build_class_data(self):
        """Test _build_class_data"""
        cls = ClassDef(
            name="TestClass",
            bases=["BaseClass"],
            line_number=5,
            is_exported=True
        )
        cls.methods = [
            FunctionDef(name="method1", args=["self"], line_number=7, is_async=True)
        ]

        result = self.generator._build_class_data(cls)

        self.assertEqual(result["name"], "TestClass")
        self.assertEqual(result["bases"], ["BaseClass"])
        self.assertEqual(result["line_number"], 5)
        self.assertTrue(result["is_exported"])
        self.assertEqual(len(result["methods"]), 1)
        self.assertEqual(result["methods"][0]["name"], "method1")

    def test_build_file_data_with_schema_org(self):
        """Test _build_file_data with schema.org enabled"""
        file_def = FileDef(path="/test.py", language="python")
        file_def.imports = ["os", "sys"]

        result = self.generator._build_file_data(file_def, include_schema_org=True)

        self.assertEqual(result["@type"], "SoftwareSourceCode")
        self.assertEqual(result["path"], "/test.py")
        self.assertEqual(result["language"], "python")

    def test_build_file_data_without_schema_org(self):
        """Test _build_file_data without schema.org"""
        file_def = FileDef(path="/test.py", language="python")

        result = self.generator._build_file_data(file_def, include_schema_org=False)

        self.assertIsNone(result["@type"])

    def test_build_directory_data(self):
        """Test _build_directory_data"""
        dir_schema = DirectorySchema(
            path="/test",
            has_git=True,
            git_remote="https://github.com/user/repo"
        )
        dir_schema.subdirectories = ["src", "tests"]
        dir_schema.schema_org_markup = {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode"
        }

        result = self.generator._build_directory_data(dir_schema, include_schema_org=True)

        self.assertEqual(result["path"], "/test")
        self.assertTrue(result["has_git"])
        self.assertEqual(result["git_remote"], "https://github.com/user/repo")
        self.assertIn("schema_org", result)


if __name__ == '__main__':
    unittest.main()
