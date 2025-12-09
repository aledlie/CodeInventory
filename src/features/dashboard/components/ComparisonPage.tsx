/**
 * ComparisonPage Component
 *
 * Historical metrics comparison dashboard.
 * Allows comparing code quality, coverage, and dependency metrics over time.
 */

import { useState, useMemo, Suspense } from 'react';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Divider,
  Grid2 as Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DashboardLayout } from './DashboardLayout';
import { ComparisonCard, DateRangeSelector } from './comparison';
import { comparisonApi } from '../api/comparisonApi';
import type { ComparisonPreset, SimpleComparisonResult } from '../types/comparison';

const PRESET_DAYS: Record<Exclude<ComparisonPreset, 'custom'>, number> = {
  day: 1,
  week: 7,
  month: 30,
  quarter: 90,
};

/**
 * Calculate dates from preset
 */
function getDatesFromPreset(preset: ComparisonPreset, daysAgo?: number): [string, string] {
  const today = new Date();
  const previous = new Date(today);
  const days = preset === 'custom' ? (daysAgo || 7) : PRESET_DAYS[preset];
  previous.setDate(previous.getDate() - days);
  return [today.toISOString().split('T')[0], previous.toISOString().split('T')[0]];
}

interface ComparisonContentProps {
  currentDate: string;
  previousDate: string;
}

/**
 * Content component with data fetching
 */
function ComparisonContent({ currentDate, previousDate }: ComparisonContentProps) {
  const { data: comparison } = useSuspenseQuery({
    queryKey: ['comparison', currentDate, previousDate],
    queryFn: () => comparisonApi.compare(currentDate, previousDate),
  });

  return <ComparisonDisplay comparison={comparison} />;
}

interface ComparisonDisplayProps {
  comparison: SimpleComparisonResult;
}

/**
 * Display component for comparison results
 */
