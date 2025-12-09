# Phase 3 Implementation Guide

**Step-by-Step Instructions for Building Visual Storytelling Features**

## Prerequisites

### 1. Install Dependencies

```bash
# Chart.js for trend visualizations
npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0

# D3.js for dependency graph
npm install d3@^7.8.5 @types/d3@^7.4.3

# PDF export
npm install @react-pdf/renderer@^3.1.14

# CSV export
npm install papaparse@^5.4.1 @types/papaparse@^5.3.14

# Markdown rendering
npm install marked@^11.1.1 @types/marked@^6.0.0

# Optional: Image export for charts
npm install html2canvas@^1.4.1 @types/html2canvas@^1.0.0
```

### 2. Update tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["d3", "chart.js", "papaparse"]
  }
}
```

## Phase 3A: Trend Charts (Week 1-2)

### Step 1: Create Chart Theme Hook

**File**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/hooks/useChartTheme.ts`

```typescript
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import type { ChartOptions } from 'chart.js';
import type { ChartTheme, ChartColorScheme } from '../types/charts';

export function useChartTheme(): ChartTheme {
  const theme = useTheme();

  const colorScheme: ChartColorScheme = useMemo(() => ({
    primary: theme.palette.primary.main,      // #0066cc
    secondary: theme.palette.info.main,       // #17a2b8
    success: theme.palette.success.main,      // #28a745
    warning: theme.palette.warning.main,      // #ff9800
    error: theme.palette.error.main,          // #dc3545
    info: theme.palette.info.main,            // #17a2b8
    backgroundFill: 'rgba(0, 102, 204, 0.1)', // Primary with alpha
    gridColor: theme.palette.divider,         // #e0e0e0
    textColor: theme.palette.text.primary,    // #1a1a1a
  }), [theme]);

  return {
    colors: {
      default: colorScheme,
      dark: colorScheme, // TODO: Implement dark mode colors
      highContrast: colorScheme, // TODO: Implement high contrast
    },
    typography: {
      fontFamily: theme.typography.fontFamily,
      fontSize: {
        title: 16,
        label: 12,
        legend: 12,
        tooltip: 13,
      },
    },
    spacing: {
      padding: theme.spacing(2),
      legendSpacing: theme.spacing(1),
      tickPadding: 8,
    },
    animation: {
      duration: 300,
      easing: 'easeInOut',
      delay: 0,
    },
    grid: {
      display: true,
      color: colorScheme.gridColor,
      lineWidth: 1,
    },
  };
}

/**
 * Generate default Chart.js options with theme
 */
export function useChartOptions(
  type: 'line' | 'bar' | 'doughnut' | 'radar',
  overrides?: Partial<ChartOptions>
): ChartOptions {
  const chartTheme = useChartTheme();
  const theme = useTheme();

  return useMemo(() => {
    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              family: chartTheme.typography.fontFamily,
              size: chartTheme.typography.fontSize.legend,
            },
            color: chartTheme.colors.default.textColor,
            padding: chartTheme.spacing.legendSpacing,
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: theme.palette.grey[800],
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          titleFont: {
            family: chartTheme.typography.fontFamily,
            size: chartTheme.typography.fontSize.tooltip,
            weight: 'bold',
          },
          bodyFont: {
            family: chartTheme.typography.fontFamily,
            size: chartTheme.typography.fontSize.tooltip,
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      animation: {
        duration: chartTheme.animation.duration,
        easing: chartTheme.animation.easing,
      },
    };

    // Type-specific configurations
    if (type === 'line' || type === 'bar') {
      baseOptions.scales = {
        x: {
          grid: {
            display: chartTheme.grid.display,
            color: chartTheme.grid.color,
            lineWidth: chartTheme.grid.lineWidth,
          },
          ticks: {
            font: {
              family: chartTheme.typography.fontFamily,
              size: chartTheme.typography.fontSize.label,
            },
            color: chartTheme.colors.default.textColor,
            padding: chartTheme.spacing.tickPadding,
          },
        },
        y: {
          grid: {
            display: chartTheme.grid.display,
            color: chartTheme.grid.color,
            lineWidth: chartTheme.grid.lineWidth,
          },
          ticks: {
            font: {
              family: chartTheme.typography.fontFamily,
              size: chartTheme.typography.fontSize.label,
            },
            color: chartTheme.colors.default.textColor,
            padding: chartTheme.spacing.tickPadding,
          },
        },
      };
    }

    return { ...baseOptions, ...overrides };
  }, [chartTheme, theme, type, overrides]);
}
```

