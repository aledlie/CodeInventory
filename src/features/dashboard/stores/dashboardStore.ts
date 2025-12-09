/**
 * Dashboard Store
 *
 * Phase 5B: Dashboard Personalization
 * Zustand store for dashboard state management including layout, widgets, and editor state
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  DashboardStoreState,
  DashboardStoreActions,
  DashboardLayout,
  DashboardPreferences,
  DashboardNotificationSettings,
  WidgetConfig,
  WidgetId,
  WidgetSize,
  WidgetCategory,
  EditorMode,
} from '../types';
import { personalizationApi, WIDGET_METADATA } from '../api/personalizationApi';

// ============================================================================
// Initial State
// ============================================================================

const initialEditorState = {
  mode: 'view' as EditorMode,
  selectedWidgetId: null,
  hoveredWidgetId: null,
  isDragging: false,
  hasUnsavedChanges: false,
  undoStack: [] as DashboardLayout[],
  redoStack: [] as DashboardLayout[],
};

const initialWidgetPanelState = {
  isOpen: false,
  selectedCategory: 'all' as WidgetCategory | 'all',
  searchQuery: '',
};

const initialState: DashboardStoreState = {
  layout: personalizationApi.getDefaultLayout(),
  preferences: {
    userId: 'current-user',
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
  editor: initialEditorState,
  widgetPanel: initialWidgetPanelState,
  notificationSettings: {
    enabled: true,
    soundEnabled: false,
    desktopNotifications: true,
    widgetSettings: WIDGET_METADATA.map((widget) => ({
      widgetId: widget.id,
      enabled: true,
      maxPerHour: 5,
    })),
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    digestMode: 'immediate',
  },
  isLoading: true,
  error: null,
};

// ============================================================================
// Store Creation
// ============================================================================

export const useDashboardStore = create<DashboardStoreState & DashboardStoreActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ====================================================================
        // Layout Actions
        // ====================================================================

        setLayout: (layout: DashboardLayout) => {
          set((state) => {
            // Save current layout to undo stack
            if (state.editor.mode === 'edit') {
              state.editor.undoStack.push(JSON.parse(JSON.stringify(state.layout)));
              state.editor.redoStack = [];
              state.editor.hasUnsavedChanges = true;
            }
            state.layout = layout;
          });
        },

        updateWidget: (instanceId: string, updates: Partial<WidgetConfig>) => {
          set((state) => {
            const widgetIndex = state.layout.widgets.findIndex(
              (w) => w.instanceId === instanceId
            );
            if (widgetIndex !== -1) {
              // Save to undo stack if in edit mode
              if (state.editor.mode === 'edit') {
                state.editor.undoStack.push(JSON.parse(JSON.stringify(state.layout)));
                state.editor.redoStack = [];
                state.editor.hasUnsavedChanges = true;
              }
              Object.assign(state.layout.widgets[widgetIndex], updates);
            }
          });
        },

        addWidget: (widgetId: WidgetId) => {
          set((state) => {
            const metadata = WIDGET_METADATA.find((w) => w.id === widgetId);
            if (!metadata) return;

            // Find next available position
            const position = findNextAvailablePosition(state.layout);

            const newWidget: WidgetConfig = {
              instanceId: `${widgetId}-${Date.now()}`,
              widgetId,
              visible: true,
              size: metadata.defaultSize,
              position,
              settings: {},
            };

            // Save to undo stack if in edit mode
            if (state.editor.mode === 'edit') {
              state.editor.undoStack.push(JSON.parse(JSON.stringify(state.layout)));
              state.editor.redoStack = [];
              state.editor.hasUnsavedChanges = true;
            }

            state.layout.widgets.push(newWidget);
          });
        },

        removeWidget: (instanceId: string) => {
          set((state) => {
            const widgetIndex = state.layout.widgets.findIndex(
              (w) => w.instanceId === instanceId
            );
            if (widgetIndex !== -1) {
              // Save to undo stack if in edit mode
              if (state.editor.mode === 'edit') {
                state.editor.undoStack.push(JSON.parse(JSON.stringify(state.layout)));
                state.editor.redoStack = [];
                state.editor.hasUnsavedChanges = true;
              }
              state.layout.widgets.splice(widgetIndex, 1);
            }
          });
        },

        moveWidget: (instanceId: string, newPosition: { row: number; column: number }) => {
          set((state) => {
            const widgetIndex = state.layout.widgets.findIndex(
              (w) => w.instanceId === instanceId
            );
            if (widgetIndex !== -1) {
              // Save to undo stack if in edit mode
              if (state.editor.mode === 'edit') {
                state.editor.undoStack.push(JSON.parse(JSON.stringify(state.layout)));
                state.editor.redoStack = [];
                state.editor.hasUnsavedChanges = true;
              }
              state.layout.widgets[widgetIndex].position = newPosition;
            }
          });
        },

        resizeWidget: (instanceId: string, newSize: WidgetSize) => {
          set((state) => {
            const widgetIndex = state.layout.widgets.findIndex(
              (w) => w.instanceId === instanceId
            );
            if (widgetIndex !== -1) {
              const widget = state.layout.widgets[widgetIndex];
              const metadata = WIDGET_METADATA.find((w) => w.id === widget.widgetId);

              // Check if size is allowed
              if (metadata && metadata.availableSizes.includes(newSize)) {
                // Save to undo stack if in edit mode
                if (state.editor.mode === 'edit') {
                  state.editor.undoStack.push(JSON.parse(JSON.stringify(state.layout)));
                  state.editor.redoStack = [];
                  state.editor.hasUnsavedChanges = true;
                }
                state.layout.widgets[widgetIndex].size = newSize;
              }
            }
          });
        },

        // ====================================================================
        // View Actions
        // ====================================================================

        loadView: (viewId: string) => {
          set((state) => {
            const view = state.savedViews.find((v) => v.id === viewId);
            if (view) {
              state.layout = JSON.parse(JSON.stringify(view.layout));
              state.activeViewId = viewId;
              state.editor.hasUnsavedChanges = false;
              state.editor.undoStack = [];
              state.editor.redoStack = [];
            }
          });
        },

        saveCurrentView: async (name?: string, description?: string) => {
          const state = get();

          if (state.activeViewId) {
            // Update existing view
            const updatedView = await personalizationApi.updateSavedView(
              state.activeViewId,
              {
                layout: state.layout,
                name: name || undefined,
                description: description || undefined,
              }
            );

            set((s) => {
              const viewIndex = s.savedViews.findIndex((v) => v.id === state.activeViewId);
              if (viewIndex !== -1) {
                s.savedViews[viewIndex] = updatedView;
              }
              s.editor.hasUnsavedChanges = false;
            });
          } else {
            // Create new view
            const newView = await personalizationApi.createSavedView({
              name: name || 'New View',
              description,
              layout: state.layout,
              isDefault: false,
              isShared: false,
              createdBy: state.preferences.userId,
            });

            set((s) => {
              s.savedViews.push(newView);
              s.activeViewId = newView.id;
              s.editor.hasUnsavedChanges = false;
            });
          }
        },

        deleteView: async (viewId: string) => {
          await personalizationApi.deleteSavedView(viewId);

          set((state) => {
            state.savedViews = state.savedViews.filter((v) => v.id !== viewId);
            if (state.activeViewId === viewId) {
              // Switch to default or first view
              const defaultView = state.savedViews.find((v) => v.isDefault);
              state.activeViewId = defaultView?.id || state.savedViews[0]?.id || null;
              if (state.activeViewId) {
                const view = state.savedViews.find((v) => v.id === state.activeViewId);
                if (view) {
                  state.layout = JSON.parse(JSON.stringify(view.layout));
                }
              }
            }
          });
        },

        setDefaultView: (viewId: string) => {
          set((state) => {
            state.savedViews.forEach((v) => {
              v.isDefault = v.id === viewId;
            });
            state.preferences.defaultViewId = viewId;
          });
        },

        // ====================================================================
        // Preferences Actions
        // ====================================================================

        updatePreferences: (updates: Partial<DashboardPreferences>) => {
          set((state) => {
            Object.assign(state.preferences, updates);
            state.preferences.updatedAt = new Date().toISOString();
          });

          // Persist to API
          personalizationApi.updatePreferences(updates);
        },

        updateNotificationSettings: (updates: Partial<DashboardNotificationSettings>) => {
          set((state) => {
            Object.assign(state.notificationSettings, updates);
          });

          // Persist to API
          personalizationApi.updateNotificationSettings(updates);
        },

        // ====================================================================
        // Editor Actions
        // ====================================================================

        setEditorMode: (mode: EditorMode) => {
          set((state) => {
            if (mode === 'view' && state.editor.hasUnsavedChanges) {
              // Discard changes - restore from active view
              const view = state.savedViews.find((v) => v.id === state.activeViewId);
              if (view) {
                state.layout = JSON.parse(JSON.stringify(view.layout));
              }
              state.editor.hasUnsavedChanges = false;
              state.editor.undoStack = [];
              state.editor.redoStack = [];
            }
            state.editor.mode = mode;
            state.editor.selectedWidgetId = null;
          });
        },

        selectWidget: (instanceId: string | null) => {
          set((state) => {
            state.editor.selectedWidgetId = instanceId;
          });
        },

        undo: () => {
          set((state) => {
            if (state.editor.undoStack.length > 0) {
              // Save current to redo stack
              state.editor.redoStack.push(JSON.parse(JSON.stringify(state.layout)));
              // Restore from undo stack
              const previousLayout = state.editor.undoStack.pop();
              if (previousLayout) {
                state.layout = previousLayout;
              }
              state.editor.hasUnsavedChanges = state.editor.undoStack.length > 0;
            }
          });
        },

        redo: () => {
          set((state) => {
            if (state.editor.redoStack.length > 0) {
              // Save current to undo stack
              state.editor.undoStack.push(JSON.parse(JSON.stringify(state.layout)));
              // Restore from redo stack
              const nextLayout = state.editor.redoStack.pop();
              if (nextLayout) {
                state.layout = nextLayout;
              }
              state.editor.hasUnsavedChanges = true;
            }
          });
        },

        // ====================================================================
        // Widget Panel Actions
        // ====================================================================

        toggleWidgetPanel: () => {
          set((state) => {
            state.widgetPanel.isOpen = !state.widgetPanel.isOpen;
          });
        },

        setWidgetPanelCategory: (category: WidgetCategory | 'all') => {
          set((state) => {
            state.widgetPanel.selectedCategory = category;
          });
        },

        setWidgetPanelSearch: (query: string) => {
          set((state) => {
            state.widgetPanel.searchQuery = query;
          });
        },

        // ====================================================================
        // Initialization
        // ====================================================================

        initialize: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Load saved views
            const { views, defaultViewId } = await personalizationApi.fetchSavedViews();

            // Load preferences
            const { preferences, notificationSettings } =
              await personalizationApi.fetchPreferences();

            // Get active view ID
            const activeViewId =
              (await personalizationApi.getActiveViewId()) || defaultViewId;

            // Get initial layout from active view
            const activeView = views.find((v) => v.id === activeViewId);
            const layout = activeView?.layout || personalizationApi.getDefaultLayout();

            set((state) => {
              state.savedViews = views;
              state.activeViewId = activeViewId;
              state.layout = layout;
              state.preferences = preferences;
              state.notificationSettings = notificationSettings;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error =
                error instanceof Error ? error.message : 'Failed to initialize dashboard';
              state.isLoading = false;
            });
          }
        },

        reset: () => {
          set(() => ({
            ...initialState,
            isLoading: false,
          }));
        },
      })),
      {
        name: 'dashboard-store',
        partialize: (state) => ({
          // Only persist these fields
          activeViewId: state.activeViewId,
          preferences: state.preferences,
          widgetPanel: {
            selectedCategory: state.widgetPanel.selectedCategory,
          },
        }),
      }
    ),
    { name: 'DashboardStore' }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

function findNextAvailablePosition(layout: DashboardLayout): { row: number; column: number } {
  const occupied = new Set(
    layout.widgets.map((w) => `${w.position.row}-${w.position.column}`)
  );

  const columns = layout.grid.columns;
  let row = 0;
  let column = 0;

  while (occupied.has(`${row}-${column}`)) {
    column++;
    if (column >= columns) {
      column = 0;
      row++;
    }
  }

  return { row, column };
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select visible widgets sorted by position
 */
