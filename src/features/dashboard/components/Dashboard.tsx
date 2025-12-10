/**
 * Main Dashboard Component
 *
 * Integrates all dashboard components to provide a comprehensive view:
 * - DashboardLayout (wraps everything with header + sidebar)
 * - MetricGrid (displays 6 key metrics)
 * - HealthSummary (overall codebase health status)
 *
 * Features:
 * - Suspense integration for data loading (no early returns)
 * - Error boundary compatibility (throws on fetch failures)
 * - Metric calculation from fetched reports
 * - Responsive grid layout with mobile-first design
 *
 * Architecture:
 * - Uses useDashboardData hook (Suspense-enabled)
 * - Calculates metrics from quality, coverage, dependency reports
 * - Provides visual status indicators (success/warning/error)
 * - Displays untested functions, circular dependencies, quality issues
 *
 * @example
 * ```tsx
 * // Wrap in Suspense and ErrorBoundary
 * <ErrorBoundary fallback={<ErrorDisplay />}>
 *   <Suspense fallback={<SuspenseLoader />}>
 *     <Dashboard outputsPath="/path/to/outputs" />
 *   </Suspense>
 * </ErrorBoundary>
 * ```
 */

import { Box } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  BugReport as BugReportIcon,
  Loop as LoopIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';

// Component imports
import { DashboardLayout } from './DashboardLayout';
import { MetricGrid } from './MetricGrid';
import { HealthSummary } from './HealthSummary';

// Hook and helper imports
import { useDashboardData } from '../hooks/useDashboardData';
import { calculateDashboardMetrics } from '../helpers/calculateMetrics';

// Type imports
import type { MetricStatus } from '../types';

/**
 * Dashboard component props
 */
export interface DashboardProps {
  /**
   * Path to the outputs directory containing analysis reports
   * @default '/outputs'
   */
  outputsPath?: string;
}

/**
 * Get metric status based on value and thresholds
 *
 * @param value - Metric value
 * @param type - Type of metric (determines threshold logic)
 * @returns Status variant for MetricCard
 */
function getMetricStatus(value: number, type: 'quality' | 'coverage' | 'issues' | 'circular' | 'untested' | 'files'): MetricStatus {
  switch (type) {
    case 'quality':
      if (value >= 80) return 'success';
      if (value >= 60) return 'warning';
      return 'error';

    case 'coverage':
      if (value >= 80) return 'success';
      if (value >= 60) return 'warning';
      return 'error';

    case 'issues':
      if (value === 0) return 'success';
      if (value <= 5) return 'warning';
      return 'error';

    case 'circular':
      if (value === 0) return 'success';
      if (value <= 3) return 'warning';
      return 'error';

    case 'untested':
      if (value === 0) return 'success';
      if (value <= 10) return 'warning';
      return 'error';

    case 'files':
    default:
      return 'primary';
  }
}

/**
 * Format large numbers with thousands separator
 *
 * @param value - Number to format
 * @returns Formatted string (e.g., 1,234)
 */
function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Main Dashboard Component
 *
 * Displays comprehensive code analysis metrics in a responsive layout.
 * No loading states or early returns - component suspends until data is ready.
 *
 * Data Flow:
 * 1. useDashboardData hook suspends until all reports are loaded
 * 2. calculateDashboardMetrics aggregates data from reports
 * 3. MetricGrid displays 6 key metrics with visual indicators
 * 4. HealthSummary shows overall status with action items
 *
 * Error Handling:
 * - Throws to nearest error boundary on fetch failure
 * - Gracefully handles null reports with default values
 * - Displays 0 values when reports are unavailable
 */
export function Dashboard({ outputsPath = '/data' }: DashboardProps) {
  // Navigation hook for sidebar links
  const navigate = useNavigate();

  // Suspend until data is loaded (no loading state needed)
  const { data: result } = useDashboardData(outputsPath);

  // Extract reports from result (result has .data and .errors)
  const reports = result.data;

  // Calculate aggregated metrics from reports
  const metrics = calculateDashboardMetrics(
    reports.quality,
    reports.coverage,
    reports.dependencies
  );

  // Determine last generated timestamp - using current time since Python reports don't include timestamps
  const lastGenerated = new Date();

  // Configure metric cards for MetricGrid
  const metricCards = [
    {
      icon: <CodeIcon />,
      label: 'Total Files',
      value: formatNumber(metrics.totalFiles),
      unit: 'files',
      status: getMetricStatus(metrics.totalFiles, 'files'),
    },
    {
      icon: <AssessmentIcon />,
      label: 'Quality Score',
      value: metrics.qualityScore.toFixed(1),
      unit: '%',
      status: getMetricStatus(metrics.qualityScore, 'quality'),
      trend: metrics.qualityScore >= 80 ? 'Excellent' : metrics.qualityScore >= 60 ? 'Fair' : 'Needs Improvement',
    },
    {
      icon: <CheckCircleIcon />,
      label: 'Test Coverage',
      value: metrics.coveragePercentage.toFixed(1),
      unit: '%',
      status: getMetricStatus(metrics.coveragePercentage, 'coverage'),
      trend: metrics.coveragePercentage >= 80 ? 'Strong coverage' : metrics.coveragePercentage >= 60 ? 'Moderate coverage' : 'Low coverage',
    },
    {
      icon: <BugReportIcon />,
      label: 'Critical Issues',
      value: formatNumber(metrics.criticalIssues),
      unit: 'issues',
      status: getMetricStatus(metrics.criticalIssues, 'issues'),
      trend: metrics.criticalIssues === 0 ? 'No critical issues' : 'Requires attention',
    },
    {
      icon: <LoopIcon />,
      label: 'Circular Dependencies',
      value: formatNumber(metrics.circularDeps),
      unit: 'cycles',
      status: getMetricStatus(metrics.circularDeps, 'circular'),
      trend: metrics.circularDeps === 0 ? 'Clean architecture' : 'Refactoring needed',
    },
    {
      icon: <WarningIcon />,
      label: 'Untested Functions',
      value: formatNumber(metrics.untestedFunctions),
      unit: 'functions',
      status: getMetricStatus(metrics.untestedFunctions, 'untested'),
      trend: metrics.untestedFunctions === 0 ? 'Fully covered' : 'Add tests',
    },
  ];

  return (
    <DashboardLayout
      lastGenerated={lastGenerated}
      currentPath="/dashboard"
      onNavigate={(path) => navigate({ to: path })}
    >
      {/* Main dashboard content area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          width: '100%',
          maxWidth: '1600px', // Prevent ultra-wide layout on large screens
          margin: '0 auto', // Center content
        }}
      >
        {/* Metric Cards Grid */}
        <MetricGrid metrics={metricCards} />

        {/* Health Summary Card */}
        <HealthSummary metrics={metrics} />
      </Box>
    </DashboardLayout>
  );
};

/**
 * Default export
 */
export default Dashboard;
