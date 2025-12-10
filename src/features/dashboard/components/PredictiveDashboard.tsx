/**
 * PredictiveDashboard Component
 *
 * Main page for predictive analytics displaying:
 * - Prediction charts for quality, coverage, issues
 * - Risk assessment matrix
 * - Scenario comparisons
 * - Summary statistics
 */

import { useState, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid2 as Grid,
  Paper,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Skeleton,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  TrendingFlat as TrendFlatIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  DirectionsRun as AcceleratedIcon,
  DirectionsWalk as RelaxedIcon,
} from '@mui/icons-material';
import { PredictionChart, RiskMatrix } from './predictions';
import { usePredictionsReport, useRiskCounts } from '../hooks/usePredictions';
import type { PredictionData, ScenarioResult } from '../types';

/**
 * Props for PredictiveDashboard
 */
export interface PredictiveDashboardProps {
  /** Data path for reports */
  dataPath?: string;
}

/**
 * Prediction metric tabs
 */
type MetricTab = 'quality' | 'coverage' | 'issues';

/**
 * Scenario selection
 */
type ScenarioType = 'current' | 'accelerated' | 'relaxed';

/**
 * Loading skeleton for the dashboard
 */
function DashboardSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton variant="text" width={250} height={48} sx={{ mb: 2 }} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rounded" height={400} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={180} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Skeleton variant="rounded" height={350} />
        </Grid>
      </Grid>
    </Container>
  );
}

/**
 * Summary card component
 */
function SummaryCard({
  title,
  value,
  subtitle,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const TrendIcon = trend === 'up' ? TrendUpIcon : trend === 'down' ? TrendDownIcon : TrendFlatIcon;
  const trendColor = trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" component="div" color={`${color}.main`} fontWeight={700}>
            {value}
          </Typography>
          {trend && <TrendIcon sx={{ color: trendColor }} />}
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Scenario comparison card
 */
function ScenarioCard({
  scenario,
  isSelected,
  onClick,
}: {
  scenario: ScenarioResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const icon =
    scenario.scenario.name === 'Accelerated' ? (
      <AcceleratedIcon />
    ) : scenario.scenario.name === 'Relaxed' ? (
      <RelaxedIcon />
    ) : (
      <SpeedIcon />
    );

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        border: 2,
        borderColor: isSelected ? 'primary.main' : 'transparent',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.light',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {scenario.scenario.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Projected Quality
            </Typography>
            <Typography variant="h6">{scenario.projectedQuality.toFixed(1)}%</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Projected Coverage
            </Typography>
            <Typography variant="h6">{scenario.projectedCoverage.toFixed(1)}%</Typography>
          </Box>
          {scenario.daysTo90Quality && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Days to 90%
              </Typography>
              <Typography variant="h6">{scenario.daysTo90Quality}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * PredictiveDashboard content
 */
function PredictiveDashboardContent({ dataPath = '/data' }: PredictiveDashboardProps) {
  const { data: report } = usePredictionsReport(dataPath);
  const riskCounts = useRiskCounts(dataPath);

  // Local state
  const [metricTab, setMetricTab] = useState<MetricTab>('quality');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('current');

  // Get current prediction based on selected tab
  const currentPrediction: PredictionData | null =
    report
      ? {
          quality: report.qualityPrediction,
          coverage: report.coveragePrediction,
          issues: report.issuesPrediction,
        }[metricTab]
      : null;

  // Get trend direction icon
  const getTrendIcon = () => {
    if (!report) return <TrendFlatIcon />;
    const direction = report.summary.trendDirection;
    if (direction === 'improving') return <TrendUpIcon sx={{ color: 'success.main' }} />;
    if (direction === 'declining') return <TrendDownIcon sx={{ color: 'error.main' }} />;
    return <TrendFlatIcon sx={{ color: 'text.secondary' }} />;
  };

  // No report available
  if (!report) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          <AlertTitle>No Predictions Available</AlertTitle>
          Run the analysis pipeline with predictions enabled to generate forecasts about your codebase.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Predictive Analytics
          </Typography>
          <Chip
            icon={getTrendIcon()}
            label={report.summary.trendDirection}
            color={
              report.summary.trendDirection === 'improving'
                ? 'success'
                : report.summary.trendDirection === 'declining'
                ? 'error'
                : 'default'
            }
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          Forecast quality trends and identify risks before they become problems.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Total Risks"
            value={riskCounts.total}
            subtitle={`${riskCounts.critical} critical`}
            color={riskCounts.critical > 0 ? 'error' : 'primary'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="High Risks"
            value={riskCounts.high}
            color={riskCounts.high > 2 ? 'warning' : 'success'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Avg Confidence"
            value={`${report.summary.averageConfidence}%`}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Trend"
            value={report.summary.trendDirection}
            trend={
              report.summary.trendDirection === 'improving'
                ? 'up'
                : report.summary.trendDirection === 'declining'
                ? 'down'
                : 'stable'
            }
            color={
              report.summary.trendDirection === 'improving'
                ? 'success'
                : report.summary.trendDirection === 'declining'
                ? 'error'
                : 'primary'
            }
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Prediction Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Tabs
                value={metricTab}
                onChange={(_, value) => setMetricTab(value)}
                aria-label="Prediction metrics"
              >
                <Tab
                  value="quality"
                  label="Quality Score"
                  icon={<TimelineIcon />}
                  iconPosition="start"
                />
                <Tab
                  value="coverage"
                  label="Test Coverage"
                  icon={<TimelineIcon />}
                  iconPosition="start"
                />
                <Tab
                  value="issues"
                  label="Issue Count"
                  icon={<TimelineIcon />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            <PredictionChart
              data={currentPrediction}
              height={350}
              showLegend
            />
          </Paper>
        </Grid>

        {/* Scenario Selection */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Scenario Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              See how different approaches affect your projections.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ScenarioCard
                scenario={report.scenarios.current}
                isSelected={selectedScenario === 'current'}
                onClick={() => setSelectedScenario('current')}
              />
              <ScenarioCard
                scenario={report.scenarios.accelerated}
                isSelected={selectedScenario === 'accelerated'}
                onClick={() => setSelectedScenario('accelerated')}
              />
              <ScenarioCard
                scenario={report.scenarios.relaxed}
                isSelected={selectedScenario === 'relaxed'}
                onClick={() => setSelectedScenario('relaxed')}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Risk Matrix */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6">Risk Assessment Matrix</Typography>
              <Chip label={`${report.risks.length} risks`} size="small" sx={{ ml: 'auto' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click any risk bubble for details and mitigation strategies.
            </Typography>
            <RiskMatrix risks={report.risks} height={400} showLabels />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

/**
 * PredictiveDashboard with Suspense boundary
 */
export function PredictiveDashboard(props: PredictiveDashboardProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PredictiveDashboardContent {...props} />
    </Suspense>
  );
}

export default PredictiveDashboard;
