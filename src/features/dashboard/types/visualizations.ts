/**
 * Phase 4C: Custom Visualization Types
 *
 * Type definitions for the drag-and-drop visualization builder.
 */

/**
 * Available chart types for visualizations
 */
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'radar';

/**
 * Available metrics that can be visualized
 */
export type VisualizationMetric =
  | 'qualityScore'
  | 'coveragePercentage'
  | 'issueCount'
  | 'criticalIssues'
  | 'circularDeps'
  | 'untestedFunctions'
  | 'totalFiles'
  | 'totalDependencies';

/**
 * Time range options
 */
export type TimeRange = '7d' | '14d' | '30d' | '60d' | '90d' | 'custom';

/**
 * Aggregation options for time-series data
 */
export type Aggregation = 'daily' | 'weekly' | 'monthly';

/**
 * Single metric configuration in a visualization
 */
export interface MetricConfig {
  /** Metric identifier */
  metric: VisualizationMetric;
  /** Display label */
  label: string;
  /** Line/bar color */
  color: string;
  /** Whether to show this metric */
  visible: boolean;
  /** Y-axis (primary or secondary) */
  yAxis: 'left' | 'right';
}

/**
 * Visualization configuration
 */
export interface VisualizationConfig {
  /** Unique identifier */
  id: string;
  /** User-defined title */
  title: string;
  /** Description */
  description?: string;
  /** Chart type */
  chartType: ChartType;
  /** Metrics to display */
  metrics: MetricConfig[];
  /** Time range filter */
  timeRange: TimeRange;
  /** Custom date range (if timeRange is 'custom') */
  customDateRange?: {
    start: string;
    end: string;
  };
  /** Data aggregation */
  aggregation: Aggregation;
  /** Whether to show legend */
  showLegend: boolean;
  /** Whether to show grid */
  showGrid: boolean;
  /** Whether to show data labels */
  showDataLabels: boolean;
  /** User who created this visualization */
  createdBy?: string;
  /** ISO 8601 timestamp when created */
  createdAt: string;
  /** ISO 8601 timestamp when last modified */
  updatedAt: string;
}

/**
 * Drag item type for react-dnd
 */
export interface DragItem {
  type: 'metric' | 'chartType';
  id: string;
  label: string;
}

/**
 * Drop result from canvas
 */
export interface DropResult {
  dropped: boolean;
  targetId: string;
}

/**
 * Builder state
 */
export interface BuilderState {
  /** Current visualization being edited */
  visualization: VisualizationConfig;
  /** Whether the visualization has unsaved changes */
  isDirty: boolean;
  /** Whether the builder is in preview mode */
  isPreview: boolean;
  /** Selected element for editing */
  selectedElement: 'chart' | 'legend' | 'title' | null;
}

/**
 * Saved visualization reference
 */
export interface SavedVisualization {
  /** Unique identifier */
  id: string;
  /** User-defined title */
  title: string;
  /** Thumbnail preview URL */
  thumbnailUrl?: string;
  /** ISO 8601 timestamp when created */
  createdAt: string;
  /** ISO 8601 timestamp when last modified */
  updatedAt: string;
  /** Whether this is a favorite */
  isFavorite: boolean;
}

/**
 * Export format options
 */
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  width?: number;
  height?: number;
  quality?: number;
  includeTitle?: boolean;
  includeLegend?: boolean;
  backgroundColor?: string;
}

/**
 * Available metric metadata
 */
export interface MetricMetadata {
  id: VisualizationMetric;
  label: string;
  description: string;
  unit: string;
  color: string;
  category: 'quality' | 'coverage' | 'dependencies' | 'performance';
}

/**
 * Chart type metadata
 */
export interface ChartTypeMetadata {
  id: ChartType;
  label: string;
  description: string;
  icon: string;
  supportedMetrics: number; // max number of metrics
}
