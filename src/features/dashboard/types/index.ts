/**
 * TypeScript type definitions for the Code Inventory Dashboard
 *
 * These interfaces define the structure of data used throughout the dashboard,
 * including quality reports, coverage analysis, dependency graphs, and metrics.
 */

/**
 * Severity levels for quality issues
 * - critical: Must fix immediately (security, crashes)
 * - high: Should fix soon (performance, maintainability)
 * - medium: Should address (code smells, minor issues)
 * - low: Nice to fix (style, suggestions)
 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Quality issue detected during code analysis
 */
export interface QualityIssue {
  /** Relative file path where issue was found */
  file: string;
  /** Line number in the file */
  line: number;
  /** Severity level of the issue */
  severity: IssueSeverity;
  /** Category/type of issue (e.g., 'security', 'performance', 'best-practices') */
  category: string;
  /** Human-readable description of the issue */
  message: string;
  /** ast-grep rule or analyzer rule that detected this issue */
  rule: string;
}

/**
 * Code quality analysis report structure
 */
export interface QualityReport {
  /** ISO 8601 timestamp when analysis was run */
  timestamp: string;
  /** Total number of issues found */
  total_issues: number;
  /** Issue count breakdown by severity level */
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Issue count breakdown by category */
  by_category: Record<string, number>;
  /** List of all detected issues */
  readonly issues: readonly QualityIssue[];
}

/**
 * Test coverage information for a single function
 */
export interface FunctionCoverage {
  /** Function name */
  name: string;
  /** File path containing the function */
  file: string;
  /** Line number where function is defined */
  line: number;
  /** Whether function has associated test coverage */
  tested: boolean;
  /** Path to test file covering this function (if tested) */
  test_file?: string;
}

/**
 * File-level coverage statistics
 */
export interface FileCoverage {
  /** Total number of functions in file */
  total: number;
  /** Number of tested functions */
  tested: number;
  /** Coverage percentage (0-100) */
  percentage: number;
}

/**
 * Test coverage analysis report structure
 */
export interface CoverageReport {
  /** ISO 8601 timestamp when analysis was run */
  timestamp: string;
  /** Overall coverage percentage (0-100) */
  coverage_percentage: number;
  /** Total number of functions analyzed */
  total_functions: number;
  /** Number of functions with test coverage */
  tested_functions: number;
  /** Number of functions without test coverage */
  untested_functions: number;
  /** Coverage breakdown by file path */
  by_file: Record<string, FileCoverage>;
  /** List of all functions with coverage status */
  readonly functions: readonly FunctionCoverage[];
}

/**
 * Dependency information for a single file
 */
export interface DependencyInfo {
  /** File path */
  file: string;
  /** List of files/modules this file imports */
  readonly imports: readonly string[];
  /** List of files that import this file */
  readonly imported_by: readonly string[];
  /** Whether this file is part of a circular dependency */
  is_circular: boolean;
}

/**
 * Dependency analysis report structure
 */
export interface DependencyReport {
  /** ISO 8601 timestamp when analysis was run */
  timestamp: string;
  /** Total number of files analyzed */
  total_files: number;
  /** Total number of import statements */
  total_imports: number;
  /** List of circular dependency chains (each chain is an array of file paths) */
  readonly circular_dependencies: readonly (readonly string[])[];
  /** List of external package dependencies */
  readonly external_dependencies: readonly string[];
  /** Internal project dependency graph */
  internal_dependencies: Record<string, DependencyInfo>;
}

/**
 * High-level dashboard summary metrics
 */
export interface DashboardMetrics {
  /** Total number of files analyzed */
  totalFiles: number;
  /** Overall code quality score (0-100, higher is better) */
  qualityScore: number;
  /** Test coverage percentage (0-100) */
  coveragePercentage: number;
  /** Number of critical severity issues */
  criticalIssues: number;
  /** Number of circular dependency chains detected */
  circularDeps: number;
  /** Number of functions without test coverage */
  untestedFunctions: number;
}

/**
 * Combined dashboard data from all analysis reports
 *
 * Each report may be null if that analysis hasn't been run yet
 * or if the report file is missing/invalid.
 */
export interface DashboardData {
  /** Code quality analysis results */
  quality: QualityReport | null;
  /** Test coverage analysis results */
  coverage: CoverageReport | null;
  /** Dependency analysis results */
  dependencies: DependencyReport | null;
}

/**
 * Action item displayed in health summary
 */
