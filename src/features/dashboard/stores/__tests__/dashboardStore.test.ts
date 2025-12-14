/**
 * Dashboard Store Tests
 *
 * Tests for dashboard store selectors and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { DashboardStoreState, WidgetConfig, WidgetSize } from '../../types';
import {
  selectVisibleWidgets,
  selectWidgetById,
  selectHasUnsavedChanges,
  selectCanUndo,
  selectCanRedo,
  selectFilteredPanelWidgets,
  selectActiveWidgetIds,
} from '../dashboardStore';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockWidget = (
  overrides: Partial<WidgetConfig> = {}
): WidgetConfig => ({
  instanceId: `widget-${Date.now()}-${Math.random()}`,
  widgetId: 'quality-overview',
  visible: true,
  size: 'medium' as WidgetSize,
  position: { row: 0, column: 0 },
  settings: {},
  ...overrides,
});

const createMockState = (
  overrides: Partial<DashboardStoreState> = {}
): DashboardStoreState => ({
  layout: {
    id: 'test-layout',
    widgets: [],
    grid: {
      columns: 12,
      rowHeight: 100,
      gap: 16,
    },
    breakpoints: {
      lg: 1200,
      md: 996,
      sm: 768,
      xs: 480,
    },
  },
  preferences: {
    userId: 'test-user',
    defaultViewId: null,
    theme: 'system',
    refresh: {
      enabled: true,
      intervalMs: 300000,
      pauseWhenHidden: true,
    },
    sidebarCollapsed: false,
    showWelcomeBanner: true,
    compactMode: false,
    animations: {
      enabled: true,
      reducedMotion: false,
    },
    updatedAt: new Date().toISOString(),
  },
  savedViews: [],
  activeViewId: null,
  editor: {
    mode: 'view',
    selectedWidgetId: null,
    hoveredWidgetId: null,
    isDragging: false,
    hasUnsavedChanges: false,
    undoStack: [],
    redoStack: [],
  },
  widgetPanel: {
    isOpen: false,
    selectedCategory: 'all',
    searchQuery: '',
  },
  notificationSettings: {
    enabled: true,
    soundEnabled: false,
    desktopNotifications: true,
    widgetSettings: [],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
    },
    digestMode: 'immediate',
  },
  isLoading: false,
  error: null,
  ...overrides,
});

// ============================================================================
// selectVisibleWidgets Tests
// ============================================================================

describe('selectVisibleWidgets', () => {
  describe('filtering', () => {
    it('should return empty array when no widgets exist', () => {
      const state = createMockState();

      const result = selectVisibleWidgets(state);

      expect(result).toEqual([]);
    });

    it('should return only visible widgets', () => {
      const visibleWidget = createMockWidget({
        instanceId: 'visible-1',
        visible: true,
      });
      const hiddenWidget = createMockWidget({
        instanceId: 'hidden-1',
        visible: false,
      });
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets: [visibleWidget, hiddenWidget],
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result).toHaveLength(1);
      expect(result[0].instanceId).toBe('visible-1');
    });

    it('should return all widgets when all are visible', () => {
      const widgets = [
        createMockWidget({ instanceId: 'w1', visible: true }),
        createMockWidget({ instanceId: 'w2', visible: true }),
        createMockWidget({ instanceId: 'w3', visible: true }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result).toHaveLength(3);
    });

    it('should return empty array when all widgets are hidden', () => {
      const widgets = [
        createMockWidget({ instanceId: 'w1', visible: false }),
        createMockWidget({ instanceId: 'w2', visible: false }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result).toHaveLength(0);
    });

    it('should filter mix of visible and hidden widgets', () => {
      const widgets = [
        createMockWidget({ instanceId: 'visible-1', visible: true }),
        createMockWidget({ instanceId: 'hidden-1', visible: false }),
        createMockWidget({ instanceId: 'visible-2', visible: true }),
        createMockWidget({ instanceId: 'hidden-2', visible: false }),
        createMockWidget({ instanceId: 'visible-3', visible: true }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result).toHaveLength(3);
      expect(result.map((w) => w.instanceId)).toEqual([
        'visible-1',
        'visible-2',
        'visible-3',
      ]);
    });
  });

  describe('sorting by position', () => {
    it('should sort widgets by row first', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'row-2',
          visible: true,
          position: { row: 2, column: 0 },
        }),
        createMockWidget({
          instanceId: 'row-0',
          visible: true,
          position: { row: 0, column: 0 },
        }),
        createMockWidget({
          instanceId: 'row-1',
          visible: true,
          position: { row: 1, column: 0 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result.map((w) => w.instanceId)).toEqual([
        'row-0',
        'row-1',
        'row-2',
      ]);
    });

    it('should sort by column when rows are equal', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'col-2',
          visible: true,
          position: { row: 0, column: 2 },
        }),
        createMockWidget({
          instanceId: 'col-0',
          visible: true,
          position: { row: 0, column: 0 },
        }),
        createMockWidget({
          instanceId: 'col-1',
          visible: true,
          position: { row: 0, column: 1 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result.map((w) => w.instanceId)).toEqual([
        'col-0',
        'col-1',
        'col-2',
      ]);
    });

    it('should sort by row first, then column', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'r1-c1',
          visible: true,
          position: { row: 1, column: 1 },
        }),
        createMockWidget({
          instanceId: 'r0-c2',
          visible: true,
          position: { row: 0, column: 2 },
        }),
        createMockWidget({
          instanceId: 'r1-c0',
          visible: true,
          position: { row: 1, column: 0 },
        }),
        createMockWidget({
          instanceId: 'r0-c0',
          visible: true,
          position: { row: 0, column: 0 },
        }),
        createMockWidget({
          instanceId: 'r2-c0',
          visible: true,
          position: { row: 2, column: 0 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result.map((w) => w.instanceId)).toEqual([
        'r0-c0',
        'r0-c2',
        'r1-c0',
        'r1-c1',
        'r2-c0',
      ]);
    });

    it('should handle widgets with same position', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'same-pos-1',
          visible: true,
          position: { row: 0, column: 0 },
        }),
        createMockWidget({
          instanceId: 'same-pos-2',
          visible: true,
          position: { row: 0, column: 0 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      // Both should be present, order depends on stable sort
      expect(result).toHaveLength(2);
      expect(result.map((w) => w.instanceId)).toContain('same-pos-1');
      expect(result.map((w) => w.instanceId)).toContain('same-pos-2');
    });

    it('should handle negative row/column values', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'positive',
          visible: true,
          position: { row: 1, column: 1 },
        }),
        createMockWidget({
          instanceId: 'negative-row',
          visible: true,
          position: { row: -1, column: 0 },
        }),
        createMockWidget({
          instanceId: 'zero',
          visible: true,
          position: { row: 0, column: 0 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result.map((w) => w.instanceId)).toEqual([
        'negative-row',
        'zero',
        'positive',
      ]);
    });

    it('should handle large row/column values', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'large',
          visible: true,
          position: { row: 1000, column: 500 },
        }),
        createMockWidget({
          instanceId: 'small',
          visible: true,
          position: { row: 0, column: 0 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result.map((w) => w.instanceId)).toEqual(['small', 'large']);
    });
  });

  describe('combined filtering and sorting', () => {
    it('should filter then sort visible widgets', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'hidden-r0',
          visible: false,
          position: { row: 0, column: 0 },
        }),
        createMockWidget({
          instanceId: 'visible-r2',
          visible: true,
          position: { row: 2, column: 0 },
        }),
        createMockWidget({
          instanceId: 'visible-r1',
          visible: true,
          position: { row: 1, column: 0 },
        }),
        createMockWidget({
          instanceId: 'hidden-r1',
          visible: false,
          position: { row: 1, column: 1 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result).toHaveLength(2);
      expect(result.map((w) => w.instanceId)).toEqual([
        'visible-r1',
        'visible-r2',
      ]);
    });

    it('should not mutate original widgets array', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'w2',
          visible: true,
          position: { row: 1, column: 0 },
        }),
        createMockWidget({
          instanceId: 'w1',
          visible: true,
          position: { row: 0, column: 0 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const originalOrder = [...state.layout.widgets.map((w) => w.instanceId)];
      selectVisibleWidgets(state);

      // Original array should not be mutated
      expect(state.layout.widgets.map((w) => w.instanceId)).toEqual(
        originalOrder
      );
    });
  });

  describe('edge cases', () => {
    it('should handle single widget', () => {
      const widgets = [
        createMockWidget({
          instanceId: 'single',
          visible: true,
          position: { row: 5, column: 3 },
        }),
      ];
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets,
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result).toHaveLength(1);
      expect(result[0].instanceId).toBe('single');
    });

    it('should preserve widget properties after filtering and sorting', () => {
      const widget = createMockWidget({
        instanceId: 'full-widget',
        widgetId: 'quality-overview',
        visible: true,
        size: 'large',
        position: { row: 1, column: 2 },
        settings: { theme: 'dark', refreshRate: 5000 },
      });
      const state = createMockState({
        layout: {
          ...createMockState().layout,
          widgets: [widget],
        },
      });

      const result = selectVisibleWidgets(state);

      expect(result[0]).toEqual(widget);
      expect(result[0].settings).toEqual({ theme: 'dark', refreshRate: 5000 });
    });
  });
});

// ============================================================================
// selectWidgetById Tests
// ============================================================================

describe('selectWidgetById', () => {
  it('should return undefined when no widgets exist', () => {
    const state = createMockState();

    const result = selectWidgetById('non-existent')(state);

    expect(result).toBeUndefined();
  });

  it('should return undefined when widget is not found', () => {
    const widgets = [createMockWidget({ instanceId: 'existing' })];
    const state = createMockState({
      layout: {
        ...createMockState().layout,
        widgets,
      },
    });

    const result = selectWidgetById('non-existent')(state);

    expect(result).toBeUndefined();
  });

  it('should return widget when found', () => {
    const targetWidget = createMockWidget({
      instanceId: 'target',
      widgetId: 'coverage-report',
    });
    const widgets = [
      createMockWidget({ instanceId: 'other-1' }),
      targetWidget,
      createMockWidget({ instanceId: 'other-2' }),
    ];
    const state = createMockState({
      layout: {
        ...createMockState().layout,
        widgets,
      },
    });

    const result = selectWidgetById('target')(state);

    expect(result).toEqual(targetWidget);
  });

  it('should return first match when multiple widgets have same ID', () => {
    const firstWidget = createMockWidget({
      instanceId: 'duplicate',
      widgetId: 'quality-overview',
    });
    const secondWidget = createMockWidget({
      instanceId: 'duplicate',
      widgetId: 'coverage-report',
    });
    const state = createMockState({
      layout: {
        ...createMockState().layout,
        widgets: [firstWidget, secondWidget],
      },
    });

    const result = selectWidgetById('duplicate')(state);

    expect(result?.widgetId).toBe('quality-overview');
  });

  it('should handle empty string instanceId', () => {
    const widgets = [createMockWidget({ instanceId: '' })];
    const state = createMockState({
      layout: {
        ...createMockState().layout,
        widgets,
      },
    });

    const result = selectWidgetById('')(state);

    expect(result).toBeDefined();
    expect(result?.instanceId).toBe('');
  });
});

// ============================================================================
// selectHasUnsavedChanges Tests
// ============================================================================

describe('selectHasUnsavedChanges', () => {
  it('should return false when no unsaved changes', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        hasUnsavedChanges: false,
      },
    });

    const result = selectHasUnsavedChanges(state);

    expect(result).toBe(false);
  });

  it('should return true when has unsaved changes', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        hasUnsavedChanges: true,
      },
    });

    const result = selectHasUnsavedChanges(state);

    expect(result).toBe(true);
  });
});

// ============================================================================
// selectCanUndo Tests
// ============================================================================

describe('selectCanUndo', () => {
  it('should return false when undo stack is empty', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        undoStack: [],
      },
    });

    const result = selectCanUndo(state);

    expect(result).toBe(false);
  });

  it('should return true when undo stack has items', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        undoStack: [createMockState().layout],
      },
    });

    const result = selectCanUndo(state);

    expect(result).toBe(true);
  });

  it('should return true when undo stack has multiple items', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        undoStack: [
          createMockState().layout,
          createMockState().layout,
          createMockState().layout,
        ],
      },
    });

    const result = selectCanUndo(state);

    expect(result).toBe(true);
  });
});

// ============================================================================
// selectCanRedo Tests
// ============================================================================

describe('selectCanRedo', () => {
  it('should return false when redo stack is empty', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        redoStack: [],
      },
    });

    const result = selectCanRedo(state);

    expect(result).toBe(false);
  });

  it('should return true when redo stack has items', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        redoStack: [createMockState().layout],
      },
    });

    const result = selectCanRedo(state);

    expect(result).toBe(true);
  });

  it('should return true when redo stack has multiple items', () => {
    const state = createMockState({
      editor: {
        ...createMockState().editor,
        redoStack: [
          createMockState().layout,
          createMockState().layout,
        ],
      },
    });

    const result = selectCanRedo(state);

    expect(result).toBe(true);
  });
});

// ============================================================================
// selectActiveWidgetIds Tests
// ============================================================================

describe('selectActiveWidgetIds', () => {
  it('should return empty set when no widgets', () => {
    const state = createMockState();

    const result = selectActiveWidgetIds(state);

    expect(result.size).toBe(0);
  });

  it('should return set of widget IDs', () => {
    const widgets = [
      createMockWidget({ widgetId: 'quality-overview' }),
      createMockWidget({ widgetId: 'coverage-report' }),
      createMockWidget({ widgetId: 'risk-analysis' }),
    ];
    const state = createMockState({
      layout: {
        ...createMockState().layout,
        widgets,
      },
    });

    const result = selectActiveWidgetIds(state);

    expect(result.size).toBe(3);
    expect(result.has('quality-overview')).toBe(true);
    expect(result.has('coverage-report')).toBe(true);
    expect(result.has('risk-analysis')).toBe(true);
  });

  it('should deduplicate widget IDs when same widget type appears multiple times', () => {
    const widgets = [
      createMockWidget({ instanceId: 'inst-1', widgetId: 'quality-overview' }),
      createMockWidget({ instanceId: 'inst-2', widgetId: 'quality-overview' }),
      createMockWidget({ instanceId: 'inst-3', widgetId: 'coverage-report' }),
    ];
    const state = createMockState({
      layout: {
        ...createMockState().layout,
        widgets,
      },
    });

    const result = selectActiveWidgetIds(state);

    // Set should deduplicate
    expect(result.size).toBe(2);
    expect(result.has('quality-overview')).toBe(true);
    expect(result.has('coverage-report')).toBe(true);
  });

  it('should include hidden widgets', () => {
    const widgets = [
      createMockWidget({ widgetId: 'quality-overview', visible: true }),
      createMockWidget({ widgetId: 'coverage-report', visible: false }),
    ];
    const state = createMockState({
      layout: {
        ...createMockState().layout,
        widgets,
      },
    });

    const result = selectActiveWidgetIds(state);

    expect(result.size).toBe(2);
    expect(result.has('quality-overview')).toBe(true);
    expect(result.has('coverage-report')).toBe(true);
  });
});

// ============================================================================
// selectFilteredPanelWidgets Tests
// ============================================================================

describe('selectFilteredPanelWidgets', () => {
  it('should return all widgets when category is "all" and no search query', () => {
    const state = createMockState({
      widgetPanel: {
        isOpen: true,
        selectedCategory: 'all',
        searchQuery: '',
      },
    });

    const result = selectFilteredPanelWidgets(state);

    // Should return all WIDGET_METADATA
    expect(result.length).toBeGreaterThan(0);
  });

  it('should filter by category', () => {
    const state = createMockState({
      widgetPanel: {
        isOpen: true,
        selectedCategory: 'analytics',
        searchQuery: '',
      },
    });

    const result = selectFilteredPanelWidgets(state);

    // All results should be in the analytics category
    result.forEach((widget) => {
      expect(widget.category).toBe('analytics');
    });
  });

  it('should filter by search query (name)', () => {
    const state = createMockState({
      widgetPanel: {
        isOpen: true,
        selectedCategory: 'all',
        searchQuery: 'quality',
      },
    });

    const result = selectFilteredPanelWidgets(state);

    // All results should have "quality" in name or description
    result.forEach((widget) => {
      const matchesName = widget.name.toLowerCase().includes('quality');
      const matchesDescription = widget.description
        .toLowerCase()
        .includes('quality');
      expect(matchesName || matchesDescription).toBe(true);
    });
  });

  it('should filter by search query case-insensitively', () => {
    const state = createMockState({
      widgetPanel: {
        isOpen: true,
        selectedCategory: 'all',
        searchQuery: 'QUALITY',
      },
    });

    const result = selectFilteredPanelWidgets(state);

    // Should still find quality widgets despite uppercase search
    if (result.length > 0) {
      const hasQualityMatch = result.some(
        (w) =>
          w.name.toLowerCase().includes('quality') ||
          w.description.toLowerCase().includes('quality')
      );
      expect(hasQualityMatch).toBe(true);
    }
  });

  it('should combine category and search filters', () => {
    const state = createMockState({
      widgetPanel: {
        isOpen: true,
        selectedCategory: 'analytics',
        searchQuery: 'chart',
      },
    });

    const result = selectFilteredPanelWidgets(state);

    // All results should be in analytics category AND match search
    result.forEach((widget) => {
      expect(widget.category).toBe('analytics');
      const matchesSearch =
        widget.name.toLowerCase().includes('chart') ||
        widget.description.toLowerCase().includes('chart');
      expect(matchesSearch).toBe(true);
    });
  });

  it('should return empty array when no matches', () => {
    const state = createMockState({
      widgetPanel: {
        isOpen: true,
        selectedCategory: 'all',
        searchQuery: 'xyznonexistentwidget123',
      },
    });

    const result = selectFilteredPanelWidgets(state);

    expect(result).toEqual([]);
  });
});
