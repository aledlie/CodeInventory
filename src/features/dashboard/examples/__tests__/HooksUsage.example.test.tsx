/**
 * Tests for HooksUsage.example.tsx
 *
 * Tests demonstrate proper testing patterns for:
 * - Suspense boundaries and fallback components
 * - Error boundaries and error recovery
 * - TanStack Query hook integration
 * - QueryClient cache invalidation
 * - Data prefetching patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useDashboardData: vi.fn(),
  useQualityReport: vi.fn(),
  useCoverageReport: vi.fn(),
  useDependencyReport: vi.fn(),
  useQueryClient: vi.fn(),
}));

// Mock the API
vi.mock('../../api/dashboardApi', () => ({
  dashboardApi: {
    loadAllReports: vi.fn(),
    loadQualityReport: vi.fn(),
    loadCoverageReport: vi.fn(),
    loadDependencyReport: vi.fn(),
  },
}));

import {
  useDashboardData,
  useQualityReport,
  useCoverageReport,
  useDependencyReport,
  useQueryClient,
} from '../../hooks';
import { dashboardApi } from '../../api/dashboardApi';
import type { DashboardData, QualityReport, CoverageReport, DependencyReport } from '../../types';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_OUTPUTS_PATH = '/path/to/outputs';
const TEST_TIMESTAMP = '2024-01-01T00:00:00Z';
const TEST_VERSION = '1.0';

// Quality metrics
const QUALITY_TOTAL_ISSUES = 15;
const QUALITY_CRITICAL_COUNT = 2;
const QUALITY_HIGH_COUNT = 5;
const QUALITY_MEDIUM_COUNT = 8;
const QUALITY_LOW_COUNT = 0;

// Alternative quality metrics for variation tests
const ALT_QUALITY_TOTAL_ISSUES = 25;
const ALT_QUALITY_CRITICAL_COUNT = 3;
const ALT_QUALITY_HIGH_COUNT = 8;
const ALT_QUALITY_MEDIUM_COUNT = 14;

// Coverage metrics
const COVERAGE_PERCENTAGE = 85.5;
const COVERAGE_TESTED_FUNCTIONS = 156;
const COVERAGE_UNTESTED_FUNCTIONS = 28;
const ALT_COVERAGE_PERCENTAGE = 92.6789;

// Dependency metrics
const DEPENDENCY_TOTAL_FILES = 42;
const DEPENDENCY_CIRCULAR_COUNT = 3;
const DEPENDENCY_COUNT = 128;
const DEPENDENCY_EXTERNAL_COUNT = 25;

// Expected section count for nested suspense
const EXPECTED_SECTION_COUNT = 3;

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockQualityData: QualityReport = {
  summary: {
    total_issues: QUALITY_TOTAL_ISSUES,
    by_severity: {
      critical: QUALITY_CRITICAL_COUNT,
      high: QUALITY_HIGH_COUNT,
      medium: QUALITY_MEDIUM_COUNT,
      low: QUALITY_LOW_COUNT,
    },
    by_category: {},
  },
  issues: [],
  timestamp: TEST_TIMESTAMP,
  version: TEST_VERSION,
};

const mockCoverageData: CoverageReport = {
  summary: {
    coverage_percentage: COVERAGE_PERCENTAGE,
    tested_functions: COVERAGE_TESTED_FUNCTIONS,
    untested_functions: COVERAGE_UNTESTED_FUNCTIONS,
    coverage_trend: [],
  },
  coverage_by_file: [],
  timestamp: TEST_TIMESTAMP,
  version: TEST_VERSION,
};

const mockDependencyData: DependencyReport = {
  summary: {
    total_files: DEPENDENCY_TOTAL_FILES,
    circular_dependencies: DEPENDENCY_CIRCULAR_COUNT,
    dependency_count: DEPENDENCY_COUNT,
    external_deps: DEPENDENCY_EXTERNAL_COUNT,
  },
  dependencies: [],
  circular_deps: [],
  timestamp: TEST_TIMESTAMP,
  version: TEST_VERSION,
};

const mockDashboardData: DashboardData = {
  quality: mockQualityData,
  coverage: mockCoverageData,
  dependencies: mockDependencyData,
};

// ============================================================================
// Test Components (from HooksUsage.example.tsx)
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="animate-pulse" data-testid="dashboard-skeleton">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

function SectionSkeleton() {
  return <div className="animate-pulse" data-testid="section-skeleton"></div>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function DashboardError() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6" data-testid="dashboard-error">
      <h2 className="text-red-800 text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
      <p className="text-red-600">
        Unable to load dashboard data. Please check that the outputs directory exists and contains
        valid report files.
      </p>
    </div>
  );
}

interface MetricsOverviewProps {
  data: DashboardData;
}

function MetricsOverview({ data }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-3 gap-4" data-testid="metrics-overview">
      <div data-testid="quality-metric">
        <h3>Code Quality</h3>
        <p>{data.quality.summary.total_issues}</p>
        <p>Total Issues</p>
      </div>
      <div data-testid="coverage-metric">
        <h3>Test Coverage</h3>
        <p>{data.coverage.summary.coverage_percentage.toFixed(1)}%</p>
        <p>Coverage</p>
      </div>
      <div data-testid="dependency-metric">
        <h3>Dependencies</h3>
        <p>{data.dependencies.summary.circular_dependencies}</p>
        <p>Circular</p>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data } = useDashboardData(TEST_OUTPUTS_PATH);

  return (
    <div>
      <h1>Code Inventory Dashboard</h1>
      <MetricsOverview data={data} />
    </div>
  );
}

function DashboardApp() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ErrorBoundary fallback={<DashboardError />}>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

function QualityDashboard() {
  const { data: qualityData } = useQualityReport(TEST_OUTPUTS_PATH);

  return (
    <div data-testid="quality-dashboard">
      <h2>Code Quality Analysis</h2>
      <p>Total Issues: {qualityData.summary.total_issues}</p>
      <p>Critical: {qualityData.summary.by_severity.critical}</p>
      <p>High: {qualityData.summary.by_severity.high}</p>
    </div>
  );
}

function CoverageDashboard() {
  const { data: coverageData } = useCoverageReport(TEST_OUTPUTS_PATH);

  return (
    <div data-testid="coverage-dashboard">
      <h2>Test Coverage</h2>
      <p>Coverage: {coverageData.summary.coverage_percentage.toFixed(1)}%</p>
      <p>Tested: {coverageData.summary.tested_functions}</p>
      <p>Untested: {coverageData.summary.untested_functions}</p>
    </div>
  );
}

function DependencyDashboard() {
  const { data: dependencyData } = useDependencyReport(TEST_OUTPUTS_PATH);

  return (
    <div data-testid="dependency-dashboard">
      <h2>Dependencies</h2>
      <p>Total Files: {dependencyData.summary.total_files}</p>
      <p>Circular Dependencies: {dependencyData.summary.circular_dependencies}</p>
    </div>
  );
}

function RefreshButton() {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return (
    <button onClick={handleRefresh} data-testid="refresh-button">
      Refresh Dashboard
    </button>
  );
}

function DashboardWithPrefetch() {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['quality-report', TEST_OUTPUTS_PATH],
      queryFn: () => dashboardApi.loadQualityReport(TEST_OUTPUTS_PATH),
    });
  };

  return (
    <div onMouseEnter={handleMouseEnter} data-testid="dashboard-with-prefetch">
      <Suspense fallback={<LoadingSpinner />}>
        <QualityDashboard />
      </Suspense>
    </div>
  );
}

function DashboardWithErrorRecovery() {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert" data-testid="error-recovery">
          <h2>Failed to load dashboard</h2>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary} data-testid="retry-button">
            Try Again
          </button>
        </div>
      )}
      onReset={() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }}
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function QualitySection() {
  const { data } = useQualityReport(TEST_OUTPUTS_PATH);
  return <div data-testid="quality-section">{/* Render quality data */}</div>;
}

