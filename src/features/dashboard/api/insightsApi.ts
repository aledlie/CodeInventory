/**
 * Insights API Service Layer
 *
 * Handles loading AI-generated insights from the Python analyzer.
 * Provides type-safe access to insights, summaries, and actions.
 */

import type {
  AIInsight,
  InsightsReport,
  InsightsSummary,
  InsightType,
  InsightsFilters,
  AcknowledgeResponse,
  RegenerateResponse,
  MetricSnapshot,
} from '../types';
import { logger } from '../helpers/logger';

// ============================================================================
// Raw Python Output Types
// ============================================================================

interface RawInsightsReport {
  summary: {
    total: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    unacknowledged: number;
    overall_confidence: number;
    headline: string;
    last_updated: string;
  };
  insights: RawInsight[];
  key_metrics: RawMetricSnapshot[];
  analyzer_version: string;
  generated_at: string;
}

interface RawInsight {
  id: string;
  type: string;
  severity: string;
  title: string;
  explanation: string;
  confidence: number;
  metrics: RawMetricSnapshot[];
  affected_files: RawFileReference[];
  recommendations: string[];
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  category?: string;
  tags?: string[];
}

interface RawMetricSnapshot {
  name: string;
  current: number;
  previous: number;
  change: number;
  change_percent: number;
  trend: string;
  unit?: string;
}

interface RawFileReference {
  path: string;
  line?: number;
  snippet?: string;
  url?: string;
  percentage?: number;
  previous_percentage?: number;
}

// ============================================================================
// Transform Functions
// ============================================================================

function transformMetricSnapshot(raw: RawMetricSnapshot): MetricSnapshot {
  return {
    name: raw.name,
    current: raw.current,
    previous: raw.previous ?? raw.current,
    change: raw.change ?? 0,
    changePercent: raw.change_percent ?? 0,
    trend: (raw.trend as 'up' | 'down' | 'stable') ?? 'stable',
    unit: raw.unit,
  };
}

function transformInsight(raw: RawInsight): AIInsight {
  return {
    id: raw.id,
    type: raw.type as InsightType,
    severity: raw.severity as AIInsight['severity'],
    title: raw.title,
    explanation: raw.explanation,
    confidence: raw.confidence,
    metrics: (raw.metrics ?? []).map(transformMetricSnapshot),
    affectedFiles: (raw.affected_files ?? []).map((f) => ({
      path: f.path,
      line: f.line,
      snippet: f.snippet,
      url: f.url,
      percentage: f.percentage,
      previousPercentage: f.previous_percentage,
    })),
    recommendations: raw.recommendations ?? [],
    createdAt: raw.created_at,
    acknowledgedAt: raw.acknowledged_at,
    acknowledgedBy: raw.acknowledged_by,
    category: raw.category,
    tags: raw.tags ?? [],
  };
}

function transformInsightsReport(raw: RawInsightsReport): InsightsReport {
  return {
    summary: {
      total: raw.summary.total,
      byType: raw.summary.by_type as Record<InsightType, number>,
      bySeverity: raw.summary.by_severity as Record<AIInsight['severity'], number>,
      unacknowledged: raw.summary.unacknowledged,
      overallConfidence: raw.summary.overall_confidence,
      headline: raw.summary.headline,
      lastUpdated: raw.summary.last_updated,
    },
    insights: (raw.insights ?? []).map(transformInsight),
    keyMetrics: (raw.key_metrics ?? []).map(transformMetricSnapshot),
    analyzerVersion: raw.analyzer_version ?? 'unknown',
    generatedAt: raw.generated_at ?? new Date().toISOString(),
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateRawInsightsReport(data: unknown): data is RawInsightsReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as { summary?: unknown; insights?: unknown };
  if (typeof report.summary !== 'object' || report.summary === null) {
    return false;
  }
  const summary = report.summary as Record<string, unknown>;
  return (
    typeof summary.total === 'number' &&
    typeof summary.by_type === 'object' &&
    typeof summary.by_severity === 'object' &&
    Array.isArray(report.insights)
  );
}

// ============================================================================
// Filter Functions
// ============================================================================

function filterInsights(insights: AIInsight[], filters: InsightsFilters): AIInsight[] {
  let filtered = [...insights];

  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((i) => filters.types!.includes(i.type));
  }

  if (filters.severities && filters.severities.length > 0) {
    filtered = filtered.filter((i) => filters.severities!.includes(i.severity));
  }

  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter((i) => i.category && filters.categories!.includes(i.category));
  }

  if (filters.unacknowledgedOnly) {
    filtered = filtered.filter((i) => !i.acknowledgedAt);
  }

  if (filters.minConfidence !== undefined) {
    filtered = filtered.filter((i) => i.confidence >= filters.minConfidence!);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(query) ||
        i.explanation.toLowerCase().includes(query)
    );
  }

  return filtered;
}

