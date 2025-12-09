/**
 * Dashboard Components Barrel Export
 *
 * Centralized export point for all dashboard components.
 * This allows clean imports like:
 * import { Header, Sidebar, DashboardLayout, MetricCard, MetricGrid, Dashboard } from '@/features/dashboard/components';
 */

// Header component
export { Header, type HeaderProps } from './Header';

// Navigation components
export { Sidebar, MobileMenuButton } from './Sidebar';
export type { SidebarProps, MobileMenuButtonProps, NavItem } from './Sidebar';

export { MobileMenu } from './MobileMenu';
export type { MobileMenuProps, MobileNavItem } from './MobileMenu';

// Layout component
export { DashboardLayout, type DashboardLayoutProps } from './DashboardLayout';

// Metric display components
export { MetricCard, type MetricCardProps } from './MetricCard';
export { MetricGrid, type MetricGridProps } from './MetricGrid';

// Health summary component
export { HealthSummary, type HealthSummaryProps, type ActionItem } from './HealthSummary';

// Main Dashboard component (integrates all components above)
export { Dashboard, type DashboardProps } from './Dashboard';

// Detail page components (Phase 2)
export { CodeQualityPage } from './CodeQualityPage';
export { TestCoveragePage } from './TestCoveragePage';
export { DependenciesPage } from './DependenciesPage';

// Phase 3 components
export { TrendsPage } from './TrendsPage';
export { DependencyGraphPage } from './DependencyGraphPage';
export { ComparisonPage } from './ComparisonPage';
export { ReportsPage } from './ReportsPage';

// Phase 4A: AI Insights components
export { InsightsPage, type InsightsPageProps } from './InsightsPage';
export * from './insights';

// Phase 4B: Predictive Analytics components
export { PredictiveDashboard, type PredictiveDashboardProps } from './PredictiveDashboard';
export * from './predictions';

// Phase 4C: Custom Visualization Builder components
export * from './visualizations';

// Phase 4D: Team Collaboration Hub components
export * from './collaboration';

// Phase 4E: Smart Notifications components
export * from './notifications';
