import { useSuspenseQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import type { LoadReportsResult } from '../types';

/**
 * Main dashboard data hook using Suspense for data fetching
 *
 * This hook automatically suspends rendering until data is available
 * and throws errors to the nearest error boundary.
 *
 * @param outputsPath - Path to the outputs directory containing reports
 * @returns Dashboard data with quality, coverage, and dependency reports
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const { data } = useDashboardData('/path/to/outputs');
 *   return <Dashboard data={data} />;
 * }
 * ```
 */
export const useDashboardData = (outputsPath: string) => {
  return useSuspenseQuery<LoadReportsResult>({
    queryKey: ['dashboard', outputsPath],
    queryFn: () => dashboardApi.loadAllReports(outputsPath),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
  });
};

/**
 * Quality report hook with Suspense
 *
 * Fetches only the quality analysis report.
 *
 * @param outputsPath - Path to the outputs directory
 * @returns Quality report data
 */
export const useQualityReport = (outputsPath: string) => {
  return useSuspenseQuery({
    queryKey: ['quality-report', outputsPath],
    queryFn: () => dashboardApi.loadQualityReport(outputsPath),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Coverage report hook with Suspense
 *
 * Fetches only the test coverage report.
 *
 * @param outputsPath - Path to the outputs directory
 * @returns Coverage report data
 */
export const useCoverageReport = (outputsPath: string) => {
  return useSuspenseQuery({
    queryKey: ['coverage-report', outputsPath],
    queryFn: () => dashboardApi.loadCoverageReport(outputsPath),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Dependency report hook with Suspense
 *
 * Fetches only the dependency analysis report.
 *
 * @param outputsPath - Path to the outputs directory
 * @returns Dependency report data with circular dependency detection
 */
export const useDependencyReport = (outputsPath: string) => {
  return useSuspenseQuery({
    queryKey: ['dependency-report', outputsPath],
    queryFn: () => dashboardApi.loadDependencyReport(outputsPath),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to invalidate all dashboard queries
 *
 * Useful for forcing a refresh after analysis runs complete.
 *
 * @example
 * ```tsx
 * const { refetch } = useDashboardData(path);
 *
 * // Trigger refetch
 * await refetch();
 * ```
 */
export { useQueryClient } from '@tanstack/react-query';
