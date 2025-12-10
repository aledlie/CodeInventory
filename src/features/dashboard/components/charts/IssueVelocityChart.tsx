/**
 * IssueVelocityChart Component
 *
 * Stacked area chart showing issue counts by severity over time.
 */

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import type { ChartData, ChartOptions } from 'chart.js';
import { useChartOptions, useSeverityColors } from '../../hooks/useChartTheme';
import type { AnalysisRun } from '../../types/charts';

interface IssueVelocityChartProps {
  runs: AnalysisRun[];
  loading?: boolean;
  error?: string | null;
  height?: number;
}

export function IssueVelocityChart({
  runs,
  loading,
  error,
  height = 300,
}: IssueVelocityChartProps) {
  const severityColors = useSeverityColors();
  const baseOptions = useChartOptions('line');

  const chartData: ChartData<'line'> = useMemo(() => {
    const labels = runs.map((run) =>
      new Date(run.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Critical',
          data: runs.map((r) => r.metrics.criticalIssues),
          borderColor: severityColors.critical,
          backgroundColor: `${severityColors.critical}40`,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'High',
          data: runs.map((r) => r.metrics.highIssues),
          borderColor: severityColors.high,
          backgroundColor: `${severityColors.high}40`,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'Medium',
          data: runs.map((r) => r.metrics.mediumIssues),
          borderColor: severityColors.medium,
          backgroundColor: `${severityColors.medium}40`,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'Low',
          data: runs.map((r) => r.metrics.lowIssues),
          borderColor: severityColors.low,
          backgroundColor: `${severityColors.low}40`,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }, [runs, severityColors]);

  const chartOptions: ChartOptions<'line'> = useMemo(
    () => ({
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales?.y,
          stacked: true,
          beginAtZero: true,
        },
        x: {
          ...baseOptions.scales?.x,
          stacked: true,
        },
      },
      plugins: {
        ...baseOptions.plugins,
        tooltip: {
          ...baseOptions.plugins?.tooltip,
          mode: 'index',
          intersect: false,
        },
      },
    }),
    [baseOptions]
  );

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

  const totalIssues = runs.length > 0 ? runs[runs.length - 1].metrics : null;
  const totalCount = totalIssues
    ? totalIssues.criticalIssues +
      totalIssues.highIssues +
      totalIssues.mediumIssues +
      totalIssues.lowIssues
    : 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" component="h2">
          Issue Velocity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total issues: {totalCount} | Tracking issues by severity over time
        </Typography>
      </Box>
      <Box sx={{ height }} role="img" aria-label="Issue velocity stacked area chart">
        <Line data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  );
};

export default IssueVelocityChart;
