# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

Code Inventory is a comprehensive code analysis and documentation system that uses ast-grep and Schema.org to analyze codebases, detect code quality issues, track test coverage, analyze dependencies, and generate interactive reports.

## Project Architecture

### Core Pipeline

The system operates as a multi-stage analysis pipeline:

```
Source Code
    ↓
1. Schema Generation (src/generators/schema.py)
   - Parses Python/TypeScript/JavaScript files using AST + ast-grep
   - Extracts classes, functions, imports with 95%+ accuracy
   - Generates schemas_enhanced.json with schema.org vocabulary
    ↓
2. Parallel Analysis (src/analyzers/)
   - Code Quality: Detects code smells, security issues, best practices
   - Test Coverage: Matches functions with test cases
   - Dependencies: Analyzes imports, detects circular dependencies
    ↓
3. Report Generation (src/generators/)
   - Dashboard: Interactive HTML with metrics and visualizations
   - RSS Feed: Git commit-based feed with schema.org markup
    ↓
4. Validation (src/validators/)
   - Schema.org validation for generated JSON-LD
    ↓
5. Interactive Dashboard (src/features/dashboard/)
   - React 18 + TypeScript + MUI v7 frontend
   - Consumes JSON reports from public/data/
   - Real-time metrics visualization with Chart.js
```

### Key Design Patterns

**ast-grep Integration**: All analyzers use ast-grep for structural pattern matching rather than regex. This provides syntax-aware parsing that handles edge cases correctly (e.g., distinguishing `async function` from comments mentioning "async function").

**Dataclass-Based Schema**: Uses Python dataclasses (`FunctionDef`, `ClassDef`, `FileDef`, `DirectorySchema`) for type-safe schema representation. These are serialized to JSON using custom serialization logic that handles nested dataclasses.

**Logging Architecture**: All modules use Python's `logging` module with a consistent pattern:
```python
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
```

A centralized logging configuration is available in `src/utils/logging_config.py` with:
- Colored console output with ColoredFormatter
- Structured logging format for production
- Optional Sentry integration for error tracking
- Performance metric logging

**Error Handling Pattern**: Subprocess calls to ast-grep include timeout (30s) and graceful fallback. If ast-grep fails, the system logs a warning and continues with partial results rather than failing completely.

**Optimization Pattern (Phase 3)**: Analyzers use shared optimization utilities for parallel processing and intelligent caching:
```python
from src.analyzers.analyzer_optimizer import ParallelAnalyzer, AnalyzerCache

# Worker function at module level (must be picklable)
def _analyze_file_worker(file_path: Path) -> List[Dict[str, Any]]:
    """Worker function for parallel processing"""
    # Analysis logic
    return json_serializable_results

# Use in analyzer
optimizer = ParallelAnalyzer(
    analyzer_name='my_analyzer',
    max_workers=4,
    use_cache=True,
    cache_dir=Path.cwd() / '.analyzer_cache'
)

results = optimizer.process_items_parallel(
    items=files,
    processor_func=_analyze_file_worker,
    key_func=lambda x: str(x),
    hash_func=get_file_content_hash,
    skip_cached=True,
    description="Analyzing files"
)
```

Key principles:
- Worker functions must be module-level (picklable for multiprocessing)
- Return only JSON-serializable data (no Path objects, file handles, etc.)
- SHA-256 content hashing for cache invalidation
- Graceful fallback to sequential processing if optimization unavailable

## Secret Management with Doppler

This project uses **Doppler** for secret management. All sensitive credentials are stored in:
- **Project**: `integrity-studio`
- **Config**: `dev`

### Key Secrets
- `SENTRY_DSN`: Sentry Data Source Name for error tracking
- `SENTRY_ENVIRONMENT`: Environment name (development, staging, production)

### Using Doppler

**Run commands with Doppler secrets**:
```bash
# Using doppler run
doppler run --project integrity-studio --config dev -- python3 scripts/run_analysis.py

# Using convenience script
./scripts/run_with_doppler.sh python3 scripts/run_analysis.py
```

