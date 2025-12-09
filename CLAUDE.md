# CLAUDE.md

Code Inventory: A code analysis system using ast-grep and Schema.org to analyze codebases, detect quality issues, track test coverage, analyze dependencies, and generate interactive dashboards.

**Live Site**: [https://integrityaistudio.com/](https://integrityaistudio.com/)

## Quick Start

```bash
python3 scripts/run_analysis.py --root /path/to/code --parallel --cache  # Full analysis
npm run dev                                                               # Dashboard at localhost:5173/dashboard
npm run build                                                             # Production build
python3 scripts/run_tests.py                                              # Run tests
npm run verify                                                            # Check dependencies
```

## Tech Stack

- **Python**: ast-grep analyzers for code quality, dependencies, test coverage
- **Frontend**: React 18 + TypeScript + MUI v7 + TanStack Query/Router + Vite
- **Secrets**: Doppler (`integrity-studio` / `dev`)

## Directory Structure

```
src/
├── analyzers/           # Python: code_quality, dependencies, test_coverage
├── generators/          # Python: schema, dashboard, rss
├── validators/          # Python: schema.org validation
├── features/dashboard/  # React: components/, api/, hooks/, types/, stores/, providers/
│   ├── api/             # dashboardApi, personalizationApi, exportApi
│   ├── components/      # Dashboard components + personalization/ + export/
│   ├── hooks/           # useDashboardData, usePersonalization, useExport
│   ├── stores/          # Zustand: dashboardStore
│   └── types/           # TypeScript interfaces
├── routes/dashboard/    # TanStack Router: quality, coverage, dependencies, trends, graph, tools, compare, reports, insights, predictions, settings
├── theme/               # MUI v7 theme + ThemeContext (dark mode)
└── components/          # Shared: ErrorBoundary, SuspenseLoader
public/data/             # JSON reports for dashboard
outputs/                 # Generated reports (gitignored)
```

## Dashboard Data Flow

1. Python analyzers generate reports to `outputs/`
2. Copy to `public/data/` for dashboard
3. Dashboard fetches via TanStack Query with Suspense
4. Data transformed in `api/dashboardApi.ts`

## React Patterns

- **Imports**: `import type { ReactNode } from 'react'` not `React.ReactNode`
- **Components**: `function Component() {}` not `const Component: React.FC`
- **Data fetching**: `useSuspenseQuery` with Suspense boundaries
- **Routes**: `React.lazy()` for code splitting
- **MUI v7**: Use `size` prop for Grid
- **Theme**: Use `useTheme()` from `@/theme` for dark mode support
- **Export**: Use `useExport()` hook for CSV/PDF/JSON export functionality
- **State**: Zustand for dashboard personalization state (`dashboardStore`)

## ast-grep Meta Variable Handling

```python
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

## CI/CD Pipeline

**GitHub Actions Workflows**:

1. **Analysis Pipeline** (`.github/workflows/analysis-pipeline.yml`):
   - **test**: Unit/integration tests with coverage (Python 3.11, 3.12)
   - **benchmark**: Performance benchmarks
   - **analyze**: Code quality, coverage, dependency analysis

2. **GitHub Pages Deployment** (`.github/workflows/deploy-pages.yml`):
   - Triggers on push to `main` branch
   - Builds Vite project with `npm run build`
   - Deploys `./dist` to GitHub Pages
   - Live at https://integrityaistudio.com/

**SPA Routing Support**:
- `public/404.html` redirects to `index.html` for client-side routing
- Root route (`/`) redirects to `/dashboard`

**Dependencies** (requirements.txt):
```
pydantic>=2.0.0, tqdm>=4.60.0, pytest>=7.0.0, pytest-cov>=4.0.0, coverage>=7.0.0, sentry-sdk>=2.0.0, mypy>=1.0.0
```

**System**: `ast-grep` (brew install), `git`, `python3`, `node`

| Environment | Python Packages | ast-grep |
|-------------|-----------------|----------|
| Local | venv `.venv/` | `brew install ast-grep` |
| CI | Global pip install | Custom action `.github/actions/setup-ast-grep` |

## Testing

```bash
python3 scripts/run_tests.py                    # All tests with coverage
python3 scripts/run_tests.py --unit-only        # Unit tests only
python3 scripts/run_tests.py --integration-only # Integration tests only
coverage html                                   # HTML report: htmlcov/index.html
```

## Performance

- `--parallel`: 3x faster (multiprocessing)
- `--cache`: 8x faster (SHA-256 content hash)
- Combined: 10-20x speedup

## Common Issues

| Issue | Solution |
|-------|----------|
| ast-grep not found | `brew install ast-grep` |
| Empty schemas.json | Run from Inventory directory with valid code path |
| TypeScript errors | `npx tsc --noEmit`, exclude examples in tsconfig |
| Dashboard no data | Copy reports to `public/data/` |

## Dashboard Features (Phase 5 Complete)

- **Personalization** (5B): Widget library, saved views, notification preferences, drag-and-drop editor
- **Dark Mode** (5C): Light/dark/system themes with system preference detection and localStorage persistence
- **Data Export** (5C): CSV, PDF, JSON export with pre-configured column definitions

## Test Data Files

Test data for dashboard UI located in `public/data/`:
- `quality/quality_report.json` - Code quality metrics
- `coverage/coverage_report.json` - Test coverage data
- `tools/tools_report.json` - Tools analysis data
- `dependencies/`, `insights/`, `predictions/` - Additional dashboard data

## Secrets

- Run with Doppler: `./scripts/run_with_doppler.sh python3 scripts/run_analysis.py`
- Never hardcode credentials

## Project Status (2025-12-09)

- **Phase 5B/5C**: Complete (dashboard personalization, export, themes)
- **Deployment**: Live at https://integrityaistudio.com/
- **Routing**: SPA with 404.html redirect, root redirects to /dashboard
- **CI/CD**: GitHub Pages auto-deploy on push to main
