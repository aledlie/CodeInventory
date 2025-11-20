#!/bin/bash
# Parallel git push script

COMMIT_MSG="Update README.md files with schema documentation

Generated schema documentation for all code files including:
- Class definitions and hierarchies
- Function signatures
- Import dependencies
- Line number references

🤖 Generated with Schema Generator"

# Function to process a single repository
process_repo() {
    local repo_path="$1"
    local repo_name=$(basename "$repo_path")

    echo "Processing: $repo_name"

    cd "$repo_path" || return 1

    # Check for changes
    if ! git status --porcelain | grep -q .; then
        echo "  ✓ No changes in $repo_name"
        return 0
    fi

    # Add all changes
    git add . 2>&1 | head -5

    # Commit
    if git commit -m "$COMMIT_MSG" 2>&1 | head -5; then
        echo "  ✓ Committed in $repo_name"
    else
        echo "  ! Commit may have failed or no changes in $repo_name"
    fi

    # Check and convert HTTPS URLs to SSH
    remote_url=$(git remote get-url origin 2>/dev/null)
    if [[ "$remote_url" =~ ^https://github.com/ ]]; then
        # Convert HTTPS to SSH format
        ssh_url=$(echo "$remote_url" | sed 's|https://github.com/|git@github.com:|' | sed 's|\.git$||').git
        echo "  ℹ Converting to SSH: $ssh_url"
        git remote set-url origin "$ssh_url"
    fi

    # Push using SSH authentication
    if git push 2>&1 | head -10; then
        echo "  ✓ Pushed $repo_name"
    else
        echo "  ✗ Push failed for $repo_name"
    fi
}

# Export function for parallel execution
export -f process_repo
export COMMIT_MSG

# Find all git repositories up to 2 levels deep
echo "Searching for git repositories up to 2 levels deep..."
repos=()

# Search for .git directories at level 1 and level 2
while IFS= read -r -d '' git_dir; do
    repo_path=$(dirname "$git_dir")
    repos+=("$repo_path")
done < <(find /Users/alyshialedlie/code -mindepth 2 -maxdepth 3 -type d -name ".git" -print0)

echo "Found ${#repos[@]} repositories"
echo ""

# Process each repo
for repo in "${repos[@]}"; do
    process_repo "$repo"
    echo "---"
done

echo "Done!"