**Load secrets into current shell**:
```bash
eval $(doppler secrets download --project integrity-studio --config dev --format env-no-quotes)
```

**IMPORTANT**: Never hardcode credentials. Always use `os.getenv()` to read from environment variables that Doppler provides.

## Common Commands

### Run Complete Analysis Pipeline

**Basic usage**:
```bash
cd /Users/alyshialedlie/code/Inventory
python3 scripts/run_analysis.py --root /Users/alyshialedlie/code
```

**With optimizations** (3-8x faster):
```bash
# Parallel processing + caching
python3 scripts/run_analysis.py --root /Users/alyshialedlie/code --parallel --cache

# With Sentry error tracking via Doppler
./scripts/run_with_doppler.sh python3 scripts/run_analysis.py --parallel --cache
```

Generates: schemas, quality reports, coverage analysis, dependency analysis, dashboard, RSS feed, validation report.

**Optimization Features**:
- `--parallel`: Process files in parallel using multiple CPU cores (3x faster)
- `--cache`: Skip unchanged files using intelligent caching (8x faster on subsequent runs)
- `--workers N`: Specify number of parallel workers (default: CPU count - 1)
- `--clear-cache`: Clear cache before running

See `docs/PERFORMANCE_TUNING.md` for detailed performance benchmarks and best practices.

### Run Individual Analysis Tools

**Schema Generation** (must run first):
```bash
# Basic (sequential processing)
python3 -m src.generators.schema --root /Users/alyshialedlie/code

# Optimized (parallel + caching)
python3 -m src.generators.schema --root /Users/alyshialedlie/code --parallel --cache
```

**Code Quality Analysis**:
```bash
python3 -m src.analyzers.code_quality /path/to/code \
  --json quality_report.json \
  --text quality_report.txt
```

**Test Coverage**:
```bash
# Basic
python3 -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --json coverage_report.json

# Optimized (recommended - 5-10x faster)
python3 -m src.analyzers.test_coverage src/ \
  --test-dir tests/ \
  --json coverage_report.json \
  --parallel \
  --cache \
  --workers 4
```

**Dependency Analysis with Circular Detection**:
```bash
# Basic
python3 -m src.analyzers.dependencies /path/to/code \
  --detect-circular \
  --json dependency_report.json

# Optimized (recommended - 5-10x faster)
python3 -m src.analyzers.dependencies /path/to/code \
  --detect-circular \
  --json dependency_report.json \
  --parallel \
  --cache \
  --workers 4
```

**Interactive Dashboard** (Static HTML):
```bash
python3 -m src.generators.dashboard \
  --schemas outputs/schemas/schemas_enhanced.json \
  --quality outputs/quality/quality_report.json \
  --coverage outputs/coverage/coverage_report.json \
  --dependency outputs/dependencies/dependency_report.json \
  --output outputs/dashboards/dashboard.html
```

### React Dashboard Frontend

**Development Server**:
```bash
npm run dev
# Opens at http://localhost:5173/dashboard
```

**Build & Preview**:
```bash
npm run build
npm run preview
```

**Update Dashboard Data** (after running Python analysis):
```bash
# Copy latest reports to public/data/ for dashboard to consume
cp outputs/quality/quality_report*.json public/data/quality/quality_report.json
cp outputs/coverage/coverage_report*.json public/data/coverage/coverage_report.json
cp outputs/dependencies/dependency_report*.json public/data/dependencies/dependency_report.json
```

**TypeScript Type Checking**:
```bash
npx tsc --noEmit
```

### Testing

**Run All Tests**:
```bash
python3 scripts/run_tests.py
```

**Run with HTML Coverage Report**:
```bash
python3 scripts/run_tests.py
open htmlcov/index.html
```

**Run Specific Test Suites**:
```bash
python3 scripts/run_tests.py --unit-only
python3 scripts/run_tests.py --integration-only
```

**Run Single Test File**:
```bash
python3 -m pytest tests/unit/test_code_quality_analyzer.py -v
```

