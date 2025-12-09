/**
 * Phase 4B: Predictive Analytics Hooks
 *
 * React Query hooks for fetching predictions and risk assessments.
 * Uses Suspense for data fetching with proper caching.
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { predictionsApi } from '../api/predictionsApi';
import type {
  PredictionsReport,
  PredictionData,
  Risk,
  ScenarioConfig,
  RiskFilters,
} from '../types';

/**
 * Default data path for reports
 */
const DEFAULT_DATA_PATH = '/data';

/**
 * Hook to fetch the full predictions report with Suspense
 *
 * @param dataPath - Path to data directory
 * @returns Predictions report data
 *
 * @example
 * ```tsx
 * function PredictiveDashboard() {
 *   const { data: report } = usePredictionsReport();
 *   return <PredictionChart data={report.qualityPrediction} />;
 * }
 * ```
 */
export function usePredictionsReport(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery<PredictionsReport | null>({
    queryKey: ['predictions-report', dataPath],
    queryFn: () => predictionsApi.loadPredictionsReport(dataPath),
    staleTime: 60 * 60 * 1000, // 1 hour - predictions change slowly
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to fetch prediction for a specific metric with Suspense
 *
 * @param metric - Metric to predict (qualityScore, coverage, issues)
 * @param horizon - Days to forecast (default 90)
 * @param dataPath - Path to data directory
 * @returns Prediction data for the metric
 *
 * @example
 * ```tsx
 * function QualityForecast() {
 *   const { data: prediction } = usePrediction('qualityScore', 90);
 *   return <PredictionChart data={prediction} />;
 * }
 * ```
 */
export function usePrediction(
  metric: 'qualityScore' | 'coverage' | 'issues',
  horizon: number = 90,
  dataPath: string = DEFAULT_DATA_PATH
) {
  return useSuspenseQuery<PredictionData | null>({
    queryKey: ['prediction', dataPath, metric, horizon],
    queryFn: () => predictionsApi.getPrediction(dataPath, metric, horizon),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to fetch risk assessments with optional filtering
 *
 * @param filters - Optional filters to apply
 * @param dataPath - Path to data directory
 * @returns Filtered list of risks
 *
 * @example
 * ```tsx
 * function CriticalRisks() {
 *   const { data: risks } = useRisks({ impacts: ['critical', 'high'] });
 *   return <RiskMatrix risks={risks} />;
 * }
 * ```
 */
export function useRisks(
  filters?: RiskFilters,
  dataPath: string = DEFAULT_DATA_PATH
) {
  return useSuspenseQuery<Risk[]>({
    queryKey: ['risks', dataPath, filters],
    queryFn: () => predictionsApi.getRisks(dataPath, filters),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to fetch scenario comparison results
 *
 * @param dataPath - Path to data directory
 * @returns Pre-computed scenario results
 *
 * @example
 * ```tsx
 * function ScenarioComparator() {
 *   const { data: scenarios } = useScenarios();
 *   return (
 *     <>
 *       <ScenarioCard scenario={scenarios.current} />
 *       <ScenarioCard scenario={scenarios.accelerated} />
 *       <ScenarioCard scenario={scenarios.relaxed} />
 *     </>
 *   );
 * }
 * ```
 */
export function useScenarios(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery<PredictionsReport['scenarios'] | null>({
    queryKey: ['scenarios', dataPath],
    queryFn: () => predictionsApi.getScenarios(dataPath),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to fetch predictions summary
 *
 * @param dataPath - Path to data directory
 * @returns Summary statistics
 */
export function usePredictionsSummary(dataPath: string = DEFAULT_DATA_PATH) {
  return useSuspenseQuery<PredictionsReport['summary'] | null>({
    queryKey: ['predictions-summary', dataPath],
    queryFn: () => predictionsApi.getPredictionsSummary(dataPath),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to calculate prediction with custom scenario
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * function ScenarioBuilder() {
 *   const { mutate: updateScenario, data, isPending } = useUpdateScenario();
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       updateScenario({
 *         scenario: { coverageGrowthRate: 0.05, issueResolutionRate: 10 }
 *       });
 *     }}>
 *       ...
 *     </form>
 *   );
 * }
 * ```
 */
export function useUpdateScenario(dataPath: string = DEFAULT_DATA_PATH) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scenario }: { scenario: ScenarioConfig }) =>
      predictionsApi.updateScenario(dataPath, scenario),
    onSuccess: (result) => {
      // Cache the custom scenario result
      if (result) {
        queryClient.setQueryData(
          ['custom-scenario', dataPath, result.scenario.name],
          result
        );
      }
    },
  });
}

/**
 * Hook to get risk counts by impact level
 *
 * @param dataPath - Path to data directory
 * @returns Object with counts by impact level
 */
export function useRiskCounts(dataPath: string = DEFAULT_DATA_PATH) {
  const { data: report } = usePredictionsReport(dataPath);

  if (!report) {
    return {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };
  }

  return {
    critical: report.summary.criticalRisks,
    high: report.summary.highRisks,
    medium: report.risks.filter((r) => r.impact === 'medium').length,
    low: report.risks.filter((r) => r.impact === 'low').length,
    total: report.summary.totalRisks,
  };
}

/**
 * Hook to get all predictions at once
 *
 * @param dataPath - Path to data directory
 * @returns Object with all prediction data
 */
export function useAllPredictions(dataPath: string = DEFAULT_DATA_PATH) {
  const { data: report } = usePredictionsReport(dataPath);

  if (!report) {
    return {
      quality: null,
      coverage: null,
      issues: null,
      trendDirection: 'stable' as const,
    };
  }

  return {
    quality: report.qualityPrediction,
    coverage: report.coveragePrediction,
    issues: report.issuesPrediction,
    trendDirection: report.summary.trendDirection,
  };
}
