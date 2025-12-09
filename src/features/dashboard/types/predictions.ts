/**
 * Phase 4B: Predictive Analytics Types
 *
 * Type definitions for predictions, risk assessments,
 * scenarios, and forecasting data.
 */

/**
 * Data point for time series
 */
export interface DataPoint {
  /** ISO 8601 date string */
  date: string;
  /** Value at this date */
  value: number;
}

/**
 * Risk impact levels
 */
export type RiskImpact = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk probability levels
 */
export type RiskProbability = 'low' | 'medium' | 'high';

/**
 * Risk categories
 */
export type RiskCategory = 'quality' | 'coverage' | 'dependency' | 'security' | 'performance';

/**
 * Factor influencing prediction
 */
export interface PredictionFactor {
  /** Factor name */
  name: string;
  /** Influence weight (0-1) */
  weight: number;
  /** Direction of influence */
  direction: 'positive' | 'negative' | 'neutral';
  /** Explanation of how this factor affects the prediction */
  explanation: string;
}

/**
 * Goal milestone marker
 */
export interface GoalMarker {
  /** Goal value */
  value: number;
  /** Goal label */
  label: string;
  /** Predicted date to achieve goal */
  predictedDate?: string;
  /** Whether goal is achievable at current pace */
  achievable: boolean;
  /** Confidence in achieving goal */
  confidence: number;
}

/**
 * Prediction data for a metric
 */
export interface PredictionData {
  /** Metric being predicted */
  metric: string;
  /** Human-readable metric name */
  metricLabel: string;
  /** Historical data points */
  historical: DataPoint[];
  /** Predicted future data points */
  predicted: DataPoint[];
  /** Confidence bands */
  confidenceBands: {
    /** Lower bound points */
    lower: DataPoint[];
    /** Upper bound points */
    upper: DataPoint[];
  };
  /** Overall confidence score (0-100) */
  confidence: number;
  /** Prediction horizon in days */
  horizon: number;
  /** Methodology used for prediction */
  methodology: 'linear-regression' | 'arima' | 'prophet' | 'exponential-smoothing';
  /** Factors influencing the prediction */
  factors: PredictionFactor[];
  /** Goal markers */
  goals?: GoalMarker[];
  /** Unit of measurement */
  unit: string;
  /** Minimum possible value (e.g., 0 for percentages) */
  min?: number;
  /** Maximum possible value (e.g., 100 for percentages) */
  max?: number;
}

/**
 * Risk assessment
 */
export interface Risk {
  /** Unique identifier */
  id: string;
  /** Risk name/title */
  name: string;
  /** Detailed description */
  description: string;
  /** Impact level */
  impact: RiskImpact;
  /** Probability level */
  probability: RiskProbability;
  /** Risk category */
  category: RiskCategory;
  /** Files affected by this risk */
  affectedFiles: string[];
  /** Suggested mitigation steps */
  mitigation: string;
  /** Estimated effort to mitigate (hours) */
  estimatedEffort: number;
  /** Confidence in risk assessment (0-100) */
  confidence: number;
  /** Whether risk is currently active */
  isActive: boolean;
  /** ISO 8601 timestamp when risk was identified */
  identifiedAt: string;
  /** ISO 8601 timestamp when risk was last updated */
  updatedAt: string;
}

/**
 * Risk matrix position
 */
export interface RiskPosition {
  /** Risk ID */
  id: string;
  /** X position (probability: 0-1) */
  x: number;
  /** Y position (impact: 0-1) */
  y: number;
  /** Bubble size (based on effort or affected files) */
  size: number;
  /** Color based on risk level */
  color: string;
  /** Label to display */
  label: string;
}

/**
 * Scenario configuration for what-if analysis
 */
export interface ScenarioConfig {
  /** Scenario name */
  name: string;
  /** Coverage growth rate (percentage per month) */
  coverageGrowthRate: number;
  /** Issue resolution rate (issues per week) */
  issueResolutionRate: number;
  /** New issues per week */
  newIssuesRate: number;
  /** Dependency update frequency (updates per month) */
  dependencyUpdateRate: number;
  /** Custom factors */
  customFactors?: Record<string, number>;
}

/**
 * Scenario comparison result
 */
export interface ScenarioResult {
  /** Scenario configuration */
  scenario: ScenarioConfig;
  /** Resulting prediction */
  prediction: PredictionData;
  /** Days to reach 90% quality (if achievable) */
  daysTo90Quality?: number;
  /** Days to reach target coverage */
  daysToTargetCoverage?: number;
  /** Projected quality score at horizon */
  projectedQuality: number;
  /** Projected coverage at horizon */
  projectedCoverage: number;
}

/**
 * Predictions report structure (from Python analyzer)
 */
export interface PredictionsReport {
  /** Quality score prediction */
  qualityPrediction: PredictionData;
  /** Coverage prediction */
  coveragePrediction: PredictionData;
  /** Issue count prediction */
  issuesPrediction: PredictionData;
  /** Risk assessments */
  risks: Risk[];
  /** Pre-computed scenario results */
  scenarios: {
    current: ScenarioResult;
    accelerated: ScenarioResult;
    relaxed: ScenarioResult;
  };
  /** Summary statistics */
  summary: {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    averageConfidence: number;
    trendDirection: 'improving' | 'declining' | 'stable';
  };
  /** ISO 8601 timestamp when report was generated */
  generatedAt: string;
  /** Analyzer version */
  analyzerVersion: string;
}

/**
 * Filter options for risks
 */
export interface RiskFilters {
  /** Filter by impact levels */
  impacts?: RiskImpact[];
  /** Filter by probability levels */
  probabilities?: RiskProbability[];
  /** Filter by categories */
  categories?: RiskCategory[];
  /** Show only active risks */
  activeOnly?: boolean;
  /** Minimum confidence threshold */
  minConfidence?: number;
}
