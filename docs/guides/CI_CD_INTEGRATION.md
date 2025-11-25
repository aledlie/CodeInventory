# CI/CD Integration Guide

This document explains how to integrate the Code Inventory analysis pipeline into your CI/CD workflow.

## Overview

The analysis pipeline includes:
- **Automated Testing**: Unit and integration tests with coverage reporting
- **Performance Benchmarking**: Parallel processing performance validation
- **Code Analysis**: Quality, coverage, and dependency analysis
- **Dashboard Generation**: Interactive HTML dashboard with all metrics

## GitHub Actions Workflow

### Setup

1. The workflow file is located at `.github/workflows/analysis-pipeline.yml`
2. It automatically runs on:
   - Push to `main` or `develop` branches
   - Pull requests to `main`
   - Daily schedule (2 AM UTC)

### Jobs

#### 1. Test Job
Runs all unit and integration tests with coverage reporting.

```bash
# Manual run
python scripts/run_tests.py
```

**Artifacts produced:**
- `coverage-report/` - HTML coverage report

#### 2. Benchmark Job
Runs performance benchmarks to validate optimization effectiveness.

```bash
# Manual run
python tests/performance/benchmark_suite.py
```

**Artifacts produced:**
- `performance_report.json` - Benchmark results with speedup ratios

#### 3. Analyze Job
Runs all code analysis tools with optimization enabled.

```bash
# Manual run
python -m src.analyzers.code_quality src/ --json quality_report.json
python -m src.analyzers.test_coverage src/ --test-dir tests/ --parallel --cache
python -m src.analyzers.dependencies src/ --detect-circular --parallel --cache
```

**Artifacts produced:**
- `quality_report.json` - Code quality issues
- `coverage_report.json` - Test coverage analysis
- `dependency_report.json` - Dependency graph with circular detection

#### 4. Dashboard Job
Generates interactive HTML dashboard with all metrics.

```bash
# Manual run
python -m src.generators.dashboard \
  --schemas schemas_enhanced.json \
  --quality quality_report.json \
  --coverage coverage_report.json \
  --dependency dependency_report.json \
  --output dashboard.html
```

**Artifacts produced:**
- `dashboard.html` - Interactive dashboard

**Optional**: Deploys to GitHub Pages if enabled

## Configuration

### Analysis Configuration

Edit `.github/config/analysis-config.yml` to customize:

```yaml
analysis:
  parallel_processing: true    # Enable parallel processing
  max_workers: null           # Auto-detect CPU count
  enable_cache: true          # Enable intelligent caching
```

### Performance Thresholds

Configure minimum acceptable thresholds:

```yaml
test_coverage:
  min_coverage: 70           # Minimum test coverage %
  fail_on_low_coverage: false

code_quality:
  max_errors: 0              # Maximum allowed errors
  fail_on_errors: false

dependencies:
  fail_on_circular: false    # Fail on circular dependencies
```

### Benchmark Settings

Configure performance benchmark parameters:

```yaml
benchmarks:
  enabled: true
  worker_counts: [1, 2, 4, 8]
  min_speedup_ratio: 1.2     # Minimum 1.2x speedup required
```

## Local Development

### Running Analysis Locally

```bash
# Complete analysis pipeline
python scripts/run_analysis.py --root /path/to/code

# Individual analyzers with optimization
python -m src.analyzers.test_coverage src/ --test-dir tests/ --parallel --cache
python -m src.analyzers.dependencies src/ --detect-circular --parallel --cache

# Performance benchmarks
python tests/performance/benchmark_suite.py
```

### Cache Management

```bash
# Clear cache before fresh analysis
python -m src.analyzers.test_coverage src/ --clear-cache
python -m src.analyzers.dependencies src/ --clear-cache

# Cache location
.analyzer_cache/
  ├── test_coverage_cache.json
  └── dependencies_cache.json
```

## Optimization Features

### Parallel Processing

- **Multi-core analysis**: Uses `ProcessPoolExecutor` for parallel file processing
- **Auto-detection**: Automatically detects CPU count (defaults to CPU count - 1)
- **Custom workers**: Configure with `--workers N` flag

**Performance gains:**
- Test Coverage: ~2x faster with 4 workers
- Dependencies: ~2.6x faster with 4 workers

### Intelligent Caching

