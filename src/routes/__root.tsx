import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Root Route Configuration
 *
 * The root route is the top-level route that wraps all other routes.
 * It provides:
 * - Error boundary for catching errors in child routes
 * - Outlet for rendering child routes
 * - Optional global providers or layout
 *
 * Child routes are rendered via the <Outlet /> component.
 */
export const Route = createRootRoute({
  /**
   * Root component with error boundary
   *
   * Wraps all routes with ErrorBoundary to catch and display
   * errors in a user-friendly way.
   */
  component: () => (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  ),
});
