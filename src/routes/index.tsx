import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Index Route - Redirects to Dashboard
 *
 * The root path (/) redirects to /dashboard which is the main
 * application entry point.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/dashboard',
    });
  },
});
