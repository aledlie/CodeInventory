/**
 * Analytics Hooks
 *
 * TanStack Query hooks for fetching and managing analytics data.
 * All hooks use Suspense mode for declarative loading states.
 *
 * @example
 * ```tsx
 * import { Suspense } from 'react';
 * import { useAnalyticsReport } from './hooks';
 *
 * function AnalyticsPage() {
 *   return (
 *     <Suspense fallback={<LoadingSpinner />}>
 *       <AnalyticsContent />
 *     </Suspense>
 *   );
 * }
 *
 * function AnalyticsContent() {
 *   const { data } = useAnalyticsReport();
 *   return <AnalyticsDashboard data={data} />;
 * }
 * ```
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import type {
  RiskData,
  AnalyticsInsight,
  AnalyticsFilters,
  RiskLevel,
  DebtBurndownSummary,
} from '../types/analytics';

// ============================================================================
// Query Keys
// ============================================================================

export const analyticsKeys = {
  all: ['analytics'] as const,
  report: () => [...analyticsKeys.all, 'report'] as const,
  riskData: () => [...analyticsKeys.all, 'risk'] as const,
  debtSummary: () => [...analyticsKeys.all, 'debt'] as const,
  predictions: () => [...analyticsKeys.all, 'predictions'] as const,
  insights: () => [...analyticsKeys.all, 'insights'] as const,
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_DATA_PATH = '/data';

const analyticsQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,
  retry: 2,
};

// ============================================================================
// Report Hooks
// ============================================================================

/**
 * Fetch complete analytics report
 */
export function useAnalyticsReport(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery({
    queryKey: analyticsKeys.report(),
    queryFn: () => analyticsApi.loadAnalyticsReport(dataPath),
    ...analyticsQueryConfig,
  });
}

/**
 * Fetch risk data only
 */
export function useRiskData(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery({
    queryKey: analyticsKeys.riskData(),
    queryFn: () => analyticsApi.loadRiskData(dataPath),
    ...analyticsQueryConfig,
  });
}

/**
 * Fetch debt summary only
 */
export function useDebtSummary(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery({
    queryKey: analyticsKeys.debtSummary(),
    queryFn: () => analyticsApi.loadDebtSummary(dataPath),
    ...analyticsQueryConfig,
  });
}

/**
 * Fetch predictions only
 */
export function usePredictions(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery({
    queryKey: analyticsKeys.predictions(),
    queryFn: () => analyticsApi.loadPredictions(dataPath),
    ...analyticsQueryConfig,
  });
}

/**
 * Fetch insights only
 */
export function useAnalyticsInsights(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery({
    queryKey: analyticsKeys.insights(),
    queryFn: () => analyticsApi.loadInsights(dataPath),
    ...analyticsQueryConfig,
  });
}

// ============================================================================
// Filtered Data Hooks
// ============================================================================

/**
 * Get risk data filtered by risk level
 */
export function useFilteredRiskData(
  filters: AnalyticsFilters = {},
  dataPath: string = DEFAULT_DATA_PATH
) {
  const { data: riskData } = useRiskData(dataPath);

  // Apply filters
  let filtered = [...riskData];

  if (filters.riskLevels && filters.riskLevels.length > 0) {
    filtered = filtered.filter((item) => filters.riskLevels!.includes(item.riskLevel));
  }

  if (filters.minConfidence !== undefined) {
    filtered = filtered.filter((item) => item.confidence >= filters.minConfidence!);
  }

  if (filters.filePattern) {
    const pattern = new RegExp(filters.filePattern, 'i');
    filtered = filtered.filter((item) => pattern.test(item.path));
  }

  return filtered;
}

/**
 * Get risk data sorted by risk score (descending)
 */
export function useSortedRiskData(
  limit?: number,
  dataPath: string = DEFAULT_DATA_PATH
): RiskData[] {
  const { data: riskData } = useRiskData(dataPath);

  const sorted = [...riskData].sort((a, b) => b.riskScore - a.riskScore);

  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Get risk counts by level
 */
export function useRiskCounts(dataPath: string = DEFAULT_DATA_PATH): Record<RiskLevel, number> {
  const { data: riskData } = useRiskData(dataPath);

  const counts: Record<RiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    minimal: 0,
  };

  riskData.forEach((item) => {
    counts[item.riskLevel]++;
  });

  return counts;
}

/**
 * Get insights filtered by priority
 */
