/**
 * DebtBurndownChart Component
 *
 * Time-series chart comparing actual debt reduction vs. target pace.
 *
 * Features:
 * - Solid line for actual debt (primary color)
 * - Dashed line for target pace (success color)
 * - Optional projected future data (dotted line)
 * - Semi-transparent filled area
 * - Status summary below chart
 * - WCAG AA accessible with data table alternative
 */

import { useMemo, useId } from 'react';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
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
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import type { DebtBurndownChartProps, TimeSeriesDataPoint, BurndownStatus } from '../../types/analytics';

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

/**
 * Get status color and label
 */
function getStatusConfig(status: BurndownStatus): { color: string; label: string; chipColor: 'success' | 'warning' | 'error' | 'info' } {
  const configs: Record<BurndownStatus, { color: string; label: string; chipColor: 'success' | 'warning' | 'error' | 'info' }> = {
    ahead: {
      color: 'var(--color-success, #28a745)',
      label: 'Ahead of Schedule',
      chipColor: 'success',
    },
    'on-track': {
      color: 'var(--color-info, #17a2b8)',
      label: 'On Track',
      chipColor: 'info',
    },
    behind: {
      color: 'var(--color-warning, #ff9800)',
      label: 'Behind Schedule',
      chipColor: 'warning',
    },
    critical: {
      color: 'var(--color-error, #dc3545)',
      label: 'Critical',
      chipColor: 'error',
    },
  };
  return configs[status];
}

/**
 * Format hours for display
 */
