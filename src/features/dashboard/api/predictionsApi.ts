/**
 * Predictions API Service Layer
 *
 * Handles loading predictions and risk assessments from the Python analyzer.
 * Provides type-safe access to forecasts, scenarios, and risk data.
 */

import type {
  PredictionData,
  PredictionsReport,
  Risk,
  ScenarioConfig,
  ScenarioResult,
  RiskFilters,
  DataPoint,
  PredictionFactor,
  GoalMarker,
} from '../types';

// ============================================================================
// Raw Python Output Types
// ============================================================================

interface RawPredictionsReport {
  quality_prediction: RawPredictionData;
  coverage_prediction: RawPredictionData;
  issues_prediction: RawPredictionData;
  risks: RawRisk[];
  scenarios: {
    current: RawScenarioResult;
    accelerated: RawScenarioResult;
    relaxed: RawScenarioResult;
  };
  summary: {
    total_risks: number;
    critical_risks: number;
    high_risks: number;
    average_confidence: number;
    trend_direction: string;
  };
  generated_at: string;
  analyzer_version: string;
}

interface RawPredictionData {
  metric: string;
  metric_label: string;
  historical: RawDataPoint[];
  predicted: RawDataPoint[];
  confidence_bands: {
    lower: RawDataPoint[];
    upper: RawDataPoint[];
  };
  confidence: number;
  horizon: number;
  methodology: string;
  factors: RawPredictionFactor[];
  goals?: RawGoalMarker[];
  unit: string;
  min?: number;
  max?: number;
}

interface RawDataPoint {
  date: string;
  value: number;
}

interface RawPredictionFactor {
  name: string;
  weight: number;
  direction: string;
  explanation: string;
}

interface RawGoalMarker {
  value: number;
  label: string;
  predicted_date?: string;
  achievable: boolean;
  confidence: number;
}

interface RawRisk {
  id: string;
  name: string;
  description: string;
  impact: string;
  probability: string;
  category: string;
  affected_files: string[];
  mitigation: string;
  estimated_effort: number;
  confidence: number;
  is_active: boolean;
  identified_at: string;
  updated_at: string;
}

interface RawScenarioResult {
  scenario: RawScenarioConfig;
  prediction: RawPredictionData;
  days_to_90_quality?: number;
  days_to_target_coverage?: number;
  projected_quality: number;
  projected_coverage: number;
}

interface RawScenarioConfig {
  name: string;
  coverage_growth_rate: number;
  issue_resolution_rate: number;
  new_issues_rate: number;
  dependency_update_rate: number;
  custom_factors?: Record<string, number>;
}

// ============================================================================
// Transform Functions
// ============================================================================

function transformDataPoint(raw: RawDataPoint): DataPoint {
  return {
    date: raw.date,
    value: raw.value,
  };
}

function transformPredictionFactor(raw: RawPredictionFactor): PredictionFactor {
  return {
    name: raw.name,
    weight: raw.weight,
    direction: raw.direction as 'positive' | 'negative' | 'neutral',
    explanation: raw.explanation,
  };
}

function transformGoalMarker(raw: RawGoalMarker): GoalMarker {
  return {
    value: raw.value,
    label: raw.label,
    predictedDate: raw.predicted_date,
    achievable: raw.achievable,
    confidence: raw.confidence,
  };
}

function transformPredictionData(raw: RawPredictionData): PredictionData {
  return {
    metric: raw.metric,
    metricLabel: raw.metric_label,
    historical: raw.historical.map(transformDataPoint),
    predicted: raw.predicted.map(transformDataPoint),
    confidenceBands: {
      lower: raw.confidence_bands.lower.map(transformDataPoint),
      upper: raw.confidence_bands.upper.map(transformDataPoint),
    },
    confidence: raw.confidence,
    horizon: raw.horizon,
    methodology: raw.methodology as PredictionData['methodology'],
    factors: raw.factors.map(transformPredictionFactor),
    goals: raw.goals?.map(transformGoalMarker),
    unit: raw.unit,
    min: raw.min,
    max: raw.max,
  };
}

