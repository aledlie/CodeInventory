/**
 * Phase 4A: AI Insights Hooks
 *
 * React Query hooks for fetching and managing AI-generated insights.
 * Uses Suspense for data fetching with proper caching.
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightsApi } from '../api/insightsApi';
import type {
  InsightsReport,
  AIInsight,
  InsightsSummary,
  InsightType,
  InsightsFilters,
} from '../types';

/**
 * Default data path for reports
 */
const DEFAULT_DATA_PATH = '/data';

/**
 * Hook to fetch the full insights report with Suspense
 *
 * @param dataPath - Path to data directory
 * @returns Insights report data
 *
 * @example
 * ```tsx
 * function InsightsPage() {
 *   const { data: report } = useInsightsReport();
 *   return <InsightsList insights={report.insights} />;
 * }
 * ```
 */
export function useInsightsReport(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery<InsightsReport | null>({
    queryKey: ['insights-report', dataPath],
    queryFn: () => insightsApi.loadInsightsReport(dataPath),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch filtered insights with Suspense
 *
 * @param filters - Optional filters to apply
 * @param dataPath - Path to data directory
 * @returns Filtered list of insights
 *
 * @example
 * ```tsx
 * function ConcernsList() {
 *   const { data: concerns } = useInsights({ types: ['concern'] });
 *   return <>{concerns.map(c => <InsightCard insight={c} />)}</>;
 * }
 * ```
 */
export function useInsights(
  filters?: InsightsFilters,
  dataPath: string = DEFAULT_DATA_PATH
) {
  return useSuspenseQuery<AIInsight[]>({
    queryKey: ['insights', dataPath, filters],
    queryFn: () => insightsApi.getInsights(dataPath, filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch insights by type with Suspense
 *
 * @param type - Insight type to filter by
 * @param dataPath - Path to data directory
 * @returns List of insights of the specified type
 *
 * @example
 * ```tsx
 * function ImprovementsList() {
 *   const { data: improvements } = useInsightsByType('improvement');
 *   return <>{improvements.map(i => <InsightCard insight={i} />)}</>;
 * }
 * ```
 */
export function useInsightsByType(
  type: InsightType,
  dataPath: string = DEFAULT_DATA_PATH
) {
  return useSuspenseQuery<AIInsight[]>({
    queryKey: ['insights-by-type', dataPath, type],
    queryFn: () => insightsApi.getInsightsByType(dataPath, type),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch insights summary with Suspense
 *
 * @param dataPath - Path to data directory
 * @returns Insights summary statistics
 *
 * @example
 * ```tsx
 * function InsightsSummaryCard() {
 *   const { data: summary } = useInsightsSummary();
 *   return <SummaryCard headline={summary.headline} />;
 * }
 * ```
 */
export function useInsightsSummary(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery<InsightsSummary | null>({
    queryKey: ['insights-summary', dataPath],
    queryFn: () => insightsApi.getInsightsSummary(dataPath),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to acknowledge an insight
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * function InsightCard({ insight }) {
 *   const { mutate: acknowledge, isPending } = useAcknowledgeInsight();
 *
 *   return (
 *     <Button
 *       onClick={() => acknowledge({ insightId: insight.id, userId: 'user-123' })}
 *       disabled={isPending}
 *     >
 *       Acknowledge
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      insightId,
      userId,
    }: {
      insightId: string;
      userId: string;
    }) => insightsApi.acknowledgeInsight(insightId, userId),
    onSuccess: () => {
      // Invalidate insights queries to refetch
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['insights-report'] });
      queryClient.invalidateQueries({ queryKey: ['insights-summary'] });
    },
  });
}

/**
 * Hook to regenerate insights
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * function RegenerateButton() {
 *   const { mutate: regenerate, isPending } = useRegenerateInsights();
 *
 *   return (
 *     <Button onClick={() => regenerate()} disabled={isPending}>
 *       {isPending ? 'Regenerating...' : 'Regenerate Insights'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useRegenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => insightsApi.regenerateInsights(),
    onSuccess: () => {
      // Invalidate all insights queries
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['insights-report'] });
      queryClient.invalidateQueries({ queryKey: ['insights-summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights-by-type'] });
    },
  });
}

/**
 * Hook to get counts by insight type
 *
 * @param dataPath - Path to data directory
 * @returns Object with counts by type
 */
export function useInsightCounts(dataPath: string = DEFAULT_DATA_PATH) {
  const { data: report } = useInsightsReport(dataPath);

  if (!report) {
    return {
      improvement: 0,
      concern: 0,
      recommendation: 0,
      prediction: 0,
      total: 0,
    };
  }

  return {
    improvement: report.summary.byType.improvement || 0,
    concern: report.summary.byType.concern || 0,
    recommendation: report.summary.byType.recommendation || 0,
    prediction: report.summary.byType.prediction || 0,
    total: report.summary.total,
  };
}
