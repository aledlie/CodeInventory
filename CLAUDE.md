# CLAUDE.md

Code analysis system using ast-grep and Schema.org. Analyzes codebases for quality issues, test coverage, and dependencies. Generates interactive dashboards.

**Live**: https://integrityaistudio.com/ | **Status**: Phase 5C Complete

## Quick Start

```bash
python3 scripts/run_analysis.py --root /path/to/code --parallel --cache  # Analysis
npm run dev         # Dashboard at localhost:5173/dashboard
npm run build       # Production build
npm run verify      # Check dependencies
```

## Stack

**Backend**: Python + ast-grep analyzers (code_quality, dependencies, test_coverage)
**Frontend**: React 18 + TypeScript + MUI v7 + TanStack Query/Router + Vite
**Secrets**: Doppler (`integrity-studio` / `dev`)

## Structure

```
src/
├── analyzers/           # Python: code_quality, dependencies, test_coverage
├── generators/          # Python: schema, dashboard, rss
├── features/dashboard/  # React: api/, components/, hooks/, stores/, types/
├── routes/dashboard/    # TanStack Router pages
├── theme/               # MUI v7 theme + dark mode
└── components/          # Shared: ErrorBoundary, SuspenseLoader
public/data/             # JSON reports (quality, coverage, dependencies, insights, predictions)
```

## Data Flow

Python analyzers → `outputs/` → copy to `public/data/` → Dashboard fetches via TanStack Query

## React Patterns

- `import type { X }` not `React.X`
- `function Component()` not `const Component: React.FC`
- `useSuspenseQuery` with Suspense boundaries
- MUI v7: use `size` prop for Grid
- Theme: `useTheme()` from `@/theme`

## CI/CD

**Analysis Pipeline** (`analysis-pipeline.yml`): Tests → Benchmarks → Analysis
**GitHub Pages** (`deploy-pages.yml`): Push to main → Build → Deploy to https://integrityaistudio.com/

SPA routing: `public/404.html` redirects to index.html, root (`/`) redirects to `/dashboard`

## Testing

```bash
python3 scripts/run_tests.py                    # All tests
python3 scripts/run_tests.py --unit-only        # Unit only
python3 scripts/run_tests.py --integration-only # Integration only
```

## Performance

`--parallel` (3x) + `--cache` (8x) = 10-20x speedup

## Common Issues

| Issue | Solution |
|-------|----------|
| ast-grep not found | `brew install ast-grep` |
| Dashboard no data | Copy reports to `public/data/` |
| TypeScript errors | `npx tsc --noEmit` |

## ast-grep Meta Variables

```python
def get_meta_var(match, var_name):
    meta = match.get('metaVariables', {})
    node = meta.get('single', {}).get(var_name) or meta.get(var_name)
    return node.get('text') if isinstance(node, dict) else str(node) if node else None
```