function transformRisk(raw: RawRisk): Risk {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    impact: raw.impact as Risk['impact'],
    probability: raw.probability as Risk['probability'],
    category: raw.category as Risk['category'],
    affectedFiles: raw.affected_files,
    mitigation: raw.mitigation,
    estimatedEffort: raw.estimated_effort,
    confidence: raw.confidence,
    isActive: raw.is_active,
    identifiedAt: raw.identified_at,
    updatedAt: raw.updated_at,
  };
}

function transformScenarioConfig(raw: RawScenarioConfig): ScenarioConfig {
  return {
    name: raw.name,
    coverageGrowthRate: raw.coverage_growth_rate,
    issueResolutionRate: raw.issue_resolution_rate,
    newIssuesRate: raw.new_issues_rate,
    dependencyUpdateRate: raw.dependency_update_rate,
    customFactors: raw.custom_factors,
  };
}

function transformScenarioResult(raw: RawScenarioResult): ScenarioResult {
  return {
    scenario: transformScenarioConfig(raw.scenario),
    prediction: transformPredictionData(raw.prediction),
    daysTo90Quality: raw.days_to_90_quality,
    daysToTargetCoverage: raw.days_to_target_coverage,
    projectedQuality: raw.projected_quality,
    projectedCoverage: raw.projected_coverage,
  };
}

function transformPredictionsReport(raw: RawPredictionsReport): PredictionsReport {
  return {
    qualityPrediction: transformPredictionData(raw.quality_prediction),
    coveragePrediction: transformPredictionData(raw.coverage_prediction),
    issuesPrediction: transformPredictionData(raw.issues_prediction),
    risks: raw.risks.map(transformRisk),
    scenarios: {
      current: transformScenarioResult(raw.scenarios.current),
      accelerated: transformScenarioResult(raw.scenarios.accelerated),
      relaxed: transformScenarioResult(raw.scenarios.relaxed),
    },
    summary: {
      totalRisks: raw.summary.total_risks,
      criticalRisks: raw.summary.critical_risks,
      highRisks: raw.summary.high_risks,
      averageConfidence: raw.summary.average_confidence,
      trendDirection: raw.summary.trend_direction as 'improving' | 'declining' | 'stable',
    },
    generatedAt: raw.generated_at,
    analyzerVersion: raw.analyzer_version,
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateRawPredictionsReport(data: unknown): data is RawPredictionsReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as Record<string, unknown>;
  return (
    typeof report.quality_prediction === 'object' &&
    typeof report.coverage_prediction === 'object' &&
    typeof report.issues_prediction === 'object' &&
    Array.isArray(report.risks) &&
    typeof report.scenarios === 'object' &&
    typeof report.summary === 'object'
  );
}

// ============================================================================
// Filter Functions
// ============================================================================

function filterRisks(risks: Risk[], filters: RiskFilters): Risk[] {
  let filtered = [...risks];

  if (filters.impacts && filters.impacts.length > 0) {
    filtered = filtered.filter((r) => filters.impacts!.includes(r.impact));
  }

  if (filters.probabilities && filters.probabilities.length > 0) {
    filtered = filtered.filter((r) => filters.probabilities!.includes(r.probability));
  }

  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter((r) => filters.categories!.includes(r.category));
  }

  if (filters.activeOnly) {
    filtered = filtered.filter((r) => r.isActive);
  }

  if (filters.minConfidence !== undefined) {
    filtered = filtered.filter((r) => r.confidence >= filters.minConfidence!);
  }

  return filtered;
}

// ============================================================================
// API Service
// ============================================================================

/**
 * Predictions API service for loading forecasts and risk assessments
 */
