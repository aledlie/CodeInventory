/**
 * Example usage of TanStack Query hooks with Suspense
 *
 * This file demonstrates the recommended patterns for using dashboard hooks
 * with React Suspense and Error Boundaries.
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryProvider, useQueryClient } from '../providers';
import {
  useDashboardData,
  useQualityReport,
  useCoverageReport,
  useDependencyReport,
} from '../hooks';
import type { DashboardData } from '../types/dashboard';

// ============================================================================
// Example 1: Basic Usage with Full Dashboard Data
// ============================================================================

function DashboardApp() {
  return (
    <QueryProvider>
      <ErrorBoundary fallback={<DashboardError />}>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </ErrorBoundary>
    </QueryProvider>
  );
}

function DashboardContent() {
  // No loading state needed - Suspense handles it
  // No error handling needed - Error boundary handles it
  const { data } = useDashboardData('/path/to/outputs');

  return (
    <div>
      <h1>Code Inventory Dashboard</h1>
      <MetricsOverview data={data} />
      <QualitySection quality={data.quality} />
      <CoverageSection coverage={data.coverage} />
      <DependencySection dependencies={data.dependencies} />
    </div>
  );
}

// ============================================================================
// Example 2: Individual Report Hooks
// ============================================================================

function QualityDashboard() {
  const { data: qualityData } = useQualityReport('/path/to/outputs');

  return (
    <div>
      <h2>Code Quality Analysis</h2>
      <p>Total Issues: {qualityData.summary.total_issues}</p>
      <p>Critical: {qualityData.summary.by_severity.critical}</p>
      <p>High: {qualityData.summary.by_severity.high}</p>
    </div>
  );
}

function CoverageDashboard() {
  const { data: coverageData } = useCoverageReport('/path/to/outputs');

  return (
    <div>
      <h2>Test Coverage</h2>
      <p>Coverage: {coverageData.summary.coverage_percentage.toFixed(1)}%</p>
      <p>Tested: {coverageData.summary.tested_functions}</p>
      <p>Untested: {coverageData.summary.untested_functions}</p>
    </div>
  );
}

function DependencyDashboard() {
  const { data: dependencyData } = useDependencyReport('/path/to/outputs');

  return (
    <div>
      <h2>Dependencies</h2>
      <p>Total Files: {dependencyData.summary.total_files}</p>
      <p>Circular Dependencies: {dependencyData.summary.circular_dependencies}</p>
    </div>
  );
}

// ============================================================================
// Example 3: Manual Cache Invalidation
// ============================================================================

function RefreshButton() {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    // Invalidate all dashboard queries
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    // Or invalidate specific queries
    // await queryClient.invalidateQueries({ queryKey: ['quality-report'] });
  };

  return (
    <button onClick={handleRefresh}>
      Refresh Dashboard
    </button>
  );
}

// ============================================================================
// Example 4: Prefetching Data
// ============================================================================

function DashboardWithPrefetch() {
  const queryClient = useQueryClient();
  const outputsPath = '/path/to/outputs';

  // Prefetch data on hover for better UX
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['quality-report', outputsPath],
      queryFn: () => dashboardApi.loadQualityReport(outputsPath),
    });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      <Suspense fallback={<LoadingSpinner />}>
        <QualityDashboard />
      </Suspense>
    </div>
  );
}

// ============================================================================
// Example 5: Error Recovery
// ============================================================================

function DashboardWithErrorRecovery() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <h2>Failed to load dashboard</h2>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try Again</button>
        </div>
      )}
      onReset={() => {
        // Optional: Invalidate queries on reset
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }}
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Example 6: Nested Suspense Boundaries
// ============================================================================

function DashboardWithNestedSuspense() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Each section can have its own loading state */}
      <Suspense fallback={<SectionSkeleton />}>
        <QualitySection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CoverageSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <DependencySection />
      </Suspense>
    </div>
  );
}

function QualitySection() {
  const { data } = useQualityReport('/path/to/outputs');
  return <div>{/* Render quality data */}</div>;
}

function CoverageSection() {
  const { data } = useCoverageReport('/path/to/outputs');
  return <div>{/* Render coverage data */}</div>;
}

function DependencySection() {
  const { data } = useDependencyReport('/path/to/outputs');
  return <div>{/* Render dependency data */}</div>;
}

// ============================================================================
// Loading and Error Components
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded"></div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function DashboardError() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <h2 className="text-red-800 text-xl font-semibold mb-2">
        Failed to Load Dashboard
      </h2>
      <p className="text-red-600">
        Unable to load dashboard data. Please check that the outputs directory exists
        and contains valid report files.
      </p>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface MetricsOverviewProps {
  data: DashboardData;
}

function MetricsOverview({ data }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="Code Quality"
        value={data.quality.summary.total_issues}
        label="Total Issues"
      />
      <MetricCard
        title="Test Coverage"
        value={`${data.coverage.summary.coverage_percentage.toFixed(1)}%`}
        label="Coverage"
      />
      <MetricCard
        title="Dependencies"
        value={data.dependencies.summary.circular_dependencies}
        label="Circular"
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  label: string;
}

function MetricCard({ title, value, label }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export {
  DashboardApp,
  DashboardWithErrorRecovery,
  DashboardWithNestedSuspense,
  RefreshButton,
};
