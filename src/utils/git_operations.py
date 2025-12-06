#!/usr/bin/env python3
"""
Push changes to all git repositories with remotes
"""

import json
import subprocess
import logging
from pathlib import Path
from typing import List, Tuple, Dict, Union, Any

# Set up logger
logger = logging.getLogger(__name__)

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

def main() -> None:
    # Configure logging for CLI output
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s'  # Keep simple format for CLI tools
    )

    schemas_file = '/Users/alyshialedlie/code/schemas.json'

    logger.info("Finding git repositories with remotes...")
    repos = get_git_repos_with_remotes(schemas_file)

    logger.info(f"Found {len(repos)} repositories with remotes\n")

    commit_message = """Update README.md files with schema documentation

Generated schema documentation for all code files including:
- Class definitions and hierarchies
- Function signatures
- Import dependencies
- Line number references

🤖 Generated with Schema Generator"""

    pushed: List[str] = []
    no_changes: List[str] = []
    errors: List[Tuple[str, str]] = []

    for repo_path, remote in repos:
        repo_name = Path(repo_path).name
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing: {repo_name}")
        logger.info(f"Path: {repo_path}")
        logger.info(f"Remote: {remote}")
        logger.info('='*60)

        # Check for changes
        has_changes, status = git_status(repo_path)

        if not has_changes:
            logger.info(f"✓ No changes to commit")
            no_changes.append(repo_name)
            continue

        logger.info(f"Changes detected:")
        logger.info(status[:500])  # Show first 500 chars

        # Add all changes
        if not git_add_all(repo_path):
            logger.warning(f"✗ Failed to add changes")
            errors.append((repo_name, "Failed to add changes"))
            continue

        logger.info(f"✓ Added changes")

        # Commit
        if not git_commit(repo_path, commit_message):
            logger.warning(f"✗ Failed to commit (may already be committed)")
            # Check if there are still changes
            has_changes, _ = git_status(repo_path)
            if not has_changes:
                logger.info(f"  (No uncommitted changes, skipping)")
                no_changes.append(repo_name)
                continue
            errors.append((repo_name, "Failed to commit"))
            continue

        logger.info(f"✓ Committed changes")

        # Push
        success, output = git_push(repo_path)
        if success:
            logger.info(f"✓ Pushed to remote")
            logger.info(output[:200])
            pushed.append(repo_name)
        else:
            logger.error(f"✗ Failed to push")
            logger.error(output[:200])
            errors.append((repo_name, f"Failed to push: {output[:100]}"))

    # Summary
    logger.info(f"\n\n{'='*60}")
    logger.info("SUMMARY")
    logger.info('='*60)
    logger.info(f"Successfully pushed: {len(pushed)}")
    for repo in pushed:
        logger.info(f"  ✓ {repo}")

    logger.info(f"\nNo changes: {len(no_changes)}")
    for repo in no_changes:
        logger.info(f"  - {repo}")

    logger.info(f"\nErrors: {len(errors)}")
    for repo, error in errors:
        logger.info(f"  ✗ {repo}: {error}")

if __name__ == '__main__':
    main()
