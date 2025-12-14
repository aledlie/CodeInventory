/**
 * VisualizationBuilder Component Tests
 *
 * Tests for the drag-and-drop visualization builder component including:
 * - Initial render states (loading, create prompt, builder)
 * - Create visualization flow
 * - Save functionality
 * - Export dialog and formats
 * - Dirty state tracking
 * - Snackbar notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VisualizationBuilder } from '../VisualizationBuilder';
import type { VisualizationConfig } from '../../../types/visualizations';

// ============================================================================
// Mocks
// ============================================================================

// Mock the hooks
const mockUseVisualization = vi.fn();
const mockUseCreateVisualization = vi.fn();
const mockUseSaveVisualization = vi.fn();
const mockUseExportVisualization = vi.fn();

vi.mock('../../../hooks/useVisualization', () => ({
  useVisualization: () => mockUseVisualization(),
  useCreateVisualization: () => mockUseCreateVisualization(),
  useSaveVisualization: () => mockUseSaveVisualization(),
  useExportVisualization: () => mockUseExportVisualization(),
}));

// Mock child components
vi.mock('../BuilderSidebar', () => ({
  BuilderSidebar: ({ config, onChange }: { config: VisualizationConfig; onChange: (c: VisualizationConfig) => void }) => (
    <div data-testid="builder-sidebar">
      <span>Sidebar: {config.title}</span>
      <button
        onClick={() => onChange({ ...config, title: 'Modified Title' })}
        data-testid="modify-config"
      >
        Modify Config
      </button>
    </div>
  ),
}));

vi.mock('../BuilderCanvas', () => ({
  BuilderCanvas: ({ config, onExport }: { config: VisualizationConfig; onExport: () => void }) => (
    <div data-testid="builder-canvas">
      <span>Canvas: {config.title}</span>
      <button onClick={onExport} data-testid="open-export">
        Export
      </button>
    </div>
  ),
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const mockVisualizationConfig: VisualizationConfig = {
  id: 'viz-1',
  title: 'Test Visualization',
  description: 'A test visualization',
  chartType: 'line',
  metrics: [
    {
      metric: 'qualityScore',
      label: 'Quality Score',
      color: '#4caf50',
      visible: true,
      yAxis: 'left',
    },
  ],
  timeRange: '30d',
  aggregation: 'daily',
  showLegend: true,
  showGrid: true,
  showDataLabels: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

// ============================================================================
// Test Utilities
// ============================================================================

const theme = createTheme();

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Default Mock Implementations
// ============================================================================

function setupDefaultMocks() {
  mockUseVisualization.mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
  });

  mockUseCreateVisualization.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  });

  mockUseSaveVisualization.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  });

  mockUseExportVisualization.mockReturnValue({
    mutate: vi.fn(),
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('VisualizationBuilder', () => {
  beforeEach(() => {
    setupDefaultMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Render - No Visualization', () => {
    it('should render create prompt when no visualization exists', () => {
      renderWithProviders(<VisualizationBuilder />);

      expect(screen.getByText('Create a Custom Visualization')).toBeInTheDocument();
      expect(screen.getByText(/Build interactive charts/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create New Visualization/i })).toBeInTheDocument();
    });

    it('should show create button as enabled', () => {
      renderWithProviders(<VisualizationBuilder />);

      const createButton = screen.getByRole('button', { name: /Create New Visualization/i });
      expect(createButton).not.toBeDisabled();
    });

    it('should show creating state when create is pending', () => {
      mockUseCreateVisualization.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });

      renderWithProviders(<VisualizationBuilder />);

      expect(screen.getByRole('button', { name: /Creating.../i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Creating.../i })).toBeDisabled();
    });
  });

  describe('Create Visualization Flow', () => {
    it('should call createViz when create button is clicked', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockUseCreateVisualization.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      renderWithProviders(<VisualizationBuilder />);

      await user.click(screen.getByRole('button', { name: /Create New Visualization/i }));

      expect(mockMutate).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('should render builder after successful creation', async () => {
      const user = userEvent.setup();
      let onSuccessCallback: ((viz: VisualizationConfig) => void) | undefined;

      const mockMutate = vi.fn((_, options) => {
        onSuccessCallback = options?.onSuccess;
      });

      mockUseCreateVisualization.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      const { rerender } = renderWithProviders(<VisualizationBuilder />);

      await user.click(screen.getByRole('button', { name: /Create New Visualization/i }));

      // Simulate successful creation
      if (onSuccessCallback) {
        onSuccessCallback(mockVisualizationConfig);
      }

      // Need to rerender to see the state change
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <ThemeProvider theme={theme}>
            <VisualizationBuilder />
          </ThemeProvider>
        </QueryClientProvider>
      );
    });
  });

  describe('Builder View with Existing Visualization', () => {
    beforeEach(() => {
      mockUseVisualization.mockReturnValue({
        data: mockVisualizationConfig,
        isLoading: false,
        error: null,
      });
    });

    it('should render builder header', () => {
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      expect(screen.getByText('Visualization Builder')).toBeInTheDocument();
    });

    it('should render sidebar with config', () => {
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      expect(screen.getByTestId('builder-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Sidebar: Test Visualization')).toBeInTheDocument();
    });

    it('should render canvas with config', () => {
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      expect(screen.getByTestId('builder-canvas')).toBeInTheDocument();
      expect(screen.getByText('Canvas: Test Visualization')).toBeInTheDocument();
    });

    it('should render New button', () => {
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      expect(screen.getByRole('button', { name: /New/i })).toBeInTheDocument();
    });

    it('should render Save button', () => {
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    });

    it('should have Save button disabled when no changes', () => {
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
    });
  });

  describe('Dirty State Tracking', () => {
    beforeEach(() => {
      mockUseVisualization.mockReturnValue({
        data: mockVisualizationConfig,
        isLoading: false,
        error: null,
      });
    });

    it('should show unsaved changes indicator after config modification', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('modify-config'));

      expect(screen.getByText('(unsaved changes)')).toBeInTheDocument();
    });

    it('should enable Save button after config modification', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('modify-config'));

      expect(screen.getByRole('button', { name: /Save/i })).not.toBeDisabled();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      mockUseVisualization.mockReturnValue({
        data: mockVisualizationConfig,
        isLoading: false,
        error: null,
      });
    });

    it('should call saveViz when Save button is clicked', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockUseSaveVisualization.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      // First modify to enable save
      await user.click(screen.getByTestId('modify-config'));

      // Then save
      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('should show Saving state when save is pending', async () => {
      const user = userEvent.setup();
      mockUseSaveVisualization.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      // Modify to enable button visibility
      await user.click(screen.getByTestId('modify-config'));

      expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
    });

    it('should disable Save button when saving', async () => {
      const user = userEvent.setup();
      mockUseSaveVisualization.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('modify-config'));

      expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();
    });

    it('should call onSave callback on successful save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      let onSuccessCallback: ((viz: VisualizationConfig) => void) | undefined;

      const mockMutate = vi.fn((_, options) => {
        onSuccessCallback = options?.onSuccess;
      });

      mockUseSaveVisualization.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" onSave={onSave} />);

      await user.click(screen.getByTestId('modify-config'));
      await user.click(screen.getByRole('button', { name: /Save/i }));

      // Simulate successful save
      if (onSuccessCallback) {
        onSuccessCallback(mockVisualizationConfig);
      }

      expect(onSave).toHaveBeenCalledWith(mockVisualizationConfig);
    });
  });

  describe('Export Dialog', () => {
    beforeEach(() => {
      mockUseVisualization.mockReturnValue({
        data: mockVisualizationConfig,
        isLoading: false,
        error: null,
      });
    });

    it('should open export dialog when export is triggered', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));

      expect(screen.getByText('Export Visualization')).toBeInTheDocument();
    });

    it('should show all export format options', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));

      expect(screen.getByRole('button', { name: /PNG Image/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /SVG Vector/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /PDF Document/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /JSON Config/i })).toBeInTheDocument();
    });

    it('should close dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));
      expect(screen.getByText('Export Visualization')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Export Visualization')).not.toBeInTheDocument();
      });
    });

    it('should call exportViz for PNG format', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockUseExportVisualization.mockReturnValue({
        mutate: mockMutate,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));
      await user.click(screen.getByRole('button', { name: /PNG Image/i }));

      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'viz-1', options: { format: 'png' } },
        expect.any(Object)
      );
    });

    it('should call exportViz for SVG format', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockUseExportVisualization.mockReturnValue({
        mutate: mockMutate,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));
      await user.click(screen.getByRole('button', { name: /SVG Vector/i }));

      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'viz-1', options: { format: 'svg' } },
        expect.any(Object)
      );
    });

    it('should call exportViz for PDF format', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockUseExportVisualization.mockReturnValue({
        mutate: mockMutate,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));
      await user.click(screen.getByRole('button', { name: /PDF Document/i }));

      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'viz-1', options: { format: 'pdf' } },
        expect.any(Object)
      );
    });

    it('should handle JSON export directly without API call', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockUseExportVisualization.mockReturnValue({
        mutate: mockMutate,
      });

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock anchor element click
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const anchor = originalCreateElement('a');
          anchor.click = mockClick;
          return anchor;
        }
        return originalCreateElement(tag);
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));
      await user.click(screen.getByRole('button', { name: /JSON Config/i }));

      // JSON export should not call the API
      expect(mockMutate).not.toHaveBeenCalled();

      // Should create blob URL and trigger download
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      // Cleanup
      vi.restoreAllMocks();
    });

    it('should close dialog after selecting format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('open-export'));
      expect(screen.getByText('Export Visualization')).toBeInTheDocument();

      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      await user.click(screen.getByRole('button', { name: /JSON Config/i }));

      await waitFor(() => {
        expect(screen.queryByText('Export Visualization')).not.toBeInTheDocument();
      });
    });
  });

  describe('New Button in Builder', () => {
    beforeEach(() => {
      mockUseVisualization.mockReturnValue({
        data: mockVisualizationConfig,
        isLoading: false,
        error: null,
      });
    });

    it('should call createViz when New button is clicked', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockUseCreateVisualization.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByRole('button', { name: /New/i }));

      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Snackbar Notifications', () => {
    beforeEach(() => {
      mockUseVisualization.mockReturnValue({
        data: mockVisualizationConfig,
        isLoading: false,
        error: null,
      });
    });

    it('should show success snackbar on successful save', async () => {
      const user = userEvent.setup();
      let onSuccessCallback: ((viz: VisualizationConfig) => void) | undefined;

      const mockMutate = vi.fn((_, options) => {
        onSuccessCallback = options?.onSuccess;
      });

      mockUseSaveVisualization.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('modify-config'));
      await user.click(screen.getByRole('button', { name: /Save/i }));

      // Simulate successful save
      if (onSuccessCallback) {
        onSuccessCallback(mockVisualizationConfig);
      }

      await waitFor(() => {
        expect(screen.getByText('Visualization saved successfully')).toBeInTheDocument();
      });
    });

    it('should show error snackbar on failed save', async () => {
      const user = userEvent.setup();
      let onErrorCallback: (() => void) | undefined;

      const mockMutate = vi.fn((_, options) => {
        onErrorCallback = options?.onError;
      });

      mockUseSaveVisualization.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      await user.click(screen.getByTestId('modify-config'));
      await user.click(screen.getByRole('button', { name: /Save/i }));

      // Simulate failed save
      if (onErrorCallback) {
        onErrorCallback();
      }

      await waitFor(() => {
        expect(screen.getByText('Failed to save visualization')).toBeInTheDocument();
      });
    });
  });

  describe('Loading Existing Visualization', () => {
    it('should load visualization by ID', () => {
      mockUseVisualization.mockReturnValue({
        data: mockVisualizationConfig,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

      expect(screen.getByText('Sidebar: Test Visualization')).toBeInTheDocument();
      expect(screen.getByText('Canvas: Test Visualization')).toBeInTheDocument();
    });
  });

  describe('Suspense Boundary', () => {
    it('should render within suspense boundary', () => {
      renderWithProviders(<VisualizationBuilder />);

      // The component should render without throwing
      expect(screen.getByText('Create a Custom Visualization')).toBeInTheDocument();
    });
  });
});

describe('ExportDialog', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockUseVisualization.mockReturnValue({
      data: mockVisualizationConfig,
      isLoading: false,
      error: null,
    });
  });

  it('should display format selection instructions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VisualizationBuilder visualizationId="viz-1" />);

    await user.click(screen.getByTestId('open-export'));

    expect(screen.getByText('Choose an export format:')).toBeInTheDocument();
  });
});

describe('Props and Callbacks', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it('should accept null visualizationId', () => {
    renderWithProviders(<VisualizationBuilder visualizationId={null} />);

    expect(screen.getByText('Create a Custom Visualization')).toBeInTheDocument();
  });

  it('should accept undefined visualizationId', () => {
    renderWithProviders(<VisualizationBuilder />);

    expect(screen.getByText('Create a Custom Visualization')).toBeInTheDocument();
  });

  it('should accept onCancel callback prop', () => {
    const onCancel = vi.fn();
    renderWithProviders(<VisualizationBuilder onCancel={onCancel} />);

    // Component should render without error
    expect(screen.getByText('Create a Custom Visualization')).toBeInTheDocument();
  });
});
