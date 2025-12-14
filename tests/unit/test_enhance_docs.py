#!/usr/bin/env python3
"""
Unit tests for enhance_docs.py

Tests for the DocumentationEnhancer class which adds schema.org markup
to README files throughout a codebase.
"""

import unittest
import tempfile
import shutil
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.enhance_docs import DocumentationEnhancer


class TestDocumentationEnhancerInit(unittest.TestCase):
    """Test DocumentationEnhancer initialization"""

    def test_initialization(self):
        """Test basic initialization"""
        root_dir = Path("/tmp/test")
        enhancer = DocumentationEnhancer(root_dir)

        self.assertEqual(enhancer.root_dir, root_dir)
        self.assertEqual(enhancer.enhanced_count, 0)
        self.assertEqual(enhancer.skipped_count, 0)


class TestGenerateSchemaForReadme(unittest.TestCase):
    """Test schema generation for README files"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_generates_tech_article_by_default(self):
        """Test default schema type is TechArticle"""
        readme_path = Path(self.temp_dir) / "component" / "README.md"
        readme_path.parent.mkdir(parents=True)
        readme_path.touch()

        schema = self.enhancer.generate_schema_for_readme(readme_path, {})

        self.assertEqual(schema["@type"], "TechArticle")
        self.assertEqual(schema["@context"], "https://schema.org")
        self.assertEqual(schema["name"], "component")

    def test_generates_howto_for_test_directories(self):
        """Test schema type is HowTo for test directories"""
        readme_path = Path(self.temp_dir) / "tests" / "README.md"
        readme_path.parent.mkdir(parents=True)
        readme_path.touch()

        schema = self.enhancer.generate_schema_for_readme(readme_path, {})

        self.assertEqual(schema["@type"], "HowTo")

    def test_generates_api_reference_for_api_directories(self):
        """Test schema type is APIReference for api directories"""
        readme_path = Path(self.temp_dir) / "api" / "README.md"
        readme_path.parent.mkdir(parents=True)
        readme_path.touch()

        schema = self.enhancer.generate_schema_for_readme(readme_path, {})

        self.assertEqual(schema["@type"], "APIReference")

    def test_generates_api_reference_for_reference_directories(self):
        """Test schema type is APIReference for reference directories"""
        readme_path = Path(self.temp_dir) / "reference" / "README.md"
        readme_path.parent.mkdir(parents=True)
        readme_path.touch()

        schema = self.enhancer.generate_schema_for_readme(readme_path, {})

        self.assertEqual(schema["@type"], "APIReference")

    def test_includes_git_remote_when_provided(self):
        """Test schema includes git remote when in context"""
        readme_path = Path(self.temp_dir) / "project" / "README.md"
        readme_path.parent.mkdir(parents=True)
        readme_path.touch()

        context = {"git_remote": "https://github.com/user/repo.git"}
        schema = self.enhancer.generate_schema_for_readme(readme_path, context)

        self.assertEqual(schema["codeRepository"], "https://github.com/user/repo.git")

    def test_includes_programming_languages(self):
        """Test schema includes programming languages when in context"""
        readme_path = Path(self.temp_dir) / "project" / "README.md"
        readme_path.parent.mkdir(parents=True)
        readme_path.touch()

        context = {"languages": ["Python", "TypeScript"]}
        schema = self.enhancer.generate_schema_for_readme(readme_path, context)

        self.assertIn("programmingLanguage", schema)
        self.assertEqual(len(schema["programmingLanguage"]), 2)
        self.assertEqual(schema["programmingLanguage"][0]["@type"], "ComputerLanguage")
        self.assertEqual(schema["programmingLanguage"][0]["name"], "Python")

    def test_generates_description_from_directory_name(self):
        """Test description is generated from directory name"""
        readme_path = Path(self.temp_dir) / "my-component" / "README.md"
        readme_path.parent.mkdir(parents=True)
        readme_path.touch()

        schema = self.enhancer.generate_schema_for_readme(readme_path, {})

        self.assertEqual(schema["description"], "Documentation for my-component")


class TestCreateJsonldScript(unittest.TestCase):
    """Test JSON-LD script tag creation"""

    def setUp(self):
        """Set up test fixtures"""
        self.enhancer = DocumentationEnhancer(Path("/tmp"))

    def test_creates_script_tag(self):
        """Test creates valid script tag"""
        schema = {"@context": "https://schema.org", "@type": "TechArticle"}
        result = self.enhancer.create_jsonld_script(schema)

        self.assertIn('<script type="application/ld+json">', result)
        self.assertIn('</script>', result)

    def test_includes_json_content(self):
        """Test includes formatted JSON content"""
        schema = {"@context": "https://schema.org", "@type": "TechArticle", "name": "Test"}
        result = self.enhancer.create_jsonld_script(schema)

        self.assertIn('"@context": "https://schema.org"', result)
        self.assertIn('"@type": "TechArticle"', result)
        self.assertIn('"name": "Test"', result)


class TestHasSchemaMarkup(unittest.TestCase):
    """Test schema markup detection"""

    def setUp(self):
        """Set up test fixtures"""
        self.enhancer = DocumentationEnhancer(Path("/tmp"))

    def test_detects_existing_schema(self):
        """Test detects existing schema markup"""
        content = '# Title\n<script type="application/ld+json">\n{}\n</script>'
        self.assertTrue(self.enhancer.has_schema_markup(content))

    def test_returns_false_for_no_schema(self):
        """Test returns false when no schema markup present"""
        content = "# Title\n\nSome content here."
        self.assertFalse(self.enhancer.has_schema_markup(content))


class TestFindInsertionPoint(unittest.TestCase):
    """Test insertion point finding"""

    def setUp(self):
        """Set up test fixtures"""
        self.enhancer = DocumentationEnhancer(Path("/tmp"))

    def test_finds_position_after_first_heading(self):
        """Test finds position after first heading"""
        lines = ["# Title", "Some content", "More content"]
        result = self.enhancer._find_insertion_point(lines)

        self.assertEqual(result, 1)

    def test_finds_position_after_h2_heading(self):
        """Test finds position after H2 heading if first"""
        lines = ["## Subtitle", "Content"]
        result = self.enhancer._find_insertion_point(lines)

        self.assertEqual(result, 1)

    def test_returns_zero_for_no_heading(self):
        """Test returns 0 if no heading found"""
        lines = ["No heading here", "Just content"]
        result = self.enhancer._find_insertion_point(lines)

        self.assertEqual(result, 0)


class TestInjectSchema(unittest.TestCase):
    """Test schema injection into README files"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_injects_schema_after_heading(self):
        """Test schema is injected after first heading"""
        readme_path = Path(self.temp_dir) / "README.md"
        readme_path.write_text("# My Project\n\nSome description.\n")

        schema = {"@context": "https://schema.org", "@type": "TechArticle"}
        result = self.enhancer.inject_schema(readme_path, schema)

        self.assertTrue(result)
        content = readme_path.read_text()
        self.assertIn('<script type="application/ld+json">', content)
        self.assertIn("TechArticle", content)

    def test_skips_file_with_existing_schema(self):
        """Test skips file that already has schema"""
        readme_path = Path(self.temp_dir) / "README.md"
        readme_path.write_text('# Title\n<script type="application/ld+json">\n{}\n</script>\n')

        schema = {"@context": "https://schema.org", "@type": "TechArticle"}
        result = self.enhancer.inject_schema(readme_path, schema)

        self.assertFalse(result)
        self.assertEqual(self.enhancer.skipped_count, 1)

    def test_increments_enhanced_count(self):
        """Test increments enhanced count on success"""
        readme_path = Path(self.temp_dir) / "README.md"
        readme_path.write_text("# My Project\n")

        schema = {"@context": "https://schema.org", "@type": "TechArticle"}
        self.enhancer.inject_schema(readme_path, schema)

        self.assertEqual(self.enhancer.enhanced_count, 1)

    def test_handles_read_error_gracefully(self):
        """Test handles file read error gracefully"""
        readme_path = Path(self.temp_dir) / "nonexistent" / "README.md"

        schema = {"@context": "https://schema.org", "@type": "TechArticle"}
        result = self.enhancer.inject_schema(readme_path, schema)

        self.assertFalse(result)


