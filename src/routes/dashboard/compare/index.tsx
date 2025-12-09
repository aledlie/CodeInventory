/**
 * Historical Comparison Route
 *
 * File-based route for /dashboard/compare
 * Phase 3 feature: Historical metrics comparison
 */

import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SuspenseLoader } from '@/components/SuspenseLoader';

const ComparisonPage = lazy(
  () => import('@/features/dashboard/components/ComparisonPage')
);

export const Route = createFileRoute('/dashboard/compare/')({
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <ComparisonPage />
    </Suspense>
  ),
  loader: () => ({ crumb: 'Historical Comparison' }),
});
