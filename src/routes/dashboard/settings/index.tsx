import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { SuspenseLoader } from '@/components/SuspenseLoader';

/**
 * Lazy-loaded Settings Page component
 *
 * Uses React.lazy for code splitting to reduce initial bundle size.
 */
const SettingsPage = lazy(
  () => import('@/features/dashboard/components/SettingsPage')
);

/**
 * Dashboard Settings Route Configuration
 *
 * File-based routing for TanStack Router.
 * Route: /dashboard/settings/
 *
 * Features:
 * - Dashboard personalization settings
 * - Widget library management
 * - Saved views management
 * - Notification preferences
 */
export const Route = createFileRoute('/dashboard/settings/')({
  component: () => (
    <Suspense fallback={<SuspenseLoader />}>
      <SettingsPage />
    </Suspense>
  ),
  loader: () => ({
    crumb: 'Settings',
  }),
});
