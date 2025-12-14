/**
 * Analytics Hooks Tests
 *
 * Tests for useAnalytics hooks including report fetching, risk data filtering,
 * debt burndown calculations, and insight operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
  analyticsKeys,
  useAnalyticsReport,
  useRiskData,
  useDebtSummary,
  usePredictions,
  useAnalyticsInsights,
  useFilteredRiskData,
  useSortedRiskData,
  useRiskCounts,
  useFilteredInsights,
  useDebtBurndownSummary,
  useAnalyticsSummary,
  useDismissInsight,
  usePrefetchAnalytics,
} from '../useAnalytics';
import { analyticsApi } from '../../api/analyticsApi';
import type {
  AnalyticsReport,
  RiskData,
  AnalyticsInsight,
  DebtSummaryByCategory,
  TimeSeriesDataPoint,
  PredictionSummary,
} from '../../types/analytics';

// Mock the analyticsApi
vi.mock('../../api/analyticsApi', () => ({
  analyticsApi: {
    loadAnalyticsReport: vi.fn(),
    loadRiskData: vi.fn(),
    loadDebtSummary: vi.fn(),
    loadPredictions: vi.fn(),
    loadInsights: vi.fn(),
    dismissInsight: vi.fn(),
  },
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const mockRiskData: RiskData[] = [
  {
    path: 'src/features/dashboard',
    displayName: 'Dashboard',
    riskScore: 85,
    riskLevel: 'critical',
    factors: [
      { type: 'complexity', weight: 0.25, value: 90, score: 90 },
      { type: 'coverage', weight: 0.3, value: 40, score: 60 },
      { type: 'dependencies', weight: 0.2, value: 80, score: 80 },
      { type: 'age', weight: 0.1, value: 70, score: 70 },
      { type: 'churn', weight: 0.15, value: 95, score: 95 },
    ],
    confidence: 85,
    lastUpdated: '2024-01-01T00:00:00Z',
    directory: 'src/features',
  },
  {
    path: 'src/components/charts',
    displayName: 'Charts',
    riskScore: 65,
    riskLevel: 'high',
    factors: [
      { type: 'complexity', weight: 0.25, value: 70, score: 70 },
      { type: 'coverage', weight: 0.3, value: 50, score: 50 },
      { type: 'dependencies', weight: 0.2, value: 60, score: 60 },
      { type: 'age', weight: 0.1, value: 80, score: 80 },
      { type: 'churn', weight: 0.15, value: 70, score: 70 },
    ],
    confidence: 80,
    lastUpdated: '2024-01-01T00:00:00Z',
    directory: 'src/components',
  },
  {
    path: 'src/utils/validation',
    displayName: 'Validation',
    riskScore: 45,
    riskLevel: 'medium',
    factors: [
      { type: 'complexity', weight: 0.25, value: 50, score: 50 },
      { type: 'coverage', weight: 0.3, value: 60, score: 40 },
      { type: 'dependencies', weight: 0.2, value: 40, score: 40 },
      { type: 'age', weight: 0.1, value: 50, score: 50 },
      { type: 'churn', weight: 0.15, value: 45, score: 45 },
    ],
    confidence: 90,
    lastUpdated: '2024-01-01T00:00:00Z',
    directory: 'src/utils',
  },
  {
    path: 'src/api/endpoints',
    displayName: 'API',
    riskScore: 25,
    riskLevel: 'low',
    factors: [
      { type: 'complexity', weight: 0.25, value: 30, score: 30 },
      { type: 'coverage', weight: 0.3, value: 80, score: 20 },
      { type: 'dependencies', weight: 0.2, value: 20, score: 20 },
      { type: 'age', weight: 0.1, value: 25, score: 25 },
      { type: 'churn', weight: 0.15, value: 30, score: 30 },
    ],
    confidence: 95,
    lastUpdated: '2024-01-01T00:00:00Z',
    directory: 'src/api',
  },
  {
    path: 'src/types/models',
    displayName: 'Models',
    riskScore: 10,
    riskLevel: 'minimal',
    factors: [
      { type: 'complexity', weight: 0.25, value: 10, score: 10 },
      { type: 'coverage', weight: 0.3, value: 95, score: 5 },
      { type: 'dependencies', weight: 0.2, value: 5, score: 5 },
      { type: 'age', weight: 0.1, value: 20, score: 20 },
      { type: 'churn', weight: 0.15, value: 10, score: 10 },
    ],
    confidence: 98,
    lastUpdated: '2024-01-01T00:00:00Z',
    directory: 'src/types',
  },
];

const mockDebtCategories: DebtSummaryByCategory[] = [
  { category: 'complexity', label: 'Complexity', totalHours: 35, percentage: 35, itemCount: 12, color: '#e53935' },
  { category: 'coverage', label: 'Coverage', totalHours: 28, percentage: 28, itemCount: 8, color: '#ff9800' },
  { category: 'documentation', label: 'Documentation', totalHours: 15, percentage: 15, itemCount: 15, color: '#ffc107' },
  { category: 'dependencies', label: 'Dependencies', totalHours: 12, percentage: 12, itemCount: 5, color: '#4caf50' },
  { category: 'security', label: 'Security', totalHours: 7, percentage: 7, itemCount: 3, color: '#2196f3' },
  { category: 'performance', label: 'Performance', totalHours: 3, percentage: 3, itemCount: 2, color: '#9c27b0' },
];

const mockHistoricalData: TimeSeriesDataPoint[] = [
  { timestamp: '2024-01-01T00:00:00Z', value: 150 },
  { timestamp: '2024-01-08T00:00:00Z', value: 140 },
  { timestamp: '2024-01-15T00:00:00Z', value: 130 },
  { timestamp: '2024-01-22T00:00:00Z', value: 120 },
  { timestamp: '2024-01-29T00:00:00Z', value: 110 },
  { timestamp: '2024-02-05T00:00:00Z', value: 100 },
];

const mockTargetData: TimeSeriesDataPoint[] = [
  { timestamp: '2024-01-01T00:00:00Z', value: 150 },
  { timestamp: '2024-01-08T00:00:00Z', value: 133 },
  { timestamp: '2024-01-15T00:00:00Z', value: 116 },
  { timestamp: '2024-01-22T00:00:00Z', value: 100 },
  { timestamp: '2024-01-29T00:00:00Z', value: 83 },
  { timestamp: '2024-02-05T00:00:00Z', value: 66 },
];

const mockDebtSummary: AnalyticsReport['debtSummary'] = {
  totalHours: 100,
  byCategory: mockDebtCategories,
  items: [
    {
      id: 'debt-1',
      category: 'complexity',
      description: 'Refactor Dashboard component',
      estimatedHours: 8,
      priority: 'high',
      affectedFiles: ['src/features/dashboard/Dashboard.tsx'],
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  historical: mockHistoricalData,
  targets: mockTargetData,
};

const mockPredictions: AnalyticsReport['predictions'] = {
  quality: {
    current: 82.5,
    projected: 88.2,
    confidence: 82,
    confidenceLevel: 'high',
    timeframeDays: 90,
    insight: 'Quality score will reach target by June.',
    goalValue: 90,
    goalDate: '2024-06-01T00:00:00Z',
  },
  coverage: {
    current: 72.5,
    projected: 78.0,
    confidence: 75,
    confidenceLevel: 'medium',
    timeframeDays: 90,
    insight: 'Coverage is improving steadily.',
  },
  issues: {
    current: 23,
    projected: 15,
    confidence: 68,
    confidenceLevel: 'medium',
    timeframeDays: 90,
    insight: 'Issue count is trending downward.',
  },
  debt: {
    current: 100,
    projected: 75,
    confidence: 72,
    confidenceLevel: 'medium',
    timeframeDays: 90,
    insight: 'Technical debt is being reduced.',
    goalValue: 50,
    goalDate: '2024-08-01T00:00:00Z',
  },
};

const mockInsights: AnalyticsInsight[] = [
  {
    id: 'insight-1',
    priority: 'high',
    title: 'Improve Type Safety',
    description: 'Several files are missing TypeScript strict mode compliance.',
    category: 'code-quality',
    affectedFiles: ['src/utils/validation.ts', 'src/api/endpoints.ts'],
    impact: { min: 5, max: 10, unit: '%' },
    effort: { hours: 4, difficulty: 'moderate' },
    tags: ['typescript', 'type-safety'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'insight-2',
    priority: 'medium',
    title: 'Reduce Circular Dependencies',
    description: 'Found 3 circular dependency chains.',
    category: 'architecture',
    affectedFiles: ['src/features/dashboard/index.ts'],
    impact: { min: 3, max: 5, unit: '%' },
    effort: { hours: 8, difficulty: 'complex' },
    tags: ['dependencies', 'architecture'],
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'insight-3',
    priority: 'low',
    title: 'Add Missing Documentation',
    description: 'Public API functions are missing JSDoc comments.',
    category: 'documentation',
    affectedFiles: ['src/api/index.ts'],
    impact: { min: 1, max: 2, unit: '%' },
    effort: { hours: 2, difficulty: 'easy' },
    tags: ['documentation', 'jsdoc'],
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 'insight-4',
    priority: 'high',
    title: 'Dismissed Insight',
    description: 'This insight was dismissed.',
    category: 'code-quality',
    affectedFiles: [],
    impact: { min: 1, max: 2, unit: '%' },
    effort: { hours: 1, difficulty: 'easy' },
    tags: ['dismissed'],
    createdAt: '2024-01-04T00:00:00Z',
    dismissedAt: '2024-01-05T00:00:00Z',
  },
];

const mockAnalyticsReport: AnalyticsReport = {
  riskData: mockRiskData,
  debtSummary: mockDebtSummary,
  predictions: mockPredictions,
  insights: mockInsights,
  metadata: {
    generatedAt: '2024-01-01T00:00:00Z',
    analyzerVersion: '1.0.0',
    dataQuality: 85,
    filesAnalyzed: 156,
  },
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
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ============================================================================
// Query Keys Tests
// ============================================================================

describe('analyticsKeys', () => {
  it('should generate correct base key', () => {
    expect(analyticsKeys.all).toEqual(['analytics']);
  });

  it('should generate correct report key', () => {
    expect(analyticsKeys.report()).toEqual(['analytics', 'report']);
  });

  it('should generate correct riskData key', () => {
    expect(analyticsKeys.riskData()).toEqual(['analytics', 'risk']);
  });

  it('should generate correct debtSummary key', () => {
    expect(analyticsKeys.debtSummary()).toEqual(['analytics', 'debt']);
  });

  it('should generate correct predictions key', () => {
    expect(analyticsKeys.predictions()).toEqual(['analytics', 'predictions']);
  });

  it('should generate correct insights key', () => {
    expect(analyticsKeys.insights()).toEqual(['analytics', 'insights']);
  });
});

// ============================================================================
// Report Query Hooks Tests
// ============================================================================

describe('useAnalyticsReport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch analytics report successfully', async () => {
    vi.mocked(analyticsApi.loadAnalyticsReport).mockResolvedValue(mockAnalyticsReport);

    const { result } = renderHook(() => useAnalyticsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockAnalyticsReport);
    });

    expect(analyticsApi.loadAnalyticsReport).toHaveBeenCalledWith('/data');
  });

  it('should use custom data path when provided', async () => {
    vi.mocked(analyticsApi.loadAnalyticsReport).mockResolvedValue(mockAnalyticsReport);

    const { result } = renderHook(() => useAnalyticsReport('/custom/path'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(analyticsApi.loadAnalyticsReport).toHaveBeenCalledWith('/custom/path');
  });
});

describe('useRiskData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch risk data successfully', async () => {
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(mockRiskData);

    const { result } = renderHook(() => useRiskData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockRiskData);
    });

    expect(analyticsApi.loadRiskData).toHaveBeenCalledWith('/data');
  });
});

describe('useDebtSummary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch debt summary successfully', async () => {
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(mockDebtSummary);

    const { result } = renderHook(() => useDebtSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockDebtSummary);
    });

    expect(analyticsApi.loadDebtSummary).toHaveBeenCalledWith('/data');
  });
});

describe('usePredictions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch predictions successfully', async () => {
    vi.mocked(analyticsApi.loadPredictions).mockResolvedValue(mockPredictions);

    const { result } = renderHook(() => usePredictions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPredictions);
    });

    expect(analyticsApi.loadPredictions).toHaveBeenCalledWith('/data');
  });
});

describe('useAnalyticsInsights', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch insights successfully', async () => {
    vi.mocked(analyticsApi.loadInsights).mockResolvedValue(mockInsights);

    const { result } = renderHook(() => useAnalyticsInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockInsights);
    });

    expect(analyticsApi.loadInsights).toHaveBeenCalledWith('/data');
  });
});

// ============================================================================
// Filtered Data Hooks Tests
// ============================================================================

describe('useFilteredRiskData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(mockRiskData);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return all risk data when no filters are applied', async () => {
    const { result } = renderHook(() => useFilteredRiskData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(mockRiskData.length);
    });
  });

  it('should filter by risk levels', async () => {
    const { result } = renderHook(
      () => useFilteredRiskData({ riskLevels: ['critical', 'high'] }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current.every((item) => ['critical', 'high'].includes(item.riskLevel))).toBe(true);
    });
  });

  it('should filter by minimum confidence', async () => {
    const { result } = renderHook(
      () => useFilteredRiskData({ minConfidence: 90 }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.every((item) => item.confidence >= 90)).toBe(true);
    });
  });

  it('should filter by file pattern', async () => {
    const { result } = renderHook(
      () => useFilteredRiskData({ filePattern: 'api' }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].path).toContain('api');
    });
  });

  it('should combine multiple filters', async () => {
    const { result } = renderHook(
      () =>
        useFilteredRiskData({
          riskLevels: ['medium', 'low', 'minimal'],
          minConfidence: 90,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(
        result.current.every(
          (item) =>
            ['medium', 'low', 'minimal'].includes(item.riskLevel) && item.confidence >= 90
        )
      ).toBe(true);
    });
  });
});

describe('useSortedRiskData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(mockRiskData);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return risk data sorted by risk score descending', async () => {
    const { result } = renderHook(() => useSortedRiskData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(mockRiskData.length);
    });

    // Verify descending order
    for (let i = 0; i < result.current.length - 1; i++) {
      expect(result.current[i].riskScore).toBeGreaterThanOrEqual(result.current[i + 1].riskScore);
    }
  });

  it('should limit results when limit is provided', async () => {
    const { result } = renderHook(() => useSortedRiskData(3), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    // Should return top 3 highest risk scores
    expect(result.current[0].riskScore).toBe(85); // critical
    expect(result.current[1].riskScore).toBe(65); // high
    expect(result.current[2].riskScore).toBe(45); // medium
  });

  it('should return all data when limit exceeds data length', async () => {
    const { result } = renderHook(() => useSortedRiskData(100), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(mockRiskData.length);
    });
  });
});

describe('useRiskCounts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(mockRiskData);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return counts for each risk level', async () => {
    const { result } = renderHook(() => useRiskCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        critical: 1,
        high: 1,
        medium: 1,
        low: 1,
        minimal: 1,
      });
    });
  });

  it('should return zero counts for empty data', async () => {
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue([]);

    const { result } = renderHook(() => useRiskCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        minimal: 0,
      });
    });
  });
});

describe('useFilteredInsights', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    vi.mocked(analyticsApi.loadInsights).mockResolvedValue(mockInsights);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should filter out dismissed insights by default', async () => {
    const { result } = renderHook(() => useFilteredInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.every((insight) => !insight.dismissedAt)).toBe(true);
    });
  });

  it('should filter by insight priorities', async () => {
    const { result } = renderHook(
      () => useFilteredInsights({ insightPriorities: ['high'] }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      // Should only include non-dismissed high priority insights
      expect(result.current).toHaveLength(1);
      expect(result.current[0].priority).toBe('high');
      expect(result.current[0].id).toBe('insight-1');
    });
  });

  it('should allow multiple priority filters', async () => {
    const { result } = renderHook(
      () => useFilteredInsights({ insightPriorities: ['high', 'medium'] }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(
        result.current.every((insight) => ['high', 'medium'].includes(insight.priority))
      ).toBe(true);
    });
  });
});

// ============================================================================
// Computed Data Hooks Tests
// ============================================================================

describe('useDebtBurndownSummary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should calculate burndown summary correctly', async () => {
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(mockDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.currentDebt).toBe(100); // Last historical value
      expect(result.current.targetDebt).toBe(66); // Last target value
    });

    expect(result.current.trend).toBe('improving'); // Debt is decreasing
    expect(result.current.weeklyChangeRate).toBeLessThan(0); // Negative change rate
  });

  it('should calculate status as ahead when current < target', async () => {
    const aheadDebtSummary = {
      ...mockDebtSummary,
      historical: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 50 },
      ],
      targets: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 80 },
      ],
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(aheadDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('ahead');
    });
  });

  it('should calculate status as critical when current > start', async () => {
    const criticalDebtSummary = {
      ...mockDebtSummary,
      historical: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 120 },
      ],
      targets: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 80 },
      ],
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(criticalDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('critical');
    });
  });

  it('should handle empty historical data', async () => {
    const emptyDebtSummary = {
      ...mockDebtSummary,
      historical: [],
      targets: [],
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(emptyDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.currentDebt).toBe(mockDebtSummary.totalHours);
      expect(result.current.trend).toBe('stable');
    });
  });

  it('should calculate stable trend when change is minimal', async () => {
    const stableDebtSummary = {
      ...mockDebtSummary,
      historical: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 100 },
        { timestamp: '2024-01-15T00:00:00Z', value: 101 },
        { timestamp: '2024-01-22T00:00:00Z', value: 99 },
      ],
      targets: mockDebtSummary.targets,
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(stableDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.trend).toBe('stable');
    });
  });

  it('should calculate declining trend when debt is increasing', async () => {
    const decliningDebtSummary = {
      ...mockDebtSummary,
      historical: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 105 },
        { timestamp: '2024-01-15T00:00:00Z', value: 110 },
        { timestamp: '2024-01-22T00:00:00Z', value: 115 },
      ],
      targets: mockDebtSummary.targets,
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(decliningDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.trend).toBe('declining');
    });
  });

  it('should estimate days to target when improving', async () => {
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(mockDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.estimatedDaysToTarget).not.toBeNull();
      expect(result.current.estimatedDaysToTarget).toBeGreaterThan(0);
    });
  });
});

describe('useAnalyticsSummary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    vi.mocked(analyticsApi.loadAnalyticsReport).mockResolvedValue(mockAnalyticsReport);
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(mockRiskData);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return complete analytics summary', async () => {
    const { result } = renderHook(() => useAnalyticsSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.totalRiskItems).toBe(mockRiskData.length);
      expect(result.current.criticalRisks).toBe(1);
      expect(result.current.highRisks).toBe(1);
      expect(result.current.totalDebtHours).toBe(mockDebtSummary.totalHours);
      expect(result.current.activeInsights).toBe(3); // 4 insights - 1 dismissed
      expect(result.current.dataQuality).toBe(85);
      expect(result.current.lastUpdated).toBe('2024-01-01T00:00:00Z');
    });
  });
});

// ============================================================================
// Mutation Hooks Tests
// ============================================================================

describe('useDismissInsight', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should dismiss an insight successfully', async () => {
    vi.mocked(analyticsApi.dismissInsight).mockResolvedValue({ success: true });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDismissInsight(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('insight-1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(analyticsApi.dismissInsight).toHaveBeenCalledWith('insight-1');
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: analyticsKeys.insights(),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: analyticsKeys.report(),
    });
  });

  it('should handle dismiss errors', async () => {
    const error = new Error('Failed to dismiss insight');
    vi.mocked(analyticsApi.dismissInsight).mockRejectedValue(error);

    const { result } = renderHook(() => useDismissInsight(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('insight-1');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should track pending state', async () => {
    let resolvePromise: (value: { success: boolean }) => void;
    const pendingPromise = new Promise<{ success: boolean }>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(analyticsApi.dismissInsight).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useDismissInsight(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate('insight-1');
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!({ success: true });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

// ============================================================================
// Prefetch Hooks Tests
// ============================================================================

describe('usePrefetchAnalytics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return prefetch function', () => {
    const { result } = renderHook(() => usePrefetchAnalytics(), {
      wrapper: createWrapper(queryClient),
    });

    expect(typeof result.current.prefetchReport).toBe('function');
  });

  it('should prefetch report data', async () => {
    vi.mocked(analyticsApi.loadAnalyticsReport).mockResolvedValue(mockAnalyticsReport);

    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery');

    const { result } = renderHook(() => usePrefetchAnalytics(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.prefetchReport();
    });

    expect(prefetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: analyticsKeys.report(),
      })
    );
  });

  it('should use custom data path for prefetch', async () => {
    vi.mocked(analyticsApi.loadAnalyticsReport).mockResolvedValue(mockAnalyticsReport);

    const { result } = renderHook(() => usePrefetchAnalytics(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.prefetchReport('/custom/data/path');
    });

    expect(analyticsApi.loadAnalyticsReport).toHaveBeenCalledWith('/custom/data/path');
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

  it('should handle empty risk data array', async () => {
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue([]);

    const { result } = renderHook(() => useFilteredRiskData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it('should handle empty insights array', async () => {
    vi.mocked(analyticsApi.loadInsights).mockResolvedValue([]);

    const { result } = renderHook(() => useFilteredInsights(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it('should handle file pattern regex case insensitivity', async () => {
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(mockRiskData);

    const { result } = renderHook(
      () => useFilteredRiskData({ filePattern: 'API' }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].path).toContain('api');
    });
  });

  it('should handle sorted risk data with equal scores', async () => {
    const equalScoreData: RiskData[] = [
      { ...mockRiskData[0], riskScore: 50 },
      { ...mockRiskData[1], riskScore: 50 },
      { ...mockRiskData[2], riskScore: 50 },
    ];
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(equalScoreData);

    const { result } = renderHook(() => useSortedRiskData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
      expect(result.current.every((item) => item.riskScore === 50)).toBe(true);
    });
  });
});

describe('Query Configuration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should use correct staleTime configuration', async () => {
    vi.mocked(analyticsApi.loadAnalyticsReport).mockResolvedValue(mockAnalyticsReport);

    const { result, rerender } = renderHook(() => useAnalyticsReport(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Clear mock call count
    vi.mocked(analyticsApi.loadAnalyticsReport).mockClear();

    // Rerender - should not refetch immediately due to staleTime
    rerender();

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Should not have been called again due to staleTime
    expect(analyticsApi.loadAnalyticsReport).not.toHaveBeenCalled();
  });
});

describe('Burndown Summary Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should handle single historical data point', async () => {
    const singlePointSummary = {
      ...mockDebtSummary,
      historical: [{ timestamp: '2024-01-01T00:00:00Z', value: 100 }],
      targets: [{ timestamp: '2024-01-01T00:00:00Z', value: 80 }],
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(singlePointSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.currentDebt).toBe(100);
      expect(result.current.trend).toBe('stable');
    });
  });

  it('should return null estimated days when not improving', async () => {
    const increasingDebtSummary = {
      ...mockDebtSummary,
      historical: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 105 },
        { timestamp: '2024-01-15T00:00:00Z', value: 110 },
        { timestamp: '2024-01-22T00:00:00Z', value: 115 },
      ],
      targets: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-22T00:00:00Z', value: 50 },
      ],
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(increasingDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.estimatedDaysToTarget).toBeNull();
    });
  });

  it('should handle zero totalReduction gracefully', async () => {
    const noReductionSummary = {
      ...mockDebtSummary,
      historical: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 100 },
      ],
      targets: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 100 },
      ],
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(noReductionSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.progressPercent).toBe(0);
    });
  });

  it('should calculate behind status when progress is slow', async () => {
    const behindDebtSummary = {
      ...mockDebtSummary,
      historical: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 98 },
        { timestamp: '2024-01-15T00:00:00Z', value: 96 },
        { timestamp: '2024-01-22T00:00:00Z', value: 94 },
        { timestamp: '2024-01-29T00:00:00Z', value: 92 },
        { timestamp: '2024-02-05T00:00:00Z', value: 90 },
      ],
      targets: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-08T00:00:00Z', value: 80 },
        { timestamp: '2024-01-15T00:00:00Z', value: 60 },
        { timestamp: '2024-01-22T00:00:00Z', value: 40 },
        { timestamp: '2024-01-29T00:00:00Z', value: 20 },
        { timestamp: '2024-02-05T00:00:00Z', value: 0 },
      ],
    };
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(behindDebtSummary);

    const { result } = renderHook(() => useDebtBurndownSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('behind');
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    vi.mocked(analyticsApi.loadAnalyticsReport).mockResolvedValue(mockAnalyticsReport);
    vi.mocked(analyticsApi.loadRiskData).mockResolvedValue(mockRiskData);
    vi.mocked(analyticsApi.loadDebtSummary).mockResolvedValue(mockDebtSummary);
    vi.mocked(analyticsApi.loadInsights).mockResolvedValue(mockInsights);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should work with multiple hooks fetching different data', async () => {
    const { result: reportResult } = renderHook(() => useAnalyticsReport(), {
      wrapper: createWrapper(queryClient),
    });

    const { result: riskResult } = renderHook(() => useRiskCounts(), {
      wrapper: createWrapper(queryClient),
    });

    const { result: summaryResult } = renderHook(() => useAnalyticsSummary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(reportResult.current.data).toBeDefined();
      expect(riskResult.current.critical).toBe(1);
      expect(summaryResult.current.totalRiskItems).toBe(5);
    });
  });

  it('should maintain data consistency across hooks', async () => {
    const { result: filterResult } = renderHook(
      () => useFilteredRiskData({ riskLevels: ['critical', 'high'] }),
      { wrapper: createWrapper(queryClient) }
    );

    const { result: countResult } = renderHook(() => useRiskCounts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      const filteredCount = filterResult.current.length;
      const sumFromCounts = countResult.current.critical + countResult.current.high;
      expect(filteredCount).toBe(sumFromCounts);
    });
  });
});
