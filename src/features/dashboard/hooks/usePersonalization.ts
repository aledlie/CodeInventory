/**
 * Personalization Hooks
 *
 * Phase 5B: Dashboard Personalization
 * React Query hooks for saved views, preferences, and widget management
 */

import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { personalizationApi } from '../api/personalizationApi';
import type {
  SavedView,
  DashboardPreferences,
  DashboardNotificationSettings,
  WidgetMetadata,
  WidgetCategory,
  WidgetConfig,
  DashboardLayout,
} from '../types';

// ============================================================================
// Query Keys
// ============================================================================

export const personalizationKeys = {
  all: ['personalization'] as const,
  views: () => [...personalizationKeys.all, 'views'] as const,
  view: (id: string) => [...personalizationKeys.views(), id] as const,
  preferences: () => [...personalizationKeys.all, 'preferences'] as const,
  widgets: () => [...personalizationKeys.all, 'widgets'] as const,
  widgetsByCategory: (category: WidgetCategory) =>
    [...personalizationKeys.widgets(), category] as const,
  activeView: () => [...personalizationKeys.all, 'activeView'] as const,
};

// ============================================================================
// Saved Views Hooks
// ============================================================================

/**
 * Fetch all saved views
 */
export function useSavedViews() {
  return useSuspenseQuery({
    queryKey: personalizationKeys.views(),
    queryFn: personalizationApi.fetchSavedViews,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single saved view
 */
export function useSavedView(viewId: string) {
  return useSuspenseQuery({
    queryKey: personalizationKeys.view(viewId),
    queryFn: () => personalizationApi.fetchSavedView(viewId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get active view ID (non-suspense for initial load)
 */
export function useActiveViewId() {
  return useQuery({
    queryKey: personalizationKeys.activeView(),
    queryFn: personalizationApi.getActiveViewId,
    staleTime: Infinity, // Only refetch manually
  });
}

/**
 * Create a new saved view
 */
export function useCreateSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) =>
      personalizationApi.createSavedView(view),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalizationKeys.views() });
    },
  });
}

/**
 * Update an existing saved view
 */
export function useUpdateSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      viewId,
      updates,
    }: {
      viewId: string;
      updates: Partial<SavedView>;
    }) => personalizationApi.updateSavedView(viewId, updates),
    onSuccess: (_, { viewId }) => {
      queryClient.invalidateQueries({ queryKey: personalizationKeys.views() });
      queryClient.invalidateQueries({ queryKey: personalizationKeys.view(viewId) });
    },
  });
}

/**
 * Delete a saved view
 */
export function useDeleteSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => personalizationApi.deleteSavedView(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalizationKeys.views() });
    },
  });
}

/**
 * Set active view
 */
export function useSetActiveView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => personalizationApi.setActiveView(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalizationKeys.activeView() });
    },
  });
}

// ============================================================================
// Preferences Hooks
// ============================================================================

/**
 * Fetch user preferences
 */
export function usePreferences() {
  return useSuspenseQuery({
    queryKey: personalizationKeys.preferences(),
    queryFn: personalizationApi.fetchPreferences,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<DashboardPreferences>) =>
      personalizationApi.updatePreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalizationKeys.preferences() });
    },
  });
}

/**
 * Update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<DashboardNotificationSettings>) =>
      personalizationApi.updateNotificationSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalizationKeys.preferences() });
    },
  });
}

// ============================================================================
// Widget Hooks
// ============================================================================

/**
 * Fetch all widget metadata
 */
export function useWidgetMetadata() {
  return useSuspenseQuery({
    queryKey: personalizationKeys.widgets(),
    queryFn: personalizationApi.fetchWidgetMetadata,
    staleTime: Infinity, // Static data, never refetch
  });
}

/**
 * Fetch widgets by category
 */
export function useWidgetsByCategory(category: WidgetCategory) {
  return useSuspenseQuery({
    queryKey: personalizationKeys.widgetsByCategory(category),
    queryFn: () => personalizationApi.fetchWidgetsByCategory(category),
    staleTime: Infinity,
  });
}

// ============================================================================
// Combined Hooks
// ============================================================================

/**
 * Combined hook for saved views management
 */
