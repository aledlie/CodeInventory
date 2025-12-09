/**
 * Chart Data Types for Phase 3 Visualizations
 *
 * Defines TypeScript interfaces for trend charts, historical data,
 * and Chart.js configuration types used throughout the dashboard.
 */

import type { ChartOptions, ChartData } from 'chart.js';

// ============================================================================
// Historical Data Types
// ============================================================================

/**
 * Single analysis run metadata
 */
export interface AnalysisRun {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Unique identifier for this run */
  runId: string;
  /** Aggregated metrics snapshot */
  metrics: {
    qualityScore: number;
    coveragePercentage: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    circularDeps: number;
    totalFiles: number;
    testedFunctions: number;
    untestedFunctions: number;
  };
  /** Optional notes about this run */
  notes?: string;
  /** Git commit hash if available */
  commitHash?: string;
  /** References to full report files */
  reportPaths: {
    quality: string;
    coverage: string;
    dependencies: string;
  };
}

/**
 * Manifest file structure for historical runs
 */
export interface HistoryManifest {
  /** List of all analysis runs */
  runs: AnalysisRun[];
  /** Timestamp of first run */
  firstRun: string;
  /** Timestamp of most recent run */
  lastRun: string;
  /** Total number of runs */
  totalRuns: number;
  /** Repository metadata */
  repository?: {
    name: string;
    url?: string;
    branch?: string;
  };
}

/**
 * Time range filter for trend charts (Phase 3)
 * Note: Different from Phase 4C visualizations TimeRange
 */
export type ChartTimeRange = '7d' | '30d' | '90d' | 'all';

/**
 * Trend direction indicator (Phase 3)
 */
export type ChartTrendDirection = 'improving' | 'stable' | 'declining';

/**
 * Trend summary statistics
 */
export interface TrendSummary {
  /** Overall trend direction */
  trend: ChartTrendDirection;
  /** Percentage change from first to last */
  changePercentage: number;
  /** Standard deviation (volatility) */
  volatility: number;
  /** Average value across time range */
  average: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
}

/**
 * Time-series data for a single metric
 */
export interface TrendData {
  /** Metric identifier */
  metricKey: string;
  /** Display name */
  metricName: string;
  /** Time range filter applied */
  timeRange: ChartTimeRange;
  /** Data points ordered by timestamp */
  dataPoints: Array<{
    timestamp: string;
    value: number;
    label?: string; // Formatted date for display
  }>;
  /** Statistical summary */
  summary: TrendSummary;
}

// ============================================================================
// Chart.js Configuration Types
// ============================================================================

/**
 * Chart color scheme for consistent theming
 */
export interface ChartColorScheme {
  /** Primary line/bar color */
  primary: string;
  /** Secondary color for comparisons */
  secondary: string;
  /** Success/positive indicator */
  success: string;
  /** Warning indicator */
  warning: string;
  /** Error/negative indicator */
  error: string;
  /** Neutral/info color */
  info: string;
  /** Background fill (with alpha) */
  backgroundFill: string;
  /** Grid line color */
  gridColor: string;
  /** Text color */
  textColor: string;
}

/**
 * Generic chart data point
 */
export interface ChartDataPoint {
  /** X-axis value (typically timestamp or label) */
  x: string | number | Date;
  /** Y-axis value */
  y: number;
  /** Optional metadata for tooltips */
  metadata?: Record<string, unknown>;
}

/**
 * Quality trend chart specific data
 */
