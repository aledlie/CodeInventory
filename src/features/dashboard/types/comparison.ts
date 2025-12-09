/**
 * Historical Comparison Types for Phase 3 Visualizations
 *
 * Defines TypeScript interfaces for comparing different analysis runs,
 * calculating deltas, and generating comparison reports.
 */

import type { AnalysisRun } from './charts';
import type {
  PythonQualityReport,
  PythonCoverageReport,
  PythonDependencyReport,
} from '../types';

// ============================================================================
// Comparison Data Structures
// ============================================================================

/**
 * Delta calculation between two values
 */
export interface Delta {
  /** Previous value */
  previous: number;
  /** Current value */
  current: number;
  /** Absolute difference */
  absolute: number;
  /** Percentage change */
  percentage: number;
  /** Direction of change */
  direction: 'increase' | 'decrease' | 'stable';
  /** Whether this change is positive (depends on metric) */
  isImprovement: boolean;
}

/**
 * Metric comparison between two runs
 */
export interface MetricComparison {
  /** Metric name */
  name: string;
  /** Metric key */
  key: string;
  /** Delta calculation */
  delta: Delta;
  /** Visualization color */
  color: 'success' | 'warning' | 'error' | 'info';
  /** Unit of measurement */
  unit: string;
  /** Formatted display value */
  displayValue: string;
  /** Trend indicator */
  trend: 'up' | 'down' | 'stable';
}

/**
 * Comparison between two analysis runs
 */
export interface RunComparison {
  /** Baseline run (older) */
  baseline: AnalysisRun;
  /** Current run (newer) */
  current: AnalysisRun;
  /** Time elapsed between runs */
  timeElapsed: {
    days: number;
    hours: number;
    formatted: string; // "5 days ago"
  };
  /** High-level metric comparisons */
  metrics: {
    qualityScore: MetricComparison;
    coveragePercentage: MetricComparison;
    criticalIssues: MetricComparison;
    highIssues: MetricComparison;
    mediumIssues: MetricComparison;
    lowIssues: MetricComparison;
    circularDeps: MetricComparison;
    totalFiles: MetricComparison;
    testedFunctions: MetricComparison;
    untestedFunctions: MetricComparison;
  };
  /** Overall assessment */
  assessment: {
    /** Overall trend */
    trend: 'improving' | 'stable' | 'declining';
    /** Summary score (0-100) */
    score: number;
    /** Key highlights */
    highlights: string[];
    /** Key concerns */
    concerns: string[];
  };
}

/**
 * Detailed comparison including full reports
 */
export interface DetailedRunComparison extends RunComparison {
  /** Detailed quality comparison */
  qualityDetails?: QualityComparison;
  /** Detailed coverage comparison */
  coverageDetails?: CoverageComparison;
  /** Detailed dependency comparison */
  dependencyDetails?: DependencyComparison;
}

// ============================================================================
// Quality Comparison
// ============================================================================

/**
 * Issue category comparison
 */
export interface IssueCategoryComparison {
  /** Category name */
  category: string;
  /** Issues in baseline */
  baseline: number;
  /** Issues in current */
  current: number;
  /** Delta */
  delta: Delta;
  /** New issues in this category */
  newIssues: number;
  /** Resolved issues in this category */
  resolvedIssues: number;
}

/**
 * Severity level comparison
 */
export interface SeverityComparison {
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Count in baseline */
  baseline: number;
  /** Count in current */
  current: number;
  /** Delta */
  delta: Delta;
}

/**
 * Individual issue change
 */
export interface IssueChange {
  /** Change type */
  type: 'new' | 'resolved' | 'modified';
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Severity */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Category */
  category: string;
  /** Message */
  message: string;
  /** Rule ID */
  ruleId: string;
  /** For modified issues, show previous state */
  previous?: {
    line: number;
    severity: string;
    message: string;
  };
}

/**
 * Quality comparison between two runs
 */
export interface QualityComparison {
  /** Baseline report */
  baseline: PythonQualityReport;
  /** Current report */
  current: PythonQualityReport;
  /** Overall delta */
  overallDelta: Delta;
  /** Comparison by severity */
  bySeverity: SeverityComparison[];
  /** Comparison by category */
  byCategory: IssueCategoryComparison[];
  /** Issue changes */
  changes: {
    /** Newly introduced issues */
    newIssues: IssueChange[];
    /** Resolved issues */
    resolvedIssues: IssueChange[];
    /** Modified issues */
    modifiedIssues: IssueChange[];
  };
  /** Summary statistics */
  summary: {
    /** Total issues resolved */
    totalResolved: number;
    /** Total new issues */
    totalNew: number;
    /** Net change */
    netChange: number;
    /** Files affected */
    filesAffected: number;
  };
}

