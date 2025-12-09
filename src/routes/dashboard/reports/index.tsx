/**
 * Reports Route
 *
 * File-based route for /dashboard/reports
 * Phase 3 feature: Custom report generation
 */

import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SuspenseLoader } from '@/components/SuspenseLoader';

const ReportsPage = lazy(
  () => import('@/features/dashboard/components/ReportsPage')
);

export const Route = createFileRoute('/dashboard/reports/')({
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <ReportsPage />
    </Suspense>
  ),
  loader: () => ({ crumb: 'Reports' }),
});