export function useSavedViewsManager() {
  const { data: viewsResponse } = useSavedViews();
  const { data: activeViewId } = useActiveViewId();

  const createView = useCreateSavedView();
  const updateView = useUpdateSavedView();
  const deleteView = useDeleteSavedView();
  const setActiveView = useSetActiveView();

  const activeView = viewsResponse.views.find(
    (v) => v.id === (activeViewId || viewsResponse.defaultViewId)
  );

  return {
    views: viewsResponse.views,
    defaultViewId: viewsResponse.defaultViewId,
    activeViewId: activeViewId || viewsResponse.defaultViewId,
    activeView,

    // Actions
    createView: createView.mutate,
    updateView: updateView.mutate,
    deleteView: deleteView.mutate,
    selectView: setActiveView.mutate,
    setDefault: (viewId: string) =>
      updateView.mutate({ viewId, updates: { isDefault: true } }),

    // Loading states
    isCreating: createView.isPending,
    isUpdating: updateView.isPending,
    isDeleting: deleteView.isPending,
    isSelecting: setActiveView.isPending,
  };
}

/**
 * Combined hook for preferences management
 */
export function usePreferencesManager() {
  const { data } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const updateNotifications = useUpdateNotificationSettings();

  return {
    preferences: data.preferences,
    notificationSettings: data.notificationSettings,

    // Actions
    updatePreferences: updatePreferences.mutate,
    updateNotifications: updateNotifications.mutate,

    // Loading states
    isUpdatingPreferences: updatePreferences.isPending,
    isUpdatingNotifications: updateNotifications.isPending,
  };
}

/**
 * Combined hook for widget library
 */
export function useWidgetLibrary() {
  const { data: widgets } = useWidgetMetadata();

  const getWidgetsByCategory = (category: WidgetCategory | 'all'): WidgetMetadata[] => {
    if (category === 'all') {
      return widgets;
    }
    return widgets.filter((w) => w.category === category);
  };

  const getWidgetById = (widgetId: string): WidgetMetadata | undefined => {
    return widgets.find((w) => w.id === widgetId);
  };

  const categories = [...new Set(widgets.map((w) => w.category))];

  return {
    widgets,
    categories,
    getWidgetsByCategory,
    getWidgetById,
  };
}

/**
 * Hook for dashboard layout operations
 */
export function useLayoutOperations(
  currentLayout: DashboardLayout,
  onLayoutChange: (layout: DashboardLayout) => void
) {
  const addWidget = (widgetId: string, position?: { row: number; column: number }) => {
    const newPosition = position || findNextAvailablePosition(currentLayout);
    const newWidget = personalizationApi.createWidgetInstance(
      widgetId as Parameters<typeof personalizationApi.createWidgetInstance>[0],
      newPosition
    );

    const updatedLayout: DashboardLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, newWidget],
    };

    onLayoutChange(updatedLayout);
  };

  const removeWidget = (instanceId: string) => {
    const updatedLayout: DashboardLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.filter((w) => w.instanceId !== instanceId),
    };

    onLayoutChange(updatedLayout);
  };

  const updateWidget = (
    instanceId: string,
    updates: Partial<Pick<WidgetConfig, 'visible' | 'size' | 'position' | 'settings'>>
  ) => {
    const updatedLayout: DashboardLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map((w) =>
        w.instanceId === instanceId ? { ...w, ...updates } : w
      ),
    };

    onLayoutChange(updatedLayout);
  };

  const moveWidget = (instanceId: string, newPosition: { row: number; column: number }) => {
    updateWidget(instanceId, { position: newPosition });
  };

  const toggleWidgetVisibility = (instanceId: string) => {
    const widget = currentLayout.widgets.find((w) => w.instanceId === instanceId);
    if (widget) {
      updateWidget(instanceId, { visible: !widget.visible });
    }
  };

  return {
    addWidget,
    removeWidget,
    updateWidget,
    moveWidget,
    toggleWidgetVisibility,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find next available position in grid
 */
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

/**
 * Type exports for external use
 */
export type {
  SavedView,
  DashboardPreferences,
  DashboardNotificationSettings,
  WidgetMetadata,
  WidgetCategory,
  DashboardLayout,
};
