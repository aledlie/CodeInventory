/**
 * CircularDepsChart Component
 *
 * Bar chart showing circular dependency count trend over time.
 */

import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Paper, CircularProgress, Alert, Chip } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData } from 'chart.js';
import { useChartOptions, useChartTheme } from '../../hooks/useChartTheme';
import type { AnalysisRun } from '../../types/charts';

// Register Chart.js bar components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CircularDepsChartProps {
  runs: AnalysisRun[];
  loading?: boolean;
  error?: string | null;
  height?: number;
}

export const CircularDepsChart: React.FC<CircularDepsChartProps> = ({
  runs,
  loading,
  error,
  height = 300,
}) => {
  const { colors } = useChartTheme();
  const baseOptions = useChartOptions('bar');

  const chartData: ChartData<'bar'> = useMemo(() => {
    const labels = runs.map((run) =>
      new Date(run.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    );

    const data = runs.map((r) => r.metrics.circularDeps);

    // Color bars based on value (red if any, green if zero)
    const backgroundColors = data.map((val) =>
      val === 0 ? colors.default.success : colors.default.error
    );

    return {
      labels,
      datasets: [
        {
          label: 'Circular Dependencies',
          data,
          backgroundColor: backgroundColors,
          borderRadius: 4,
        },
      ],
    };
  }, [runs, colors]);

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  const currentCount = runs.length > 0 ? runs[runs.length - 1].metrics.circularDeps : 0;
  const isClean = currentCount === 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" component="h2">
            Circular Dependencies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current: {currentCount} | Target: 0
          </Typography>
        </Box>
        <Chip
          label={isClean ? 'Clean' : `${currentCount} cycles`}
          color={isClean ? 'success' : 'error'}
          size="small"
        />
      </Box>
      <Box sx={{ height }} role="img" aria-label="Circular dependencies bar chart">
        <Bar data={chartData} options={baseOptions} />
      </Box>
    </Paper>
  );
};

export default CircularDepsChart;