**Run Single Test Function**:
```bash
python3 -m pytest tests/unit/test_code_quality_analyzer.py::test_analyze_file -v
```

**Generate Coverage Report Manually**:
```bash
coverage run -m pytest tests/
coverage report
coverage html
```

### Custom ast-grep Rules

The project includes custom ast-grep rule files in `ast-grep-rules/`:
- `python-best-practices.yml`
- `typescript-best-practices.yml`
- `security-checks.yml`

Configuration is in `sgconfig.yml`. To use custom rules:
```bash
ast-grep scan --config sgconfig.yml
```

### Performance Optimization

**Performance Benchmarking**:
```bash
# Run complete benchmark suite
python tests/performance/benchmark_suite.py

# Generates performance_report.json with speedup metrics
```

**Performance Monitoring**:
```bash
# Generate performance monitoring report
python -m src.utils.performance_monitor

# With benchmark data
python -m src.utils.performance_monitor \
  --benchmark performance_report.json \
  --output monitor_report.json
```

**Cache Management**:
```bash
# View cache statistics
ls -lh .analyzer_cache/

# Clear cache for fresh analysis
python -m src.analyzers.test_coverage src/ --clear-cache
python -m src.analyzers.dependencies src/ --clear-cache

# Cache files
.analyzer_cache/
├── test_coverage_cache.json
└── dependencies_cache.json
```

**Expected Performance Gains**:
- **Parallel Processing**: 2-3x speedup with 4 workers
- **Intelligent Caching**: 5-10x speedup on subsequent runs
- **Combined**: 10-20x speedup on cached files

**Optimization Architecture**:
- `src/analyzers/analyzer_optimizer.py` - Shared optimization utilities
  - `ParallelAnalyzer` - Multi-core file processing
  - `AnalyzerCache` - SHA-256 content-based caching
  - Worker function patterns for pickle compatibility
- `tests/performance/benchmark_suite.py` - Automated benchmarking
- `tests/integration/` - Integration tests for optimized pipeline
- `src/utils/performance_monitor.py` - Performance monitoring and reporting

**Documentation**:
- `docs/guides/PERFORMANCE_TUNING.md` - Comprehensive performance tuning guide
- `docs/guides/CI_CD_INTEGRATION.md` - CI/CD integration with optimizations
- `docs/guides/` - How-to guides and implementation documentation
- `docs/summaries/` - Project phase summaries and completion reports
- `docs/testing/` - Test documentation and test case specifications
- `docs/integrations/` - Integration guides (Sentry, Doppler, etc.)
- `docs/refactoring/` - Refactoring plans and analysis
- `docs/examples/` - Code examples and usage patterns
- `docs/archive/` - Historical documentation

## Critical Implementation Details

### ast-grep Meta Variable Handling

ast-grep changed its JSON output format between versions. The code handles both:

```python
# New format: metaVariables.single.VAR_NAME.text
# Old format: metaVariables.VAR_NAME.text or metaVariables.VAR_NAME (string)

def get_meta_var(match: Dict[str, Any], var_name: str) -> Optional[str]:
    meta = match.get('metaVariables', {})
    if 'single' in meta and var_name in meta['single']:
        node = meta['single'][var_name]
        return node.get('text') if isinstance(node, dict) else str(node)
    elif var_name in meta:
        node = meta[var_name]
        return node.get('text') if isinstance(node, dict) else str(node)
    return None
```

All code that parses ast-grep output must use this pattern to avoid breaking on version updates.

### Async Function Detection

TypeScript/JavaScript async functions are detected with:
```python
pattern = 'async function $NAME($$$) { $$$ }'
```

This correctly identifies async functions without false positives from comments. The `is_async` flag is set on `FunctionDef` objects.

### Export Detection

TypeScript/JavaScript exports are detected with multiple patterns:
```python
patterns = [
    'export function $NAME',
    'export class $NAME',
    'export const $NAME',
    'export { $NAME }'
]
```

The `is_exported` flag helps identify public API surface.

### Schema.org Markup Generation

