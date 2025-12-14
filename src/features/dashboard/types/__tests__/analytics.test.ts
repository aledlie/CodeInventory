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
  RiskFactorType,
  DebtCategory,
  MetricType,
  AnalyticsTimeRange,
  BurndownStatus,
  HeatmapCell,
  RiskHeatmapProps,
  DebtBurndownChartProps,
  DebtBurndownSummary,
  CardAction,
  PredictiveTrendCardProps,
  ImpactEstimate,
  EffortEstimate,
  AnalyticsInsightCardProps,
  AnalyticsFilters,
  RiskFactor,
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

describe('additional analytics type structure validation', () => {
  describe('RiskFactor type', () => {
    it('should accept valid risk factor with all properties', () => {
      const factor: RiskFactor = {
        type: 'complexity',
        weight: 0.25,
        value: 75,
        score: 75,
        description: 'High cyclomatic complexity detected',
      };

      expect(factor.type).toBe('complexity');
      expect(factor.weight).toBeGreaterThan(0);
      expect(factor.weight).toBeLessThanOrEqual(1);
    });

    it('should accept risk factor without optional description', () => {
      const factor: RiskFactor = {
        type: 'coverage',
        weight: 0.3,
        value: 40,
        score: 60,
      };

      expect(factor.description).toBeUndefined();
    });

    it('should accept all valid risk factor types', () => {
      const types: RiskFactorType[] = ['complexity', 'coverage', 'dependencies', 'age', 'churn'];

      types.forEach((type) => {
        const factor: RiskFactor = {
          type,
          weight: 0.2,
          value: 50,
          score: 50,
        };
        expect(factor.type).toBe(type);
      });
    });
  });

  describe('HeatmapCell type', () => {
    it('should accept valid heatmap cell with tooltip', () => {
      const cell: HeatmapCell = {
        rowId: 'src/components/Button',
        rowLabel: 'Button',
        columnId: 'complexity',
        columnLabel: 'Complexity',
        value: 65,
        riskLevel: 'high',
        tooltip: 'High complexity: 65/100',
      };

      expect(cell.rowId).toBe('src/components/Button');
      expect(cell.riskLevel).toBe('high');
    });

    it('should accept heatmap cell without optional tooltip', () => {
      const cell: HeatmapCell = {
        rowId: 'src/utils',
        rowLabel: 'Utils',
        columnId: 'coverage',
        columnLabel: 'Coverage',
        value: 30,
        riskLevel: 'low',
      };

      expect(cell.tooltip).toBeUndefined();
    });
  });

  describe('RiskHeatmapProps type', () => {
    it('should accept valid props with all options', () => {
      const props: RiskHeatmapProps = {
        data: [],
        maxItems: 15,
        onItemClick: () => {},
        groupByDirectory: true,
        showLegend: true,
        height: 400,
        isLoading: false,
      };

      expect(props.maxItems).toBe(15);
      expect(props.groupByDirectory).toBe(true);
    });

    it('should accept minimal required props', () => {
      const props: RiskHeatmapProps = {
        data: [],
      };

      expect(props.data).toEqual([]);
      expect(props.maxItems).toBeUndefined();
      expect(props.onItemClick).toBeUndefined();
    });
  });

  describe('DebtBurndownChartProps type', () => {
    it('should accept valid props with projected data', () => {
      const props: DebtBurndownChartProps = {
        actualData: [{ timestamp: '2024-01-01', value: 100 }],
        targetData: [{ timestamp: '2024-01-01', value: 80 }],
        projectedData: [{ timestamp: '2024-02-01', value: 60 }],
        timeRange: '90d',
        height: 300,
        currentDebt: 100,
        targetDebt: 50,
        showStatus: true,
        isLoading: false,
      };

      expect(props.timeRange).toBe('90d');
      expect(props.projectedData).toHaveLength(1);
    });

    it('should accept props without optional fields', () => {
      const props: DebtBurndownChartProps = {
        actualData: [],
        targetData: [],
        timeRange: '30d',
      };

      expect(props.projectedData).toBeUndefined();
      expect(props.currentDebt).toBeUndefined();
    });
  });

  describe('DebtBurndownSummary type', () => {
    it('should accept valid summary with all statuses', () => {
      const statuses: BurndownStatus[] = ['ahead', 'on-track', 'behind', 'critical'];

      statuses.forEach((status) => {
        const summary: DebtBurndownSummary = {
          currentDebt: 100,
          targetDebt: 50,
          status,
          progressPercent: 50,
          estimatedDaysToTarget: 30,
          trend: 'improving',
          weeklyChangeRate: -5,
        };
        expect(summary.status).toBe(status);
      });
    });

    it('should accept summary with null estimatedDaysToTarget', () => {
      const summary: DebtBurndownSummary = {
        currentDebt: 100,
        targetDebt: 50,
        status: 'behind',
        progressPercent: 25,
        estimatedDaysToTarget: null,
        trend: 'declining',
        weeklyChangeRate: 3,
      };

      expect(summary.estimatedDaysToTarget).toBeNull();
    });

    it('should accept all trend types', () => {
      const trends: Array<'improving' | 'declining' | 'stable'> = ['improving', 'declining', 'stable'];

      trends.forEach((trend) => {
        const summary: DebtBurndownSummary = {
          currentDebt: 100,
          targetDebt: 50,
          status: 'on-track',
          progressPercent: 50,
          estimatedDaysToTarget: 30,
          trend,
          weeklyChangeRate: 0,
        };
        expect(summary.trend).toBe(trend);
      });
    });
  });

  describe('CardAction type', () => {
    it('should accept valid card action', () => {
      const action: CardAction = {
        label: 'View Details',
        onClick: () => {},
        variant: 'primary',
        disabled: false,
      };

      expect(action.label).toBe('View Details');
      expect(action.variant).toBe('primary');
    });

    it('should accept action without optional disabled', () => {
      const action: CardAction = {
        label: 'Dismiss',
        onClick: () => {},
        variant: 'secondary',
      };

      expect(action.disabled).toBeUndefined();
    });
  });

  describe('PredictiveTrendCardProps type', () => {
    it('should accept valid props with all options', () => {
      const props: PredictiveTrendCardProps = {
        metric: 'quality',
        metricLabel: 'Quality Score',
        currentValue: 82,
        projectedValue: 90,
        confidence: 85,
        confidenceLevel: 'high',
        timeframe: '90d',
        insight: 'Quality is improving based on recent trends',
        actions: [{ label: 'View', onClick: () => {}, variant: 'primary' }],
        unit: '%',
        increaseIsGood: true,
        isLoading: false,
        goalValue: 95,
        goalDate: '2024-06-01',
      };

      expect(props.metric).toBe('quality');
      expect(props.increaseIsGood).toBe(true);
    });

    it('should accept all metric types', () => {
      const metrics: MetricType[] = ['quality', 'coverage', 'issues', 'debt', 'complexity'];

      metrics.forEach((metric) => {
        const props: PredictiveTrendCardProps = {
          metric,
          metricLabel: metric,
          currentValue: 50,
          projectedValue: 60,
          confidence: 70,
          confidenceLevel: 'medium',
          timeframe: '30d',
        };
        expect(props.metric).toBe(metric);
      });
    });

    it('should accept minimal required props', () => {
      const props: PredictiveTrendCardProps = {
        metric: 'coverage',
        metricLabel: 'Test Coverage',
        currentValue: 70,
        projectedValue: 80,
        confidence: 75,
        confidenceLevel: 'medium',
        timeframe: '90d',
      };

      expect(props.insight).toBeUndefined();
      expect(props.actions).toBeUndefined();
      expect(props.unit).toBeUndefined();
    });
  });

  describe('ImpactEstimate type', () => {
    it('should accept valid impact with description', () => {
      const impact: ImpactEstimate = {
        min: 5,
        max: 15,
        unit: '%',
        description: 'Expected quality improvement',
      };

      expect(impact.min).toBeLessThanOrEqual(impact.max);
      expect(impact.unit).toBe('%');
    });

    it('should accept impact without optional description', () => {
      const impact: ImpactEstimate = {
        min: 10,
        max: 20,
        unit: 'hours',
      };

      expect(impact.description).toBeUndefined();
    });
  });

  describe('EffortEstimate type', () => {
    it('should accept valid effort with skills', () => {
      const effort: EffortEstimate = {
        hours: 8,
        difficulty: 'moderate',
        skills: ['TypeScript', 'React', 'Testing'],
      };

      expect(effort.difficulty).toBe('moderate');
      expect(effort.skills).toHaveLength(3);
    });

    it('should accept effort without optional skills', () => {
      const effort: EffortEstimate = {
        hours: 2,
        difficulty: 'easy',
      };

      expect(effort.skills).toBeUndefined();
    });

    it('should accept all difficulty levels', () => {
      const difficulties: Array<'easy' | 'moderate' | 'complex'> = ['easy', 'moderate', 'complex'];

      difficulties.forEach((difficulty) => {
        const effort: EffortEstimate = {
          hours: 4,
          difficulty,
        };
        expect(effort.difficulty).toBe(difficulty);
      });
    });
  });

  describe('AnalyticsInsightCardProps type', () => {
    it('should accept valid props with all options', () => {
      const props: AnalyticsInsightCardProps = {
        id: 'insight-123',
        priority: 'high',
        title: 'Improve Test Coverage',
        description: 'Several modules have low test coverage',
        affectedFiles: ['src/utils.ts', 'src/helpers.ts'],
        impact: { min: 5, max: 10, unit: '%' },
        effort: { hours: 8, difficulty: 'moderate' },
        category: 'testing',
        tags: ['coverage', 'quality'],
        onView: () => {},
        onDismiss: () => {},
        isLoading: false,
        compact: true,
      };

      expect(props.id).toBe('insight-123');
      expect(props.compact).toBe(true);
    });

    it('should accept minimal required props', () => {
      const props: AnalyticsInsightCardProps = {
        id: 'insight-456',
        priority: 'low',
        title: 'Add Documentation',
        description: 'Missing JSDoc comments',
        impact: { min: 1, max: 3, unit: '%' },
        effort: { hours: 2, difficulty: 'easy' },
      };

      expect(props.affectedFiles).toBeUndefined();
      expect(props.category).toBeUndefined();
      expect(props.tags).toBeUndefined();
    });
  });

  describe('AnalyticsFilters type', () => {
    it('should accept valid filters with all options', () => {
      const filters: AnalyticsFilters = {
        riskLevels: ['critical', 'high'],
        debtCategories: ['complexity', 'coverage'],
        insightPriorities: ['high', 'medium'],
        minConfidence: 70,
        filePattern: 'src/**/*.ts',
        timeRange: '90d',
      };

      expect(filters.riskLevels).toHaveLength(2);
      expect(filters.minConfidence).toBe(70);
    });

    it('should accept empty filters object', () => {
      const filters: AnalyticsFilters = {};

      expect(filters.riskLevels).toBeUndefined();
      expect(filters.debtCategories).toBeUndefined();
    });

    it('should accept all valid time ranges', () => {
      const timeRanges: AnalyticsTimeRange[] = ['7d', '30d', '90d', '6mo', '1y', 'all'];

      timeRanges.forEach((timeRange) => {
        const filters: AnalyticsFilters = { timeRange };
        expect(filters.timeRange).toBe(timeRange);
      });
    });

    it('should accept all valid risk levels', () => {
      const levels: RiskLevel[] = ['critical', 'high', 'medium', 'low', 'minimal'];
      const filters: AnalyticsFilters = { riskLevels: levels };

      expect(filters.riskLevels).toHaveLength(5);
    });

    it('should accept all valid debt categories', () => {
      const categories: DebtCategory[] = ['complexity', 'coverage', 'documentation', 'dependencies', 'security', 'performance'];
      const filters: AnalyticsFilters = { debtCategories: categories };

      expect(filters.debtCategories).toHaveLength(6);
    });

    it('should accept all valid insight priorities', () => {
      const priorities: InsightPriority[] = ['high', 'medium', 'low'];
      const filters: AnalyticsFilters = { insightPriorities: priorities };

      expect(filters.insightPriorities).toHaveLength(3);
    });
  });
});

