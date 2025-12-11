/**
 * SettingsPage Component Tests
 *
 * Tests for the main settings page including tab navigation,
 * sub-component integration, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material';
import type {
  SavedView,
  WidgetMetadata,
  DashboardLayout,
  DashboardPreferences,
  DashboardNotificationSettings,
} from '../../types';

// ============================================================================
// Mocks
// ============================================================================

// Mock TanStack Router Link component
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock personalization hooks
vi.mock('../../hooks/usePersonalization', () => ({
  useSavedViewsManager: vi.fn(),
  usePreferencesManager: vi.fn(),
  useWidgetLibrary: vi.fn(),
}));

// Mock personalization components
vi.mock('../personalization', () => ({
  WidgetLibrary: vi.fn(({ widgets, activeWidgets, selectedCategory }) => (
    <div data-testid="widget-library">
      <span data-testid="widget-count">{widgets?.length || 0}</span>
      <span data-testid="active-widget-count">{activeWidgets?.length || 0}</span>
      <span data-testid="selected-category">{selectedCategory}</span>
    </div>
  )),
  SavedViewsDropdown: vi.fn(({ views, activeViewId }) => (
    <div data-testid="saved-views-dropdown">
      <span data-testid="views-count">{views?.length || 0}</span>
      <span data-testid="active-view-id">{activeViewId || 'none'}</span>
    </div>
  )),
  NotificationPreferences: vi.fn(({ settings }) => (
    <div data-testid="notification-preferences">
      <span data-testid="notifications-enabled">{settings?.enabled ? 'true' : 'false'}</span>
    </div>
  )),
  DashboardEditor: vi.fn(({ mode, layout }) => (
    <div data-testid="dashboard-editor">
      <span data-testid="editor-mode">{mode}</span>
      <span data-testid="layout-id">{layout?.id || 'none'}</span>
    </div>
  )),
  ThemeSettings: vi.fn(({ showPreview, showSystemInfo }) => (
    <div data-testid="theme-settings">
      <span data-testid="show-preview">{showPreview ? 'true' : 'false'}</span>
      <span data-testid="show-system-info">{showSystemInfo ? 'true' : 'false'}</span>
    </div>
  )),
}));

// Mock personalizationApi
vi.mock('../../api/personalizationApi', () => ({
  WIDGET_METADATA: [
    {
      id: 'quality-score',
      name: 'Quality Score',
      description: 'Quality score widget',
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
      description: 'Coverage widget',
      category: 'coverage',
      defaultSize: 'small',
      availableSizes: ['small', 'medium', 'large'],
      resizable: true,
      icon: 'CheckCircle',
      minRefreshInterval: 60000,
      isPremium: false,
    },
  ],
}));

// Import mocked hooks after mock setup
import { useSavedViewsManager, usePreferencesManager, useWidgetLibrary } from '../../hooks/usePersonalization';

// Import component after mocks
import { SettingsPage } from '../SettingsPage';

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

const mockWidgets: WidgetMetadata[] = [
  {
    id: 'quality-score',
    name: 'Quality Score',
    description: 'Quality score widget',
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
    description: 'Coverage widget',
    category: 'coverage',
    defaultSize: 'small',
    availableSizes: ['small', 'medium', 'large'],
    resizable: true,
    icon: 'CheckCircle',
    minRefreshInterval: 60000,
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

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  const theme = createTheme();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

function setupMocks(overrides?: {
  savedViewsManager?: Partial<ReturnType<typeof useSavedViewsManager>>;
  preferencesManager?: Partial<ReturnType<typeof usePreferencesManager>>;
  widgetLibrary?: Partial<ReturnType<typeof useWidgetLibrary>>;
}) {
  const defaultSavedViewsManager = {
    views: [mockSavedView],
    defaultViewId: 'view-1',
    activeViewId: 'view-1',
    activeView: mockSavedView,
    createView: vi.fn(),
    updateView: vi.fn(),
    deleteView: vi.fn(),
    selectView: vi.fn(),
    setDefault: vi.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isSelecting: false,
  };

  const defaultPreferencesManager = {
    preferences: mockPreferences,
    notificationSettings: mockNotificationSettings,
    updatePreferences: vi.fn(),
    updateNotifications: vi.fn(),
    isUpdatingPreferences: false,
    isUpdatingNotifications: false,
  };

  const defaultWidgetLibrary = {
    widgets: mockWidgets,
    categories: ['quality', 'coverage'],
    getWidgetsByCategory: vi.fn((category) =>
      category === 'all' ? mockWidgets : mockWidgets.filter((w) => w.category === category)
    ),
    getWidgetById: vi.fn((id) => mockWidgets.find((w) => w.id === id)),
  };

  vi.mocked(useSavedViewsManager).mockReturnValue({
    ...defaultSavedViewsManager,
    ...overrides?.savedViewsManager,
  } as ReturnType<typeof useSavedViewsManager>);

  vi.mocked(usePreferencesManager).mockReturnValue({
    ...defaultPreferencesManager,
    ...overrides?.preferencesManager,
  } as ReturnType<typeof usePreferencesManager>);

  vi.mocked(useWidgetLibrary).mockReturnValue({
    ...defaultWidgetLibrary,
    ...overrides?.widgetLibrary,
  } as ReturnType<typeof useWidgetLibrary>);

  return {
    savedViewsManager: { ...defaultSavedViewsManager, ...overrides?.savedViewsManager },
    preferencesManager: { ...defaultPreferencesManager, ...overrides?.preferencesManager },
    widgetLibrary: { ...defaultWidgetLibrary, ...overrides?.widgetLibrary },
  };
}

// ============================================================================
// Main Component Tests
// ============================================================================

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  describe('Rendering', () => {
    it('should render the settings page with header', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Dashboard Settings')).toBeInTheDocument();
      expect(
        screen.getByText(/Customize your dashboard layout/)
      ).toBeInTheDocument();
    });

    it('should render breadcrumbs navigation', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render all four tabs', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByRole('tab', { name: /Widget Library/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Saved Views/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Appearance/i })).toBeInTheDocument();
    });

    it('should render Widget Library tab as active by default', () => {
      renderWithProviders(<SettingsPage />);

      const widgetLibraryTab = screen.getByRole('tab', { name: /Widget Library/i });
      expect(widgetLibraryTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Saved Views tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      const savedViewsTab = screen.getByRole('tab', { name: /Saved Views/i });
      await user.click(savedViewsTab);

      expect(savedViewsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('saved-views-dropdown')).toBeInTheDocument();
    });

    it('should switch to Notifications tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      const notificationsTab = screen.getByRole('tab', { name: /Notifications/i });
      await user.click(notificationsTab);

      expect(notificationsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });

    it('should switch to Appearance tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      const appearanceTab = screen.getByRole('tab', { name: /Appearance/i });
      await user.click(appearanceTab);

      expect(appearanceTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('theme-settings')).toBeInTheDocument();
    });

    it('should hide previous tab content when switching tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      // Initially on Widget Library tab - content visible
      expect(screen.getByTestId('widget-library')).toBeVisible();

      // Switch to Saved Views
      await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

      // Widget Library panel should be hidden (panel still exists but hidden)
      const widgetLibraryPanel = document.getElementById('settings-tabpanel-0');
      expect(widgetLibraryPanel).toHaveAttribute('hidden');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria attributes on tabs', () => {
      renderWithProviders(<SettingsPage />);

      const tabs = screen.getAllByRole('tab');

      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('id', `settings-tab-${index}`);
        expect(tab).toHaveAttribute('aria-controls', `settings-tabpanel-${index}`);
      });
    });

    it('should have proper tabpanel attributes', () => {
      renderWithProviders(<SettingsPage />);

      // Check active panel (index 0)
      const activePanel = screen.getByRole('tabpanel');
      expect(activePanel).toHaveAttribute('id', 'settings-tabpanel-0');
      expect(activePanel).toHaveAttribute('aria-labelledby', 'settings-tab-0');
    });

    it('should have accessible breadcrumb links', () => {
      renderWithProviders(<SettingsPage />);

      // MUI Breadcrumbs renders as a navigation element
      const breadcrumbs = screen.getByRole('navigation');
      expect(breadcrumbs).toBeInTheDocument();

      // Verify breadcrumb links are accessible
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    });
  });
});

// ============================================================================
// WidgetLibraryContent Tests
// ============================================================================

describe('WidgetLibraryContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render widget library with correct props', () => {
    setupMocks();
    renderWithProviders(<SettingsPage />);

    expect(screen.getByTestId('widget-library')).toBeInTheDocument();
    expect(screen.getByTestId('widget-count')).toHaveTextContent('2');
    expect(screen.getByTestId('active-widget-count')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-category')).toHaveTextContent('all');
  });

  it('should pass active widgets from active view', () => {
    const mockViewWithWidgets = {
      ...mockSavedView,
      layout: {
        ...mockLayout,
        widgets: [
          {
            instanceId: 'w1',
            widgetId: 'quality-score' as const,
            visible: true,
            size: 'small' as const,
            position: { row: 0, column: 0 },
            settings: {},
          },
          {
            instanceId: 'w2',
            widgetId: 'coverage-summary' as const,
            visible: true,
            size: 'medium' as const,
            position: { row: 0, column: 1 },
            settings: {},
          },
        ],
      },
    };

    setupMocks({
      savedViewsManager: {
        activeView: mockViewWithWidgets,
      },
    });

    renderWithProviders(<SettingsPage />);

    expect(screen.getByTestId('active-widget-count')).toHaveTextContent('2');
  });

  it('should handle missing active view gracefully', () => {
    setupMocks({
      savedViewsManager: {
        activeView: undefined,
        activeViewId: null,
      },
    });

    renderWithProviders(<SettingsPage />);

    expect(screen.getByTestId('active-widget-count')).toHaveTextContent('0');
  });
});

// ============================================================================
// SavedViewsContent Tests
// ============================================================================

describe('SavedViewsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render saved views dropdown and editor', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

    expect(screen.getByTestId('saved-views-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-editor')).toBeInTheDocument();
  });

  it('should display correct views count', async () => {
    const user = userEvent.setup();
    setupMocks({
      savedViewsManager: {
        views: [mockSavedView, { ...mockSavedView, id: 'view-2', name: 'View 2' }],
      },
    });
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

    expect(screen.getByTestId('views-count')).toHaveTextContent('2');
  });

  it('should display active view id', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

    expect(screen.getByTestId('active-view-id')).toHaveTextContent('view-1');
  });

  it('should show editor in view mode by default', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

    expect(screen.getByTestId('editor-mode')).toHaveTextContent('view');
  });

  it('should display layout id from active view', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

    expect(screen.getByTestId('layout-id')).toHaveTextContent('default');
  });

  it('should show "Current View:" label', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

    expect(screen.getByText('Current View:')).toBeInTheDocument();
  });
});

// ============================================================================
// NotificationPreferencesContent Tests
// ============================================================================

describe('NotificationPreferencesContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification preferences component', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Notifications/i }));

    expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
  });

  it('should pass notification settings to component', async () => {
    const user = userEvent.setup();
    setupMocks({
      preferencesManager: {
        notificationSettings: {
          ...mockNotificationSettings,
          enabled: true,
        },
      },
    });
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Notifications/i }));

    expect(screen.getByTestId('notifications-enabled')).toHaveTextContent('true');
  });

  it('should display disabled state when notifications are off', async () => {
    const user = userEvent.setup();
    setupMocks({
      preferencesManager: {
        notificationSettings: {
          ...mockNotificationSettings,
          enabled: false,
        },
      },
    });
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Notifications/i }));

    expect(screen.getByTestId('notifications-enabled')).toHaveTextContent('false');
  });
});

// ============================================================================
// ThemeSettings (Appearance Tab) Tests
// ============================================================================

describe('Appearance Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render theme settings component', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Appearance/i }));

    expect(screen.getByTestId('theme-settings')).toBeInTheDocument();
  });

  it('should pass showPreview prop as true', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Appearance/i }));

    expect(screen.getByTestId('show-preview')).toHaveTextContent('true');
  });

  it('should pass showSystemInfo prop as true', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Appearance/i }));

    expect(screen.getByTestId('show-system-info')).toHaveTextContent('true');
  });
});

// ============================================================================
// Error Boundary Tests
// ============================================================================

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display error fallback when hook throws', () => {
    vi.mocked(useWidgetLibrary).mockImplementation(() => {
      throw new Error('Test error message');
    });

    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('should have retry button in error state', () => {
    vi.mocked(useWidgetLibrary).mockImplementation(() => {
      throw new Error('Hook failed');
    });

    renderWithProviders(<SettingsPage />);

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();
  });
});

// ============================================================================
// TabPanel Component Tests
// ============================================================================

describe('TabPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('should render children when value matches index', () => {
    renderWithProviders(<SettingsPage />);

    // Default tab (index 0) should be visible
    expect(screen.getByTestId('widget-library')).toBeVisible();
  });

  it('should set hidden attribute when value does not match index', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    // Switch to different tab
    await user.click(screen.getByRole('tab', { name: /Saved Views/i }));

    // Widget library panel should be hidden
    const widgetLibraryPanel = document.getElementById('settings-tabpanel-0');
    expect(widgetLibraryPanel).toHaveAttribute('hidden');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should maintain tab state during navigation', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    // Switch to Notifications tab
    await user.click(screen.getByRole('tab', { name: /Notifications/i }));
    expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();

    // Tab should remain selected
    expect(screen.getByRole('tab', { name: /Notifications/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('should call hooks on mount', () => {
    setupMocks();
    renderWithProviders(<SettingsPage />);

    expect(useWidgetLibrary).toHaveBeenCalled();
    expect(useSavedViewsManager).toHaveBeenCalled();
  });

  it('should call preferences manager when switching to notifications tab', async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByRole('tab', { name: /Notifications/i }));

    expect(usePreferencesManager).toHaveBeenCalled();
  });

  it('should render correctly with empty views list', () => {
    setupMocks({
      savedViewsManager: {
        views: [],
        activeView: undefined,
        activeViewId: null,
      },
    });

    renderWithProviders(<SettingsPage />);

    // Should still render without errors
    expect(screen.getByText('Dashboard Settings')).toBeInTheDocument();
  });

  it('should render correctly with empty widgets list', () => {
    setupMocks({
      widgetLibrary: {
        widgets: [],
        categories: [],
      },
    });

    renderWithProviders(<SettingsPage />);

    expect(screen.getByTestId('widget-count')).toHaveTextContent('0');
  });
});
