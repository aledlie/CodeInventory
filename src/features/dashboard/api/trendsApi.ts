/**
 * Trends API Service
 *
 * Handles loading and processing historical analysis data for trend charts.
 * Supports time range filtering and trend calculations.
 */

import type { HistoryManifest, AnalysisRun, TrendData, ChartTimeRange } from '../types/charts';

/**
 * Load historical runs manifest from the data directory
 */
async function loadHistoryManifest(basePath: string): Promise<HistoryManifest> {
  try {
    const response = await fetch(`${basePath}/history/manifest.json`);
    // Check if response is actually JSON (Vite may return HTML for missing files)
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType?.includes('application/json')) {
      // Return mock data if history doesn't exist yet
      return generateMockManifest();
    }
    return response.json();
  } catch {
    // Return mock data on any fetch/parse error
    return generateMockManifest();
  }
}

/**
 * Generate mock manifest for development/demo purposes
 */
function generateMockManifest(): HistoryManifest {
  const runs: AnalysisRun[] = [];
  const now = new Date();

  // Generate 30 days of mock data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Simulate gradual improvement with some variation
    const baseQuality = 65 + (29 - i) * 0.5 + (Math.random() - 0.5) * 5;
    const baseCoverage = 45 + (29 - i) * 0.8 + (Math.random() - 0.5) * 3;
    const circularDeps = Math.max(0, 5 - Math.floor((29 - i) / 6));

    runs.push({
      timestamp: date.toISOString(),
      runId: `run-${date.getTime()}`,
      metrics: {
        qualityScore: Math.min(100, Math.max(0, baseQuality)),
        coveragePercentage: Math.min(100, Math.max(0, baseCoverage)),
        criticalIssues: Math.max(0, Math.floor(10 - (29 - i) * 0.3 + (Math.random() - 0.5) * 2)),
        highIssues: Math.max(0, Math.floor(25 - (29 - i) * 0.5 + (Math.random() - 0.5) * 3)),
        mediumIssues: Math.max(0, Math.floor(40 - (29 - i) * 0.3 + (Math.random() - 0.5) * 4)),
        lowIssues: Math.max(0, Math.floor(60 + (Math.random() - 0.5) * 5)),
        circularDeps,
        totalFiles: 150 + Math.floor((29 - i) * 2),
        testedFunctions: Math.floor(baseCoverage * 1.5),
        untestedFunctions: Math.floor((100 - baseCoverage) * 1.2),
      },
      reportPaths: {
        quality: `/data/history/${date.toISOString().split('T')[0]}/quality_report.json`,
        coverage: `/data/history/${date.toISOString().split('T')[0]}/coverage_report.json`,
        dependencies: `/data/history/${date.toISOString().split('T')[0]}/dependency_report.json`,
      },
    });
  }

  return {
    runs,
    firstRun: runs[0].timestamp,
    lastRun: runs[runs.length - 1].timestamp,
    totalRuns: runs.length,
    repository: {
      name: 'code-inventory',
      branch: 'main',
    },
  };
}

/**
 * Filter runs by time range
 */
function filterRunsByChartTimeRange(runs: AnalysisRun[], timeRange: ChartTimeRange): AnalysisRun[] {
  if (timeRange === 'all') return runs;

  const now = new Date();
  const cutoffDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const cutoff = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);

  return runs.filter((run) => new Date(run.timestamp) >= cutoff);
}

/**
 * Calculate trend summary statistics
 */
function calculateTrendSummary(values: number[]): TrendData['summary'] {
  if (values.length === 0) {
    return {
      trend: 'stable',
      changePercentage: 0,
      volatility: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }

  const first = values[0];
  const last = values[values.length - 1];
  const changePercentage = first !== 0 ? ((last - first) / first) * 100 : 0;

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const volatility = Math.sqrt(variance);

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (Math.abs(changePercentage) < 5) {
    trend = 'stable';
  } else if (changePercentage > 0) {
    trend = 'improving';
  } else {
    trend = 'declining';
  }

  return {
    trend,
    changePercentage,
    volatility,
    average: avg,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Extract metric values from runs and create TrendData
 */
function extractMetricValues(
  runs: AnalysisRun[],
  metricKey: keyof AnalysisRun['metrics']
): TrendData {
  const dataPoints = runs.map((run) => ({
    timestamp: run.timestamp,
    value: run.metrics[metricKey] as number,
    label: new Date(run.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const values = dataPoints.map((dp) => dp.value);
  const summary = calculateTrendSummary(values);

  return {
    metricKey,
    metricName: formatMetricName(metricKey),
    timeRange: 'all',
    dataPoints,
    summary,
  };
}

/**
 * Format metric key to human-readable name
 */
function formatMetricName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Trends API service
 */
export const trendsApi = {
  /**
   * Load trend data for a specific metric
   */
  async loadTrendData(
    basePath: string,
    metricKey: keyof AnalysisRun['metrics'],
    timeRange: ChartTimeRange = '30d'
  ): Promise<TrendData> {
    const manifest = await loadHistoryManifest(basePath);
    const filteredRuns = filterRunsByChartTimeRange(manifest.runs, timeRange);
    const trendData = extractMetricValues(filteredRuns, metricKey);
    return { ...trendData, timeRange };
  },

  /**
   * Load multiple trend datasets
   */
  async loadMultipleTrends(
    basePath: string,
    metricKeys: Array<keyof AnalysisRun['metrics']>,
    timeRange: ChartTimeRange = '30d'
  ): Promise<TrendData[]> {
    const manifest = await loadHistoryManifest(basePath);
    const filteredRuns = filterRunsByChartTimeRange(manifest.runs, timeRange);

    return metricKeys.map((key) => {
      const trendData = extractMetricValues(filteredRuns, key);
      return { ...trendData, timeRange };
    });
  },

  /**
   * Load history manifest
   */
  async loadManifest(basePath: string): Promise<HistoryManifest> {
    return loadHistoryManifest(basePath);
  },

  /**
   * Load all analysis runs
   */
  async loadRuns(basePath: string, timeRange: ChartTimeRange = '30d'): Promise<AnalysisRun[]> {
    const manifest = await loadHistoryManifest(basePath);
    return filterRunsByChartTimeRange(manifest.runs, timeRange);
  },
};