export interface ActionItem {
  /** Severity level affects visual styling and priority */
  severity: 'critical' | 'warning' | 'info';
  /** Human-readable action message */
  message: string;
  /** Optional link to relevant dashboard section or external resource */
  link?: string;
}

/**
 * Overall health status for the codebase
 * - error: Critical issues requiring immediate attention
 * - warning: Issues that should be addressed soon
 * - success: No significant issues detected
 */
export type HealthStatus = 'error' | 'warning' | 'success';

/**
 * Visual status indicator for metrics
 * - default: Neutral/informational
 * - primary: Important but not alarming
 * - success: Good/healthy state
 * - warning: Attention needed
 * - error: Critical/problematic state
 */
export type MetricStatus = 'default' | 'primary' | 'success' | 'warning' | 'error';

/**
 * Chart data point for time-series or categorical visualizations
 */
export interface ChartDataPoint {
  /** X-axis value (timestamp, category name, etc.) */
  label: string;
  /** Y-axis value (count, percentage, etc.) */
  value: number;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Filter options for dashboard views
 */
export interface DashboardFilters {
  /** Filter by severity levels */
  severities?: readonly IssueSeverity[];
  /** Filter by file path pattern (glob) */
  filePattern?: string;
  /** Filter by category */
  categories?: readonly string[];
  /** Show only untested functions */
  untestedOnly?: boolean;
  /** Show only circular dependencies */
  circularOnly?: boolean;
}

/**
 * Sort configuration for data tables
 */
export interface SortConfig {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Pagination configuration for data tables
 */
export interface PaginationConfig {
  /** Current page number (0-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
}

// ============================================================================
// Python Analyzer Report Types (matching Python dataclasses)
// ============================================================================

/**
 * Quality issue from Python analyzer (code_quality.py)
 * Maps to QualityIssue dataclass
 */
export interface PythonQualityIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'code_smell' | 'security' | 'documentation' | 'best_practice';
  rule_id: string;
  message: string;
  file_path: string;
  line_number: number;
  code_snippet: string | null;
  suggestion: string | null;
}

/**
 * Quality report from Python analyzer (code_quality.py)
 * Maps to QualityReport dataclass
 */
export interface PythonQualityReport {
  total_files_scanned: number;
  total_issues: number;
  issues_by_severity: Record<string, number>;
  issues_by_category: Record<string, number>;
  issues: PythonQualityIssue[];
}

/**
 * Function info from Python analyzer (test_coverage.py)
 * Maps to FunctionInfo dataclass
 */
export interface PythonFunctionInfo {
  name: string;
  file_path: string;
  line_number: number;
  is_async: boolean;
  is_tested: boolean;
  test_file: string | null;
}

/**
 * Coverage report from Python analyzer (test_coverage.py)
 * Maps to CoverageReport dataclass
 */
export interface PythonCoverageReport {
  total_functions: number;
  tested_functions: number;
  untested_functions: number;
  coverage_percentage: number;
  functions: PythonFunctionInfo[];
  untested_by_file: Record<string, PythonFunctionInfo[]>;
}

/**
 * Dependency info from Python analyzer (dependencies.py)
 * Maps to DependencyInfo dataclass
 */
export interface PythonDependencyInfo {
  package: string;
  import_type: 'static' | 'dynamic' | 'require' | 'type_only';
  file_path: string;
  line_number: number;
  is_external: boolean;
}

/**
 * Dependency report from Python analyzer (dependencies.py)
 * Maps to DependencyReport dataclass
 */
export interface PythonDependencyReport {
  total_dependencies: number;
  external_dependencies: number;
  internal_dependencies: number;
  dependencies_by_file: Record<string, PythonDependencyInfo[]>;
  dependency_graph: Record<string, string[]>;
  circular_dependencies: string[][];
  unused_dependencies: string[];
}

/**
 * Combined Python analyzer reports
 */
export interface PythonAnalyzerData {
  quality: PythonQualityReport | null;
  coverage: PythonCoverageReport | null;
  dependencies: PythonDependencyReport | null;
}

// ============================================================================
// API Error Types
// ============================================================================

export interface ReportLoadError {
  reportType: 'quality' | 'coverage' | 'dependencies';
  error: string;
  path: string;
}

export interface LoadReportsResult {
  data: PythonAnalyzerData;
  errors: ReportLoadError[];
}

// ============================================================================
// Phase 4 Type Exports
// ============================================================================

// Phase 4A: AI-Powered Insights
export * from './insights';

// Phase 4B: Predictive Analytics
export * from './predictions';

// Phase 4D: Team Collaboration
export * from './collaboration';
