# Code Repository

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Code Repository",
  "description": "Directory containing 11 code files with 26 classes and 16 functions",
  "programmingLanguage": [
    {
      "@type": "ComputerLanguage",
      "name": "Python"
    }
  ],
  "codeRepository": "git@github.com:aledlie/CodeInventory.git",
  "featureList": [
    "26 class definitions",
    "16 function definitions"
  ]
}
</script>

## Overview

This directory contains 11 code file(s) with extracted schemas.

**Git Remote:** git@github.com:aledlie/CodeInventory.git

## Subdirectories

- `ast-grep-rules/`

## Files and Schemas

### `code_quality_analyzer.py` (python)

**Classes:**
- `QualityIssue` - Line 15
  - Represents a code quality issue
- `QualityReport` - Line 27
  - Complete quality analysis report
- `CodeQualityAnalyzer` - Line 35
  - Analyzes code quality using ast-grep patterns
  - Methods: __init__, _get_python_rules, _get_typescript_rules, _run_astgrep_rule, analyze_file (+3 more)

**Functions:**
- `main()` - Line 327

**Key Imports:** `argparse`, `collections`, `dataclasses`, `json`, `pathlib` (+3 more)

### `dashboard_generator.py` (python)

**Classes:**
- `DashboardGenerator` - Line 11
  - Generates interactive code analysis dashboard
  - Methods: __init__, _load_json, generate_html, _generate_metrics_section, _generate_schemas_section (+4 more)

**Functions:**
- `main()` - Line 441

**Key Imports:** `argparse`, `datetime`, `json`, `pathlib`, `typing`

### `dependency_analyzer.py` (python)

**Classes:**
- `DependencyInfo` - Line 15
  - Information about a dependency
- `DependencyReport` - Line 24
  - Complete dependency analysis report
- `DependencyAnalyzer` - Line 34
  - Analyzes project dependencies
  - Methods: __init__, _run_astgrep, _is_external_package, analyze_python_imports, analyze_typescript_imports (+5 more)

**Functions:**
- `main()` - Line 387

**Key Imports:** `argparse`, `collections`, `dataclasses`, `json`, `pathlib` (+2 more)

### `doc_enhancement_pipeline.py` (python)

**Classes:**
- `DocumentationEnhancer` - Line 11
  - Enhances documentation with schema.org markup
  - Methods: __init__, generate_schema_for_readme, create_jsonld_script, has_schema_markup, inject_schema (+3 more)

**Functions:**
- `main()` - Line 179

**Key Imports:** `argparse`, `json`, `pathlib`, `subprocess`, `typing`

### `push_changes.py` (python)

**Functions:**
- `get_git_repos_with_remotes(schemas_file) -> List[...]` - Line 11
- `git_status(repo_path) -> Tuple[...]` - Line 24
- `git_add_all(repo_path) -> bool` - Line 39
- `git_commit(repo_path, message) -> bool` - Line 47
- `git_push(repo_path) -> Tuple[...]` - Line 60
- `main()` - Line 74

**Key Imports:** `json`, `pathlib`, `subprocess`, `typing`

### `rss_generator.py` (python)

**Classes:**
- `RSSGenerator` - Line 14
  - Generates RSS feeds from code changes
  - Methods: __init__, get_recent_commits, analyze_commit_changes, generate_rss_xml, save_rss

**Functions:**
- `main()` - Line 186

**Key Imports:** `argparse`, `datetime`, `json`, `pathlib`, `subprocess` (+3 more)

### `run_all_analysis.py` (python)

**Classes:**
- `AnalysisRunner` - Line 11
  - Runs all analysis tools and generates reports
  - Methods: __init__, run_command, run_all_analysis, generate_summary_report

**Functions:**
- `main()` - Line 234

**Key Imports:** `argparse`, `datetime`, `pathlib`, `subprocess`, `sys`

### `schema_generator.py` (python)

**Classes:**
- `FunctionDef` - Line 17
- `ClassDef` - Line 25
- `FileDef` - Line 34
- `DirectorySchema` - Line 42
- `SchemaGenerator` - Line 49
  - Methods: __init__, extract_python_schema, _extract_function, _get_name, extract_typescript_schema (+4 more)

**Functions:**
- `main()` - Line 374

**Key Imports:** `ast`, `collections`, `dataclasses`, `json`, `os` (+4 more)

### `schema_generator_enhanced.py` (python)

**Classes:**
- `FunctionDef` - Line 20
- `ClassDef` - Line 30
- `FileDef` - Line 40
- `DirectorySchema` - Line 49
- `AstGrepHelper` - Line 57
  - Helper class for ast-grep operations
  - Methods: check_available, find_pattern, find_with_rule
- `SchemaOrgGenerator` - Line 119
  - Generate schema.org JSON-LD markup
  - Methods: generate_software_source_code, generate_jsonld_script
- `EnhancedSchemaGenerator` - Line 162
  - Methods: __init__, extract_python_schema, _extract_function, _get_name, extract_typescript_schema_astgrep (+6 more)

**Functions:**
- `main()` - Line 683

**Key Imports:** `argparse`, `ast`, `collections`, `dataclasses`, `json` (+8 more)

### `test_coverage_analyzer.py` (python)

**Classes:**
- `FunctionInfo` - Line 14
  - Information about a function
- `CoverageReport` - Line 24
  - Test coverage analysis report
- `TestCoverageAnalyzer` - Line 33
  - Analyzes test coverage by matching functions with test cases
  - Methods: __init__, _is_test_file, _run_astgrep, find_functions_in_file, find_test_functions (+3 more)

**Functions:**
- `main()` - Line 347

**Key Imports:** `argparse`, `collections`, `dataclasses`, `json`, `pathlib` (+2 more)

### `validate_schemas.py` (python)

**Classes:**
- `SchemaValidator` - Line 11
  - Validates schema.org markup
  - Methods: __init__, validate_schema, _validate_software_source_code, _validate_dataset, _validate_tech_article (+3 more)

**Functions:**
- `main()` - Line 179

**Key Imports:** `argparse`, `json`, `pathlib`, `re`, `typing`

---
*Generated by Enhanced Schema Generator with schema.org markup*