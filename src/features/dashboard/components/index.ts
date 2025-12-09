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