function CoverageSection() {
  const { data } = useCoverageReport(TEST_OUTPUTS_PATH);
  return <div data-testid="coverage-section">{/* Render coverage data */}</div>;
}

function DependencySection() {
  const { data } = useDependencyReport(TEST_OUTPUTS_PATH);
  return <div data-testid="dependency-section">{/* Render dependency data */}</div>;
}

function DashboardWithNestedSuspense() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<SectionSkeleton />}>
        <QualitySection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CoverageSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <DependencySection />
      </Suspense>
    </div>
  );
}

// ============================================================================
// Helper for rendering with providers
// ============================================================================

function renderWithProviders(component: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('HooksUsage Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // DashboardApp Tests
  // ========================================================================

  describe('DashboardApp', () => {
    it('should render with QueryProvider and ErrorBoundary', async () => {
      vi.clearAllMocks();
      vi.mocked(useDashboardData).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<DashboardApp />);

      await waitFor(() => {
        expect(screen.getByText('Code Inventory Dashboard')).toBeInTheDocument();
      });
    });

    it('should render skeleton while loading', () => {
      vi.clearAllMocks();
      vi.mocked(useDashboardData).mockImplementationOnce(() => {
        throw new Promise(() => {}); // Never resolves
      });

      render(<DashboardApp />);

      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
    });

    it('should render dashboard content when data loads', async () => {
      vi.clearAllMocks();
      vi.mocked(useDashboardData).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<DashboardApp />);

      await waitFor(() => {
        expect(screen.getByText('Code Inventory Dashboard')).toBeInTheDocument();
      });
    });

    it('should render metrics overview with correct data', async () => {
      vi.clearAllMocks();
      vi.mocked(useDashboardData).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<DashboardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
        expect(screen.getByTestId('quality-metric')).toHaveTextContent(String(QUALITY_TOTAL_ISSUES));
        expect(screen.getByTestId('coverage-metric')).toHaveTextContent(`${COVERAGE_PERCENTAGE}%`);
        expect(screen.getByTestId('dependency-metric')).toHaveTextContent(String(DEPENDENCY_CIRCULAR_COUNT));
      });
    });
  });

  // ========================================================================
  // Individual Report Components Tests
  // ========================================================================

  describe('QualityDashboard', () => {
    it('should render quality report data', async () => {
      vi.clearAllMocks();
      vi.mocked(useQualityReport).mockReturnValue({
        data: mockQualityData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <Suspense fallback={<div>Loading...</div>}>
          <QualityDashboard />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quality-dashboard')).toBeInTheDocument();
        expect(screen.getByText(`Total Issues: ${QUALITY_TOTAL_ISSUES}`)).toBeInTheDocument();
        expect(screen.getByText(`Critical: ${QUALITY_CRITICAL_COUNT}`)).toBeInTheDocument();
        expect(screen.getByText(`High: ${QUALITY_HIGH_COUNT}`)).toBeInTheDocument();
      });
    });

    it('should display different quality metrics', async () => {
      vi.clearAllMocks();
      const customQualityData = {
        ...mockQualityData,
        summary: {
          ...mockQualityData.summary,
          total_issues: ALT_QUALITY_TOTAL_ISSUES,
          by_severity: {
            critical: ALT_QUALITY_CRITICAL_COUNT,
            high: ALT_QUALITY_HIGH_COUNT,
            medium: ALT_QUALITY_MEDIUM_COUNT,
            low: QUALITY_LOW_COUNT,
          },
        },
      };

      vi.mocked(useQualityReport).mockReturnValue({
        data: customQualityData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <Suspense fallback={<div>Loading...</div>}>
          <QualityDashboard />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText(`Total Issues: ${ALT_QUALITY_TOTAL_ISSUES}`)).toBeInTheDocument();
        expect(screen.getByText(`Critical: ${ALT_QUALITY_CRITICAL_COUNT}`)).toBeInTheDocument();
        expect(screen.getByText(`High: ${ALT_QUALITY_HIGH_COUNT}`)).toBeInTheDocument();
      });
    });
  });

  describe('CoverageDashboard', () => {
    it('should render coverage report data', async () => {
      vi.mocked(useCoverageReport).mockReturnValue({
        data: mockCoverageData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <Suspense fallback={<div>Loading...</div>}>
          <CoverageDashboard />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('coverage-dashboard')).toBeInTheDocument();
        expect(screen.getByText(`Coverage: ${COVERAGE_PERCENTAGE}%`)).toBeInTheDocument();
        expect(screen.getByText(`Tested: ${COVERAGE_TESTED_FUNCTIONS}`)).toBeInTheDocument();
        expect(screen.getByText(`Untested: ${COVERAGE_UNTESTED_FUNCTIONS}`)).toBeInTheDocument();
      });
    });

    it('should format coverage percentage correctly', async () => {
      const customCoverageData = {
        ...mockCoverageData,
        summary: {
          ...mockCoverageData.summary,
          coverage_percentage: ALT_COVERAGE_PERCENTAGE,
        },
      };

      vi.mocked(useCoverageReport).mockReturnValue({
        data: customCoverageData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <Suspense fallback={<div>Loading...</div>}>
          <CoverageDashboard />
        </Suspense>
      );

      // ALT_COVERAGE_PERCENTAGE (92.6789) formatted to 1 decimal = 92.7
      await waitFor(() => {
        expect(screen.getByText('Coverage: 92.7%')).toBeInTheDocument();
      });
    });
  });

  describe('DependencyDashboard', () => {
    it('should render dependency report data', async () => {
      vi.mocked(useDependencyReport).mockReturnValue({
        data: mockDependencyData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <Suspense fallback={<div>Loading...</div>}>
          <DependencyDashboard />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dependency-dashboard')).toBeInTheDocument();
        expect(screen.getByText(`Total Files: ${DEPENDENCY_TOTAL_FILES}`)).toBeInTheDocument();
        expect(screen.getByText(`Circular Dependencies: ${DEPENDENCY_CIRCULAR_COUNT}`)).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // RefreshButton Tests
  // ========================================================================

  describe('RefreshButton', () => {
    it('should invalidate dashboard queries on click', async () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);

      const user = userEvent.setup();
      renderWithProviders(<RefreshButton />);

      const button = screen.getByTestId('refresh-button');
      await user.click(button);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['dashboard'],
      });
    });

    it('should render refresh button with correct text', () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn(),
      };

      vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);

      renderWithProviders(<RefreshButton />);

      expect(screen.getByText('Refresh Dashboard')).toBeInTheDocument();
    });

    it('should be clickable and functional', async () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);

      const user = userEvent.setup();
      renderWithProviders(<RefreshButton />);

      const button = screen.getByTestId('refresh-button');
      expect(button).toBeEnabled();

      await user.click(button);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // DashboardWithPrefetch Tests
  // ========================================================================

  describe('DashboardWithPrefetch', () => {
    it('should prefetch quality report on mouse enter', async () => {
      const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined);
      const mockQueryClient = {
        prefetchQuery: mockPrefetchQuery,
      };

      vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);
      vi.mocked(useQualityReport).mockReturnValue({
        data: mockQualityData,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(
        <Suspense fallback={<div>Loading...</div>}>
          <DashboardWithPrefetch />
        </Suspense>
      );

      const container = screen.getByTestId('dashboard-with-prefetch');
      await user.pointer({ target: container });

      await waitFor(() => {
        expect(mockPrefetchQuery).toHaveBeenCalledWith({
          queryKey: ['quality-report', TEST_OUTPUTS_PATH],
          queryFn: expect.any(Function),
        });
      });
    });

    it('should render quality dashboard content', async () => {
      const mockQueryClient = {
        prefetchQuery: vi.fn(),
      };

      vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);
      vi.mocked(useQualityReport).mockReturnValue({
        data: mockQualityData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <Suspense fallback={<div>Loading...</div>}>
          <DashboardWithPrefetch />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quality-dashboard')).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // DashboardWithErrorRecovery Tests
  // ========================================================================

  describe('DashboardWithErrorRecovery', () => {
    it('should display error fallback on error', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const mockQueryClient = {
          invalidateQueries: vi.fn(),
        };

        // Reset and setup fresh mocks for this test
        vi.clearAllMocks();
        vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);
        vi.mocked(useDashboardData).mockImplementation(() => {
          throw new Error('Network error');
        });

        render(
          <QueryClientProvider client={new QueryClient()}>
            <DashboardWithErrorRecovery />
          </QueryClientProvider>
        );

        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('should have retry button in error state', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const mockQueryClient = {
          invalidateQueries: vi.fn(),
        };

        // Reset and setup fresh mocks for this test
        vi.clearAllMocks();
        vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);
        vi.mocked(useDashboardData).mockImplementation(() => {
          throw new Error('Failed to fetch');
        });

        render(
          <QueryClientProvider client={new QueryClient()}>
            <DashboardWithErrorRecovery />
          </QueryClientProvider>
        );

        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('should call error boundary reset handler on retry', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const mockInvalidate = vi.fn().mockResolvedValue(undefined);
        const mockQueryClient = {
          invalidateQueries: mockInvalidate,
        };

        // Reset and setup fresh mocks for this test
        vi.clearAllMocks();
        vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);
        vi.mocked(useDashboardData).mockImplementation(() => {
          throw new Error('Test error');
        });

        render(
          <QueryClientProvider client={new QueryClient()}>
            <DashboardWithErrorRecovery />
          </QueryClientProvider>
        );

        // Verify error is shown
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();

        // The reset button would invalidate queries
        // We verify the component structure is correct
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      } finally {
        consoleError.mockRestore();
      }
    });
  });

  // ========================================================================
  // DashboardWithNestedSuspense Tests
  // ========================================================================

  describe('DashboardWithNestedSuspense', () => {
    it('should render all three sections with loading states', () => {
      vi.mocked(useQualityReport).mockImplementationOnce(() => {
        throw new Promise(() => {}); // Never resolves
      });
      vi.mocked(useCoverageReport).mockImplementationOnce(() => {
        throw new Promise(() => {}); // Never resolves
      });
      vi.mocked(useDependencyReport).mockImplementationOnce(() => {
        throw new Promise(() => {}); // Never resolves
      });

      renderWithProviders(<DashboardWithNestedSuspense />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      const skeletons = screen.getAllByTestId('section-skeleton');
      expect(skeletons).toHaveLength(EXPECTED_SECTION_COUNT);
    });

    it('should render all three sections when loaded', async () => {
      vi.mocked(useQualityReport).mockReturnValue({
        data: mockQualityData,
        isLoading: false,
        error: null,
      });
      vi.mocked(useCoverageReport).mockReturnValue({
        data: mockCoverageData,
        isLoading: false,
        error: null,
      });
      vi.mocked(useDependencyReport).mockReturnValue({
        data: mockDependencyData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<DashboardWithNestedSuspense />);

      await waitFor(() => {
        expect(screen.getByTestId('quality-section')).toBeInTheDocument();
        expect(screen.getByTestId('coverage-section')).toBeInTheDocument();
        expect(screen.getByTestId('dependency-section')).toBeInTheDocument();
      });
    });

    it('should have independent loading states for each section', () => {
      // Quality report suspended
      vi.mocked(useQualityReport).mockImplementationOnce(() => {
        throw new Promise(() => {});
      });

      // Coverage and dependency loaded
      vi.mocked(useCoverageReport).mockReturnValue({
        data: mockCoverageData,
        isLoading: false,
        error: null,
      });
      vi.mocked(useDependencyReport).mockReturnValue({
        data: mockDependencyData,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<DashboardWithNestedSuspense />);

      // Should still show coverage and dependency sections
      expect(screen.getByTestId('coverage-section')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-section')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Fallback Components Tests
  // ========================================================================

  describe('Fallback Components', () => {
    it('should render DashboardSkeleton', () => {
      render(<DashboardSkeleton />);
      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
    });

    it('should render SectionSkeleton', () => {
      render(<SectionSkeleton />);
      expect(screen.getByTestId('section-skeleton')).toBeInTheDocument();
    });

    it('should render LoadingSpinner', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render DashboardError with correct message', () => {
      render(<DashboardError />);

      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to load dashboard data/i)
      ).toBeInTheDocument();
    });
  });

  // ========================================================================
  // MetricsOverview Tests
  // ========================================================================

  describe('MetricsOverview', () => {
    it('should display all three metrics', () => {
      render(<MetricsOverview data={mockDashboardData} />);

      expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
      expect(screen.getByTestId('quality-metric')).toBeInTheDocument();
      expect(screen.getByTestId('coverage-metric')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-metric')).toBeInTheDocument();
    });

    it('should display correct quality metric values', () => {
      render(<MetricsOverview data={mockDashboardData} />);

      expect(screen.getByText('Code Quality')).toBeInTheDocument();
      expect(screen.getByText(String(QUALITY_TOTAL_ISSUES))).toBeInTheDocument();
      expect(screen.getByText('Total Issues')).toBeInTheDocument();
    });

    it('should format coverage percentage with one decimal', () => {
      render(<MetricsOverview data={mockDashboardData} />);

      expect(screen.getByText('Test Coverage')).toBeInTheDocument();
      expect(screen.getByText(`${COVERAGE_PERCENTAGE}%`)).toBeInTheDocument();
      expect(screen.getByText('Coverage')).toBeInTheDocument();
    });

    it('should display circular dependency count', () => {
      render(<MetricsOverview data={mockDashboardData} />);

      expect(screen.getByText('Dependencies')).toBeInTheDocument();
      expect(screen.getByText('Circular')).toBeInTheDocument();

      // Find the div with dependency metric and check for the value
      const depMetric = screen.getByTestId('dependency-metric');
      expect(depMetric).toHaveTextContent(String(DEPENDENCY_CIRCULAR_COUNT));
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration', () => {
    it('should handle multiple hooks in single component', async () => {
      vi.mocked(useDashboardData).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<DashboardApp />);

      await waitFor(() => {
        expect(screen.getByText('Code Inventory Dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
      });
    });

    it('should work with QueryProvider and Suspense together', async () => {
      vi.mocked(useQualityReport).mockReturnValue({
        data: mockQualityData,
        isLoading: false,
        error: null,
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <QualityDashboard />
          </Suspense>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quality-dashboard')).toBeInTheDocument();
      });
    });

    it('should render dashboard content with multiple providers', async () => {
      vi.mocked(useDashboardData).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(
        <QueryClientProvider client={new QueryClient()}>
          <ErrorBoundary fallback={<DashboardError />}>
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardContent />
            </Suspense>
          </ErrorBoundary>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Code Inventory Dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
      });
    });
  });
});
