/**
 * Usage Example: Dashboard Metrics Calculator Integration
 *
 * This example demonstrates how to use the metrics calculator
 * with React components for a complete dashboard implementation.
 */

import React, { useEffect, useState } from 'react';
import {
  calculateDashboardMetrics,
  calculateHealthStatus,
  type DashboardMetrics,
  type HealthStatus,
  type QualityReport,
  type CoverageReport,
  type DependencyReport
} from './index';

/**
 * Custom hook for loading and calculating dashboard metrics
 */
function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [status, setStatus] = useState<HealthStatus>('warning');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);

        // Load all reports in parallel (gracefully handle failures)
        const [quality, coverage, dependencies] = await Promise.allSettled([
          fetch('/api/reports/quality').then(r => r.json()),
          fetch('/api/reports/coverage').then(r => r.json()),
          fetch('/api/reports/dependencies').then(r => r.json())
        ]);

        // Extract values or null if failed
        const qualityData = quality.status === 'fulfilled' ? quality.value : null;
        const coverageData = coverage.status === 'fulfilled' ? coverage.value : null;
        const dependenciesData = dependencies.status === 'fulfilled' ? dependencies.value : null;

        // Calculate metrics (handles null inputs gracefully)
        const calculatedMetrics = calculateDashboardMetrics(
          qualityData as QualityReport | null,
          coverageData as CoverageReport | null,
          dependenciesData as DependencyReport | null
        );

        setMetrics(calculatedMetrics);
        setStatus(calculateHealthStatus(calculatedMetrics));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');

        // Set default metrics on error
        const fallbackMetrics = calculateDashboardMetrics(null, null, null);
        setMetrics(fallbackMetrics);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  return { metrics, status, loading, error };
}

/**
 * Dashboard component using the metrics calculator
 */
export function DashboardExample() {
  const { metrics, status, loading, error } = useDashboardMetrics();

  if (loading) {
    return <div>Loading dashboard metrics...</div>;
  }

  if (error) {
    return <div>Error loading metrics: {error}</div>;
  }

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  return (
    <div className="dashboard">
      <h1>Code Inventory Dashboard</h1>

      {/* Overall Health Status */}
      <div className={`health-status status-${status}`}>
        <h2>Overall Health: {status.toUpperCase()}</h2>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {/* Total Files */}
        <MetricCard
          title="Total Files"
          value={metrics.totalFiles}
          icon="📁"
          status={status}
        />

        {/* Quality Score */}
        <MetricCard
          title="Quality Score"
          value={`${metrics.qualityScore}/100`}
          icon="⭐"
          status={metrics.qualityScore >= 75 ? 'success' : metrics.qualityScore >= 50 ? 'warning' : 'error'}
          description="Based on code quality issues"
        />

        {/* Test Coverage */}
        <MetricCard
          title="Test Coverage"
          value={`${metrics.coveragePercentage.toFixed(1)}%`}
          icon="🧪"
          status={metrics.coveragePercentage >= 60 ? 'success' : metrics.coveragePercentage >= 30 ? 'warning' : 'error'}
          description={`${metrics.untestedFunctions} untested functions`}
        />

        {/* Critical Issues */}
        <MetricCard
          title="Critical Issues"
          value={metrics.criticalIssues}
          icon="🔴"
          status={metrics.criticalIssues === 0 ? 'success' : 'error'}
          highlight={metrics.criticalIssues > 0}
        />

        {/* Circular Dependencies */}
        <MetricCard
          title="Circular Dependencies"
          value={metrics.circularDeps}
          icon="🔄"
          status={metrics.circularDeps === 0 ? 'success' : 'warning'}
        />

        {/* Untested Functions */}
        <MetricCard
          title="Untested Functions"
          value={metrics.untestedFunctions}
          icon="❓"
          status={metrics.untestedFunctions === 0 ? 'success' : 'warning'}
        />
      </div>
    </div>
  );
}

/**
 * Individual metric card component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: string;
  status?: HealthStatus;
  description?: string;
  highlight?: boolean;
}

function MetricCard({
  title,
  value,
  icon,
  status = 'success',
  description,
  highlight = false
}: MetricCardProps) {
  return (
    <div className={`metric-card status-${status} ${highlight ? 'highlight' : ''}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3 className="metric-title">{title}</h3>
        <div className="metric-value">{value}</div>
        {description && <p className="metric-description">{description}</p>}
      </div>
    </div>
  );
}

/**
 * Example: Loading metrics from local files
 */
async function loadLocalReports() {
  const fs = await import('fs/promises');
  const path = await import('path');

  const outputsDir = path.join(process.cwd(), 'outputs');

  // Load latest reports
  const quality = await fs.readFile(
    path.join(outputsDir, 'quality/quality_report.json'),
    'utf-8'
  ).then(JSON.parse).catch(() => null);

  const coverage = await fs.readFile(
    path.join(outputsDir, 'coverage/coverage_report.json'),
    'utf-8'
  ).then(JSON.parse).catch(() => null);

  const dependencies = await fs.readFile(
    path.join(outputsDir, 'dependencies/dependency_report.json'),
    'utf-8'
  ).then(JSON.parse).catch(() => null);

  return { quality, coverage, dependencies };
}

/**
 * Example: Server-side metrics calculation (Next.js)
 */
export async function getServerSideProps() {
  const { quality, coverage, dependencies } = await loadLocalReports();

  const metrics = calculateDashboardMetrics(
    quality as QualityReport | null,
    coverage as CoverageReport | null,
    dependencies as DependencyReport | null
  );

  const status = calculateHealthStatus(metrics);

  return {
    props: {
      metrics,
      status
    }
  };
}

/**
 * Example: Static site generation (Next.js)
 */
export async function getStaticProps() {
  const { quality, coverage, dependencies } = await loadLocalReports();

  const metrics = calculateDashboardMetrics(
    quality as QualityReport | null,
    coverage as CoverageReport | null,
    dependencies as DependencyReport | null
  );

  const status = calculateHealthStatus(metrics);

  return {
    props: {
      metrics,
      status
    },
    revalidate: 3600 // Regenerate every hour
  };
}

/**
 * Example: Real-time metrics with WebSocket
 */
function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [status, setStatus] = useState<HealthStatus>('warning');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/metrics');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      const calculatedMetrics = calculateDashboardMetrics(
        data.quality,
        data.coverage,
        data.dependencies
      );

      setMetrics(calculatedMetrics);
      setStatus(calculateHealthStatus(calculatedMetrics));
    };

    return () => ws.close();
  }, []);

  return { metrics, status };
}
