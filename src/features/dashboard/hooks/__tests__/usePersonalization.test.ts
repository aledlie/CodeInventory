/**
 * Personalization Hooks Tests
 *
 * Tests for usePersonalization hooks including saved views, preferences,
 * widgets, and layout operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
  personalizationKeys,
  useSavedViews,
  useSavedView,
  useActiveViewId,
  useCreateSavedView,
  useUpdateSavedView,
  useDeleteSavedView,
  useSetActiveView,
  usePreferences,
  useUpdatePreferences,
  useUpdateNotificationSettings,
  useWidgetMetadata,
  useWidgetsByCategory,
  useSavedViewsManager,
  usePreferencesManager,
  useWidgetLibrary,
  useLayoutOperations,
} from '../usePersonalization';
import { personalizationApi } from '../../api/personalizationApi';
import type {
  SavedView,
  SavedViewsResponse,
  PreferencesResponse,
  WidgetMetadata,
  DashboardLayout,
  DashboardPreferences,
  DashboardNotificationSettings,
} from '../../types';

// Mock the personalizationApi
vi.mock('../../api/personalizationApi', () => ({
  personalizationApi: {
    fetchSavedViews: vi.fn(),
    fetchSavedView: vi.fn(),
    createSavedView: vi.fn(),
    updateSavedView: vi.fn(),
    deleteSavedView: vi.fn(),
    setActiveView: vi.fn(),
    getActiveViewId: vi.fn(),
    fetchPreferences: vi.fn(),
    updatePreferences: vi.fn(),
    updateNotificationSettings: vi.fn(),
    fetchWidgetMetadata: vi.fn(),
    fetchWidgetsByCategory: vi.fn(),
    createWidgetInstance: vi.fn(),
  },
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const mockLayout: DashboardLayout = {
  id: 'default',
  name: 'Default Layout',
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
  widgets: [
    {
      instanceId: 'widget-1',
      widgetId: 'quality-score',
      visible: true,
      size: 'small',
      position: { row: 0, column: 0 },
      settings: {},
    },
    {
      instanceId: 'widget-2',
      widgetId: 'coverage-summary',
      visible: true,
      size: 'medium',
      position: { row: 0, column: 1 },
      settings: {},
    },
  ],
};

const mockSavedView: SavedView = {
  id: 'view-1',
  name: 'Test View',
  description: 'A test view',
  layout: mockLayout,
  isDefault: true,
  isShared: false,
  createdBy: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  tags: ['test'],
};

const mockSavedViewsResponse: SavedViewsResponse = {
  views: [mockSavedView],
  defaultViewId: 'view-1',
};

const mockPreferences: DashboardPreferences = {
  userId: 'user-1',
  defaultViewId: 'view-1',
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
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockNotificationSettings: DashboardNotificationSettings = {
  enabled: true,
  soundEnabled: false,
  desktopNotifications: true,
  widgetSettings: [],
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC',
  },
  digestMode: 'immediate',
};

const mockPreferencesResponse: PreferencesResponse = {
  preferences: mockPreferences,
  notificationSettings: mockNotificationSettings,
};

const mockWidgetMetadata: WidgetMetadata[] = [
  {
    id: 'quality-score',
    name: 'Quality Score',
    description: 'Overall code quality score',
    category: 'quality',
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
    description: 'Test coverage percentage',
    category: 'coverage',
    defaultSize: 'small',
    availableSizes: ['small', 'medium', 'large'],
    resizable: true,
    icon: 'CheckCircle',
    minRefreshInterval: 60000,
    isPremium: false,
  },
  {
    id: 'dependency-health',
    name: 'Dependency Health',
    description: 'Dependency status',
    category: 'dependencies',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
    resizable: true,
    icon: 'AccountTree',
    minRefreshInterval: 300000,
    isPremium: false,
  },
];

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

function createWrapper(queryClient: QueryClient): React.FC<{ children: ReactNode }> {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ============================================================================
// Query Keys Tests
// ============================================================================

describe('personalizationKeys', () => {
  it('should generate correct base key', () => {
    expect(personalizationKeys.all).toEqual(['personalization']);
  });

  it('should generate correct views key', () => {
    expect(personalizationKeys.views()).toEqual(['personalization', 'views']);
  });

  it('should generate correct view key with id', () => {
    expect(personalizationKeys.view('view-1')).toEqual([
      'personalization',
      'views',
      'view-1',
    ]);
  });

  it('should generate correct preferences key', () => {
    expect(personalizationKeys.preferences()).toEqual([
      'personalization',
      'preferences',
    ]);
  });

  it('should generate correct widgets key', () => {
    expect(personalizationKeys.widgets()).toEqual([
      'personalization',
      'widgets',
    ]);
  });

  it('should generate correct widgetsByCategory key', () => {
    expect(personalizationKeys.widgetsByCategory('quality')).toEqual([
      'personalization',
      'widgets',
      'quality',
    ]);
  });

  it('should generate correct activeView key', () => {
    expect(personalizationKeys.activeView()).toEqual([
      'personalization',
      'activeView',
    ]);
  });
});

// ============================================================================
// Saved Views Query Hooks Tests
// ============================================================================

describe('useSavedViews', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch saved views successfully', async () => {
    vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(
      mockSavedViewsResponse
    );

    const { result } = renderHook(() => useSavedViews(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSavedViewsResponse);
    });

    expect(personalizationApi.fetchSavedViews).toHaveBeenCalledOnce();
  });
});

describe('useSavedView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch a single saved view by id', async () => {
    vi.mocked(personalizationApi.fetchSavedView).mockResolvedValue(
      mockSavedView
    );

    const { result } = renderHook(() => useSavedView('view-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSavedView);
    });

    expect(personalizationApi.fetchSavedView).toHaveBeenCalledWith('view-1');
  });
});

describe('useActiveViewId', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch active view id', async () => {
    vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');

    const { result } = renderHook(() => useActiveViewId(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBe('view-1');
    });

    expect(personalizationApi.getActiveViewId).toHaveBeenCalledOnce();
  });

  it('should return null when no active view', async () => {
    vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue(null);

    const { result } = renderHook(() => useActiveViewId(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});

// ============================================================================
// Saved Views Mutation Hooks Tests
// ============================================================================

describe('useCreateSavedView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create a new saved view', async () => {
    const newView = { ...mockSavedView, id: 'view-2', name: 'New View' };
    vi.mocked(personalizationApi.createSavedView).mockResolvedValue(newView);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSavedView(), {
      wrapper: createWrapper(queryClient),
    });

    const viewData = {
      name: 'New View',
      description: 'A new view',
      layout: mockLayout,
      isDefault: false,
      isShared: false,
      createdBy: 'user-1',
      tags: [],
    };

    await act(async () => {
      result.current.mutate(viewData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(personalizationApi.createSavedView).toHaveBeenCalledWith(viewData);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: personalizationKeys.views(),
    });
  });
});

describe('useUpdateSavedView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update an existing view', async () => {
    const updatedView = { ...mockSavedView, name: 'Updated View' };
    vi.mocked(personalizationApi.updateSavedView).mockResolvedValue(
      updatedView
    );

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSavedView(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ viewId: 'view-1', updates: { name: 'Updated View' } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(personalizationApi.updateSavedView).toHaveBeenCalledWith('view-1', {
      name: 'Updated View',
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: personalizationKeys.views(),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: personalizationKeys.view('view-1'),
    });
  });
});

describe('useDeleteSavedView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete a saved view', async () => {
    vi.mocked(personalizationApi.deleteSavedView).mockResolvedValue(undefined);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSavedView(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('view-1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(personalizationApi.deleteSavedView).toHaveBeenCalledWith('view-1');
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: personalizationKeys.views(),
    });
  });
});

describe('useSetActiveView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should set active view', async () => {
    vi.mocked(personalizationApi.setActiveView).mockResolvedValue(undefined);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSetActiveView(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('view-2');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(personalizationApi.setActiveView).toHaveBeenCalledWith('view-2');
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: personalizationKeys.activeView(),
    });
  });
});

// ============================================================================
// Preferences Hooks Tests
// ============================================================================

describe('usePreferences', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch preferences successfully', async () => {
    vi.mocked(personalizationApi.fetchPreferences).mockResolvedValue(
      mockPreferencesResponse
    );

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPreferencesResponse);
    });

    expect(personalizationApi.fetchPreferences).toHaveBeenCalledOnce();
  });
});

describe('useUpdatePreferences', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update preferences', async () => {
    const updatedPrefs = { ...mockPreferences, compactMode: true };
    vi.mocked(personalizationApi.updatePreferences).mockResolvedValue(
      updatedPrefs
    );

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdatePreferences(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ compactMode: true });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(personalizationApi.updatePreferences).toHaveBeenCalledWith({
      compactMode: true,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: personalizationKeys.preferences(),
    });
  });
});

describe('useUpdateNotificationSettings', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update notification settings', async () => {
    const updatedSettings = { ...mockNotificationSettings, soundEnabled: true };
    vi.mocked(personalizationApi.updateNotificationSettings).mockResolvedValue(
      updatedSettings
    );

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ soundEnabled: true });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(personalizationApi.updateNotificationSettings).toHaveBeenCalledWith({
      soundEnabled: true,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: personalizationKeys.preferences(),
    });
  });
});

// ============================================================================
// Widget Hooks Tests
// ============================================================================

describe('useWidgetMetadata', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch widget metadata', async () => {
    vi.mocked(personalizationApi.fetchWidgetMetadata).mockResolvedValue(
      mockWidgetMetadata
    );

    const { result } = renderHook(() => useWidgetMetadata(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockWidgetMetadata);
    });

    expect(personalizationApi.fetchWidgetMetadata).toHaveBeenCalledOnce();
  });
});

describe('useWidgetsByCategory', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch widgets by category', async () => {
    const qualityWidgets = mockWidgetMetadata.filter(
      (w) => w.category === 'quality'
    );
    vi.mocked(personalizationApi.fetchWidgetsByCategory).mockResolvedValue(
      qualityWidgets
    );

    const { result } = renderHook(() => useWidgetsByCategory('quality'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(qualityWidgets);
    });

    expect(personalizationApi.fetchWidgetsByCategory).toHaveBeenCalledWith(
      'quality'
    );
  });
});

// ============================================================================
// Combined Hooks Tests
// ============================================================================

describe('useSavedViewsManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should provide views and actions', async () => {
    vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(
      mockSavedViewsResponse
    );
    vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');

    const { result } = renderHook(() => useSavedViewsManager(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.views).toEqual(mockSavedViewsResponse.views);
    });

    expect(result.current.defaultViewId).toBe('view-1');
    expect(result.current.activeViewId).toBe('view-1');
    expect(result.current.activeView).toEqual(mockSavedView);
    expect(typeof result.current.createView).toBe('function');
    expect(typeof result.current.updateView).toBe('function');
    expect(typeof result.current.deleteView).toBe('function');
    expect(typeof result.current.selectView).toBe('function');
    expect(typeof result.current.setDefault).toBe('function');
    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.isSelecting).toBe(false);
  });

  it('should use defaultViewId when activeViewId is null', async () => {
    vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(
      mockSavedViewsResponse
    );
    vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue(null);

    const { result } = renderHook(() => useSavedViewsManager(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.activeViewId).toBe('view-1');
    });
  });

  it('should call setDefault with correct parameters', async () => {
    vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(
      mockSavedViewsResponse
    );
    vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');
    vi.mocked(personalizationApi.updateSavedView).mockResolvedValue(
      mockSavedView
    );

    const { result } = renderHook(() => useSavedViewsManager(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.views).toBeDefined();
    });

    await act(async () => {
      result.current.setDefault('view-1');
    });

    await waitFor(() => {
      expect(personalizationApi.updateSavedView).toHaveBeenCalledWith(
        'view-1',
        { isDefault: true }
      );
    });
  });
});

describe('usePreferencesManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should provide preferences and actions', async () => {
    vi.mocked(personalizationApi.fetchPreferences).mockResolvedValue(
      mockPreferencesResponse
    );

    const { result } = renderHook(() => usePreferencesManager(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.preferences).toEqual(mockPreferences);
    });

    expect(result.current.notificationSettings).toEqual(mockNotificationSettings);
    expect(typeof result.current.updatePreferences).toBe('function');
    expect(typeof result.current.updateNotifications).toBe('function');
    expect(result.current.isUpdatingPreferences).toBe(false);
    expect(result.current.isUpdatingNotifications).toBe(false);
  });
});

describe('useWidgetLibrary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should provide widgets and helper functions', async () => {
    vi.mocked(personalizationApi.fetchWidgetMetadata).mockResolvedValue(
      mockWidgetMetadata
    );

    const { result } = renderHook(() => useWidgetLibrary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.widgets).toEqual(mockWidgetMetadata);
    });

    expect(result.current.categories).toContain('quality');
    expect(result.current.categories).toContain('coverage');
    expect(result.current.categories).toContain('dependencies');
  });

  it('should filter widgets by category', async () => {
    vi.mocked(personalizationApi.fetchWidgetMetadata).mockResolvedValue(
      mockWidgetMetadata
    );

    const { result } = renderHook(() => useWidgetLibrary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.widgets).toBeDefined();
    });

    const qualityWidgets = result.current.getWidgetsByCategory('quality');
    expect(qualityWidgets).toHaveLength(1);
    expect(qualityWidgets[0].id).toBe('quality-score');

    const allWidgets = result.current.getWidgetsByCategory('all');
    expect(allWidgets).toEqual(mockWidgetMetadata);
  });

  it('should get widget by id', async () => {
    vi.mocked(personalizationApi.fetchWidgetMetadata).mockResolvedValue(
      mockWidgetMetadata
    );

    const { result } = renderHook(() => useWidgetLibrary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.widgets).toBeDefined();
    });

    const widget = result.current.getWidgetById('quality-score');
    expect(widget?.id).toBe('quality-score');
    expect(widget?.name).toBe('Quality Score');

    const unknownWidget = result.current.getWidgetById('unknown');
    expect(unknownWidget).toBeUndefined();
  });
});

// ============================================================================
// Layout Operations Tests
// ============================================================================

describe('useLayoutOperations', () => {
  it('should add widget to layout', () => {
    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget-123',
      widgetId: 'dependency-health' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 1, column: 0 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('dependency-health');
    });

    expect(personalizationApi.createWidgetInstance).toHaveBeenCalled();
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({ widgetId: 'quality-score' }),
          expect.objectContaining({ widgetId: 'coverage-summary' }),
          mockWidgetConfig,
        ]),
      })
    );
  });

  it('should add widget at specified position', () => {
    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget-123',
      widgetId: 'dependency-health' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 2, column: 1 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('dependency-health', { row: 2, column: 1 });
    });

    expect(personalizationApi.createWidgetInstance).toHaveBeenCalledWith(
      'dependency-health',
      { row: 2, column: 1 }
    );
  });

  it('should remove widget from layout', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.removeWidget('widget-1');
    });

    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: [
          expect.objectContaining({ instanceId: 'widget-2' }),
        ],
      })
    );
  });

  it('should update widget properties', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.updateWidget('widget-1', { size: 'large', visible: false });
    });

    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({
            instanceId: 'widget-1',
            size: 'large',
            visible: false,
          }),
        ]),
      })
    );
  });

  it('should move widget to new position', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.moveWidget('widget-1', { row: 2, column: 0 });
    });

    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({
            instanceId: 'widget-1',
            position: { row: 2, column: 0 },
          }),
        ]),
      })
    );
  });

  it('should toggle widget visibility', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.toggleWidgetVisibility('widget-1');
    });

    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({
            instanceId: 'widget-1',
            visible: false,
          }),
        ]),
      })
    );
  });

  it('should not update visibility for non-existent widget', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.toggleWidgetVisibility('non-existent');
    });

    expect(onLayoutChange).not.toHaveBeenCalled();
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

  it('should handle empty views list', async () => {
    const emptyResponse: SavedViewsResponse = {
      views: [],
      defaultViewId: null,
    };
    vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(
      emptyResponse
    );
    vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue(null);

    const { result } = renderHook(() => useSavedViewsManager(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.views).toEqual([]);
    });

    expect(result.current.activeView).toBeUndefined();
    expect(result.current.activeViewId).toBeNull();
  });

  it('should handle widget categories deduplication', async () => {
    const widgetsWithDuplicateCategories: WidgetMetadata[] = [
      ...mockWidgetMetadata,
      {
        id: 'quality-detail',
        name: 'Quality Detail',
        description: 'Detailed quality',
        category: 'quality', // duplicate category
        defaultSize: 'large',
        availableSizes: ['large'],
        resizable: true,
        icon: 'Info',
        minRefreshInterval: 60000,
        isPremium: false,
      },
    ];

    vi.mocked(personalizationApi.fetchWidgetMetadata).mockResolvedValue(
      widgetsWithDuplicateCategories
    );

    const { result } = renderHook(() => useWidgetLibrary(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.widgets).toBeDefined();
    });

    // Categories should be unique
    const uniqueCategories = [...new Set(result.current.categories)];
    expect(result.current.categories).toEqual(uniqueCategories);
  });

  it('should find next available position in layout', () => {
    const fullLayout: DashboardLayout = {
      ...mockLayout,
      widgets: [
        {
          instanceId: 'w1',
          widgetId: 'quality-score',
          visible: true,
          size: 'small',
          position: { row: 0, column: 0 },
          settings: {},
        },
        {
          instanceId: 'w2',
          widgetId: 'coverage-summary',
          visible: true,
          size: 'small',
          position: { row: 0, column: 1 },
          settings: {},
        },
      ],
    };

    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget',
      widgetId: 'dependency-health' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 1, column: 0 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(fullLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('dependency-health');
    });

    // Should find position { row: 1, column: 0 } since row 0 is full
    expect(personalizationApi.createWidgetInstance).toHaveBeenCalledWith(
      'dependency-health',
      { row: 1, column: 0 }
    );
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Error Handling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Query Error States (Non-Suspense)', () => {
    // Note: useSuspenseQuery hooks (useSavedViews, useSavedView, usePreferences,
    // useWidgetMetadata, useWidgetsByCategory) throw errors to React error boundaries
    // instead of exposing them on the result object. They're designed to be used
    // with React Suspense and error boundaries.

    // useActiveViewId uses regular useQuery, so it exposes error state
    it('useActiveViewId should track loading state', async () => {
      let resolvePromise: (value: string | null) => void;
      const pendingPromise = new Promise<string | null>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(personalizationApi.getActiveViewId).mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useActiveViewId(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      await act(async () => {
        resolvePromise!('view-1');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe('view-1');
    });

    it('useActiveViewId should use staleTime Infinity', async () => {
      vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');

      const { result, rerender } = renderHook(() => useActiveViewId(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.data).toBe('view-1');
      });

      // Clear mock call count
      vi.mocked(personalizationApi.getActiveViewId).mockClear();

      // Rerender - should not refetch due to staleTime: Infinity
      rerender();

      await waitFor(() => {
        expect(result.current.data).toBe('view-1');
      });

      // Should not have been called again due to staleTime: Infinity
      expect(personalizationApi.getActiveViewId).not.toHaveBeenCalled();
    });

    it('useActiveViewId should expose isSuccess on successful fetch', async () => {
      vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-123');

      const { result } = renderHook(() => useActiveViewId(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe('view-123');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('Mutation Error States', () => {
    it('useCreateSavedView should handle creation errors', async () => {
      const error = new Error('Failed to create view');
      vi.mocked(personalizationApi.createSavedView).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateSavedView(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({
          name: 'Test View',
          layout: mockLayout,
          isDefault: false,
          isShared: false,
          createdBy: 'user-1',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('useUpdateSavedView should handle update errors', async () => {
      const error = new Error('View not found');
      vi.mocked(personalizationApi.updateSavedView).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateSavedView(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ viewId: 'invalid-id', updates: { name: 'New Name' } });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('useDeleteSavedView should handle deletion errors', async () => {
      const error = new Error('Cannot delete the last view');
      vi.mocked(personalizationApi.deleteSavedView).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteSavedView(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate('last-view-id');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('useSetActiveView should handle errors', async () => {
      const error = new Error('Failed to set active view');
      vi.mocked(personalizationApi.setActiveView).mockRejectedValue(error);

      const { result } = renderHook(() => useSetActiveView(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate('invalid-view-id');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('useUpdatePreferences should handle update errors', async () => {
      const error = new Error('Failed to update preferences');
      vi.mocked(personalizationApi.updatePreferences).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdatePreferences(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ theme: 'dark' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('useUpdateNotificationSettings should handle update errors', async () => {
      const error = new Error('Failed to update notifications');
      vi.mocked(personalizationApi.updateNotificationSettings).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateNotificationSettings(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ enabled: false });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});

// ============================================================================
// Mutation State Tests
// ============================================================================

describe('Mutation States', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('useCreateSavedView should track pending state', async () => {
    let resolvePromise: (value: SavedView) => void;
    const pendingPromise = new Promise<SavedView>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(personalizationApi.createSavedView).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useCreateSavedView(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        name: 'Test View',
        layout: mockLayout,
        isDefault: false,
        isShared: false,
        createdBy: 'user-1',
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!(mockSavedView);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useUpdateSavedView should track pending state', async () => {
    let resolvePromise: (value: SavedView) => void;
    const pendingPromise = new Promise<SavedView>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(personalizationApi.updateSavedView).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useUpdateSavedView(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({ viewId: 'view-1', updates: { name: 'Updated' } });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!(mockSavedView);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('useDeleteSavedView should track pending state', async () => {
    let resolvePromise: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(personalizationApi.deleteSavedView).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useDeleteSavedView(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate('view-1');
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('useSetActiveView should track pending state', async () => {
    let resolvePromise: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(personalizationApi.setActiveView).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useSetActiveView(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate('view-2');
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});

// ============================================================================
// findNextAvailablePosition Helper Tests
// ============================================================================

describe('findNextAvailablePosition (via useLayoutOperations)', () => {
  it('should find first position in empty layout', () => {
    const emptyLayout: DashboardLayout = {
      ...mockLayout,
      widgets: [],
    };

    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget',
      widgetId: 'quality-score' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 0, column: 0 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(emptyLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('quality-score');
    });

    expect(personalizationApi.createWidgetInstance).toHaveBeenCalledWith(
      'quality-score',
      { row: 0, column: 0 }
    );
  });

  it('should find position in sparse layout', () => {
    const sparseLayout: DashboardLayout = {
      ...mockLayout,
      grid: { ...mockLayout.grid, columns: 3 },
      widgets: [
        {
          instanceId: 'w1',
          widgetId: 'quality-score',
          visible: true,
          size: 'small',
          position: { row: 0, column: 0 },
          settings: {},
        },
        {
          instanceId: 'w2',
          widgetId: 'coverage-summary',
          visible: true,
          size: 'small',
          position: { row: 0, column: 2 },
          settings: {},
        },
      ],
    };

    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget',
      widgetId: 'dependency-health' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 0, column: 1 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(sparseLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('dependency-health');
    });

    // Should find the gap at column 1
    expect(personalizationApi.createWidgetInstance).toHaveBeenCalledWith(
      'dependency-health',
      { row: 0, column: 1 }
    );
  });

  it('should wrap to next row when columns are full', () => {
    const fullRowLayout: DashboardLayout = {
      ...mockLayout,
      grid: { ...mockLayout.grid, columns: 2 },
      widgets: [
        {
          instanceId: 'w1',
          widgetId: 'quality-score',
          visible: true,
          size: 'small',
          position: { row: 0, column: 0 },
          settings: {},
        },
        {
          instanceId: 'w2',
          widgetId: 'coverage-summary',
          visible: true,
          size: 'small',
          position: { row: 0, column: 1 },
          settings: {},
        },
      ],
    };

    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget',
      widgetId: 'dependency-health' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 1, column: 0 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(fullRowLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('dependency-health');
    });

    expect(personalizationApi.createWidgetInstance).toHaveBeenCalledWith(
      'dependency-health',
      { row: 1, column: 0 }
    );
  });

  it('should handle multiple full rows', () => {
    const multiRowLayout: DashboardLayout = {
      ...mockLayout,
      grid: { ...mockLayout.grid, columns: 2 },
      widgets: [
        {
          instanceId: 'w1',
          widgetId: 'quality-score',
          visible: true,
          size: 'small',
          position: { row: 0, column: 0 },
          settings: {},
        },
        {
          instanceId: 'w2',
          widgetId: 'coverage-summary',
          visible: true,
          size: 'small',
          position: { row: 0, column: 1 },
          settings: {},
        },
        {
          instanceId: 'w3',
          widgetId: 'dependency-health',
          visible: true,
          size: 'small',
          position: { row: 1, column: 0 },
          settings: {},
        },
        {
          instanceId: 'w4',
          widgetId: 'critical-issues',
          visible: true,
          size: 'small',
          position: { row: 1, column: 1 },
          settings: {},
        },
      ],
    };

    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget',
      widgetId: 'recent-trends' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 2, column: 0 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(multiRowLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('recent-trends');
    });

    expect(personalizationApi.createWidgetInstance).toHaveBeenCalledWith(
      'recent-trends',
      { row: 2, column: 0 }
    );
  });
});

// ============================================================================
// Combined Hooks Advanced Tests
// ============================================================================

describe('Combined Hooks Advanced', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useSavedViewsManager advanced scenarios', () => {
    it('should handle activeView when view not found in list', async () => {
      const viewsResponse: SavedViewsResponse = {
        views: [mockSavedView],
        defaultViewId: 'view-1',
      };
      vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(viewsResponse);
      vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('non-existent-view');

      const { result } = renderHook(() => useSavedViewsManager(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.views).toBeDefined();
      });

      // activeView should be undefined because 'non-existent-view' is not in views
      expect(result.current.activeView).toBeUndefined();
    });

    it('should expose loading states correctly', async () => {
      let resolveCreate: (value: SavedView) => void;
      const createPromise = new Promise<SavedView>((resolve) => {
        resolveCreate = resolve;
      });

      vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(mockSavedViewsResponse);
      vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');
      vi.mocked(personalizationApi.createSavedView).mockReturnValue(createPromise);

      const { result } = renderHook(() => useSavedViewsManager(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.views).toBeDefined();
      });

      expect(result.current.isCreating).toBe(false);

      act(() => {
        result.current.createView({
          name: 'New View',
          layout: mockLayout,
          isDefault: false,
          isShared: false,
          createdBy: 'user-1',
        });
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      await act(async () => {
        resolveCreate!(mockSavedView);
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should call updateView with correct mutation signature', async () => {
      const updatedView = { ...mockSavedView, name: 'Updated' };
      vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(mockSavedViewsResponse);
      vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');
      vi.mocked(personalizationApi.updateSavedView).mockResolvedValue(updatedView);

      const { result } = renderHook(() => useSavedViewsManager(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.views).toBeDefined();
      });

      await act(async () => {
        result.current.updateView({ viewId: 'view-1', updates: { name: 'Updated' } });
      });

      await waitFor(() => {
        expect(personalizationApi.updateSavedView).toHaveBeenCalledWith(
          'view-1',
          { name: 'Updated' }
        );
      });
    });

    it('should call deleteView correctly', async () => {
      vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(mockSavedViewsResponse);
      vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');
      vi.mocked(personalizationApi.deleteSavedView).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSavedViewsManager(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.views).toBeDefined();
      });

      await act(async () => {
        result.current.deleteView('view-1');
      });

      await waitFor(() => {
        expect(personalizationApi.deleteSavedView).toHaveBeenCalledWith('view-1');
      });
    });

    it('should call selectView correctly', async () => {
      vi.mocked(personalizationApi.fetchSavedViews).mockResolvedValue(mockSavedViewsResponse);
      vi.mocked(personalizationApi.getActiveViewId).mockResolvedValue('view-1');
      vi.mocked(personalizationApi.setActiveView).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSavedViewsManager(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.views).toBeDefined();
      });

      await act(async () => {
        result.current.selectView('view-2');
      });

      await waitFor(() => {
        expect(personalizationApi.setActiveView).toHaveBeenCalledWith('view-2');
      });
    });
  });

  describe('usePreferencesManager advanced scenarios', () => {
    it('should expose loading states correctly', async () => {
      let resolveUpdate: (value: DashboardPreferences) => void;
      const updatePromise = new Promise<DashboardPreferences>((resolve) => {
        resolveUpdate = resolve;
      });

      vi.mocked(personalizationApi.fetchPreferences).mockResolvedValue(mockPreferencesResponse);
      vi.mocked(personalizationApi.updatePreferences).mockReturnValue(updatePromise);

      const { result } = renderHook(() => usePreferencesManager(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.preferences).toBeDefined();
      });

      expect(result.current.isUpdatingPreferences).toBe(false);

      act(() => {
        result.current.updatePreferences({ theme: 'dark' });
      });

      await waitFor(() => {
        expect(result.current.isUpdatingPreferences).toBe(true);
      });

      await act(async () => {
        resolveUpdate!(mockPreferences);
      });

      await waitFor(() => {
        expect(result.current.isUpdatingPreferences).toBe(false);
      });
    });

    it('should track notification settings update state', async () => {
      let resolveUpdate: (value: DashboardNotificationSettings) => void;
      const updatePromise = new Promise<DashboardNotificationSettings>((resolve) => {
        resolveUpdate = resolve;
      });

      vi.mocked(personalizationApi.fetchPreferences).mockResolvedValue(mockPreferencesResponse);
      vi.mocked(personalizationApi.updateNotificationSettings).mockReturnValue(updatePromise);

      const { result } = renderHook(() => usePreferencesManager(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.preferences).toBeDefined();
      });

      expect(result.current.isUpdatingNotifications).toBe(false);

      act(() => {
        result.current.updateNotifications({ enabled: false });
      });

      await waitFor(() => {
        expect(result.current.isUpdatingNotifications).toBe(true);
      });

      await act(async () => {
        resolveUpdate!(mockNotificationSettings);
      });

      await waitFor(() => {
        expect(result.current.isUpdatingNotifications).toBe(false);
      });
    });
  });

  describe('useWidgetLibrary advanced scenarios', () => {
    it('should handle empty widgets list', async () => {
      vi.mocked(personalizationApi.fetchWidgetMetadata).mockResolvedValue([]);

      const { result } = renderHook(() => useWidgetLibrary(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.widgets).toEqual([]);
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.getWidgetsByCategory('quality')).toEqual([]);
      expect(result.current.getWidgetById('quality-score')).toBeUndefined();
    });

    it('should filter correctly for all categories', async () => {
      vi.mocked(personalizationApi.fetchWidgetMetadata).mockResolvedValue(mockWidgetMetadata);

      const { result } = renderHook(() => useWidgetLibrary(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.widgets).toBeDefined();
      });

      // Test all category filter
      const allWidgets = result.current.getWidgetsByCategory('all');
      expect(allWidgets).toHaveLength(mockWidgetMetadata.length);

      // Test quality filter
      const qualityWidgets = result.current.getWidgetsByCategory('quality');
      expect(qualityWidgets.every(w => w.category === 'quality')).toBe(true);

      // Test coverage filter
      const coverageWidgets = result.current.getWidgetsByCategory('coverage');
      expect(coverageWidgets.every(w => w.category === 'coverage')).toBe(true);

      // Test dependencies filter
      const depsWidgets = result.current.getWidgetsByCategory('dependencies');
      expect(depsWidgets.every(w => w.category === 'dependencies')).toBe(true);
    });
  });
});

// ============================================================================
// Layout Operations Advanced Tests
// ============================================================================

describe('Layout Operations Advanced', () => {
  it('should update widget settings correctly', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.updateWidget('widget-1', {
        settings: { customSetting: 'value' }
      });
    });

    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({
            instanceId: 'widget-1',
            settings: { customSetting: 'value' },
          }),
        ]),
      })
    );
  });

  it('should handle updating non-existent widget gracefully', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.updateWidget('non-existent', { size: 'large' });
    });

    // Should still call onLayoutChange, but widget won't be found/modified
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: mockLayout.widgets,
      })
    );
  });

  it('should handle removing non-existent widget', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.removeWidget('non-existent');
    });

    // Should call onLayoutChange with original widgets (nothing removed)
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        widgets: mockLayout.widgets,
      })
    );
  });

  it('should preserve other widget properties when updating', () => {
    const onLayoutChange = vi.fn();

    const { result } = renderHook(() =>
      useLayoutOperations(mockLayout, onLayoutChange)
    );

    act(() => {
      result.current.updateWidget('widget-1', { visible: false });
    });

    const callArg = onLayoutChange.mock.calls[0][0];
    const updatedWidget = callArg.widgets.find((w: { instanceId: string }) => w.instanceId === 'widget-1');

    // Original properties should be preserved
    expect(updatedWidget.widgetId).toBe('quality-score');
    expect(updatedWidget.size).toBe('small');
    expect(updatedWidget.position).toEqual({ row: 0, column: 0 });
    // Updated property
    expect(updatedWidget.visible).toBe(false);
  });

  it('should handle layout with single column grid', () => {
    const singleColumnLayout: DashboardLayout = {
      ...mockLayout,
      grid: { ...mockLayout.grid, columns: 1 },
      widgets: [
        {
          instanceId: 'w1',
          widgetId: 'quality-score',
          visible: true,
          size: 'small',
          position: { row: 0, column: 0 },
          settings: {},
        },
      ],
    };

    const onLayoutChange = vi.fn();
    const mockWidgetConfig = {
      instanceId: 'new-widget',
      widgetId: 'coverage-summary' as const,
      visible: true,
      size: 'small' as const,
      position: { row: 1, column: 0 },
      settings: {},
    };

    vi.mocked(personalizationApi.createWidgetInstance).mockReturnValue(
      mockWidgetConfig
    );

    const { result } = renderHook(() =>
      useLayoutOperations(singleColumnLayout, onLayoutChange)
    );

    act(() => {
      result.current.addWidget('coverage-summary');
    });

    // With single column, next available position should be row 1, column 0
    expect(personalizationApi.createWidgetInstance).toHaveBeenCalledWith(
      'coverage-summary',
      { row: 1, column: 0 }
    );
  });
});
