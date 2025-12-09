/**
 * BuilderCanvas Component
 *
 * Main canvas area for the visualization builder where:
 * - Charts are rendered
 * - Live preview updates
 * - Drag & drop targets
 */

import { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Radar, Scatter } from 'react-chartjs-2';
import type { VisualizationConfig } from '../../types/visualizations';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  ChartTooltip,
  Legend
);

/**
 * Props for BuilderCanvas
 */
export interface BuilderCanvasProps {
  /** Current visualization config */
  config: VisualizationConfig;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Sample data for preview */
  sampleData?: Record<string, number[]>;
  /** Callback for fullscreen toggle */
  onFullscreen?: () => void;
  /** Callback for export */
  onExport?: () => void;
  /** Callback for refresh */
  onRefresh?: () => void;
}

/**
 * Generate sample labels based on time range
 */
function generateLabels(timeRange: string): string[] {
  const days = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '60d': 60,
    '90d': 90,
    custom: 30,
  }[timeRange] || 30;

  const labels: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

/**
 * Generate random sample data for preview
 */
function generateSampleData(metricId: string, count: number): number[] {
  const baseValues: Record<string, { min: number; max: number; trend: number }> = {
    qualityScore: { min: 70, max: 95, trend: 0.3 },
    coveragePercentage: { min: 50, max: 90, trend: 0.5 },
    issueCount: { min: 10, max: 100, trend: -0.5 },
    criticalIssues: { min: 0, max: 10, trend: -0.3 },
    circularDeps: { min: 0, max: 15, trend: -0.2 },
    untestedFunctions: { min: 5, max: 50, trend: -0.4 },
    totalFiles: { min: 100, max: 200, trend: 0.1 },
    totalDependencies: { min: 20, max: 80, trend: 0.1 },
  };

  const config = baseValues[metricId] || { min: 0, max: 100, trend: 0 };
  const data: number[] = [];
  let current = config.min + (config.max - config.min) * 0.5;

  for (let i = 0; i < count; i++) {
    // Add trend and noise
    current = current + config.trend + (Math.random() - 0.5) * 5;
    // Clamp to bounds
    current = Math.max(config.min, Math.min(config.max, current));
    data.push(Math.round(current * 10) / 10);
  }

  return data;
}

/**
 * BuilderCanvas component
 */
export function BuilderCanvas({
  config,
  isLoading = false,
  sampleData,
  onFullscreen,
  onExport,
  onRefresh,
}: BuilderCanvasProps) {
  const labels = useMemo(() => generateLabels(config.timeRange), [config.timeRange]);

  const chartData = useMemo(() => {
    const datasets = config.metrics.filter((m) => m.visible).map((metric) => {
      const data = sampleData?.[metric.metric] || generateSampleData(metric.metric, labels.length);
      return {
        label: metric.label,
        data,
        borderColor: metric.color,
        backgroundColor: `${metric.color}40`,
        fill: config.chartType === 'area',
        tension: 0.3,
        yAxisID: metric.yAxis === 'left' ? 'y' : 'y1',
      };
    });

    return {
      labels,
      datasets,
    };
  }, [config, labels, sampleData]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: config.showLegend,
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
      scales: config.chartType !== 'pie' && config.chartType !== 'radar' ? {
        x: {
          grid: {
            display: config.showGrid,
          },
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          grid: {
            display: config.showGrid,
          },
        },
        ...(config.metrics.some((m) => m.yAxis === 'right') && {
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            grid: {
              drawOnChartArea: false,
            },
          },
        }),
      } : undefined,
    }),
    [config]
  );

  // Render appropriate chart type
  const renderChart = () => {
    if (isLoading) {
      return <Skeleton variant="rectangular" height="100%" />;
    }

    if (config.metrics.length === 0) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add metrics to get started
          </Typography>
          <Typography variant="body2">
            Select metrics from the sidebar to build your visualization.
          </Typography>
        </Box>
      );
    }

    const chartProps = { data: chartData, options };

    switch (config.chartType) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'area':
        return <Line {...chartProps} />;
      case 'pie':
        return (
          <Pie
            data={{
              ...chartData,
              datasets: chartData.datasets.map((ds) => ({
                ...ds,
                backgroundColor: config.metrics.map((m) => m.color),
              })),
            }}
            options={{
              ...options,
              plugins: {
                ...options.plugins,
                legend: { display: config.showLegend, position: 'right' },
              },
            }}
          />
        );
      case 'scatter':
        return <Scatter {...chartProps} />;
      case 'radar':
        return (
          <Radar
            data={chartData}
            options={{
              ...options,
              scales: {
                r: {
                  grid: { display: config.showGrid },
                },
              },
            }}
          />
        );
      default:
        return <Line {...chartProps} />;
    }
  };

  return (
    <Paper
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        m: 2,
        ml: 0,
      }}
    >
      {/* Header toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {config.title || 'Untitled Visualization'}
        </Typography>
        <Box>
          <Tooltip title="Refresh Preview">
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton size="small" onClick={onFullscreen}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton size="small" onClick={onExport}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Chart area */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          minHeight: 300,
        }}
      >
        {renderChart()}
      </Box>
    </Paper>
  );
}

export default BuilderCanvas;
