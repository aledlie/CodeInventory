/**
 * Analytics Route Page
 *
 * Phase 5A: Predictive Analytics Dashboard
 *
 * Displays:
 * - Risk heatmap showing high-risk areas
 * - Technical debt burndown chart
 * - Predictive trend cards for key metrics
 * - Actionable insights with impact/effort estimates
 */

import { Suspense, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid2 as Grid,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Warning as RiskIcon,
  Timeline as TrendIcon,
  Lightbulb as InsightIcon,
  AccountBalance as DebtIcon,
} from '@mui/icons-material';
import { createFileRoute } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';

// Components
import { RiskHeatmap } from '../../../features/dashboard/components/analytics/RiskHeatmap';
import { DebtBurndownChart } from '../../../features/dashboard/components/analytics/DebtBurndownChart';
import { PredictiveTrendCard } from '../../../features/dashboard/components/analytics/PredictiveTrendCard';
import { AnalyticsInsightCard } from '../../../features/dashboard/components/analytics/AnalyticsInsightCard';

// Hooks
import {
  useAnalyticsReport,
  useDebtBurndownSummary,
  useAnalyticsSummary,
  useSortedRiskData,
  useFilteredInsights,
  useDismissInsight,
} from '../../../features/dashboard/hooks/useAnalytics';

// Types
import type { RiskData, AnalyticsInsight } from '../../../features/dashboard/types/analytics';

// ============================================================================
// Route Configuration
// ============================================================================

export const Route = createFileRoute('/dashboard/analytics/')({
  component: AnalyticsPage,
});

// ============================================================================
// Page Sections
// ============================================================================

/**
 * Overview metrics summary
 */
function OverviewMetrics() {
  const summary = useAnalyticsSummary();

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {summary.totalRiskItems}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Risk Items
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: summary.criticalRisks > 0 ? 'error.main' : 'success.main',
            }}
          >
            {summary.criticalRisks + summary.highRisks}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            High/Critical Risks
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
            {summary.totalDebtHours}h
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Technical Debt
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
            {summary.activeInsights}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Insights
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

/**
 * Risk heatmap section
 */
function RiskSection() {
  const riskData = useSortedRiskData(10);

  const handleRiskClick = (risk: RiskData) => {
    // Could open a detail dialog or navigate
    console.log('Selected risk:', risk);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <RiskIcon color="error" />
        Risk Overview
      </Typography>
      <RiskHeatmap
        data={riskData}
        onItemClick={handleRiskClick}
        maxItems={10}
        showLegend={true}
        height={400}
      />
    </Box>
  );
}

/**
 * Technical debt section
 */
function DebtSection() {
  const { data: report } = useAnalyticsReport();
  const burndownSummary = useDebtBurndownSummary();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <DebtIcon color="warning" />
        Technical Debt Burndown
      </Typography>
      <DebtBurndownChart
        actualData={report.debtSummary.historical}
        targetData={report.debtSummary.targets}
        timeRange="90d"
        height={350}
        currentDebt={burndownSummary.currentDebt}
        targetDebt={burndownSummary.targetDebt}
        showStatus={true}
      />
    </Box>
  );
}

/**
 * Predictive trends section
 */
