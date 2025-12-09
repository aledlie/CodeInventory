/**
 * Personalization API Service
 *
 * Phase 5B: Dashboard Personalization
 * Handles saved views, layouts, and user preferences persistence
 */

import type {
  SavedView,
  SavedViewsResponse,
  DashboardLayout,
  DashboardPreferences,
  DashboardNotificationSettings,
  PreferencesResponse,
  WidgetConfig,
  WidgetId,
  WidgetMetadata,
  WidgetCategory,
  WidgetSize,
} from '../types';

const STORAGE_KEYS = {
  VIEWS: 'dashboard_saved_views',
  PREFERENCES: 'dashboard_preferences',
  NOTIFICATIONS: 'dashboard_notification_settings',
  ACTIVE_VIEW: 'dashboard_active_view',
} as const;

// ============================================================================
// Widget Metadata (Static Configuration)
// ============================================================================

/**
 * Available widgets metadata
 */
export const WIDGET_METADATA: WidgetMetadata[] = [
  {
    id: 'quality-score',
    name: 'Quality Score',
    description: 'Overall code quality score with trend indicator',
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
    description: 'Test coverage percentage with breakdown',
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
    description: 'Dependency status and vulnerability summary',
    category: 'dependencies',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
    resizable: true,
    icon: 'AccountTree',
    minRefreshInterval: 300000,
    isPremium: false,
  },
  {
    id: 'critical-issues',
    name: 'Critical Issues',
    description: 'List of critical and high-priority issues',
    category: 'quality',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    resizable: true,
    icon: 'Error',
    minRefreshInterval: 30000,
    isPremium: false,
  },
  {
    id: 'recent-trends',
    name: 'Recent Trends',
    description: 'Trend charts for key metrics over time',
    category: 'metrics',
    defaultSize: 'large',
    availableSizes: ['medium', 'large', 'full'],
    resizable: true,
    icon: 'TrendingUp',
    minRefreshInterval: 300000,
    isPremium: false,
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'AI-powered code analysis insights',
    category: 'ai',
    defaultSize: 'medium',
    availableSizes: ['medium', 'large'],
    resizable: true,
    icon: 'Psychology',
    minRefreshInterval: 600000,
    isPremium: true,
  },
  {
    id: 'predictions',
    name: 'Predictions',
    description: 'Predictive analytics for code health',
    category: 'ai',
    defaultSize: 'medium',
    availableSizes: ['medium', 'large'],
    resizable: true,
    icon: 'Timeline',
    minRefreshInterval: 600000,
    isPremium: true,
  },
  {
    id: 'circular-deps',
    name: 'Circular Dependencies',
    description: 'Circular dependency detection and visualization',
    category: 'dependencies',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    resizable: true,
    icon: 'Loop',
    minRefreshInterval: 300000,
    isPremium: false,
  },
  {
    id: 'untested-functions',
    name: 'Untested Functions',
    description: 'List of functions without test coverage',
    category: 'coverage',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    resizable: true,
    icon: 'BugReport',
    minRefreshInterval: 60000,
    isPremium: false,
  },
  {
    id: 'team-activity',
    name: 'Team Activity',
    description: 'Recent team activity and contributions',
    category: 'collaboration',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    resizable: true,
    icon: 'Group',
    minRefreshInterval: 30000,
    isPremium: false,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Recent notifications and alerts',
    category: 'collaboration',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
    resizable: true,
    icon: 'Notifications',
    minRefreshInterval: 15000,
    isPremium: false,
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Common actions and shortcuts',
    category: 'metrics',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
    resizable: false,
    icon: 'FlashOn',
    minRefreshInterval: 0,
    isPremium: false,
  },
];

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Generate default widget configuration
 */
function createDefaultWidgetConfig(widgetId: WidgetId, index: number): WidgetConfig {
  const metadata = WIDGET_METADATA.find((w) => w.id === widgetId);
  if (!metadata) {
    throw new Error(`Unknown widget ID: ${widgetId}`);
  }

  return {
    instanceId: `${widgetId}-${Date.now()}-${index}`,
    widgetId,
    visible: true,
    size: metadata.defaultSize,
    position: {
      row: Math.floor(index / 2),
      column: index % 2,
    },
    settings: {},
  };
}

