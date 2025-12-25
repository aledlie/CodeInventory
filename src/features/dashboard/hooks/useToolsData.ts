import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import {
  fetchToolsReport,
  fetchToolsStatistics,
  fetchUtilityModule,
  fetchToolCandidate,
  fetchModuleToolCandidates,
  fetchPreprocessedToolsReport,
  fetchDashboardData,
  fetchChartData,
  searchToolCandidates,
  filterByModularity,
  filterByType,
  filterByPattern,
  fetchPaginatedCandidates,
  fetchAvailablePatterns,
  fetchPreprocessedStatistics,
} from '../api/toolsApi';
import type { ModularityScore, DashboardData } from '../types/tools';

/**
 * Fetch complete tools report
 */
export function useToolsReport() {
  return useSuspenseQuery({
    queryKey: ['toolsReport'],
    queryFn: fetchToolsReport,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch tools statistics for overview page
 */
export function useToolsStatistics() {
  return useSuspenseQuery({
    queryKey: ['toolsStatistics'],
    queryFn: fetchToolsStatistics,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a specific utility module by file path
 */
export function useUtilityModule(filePath: string) {
  return useSuspenseQuery({
    queryKey: ['utilityModule', filePath],
    queryFn: () => fetchUtilityModule(filePath),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a specific tool candidate by name
 */
export function useToolCandidate(name: string) {
  return useSuspenseQuery({
    queryKey: ['toolCandidate', name],
    queryFn: () => fetchToolCandidate(name),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch tool candidates for a specific module
 */
export function useModuleToolCandidates(modulePath: string) {
  return useSuspenseQuery({
    queryKey: ['moduleToolCandidates', modulePath],
    queryFn: () => fetchModuleToolCandidates(modulePath),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Preprocessed Data Hooks
// ============================================================================

/**
 * Fetch preprocessed tools report with dashboard data
 */
export function usePreprocessedToolsReport() {
  return useSuspenseQuery({
    queryKey: ['preprocessedToolsReport'],
    queryFn: fetchPreprocessedToolsReport,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch dashboard optimization data (indexes, charts, pagination)
 */
export function useDashboardData() {
  return useSuspenseQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch pre-computed chart data by name
 */
export function useChartData(chartName: keyof DashboardData['charts']) {
  return useSuspenseQuery({
    queryKey: ['chartData', chartName],
    queryFn: () => fetchChartData(chartName),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Search tool candidates using pre-built search index
 */
export function useSearchCandidates(query: string) {
  return useQuery({
    queryKey: ['searchCandidates', query],
    queryFn: () => searchToolCandidates(query),
    staleTime: 5 * 60 * 1000,
    enabled: query.length > 0,
  });
}

/**
 * Filter candidates by modularity score
 */
export function useFilterByModularity(modularity: ModularityScore | ModularityScore[]) {
  return useSuspenseQuery({
    queryKey: ['filterByModularity', modularity],
    queryFn: () => filterByModularity(modularity),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Filter candidates by type
 */
export function useFilterByType(type: 'function' | 'class' | 'module') {
  return useSuspenseQuery({
    queryKey: ['filterByType', type],
    queryFn: () => filterByType(type),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Filter candidates by detected pattern
 */
export function useFilterByPattern(pattern: string) {
  return useSuspenseQuery({
    queryKey: ['filterByPattern', pattern],
    queryFn: () => filterByPattern(pattern),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Paginated tool candidates
 */
export function usePaginatedCandidates(page: number, pageSize?: number) {
  return useSuspenseQuery({
    queryKey: ['paginatedCandidates', page, pageSize],
    queryFn: () => fetchPaginatedCandidates(page, pageSize),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get available patterns for filtering
 */
export function useAvailablePatterns() {
  return useSuspenseQuery({
    queryKey: ['availablePatterns'],
    queryFn: fetchAvailablePatterns,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get preprocessed statistics with pre-computed distributions
 */
export function usePreprocessedStatistics() {
  return useSuspenseQuery({
    queryKey: ['preprocessedStatistics'],
    queryFn: fetchPreprocessedStatistics,
    staleTime: 5 * 60 * 1000,
  });
}
