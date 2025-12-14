/**
 * PredictionChart Component
 *
 * Displays prediction timeline with:
 * - Historical data (solid line)
 * - Predicted trend (dashed line)
 * - Goal markers
 */

import { useMemo } from 'react';
import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { PredictionData } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

/**
 * Props for PredictionChart
 */
export interface PredictionChartProps {
  /** Prediction data to display */
  data: PredictionData | null;
  /** Chart height */
  height?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Title for the chart */
  title?: string;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Loading skeleton
 */
function ChartSkeleton({ height }: { height: number }) {
  return (
    <Box sx={{ width: '100%', height }}>
      <Skeleton variant="rectangular" height={height} />
    </Box>
  );
}

/**
 * PredictionChart component
 */
export function PredictionChart({
  data,
  height = 300,
  showLegend = true,
  title,
}: PredictionChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!data) return null;

    // Handle empty data case
    if (data.historical.length === 0 && data.predicted.length === 0) {
      return null;
    }

    const historicalLabels = data.historical.map((d) => formatDate(d.date));
    const predictedLabels = data.predicted.map((d) => formatDate(d.date));

    // Combine labels with "Today" marker
    const allLabels = [...historicalLabels, ...predictedLabels];

    // Historical values (fill null for prediction period)
    const historicalValues = [
      ...data.historical.map((d) => d.value),
      ...Array(data.predicted.length).fill(null),
    ];

    // Predicted values (fill null for historical period, connect at last historical point)
    const lastHistoricalValue = data.historical.length > 0
      ? data.historical[data.historical.length - 1]?.value
      : null;
    const predictedValues = data.historical.length > 0
      ? [
          ...Array(data.historical.length - 1).fill(null),
          lastHistoricalValue, // Connection point
          ...data.predicted.map((d) => d.value),
        ]
      : data.predicted.map((d) => d.value);

    const datasets = [
      {
        label: 'Historical',
        data: historicalValues,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Predicted',
        data: predictedValues,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: false,
      },
    ];

    // Confidence band disabled - Chart.js fill between datasets
    // requires complex configuration that doesn't work reliably
    // TODO: Re-implement with proper Chart.js area fill plugin if needed

    return {
      labels: allLabels,
      datasets,
    };
  }, [data, theme]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top' as const,
          labels: {
            filter: (item: { text: string }) =>
              !item.text.includes('Confidence'),
            usePointStyle: true,
            padding: 16,
          },
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              if (context.parsed.y === null) return '';
              if (context.dataset.label?.includes('Confidence')) return '';
              const value = context.parsed.y.toFixed(1);
              return `${context.dataset.label || ''}: ${value}${data?.unit || ''}`;
            },
          },
        },
        title: {
          display: Boolean(title),
          text: title || '',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxTicksLimit: 8,
          },
        },
        y: {
          min: data?.min,
          max: data?.max,
          title: {
            display: true,
            text: data?.metricLabel || data?.metric || '',
          },
          grid: {
            color: `${theme.palette.divider}`,
          },
        },
      },
    }),
    [data, showLegend, title, theme]
  );

  if (!data) {
    return <ChartSkeleton height={height} />;
  }

  if (!chartData) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
        }}
      >
        <Typography color="text.secondary">No prediction data available</Typography>
      </Box>
    );
  }

  const totalDataPoints = data.historical.length + data.predicted.length;

  return (
    <Box sx={{ height, position: 'relative' }}>
      {/* "Today" marker - vertical line indicating current date */}
      {data.historical.length > 0 && totalDataPoints > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: `${(data.historical.length / totalDataPoints) * 100}%`,
            top: 0,
            bottom: 30,
            width: '1px',
            bgcolor: 'warning.main',
            zIndex: 1,
            '&::after': {
              content: '"Today"',
              position: 'absolute',
              top: 0,
              left: 4,
              fontSize: 10,
              color: 'warning.main',
              fontWeight: 600,
            },
          }}
        />
      )}
      <Line data={chartData} options={options} />

      {/* Confidence indicator */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
          px: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Methodology: {data.methodology}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Confidence: {data.confidence}% | Horizon: {data.horizon} days
        </Typography>
      </Box>
    </Box>
  );
}

export default PredictionChart;
