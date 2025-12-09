/**
 * Dashboard API Barrel Export
 *
 * Main entry point for the dashboard API service layer.
 */

export { dashboardApi } from './dashboardApi';

// Phase 3 APIs
export { trendsApi } from './trendsApi';
export { graphApi } from './graphApi';
export { comparisonApi } from './comparisonApi';
export { reportsApi, AVAILABLE_SECTIONS } from './reportsApi';
export * from './toolsApi';

// Phase 4 APIs
export { insightsApi } from './insightsApi';
export { predictionsApi } from './predictionsApi';
export { visualizationApi } from './visualizationApi';
export { collaborationApi } from './collaborationApi';
export { notificationsApi } from './notificationsApi';

// Phase 5 APIs
export { analyticsApi } from './analyticsApi';
export { personalizationApi, WIDGET_METADATA } from './personalizationApi';
