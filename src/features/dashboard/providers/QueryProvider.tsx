import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Query client configuration for dashboard data fetching
 *
 * Default options:
 * - staleTime: 5 minutes - How long data is considered fresh
 * - gcTime: 10 minutes - How long unused data stays in cache
 * - retry: 1 - Only retry failed requests once
 * - refetchOnWindowFocus: false - Don't refetch when window regains focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't auto-refetch on window focus
      refetchOnReconnect: true, // Refetch when network reconnects
      suspense: false, // Individual hooks opt into Suspense via useSuspenseQuery
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
  /**
   * Show React Query DevTools in development
   * @default true in development, false in production
   */
  showDevTools?: boolean;
}

/**
 * Query provider wrapper for the dashboard application
 *
 * Provides TanStack Query context to all child components.
 * Includes React Query DevTools in development mode.
 *
 * @example
 * ```tsx
 * import { QueryProvider } from './providers/QueryProvider';
 *
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <Dashboard />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  showDevTools = import.meta.env.DEV,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevTools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

/**
 * Hook to access the query client directly
 *
 * Useful for manual cache invalidation or prefetching.
 *
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query';
 *
 * function RefreshButton() {
 *   const queryClient = useQueryClient();
 *
 *   const handleRefresh = () => {
 *     queryClient.invalidateQueries({ queryKey: ['dashboard'] });
 *   };
 *
 *   return <button onClick={handleRefresh}>Refresh</button>;
 * }
 * ```
 */
export { useQueryClient } from '@tanstack/react-query';
