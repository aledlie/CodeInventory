# Dashboard Frontend Implementation Plan

*Combining UI/UX Design Specifications with Frontend Development Guidelines*

---

## Overview

This plan integrates the comprehensive UI/UX design documentation with modern React/TypeScript development patterns to create a production-ready outputs visualization dashboard for Code Inventory.

### Documents to Reference

| Document | Purpose |
|----------|---------|
| `DASHBOARD_DESIGN_SUMMARY.md` | Quick reference for design decisions |
| `DASHBOARD_UI_UX_DESIGN.md` | Complete 80-page specification |
| `DASHBOARD_COMPONENT_EXAMPLES.md` | Production-ready HTML/CSS/JS code |
| `DASHBOARD_IMPLEMENTATION_ROADMAP.md` | 8-week development timeline |

---

## Technology Stack

Based on the frontend-dev-guidelines skill:

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18+ | UI library with Suspense |
| Language | TypeScript (strict) | Type safety |
| Styling | MUI v7 | Component library + theming |
| Data Fetching | TanStack Query | Suspense-based queries |
| Routing | TanStack Router | File-based routing |
| Charts | Chart.js or Recharts | Data visualization |
| Build | Vite | Fast development |

---

## Project Structure

Following the features-based organization pattern:

```
src/
├── features/
│   └── dashboard/
│       ├── api/
│       │   └── dashboardApi.ts         # Load JSON report files
│       ├── components/
│       │   ├── Dashboard.tsx           # Main dashboard page
│       │   ├── MetricCard.tsx          # Individual metric display
│       │   ├── MetricGrid.tsx          # Grid of metric cards
│       │   ├── HealthSummary.tsx       # Overall health status
│       │   ├── IssueTable.tsx          # Sortable/filterable table
│       │   ├── CoverageChart.tsx       # Coverage visualization
│       │   ├── DependencyGraph.tsx     # Dependency tree/graph
│       │   └── SeverityBadge.tsx       # Severity indicator
│       ├── hooks/
│       │   ├── useDashboardData.ts     # Load all report data
│       │   ├── useQualityReport.ts     # Quality-specific queries
│       │   ├── useCoverageReport.ts    # Coverage-specific queries
│       │   └── useDependencyReport.ts  # Dependency-specific queries
│       ├── helpers/
│       │   ├── parseReports.ts         # JSON parsing utilities
│       │   ├── calculateMetrics.ts     # Derive summary metrics
│       │   └── formatters.ts           # Display formatters
│       ├── types/
│       │   └── index.ts                # TypeScript interfaces
│       └── index.ts                    # Public exports
│
├── components/
│   └── SuspenseLoader/
│       └── SuspenseLoader.tsx          # Reusable loading wrapper
│
├── routes/
│   └── dashboard/
│       ├── index.tsx                   # Main dashboard route
│       ├── quality/
│       │   └── index.tsx               # Quality detail page
│       ├── coverage/
│       │   └── index.tsx               # Coverage detail page
│       └── dependencies/
│           └── index.tsx               # Dependencies detail page
│
└── theme/
    └── dashboardTheme.ts               # MUI theme customization
```

---

## Design System Integration

### MUI Theme Configuration

```typescript
// src/theme/dashboardTheme.ts
import { createTheme } from '@mui/material/styles';

export const dashboardTheme = createTheme({
  palette: {
    primary: { main: '#0066cc' },
    success: { main: '#28a745' },
    warning: { main: '#ff9800' },
    error: { main: '#dc3545' },
    info: { main: '#17a2b8' },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '2rem' },
    h2: { fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.5rem' },
    h3: { fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.125rem' },
  },
  spacing: 8, // 8px base unit
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
        },
      },
    },
  },
});
```

---

## TypeScript Interfaces

