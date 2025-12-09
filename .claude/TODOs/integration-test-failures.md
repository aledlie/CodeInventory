# Integration Test Failures

**Date**: 2025-12-08
**Branch**: `type-everything`
**Test Results**: 42 passed, 6 failed (87.5% pass rate)

---

## Summary

| # | Test | Root Cause | Priority |
|---|------|------------|----------|
| 1 | `test_coverage_analysis_pipeline` | Function extraction returning 0 | High |
| 2 | `test_schema_validation_pipeline` | Schema validator rejecting valid schema | Medium |
| 3 | `test_test_coverage_optimized_completes` | Function extraction returning 0 | High |
| 4 | `test_optimizations_can_be_disabled` | Function extraction returning 0 | High |
| 5 | `test_graceful_fallback_when_optimizer_unavailable` | Function extraction returning 0 | High |
| 6 | `test_parallel_analyzer_with_cache_enabled` | Cache not storing processed entries | Medium |

---

## Failure 1: test_coverage_analysis_pipeline

**File**: `tests/integration/test_full_pipeline.py:137`

**Assertion**:
```python
self.assertGreater(analyzer.report.total_functions, 0)
# AssertionError: 0 not greater than 0
```

**Logs**:
```
Found 4 test patterns
Found 0 functions in source code
```

**Root Cause**: `TestCoverageAnalyzer` is finding test patterns but not extracting any functions from the test fixture source files. The test fixture likely has Python files but the function extraction mechanism (using ast-grep patterns) is not matching them.

**Investigation Steps**:
1. Check test fixture structure at `test_project/src/`
2. Verify Python files in fixture have valid function definitions
3. Check if `_extract_functions_from_file()` is being called
4. Verify ast-grep patterns for Python function detection

**Potential Fix**: Review `TestCoverageAnalyzer._extract_functions_from_file()` method and ensure it handles the fixture file format.

---

## Failure 2: test_schema_validation_pipeline

**File**: `tests/integration/test_full_pipeline.py:225`

**Assertion**:
```python
self.assertTrue(result)
# AssertionError: False is not true
```

**Logs**:
```
ast-grep not available - falling back to regex for TypeScript/JavaScript
Schemas saved to /tmp/.../schemas.json
Schema.org markup: Included
Validating JSON file: /tmp/.../schemas.json
```

**Root Cause**: `SchemaValidator.validate_json_file()` returns `False` for the generated schema file. The validator may have strict requirements that the generated schema doesn't meet, or there's a mismatch between expected schema.org types.

**Investigation Steps**:
1. Examine the generated `schemas.json` content
2. Check what validation errors/warnings are reported
3. Review `SchemaValidator._validate_by_type()` for validation rules
4. Verify `@type` field matches expected schema.org types

**Potential Fix**: Either adjust schema generation to meet validator requirements, or relax validator rules for internal schema format.

---

## Failure 3: test_test_coverage_optimized_completes

**File**: `tests/integration/test_optimized_pipeline.py:54`

**Assertion**:
```python
assert analyzer.report.total_functions > 0
# AssertionError: assert 0 > 0
```

**Logs**:
```
Analyzing source directory: /Users/alyshialedlie/code/Inventory/src
Found 240 test patterns
Found 18 source files to analyze
Processing 18 items with 2 workers...
Found 0 functions in source code
```

**Root Cause**: Same as Failure 1. Despite finding 18 source files and processing them with the parallel analyzer, zero functions are extracted. The worker function `_analyze_file_worker` is being called but returning empty results.

**Investigation Steps**:
1. Add debug logging to `_analyze_file_worker()`
2. Check if ast-grep patterns are being executed correctly
3. Verify the cache isn't returning stale empty results
4. Test function extraction on a single known file

**Potential Fix**: The `_analyze_file_worker()` function in `test_coverage.py` may have an issue with how it extracts functions or returns results.

---

## Failure 4: test_optimizations_can_be_disabled

**File**: `tests/integration/test_optimized_pipeline.py:126`

**Assertion**:
```python
assert analyzer.report.total_functions > 0
# AssertionError: assert 0 > 0
```

**Logs**:
```
Optimizations disabled, using sequential processing
Found 240 test patterns
Found 0 functions in source code
```

**Root Cause**: Same underlying issue as Failures 1 and 3. Even with optimizations disabled (sequential processing), zero functions are found. This confirms the issue is in the core function extraction logic, not the parallel/cache optimization layer.

