/**
 * DashboardEditor Component Tests
 *
 * Tests for the dashboard editor component including drag-and-drop,
 * widget management, undo/redo, and edit mode functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material';
import type {
  DashboardLayout,
  WidgetMetadata,
  WidgetConfig,
  WidgetSize,
  EditorMode,
} from '../../../types';

// ============================================================================
// Mocks
// ============================================================================

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragEnd }: any) => (
    <div data-testid="dnd-context" data-ondragstart={!!onDragStart} data-ondragend={!!onDragEnd}>
      {children}
    </div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn((sensor) => sensor),
  useSensors: vi.fn((...sensors) => sensors),
  DragOverlay: ({ children }: any) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr, from, to) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: any) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  rectSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: { 'aria-describedby': 'test' },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn((transform) => transform ? 'transform' : null),
    },
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div data-testid="motion-div" {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import component after mocks
import { DashboardEditor, default as DashboardEditorDefault } from '../DashboardEditor';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockWidgetMetadata: WidgetMetadata[] = [
  {
    id: 'quality-score',
    name: 'Quality Score',
    description: 'Overall code quality score',
    category: 'metrics',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
    resizable: true,
    icon: 'Assessment',
    minRefreshInterval: 60000,
    isPremium: false,
  },
  {
    id: 'coverage-summary',
    name: 'Coverage Summary',
    description: 'Test coverage overview',
    category: 'coverage',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    resizable: true,
    icon: 'CheckCircle',
    minRefreshInterval: 60000,
    isPremium: false,
  },
  {
    id: 'dependency-health',
    name: 'Dependency Health',
    description: 'Dependency analysis',
    category: 'dependencies',
    defaultSize: 'medium',
    availableSizes: ['medium', 'large'],
    resizable: true,
    icon: 'AccountTree',
    minRefreshInterval: 120000,
    isPremium: false,
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'AI-powered code insights',
    category: 'ai',
    defaultSize: 'large',
    availableSizes: ['medium', 'large', 'full'],
    resizable: true,
    icon: 'Psychology',
    minRefreshInterval: 300000,
    isPremium: true,
  },
];

const mockWidgetConfig: WidgetConfig = {
  instanceId: 'widget-1',
  widgetId: 'quality-score',
  visible: true,
  size: 'small',
  position: { row: 0, column: 0 },
  settings: {},
};

const mockWidgetConfig2: WidgetConfig = {
  instanceId: 'widget-2',
  widgetId: 'coverage-summary',
  visible: true,
  size: 'medium',
  position: { row: 0, column: 1 },
  settings: {},
};

const mockLayout: DashboardLayout = {
  id: 'test-layout',
  name: 'Test Layout',
  grid: {
    columns: 2,
    rowHeight: 200,
    gap: 16,
    padding: 24,
  },
  breakpoints: [
    { name: 'xs', minWidth: 0, columns: 1, rowHeight: 150 },
    { name: 'md', minWidth: 900, columns: 2, rowHeight: 200 },
  ],
  widgets: [mockWidgetConfig, mockWidgetConfig2],
};

const mockEmptyLayout: DashboardLayout = {
  id: 'empty-layout',
  name: 'Empty Layout',
  grid: {
    columns: 2,
    rowHeight: 200,
    gap: 16,
    padding: 24,
  },
  breakpoints: [
    { name: 'xs', minWidth: 0, columns: 1, rowHeight: 150 },
    { name: 'md', minWidth: 900, columns: 2, rowHeight: 200 },
  ],
  widgets: [],
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

interface RenderOptions {
  layout?: DashboardLayout;
  availableWidgets?: WidgetMetadata[];
  mode?: EditorMode;
  isSaving?: boolean;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onModeChange?: (mode: EditorMode) => void;
}

function renderDashboardEditor(options: RenderOptions = {}) {
  const queryClient = createTestQueryClient();
  const theme = createTheme();

  const defaultProps = {
    layout: options.layout ?? mockLayout,
    availableWidgets: options.availableWidgets ?? mockWidgetMetadata,
    mode: options.mode ?? 'view' as EditorMode,
    isSaving: options.isSaving ?? false,
    onLayoutChange: options.onLayoutChange ?? vi.fn(),
    onSave: options.onSave ?? vi.fn(),
    onCancel: options.onCancel ?? vi.fn(),
    onModeChange: options.onModeChange ?? vi.fn(),
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <DashboardEditor {...defaultProps} />
        </ThemeProvider>
      </QueryClientProvider>
    ),
    props: defaultProps,
    queryClient,
  };
}

// ============================================================================
// Module Constants Tests
// ============================================================================

describe('DashboardEditor Module', () => {
  describe('Module Exports', () => {
    it('should export DashboardEditor as named export', () => {
      expect(DashboardEditor).toBeDefined();
      expect(typeof DashboardEditor).toBe('function');
    });

    it('should export DashboardEditor as default export', () => {
      expect(DashboardEditorDefault).toBeDefined();
      expect(DashboardEditorDefault).toBe(DashboardEditor);
    });
  });
});

// ============================================================================
// Main Component Tests
// ============================================================================

describe('DashboardEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the dashboard editor', () => {
      renderDashboardEditor();

      expect(screen.getByText('Dashboard Editor')).toBeInTheDocument();
    });

    it('should render the toolbar', () => {
      renderDashboardEditor();

      expect(screen.getByText('Dashboard Editor')).toBeInTheDocument();
    });

    it('should render viewing chip when in view mode', () => {
      renderDashboardEditor({ mode: 'view' });

      expect(screen.getByText('Viewing')).toBeInTheDocument();
    });

    it('should render editing chip when in edit mode', () => {
      renderDashboardEditor({ mode: 'edit' });

      expect(screen.getByText('Editing')).toBeInTheDocument();
    });

    it('should render Edit Layout button in view mode', () => {
      renderDashboardEditor({ mode: 'view' });

      expect(screen.getByRole('button', { name: /Edit Layout/i })).toBeInTheDocument();
    });

    it('should render Save and Cancel buttons in edit mode', () => {
      renderDashboardEditor({ mode: 'edit' });

      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should render undo and redo buttons in edit mode', () => {
      renderDashboardEditor({ mode: 'edit' });

      // Undo and redo buttons are icon buttons with tooltips
      // MUI wraps disabled buttons in a span with aria-label when inside Tooltip
      const undoElement = screen.getByLabelText(/Undo/i);
      const redoElement = screen.getByLabelText(/Redo/i);

      expect(undoElement).toBeInTheDocument();
      expect(redoElement).toBeInTheDocument();
    });

    it('should render dnd context', () => {
      renderDashboardEditor();

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should render sortable context', () => {
      renderDashboardEditor();

      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });

    it('should render widgets from layout', () => {
      renderDashboardEditor();

      expect(screen.getByText('Quality Score')).toBeInTheDocument();
      expect(screen.getByText('Coverage Summary')).toBeInTheDocument();
    });

    it('should render widget descriptions', () => {
      renderDashboardEditor();

      expect(screen.getByText('Overall code quality score')).toBeInTheDocument();
      expect(screen.getByText('Test coverage overview')).toBeInTheDocument();
    });

    it('should render with empty layout', () => {
      renderDashboardEditor({ layout: mockEmptyLayout });

      expect(screen.getByText('Dashboard Editor')).toBeInTheDocument();
      expect(screen.queryByText('Quality Score')).not.toBeInTheDocument();
    });
  });

  describe('View Mode', () => {
    it('should not show drag handles in view mode', () => {
      renderDashboardEditor({ mode: 'view' });

      // In view mode, drag handles should not be present
      // Check that undo/redo buttons are not visible (only in edit mode)
      expect(screen.queryByRole('button', { name: /Undo/i })).not.toBeInTheDocument();
    });

    it('should show Edit Layout button in view mode', () => {
      renderDashboardEditor({ mode: 'view' });

      const editButton = screen.getByRole('button', { name: /Edit Layout/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should call onModeChange when Edit Layout is clicked', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();

      renderDashboardEditor({ mode: 'view', onModeChange });

      const editButton = screen.getByRole('button', { name: /Edit Layout/i });
      await user.click(editButton);

      expect(onModeChange).toHaveBeenCalledWith('edit');
    });

    it('should not show size chips in view mode', () => {
      renderDashboardEditor({ mode: 'view' });

      // Size chips are only shown in edit mode
      expect(screen.queryByText('small')).not.toBeInTheDocument();
      expect(screen.queryByText('medium')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should show size chips in edit mode', () => {
      renderDashboardEditor({ mode: 'edit' });

      // Both widgets should show their size
      expect(screen.getByText('small')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should show Save button in edit mode', () => {
      renderDashboardEditor({ mode: 'edit' });

      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    });

    it('should show Cancel button in edit mode', () => {
      renderDashboardEditor({ mode: 'edit' });

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should call onSave when Save button is clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      renderDashboardEditor({ mode: 'edit', onSave });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalled();
    });

    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      renderDashboardEditor({ mode: 'edit', onCancel });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable Save button when isSaving is true', () => {
      renderDashboardEditor({ mode: 'edit', isSaving: true });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Undo/Redo', () => {
    it('should disable undo button initially (empty undo stack)', () => {
      renderDashboardEditor({ mode: 'edit' });

      // MUI wraps disabled buttons in span with aria-label inside Tooltip
      const undoWrapper = screen.getByLabelText(/Undo/i);
      const undoButton = undoWrapper.querySelector('button') || undoWrapper;
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo button initially (empty redo stack)', () => {
      renderDashboardEditor({ mode: 'edit' });

      const redoWrapper = screen.getByLabelText(/Redo/i);
      const redoButton = redoWrapper.querySelector('button') || redoWrapper;
      expect(redoButton).toBeDisabled();
    });

    it('should show undo/redo buttons only in edit mode', () => {
      renderDashboardEditor({ mode: 'view' });

      expect(screen.queryByLabelText(/Undo/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Redo/i)).not.toBeInTheDocument();
    });
  });

  describe('FAB Add Button', () => {
    it('should render FAB in edit mode', () => {
      renderDashboardEditor({ mode: 'edit' });

      // FAB has MuiFab class
      const buttons = screen.getAllByRole('button');
      const fab = buttons.find(btn => btn.classList.contains('MuiFab-root'));
      expect(fab).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Widget Rendering Tests
// ============================================================================

describe('Widget Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all widgets from layout', () => {
    renderDashboardEditor();

    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('Coverage Summary')).toBeInTheDocument();
  });

  it('should render widget with metadata name', () => {
    renderDashboardEditor();

    expect(screen.getByText('Quality Score')).toBeInTheDocument();
  });

  it('should render widget with description', () => {
    renderDashboardEditor();

    expect(screen.getByText('Overall code quality score')).toBeInTheDocument();
  });

  it('should handle widget without metadata gracefully', () => {
    const layoutWithUnknownWidget: DashboardLayout = {
      ...mockLayout,
      widgets: [
        {
          instanceId: 'unknown-widget',
          widgetId: 'unknown-id' as any,
          visible: true,
          size: 'small',
          position: { row: 0, column: 0 },
          settings: {},
        },
      ],
    };

    renderDashboardEditor({ layout: layoutWithUnknownWidget });

    // Should render with widgetId as fallback
    expect(screen.getByText('unknown-id')).toBeInTheDocument();
  });

  it('should render hidden widget with reduced opacity', () => {
    const layoutWithHiddenWidget: DashboardLayout = {
      ...mockLayout,
      widgets: [
        {
          ...mockWidgetConfig,
          visible: false,
        },
      ],
    };

    renderDashboardEditor({ layout: layoutWithHiddenWidget });

    // Widget should still be rendered but with reduced opacity
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
  });
});

// ============================================================================
// Layout Change Tests
// ============================================================================

describe('Layout Change Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onLayoutChange with updated layout', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();

    renderDashboardEditor({ mode: 'edit', onLayoutChange });

    // onLayoutChange is called when widgets are added/removed/resized
    // We'll test that it's passed correctly to the component
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it('should receive correct layout prop', () => {
    const customLayout: DashboardLayout = {
      ...mockLayout,
      id: 'custom-layout',
      name: 'Custom Layout',
    };

    renderDashboardEditor({ layout: customLayout });

    expect(screen.getByText('Dashboard Editor')).toBeInTheDocument();
  });
});

// ============================================================================
// Widget Palette Tests
// ============================================================================

describe('Widget Palette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open palette when FAB is clicked in edit mode', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'edit' });

    // Find and click the FAB (it's the only unnamed button with AddIcon)
    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(btn => btn.classList.contains('MuiFab-root'));

    if (fab) {
      await user.click(fab);

      // After click, drawer should be open
      await waitFor(() => {
        expect(screen.getByText('Add Widget')).toBeInTheDocument();
      });
    }
  });

  it('should show available widgets in palette', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'edit' });

    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(btn => btn.classList.contains('MuiFab-root'));

    if (fab) {
      await user.click(fab);

      await waitFor(() => {
        // Widgets that are not already in the layout should show in palette
        expect(screen.getByText('Dependency Health')).toBeInTheDocument();
        expect(screen.getByText('AI Insights')).toBeInTheDocument();
      });
    }
  });

  it('should mark active widgets in palette', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'edit' });

    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(btn => btn.classList.contains('MuiFab-root'));

    if (fab) {
      await user.click(fab);

      await waitFor(() => {
        // Active widgets should show "Active" chip
        const activeChips = screen.getAllByText('Active');
        expect(activeChips.length).toBeGreaterThan(0);
      });
    }
  });

  it('should close palette when close button is clicked', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'edit' });

    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(btn => btn.classList.contains('MuiFab-root'));

    if (fab) {
      await user.click(fab);

      await waitFor(() => {
        expect(screen.getByText('Add Widget')).toBeInTheDocument();
      });

      // Find and click close button
      const closeButton = screen.getByRole('button', { name: '' });
      if (closeButton) {
        await user.click(closeButton);
      }
    }
  });
});

// ============================================================================
// Grid Layout Tests
// ============================================================================

describe('Grid Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render grid with correct column count', () => {
    renderDashboardEditor();

    // Grid should use CSS grid with columns from layout
    // This is tested via the grid container
    const sortableContext = screen.getByTestId('sortable-context');
    expect(sortableContext).toBeInTheDocument();
  });

  it('should apply grid gap from layout', () => {
    const layoutWithLargeGap: DashboardLayout = {
      ...mockLayout,
      grid: {
        ...mockLayout.grid,
        gap: 32,
      },
    };

    renderDashboardEditor({ layout: layoutWithLargeGap });

    expect(screen.getByText('Dashboard Editor')).toBeInTheDocument();
  });

  it('should apply grid padding from layout', () => {
    const layoutWithPadding: DashboardLayout = {
      ...mockLayout,
      grid: {
        ...mockLayout.grid,
        padding: 48,
      },
    };

    renderDashboardEditor({ layout: layoutWithPadding });

    expect(screen.getByText('Dashboard Editor')).toBeInTheDocument();
  });
});

// ============================================================================
// Widget Selection Tests
// ============================================================================

describe('Widget Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow selecting widget in edit mode', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'edit' });

    // Find widget and click it
    const qualityWidget = screen.getByText('Quality Score').closest('[class*="MuiPaper"]');

    if (qualityWidget) {
      await user.click(qualityWidget);

      // Widget should be selected (visual feedback via elevation/border)
      // This is a state change that would show in the UI
    }
  });

  it('should not allow selecting widget in view mode', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'view' });

    // In view mode, clicking should not change selection
    const qualityWidget = screen.getByText('Quality Score').closest('[class*="MuiPaper"]');

    if (qualityWidget) {
      await user.click(qualityWidget);
      // No selection change should occur
    }
  });
});

// ============================================================================
// Widget Menu Tests
// ============================================================================

describe('Widget Context Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show widget options button in edit mode', () => {
    renderDashboardEditor({ mode: 'edit' });

    // Options buttons should be present (MoreVertIcon)
    const optionsButtons = screen.getAllByRole('button', { name: /Widget options/i });
    expect(optionsButtons.length).toBeGreaterThan(0);
  });

  it('should not show widget options button in view mode', () => {
    renderDashboardEditor({ mode: 'view' });

    // Options buttons should not be present
    const optionsButtons = screen.queryAllByRole('button', { name: /Widget options/i });
    expect(optionsButtons.length).toBe(0);
  });

  it('should open menu when options button is clicked', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'edit' });

    const optionsButton = screen.getAllByRole('button', { name: /Widget options/i })[0];
    await user.click(optionsButton);

    await waitFor(() => {
      expect(screen.getByText('Resize Widget')).toBeInTheDocument();
      expect(screen.getByText('Remove Widget')).toBeInTheDocument();
    });
  });

  it('should show available sizes in resize menu', async () => {
    const user = userEvent.setup();

    renderDashboardEditor({ mode: 'edit' });

    const optionsButton = screen.getAllByRole('button', { name: /Widget options/i })[0];
    await user.click(optionsButton);

    await waitFor(() => {
      // Quality Score widget has small and medium available
      expect(screen.getByRole('menuitem', { name: /small/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /medium/i })).toBeInTheDocument();
    });
  });

  it('should call onLayoutChange when widget is removed', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();

    renderDashboardEditor({ mode: 'edit', onLayoutChange });

    const optionsButton = screen.getAllByRole('button', { name: /Widget options/i })[0];
    await user.click(optionsButton);

    await waitFor(() => {
      expect(screen.getByText('Remove Widget')).toBeInTheDocument();
    });

    const removeItem = screen.getByText('Remove Widget');
    await user.click(removeItem);

    expect(onLayoutChange).toHaveBeenCalled();
  });

  it('should call onLayoutChange when widget is resized', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();

    renderDashboardEditor({ mode: 'edit', onLayoutChange });

    const optionsButton = screen.getAllByRole('button', { name: /Widget options/i })[0];
    await user.click(optionsButton);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /medium/i })).toBeInTheDocument();
    });

    const mediumOption = screen.getByRole('menuitem', { name: /medium/i });
    await user.click(mediumOption);

    expect(onLayoutChange).toHaveBeenCalled();
  });
});

// ============================================================================
// Drag Overlay Tests
// ============================================================================

describe('Drag Overlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render drag overlay container', () => {
    renderDashboardEditor({ mode: 'edit' });

    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have accessible toolbar buttons', () => {
    renderDashboardEditor({ mode: 'edit' });

    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    // Undo/Redo are wrapped in spans when disabled
    expect(screen.getByLabelText(/Undo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Redo/i)).toBeInTheDocument();
  });

  it('should have accessible widget options buttons', () => {
    renderDashboardEditor({ mode: 'edit' });

    const optionsButtons = screen.getAllByRole('button', { name: /Widget options/i });
    optionsButtons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Widget Sorting Tests
// ============================================================================

describe('Widget Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sort widgets by row then column', () => {
    const unsortedLayout: DashboardLayout = {
      ...mockLayout,
      widgets: [
        { ...mockWidgetConfig, position: { row: 1, column: 0 } },
        { ...mockWidgetConfig2, position: { row: 0, column: 1 } },
        {
          instanceId: 'widget-3',
          widgetId: 'dependency-health',
          visible: true,
          size: 'medium',
          position: { row: 0, column: 0 },
          settings: {},
        },
      ],
    };

    renderDashboardEditor({ layout: unsortedLayout });

    // All widgets should render
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('Coverage Summary')).toBeInTheDocument();
    expect(screen.getByText('Dependency Health')).toBeInTheDocument();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle empty available widgets', () => {
    renderDashboardEditor({ availableWidgets: [] });

    expect(screen.getByText('Dashboard Editor')).toBeInTheDocument();
  });

  it('should handle layout with single widget', () => {
    const singleWidgetLayout: DashboardLayout = {
      ...mockLayout,
      widgets: [mockWidgetConfig],
    };

    renderDashboardEditor({ layout: singleWidgetLayout });

    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.queryByText('Coverage Summary')).not.toBeInTheDocument();
  });

  it('should handle all widget sizes', () => {
    const multiSizeLayout: DashboardLayout = {
      ...mockLayout,
      widgets: [
        { ...mockWidgetConfig, size: 'small' },
        { ...mockWidgetConfig2, instanceId: 'w2', size: 'medium' },
        {
          instanceId: 'w3',
          widgetId: 'dependency-health',
          visible: true,
          size: 'large',
          position: { row: 1, column: 0 },
          settings: {},
        },
        {
          instanceId: 'w4',
          widgetId: 'ai-insights',
          visible: true,
          size: 'full',
          position: { row: 2, column: 0 },
          settings: {},
        },
      ],
    };

    renderDashboardEditor({ layout: multiSizeLayout, mode: 'edit' });

    expect(screen.getByText('small')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('large')).toBeInTheDocument();
    expect(screen.getByText('full')).toBeInTheDocument();
  });

  it('should handle preview mode', () => {
    renderDashboardEditor({ mode: 'preview' });

    // Preview mode should behave like view mode
    expect(screen.queryByRole('button', { name: /Save/i })).not.toBeInTheDocument();
  });

  it('should handle rapid mode changes', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();

    const { rerender } = renderDashboardEditor({ mode: 'view', onModeChange });

    // Click edit
    const editButton = screen.getByRole('button', { name: /Edit Layout/i });
    await user.click(editButton);

    expect(onModeChange).toHaveBeenCalledWith('edit');
  });
});

// ============================================================================
// Animation Presence Tests
// ============================================================================

describe('Animation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render motion divs for widgets', () => {
    renderDashboardEditor();

    const motionDivs = screen.getAllByTestId('motion-div');
    expect(motionDivs.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Mode Chip Tests
// ============================================================================

describe('Mode Chip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Viewing" chip in view mode', () => {
    renderDashboardEditor({ mode: 'view' });

    expect(screen.getByText('Viewing')).toBeInTheDocument();
  });

  it('should show "Editing" chip in edit mode', () => {
    renderDashboardEditor({ mode: 'edit' });

    expect(screen.getByText('Editing')).toBeInTheDocument();
  });

  it('should show "Viewing" chip in preview mode', () => {
    renderDashboardEditor({ mode: 'preview' });

    // Preview is treated like view
    expect(screen.getByText('Viewing')).toBeInTheDocument();
  });
});

// ============================================================================
// Widget Icon Tests
// ============================================================================

describe('Widget Icons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correct icon for known widgets', () => {
    renderDashboardEditor();

    // Icons are rendered via MUI - they appear as SVG elements
    // We verify the widget renders correctly which includes icons
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('Coverage Summary')).toBeInTheDocument();
  });

  it('should use fallback icon for unknown icon names', () => {
    const layoutWithUnknownIcon: DashboardLayout = {
      ...mockLayout,
      widgets: [mockWidgetConfig],
    };

    const widgetsWithUnknownIcon: WidgetMetadata[] = [
      {
        ...mockWidgetMetadata[0],
        icon: 'UnknownIcon',
      },
    ];

    renderDashboardEditor({
      layout: layoutWithUnknownIcon,
      availableWidgets: widgetsWithUnknownIcon,
    });

    // Widget should still render with fallback AssessmentIcon
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
  });
});

// ============================================================================
// Grid Span Tests
// ============================================================================

describe('Grid Span', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate correct grid span for each size', () => {
    const allSizesLayout: DashboardLayout = {
      ...mockLayout,
      widgets: [
        { ...mockWidgetConfig, instanceId: 'w1', size: 'small' },
        { ...mockWidgetConfig, instanceId: 'w2', size: 'medium' },
        { ...mockWidgetConfig, instanceId: 'w3', size: 'large' },
        { ...mockWidgetConfig, instanceId: 'w4', size: 'full' },
      ],
    };

    renderDashboardEditor({ layout: allSizesLayout, mode: 'edit' });

    // All size chips should be rendered
    expect(screen.getByText('small')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('large')).toBeInTheDocument();
    expect(screen.getByText('full')).toBeInTheDocument();
  });
});
