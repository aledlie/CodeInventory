/**
 * Personalization API Service Tests
 *
 * Phase 5B: Dashboard Personalization
 * Tests for saved views, layouts, preferences, and widget management.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import {
  personalizationApi,
  WIDGET_METADATA,
  fetchSavedViews,
  fetchSavedView,
  createSavedView,
  updateSavedView,
  deleteSavedView,
  setActiveView,
  getActiveViewId,
  fetchPreferences,
  updatePreferences,
  updateNotificationSettings,
  fetchWidgetMetadata,
  fetchWidgetsByCategory,
  createWidgetInstance,
  validateLayout,
  getDefaultLayout,
} from '../personalizationApi';
import type {
  SavedView,
  DashboardLayout,
  DashboardPreferences,
  DashboardNotificationSettings,
  WidgetConfig,
  WidgetCategory,
} from '../../types';

// ============================================================================
// Test Constants
// ============================================================================

const STORAGE_KEYS = {
  VIEWS: 'dashboard_saved_views',
  PREFERENCES: 'dashboard_preferences',
  NOTIFICATIONS: 'dashboard_notification_settings',
  ACTIVE_VIEW: 'dashboard_active_view',
} as const;

const TOTAL_WIDGET_COUNT = 12;
const QUALITY_CATEGORY_COUNT = 2;
const COVERAGE_CATEGORY_COUNT = 2;
const DEPENDENCIES_CATEGORY_COUNT = 2;
const AI_CATEGORY_COUNT = 2;
const COLLABORATION_CATEGORY_COUNT = 2;
const METRICS_CATEGORY_COUNT = 2;

const DEFAULT_GRID_COLUMNS = 2;
const DEFAULT_ROW_HEIGHT = 200;
const DEFAULT_GAP = 16;
const DEFAULT_PADDING = 24;
const DEFAULT_BREAKPOINT_COUNT = 5;
const DEFAULT_WIDGET_COUNT = 6;

const DEFAULT_REFRESH_INTERVAL_MS = 300000;
const TEST_TIMESTAMP = '2024-01-15T12:00:00.000Z';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch - store original and restore in afterEach
const originalFetch = global.fetch;
const mockFetch = vi.fn();

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

// Mock Date.now for consistent timestamps
const mockDateNow = 1705320000000; // 2024-01-15T12:00:00.000Z
vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);
vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(TEST_TIMESTAMP);

// ============================================================================
// Helper Functions
// ============================================================================

function createMockSavedView(overrides: Partial<SavedView> = {}): SavedView {
  return {
    id: 'test-view-1',
    name: 'Test View',
    description: 'A test view',
    layout: createMockLayout(),
    isDefault: false,
    isShared: false,
    createdBy: 'test-user',
    createdAt: TEST_TIMESTAMP,
    updatedAt: TEST_TIMESTAMP,
    tags: ['test'],
    ...overrides,
  };
}

function createMockLayout(overrides: Partial<DashboardLayout> = {}): DashboardLayout {
  return {
    id: 'test-layout',
    name: 'Test Layout',
    grid: {
      columns: DEFAULT_GRID_COLUMNS,
      rowHeight: DEFAULT_ROW_HEIGHT,
      gap: DEFAULT_GAP,
      padding: DEFAULT_PADDING,
    },
    breakpoints: [
      { name: 'xs', minWidth: 0, columns: 1, rowHeight: 150 },
      { name: 'sm', minWidth: 600, columns: 1, rowHeight: 180 },
      { name: 'md', minWidth: 900, columns: 2, rowHeight: 200 },
      { name: 'lg', minWidth: 1200, columns: 2, rowHeight: 220 },
      { name: 'xl', minWidth: 1536, columns: 3, rowHeight: 240 },
    ],
    widgets: [
      {
        instanceId: 'quality-score-1',
        widgetId: 'quality-score',
        visible: true,
        size: 'small',
        position: { row: 0, column: 0 },
        settings: {},
      },
    ],
    ...overrides,
  };
}

function createMockPreferences(
  overrides: Partial<DashboardPreferences> = {}
): DashboardPreferences {
  return {
    userId: 'test-user',
    defaultViewId: null,
    theme: 'system',
    refresh: {
      enabled: true,
      intervalMs: DEFAULT_REFRESH_INTERVAL_MS,
      pauseWhenHidden: true,
    },
    sidebarCollapsed: false,
    showWelcomeBanner: true,
    compactMode: false,
    animations: {
      enabled: true,
      reducedMotion: false,
    },
    updatedAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

function createMockNotificationSettings(
  overrides: Partial<DashboardNotificationSettings> = {}
): DashboardNotificationSettings {
  return {
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
      timezone: 'America/New_York',
    },
    digestMode: 'immediate',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('personalizationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Widget Metadata Tests
  // ==========================================================================

  describe('WIDGET_METADATA', () => {
    it('should contain all expected widgets', () => {
      expect(WIDGET_METADATA).toHaveLength(TOTAL_WIDGET_COUNT);
    });

    it('should have unique widget IDs', () => {
      const ids = WIDGET_METADATA.map((w) => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid categories for all widgets', () => {
      const validCategories: WidgetCategory[] = [
        'metrics',
        'quality',
        'coverage',
        'dependencies',
        'ai',
        'collaboration',
      ];

      WIDGET_METADATA.forEach((widget) => {
        expect(validCategories).toContain(widget.category);
      });
    });

    it('should have default size in available sizes for all widgets', () => {
      WIDGET_METADATA.forEach((widget) => {
        expect(widget.availableSizes).toContain(widget.defaultSize);
      });
    });

    it('should have valid refresh intervals', () => {
      WIDGET_METADATA.forEach((widget) => {
        expect(widget.minRefreshInterval).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include required premium widgets', () => {
      const premiumWidgets = WIDGET_METADATA.filter((w) => w.isPremium);
      expect(premiumWidgets.length).toBeGreaterThan(0);

      const premiumIds = premiumWidgets.map((w) => w.id);
      expect(premiumIds).toContain('ai-insights');
      expect(premiumIds).toContain('predictions');
    });
  });

  describe('fetchWidgetMetadata', () => {
    it('should return all widget metadata', async () => {
      const result = await fetchWidgetMetadata();
      expect(result).toEqual(WIDGET_METADATA);
      expect(result).toHaveLength(TOTAL_WIDGET_COUNT);
    });
  });

  describe('fetchWidgetsByCategory', () => {
    it('should return quality widgets', async () => {
      const result = await fetchWidgetsByCategory('quality');
      expect(result).toHaveLength(QUALITY_CATEGORY_COUNT);
      result.forEach((widget) => {
        expect(widget.category).toBe('quality');
      });
    });

    it('should return coverage widgets', async () => {
      const result = await fetchWidgetsByCategory('coverage');
      expect(result).toHaveLength(COVERAGE_CATEGORY_COUNT);
      result.forEach((widget) => {
        expect(widget.category).toBe('coverage');
      });
    });

    it('should return dependencies widgets', async () => {
      const result = await fetchWidgetsByCategory('dependencies');
      expect(result).toHaveLength(DEPENDENCIES_CATEGORY_COUNT);
      result.forEach((widget) => {
        expect(widget.category).toBe('dependencies');
      });
    });

    it('should return AI widgets', async () => {
      const result = await fetchWidgetsByCategory('ai');
      expect(result).toHaveLength(AI_CATEGORY_COUNT);
      result.forEach((widget) => {
        expect(widget.category).toBe('ai');
      });
    });

    it('should return collaboration widgets', async () => {
      const result = await fetchWidgetsByCategory('collaboration');
      expect(result).toHaveLength(COLLABORATION_CATEGORY_COUNT);
      result.forEach((widget) => {
        expect(widget.category).toBe('collaboration');
      });
    });

    it('should return metrics widgets', async () => {
      const result = await fetchWidgetsByCategory('metrics');
      expect(result).toHaveLength(METRICS_CATEGORY_COUNT);
      result.forEach((widget) => {
        expect(widget.category).toBe('metrics');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const result = await fetchWidgetsByCategory('nonexistent' as WidgetCategory);
      expect(result).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Widget Instance Tests
  // ==========================================================================

  describe('createWidgetInstance', () => {
    it('should create a widget instance with default size', () => {
      const position = { row: 0, column: 0 };
      const result = createWidgetInstance('quality-score', position);

      expect(result.widgetId).toBe('quality-score');
      expect(result.position).toEqual(position);
      expect(result.size).toBe('small'); // Default size for quality-score
      expect(result.visible).toBe(true);
      expect(result.settings).toEqual({});
      expect(result.instanceId).toContain('quality-score-');
    });

    it('should create a widget instance with custom size', () => {
      const position = { row: 1, column: 1 };
      const result = createWidgetInstance('coverage-summary', position, 'large');

      expect(result.widgetId).toBe('coverage-summary');
      expect(result.size).toBe('large');
      expect(result.position).toEqual(position);
    });

    it('should throw error for unknown widget ID', () => {
      const position = { row: 0, column: 0 };
      expect(() => {
        createWidgetInstance('unknown-widget' as any, position);
      }).toThrow('Unknown widget ID: unknown-widget');
    });

    it('should generate unique instance IDs with different timestamps', () => {
      const position = { row: 0, column: 0 };

      // First call with initial timestamp
      vi.spyOn(Date, 'now').mockReturnValueOnce(mockDateNow);
      const instance1 = createWidgetInstance('quality-score', position);

      // Second call with different timestamp
      vi.spyOn(Date, 'now').mockReturnValueOnce(mockDateNow + 1);
      const instance2 = createWidgetInstance('quality-score', position);

      expect(instance1.instanceId).not.toBe(instance2.instanceId);
      expect(instance1.instanceId).toContain('quality-score-');
      expect(instance2.instanceId).toContain('quality-score-');
    });
  });

  // ==========================================================================
  // Layout Validation Tests
  // ==========================================================================

  describe('validateLayout', () => {
    it('should validate a correct layout', () => {
      const layout = createMockLayout();
      const result = validateLayout(layout);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing layout ID', () => {
      const layout = createMockLayout({ id: '' });
      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout ID is required');
    });

    it('should detect missing layout name', () => {
      const layout = createMockLayout({ name: '' });
      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout name is required');
    });

    it('should detect empty widgets array', () => {
      const layout = createMockLayout({ widgets: [] });
      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout must have at least one widget');
    });

    it('should detect duplicate widget instance IDs', () => {
      const layout = createMockLayout({
        widgets: [
          {
            instanceId: 'duplicate-id',
            widgetId: 'quality-score',
            visible: true,
            size: 'small',
            position: { row: 0, column: 0 },
            settings: {},
          },
          {
            instanceId: 'duplicate-id',
            widgetId: 'coverage-summary',
            visible: true,
            size: 'small',
            position: { row: 0, column: 1 },
            settings: {},
          },
        ],
      });
      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate widget instance ID: duplicate-id');
    });

    it('should detect overlapping widget positions', () => {
      const layout = createMockLayout({
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
            size: 'small',
            position: { row: 0, column: 0 },
            settings: {},
          },
        ],
      });
      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Overlapping widget positions at row 0, column 0'
      );
    });

    it('should detect multiple validation errors', () => {
      const layout = createMockLayout({
        id: '',
        name: '',
        widgets: [],
      });
      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getDefaultLayout', () => {
    it('should return a valid default layout', () => {
      const layout = getDefaultLayout();

      expect(layout.id).toBe('default');
      expect(layout.name).toBe('Default Layout');
      expect(layout.grid.columns).toBe(DEFAULT_GRID_COLUMNS);
      expect(layout.grid.rowHeight).toBe(DEFAULT_ROW_HEIGHT);
      expect(layout.grid.gap).toBe(DEFAULT_GAP);
      expect(layout.grid.padding).toBe(DEFAULT_PADDING);
    });

    it('should include expected breakpoints', () => {
      const layout = getDefaultLayout();

      expect(layout.breakpoints).toHaveLength(DEFAULT_BREAKPOINT_COUNT);
      expect(layout.breakpoints[0].name).toBe('xs');
      expect(layout.breakpoints[4].name).toBe('xl');
    });

    it('should include default widgets', () => {
      const layout = getDefaultLayout();

      expect(layout.widgets).toHaveLength(DEFAULT_WIDGET_COUNT);
      const widgetIds = layout.widgets.map((w) => w.widgetId);
      expect(widgetIds).toContain('quality-score');
      expect(widgetIds).toContain('coverage-summary');
      expect(widgetIds).toContain('dependency-health');
    });

    it('should pass validation', () => {
      const layout = getDefaultLayout();
      const result = validateLayout(layout);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Saved Views Tests
  // ==========================================================================

  describe('fetchSavedViews', () => {
    it('should fetch views from API when available', async () => {
      const mockViews = [createMockSavedView({ isDefault: true })];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ views: mockViews, defaultViewId: 'test-view-1' }),
      });

      const result = await fetchSavedViews();

      expect(result.views).toEqual(mockViews);
      expect(result.defaultViewId).toBe('test-view-1');
    });

    it('should fallback to localStorage when API fails', async () => {
      const storedViews = [createMockSavedView({ isDefault: true })];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchSavedViews();

      expect(result.views).toEqual(storedViews);
      expect(result.defaultViewId).toBe('test-view-1');
    });

    it('should return default view when no stored views', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchSavedViews();

      expect(result.views).toHaveLength(1);
      expect(result.views[0].id).toBe('default-view');
      expect(result.views[0].isDefault).toBe(true);
      expect(result.defaultViewId).toBe('default-view');
    });

    it('should handle API returning non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await fetchSavedViews();

      // Should fallback to default
      expect(result.views).toHaveLength(1);
      expect(result.views[0].id).toBe('default-view');
    });

    it('should use active view ID from localStorage', async () => {
      const storedViews = [
        createMockSavedView({ id: 'view-1', isDefault: false }),
        createMockSavedView({ id: 'view-2', isDefault: false }),
      ];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      localStorageMock.setItem(STORAGE_KEYS.ACTIVE_VIEW, 'view-2');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchSavedViews();

      expect(result.defaultViewId).toBe('view-2');
    });
  });

  describe('fetchSavedView', () => {
    it('should return view by ID', async () => {
      const storedViews = [
        createMockSavedView({ id: 'view-1', name: 'View 1' }),
        createMockSavedView({ id: 'view-2', name: 'View 2' }),
      ];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchSavedView('view-2');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('view-2');
      expect(result?.name).toBe('View 2');
    });

    it('should return null for non-existent view', async () => {
      const storedViews = [createMockSavedView({ id: 'view-1' })];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchSavedView('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createSavedView', () => {
    it('should create a new saved view', async () => {
      const storedViews = [createMockSavedView({ id: 'existing-view' })];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const newViewData = {
        name: 'New View',
        description: 'A new test view',
        layout: createMockLayout(),
        isDefault: false,
        isShared: false,
        createdBy: 'test-user',
        tags: ['new'],
      };

      const result = await createSavedView(newViewData);

      expect(result.id).toContain('view-');
      expect(result.name).toBe('New View');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify localStorage was updated
      const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.VIEWS]);
      expect(stored).toHaveLength(2);
    });

    it('should unset other default views when creating new default', async () => {
      const storedViews = [createMockSavedView({ id: 'old-default', isDefault: true })];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const newViewData = {
        name: 'New Default',
        layout: createMockLayout(),
        isDefault: true,
        isShared: false,
        createdBy: 'test-user',
      };

      await createSavedView(newViewData);

      const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.VIEWS]);
      const defaultViews = stored.filter((v: SavedView) => v.isDefault);
      expect(defaultViews).toHaveLength(1);
      expect(defaultViews[0].name).toBe('New Default');
    });
  });

  describe('updateSavedView', () => {
    it('should update an existing view', async () => {
      const storedViews = [
        createMockSavedView({ id: 'view-1', name: 'Original Name' }),
      ];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await updateSavedView('view-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for non-existent view', async () => {
      const storedViews = [createMockSavedView({ id: 'view-1' })];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateSavedView('non-existent', { name: 'Test' })).rejects.toThrow(
        'View not found'
      );
    });

    it('should unset other default views when updating to default', async () => {
      const storedViews = [
        createMockSavedView({ id: 'view-1', isDefault: true }),
        createMockSavedView({ id: 'view-2', isDefault: false }),
      ];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await updateSavedView('view-2', { isDefault: true });

      const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.VIEWS]);
      expect(stored[0].isDefault).toBe(false);
      expect(stored[1].isDefault).toBe(true);
    });
  });

  describe('deleteSavedView', () => {
    it('should delete a view', async () => {
      const storedViews = [
        createMockSavedView({ id: 'view-1' }),
        createMockSavedView({ id: 'view-2' }),
      ];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await deleteSavedView('view-1');

      const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.VIEWS]);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('view-2');
    });

    it('should throw error for non-existent view', async () => {
      const storedViews = [createMockSavedView({ id: 'view-1' })];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(deleteSavedView('non-existent')).rejects.toThrow('View not found');
    });

    it('should throw error when deleting last view', async () => {
      const storedViews = [createMockSavedView({ id: 'only-view' })];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(deleteSavedView('only-view')).rejects.toThrow(
        'Cannot delete the last view'
      );
    });

    it('should set new default when deleting default view', async () => {
      const storedViews = [
        createMockSavedView({ id: 'view-1', isDefault: true }),
        createMockSavedView({ id: 'view-2', isDefault: false }),
      ];
      localStorageMock.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(storedViews));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await deleteSavedView('view-1');

      const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.VIEWS]);
      expect(stored[0].isDefault).toBe(true);
    });
  });

  describe('setActiveView', () => {
    it('should store active view ID in localStorage', async () => {
      await setActiveView('my-view-id');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACTIVE_VIEW,
        'my-view-id'
      );
    });
  });

  describe('getActiveViewId', () => {
    it('should retrieve active view ID from localStorage', async () => {
      localStorageMock.setItem(STORAGE_KEYS.ACTIVE_VIEW, 'stored-view-id');

      const result = await getActiveViewId();

      expect(result).toBe('stored-view-id');
    });

    it('should return null when no active view is stored', async () => {
      const result = await getActiveViewId();

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Preferences Tests
  // ==========================================================================

  describe('fetchPreferences', () => {
    it('should fetch preferences from API when available', async () => {
      const mockPreferences = createMockPreferences();
      const mockNotifications = createMockNotificationSettings();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            preferences: mockPreferences,
            notificationSettings: mockNotifications,
          }),
      });

      const result = await fetchPreferences();

      expect(result.preferences).toEqual(mockPreferences);
      expect(result.notificationSettings).toEqual(mockNotifications);
    });

    it('should fallback to localStorage when API fails', async () => {
      const storedPrefs = createMockPreferences({ theme: 'dark' });
      const storedNotifications = createMockNotificationSettings({ enabled: false });
      localStorageMock.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(storedPrefs));
      localStorageMock.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(storedNotifications)
      );
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchPreferences();

      expect(result.preferences.theme).toBe('dark');
      expect(result.notificationSettings.enabled).toBe(false);
    });

    it('should return defaults when no stored preferences', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchPreferences();

      expect(result.preferences.theme).toBe('system');
      expect(result.preferences.refresh.enabled).toBe(true);
      expect(result.preferences.refresh.intervalMs).toBe(DEFAULT_REFRESH_INTERVAL_MS);
      expect(result.notificationSettings.enabled).toBe(true);
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences in localStorage', async () => {
      const storedPrefs = createMockPreferences();
      localStorageMock.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(storedPrefs));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await updatePreferences({ theme: 'dark', compactMode: true });

      expect(result.theme).toBe('dark');
      expect(result.compactMode).toBe(true);
      expect(result.updatedAt).toBeDefined();

      const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.PREFERENCES]);
      expect(stored.theme).toBe('dark');
    });

    it('should preserve unmodified preferences', async () => {
      const storedPrefs = createMockPreferences({
        sidebarCollapsed: true,
        showWelcomeBanner: false,
      });
      localStorageMock.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(storedPrefs));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await updatePreferences({ theme: 'dark' });

      expect(result.sidebarCollapsed).toBe(true);
      expect(result.showWelcomeBanner).toBe(false);
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings in localStorage', async () => {
      const storedNotifications = createMockNotificationSettings();
      localStorageMock.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(storedNotifications)
      );
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await updateNotificationSettings({
        enabled: false,
        soundEnabled: true,
      });

      expect(result.enabled).toBe(false);
      expect(result.soundEnabled).toBe(true);

      const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.NOTIFICATIONS]);
      expect(stored.enabled).toBe(false);
    });

    it('should preserve widget-specific settings', async () => {
      const storedNotifications = createMockNotificationSettings();
      localStorageMock.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(storedNotifications)
      );
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await updateNotificationSettings({ digestMode: 'hourly' });

      expect(result.widgetSettings).toHaveLength(TOTAL_WIDGET_COUNT);
      expect(result.digestMode).toBe('hourly');
    });
  });

  // ==========================================================================
  // API Object Tests
  // ==========================================================================

  describe('personalizationApi object', () => {
    it('should export all view functions', () => {
      expect(personalizationApi.fetchSavedViews).toBe(fetchSavedViews);
      expect(personalizationApi.fetchSavedView).toBe(fetchSavedView);
      expect(personalizationApi.createSavedView).toBe(createSavedView);
      expect(personalizationApi.updateSavedView).toBe(updateSavedView);
      expect(personalizationApi.deleteSavedView).toBe(deleteSavedView);
      expect(personalizationApi.setActiveView).toBe(setActiveView);
      expect(personalizationApi.getActiveViewId).toBe(getActiveViewId);
    });

    it('should export all preference functions', () => {
      expect(personalizationApi.fetchPreferences).toBe(fetchPreferences);
      expect(personalizationApi.updatePreferences).toBe(updatePreferences);
      expect(personalizationApi.updateNotificationSettings).toBe(
        updateNotificationSettings
      );
    });

    it('should export all widget functions', () => {
      expect(personalizationApi.fetchWidgetMetadata).toBe(fetchWidgetMetadata);
      expect(personalizationApi.fetchWidgetsByCategory).toBe(fetchWidgetsByCategory);
      expect(personalizationApi.createWidgetInstance).toBe(createWidgetInstance);
    });

    it('should export layout functions', () => {
      expect(personalizationApi.validateLayout).toBe(validateLayout);
      expect(personalizationApi.getDefaultLayout).toBe(getDefaultLayout);
    });

    it('should export WIDGET_METADATA', () => {
      expect(personalizationApi.WIDGET_METADATA).toBe(WIDGET_METADATA);
    });
  });
});
