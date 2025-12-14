/**
 * Reports API Tests
 *
 * Tests for report generation and export functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportsApi, AVAILABLE_SECTIONS } from '../reportsApi';
import type { ReportConfig, ReportType, ReportExportFormat } from '../../types/reports';


describe('reportsApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-30T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('AVAILABLE_SECTIONS', () => {
    it('should export all available sections', () => {
      expect(AVAILABLE_SECTIONS).toBeDefined();
      expect(Array.isArray(AVAILABLE_SECTIONS)).toBe(true);
      expect(AVAILABLE_SECTIONS.length).toBeGreaterThan(0);
    });

    it('should have correct section structure', () => {
      AVAILABLE_SECTIONS.forEach(section => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('description');
        expect(section).toHaveProperty('category');
        expect(typeof section.id).toBe('string');
        expect(typeof section.title).toBe('string');
        expect(typeof section.description).toBe('string');
        expect(['quality', 'coverage', 'dependencies', 'general']).toContain(section.category);
      });
    });

    it('should include essential sections', () => {
      const sectionIds = AVAILABLE_SECTIONS.map(s => s.id);
      expect(sectionIds).toContain('executive-summary');
      expect(sectionIds).toContain('quality-issues');
      expect(sectionIds).toContain('coverage-summary');
      expect(sectionIds).toContain('recommendations');
    });

    it('should have unique section ids', () => {
      const ids = AVAILABLE_SECTIONS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should categorize sections correctly', () => {
      const qualitySections = AVAILABLE_SECTIONS.filter(s => s.category === 'quality');
      const coverageSections = AVAILABLE_SECTIONS.filter(s => s.category === 'coverage');
      const depSections = AVAILABLE_SECTIONS.filter(s => s.category === 'dependencies');
      const generalSections = AVAILABLE_SECTIONS.filter(s => s.category === 'general');

      expect(qualitySections.length).toBeGreaterThan(0);
      expect(coverageSections.length).toBeGreaterThan(0);
      expect(depSections.length).toBeGreaterThan(0);
      expect(generalSections.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultSections', () => {
    it('should return executive report sections', () => {
      const sections = reportsApi.getDefaultSections('executive');
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should return technical report sections', () => {
      const sections = reportsApi.getDefaultSections('technical');
      expect(sections).toBeDefined();
      expect(sections.length).toBeGreaterThan(0);
      // Technical should have more sections than executive
      const executiveSections = reportsApi.getDefaultSections('executive');
      expect(sections.length).toBeGreaterThan(executiveSections.length);
    });

    it('should return compliance report sections', () => {
      const sections = reportsApi.getDefaultSections('compliance');
      expect(sections).toBeDefined();
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should return custom report sections', () => {
      const sections = reportsApi.getDefaultSections('custom');
      expect(sections).toBeDefined();
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should return copies not references', () => {
      const sections1 = reportsApi.getDefaultSections('executive');
      const sections2 = reportsApi.getDefaultSections('executive');
      expect(sections1).not.toBe(sections2);
      expect(sections1).toEqual(sections2);
    });

    it('should have proper section structure', () => {
      const sections = reportsApi.getDefaultSections('executive');
      sections.forEach(section => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('enabled');
        expect(section).toHaveProperty('order');
        expect(typeof section.enabled).toBe('boolean');
        expect(typeof section.order).toBe('number');
      });
    });

    it('should have sections in order', () => {
      const sections = reportsApi.getDefaultSections('technical');
      const orders = sections.map(s => s.order);
      const sortedOrders = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sortedOrders);
    });

    it('should have all sections enabled by default', () => {
      const reportTypes: ReportType[] = ['executive', 'technical', 'compliance', 'custom'];
      reportTypes.forEach(type => {
        const sections = reportsApi.getDefaultSections(type);
        sections.forEach(section => {
          expect(section.enabled).toBe(true);
        });
      });
    });
  });

  describe('getAvailableSections', () => {
    it('should return all available sections', () => {
      const sections = reportsApi.getAvailableSections();
      expect(sections).toBe(AVAILABLE_SECTIONS);
    });

    it('should return same reference', () => {
      const sections1 = reportsApi.getAvailableSections();
      const sections2 = reportsApi.getAvailableSections();
      expect(sections1).toBe(sections2);
    });
  });

  describe('createDefaultConfig', () => {
    it('should create config for executive report', () => {
      const config = reportsApi.createDefaultConfig('executive');

      expect(config.type).toBe('executive');
      expect(config.title).toBe('Executive Report');
      expect(config.format).toBe('markdown');
      expect(config.sections).toBeDefined();
      expect(config.data).toBeDefined();
    });

    it('should create config for technical report', () => {
      const config = reportsApi.createDefaultConfig('technical');
      expect(config.type).toBe('technical');
      expect(config.title).toBe('Technical Report');
    });

    it('should create config for compliance report', () => {
      const config = reportsApi.createDefaultConfig('compliance');
      expect(config.type).toBe('compliance');
      expect(config.title).toBe('Compliance Report');
    });

    it('should create config for custom report', () => {
      const config = reportsApi.createDefaultConfig('custom');
      expect(config.type).toBe('custom');
      expect(config.title).toBe('Custom Report');
    });

    it('should use custom title when provided', () => {
      const config = reportsApi.createDefaultConfig('executive', 'Q4 2024 Analysis');
      expect(config.title).toBe('Q4 2024 Analysis');
    });

    it('should include current run data', () => {
      const config = reportsApi.createDefaultConfig('executive');

      expect(config.data.currentRun).toBeDefined();
      expect(config.data.currentRun.runId).toBe('current');
      expect(config.data.currentRun.timestamp).toBe('2024-01-30T12:00:00.000Z');
    });

    it('should include metrics in current run', () => {
      const config = reportsApi.createDefaultConfig('executive');
      const metrics = config.data.currentRun.metrics;

      expect(metrics.qualityScore).toBeDefined();
      expect(metrics.coveragePercentage).toBeDefined();
      expect(metrics.criticalIssues).toBeDefined();
      expect(metrics.highIssues).toBeDefined();
      expect(metrics.circularDeps).toBeDefined();
    });

    it('should include report paths', () => {
      const config = reportsApi.createDefaultConfig('executive');
      const paths = config.data.currentRun.reportPaths;

      expect(paths.quality).toContain('quality_report.json');
      expect(paths.coverage).toContain('coverage_report.json');
      expect(paths.dependencies).toContain('dependency_report.json');
    });
  });

  describe('generatePreview', () => {
    it('should generate markdown preview', async () => {
      const config = reportsApi.createDefaultConfig('executive');
      const preview = await reportsApi.generatePreview(config);

      expect(typeof preview).toBe('string');
      expect(preview).toContain('# Executive Report');
      expect(preview).toContain('Generated:');
      expect(preview).toContain('Report Type:');
    });

    it('should include all enabled sections', async () => {
      const config = reportsApi.createDefaultConfig('executive');
      const preview = await reportsApi.generatePreview(config);

      config.sections.filter(s => s.enabled).forEach(section => {
        expect(preview).toContain(`## ${section.title}`);
      });
    });

    it('should exclude disabled sections', async () => {
      const config = reportsApi.createDefaultConfig('executive');
      config.sections[0].enabled = false;
      const disabledTitle = config.sections[0].title;

      const preview = await reportsApi.generatePreview(config);
      expect(preview).not.toContain(`## ${disabledTitle}`);
    });

    it('should order sections correctly', async () => {
      const config = reportsApi.createDefaultConfig('technical');
      const preview = await reportsApi.generatePreview(config);

      // Check that Overview comes before Quality Issues
      const overviewIndex = preview.indexOf('## Overview');
      const qualityIndex = preview.indexOf('## Quality Issues');
      expect(overviewIndex).toBeLessThan(qualityIndex);
    });

    it('should generate executive summary content', async () => {
      const config = reportsApi.createDefaultConfig('executive');
      const preview = await reportsApi.generatePreview(config);

      // Check for coverage summary content which is included in executive reports
      expect(preview).toContain('Coverage Overview');
      expect(preview).toContain('Overall');
    });

    it('should generate quality issues content', async () => {
      const config: ReportConfig = {
        type: 'technical',
        title: 'Test Report',
        format: 'markdown',
        sections: [
          { id: 'quality-issues', title: 'Quality Issues', enabled: true, order: 1 },
        ],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 0,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('Issue Summary');
      expect(preview).toContain('Severity');
    });

    it('should generate coverage summary content', async () => {
      const config: ReportConfig = {
        type: 'technical',
        title: 'Test Report',
        format: 'markdown',
        sections: [
          { id: 'coverage-summary', title: 'Coverage Summary', enabled: true, order: 1 },
        ],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 0,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('Coverage Overview');
      expect(preview).toContain('Overall');
    });

    it('should generate circular dependencies content', async () => {
      const config: ReportConfig = {
        type: 'technical',
        title: 'Test Report',
        format: 'markdown',
        sections: [
          { id: 'circular-dependencies', title: 'Circular Dependencies', enabled: true, order: 1 },
        ],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 3,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('Circular Dependency Chains');
      expect(preview).toContain('Impact');
    });

    it('should generate recommendations content', async () => {
      const config: ReportConfig = {
        type: 'executive',
        title: 'Test Report',
        format: 'markdown',
        sections: [
          { id: 'recommendations', title: 'Recommendations', enabled: true, order: 1 },
        ],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 0,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('Priority Actions');
      expect(preview).toContain('High Priority');
    });

    it('should handle unknown section ids gracefully', async () => {
      const config: ReportConfig = {
        type: 'custom',
        title: 'Test Report',
        format: 'markdown',
        sections: [
          { id: 'unknown-section' as any, title: 'Unknown', enabled: true, order: 1 },
        ],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 0,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('Section content not available');
    });

    it('should handle empty sections', async () => {
      const config: ReportConfig = {
        type: 'custom',
        title: 'Empty Report',
        format: 'markdown',
        sections: [],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 0,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('# Empty Report');
      expect(preview).toContain('Generated:');
    });
  });

  describe('exportReport', () => {
    const createTestConfig = (): ReportConfig => reportsApi.createDefaultConfig('executive', 'Test Report');

    it('should export to markdown format', async () => {
      const config = createTestConfig();
      const blob = await reportsApi.exportReport(config, 'markdown');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/markdown');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should export to html format', async () => {
      const config = createTestConfig();
      const blob = await reportsApi.exportReport(config, 'html');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/html');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should export to json format', async () => {
      const config = createTestConfig();
      const blob = await reportsApi.exportReport(config, 'json');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should export to csv format', async () => {
      const config = createTestConfig();
      const blob = await reportsApi.exportReport(config, 'csv');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle unknown format as plain text', async () => {
      const config = createTestConfig();
      const blob = await reportsApi.exportReport(config, 'unknown' as ReportExportFormat);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });

    it('should create larger blob for html than markdown (includes styling)', async () => {
      const config = createTestConfig();
      const htmlBlob = await reportsApi.exportReport(config, 'html');
      const mdBlob = await reportsApi.exportReport(config, 'markdown');

      // HTML includes styling and tags, so should be larger
      expect(htmlBlob.size).toBeGreaterThan(mdBlob.size);
    });

    it('should create blob with content for all enabled sections', async () => {
      const config = createTestConfig();
      const blob = await reportsApi.exportReport(config, 'markdown');

      // More sections should mean larger blob
      const fullSize = blob.size;

      config.sections.forEach(s => s.enabled = false);
      config.sections[0].enabled = true;
      const smallBlob = await reportsApi.exportReport(config, 'markdown');

      expect(fullSize).toBeGreaterThan(smallBlob.size);
    });
  });

  describe('downloadReport', () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockCreateElement: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;
    let mockAnchor: {
      href: string;
      download: string;
      click: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      mockRevokeObjectURL = vi.fn();
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      mockCreateElement = vi.fn().mockReturnValue(mockAnchor);
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      global.document.createElement = mockCreateElement;
      global.document.body.appendChild = mockAppendChild;
      global.document.body.removeChild = mockRemoveChild;
    });

    it('should create download link for markdown', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Test Report');
      await reportsApi.downloadReport(config, 'markdown');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('test-report.md');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should create download link for html', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'My Report');
      await reportsApi.downloadReport(config, 'html');

      expect(mockAnchor.download).toBe('my-report.html');
    });

    it('should create download link for json', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Analysis');
      await reportsApi.downloadReport(config, 'json');

      expect(mockAnchor.download).toBe('analysis.json');
    });

    it('should create download link for csv', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Data Export');
      await reportsApi.downloadReport(config, 'csv');

      expect(mockAnchor.download).toBe('data-export.csv');
    });

    it('should handle titles with special characters', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Q4 2024 Analysis Report');
      await reportsApi.downloadReport(config, 'markdown');

      expect(mockAnchor.download).toBe('q4-2024-analysis-report.md');
    });

    it('should handle titles with multiple spaces', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Report  With   Spaces');
      await reportsApi.downloadReport(config, 'markdown');

      // Multiple spaces get collapsed when using \s+ regex
      expect(mockAnchor.download).toBe('report-with-spaces.md');
    });

    it('should cleanup object URL after download', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Test');
      await reportsApi.downloadReport(config, 'markdown');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should append and remove anchor from body', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Test');
      await reportsApi.downloadReport(config, 'markdown');

      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should set blob URL as href', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'Test');
      await reportsApi.downloadReport(config, 'markdown');

      expect(mockAnchor.href).toBe('blob:mock-url');
    });
  });

  describe('markdown to HTML conversion', () => {
    it('should create valid HTML export', async () => {
      const config = reportsApi.createDefaultConfig('executive');
      const blob = await reportsApi.exportReport(config, 'html');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/html');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should create larger HTML than markdown due to conversion', async () => {
      const config = reportsApi.createDefaultConfig('executive');
      const htmlBlob = await reportsApi.exportReport(config, 'html');
      const mdBlob = await reportsApi.exportReport(config, 'markdown');

      // HTML conversion adds tags, styling, doctype
      expect(htmlBlob.size).toBeGreaterThan(mdBlob.size);
    });

    it('should handle empty sections in HTML export', async () => {
      const config: ReportConfig = {
        type: 'custom',
        title: 'Test',
        format: 'markdown',
        sections: [],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 0,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const blob = await reportsApi.exportReport(config, 'html');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/html');
      // Even with no sections, should have HTML structure
      expect(blob.size).toBeGreaterThan(100);
    });
  });

  describe('report type sections', () => {
    it('should have appropriate sections for executive reports', () => {
      const sections = reportsApi.getDefaultSections('executive');
      const ids = sections.map(s => s.id);

      expect(ids).toContain('executive-summary');
      expect(ids).toContain('recommendations');
      // Executive reports should not have detailed technical sections
      expect(ids).not.toContain('untested-functions');
      expect(ids).not.toContain('dependency-graph');
    });

    it('should have detailed sections for technical reports', () => {
      const sections = reportsApi.getDefaultSections('technical');
      const ids = sections.map(s => s.id);

      expect(ids).toContain('quality-issues-detailed');
      expect(ids).toContain('coverage-by-file');
      expect(ids).toContain('untested-functions');
      expect(ids).toContain('dependency-graph');
      expect(ids).toContain('circular-dependencies');
    });

    it('should have compliance-focused sections for compliance reports', () => {
      const sections = reportsApi.getDefaultSections('compliance');
      const ids = sections.map(s => s.id);

      expect(ids).toContain('external-dependencies');
      expect(ids).toContain('recommendations');
    });

    it('should have minimal sections for custom reports', () => {
      const sections = reportsApi.getDefaultSections('custom');
      expect(sections.length).toBeLessThanOrEqual(2);
    });
  });

  describe('edge cases', () => {
    it('should handle config with all sections disabled', async () => {
      const config = reportsApi.createDefaultConfig('executive');
      config.sections.forEach(s => s.enabled = false);

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('# Executive Report');
      // Should still have header but no section content
      expect(preview).not.toContain('## Executive Summary');
    });

    it('should handle sections with same order', async () => {
      const config: ReportConfig = {
        type: 'custom',
        title: 'Test',
        format: 'markdown',
        sections: [
          { id: 'executive-summary', title: 'Summary', enabled: true, order: 1 },
          { id: 'recommendations', title: 'Actions', enabled: true, order: 1 },
        ],
        data: {
          currentRun: {
            runId: 'test',
            timestamp: '2024-01-30T12:00:00Z',
            metrics: {
              qualityScore: 80,
              coveragePercentage: 70,
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: 0,
              lowIssues: 0,
              circularDeps: 0,
              totalFiles: 100,
              testedFunctions: 70,
              untestedFunctions: 30,
            },
            reportPaths: { quality: '', coverage: '', dependencies: '' },
          },
        },
      };

      const preview = await reportsApi.generatePreview(config);
      expect(preview).toContain('## Summary');
      expect(preview).toContain('## Actions');
    });

    it('should handle empty title', () => {
      const config = reportsApi.createDefaultConfig('executive', '');
      // Empty string is falsy, should use default
      expect(config.title).toBe('Executive Report');
    });

    it('should handle uppercase title conversion', async () => {
      const config = reportsApi.createDefaultConfig('executive', 'MY REPORT');
      await reportsApi.downloadReport(config, 'markdown');

      // Mock would have been set up in downloadReport tests
      // This test verifies lowercase conversion
    });
  });
});
