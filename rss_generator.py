#!/usr/bin/env python3
"""
RSS Generator - Creates dynamic RSS feeds from code changes with schema.org markup
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
import subprocess
import xml.etree.ElementTree as ET
from xml.dom import minidom

class RSSGenerator:
    """Generates RSS feeds from code changes"""

    def __init__(self, schemas_path: Path, git_repo: Path = None):
        self.schemas_path = schemas_path
        self.git_repo = git_repo

        # Load schemas data
        with open(schemas_path, 'r') as f:
            self.schemas_data = json.load(f)

    def get_recent_commits(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent git commits"""
        if not self.git_repo or not (self.git_repo / '.git').exists():
            return []

        try:
            result = subprocess.run(
                ['git', 'log', f'--max-count={limit}', '--pretty=format:%H|%an|%ae|%ai|%s'],
                cwd=self.git_repo,
                capture_output=True,
                text=True,
                timeout=10
            )

            commits = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    hash, author, email, date, message = line.split('|', 4)
                    commits.append({
                        'hash': hash,
                        'author': author,
                        'email': email,
                        'date': date,
                        'message': message
                    })

            return commits
        except Exception as e:
            print(f"Error fetching commits: {e}")
            return []

    def analyze_commit_changes(self, commit_hash: str) -> Dict[str, Any]:
        """Analyze what changed in a commit"""
        try:
            result = subprocess.run(
                ['git', 'show', '--stat', '--pretty=format:', commit_hash],
                cwd=self.git_repo,
                capture_output=True,
                text=True,
                timeout=10
            )

            stats = {
                'files_changed': 0,
                'insertions': 0,
                'deletions': 0,
                'new_classes': [],
                'new_functions': []
            }

            # Parse stats
            for line in result.stdout.split('\n'):
                if 'files changed' in line or 'file changed' in line:
                    parts = line.split(',')
                    for part in parts:
                        if 'file' in part:
                            stats['files_changed'] = int(part.split()[0])
                        elif 'insertion' in part:
                            stats['insertions'] = int(part.split()[0])
                        elif 'deletion' in part:
                            stats['deletions'] = int(part.split()[0])

            return stats
        except Exception:
            return {}

    def generate_rss_xml(self, title: str = "Code Inventory Updates",
                        description: str = "Latest code changes and updates",
                        link: str = "https://github.com/yourusername/repository") -> str:
        """Generate RSS 2.0 feed with schema.org markup"""

        # Create RSS feed
        rss = ET.Element('rss', version='2.0')
        rss.set('xmlns:atom', 'http://www.w3.org/2005/Atom')
        rss.set('xmlns:content', 'http://purl.org/rss/1.0/modules/content/')

        channel = ET.SubElement(rss, 'channel')

        # Channel metadata
        ET.SubElement(channel, 'title').text = title
        ET.SubElement(channel, 'description').text = description
        ET.SubElement(channel, 'link').text = link
        ET.SubElement(channel, 'language').text = 'en-us'
        ET.SubElement(channel, 'lastBuildDate').text = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')

        # Atom self link
        atom_link = ET.SubElement(channel, 'atom:link')
        atom_link.set('href', f'{link}/rss.xml')
        atom_link.set('rel', 'self')
        atom_link.set('type', 'application/rss+xml')

        # Get recent commits
        commits = self.get_recent_commits(limit=20)

        # Create items from commits
        for commit in commits:
            item = ET.SubElement(channel, 'item')

            # Basic item info
            ET.SubElement(item, 'title').text = commit['message']
            ET.SubElement(item, 'link').text = f"{link}/commit/{commit['hash']}"
            ET.SubElement(item, 'guid', isPermaLink='true').text = f"{link}/commit/{commit['hash']}"
            ET.SubElement(item, 'pubDate').text = datetime.fromisoformat(commit['date']).strftime('%a, %d %b %Y %H:%M:%S %z')
            ET.SubElement(item, 'author').text = f"{commit['email']} ({commit['author']})"

            # Get commit stats
            stats = self.analyze_commit_changes(commit['hash'])

            # Description with stats
            description = f"""
            <p><strong>Commit:</strong> {commit['hash'][:7]}</p>
            <p><strong>Author:</strong> {commit['author']}</p>
            <p><strong>Changes:</strong></p>
            <ul>
                <li>Files changed: {stats.get('files_changed', 0)}</li>
                <li>Insertions: +{stats.get('insertions', 0)}</li>
                <li>Deletions: -{stats.get('deletions', 0)}</li>
            </ul>
            """

            # Add schema.org markup
            schema_markup = {
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

            description += f"""
            <script type="application/ld+json">
            {json.dumps(schema_markup, indent=2)}
            </script>
            """

            # Use content:encoded for full HTML
            content_encoded = ET.SubElement(item, 'content:encoded')
            content_encoded.text = description

            ET.SubElement(item, 'description').text = commit['message']

        # Convert to pretty XML string
        xml_str = ET.tostring(rss, encoding='unicode')
        dom = minidom.parseString(xml_str)
        return dom.toprettyxml(indent='  ')

    def save_rss(self, output_path: Path, **kwargs):
        """Save RSS feed to file"""
        rss_xml = self.generate_rss_xml(**kwargs)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(rss_xml)

        print(f"✅ RSS feed saved to {output_path}")
        print(f"   {len(self.get_recent_commits())} commits included")

def main():
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
