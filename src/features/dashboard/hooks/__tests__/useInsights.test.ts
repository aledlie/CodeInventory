/**
 * Insights Hooks Tests
 *
 * Tests for useInsights hooks including insights report, filtered insights,
 * insights by type, summary, acknowledgement, and regeneration operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense } from 'react';
import type { ReactNode } from 'react';
import {
  useInsightsReport,
  useInsights,
  useInsightsByType,
  useInsightsSummary,
  useAcknowledgeInsight,
  useRegenerateInsights,
  useInsightCounts,
} from '../useInsights';
import { insightsApi } from '../../api/insightsApi';
import type {
  AIInsight,
  InsightsReport,
  InsightsSummary,
  InsightType,
  InsightsFilters,
  MetricSnapshot,
  AcknowledgeResponse,
  RegenerateResponse,
} from '../../types';

// Mock the insightsApi
vi.mock('../../api/insightsApi', () => ({
  insightsApi: {
    loadInsightsReport: vi.fn(),
    getInsights: vi.fn(),
    getInsightsByType: vi.fn(),
    getInsightsSummary: vi.fn(),
    acknowledgeInsight: vi.fn(),
    regenerateInsights: vi.fn(),
  },
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const mockMetricSnapshot: MetricSnapshot = {
  name: 'Quality Score',
  current: 85,
  previous: 80,
  change: 5,
  changePercent: 6.25,
  trend: 'up',
  unit: '%',
};

const mockInsight: AIInsight = {
  id: 'insight-1',
  type: 'improvement',
  severity: 'medium',
  title: 'Code Quality Improved',
  explanation: 'The overall code quality has improved by 5% in the last week.',
  confidence: 92,
  metrics: [mockMetricSnapshot],
  affectedFiles: [
    {
      path: 'src/components/Button.tsx',
      line: 42,
      snippet: 'export function Button() {',
      percentage: 95,
    },
  ],
  recommendations: ['Continue maintaining current coding standards'],
  createdAt: '2024-01-15T10:00:00Z',
  category: 'quality',
  tags: ['improvement', 'quality'],
};

const mockConcernInsight: AIInsight = {
  id: 'insight-2',
  type: 'concern',
  severity: 'high',
  title: 'Test Coverage Dropped',
  explanation: 'Test coverage has dropped below 80% threshold.',
  confidence: 88,
  metrics: [
    {
      name: 'Test Coverage',
      current: 75,
      previous: 82,
      change: -7,
      changePercent: -8.5,
      trend: 'down',
      unit: '%',
    },
  ],
  affectedFiles: [
    {
      path: 'src/services/auth.ts',
      line: 1,
      percentage: 45,
      previousPercentage: 80,
    },
  ],
  recommendations: ['Add tests for authentication service'],
  createdAt: '2024-01-14T15:00:00Z',
  category: 'coverage',
  tags: ['concern', 'testing'],
};

const mockRecommendationInsight: AIInsight = {
  id: 'insight-3',
  type: 'recommendation',
  severity: 'low',
  title: 'Consider Refactoring Utils',
  explanation: 'The utils module has grown large and could benefit from splitting.',
  confidence: 75,
  metrics: [],
  affectedFiles: [
    {
      path: 'src/utils/index.ts',
      line: 1,
    },
  ],
  recommendations: ['Split utils into domain-specific modules'],
  createdAt: '2024-01-13T08:00:00Z',
  category: 'architecture',
  tags: ['refactoring'],
};

const mockPredictionInsight: AIInsight = {
  id: 'insight-4',
  type: 'prediction',
  severity: 'medium',
  title: 'Potential Performance Issue',
  explanation: 'Based on current trends, performance may degrade in 2 weeks.',
  confidence: 65,
  metrics: [
    {
      name: 'Response Time',
      current: 150,
      previous: 120,
      change: 30,
      changePercent: 25,
      trend: 'up',
      unit: 'ms',
    },
  ],
  affectedFiles: [],
  recommendations: ['Monitor performance metrics closely'],
  createdAt: '2024-01-12T12:00:00Z',
  category: 'performance',
  tags: ['prediction', 'performance'],
};

const mockInsightsSummary: InsightsSummary = {
  total: 4,
  byType: {
    improvement: 1,
    concern: 1,
    recommendation: 1,
    prediction: 1,
  },
  bySeverity: {
    critical: 0,
    high: 1,
    medium: 2,
    low: 1,
  },
  unacknowledged: 4,
  overallConfidence: 80,
  headline: 'Code quality is improving, but test coverage needs attention.',
  lastUpdated: '2024-01-15T10:00:00Z',
};

const mockInsightsReport: InsightsReport = {
  summary: mockInsightsSummary,
  insights: [mockInsight, mockConcernInsight, mockRecommendationInsight, mockPredictionInsight],
  keyMetrics: [mockMetricSnapshot],
  analyzerVersion: '1.0.0',
  generatedAt: '2024-01-15T10:00:00Z',
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
// useInsightsReport Tests
// ============================================================================

describe('useInsightsReport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch insights report successfully', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(mockInsightsReport);

    const { result } = renderHook(() => useInsightsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockInsightsReport);
    });

    expect(insightsApi.loadInsightsReport).toHaveBeenCalledWith('/data');
  });

  it('should fetch insights report with custom data path', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(mockInsightsReport);

    const { result } = renderHook(() => useInsightsReport('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockInsightsReport);
    });

    expect(insightsApi.loadInsightsReport).toHaveBeenCalledWith('/custom/path');
  });

  it('should return null when report does not exist', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(null);

    const { result } = renderHook(() => useInsightsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });

  it('should use correct staleTime and gcTime', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(mockInsightsReport);

    const { result, rerender } = renderHook(() => useInsightsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Clear mock call count
    vi.mocked(insightsApi.loadInsightsReport).mockClear();

    // Rerender - should not refetch due to staleTime
    rerender();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockInsightsReport);
    });

    // Should not have been called again due to staleTime
    expect(insightsApi.loadInsightsReport).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useInsights Tests
// ============================================================================

describe('useInsights', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch all insights without filters', async () => {
    const allInsights = mockInsightsReport.insights;
    vi.mocked(insightsApi.getInsights).mockResolvedValue(allInsights);

    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(allInsights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', undefined);
  });

  it('should fetch insights with type filter', async () => {
    const improvementInsights = [mockInsight];
    const filters: InsightsFilters = { types: ['improvement'] };
    vi.mocked(insightsApi.getInsights).mockResolvedValue(improvementInsights);

    const { result } = renderHook(() => useInsights(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(improvementInsights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch insights with severity filter', async () => {
    const highSeverityInsights = [mockConcernInsight];
    const filters: InsightsFilters = { severities: ['high'] };
    vi.mocked(insightsApi.getInsights).mockResolvedValue(highSeverityInsights);

    const { result } = renderHook(() => useInsights(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(highSeverityInsights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch insights with category filter', async () => {
    const qualityInsights = [mockInsight];
    const filters: InsightsFilters = { categories: ['quality'] };
    vi.mocked(insightsApi.getInsights).mockResolvedValue(qualityInsights);

    const { result } = renderHook(() => useInsights(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(qualityInsights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch insights with unacknowledgedOnly filter', async () => {
    const unacknowledgedInsights = mockInsightsReport.insights;
    const filters: InsightsFilters = { unacknowledgedOnly: true };
    vi.mocked(insightsApi.getInsights).mockResolvedValue(unacknowledgedInsights);

    const { result } = renderHook(() => useInsights(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(unacknowledgedInsights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch insights with minConfidence filter', async () => {
    const highConfidenceInsights = [mockInsight, mockConcernInsight];
    const filters: InsightsFilters = { minConfidence: 80 };
    vi.mocked(insightsApi.getInsights).mockResolvedValue(highConfidenceInsights);

    const { result } = renderHook(() => useInsights(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(highConfidenceInsights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch insights with searchQuery filter', async () => {
    const searchResults = [mockConcernInsight];
    const filters: InsightsFilters = { searchQuery: 'coverage' };
    vi.mocked(insightsApi.getInsights).mockResolvedValue(searchResults);

    const { result } = renderHook(() => useInsights(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(searchResults);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch insights with combined filters', async () => {
    const filteredInsights = [mockInsight];
    const filters: InsightsFilters = {
      types: ['improvement', 'recommendation'],
      severities: ['medium', 'low'],
      minConfidence: 70,
    };
    vi.mocked(insightsApi.getInsights).mockResolvedValue(filteredInsights);

    const { result } = renderHook(() => useInsights(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(filteredInsights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters);
  });

  it('should fetch insights with custom data path', async () => {
    const insights = [mockInsight];
    vi.mocked(insightsApi.getInsights).mockResolvedValue(insights);

    const { result } = renderHook(() => useInsights(undefined, '/custom/data'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(insights);
    });

    expect(insightsApi.getInsights).toHaveBeenCalledWith('/custom/data', undefined);
  });

  it('should return empty array when no insights found', async () => {
    vi.mocked(insightsApi.getInsights).mockResolvedValue([]);

    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});

// ============================================================================
// useInsightsByType Tests
// ============================================================================

describe('useInsightsByType', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch improvement insights', async () => {
    const improvementInsights = [mockInsight];
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue(improvementInsights);

    const { result } = renderHook(() => useInsightsByType('improvement'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(improvementInsights);
    });

    expect(insightsApi.getInsightsByType).toHaveBeenCalledWith('/data', 'improvement');
  });

  it('should fetch concern insights', async () => {
    const concernInsights = [mockConcernInsight];
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue(concernInsights);

    const { result } = renderHook(() => useInsightsByType('concern'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(concernInsights);
    });

    expect(insightsApi.getInsightsByType).toHaveBeenCalledWith('/data', 'concern');
  });

  it('should fetch recommendation insights', async () => {
    const recommendationInsights = [mockRecommendationInsight];
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue(recommendationInsights);

    const { result } = renderHook(() => useInsightsByType('recommendation'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(recommendationInsights);
    });

    expect(insightsApi.getInsightsByType).toHaveBeenCalledWith('/data', 'recommendation');
  });

  it('should fetch prediction insights', async () => {
    const predictionInsights = [mockPredictionInsight];
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue(predictionInsights);

    const { result } = renderHook(() => useInsightsByType('prediction'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(predictionInsights);
    });

    expect(insightsApi.getInsightsByType).toHaveBeenCalledWith('/data', 'prediction');
  });

  it('should fetch insights by type with custom data path', async () => {
    const insights = [mockInsight];
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue(insights);

    const { result } = renderHook(() => useInsightsByType('improvement', '/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(insights);
    });

    expect(insightsApi.getInsightsByType).toHaveBeenCalledWith('/custom/path', 'improvement');
  });

  it('should return empty array when no insights of type found', async () => {
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue([]);

    const { result } = renderHook(() => useInsightsByType('prediction'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});

// ============================================================================
// useInsightsSummary Tests
// ============================================================================

describe('useInsightsSummary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch insights summary successfully', async () => {
    vi.mocked(insightsApi.getInsightsSummary).mockResolvedValue(mockInsightsSummary);

    const { result } = renderHook(() => useInsightsSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockInsightsSummary);
    });

    expect(insightsApi.getInsightsSummary).toHaveBeenCalledWith('/data');
  });

  it('should fetch insights summary with custom data path', async () => {
    vi.mocked(insightsApi.getInsightsSummary).mockResolvedValue(mockInsightsSummary);

    const { result } = renderHook(() => useInsightsSummary('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockInsightsSummary);
    });

    expect(insightsApi.getInsightsSummary).toHaveBeenCalledWith('/custom/path');
  });

  it('should return null when summary not available', async () => {
    vi.mocked(insightsApi.getInsightsSummary).mockResolvedValue(null);

    const { result } = renderHook(() => useInsightsSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});

// ============================================================================
// useAcknowledgeInsight Tests
// ============================================================================

describe('useAcknowledgeInsight', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should acknowledge insight successfully', async () => {
    const acknowledgeResponse: AcknowledgeResponse = {
      success: true,
      insight: {
        ...mockInsight,
        acknowledgedAt: '2024-01-15T12:00:00Z',
        acknowledgedBy: 'user-123',
      },
    };
    vi.mocked(insightsApi.acknowledgeInsight).mockResolvedValue(acknowledgeResponse);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAcknowledgeInsight(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ insightId: 'insight-1', userId: 'user-123' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(insightsApi.acknowledgeInsight).toHaveBeenCalledWith('insight-1', 'user-123');
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-report'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-summary'] });
  });

  it('should track pending state during acknowledgement', async () => {
    let resolvePromise: (value: AcknowledgeResponse) => void;
    const pendingPromise = new Promise<AcknowledgeResponse>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(insightsApi.acknowledgeInsight).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useAcknowledgeInsight(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({ insightId: 'insight-1', userId: 'user-123' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!({
        success: true,
        insight: mockInsight,
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle acknowledgement errors', async () => {
    const error = new Error('Failed to acknowledge insight');
    vi.mocked(insightsApi.acknowledgeInsight).mockRejectedValue(error);

    const { result } = renderHook(() => useAcknowledgeInsight(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ insightId: 'invalid-id', userId: 'user-123' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

// ============================================================================
// useRegenerateInsights Tests
// ============================================================================

describe('useRegenerateInsights', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should regenerate insights successfully', async () => {
    const regenerateResponse: RegenerateResponse = {
      success: true,
      insights: mockInsightsReport.insights,
      processingTime: 1500,
    };
    vi.mocked(insightsApi.regenerateInsights).mockResolvedValue(regenerateResponse);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRegenerateInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(insightsApi.regenerateInsights).toHaveBeenCalled();
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-report'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-summary'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-by-type'] });
  });

  it('should track pending state during regeneration', async () => {
    let resolvePromise: (value: RegenerateResponse) => void;
    const pendingPromise = new Promise<RegenerateResponse>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(insightsApi.regenerateInsights).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useRegenerateInsights(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!({
        success: true,
        insights: [],
        processingTime: 1000,
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle regeneration errors', async () => {
    const error = new Error('Failed to regenerate insights');
    vi.mocked(insightsApi.regenerateInsights).mockRejectedValue(error);

    const { result } = renderHook(() => useRegenerateInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should return regeneration data on success', async () => {
    const regenerateResponse: RegenerateResponse = {
      success: true,
      insights: [mockInsight, mockConcernInsight],
      processingTime: 2000,
    };
    vi.mocked(insightsApi.regenerateInsights).mockResolvedValue(regenerateResponse);

    const { result } = renderHook(() => useRegenerateInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(regenerateResponse);
  });
});

// ============================================================================
// useInsightCounts Tests
// ============================================================================

describe('useInsightCounts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return insight counts from report', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(mockInsightsReport);

    const { result } = renderHook(() => useInsightCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(4);
    });

    expect(result.current).toEqual({
      improvement: 1,
      concern: 1,
      recommendation: 1,
      prediction: 1,
      total: 4,
    });
  });

  it('should return zero counts when report is null', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(null);

    const { result } = renderHook(() => useInsightCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(0);
    });

    expect(result.current).toEqual({
      improvement: 0,
      concern: 0,
      recommendation: 0,
      prediction: 0,
      total: 0,
    });
  });

  it('should use custom data path', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(mockInsightsReport);

    const { result } = renderHook(() => useInsightCounts('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(4);
    });

    expect(insightsApi.loadInsightsReport).toHaveBeenCalledWith('/custom/path');
  });

  it('should handle missing type counts with zero fallback', async () => {
    const reportWithPartialTypes: InsightsReport = {
      ...mockInsightsReport,
      summary: {
        ...mockInsightsSummary,
        byType: {
          improvement: 5,
          concern: 3,
          recommendation: 0,
          prediction: 0,
        },
        total: 8,
      },
    };
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(reportWithPartialTypes);

    const { result } = renderHook(() => useInsightCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.total).toBe(8);
    });

    expect(result.current).toEqual({
      improvement: 5,
      concern: 3,
      recommendation: 0,
      prediction: 0,
      total: 8,
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

  it('should handle empty insights array', async () => {
    const emptyReport: InsightsReport = {
      ...mockInsightsReport,
      insights: [],
      summary: {
        ...mockInsightsSummary,
        total: 0,
        byType: {
          improvement: 0,
          concern: 0,
          recommendation: 0,
          prediction: 0,
        },
      },
    };
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(emptyReport);

    const { result } = renderHook(() => useInsightsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(emptyReport);
    });

    expect(result.current.data?.insights).toHaveLength(0);
  });

  it('should handle insights with acknowledged status', async () => {
    const acknowledgedInsight: AIInsight = {
      ...mockInsight,
      acknowledgedAt: '2024-01-15T12:00:00Z',
      acknowledgedBy: 'user-123',
    };
    vi.mocked(insightsApi.getInsights).mockResolvedValue([acknowledgedInsight]);

    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    expect(result.current.data?.[0].acknowledgedAt).toBe('2024-01-15T12:00:00Z');
    expect(result.current.data?.[0].acknowledgedBy).toBe('user-123');
  });

  it('should handle insights without optional fields', async () => {
    const minimalInsight: AIInsight = {
      id: 'minimal-1',
      type: 'improvement',
      severity: 'low',
      title: 'Minimal Insight',
      explanation: 'This is a minimal insight without optional fields.',
      confidence: 50,
      metrics: [],
      affectedFiles: [],
      recommendations: [],
      createdAt: '2024-01-15T10:00:00Z',
    };
    vi.mocked(insightsApi.getInsights).mockResolvedValue([minimalInsight]);

    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    const insight = result.current.data?.[0];
    expect(insight?.category).toBeUndefined();
    expect(insight?.tags).toBeUndefined();
    expect(insight?.acknowledgedAt).toBeUndefined();
    expect(insight?.acknowledgedBy).toBeUndefined();
  });

  it('should handle report with all severity levels', async () => {
    const reportWithAllSeverities: InsightsReport = {
      ...mockInsightsReport,
      summary: {
        ...mockInsightsSummary,
        bySeverity: {
          critical: 2,
          high: 5,
          medium: 10,
          low: 8,
        },
      },
    };
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(reportWithAllSeverities);

    const { result } = renderHook(() => useInsightsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    const summary = result.current.data?.summary;
    expect(summary?.bySeverity.critical).toBe(2);
    expect(summary?.bySeverity.high).toBe(5);
    expect(summary?.bySeverity.medium).toBe(10);
    expect(summary?.bySeverity.low).toBe(8);
  });

  it('should handle insights with complex file references', async () => {
    const insightWithComplexFiles: AIInsight = {
      ...mockInsight,
      affectedFiles: [
        {
          path: 'src/components/Complex.tsx',
          line: 100,
          snippet: 'function complexFunction() { ... }',
          url: 'https://github.com/repo/blob/main/src/components/Complex.tsx#L100',
          percentage: 45.5,
          previousPercentage: 78.2,
        },
        {
          path: 'src/utils/helper.ts',
        },
      ],
    };
    vi.mocked(insightsApi.getInsights).mockResolvedValue([insightWithComplexFiles]);

    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    const files = result.current.data?.[0].affectedFiles;
    expect(files).toHaveLength(2);
    expect(files?.[0].percentage).toBe(45.5);
    expect(files?.[0].previousPercentage).toBe(78.2);
    expect(files?.[1].line).toBeUndefined();
  });

  it('should handle multiple metric snapshots', async () => {
    const insightWithMultipleMetrics: AIInsight = {
      ...mockInsight,
      metrics: [
        { name: 'Quality', current: 85, previous: 80, change: 5, changePercent: 6.25, trend: 'up' },
        { name: 'Coverage', current: 90, previous: 85, change: 5, changePercent: 5.88, trend: 'up' },
        { name: 'Complexity', current: 15, previous: 20, change: -5, changePercent: -25, trend: 'down' },
      ],
    };
    vi.mocked(insightsApi.getInsights).mockResolvedValue([insightWithMultipleMetrics]);

    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    const metrics = result.current.data?.[0].metrics;
    expect(metrics).toHaveLength(3);
    expect(metrics?.find((m) => m.name === 'Complexity')?.trend).toBe('down');
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

  it('should cache insights report by data path', async () => {
    vi.mocked(insightsApi.loadInsightsReport).mockResolvedValue(mockInsightsReport);

    // First render with default path
    const { result: result1 } = renderHook(() => useInsightsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result1.current.data).toBeDefined();
    });

    // Second render with different path
    const { result: result2 } = renderHook(() => useInsightsReport('/other/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result2.current.data).toBeDefined();
    });

    // Should have been called twice with different paths
    expect(insightsApi.loadInsightsReport).toHaveBeenCalledTimes(2);
    expect(insightsApi.loadInsightsReport).toHaveBeenCalledWith('/data');
    expect(insightsApi.loadInsightsReport).toHaveBeenCalledWith('/other/path');
  });

  it('should cache insights by filters', async () => {
    vi.mocked(insightsApi.getInsights).mockResolvedValue([mockInsight]);

    const filters1: InsightsFilters = { types: ['improvement'] };
    const filters2: InsightsFilters = { types: ['concern'] };

    // First render with improvement filter
    const { result: result1 } = renderHook(() => useInsights(filters1), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result1.current.data).toBeDefined();
    });

    // Second render with concern filter
    vi.mocked(insightsApi.getInsights).mockResolvedValue([mockConcernInsight]);
    const { result: result2 } = renderHook(() => useInsights(filters2), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result2.current.data).toBeDefined();
    });

    // Should have been called twice with different filters
    expect(insightsApi.getInsights).toHaveBeenCalledTimes(2);
    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters1);
    expect(insightsApi.getInsights).toHaveBeenCalledWith('/data', filters2);
  });

  it('should cache insights by type separately', async () => {
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue([mockInsight]);

    // Fetch improvement type
    const { result: result1 } = renderHook(() => useInsightsByType('improvement'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result1.current.data).toBeDefined();
    });

    // Fetch concern type
    vi.mocked(insightsApi.getInsightsByType).mockResolvedValue([mockConcernInsight]);
    const { result: result2 } = renderHook(() => useInsightsByType('concern'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result2.current.data).toBeDefined();
    });

    // Should have been called with both types
    expect(insightsApi.getInsightsByType).toHaveBeenCalledWith('/data', 'improvement');
    expect(insightsApi.getInsightsByType).toHaveBeenCalledWith('/data', 'concern');
  });
});

// ============================================================================
// Query Invalidation Tests
// ============================================================================

describe('Query Invalidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should invalidate correct queries on acknowledge', async () => {
    vi.mocked(insightsApi.acknowledgeInsight).mockResolvedValue({
      success: true,
      insight: mockInsight,
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAcknowledgeInsight(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ insightId: 'insight-1', userId: 'user-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify all expected queries are invalidated
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-report'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-summary'] });
    // Note: acknowledge doesn't invalidate insights-by-type
  });

  it('should invalidate all queries on regenerate', async () => {
    vi.mocked(insightsApi.regenerateInsights).mockResolvedValue({
      success: true,
      insights: [],
      processingTime: 1000,
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRegenerateInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify all expected queries are invalidated including insights-by-type
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-report'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-summary'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['insights-by-type'] });
  });
});
