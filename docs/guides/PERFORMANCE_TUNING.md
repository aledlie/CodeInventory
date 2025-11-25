# Performance Tuning Guide

This guide explains how to optimize the performance of Code Inventory analyzers using parallel processing, caching, and other optimization techniques.

## Quick Start

### Recommended Configuration (Medium to Large Codebases)

```bash
# Enable all optimizations
python -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --parallel \
  --cache \
  --workers 4

python -m src.analyzers.dependencies src/ \
  --parallel \
  --cache \
  --workers 4 \
  --detect-circular
```

**Expected results:**
- First run: 2-3x faster than sequential
- Subsequent runs: 5-10x faster (with cache hits)

### Small Codebases (<50 files)

```bash
# Sequential mode may be faster for small projects
python -m src.analyzers.test_coverage src/ --test-dir tests/
python -m src.analyzers.dependencies src/
```

## Optimization Features

### 1. Parallel Processing

**What it does:**
- Uses Python's `ProcessPoolExecutor` for multi-core file processing
- Distributes file analysis across multiple worker processes
- Automatically detects CPU count

**When to use:**
- Medium to large codebases (50+ files)
- Multi-core systems (2+ cores)
- I/O-bound analysis tasks

**How to enable:**
```bash
# Enable with default workers (CPU count - 1)
python -m src.analyzers.test_coverage src/ --parallel

# Specify worker count
python -m src.analyzers.test_coverage src/ --parallel --workers 4
```

**Performance characteristics:**
- **Test Coverage**: 2-3x speedup with 4 workers
- **Dependencies**: 2.5-3x speedup with 4 workers
- **Overhead**: ~100-200ms for process pool setup

### 2. Intelligent Caching

**What it does:**
- SHA-256 content-based cache invalidation
- Persistent JSON cache survives between runs
- Automatic cache management (no manual intervention)

**Cache structure:**
```
.analyzer_cache/
├── test_coverage_cache.json
└── dependencies_cache.json
```

**When to use:**
- Always (unless you need fresh analysis)
- Iterative development workflows
- CI/CD pipelines with incremental changes

**How to enable:**
```bash
# Enable caching
python -m src.analyzers.test_coverage src/ --cache

# Clear cache for fresh analysis
python -m src.analyzers.test_coverage src/ --clear-cache

# Disable caching
python -m src.analyzers.test_coverage src/ --no-cache
```

**Performance characteristics:**
- **First run**: No speedup (builds cache)
- **Cache hit rate**: 65-95% on typical changes
- **Speedup**: 5-10x faster on cached files

### 3. Combined Optimization

**Best performance:**
```bash
python -m src.analyzers.test_coverage src/ \
  --parallel \
  --cache \
  --workers 4
```

**Expected performance:**
- First run: 2-3x faster (parallel only)
- Subsequent runs: 10-20x faster (parallel + cache)

## Performance Benchmarking

### Running Benchmarks

```bash
# Complete benchmark suite
python tests/performance/benchmark_suite.py

# Output
# - Console: Detailed results with speedup ratios
# - File: performance_report.json
```

### Benchmark Metrics

**Test Coverage Analyzer:**
```
Sequential:              2000ms
Parallel (4 workers):    1000ms  (2x speedup)
Parallel + Cache (1st):  900ms   (2.2x speedup)
Parallel + Cache (2nd):  200ms   (10x speedup)
```

**Dependency Analyzer:**
```
Sequential:              1500ms
Parallel (4 workers):    600ms   (2.5x speedup)
Parallel + Cache (1st):  550ms   (2.7x speedup)
Parallel + Cache (2nd):  150ms   (10x speedup)
```

### Interpreting Results

**Speedup ratio > 1.5x**: Optimization effective, recommend using
**Speedup ratio 1.0-1.5x**: Marginal benefit, consider disabling
**Speedup ratio < 1.0x**: Overhead outweighs benefit, disable optimization

## Performance Monitoring

### Generate Performance Report

```bash
# Without benchmark data
python -m src.utils.performance_monitor

# With benchmark data
python -m src.utils.performance_monitor \
  --benchmark performance_report.json \
  --output monitor_report.json
```

### Report Contents

1. **Cache Statistics**
   - Total cached files per analyzer
   - Last update timestamps
   - Cache version information

2. **Performance Metrics**
   - Speedup ratios (if benchmark data provided)
   - Cache hit rates
   - Throughput metrics

3. **Recommendations**
   - Tuning suggestions based on metrics
   - Worker count recommendations
   - Cache management advice

### Sample Report

