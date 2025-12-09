/**
 * Tests for Dashboard Metrics Calculator
 */

import {
  calculateDashboardMetrics,
  calculateQualityScore,
  calculateHealthStatus,
  isValidQualityReport,
  isValidCoverageReport,
  isValidDependencyReport,
  type QualityReport,
  type CoverageReport,
  type DependencyReport
} from './calculateMetrics';

describe('calculateQualityScore', () => {
  it('should return 100 for no issues', () => {
    const report: QualityReport = {
      timestamp: '2025-12-09T00:00:00Z',
      total_issues: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      issues: []
    };

    expect(calculateQualityScore(report)).toBe(100);
  });

  it('should penalize critical issues heavily', () => {
    const report: QualityReport = {
      timestamp: '2025-12-09T00:00:00Z',
      total_issues: 1,
      by_severity: { critical: 1, high: 0, medium: 0, low: 0 },
      issues: []
    };

    expect(calculateQualityScore(report)).toBe(90);
  });

  it('should calculate mixed severity correctly', () => {
    const report: QualityReport = {
      timestamp: '2025-12-09T00:00:00Z',
      total_issues: 4,
      by_severity: { critical: 1, high: 1, medium: 1, low: 1 },
      issues: []
    };

    // 100 - (10 + 5 + 2 + 1) = 82
    expect(calculateQualityScore(report)).toBe(82);
  });

  it('should not go below 0', () => {
    const report: QualityReport = {
      timestamp: '2025-12-09T00:00:00Z',
      total_issues: 100,
      by_severity: { critical: 50, high: 20, medium: 20, low: 10 },
      issues: []
    };

    expect(calculateQualityScore(report)).toBe(0);
  });

  it('should return 0 for null report', () => {
    expect(calculateQualityScore(null)).toBe(0);
  });
});

describe('calculateHealthStatus', () => {
  it('should return error for critical issues', () => {
    const metrics = {
      totalFiles: 100,
      qualityScore: 90,
      coveragePercentage: 80,
      criticalIssues: 1,
      circularDeps: 0,
      untestedFunctions: 5
    };

    expect(calculateHealthStatus(metrics)).toBe('error');
  });

  it('should return error for low quality score', () => {
    const metrics = {
      totalFiles: 100,
      qualityScore: 40,
      coveragePercentage: 80,
      criticalIssues: 0,
      circularDeps: 0,
      untestedFunctions: 5
    };

    expect(calculateHealthStatus(metrics)).toBe('error');
  });

  it('should return error for low coverage', () => {
    const metrics = {
      totalFiles: 100,
      qualityScore: 90,
      coveragePercentage: 25,
      criticalIssues: 0,
      circularDeps: 0,
      untestedFunctions: 20
    };

    expect(calculateHealthStatus(metrics)).toBe('error');
  });

  it('should return warning for circular dependencies', () => {
    const metrics = {
      totalFiles: 100,
      qualityScore: 80,
      coveragePercentage: 70,
      criticalIssues: 0,
      circularDeps: 2,
      untestedFunctions: 10
    };

    expect(calculateHealthStatus(metrics)).toBe('warning');
  });

  it('should return success for healthy metrics', () => {
    const metrics = {
      totalFiles: 100,
      qualityScore: 90,
      coveragePercentage: 85,
      criticalIssues: 0,
      circularDeps: 0,
      untestedFunctions: 5
    };

    expect(calculateHealthStatus(metrics)).toBe('success');
  });
});

describe('calculateDashboardMetrics', () => {
  const qualityReport: QualityReport = {
    timestamp: '2025-12-09T00:00:00Z',
    total_issues: 10,
    by_severity: { critical: 2, high: 3, medium: 3, low: 2 },
    issues: []
  };

  const coverageReport: CoverageReport = {
    timestamp: '2025-12-09T00:00:00Z',
    coverage_percentage: 75.5,
    total_functions: 100,
    tested_functions: 75,
    untested_functions: 25
  };

  const dependencyReport: DependencyReport = {
    timestamp: '2025-12-09T00:00:00Z',
    total_files: 150,
    circular_dependencies: [['a.ts', 'b.ts', 'a.ts'], ['c.ts', 'd.ts', 'c.ts']]
  };

  it('should calculate metrics from all reports', () => {
    const metrics = calculateDashboardMetrics(
      qualityReport,
      coverageReport,
      dependencyReport
    );

    expect(metrics).toEqual({
      totalFiles: 150,
      qualityScore: 63, // 100 - (20 + 15 + 6 + 2)
      coveragePercentage: 75.5,
      criticalIssues: 2,
      circularDeps: 2,
      untestedFunctions: 25
    });
  });

  it('should handle null quality report', () => {
    const metrics = calculateDashboardMetrics(
      null,
      coverageReport,
      dependencyReport
    );

    expect(metrics.qualityScore).toBe(0);
    expect(metrics.criticalIssues).toBe(0);
  });

  it('should handle null coverage report', () => {
    const metrics = calculateDashboardMetrics(
      qualityReport,
      null,
      dependencyReport
    );

    expect(metrics.coveragePercentage).toBe(0);
    expect(metrics.untestedFunctions).toBe(0);
  });

  it('should handle null dependency report', () => {
    const metrics = calculateDashboardMetrics(
      qualityReport,
      coverageReport,
      null
    );

    expect(metrics.totalFiles).toBe(0);
    expect(metrics.circularDeps).toBe(0);
  });

  it('should handle all null reports', () => {
    const metrics = calculateDashboardMetrics(null, null, null);

    expect(metrics).toEqual({
      totalFiles: 0,
      qualityScore: 0,
      coveragePercentage: 0,
      criticalIssues: 0,
      circularDeps: 0,
      untestedFunctions: 0
    });
  });
});

describe('Validation functions', () => {
  describe('isValidQualityReport', () => {
    it('should validate correct quality report', () => {
      const report: QualityReport = {
        timestamp: '2025-12-09T00:00:00Z',
        total_issues: 5,
        by_severity: { critical: 1, high: 1, medium: 2, low: 1 },
        issues: []
      };

      expect(isValidQualityReport(report)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidQualityReport(null)).toBe(false);
    });

    it('should reject missing fields', () => {
      const report = {
        timestamp: '2025-12-09T00:00:00Z',
        total_issues: 5
        // Missing by_severity and issues
      };

      expect(isValidQualityReport(report)).toBe(false);
    });
  });

  describe('isValidCoverageReport', () => {
    it('should validate correct coverage report', () => {
      const report: CoverageReport = {
        timestamp: '2025-12-09T00:00:00Z',
        coverage_percentage: 75,
        total_functions: 100,
        tested_functions: 75,
        untested_functions: 25
      };

      expect(isValidCoverageReport(report)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidCoverageReport(null)).toBe(false);
    });

    it('should reject missing fields', () => {
      const report = {
        timestamp: '2025-12-09T00:00:00Z',
        coverage_percentage: 75
        // Missing other fields
      };

      expect(isValidCoverageReport(report)).toBe(false);
    });
  });

  describe('isValidDependencyReport', () => {
    it('should validate correct dependency report', () => {
      const report: DependencyReport = {
        timestamp: '2025-12-09T00:00:00Z',
        total_files: 100,
        circular_dependencies: []
      };

      expect(isValidDependencyReport(report)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidDependencyReport(null)).toBe(false);
    });

    it('should reject missing fields', () => {
      const report = {
        timestamp: '2025-12-09T00:00:00Z'
        // Missing total_files and circular_dependencies
      };

      expect(isValidDependencyReport(report)).toBe(false);
    });
  });
});
