/**
 * Dashboard API Service Layer
 *
 * Handles loading JSON report files from the Python analyzers.
 * Provides type-safe access to quality, coverage, and dependency reports.
 *
 * The Python analyzers output reports with a nested 'summary' structure,
 * which this API transforms into the flat TypeScript interface format.
 *
 * Expected file structure:
 * - /data/quality/quality_report.json (served from public/)
 * - /data/coverage/coverage_report.json
 * - /data/dependencies/dependency_report.json
 */

import type {
  PythonQualityReport,
  PythonCoverageReport,
  PythonDependencyReport,
  PythonAnalyzerData,
  ReportLoadError,
  LoadReportsResult,
  PythonQualityIssue,
  PythonFunctionInfo,
  PythonDependencyInfo,
} from '../types';

// ============================================================================
// Raw Python Output Types (with nested summary)
// ============================================================================

interface RawQualityReport {
  summary: {
    total_files_scanned: number;
    total_issues: number;
    issues_by_severity: Record<string, number>;
    issues_by_category: Record<string, number>;
  };
  issues: PythonQualityIssue[];
}

interface RawCoverageReport {
  summary: {
    source_directory: string;
    test_directory: string;
    total_functions: number;
    tested_functions: number;
    untested_functions: number;
    coverage_percentage: number;
  };
  functions: PythonFunctionInfo[];
  untested_by_file?: Record<string, PythonFunctionInfo[]>;
}

interface RawDependencyReport {
  summary: {
    root_directory: string;
    total_dependencies: number;
    external_dependencies: number;
    internal_dependencies: number;
    files_analyzed: number;
    circular_dependencies_count: number;
  };
  dependencies_by_file: Record<string, PythonDependencyInfo[]>;
  dependency_graph?: Record<string, string[]>;
  circular_dependencies: string[][];
  unused_dependencies?: string[];
}

// ============================================================================
// Transform Functions (Raw -> TypeScript Interface)
// ============================================================================

function transformQualityReport(raw: RawQualityReport): PythonQualityReport {
  return {
    total_files_scanned: raw.summary.total_files_scanned,
    total_issues: raw.summary.total_issues,
    issues_by_severity: raw.summary.issues_by_severity,
    issues_by_category: raw.summary.issues_by_category,
    issues: raw.issues,
  };
}

function transformCoverageReport(raw: RawCoverageReport): PythonCoverageReport {
  return {
    total_functions: raw.summary.total_functions,
    tested_functions: raw.summary.tested_functions,
    untested_functions: raw.summary.untested_functions,
    coverage_percentage: raw.summary.coverage_percentage,
    functions: raw.functions,
    untested_by_file: raw.untested_by_file || {},
  };
}

function transformDependencyReport(raw: RawDependencyReport): PythonDependencyReport {
  return {
    total_dependencies: raw.summary.total_dependencies,
    external_dependencies: raw.summary.external_dependencies,
    internal_dependencies: raw.summary.internal_dependencies,
    dependencies_by_file: raw.dependencies_by_file,
    dependency_graph: raw.dependency_graph || {},
    circular_dependencies: raw.circular_dependencies,
    unused_dependencies: raw.unused_dependencies || [],
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Parse JSON with proper error handling
 */
function parseJSON<T>(text: string, reportType: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse ${reportType} JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate raw quality report structure (with nested summary)
 */
function validateRawQualityReport(data: unknown): data is RawQualityReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as { summary?: unknown; issues?: unknown };
  if (typeof report.summary !== 'object' || report.summary === null) {
    return false;
  }
  const summary = report.summary as Record<string, unknown>;
  return (
    typeof summary.total_files_scanned === 'number' &&
    typeof summary.total_issues === 'number' &&
    typeof summary.issues_by_severity === 'object' &&
    typeof summary.issues_by_category === 'object' &&
    Array.isArray(report.issues)
  );
}

/**
 * Validate raw coverage report structure (with nested summary)
 */
function validateRawCoverageReport(data: unknown): data is RawCoverageReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as { summary?: unknown; functions?: unknown };
  if (typeof report.summary !== 'object' || report.summary === null) {
    return false;
  }
  const summary = report.summary as Record<string, unknown>;
  return (
    typeof summary.total_functions === 'number' &&
    typeof summary.tested_functions === 'number' &&
    typeof summary.untested_functions === 'number' &&
    typeof summary.coverage_percentage === 'number' &&
    Array.isArray(report.functions)
  );
}

/**
 * Validate raw dependency report structure (with nested summary)
 */
function validateRawDependencyReport(data: unknown): data is RawDependencyReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as { summary?: unknown; dependencies_by_file?: unknown; circular_dependencies?: unknown };
  if (typeof report.summary !== 'object' || report.summary === null) {
    return false;
  }
  const summary = report.summary as Record<string, unknown>;
  return (
    typeof summary.total_dependencies === 'number' &&
    typeof summary.external_dependencies === 'number' &&
    typeof summary.internal_dependencies === 'number' &&
    typeof report.dependencies_by_file === 'object' &&
    Array.isArray(report.circular_dependencies)
  );
}

/**
 * Dashboard API service for loading report files
 */