describe('helper function edge cases', () => {
  describe('getRiskLevelFromScore boundary precision', () => {
    it('should handle exact boundary values correctly', () => {
      // Test exact boundaries
      expect(getRiskLevelFromScore(20)).toBe('low');
      expect(getRiskLevelFromScore(19.999)).toBe('minimal');
      expect(getRiskLevelFromScore(40)).toBe('medium');
      expect(getRiskLevelFromScore(39.999)).toBe('low');
      expect(getRiskLevelFromScore(60)).toBe('high');
      expect(getRiskLevelFromScore(59.999)).toBe('medium');
      expect(getRiskLevelFromScore(80)).toBe('critical');
      expect(getRiskLevelFromScore(79.999)).toBe('high');
    });

    it('should handle very small positive values', () => {
      expect(getRiskLevelFromScore(0.001)).toBe('minimal');
      expect(getRiskLevelFromScore(0.1)).toBe('minimal');
    });

    it('should handle very large values', () => {
      expect(getRiskLevelFromScore(1000)).toBe('critical');
      expect(getRiskLevelFromScore(Number.MAX_SAFE_INTEGER)).toBe('critical');
    });
  });

  describe('getConfidenceLevelFromScore boundary precision', () => {
    it('should handle exact boundary values correctly', () => {
      expect(getConfidenceLevelFromScore(50)).toBe('medium');
      expect(getConfidenceLevelFromScore(49.999)).toBe('low');
      expect(getConfidenceLevelFromScore(80)).toBe('high');
      expect(getConfidenceLevelFromScore(79.999)).toBe('medium');
    });
  });

  describe('formatHours precision and edge cases', () => {
    it('should handle fractional minutes correctly', () => {
      expect(formatHours(0.008333)).toBe('0m'); // ~30 seconds rounds to 0
      expect(formatHours(0.0167)).toBe('1m'); // ~1 minute
      expect(formatHours(0.0333)).toBe('2m'); // ~2 minutes
    });

    it('should handle values at hour/day boundary', () => {
      expect(formatHours(0.99)).toBe('59m');
      expect(formatHours(1.0)).toBe('1.0h');
      expect(formatHours(23.99)).toBe('24.0h');
      expect(formatHours(24)).toBe('3d');
    });

    it('should handle large values', () => {
      expect(formatHours(80)).toBe('10d');
      expect(formatHours(160)).toBe('20d');
      expect(formatHours(800)).toBe('100d');
    });

    it('should handle remainder hours correctly', () => {
      // 24.5 hours: days = floor(24.5/8) = 3, remainder = 24.5 % 8 = 0.5, rounds to 1h
      expect(formatHours(24.5)).toBe('3d 1h');
      expect(formatHours(25)).toBe('3d 1h');
      expect(formatHours(31)).toBe('3d 7h');
      expect(formatHours(32)).toBe('4d'); // Exactly 4 days
    });
  });

  describe('formatTimeframe with various inputs', () => {
    it('should handle numeric-like strings', () => {
      expect(formatTimeframe('123')).toBe('123');
      expect(formatTimeframe('0')).toBe('0');
    });

    it('should handle whitespace', () => {
      expect(formatTimeframe(' 7d ')).toBe(' 7d '); // Not trimmed
      expect(formatTimeframe('7d ')).toBe('7d ');
    });

    it('should be case sensitive', () => {
      expect(formatTimeframe('7D')).toBe('7D'); // Not matched
      expect(formatTimeframe('7d')).toBe('7 days');
    });
  });
});