export interface QualityTrendData {
  /** Chart labels (dates) */
  labels: string[];
  /** Quality score values (0-100) */
  scores: number[];
  /** Issue counts by severity at each point */
  issueBreakdown?: Array<{
    timestamp: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
}

/**
 * Coverage trend chart specific data
 */
export interface CoverageTrendData {
  /** Chart labels (dates) */
  labels: string[];
  /** Coverage percentage values (0-100) */
  coveragePercentages: number[];
  /** Total function counts at each point */
  totalFunctions: number[];
  /** Tested function counts at each point */
  testedFunctions: number[];
}

/**
 * Issue velocity chart specific data (stacked area)
 */
export interface IssueVelocityData {
  /** Chart labels (dates) */
  labels: string[];
  /** Stacked datasets by severity */
  datasets: {
    critical: number[];
    high: number[];
    medium: number[];
    low: number[];
  };
}

/**
 * Circular dependencies trend chart data
 */
export interface CircularDepsTrendData {
  /** Chart labels (dates) */
  labels: string[];
  /** Number of circular dependency chains */
  circularCounts: number[];
  /** Goal/target value (typically 0) */
  targetValue: number;
}

// ============================================================================
// Chart Component Props
// ============================================================================

/**
 * Base props for all chart components
 */
export interface BaseChartProps {
  /** Chart title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Chart height in pixels */
  height?: number;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Show legend */
  showLegend?: boolean;
  /** Enable animations */
  animated?: boolean;
  /** Custom color scheme */
  colorScheme?: Partial<ChartColorScheme>;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Line chart component props
 */
export interface LineChartProps extends BaseChartProps {
  /** Chart data */
  data: ChartData<'line'>;
  /** Chart options */
  options?: ChartOptions<'line'>;
  /** Show threshold lines (e.g., 80% target) */
  thresholds?: Array<{
    value: number;
    label: string;
    color: string;
  }>;
  /** Show annotations for specific points */
  annotations?: Array<{
    x: number;
    label: string;
    color?: string;
  }>;
}

/**
 * Stacked area chart component props
 */
export interface StackedAreaChartProps extends BaseChartProps {
  /** Chart data */
  data: ChartData<'line'>;
  /** Chart options */
  options?: ChartOptions<'line'>;
  /** Enable stacking */
  stacked?: boolean;
}

/**
 * Bar chart component props
 */
export interface BarChartProps extends BaseChartProps {
  /** Chart data */
  data: ChartData<'bar'>;
  /** Chart options */
  options?: ChartOptions<'bar'>;
  /** Horizontal or vertical bars */
  orientation?: 'horizontal' | 'vertical';
  /** Show goal line */
  goalLine?: {
    value: number;
    label: string;
    color: string;
  };
}

/**
 * Radar chart component props
 */
export interface RadarChartProps extends BaseChartProps {
  /** Chart data */
  data: ChartData<'radar'>;
  /** Chart options */
  options?: ChartOptions<'radar'>;
  /** Maximum number of dimensions */
  maxDimensions?: number;
}

/**
 * Doughnut chart component props
 */
export interface DoughnutChartProps extends BaseChartProps {
  /** Chart data */
  data: ChartData<'doughnut'>;
  /** Chart options */
  options?: ChartOptions<'doughnut'>;
  /** Center text to display */
  centerText?: {
    primary: string;
    secondary?: string;
  };
}

// ============================================================================
// Chart Data Transformation Utilities
// ============================================================================

/**
 * Transform analysis runs into trend data
 */
export type TrendDataTransformer = (
  runs: AnalysisRun[],
  timeRange: ChartTimeRange
) => TrendData;

/**
 * Format timestamp for chart labels
 */
export type TimestampFormatter = (
  timestamp: string,
  format: 'short' | 'long' | 'relative'
) => string;

/**
 * Calculate delta between two values
 */
export interface DeltaCalculation {
  /** Absolute difference */
  absolute: number;
  /** Percentage change */
  percentage: number;
  /** Direction of change */
  direction: 'increase' | 'decrease' | 'stable';
  /** Is this change positive (depends on metric type) */
  isImprovement: boolean;
}

// ============================================================================
// Sparkline Types (Micro Charts)
// ============================================================================

/**
 * Sparkline configuration (compact trend visualization)
 */
export interface SparklineConfig {
  /** Data points */
  data: number[];
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Line color */
  color: string;
  /** Fill area under line */
  fill?: boolean;
  /** Fill color (with alpha) */
  fillColor?: string;
  /** Show current value */
  showValue?: boolean;
  /** Show change indicator */
  showDelta?: boolean;
}

/**
 * Sparkline data point with metadata
 */
export interface SparklineDataPoint {
  /** Value */
  value: number;
  /** Timestamp */
  timestamp: string;
  /** Optional label */
  label?: string;
}

// ============================================================================
// Chart Theme Configuration
// ============================================================================

/**
 * Complete chart theme configuration
 */
export interface ChartTheme {
  /** Color schemes for different contexts */
  colors: {
    default: ChartColorScheme;
    dark: ChartColorScheme;
    highContrast: ChartColorScheme;
  };
  /** Typography settings */
  typography: {
    fontFamily: string;
    fontSize: {
      title: number;
      label: number;
      legend: number;
      tooltip: number;
    };
  };
  /** Spacing settings */
  spacing: {
    padding: number;
    legendSpacing: number;
    tickPadding: number;
  };
  /** Animation settings */
  animation: {
    duration: number;
    easing: string;
    delay: number;
  };
  /** Grid settings */
  grid: {
    display: boolean;
    color: string;
    lineWidth: number;
  };
}

// ============================================================================
// Advanced Chart Features
// ============================================================================

/**
 * Chart zoom configuration
 */
export interface ChartZoomConfig {
  /** Enable zoom */
  enabled: boolean;
  /** Zoom mode (x, y, or xy) */
  mode: 'x' | 'y' | 'xy';
  /** Enable pan */
  pan: boolean;
  /** Zoom limits */
  limits?: {
    x?: { min: number; max: number };
    y?: { min: number; max: number };
  };
}

/**
 * Chart export configuration
 */
export interface ChartExportConfig {
  /** Export format */
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  /** Export filename */
  filename?: string;
  /** Image quality (for jpg) */
  quality?: number;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Chart annotation
 */
export interface ChartAnnotation {
  /** Annotation type */
  type: 'line' | 'box' | 'point' | 'label';
  /** X-axis value or range */
  x: number | [number, number];
  /** Y-axis value or range */
  y?: number | [number, number];
  /** Label text */
  label?: string;
  /** Color */
  color: string;
  /** Border style */
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  /** Border width */
  borderWidth?: number;
}

// ============================================================================
// Chart State Management
// ============================================================================

/**
 * Chart interaction state
 */
export interface ChartInteractionState {
  /** Currently hovered data point index */
  hoveredIndex: number | null;
  /** Selected data point indices */
  selectedIndices: number[];
  /** Zoom level */
  zoomLevel: number;
  /** Pan offset */
  panOffset: { x: number; y: number };
  /** Visible time range (after zoom/pan) */
  visibleRange?: {
    start: string;
    end: string;
  };
}

/**
 * Chart filter state
 */
export interface ChartFilterState {
  /** Time range filter */
  timeRange: ChartTimeRange;
  /** Metric filter (which metrics to show) */
  metrics: string[];
  /** Severity filter (for issue charts) */
  severities?: ('critical' | 'high' | 'medium' | 'low')[];
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Chart render performance metrics
 */
export interface ChartPerformanceMetrics {
  /** Time to render chart (ms) */
  renderTime: number;
  /** Number of data points */
  dataPointCount: number;
  /** Frame rate during interactions */
  fps: number;
  /** Memory usage (bytes) */
  memoryUsage?: number;
}