function ComparisonDisplay({ comparison }: ComparisonDisplayProps) {
  // Calculate overall assessment
  const assessment = useMemo(() => {
    const qualityImproved = comparison.quality.score.trend === 'up';
    const coverageImproved = comparison.coverage.overall.trend === 'up';
    const issuesReduced =
      comparison.quality.criticalIssues.trend === 'down' ||
      comparison.quality.majorIssues.trend === 'down';

    const improvements: string[] = [];
    const concerns: string[] = [];

    if (qualityImproved) improvements.push('Quality score improved');
    if (coverageImproved) improvements.push('Test coverage increased');
    if (issuesReduced) improvements.push('Issues reduced');

    if (comparison.quality.criticalIssues.trend === 'up') {
      concerns.push(`${comparison.quality.criticalIssues.change} new critical issues`);
    }
    if (comparison.coverage.overall.trend === 'down') {
      concerns.push(`Coverage dropped ${Math.abs(comparison.coverage.overall.percentChange)}%`);
    }
    if (comparison.dependencies.circular.trend === 'up') {
      concerns.push('New circular dependencies introduced');
    }

    const score =
      (improvements.length * 25) - (concerns.length * 20) + 50;

    return {
      score: Math.max(0, Math.min(100, score)),
      improvements,
      concerns,
      trend: improvements.length >= concerns.length ? 'improving' : 'declining',
    };
  }, [comparison]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary Banner */}
      <Paper
        sx={{
          p: 3,
          bgcolor:
            assessment.trend === 'improving'
              ? 'success.light'
              : 'warning.light',
          color:
            assessment.trend === 'improving'
              ? 'success.contrastText'
              : 'warning.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {assessment.trend === 'improving' ? (
            <CheckCircleIcon sx={{ fontSize: 40 }} />
          ) : (
            <WarningIcon sx={{ fontSize: 40 }} />
          )}
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {assessment.trend === 'improving'
                ? 'Code Health Improving'
                : 'Attention Needed'}
            </Typography>
            <Typography variant="body1">
              {assessment.improvements.length} improvements,{' '}
              {assessment.concerns.length} concerns since last period
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', textAlign: 'right' }}>
            <Typography variant="h3" fontWeight={600}>
              {assessment.score}
            </Typography>
            <Typography variant="caption">Health Score</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Highlights */}
      {(assessment.improvements.length > 0 || assessment.concerns.length > 0) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {assessment.improvements.map((item, i) => (
            <Chip
              key={`imp-${i}`}
              icon={<CheckCircleIcon />}
              label={item}
              color="success"
              variant="outlined"
              size="small"
            />
          ))}
          {assessment.concerns.map((item, i) => (
            <Chip
              key={`con-${i}`}
              icon={<ErrorIcon />}
              label={item}
              color="error"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}

      {/* Quality Metrics Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Code Quality</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Quality Score"
                diff={comparison.quality.score}
                unit="pts"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Critical Issues"
                diff={comparison.quality.criticalIssues}
                lowerIsBetter
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Major Issues"
                diff={comparison.quality.majorIssues}
                lowerIsBetter
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Minor Issues"
                diff={comparison.quality.minorIssues}
                lowerIsBetter
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Maintainability Index"
                diff={comparison.quality.maintainabilityIndex}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Technical Debt"
                diff={comparison.quality.technicalDebt}
                unit="hrs"
                lowerIsBetter
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Coverage Metrics Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Test Coverage</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Overall Coverage"
                diff={comparison.coverage.overall}
                unit="%"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Unit Tests"
                diff={comparison.coverage.unit}
                unit="%"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Integration Tests"
                diff={comparison.coverage.integration}
                unit="%"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="E2E Tests"
                diff={comparison.coverage.e2e}
                unit="%"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ComparisonCard
                label="Untested Files"
                diff={comparison.coverage.untestedFiles}
                lowerIsBetter
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Dependencies Metrics Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Dependencies</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ComparisonCard
                label="Total Dependencies"
                diff={comparison.dependencies.total}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ComparisonCard
                label="Outdated"
                diff={comparison.dependencies.outdated}
                lowerIsBetter
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ComparisonCard
                label="Vulnerable"
                diff={comparison.dependencies.vulnerable}
                lowerIsBetter
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ComparisonCard
                label="Circular"
                diff={comparison.dependencies.circular}
                lowerIsBetter
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

/**
 * Loading skeleton
 */
function ComparisonLoadingSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Skeleton variant="rectangular" height={120} />
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/**
 * Main ComparisonPage component
 */
export function ComparisonPage() {
  const [preset, setPreset] = useState<ComparisonPreset>('week');
  const [customDates, setCustomDates] = useState<[string, string] | null>(null);

  const [currentDate, previousDate] = useMemo(() => {
    if (preset === 'custom' && customDates) {
      return customDates;
    }
    return getDatesFromPreset(preset);
  }, [preset, customDates]);

  const handlePresetChange = (newPreset: ComparisonPreset) => {
    setPreset(newPreset);
  };

  const handleCustomDatesChange = (current: string, previous: string) => {
    setCustomDates([current, previous]);
  };

  return (
    <DashboardLayout lastGenerated={new Date()} currentPath="/dashboard/compare">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Page Header */}
        <Box>
          <Typography variant="h1" gutterBottom>
            Historical Comparison
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Compare code metrics between different time periods to track progress and identify trends.
          </Typography>
        </Box>

        {/* Date Range Selector */}
        <Paper sx={{ p: 2 }}>
          <DateRangeSelector
            preset={preset}
            currentDate={currentDate}
            previousDate={previousDate}
            onPresetChange={handlePresetChange}
            onCustomDatesChange={handleCustomDatesChange}
          />
        </Paper>

        <Divider />

        {/* Comparison Content */}
        <Suspense fallback={<ComparisonLoadingSkeleton />}>
          <ComparisonContent currentDate={currentDate} previousDate={previousDate} />
        </Suspense>
      </Box>
    </DashboardLayout>
  );
}

export default ComparisonPage;
