# Scripts Refactoring Plan - 2024-11-19

## Executive Summary

Refactoring three Python scripts in `/scripts/` directory to address long-function code quality issues. These scripts contain 14 long functions total that need to be broken down into smaller, focused, testable units.

## Current State Analysis

### 1. `enhance_docs.py` (209 lines)
**Long Functions Identified:**
- `inject_schema()` - 41 lines (64-104)
  - Mixed concerns: validation, file I/O, content manipulation
- `enhance_directory()` - 25 lines (106-131)
  - Directory traversal, context gathering, schema generation, injection
- `_gather_context()` - 34 lines (132-166)
  - Git operations, language detection, context building

### 2. `run_analysis.py` (265 lines)
**Long Functions Identified:**
- `run_command()` - 40 lines (25-65)
  - Command execution, output capture, error handling, result storage
- `run_all_analysis()` - 116 lines (66-182)
  - Multiple analysis steps, file path management, command orchestration
- `generate_summary_report()` - 57 lines (183-241)
  - Report generation, file writing, status calculation
- `main()` - 23 lines (242-264)
  - Argument parsing, validation, runner initialization

### 3. `run_tests.py` (222 lines)
**Long Functions Identified:**
- `run_tests()` - 28 lines (31-59)
  - Test discovery, execution, result collection
- `run_coverage_analysis()` - 47 lines (61-107)
  - Coverage setup, test execution, report generation
- `generate_summary_report()` - 56 lines (108-164)
  - Report formatting, status determination, file writing
- `generate_json_report()` - 17 lines (165-181)
  - JSON report creation and saving
- `main()` - 40 lines (182-221)
  - Argument parsing, test filtering, multiple report generation

## Identified Issues

### Critical
- Functions exceeding 30 lines with multiple responsibilities
- Mixed concerns (I/O, logic, formatting) within single functions
- Difficult to unit test individual components

### Major
- Complex main() functions doing more than orchestration
- Report generation logic mixed with formatting
- Command execution mixed with result handling

### Minor
- Inconsistent error handling patterns
- Duplicate report formatting code
- Hard-coded configuration values

## Proposed Refactoring Plan

### Phase 1: Extract Helper Methods
1. Break down each long function into logical components
2. Create focused helper methods (< 30 lines each)
3. Separate concerns: I/O, processing, formatting

### Phase 2: Improve Structure
1. Extract configuration into class attributes or constants
2. Create dedicated formatter classes/methods
3. Separate argument parsing from main logic

### Phase 3: Enhance Testability
1. Make functions pure where possible
2. Inject dependencies rather than hard-coding paths
3. Return values instead of printing directly

## Refactoring Strategy

### For `enhance_docs.py`:
```python
# Before: inject_schema() - 41 lines
# After: Break into:
- _read_file_content()
- _find_insertion_point()
- _insert_schema_markup()
- _write_file_content()
- inject_schema() # orchestrator, < 15 lines

# Before: enhance_directory() - 25 lines
# After: Break into:
- _get_readme_files()
- _should_process_directory()
- enhance_directory() # orchestrator, < 10 lines

# Before: _gather_context() - 34 lines
# After: Break into:
- _get_git_remote()
- _detect_languages()
- _gather_context() # orchestrator, < 10 lines
```

### For `run_analysis.py`:
```python
# Before: run_command() - 40 lines
# After: Break into:
- _print_command_header()
- _execute_subprocess()
- _handle_command_result()
- run_command() # orchestrator, < 15 lines

# Before: run_all_analysis() - 116 lines
# After: Break into:
- _print_analysis_header()
- _run_schema_generation()
- _run_quality_analysis()
- _run_coverage_analysis()
- _run_dependency_analysis()
- _generate_dashboard()
- _generate_rss_feed()
- _validate_schema()
- run_all_analysis() # orchestrator, < 20 lines

# Before: generate_summary_report() - 57 lines
# After: Break into:
- _build_report_header()
- _build_results_table()
- _build_files_section()
- _save_report()
- generate_summary_report() # orchestrator, < 15 lines
```

### For `run_tests.py`:
```python
# Before: run_tests() - 28 lines
# After: Break into:
- _print_test_header()
- _execute_test_suite()
- _calculate_results()
- run_tests() # orchestrator, < 12 lines

# Before: run_coverage_analysis() - 47 lines
# After: Break into:
- _check_coverage_available()
- _setup_coverage()
- _run_tests_with_coverage()
- _generate_coverage_reports()
- run_coverage_analysis() # orchestrator, < 15 lines

# Before: generate_summary_report() - 56 lines
# After: Break into:
- _build_summary_lines()
- _add_progress_bar()
- _add_status_message()
- _save_summary_report()
- generate_summary_report() # orchestrator, < 10 lines

# Before: main() - 40 lines
# After: Break into:
- _parse_arguments()
- _configure_test_directory()
- _run_test_pipeline()
- main() # orchestrator, < 15 lines
```

## Risk Assessment & Mitigation

### Risks
1. **Breaking existing functionality**
   - Mitigation: Test each change incrementally
2. **Changing output format**
   - Mitigation: Preserve exact output formatting
3. **Breaking command-line interface**
   - Mitigation: Keep argument parsing identical

### Success Metrics
- All functions < 30 lines
- Each function has single responsibility
- Preserved functionality (same inputs → same outputs)
- Improved code readability
- Enhanced testability

## Testing Strategy

1. **Before refactoring**: Capture current output for each script
2. **During refactoring**: Verify output remains identical
3. **After refactoring**: Run full test suite to ensure no breakage

## Migration Steps

### Step 1: Refactor `enhance_docs.py`
1. Extract helper methods from `inject_schema()`
2. Extract helper methods from `enhance_directory()`
3. Extract helper methods from `_gather_context()`
4. Verify functionality unchanged

### Step 2: Refactor `run_analysis.py`
1. Extract helper methods from `run_command()`
2. Break down `run_all_analysis()` into analysis steps
3. Refactor `generate_summary_report()`
4. Simplify `main()`
5. Verify functionality unchanged

### Step 3: Refactor `run_tests.py`
1. Extract helper methods from `run_tests()`
2. Break down `run_coverage_analysis()`
3. Refactor `generate_summary_report()`
4. Simplify `main()`
5. Verify functionality unchanged

## Anti-patterns Found and Fixes

1. **God Functions**: Functions doing too many things
   - Fix: Single Responsibility Principle
2. **Mixed I/O and Logic**: File operations mixed with business logic
   - Fix: Separate I/O operations into dedicated methods
3. **Hardcoded Values**: Paths and configurations hardcoded
   - Fix: Extract to class attributes or constants
4. **Print-based Output**: Direct printing instead of return values
   - Fix: Return data, let caller decide on output

## Complete Dependency Map

### enhance_docs.py
- No external dependencies on other scripts
- Uses: json, pathlib, subprocess, sys

### run_analysis.py
- Depends on: src.generators.*, src.analyzers.*, src.validators.*
- Uses: subprocess, pathlib, datetime, sys

### run_tests.py
- Depends on: unittest, coverage (optional)
- Uses: unittest, pathlib, subprocess, json, datetime, sys

## Timeline

- Phase 1: 2 hours (extract helper methods)
- Phase 2: 1 hour (improve structure)
- Phase 3: 1 hour (enhance testability)
- Testing: 1 hour (verify all functionality preserved)

Total estimated time: 5 hours