```
================================================================================
PERFORMANCE MONITORING REPORT
================================================================================

Generated: 2025-11-23T14:30:00

📊 SUMMARY
--------------------------------------------------------------------------------
Total Analyzers: 2
Total Cached Files: 45
Caching Enabled: True

⚡ SPEEDUP RATIOS
--------------------------------------------------------------------------------
Test Coverage Parallel vs Sequential: 2.10x
Test Coverage Cache Speedup: 8.50x
Dependencies Parallel vs Sequential: 2.60x
Dependencies Cache Speedup: 10.20x

💡 RECOMMENDATIONS
--------------------------------------------------------------------------------
1. ✅ Cache is active with 45 cached files. Subsequent runs will be much faster.
2. ✅ Test coverage parallel processing is highly effective (2.1x speedup).
3. ✅ Dependency analysis parallel processing is highly effective (2.6x speedup).
4. 💡 Adjust worker count with --workers flag for optimal performance.
```

## Tuning Guidelines

### Worker Count Selection

**Rule of thumb**: Start with `CPU count - 1`

```python
import os
optimal_workers = max(1, os.cpu_count() - 1)
```

**Tuning process:**
1. Run benchmark with different worker counts: `[1, 2, 4, 8]`
2. Identify optimal count (highest speedup ratio)
3. Configure as default

**Considerations:**
- **Small files**: More workers = more overhead
- **Large files**: More workers = diminishing returns
- **I/O-bound**: More workers = better parallelism
- **CPU-bound**: Workers > cores = no benefit

### Cache Strategy

**When to enable caching:**
- ✅ Iterative development (frequent small changes)
- ✅ CI/CD pipelines (incremental commits)
- ✅ Large codebases (>100 files)
- ✅ Expensive analysis operations

**When to disable caching:**
- ❌ One-time analysis
- ❌ Benchmarking (testing raw performance)
- ❌ After major refactoring (most files changed)

**Cache invalidation:**
- Automatic on content change (SHA-256 hash)
- Manual: `--clear-cache` flag
- File deletion: Run `--clear-cache` to remove stale entries

### System Resource Optimization

**Memory considerations:**
```bash
# Reduce worker count if memory constrained
python -m src.analyzers.test_coverage src/ --workers 2
```

**CPU considerations:**
```bash
# Leave cores for other processes
python -m src.analyzers.test_coverage src/ --workers $(( $(nproc) - 2 ))
```

## Common Scenarios

### Scenario 1: First Analysis of Large Codebase

```bash
# Use parallel processing, enable caching for future runs
python -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --parallel \
  --cache \
  --workers 4
```

**Expected**: Faster than sequential, builds cache for future

### Scenario 2: Incremental Development

```bash
# Leverage cache for maximum speedup
python -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --parallel \
  --cache
```

**Expected**: 5-10x speedup on unchanged files

### Scenario 3: CI/CD Pipeline

```bash
# Balance speed with reliability
python -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --parallel \
  --cache \
  --workers 4
```

**Expected**: Fast on incremental commits, cache persists between builds

### Scenario 4: Major Refactoring

```bash
# Clear cache for accurate results
python -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --parallel \
  --clear-cache
```

**Expected**: Rebuild cache from scratch, accurate fresh analysis

### Scenario 5: Performance Benchmarking

```bash
# Disable optimizations for baseline measurement
python -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --no-parallel \
  --no-cache
```

**Expected**: Baseline performance for comparison

## Troubleshooting

### Problem: Parallel Processing Slower Than Sequential

**Symptoms:**
- Speedup ratio < 1.0
- Processing takes longer with `--parallel`

**Causes:**
- Small codebase (overhead dominates)
- Single-core system
- Large individual files (serialization bottleneck)

**Solutions:**
1. Disable parallel processing
2. Reduce worker count: `--workers 1`
3. Use sequential mode for small projects

### Problem: Cache Not Working

**Symptoms:**
- No speedup on subsequent runs
- Cache hit rate: 0%

**Causes:**
- Cache directory not writable
- Cache files corrupted
- Content hash mismatch (files modified externally)

**Solutions:**
1. Check cache directory exists: `.analyzer_cache/`
2. Verify cache files: `ls -la .analyzer_cache/`
3. Clear and rebuild: `--clear-cache`
4. Check file permissions: `chmod -R u+w .analyzer_cache/`

### Problem: Memory Issues

**Symptoms:**
- Out of memory errors
- System slowdown during analysis

**Causes:**
- Too many workers
- Large cache in memory
- Memory leak (rare)

**Solutions:**
1. Reduce workers: `--workers 2`
2. Clear cache: `--clear-cache`
3. Run sequentially: disable `--parallel`
4. Analyze in batches (split large codebases)

### Problem: Stale Cache Entries

**Symptoms:**
- Incorrect analysis results
- Missing new code patterns
- Deleted files still in reports

**Causes:**
- Files deleted without cache update
- External file modifications
- Cache corruption