**Investigation Steps**:
1. Test `analyze_coverage()` method directly with debug output
2. Verify `_find_python_functions()` returns results
3. Check if file reading is working correctly

**Potential Fix**: Fix the core function extraction in `TestCoverageAnalyzer`.

---

## Failure 5: test_graceful_fallback_when_optimizer_unavailable

**File**: `tests/integration/test_optimized_pipeline.py:202`

**Assertion**:
```python
assert analyzer.report.total_functions > 0
# AssertionError: assert 0 > 0
```

**Logs**:
```
Optimizer not available, falling back to sequential processing
Found 240 test patterns
Found 0 functions in source code
```

**Root Cause**: Same as Failures 1, 3, and 4. The test simulates optimizer unavailability and verifies graceful fallback, but the underlying function extraction issue prevents any functions from being found.

**Investigation Steps**: Same as Failure 4.

**Potential Fix**: This test will pass once the core function extraction issue is fixed.

---

## Failure 6: test_parallel_analyzer_with_cache_enabled

**File**: `tests/integration/test_parallel_analyzers.py:176`

**Assertion**:
```python
assert len(optimizer.cache.metadata.entries) > 0
# AssertionError: assert 0 > 0
```

**Logs**:
```
Processing 5 items with 4 workers...
cache_test cache saved with 0 entries
```

**Root Cause**: The `ParallelAnalyzer` processes 5 items but saves 0 cache entries. The cache only stores results when `processor_func` returns non-None values. The test's mock processor may be returning `None` or the cache storage logic has a bug.

**Investigation Steps**:
1. Check the test's `processor_func` implementation
2. Verify `_store_result()` is being called with valid data
3. Check if `skip_cached` logic is accidentally skipping all items
4. Verify hash function returns consistent values

**Potential Fix**: Either the test's mock processor needs to return cacheable data, or there's a bug in `ParallelAnalyzer._store_result()` that prevents caching.

---

## Root Cause Analysis

### Primary Issue: Function Extraction (Failures 1, 3, 4, 5)

All four test coverage failures share the same root cause: `TestCoverageAnalyzer` cannot extract functions from Python source files.

**Likely Causes**:
1. ast-grep patterns for Python function detection are not matching
2. The `_extract_functions_from_file()` method has a bug
3. File path handling issues in multiprocessing context
4. Worker function returning `None` instead of results

**Files to Investigate**:
- `src/analyzers/test_coverage.py` - `_extract_functions_from_file()`, `_analyze_file_worker()`
- `src/analyzers/analyzer_optimizer.py` - `process_items_parallel()`

### Secondary Issue: Schema Validation (Failure 2)

The schema validator is rejecting internally-generated schemas. This may be a validation logic issue or schema format mismatch.

**Files to Investigate**:
- `src/validators/schema.py` - `validate_json_file()`, `_validate_by_type()`
- `src/generators/schema.py` - Schema generation logic

### Tertiary Issue: Cache Storage (Failure 6)

The parallel analyzer cache is not storing results despite processing items successfully.

**Files to Investigate**:
- `src/analyzers/analyzer_optimizer.py` - `_store_result()`, cache logic
- `tests/integration/test_parallel_analyzers.py` - Test setup and mock functions

---

## Recommended Fix Order

1. **Fix function extraction** (High Priority)
   - This will resolve 4 out of 6 failures
   - Debug `TestCoverageAnalyzer._extract_functions_from_file()`
   - Verify ast-grep integration

2. **Fix cache storage** (Medium Priority)
   - Debug `ParallelAnalyzer` cache logic
   - Verify test mock functions

3. **Fix schema validation** (Medium Priority)
   - May be a test expectation issue rather than a bug
   - Review what schema format the validator expects

---

## Commands for Debugging

```bash
# Run single failing test with verbose output
source .venv/bin/activate
python3 -m pytest tests/integration/test_full_pipeline.py::TestFullPipeline::test_coverage_analysis_pipeline -v -s

# Test function extraction directly
python3 -c "
from src.analyzers.test_coverage import TestCoverageAnalyzer
from pathlib import Path
analyzer = TestCoverageAnalyzer(Path('src'), Path('tests'))
analyzer.analyze_coverage()
print(f'Total functions: {analyzer.report.total_functions}')
"

# Check ast-grep availability
python3 -c "
from src.generators.schema import AstGrepHelper
print(f'ast-grep available: {AstGrepHelper.check_available()}')
print(f'Executable: {AstGrepHelper._find_executable()}')
"
```
