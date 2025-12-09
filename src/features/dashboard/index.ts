/**
 * Dashboard Feature Barrel Export
 *
 * Main entry point for the dashboard feature module.
 * Exports all public components, types, utilities, and API services.
 *
 * Usage:
 * ```tsx
 * import { DashboardLayout, Header, Sidebar, MetricCard, dashboardApi } from '@/features/dashboard';
 * ```
 */

// Re-export all dashboard components
export {
  Header,
  Sidebar,
  MobileMenu,
  MobileMenuButton,
  DashboardLayout,
  MetricCard,
} from './components';

// Re-export component types
export type {
  HeaderProps,
  SidebarProps,
  MobileMenuProps,
  MobileMenuButtonProps,
  MobileNavItem,
  NavItem,
  DashboardLayoutProps,
  MetricCardProps,
} from './components';

// Re-export API services
export { dashboardApi } from './api';

// Re-export data types
export type {
  // Python Analyzer Types
  PythonQualityReport,
  PythonQualityIssue,
  PythonCoverageReport,
  PythonFunctionInfo,
  PythonDependencyReport,
  PythonDependencyInfo,
  PythonAnalyzerData,
  // Dashboard Types
  QualityReport,
  QualityIssue,
  CoverageReport,
  FunctionCoverage,
  DependencyReport,
  DependencyInfo,
  DashboardData,
  DashboardMetrics,
  // API Types
  ReportLoadError,
  LoadReportsResult,
  // UI Types
  ActionItem,
  HealthStatus,
  MetricStatus,
  IssueSeverity,
  ChartDataPoint,
  DashboardFilters,
  SortConfig,
  PaginationConfig,
  FileCoverage,
} from './types';
