/**
 * Dashboard Metrics Calculator
 *
 * Calculates aggregated metrics from analysis reports for dashboard visualization.
 * Handles missing or corrupted data gracefully with sensible defaults.
 */

/**
 * Quality report structure from code quality analyzer
 */
export interface QualityReport {
  timestamp: string;
  total_issues: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issues: Array<{
    file: string;
    line: number;
    severity: string;
    message: string;
  }>;
}

/**
 * Coverage report structure from test coverage analyzer
 */
export interface CoverageReport {
  timestamp: string;
  coverage_percentage: number;
  total_functions: number;
  tested_functions: number;
  untested_functions: number;
}

/**
 * Dependency report structure from dependency analyzer
 */
export interface DependencyReport {
  timestamp: string;
  total_files: number;
  circular_dependencies: string[][];
}

/**
 * Aggregated metrics for dashboard display
 */
export interface DashboardMetrics {
  totalFiles: number;
  qualityScore: number;
  coveragePercentage: number;
  criticalIssues: number;
  circularDeps: number;
  untestedFunctions: number;
}

/**
 * Health status indicators for dashboard
 */
export type HealthStatus = 'error' | 'warning' | 'success';

/**
 * Calculate overall quality score from quality report
 *
 * Score calculation:
 * - Base score: 100
 * - Critical issues: -10 points each
 * - High severity: -5 points each
 * - Medium severity: -2 points each
 * - Low severity: -1 point each
 * - Minimum score: 0
 *
 * @param report - Quality report from code quality analyzer
 * @returns Quality score between 0-100
 */
export function calculateQualityScore(report: QualityReport | null): number {
  if (!report || !report.by_severity) {
    return 0;
  }

  const { critical = 0, high = 0, medium = 0, low = 0 } = report.by_severity;

  const score = 100
    - (critical * 10)
    - (high * 5)
    - (medium * 2)
    - (low * 1);

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate health status based on dashboard metrics
 *
 * Status determination:
 * - Error: Critical issues > 0 OR quality score < 50 OR coverage < 30%
 * - Warning: Quality score < 75 OR coverage < 60% OR circular deps > 0
 * - Success: All metrics in healthy range
 *
 * @param metrics - Aggregated dashboard metrics
 * @returns Health status indicator
 */
export function calculateHealthStatus(metrics: DashboardMetrics): HealthStatus {
  // Critical conditions - immediate error status
  if (
    metrics.criticalIssues > 0 ||
    metrics.qualityScore < 50 ||
    metrics.coveragePercentage < 30
  ) {
    return 'error';
  }

  // Warning conditions - needs attention
  if (
    metrics.qualityScore < 75 ||
    metrics.coveragePercentage < 60 ||
    metrics.circularDeps > 0
  ) {
    return 'warning';
  }

  // All metrics in healthy range
  return 'success';
}

/**
 * Calculate aggregated metrics from all analysis reports
 *
 * Handles null/undefined reports gracefully with default values:
 * - Missing quality report: 0 score, 0 critical issues
 * - Missing coverage report: 0% coverage, 0 untested functions
 * - Missing dependency report: 0 files, 0 circular dependencies
 *
 * @param quality - Quality report (may be null)
 * @param coverage - Coverage report (may be null)
 * @param dependencies - Dependency report (may be null)
 * @returns Aggregated metrics for dashboard
 */
export function calculateDashboardMetrics(
  quality: QualityReport | null,
  coverage: CoverageReport | null,
  dependencies: DependencyReport | null
): DashboardMetrics {
  // Extract total files from dependency report (most reliable source)
  const totalFiles = dependencies?.total_files ?? 0;

  // Calculate quality score
  const qualityScore = calculateQualityScore(quality);

  // Extract coverage percentage
  const coveragePercentage = coverage?.coverage_percentage ?? 0;

  // Extract critical issues count
  const criticalIssues = quality?.by_severity?.critical ?? 0;

  // Extract circular dependencies count
  const circularDeps = dependencies?.circular_dependencies?.length ?? 0;

  // Extract untested functions count
  const untestedFunctions = coverage?.untested_functions ?? 0;

  return {
    totalFiles,
    qualityScore,
    coveragePercentage,
    criticalIssues,
    circularDeps,
    untestedFunctions
  };
}

/**
 * Validate that a quality report has the expected structure
 *
 * @param report - Report to validate
 * @returns True if report has valid structure
 */
export function isValidQualityReport(report: unknown): report is QualityReport {
  if (!report || typeof report !== 'object') {
    return false;
  }

  const r = report as Partial<QualityReport>;

  return !!(
    r.timestamp &&
    typeof r.total_issues === 'number' &&
    r.by_severity &&
    typeof r.by_severity === 'object' &&
    Array.isArray(r.issues)
  );
}

/**
 * Validate that a coverage report has the expected structure
 *
 * @param report - Report to validate
 * @returns True if report has valid structure
 */
export function isValidCoverageReport(report: unknown): report is CoverageReport {
  if (!report || typeof report !== 'object') {
    return false;
  }

  const r = report as Partial<CoverageReport>;

  return !!(
    r.timestamp &&
    typeof r.coverage_percentage === 'number' &&
    typeof r.total_functions === 'number' &&
    typeof r.tested_functions === 'number' &&
    typeof r.untested_functions === 'number'
  );
}

/**
 * Validate that a dependency report has the expected structure
 *
 * @param report - Report to validate
 * @returns True if report has valid structure
 */
export function isValidDependencyReport(report: unknown): report is DependencyReport {
  if (!report || typeof report !== 'object') {
    return false;
  }

  const r = report as Partial<DependencyReport>;

  return !!(
    r.timestamp &&
    typeof r.total_files === 'number' &&
    Array.isArray(r.circular_dependencies)
  );
}
