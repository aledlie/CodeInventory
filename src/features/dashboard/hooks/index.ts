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

// Phase 3 Hooks: Tools & Utilities
export {
  useToolsReport,
  useToolsStatistics,
  useUtilityModule,
  useToolCandidate,
  useModuleToolCandidates,
} from './useToolsData';

// Phase 3 Hooks: Force Simulation (Dependency Graph)
export {
  useForceSimulation,
  type SimulationNode,
  type SimulationConfig,
} from './useForceSimulation';

// Phase 4 Hooks
export {
  useInsightsReport,
  useInsights,
  useInsightsByType,
  useInsightsSummary,
  useAcknowledgeInsight,
  useRegenerateInsights,
  useInsightCounts,
} from './useInsights';

export {
  usePredictionsReport,
  usePrediction,
  useRisks,
  useScenarios,
  usePredictionsSummary,
  useUpdateScenario,
  useRiskCounts,
  useAllPredictions,
} from './usePredictions';

// Phase 4C: Visualization Hooks
export {
  useSavedVisualizations,
  useVisualization,
  useCreateVisualization,
  useSaveVisualization,
  useDeleteVisualization,
  useDuplicateVisualization,
  useExportVisualization,
  useAvailableMetrics,
  useAvailableChartTypes,
} from './useVisualization';

// Phase 4D: Collaboration Hooks
export {
  collaborationKeys,
  useCollaborationSummary,
  useActivities,
  useIssues,
  useTeamMembers,
  useSprintGoals,
  useComments,
  useAssignIssue,
  useUpdateIssueStatus,
  useAddComment,
  useMarkActivityAsRead,
  useCollaborationHub,
} from './useCollaboration';

// Phase 4E: Notification Hooks
export {
  notificationKeys,
  useNotifications,
  useNotificationStats,
  useAlertTriggers,
  useNotificationPreferences,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDismissNotification,
  useCreateAlertTrigger,
  useUpdateAlertTrigger,
  useDeleteAlertTrigger,
  useUpdateNotificationPreferences,
  useNotificationCenter,
  useAlertTriggersManager,
} from './useNotifications';

// Phase 5 Hooks
export {
  analyticsKeys,
  useAnalyticsReport,
  useRiskData,
  useDebtSummary,
  usePredictions,
  useAnalyticsInsights,
  useFilteredRiskData,
  useSortedRiskData,
  useRiskCounts as useAnalyticsRiskCounts,
  useFilteredInsights,
  useDebtBurndownSummary,
  useAnalyticsSummary,
  useDismissInsight,
  usePrefetchAnalytics,
} from './useAnalytics';

// Phase 5B: Personalization Hooks
export {
  personalizationKeys,
  useSavedViews,
  useSavedView,
  useActiveViewId,
  useCreateSavedView,
  useUpdateSavedView,
  useDeleteSavedView,
  useSetActiveView,
  usePreferences,
  useUpdatePreferences,
  useUpdateNotificationSettings,
  useWidgetMetadata,
  useWidgetsByCategory,
  useSavedViewsManager,
  usePreferencesManager,
  useWidgetLibrary,
  useLayoutOperations,
} from './usePersonalization';
