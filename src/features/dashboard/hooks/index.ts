/**
 * Dashboard data fetching hooks
 *
 * All hooks use @tanstack/react-query with Suspense mode for declarative loading states.
 * Wrap components using these hooks with React Suspense and Error Boundaries.
 *
 * @example
 * ```tsx
 * import { Suspense } from 'react';
 * import { ErrorBoundary } from 'react-error-boundary';
 * import { useDashboardData } from './hooks';
 *
 * function DashboardPage() {
 *   return (
 *     <ErrorBoundary fallback={<ErrorView />}>
 *       <Suspense fallback={<LoadingSpinner />}>
 *         <DashboardContent />
 *       </Suspense>
 *     </ErrorBoundary>
 *   );
 * }
 *
 * function DashboardContent() {
 *   const { data } = useDashboardData('/path/to/outputs');
 *   return <Dashboard data={data} />;
 * }
 * ```
 */

export {
  useDashboardData,
  useQualityReport,
  useCoverageReport,
  useDependencyReport,
  useQueryClient,
} from './useDashboardData';

export { useChartTheme, useChartOptions, useSeverityColors } from './useChartTheme';
