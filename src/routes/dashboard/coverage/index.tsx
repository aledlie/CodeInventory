import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded Test Coverage Page component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 * The TestCoveragePage component is only loaded when this route is accessed.
 */
const TestCoveragePage = lazy(() => import('@/features/dashboard/components/TestCoveragePage'));

/**
 * Test Coverage Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/coverage/
 *
 * Features:
 * - Lazy loading with React.lazy and Suspense
 * - SuspenseLoader fallback during code/data loading
 * - Breadcrumb configuration for navigation
 * - Type-safe route definition
 */
export const Route = createFileRoute('/dashboard/coverage/')({
  /**
   * Route component with Suspense wrapper
   */
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <TestCoveragePage />
    </Suspense>
  ),

  /**
   * Loader function for route metadata
   */
  loader: () => ({
    crumb: 'Test Coverage',
  }),
});
