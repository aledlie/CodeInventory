#!/usr/bin/env python3
"""
Push changes to all git repositories with remotes
"""

import json
import subprocess
from pathlib import Path
from typing import List, Tuple

def get_git_repos_with_remotes(schemas_file: str) -> List[Tuple[str, str]]:
    """Extract directories with git remotes from schemas.json"""
    with open(schemas_file, 'r') as f:
        schemas = json.load(f)

    repos = []
    for dir_path, schema in schemas.items():
        if schema.get('has_git') and schema.get('git_remote'):
            full_path = Path('/Users/alyshialedlie/code') / dir_path
            repos.append((str(full_path), schema['git_remote']))

    return repos

def git_status(repo_path: str) -> Tuple[bool, str]:
    """Check if there are changes in the repository"""
    try:
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        has_changes = bool(result.stdout.strip())
        return has_changes, result.stdout
    except subprocess.CalledProcessError as e:
        return False, f"Error: {e}"

def git_add_all(repo_path: str) -> bool:
    """Add all changes to git"""
    try:
        subprocess.run(['git', 'add', '.'], cwd=repo_path, check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def git_commit(repo_path: str, message: str) -> bool:
    """Commit changes"""
    try:
        subprocess.run(
            ['git', 'commit', '-m', message],
            cwd=repo_path,
            check=True,
            capture_output=True
        )
        return True
    except subprocess.CalledProcessError:
        return False

def git_push(repo_path: str) -> Tuple[bool, str]:
    """Push changes to remote"""
    try:
        result = subprocess.run(
            ['git', 'push'],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        return True, result.stdout + result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def main():
    schemas_file = '/Users/alyshialedlie/code/schemas.json'

    print("Finding git repositories with remotes...")
    repos = get_git_repos_with_remotes(schemas_file)

    print(f"Found {len(repos)} repositories with remotes\n")

    commit_message = """Update README.md files with schema documentation

Generated schema documentation for all code files including:
- Class definitions and hierarchies
- Function signatures
- Import dependencies
- Line number references

🤖 Generated with Schema Generator"""

    results = {
        'pushed': [],
        'no_changes': [],
        'errors': []
    }

    for repo_path, remote in repos:
        repo_name = Path(repo_path).name
        print(f"\n{'='*60}")
        print(f"Processing: {repo_name}")
        print(f"Path: {repo_path}")
        print(f"Remote: {remote}")
        print('='*60)

        # Check for changes
        has_changes, status = git_status(repo_path)

        if not has_changes:
            print(f"✓ No changes to commit")
            results['no_changes'].append(repo_name)
            continue

        print(f"Changes detected:")
        print(status[:500])  # Show first 500 chars

        # Add all changes
        if not git_add_all(repo_path):
            print(f"✗ Failed to add changes")
            results['errors'].append((repo_name, "Failed to add changes"))
            continue

        print(f"✓ Added changes")

        # Commit
        if not git_commit(repo_path, commit_message):
            print(f"✗ Failed to commit (may already be committed)")
            # Check if there are still changes
            has_changes, _ = git_status(repo_path)
            if not has_changes:
                print(f"  (No uncommitted changes, skipping)")
                results['no_changes'].append(repo_name)
                continue
            results['errors'].append((repo_name, "Failed to commit"))
            continue

        print(f"✓ Committed changes")

        # Push
        success, output = git_push(repo_path)
        if success:
            print(f"✓ Pushed to remote")
            print(output[:200])
            results['pushed'].append(repo_name)
        else:
            print(f"✗ Failed to push")
            print(output[:200])
            results['errors'].append((repo_name, f"Failed to push: {output[:100]}"))

    # Summary
    print(f"\n\n{'='*60}")
    print("SUMMARY")
    print('='*60)
    print(f"Successfully pushed: {len(results['pushed'])}")
    for repo in results['pushed']:
        print(f"  ✓ {repo}")

    print(f"\nNo changes: {len(results['no_changes'])}")
    for repo in results['no_changes']:
        print(f"  - {repo}")

    print(f"\nErrors: {len(results['errors'])}")
    for repo, error in results['errors']:
        print(f"  ✗ {repo}: {error}")

if __name__ == '__main__':
    main()