Generated schemas include schema.org vocabulary:
- `SoftwareSourceCode` for individual files
- `SoftwareApplication` for repositories
- `Dataset` for generated data files
- `TechArticle` for documentation

JSON-LD is automatically injected into README.md files as `<script type="application/ld+json">`.

### Circular Dependency Detection

Uses depth-first search with recursion stack tracking:

```python
def dfs(node, path, visited, rec_stack):
    visited.add(node)
    rec_stack.add(node)
    path.append(node)

    for neighbor in dependency_graph.get(node, set()):
        if neighbor not in visited:
            dfs(neighbor, path.copy(), visited, rec_stack)
        elif neighbor in rec_stack:
            # Found cycle
            cycle_start = path.index(neighbor)
            cycle = path[cycle_start:] + [neighbor]
```

This correctly identifies all cycles without false positives from DAG structures.

## Directory Structure

```
Inventory/
├── src/                          # Source code (Python analyzers + React frontend)
│   ├── analyzers/                # Python code analysis modules
│   │   ├── analyzer_optimizer.py # Parallel processing & caching
│   │   ├── code_quality.py       # Code quality and best practices
│   │   ├── dependencies.py       # Dependency analysis
│   │   └── test_coverage.py      # Test coverage tracking
│   ├── generators/               # Python content generation
│   │   ├── schema.py             # Enhanced schema generator
│   │   ├── schema_optimizer.py   # Schema optimization utilities
│   │   ├── dashboard.py          # HTML dashboard generator
│   │   └── rss.py                # RSS feed generator
│   ├── validators/               # Validation modules
│   │   └── schema.py             # Schema.org validator
│   ├── cache/                    # Caching utilities
│   │   └── analysis_cache.py     # Analysis result caching
│   ├── utils/                    # Utility modules
│   │   ├── git_operations.py     # Git automation
│   │   ├── logging_config.py     # Centralized logging
│   │   └── performance_monitor.py # Performance tracking
│   ├── features/dashboard/       # React dashboard frontend
│   │   ├── components/           # UI components (Dashboard, Header, Sidebar, etc.)
│   │   ├── api/                  # Data fetching & transformation
│   │   ├── hooks/                # TanStack Query hooks
│   │   ├── helpers/              # Metrics calculation utilities
│   │   ├── types/                # TypeScript interfaces
│   │   └── providers/            # React context providers
│   ├── routes/                   # TanStack Router routes
│   │   └── dashboard/            # Dashboard route
│   ├── theme/                    # MUI v7 theme configuration
│   ├── styles/                   # CSS design tokens & global styles
│   └── components/               # Shared React components
├── public/data/                  # Dashboard data (served by Vite)
│   ├── quality/                  # Quality reports for dashboard
│   ├── coverage/                 # Coverage reports for dashboard
│   └── dependencies/             # Dependency reports for dashboard
├── scripts/                      # Executable scripts
│   ├── run_analysis.py           # Analysis orchestrator
│   ├── run_tests.py              # Test runner
│   ├── run_with_doppler.sh       # Doppler secret injection
│   ├── enhance_docs.py           # Documentation enhancer
│   └── push_changes.sh           # Git push automation
├── tests/                        # Test suite
│   ├── unit/                     # Unit tests (Python + React)
│   ├── integration/              # Integration tests
│   ├── performance/              # Benchmarking tests
│   └── fixtures/                 # Sample code for testing
├── docs/                         # Documentation
│   ├── guides/                   # How-to guides
│   ├── summaries/                # Phase summaries
│   ├── testing/                  # Test documentation
│   ├── integrations/             # Integration guides
│   ├── archive/                  # Historical docs
│   ├── examples/                 # Code examples
│   └── refactoring/              # Refactoring plans
├── ast-grep-rules/               # Custom ast-grep patterns
│   ├── python-best-practices.yml
│   ├── typescript-best-practices.yml
│   └── security-checks.yml
├── outputs/                      # Generated files (gitignored)
│   ├── schemas/                  # Schema JSON files
│   ├── quality/                  # Quality reports
│   ├── coverage/                 # Coverage reports
│   ├── dependencies/             # Dependency reports
│   ├── dashboards/               # HTML dashboards
│   └── rss/                      # RSS feeds
├── package.json                  # npm dependencies (React frontend)
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── tsr.config.json               # TanStack Router configuration
```