export const selectVisibleWidgets = (state: DashboardStoreState) =>
  state.layout.widgets
    .filter((w) => w.visible)
    .sort((a, b) => {
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      return a.position.column - b.position.column;
    });

/**
 * Select widget by instance ID
 */
export const selectWidgetById = (instanceId: string) => (state: DashboardStoreState) =>
  state.layout.widgets.find((w) => w.instanceId === instanceId);

/**
 * Select editor has unsaved changes
 */
export const selectHasUnsavedChanges = (state: DashboardStoreState) =>
  state.editor.hasUnsavedChanges;

/**
 * Select can undo
 */
export const selectCanUndo = (state: DashboardStoreState) =>
  state.editor.undoStack.length > 0;

/**
 * Select can redo
 */
export const selectCanRedo = (state: DashboardStoreState) =>
  state.editor.redoStack.length > 0;

/**
 * Select filtered widgets for panel
 */
export const selectFilteredPanelWidgets = (state: DashboardStoreState) => {
  const { selectedCategory, searchQuery } = state.widgetPanel;

  let filtered = WIDGET_METADATA;

  if (selectedCategory !== 'all') {
    filtered = filtered.filter((w) => w.category === selectedCategory);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query)
    );
  }

  return filtered;
};

/**
 * Select active widgets (widgets currently in layout)
 */
export const selectActiveWidgetIds = (state: DashboardStoreState) =>
  new Set(state.layout.widgets.map((w) => w.widgetId));