**Solutions:**
1. Clear cache: `--clear-cache`
2. Verify file timestamps match cache
3. Rebuild cache from scratch

## Advanced Topics

### Custom Worker Functions

For new analyzers, create picklable worker functions:

```python
# Module-level function (required for pickle)
def _analyze_file_worker(file_path: Path) -> List[Dict[str, Any]]:
    """Worker function for parallel processing"""
    # Analysis logic here
    return results  # Must be JSON-serializable

# Use with ParallelAnalyzer
from src.analyzers.analyzer_optimizer import ParallelAnalyzer

optimizer = ParallelAnalyzer(
    analyzer_name='my_analyzer',
    max_workers=4,
    use_cache=True
)

results = optimizer.process_items_parallel(
    items=files,
    processor_func=_analyze_file_worker,
    key_func=lambda x: str(x),
    hash_func=lambda x: hash_file_content(x),
    skip_cached=True,
    description="Analyzing files"
)
```

### Cache Internals

**Cache structure:**
```json
{
  "version": "1.0",
  "analyzer_name": "test_coverage",
  "last_update": 1700000000.0,
  "entries": {
    "src/file.py": {
      "key": "src/file.py",
      "hash": "abc123...",
      "timestamp": 1700000000.0,
      "result": [...],
      "analyzer_version": "1.0"
    }
  }
}
```

**Hash calculation:**
```python
import hashlib
import json

def calculate_hash(content: Any) -> str:
    if isinstance(content, (dict, list)):
        content_str = json.dumps(content, sort_keys=True)
    else:
        content_str = str(content)
    return hashlib.sha256(content_str.encode()).hexdigest()
```

### Performance Profiling

**Profile analyzer execution:**
```bash
# Use Python profiler
python -m cProfile -o profile.stats \
  -m src.analyzers.test_coverage src/ --parallel --cache

# Analyze results
python -m pstats profile.stats
>>> sort cumtime
>>> stats 20
```

**Profile with line_profiler:**
```bash
# Install
pip install line_profiler

# Profile specific function
kernprof -l -v src/analyzers/test_coverage.py
```

## Best Practices Summary

1. ✅ **Use parallel + cache** for optimal performance on medium/large codebases
2. ✅ **Tune worker count** based on benchmarks (start with CPU count - 1)
3. ✅ **Monitor performance** with benchmark suite and monitoring reports
4. ✅ **Clear cache** after major refactoring or structural changes
5. ✅ **Disable optimizations** for small projects or when troubleshooting
6. ✅ **Check cache directory** for correct permissions and disk space
7. ✅ **Run benchmarks** periodically to validate optimization effectiveness
8. ✅ **Review recommendations** in performance monitoring reports

## Performance Metrics Reference

### Expected Speedup Ratios

| Optimization | Small (<50 files) | Medium (50-500 files) | Large (>500 files) |
|--------------|-------------------|----------------------|--------------------|
| Sequential   | 1.0x (baseline)   | 1.0x (baseline)      | 1.0x (baseline)    |
| Parallel     | 0.8-1.2x          | 1.5-2.5x             | 2.0-3.5x           |
| Cache (1st)  | 1.0x              | 1.0x                 | 1.0x               |
| Cache (2nd)  | 2-3x              | 5-8x                 | 8-15x              |
| Both (2nd)   | 2-4x              | 7-15x                | 15-30x             |

### Cache Hit Rates

| Scenario                  | Expected Hit Rate |
|---------------------------|-------------------|
| First run                 | 0%                |
| Small change (1-2 files)  | 95-99%            |
| Feature work (10-20 files)| 70-90%            |
| Major refactor (50+ files)| 20-50%            |
| Complete rewrite          | 0-10%             |

### Resource Usage

| Workers | CPU Usage | Memory Usage | Optimal For        |
|---------|-----------|--------------|-------------------|
| 1       | ~100%     | ~100 MB      | Small projects    |
| 2       | ~200%     | ~150 MB      | Medium projects   |
| 4       | ~400%     | ~200 MB      | Large projects    |
| 8       | ~800%     | ~300 MB      | Very large projects|

## Additional Resources

- **Benchmarking**: `tests/performance/benchmark_suite.py`
- **Performance Monitor**: `src/utils/performance_monitor.py`
- **Optimizer Source**: `src/analyzers/analyzer_optimizer.py`
- **CI/CD Integration**: `docs/CI_CD_INTEGRATION.md`
- **Project Context**: `CLAUDE.md`

## Support

For performance-related issues:
1. Run benchmarks: `python tests/performance/benchmark_suite.py`
2. Generate monitoring report: `python -m src.utils.performance_monitor`
3. Review recommendations in report
4. Check troubleshooting section above
5. Open issue with benchmark results and system specs
