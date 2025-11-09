#!/usr/bin/env python3
"""
Unit tests for rss_generator.py
"""

import unittest
import tempfile
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from rss_generator import RSSGenerator

class TestRSSGenerator(unittest.TestCase):
    """Test RSSGenerator class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()

        # Create sample schemas file
        self.schemas_file = Path(self.temp_dir) / "schemas.json"
        with open(self.schemas_file, 'w') as f:
            json.dump({
                "directories": {
                    "src": {
                        "files": []
                    }
                }
            }, f)

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_initialization(self):
        """Test RSS generator initialization"""
        generator = RSSGenerator(self.schemas_file)

        self.assertIsNotNone(generator.schemas_data)
        self.assertIsNone(generator.git_repo)

    def test_initialization_with_git_repo(self):
        """Test initialization with git repository"""
        generator = RSSGenerator(
            self.schemas_file,
            git_repo=Path(self.temp_dir)
        )

        self.assertEqual(generator.git_repo, Path(self.temp_dir))

    def test_get_recent_commits_no_git(self):
        """Test getting commits when no git repo"""
        generator = RSSGenerator(self.schemas_file)
        commits = generator.get_recent_commits()

        self.assertEqual(len(commits), 0)

    def test_generate_rss_xml(self):
        """Test RSS XML generation"""
        generator = RSSGenerator(self.schemas_file)

        rss_xml = generator.generate_rss_xml(
            title="Test Feed",
            description="Test Description",
            link="https://example.com"
        )

        # Check for RSS structure
        self.assertIn('<?xml', rss_xml)
        self.assertIn('version="2.0"', rss_xml)
        self.assertIn('<rss', rss_xml)
        self.assertIn('<channel>', rss_xml)
        self.assertIn('<title>Test Feed</title>', rss_xml)
        self.assertIn('<description>Test Description</description>', rss_xml)

    def test_rss_includes_schema_org_namespace(self):
        """Test RSS includes necessary namespaces"""
        generator = RSSGenerator(self.schemas_file)
        rss_xml = generator.generate_rss_xml()

        self.assertIn('xmlns:atom', rss_xml)
        self.assertIn('xmlns:content', rss_xml)

    def test_save_rss(self):
        """Test saving RSS to file"""
        generator = RSSGenerator(self.schemas_file)
        output_file = Path(self.temp_dir) / "feed.xml"

        generator.save_rss(
            output_file,
            title="Test Feed",
            link="https://example.com"
        )

        self.assertTrue(output_file.exists())

        # Verify it's valid XML
        with open(output_file, 'r') as f:
            content = f.read()
            self.assertIn('<?xml', content)
            self.assertIn('</rss>', content)

    def test_analyze_commit_changes_no_git(self):
        """Test analyzing commits without git"""
        generator = RSSGenerator(self.schemas_file)
        stats = generator.analyze_commit_changes("abc123")

        # Should return empty stats
        self.assertIsInstance(stats, dict)

    def test_rss_atom_self_link(self):
        """Test RSS includes Atom self link"""
        generator = RSSGenerator(self.schemas_file)
        rss_xml = generator.generate_rss_xml(
            link="https://example.com"
        )

        self.assertIn('atom:link', rss_xml)
        self.assertIn('rel="self"', rss_xml)

if __name__ == '__main__':
    unittest.main()
