import { useSuspenseQuery } from '@tanstack/react-query';
import {
  fetchToolsReport,
  fetchToolsStatistics,
  fetchUtilityModule,
  fetchToolCandidate,
  fetchModuleToolCandidates
} from '../api/toolsApi';

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
