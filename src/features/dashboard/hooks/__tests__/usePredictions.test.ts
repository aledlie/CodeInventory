/**
 * Predictions Hooks Tests
 *
 * Tests for usePredictions hooks including predictions report, individual predictions,
 * risks, scenarios, summary, update scenario mutation, risk counts, and all predictions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense } from 'react';
import type { ReactNode } from 'react';
import {
  usePredictionsReport,
  usePrediction,
  useRisks,
  useScenarios,
  usePredictionsSummary,
  useUpdateScenario,
  useRiskCounts,
  useAllPredictions,
} from '../usePredictions';
import { predictionsApi } from '../../api/predictionsApi';
import type {
  PredictionsReport,
  PredictionData,
  Risk,
  ScenarioConfig,
  ScenarioResult,
  RiskFilters,
  DataPoint,
  PredictionFactor,
  GoalMarker,
} from '../../types';

// Mock the predictionsApi
vi.mock('../../api/predictionsApi', () => ({
  predictionsApi: {
    loadPredictionsReport: vi.fn(),
    getPrediction: vi.fn(),
    getRisks: vi.fn(),
    getScenarios: vi.fn(),
    getPredictionsSummary: vi.fn(),
    updateScenario: vi.fn(),
  },
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const mockDataPoints: DataPoint[] = [
  { date: '2024-01-01', value: 75 },
  { date: '2024-01-08', value: 77 },
  { date: '2024-01-15', value: 80 },
];

const mockPredictedPoints: DataPoint[] = [
  { date: '2024-01-22', value: 82 },
  { date: '2024-01-29', value: 84 },
  { date: '2024-02-05', value: 85 },
];

const mockConfidenceBandsLower: DataPoint[] = [
  { date: '2024-01-22', value: 78 },
  { date: '2024-01-29', value: 79 },
  { date: '2024-02-05', value: 80 },
];

const mockConfidenceBandsUpper: DataPoint[] = [
  { date: '2024-01-22', value: 86 },
  { date: '2024-01-29', value: 89 },
  { date: '2024-02-05', value: 90 },
];

const mockPredictionFactor: PredictionFactor = {
  name: 'Test Coverage Increase',
  weight: 0.4,
  direction: 'positive',
  explanation: 'Increased test coverage correlates with quality improvement',
};

const mockGoalMarker: GoalMarker = {
  value: 90,
  label: '90% Quality Target',
  predictedDate: '2024-03-15',
  achievable: true,
  confidence: 85,
};

const mockQualityPrediction: PredictionData = {
  metric: 'qualityScore',
  metricLabel: 'Quality Score',
  historical: mockDataPoints,
  predicted: mockPredictedPoints,
  confidenceBands: {
    lower: mockConfidenceBandsLower,
    upper: mockConfidenceBandsUpper,
  },
  confidence: 85,
  horizon: 90,
  methodology: 'linear-regression',
  factors: [mockPredictionFactor],
  goals: [mockGoalMarker],
  unit: '%',
  min: 0,
  max: 100,
};

const mockCoveragePrediction: PredictionData = {
  metric: 'coverage',
  metricLabel: 'Test Coverage',
  historical: [
    { date: '2024-01-01', value: 70 },
    { date: '2024-01-08', value: 72 },
    { date: '2024-01-15', value: 75 },
  ],
  predicted: [
    { date: '2024-01-22', value: 77 },
    { date: '2024-01-29', value: 79 },
    { date: '2024-02-05', value: 80 },
  ],
  confidenceBands: {
    lower: [
      { date: '2024-01-22', value: 74 },
      { date: '2024-01-29', value: 75 },
      { date: '2024-02-05', value: 76 },
    ],
    upper: [
      { date: '2024-01-22', value: 80 },
      { date: '2024-01-29', value: 83 },
      { date: '2024-02-05', value: 84 },
    ],
  },
  confidence: 78,
  horizon: 90,
  methodology: 'exponential-smoothing',
  factors: [],
  unit: '%',
  min: 0,
  max: 100,
};

const mockIssuesPrediction: PredictionData = {
  metric: 'issues',
  metricLabel: 'Open Issues',
  historical: [
    { date: '2024-01-01', value: 45 },
    { date: '2024-01-08', value: 42 },
    { date: '2024-01-15', value: 38 },
  ],
  predicted: [
    { date: '2024-01-22', value: 35 },
    { date: '2024-01-29', value: 32 },
    { date: '2024-02-05', value: 30 },
  ],
  confidenceBands: {
    lower: [
      { date: '2024-01-22', value: 30 },
      { date: '2024-01-29', value: 25 },
      { date: '2024-02-05', value: 22 },
    ],
    upper: [
      { date: '2024-01-22', value: 40 },
      { date: '2024-01-29', value: 39 },
      { date: '2024-02-05', value: 38 },
    ],
  },
  confidence: 72,
  horizon: 90,
  methodology: 'arima',
  factors: [],
  unit: 'issues',
  min: 0,
};

const mockCriticalRisk: Risk = {
  id: 'risk-1',
  name: 'Critical Security Vulnerability',
  description: 'Outdated dependency with known CVE',
  impact: 'critical',
  probability: 'high',
  category: 'security',
  affectedFiles: ['package.json', 'package-lock.json'],
  mitigation: 'Update lodash to version 4.17.21 or higher',
  estimatedEffort: 2,
  confidence: 95,
  isActive: true,
  identifiedAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockHighRisk: Risk = {
  id: 'risk-2',
  name: 'Test Coverage Gap',
  description: 'Authentication module has low test coverage',
  impact: 'high',
  probability: 'medium',
  category: 'coverage',
  affectedFiles: ['src/services/auth.ts', 'src/middleware/auth.ts'],
  mitigation: 'Add unit and integration tests for auth flows',
  estimatedEffort: 8,
  confidence: 88,
  isActive: true,
  identifiedAt: '2024-01-12T14:00:00Z',
  updatedAt: '2024-01-14T09:00:00Z',
};

const mockMediumRisk: Risk = {
  id: 'risk-3',
  name: 'Code Complexity',
  description: 'High cyclomatic complexity in utils module',
  impact: 'medium',
  probability: 'low',
  category: 'quality',
  affectedFiles: ['src/utils/helpers.ts'],
  mitigation: 'Refactor complex functions into smaller units',
  estimatedEffort: 4,
  confidence: 75,
  isActive: true,
  identifiedAt: '2024-01-08T11:00:00Z',
  updatedAt: '2024-01-08T11:00:00Z',
};

const mockLowRisk: Risk = {
  id: 'risk-4',
  name: 'Minor Performance Issue',
  description: 'Unoptimized array operations in render loop',
  impact: 'low',
  probability: 'medium',
  category: 'performance',
  affectedFiles: ['src/components/DataGrid.tsx'],
  mitigation: 'Use memoization for expensive computations',
  estimatedEffort: 1,
  confidence: 65,
  isActive: false,
  identifiedAt: '2024-01-05T16:00:00Z',
  updatedAt: '2024-01-06T10:00:00Z',
};

const mockScenarioConfig: ScenarioConfig = {
  name: 'current',
  coverageGrowthRate: 0.02,
  issueResolutionRate: 5,
  newIssuesRate: 3,
  dependencyUpdateRate: 2,
};

const mockAcceleratedScenarioConfig: ScenarioConfig = {
  name: 'accelerated',
  coverageGrowthRate: 0.05,
  issueResolutionRate: 10,
  newIssuesRate: 2,
  dependencyUpdateRate: 4,
};

const mockRelaxedScenarioConfig: ScenarioConfig = {
  name: 'relaxed',
  coverageGrowthRate: 0.01,
  issueResolutionRate: 3,
  newIssuesRate: 4,
  dependencyUpdateRate: 1,
};

const mockCurrentScenarioResult: ScenarioResult = {
  scenario: mockScenarioConfig,
  prediction: mockQualityPrediction,
  daysTo90Quality: 60,
  daysToTargetCoverage: 45,
  projectedQuality: 88,
  projectedCoverage: 82,
};

const mockAcceleratedScenarioResult: ScenarioResult = {
  scenario: mockAcceleratedScenarioConfig,
  prediction: { ...mockQualityPrediction, confidence: 90 },
  daysTo90Quality: 30,
  daysToTargetCoverage: 25,
  projectedQuality: 95,
  projectedCoverage: 90,
};

const mockRelaxedScenarioResult: ScenarioResult = {
  scenario: mockRelaxedScenarioConfig,
  prediction: { ...mockQualityPrediction, confidence: 70 },
  daysTo90Quality: 120,
  daysToTargetCoverage: 90,
  projectedQuality: 82,
  projectedCoverage: 78,
};

const mockPredictionsSummary: PredictionsReport['summary'] = {
  totalRisks: 4,
  criticalRisks: 1,
  highRisks: 1,
  averageConfidence: 81,
  trendDirection: 'improving',
};

const mockPredictionsReport: PredictionsReport = {
  qualityPrediction: mockQualityPrediction,
  coveragePrediction: mockCoveragePrediction,
  issuesPrediction: mockIssuesPrediction,
  risks: [mockCriticalRisk, mockHighRisk, mockMediumRisk, mockLowRisk],
  scenarios: {
    current: mockCurrentScenarioResult,
    accelerated: mockAcceleratedScenarioResult,
    relaxed: mockRelaxedScenarioResult,
  },
  summary: mockPredictionsSummary,
  generatedAt: '2024-01-15T10:00:00Z',
  analyzerVersion: '2.0.0',
};

// ============================================================================
// Test Utilities
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: createElement('div', null, 'Loading...') }, children)
    );
  };
}

// ============================================================================
// usePredictionsReport Tests
// ============================================================================

describe('usePredictionsReport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch predictions report successfully', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result } = renderHook(() => usePredictionsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPredictionsReport);
    });

    expect(predictionsApi.loadPredictionsReport).toHaveBeenCalledWith('/data');
  });

  it('should fetch predictions report with custom data path', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result } = renderHook(() => usePredictionsReport('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPredictionsReport);
    });

    expect(predictionsApi.loadPredictionsReport).toHaveBeenCalledWith('/custom/path');
  });

  it('should return null when report does not exist', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(null);

    const { result } = renderHook(() => usePredictionsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });

  it('should use correct staleTime and gcTime', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result, rerender } = renderHook(() => usePredictionsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    vi.mocked(predictionsApi.loadPredictionsReport).mockClear();

    rerender();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPredictionsReport);
    });

    expect(predictionsApi.loadPredictionsReport).not.toHaveBeenCalled();
  });
});

// ============================================================================
// usePrediction Tests
// ============================================================================

describe('usePrediction', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch quality score prediction', async () => {
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(mockQualityPrediction);

    const { result } = renderHook(() => usePrediction('qualityScore'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockQualityPrediction);
    });

    expect(predictionsApi.getPrediction).toHaveBeenCalledWith('/data', 'qualityScore', 90);
  });

  it('should fetch coverage prediction', async () => {
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(mockCoveragePrediction);

    const { result } = renderHook(() => usePrediction('coverage'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCoveragePrediction);
    });

    expect(predictionsApi.getPrediction).toHaveBeenCalledWith('/data', 'coverage', 90);
  });

  it('should fetch issues prediction', async () => {
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(mockIssuesPrediction);

    const { result } = renderHook(() => usePrediction('issues'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockIssuesPrediction);
    });

    expect(predictionsApi.getPrediction).toHaveBeenCalledWith('/data', 'issues', 90);
  });

  it('should fetch prediction with custom horizon', async () => {
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(mockQualityPrediction);

    const { result } = renderHook(() => usePrediction('qualityScore', 30), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(predictionsApi.getPrediction).toHaveBeenCalledWith('/data', 'qualityScore', 30);
  });

  it('should fetch prediction with custom data path', async () => {
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(mockQualityPrediction);

    const { result } = renderHook(() => usePrediction('qualityScore', 90, '/custom/data'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(predictionsApi.getPrediction).toHaveBeenCalledWith('/custom/data', 'qualityScore', 90);
  });

  it('should return null when prediction not available', async () => {
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(null);

    const { result } = renderHook(() => usePrediction('qualityScore'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});

// ============================================================================
// useRisks Tests
// ============================================================================

describe('useRisks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch all risks without filters', async () => {
    const allRisks = [mockCriticalRisk, mockHighRisk, mockMediumRisk, mockLowRisk];
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(allRisks);

    const { result } = renderHook(() => useRisks(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(allRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', undefined);
  });

  it('should fetch risks with impact filter', async () => {
    const criticalRisks = [mockCriticalRisk];
    const filters: RiskFilters = { impacts: ['critical'] };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(criticalRisks);

    const { result } = renderHook(() => useRisks(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(criticalRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch risks with multiple impact filters', async () => {
    const highImpactRisks = [mockCriticalRisk, mockHighRisk];
    const filters: RiskFilters = { impacts: ['critical', 'high'] };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(highImpactRisks);

    const { result } = renderHook(() => useRisks(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(highImpactRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch risks with probability filter', async () => {
    const highProbRisks = [mockCriticalRisk];
    const filters: RiskFilters = { probabilities: ['high'] };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(highProbRisks);

    const { result } = renderHook(() => useRisks(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(highProbRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch risks with category filter', async () => {
    const securityRisks = [mockCriticalRisk];
    const filters: RiskFilters = { categories: ['security'] };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(securityRisks);

    const { result } = renderHook(() => useRisks(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(securityRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch risks with activeOnly filter', async () => {
    const activeRisks = [mockCriticalRisk, mockHighRisk, mockMediumRisk];
    const filters: RiskFilters = { activeOnly: true };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(activeRisks);

    const { result } = renderHook(() => useRisks(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(activeRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch risks with minConfidence filter', async () => {
    const highConfidenceRisks = [mockCriticalRisk, mockHighRisk];
    const filters: RiskFilters = { minConfidence: 80 };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(highConfidenceRisks);

    const { result } = renderHook(() => useRisks(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(highConfidenceRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch risks with combined filters', async () => {
    const filteredRisks = [mockCriticalRisk];
    const filters: RiskFilters = {
      impacts: ['critical', 'high'],
      categories: ['security'],
      activeOnly: true,
      minConfidence: 90,
    };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(filteredRisks);

    const { result } = renderHook(() => useRisks(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(filteredRisks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch risks with custom data path', async () => {
    const risks = [mockCriticalRisk];
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(risks);

    const { result } = renderHook(() => useRisks(undefined, '/custom/data'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(risks);
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/custom/data', undefined);
  });

  it('should return empty array when no risks found', async () => {
    vi.mocked(predictionsApi.getRisks).mockResolvedValue([]);

    const { result } = renderHook(() => useRisks(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});

// ============================================================================
// useScenarios Tests
// ============================================================================

describe('useScenarios', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch scenarios successfully', async () => {
    const scenarios = mockPredictionsReport.scenarios;
    vi.mocked(predictionsApi.getScenarios).mockResolvedValue(scenarios);

    const { result } = renderHook(() => useScenarios(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(scenarios);
    });

    expect(predictionsApi.getScenarios).toHaveBeenCalledWith('/data');
  });

  it('should fetch scenarios with custom data path', async () => {
    const scenarios = mockPredictionsReport.scenarios;
    vi.mocked(predictionsApi.getScenarios).mockResolvedValue(scenarios);

    const { result } = renderHook(() => useScenarios('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(scenarios);
    });

    expect(predictionsApi.getScenarios).toHaveBeenCalledWith('/custom/path');
  });

  it('should return null when scenarios not available', async () => {
    vi.mocked(predictionsApi.getScenarios).mockResolvedValue(null);

    const { result } = renderHook(() => useScenarios(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });

  it('should contain all three scenario types', async () => {
    const scenarios = mockPredictionsReport.scenarios;
    vi.mocked(predictionsApi.getScenarios).mockResolvedValue(scenarios);

    const { result } = renderHook(() => useScenarios(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.current).toBeDefined();
    expect(result.current.data?.accelerated).toBeDefined();
    expect(result.current.data?.relaxed).toBeDefined();
  });
});

// ============================================================================
// usePredictionsSummary Tests
// ============================================================================

describe('usePredictionsSummary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch predictions summary successfully', async () => {
    vi.mocked(predictionsApi.getPredictionsSummary).mockResolvedValue(mockPredictionsSummary);

    const { result } = renderHook(() => usePredictionsSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPredictionsSummary);
    });

    expect(predictionsApi.getPredictionsSummary).toHaveBeenCalledWith('/data');
  });

  it('should fetch predictions summary with custom data path', async () => {
    vi.mocked(predictionsApi.getPredictionsSummary).mockResolvedValue(mockPredictionsSummary);

    const { result } = renderHook(() => usePredictionsSummary('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPredictionsSummary);
    });

    expect(predictionsApi.getPredictionsSummary).toHaveBeenCalledWith('/custom/path');
  });

  it('should return null when summary not available', async () => {
    vi.mocked(predictionsApi.getPredictionsSummary).mockResolvedValue(null);

    const { result } = renderHook(() => usePredictionsSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});

// ============================================================================
// useUpdateScenario Tests
// ============================================================================

describe('useUpdateScenario', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update scenario successfully', async () => {
    const customScenario: ScenarioConfig = {
      name: 'custom',
      coverageGrowthRate: 0.03,
      issueResolutionRate: 7,
      newIssuesRate: 2,
      dependencyUpdateRate: 3,
    };
    const customResult: ScenarioResult = {
      scenario: customScenario,
      prediction: mockQualityPrediction,
      daysTo90Quality: 45,
      daysToTargetCoverage: 35,
      projectedQuality: 91,
      projectedCoverage: 85,
    };
    vi.mocked(predictionsApi.updateScenario).mockResolvedValue(customResult);

    const { result } = renderHook(() => useUpdateScenario(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ scenario: customScenario });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(predictionsApi.updateScenario).toHaveBeenCalledWith('/data', customScenario);
    expect(result.current.data).toEqual(customResult);
  });

  it('should update scenario with custom data path', async () => {
    const customScenario: ScenarioConfig = {
      name: 'custom',
      coverageGrowthRate: 0.04,
      issueResolutionRate: 8,
      newIssuesRate: 2,
      dependencyUpdateRate: 4,
    };
    vi.mocked(predictionsApi.updateScenario).mockResolvedValue(mockCurrentScenarioResult);

    const { result } = renderHook(() => useUpdateScenario('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ scenario: customScenario });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(predictionsApi.updateScenario).toHaveBeenCalledWith('/custom/path', customScenario);
  });

  it('should track pending state during scenario update', async () => {
    let resolvePromise: (value: ScenarioResult) => void;
    const pendingPromise = new Promise<ScenarioResult>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(predictionsApi.updateScenario).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useUpdateScenario(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({ scenario: mockScenarioConfig });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!(mockCurrentScenarioResult);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle scenario update errors', async () => {
    const error = new Error('Failed to update scenario');
    vi.mocked(predictionsApi.updateScenario).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateScenario(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ scenario: mockScenarioConfig });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should return null when scenario update returns null', async () => {
    vi.mocked(predictionsApi.updateScenario).mockResolvedValue(null);

    const { result } = renderHook(() => useUpdateScenario(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ scenario: mockScenarioConfig });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should cache custom scenario result on success', async () => {
    const customScenario: ScenarioConfig = {
      name: 'my-custom-scenario',
      coverageGrowthRate: 0.05,
      issueResolutionRate: 10,
      newIssuesRate: 1,
      dependencyUpdateRate: 5,
    };
    const customResult: ScenarioResult = {
      scenario: customScenario,
      prediction: mockQualityPrediction,
      daysTo90Quality: 20,
      daysToTargetCoverage: 15,
      projectedQuality: 96,
      projectedCoverage: 92,
    };
    vi.mocked(predictionsApi.updateScenario).mockResolvedValue(customResult);

    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useUpdateScenario(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ scenario: customScenario });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['custom-scenario', '/data', 'my-custom-scenario'],
      customResult
    );
  });
});

// ============================================================================
// useRiskCounts Tests
// ============================================================================

describe('useRiskCounts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return risk counts from report', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result } = renderHook(() => useRiskCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(4);
    });

    expect(result.current).toEqual({
      critical: 1,
      high: 1,
      medium: 1,
      low: 1,
      total: 4,
    });
  });

  it('should return zero counts when report is null', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(null);

    const { result } = renderHook(() => useRiskCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(0);
    });

    expect(result.current).toEqual({
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    });
  });

  it('should use custom data path', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result } = renderHook(() => useRiskCounts('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(4);
    });

    expect(predictionsApi.loadPredictionsReport).toHaveBeenCalledWith('/custom/path');
  });

  it('should correctly count risks by impact level from risks array', async () => {
    const reportWithMultipleMediumLow: PredictionsReport = {
      ...mockPredictionsReport,
      risks: [
        mockCriticalRisk,
        mockHighRisk,
        mockMediumRisk,
        { ...mockMediumRisk, id: 'risk-medium-2' },
        mockLowRisk,
        { ...mockLowRisk, id: 'risk-low-2' },
        { ...mockLowRisk, id: 'risk-low-3' },
      ],
      summary: {
        ...mockPredictionsSummary,
        totalRisks: 7,
      },
    };
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(reportWithMultipleMediumLow);

    const { result } = renderHook(() => useRiskCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(7);
    });

    expect(result.current.medium).toBe(2);
    expect(result.current.low).toBe(3);
  });
});

// ============================================================================
// useAllPredictions Tests
// ============================================================================

describe('useAllPredictions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return all predictions from report', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result } = renderHook(() => useAllPredictions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.quality).toBeDefined();
    });

    expect(result.current).toEqual({
      quality: mockQualityPrediction,
      coverage: mockCoveragePrediction,
      issues: mockIssuesPrediction,
      trendDirection: 'improving',
    });
  });

  it('should return null predictions when report is null', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(null);

    const { result } = renderHook(() => useAllPredictions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.trendDirection).toBe('stable');
    });

    expect(result.current).toEqual({
      quality: null,
      coverage: null,
      issues: null,
      trendDirection: 'stable',
    });
  });

  it('should use custom data path', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result } = renderHook(() => useAllPredictions('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.quality).toBeDefined();
    });

    expect(predictionsApi.loadPredictionsReport).toHaveBeenCalledWith('/custom/path');
  });

  it('should return correct trend direction from report', async () => {
    const decliningReport: PredictionsReport = {
      ...mockPredictionsReport,
      summary: {
        ...mockPredictionsSummary,
        trendDirection: 'declining',
      },
    };
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(decliningReport);

    const { result } = renderHook(() => useAllPredictions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.trendDirection).toBe('declining');
    });
  });

  it('should return stable trend direction from report', async () => {
    const stableReport: PredictionsReport = {
      ...mockPredictionsReport,
      summary: {
        ...mockPredictionsSummary,
        trendDirection: 'stable',
      },
    };
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(stableReport);

    const { result } = renderHook(() => useAllPredictions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.trendDirection).toBe('stable');
    });
  });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should handle empty risks array', async () => {
    const reportWithNoRisks: PredictionsReport = {
      ...mockPredictionsReport,
      risks: [],
      summary: {
        ...mockPredictionsSummary,
        totalRisks: 0,
        criticalRisks: 0,
        highRisks: 0,
      },
    };
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(reportWithNoRisks);

    const { result } = renderHook(() => usePredictionsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(reportWithNoRisks);
    });

    expect(result.current.data?.risks).toHaveLength(0);
  });

  it('should handle prediction without goals', async () => {
    const predictionWithoutGoals: PredictionData = {
      ...mockQualityPrediction,
      goals: undefined,
    };
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(predictionWithoutGoals);

    const { result } = renderHook(() => usePrediction('qualityScore'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.goals).toBeUndefined();
  });

  it('should handle prediction without min/max bounds', async () => {
    const predictionWithoutBounds: PredictionData = {
      ...mockIssuesPrediction,
      min: undefined,
      max: undefined,
    };
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(predictionWithoutBounds);

    const { result } = renderHook(() => usePrediction('issues'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.min).toBeUndefined();
    expect(result.current.data?.max).toBeUndefined();
  });

  it('should handle risk with empty affected files', async () => {
    const riskWithNoFiles: Risk = {
      ...mockMediumRisk,
      affectedFiles: [],
    };
    vi.mocked(predictionsApi.getRisks).mockResolvedValue([riskWithNoFiles]);

    const { result } = renderHook(() => useRisks(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    expect(result.current.data?.[0].affectedFiles).toHaveLength(0);
  });

  it('should handle scenario with custom factors', async () => {
    const scenarioWithCustomFactors: ScenarioConfig = {
      ...mockScenarioConfig,
      customFactors: {
        teamVelocity: 1.2,
        codeReviewTime: 0.8,
      },
    };
    const resultWithCustomFactors: ScenarioResult = {
      ...mockCurrentScenarioResult,
      scenario: scenarioWithCustomFactors,
    };
    vi.mocked(predictionsApi.updateScenario).mockResolvedValue(resultWithCustomFactors);

    const { result } = renderHook(() => useUpdateScenario(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ scenario: scenarioWithCustomFactors });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.scenario.customFactors).toEqual({
      teamVelocity: 1.2,
      codeReviewTime: 0.8,
    });
  });

  it('should handle scenario without daysTo90Quality', async () => {
    const scenarioWithoutDays: ScenarioResult = {
      ...mockRelaxedScenarioResult,
      daysTo90Quality: undefined,
      daysToTargetCoverage: undefined,
    };
    vi.mocked(predictionsApi.updateScenario).mockResolvedValue(scenarioWithoutDays);

    const { result } = renderHook(() => useUpdateScenario(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ scenario: mockRelaxedScenarioConfig });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.daysTo90Quality).toBeUndefined();
    expect(result.current.data?.daysToTargetCoverage).toBeUndefined();
  });

  it('should handle prediction factor with all directions', async () => {
    const predictionWithAllDirections: PredictionData = {
      ...mockQualityPrediction,
      factors: [
        { name: 'Positive', weight: 0.5, direction: 'positive', explanation: 'Helps' },
        { name: 'Negative', weight: 0.3, direction: 'negative', explanation: 'Hurts' },
        { name: 'Neutral', weight: 0.2, direction: 'neutral', explanation: 'No effect' },
      ],
    };
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(predictionWithAllDirections);

    const { result } = renderHook(() => usePrediction('qualityScore'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.factors).toHaveLength(3);
    expect(result.current.data?.factors.map((f) => f.direction)).toEqual(['positive', 'negative', 'neutral']);
  });

  it('should handle all risk categories', async () => {
    const allCategoryRisks: Risk[] = [
      { ...mockCriticalRisk, category: 'security' },
      { ...mockHighRisk, id: 'quality-risk', category: 'quality' },
      { ...mockMediumRisk, id: 'coverage-risk', category: 'coverage' },
      { ...mockLowRisk, id: 'dependency-risk', category: 'dependency' },
      { ...mockLowRisk, id: 'performance-risk', category: 'performance' },
    ];
    vi.mocked(predictionsApi.getRisks).mockResolvedValue(allCategoryRisks);

    const { result } = renderHook(() => useRisks(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(5);
    });

    const categories = result.current.data?.map((r) => r.category);
    expect(categories).toContain('security');
    expect(categories).toContain('quality');
    expect(categories).toContain('coverage');
    expect(categories).toContain('dependency');
    expect(categories).toContain('performance');
  });

  it('should handle all prediction methodologies', async () => {
    const methodologies: PredictionData['methodology'][] = [
      'linear-regression',
      'arima',
      'prophet',
      'exponential-smoothing',
    ];

    for (const methodology of methodologies) {
      const prediction: PredictionData = {
        ...mockQualityPrediction,
        methodology,
      };
      vi.mocked(predictionsApi.getPrediction).mockResolvedValue(prediction);

      const { result } = renderHook(() => usePrediction('qualityScore'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.data?.methodology).toBe(methodology);
      });

      queryClient.clear();
    }
  });
});

// ============================================================================
// Query Key Caching Tests
// ============================================================================

describe('Query Key Caching', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should cache predictions report by data path', async () => {
    vi.mocked(predictionsApi.loadPredictionsReport).mockResolvedValue(mockPredictionsReport);

    const { result: result1 } = renderHook(() => usePredictionsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result1.current.data).toBeDefined();
    });

    const { result: result2 } = renderHook(() => usePredictionsReport('/other/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result2.current.data).toBeDefined();
    });

    expect(predictionsApi.loadPredictionsReport).toHaveBeenCalledTimes(2);
    expect(predictionsApi.loadPredictionsReport).toHaveBeenCalledWith('/data');
    expect(predictionsApi.loadPredictionsReport).toHaveBeenCalledWith('/other/path');
  });

  it('should cache predictions by metric and horizon', async () => {
    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(mockQualityPrediction);

    const { result: result1 } = renderHook(() => usePrediction('qualityScore', 30), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result1.current.data).toBeDefined();
    });

    vi.mocked(predictionsApi.getPrediction).mockResolvedValue(mockCoveragePrediction);
    const { result: result2 } = renderHook(() => usePrediction('coverage', 60), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result2.current.data).toBeDefined();
    });

    expect(predictionsApi.getPrediction).toHaveBeenCalledTimes(2);
    expect(predictionsApi.getPrediction).toHaveBeenCalledWith('/data', 'qualityScore', 30);
    expect(predictionsApi.getPrediction).toHaveBeenCalledWith('/data', 'coverage', 60);
  });

  it('should cache risks by filters', async () => {
    vi.mocked(predictionsApi.getRisks).mockResolvedValue([mockCriticalRisk]);

    const filters1: RiskFilters = { impacts: ['critical'] };
    const filters2: RiskFilters = { impacts: ['high'] };

    const { result: result1 } = renderHook(() => useRisks(filters1), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result1.current.data).toBeDefined();
    });

    vi.mocked(predictionsApi.getRisks).mockResolvedValue([mockHighRisk]);
    const { result: result2 } = renderHook(() => useRisks(filters2), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result2.current.data).toBeDefined();
    });

    expect(predictionsApi.getRisks).toHaveBeenCalledTimes(2);
    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters1);
    expect(predictionsApi.getRisks).toHaveBeenCalledWith('/data', filters2);
  });
});
