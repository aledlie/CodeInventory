/**
 * Dependency Graph Route
 *
 * File-based route for /dashboard/graph
 * Phase 3 feature: Interactive dependency visualization
 */

import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SuspenseLoader } from '@/components/SuspenseLoader';

const DependencyGraphPage = lazy(
  () => import('@/features/dashboard/components/DependencyGraphPage')
);

export const Route = createFileRoute('/dashboard/graph/')({
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <DependencyGraphPage />
    </Suspense>
  ),
  loader: () => ({ crumb: 'Dependency Graph' }),
});
