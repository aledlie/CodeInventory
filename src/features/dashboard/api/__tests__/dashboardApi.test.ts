/**
 * Dashboard API Service Tests
 *
 * Tests for loading and parsing JSON report files.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardApi } from '../dashboardApi';
import type {
  PythonQualityReport,
  PythonCoverageReport,
  PythonDependencyReport,
} from '../../types';

// Mock fs/promises for Node.js environment
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
  readFile: vi.fn(),
}));

vi.mock('path', () => ({
  default: {
    resolve: vi.fn((p: string) => p),
  },
  resolve: vi.fn((p: string) => p),
}));

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadQualityReport', () => {
    it('should load and validate a valid quality report', async () => {
      const mockReport: PythonQualityReport = {
        total_files_scanned: 10,
        total_issues: 5,
        issues_by_severity: { error: 2, warning: 3 },
        issues_by_category: { code_smell: 3, security: 2 },
        issues: [],
      };

      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockReport));

      const result = await dashboardApi.loadQualityReport('/test/outputs');

      expect(result).toEqual(mockReport);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/test/outputs/quality/quality_report.json',
        'utf-8'
      );
    });

    it('should return null for missing quality report', async () => {
      const fs = await import('fs/promises');
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await dashboardApi.loadQualityReport('/test/outputs');

      expect(result).toBeNull();
    });

    it('should throw error for invalid quality report structure', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ invalid: true }));

      await expect(
        dashboardApi.loadQualityReport('/test/outputs')
      ).rejects.toThrow('Quality report has invalid structure');
    });

    it('should throw error for malformed JSON', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue('{ invalid json }');

      await expect(
        dashboardApi.loadQualityReport('/test/outputs')
      ).rejects.toThrow('Failed to parse quality report JSON');
    });
  });

  describe('loadCoverageReport', () => {
    it('should load and validate a valid coverage report', async () => {
      const mockReport: PythonCoverageReport = {
        total_functions: 100,
        tested_functions: 75,
        untested_functions: 25,
        coverage_percentage: 75.0,
        functions: [],
        untested_by_file: {},
      };

      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockReport));

      const result = await dashboardApi.loadCoverageReport('/test/outputs');

      expect(result).toEqual(mockReport);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/test/outputs/coverage/coverage_report.json',
        'utf-8'
      );
    });

    it('should return null for missing coverage report', async () => {
      const fs = await import('fs/promises');
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await dashboardApi.loadCoverageReport('/test/outputs');

      expect(result).toBeNull();
    });
  });

  describe('loadDependencyReport', () => {
    it('should load and validate a valid dependency report', async () => {
      const mockReport: PythonDependencyReport = {
        total_dependencies: 50,
        external_dependencies: 30,
        internal_dependencies: 20,
        dependencies_by_file: {},
        dependency_graph: {},
        circular_dependencies: [],
        unused_dependencies: [],
      };

      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockReport));

      const result = await dashboardApi.loadDependencyReport('/test/outputs');

      expect(result).toEqual(mockReport);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/test/outputs/dependencies/dependency_report.json',
        'utf-8'
      );
    });

    it('should return null for missing dependency report', async () => {
      const fs = await import('fs/promises');
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await dashboardApi.loadDependencyReport('/test/outputs');

      expect(result).toBeNull();
    });
  });

  describe('loadAllReports', () => {
    it('should load all reports successfully', async () => {
      const mockQuality: PythonQualityReport = {
        total_files_scanned: 10,
        total_issues: 5,
        issues_by_severity: { error: 2, warning: 3 },
        issues_by_category: { code_smell: 3, security: 2 },
        issues: [],
      };

      const mockCoverage: PythonCoverageReport = {
        total_functions: 100,
        tested_functions: 75,
        untested_functions: 25,
        coverage_percentage: 75.0,
        functions: [],
        untested_by_file: {},
      };

      const mockDependency: PythonDependencyReport = {
        total_dependencies: 50,
        external_dependencies: 30,
        internal_dependencies: 20,
        dependencies_by_file: {},
        dependency_graph: {},
        circular_dependencies: [],
        unused_dependencies: [],
      };

      const fs = await import('fs/promises');
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockQuality))
        .mockResolvedValueOnce(JSON.stringify(mockCoverage))
        .mockResolvedValueOnce(JSON.stringify(mockDependency));

      const result = await dashboardApi.loadAllReports('/test/outputs');

      expect(result.data.quality).toEqual(mockQuality);
      expect(result.data.coverage).toEqual(mockCoverage);
      expect(result.data.dependencies).toEqual(mockDependency);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing reports gracefully', async () => {
      const mockQuality: PythonQualityReport = {
        total_files_scanned: 10,
        total_issues: 5,
        issues_by_severity: { error: 2, warning: 3 },
        issues_by_category: { code_smell: 3, security: 2 },
        issues: [],
      };

      const fs = await import('fs/promises');
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockQuality))
        .mockRejectedValueOnce(error) // coverage missing
        .mockRejectedValueOnce(error); // dependency missing

      const result = await dashboardApi.loadAllReports('/test/outputs');

      expect(result.data.quality).toEqual(mockQuality);
      expect(result.data.coverage).toBeNull();
      expect(result.data.dependencies).toBeNull();
      expect(result.errors).toHaveLength(0); // Missing files don't generate errors
    });

    it('should collect errors for invalid reports', async () => {
      const fs = await import('fs/promises');

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce('{ invalid json }') // quality
        .mockResolvedValueOnce(JSON.stringify({ invalid: true })) // coverage
        .mockResolvedValueOnce(JSON.stringify({ invalid: true })); // dependency

      const result = await dashboardApi.loadAllReports('/test/outputs');

      expect(result.data.quality).toBeNull();
      expect(result.data.coverage).toBeNull();
      expect(result.data.dependencies).toBeNull();
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].reportType).toBe('quality');
      expect(result.errors[1].reportType).toBe('coverage');
      expect(result.errors[2].reportType).toBe('dependencies');
    });
  });
});