class TestGetDefaultSkipDirs(unittest.TestCase):
    """Test default skip directories"""

    def setUp(self):
        """Set up test fixtures"""
        self.enhancer = DocumentationEnhancer(Path("/tmp"))

    def test_returns_expected_directories(self):
        """Test returns expected directories to skip"""
        skip_dirs = self.enhancer._get_default_skip_dirs()

        self.assertIn('.git', skip_dirs)
        self.assertIn('node_modules', skip_dirs)
        self.assertIn('__pycache__', skip_dirs)
        self.assertIn('dist', skip_dirs)
        self.assertIn('build', skip_dirs)
        self.assertIn('.venv', skip_dirs)
        self.assertIn('venv', skip_dirs)
        self.assertIn('coverage', skip_dirs)


class TestGetReadmeFiles(unittest.TestCase):
    """Test README file discovery"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_finds_readme_files(self):
        """Test finds README.md files"""
        readme1 = Path(self.temp_dir) / "README.md"
        readme1.touch()

        subdir = Path(self.temp_dir) / "subdir"
        subdir.mkdir()
        readme2 = subdir / "README.md"
        readme2.touch()

        files = self.enhancer._get_readme_files(Path(self.temp_dir), set())

        self.assertEqual(len(files), 2)

    def test_finds_readme_enhanced_files(self):
        """Test finds README_enhanced.md files"""
        readme = Path(self.temp_dir) / "README_enhanced.md"
        readme.touch()

        files = self.enhancer._get_readme_files(Path(self.temp_dir), set())

        self.assertEqual(len(files), 1)

    def test_skips_excluded_directories(self):
        """Test skips excluded directories"""
        # Create README in node_modules
        node_modules = Path(self.temp_dir) / "node_modules"
        node_modules.mkdir()
        (node_modules / "README.md").touch()

        # Create README in regular directory
        (Path(self.temp_dir) / "README.md").touch()

        files = self.enhancer._get_readme_files(Path(self.temp_dir), {'node_modules'})

        self.assertEqual(len(files), 1)

    def test_skips_hidden_directories(self):
        """Test skips hidden directories"""
        hidden_dir = Path(self.temp_dir) / ".hidden"
        hidden_dir.mkdir()
        (hidden_dir / "README.md").touch()

        (Path(self.temp_dir) / "README.md").touch()

        files = self.enhancer._get_readme_files(Path(self.temp_dir), set())

        self.assertEqual(len(files), 1)

    def test_case_insensitive_readme_matching(self):
        """Test finds README with different cases"""
        (Path(self.temp_dir) / "README.md").touch()

        subdir = Path(self.temp_dir) / "sub"
        subdir.mkdir()
        (subdir / "readme.md").touch()

        files = self.enhancer._get_readme_files(Path(self.temp_dir), set())

        self.assertEqual(len(files), 2)


class TestEnhanceDirectory(unittest.TestCase):
    """Test directory enhancement"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_enhances_all_readme_files(self):
        """Test enhances all README files in directory"""
        # Create READMEs
        readme1 = Path(self.temp_dir) / "README.md"
        readme1.write_text("# Project\n\nDescription.\n")

        subdir = Path(self.temp_dir) / "src"
        subdir.mkdir()
        readme2 = subdir / "README.md"
        readme2.write_text("# Source\n\nSource code.\n")

        self.enhancer.enhance_directory()

        self.assertEqual(self.enhancer.enhanced_count, 2)

        # Verify both have schema markup
        self.assertIn('<script type="application/ld+json">', readme1.read_text())
        self.assertIn('<script type="application/ld+json">', readme2.read_text())

    def test_uses_default_root_dir(self):
        """Test uses root_dir when directory not specified"""
        readme = Path(self.temp_dir) / "README.md"
        readme.write_text("# Test\n")

        self.enhancer.enhance_directory()

        self.assertEqual(self.enhancer.enhanced_count, 1)

    def test_uses_custom_skip_dirs(self):
        """Test uses custom skip directories"""
        # Create README in custom skip dir
        custom_dir = Path(self.temp_dir) / "custom_skip"
        custom_dir.mkdir()
        (custom_dir / "README.md").write_text("# Skip\n")

        # Create regular README
        (Path(self.temp_dir) / "README.md").write_text("# Keep\n")

        self.enhancer.enhance_directory(skip_dirs={'custom_skip'})

        self.assertEqual(self.enhancer.enhanced_count, 1)


