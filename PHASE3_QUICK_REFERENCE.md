# Phase 3 Quick Reference

**TL;DR: Everything you need to start coding in 5 minutes**

## Installation (30 seconds)

```bash
npm install \
  chart.js@^4.4.0 \
  react-chartjs-2@^5.2.0 \
  d3@^7.8.5 \
  @types/d3@^7.4.3 \
  @react-pdf/renderer@^3.1.14 \
  papaparse@^5.4.1 \
  @types/papaparse@^5.3.14 \
  marked@^11.1.1 \
  @types/marked@^6.0.0
```

## Project Structure

```
src/features/dashboard/
├── types/              # ✅ DONE - 4 files, 2150 lines
│   ├── charts.ts
│   ├── graph.ts
│   ├── comparison.ts
│   └── reports.ts
├── components/         # ✅ DONE
│   ├── charts/
│   ├── dependencyGraph/
│   ├── comparison/     # ComparisonCard, DateRangeSelector
│   ├── ComparisonPage.tsx
│   └── ReportsPage.tsx
├── hooks/             # ✅ DONE
├── utils/             # ✅ DONE
└── api/               # ✅ DONE
    ├── comparisonApi.ts
    └── reportsApi.ts
```

## Quick Start: Build Your First Chart (5 minutes)

### 1. Create the hook

```typescript
// src/features/dashboard/hooks/useChartTheme.ts
import { useTheme } from '@mui/material/styles';

export function useChartTheme() {
  const theme = useTheme();
  return {
    colors: {
      primary: theme.palette.primary.main,
      success: theme.palette.success.main,
      // ... see PHASE3_IMPLEMENTATION_GUIDE.md for full code
    }
  };
}
```

### 2. Create the chart component

```typescript
// src/features/dashboard/components/charts/TrendChart.tsx
import { Line } from 'react-chartjs-2';
import { Paper, Box, Typography } from '@mui/material';

export function TrendChart({ title, data }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h3">{title}</Typography>
      <Box sx={{ height: 300 }}>
        <Line data={data} />
      </Box>
    </Paper>
  );
}
```

### 3. Create the route

```typescript
// src/routes/dashboard/trends/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { TrendChart } from '../../../features/dashboard/components/charts/TrendChart';

export const Route = createFileRoute('/dashboard/trends/')({
  component: () => <TrendChart title="Quality" data={mockData} />
});
```

Done! Visit `/dashboard/trends`

## Cheat Sheet: Common Patterns

### Load Historical Data

```typescript
import { trendsApi } from '../api/trendsApi';

const { data } = useSuspenseQuery({
  queryKey: ['trends', 'qualityScore', '30d'],
  queryFn: () => trendsApi.loadTrendData('/data', 'qualityScore', '30d')
});
```

### Transform Dependency Report to Graph

```typescript
import { transformToGraph } from '../utils/graphTransform';
const graph = transformToGraph(dependencyReport);
```

### Calculate Delta

```typescript
import type { Delta } from '../types/comparison';

const delta: Delta = {
  previous: 72,
  current: 87,
  absolute: 15,
  percentage: 20.8,
  direction: 'increase',
  isImprovement: true
};
```

### Export PDF

```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportDocument } from '../components/reports/PDFExporter';

<PDFDownloadLink
  document={<ReportDocument config={reportConfig} />}
  fileName="code-health-report.pdf"
>
  Download PDF
</PDFDownloadLink>
```

## Color Palette (Copy-Paste Ready)

```typescript
const colors = {
  primary: '#0066cc',
  success: '#28a745',
  warning: '#ff9800',
  error: '#dc3545',
  info: '#17a2b8',
  neutral: '#6c757d',
};
```

## Chart.js Quick Config

```typescript
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';

// Register once in your app
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

// Use in component
<Line
  data={{
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      data: [65, 72, 78],
      borderColor: '#0066cc',
      tension: 0.3,
      fill: true
    }]
  }}
  options={{
    responsive: true,
    maintainAspectRatio: false
  }}
/>
```

## D3 Force Graph Quick Setup

```typescript
import * as d3 from 'd3';

const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(edges).id(d => d.id))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(40));

simulation.on('tick', () => {
  // Update node/edge positions
});
```

## Common Gotchas

### 1. Chart not rendering?
**Fix**: Register Chart.js components first
```typescript
import { Chart as ChartJS, CategoryScale, LinearScale } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale);
```

### 2. D3 types error?
**Fix**: Install types separately
```bash
npm install @types/d3 --save-dev
```

### 3. Suspense error with TanStack Query?
**Fix**: Use `useSuspenseQuery` not `useQuery`
```typescript
const { data } = useSuspenseQuery({ ... });
```

### 4. Chart updates not animating?
**Fix**: Provide stable keys
```typescript
<Line key={`chart-${timeRange}`} data={data} />
```

## Performance Checklist

- [ ] Charts render in <100ms
- [ ] 60fps during pan/zoom
- [ ] Viewport culling for 500+ nodes
- [ ] Lazy load external dependencies
- [ ] Debounce force simulation (16ms)
- [ ] Code split routes
- [ ] Optimize bundle size (<200KB gzipped)

