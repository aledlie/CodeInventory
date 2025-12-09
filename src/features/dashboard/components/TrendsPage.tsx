/**
 * TrendsPage Component
 *
 * Displays historical trends for code quality, coverage, issues, and dependencies.
 * Phase 3 feature: Trend visualizations with time range filtering.
 */

import { useState, Suspense } from 'react';
import { Box, Typography, Grid2 as Grid, Skeleton, Paper } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DashboardLayout } from './DashboardLayout';
import {
  QualityTrendChart,
  CoverageTrendChart,
  IssueVelocityChart,
  CircularDepsChart,
  TimeRangeSelector,
} from './charts';
import { trendsApi } from '../api/trendsApi';
import type { ChartTimeRange } from '../types/charts';

const DATA_PATH = '/data';

interface TrendsContentProps {
  timeRange: ChartTimeRange;
}

/**
 * Trend charts content with data fetching
 */
function TrendsContent({ timeRange }: TrendsContentProps) {
  const { data: qualityTrend } = useSuspenseQuery({
    queryKey: ['trends', 'qualityScore', timeRange],
    queryFn: () => trendsApi.loadTrendData(DATA_PATH, 'qualityScore', timeRange),
  });

  const { data: coverageTrend } = useSuspenseQuery({
    queryKey: ['trends', 'coveragePercentage', timeRange],
    queryFn: () => trendsApi.loadTrendData(DATA_PATH, 'coveragePercentage', timeRange),
  });

  const { data: runs } = useSuspenseQuery({
    queryKey: ['trends', 'runs', timeRange],
    queryFn: () => trendsApi.loadRuns(DATA_PATH, timeRange),
  });

  return (
    <Grid container spacing={3}>
      {/* Quality Score Trend */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <QualityTrendChart trendData={qualityTrend} />
      </Grid>

      {/* Coverage Trend */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <CoverageTrendChart trendData={coverageTrend} />
      </Grid>

      {/* Issue Velocity */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <IssueVelocityChart runs={runs} />
      </Grid>

      {/* Circular Dependencies */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <CircularDepsChart runs={runs} />
      </Grid>
    </Grid>
  );
}

/**
 * Loading skeleton for trend charts
 */
function TrendsLoadingSkeleton() {
  return (
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid key={i} size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}


/**
 * Main TrendsPage component
 */
export const TrendsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('30d');

  return (
    <DashboardLayout lastGenerated={new Date()} currentPath="/dashboard/trends">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h1" gutterBottom>
              Trends
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track code quality, coverage, and issues over time.
            </Typography>
          </Box>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </Box>

        {/* Trend Charts */}
        <Suspense fallback={<TrendsLoadingSkeleton />}>
          <TrendsContent timeRange={timeRange} />
        </Suspense>
      </Box>
    </DashboardLayout>
  );
};

export default TrendsPage;