// ============================================================================
// API Service
// ============================================================================

/**
 * Insights API service for loading AI-generated insights
 */
export const insightsApi = {
  /**
   * Load insights report from file system
   *
   * @param dataPath - Base path to data directory (e.g., '/data')
   * @returns Insights report or null if file doesn't exist
   */
  async loadInsightsReport(dataPath: string): Promise<InsightsReport | null> {
    const path = `${dataPath}/insights/insights_latest.json`;

    try {
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          logger.warn('insightsApi', `Insights report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();

      if (!validateRawInsightsReport(rawData)) {
        throw new Error('Insights report has invalid structure');
      }

      const data = transformInsightsReport(rawData);
      logger.info('insightsApi', `Loaded insights report: ${data.summary.total} insights`);
      return data;
    } catch (error) {
      logger.error('insightsApi', `Error loading insights report from ${path}`, error instanceof Error ? error : undefined);
      throw error;
    }
  },

  /**
   * Get all insights with optional filtering
   *
   * @param dataPath - Base path to data directory
   * @param filters - Optional filters to apply
   * @returns Filtered list of insights
   */
  async getInsights(
    dataPath: string,
    filters?: InsightsFilters
  ): Promise<AIInsight[]> {
    const report = await this.loadInsightsReport(dataPath);
    if (!report) {
      return [];
    }

    if (filters) {
      return filterInsights(report.insights, filters);
    }

    return report.insights;
  },

  /**
   * Get insights by category/type
   *
   * @param dataPath - Base path to data directory
   * @param type - Insight type to filter by
   * @returns List of insights of the specified type
   */
  async getInsightsByType(
    dataPath: string,
    type: InsightType
  ): Promise<AIInsight[]> {
    return this.getInsights(dataPath, { types: [type] });
  },

  /**
   * Get insights summary
   *
   * @param dataPath - Base path to data directory
   * @returns Summary statistics or null
   */
  async getInsightsSummary(dataPath: string): Promise<InsightsSummary | null> {
    const report = await this.loadInsightsReport(dataPath);
    return report?.summary ?? null;
  },

  /**
   * Acknowledge an insight (mark as reviewed)
   *
   * Note: In a real implementation, this would POST to a backend.
   * For now, this is a placeholder that returns a success response.
   *
   * @param insightId - ID of the insight to acknowledge
   * @param userId - ID of the user acknowledging
   * @returns Acknowledge response
   */
  async acknowledgeInsight(
    insightId: string,
    userId: string
  ): Promise<AcknowledgeResponse> {
    // Placeholder - in production, this would POST to a backend
    logger.info('insightsApi', `Acknowledging insight ${insightId} by user ${userId}`);

    return {
      success: true,
      insight: {
        id: insightId,
        type: 'improvement',
        severity: 'medium',
        title: 'Acknowledged',
        explanation: '',
        confidence: 100,
        metrics: [],
        affectedFiles: [],
        recommendations: [],
        createdAt: new Date().toISOString(),
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: userId,
      },
    };
  },

  /**
   * Request regeneration of insights
   *
   * Note: In a real implementation, this would trigger the Python analyzer.
   * For now, this is a placeholder.
   *
   * @returns Regenerate response
   */
  async regenerateInsights(): Promise<RegenerateResponse> {
    // Placeholder - in production, this would trigger analysis
    logger.info('insightsApi', 'Regenerating insights...');

    return {
      success: true,
      insights: [],
      processingTime: 0,
    };
  },
};

export default insightsApi;