class TestGetGitRemote(unittest.TestCase):
    """Test git remote detection"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_returns_none_for_non_git_directory(self):
        """Test returns None for non-git directory"""
        result = self.enhancer._get_git_remote(Path(self.temp_dir))

        self.assertIsNone(result)

    @patch('subprocess.run')
    def test_returns_remote_url_for_git_directory(self, mock_run):
        """Test returns remote URL for git directory"""
        # Create .git directory
        git_dir = Path(self.temp_dir) / ".git"
        git_dir.mkdir()

        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="https://github.com/user/repo.git\n"
        )

        result = self.enhancer._get_git_remote(Path(self.temp_dir))

        self.assertEqual(result, "https://github.com/user/repo.git")

    @patch('subprocess.run')
    def test_returns_none_on_git_error(self, mock_run):
        """Test returns None when git command fails"""
        git_dir = Path(self.temp_dir) / ".git"
        git_dir.mkdir()

        mock_run.return_value = MagicMock(returncode=1, stdout="")

        result = self.enhancer._get_git_remote(Path(self.temp_dir))

        self.assertIsNone(result)

    @patch('subprocess.run')
    def test_handles_subprocess_exception(self, mock_run):
        """Test handles subprocess exception gracefully"""
        git_dir = Path(self.temp_dir) / ".git"
        git_dir.mkdir()

        mock_run.side_effect = Exception("Command failed")

        result = self.enhancer._get_git_remote(Path(self.temp_dir))

        self.assertIsNone(result)


class TestDetectLanguages(unittest.TestCase):
    """Test programming language detection"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_detects_python_files(self):
        """Test detects Python files"""
        (Path(self.temp_dir) / "main.py").touch()

        languages = self.enhancer._detect_languages(Path(self.temp_dir))

        self.assertIn("Python", languages)

    def test_detects_typescript_files(self):
        """Test detects TypeScript files"""
        (Path(self.temp_dir) / "app.ts").touch()
        (Path(self.temp_dir) / "component.tsx").touch()

        languages = self.enhancer._detect_languages(Path(self.temp_dir))

        self.assertIn("TypeScript", languages)
        # Should only have one TypeScript entry (deduped)
        self.assertEqual(languages.count("TypeScript"), 1)

    def test_detects_javascript_files(self):
        """Test detects JavaScript files"""
        (Path(self.temp_dir) / "script.js").touch()
        (Path(self.temp_dir) / "component.jsx").touch()

        languages = self.enhancer._detect_languages(Path(self.temp_dir))

        self.assertIn("JavaScript", languages)

    def test_returns_empty_for_no_code_files(self):
        """Test returns empty list when no code files"""
        (Path(self.temp_dir) / "README.md").touch()
        (Path(self.temp_dir) / "config.yaml").touch()

        languages = self.enhancer._detect_languages(Path(self.temp_dir))

        self.assertEqual(len(languages), 0)

    def test_detects_multiple_languages(self):
        """Test detects multiple languages"""
        (Path(self.temp_dir) / "main.py").touch()
        (Path(self.temp_dir) / "app.ts").touch()
        (Path(self.temp_dir) / "script.js").touch()

        languages = self.enhancer._detect_languages(Path(self.temp_dir))

        self.assertEqual(len(languages), 3)
        self.assertIn("Python", languages)
        self.assertIn("TypeScript", languages)
        self.assertIn("JavaScript", languages)

    def test_ignores_directories(self):
        """Test ignores directories with matching extensions"""
        # Create a directory with .py extension (edge case)
        weird_dir = Path(self.temp_dir) / "weird.py"
        weird_dir.mkdir()

        languages = self.enhancer._detect_languages(Path(self.temp_dir))

        self.assertEqual(len(languages), 0)


