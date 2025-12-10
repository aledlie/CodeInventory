/**
 * Dashboard Helpers
 *
 * Barrel export for dashboard utility functions and types.
 */

export {
  calculateDashboardMetrics,
  calculateQualityScore,
  calculateHealthStatus,
  isValidQualityReport,
  isValidCoverageReport,
  isValidDependencyReport
} from './calculateMetrics';

export type {
  QualityReport,
  CoverageReport,
  DependencyReport,
  DashboardMetrics,
  HealthStatus
} from './calculateMetrics';

export { logger } from './logger';
