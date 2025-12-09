import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/graph')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/graph' });
  },
});