// ============================================================================
// Coverage Comparison
// ============================================================================

/**
 * File coverage comparison
 */
export interface FileCoverageComparison {
  /** File path */
  file: string;
  /** Coverage in baseline */
  baselineCoverage: number;
  /** Coverage in current */
  currentCoverage: number;
  /** Delta */
  delta: Delta;
  /** Functions in baseline */
  baselineFunctions: number;
  /** Functions in current */
  currentFunctions: number;
  /** New functions added */
  newFunctions: number;
  /** Functions removed */
  removedFunctions: number;
}

/**
 * Function coverage change
 */
export interface FunctionCoverageChange {
  /** Change type */
  type: 'newly-tested' | 'newly-untested' | 'new-function' | 'removed-function';
  /** Function name */
  name: string;
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Test file (if tested) */
  testFile?: string;
}

/**
 * Coverage comparison between two runs
 */
export interface CoverageComparison {
  /** Baseline report */
  baseline: PythonCoverageReport;
  /** Current report */
  current: PythonCoverageReport;
  /** Overall coverage delta */
  coverageDelta: Delta;
  /** Total functions delta */
  totalFunctionsDelta: Delta;
  /** Tested functions delta */
  testedFunctionsDelta: Delta;
  /** Comparison by file */
  byFile: FileCoverageComparison[];
  /** Function changes */
  changes: {
    /** Newly tested functions */
    newlyTested: FunctionCoverageChange[];
    /** Newly untested functions */
    newlyUntested: FunctionCoverageChange[];
    /** New functions added */
    newFunctions: FunctionCoverageChange[];
    /** Functions removed */
    removedFunctions: FunctionCoverageChange[];
  };
  /** Summary statistics */
  summary: {
    /** Functions that gained tests */
    functionsGainedTests: number;
    /** Functions that lost tests */
    functionsLostTests: number;
    /** New functions without tests */
    newFunctionsWithoutTests: number;
    /** Files with improved coverage */
    filesImproved: number;
    /** Files with degraded coverage */
    filesDegraded: number;
  };
}

// ============================================================================
// Dependency Comparison
// ============================================================================

/**
 * Dependency change
 */
export interface DependencyChange {
  /** Change type */
  type: 'added' | 'removed' | 'modified';
  /** Package/module name */
  package: string;
  /** Import type */
  importType: 'static' | 'dynamic' | 'require' | 'type_only';
  /** File where change occurred */
  file: string;
  /** Whether it's external */
  isExternal: boolean;
}

/**
 * Circular dependency change
 */
