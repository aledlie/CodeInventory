/**
 * Predictions API Service Tests
 *
 * Tests for loading predictions reports, filtering risks, and scenario operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { predictionsApi } from '../predictionsApi';
import type { PredictionsReport, Risk, RiskFilters } from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger to suppress output during tests
vi.mock('../../helpers/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ============================================================================
// Test Data Factories
// ============================================================================

function createRawPredictionData(overrides = {}) {
  return {
    metric: 'quality_score',
    metric_label: 'Quality Score',
    historical: [
      { date: '2024-01-01', value: 75 },
      { date: '2024-01-02', value: 76 },
    ],
    predicted: [
      { date: '2024-01-03', value: 77 },
      { date: '2024-01-04', value: 78 },
      { date: '2024-01-05', value: 79 },
    ],
    confidence_bands: {
      lower: [
        { date: '2024-01-03', value: 74 },
        { date: '2024-01-04', value: 75 },
        { date: '2024-01-05', value: 76 },
      ],
      upper: [
        { date: '2024-01-03', value: 80 },
        { date: '2024-01-04', value: 81 },
        { date: '2024-01-05', value: 82 },
      ],
    },
    confidence: 85,
    horizon: 90,
    methodology: 'linear-regression',
    factors: [
      {
        name: 'Code Review Rate',
        weight: 0.7,
        direction: 'positive',
        explanation: 'Higher code review rates improve quality',
      },
    ],
    goals: [
      {
        value: 90,
        label: 'Target Quality',
        predicted_date: '2024-04-01',
        achievable: true,
        confidence: 80,
      },
    ],
    unit: '%',
    min: 0,
    max: 100,
    ...overrides,
  };
}

function createRawRisk(overrides = {}): Record<string, unknown> {
  return {
    id: 'risk-001',
    name: 'Low Test Coverage',
    description: 'Test coverage is below acceptable threshold',
    impact: 'high',
    probability: 'medium',
    category: 'coverage',
    affected_files: ['src/utils/helper.ts', 'src/services/api.ts'],
    mitigation: 'Add unit tests for uncovered functions',
    estimated_effort: 8,
    confidence: 90,
    is_active: true,
    identified_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    ...overrides,
  };
}

function createRawScenarioResult(overrides = {}) {
  return {
    scenario: {
      name: 'Current',
      coverage_growth_rate: 2.0,
      issue_resolution_rate: 5,
      new_issues_rate: 3,
      dependency_update_rate: 1,
      custom_factors: { team_size: 5 },
    },
    prediction: createRawPredictionData(),
    days_to_90_quality: 45,
    days_to_target_coverage: 60,
    projected_quality: 88,
    projected_coverage: 85,
    ...overrides,
  };
}

function createRawPredictionsReport(overrides = {}): Record<string, unknown> {
  return {
    quality_prediction: createRawPredictionData({ metric: 'quality_score' }),
    coverage_prediction: createRawPredictionData({ metric: 'coverage' }),
    issues_prediction: createRawPredictionData({ metric: 'issues' }),
    risks: [
      createRawRisk({ id: 'risk-001', impact: 'critical', probability: 'high', category: 'quality' }),
      createRawRisk({ id: 'risk-002', impact: 'high', probability: 'medium', category: 'coverage' }),
      createRawRisk({ id: 'risk-003', impact: 'medium', probability: 'low', category: 'dependency', is_active: false }),
    ],
    scenarios: {
      current: createRawScenarioResult({ scenario: { ...createRawScenarioResult().scenario, name: 'Current' } }),
      accelerated: createRawScenarioResult({ scenario: { ...createRawScenarioResult().scenario, name: 'Accelerated' } }),
      relaxed: createRawScenarioResult({ scenario: { ...createRawScenarioResult().scenario, name: 'Relaxed' } }),
    },
    summary: {
      total_risks: 3,
      critical_risks: 1,
      high_risks: 1,
      average_confidence: 85,
      trend_direction: 'improving',
    },
    generated_at: '2024-01-15T10:00:00Z',
    analyzer_version: '1.0.0',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('predictionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPredictionsReport', () => {
    it('should load and transform a valid predictions report', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      expect(result).not.toBeNull();
      expect(result!.qualityPrediction.metric).toBe('quality_score');
      expect(result!.qualityPrediction.metricLabel).toBe('Quality Score');
      expect(result!.risks).toHaveLength(3);
      expect(result!.summary.totalRisks).toBe(3);
      expect(result!.summary.trendDirection).toBe('improving');
      expect(mockFetch).toHaveBeenCalledWith('/data/predictions/predictions_latest.json');
    });

    it('should transform snake_case to camelCase correctly', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      // Check prediction data transformation
      expect(result!.qualityPrediction.confidenceBands).toBeDefined();
      expect(result!.qualityPrediction.confidenceBands.lower).toHaveLength(3);

      // Check risk transformation
      const risk = result!.risks[0];
      expect(risk.affectedFiles).toBeDefined();
      expect(risk.estimatedEffort).toBeDefined();
      expect(risk.isActive).toBeDefined();
      expect(risk.identifiedAt).toBeDefined();
      expect(risk.updatedAt).toBeDefined();

      // Check scenario transformation
      expect(result!.scenarios.current.scenario.coverageGrowthRate).toBeDefined();
      expect(result!.scenarios.current.scenario.issueResolutionRate).toBeDefined();
      expect(result!.scenarios.current.daysTo90Quality).toBeDefined();
      expect(result!.scenarios.current.daysToTargetCoverage).toBeDefined();

      // Check summary transformation
      expect(result!.summary.totalRisks).toBe(3);
      expect(result!.summary.criticalRisks).toBe(1);
      expect(result!.summary.highRisks).toBe(1);
      expect(result!.summary.averageConfidence).toBe(85);
    });

    it('should return null for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      );
    });

    it('should throw error for invalid report structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: true }),
      });

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'Predictions report has invalid structure'
      );
    });

    it('should throw error for null data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'Predictions report has invalid structure'
      );
    });

    it('should throw error for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle prediction factors correctly', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      const factors = result!.qualityPrediction.factors;
      expect(factors).toHaveLength(1);
      expect(factors[0].name).toBe('Code Review Rate');
      expect(factors[0].weight).toBe(0.7);
      expect(factors[0].direction).toBe('positive');
    });

    it('should handle goal markers correctly', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      const goals = result!.qualityPrediction.goals;
      expect(goals).toBeDefined();
      expect(goals).toHaveLength(1);
      expect(goals![0].value).toBe(90);
      expect(goals![0].label).toBe('Target Quality');
      expect(goals![0].predictedDate).toBe('2024-04-01');
      expect(goals![0].achievable).toBe(true);
    });
  });

  describe('getPrediction', () => {
    it('should return quality prediction for qualityScore metric', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getPrediction('/data', 'qualityScore');

      expect(result).not.toBeNull();
      expect(result!.metric).toBe('quality_score');
    });

    it('should return coverage prediction for coverage metric', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getPrediction('/data', 'coverage');

      expect(result).not.toBeNull();
      expect(result!.metric).toBe('coverage');
    });

    it('should return issues prediction for issues metric', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getPrediction('/data', 'issues');

      expect(result).not.toBeNull();
      expect(result!.metric).toBe('issues');
    });

    it('should return null when report is not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await predictionsApi.getPrediction('/data', 'qualityScore');

      expect(result).toBeNull();
    });

    it('should slice prediction data when horizon is smaller than default', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getPrediction('/data', 'qualityScore', 2);

      expect(result).not.toBeNull();
      expect(result!.horizon).toBe(2);
      expect(result!.predicted).toHaveLength(2);
      expect(result!.confidenceBands.lower).toHaveLength(2);
      expect(result!.confidenceBands.upper).toHaveLength(2);
    });

    it('should return full prediction when horizon matches or exceeds data', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getPrediction('/data', 'qualityScore', 90);

      expect(result).not.toBeNull();
      expect(result!.horizon).toBe(90);
      expect(result!.predicted).toHaveLength(3); // Original length preserved
    });
  });

  describe('getRisks', () => {
    it('should return all risks without filters', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getRisks('/data');

      expect(result).toHaveLength(3);
    });

    it('should return empty array when report not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await predictionsApi.getRisks('/data');

      expect(result).toEqual([]);
    });

    it('should filter by impact levels', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = { impacts: ['critical'] };
      const result = await predictionsApi.getRisks('/data', filters);

      expect(result).toHaveLength(1);
      expect(result[0].impact).toBe('critical');
    });

    it('should filter by probability levels', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = { probabilities: ['high'] };
      const result = await predictionsApi.getRisks('/data', filters);

      expect(result).toHaveLength(1);
      expect(result[0].probability).toBe('high');
    });

    it('should filter by categories', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = { categories: ['coverage', 'dependency'] };
      const result = await predictionsApi.getRisks('/data', filters);

      expect(result).toHaveLength(2);
      expect(result.every((r) => ['coverage', 'dependency'].includes(r.category))).toBe(true);
    });

    it('should filter by active status', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = { activeOnly: true };
      const result = await predictionsApi.getRisks('/data', filters);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.isActive)).toBe(true);
    });

    it('should filter by minimum confidence', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = { minConfidence: 85 };
      const result = await predictionsApi.getRisks('/data', filters);

      expect(result.every((r) => r.confidence >= 85)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = {
        impacts: ['critical', 'high'],
        activeOnly: true,
        minConfidence: 80,
      };
      const result = await predictionsApi.getRisks('/data', filters);

      expect(result).toHaveLength(2);
      expect(result.every((r) => ['critical', 'high'].includes(r.impact))).toBe(true);
      expect(result.every((r) => r.isActive)).toBe(true);
      expect(result.every((r) => r.confidence >= 80)).toBe(true);
    });

    it('should return empty array when no risks match filters', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = { impacts: ['low'] };
      const result = await predictionsApi.getRisks('/data', filters);

      expect(result).toEqual([]);
    });
  });

  describe('getScenarios', () => {
    it('should return all scenarios', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getScenarios('/data');

      expect(result).not.toBeNull();
      expect(result!.current).toBeDefined();
      expect(result!.accelerated).toBeDefined();
      expect(result!.relaxed).toBeDefined();
    });

    it('should return null when report not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await predictionsApi.getScenarios('/data');

      expect(result).toBeNull();
    });

    it('should transform scenario configurations correctly', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getScenarios('/data');

      const currentScenario = result!.current.scenario;
      expect(currentScenario.name).toBe('Current');
      expect(currentScenario.coverageGrowthRate).toBe(2.0);
      expect(currentScenario.issueResolutionRate).toBe(5);
      expect(currentScenario.newIssuesRate).toBe(3);
      expect(currentScenario.dependencyUpdateRate).toBe(1);
      expect(currentScenario.customFactors).toEqual({ team_size: 5 });
    });

    it('should transform scenario results correctly', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getScenarios('/data');

      const current = result!.current;
      expect(current.daysTo90Quality).toBe(45);
      expect(current.daysToTargetCoverage).toBe(60);
      expect(current.projectedQuality).toBe(88);
      expect(current.projectedCoverage).toBe(85);
      expect(current.prediction).toBeDefined();
    });
  });

  describe('updateScenario', () => {
    it('should return scenario result with custom config', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const customScenario = {
        name: 'Custom',
        coverageGrowthRate: 5.0,
        issueResolutionRate: 10,
        newIssuesRate: 2,
        dependencyUpdateRate: 2,
      };

      const result = await predictionsApi.updateScenario('/data', customScenario);

      expect(result).not.toBeNull();
      expect(result!.scenario).toEqual(customScenario);
      expect(result!.prediction).toBeDefined();
    });

    it('should return null when report not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await predictionsApi.updateScenario('/data', {
        name: 'Custom',
        coverageGrowthRate: 5.0,
        issueResolutionRate: 10,
        newIssuesRate: 2,
        dependencyUpdateRate: 2,
      });

      expect(result).toBeNull();
    });
  });

  describe('getPredictionsSummary', () => {
    it('should return summary statistics', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.getPredictionsSummary('/data');

      expect(result).not.toBeNull();
      expect(result!.totalRisks).toBe(3);
      expect(result!.criticalRisks).toBe(1);
      expect(result!.highRisks).toBe(1);
      expect(result!.averageConfidence).toBe(85);
      expect(result!.trendDirection).toBe('improving');
    });

    it('should return null when report not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await predictionsApi.getPredictionsSummary('/data');

      expect(result).toBeNull();
    });
  });

  describe('validation', () => {
    it('should reject report missing quality_prediction', async () => {
      const invalidReport = createRawPredictionsReport();
      delete (invalidReport as Record<string, unknown>).quality_prediction;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidReport),
      });

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'Predictions report has invalid structure'
      );
    });

    it('should reject report missing risks array', async () => {
      const invalidReport = createRawPredictionsReport();
      (invalidReport as Record<string, unknown>).risks = 'not an array';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidReport),
      });

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'Predictions report has invalid structure'
      );
    });

    it('should reject report missing scenarios object', async () => {
      const invalidReport = createRawPredictionsReport();
      delete (invalidReport as Record<string, unknown>).scenarios;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidReport),
      });

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'Predictions report has invalid structure'
      );
    });

    it('should reject report missing summary object', async () => {
      const invalidReport = createRawPredictionsReport();
      delete (invalidReport as Record<string, unknown>).summary;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidReport),
      });

      await expect(predictionsApi.loadPredictionsReport('/data')).rejects.toThrow(
        'Predictions report has invalid structure'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty risks array', async () => {
      const rawReport = createRawPredictionsReport({ risks: [] });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      expect(result).not.toBeNull();
      expect(result!.risks).toEqual([]);
    });

    it('should handle prediction without goals', async () => {
      const predictionWithoutGoals = createRawPredictionData();
      delete (predictionWithoutGoals as Record<string, unknown>).goals;

      const rawReport = createRawPredictionsReport({
        quality_prediction: predictionWithoutGoals,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      expect(result).not.toBeNull();
      expect(result!.qualityPrediction.goals).toBeUndefined();
    });

    it('should handle scenario without optional days fields', async () => {
      const scenarioWithoutDays = createRawScenarioResult();
      delete (scenarioWithoutDays as Record<string, unknown>).days_to_90_quality;
      delete (scenarioWithoutDays as Record<string, unknown>).days_to_target_coverage;

      const rawReport = createRawPredictionsReport({
        scenarios: {
          current: scenarioWithoutDays,
          accelerated: createRawScenarioResult(),
          relaxed: createRawScenarioResult(),
        },
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      expect(result).not.toBeNull();
      expect(result!.scenarios.current.daysTo90Quality).toBeUndefined();
      expect(result!.scenarios.current.daysToTargetCoverage).toBeUndefined();
    });

    it('should handle prediction without min/max bounds', async () => {
      const predictionWithoutBounds = createRawPredictionData();
      delete (predictionWithoutBounds as Record<string, unknown>).min;
      delete (predictionWithoutBounds as Record<string, unknown>).max;

      const rawReport = createRawPredictionsReport({
        quality_prediction: predictionWithoutBounds,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      expect(result).not.toBeNull();
      expect(result!.qualityPrediction.min).toBeUndefined();
      expect(result!.qualityPrediction.max).toBeUndefined();
    });

    it('should handle goal without predicted_date', async () => {
      const predictionWithPartialGoal = createRawPredictionData({
        goals: [
          {
            value: 90,
            label: 'Target',
            achievable: false,
            confidence: 20,
          },
        ],
      });

      const rawReport = createRawPredictionsReport({
        quality_prediction: predictionWithPartialGoal,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const result = await predictionsApi.loadPredictionsReport('/data');

      expect(result).not.toBeNull();
      const goal = result!.qualityPrediction.goals![0];
      expect(goal.predictedDate).toBeUndefined();
      expect(goal.achievable).toBe(false);
    });

    it('should handle empty filter arrays', async () => {
      const rawReport = createRawPredictionsReport();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawReport),
      });

      const filters: RiskFilters = {
        impacts: [],
        probabilities: [],
        categories: [],
      };
      const result = await predictionsApi.getRisks('/data', filters);

      // Empty arrays should not filter (return all risks)
      expect(result).toHaveLength(3);
    });
  });
});