export function useFilteredInsights(
  filters: AnalyticsFilters = {},
  dataPath: string = DEFAULT_DATA_PATH
): AnalyticsInsight[] {
  const { data: insights } = useAnalyticsInsights(dataPath);

  let filtered = [...insights];

  if (filters.insightPriorities && filters.insightPriorities.length > 0) {
    filtered = filtered.filter((item) => filters.insightPriorities!.includes(item.priority));
  }

  // Filter out dismissed insights by default
  filtered = filtered.filter((item) => !item.dismissedAt);

  return filtered;
}

// ============================================================================
// Computed Data Hooks
// ============================================================================

/**
 * Calculate debt burndown summary
 */
export function useDebtBurndownSummary(
  dataPath: string = DEFAULT_DATA_PATH
): DebtBurndownSummary {
  const { data: debtSummary } = useDebtSummary(dataPath);

  const { historical, targets, totalHours } = debtSummary;

  // Get latest values
  const currentDebt = historical.length > 0 ? historical[historical.length - 1].value : totalHours;
  const targetDebt = targets.length > 0 ? targets[targets.length - 1].value : totalHours * 0.5;

  // Calculate progress
  const startDebt = historical.length > 0 ? historical[0].value : totalHours;
  const totalReduction = startDebt - targetDebt;
  const actualReduction = startDebt - currentDebt;
  const progressPercent = totalReduction > 0 ? (actualReduction / totalReduction) * 100 : 0;

  // Calculate trend (last 4 data points)
  let trend: DebtBurndownSummary['trend'] = 'stable';
  let weeklyChangeRate = 0;

  if (historical.length >= 2) {
    const recent = historical.slice(-4);
    const firstValue = recent[0].value;
    const lastValue = recent[recent.length - 1].value;
    weeklyChangeRate = (lastValue - firstValue) / (recent.length - 1);

    if (weeklyChangeRate < -2) trend = 'improving';
    else if (weeklyChangeRate > 2) trend = 'declining';
  }

  // Determine status
  let status: DebtBurndownSummary['status'] = 'on-track';
  if (currentDebt <= targetDebt) {
    status = 'ahead';
  } else if (currentDebt > startDebt) {
    status = 'critical';
  } else if (progressPercent < 50 && historical.length > 5) {
    status = 'behind';
  }

  // Estimate days to target
  let estimatedDaysToTarget: number | null = null;
  if (weeklyChangeRate < 0 && currentDebt > targetDebt) {
    const hoursToReduce = currentDebt - targetDebt;
    const weeksNeeded = hoursToReduce / Math.abs(weeklyChangeRate);
    estimatedDaysToTarget = Math.round(weeksNeeded * 7);
  }

  return {
    currentDebt,
    targetDebt,
    status,
    progressPercent: Math.round(progressPercent),
    estimatedDaysToTarget,
    trend,
    weeklyChangeRate: Math.round(weeklyChangeRate * 10) / 10,
  };
}

/**
 * Get overall analytics summary
 */
export function useAnalyticsSummary(dataPath: string = DEFAULT_DATA_PATH) {
  const { data: report } = useAnalyticsReport(dataPath);
  const riskCounts = useRiskCounts(dataPath);

  return {
    totalRiskItems: report.riskData.length,
    criticalRisks: riskCounts.critical,
    highRisks: riskCounts.high,
    totalDebtHours: report.debtSummary.totalHours,
    activeInsights: report.insights.filter((i) => !i.dismissedAt).length,
    dataQuality: report.metadata.dataQuality,
    lastUpdated: report.metadata.generatedAt,
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Dismiss an insight
 */
export function useDismissInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (insightId: string) => analyticsApi.dismissInsight(insightId),
    onSuccess: () => {
      // Invalidate insights cache to refetch
      queryClient.invalidateQueries({ queryKey: analyticsKeys.insights() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.report() });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get the query client for manual cache operations
 */
export { useQueryClient } from '@tanstack/react-query';

/**
 * Prefetch analytics data (useful for route preloading)
 */
export function usePrefetchAnalytics() {
  const queryClient = useQueryClient();

  return {
    prefetchReport: (dataPath: string = DEFAULT_DATA_PATH) =>
      queryClient.prefetchQuery({
        queryKey: analyticsKeys.report(),
        queryFn: () => analyticsApi.loadAnalyticsReport(dataPath),
        ...analyticsQueryConfig,
      }),
  };
}
