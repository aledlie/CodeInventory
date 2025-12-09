/**
 * Phase 5A: Predictive Analytics Types
 *
 * Type definitions for risk heatmaps, technical debt tracking,
 * predictive trends, and actionable insights.
 */

// ============================================================================
// Risk Heatmap Types
// ============================================================================

/**
 * Risk factor types that contribute to overall risk score
 */
export type RiskFactorType = 'complexity' | 'coverage' | 'dependencies' | 'age' | 'churn';

/**
 * Risk level categories
 */
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

/**
 * Individual risk factor with its contribution to overall risk
 */
export interface RiskFactor {
  /** Type of risk factor */
  type: RiskFactorType;
  /** Weight of this factor in risk calculation (0-1) */
  weight: number;
  /** Raw value of the factor */
  value: number;
  /** Normalized score (0-100) */
  score: number;
  /** Human-readable description */
  description?: string;
}

/**
 * Risk data for a single file or module
 */
export interface RiskData {
  /** File or module path */
  path: string;
  /** Display name (shortened path) */
  displayName: string;
  /** Overall risk score (0-100) */
  riskScore: number;
  /** Risk level category */
  riskLevel: RiskLevel;
  /** Individual risk factors */
  factors: RiskFactor[];
  /** Confidence in the risk assessment (0-100) */
  confidence: number;
  /** ISO 8601 timestamp when risk was last calculated */
  lastUpdated: string;
  /** Parent directory for grouping */
  directory?: string;
}

/**
 * Heatmap cell data for matrix visualization
 */
export interface HeatmapCell {
  /** Row identifier (module/file) */
  rowId: string;
  /** Row display label */
  rowLabel: string;
  /** Column identifier (risk factor) */
  columnId: RiskFactorType;
  /** Column display label */
  columnLabel: string;
  /** Cell value (0-100) */
  value: number;
  /** Risk level for color coding */
  riskLevel: RiskLevel;
  /** Tooltip content */
  tooltip?: string;
}

/**
 * Props for RiskHeatmap component
 */
export interface RiskHeatmapProps {
  /** Risk data for each file/module */
  data: RiskData[];
  /** Maximum items to display (default: 10) */
  maxItems?: number;
  /** Callback when an item is clicked */
  onItemClick?: (item: RiskData) => void;
  /** Group by directory */
  groupByDirectory?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Chart height */
  height?: number;
  /** Loading state */
  isLoading?: boolean;
}

// ============================================================================
// Technical Debt Types
// ============================================================================

/**
 * Data point for time-series charts
 */
export interface TimeSeriesDataPoint {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Numeric value */
  value: number;
  /** Optional label */
  label?: string;
}

/**
 * Debt category breakdown
 */
export type DebtCategory = 'complexity' | 'coverage' | 'documentation' | 'dependencies' | 'security' | 'performance';

/**
 * Debt item representing a specific technical debt issue
 */
export interface DebtItem {
  /** Unique identifier */
  id: string;
  /** Category of debt */
  category: DebtCategory;
  /** Description of the debt */
  description: string;
  /** Estimated hours to resolve */
  estimatedHours: number;
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** Affected files */
  affectedFiles: string[];
  /** ISO 8601 timestamp when debt was identified */
  createdAt: string;
}

/**
 * Technical debt summary by category
 */
export interface DebtSummaryByCategory {
  /** Category name */
  category: DebtCategory;
  /** Display label */
  label: string;
  /** Total hours of debt in this category */
  totalHours: number;
  /** Percentage of total debt */
  percentage: number;
  /** Number of items in this category */
  itemCount: number;
  /** Color for visualization */
  color: string;
}

/**
 * Time range options for analytics charts
 */
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | '6mo' | '1y' | 'all';

/**
 * Props for DebtBurndownChart component
 */
