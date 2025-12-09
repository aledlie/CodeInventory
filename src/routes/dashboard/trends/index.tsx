import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded Trends Page component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 * The TrendsPage component is only loaded when this route is accessed.
 */
const TrendsPage = lazy(() => import('@/features/dashboard/components/TrendsPage'));

/**
 * Trends Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/trends/
 *
 * Features:
 * - Lazy loading with React.lazy and Suspense
 * - SuspenseLoader fallback during code/data loading
 * - Breadcrumb configuration for navigation
 * - Phase 3: Historical trend visualizations
 */
export const Route = createFileRoute('/dashboard/trends/')({
  /**
   * Route component with Suspense wrapper
   */
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <TrendsPage />
    </Suspense>
  ),

  /**
   * Loader function for route metadata
   */
  loader: () => ({
    crumb: 'Trends',
  }),
});
