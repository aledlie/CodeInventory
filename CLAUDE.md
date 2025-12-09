# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Repository Purpose

Code Inventory is a code analysis system using ast-grep and Schema.org to analyze codebases, detect quality issues, track test coverage, analyze dependencies, and generate interactive dashboards.

## Quick Start

```bash
# Run analysis pipeline
python3 scripts/run_analysis.py --root /path/to/code --parallel --cache

# Start React dashboard
npm run dev  # http://localhost:3000/dashboard

# Run tests
python3 scripts/run_tests.py
```

## Architecture

```
Source Code → Schema Generation → Parallel Analysis → Reports → React Dashboard
                   ↓                    ↓                ↓            ↓
            ast-grep parsing    Quality/Coverage/   JSON files   Interactive UI
                               Dependencies         to public/    with detail
                                                     data/         pages
```

**Tech Stack:**
- Python analyzers with ast-grep for AST parsing
- React 18 + TypeScript + MUI v7 + TanStack Query/Router
- Vite for frontend build
- Doppler for secrets management

## Key Commands

| Command | Description |
|---------|-------------|
| `python3 scripts/run_analysis.py --root PATH --parallel --cache` | Full analysis |
| `npm run dev` | Dashboard dev server (localhost:3000) |
| `npm run build` | Production build |
| `npx tsc --noEmit` | TypeScript check |
| `python3 scripts/run_tests.py` | Run Python tests |

## Directory Structure

```
src/
├── analyzers/           # Python: code_quality, dependencies, test_coverage
├── generators/          # Python: schema, dashboard (HTML), rss
├── validators/          # Python: schema.org validation
├── features/dashboard/  # React dashboard
│   ├── components/      # Dashboard, Header, Sidebar, MetricCard, MetricGrid
│   │                    # CodeQualityPage, TestCoveragePage, DependenciesPage
│   ├── api/             # dashboardApi.ts - data fetching
│   ├── hooks/           # useDashboardData.ts - TanStack Query
│   ├── types/           # TypeScript interfaces
│   └── providers/       # QueryProvider.tsx
├── routes/dashboard/    # TanStack Router file-based routes
│   ├── index.tsx        # /dashboard - main overview
│   ├── quality/         # /dashboard/quality - code quality details
│   ├── coverage/        # /dashboard/coverage - test coverage details
│   ├── dependencies/    # /dashboard/dependencies - dependency details
│   ├── trends/          # /dashboard/trends - trend charts
│   ├── graph/           # /dashboard/graph - dependency graph
│   ├── tools/           # /dashboard/tools - tools & utilities
│   ├── compare/         # /dashboard/compare - historical comparison
│   └── reports/         # /dashboard/reports - report generation
├── theme/               # MUI v7 theme (dashboardTheme.ts)
├── styles/              # CSS design tokens & global styles
└── components/          # Shared: ErrorBoundary, SuspenseLoader
public/data/             # JSON reports consumed by dashboard
outputs/                 # Generated reports (gitignored)
```

## Dashboard Data Flow

1. Python analyzers generate reports to `outputs/`
2. Copy to `public/data/` for dashboard:
   ```bash
   cp outputs/quality/quality_report*.json public/data/quality/quality_report.json
   cp outputs/coverage/coverage_report*.json public/data/coverage/coverage_report.json
   cp outputs/dependencies/dependency_report*.json public/data/dependencies/dependency_report.json
   ```
3. Dashboard fetches via TanStack Query with Suspense
4. Data transformed in `api/dashboardApi.ts`

## React Patterns

- **Modern imports**: Use `import type { ReactNode } from 'react'` not `React.ReactNode`
- **Function components**: `function Component() {}` not `const Component: React.FC = () => {}`
- **Suspense**: All data fetching uses `useSuspenseQuery` with Suspense boundaries
- **Lazy loading**: Routes use `React.lazy()` for code splitting
- **MUI v7**: Use `size` prop not `xs/md/lg` for Grid

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

## Secrets (Doppler)

- Project: `integrity-studio`, Config: `dev`
- Run with secrets: `./scripts/run_with_doppler.sh python3 scripts/run_analysis.py`
- Never hardcode credentials

## Common Issues

| Issue | Solution |
|-------|----------|
| ast-grep not found | `brew install ast-grep` |
| Empty schemas.json | Run from Inventory directory with valid code path |
| TypeScript errors | `npx tsc --noEmit` to check, exclude examples in tsconfig |
| Dashboard no data | Copy reports to `public/data/` |

## Performance

- `--parallel`: 3x faster with multiprocessing
- `--cache`: 8x faster on subsequent runs (SHA-256 content hash)
- Combined: 10-20x speedup on unchanged files

## Recent Activity

**Last Updated:** 2025-12-09

### Recent Commits (feature/dashboard-visualization branch)

| Commit | Date | Description |
|--------|------|-------------|
| `6d30432` | 2025-12-09 | feat(phase4): add AI insights UI components |
| `8209d4b` | 2025-12-09 | feat(phase4): add AI insights and predictions infrastructure |
| `01d1d54` | 2025-12-09 | docs(phase4-5): add planning documents for advanced dashboard features |
| `ff00ba0` | 2025-12-09 | fix(tools): correct MetricGrid usage and update type exports |
| `0762663` | 2025-12-09 | fix(typescript): resolve unused variables in tools components |
| `00e04e6` | 2025-12-09 | docs: update project documentation with phase 3 completion status |

### Current Development Phase

**Phase 3: Visual Storytelling & Reports** (COMPLETE)
- Trend analysis charts - components created
- Dependency graph visualization - components created
- Tools & utility modules analyzer - Python analyzer + React UI
- Historical metrics comparison - ComparisonPage with DateRangeSelector
- Custom report generation - ReportsPage with PDF/HTML/JSON/CSV/Markdown export
- Sidebar navigation updated with Graph, Compare, and Reports links

**Phase 4: AI Insights & Predictions** (IN PROGRESS)
- AI Insights UI components - InsightsPage, InsightCard, InsightsCategoryTabs, InsightsSummaryCard
- Predictions infrastructure - APIs (insightsApi.ts, predictionsApi.ts), hooks (useInsights.ts, usePredictions.ts)
- TypeScript types - insights.ts, predictions.ts, collaboration.ts
- Planning documents - PHASE4_VISUAL_STORYTELLING_GUIDE.md, PHASE4_COMPONENT_MOCKUPS.md, PHASE4_QUICK_REFERENCE.md
- Phase 5 planning - PHASE5_IMPLEMENTATION_GUIDE.md, PHASE5_VISUAL_DESIGN.md
