/**
 * Analytics Types and Helper Functions Tests
 *
 * Tests for type helper functions defined in analytics.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getRiskLevelFromScore,
  getConfidenceLevelFromScore,
  getRiskLevelColor,
  getConfidenceLevelColor,
  getInsightPriorityColor,
  formatTimeframe,
  formatHours,
} from '../analytics';
import type {
  RiskLevel,
  ConfidenceLevel,
  InsightPriority,
  RiskData,
  DebtItem,
  DebtSummaryByCategory,
  TimeSeriesDataPoint,
  PredictionSummary,
  AnalyticsInsight,
  AnalyticsReport,
} from '../analytics';

describe('analytics helper functions', () => {
  describe('getRiskLevelFromScore', () => {
    it('should return critical for scores >= 80', () => {
      expect(getRiskLevelFromScore(80)).toBe('critical');
      expect(getRiskLevelFromScore(90)).toBe('critical');
      expect(getRiskLevelFromScore(100)).toBe('critical');
    });

    it('should return high for scores >= 60 and < 80', () => {
      expect(getRiskLevelFromScore(60)).toBe('high');
      expect(getRiskLevelFromScore(70)).toBe('high');
      expect(getRiskLevelFromScore(79)).toBe('high');
      expect(getRiskLevelFromScore(79.9)).toBe('high');
    });

    it('should return medium for scores >= 40 and < 60', () => {
      expect(getRiskLevelFromScore(40)).toBe('medium');
      expect(getRiskLevelFromScore(50)).toBe('medium');
      expect(getRiskLevelFromScore(59)).toBe('medium');
      expect(getRiskLevelFromScore(59.9)).toBe('medium');
    });

    it('should return low for scores >= 20 and < 40', () => {
      expect(getRiskLevelFromScore(20)).toBe('low');
      expect(getRiskLevelFromScore(30)).toBe('low');
      expect(getRiskLevelFromScore(39)).toBe('low');
      expect(getRiskLevelFromScore(39.9)).toBe('low');
    });

    it('should return minimal for scores < 20', () => {
      expect(getRiskLevelFromScore(0)).toBe('minimal');
      expect(getRiskLevelFromScore(10)).toBe('minimal');
      expect(getRiskLevelFromScore(19)).toBe('minimal');
      expect(getRiskLevelFromScore(19.9)).toBe('minimal');
    });

    it('should handle edge cases', () => {
      expect(getRiskLevelFromScore(0)).toBe('minimal');
      expect(getRiskLevelFromScore(-1)).toBe('minimal');
      expect(getRiskLevelFromScore(100)).toBe('critical');
      expect(getRiskLevelFromScore(150)).toBe('critical');
    });
  });

  describe('getConfidenceLevelFromScore', () => {
    it('should return high for scores >= 80', () => {
      expect(getConfidenceLevelFromScore(80)).toBe('high');
      expect(getConfidenceLevelFromScore(90)).toBe('high');
      expect(getConfidenceLevelFromScore(100)).toBe('high');
    });

    it('should return medium for scores >= 50 and < 80', () => {
      expect(getConfidenceLevelFromScore(50)).toBe('medium');
      expect(getConfidenceLevelFromScore(60)).toBe('medium');
      expect(getConfidenceLevelFromScore(79)).toBe('medium');
      expect(getConfidenceLevelFromScore(79.9)).toBe('medium');
    });

    it('should return low for scores < 50', () => {
      expect(getConfidenceLevelFromScore(0)).toBe('low');
      expect(getConfidenceLevelFromScore(25)).toBe('low');
      expect(getConfidenceLevelFromScore(49)).toBe('low');
      expect(getConfidenceLevelFromScore(49.9)).toBe('low');
    });

    it('should handle edge cases', () => {
      expect(getConfidenceLevelFromScore(0)).toBe('low');
      expect(getConfidenceLevelFromScore(-10)).toBe('low');
      expect(getConfidenceLevelFromScore(100)).toBe('high');
      expect(getConfidenceLevelFromScore(120)).toBe('high');
    });
  });

  describe('getRiskLevelColor', () => {
    it('should return correct CSS variable for each risk level', () => {
      const levels: RiskLevel[] = ['critical', 'high', 'medium', 'low', 'minimal'];

      levels.forEach((level) => {
        const color = getRiskLevelColor(level);
        expect(color).toMatch(/^var\(--color-risk-\w+, #[0-9a-f]{6}\)$/);
      });
    });

    it('should return specific colors for each level', () => {
      expect(getRiskLevelColor('critical')).toContain('#b71c1c');
      expect(getRiskLevelColor('high')).toContain('#e53935');
      expect(getRiskLevelColor('medium')).toContain('#ff9800');
      expect(getRiskLevelColor('low')).toContain('#ffc107');
      expect(getRiskLevelColor('minimal')).toContain('#4caf50');
    });
  });

  describe('getConfidenceLevelColor', () => {
    it('should return correct CSS variable for each confidence level', () => {
      const levels: ConfidenceLevel[] = ['high', 'medium', 'low'];

      levels.forEach((level) => {
        const color = getConfidenceLevelColor(level);
        expect(color).toMatch(/^var\(--color-confidence-\w+, #[0-9a-f]{6}\)$/);
      });
    });

    it('should return specific colors for each level', () => {
      expect(getConfidenceLevelColor('high')).toContain('#0066cc');
      expect(getConfidenceLevelColor('medium')).toContain('#ff9800');
      expect(getConfidenceLevelColor('low')).toContain('#9e9e9e');
    });
  });

  describe('getInsightPriorityColor', () => {
    it('should return correct CSS variable for each priority', () => {
      const priorities: InsightPriority[] = ['high', 'medium', 'low'];

      priorities.forEach((priority) => {
        const color = getInsightPriorityColor(priority);
        expect(color).toMatch(/^var\(--color-\w+, #[0-9a-f]{6}\)$/);
      });
    });

    it('should return specific colors for each priority', () => {
      expect(getInsightPriorityColor('high')).toContain('#dc3545');
      expect(getInsightPriorityColor('medium')).toContain('#ff9800');
      expect(getInsightPriorityColor('low')).toContain('#17a2b8');
    });
  });

  describe('formatTimeframe', () => {
    it('should format known timeframes correctly', () => {
      expect(formatTimeframe('7d')).toBe('7 days');
      expect(formatTimeframe('30d')).toBe('30 days');
      expect(formatTimeframe('90d')).toBe('90 days');
      expect(formatTimeframe('6mo')).toBe('6 months');
      expect(formatTimeframe('1y')).toBe('1 year');
    });

    it('should return original value for unknown timeframes', () => {
      expect(formatTimeframe('unknown')).toBe('unknown');
      expect(formatTimeframe('2w')).toBe('2w');
      expect(formatTimeframe('custom')).toBe('custom');
      expect(formatTimeframe('')).toBe('');
    });
  });

  describe('formatHours', () => {
    it('should format minutes for hours < 1', () => {
      expect(formatHours(0.5)).toBe('30m');
      expect(formatHours(0.25)).toBe('15m');
      expect(formatHours(0.1)).toBe('6m');
      expect(formatHours(0.75)).toBe('45m');
    });

    it('should format hours for values < 24', () => {
      expect(formatHours(1)).toBe('1.0h');
      expect(formatHours(2.5)).toBe('2.5h');
      expect(formatHours(8)).toBe('8.0h');
      expect(formatHours(23.5)).toBe('23.5h');
    });

    it('should format days for values >= 24 (8-hour work day)', () => {
      expect(formatHours(24)).toBe('3d');
      expect(formatHours(32)).toBe('4d');
      expect(formatHours(40)).toBe('5d');
    });

    it('should format days and hours for non-exact day values', () => {
      expect(formatHours(28)).toBe('3d 4h');
      expect(formatHours(36)).toBe('4d 4h');
      expect(formatHours(25)).toBe('3d 1h');
    });

    it('should handle edge cases', () => {
      expect(formatHours(0)).toBe('0m');
      expect(formatHours(0.016667)).toBe('1m'); // 1 minute
    });
  });
});

describe('analytics type structure validation', () => {
  describe('RiskData type', () => {
    it('should accept valid RiskData objects', () => {
      const validRiskData: RiskData = {
        path: 'src/test.ts',
        displayName: 'Test Module',
        riskScore: 45.5,
        riskLevel: 'medium',
        factors: [
          { type: 'complexity', weight: 0.25, value: 50, score: 50 },
          { type: 'coverage', weight: 0.3, value: 40, score: 40, description: 'Low coverage' },
        ],
        confidence: 85,
        lastUpdated: '2024-01-15T10:00:00Z',
        directory: 'src',
      };

      expect(validRiskData.path).toBe('src/test.ts');
      expect(validRiskData.riskLevel).toBe('medium');
      expect(validRiskData.factors).toHaveLength(2);
    });

    it('should allow optional directory field', () => {
      const riskDataWithoutDir: RiskData = {
        path: 'src/test.ts',
        displayName: 'Test',
        riskScore: 50,
        riskLevel: 'medium',
        factors: [],
        confidence: 80,
        lastUpdated: '2024-01-15T10:00:00Z',
      };

      expect(riskDataWithoutDir.directory).toBeUndefined();
    });
  });

  describe('DebtItem type', () => {
    it('should accept valid DebtItem objects', () => {
      const validDebtItem: DebtItem = {
        id: 'debt-123',
        category: 'complexity',
        description: 'Refactor large function',
        estimatedHours: 4,
        priority: 'high',
        affectedFiles: ['src/large-function.ts'],
        createdAt: '2024-01-15T10:00:00Z',
      };

      expect(validDebtItem.id).toBe('debt-123');
      expect(validDebtItem.priority).toBe('high');
    });
  });

  describe('DebtSummaryByCategory type', () => {
    it('should accept valid category summary', () => {
      const summary: DebtSummaryByCategory = {
        category: 'complexity',
        label: 'Complexity',
        totalHours: 50,
        percentage: 25,
        itemCount: 10,
        color: '#e53935',
      };

      expect(summary.category).toBe('complexity');
      expect(summary.percentage).toBe(25);
    });
  });

  describe('TimeSeriesDataPoint type', () => {
    it('should accept valid time series data', () => {
      const dataPoint: TimeSeriesDataPoint = {
        timestamp: '2024-01-15T10:00:00Z',
        value: 42,
        label: 'Week 1',
      };

      expect(dataPoint.timestamp).toBe('2024-01-15T10:00:00Z');
      expect(dataPoint.value).toBe(42);
    });

    it('should allow optional label', () => {
      const dataPointNoLabel: TimeSeriesDataPoint = {
        timestamp: '2024-01-15T10:00:00Z',
        value: 42,
      };

      expect(dataPointNoLabel.label).toBeUndefined();
    });
  });

  describe('PredictionSummary type', () => {
    it('should accept valid prediction summary', () => {
      const prediction: PredictionSummary = {
        current: 82,
        projected: 88,
        confidence: 80,
        confidenceLevel: 'high',
        timeframeDays: 90,
        insight: 'Quality is improving steadily',
        goalValue: 90,
        goalDate: '2024-06-01T00:00:00Z',
      };

      expect(prediction.current).toBe(82);
      expect(prediction.confidenceLevel).toBe('high');
    });

    it('should allow optional goal fields', () => {
      const predictionNoGoal: PredictionSummary = {
        current: 82,
        projected: 88,
        confidence: 80,
        confidenceLevel: 'high',
        timeframeDays: 90,
        insight: 'Quality is improving steadily',
      };

      expect(predictionNoGoal.goalValue).toBeUndefined();
      expect(predictionNoGoal.goalDate).toBeUndefined();
    });
  });

  describe('AnalyticsInsight type', () => {
    it('should accept valid insight', () => {
      const insight: AnalyticsInsight = {
        id: 'insight-1',
        priority: 'high',
        title: 'Improve Type Safety',
        description: 'Several files are missing TypeScript strict mode',
        category: 'code-quality',
        affectedFiles: ['src/utils.ts', 'src/helpers.ts'],
        impact: {
          min: 5,
          max: 10,
          unit: '%',
          description: 'Quality score improvement',
        },
        effort: {
          hours: 4,
          difficulty: 'moderate',
          skills: ['TypeScript'],
        },
        tags: ['typescript', 'type-safety'],
        createdAt: '2024-01-15T10:00:00Z',
      };

      expect(insight.id).toBe('insight-1');
      expect(insight.priority).toBe('high');
      expect(insight.impact.min).toBeLessThanOrEqual(insight.impact.max);
    });

    it('should allow optional dismissedAt field', () => {
      const dismissedInsight: AnalyticsInsight = {
        id: 'insight-2',
        priority: 'low',
        title: 'Add Documentation',
        description: 'Add JSDoc comments',
        category: 'documentation',
        affectedFiles: [],
        impact: { min: 1, max: 2, unit: '%' },
        effort: { hours: 2, difficulty: 'easy' },
        tags: [],
        createdAt: '2024-01-10T10:00:00Z',
        dismissedAt: '2024-01-15T10:00:00Z',
      };

      expect(dismissedInsight.dismissedAt).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('AnalyticsReport type', () => {
    it('should accept valid complete report', () => {
      const report: AnalyticsReport = {
        riskData: [],
        debtSummary: {
          totalHours: 100,
          byCategory: [],
          items: [],
          historical: [],
          targets: [],
        },
        predictions: {
          quality: {
            current: 80,
            projected: 85,
            confidence: 75,
            confidenceLevel: 'medium',
            timeframeDays: 90,
            insight: 'Improving',
          },
          coverage: {
            current: 70,
            projected: 75,
            confidence: 70,
            confidenceLevel: 'medium',
            timeframeDays: 90,
            insight: 'Stable',
          },
          issues: {
            current: 20,
            projected: 15,
            confidence: 65,
            confidenceLevel: 'medium',
            timeframeDays: 90,
            insight: 'Decreasing',
          },
          debt: {
            current: 100,
            projected: 80,
            confidence: 60,
            confidenceLevel: 'medium',
            timeframeDays: 90,
            insight: 'Reducing',
          },
        },
        insights: [],
        metadata: {
          generatedAt: '2024-01-15T12:00:00Z',
          analyzerVersion: '1.0.0',
          dataQuality: 90,
          filesAnalyzed: 100,
        },
      };

      expect(report.metadata.analyzerVersion).toBe('1.0.0');
      expect(report.predictions.quality.confidenceLevel).toBe('medium');
    });
  });
});