class TestGatherContext(unittest.TestCase):
    """Test context gathering"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_gathers_languages(self):
        """Test gathers languages from directory"""
        (Path(self.temp_dir) / "main.py").touch()

        context = self.enhancer._gather_context(Path(self.temp_dir))

        self.assertIn("languages", context)
        self.assertIn("Python", context["languages"])

    def test_gathers_git_remote(self):
        """Test gathers git remote from directory"""
        context = self.enhancer._gather_context(Path(self.temp_dir))

        self.assertIn("git_remote", context)
        # Should be None for non-git directory
        self.assertIsNone(context["git_remote"])


class TestGenerateReport(unittest.TestCase):
    """Test report generation"""

    def setUp(self):
        """Set up test fixtures"""
        self.enhancer = DocumentationEnhancer(Path("/tmp"))

    def test_generates_report_with_counts(self):
        """Test generates report with correct counts"""
        self.enhancer.enhanced_count = 5
        self.enhancer.skipped_count = 3

        report = self.enhancer.generate_report()

        self.assertIn("Files Enhanced: 5", report)
        self.assertIn("Files Skipped: 3", report)
        self.assertIn("Total Processed: 8", report)

    def test_report_has_header(self):
        """Test report has header"""
        report = self.enhancer.generate_report()

        self.assertIn("DOCUMENTATION ENHANCEMENT REPORT", report)

    def test_report_has_separators(self):
        """Test report has separators"""
        report = self.enhancer.generate_report()

        self.assertIn("=" * 80, report)


class TestInsertSchemaMarkup(unittest.TestCase):
    """Test schema markup insertion into lines"""

    def setUp(self):
        """Set up test fixtures"""
        self.enhancer = DocumentationEnhancer(Path("/tmp"))

    def test_inserts_at_specified_index(self):
        """Test inserts schema at specified index"""
        lines = ["# Title", "Content"]
        schema = {"@type": "TechArticle"}

        result = self.enhancer._insert_schema_markup(lines, schema, 1)

        self.assertEqual(len(result), 5)  # Original 2 + empty + schema + empty
        self.assertEqual(result[0], "# Title")
        self.assertEqual(result[1], "")
        self.assertIn('<script type="application/ld+json">', result[2])

    def test_preserves_original_content(self):
        """Test preserves original content"""
        lines = ["# Title", "First paragraph", "Second paragraph"]
        schema = {"@type": "TechArticle"}

        result = self.enhancer._insert_schema_markup(lines, schema, 1)

        self.assertEqual(result[0], "# Title")
        self.assertIn("First paragraph", result)
        self.assertIn("Second paragraph", result)


class TestReadWriteFileContent(unittest.TestCase):
    """Test file read/write operations"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_read_file_content(self):
        """Test reads file content correctly"""
        test_file = Path(self.temp_dir) / "test.md"
        test_file.write_text("Hello, World!")

        content = self.enhancer._read_file_content(test_file)

        self.assertEqual(content, "Hello, World!")

    def test_write_file_content(self):
        """Test writes file content correctly"""
        test_file = Path(self.temp_dir) / "test.md"

        self.enhancer._write_file_content(test_file, "New content")

        self.assertEqual(test_file.read_text(), "New content")

    def test_read_handles_utf8(self):
        """Test reads UTF-8 content correctly"""
        test_file = Path(self.temp_dir) / "test.md"
        test_file.write_text("Unicode: é, ñ, 中文", encoding='utf-8')

        content = self.enhancer._read_file_content(test_file)

        self.assertIn("é", content)
        self.assertIn("ñ", content)
        self.assertIn("中文", content)


