import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded Dashboard component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 * The Dashboard component is only loaded when this route is accessed.
 */
const Dashboard = lazy(() => import('@/features/dashboard/components/Dashboard'));

/**
 * Dashboard Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/
 *
 * Features:
 * - Lazy loading with React.lazy and Suspense
 * - SuspenseLoader fallback during code/data loading
 * - Breadcrumb configuration for navigation
 * - Type-safe route definition
 *
 * The Dashboard component uses useSuspenseQuery which will suspend
 * rendering until data is available, showing the SuspenseLoader.
 *
 * Error Boundary:
 * Should be added at a higher level (e.g., in the router configuration)
 * to catch errors from this route and show a friendly error page.
 */
export const Route = createFileRoute('/dashboard/')({
  /**
   * Route component with Suspense wrapper
   *
   * The Suspense boundary will show SuspenseLoader during:
   * 1. Initial code loading (lazy import)
   * 2. Data fetching (useSuspenseQuery in Dashboard)
   */
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <Dashboard />
    </Suspense>
  ),

  /**
   * Loader function for route metadata
   *
   * Provides breadcrumb information for navigation.
   * Additional data loading could be added here, but we prefer
   * to use useSuspenseQuery in the component for better integration
   * with React Query's caching and refetching.
   */
  loader: () => ({
    crumb: 'Dashboard',
  }),
});
