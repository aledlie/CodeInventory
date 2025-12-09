/**
 * Dashboard Personalization Types
 *
 * Phase 5B: Dashboard Personalization
 * Type definitions for widget library, saved views, and dashboard customization.
 */

// ============================================================================
// Widget Configuration Types
// ============================================================================

/**
 * Available widget identifiers
 */
export type WidgetId =
  | 'quality-score'
  | 'coverage-summary'
  | 'dependency-health'
  | 'critical-issues'
  | 'recent-trends'
  | 'ai-insights'
  | 'predictions'
  | 'circular-deps'
  | 'untested-functions'
  | 'team-activity'
  | 'notifications'
  | 'quick-actions';

/**
 * Widget category for organization
 */
export type WidgetCategory =
  | 'metrics'
  | 'quality'
  | 'coverage'
  | 'dependencies'
  | 'ai'
  | 'collaboration';

/**
 * Widget size options
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

/**
 * Widget metadata
 */
export interface WidgetMetadata {
  /** Widget identifier */
  id: WidgetId;
  /** Display name */
  name: string;
  /** Description of what the widget shows */
  description: string;
  /** Category for grouping */
  category: WidgetCategory;
  /** Default size */
  defaultSize: WidgetSize;
  /** Available sizes */
  availableSizes: WidgetSize[];
  /** Whether widget can be resized */
  resizable: boolean;
  /** Icon name (MUI icon) */
  icon: string;
  /** Minimum data refresh interval (ms) */
  minRefreshInterval: number;
  /** Whether widget is premium/advanced */
  isPremium: boolean;
}

/**
 * Widget instance configuration
 */
export interface WidgetConfig {
  /** Unique instance ID (allows multiple of same widget type) */
  instanceId: string;
  /** Widget type ID */
  widgetId: WidgetId;
  /** Whether widget is visible */
  visible: boolean;
  /** Current size */
  size: WidgetSize;
  /** Position in grid (row, column) */
  position: {
    row: number;
    column: number;
  };
  /** Widget-specific settings */
  settings: Record<string, unknown>;
  /** Custom refresh interval override */
  refreshInterval?: number;
}

/**
 * Widget with full metadata (for rendering)
 */
export interface WidgetInstance extends WidgetConfig {
  /** Full widget metadata */
  metadata: WidgetMetadata;
}

// ============================================================================
// Dashboard Layout Types
// ============================================================================

/**
 * Grid layout configuration
 */
export interface GridLayout {
  /** Number of columns */
  columns: number;
  /** Row height in pixels */
  rowHeight: number;
  /** Gap between widgets in pixels */
  gap: number;
  /** Padding around grid */
  padding: number;
}

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoint {
  /** Breakpoint name */
  name: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Minimum width in pixels */
  minWidth: number;
  /** Number of columns at this breakpoint */
  columns: number;
  /** Row height at this breakpoint */
  rowHeight: number;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  /** Unique layout ID */
  id: string;
  /** Layout name */
  name: string;
  /** Grid configuration */
  grid: GridLayout;
  /** Responsive breakpoints */
  breakpoints: ResponsiveBreakpoint[];
  /** Widget configurations */
  widgets: WidgetConfig[];
}

// ============================================================================
// Saved Views Types
// ============================================================================

/**
 * Saved dashboard view
 */
export interface SavedView {
  /** Unique view ID */
  id: string;
  /** View name */
  name: string;
  /** View description */
  description?: string;
  /** Dashboard layout configuration */
  layout: DashboardLayout;
  /** Is this the default view */
  isDefault: boolean;
  /** Is this view shared with team */
  isShared: boolean;
  /** View creator user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** View thumbnail (base64 or URL) */
  thumbnail?: string;
  /** Tags for organization */
  tags?: string[];
}

/**
 * Shared view with permissions
 */
export interface SharedView extends SavedView {
  /** Share permissions */
  permissions: ViewPermission[];
  /** Share link (if publicly shareable) */
  shareLink?: string;
  /** Expiration date for share link */
  shareExpiration?: string;
}

/**
 * View permission entry
 */
export interface ViewPermission {
  /** User or team ID */
  principalId: string;
  /** Principal type */
  principalType: 'user' | 'team';
  /** Permission level */
  permission: 'view' | 'edit' | 'admin';
}