/**
 * Default dashboard layout
 */
function createDefaultLayout(): DashboardLayout {
  const defaultWidgets: WidgetId[] = [
    'quality-score',
    'coverage-summary',
    'dependency-health',
    'critical-issues',
    'recent-trends',
    'notifications',
  ];

  return {
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
      { name: 'sm', minWidth: 600, columns: 1, rowHeight: 180 },
      { name: 'md', minWidth: 900, columns: 2, rowHeight: 200 },
      { name: 'lg', minWidth: 1200, columns: 2, rowHeight: 220 },
      { name: 'xl', minWidth: 1536, columns: 3, rowHeight: 240 },
    ],
    widgets: defaultWidgets.map((id, index) => createDefaultWidgetConfig(id, index)),
  };
}

/**
 * Default user preferences
 */
function createDefaultPreferences(): DashboardPreferences {
  return {
    userId: 'current-user',
    defaultViewId: null,
    theme: 'system',
    refresh: {
      enabled: true,
      intervalMs: 300000, // 5 minutes
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
  };
}

/**
 * Default notification settings
 */
function createDefaultNotificationSettings(): DashboardNotificationSettings {
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    digestMode: 'immediate',
  };
}

/**
 * Default saved view (initial)
 */
function createDefaultView(): SavedView {
  return {
    id: 'default-view',
    name: 'Default Dashboard',
    description: 'Default dashboard layout with essential widgets',
    layout: createDefaultLayout(),
    isDefault: true,
    isShared: false,
    createdBy: 'current-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['default', 'overview'],
  };
}

// ============================================================================
// API Functions - Saved Views
// ============================================================================

/**
 * Fetch all saved views
 */
export async function fetchSavedViews(): Promise<SavedViewsResponse> {
  try {
    const response = await fetch('/data/personalization/views.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch saved views: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return from localStorage or defaults
    const stored = localStorage.getItem(STORAGE_KEYS.VIEWS);
    const activeViewId = localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);

    if (stored) {
      const views = JSON.parse(stored) as SavedView[];
      return {
        views,
        defaultViewId: views.find((v) => v.isDefault)?.id || activeViewId || null,
      };
    }

    const defaultView = createDefaultView();
    return {
      views: [defaultView],
      defaultViewId: defaultView.id,
    };
  }
}

/**
 * Fetch a single saved view by ID
 */
export async function fetchSavedView(viewId: string): Promise<SavedView | null> {
  const { views } = await fetchSavedViews();
  return views.find((v) => v.id === viewId) || null;
}

/**
 * Save a new view
 */
