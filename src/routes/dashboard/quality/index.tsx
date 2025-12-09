import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded Code Quality Page component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 * The CodeQualityPage component is only loaded when this route is accessed.
 */
const CodeQualityPage = lazy(() => import('@/features/dashboard/components/CodeQualityPage'));

/**
 * Code Quality Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/quality/
 *
 * Features:
 * - Lazy loading with React.lazy and Suspense
 * - SuspenseLoader fallback during code/data loading
 * - Breadcrumb configuration for navigation
 * - Type-safe route definition
 */
export const Route = createFileRoute('/dashboard/quality/')({
  /**
   * Route component with Suspense wrapper
   */
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <CodeQualityPage />
    </Suspense>
  ),

  /**
   * Loader function for route metadata
   */
  loader: () => ({
    crumb: 'Code Quality',
  }),
});