// ============================================================================
// User Preferences Types
// ============================================================================

/**
 * Dashboard theme preference
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Data refresh settings
 */
export interface RefreshSettings {
  /** Auto-refresh enabled */
  enabled: boolean;
  /** Refresh interval in milliseconds */
  intervalMs: number;
  /** Pause refresh when tab is not visible */
  pauseWhenHidden: boolean;
}

/**
 * User dashboard preferences
 */
export interface DashboardPreferences {
  /** User ID */
  userId: string;
  /** Default view ID */
  defaultViewId: string | null;
  /** Theme preference */
  theme: ThemePreference;
  /** Data refresh settings */
  refresh: RefreshSettings;
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Show welcome banner */
  showWelcomeBanner: boolean;
  /** Compact mode (denser UI) */
  compactMode: boolean;
  /** Animation settings */
  animations: {
    enabled: boolean;
    reducedMotion: boolean;
  };
  /** Last modified timestamp */
  updatedAt: string;
}

// ============================================================================
// Notification Preference Types (extends existing)
// ============================================================================

/**
 * Widget-specific notification preferences
 */
export interface WidgetNotificationPreference {
  /** Widget ID */
  widgetId: WidgetId;
  /** Enable notifications for this widget */
  enabled: boolean;
  /** Minimum threshold for notification */
  threshold?: number;
  /** Change percentage to trigger notification */
  changeThreshold?: number;
  /** Notification frequency limit (max per hour) */
  maxPerHour: number;
}

/**
 * Dashboard notification settings
 */
export interface DashboardNotificationSettings {
  /** Global enable/disable */
  enabled: boolean;
  /** Sound enabled */
  soundEnabled: boolean;
  /** Desktop notifications */
  desktopNotifications: boolean;
  /** Widget-specific settings */
  widgetSettings: WidgetNotificationPreference[];
  /** Quiet hours */
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  /** Digest mode */
  digestMode: 'immediate' | 'hourly' | 'daily';
}

// ============================================================================
// Drag and Drop Types
// ============================================================================

/**
 * Drag item for widget reordering
 */
export interface DragWidgetItem {
  /** Item type */
  type: 'widget';
  /** Widget instance ID */
  instanceId: string;
  /** Widget type ID */
  widgetId: WidgetId;
  /** Original position */
  originalPosition: {
    row: number;
    column: number;
  };
}

/**
 * Drop target zone
 */
export interface DropZone {
  /** Zone ID */
  id: string;
  /** Position in grid */
  position: {
    row: number;
    column: number;
  };
  /** Whether zone is occupied */
  occupied: boolean;
  /** Accepts widget of size */
  acceptsSizes: WidgetSize[];
}

// ============================================================================
// Dashboard Editor Types
// ============================================================================

/**
 * Editor mode
 */
export type EditorMode = 'view' | 'edit' | 'preview';

/**
 * Editor state
 */
export interface EditorState {
  /** Current mode */
  mode: EditorMode;
  /** Currently selected widget instance ID */
  selectedWidgetId: string | null;
  /** Currently hovered widget instance ID */
  hoveredWidgetId: string | null;
  /** Is dragging */
  isDragging: boolean;
  /** Has unsaved changes */
  hasUnsavedChanges: boolean;
  /** Undo stack */
  undoStack: DashboardLayout[];
  /** Redo stack */
  redoStack: DashboardLayout[];
}

/**
 * Widget panel state (for widget library sidebar)
 */
