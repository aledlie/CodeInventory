# CLAUDE.md

Code Inventory: A code analysis system using ast-grep and Schema.org to analyze codebases, detect quality issues, track test coverage, analyze dependencies, and generate interactive dashboards.

## Quick Start

```bash
python3 scripts/run_analysis.py --root /path/to/code --parallel --cache  # Full analysis
npm run dev                                                               # Dashboard at localhost:3000
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
├── routes/dashboard/    # TanStack Router: quality, coverage, dependencies, trends, graph, tools, compare, reports, insights, predictions, settings
├── theme/               # MUI v7 theme
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

**GitHub Actions** (`.github/workflows/analysis-pipeline.yml`):
- **test**: Unit/integration tests with coverage (Python 3.11, 3.12)
- **benchmark**: Performance benchmarks
- **analyze**: Code quality, coverage, dependency analysis
- **dashboard**: Deploy to GitHub Pages

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

## Secrets

- Run with Doppler: `./scripts/run_with_doppler.sh python3 scripts/run_analysis.py`
- Never hardcode credentials

## Recent Activity

**Last Updated:** 2025-12-09

### Current Development Phase

**Phase 5B: Dashboard Personalization** (IN PROGRESS)
- WidgetLibrary component for widget catalog with category filtering
- SavedViewsDropdown for dashboard view management
- NotificationPreferences for alert configuration
- DashboardEditor with drag-and-drop using @dnd-kit
- Zustand store with undo/redo and localStorage persistence
- Settings route at `/dashboard/settings`

**Phase 4: AI Insights & Predictions** (COMPLETE)
- InsightsPage, PredictiveDashboard components
- Visualization builder, collaboration features, notifications

### Recent Commits

| Commit | Description |
|--------|-------------|
| `b3fd19c` | test(dashboard): add orphaned components detection test |
| `af649a8` | chore(exports): add phase 3 component and type exports |
| `a2f889a` | chore(exports): add phase 3 api exports for trends, graph, and tools |
| `1728bb3` | chore(exports): add tools and force simulation hooks exports |
| `ca3d5c3` | chore(routes): regenerate route tree with settings route |
| `fa58da6` | feat(routes): add dashboard settings route for phase 5b personalization |
| `49a67d0` | feat(components): add personalization components for phase 5b dashboard |
| `254f58d` | feat(store): add zustand dashboard store for phase 5b personalization |
| `93ddabc` | feat(hooks): add personalization hooks for phase 5b dashboard management |
| `8d76b87` | feat(api): add personalization api for phase 5b dashboard customization |

### Phase 5B Components

```
src/features/dashboard/
├── components/personalization/
│   ├── WidgetLibrary.tsx        # Widget catalog with search/filter
│   ├── SavedViewsDropdown.tsx   # View management with CRUD
│   ├── NotificationPreferences.tsx # Alert settings
│   ├── DashboardEditor.tsx      # Drag-and-drop layout editor
│   └── index.ts
├── stores/
│   └── dashboardStore.ts        # Zustand store with undo/redo
├── api/personalizationApi.ts    # API with localStorage persistence
├── hooks/usePersonalization.ts  # React Query hooks
└── types/personalization.ts     # TypeScript interfaces
```

### Dependencies Added (Phase 5)

```bash
npm install zustand @dnd-kit/core @dnd-kit/sortable framer-motion immer
```
