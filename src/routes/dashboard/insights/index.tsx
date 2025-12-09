import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded AI Insights Page component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 * The InsightsPage component is only loaded when this route is accessed.
 */
const InsightsPage = lazy(() => import('@/features/dashboard/components/InsightsPage'));

/**
 * AI Insights Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/insights/
 *
 * Features:
 * - Lazy loading with React.lazy and Suspense
 * - SuspenseLoader fallback during code/data loading
 * - AI-powered insights and recommendations
 * - Phase 4A feature
 */
export const Route = createFileRoute('/dashboard/insights/')({
  /**
   * Route component with Suspense wrapper
   */
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <InsightsPage />
    </Suspense>
  ),

  /**
   * Loader function for route metadata
   */
  loader: () => ({
    crumb: 'AI Insights',
  }),
});