export interface WidgetPanelState {
  /** Panel open state */
  isOpen: boolean;
  /** Selected category filter */
  selectedCategory: WidgetCategory | 'all';
  /** Search query */
  searchQuery: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * WidgetLibrary component props
 */
export interface WidgetLibraryProps {
  /** Available widgets */
  widgets: WidgetMetadata[];
  /** Currently active widgets */
  activeWidgets: WidgetConfig[];
  /** Toggle widget visibility */
  onToggleWidget: (widgetId: WidgetId, visible: boolean) => void;
  /** Add new widget instance */
  onAddWidget: (widgetId: WidgetId) => void;
  /** Remove widget instance */
  onRemoveWidget: (instanceId: string) => void;
  /** Category filter */
  selectedCategory?: WidgetCategory | 'all';
  /** Category change handler */
  onCategoryChange?: (category: WidgetCategory | 'all') => void;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * SavedViewsDropdown component props
 */
export interface SavedViewsDropdownProps {
  /** Available views */
  views: SavedView[];
  /** Currently active view ID */
  activeViewId: string | null;
  /** Select view handler */
  onSelectView: (viewId: string) => void;
  /** Create new view handler */
  onCreateView: (name: string, description?: string) => void;
  /** Delete view handler */
  onDeleteView: (viewId: string) => void;
  /** Rename view handler */
  onRenameView: (viewId: string, newName: string) => void;
  /** Share view handler */
  onShareView?: (viewId: string) => void;
  /** Set default view handler */
  onSetDefault: (viewId: string) => void;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Dashboard NotificationPreferences component props
 * Named differently from notifications.ts NotificationPreferencesProps to avoid conflict
 */
export interface DashboardNotificationPreferencesProps {
  /** Current notification settings */
  settings: DashboardNotificationSettings;
  /** Update settings handler */
  onUpdateSettings: (settings: Partial<DashboardNotificationSettings>) => void;
  /** Available widgets for configuration */
  availableWidgets: WidgetMetadata[];
  /** Loading state */
  isLoading?: boolean;
}

/**
 * DashboardEditor component props
 */
export interface DashboardEditorProps {
  /** Current layout */
  layout: DashboardLayout;
  /** Available widgets */
  availableWidgets: WidgetMetadata[];
  /** Layout change handler */
  onLayoutChange: (layout: DashboardLayout) => void;
  /** Save layout handler */
  onSave: () => void;
  /** Cancel editing handler */
  onCancel: () => void;
  /** Editor mode */
  mode: EditorMode;
  /** Mode change handler */
  onModeChange: (mode: EditorMode) => void;
  /** Is saving */
  isSaving?: boolean;
}

// ============================================================================
// Store Types (for Zustand)
// ============================================================================

/**
 * Dashboard store state
 */
export interface DashboardStoreState {
  /** Current layout */
  layout: DashboardLayout;
  /** User preferences */
  preferences: DashboardPreferences;
  /** Saved views */
  savedViews: SavedView[];
  /** Active view ID */
  activeViewId: string | null;
  /** Editor state */
  editor: EditorState;
  /** Widget panel state */
  widgetPanel: WidgetPanelState;
  /** Notification settings */
  notificationSettings: DashboardNotificationSettings;
  /** Is loading initial data */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Dashboard store actions
 */
export interface DashboardStoreActions {
  // Layout actions
  setLayout: (layout: DashboardLayout) => void;
  updateWidget: (instanceId: string, updates: Partial<WidgetConfig>) => void;
  addWidget: (widgetId: WidgetId) => void;
  removeWidget: (instanceId: string) => void;
  moveWidget: (instanceId: string, newPosition: { row: number; column: number }) => void;
  resizeWidget: (instanceId: string, newSize: WidgetSize) => void;

  // View actions
  loadView: (viewId: string) => void;
  saveCurrentView: (name?: string, description?: string) => Promise<void>;
  deleteView: (viewId: string) => Promise<void>;
  setDefaultView: (viewId: string) => void;

  // Preferences actions
  updatePreferences: (updates: Partial<DashboardPreferences>) => void;
  updateNotificationSettings: (updates: Partial<DashboardNotificationSettings>) => void;

  // Editor actions
  setEditorMode: (mode: EditorMode) => void;
  selectWidget: (instanceId: string | null) => void;
  undo: () => void;
  redo: () => void;

  // Widget panel actions
  toggleWidgetPanel: () => void;
  setWidgetPanelCategory: (category: WidgetCategory | 'all') => void;
  setWidgetPanelSearch: (query: string) => void;

  // Initialization
  initialize: () => Promise<void>;
  reset: () => void;
}

/**
 * Complete dashboard store type
 */
export type DashboardStore = DashboardStoreState & DashboardStoreActions;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * API response for saved views
 */
export interface SavedViewsResponse {
  views: SavedView[];
  defaultViewId: string | null;
}

/**
 * API response for user preferences
 */
export interface PreferencesResponse {
  preferences: DashboardPreferences;
  notificationSettings: DashboardNotificationSettings;
}