function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(0)}h`;
  const days = Math.floor(hours / 8);
  return `${days}d`;
}

/**
 * Status summary component
 */
interface StatusSummaryProps {
  currentDebt: number;
  targetDebt: number;
  status: BurndownStatus;
  progressPercent: number;
  estimatedDaysToTarget: number | null;
  trend: 'improving' | 'declining' | 'stable';
}

function StatusSummary({
  currentDebt,
  targetDebt,
  status,
  progressPercent,
  estimatedDaysToTarget,
  trend,
}: StatusSummaryProps) {
  const statusConfig = getStatusConfig(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mt: 2,
          pt: 2,
          borderTop: '1px solid var(--color-border, #e0e0e0)',
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Current Debt
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {formatHours(currentDebt)}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Target
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {formatHours(targetDebt)}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {progressPercent}%
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Status
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={statusConfig.label}
              color={statusConfig.chipColor}
              size="small"
            />
          </Box>
        </Box>

        {estimatedDaysToTarget !== null && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Est. Days to Target
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {estimatedDaysToTarget}
            </Typography>
          </Box>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary">
            Trend
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              textTransform: 'capitalize',
              color:
                trend === 'improving'
                  ? 'success.main'
                  : trend === 'declining'
                  ? 'error.main'
                  : 'text.primary',
            }}
          >
            {trend}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

/**
 * Loading skeleton
 */
function ChartSkeleton({ height }: { height: number }) {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={height - 100} />
      <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i}>
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={40} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        color: 'text.secondary',
      }}
    >
      <Typography variant="h6">No Debt Data Available</Typography>
      <Typography variant="body2">
        Historical data is required to display the burndown chart
      </Typography>
    </Box>
  );
}

/**
 * Accessible data table
 */
function DataTable({
  actualData,
  targetData,
}: {
  actualData: TimeSeriesDataPoint[];
  targetData: TimeSeriesDataPoint[];
}) {
  return (
    <TableContainer>
      <Table size="small" aria-label="Debt burndown data">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actual (hrs)</TableCell>
            <TableCell align="right">Target (hrs)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {actualData.map((point, index) => (
            <TableRow key={point.timestamp}>
              <TableCell>{format(parseISO(point.timestamp), 'MMM d')}</TableCell>
              <TableCell align="right">{point.value.toFixed(0)}</TableCell>
              <TableCell align="right">
                {targetData[index]?.value.toFixed(0) || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * DebtBurndownChart Component
 */
export function DebtBurndownChart({
  actualData,
  targetData,
  projectedData,
  timeRange: _timeRange,
  height = 300,
  currentDebt,
  targetDebt,
  showStatus = true,
  isLoading = false,
}: DebtBurndownChartProps) {
  const chartId = useId();

  // Prepare chart data
  const chartData = useMemo<ChartData<'line'>>(() => {
    const labels = actualData.map((d) => format(parseISO(d.timestamp), 'MMM d'));

    const datasets: ChartData<'line'>['datasets'] = [
      {
        label: 'Actual Debt',
        data: actualData.map((d) => d.value),
        borderColor: 'rgba(220, 53, 69, 1)', // error color
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Target Pace',
        data: targetData.map((d) => d.value),
        borderColor: 'rgba(40, 167, 69, 1)', // success color
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ];

    if (projectedData && projectedData.length > 0) {
      // Add projected data starting from last actual point
      const lastActualIndex = actualData.length - 1;
      const projectedValues = new Array(lastActualIndex).fill(null);
      projectedValues.push(actualData[lastActualIndex]?.value);
      projectedData.forEach((d) => projectedValues.push(d.value));

      // Add projected labels
      projectedData.forEach((d) => {
        labels.push(format(parseISO(d.timestamp), 'MMM d'));
      });

      datasets.push({
        label: 'Projected',
        data: projectedValues,
        borderColor: 'rgba(108, 117, 125, 0.8)', // secondary color
        backgroundColor: 'rgba(108, 117, 125, 0.05)',
        borderWidth: 2,
        borderDash: [2, 2],
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    }

    return { labels, datasets };
  }, [actualData, targetData, projectedData]);

  // Chart options
  const options = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1a1a1a',
        bodyColor: '#666666',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) return '';
            return `${context.dataset.label}: ${formatHours(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => formatHours(Number(value)),
        },
      },
    },
    animation: {
      duration: 750,
      easing: 'easeOutQuart',
    },
  }), []);

  // Calculate summary if not provided
  const summary = useMemo(() => {
    if (actualData.length === 0) return null;

    const current = currentDebt ?? actualData[actualData.length - 1]?.value ?? 0;
    const target = targetDebt ?? targetData[targetData.length - 1]?.value ?? current * 0.5;
    const start = actualData[0]?.value ?? current;

    const totalReduction = start - target;
    const actualReduction = start - current;
    const progressPercent = totalReduction > 0 ? Math.round((actualReduction / totalReduction) * 100) : 0;

    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (actualData.length >= 2) {
      const recent = actualData.slice(-4);
      const change = recent[recent.length - 1].value - recent[0].value;
      if (change < -2) trend = 'improving';
      else if (change > 2) trend = 'declining';
    }

    // Determine status
    let status: BurndownStatus = 'on-track';
    if (current <= target) status = 'ahead';
    else if (current > start) status = 'critical';
    else if (progressPercent < 50 && actualData.length > 5) status = 'behind';

    // Estimate days to target
    let estimatedDaysToTarget: number | null = null;
    if (trend === 'improving' && current > target && actualData.length >= 2) {
      const recent = actualData.slice(-4);
      const weeklyRate = Math.abs(recent[recent.length - 1].value - recent[0].value) / (recent.length - 1);
      if (weeklyRate > 0) {
        const weeksNeeded = (current - target) / weeklyRate;
        estimatedDaysToTarget = Math.round(weeksNeeded * 7);
      }
    }

    return {
      currentDebt: current,
      targetDebt: target,
      status,
      progressPercent,
      estimatedDaysToTarget,
      trend,
    };
  }, [actualData, targetData, currentDebt, targetDebt]);

  if (isLoading) {
    return (
      <Paper sx={{ height }}>
        <ChartSkeleton height={height} />
      </Paper>
    );
  }

  if (actualData.length === 0) {
    return (
      <Paper sx={{ p: 2, height }}>
        <EmptyState />
      </Paper>
    );
  }

  const chartHeight = showStatus ? height - 100 : height - 50;

  return (
    <Paper
      sx={{ p: 2, height: showStatus ? 'auto' : height }}
      role="figure"
      aria-labelledby={`${chartId}-title`}
    >
      <Typography id={`${chartId}-title`} variant="h6" component="h3" sx={{ mb: 2 }}>
        Technical Debt Burndown
      </Typography>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ height: chartHeight }} aria-hidden="true">
          <Line data={chartData} options={options} />
        </Box>
      </motion.div>

      {showStatus && summary && (
        <StatusSummary
          currentDebt={summary.currentDebt}
          targetDebt={summary.targetDebt}
          status={summary.status}
          progressPercent={summary.progressPercent}
          estimatedDaysToTarget={summary.estimatedDaysToTarget}
          trend={summary.trend}
        />
      )}

      {/* Screen reader only data table */}
      <Box className="sr-only">
        <DataTable actualData={actualData} targetData={targetData} />
      </Box>
    </Paper>
  );
}

export default DebtBurndownChart;