### Step 2: Create Trends API

**File**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/api/trendsApi.ts`

```typescript
import type { HistoryManifest, AnalysisRun, TrendData, TimeRange } from '../types/charts';

/**
 * Load historical runs manifest
 */
async function loadHistoryManifest(basePath: string): Promise<HistoryManifest> {
  const response = await fetch(`${basePath}/history/manifest.json`);
  if (!response.ok) {
    throw new Error(`Failed to load history manifest: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Filter runs by time range
 */
function filterRunsByTimeRange(runs: AnalysisRun[], timeRange: TimeRange): AnalysisRun[] {
  if (timeRange === 'all') return runs;

  const now = new Date();
  const cutoffDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const cutoff = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);

  return runs.filter(run => new Date(run.timestamp) >= cutoff);
}

/**
 * Calculate trend summary
 */
function calculateTrendSummary(values: number[]): TrendData['summary'] {
  if (values.length === 0) {
    return {
      trend: 'stable',
      changePercentage: 0,
      volatility: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }

  const first = values[0];
  const last = values[values.length - 1];
  const changePercentage = first !== 0 ? ((last - first) / first) * 100 : 0;

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const volatility = Math.sqrt(variance);

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (Math.abs(changePercentage) < 5) {
    trend = 'stable';
  } else if (changePercentage > 0) {
    trend = 'improving';
  } else {
    trend = 'declining';
  }

  return {
    trend,
    changePercentage,
    volatility,
    average: avg,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Extract metric values from runs
 */
function extractMetricValues(
  runs: AnalysisRun[],
  metricKey: keyof AnalysisRun['metrics']
): TrendData {
  const dataPoints = runs.map(run => ({
    timestamp: run.timestamp,
    value: run.metrics[metricKey] as number,
    label: new Date(run.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const values = dataPoints.map(dp => dp.value);
  const summary = calculateTrendSummary(values);

  return {
    metricKey,
    metricName: formatMetricName(metricKey),
    timeRange: 'all', // Will be set by caller
    dataPoints,
    summary,
  };
}

/**
 * Format metric key to human-readable name
 */
function formatMetricName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Trends API service
 */
export const trendsApi = {
  /**
   * Load trend data for a specific metric
   */
  async loadTrendData(
    basePath: string,
    metricKey: keyof AnalysisRun['metrics'],
    timeRange: TimeRange = '30d'
  ): Promise<TrendData> {
    const manifest = await loadHistoryManifest(basePath);
    const filteredRuns = filterRunsByTimeRange(manifest.runs, timeRange);
    const trendData = extractMetricValues(filteredRuns, metricKey);
    return { ...trendData, timeRange };
  },

  /**
   * Load multiple trend datasets
   */
  async loadMultipleTrends(
    basePath: string,
    metricKeys: Array<keyof AnalysisRun['metrics']>,
    timeRange: TimeRange = '30d'
  ): Promise<TrendData[]> {
    const manifest = await loadHistoryManifest(basePath);
    const filteredRuns = filterRunsByTimeRange(manifest.runs, timeRange);

    return metricKeys.map(key => {
      const trendData = extractMetricValues(filteredRuns, key);
      return { ...trendData, timeRange };
    });
  },

  /**
   * Load history manifest
   */
  async loadManifest(basePath: string): Promise<HistoryManifest> {
    return loadHistoryManifest(basePath);
  },
};
```

### Step 3: Create Line Chart Component

**File**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/charts/TrendChart.tsx`

```typescript
import { Line } from 'react-chartjs-2';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { LineChartProps } from '../../types/charts';
import { useChartOptions } from '../../hooks/useChartTheme';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TrendChart({
  title,
  subtitle,
  data,
  height = 300,
  loading = false,
  error = null,
  showLegend = true,
  animated = true,
  thresholds,
  annotations,
  ariaLabel,
}: LineChartProps) {
  const chartOptions = useChartOptions('line', {
    plugins: {
      legend: { display: showLegend },
      annotation: {
        annotations: [
          // Add threshold lines
          ...(thresholds?.map((threshold, index) => ({
            type: 'line' as const,
            yMin: threshold.value,
            yMax: threshold.value,
            borderColor: threshold.color,
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: threshold.label,
              position: 'end' as const,
            },
          })) || []),
          // Add point annotations
          ...(annotations?.map((annotation, index) => ({
            type: 'point' as const,
            xValue: annotation.x,
            yValue: data.datasets[0]?.data[annotation.x] as number,
            backgroundColor: annotation.color || 'rgba(0, 102, 204, 0.5)',
            radius: 8,
            borderWidth: 2,
            borderColor: '#ffffff',
          })) || []),
        ],
      },
    },
    animation: animated ? undefined : false,
  });

  if (loading) {
    return (
      <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ height }} role="img" aria-label={ariaLabel || title}>
        <Line data={data} options={chartOptions} />
      </Box>
    </Paper>
  );
}
```

### Step 4: Create Quality Trend Chart

**File**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/charts/QualityTrendChart.tsx`

```typescript
import { useMemo } from 'react';
import type { ChartData } from 'chart.js';
import { TrendChart } from './TrendChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TrendData } from '../../types/charts';

interface QualityTrendChartProps {
  trendData: TrendData;
  loading?: boolean;
  error?: string | null;
}

export function QualityTrendChart({ trendData, loading, error }: QualityTrendChartProps) {
  const { colors } = useChartTheme();

  const chartData: ChartData<'line'> = useMemo(() => ({
    labels: trendData.dataPoints.map(dp => dp.label || dp.timestamp),
    datasets: [
      {
        label: 'Quality Score',
        data: trendData.dataPoints.map(dp => dp.value),
        borderColor: colors.default.primary,
        backgroundColor: colors.default.backgroundFill,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: colors.default.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  }), [trendData, colors]);

  const thresholds = [
    { value: 80, label: 'Excellent (80%)', color: colors.default.success },
    { value: 60, label: 'Acceptable (60%)', color: colors.default.warning },
  ];

  const subtitle = `Latest: ${trendData.summary.average.toFixed(1)}% | Trend: ${
    trendData.summary.trend === 'improving' ? '↗ Improving' :
    trendData.summary.trend === 'declining' ? '↘ Declining' :
    '→ Stable'
  }`;

  return (
    <TrendChart
      title="Quality Score Over Time"
      subtitle={subtitle}
      data={chartData}
      height={300}
      loading={loading}
      error={error}
      thresholds={thresholds}
      ariaLabel={`Quality score trend showing ${trendData.summary.trend} pattern over ${trendData.dataPoints.length} data points`}
    />
  );
}
```

### Step 5: Create Trends Page Route

**File**: `/Users/alyshialedlie/code/Inventory/src/routes/dashboard/trends/index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DashboardLayout } from '../../../features/dashboard/components/DashboardLayout';
import { QualityTrendChart } from '../../../features/dashboard/components/charts/QualityTrendChart';
import { trendsApi } from '../../../features/dashboard/api/trendsApi';
import type { TimeRange } from '../../../features/dashboard/types/charts';

export const Route = createFileRoute('/dashboard/trends/')({
  component: TrendsPage,
});

function TrendsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const { data: qualityTrend } = useSuspenseQuery({
    queryKey: ['trends', 'qualityScore', timeRange],
    queryFn: () => trendsApi.loadTrendData('/data', 'qualityScore', timeRange),
  });

  return (
    <DashboardLayout lastGenerated={new Date()} currentPath="/dashboard/trends">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Time Range Selector */}
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(_, value) => value && setTimeRange(value)}
          aria-label="time range"
        >
          <ToggleButton value="7d">7 Days</ToggleButton>
          <ToggleButton value="30d">30 Days</ToggleButton>
          <ToggleButton value="90d">90 Days</ToggleButton>
          <ToggleButton value="all">All Time</ToggleButton>
        </ToggleButtonGroup>

        {/* Charts */}
        <QualityTrendChart trendData={qualityTrend} />

        {/* Add more charts: Coverage, Issues, Circular Deps */}
      </Box>
    </DashboardLayout>
  );
}
```

## Phase 3B: Dependency Graph (Week 3-4)

### Step 1: Install and Configure D3

```bash
npm install d3 @types/d3
```

### Step 2: Create Graph Transformation Utilities

**File**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/utils/graphTransform.ts`

```typescript
import type { PythonDependencyReport } from '../types';
import type { DependencyGraph, GraphNode, GraphEdge, NodeType } from '../types/graph';

/**
 * Determine node type from file path
 */
function getNodeType(filePath: string): NodeType {
  if (filePath.includes('/components/') || filePath.includes('/features/')) {
    return 'app';
  }
  if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
    return 'util';
  }
  if (filePath.includes('/api/') || filePath.includes('/services/')) {
    return 'service';
  }
  if (filePath.includes('/test/') || filePath.endsWith('.test.ts')) {
    return 'test';
  }
  if (filePath.startsWith('node_modules/')) {
    return 'external';
  }
  return 'app';
}