### Skipped Directories

The schema generator skips these directories automatically:
- `node_modules`, `__pycache__`, `.git`
- `.venv`, `venv`, `env`
- `dist`, `build`, `_site`, `.next`
- `.cache`, `coverage`

Add to skip list in schema generator if analyzing new directory patterns.

## MCP Integration

### ast-grep MCP
Located at: `/Users/alyshialedlie/code/ast-grep-mcp`

Provides structural code search via AST patterns. Used extensively by all analyzers. The system will work without the MCP but will fall back to subprocess calls to the ast-grep CLI.

### Schema.org MCP
Located at: `/Users/alyshialedlie/code/ISInternal/schema-org-mcp`

Provides schema.org vocabulary access and JSON-LD generation. Used by validators and generators for semantic markup.

## Interactive Dashboard (React Frontend)

### Overview

The project includes a React 18 + TypeScript interactive dashboard for visualizing analysis results. Located in `src/features/dashboard/` with TanStack Router routing at `src/routes/dashboard/`.

**Tech Stack:**
- React 18 with TypeScript (strict mode)
- MUI v7 with custom theme and design tokens
- TanStack Query for data fetching
- TanStack Router for file-based routing
- Chart.js for visualizations
- Vite for development and building

### Running the Dashboard

```bash
# Install dependencies (first time only)
npm install

# Development server
npm run dev
# Opens at http://localhost:5173

# Production build
npm run build
npm run preview
```

### Data Connection

The dashboard consumes JSON reports generated by the Python analyzers. Reports are copied to `public/data/` for the frontend to fetch:

```
public/data/
├── quality/
│   └── quality_report.json       # Code quality issues
├── coverage/
│   └── coverage_report.json      # Test coverage metrics
└── dependencies/
    └── dependency_report.json    # Dependency analysis
```

**Data Flow:**
1. Python analyzers generate reports to `outputs/` directory
2. Reports are copied to `public/data/` (manual or via script)
3. React dashboard fetches from `/data/*.json` via TanStack Query
4. Data transformation layer (`api/dashboardApi.ts`) converts Python report format to TypeScript interfaces

**Refreshing Dashboard Data:**
```bash
# Run analysis pipeline (generates reports in outputs/)
python3 scripts/run_analysis.py --root /path/to/code --parallel --cache

# Copy reports to public/data/ for dashboard
cp outputs/quality/quality_report*.json public/data/quality/quality_report.json
cp outputs/coverage/coverage_report*.json public/data/coverage/coverage_report.json
cp outputs/dependencies/dependency_report*.json public/data/dependencies/dependency_report.json
```

### Dashboard Structure

```
src/
├── features/dashboard/
│   ├── components/           # UI components
│   │   ├── Dashboard.tsx     # Main dashboard page
│   │   ├── DashboardLayout.tsx # Header + Sidebar layout
│   │   ├── Header.tsx        # Navigation header
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── MetricCard.tsx    # Individual metric display
│   │   ├── MetricGrid.tsx    # Grid of metrics
│   │   └── HealthSummary.tsx # Overall health indicator
│   ├── api/
│   │   └── dashboardApi.ts   # Data fetching & transformation
│   ├── hooks/
│   │   └── useDashboardData.ts # TanStack Query hooks
│   ├── helpers/
│   │   └── calculateMetrics.ts # Metrics calculation
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── providers/
│       └── QueryProvider.tsx # TanStack Query provider
├── routes/dashboard/
│   └── index.tsx             # Dashboard route
├── theme/
│   └── dashboardTheme.ts     # MUI theme configuration
└── styles/
    ├── design-tokens.css     # CSS custom properties
    └── global.css            # Global styles
```

### Key TypeScript Types

The dashboard uses typed interfaces for all report data:

```typescript
// Python report formats (input)
interface PythonQualityReport {
  summary: { total_issues: number; critical: number; ... };
  issues: Array<{ file: string; line: number; ... }>;
}

// Dashboard formats (transformed)
interface QualityData {
  totalIssues: number;
  criticalIssues: number;
  issuesByCategory: Record<string, number>;
  ...
}
```

## Testing Strategy

- **94.3% test pass rate** (82/87 tests passing)
- **Unit tests**: Test individual analyzers in isolation with fixtures
- **Integration tests**: Test complete pipeline from schema generation through dashboard
- **Fixtures**: Located in `tests/fixtures/` with sample Python/TypeScript code

When adding new analyzers, create corresponding unit test in `tests/unit/test_<module>_analyzer.py` using existing tests as templates.

## Performance Characteristics

### Baseline Performance
- **Schema generation**: ~10-15 seconds per 1000 files (sequential)
- **Code quality analysis**: ~20 seconds for 100 files with all rules
- **ast-grep timeout**: 30 seconds per file (prevents hanging on malformed files)
- **Subprocess timeout**: 5 minutes for orchestration scripts

### Optimized Performance (with --parallel --cache)
- **Schema generation**: ~3-4 seconds per 1000 files (first run with parallel)
- **Schema generation**: <1 second per 1000 files (subsequent runs with cache)
- **Cache hit rate**: 70-90% on typical codebases with few changes
- **Worker count**: CPU count - 1 (adjustable with --workers)

**Performance Improvements**:
- **3x faster** with parallel processing
- **8x faster** with parallel + caching on unchanged codebases
- **76% cache hit rate** observed in testing

See `docs/OPTIMIZATION_GUIDE.md` for detailed benchmarks and configuration options.

### Error Reporting

All modules now use enhanced error logging with:
- Detailed context (operation, file path, error type, line number)
- Sentry integration for production error tracking (via Doppler)
- Performance metrics logging for all major operations
- Graceful fallback if Sentry unavailable

Enable Sentry error tracking:
```bash
./scripts/run_with_doppler.sh python3 scripts/run_analysis.py --parallel --cache
```

## Common Issues and Solutions

### ast-grep Not Found
Install: `brew install ast-grep` (macOS) or see https://ast-grep.github.io/guide/installation.html

### Empty schemas.json
Ensure you're running from the Inventory directory and that the target code directory exists and contains Python/TypeScript/JavaScript files.

### Circular Dependency False Positives
The algorithm only detects true cycles. If reporting false positives, check that internal dependency graph construction correctly resolves relative imports to absolute paths.

### Schema.org Validation Failures
Check that JSON-LD uses correct schema.org types. Use https://validator.schema.org/ for external validation.

### Test Failures
Most test failures are due to file path issues. Tests expect to run from repository root. Use `python3 scripts/run_tests.py` which handles path setup correctly.

## Output Files

All analysis tools generate both JSON (machine-readable) and TXT (human-readable) reports organized by type:

**Schema Files** (`outputs/schemas/`):
- `schemas_enhanced.json`: Complete code structure with schema.org vocabulary

**Quality Reports** (`outputs/quality/`):
- `quality_report_YYYYMMDD_HHMMSS.json/txt`: Code quality issues by severity and category

**Coverage Reports** (`outputs/coverage/`):
- `coverage_report_YYYYMMDD_HHMMSS.json/txt`: Test coverage analysis with untested functions

**Dependency Reports** (`outputs/dependencies/`):
- `dependency_report_YYYYMMDD_HHMMSS.json/txt`: Dependency graph with circular dependencies

**Dashboards** (`outputs/dashboards/`):
- `dashboard_YYYYMMDD_HHMMSS.html`: Interactive visualization of all metrics

**RSS Feeds** (`outputs/rss/`):
- `code_updates_YYYYMMDD_HHMMSS.xml`: RSS feed with git commit history

All generated files are timestamped and automatically gitignored to prevent committing generated content.
- python3 scripts/run_analysis.py --root {analysis_filepath}