export interface CircularDependencyChange {
  /** Change type */
  type: 'resolved' | 'introduced' | 'modified';
  /** Node chain */
  chain: string[];
  /** Chain length */
  length: number;
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Dependency comparison between two runs
 */
export interface DependencyComparison {
  /** Baseline report */
  baseline: PythonDependencyReport;
  /** Current report */
  current: PythonDependencyReport;
  /** Total dependencies delta */
  totalDependenciesDelta: Delta;
  /** External dependencies delta */
  externalDependenciesDelta: Delta;
  /** Internal dependencies delta */
  internalDependenciesDelta: Delta;
  /** Circular dependencies delta */
  circularDependenciesDelta: Delta;
  /** Dependency changes */
  changes: {
    /** Added dependencies */
    added: DependencyChange[];
    /** Removed dependencies */
    removed: DependencyChange[];
    /** Modified dependencies */
    modified: DependencyChange[];
  };
  /** Circular dependency changes */
  circularChanges: {
    /** Resolved circular dependencies */
    resolved: CircularDependencyChange[];
    /** Newly introduced circular dependencies */
    introduced: CircularDependencyChange[];
  };
  /** Summary statistics */
  summary: {
    /** Dependencies added */
    dependenciesAdded: number;
    /** Dependencies removed */
    dependenciesRemoved: number;
    /** Circular dependencies resolved */
    circularResolved: number;
    /** Circular dependencies introduced */
    circularIntroduced: number;
    /** Files with new dependencies */
    filesWithNewDeps: number;
  };
}

// ============================================================================
// Waterfall Chart Data
// ============================================================================

/**
 * Waterfall chart segment (for delta visualization)
 */
export interface WaterfallSegment {
  /** Segment label */
  label: string;
  /** Value (positive for increases, negative for decreases) */
  value: number;
  /** Cumulative value at this point */
  cumulative: number;
  /** Segment color */
  color: string;
  /** Segment type */
  type: 'increase' | 'decrease' | 'total';
  /** Additional metadata */
  metadata?: {
    /** Category or reason for change */
    category?: string;
    /** Affected items count */
    affectedItems?: number;
    /** Explanation */
    explanation?: string;
  };
}

/**
 * Waterfall chart data structure
 */
export interface WaterfallChartData {
  /** Chart title */
  title: string;
  /** Starting value */
  start: number;
  /** Ending value */
  end: number;
  /** Segments showing changes */
  segments: WaterfallSegment[];
  /** Unit of measurement */
  unit: string;
}

// ============================================================================
// Radar Chart Data
// ============================================================================

/**
 * Radar chart dimension (axis)
 */
export interface RadarDimension {
  /** Dimension name */
  name: string;
  /** Dimension key */
  key: string;
  /** Value for baseline run */
  baselineValue: number;
  /** Value for current run */
  currentValue: number;
  /** Maximum value for this dimension */
  maxValue: number;
  /** Whether higher is better */
  higherIsBetter: boolean;
}

/**
 * Radar chart data for multi-dimensional comparison
 */
export interface RadarChartData {
  /** Chart title */
  title: string;
  /** Dimensions (axes) */
  dimensions: RadarDimension[];
  /** Dataset labels */
  labels: [string, string]; // [baseline, current]
  /** Colors for datasets */
  colors: [string, string];
}

// ============================================================================
// Sparkline Matrix Data
// ============================================================================

/**
 * Sparkline data for metric trend
 */
export interface SparklineData {
  /** Metric name */
  metric: string;
  /** Metric key */
  key: string;
  /** Recent values (last 10 runs) */
  values: number[];
  /** Current value */
  currentValue: number;
  /** Delta from previous */
  delta: Delta;
  /** Trend shape */
  trend: 'up' | 'down' | 'stable' | 'volatile';
  /** Color based on improvement */
  color: string;
}

/**
 * Sparkline matrix data structure
 */
export interface SparklineMatrixData {
  /** Title */
  title: string;
  /** Sparklines for each metric */
  sparklines: SparklineData[];
  /** Time range covered */
  timeRange: string; // "Last 10 runs"
}

// ============================================================================
// AI-Generated Insights
// ============================================================================

/**
 * Comparison AI insight type (Phase 3)
 * Note: Different from Phase 4 InsightType which is for the full insights system
 */
export type ComparisonInsightType =
  | 'improvement'    // Positive change
  | 'concern'        // Negative change
  | 'recommendation' // Suggested action
  | 'observation';   // Neutral observation

/**
 * AI-generated comparison insight (Phase 3)
 * Note: Different from Phase 4 AIInsight which has more fields
 */
export interface ComparisonAIInsight {
  /** Insight type */
  type: ComparisonInsightType;
  /** Severity/priority */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Title/summary */
  title: string;
  /** Detailed explanation */
  description: string;
  /** Supporting metrics */
  metrics?: Array<{
    name: string;
    value: string;
  }>;
  /** Suggested actions */
  actions?: string[];
  /** Confidence score (0-100) */
  confidence?: number;
}

/**
 * Complete AI-generated comparison summary
 */
export interface AIComparisonSummary {
  /** Overall assessment */
  overallAssessment: string;
  /** Key improvements */
  improvements: ComparisonAIInsight[];
  /** Areas needing attention */
  concerns: ComparisonAIInsight[];
  /** Recommendations */
  recommendations: ComparisonAIInsight[];
  /** Additional observations */
  observations: ComparisonAIInsight[];
  /** Overall score (0-100) */
  overallScore: number;
  /** Generated timestamp */
  generatedAt: string;
}

// ============================================================================
// Comparison Component Props
// ============================================================================

/**
 * Main comparison view component props
 */
export interface ComparisonViewProps {
  /** Run comparison data */
  comparison: DetailedRunComparison;
  /** Show AI insights */
  showAIInsights?: boolean;
  /** AI summary (if generated) */
  aiSummary?: AIComparisonSummary;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
}

/**
 * Run selector component props
 */
export interface RunSelectorProps {
  /** Available runs */
  runs: AnalysisRun[];
  /** Selected baseline run ID */
  baselineRunId: string | null;
  /** Selected current run ID */
  currentRunId: string | null;
  /** Callbacks */
  onBaselineSelect: (runId: string) => void;
  onCurrentSelect: (runId: string) => void;
  /** Disable current before baseline */
  enforceChronological?: boolean;
}

/**
 * Side-by-side cards component props
 */
export interface SideBySideCardsProps {
  /** Run comparison */
  comparison: RunComparison;
  /** Metrics to display */
  metrics?: string[];
}

/**
 * Delta waterfall component props
 */
export interface DeltaWaterfallProps {
  /** Waterfall data */
  data: WaterfallChartData;
  /** Chart height */
  height?: number;
  /** Show annotations */
  showAnnotations?: boolean;
}

/**
 * Radar comparison component props
 */
export interface RadarComparisonProps {
  /** Radar data */
  data: RadarChartData;
  /** Chart size */
  size?: number;
  /** Show values on hover */
  showValues?: boolean;
}

/**
 * Sparkline matrix component props
 */
export interface SparklineMatrixProps {
  /** Sparkline data */
  data: SparklineMatrixData;
  /** Show delta indicators */
  showDeltas?: boolean;
  /** On metric click callback */
  onMetricClick?: (metricKey: string) => void;
}

/**
 * Issues diff component props
 */
export interface IssuesDiffProps {
  /** Quality comparison */
  qualityComparison: QualityComparison;
  /** Filter by change type */
  changeTypeFilter?: ('new' | 'resolved' | 'modified')[];
  /** Filter by severity */
  severityFilter?: ('critical' | 'high' | 'medium' | 'low')[];
}

/**
 * Files diff component props
 */
export interface FilesDiffProps {
  /** Baseline run */
  baseline: AnalysisRun;
  /** Current run */
  current: AnalysisRun;
  /** Show file tree */
  showTree?: boolean;
  /** Expand all by default */
  expandAll?: boolean;
}

/**
 * Comparison summary component props
 */
export interface ComparisonSummaryProps {
  /** Run comparison */
  comparison: RunComparison;
  /** AI-generated summary */
  aiSummary?: AIComparisonSummary;
  /** Show detailed metrics */
  showDetails?: boolean;
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Calculate delta between two values
 */
export type DeltaCalculator = (
  previous: number,
  current: number,
  options?: {
    /** Lower is better (e.g., for issue counts) */
    lowerIsBetter?: boolean;
    /** Threshold for "stable" (% change) */
    stableThreshold?: number;
  }
) => Delta;

/**
 * Calculate time elapsed between two timestamps
 */
export type TimeElapsedCalculator = (
  start: string,
  end: string
) => {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
};

/**
 * Generate waterfall chart data from comparison
 */
export type WaterfallDataGenerator = (
  comparison: RunComparison,
  metricKey: string
) => WaterfallChartData;

/**
 * Generate radar chart data from comparison
 */
export type RadarDataGenerator = (
  comparison: RunComparison,
  dimensions?: string[]
) => RadarChartData;

/**
 * Generate sparkline matrix data from historical runs
 */
export type SparklineMatrixGenerator = (
  runs: AnalysisRun[],
  count?: number
) => SparklineMatrixData;

// ============================================================================
// Simple Snapshot Types (for API)
// ============================================================================

/**
 * Simple snapshot for quick comparisons
 */
export interface Snapshot {
  date: string;
  timestamp: string;
  metrics: {
    quality: {
      score: number;
      issues: {
        critical: number;
        major: number;
        minor: number;
      };
      maintainabilityIndex: number;
      technicalDebt: number;
    };
    coverage: {
      overall: number;
      unit: number;
      integration: number;
      e2e: number;
      untestedFiles: number;
    };
    dependencies: {
      total: number;
      outdated: number;
      vulnerable: number;
      circular: number;
    };
  };
}

/**
 * Simple metric diff for comparison cards
 */
export interface MetricDiff {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Simple comparison result for the comparison page
 */
export interface SimpleComparisonResult {
  currentDate: string;
  previousDate: string;
  quality: {
    score: MetricDiff;
    criticalIssues: MetricDiff;
    majorIssues: MetricDiff;
    minorIssues: MetricDiff;
    maintainabilityIndex: MetricDiff;
    technicalDebt: MetricDiff;
  };
  coverage: {
    overall: MetricDiff;
    unit: MetricDiff;
    integration: MetricDiff;
    e2e: MetricDiff;
    untestedFiles: MetricDiff;
  };
  dependencies: {
    total: MetricDiff;
    outdated: MetricDiff;
    vulnerable: MetricDiff;
    circular: MetricDiff;
  };
}

/**
 * Comparison time range presets
 */
export type ComparisonPreset = 'day' | 'week' | 'month' | 'quarter' | 'custom';