/**
 * Calculate node size based on degree centrality
 */
function calculateNodeSize(imports: number, importedBy: number): number {
  const degree = imports + importedBy;
  if (degree === 0) return 30;
  if (degree <= 2) return 30;
  if (degree <= 5) return 50;
  if (degree <= 10) return 70;
  return 100;
}

/**
 * Transform PythonDependencyReport to DependencyGraph
 */
export function transformToGraph(report: PythonDependencyReport): DependencyGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  // Create nodes
  Object.keys(report.dependency_graph).forEach(filePath => {
    const imports = report.dependency_graph[filePath] || [];
    const importedBy = Object.keys(report.dependency_graph).filter(
      key => report.dependency_graph[key]?.includes(filePath)
    );

    const node: GraphNode = {
      id: filePath,
      label: filePath.split('/').pop() || filePath,
      path: filePath,
      type: getNodeType(filePath),
      size: calculateNodeSize(imports.length, importedBy.length),
      metrics: {
        imports: imports.length,
        importedBy: importedBy.length,
      },
      isCircular: report.circular_dependencies.some(chain =>
        chain.includes(filePath)
      ),
    };

    nodes.push(node);
    nodeMap.set(filePath, node);
  });

  // Create edges
  Object.entries(report.dependency_graph).forEach(([source, targets]) => {
    targets.forEach(target => {
      edges.push({
        source,
        target,
        type: 'static',
        strength: 5,
        isCircular: report.circular_dependencies.some(chain =>
          chain.includes(source) && chain.includes(target)
        ),
      });
    });
  });

  // Detect circular dependency chains
  const circularChains = report.circular_dependencies.map((chain, index) => ({
    id: index,
    nodes: chain,
    edges: chain.map((node, i) => ({
      source: node,
      target: chain[(i + 1) % chain.length],
    })),
    length: chain.length,
    severity: (chain.length <= 3 ? 'low' :
               chain.length <= 5 ? 'medium' :
               chain.length <= 8 ? 'high' : 'critical') as const,
  }));

  return {
    nodes,
    edges,
    circularChains,
    clusters: [],
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      circularChainCount: circularChains.length,
      avgDegree: edges.length / nodes.length,
      density: (2 * edges.length) / (nodes.length * (nodes.length - 1)),
      maxDepth: 0, // TODO: Calculate max depth
    },
  };
}
```

## Testing Strategy

### Unit Tests

```typescript
// trendsApi.test.ts
describe('trendsApi', () => {
  it('filters runs by time range', () => {
    // Test implementation
  });

  it('calculates trend summary correctly', () => {
    // Test implementation
  });
});

// graphTransform.test.ts
describe('graphTransform', () => {
  it('transforms dependency report to graph', () => {
    // Test implementation
  });

  it('detects circular dependencies', () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// TrendChart.test.tsx
describe('TrendChart', () => {
  it('renders with data', () => {
    // Test implementation
  });

  it('shows loading state', () => {
    // Test implementation
  });
});
```

## Performance Monitoring

```typescript
// Add performance instrumentation
const startTime = performance.now();
const graph = transformToGraph(report);
const endTime = performance.now();
console.log(`Graph transform took ${endTime - startTime}ms`);

// Set performance budgets
expect(endTime - startTime).toBeLessThan(200); // <200ms for 500 nodes
```

## Accessibility Checklist

- [ ] All charts have ARIA labels
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announces chart updates
- [ ] Data table fallbacks provided
- [ ] Respects prefers-reduced-motion

## Next Steps

After completing Phase 3A (Trend Charts), proceed to:
1. Phase 3B: Dependency Graph
2. Phase 3C: Historical Comparison
3. Phase 3D: Report Generation

Refer to PHASE3_VISUALIZATION_DESIGN.md for detailed specifications.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
