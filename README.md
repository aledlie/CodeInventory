# Code Inventory - Session 2025-11-01

This directory contains all files generated during the automated code schema generation and documentation session.

## Contents

### Primary Tools

1. **schema_generator.py** (16 KB)
   - Main Python script for extracting schemas from code files
   - Uses AST parsing for Python files
   - Uses regex patterns for TypeScript/JavaScript files
   - Generates README.md files for all directories containing code
   - Creates comprehensive schemas.json output

2. **schemas.json** (36 MB)
   - Complete structured data for all 3,335 scanned directories
   - Contains extracted schemas for all code files
   - Includes git repository metadata and remote URLs
   - Machine-readable format for programmatic access

### Automation Scripts

3. **push_changes.py** (4.9 KB)
   - Python script to automate git commits and pushes
   - Processes all repositories with git remotes
   - Handles commit message generation
   - Reports success/failure status

4. **parallel_push.sh** (1.5 KB)
   - Bash script for parallel git push operations
   - Targets main repositories: PersonalSite, InventoryAI, OldSites
   - Includes error handling and status reporting

### Documentation

5. **SCHEMA_SUMMARY.md** (3.3 KB)
   - Overview of the schema generation process
   - Statistics on directories scanned and files processed
   - Lists of repositories with git remotes
   - Usage instructions for regenerating schemas

6. **PUSH_SUCCESS.md** (1.9 KB)
   - Report of successful GitHub push operations
   - Final commit hashes and repository status
   - Confirmation that PersonalSite and InventoryAI were pushed successfully

## Session Results

- **3,335 directories** scanned recursively
- **72 git repositories** identified with remote URLs
- **Hundreds of README.md files** generated/updated across all subdirectories
- **2 main repositories** successfully pushed to GitHub:
  - PersonalSite (commit: e9be6f3c)
  - InventoryAI (commit: 100e16d)

## Languages Processed

- Python (.py)
- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)

## Usage

### Regenerate Schemas
```bash
cd /Users/alyshialedlie/code/Inventory
python3 schema_generator.py
```

### View Schema Data
```python
import json
with open('schemas.json', 'r') as f:
    schemas = json.load(f)
```

### Push Changes to Repositories
```bash
python3 push_changes.py
# or
bash parallel_push.sh
```

## Notes

- All generated README.md files include:
  - Class definitions with inheritance hierarchies
  - Method and function signatures
  - Import dependencies
  - Line number references
  - Docstrings where available

- The schema generator skips common directories:
  - `node_modules`
  - `__pycache__`
  - `.git`
  - `.venv`, `venv`, `env`
  - `dist`, `build`, `_site`
  - `.cache`, `.next`

---
*Generated on 2025-11-01 during automated code inventory session*
