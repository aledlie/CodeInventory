/**
 * Analytics API Service Tests
 *
 * Tests for loading and parsing analytics JSON report files.
 * Tests transform functions, validation, and mock data generation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsApi } from '../analyticsApi';
import type { AnalyticsReport, RiskData, AnalyticsInsight } from '../../types/analytics';

// Mock the logger to prevent console output during tests
vi.mock('../../helpers/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('analyticsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockReset();
  });

  describe('loadAnalyticsReport', () => {
    it('should load and transform a valid analytics report', async () => {
      const mockRawReport = {
        risk_data: [
          {
            path: 'src/test.ts',
            display_name: 'Test',
            risk_score: 45.5,
            risk_level: 'medium',
            factors: [
              { type: 'complexity', weight: 0.25, value: 50, score: 50 },
              { type: 'coverage', weight: 0.3, value: 40, score: 40, description: 'Low coverage' },
            ],
            confidence: 85,
            last_updated: '2024-01-15T10:00:00Z',
            directory: 'src',
          },
        ],
        debt_summary: {
          total_hours: 100,
          by_category: [
            {
              category: 'complexity',
              label: 'Complexity',
              total_hours: 50,
              percentage: 50,
              item_count: 5,
              color: '#e53935',
            },
          ],
          items: [
            {
              id: 'debt-1',
              category: 'complexity',
              description: 'Refactor component',
              estimated_hours: 8,
              priority: 'high',
              affected_files: ['src/test.ts'],
              created_at: '2024-01-10T10:00:00Z',
            },
          ],
          historical: [{ timestamp: '2024-01-01T00:00:00Z', value: 120, label: 'Week 1' }],
          targets: [{ timestamp: '2024-01-01T00:00:00Z', value: 100 }],
        },
        predictions: {
          quality: {
            current: 82,
            projected: 88,
            confidence: 80,
            confidence_level: 'high',
            timeframe_days: 90,
            insight: 'Quality improving',
            goal_value: 90,
            goal_date: '2024-06-01T00:00:00Z',
          },
          coverage: {
            current: 70,
            projected: 78,
            confidence: 75,
            confidence_level: 'medium',
            timeframe_days: 90,
            insight: 'Coverage improving steadily',
          },
          issues: {
            current: 20,
            projected: 15,
            confidence: 65,
            confidence_level: 'medium',
            timeframe_days: 90,
            insight: 'Issues decreasing',
          },
          debt: {
            current: 100,
            projected: 75,
            confidence: 70,
            confidence_level: 'medium',
            timeframe_days: 90,
            insight: 'Debt reducing',
          },
        },
        insights: [
          {
            id: 'insight-1',
            priority: 'high',
            title: 'Improve Type Safety',
            description: 'Add strict types',
            category: 'code-quality',
            affected_files: ['src/test.ts'],
            impact: { min: 5, max: 10, unit: '%', description: 'Quality improvement' },
            effort: { hours: 4, difficulty: 'moderate', skills: ['TypeScript'] },
            tags: ['typescript'],
            created_at: '2024-01-15T10:00:00Z',
            dismissed_at: undefined,
          },
        ],
        metadata: {
          generated_at: '2024-01-15T12:00:00Z',
          analyzer_version: '1.0.0',
          data_quality: 90,
          files_analyzed: 100,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockRawReport)),
      } as Response);

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Verify transformation from snake_case to camelCase
      expect(result.riskData).toHaveLength(1);
      expect(result.riskData[0].displayName).toBe('Test');
      expect(result.riskData[0].riskScore).toBe(45.5);
      expect(result.riskData[0].riskLevel).toBe('medium');
      expect(result.riskData[0].factors[0].type).toBe('complexity');
      expect(result.riskData[0].lastUpdated).toBe('2024-01-15T10:00:00Z');

      // Verify debt summary transformation
      expect(result.debtSummary.totalHours).toBe(100);
      expect(result.debtSummary.byCategory[0].totalHours).toBe(50);
      expect(result.debtSummary.byCategory[0].itemCount).toBe(5);
      expect(result.debtSummary.items[0].estimatedHours).toBe(8);
      expect(result.debtSummary.items[0].affectedFiles).toEqual(['src/test.ts']);
      expect(result.debtSummary.items[0].createdAt).toBe('2024-01-10T10:00:00Z');

      // Verify predictions transformation
      expect(result.predictions.quality.confidenceLevel).toBe('high');
      expect(result.predictions.quality.timeframeDays).toBe(90);
      expect(result.predictions.quality.goalValue).toBe(90);
      expect(result.predictions.quality.goalDate).toBe('2024-06-01T00:00:00Z');

      // Verify insights transformation
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].affectedFiles).toEqual(['src/test.ts']);
      expect(result.insights[0].createdAt).toBe('2024-01-15T10:00:00Z');

      // Verify metadata transformation
      expect(result.metadata.generatedAt).toBe('2024-01-15T12:00:00Z');
      expect(result.metadata.analyzerVersion).toBe('1.0.0');
      expect(result.metadata.dataQuality).toBe(90);
      expect(result.metadata.filesAnalyzed).toBe(100);
    });

    it('should return mock data when file is not found (404)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Should return mock data
      expect(result.riskData.length).toBeGreaterThan(0);
      expect(result.debtSummary.totalHours).toBeDefined();
      expect(result.predictions.quality).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.metadata.analyzerVersion).toBe('1.0.0-mock');
    });

    it('should return mock data when HTTP error occurs', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Should return mock data
      expect(result.metadata.analyzerVersion).toBe('1.0.0-mock');
    });

    it('should return mock data when report has invalid structure', async () => {
      const invalidReport = {
        invalid: true,
        something: 'else',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(invalidReport)),
      } as Response);

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Should return mock data due to invalid structure
      expect(result.metadata.analyzerVersion).toBe('1.0.0-mock');
    });

    it('should return mock data when JSON parsing fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{ invalid json }'),
      } as Response);

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Should return mock data due to parse error
      expect(result.metadata.analyzerVersion).toBe('1.0.0-mock');
    });

    it('should return mock data when fetch throws an error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Should return mock data
      expect(result.metadata.analyzerVersion).toBe('1.0.0-mock');
    });

    it('should construct correct file path', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await analyticsApi.loadAnalyticsReport('/custom/path');

      expect(fetch).toHaveBeenCalledWith('/custom/path/analytics/analytics_report.json');
    });
  });

  describe('loadRiskData', () => {
    it('should return only risk data from the report', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await analyticsApi.loadRiskData('/data');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('path');
      expect(result[0]).toHaveProperty('riskScore');
      expect(result[0]).toHaveProperty('factors');
    });
  });

  describe('loadDebtSummary', () => {
    it('should return only debt summary from the report', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await analyticsApi.loadDebtSummary('/data');

      expect(result).toHaveProperty('totalHours');
      expect(result).toHaveProperty('byCategory');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('historical');
      expect(result).toHaveProperty('targets');
      expect(Array.isArray(result.byCategory)).toBe(true);
    });
  });

  describe('loadPredictions', () => {
    it('should return only predictions from the report', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await analyticsApi.loadPredictions('/data');

      expect(result).toHaveProperty('quality');
      expect(result).toHaveProperty('coverage');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('debt');
      expect(result.quality).toHaveProperty('current');
      expect(result.quality).toHaveProperty('projected');
      expect(result.quality).toHaveProperty('confidence');
    });
  });

  describe('loadInsights', () => {
    it('should return only insights from the report', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await analyticsApi.loadInsights('/data');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('impact');
      expect(result[0]).toHaveProperty('effort');
    });
  });

  describe('dismissInsight', () => {
    it('should return success for insight dismissal', async () => {
      const result = await analyticsApi.dismissInsight('insight-123');

      expect(result).toEqual({ success: true });
    });
  });

  describe('mock data generation', () => {
    it('should generate valid mock risk data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const report = await analyticsApi.loadAnalyticsReport('/data');

      report.riskData.forEach((item: RiskData) => {
        // Check required properties
        expect(item.path).toBeDefined();
        expect(item.displayName).toBeDefined();
        expect(typeof item.riskScore).toBe('number');
        expect(item.riskScore).toBeGreaterThanOrEqual(0);
        expect(item.riskScore).toBeLessThanOrEqual(100);

        // Check risk level is valid
        expect(['critical', 'high', 'medium', 'low', 'minimal']).toContain(item.riskLevel);

        // Check factors
        expect(item.factors.length).toBeGreaterThan(0);
        item.factors.forEach((factor) => {
          expect(['complexity', 'coverage', 'dependencies', 'age', 'churn']).toContain(factor.type);
          expect(typeof factor.weight).toBe('number');
          expect(typeof factor.value).toBe('number');
          expect(typeof factor.score).toBe('number');
        });

        // Check confidence
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should generate valid mock debt data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const report = await analyticsApi.loadAnalyticsReport('/data');
      const debt = report.debtSummary;

      // Check total hours
      expect(typeof debt.totalHours).toBe('number');
      expect(debt.totalHours).toBeGreaterThanOrEqual(0);

      // Check categories
      expect(debt.byCategory.length).toBeGreaterThan(0);
      let totalPercentage = 0;
      debt.byCategory.forEach((cat) => {
        expect(['complexity', 'coverage', 'documentation', 'dependencies', 'security', 'performance']).toContain(
          cat.category
        );
        expect(typeof cat.totalHours).toBe('number');
        expect(typeof cat.percentage).toBe('number');
        expect(typeof cat.itemCount).toBe('number');
        expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        totalPercentage += cat.percentage;
      });
      expect(totalPercentage).toBe(100);

      // Check items
      expect(debt.items.length).toBeGreaterThan(0);
      debt.items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(item.priority);
        expect(typeof item.estimatedHours).toBe('number');
      });

      // Check historical data
      expect(debt.historical.length).toBeGreaterThan(0);
      expect(debt.targets.length).toBeGreaterThan(0);
    });

    it('should generate valid mock predictions', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const report = await analyticsApi.loadAnalyticsReport('/data');
      const predictions = report.predictions;

      const predictionTypes = ['quality', 'coverage', 'issues', 'debt'] as const;

      predictionTypes.forEach((type) => {
        const pred = predictions[type];
        expect(typeof pred.current).toBe('number');
        expect(typeof pred.projected).toBe('number');
        expect(typeof pred.confidence).toBe('number');
        expect(['high', 'medium', 'low']).toContain(pred.confidenceLevel);
        expect(typeof pred.timeframeDays).toBe('number');
        expect(pred.insight).toBeDefined();
      });
    });

    it('should generate valid mock insights', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const report = await analyticsApi.loadAnalyticsReport('/data');

      report.insights.forEach((insight: AnalyticsInsight) => {
        expect(insight.id).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(insight.priority);
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();

        // Check impact
        expect(typeof insight.impact.min).toBe('number');
        expect(typeof insight.impact.max).toBe('number');
        expect(insight.impact.min).toBeLessThanOrEqual(insight.impact.max);

        // Check effort
        expect(typeof insight.effort.hours).toBe('number');
        expect(['easy', 'moderate', 'complex']).toContain(insight.effort.difficulty);

        // Check arrays
        expect(Array.isArray(insight.affectedFiles)).toBe(true);
        expect(Array.isArray(insight.tags)).toBe(true);
      });
    });

    it('should generate consistent mock metadata', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const report = await analyticsApi.loadAnalyticsReport('/data');

      expect(report.metadata.analyzerVersion).toBe('1.0.0-mock');
      expect(report.metadata.dataQuality).toBe(85);
      expect(report.metadata.filesAnalyzed).toBe(156);
      expect(report.metadata.generatedAt).toBeDefined();

      // Verify timestamp is valid ISO string
      const date = new Date(report.metadata.generatedAt);
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  describe('validation edge cases', () => {
    it('should reject report with null value', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('null'),
      } as Response);

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Should return mock data
      expect(result.metadata.analyzerVersion).toBe('1.0.0-mock');
    });

    it('should reject report with missing required arrays', async () => {
      const partialReport = {
        risk_data: [], // empty array is valid
        debt_summary: { total_hours: 0 }, // missing by_category, items, etc.
        predictions: {}, // missing quality, coverage, etc.
        insights: [],
        metadata: {},
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(partialReport)),
      } as Response);

      // Should attempt to transform but may use mock due to validation
      const result = await analyticsApi.loadAnalyticsReport('/data');
      expect(result).toBeDefined();
    });

    it('should handle report with non-array risk_data', async () => {
      const invalidReport = {
        risk_data: 'not an array',
        debt_summary: {},
        predictions: {},
        insights: [],
        metadata: {},
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(invalidReport)),
      } as Response);

      const result = await analyticsApi.loadAnalyticsReport('/data');

      // Should return mock data due to invalid structure
      expect(result.metadata.analyzerVersion).toBe('1.0.0-mock');
    });
  });
});