function PredictiveTrendsSection() {
  const { data: report } = useAnalyticsReport();
  const { predictions } = report;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendIcon color="primary" />
        Predictive Trends (90-day forecast)
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PredictiveTrendCard
            metric="quality"
            metricLabel="Quality Score"
            currentValue={predictions.quality.current}
            projectedValue={predictions.quality.projected}
            confidence={predictions.quality.confidence}
            confidenceLevel={predictions.quality.confidenceLevel}
            timeframe="90d"
            insight={predictions.quality.insight}
            unit="%"
            increaseIsGood={true}
            goalValue={predictions.quality.goalValue}
            goalDate={predictions.quality.goalDate}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PredictiveTrendCard
            metric="coverage"
            metricLabel="Test Coverage"
            currentValue={predictions.coverage.current}
            projectedValue={predictions.coverage.projected}
            confidence={predictions.coverage.confidence}
            confidenceLevel={predictions.coverage.confidenceLevel}
            timeframe="90d"
            insight={predictions.coverage.insight}
            unit="%"
            increaseIsGood={true}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PredictiveTrendCard
            metric="issues"
            metricLabel="Open Issues"
            currentValue={predictions.issues.current}
            projectedValue={predictions.issues.projected}
            confidence={predictions.issues.confidence}
            confidenceLevel={predictions.issues.confidenceLevel}
            timeframe="90d"
            insight={predictions.issues.insight}
            unit=""
            increaseIsGood={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PredictiveTrendCard
            metric="debt"
            metricLabel="Technical Debt"
            currentValue={predictions.debt.current}
            projectedValue={predictions.debt.projected}
            confidence={predictions.debt.confidence}
            confidenceLevel={predictions.debt.confidenceLevel}
            timeframe="90d"
            insight={predictions.debt.insight}
            unit="h"
            increaseIsGood={false}
            goalValue={predictions.debt.goalValue}
            goalDate={predictions.debt.goalDate}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Actionable insights section
 */
function InsightsSection() {
  const insights = useFilteredInsights();
  const dismissMutation = useDismissInsight();

  const handleDismiss = (insight: AnalyticsInsight) => {
    dismissMutation.mutate(insight.id);
  };

  const handleView = (insight: AnalyticsInsight) => {
    // Could navigate to detail page or open modal
    console.log('View insight:', insight);
  };

  if (insights.length === 0) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InsightIcon color="info" />
          Actionable Insights
        </Typography>
        <Alert severity="success">
          <AlertTitle>No Active Insights</AlertTitle>
          All insights have been addressed. Great job keeping the codebase healthy!
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InsightIcon color="info" />
        Actionable Insights ({insights.length})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {insights.map((insight) => (
          <AnalyticsInsightCard
            key={insight.id}
            id={insight.id}
            priority={insight.priority}
            title={insight.title}
            description={insight.description}
            affectedFiles={insight.affectedFiles}
            impact={insight.impact}
            effort={insight.effort}
            category={insight.category}
            tags={insight.tags}
            onView={() => handleView(insight)}
            onDismiss={() => handleDismiss(insight)}
          />
        ))}
      </Box>
    </Box>
  );
}

// ============================================================================
// Loading States
// ============================================================================

function LoadingSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />

      {/* Overview metrics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{ xs: 6, sm: 3 }} key={i}>
            <Skeleton variant="rectangular" height={80} />
          </Grid>
        ))}
      </Grid>

      {/* Main content */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Skeleton variant="rectangular" height={400} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Skeleton variant="rectangular" height={400} />
        </Grid>
      </Grid>
    </Box>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">
        <AlertTitle>Error Loading Analytics</AlertTitle>
        {error.message}
      </Alert>
    </Box>
  );
}

// ============================================================================
// Main Content
// ============================================================================

function AnalyticsContent() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <AnalyticsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Predictive Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-powered insights and predictions for your codebase
          </Typography>
        </Box>
      </Box>

      {/* Overview Metrics */}
      <Box sx={{ mb: 4 }}>
        <OverviewMetrics />
      </Box>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Analytics sections"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<RiskIcon />} label="Risk Analysis" iconPosition="start" />
          <Tab icon={<DebtIcon />} label="Technical Debt" iconPosition="start" />
          <Tab icon={<TrendIcon />} label="Predictions" iconPosition="start" />
          <Tab icon={<InsightIcon />} label="Insights" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 0 && <RiskSection />}
        {activeTab === 1 && <DebtSection />}
        {activeTab === 2 && <PredictiveTrendsSection />}
        {activeTab === 3 && <InsightsSection />}
      </Box>
    </Box>
  );
}

// ============================================================================
// Page Component
// ============================================================================

function AnalyticsPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </ErrorBoundary>
  );
}

export default AnalyticsPage;
