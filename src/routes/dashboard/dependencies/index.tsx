import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded Dependencies Page component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 * The DependenciesPage component is only loaded when this route is accessed.
 */
const DependenciesPage = lazy(() => import('@/features/dashboard/components/DependenciesPage'));

/**
 * Dependencies Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/dependencies/
 *
 * Features:
 * - Lazy loading with React.lazy and Suspense
 * - SuspenseLoader fallback during code/data loading
 * - Breadcrumb configuration for navigation
 * - Type-safe route definition
 */
export const Route = createFileRoute('/dashboard/dependencies/')({
  /**
   * Route component with Suspense wrapper
   */
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <DependenciesPage />
    </Suspense>
  ),

  /**
   * Loader function for route metadata
   */
  loader: () => ({
    crumb: 'Dependencies',
  }),
});
