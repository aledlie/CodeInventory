#!/usr/bin/env python3
"""
RSS Generator - Creates dynamic RSS feeds from code changes with schema.org markup
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import subprocess
import xml.etree.ElementTree as ET
from xml.dom import minidom

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

class RSSGenerator:
    """Generates RSS feeds from code changes"""

    def __init__(self, schemas_path: Path, git_repo: Optional[Path] = None):
        self.schemas_path = schemas_path
        self.git_repo = git_repo

        # Load schemas data
        with open(schemas_path, 'r') as f:
            self.schemas_data = json.load(f)

    def get_recent_commits(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent git commits"""
        if not self._is_git_repo():
            return []

        try:
            result = self._run_git_log(limit)
            return self._parse_commits(result.stdout)
        except Exception as e:
            logger.error(f"Error fetching commits: {e}")
            return []

    def _is_git_repo(self) -> bool:
        """Check if the directory is a git repository"""
        return bool(self.git_repo and (self.git_repo / '.git').exists())

    def _run_git_log(self, limit: int) -> subprocess.CompletedProcess:
        """Run git log command"""
        return subprocess.run(
            ['git', 'log', f'--max-count={limit}', '--pretty=format:%H|%an|%ae|%ai|%s'],
            cwd=self.git_repo,
            capture_output=True,
            text=True,
            timeout=10
        )

    def _parse_commits(self, output: str) -> List[Dict[str, Any]]:
        """Parse commit data from git log output"""
        commits = []
        for line in output.strip().split('\n'):
            if line:
                commit = self._parse_commit_line(line)
                if commit:
                    commits.append(commit)
        return commits

    def _parse_commit_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse a single commit line"""
        try:
            hash, author, email, date, message = line.split('|', 4)
            return {
                'hash': hash,
                'author': author,
                'email': email,
                'date': date,
                'message': message
            }
        except ValueError:
            return None

    def analyze_commit_changes(self, commit_hash: str) -> Dict[str, Any]:
        """Analyze what changed in a commit"""
        try:
            result = self._run_git_show(commit_hash)
            return self._parse_git_stats(result.stdout)
        except Exception:
            return self._get_empty_stats()

    def _run_git_show(self, commit_hash: str) -> subprocess.CompletedProcess:
        """Run git show command for a commit"""
        return subprocess.run(
            ['git', 'show', '--stat', '--pretty=format:', commit_hash],
            cwd=self.git_repo,
            capture_output=True,
            text=True,
            timeout=10
        )

    def _parse_git_stats(self, output: str) -> Dict[str, Any]:
        """Parse git statistics from output"""
        stats = self._get_empty_stats()

        for line in output.split('\n'):
            if 'files changed' in line or 'file changed' in line:
                self._parse_stats_line(line, stats)

        return stats

    def _parse_stats_line(self, line: str, stats: Dict[str, Any]) -> None:
        """Parse a single statistics line"""
        parts = line.split(',')
        for part in parts:
            if 'file' in part:
                stats['files_changed'] = int(part.split()[0])
            elif 'insertion' in part:
                stats['insertions'] = int(part.split()[0])
            elif 'deletion' in part:
                stats['deletions'] = int(part.split()[0])

    def _get_empty_stats(self) -> Dict[str, Any]:
        """Get empty stats dictionary"""
        return {
            'files_changed': 0,
            'insertions': 0,
            'deletions': 0,
            'new_classes': [],
            'new_functions': []
        }

    def generate_rss_xml(self, title: str = "Code Inventory Updates",
                        description: str = "Latest code changes and updates",
                        link: str = "https://github.com/yourusername/repository") -> str:
        """Generate RSS 2.0 feed with schema.org markup"""
        rss = self._create_rss_root()
        channel = self._create_channel(rss, title, description, link)
        self._add_channel_items(channel, link)
        return self._format_xml(rss)

    def _create_rss_root(self) -> ET.Element:
        """Create RSS root element with namespaces"""
        rss = ET.Element('rss', version='2.0')
        rss.set('xmlns:atom', 'http://www.w3.org/2005/Atom')
        rss.set('xmlns:content', 'http://purl.org/rss/1.0/modules/content/')
        return rss

    def _create_channel(self, rss: ET.Element, title: str, description: str, link: str) -> ET.Element:
        """Create and configure RSS channel"""
        channel = ET.SubElement(rss, 'channel')
        self._add_channel_metadata(channel, title, description, link)
        self._add_atom_link(channel, link)
        return channel

    def _add_channel_metadata(self, channel: ET.Element, title: str, description: str, link: str) -> None:
        """Add channel metadata elements"""
        ET.SubElement(channel, 'title').text = title
        ET.SubElement(channel, 'description').text = description
        ET.SubElement(channel, 'link').text = link
        ET.SubElement(channel, 'language').text = 'en-us'
        ET.SubElement(channel, 'lastBuildDate').text = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')

    def _add_atom_link(self, channel: ET.Element, link: str) -> None:
        """Add Atom self link to channel"""
        atom_link = ET.SubElement(channel, 'atom:link')
        atom_link.set('href', f'{link}/rss.xml')
        atom_link.set('rel', 'self')
        atom_link.set('type', 'application/rss+xml')

    def _add_channel_items(self, channel: ET.Element, link: str) -> None:
        """Add commit items to channel"""
        commits = self.get_recent_commits(limit=20)
        for commit in commits:
            self._create_item(channel, commit, link)

    def _create_item(self, channel: ET.Element, commit: Dict[str, Any], link: str) -> None:
        """Create RSS item for a commit"""
        item = ET.SubElement(channel, 'item')
        self._add_item_metadata(item, commit, link)
        self._add_item_content(item, commit, link)

    def _add_item_metadata(self, item: ET.Element, commit: Dict[str, Any], link: str) -> None:
        """Add basic item metadata"""
        ET.SubElement(item, 'title').text = commit['message']
        ET.SubElement(item, 'link').text = f"{link}/commit/{commit['hash']}"
        ET.SubElement(item, 'guid', isPermaLink='true').text = f"{link}/commit/{commit['hash']}"
        ET.SubElement(item, 'pubDate').text = datetime.fromisoformat(commit['date']).strftime('%a, %d %b %Y %H:%M:%S %z')
        ET.SubElement(item, 'author').text = f"{commit['email']} ({commit['author']})"

    def _add_item_content(self, item: ET.Element, commit: Dict[str, Any], link: str) -> None:
        """Add content to item with stats and schema.org markup"""
        stats = self.analyze_commit_changes(commit['hash'])
        description = self._build_description(commit, stats)
        schema_markup = self._build_schema_markup(commit, stats)

        full_content = description + self._render_schema_markup(schema_markup)

        content_encoded = ET.SubElement(item, 'content:encoded')
        content_encoded.text = full_content
        ET.SubElement(item, 'description').text = commit['message']

    def _build_description(self, commit: Dict[str, Any], stats: Dict[str, Any]) -> str:
        """Build HTML description for commit"""
        return f"""
            <p><strong>Commit:</strong> {commit['hash'][:7]}</p>
            <p><strong>Author:</strong> {commit['author']}</p>
            <p><strong>Changes:</strong></p>
            <ul>
                <li>Files changed: {stats.get('files_changed', 0)}</li>
                <li>Insertions: +{stats.get('insertions', 0)}</li>
                <li>Deletions: -{stats.get('deletions', 0)}</li>
            </ul>
            """

    def _build_schema_markup(self, commit: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """Build schema.org markup for commit"""
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": commit['message'],
            "datePublished": commit['date'],
            "author": {
                "@type": "Person",
                "name": commit['author'],
                "email": commit['email']
            },
            "articleBody": f"Code changes: {stats.get('files_changed', 0)} files modified"
        }

    def _render_schema_markup(self, schema_markup: Dict[str, Any]) -> str:
        """Render schema.org markup as JSON-LD script"""
        return f"""
            <script type="application/ld+json">
            {json.dumps(schema_markup, indent=2)}
            </script>
            """

    def _format_xml(self, rss: ET.Element) -> str:
        """Format RSS XML with pretty printing"""
        xml_str = ET.tostring(rss, encoding='unicode')
        dom = minidom.parseString(xml_str)
        return dom.toprettyxml(indent='  ')

    def save_rss(self, output_path: Path, **kwargs: Any) -> None:
        """Save RSS feed to file"""
        rss_xml = self.generate_rss_xml(**kwargs)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(rss_xml)

        logger.info(f"✅ RSS feed saved to {output_path}")
        logger.info(f"   {len(self.get_recent_commits())} commits included")

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description='RSS Feed Generator')
    parser.add_argument('--schemas', required=True, help='Path to schemas.json')
    parser.add_argument('--git-repo', help='Path to git repository')
    parser.add_argument('--output', default='code-updates.xml', help='Output RSS file')
    parser.add_argument('--title', default='Code Inventory Updates', help='Feed title')
    parser.add_argument('--description', default='Latest code changes and updates', help='Feed description')
    parser.add_argument('--link', default='https://github.com/yourusername/repository', help='Repository URL')

    args = parser.parse_args()

    generator = RSSGenerator(
        schemas_path=Path(args.schemas),
        git_repo=Path(args.git_repo) if args.git_repo else None
    )

    output_path = Path(args.output)
    generator.save_rss(
        output_path,
        title=args.title,
        description=args.description,
        link=args.link
    )

if __name__ == '__main__':
    main()
