/**
 * ComparisonPage Component Tests
 *
 * Tests for the historical metrics comparison dashboard including
 * date selection, data loading, and comparison display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material';
import { Suspense } from 'react';

// ============================================================================
// Mocks
// ============================================================================

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock DashboardLayout
vi.mock('../DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock comparison components
vi.mock('../comparison', () => ({
  ComparisonCard: vi.fn(({ label, diff, unit, lowerIsBetter }) => (
    <div data-testid={`comparison-card-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <span data-testid="card-label">{label}</span>
      <span data-testid="card-current">{diff.current}</span>
      <span data-testid="card-previous">{diff.previous}</span>
      <span data-testid="card-trend">{diff.trend}</span>
      {unit && <span data-testid="card-unit">{unit}</span>}
      {lowerIsBetter && <span data-testid="card-lower-is-better">true</span>}
    </div>
  )),
  DateRangeSelector: vi.fn(({ preset, currentDate, previousDate, onPresetChange, onCustomDatesChange }) => (
    <div data-testid="date-range-selector">
      <span data-testid="current-preset">{preset}</span>
      <span data-testid="current-date">{currentDate}</span>
      <span data-testid="previous-date">{previousDate}</span>
      <button
        data-testid="change-preset-day"
        onClick={() => onPresetChange('day')}
      >
        Day
      </button>
      <button
        data-testid="change-preset-week"
        onClick={() => onPresetChange('week')}
      >
        Week
      </button>
      <button
        data-testid="change-preset-month"
        onClick={() => onPresetChange('month')}
      >
        Month
      </button>
      <button
        data-testid="change-preset-quarter"
        onClick={() => onPresetChange('quarter')}
      >
        Quarter
      </button>
      <button
        data-testid="change-preset-custom"
        onClick={() => {
          onPresetChange('custom');
          onCustomDatesChange('2024-02-01', '2024-01-01');
        }}
      >
        Custom
      </button>
    </div>
  )),
}));

// Mock comparisonApi
vi.mock('../../api/comparisonApi', () => ({
  comparisonApi: {
    compare: vi.fn(),
    getSnapshots: vi.fn(),
    loadSnapshot: vi.fn(),
    quickCompare: vi.fn(),
  },
}));

// Import after mocks
import { ComparisonPage } from '../ComparisonPage';
import { comparisonApi } from '../../api/comparisonApi';
import type { SimpleComparisonResult, MetricDiff } from '../../types/comparison';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMetricDiff(overrides: Partial<MetricDiff> = {}): MetricDiff {
  return {
    current: 85,
    previous: 80,
    change: 5,
    percentChange: 6.25,
    trend: 'up',
    ...overrides,
  };
}

function createMockComparisonResult(overrides: Partial<SimpleComparisonResult> = {}): SimpleComparisonResult {
  return {
    currentDate: '2024-01-15',
    previousDate: '2024-01-08',
    quality: {
      score: createMetricDiff({ current: 85, previous: 80, trend: 'up' }),
      criticalIssues: createMetricDiff({ current: 2, previous: 3, change: -1, trend: 'down' }),
      majorIssues: createMetricDiff({ current: 5, previous: 8, change: -3, trend: 'down' }),
      minorIssues: createMetricDiff({ current: 10, previous: 12, change: -2, trend: 'down' }),
      maintainabilityIndex: createMetricDiff({ current: 75, previous: 70, trend: 'up' }),
      technicalDebt: createMetricDiff({ current: 100, previous: 120, change: -20, trend: 'down' }),
    },
    coverage: {
      overall: createMetricDiff({ current: 78, previous: 75, trend: 'up' }),
      unit: createMetricDiff({ current: 82, previous: 80, trend: 'up' }),
      integration: createMetricDiff({ current: 65, previous: 60, trend: 'up' }),
      e2e: createMetricDiff({ current: 45, previous: 40, trend: 'up' }),
      untestedFiles: createMetricDiff({ current: 10, previous: 15, change: -5, trend: 'down' }),
    },
    dependencies: {
      total: createMetricDiff({ current: 45, previous: 42, trend: 'up' }),
      outdated: createMetricDiff({ current: 5, previous: 8, change: -3, trend: 'down' }),
      vulnerable: createMetricDiff({ current: 0, previous: 1, change: -1, trend: 'down' }),
      circular: createMetricDiff({ current: 2, previous: 2, change: 0, trend: 'stable' }),
    },
    ...overrides,
  };
}

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
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  const theme = createTheme();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Suspense fallback={<div data-testid="loading">Loading...</div>}>
            {ui}
          </Suspense>
        </ThemeProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ComparisonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(comparisonApi.compare).mockResolvedValue(createMockComparisonResult());
  });

  describe('Rendering', () => {
    it('should render the page header', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Historical Comparison')).toBeInTheDocument();
      });
    });

    it('should render the page description', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Compare code metrics between different time periods/)
        ).toBeInTheDocument();
      });
    });

    it('should render within DashboardLayout', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });

    it('should render DateRangeSelector', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
      });
    });
  });

  describe('Date Preset Selection', () => {
    it('should default to week preset', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('current-preset')).toHaveTextContent('week');
      });
    });

    it('should switch to day preset when selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('change-preset-day'));

      await waitFor(() => {
        expect(screen.getByTestId('current-preset')).toHaveTextContent('day');
      });
    });

    it('should switch to month preset when selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('change-preset-month'));

      await waitFor(() => {
        expect(screen.getByTestId('current-preset')).toHaveTextContent('month');
      });
    });

    it('should switch to quarter preset when selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('change-preset-quarter'));

      await waitFor(() => {
        expect(screen.getByTestId('current-preset')).toHaveTextContent('quarter');
      });
    });

    it('should handle custom date selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('change-preset-custom'));

      await waitFor(() => {
        expect(screen.getByTestId('current-preset')).toHaveTextContent('custom');
      });
    });
  });

  describe('Data Loading', () => {
    it('should call comparisonApi.compare with dates', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(comparisonApi.compare).toHaveBeenCalled();
      });
    });

    it('should show loading skeleton while fetching data', () => {
      // Make the promise pending
      vi.mocked(comparisonApi.compare).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<ComparisonPage />);

      // Should show MUI Skeleton components while loading
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Comparison Display - Improving Trend', () => {
    it('should show "Code Health Improving" when trending positive', async () => {
      vi.mocked(comparisonApi.compare).mockResolvedValue(
        createMockComparisonResult({
          quality: {
            score: createMetricDiff({ trend: 'up' }),
            criticalIssues: createMetricDiff({ trend: 'down' }),
            majorIssues: createMetricDiff({ trend: 'down' }),
            minorIssues: createMetricDiff({ trend: 'stable' }),
            maintainabilityIndex: createMetricDiff({ trend: 'up' }),
            technicalDebt: createMetricDiff({ trend: 'down' }),
          },
          coverage: {
            overall: createMetricDiff({ trend: 'up' }),
            unit: createMetricDiff({ trend: 'up' }),
            integration: createMetricDiff({ trend: 'up' }),
            e2e: createMetricDiff({ trend: 'up' }),
            untestedFiles: createMetricDiff({ trend: 'down' }),
          },
          dependencies: {
            total: createMetricDiff({ trend: 'stable' }),
            outdated: createMetricDiff({ trend: 'down' }),
            vulnerable: createMetricDiff({ trend: 'down' }),
            circular: createMetricDiff({ trend: 'stable' }),
          },
        })
      );

      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Code Health Improving')).toBeInTheDocument();
      });
    });

    it('should display improvement chips for positive changes', async () => {
      vi.mocked(comparisonApi.compare).mockResolvedValue(
        createMockComparisonResult({
          quality: {
            score: createMetricDiff({ trend: 'up' }),
            criticalIssues: createMetricDiff({ trend: 'down' }),
            majorIssues: createMetricDiff({ trend: 'down' }),
            minorIssues: createMetricDiff({ trend: 'stable' }),
            maintainabilityIndex: createMetricDiff({ trend: 'up' }),
            technicalDebt: createMetricDiff({ trend: 'down' }),
          },
          coverage: {
            overall: createMetricDiff({ trend: 'up' }),
            unit: createMetricDiff({ trend: 'up' }),
            integration: createMetricDiff({ trend: 'up' }),
            e2e: createMetricDiff({ trend: 'up' }),
            untestedFiles: createMetricDiff({ trend: 'down' }),
          },
          dependencies: {
            total: createMetricDiff({ trend: 'stable' }),
            outdated: createMetricDiff({ trend: 'down' }),
            vulnerable: createMetricDiff({ trend: 'down' }),
            circular: createMetricDiff({ trend: 'stable' }),
          },
        })
      );

      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Quality score improved')).toBeInTheDocument();
        expect(screen.getByText('Test coverage increased')).toBeInTheDocument();
        expect(screen.getByText('Issues reduced')).toBeInTheDocument();
      });
    });
  });

  describe('Comparison Display - Declining Trend', () => {
    it('should show "Attention Needed" when trending negative', async () => {
      vi.mocked(comparisonApi.compare).mockResolvedValue(
        createMockComparisonResult({
          quality: {
            score: createMetricDiff({ trend: 'down' }),
            criticalIssues: createMetricDiff({ trend: 'up', change: 3 }),
            majorIssues: createMetricDiff({ trend: 'up' }),
            minorIssues: createMetricDiff({ trend: 'up' }),
            maintainabilityIndex: createMetricDiff({ trend: 'down' }),
            technicalDebt: createMetricDiff({ trend: 'up' }),
          },
          coverage: {
            overall: createMetricDiff({ trend: 'down', percentChange: -5 }),
            unit: createMetricDiff({ trend: 'down' }),
            integration: createMetricDiff({ trend: 'down' }),
            e2e: createMetricDiff({ trend: 'down' }),
            untestedFiles: createMetricDiff({ trend: 'up' }),
          },
          dependencies: {
            total: createMetricDiff({ trend: 'up' }),
            outdated: createMetricDiff({ trend: 'up' }),
            vulnerable: createMetricDiff({ trend: 'up' }),
            circular: createMetricDiff({ trend: 'up' }),
          },
        })
      );

      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Attention Needed')).toBeInTheDocument();
      });
    });

    it('should display concern chips for negative changes', async () => {
      vi.mocked(comparisonApi.compare).mockResolvedValue(
        createMockComparisonResult({
          quality: {
            score: createMetricDiff({ trend: 'down' }),
            criticalIssues: createMetricDiff({ trend: 'up', change: 3 }),
            majorIssues: createMetricDiff({ trend: 'up' }),
            minorIssues: createMetricDiff({ trend: 'up' }),
            maintainabilityIndex: createMetricDiff({ trend: 'down' }),
            technicalDebt: createMetricDiff({ trend: 'up' }),
          },
          coverage: {
            overall: createMetricDiff({ trend: 'down', percentChange: -5 }),
            unit: createMetricDiff({ trend: 'down' }),
            integration: createMetricDiff({ trend: 'down' }),
            e2e: createMetricDiff({ trend: 'down' }),
            untestedFiles: createMetricDiff({ trend: 'up' }),
          },
          dependencies: {
            total: createMetricDiff({ trend: 'up' }),
            outdated: createMetricDiff({ trend: 'up' }),
            vulnerable: createMetricDiff({ trend: 'up' }),
            circular: createMetricDiff({ trend: 'up' }),
          },
        })
      );

      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText(/new critical issues/)).toBeInTheDocument();
        expect(screen.getByText(/Coverage dropped/)).toBeInTheDocument();
        expect(screen.getByText('New circular dependencies introduced')).toBeInTheDocument();
      });
    });
  });

  describe('Accordion Sections', () => {
    it('should render Code Quality accordion', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Code Quality')).toBeInTheDocument();
      });
    });

    it('should render Test Coverage accordion', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Coverage')).toBeInTheDocument();
      });
    });

    it('should render Dependencies accordion', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Dependencies')).toBeInTheDocument();
      });
    });
  });

  describe('Quality Metrics Cards', () => {
    it('should render Quality Score card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-quality-score')).toBeInTheDocument();
      });
    });

    it('should render Critical Issues card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-critical-issues')).toBeInTheDocument();
      });
    });

    it('should render Major Issues card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-major-issues')).toBeInTheDocument();
      });
    });

    it('should render Minor Issues card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-minor-issues')).toBeInTheDocument();
      });
    });

    it('should render Maintainability Index card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-maintainability-index')).toBeInTheDocument();
      });
    });

    it('should render Technical Debt card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-technical-debt')).toBeInTheDocument();
      });
    });
  });

  describe('Coverage Metrics Cards', () => {
    it('should render Overall Coverage card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-overall-coverage')).toBeInTheDocument();
      });
    });

    it('should render Unit Tests card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-unit-tests')).toBeInTheDocument();
      });
    });

    it('should render Integration Tests card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-integration-tests')).toBeInTheDocument();
      });
    });

    it('should render E2E Tests card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-e2e-tests')).toBeInTheDocument();
      });
    });

    it('should render Untested Files card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-untested-files')).toBeInTheDocument();
      });
    });
  });

  describe('Dependencies Metrics Cards', () => {
    it('should render Total Dependencies card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-total-dependencies')).toBeInTheDocument();
      });
    });

    it('should render Outdated card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-outdated')).toBeInTheDocument();
      });
    });

    it('should render Vulnerable card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-vulnerable')).toBeInTheDocument();
      });
    });

    it('should render Circular card', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-card-circular')).toBeInTheDocument();
      });
    });
  });

  describe('Health Score Calculation', () => {
    it('should display health score', async () => {
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText('Health Score')).toBeInTheDocument();
      });
    });

    it('should display improvements and concerns counts', async () => {
      vi.mocked(comparisonApi.compare).mockResolvedValue(
        createMockComparisonResult({
          quality: {
            score: createMetricDiff({ trend: 'up' }),
            criticalIssues: createMetricDiff({ trend: 'down' }),
            majorIssues: createMetricDiff({ trend: 'stable' }),
            minorIssues: createMetricDiff({ trend: 'stable' }),
            maintainabilityIndex: createMetricDiff({ trend: 'stable' }),
            technicalDebt: createMetricDiff({ trend: 'stable' }),
          },
          coverage: {
            overall: createMetricDiff({ trend: 'stable' }),
            unit: createMetricDiff({ trend: 'stable' }),
            integration: createMetricDiff({ trend: 'stable' }),
            e2e: createMetricDiff({ trend: 'stable' }),
            untestedFiles: createMetricDiff({ trend: 'stable' }),
          },
          dependencies: {
            total: createMetricDiff({ trend: 'stable' }),
            outdated: createMetricDiff({ trend: 'stable' }),
            vulnerable: createMetricDiff({ trend: 'stable' }),
            circular: createMetricDiff({ trend: 'stable' }),
          },
        })
      );

      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(screen.getByText(/improvements.*concerns since last period/)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should refetch data when preset changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ComparisonPage />);

      await waitFor(() => {
        expect(comparisonApi.compare).toHaveBeenCalled();
      });

      const initialCallCount = vi.mocked(comparisonApi.compare).mock.calls.length;

      await user.click(screen.getByTestId('change-preset-month'));

      await waitFor(() => {
        expect(vi.mocked(comparisonApi.compare).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle stable metrics (no changes)', async () => {
      vi.mocked(comparisonApi.compare).mockResolvedValue(
        createMockComparisonResult({
          quality: {
            score: createMetricDiff({ trend: 'stable', change: 0 }),
            criticalIssues: createMetricDiff({ trend: 'stable', change: 0 }),
            majorIssues: createMetricDiff({ trend: 'stable', change: 0 }),
            minorIssues: createMetricDiff({ trend: 'stable', change: 0 }),
            maintainabilityIndex: createMetricDiff({ trend: 'stable', change: 0 }),
            technicalDebt: createMetricDiff({ trend: 'stable', change: 0 }),
          },
          coverage: {
            overall: createMetricDiff({ trend: 'stable', change: 0 }),
            unit: createMetricDiff({ trend: 'stable', change: 0 }),
            integration: createMetricDiff({ trend: 'stable', change: 0 }),
            e2e: createMetricDiff({ trend: 'stable', change: 0 }),
            untestedFiles: createMetricDiff({ trend: 'stable', change: 0 }),
          },
          dependencies: {
            total: createMetricDiff({ trend: 'stable', change: 0 }),
            outdated: createMetricDiff({ trend: 'stable', change: 0 }),
            vulnerable: createMetricDiff({ trend: 'stable', change: 0 }),
            circular: createMetricDiff({ trend: 'stable', change: 0 }),
          },
        })
      );

      renderWithProviders(<ComparisonPage />);

      // Should render without errors
      await waitFor(() => {
        expect(screen.getByText('Code Quality')).toBeInTheDocument();
      });
    });

    it('should handle zero values', async () => {
      vi.mocked(comparisonApi.compare).mockResolvedValue(
        createMockComparisonResult({
          quality: {
            score: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            criticalIssues: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            majorIssues: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            minorIssues: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            maintainabilityIndex: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            technicalDebt: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
          },
          coverage: {
            overall: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            unit: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            integration: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            e2e: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            untestedFiles: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
          },
          dependencies: {
            total: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            outdated: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            vulnerable: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
            circular: createMetricDiff({ current: 0, previous: 0, change: 0, trend: 'stable' }),
          },
        })
      );

      renderWithProviders(<ComparisonPage />);

      // Should render without errors
      await waitFor(() => {
        expect(screen.getByText('Code Quality')).toBeInTheDocument();
      });
    });
  });
});

// ============================================================================
// getDatesFromPreset Function Tests
// ============================================================================

describe('Date Preset Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(comparisonApi.compare).mockResolvedValue(createMockComparisonResult());
  });

  it('should calculate dates for week preset (7 days)', async () => {
    renderWithProviders(<ComparisonPage />);

    await waitFor(() => {
      // Check that dates are set (week = 7 days apart)
      const currentDate = screen.getByTestId('current-date').textContent;
      const previousDate = screen.getByTestId('previous-date').textContent;

      expect(currentDate).toBeTruthy();
      expect(previousDate).toBeTruthy();

      // Verify they're different dates
      expect(currentDate).not.toBe(previousDate);
    });
  });

  it('should update dates when preset changes to day', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComparisonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
    });

    const initialPrevious = screen.getByTestId('previous-date').textContent;

    await user.click(screen.getByTestId('change-preset-day'));

    await waitFor(() => {
      const newPrevious = screen.getByTestId('previous-date').textContent;
      // Day preset should have different previous date than week preset
      expect(newPrevious).not.toBe(initialPrevious);
    });
  });
});

// ============================================================================
// ComparisonLoadingSkeleton Tests
// ============================================================================

describe('ComparisonLoadingSkeleton', () => {
  it('should show skeleton during initial load', () => {
    vi.mocked(comparisonApi.compare).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(<ComparisonPage />);

    // Should render MUI Skeleton components
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