export const dashboardApi = {
  /**
   * Load quality report from file system
   *
   * @param outputsPath - Base path to data directory (e.g., '/data')
   * @returns Quality report or null if file doesn't exist
   * @throws Error if file exists but is invalid
   */
  async loadQualityReport(outputsPath: string): Promise<PythonQualityReport | null> {
    const path = `${outputsPath}/quality/quality_report.json`;

    try {
      // In browser environment - fetch from public folder
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[dashboardApi] Quality report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const rawData = parseJSON<RawQualityReport>(text, 'quality report');

      if (!validateRawQualityReport(rawData)) {
        throw new Error('Quality report has invalid structure');
      }

      // Transform raw Python output to TypeScript interface format
      const data = transformQualityReport(rawData);
      console.log(`[dashboardApi] Loaded quality report: ${data.total_issues} issues from ${data.total_files_scanned} files`);
      return data;
    } catch (error) {
      console.error(`[dashboardApi] Error loading quality report from ${path}:`, error);
      throw error;
    }
  },

  /**
   * Load coverage report from file system
   *
   * @param outputsPath - Base path to data directory (e.g., '/data')
   * @returns Coverage report or null if file doesn't exist
   * @throws Error if file exists but is invalid
   */
  async loadCoverageReport(outputsPath: string): Promise<PythonCoverageReport | null> {
    const path = `${outputsPath}/coverage/coverage_report.json`;

    try {
      // In browser environment - fetch from public folder
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[dashboardApi] Coverage report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const rawData = parseJSON<RawCoverageReport>(text, 'coverage report');

      if (!validateRawCoverageReport(rawData)) {
        throw new Error('Coverage report has invalid structure');
      }

      // Transform raw Python output to TypeScript interface format
      const data = transformCoverageReport(rawData);
      console.log(`[dashboardApi] Loaded coverage report: ${data.coverage_percentage.toFixed(1)}% coverage (${data.tested_functions}/${data.total_functions} functions)`);
      return data;
    } catch (error) {
      console.error(`[dashboardApi] Error loading coverage report from ${path}:`, error);
      throw error;
    }
  },

  /**
   * Load dependency report from file system
   *
   * @param outputsPath - Base path to data directory (e.g., '/data')
   * @returns Dependency report or null if file doesn't exist
   * @throws Error if file exists but is invalid
   */
  async loadDependencyReport(outputsPath: string): Promise<PythonDependencyReport | null> {
    const path = `${outputsPath}/dependencies/dependency_report.json`;

    try {
      // In browser environment - fetch from public folder
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[dashboardApi] Dependency report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const rawData = parseJSON<RawDependencyReport>(text, 'dependency report');

      if (!validateRawDependencyReport(rawData)) {
        throw new Error('Dependency report has invalid structure');
      }

      // Transform raw Python output to TypeScript interface format
      const data = transformDependencyReport(rawData);
      console.log(`[dashboardApi] Loaded dependency report: ${data.total_dependencies} dependencies (${data.circular_dependencies.length} circular)`);
      return data;
    } catch (error) {
      console.error(`[dashboardApi] Error loading dependency report from ${path}:`, error);
      throw error;
    }
  },

  /**
   * Load all reports in parallel with graceful error handling
   *
   * Missing reports return null rather than failing the entire load.
   * Invalid reports (malformed JSON) will still throw errors.
   *
   * @param outputsPath - Base path to outputs directory
   * @returns Object containing all loaded reports and any errors encountered
   */
  async loadAllReports(outputsPath: string): Promise<LoadReportsResult> {
    const errors: ReportLoadError[] = [];

    // Load all reports in parallel using Promise.allSettled
    const [qualityResult, coverageResult, dependenciesResult] = await Promise.allSettled([
      this.loadQualityReport(outputsPath),
      this.loadCoverageReport(outputsPath),
      this.loadDependencyReport(outputsPath),
    ]);

    // Process quality report result
    let quality: PythonQualityReport | null = null;
    if (qualityResult.status === 'fulfilled') {
      quality = qualityResult.value;
    } else {
      errors.push({
        reportType: 'quality',
        error: qualityResult.reason instanceof Error ? qualityResult.reason.message : String(qualityResult.reason),
        path: `${outputsPath}/quality/quality_report.json`,
      });
    }

    // Process coverage report result
    let coverage: PythonCoverageReport | null = null;
    if (coverageResult.status === 'fulfilled') {
      coverage = coverageResult.value;
    } else {
      errors.push({
        reportType: 'coverage',
        error: coverageResult.reason instanceof Error ? coverageResult.reason.message : String(coverageResult.reason),
        path: `${outputsPath}/coverage/coverage_report.json`,
      });
    }

    // Process dependency report result
    let dependencies: PythonDependencyReport | null = null;
    if (dependenciesResult.status === 'fulfilled') {
      dependencies = dependenciesResult.value;
    } else {
      errors.push({
        reportType: 'dependencies',
        error: dependenciesResult.reason instanceof Error ? dependenciesResult.reason.message : String(dependenciesResult.reason),
        path: `${outputsPath}/dependencies/dependency_report.json`,
      });
    }

    const data: PythonAnalyzerData = {
      quality,
      coverage,
      dependencies,
    };

    // Log summary
    const loaded = [quality, coverage, dependencies].filter(r => r !== null).length;
    console.log(`[dashboardApi] Loaded ${loaded}/3 reports successfully`);
    if (errors.length > 0) {
      console.warn(`[dashboardApi] ${errors.length} errors encountered:`, errors);
    }

    return { data, errors };
  },
};
