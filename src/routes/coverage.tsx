import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/coverage')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/coverage' });
  },
});
