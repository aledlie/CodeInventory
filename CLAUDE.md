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
│   │                    # InsightsPage (Phase 4), PredictiveDashboard (Phase 4)
│   ├── api/             # dashboardApi, insightsApi, predictionsApi, analyticsApi
│   ├── hooks/           # useDashboardData, useInsights, usePredictions, useAnalytics
│   ├── types/           # TypeScript interfaces (insights, predictions, analytics)
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
│   ├── reports/         # /dashboard/reports - report generation
│   ├── insights/        # /dashboard/insights - AI-powered insights (Phase 4)
│   └── predictions/     # /dashboard/predictions - predictive analytics (Phase 4)
├── theme/               # MUI v7 theme (dashboardTheme.ts)
├── styles/              # CSS design tokens & global styles
└── components/          # Shared: ErrorBoundary, SuspenseLoader
public/data/             # JSON reports consumed by dashboard
├── insights/            # AI insights data (Phase 4)
└── predictions/         # Predictive analytics data (Phase 4)
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
| `586594a` | 2025-12-09 | chore: update dependencies and project configuration |
| `a3f5adf` | 2025-12-09 | docs(phase3): update completion documentation and quick reference |
| `eb14b67` | 2025-12-09 | docs: update project documentation with phase 4 implementation status |
| `e54c25d` | 2025-12-09 | docs(phase4-5): add planning and implementation guides for advanced features |
| `193a6e0` | 2025-12-09 | feat(sidebar): add phase 4 navigation for insights and predictions |
| `18d2d96` | 2025-12-09 | feat: export phase 4 insight and prediction APIs and hooks |

### Current Development Phase

**Phase 3: Visual Storytelling & Reports** (COMPLETE)
- Trend analysis charts - components created
- Dependency graph visualization - components created
- Tools & utility modules analyzer - Python analyzer + React UI
- Historical metrics comparison - ComparisonPage with DateRangeSelector
- Custom report generation - ReportsPage with PDF/HTML/JSON/CSV/Markdown export
- Sidebar navigation updated with Graph, Compare, and Reports links

**Phase 4: AI Insights & Predictions** (IN PROGRESS)
- Sidebar navigation - AI Insights and Predictions routes added
- Routes - `/dashboard/insights` and `/dashboard/predictions` configured
- APIs exported - insightsApi.ts, predictionsApi.ts via barrel export
- Hooks exported - useInsights.ts, usePredictions.ts via barrel export
- TypeScript types - insights.ts, predictions.ts, collaboration.ts
- Components - InsightsPage, InsightCard, InsightsCategoryTabs, InsightsSummaryCard
- Predictions components - PredictiveDashboard with prediction cards

**Phase 5: Advanced Analytics** (INFRASTRUCTURE READY)
- APIs - analyticsApi.ts, visualizationApi.ts created
- Hooks - useAnalytics.ts, useVisualization.ts created
- Types - analytics.ts, visualizations.ts defined
- Planning docs - PHASE5_IMPLEMENTATION_GUIDE.md, PHASE5_VISUAL_DESIGN.md