export async function createSavedView(
  view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedView> {
  const { views } = await fetchSavedViews();
  const now = new Date().toISOString();

  const newView: SavedView = {
    ...view,
    id: `view-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  // If this is the new default, unset others
  let updatedViews = views;
  if (newView.isDefault) {
    updatedViews = views.map((v) => ({ ...v, isDefault: false }));
  }

  updatedViews.push(newView);
  localStorage.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(updatedViews));

  return newView;
}

/**
 * Update an existing view
 */
export async function updateSavedView(
  viewId: string,
  updates: Partial<SavedView>
): Promise<SavedView> {
  const { views } = await fetchSavedViews();
  const index = views.findIndex((v) => v.id === viewId);

  if (index === -1) {
    throw new Error('View not found');
  }

  // If setting as default, unset others
  let updatedViews = views;
  if (updates.isDefault) {
    updatedViews = views.map((v) => ({ ...v, isDefault: false }));
  }

  const updated: SavedView = {
    ...updatedViews[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  updatedViews[index] = updated;
  localStorage.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(updatedViews));

  return updated;
}

/**
 * Delete a saved view
 */
export async function deleteSavedView(viewId: string): Promise<void> {
  const { views } = await fetchSavedViews();
  const filtered = views.filter((v) => v.id !== viewId);

  if (filtered.length === views.length) {
    throw new Error('View not found');
  }

  // Ensure at least one view remains
  if (filtered.length === 0) {
    throw new Error('Cannot delete the last view');
  }

  // If deleted view was default, make first remaining view default
  if (!filtered.some((v) => v.isDefault) && filtered.length > 0) {
    filtered[0].isDefault = true;
  }

  localStorage.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(filtered));
}

/**
 * Set active view
 */
export async function setActiveView(viewId: string): Promise<void> {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, viewId);
}

/**
 * Get active view ID
 */
export async function getActiveViewId(): Promise<string | null> {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);
}

// ============================================================================
// API Functions - Preferences
// ============================================================================

/**
 * Fetch user preferences
 */
export async function fetchPreferences(): Promise<PreferencesResponse> {
  try {
    const response = await fetch('/data/personalization/preferences.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch preferences: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return from localStorage or defaults
    const storedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const storedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

    return {
      preferences: storedPrefs
        ? JSON.parse(storedPrefs)
        : createDefaultPreferences(),
      notificationSettings: storedNotifications
        ? JSON.parse(storedNotifications)
        : createDefaultNotificationSettings(),
    };
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  updates: Partial<DashboardPreferences>
): Promise<DashboardPreferences> {
  const { preferences } = await fetchPreferences();

  const updated: DashboardPreferences = {
    ...preferences,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  return updated;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  updates: Partial<DashboardNotificationSettings>
): Promise<DashboardNotificationSettings> {
  const { notificationSettings } = await fetchPreferences();

  const updated: DashboardNotificationSettings = {
    ...notificationSettings,
    ...updates,
  };

  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  return updated;
}

// ============================================================================
// API Functions - Widget Management
// ============================================================================

/**
 * Get all widget metadata
 */
export async function fetchWidgetMetadata(): Promise<WidgetMetadata[]> {
  // Static metadata, could be fetched from API in the future
  return WIDGET_METADATA;
}

/**
 * Get widgets by category
 */
export async function fetchWidgetsByCategory(
  category: WidgetCategory
): Promise<WidgetMetadata[]> {
  return WIDGET_METADATA.filter((w) => w.category === category);
}

/**
 * Create new widget instance for layout
 */
export function createWidgetInstance(
  widgetId: WidgetId,
  position: { row: number; column: number },
  size?: WidgetSize
): WidgetConfig {
  const metadata = WIDGET_METADATA.find((w) => w.id === widgetId);
  if (!metadata) {
    throw new Error(`Unknown widget ID: ${widgetId}`);
  }

  return {
    instanceId: `${widgetId}-${Date.now()}`,
    widgetId,
    visible: true,
    size: size || metadata.defaultSize,
    position,
    settings: {},
  };
}

// ============================================================================
// API Functions - Layout Management
// ============================================================================

/**
 * Validate layout configuration
 */
export function validateLayout(layout: DashboardLayout): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!layout.id) {
    errors.push('Layout ID is required');
  }

  if (!layout.name) {
    errors.push('Layout name is required');
  }

  if (layout.widgets.length === 0) {
    errors.push('Layout must have at least one widget');
  }

  // Check for duplicate instance IDs
  const instanceIds = new Set<string>();
  for (const widget of layout.widgets) {
    if (instanceIds.has(widget.instanceId)) {
      errors.push(`Duplicate widget instance ID: ${widget.instanceId}`);
    }
    instanceIds.add(widget.instanceId);
  }

  // Check for overlapping positions
  const positions = new Set<string>();
  for (const widget of layout.widgets) {
    const key = `${widget.position.row}-${widget.position.column}`;
    if (positions.has(key)) {
      errors.push(`Overlapping widget positions at row ${widget.position.row}, column ${widget.position.column}`);
    }
    positions.add(key);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reset to default layout
 */
export function getDefaultLayout(): DashboardLayout {
  return createDefaultLayout();
}

// ============================================================================
// Export API Object
// ============================================================================

export const personalizationApi = {
  // Views
  fetchSavedViews,
  fetchSavedView,
  createSavedView,
  updateSavedView,
  deleteSavedView,
  setActiveView,
  getActiveViewId,

  // Preferences
  fetchPreferences,
  updatePreferences,
  updateNotificationSettings,

  // Widgets
  fetchWidgetMetadata,
  fetchWidgetsByCategory,
  createWidgetInstance,

  // Layout
  validateLayout,
  getDefaultLayout,

  // Metadata
  WIDGET_METADATA,
};
