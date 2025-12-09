import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/trends')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/trends' });
  },
});