```typescript
// src/features/dashboard/types/index.ts

/** Quality issue from code analysis */
export interface QualityIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  rule: string;
}

/** Quality report structure */
export interface QualityReport {
  timestamp: string;
  total_issues: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_category: Record<string, number>;
  issues: QualityIssue[];
}

/** Coverage data for a function */
export interface FunctionCoverage {
  name: string;
  file: string;
  line: number;
  tested: boolean;
  test_file?: string;
}

/** Coverage report structure */
export interface CoverageReport {
  timestamp: string;
  coverage_percentage: number;
  total_functions: number;
  tested_functions: number;
  untested_functions: number;
  by_file: Record<string, {
    total: number;
    tested: number;
    percentage: number;
  }>;
  functions: FunctionCoverage[];
}

/** Dependency information */
export interface DependencyInfo {
  file: string;
  imports: string[];
  imported_by: string[];
  is_circular: boolean;
}

/** Dependency report structure */
export interface DependencyReport {
  timestamp: string;
  total_files: number;
  total_imports: number;
  circular_dependencies: string[][];
  external_dependencies: string[];
  internal_dependencies: Record<string, DependencyInfo>;
}

/** Dashboard summary metrics */
export interface DashboardMetrics {
  totalFiles: number;
  qualityScore: number;
  coveragePercentage: number;
  criticalIssues: number;
  circularDeps: number;
  untestedFunctions: number;
}
```

---

## Core Components

### 1. MetricCard Component

```typescript
// src/features/dashboard/components/MetricCard.tsx
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

const statusColors: Record<string, string> = {
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  info: 'info.main',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  trend,
  status,
}) => {
  const borderColor = status ? statusColors[status] : 'transparent';

  return (
    <Card
      sx={{
        minWidth: 200,
        borderLeft: 4,
        borderColor,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {icon}
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {trend && (
          <Typography variant="caption" color="text.secondary">
            {trend}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
```

### 2. HealthSummary Component

```typescript
// src/features/dashboard/components/HealthSummary.tsx
import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Chip } from '@mui/material';
import type { DashboardMetrics } from '../types';

interface HealthSummaryProps {
  metrics: DashboardMetrics;
}

const getHealthStatus = (metrics: DashboardMetrics) => {
  if (metrics.criticalIssues > 0) return { label: 'Needs Attention', color: 'error' };
  if (metrics.coveragePercentage < 50) return { label: 'Fair', color: 'warning' };
  if (metrics.coveragePercentage >= 80) return { label: 'Good', color: 'success' };
  return { label: 'Moderate', color: 'info' };
};

export const HealthSummary: React.FC<HealthSummaryProps> = ({ metrics }) => {
  const status = getHealthStatus(metrics);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Repository Health</Typography>
          <Chip
            label={status.label}
            color={status.color as 'error' | 'warning' | 'success' | 'info'}
            size="small"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Code Quality ({100 - metrics.criticalIssues}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, 100 - metrics.criticalIssues)}
            color={metrics.criticalIssues > 5 ? 'error' : 'success'}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Test Coverage ({metrics.coveragePercentage}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={metrics.coveragePercentage}
            color={
              metrics.coveragePercentage < 50
                ? 'error'
                : metrics.coveragePercentage < 80
                ? 'warning'
                : 'success'
            }
          />
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom>
            Dependency Health
          </Typography>
          <LinearProgress
            variant="determinate"
            value={metrics.circularDeps === 0 ? 100 : 50}
            color={metrics.circularDeps > 0 ? 'warning' : 'success'}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default HealthSummary;
```

### 3. Data Fetching Hook (Suspense-based)

```typescript
// src/features/dashboard/hooks/useDashboardData.ts
import { useSuspenseQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import type { QualityReport, CoverageReport, DependencyReport } from '../types';

interface DashboardData {
  quality: QualityReport | null;
  coverage: CoverageReport | null;
  dependencies: DependencyReport | null;
}

export const useDashboardData = (outputsPath: string) => {
  return useSuspenseQuery<DashboardData>({
    queryKey: ['dashboard', outputsPath],
    queryFn: () => dashboardApi.loadAllReports(outputsPath),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### 4. API Service Layer

```typescript
// src/features/dashboard/api/dashboardApi.ts
import type { QualityReport, CoverageReport, DependencyReport } from '../types';

