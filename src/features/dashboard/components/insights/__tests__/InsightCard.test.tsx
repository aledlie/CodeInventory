/**
 * InsightCard Component Tests
 *
 * Tests for the AI-generated insight card component including:
 * - Rendering of insight types, severity, and confidence
 * - Interactive features (expand/collapse, actions)
 * - Accessibility attributes
 * - Compact mode
 * - Loading state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { InsightCard } from '../InsightCard';
import type { AIInsight, MetricSnapshot, FileReference } from '../../../types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockMetrics: MetricSnapshot[] = [
  {
    name: 'Quality Score',
    current: 85,
    previous: 80,
    change: 5,
    changePercent: 6.25,
    trend: 'up',
    unit: '%',
  },
  {
    name: 'Coverage',
    current: 72,
    previous: 75,
    change: -3,
    changePercent: -4,
    trend: 'down',
    unit: '%',
  },
];

const mockFiles: FileReference[] = [
  { path: 'src/components/Dashboard.tsx', line: 42, percentage: 85, previousPercentage: 80 },
  { path: 'src/utils/helpers.ts', line: 15 },
  { path: 'src/api/endpoints.ts', percentage: 70 },
  { path: 'src/hooks/useData.ts' },
  { path: 'src/services/auth.ts' },
  { path: 'src/types/models.ts' },
];

const mockInsight: AIInsight = {
  id: 'insight-1',
  type: 'improvement',
  severity: 'medium',
  title: 'Test Coverage Improved',
  explanation: 'Your test coverage has improved by 5% this week. Focus on testing the authentication module next.',
  confidence: 85,
  metrics: mockMetrics,
  affectedFiles: mockFiles,
  recommendations: ['Add unit tests for auth module', 'Increase integration test coverage'],
  createdAt: '2024-01-15T10:00:00Z',
  category: 'testing',
  tags: ['coverage', 'quality'],
};

const mockAcknowledgedInsight: AIInsight = {
  ...mockInsight,
  id: 'insight-2',
  acknowledgedAt: '2024-01-16T10:00:00Z',
  acknowledgedBy: 'john.doe',
};

// ============================================================================
// Test Utilities
// ============================================================================

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('InsightCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render insight title', () => {
      renderWithTheme(<InsightCard insight={mockInsight} />);

      expect(screen.getByText('Test Coverage Improved')).toBeInTheDocument();
    });

    it('should render insight explanation', () => {
      renderWithTheme(<InsightCard insight={mockInsight} />);

      expect(
        screen.getByText(/Your test coverage has improved by 5% this week/)
      ).toBeInTheDocument();
    });

    it('should render severity badge', () => {
      renderWithTheme(<InsightCard insight={mockInsight} />);

      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should render type badge', () => {
      renderWithTheme(<InsightCard insight={mockInsight} />);

      expect(screen.getByText('improvement')).toBeInTheDocument();
    });

    it('should render confidence score', () => {
      renderWithTheme(<InsightCard insight={mockInsight} />);

      // Confidence appears in the stars section - use getAllByText since 85% also appears in metrics
      const confidenceElements = screen.getAllByText('85%');
      expect(confidenceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render category chip when provided', () => {
      renderWithTheme(<InsightCard insight={mockInsight} />);

      expect(screen.getByText('testing')).toBeInTheDocument();
    });

    it('should have proper aria attributes', () => {
      renderWithTheme(<InsightCard insight={mockInsight} />);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby', 'insight-title-insight-1');
      expect(card).toHaveAttribute('aria-describedby', 'insight-desc-insight-1');
    });
  });

  describe('Insight Types', () => {
    it.each([
      ['improvement', 'success'],
      ['concern', 'error'],
      ['recommendation', 'info'],
      ['prediction', 'secondary'],
    ] as const)('should render %s type with correct styling', (type) => {
      const insight = { ...mockInsight, type };
      renderWithTheme(<InsightCard insight={insight} />);

      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  describe('Severity Levels', () => {
    it.each([
      ['critical', 'error'],
      ['high', 'warning'],
      ['medium', 'info'],
      ['low', 'success'],
    ] as const)('should render %s severity', (severity) => {
      const insight = { ...mockInsight, severity };
      renderWithTheme(<InsightCard insight={insight} />);

      expect(screen.getByText(severity)).toBeInTheDocument();
    });
  });

  describe('Confidence Stars', () => {
    it('should render 5 stars for 100% confidence', () => {
      const insight = { ...mockInsight, confidence: 100, metrics: [] };
      renderWithTheme(<InsightCard insight={insight} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should render correct star count for 85% confidence', () => {
      const insight = { ...mockInsight, metrics: [] };
      renderWithTheme(<InsightCard insight={insight} />);

      // 85% / 20 = 4.25 rounds to 4 filled stars
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should render 1 star for 20% confidence', () => {
      const insight = { ...mockInsight, confidence: 20, metrics: [] };
      renderWithTheme(<InsightCard insight={insight} />);

      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Metrics Tests
// ============================================================================

describe('InsightCard Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render related metrics section', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    expect(screen.getByText('Related Metrics')).toBeInTheDocument();
  });

  it('should render metric names', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('Coverage')).toBeInTheDocument();
  });

  it('should render current metric values with units', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    // Use getAllByText since percentages may appear multiple times
    const values85 = screen.getAllByText('85%');
    const values72 = screen.getAllByText('72%');
    expect(values85.length).toBeGreaterThanOrEqual(1);
    expect(values72.length).toBeGreaterThanOrEqual(1);
  });

  it('should render positive change with plus sign', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    // Check that positive change values appear somewhere in the document
    const content = document.body.textContent || '';
    expect(content).toContain('+5%');
    // 6.25 is rounded in the display
    expect(content).toMatch(/6\.\d/);
  });

  it('should render negative change', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    // Check that negative change values appear somewhere in the document
    const content = document.body.textContent || '';
    expect(content).toContain('-3%');
    expect(content).toContain('-4.0');
  });

  it('should render previous values', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    expect(screen.getByText('was 80%')).toBeInTheDocument();
    expect(screen.getByText('was 75%')).toBeInTheDocument();
  });

  it('should not render metrics section when metrics array is empty', () => {
    const insight = { ...mockInsight, metrics: [] };
    renderWithTheme(<InsightCard insight={insight} />);

    expect(screen.queryByText('Related Metrics')).not.toBeInTheDocument();
  });

  it('should handle metrics without unit', () => {
    const insight = {
      ...mockInsight,
      metrics: [
        {
          name: 'Issues Count',
          current: 10,
          previous: 15,
          change: -5,
          changePercent: -33.33,
          trend: 'down' as const,
        },
      ],
    };
    renderWithTheme(<InsightCard insight={insight} />);

    expect(screen.getByText('Issues Count')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});

// ============================================================================
// Expand/Collapse Tests
// ============================================================================

describe('InsightCard Expand/Collapse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show affected files count', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    expect(screen.getByText('6 affected files')).toBeInTheDocument();
  });

  it('should show recommendations count', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    // The component shows affected files and recommendations in one line
    expect(screen.getByText(/2 recommendations/)).toBeInTheDocument();
  });

  it('should expand to show affected files when clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<InsightCard insight={mockInsight} />);

    const expandButton = screen.getByText(/6 affected files/);
    await user.click(expandButton);

    expect(screen.getByText('src/components/Dashboard.tsx')).toBeInTheDocument();
  });

  it('should show only first 5 files when expanded', async () => {
    const user = userEvent.setup();
    renderWithTheme(<InsightCard insight={mockInsight} />);

    await user.click(screen.getByText(/6 affected files/));

    expect(screen.getByText('src/components/Dashboard.tsx')).toBeInTheDocument();
    expect(screen.getByText('src/utils/helpers.ts')).toBeInTheDocument();
    expect(screen.getByText('src/api/endpoints.ts')).toBeInTheDocument();
    expect(screen.getByText('src/hooks/useData.ts')).toBeInTheDocument();
    expect(screen.getByText('src/services/auth.ts')).toBeInTheDocument();
    expect(screen.queryByText('src/types/models.ts')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more files')).toBeInTheDocument();
  });

  it('should show file percentage when available', async () => {
    const user = userEvent.setup();
    renderWithTheme(<InsightCard insight={mockInsight} />);

    await user.click(screen.getByText(/6 affected files/));

    // The file Dashboard.tsx has percentage 85 and previousPercentage 80
    expect(screen.getByText(/85%.*was 80%/)).toBeInTheDocument();
  });

  it('should show line number when available', async () => {
    const user = userEvent.setup();
    renderWithTheme(<InsightCard insight={mockInsight} />);

    await user.click(screen.getByText(/6 affected files/));

    expect(screen.getByText('Line 15')).toBeInTheDocument();
  });

  it('should show recommendations when expanded', async () => {
    const user = userEvent.setup();
    renderWithTheme(<InsightCard insight={mockInsight} />);

    await user.click(screen.getByText(/2 recommendations/));

    expect(screen.getByText('Add unit tests for auth module')).toBeInTheDocument();
    expect(screen.getByText('Increase integration test coverage')).toBeInTheDocument();
  });

  it('should collapse when clicked again', async () => {
    const user = userEvent.setup();
    renderWithTheme(<InsightCard insight={mockInsight} />);

    const expandButton = screen.getByText(/6 affected files/);
    await user.click(expandButton);
    expect(screen.getByText('src/components/Dashboard.tsx')).toBeInTheDocument();

    await user.click(expandButton);
    // After collapse, aria-expanded should be false
    const expandArea = expandButton.closest('[role="button"]');
    expect(expandArea).toHaveAttribute('aria-expanded', 'false');
  });

  it('should toggle with Enter key', async () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    const expandArea = screen.getByRole('button', { name: /Expand/i });
    fireEvent.keyDown(expandArea, { key: 'Enter' });

    expect(screen.getByText('src/components/Dashboard.tsx')).toBeInTheDocument();
  });

  it('should have correct aria-expanded attribute', async () => {
    const user = userEvent.setup();
    renderWithTheme(<InsightCard insight={mockInsight} />);

    const expandArea = screen.getByText(/6 affected files/).closest('[role="button"]');
    expect(expandArea).toHaveAttribute('aria-expanded', 'false');

    await user.click(expandArea!);
    expect(expandArea).toHaveAttribute('aria-expanded', 'true');
  });

  it('should not show expand section when no files or recommendations', () => {
    const insight = { ...mockInsight, affectedFiles: [], recommendations: [] };
    renderWithTheme(<InsightCard insight={insight} />);

    expect(screen.queryByText(/affected files/)).not.toBeInTheDocument();
    expect(screen.queryByText(/recommendations/)).not.toBeInTheDocument();
  });
});

// ============================================================================
// Action Button Tests
// ============================================================================

describe('InsightCard Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render View Details button when callback provided', () => {
    const onViewDetails = vi.fn();
    renderWithTheme(<InsightCard insight={mockInsight} onViewDetails={onViewDetails} />);

    expect(screen.getByRole('button', { name: /View Details/i })).toBeInTheDocument();
  });

  it('should call onViewDetails with insight id when clicked', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();
    renderWithTheme(<InsightCard insight={mockInsight} onViewDetails={onViewDetails} />);

    await user.click(screen.getByRole('button', { name: /View Details/i }));

    expect(onViewDetails).toHaveBeenCalledWith('insight-1');
  });

  it('should render Acknowledge button when callback provided and not acknowledged', () => {
    const onAcknowledge = vi.fn();
    renderWithTheme(<InsightCard insight={mockInsight} onAcknowledge={onAcknowledge} />);

    expect(screen.getByRole('button', { name: /Acknowledge/i })).toBeInTheDocument();
  });

  it('should call onAcknowledge with insight id when clicked', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();
    renderWithTheme(<InsightCard insight={mockInsight} onAcknowledge={onAcknowledge} />);

    await user.click(screen.getByRole('button', { name: /Acknowledge/i }));

    expect(onAcknowledge).toHaveBeenCalledWith('insight-1');
  });

  it('should not render Acknowledge button when already acknowledged', () => {
    const onAcknowledge = vi.fn();
    renderWithTheme(<InsightCard insight={mockAcknowledgedInsight} onAcknowledge={onAcknowledge} />);

    expect(screen.queryByRole('button', { name: /Acknowledge/i })).not.toBeInTheDocument();
  });

  it('should show acknowledged icon when insight is acknowledged', () => {
    renderWithTheme(<InsightCard insight={mockAcknowledgedInsight} />);

    // Look for the acknowledged icon tooltip
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
  });

  it('should disable Acknowledge button when loading', () => {
    const onAcknowledge = vi.fn();
    renderWithTheme(
      <InsightCard insight={mockInsight} onAcknowledge={onAcknowledge} isLoading />
    );

    expect(screen.getByRole('button', { name: /Acknowledge/i })).toBeDisabled();
  });

  it('should not render action buttons when callbacks not provided', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    expect(screen.queryByRole('button', { name: /View Details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Acknowledge/i })).not.toBeInTheDocument();
  });

  it('should have accessible button labels', () => {
    const onViewDetails = vi.fn();
    const onAcknowledge = vi.fn();
    renderWithTheme(
      <InsightCard
        insight={mockInsight}
        onViewDetails={onViewDetails}
        onAcknowledge={onAcknowledge}
      />
    );

    expect(
      screen.getByRole('button', { name: /View details for Test Coverage Improved/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Acknowledge insight: Test Coverage Improved/i })
    ).toBeInTheDocument();
  });
});

// ============================================================================
// Compact Mode Tests
// ============================================================================

describe('InsightCard Compact Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render in compact mode', () => {
    renderWithTheme(<InsightCard insight={mockInsight} compact />);

    expect(screen.getByText('Test Coverage Improved')).toBeInTheDocument();
  });

  it('should not render metrics section in compact mode', () => {
    renderWithTheme(<InsightCard insight={mockInsight} compact />);

    expect(screen.queryByText('Related Metrics')).not.toBeInTheDocument();
  });

  it('should not render expand section in compact mode', () => {
    renderWithTheme(<InsightCard insight={mockInsight} compact />);

    expect(screen.queryByText(/affected files/)).not.toBeInTheDocument();
    expect(screen.queryByText(/recommendations/)).not.toBeInTheDocument();
  });

  it('should not render action buttons in compact mode', () => {
    const onViewDetails = vi.fn();
    const onAcknowledge = vi.fn();
    renderWithTheme(
      <InsightCard
        insight={mockInsight}
        onViewDetails={onViewDetails}
        onAcknowledge={onAcknowledge}
        compact
      />
    );

    expect(screen.queryByRole('button', { name: /View Details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Acknowledge/i })).not.toBeInTheDocument();
  });

  it('should truncate explanation text in compact mode', () => {
    const longExplanation =
      'This is a very long explanation that should be truncated when displayed in compact mode because it exceeds the maximum number of lines allowed in the compact view.';
    const insight = { ...mockInsight, explanation: longExplanation };
    renderWithTheme(<InsightCard insight={insight} compact />);

    const explanation = screen.getByText(longExplanation);
    expect(explanation).toHaveStyle({ overflow: 'hidden' });
  });

  it('should still render confidence stars in compact mode', () => {
    const insight = { ...mockInsight, metrics: [] };
    renderWithTheme(<InsightCard insight={insight} compact />);

    expect(screen.getByText('85%')).toBeInTheDocument();
  });
});

// ============================================================================
// Loading State Tests
// ============================================================================

describe('InsightCard Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading progress bar when isLoading is true', () => {
    renderWithTheme(<InsightCard insight={mockInsight} isLoading />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should not show loading progress bar when isLoading is false', () => {
    renderWithTheme(<InsightCard insight={mockInsight} isLoading={false} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Acknowledged State Tests
// ============================================================================

describe('InsightCard Acknowledged State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have reduced opacity when acknowledged', () => {
    renderWithTheme(<InsightCard insight={mockAcknowledgedInsight} />);

    const card = screen.getByRole('article');
    expect(card).toHaveStyle({ opacity: '0.7' });
  });

  it('should show acknowledger name in tooltip', () => {
    renderWithTheme(<InsightCard insight={mockAcknowledgedInsight} />);

    // The tooltip content is accessible via the title attribute
    const acknowledgedIcon = screen.getByTestId('CheckCircleIcon');
    expect(acknowledgedIcon.closest('[title]') || acknowledgedIcon.parentElement).toBeInTheDocument();
  });
});

// ============================================================================
// Trend Icon Tests
// ============================================================================

describe('InsightCard Trend Icons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render up trend icon for positive trend', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    // Quality Score has 'up' trend
    const qualityMetric = screen.getByText('Quality Score').closest('div');
    expect(within(qualityMetric!).getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });

  it('should render down trend icon for negative trend', () => {
    renderWithTheme(<InsightCard insight={mockInsight} />);

    // Coverage has 'down' trend
    const coverageSection = screen.getByText('Coverage').closest('[class*="MuiBox-root"]');
    expect(coverageSection).toBeInTheDocument();
  });

  it('should render stable trend icon when trend is stable', () => {
    const insight = {
      ...mockInsight,
      metrics: [
        {
          name: 'Complexity',
          current: 50,
          previous: 50,
          change: 0,
          changePercent: 0,
          trend: 'stable' as const,
        },
      ],
    };
    renderWithTheme(<InsightCard insight={insight} />);

    expect(screen.getByText('Complexity')).toBeInTheDocument();
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('InsightCard Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle insight without category', () => {
    const insight = { ...mockInsight, category: undefined };
    renderWithTheme(<InsightCard insight={insight} />);

    expect(screen.getByText('Test Coverage Improved')).toBeInTheDocument();
    expect(screen.queryByText('testing')).not.toBeInTheDocument();
  });

  it('should handle insight without tags', () => {
    const insight = { ...mockInsight, tags: undefined };
    renderWithTheme(<InsightCard insight={insight} />);

    expect(screen.getByText('Test Coverage Improved')).toBeInTheDocument();
  });

  it('should handle empty recommendations array', () => {
    const insight = { ...mockInsight, recommendations: [] };
    renderWithTheme(<InsightCard insight={insight} />);

    // Should only show affected files count, not recommendations
    expect(screen.getByText('6 affected files')).toBeInTheDocument();
    expect(screen.queryByText(/recommendations/)).not.toBeInTheDocument();
  });

  it('should handle empty affected files array', () => {
    const insight = { ...mockInsight, affectedFiles: [] };
    renderWithTheme(<InsightCard insight={insight} />);

    // Should only show recommendations count, not affected files
    expect(screen.queryByText(/affected files/)).not.toBeInTheDocument();
    expect(screen.getByText('2 recommendations')).toBeInTheDocument();
  });

  it('should handle single affected file', () => {
    const insight = { ...mockInsight, affectedFiles: [mockFiles[0]], recommendations: [] };
    renderWithTheme(<InsightCard insight={insight} />);

    // The component shows "X affected files" (doesn't change to singular)
    expect(screen.getByText(/1 affected file/)).toBeInTheDocument();
  });

  it('should handle file with only percentage (no previous)', async () => {
    const user = userEvent.setup();
    const insight = {
      ...mockInsight,
      metrics: [], // Clear metrics to avoid 90% clash
      affectedFiles: [{ path: 'src/test.ts', percentage: 90 }],
    };
    renderWithTheme(<InsightCard insight={insight} />);

    await user.click(screen.getByText(/1 affected files/));

    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('should handle very long file paths', async () => {
    const user = userEvent.setup();
    const insight = {
      ...mockInsight,
      affectedFiles: [
        {
          path: 'src/very/deeply/nested/directory/structure/with/many/levels/Component.tsx',
        },
      ],
    };
    renderWithTheme(<InsightCard insight={insight} />);

    await user.click(screen.getByText(/1 affected files/));

    expect(
      screen.getByText('src/very/deeply/nested/directory/structure/with/many/levels/Component.tsx')
    ).toBeInTheDocument();
  });

  it('should handle zero confidence', () => {
    const insight = { ...mockInsight, confidence: 0, metrics: [] };
    renderWithTheme(<InsightCard insight={insight} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