- **Content-based**: SHA-256 hash of file content for cache invalidation
- **Persistent**: JSON-based cache survives between runs
- **Automatic**: No manual cache management required

**Cache hit rates:**
- First run: 0% (builds cache)
- Subsequent runs: 65-94% (only changed files reprocessed)
- Speedup: 2-10x faster on cached runs

## GitHub Pages Deployment

### Enable Dashboard Deployment

1. Enable GitHub Pages in repository settings:
   - Settings → Pages → Source: Deploy from branch `gh-pages`

2. Update workflow to enable deployment:
   ```yaml
   - name: Deploy to GitHub Pages (optional)
     if: github.ref == 'refs/heads/main'
     uses: peaceiris/actions-gh-pages@v3
   ```

3. Dashboard URL: `https://<username>.github.io/<repo>/dashboard.html`

### Custom Domain

Configure custom domain in repository settings:
- Settings → Pages → Custom domain

## Artifacts

### Accessing Artifacts

1. Navigate to Actions tab in GitHub repository
2. Select a workflow run
3. Scroll to "Artifacts" section
4. Download desired artifact

### Artifact Retention

Default retention: 30 days (configurable in `analysis-config.yml`)

## Troubleshooting

### ast-grep Not Found

**Error**: `ast-grep: command not found`

**Fix**: The workflow automatically installs ast-grep. For local development:
```bash
# macOS
brew install ast-grep

# Linux
curl -L https://github.com/ast-grep/ast-grep/releases/latest/download/ast-grep-x86_64-unknown-linux-gnu.zip -o ast-grep.zip
unzip ast-grep.zip
sudo mv sg /usr/local/bin/
```

### Cache Not Working

**Symptoms**: No speedup on subsequent runs

**Fix**:
1. Check cache directory exists: `.analyzer_cache/`
2. Verify cache files exist: `test_coverage_cache.json`, `dependencies_cache.json`
3. Clear and rebuild cache: `--clear-cache` flag

### Low Performance

**Symptoms**: Parallel processing slower than sequential

**Fix**:
1. Reduce worker count: `--workers 2`
2. Disable parallel processing: `--no-parallel` (if available)
3. Check system resources (CPU, memory)

### Tests Failing in CI

**Common causes:**
1. Missing dependencies: Check `requirements.txt`
2. Path issues: Tests expect to run from project root
3. ast-grep version mismatch: Pin version in workflow

## Integration Examples

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running code analysis..."
python -m src.analyzers.code_quality src/ --json /tmp/quality.json

# Check for critical errors
errors=$(jq '.summary.issues_by_severity.error' /tmp/quality.json)
if [ "$errors" -gt 0 ]; then
    echo "❌ Code quality check failed: $errors errors found"
    exit 1
fi

echo "✅ Code quality check passed"
```

### Pull Request Checks

Configure required status checks in repository settings:
- Settings → Branches → Branch protection rules → Require status checks
- Select: `test`, `analyze`, `benchmark`

### Scheduled Reports

Configure email notifications in workflow:
```yaml
- name: Send report email
  if: github.event_name == 'schedule'
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Daily Analysis Report
    body: file://quality_report.txt
    to: team@example.com
    from: CI/CD Pipeline
```

## Best Practices

1. **Run locally first**: Test changes before pushing
2. **Use caching**: Significant speedup on large codebases
3. **Monitor performance**: Check benchmark results regularly
4. **Set thresholds**: Configure quality gates for your project
5. **Review artifacts**: Download and review reports periodically
6. **Clear cache**: Clear cache after major refactoring
7. **Update regularly**: Keep workflow and dependencies up to date

## Performance Metrics

### Expected Benchmarks

**Test Coverage Analyzer:**
- Sequential baseline: ~2000ms for 50 files
- Parallel (4 workers): ~1000ms (2x speedup)
- Parallel + Cache: ~200ms (10x speedup)

**Dependency Analyzer:**
- Sequential baseline: ~1500ms for 50 files
- Parallel (4 workers): ~600ms (2.5x speedup)
- Parallel + Cache: ~150ms (10x speedup)

### Monitoring

View performance in dashboard:
- Cache hit rates
- Processing times
- Worker efficiency
- Speedup ratios

## Support

For issues or questions:
1. Check [troubleshooting section](#troubleshooting)
2. Review workflow logs in GitHub Actions
3. Open an issue in repository
4. Consult `CLAUDE.md` for project context