export interface DebtBurndownChartProps {
  /** Actual debt over time */
  actualData: TimeSeriesDataPoint[];
  /** Target debt reduction pace */
  targetData: TimeSeriesDataPoint[];
  /** Projected future debt (optional) */
  projectedData?: TimeSeriesDataPoint[];
  /** Time range to display */
  timeRange: AnalyticsTimeRange;
  /** Chart height */
  height?: number;
  /** Current total debt in hours */
  currentDebt?: number;
  /** Target debt in hours */
  targetDebt?: number;
  /** Show status summary below chart */
  showStatus?: boolean;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Debt burndown status
 */
export type BurndownStatus = 'ahead' | 'on-track' | 'behind' | 'critical';

/**
 * Debt burndown summary
 */
export interface DebtBurndownSummary {
  /** Current debt in hours */
  currentDebt: number;
  /** Target debt in hours */
  targetDebt: number;
  /** Status relative to target */
  status: BurndownStatus;
  /** Percentage of target achieved */
  progressPercent: number;
  /** Estimated days to reach target at current pace */
  estimatedDaysToTarget: number | null;
  /** Trend direction */
  trend: 'improving' | 'declining' | 'stable';
  /** Weekly change rate (hours) */
  weeklyChangeRate: number;
}

// ============================================================================
// Predictive Trend Types
// ============================================================================

/**
 * Metric types for predictions
 */
export type MetricType = 'quality' | 'coverage' | 'issues' | 'debt' | 'complexity';

/**
 * Confidence level for predictions
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Action button for trend cards
 */
export interface CardAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant: 'primary' | 'secondary';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Props for PredictiveTrendCard component
 */
export interface PredictiveTrendCardProps {
  /** Type of metric being predicted */
  metric: MetricType;
  /** Display label for the metric */
  metricLabel: string;
  /** Current metric value */
  currentValue: number;
  /** Projected future value */
  projectedValue: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Confidence level category */
  confidenceLevel: ConfidenceLevel;
  /** Prediction timeframe (e.g., "90d", "6mo") */
  timeframe: string;
  /** AI-generated insight text */
  insight?: string;
  /** Action buttons */
  actions?: CardAction[];
  /** Unit of measurement (e.g., "%", "hrs") */
  unit?: string;
  /** Whether increase is good (for color coding) */
  increaseIsGood?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Goal value (if set) */
  goalValue?: number;
  /** Estimated date to reach goal */
  goalDate?: string;
}

// ============================================================================
// Insight Card Types (Analytics Version)
// ============================================================================

/**
 * Priority levels for insights
 */
export type InsightPriority = 'high' | 'medium' | 'low';

/**
 * Impact estimation
 */
export interface ImpactEstimate {
  /** Minimum impact percentage */
  min: number;
  /** Maximum impact percentage */
  max: number;
  /** Unit of measurement */
  unit: string;
  /** Description of impact */
  description?: string;
}

/**
 * Effort estimation
 */
export interface EffortEstimate {
  /** Estimated hours */
  hours: number;
  /** Difficulty level */
  difficulty: 'easy' | 'moderate' | 'complex';
  /** Required skills */
  skills?: string[];
}

/**
 * Props for analytics InsightCard component
 */
export interface AnalyticsInsightCardProps {
  /** Unique identifier */
  id: string;
  /** Priority level */
  priority: InsightPriority;
  /** Insight title */
  title: string;
  /** Detailed description */
  description: string;
  /** Affected files or modules */
  affectedFiles?: string[];
  /** Estimated impact */
  impact: ImpactEstimate;
  /** Estimated effort */
  effort: EffortEstimate;
  /** Category for grouping */
  category?: string;
  /** Tags for filtering */
  tags?: string[];
  /** View details callback */
  onView?: () => void;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

// ============================================================================
// Analytics Report Types
// ============================================================================

/**
 * Complete analytics report from analyzer
 */
export interface AnalyticsReport {
  /** Risk data by file/module */
  riskData: RiskData[];
  /** Technical debt summary */
  debtSummary: {
    /** Total debt in hours */
    totalHours: number;
    /** Breakdown by category */
    byCategory: DebtSummaryByCategory[];
    /** Individual debt items */
    items: DebtItem[];
    /** Historical data for burndown */
    historical: TimeSeriesDataPoint[];
    /** Target data for burndown */
    targets: TimeSeriesDataPoint[];
  };
  /** Predictive analytics data */
  predictions: {
    /** Quality score prediction */
    quality: PredictionSummary;
    /** Coverage prediction */
    coverage: PredictionSummary;
    /** Issues prediction */
    issues: PredictionSummary;
    /** Debt prediction */
    debt: PredictionSummary;
  };
  /** Actionable insights */
  insights: AnalyticsInsight[];
  /** Report metadata */
  metadata: {
    /** ISO 8601 timestamp when generated */
    generatedAt: string;
    /** Analyzer version */
    analyzerVersion: string;
    /** Data quality score */
    dataQuality: number;
    /** Files analyzed */
    filesAnalyzed: number;
  };
}

/**
 * Prediction summary for a metric
 */
export interface PredictionSummary {
  /** Current value */
  current: number;
  /** Projected value */
  projected: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Confidence level */
  confidenceLevel: ConfidenceLevel;
  /** Timeframe in days */
  timeframeDays: number;
  /** AI-generated insight */
  insight: string;
  /** Goal value (if set) */
  goalValue?: number;
  /** Estimated date to reach goal */
  goalDate?: string;
}

/**
 * Analytics insight from analyzer
 */
export interface AnalyticsInsight {
  /** Unique identifier */
  id: string;
  /** Priority level */
  priority: InsightPriority;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Category */
  category: string;
  /** Affected files */
  affectedFiles: string[];
  /** Impact estimate */
  impact: ImpactEstimate;
  /** Effort estimate */
  effort: EffortEstimate;
  /** Tags */
  tags: string[];
  /** ISO 8601 timestamp when created */
  createdAt: string;
  /** ISO 8601 timestamp when dismissed (if applicable) */
  dismissedAt?: string;
}

// ============================================================================
// Analytics Filters
// ============================================================================

/**
 * Filter options for analytics data
 */
export interface AnalyticsFilters {
  /** Filter by risk levels */
  riskLevels?: RiskLevel[];
  /** Filter by debt categories */
  debtCategories?: DebtCategory[];
  /** Filter by insight priorities */
  insightPriorities?: InsightPriority[];
  /** Filter by minimum confidence */
  minConfidence?: number;
  /** Filter by file path pattern */
  filePattern?: string;
  /** Time range for data */
  timeRange?: AnalyticsTimeRange;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get risk level from score
 */
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'minimal';
}

/**
 * Get confidence level from score
 */
export function getConfidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * Get color for risk level
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    critical: 'var(--color-risk-critical, #b71c1c)',
    high: 'var(--color-risk-high, #e53935)',
    medium: 'var(--color-risk-medium, #ff9800)',
    low: 'var(--color-risk-low, #ffc107)',
    minimal: 'var(--color-risk-minimal, #4caf50)',
  };
  return colors[level];
}

/**
 * Get color for confidence level
 */
export function getConfidenceLevelColor(level: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    high: 'var(--color-confidence-high, #0066cc)',
    medium: 'var(--color-confidence-medium, #ff9800)',
    low: 'var(--color-confidence-low, #9e9e9e)',
  };
  return colors[level];
}

/**
 * Get color for insight priority
 */
export function getInsightPriorityColor(priority: InsightPriority): string {
  const colors: Record<InsightPriority, string> = {
    high: 'var(--color-error, #dc3545)',
    medium: 'var(--color-warning, #ff9800)',
    low: 'var(--color-info, #17a2b8)',
  };
  return colors[priority];
}

/**
 * Format timeframe for display
 */
export function formatTimeframe(timeframe: string): string {
  const mapping: Record<string, string> = {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
    '6mo': '6 months',
    '1y': '1 year',
  };
  return mapping[timeframe] || timeframe;
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 8); // 8-hour work day
  const remainingHours = hours % 8;
  if (remainingHours === 0) return `${days}d`;
  return `${days}d ${remainingHours.toFixed(0)}h`;
}
