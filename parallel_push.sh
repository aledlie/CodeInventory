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

    # Push
    if git push 2>&1 | head -10; then
        echo "  ✓ Pushed $repo_name"
    else
        echo "  ✗ Push failed for $repo_name"
    fi
}

# Export function for parallel execution
export -f process_repo
export COMMIT_MSG

# Main repositories to push (avoiding nested repos and vim bundles)
repos=(
    "/Users/alyshialedlie/code/PersonalSite"
    "/Users/alyshialedlie/code/InventoryAI"
    "/Users/alyshialedlie/code/OldSites"
)

# Process each repo
for repo in "${repos[@]}"; do
    if [ -d "$repo/.git" ]; then
        process_repo "$repo"
        echo "---"
    fi
done

echo "Done!"
