/**
 * TrendChart Component
 *
 * Base line chart component for displaying metric trends over time.
 * Integrates with MUI theme and supports threshold lines and annotations.
 */

import { Line } from 'react-chartjs-2';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
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

interface TrendChartProps extends LineChartProps {
  /** Optional trend indicator text */
  trendIndicator?: string;
}

export function TrendChart({
  title,
  subtitle,
  data,
  height = 300,
  loading = false,
  error = null,
  showLegend = true,
  animated = true,
  ariaLabel,
  trendIndicator,
}: TrendChartProps) {
  const chartOptions = useChartOptions('line', {
    plugins: {
      legend: { display: showLegend },
    },
    animation: animated ? undefined : false,
  });

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

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" component="h2">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {trendIndicator && (
          <Typography
            variant="body2"
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'grey.100',
              fontWeight: 500,
            }}
          >
            {trendIndicator}
          </Typography>
        )}
      </Box>
      <Box sx={{ height }} role="img" aria-label={ariaLabel || title}>
        <Line data={data} options={chartOptions} />
      </Box>
    </Paper>
  );
};

export default TrendChart;