export const predictionsApi = {
  /**
   * Load predictions report from file system
   *
   * @param dataPath - Base path to data directory (e.g., '/data')
   * @returns Predictions report or null if file doesn't exist
   */
  async loadPredictionsReport(dataPath: string): Promise<PredictionsReport | null> {
    const path = `${dataPath}/predictions/predictions_latest.json`;

    try {
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[predictionsApi] Predictions report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();

      if (!validateRawPredictionsReport(rawData)) {
        throw new Error('Predictions report has invalid structure');
      }

      const data = transformPredictionsReport(rawData);
      console.log(`[predictionsApi] Loaded predictions report: ${data.risks.length} risks`);
      return data;
    } catch (error) {
      console.error(`[predictionsApi] Error loading predictions report from ${path}:`, error);
      throw error;
    }
  },

  /**
   * Get prediction for a specific metric
   *
   * @param dataPath - Base path to data directory
   * @param metric - Metric name (qualityScore, coverage, issues)
   * @param horizon - Days to forecast (default 90)
   * @returns Prediction data or null
   */
  async getPrediction(
    dataPath: string,
    metric: 'qualityScore' | 'coverage' | 'issues',
    horizon: number = 90
  ): Promise<PredictionData | null> {
    const report = await this.loadPredictionsReport(dataPath);
    if (!report) {
      return null;
    }

    const predictionMap: Record<string, PredictionData> = {
      qualityScore: report.qualityPrediction,
      coverage: report.coveragePrediction,
      issues: report.issuesPrediction,
    };

    const prediction = predictionMap[metric];
    if (!prediction) {
      return null;
    }

    // If requested horizon differs, slice the prediction
    if (horizon !== prediction.horizon && prediction.predicted.length > horizon) {
      return {
        ...prediction,
        horizon,
        predicted: prediction.predicted.slice(0, horizon),
        confidenceBands: {
          lower: prediction.confidenceBands.lower.slice(0, horizon),
          upper: prediction.confidenceBands.upper.slice(0, horizon),
        },
      };
    }

    return prediction;
  },

  /**
   * Get all risk assessments with optional filtering
   *
   * @param dataPath - Base path to data directory
   * @param filters - Optional filters to apply
   * @returns Filtered list of risks
   */
  async getRisks(dataPath: string, filters?: RiskFilters): Promise<Risk[]> {
    const report = await this.loadPredictionsReport(dataPath);
    if (!report) {
      return [];
    }

    if (filters) {
      return filterRisks(report.risks, filters);
    }

    return report.risks;
  },

  /**
   * Get scenario comparison results
   *
   * @param dataPath - Base path to data directory
   * @returns Scenario results or null
   */
  async getScenarios(
    dataPath: string
  ): Promise<PredictionsReport['scenarios'] | null> {
    const report = await this.loadPredictionsReport(dataPath);
    return report?.scenarios ?? null;
  },

  /**
   * Calculate prediction with custom scenario
   *
   * Note: In a real implementation, this would call the Python analyzer.
   * For now, this returns the "current" scenario as a placeholder.
   *
   * @param dataPath - Base path to data directory
   * @param scenario - Custom scenario configuration
   * @returns Scenario result
   */
  async updateScenario(
    dataPath: string,
    scenario: ScenarioConfig
  ): Promise<ScenarioResult | null> {
    // Placeholder - in production, this would call the analyzer
    console.log('[predictionsApi] Calculating custom scenario:', scenario);

    const report = await this.loadPredictionsReport(dataPath);
    if (!report) {
      return null;
    }

    // Return current scenario as placeholder
    return {
      scenario,
      prediction: report.qualityPrediction,
      daysTo90Quality: report.scenarios.current.daysTo90Quality,
      daysToTargetCoverage: report.scenarios.current.daysToTargetCoverage,
      projectedQuality: report.scenarios.current.projectedQuality,
      projectedCoverage: report.scenarios.current.projectedCoverage,
    };
  },

  /**
   * Get prediction summary
   *
   * @param dataPath - Base path to data directory
   * @returns Summary statistics or null
   */
  async getPredictionsSummary(
    dataPath: string
  ): Promise<PredictionsReport['summary'] | null> {
    const report = await this.loadPredictionsReport(dataPath);
    return report?.summary ?? null;
  },
};

export default predictionsApi;