export const dashboardApi = {
  async loadAllReports(outputsPath: string) {
    const [quality, coverage, dependencies] = await Promise.allSettled([
      this.loadQualityReport(outputsPath),
      this.loadCoverageReport(outputsPath),
      this.loadDependencyReport(outputsPath),
    ]);

    return {
      quality: quality.status === 'fulfilled' ? quality.value : null,
      coverage: coverage.status === 'fulfilled' ? coverage.value : null,
      dependencies: dependencies.status === 'fulfilled' ? dependencies.value : null,
    };
  },

  async loadQualityReport(path: string): Promise<QualityReport> {
    const response = await fetch(`${path}/quality/quality_report.json`);
    if (!response.ok) throw new Error('Failed to load quality report');
    return response.json();
  },

  async loadCoverageReport(path: string): Promise<CoverageReport> {
    const response = await fetch(`${path}/coverage/coverage_report.json`);
    if (!response.ok) throw new Error('Failed to load coverage report');
    return response.json();
  },

  async loadDependencyReport(path: string): Promise<DependencyReport> {
    const response = await fetch(`${path}/dependencies/dependency_report.json`);
    if (!response.ok) throw new Error('Failed to load dependency report');
    return response.json();
  },
};
```

---

## Route Setup

```typescript
// src/routes/dashboard/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '~components/SuspenseLoader';

const Dashboard = lazy(() => import('@/features/dashboard/components/Dashboard'));

export const Route = createFileRoute('/dashboard/')({
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <Dashboard />
    </Suspense>
  ),
  loader: () => ({ crumb: 'Dashboard' }),
});
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up MUI theme with design system colors
- [ ] Create MetricCard component
- [ ] Create HealthSummary component
- [ ] Create SeverityBadge component
- [ ] Set up TanStack Query provider
- [ ] Create dashboard API service
- [ ] Implement basic dashboard layout

### Phase 2: Data Tables (Week 3-4)
- [ ] Create IssueTable component with sorting
- [ ] Add filtering by severity/category
- [ ] Implement pagination
- [ ] Create expandable row details
- [ ] Add search functionality
- [ ] Mobile-responsive table layout

### Phase 3: Visualizations (Week 5-6)
- [ ] Install and configure Chart.js
- [ ] Create severity distribution pie chart
- [ ] Create coverage bar chart by file
- [ ] Create dependency graph visualization
- [ ] Add chart interactions (click to filter)
- [ ] Responsive chart sizing

### Phase 4: Polish & Testing (Week 7-8)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Add loading skeletons
- [ ] Error boundary implementation
- [ ] Cross-browser testing
- [ ] Mobile touch optimization

---

## Key Patterns to Follow

### 1. Always Use SuspenseLoader
```typescript
// NEVER do early returns with loading spinners
// ❌ Bad
if (isLoading) return <Spinner />;

// ✅ Good
<SuspenseLoader>
  <DataComponent />
</SuspenseLoader>
```

### 2. Use Import Aliases
```typescript
import { MetricCard } from '~features/dashboard';
import type { QualityReport } from '~types/dashboard';
import { SuspenseLoader } from '~components/SuspenseLoader';
```

### 3. Lazy Load Heavy Components
```typescript
const DependencyGraph = lazy(() => import('./DependencyGraph'));
const CoverageChart = lazy(() => import('./CoverageChart'));
```

### 4. MUI v7 Grid Syntax
```typescript
<Grid size={{ xs: 12, md: 6, lg: 4 }}>
  <MetricCard ... />
</Grid>
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |

---

## Accessibility Requirements

- WCAG 2.1 AA compliance
- 4.5:1 color contrast for text
- 3:1 color contrast for UI components
- Full keyboard navigation
- Screen reader support with ARIA labels
- Focus visible indicators
- Skip links for navigation

---

## Next Steps

1. **Review design specs** in `DASHBOARD_DESIGN_SUMMARY.md`
2. **Set up project** with Vite + React + TypeScript
3. **Configure MUI theme** using design system colors
4. **Create base components** (MetricCard, HealthSummary)
5. **Implement data fetching** with TanStack Query
6. **Build out detail pages** for quality, coverage, dependencies
7. **Add visualizations** with Chart.js
8. **Test and polish** for production

---

*This plan integrates the UI/UX design specifications with modern React development patterns for a production-ready dashboard implementation.*