class TestIntegration(unittest.TestCase):
    """Integration tests for complete enhancement workflow"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.enhancer = DocumentationEnhancer(Path(self.temp_dir))

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_full_enhancement_workflow(self):
        """Test complete enhancement workflow"""
        # Create project structure
        src_dir = Path(self.temp_dir) / "src"
        src_dir.mkdir()

        tests_dir = Path(self.temp_dir) / "tests"
        tests_dir.mkdir()

        api_dir = Path(self.temp_dir) / "api"
        api_dir.mkdir()

        # Create source files for language detection
        (src_dir / "main.py").touch()
        (src_dir / "utils.ts").touch()

        # Create READMEs
        (Path(self.temp_dir) / "README.md").write_text("# My Project\n\nA great project.\n")
        (src_dir / "README.md").write_text("# Source Code\n\nSource files.\n")
        (tests_dir / "README.md").write_text("# Tests\n\nTest files.\n")
        (api_dir / "README.md").write_text("# API\n\nAPI docs.\n")

        # Run enhancement
        self.enhancer.enhance_directory()

        # Verify counts
        self.assertEqual(self.enhancer.enhanced_count, 4)
        self.assertEqual(self.enhancer.skipped_count, 0)

        # Verify schema types
        root_content = (Path(self.temp_dir) / "README.md").read_text()
        self.assertIn("TechArticle", root_content)

        tests_content = (tests_dir / "README.md").read_text()
        self.assertIn("HowTo", tests_content)

        api_content = (api_dir / "README.md").read_text()
        self.assertIn("APIReference", api_content)

    def test_enhancement_preserves_existing_content(self):
        """Test enhancement preserves existing content"""
        original_content = """# My Project

## Introduction

This is a great project with lots of features.

## Installation

Run `pip install myproject`.

## Usage

Import and use it.
"""
        readme = Path(self.temp_dir) / "README.md"
        readme.write_text(original_content)

        self.enhancer.enhance_directory()

        enhanced_content = readme.read_text()

        # Verify original content is preserved
        self.assertIn("## Introduction", enhanced_content)
        self.assertIn("This is a great project", enhanced_content)
        self.assertIn("## Installation", enhanced_content)
        self.assertIn("pip install myproject", enhanced_content)
        self.assertIn("## Usage", enhanced_content)

        # Verify schema was added
        self.assertIn('<script type="application/ld+json">', enhanced_content)

    def test_re_running_enhancement_skips_enhanced_files(self):
        """Test re-running enhancement skips already enhanced files"""
        readme = Path(self.temp_dir) / "README.md"
        readme.write_text("# Test\n\nContent.\n")

        # First run
        self.enhancer.enhance_directory()
        self.assertEqual(self.enhancer.enhanced_count, 1)
        self.assertEqual(self.enhancer.skipped_count, 0)

        # Reset and run again
        self.enhancer.enhanced_count = 0
        self.enhancer.enhance_directory()

        self.assertEqual(self.enhancer.enhanced_count, 0)
        self.assertEqual(self.enhancer.skipped_count, 1)


if __name__ == '__main__':
    unittest.main()