## Accessibility Quick Check

```typescript
// Good: Accessible chart
<figure role="img" aria-label="Quality score increased 15% over 7 days">
  <Line data={data} />
  <table className="sr-only">
    {/* Data table fallback */}
  </table>
</figure>

// Bad: No accessibility
<div><Line data={data} /></div>
```

## Testing Template

```typescript
import { render, screen } from '@testing-library/react';
import { TrendChart } from './TrendChart';

describe('TrendChart', () => {
  it('renders with data', () => {
    render(<TrendChart title="Test" data={mockData} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TrendChart loading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

## File Size Budgets

| File Type | Max Size |
|-----------|----------|
| Component | 300 lines |
| Hook | 150 lines |
| Utility | 200 lines |
| Type file | 600 lines |
| Route | 200 lines |

## Commit Message Format

```
feat(charts): add quality trend chart component

- Implements line chart with threshold lines
- Adds time range selector (7d/30d/90d)
- Includes ARIA labels for accessibility

Refs: PHASE3-001
```

## Useful Commands

```bash
# Type check
npx tsc --noEmit

# Generate routes
npm run routes:generate

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Where to Find Things

| Need | Look Here |
|------|-----------|
| Design specs | PHASE3_VISUALIZATION_DESIGN.md |
| UI mockups | PHASE3_VISUAL_MOCKUPS.md |
| Step-by-step guide | PHASE3_IMPLEMENTATION_GUIDE.md |
| Type definitions | src/features/dashboard/types/ |
| Color palette | dashboardTheme.ts |
| Performance targets | PHASE3_SUMMARY.md |

## Component Import Pattern

```typescript
// ✅ Good: Named imports
import { TrendChart } from '../components/charts/TrendChart';
import type { TrendData } from '../types/charts';

// ❌ Bad: Default imports
import TrendChart from '../components/charts/TrendChart';
```

## Naming Conventions

```typescript
// Components: PascalCase
TrendChart.tsx
DependencyGraph.tsx

// Hooks: camelCase with 'use' prefix
useChartTheme.ts
useDependencyGraph.ts

// Utilities: camelCase
graphTransform.ts
circularDetection.ts

// Types: PascalCase interfaces, camelCase types
interface ChartData {}
type TimeRange = '7d' | '30d';

// Constants: UPPER_SNAKE_CASE
const MAX_NODES = 1000;
const DEFAULT_ZOOM = 1.0;
```

## MUI v7 Grid Pattern

```typescript
// ✅ Good: Use size prop
<Grid size={{ xs: 12, md: 6 }}>

// ❌ Bad: Old xs/md props
<Grid xs={12} md={6}>
```

## Doppler Secrets Access

```bash
# Run with secrets
./scripts/run_with_doppler.sh npm run dev

# Project: integrity-studio
# Config: dev
```

## Getting Help

1. Check type definitions first (`src/features/dashboard/types/`)
2. Review implementation guide (PHASE3_IMPLEMENTATION_GUIDE.md)
3. Look at visual mockups (PHASE3_VISUAL_MOCKUPS.md)
4. Search design specs (PHASE3_VISUALIZATION_DESIGN.md)
5. Ask in #code-inventory Slack channel

## Priority Order

✅ **Phase 3A** - Trend Charts - COMPLETE
✅ **Phase 3B** - Dependency Graph - COMPLETE
✅ **Phase 3C** - Historical Comparison - COMPLETE
✅ **Phase 3D** - Report Generation - COMPLETE

## Success Criteria

✅ Charts load in <100ms
✅ No TypeScript errors
✅ WCAG AA compliant
✅ 80%+ test coverage
✅ 60fps interactions
✅ Bundle size <200KB/route

---

**Remember**: Start with Phase 3A, ship incrementally, get feedback, iterate.

Happy coding!

---

## Git Activity

### Latest Commits (2025-12-09)

| Commit | Description |
|--------|-------------|
| `6d30432` | feat(phase4): add AI insights UI components |
| `8209d4b` | feat(phase4): add AI insights and predictions infrastructure |
| `01d1d54` | docs(phase4-5): add planning documents for advanced dashboard features |
| `ff00ba0` | fix(tools): correct MetricGrid usage and update type exports |
| `0762663` | fix(typescript): resolve unused variables in tools components |
| `00e04e6` | docs: update project documentation with phase 3 completion status |

### Phase 3 Routes (Complete)
- `/dashboard/compare` - Historical metrics comparison
- `/dashboard/reports` - Custom report generation
- `/dashboard/trends` - Trend analysis charts
- `/dashboard/graph` - Dependency graph visualization
- `/dashboard/tools` - Tools & utility modules

---

## Next: Phase 4 (AI Insights & Predictions)

Phase 4 implementation has started! See:
- **PHASE4_QUICK_REFERENCE.md** - Developer quick start for AI features
- **PHASE4_VISUAL_STORYTELLING_GUIDE.md** - Full design specification
- **PHASE4_COMPONENT_MOCKUPS.md** - Visual component designs

Phase 4 includes:
- AI-powered code insights
- Quality score predictions
- Custom visualization builder
- Team collaboration features
- Smart notifications

**Last Updated**: 2025-12-09
