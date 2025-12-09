import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded Predictive Dashboard component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 * The PredictiveDashboard component is only loaded when this route is accessed.
 */
const PredictiveDashboard = lazy(() => import('@/features/dashboard/components/PredictiveDashboard'));

/**
 * Predictive Analytics Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/predictions/
 *
 * Features:
 * - Lazy loading with React.lazy and Suspense
 * - SuspenseLoader fallback during code/data loading
 * - Quality forecasting and risk assessment
 * - Phase 4B feature
 */
export const Route = createFileRoute('/dashboard/predictions/')({
  /**
   * Route component with Suspense wrapper
   */
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <PredictiveDashboard />
    </Suspense>
  ),

  /**
   * Loader function for route metadata
   */
  loader: () => ({
    crumb: 'Predictions',
  }),
});
