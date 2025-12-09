/**
 * Dashboard API Service Layer
 *
 * Handles loading JSON report files from the Python analyzers.
 * Provides type-safe access to quality, coverage, and dependency reports.
 *
 * Expected file structure:
 * - outputs/quality/quality_report.json
 * - outputs/coverage/coverage_report.json
 * - outputs/dependencies/dependency_report.json
 */

import type {
  PythonQualityReport,
  PythonCoverageReport,
  PythonDependencyReport,
  PythonAnalyzerData,
  ReportLoadError,
  LoadReportsResult,
} from '../types';

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
 * Validate that required fields exist in the report
 */
function validateQualityReport(data: unknown): data is PythonQualityReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as Partial<PythonQualityReport>;
  return (
    typeof report.total_files_scanned === 'number' &&
    typeof report.total_issues === 'number' &&
    typeof report.issues_by_severity === 'object' &&
    typeof report.issues_by_category === 'object' &&
    Array.isArray(report.issues)
  );
}

/**
 * Validate coverage report structure
 */
function validateCoverageReport(data: unknown): data is PythonCoverageReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as Partial<PythonCoverageReport>;
  return (
    typeof report.total_functions === 'number' &&
    typeof report.tested_functions === 'number' &&
    typeof report.untested_functions === 'number' &&
    typeof report.coverage_percentage === 'number' &&
    Array.isArray(report.functions) &&
    typeof report.untested_by_file === 'object'
  );
}

/**
 * Validate dependency report structure
 */
function validateDependencyReport(data: unknown): data is PythonDependencyReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as Partial<PythonDependencyReport>;
  return (
    typeof report.total_dependencies === 'number' &&
    typeof report.external_dependencies === 'number' &&
    typeof report.internal_dependencies === 'number' &&
    typeof report.dependencies_by_file === 'object' &&
    typeof report.dependency_graph === 'object' &&
    Array.isArray(report.circular_dependencies) &&
    Array.isArray(report.unused_dependencies)
  );
}

/**
 * Dashboard API service for loading report files
 */
export const dashboardApi = {
  /**
   * Load quality report from file system
   *
   * @param outputsPath - Base path to outputs directory (e.g., '/path/to/outputs')
   * @returns Quality report or null if file doesn't exist
   * @throws Error if file exists but is invalid
   */
  async loadQualityReport(outputsPath: string): Promise<PythonQualityReport | null> {
    const path = `${outputsPath}/quality/quality_report.json`;

    try {
      // In Node.js environment (for testing/local dev)
      if (typeof window === 'undefined') {
        const fs = await import('fs/promises');
        const filePath = await import('path');
        const fullPath = filePath.resolve(path);

        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const data = parseJSON<PythonQualityReport>(content, 'quality report');

          if (!validateQualityReport(data)) {
            throw new Error('Quality report has invalid structure');
          }

          console.log(`[dashboardApi] Loaded quality report: ${data.total_issues} issues from ${data.total_files_scanned} files`);
          return data;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.warn(`[dashboardApi] Quality report not found at ${fullPath}`);
            return null;
          }
          throw error;
        }
      }

      // In browser environment
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[dashboardApi] Quality report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const data = parseJSON<PythonQualityReport>(text, 'quality report');

      if (!validateQualityReport(data)) {
        throw new Error('Quality report has invalid structure');
      }

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
   * @param outputsPath - Base path to outputs directory
   * @returns Coverage report or null if file doesn't exist
   * @throws Error if file exists but is invalid
   */
  async loadCoverageReport(outputsPath: string): Promise<PythonCoverageReport | null> {
    const path = `${outputsPath}/coverage/coverage_report.json`;

    try {
      // In Node.js environment (for testing/local dev)
      if (typeof window === 'undefined') {
        const fs = await import('fs/promises');
        const filePath = await import('path');
        const fullPath = filePath.resolve(path);

        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const data = parseJSON<PythonCoverageReport>(content, 'coverage report');

          if (!validateCoverageReport(data)) {
            throw new Error('Coverage report has invalid structure');
          }

          console.log(`[dashboardApi] Loaded coverage report: ${data.coverage_percentage.toFixed(1)}% coverage (${data.tested_functions}/${data.total_functions} functions)`);
          return data;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.warn(`[dashboardApi] Coverage report not found at ${fullPath}`);
            return null;
          }
          throw error;
        }
      }

      // In browser environment
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[dashboardApi] Coverage report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const data = parseJSON<PythonCoverageReport>(text, 'coverage report');

      if (!validateCoverageReport(data)) {
        throw new Error('Coverage report has invalid structure');
      }

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
   * @param outputsPath - Base path to outputs directory
   * @returns Dependency report or null if file doesn't exist
   * @throws Error if file exists but is invalid
   */
  async loadDependencyReport(outputsPath: string): Promise<PythonDependencyReport | null> {
    const path = `${outputsPath}/dependencies/dependency_report.json`;

    try {
      // In Node.js environment (for testing/local dev)
      if (typeof window === 'undefined') {
        const fs = await import('fs/promises');
        const filePath = await import('path');
        const fullPath = filePath.resolve(path);

        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const data = parseJSON<PythonDependencyReport>(content, 'dependency report');

          if (!validateDependencyReport(data)) {
            throw new Error('Dependency report has invalid structure');
          }

          console.log(`[dashboardApi] Loaded dependency report: ${data.total_dependencies} dependencies (${data.circular_dependencies.length} circular)`);
          return data;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.warn(`[dashboardApi] Dependency report not found at ${fullPath}`);
            return null;
          }
          throw error;
        }
      }

      // In browser environment
      const response = await fetch(path);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[dashboardApi] Dependency report not found at ${path}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const data = parseJSON<PythonDependencyReport>(text, 'dependency report');

      if (!validateDependencyReport(data)) {
        throw new Error('Dependency report has invalid structure');
      }

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
