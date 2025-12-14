/**
 * NotificationPreferences Component Tests
 *
 * Tests for the notification preferences component including:
 * - Global notification toggle
 * - Delivery channel settings (sound, desktop)
 * - Digest mode selection
 * - Quiet hours configuration
 * - Widget-specific notification settings
 * - Loading state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { NotificationPreferences } from '../NotificationPreferences';
import type {
  DashboardNotificationSettings,
  WidgetMetadata,
  WidgetNotificationPreference,
} from '../../../types';

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

const mockWidgetSettings: WidgetNotificationPreference[] = [
  {
    widgetId: 'quality-score',
    enabled: true,
    threshold: 80,
    changeThreshold: 5,
    maxPerHour: 5,
  },
  {
    widgetId: 'coverage-summary',
    enabled: false,
    maxPerHour: 3,
  },
  {
    widgetId: 'ai-insights',
    enabled: true,
    maxPerHour: 10,
  },
];

const mockSettings: DashboardNotificationSettings = {
  enabled: true,
  soundEnabled: true,
  desktopNotifications: false,
  widgetSettings: mockWidgetSettings,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    timezone: 'America/New_York',
  },
  digestMode: 'immediate',
};

const mockDisabledSettings: DashboardNotificationSettings = {
  ...mockSettings,
  enabled: false,
};

// ============================================================================
// Test Utilities
// ============================================================================

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('NotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the notification preferences header', () => {
      const onUpdateSettings = vi.fn();
      renderWithTheme(
        <NotificationPreferences
          settings={mockSettings}
          onUpdateSettings={onUpdateSettings}
          availableWidgets={mockWidgetMetadata}
        />
      );

      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });

    it('should render global enable/disable toggle', () => {
      const onUpdateSettings = vi.fn();
      renderWithTheme(
        <NotificationPreferences
          settings={mockSettings}
          onUpdateSettings={onUpdateSettings}
          availableWidgets={mockWidgetMetadata}
        />
      );

      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /enabled/i })).toBeChecked();
    });

    it('should render "Disabled" label when notifications are off', () => {
      const onUpdateSettings = vi.fn();
      renderWithTheme(
        <NotificationPreferences
          settings={mockDisabledSettings}
          onUpdateSettings={onUpdateSettings}
          availableWidgets={mockWidgetMetadata}
        />
      );

      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('should show alert when notifications are disabled', () => {
      const onUpdateSettings = vi.fn();
      renderWithTheme(
        <NotificationPreferences
          settings={mockDisabledSettings}
          onUpdateSettings={onUpdateSettings}
          availableWidgets={mockWidgetMetadata}
        />
      );

      expect(
        screen.getByText(/All notifications are currently disabled/i)
      ).toBeInTheDocument();
    });

    it('should not show alert when notifications are enabled', () => {
      const onUpdateSettings = vi.fn();
      renderWithTheme(
        <NotificationPreferences
          settings={mockSettings}
          onUpdateSettings={onUpdateSettings}
          availableWidgets={mockWidgetMetadata}
        />
      );

      expect(
        screen.queryByText(/All notifications are currently disabled/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      const onUpdateSettings = vi.fn();
      renderWithTheme(
        <NotificationPreferences
          settings={mockSettings}
          onUpdateSettings={onUpdateSettings}
          availableWidgets={mockWidgetMetadata}
          isLoading
        />
      );

      // Skeleton elements should be present
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render skeleton when not loading', () => {
      const onUpdateSettings = vi.fn();
      renderWithTheme(
        <NotificationPreferences
          settings={mockSettings}
          onUpdateSettings={onUpdateSettings}
          availableWidgets={mockWidgetMetadata}
          isLoading={false}
        />
      );

      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Global Toggle Tests
// ============================================================================

describe('NotificationPreferences Global Toggle', () => {
  it('should call onUpdateSettings with enabled: true when toggling on', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockDisabledSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const toggle = screen.getByRole('checkbox', { name: /disabled/i });
    await user.click(toggle);

    expect(onUpdateSettings).toHaveBeenCalledWith({ enabled: true });
  });

  it('should call onUpdateSettings with enabled: false when toggling off', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const toggle = screen.getByRole('checkbox', { name: /enabled/i });
    await user.click(toggle);

    expect(onUpdateSettings).toHaveBeenCalledWith({ enabled: false });
  });
});

// ============================================================================
// Delivery Channels Tests
// ============================================================================

describe('NotificationPreferences Delivery Channels', () => {
  it('should render delivery channels section', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('Delivery Channels')).toBeInTheDocument();
    expect(screen.getByText('Sound Notifications')).toBeInTheDocument();
    expect(screen.getByText('Desktop Notifications')).toBeInTheDocument();
  });

  it('should toggle sound notifications', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const soundLabel = screen.getByText('Sound Notifications');
    const soundSwitch = soundLabel.closest('label')?.querySelector('input[type="checkbox"]');
    expect(soundSwitch).toBeChecked();

    await user.click(soundSwitch!);

    expect(onUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
  });

  it('should toggle desktop notifications', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const desktopLabel = screen.getByText('Desktop Notifications');
    const desktopSwitch = desktopLabel.closest('label')?.querySelector('input[type="checkbox"]');
    expect(desktopSwitch).not.toBeChecked();

    await user.click(desktopSwitch!);

    expect(onUpdateSettings).toHaveBeenCalledWith({ desktopNotifications: true });
  });

  it('should disable channel toggles when notifications are disabled', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockDisabledSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const soundLabel = screen.getByText('Sound Notifications');
    const soundSwitch = soundLabel.closest('label')?.querySelector('input[type="checkbox"]');
    expect(soundSwitch).toBeDisabled();

    const desktopLabel = screen.getByText('Desktop Notifications');
    const desktopSwitch = desktopLabel.closest('label')?.querySelector('input[type="checkbox"]');
    expect(desktopSwitch).toBeDisabled();
  });
});

// ============================================================================
// Digest Mode Tests
// ============================================================================

describe('NotificationPreferences Digest Mode', () => {
  it('should render notification frequency section', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('Notification Frequency')).toBeInTheDocument();
    // Use getAllByText since MUI Select renders label in multiple places
    const deliveryModeElements = screen.getAllByText('Delivery Mode');
    expect(deliveryModeElements.length).toBeGreaterThan(0);
  });

  it('should show current digest mode in select', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // MUI Select uses a hidden input, check the displayed text
    expect(screen.getByText('Immediate')).toBeInTheDocument();
  });

  it('should change digest mode to hourly', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // MUI Select - click on the combobox element (has role="combobox")
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);

    // Click on the hourly option
    const hourlyOption = screen.getByRole('option', { name: /hourly digest/i });
    await user.click(hourlyOption);

    expect(onUpdateSettings).toHaveBeenCalledWith({ digestMode: 'hourly' });
  });

  it('should change digest mode to daily', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);

    const dailyOption = screen.getByRole('option', { name: /daily digest/i });
    await user.click(dailyOption);

    expect(onUpdateSettings).toHaveBeenCalledWith({ digestMode: 'daily' });
  });

  it('should show hourly mode when set', () => {
    const onUpdateSettings = vi.fn();
    const hourlySettings = { ...mockSettings, digestMode: 'hourly' as const };
    renderWithTheme(
      <NotificationPreferences
        settings={hourlySettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('Hourly Digest')).toBeInTheDocument();
  });

  it('should show daily mode when set', () => {
    const onUpdateSettings = vi.fn();
    const dailySettings = { ...mockSettings, digestMode: 'daily' as const };
    renderWithTheme(
      <NotificationPreferences
        settings={dailySettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('Daily Digest')).toBeInTheDocument();
  });
});

// ============================================================================
// Quiet Hours Tests
// ============================================================================

describe('NotificationPreferences Quiet Hours', () => {
  it('should render quiet hours section', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('Quiet Hours')).toBeInTheDocument();
  });

  it('should toggle quiet hours on and show settings', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Find the quiet hours toggle (it's in a section with AccessTimeIcon)
    const quietHoursText = screen.getByText('Quiet Hours');
    const quietHoursContainer = quietHoursText.closest('[class*="MuiBox-root"]')?.parentElement;
    const switches = quietHoursContainer?.querySelectorAll('input[type="checkbox"]');
    // The quiet hours switch should be the first small switch after the label
    const quietHoursSwitch = switches?.[0];

    await user.click(quietHoursSwitch!);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      quietHours: { ...mockSettings.quietHours, enabled: true },
    });
  });

  it('should show quiet hours time inputs when enabled', () => {
    const onUpdateSettings = vi.fn();
    const settingsWithQuietHours = {
      ...mockSettings,
      quietHours: { ...mockSettings.quietHours, enabled: true },
    };
    renderWithTheme(
      <NotificationPreferences
        settings={settingsWithQuietHours}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
    expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
  });

  it('should show timezone as disabled (read-only)', () => {
    const onUpdateSettings = vi.fn();
    const settingsWithQuietHours = {
      ...mockSettings,
      quietHours: { ...mockSettings.quietHours, enabled: true },
    };
    renderWithTheme(
      <NotificationPreferences
        settings={settingsWithQuietHours}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const timezoneInput = screen.getByLabelText('Timezone');
    expect(timezoneInput).toBeDisabled();
    expect(timezoneInput).toHaveValue('America/New_York');
  });

  it('should show quiet hours help text', () => {
    const onUpdateSettings = vi.fn();
    const settingsWithQuietHours = {
      ...mockSettings,
      quietHours: { ...mockSettings.quietHours, enabled: true },
    };
    renderWithTheme(
      <NotificationPreferences
        settings={settingsWithQuietHours}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(
      screen.getByText(/Notifications will be silenced during quiet hours/i)
    ).toBeInTheDocument();
  });

  it('should update start time', async () => {
    const onUpdateSettings = vi.fn();
    const settingsWithQuietHours = {
      ...mockSettings,
      quietHours: { ...mockSettings.quietHours, enabled: true },
    };
    renderWithTheme(
      <NotificationPreferences
        settings={settingsWithQuietHours}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const startTimeInput = screen.getByLabelText('Start Time');
    fireEvent.change(startTimeInput, { target: { value: '21:00' } });

    expect(onUpdateSettings).toHaveBeenCalledWith({
      quietHours: expect.objectContaining({
        start: '21:00',
      }),
    });
  });

  it('should update end time', async () => {
    const onUpdateSettings = vi.fn();
    const settingsWithQuietHours = {
      ...mockSettings,
      quietHours: { ...mockSettings.quietHours, enabled: true },
    };
    renderWithTheme(
      <NotificationPreferences
        settings={settingsWithQuietHours}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    const endTimeInput = screen.getByLabelText('End Time');
    fireEvent.change(endTimeInput, { target: { value: '08:00' } });

    expect(onUpdateSettings).toHaveBeenCalledWith({
      quietHours: expect.objectContaining({
        end: '08:00',
      }),
    });
  });
});

// ============================================================================
// Widget Notifications Tests
// ============================================================================

describe('NotificationPreferences Widget Settings', () => {
  it('should render widget notifications section', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('Widget Notifications')).toBeInTheDocument();
  });

  it('should show widget count chip', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // 2 enabled out of 3 total
    expect(screen.getByText('2 / 3 active')).toBeInTheDocument();
  });

  it('should render widgets grouped by category', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('metrics')).toBeInTheDocument();
    expect(screen.getByText('coverage')).toBeInTheDocument();
    expect(screen.getByText('ai')).toBeInTheDocument();
  });

  it('should render widget names and descriptions', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('Overall code quality score')).toBeInTheDocument();
    expect(screen.getByText('Coverage Summary')).toBeInTheDocument();
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('should toggle widget notification on/off', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Find Coverage Summary widget card and its toggle
    const coverageCard = screen.getByText('Coverage Summary').closest('[class*="MuiCard-root"]');
    const coverageSwitch = within(coverageCard as HTMLElement).getByRole('checkbox');
    expect(coverageSwitch).not.toBeChecked();

    await user.click(coverageSwitch);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      widgetSettings: expect.arrayContaining([
        expect.objectContaining({
          widgetId: 'coverage-summary',
          enabled: true,
        }),
      ]),
    });
  });

  it('should expand widget settings when clicking expand button', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Quality Score is enabled, so expand should work
    const qualityCard = screen.getByText('Quality Score').closest('[class*="MuiCard-root"]');
    const expandButton = within(qualityCard as HTMLElement).getByTestId('ExpandMoreIcon').closest('button');

    await user.click(expandButton!);

    // After expanding, should show threshold settings within this card
    expect(within(qualityCard as HTMLElement).getByText('Alert Threshold')).toBeInTheDocument();
    expect(within(qualityCard as HTMLElement).getByText('Change Threshold (%)')).toBeInTheDocument();
    expect(within(qualityCard as HTMLElement).getByText(/Max Notifications per Hour/)).toBeInTheDocument();
  });

  it('should update widget threshold', async () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Expand Quality Score settings
    const qualityCard = screen.getByText('Quality Score').closest('[class*="MuiCard-root"]');
    const expandButton = within(qualityCard as HTMLElement).getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    // Find threshold input within this card
    const thresholdLabel = within(qualityCard as HTMLElement).getByText('Alert Threshold');
    const thresholdInput = thresholdLabel.closest('[class*="Grid"]')?.querySelector('input[type="number"]');

    // Use fireEvent for direct value change (avoids multiple onChange calls per keystroke)
    fireEvent.change(thresholdInput!, { target: { value: '90' } });

    expect(onUpdateSettings).toHaveBeenCalledWith({
      widgetSettings: expect.arrayContaining([
        expect.objectContaining({
          widgetId: 'quality-score',
          threshold: 90,
        }),
      ]),
    });
  });

  it('should update widget change threshold', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Expand Quality Score settings
    const qualityCard = screen.getByText('Quality Score').closest('[class*="MuiCard-root"]');
    const expandButton = within(qualityCard as HTMLElement).getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    // Find change threshold input
    const changeThresholdLabel = within(qualityCard as HTMLElement).getByText('Change Threshold (%)');
    const changeThresholdInput = changeThresholdLabel.closest('[class*="Grid"]')?.querySelector('input[type="number"]');

    // Use fireEvent for direct value change (avoids multiple onChange calls per keystroke)
    fireEvent.change(changeThresholdInput!, { target: { value: '10' } });

    expect(onUpdateSettings).toHaveBeenCalledWith({
      widgetSettings: expect.arrayContaining([
        expect.objectContaining({
          widgetId: 'quality-score',
          changeThreshold: 10,
        }),
      ]),
    });
  });

  it('should update widget max per hour via slider', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Expand Quality Score settings
    const qualityCard = screen.getByText('Quality Score').closest('[class*="MuiCard-root"]');
    const expandButton = within(qualityCard as HTMLElement).getByTestId('ExpandMoreIcon').closest('button');
    await user.click(expandButton!);

    // Find the slider
    const slider = within(qualityCard as HTMLElement).getByRole('slider');
    expect(slider).toBeInTheDocument();

    // Simulate slider change
    fireEvent.change(slider, { target: { value: 15 } });

    expect(onUpdateSettings).toHaveBeenCalledWith({
      widgetSettings: expect.arrayContaining([
        expect.objectContaining({
          widgetId: 'quality-score',
          maxPerHour: 15,
        }),
      ]),
    });
  });

  it('should show reduced opacity for disabled widget cards', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Coverage Summary is disabled
    const coverageCard = screen.getByText('Coverage Summary').closest('[class*="MuiCard-root"]');
    expect(coverageCard).toHaveStyle({ opacity: '0.6' });

    // Quality Score is enabled
    const qualityCard = screen.getByText('Quality Score').closest('[class*="MuiCard-root"]');
    expect(qualityCard).toHaveStyle({ opacity: '1' });
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('NotificationPreferences Edge Cases', () => {
  it('should handle empty widget list', () => {
    const onUpdateSettings = vi.fn();
    const settingsWithNoWidgets = {
      ...mockSettings,
      widgetSettings: [],
    };
    renderWithTheme(
      <NotificationPreferences
        settings={settingsWithNoWidgets}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={[]}
      />
    );

    expect(screen.getByText('Widget Notifications')).toBeInTheDocument();
    expect(screen.getByText('0 / 0 active')).toBeInTheDocument();
  });

  it('should handle all widgets enabled', () => {
    const onUpdateSettings = vi.fn();
    const allEnabledSettings = {
      ...mockSettings,
      widgetSettings: mockWidgetSettings.map((ws) => ({ ...ws, enabled: true })),
    };
    renderWithTheme(
      <NotificationPreferences
        settings={allEnabledSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('3 / 3 active')).toBeInTheDocument();
  });

  it('should handle all widgets disabled', () => {
    const onUpdateSettings = vi.fn();
    const allDisabledSettings = {
      ...mockSettings,
      widgetSettings: mockWidgetSettings.map((ws) => ({ ...ws, enabled: false })),
    };
    renderWithTheme(
      <NotificationPreferences
        settings={allDisabledSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByText('0 / 3 active')).toBeInTheDocument();
  });

  it('should handle threshold being cleared', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Expand Quality Score settings
    const qualityCard = screen.getByText('Quality Score').closest('[class*="MuiCard-root"]');
    const expandButton = within(qualityCard as HTMLElement).getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    // Clear threshold input by setting empty string
    const thresholdLabel = within(qualityCard as HTMLElement).getByText('Alert Threshold');
    const thresholdInput = thresholdLabel.closest('[class*="Grid"]')?.querySelector('input[type="number"]');

    fireEvent.change(thresholdInput!, { target: { value: '' } });

    expect(onUpdateSettings).toHaveBeenCalledWith({
      widgetSettings: expect.arrayContaining([
        expect.objectContaining({
          widgetId: 'quality-score',
          threshold: undefined,
        }),
      ]),
    });
  });

  it('should handle multiple categories correctly', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Should show all unique categories
    const categories = ['metrics', 'coverage', 'ai'];
    categories.forEach((category) => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('NotificationPreferences Accessibility', () => {
  it('should have accessible toggle labels', () => {
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByRole('checkbox', { name: /enabled/i })).toBeInTheDocument();
  });

  it('should have accessible form labels for quiet hours', () => {
    const onUpdateSettings = vi.fn();
    const settingsWithQuietHours = {
      ...mockSettings,
      quietHours: { ...mockSettings.quietHours, enabled: true },
    };
    renderWithTheme(
      <NotificationPreferences
        settings={settingsWithQuietHours}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
    expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
  });

  it('should have info icons with tooltips in expanded widget settings', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    renderWithTheme(
      <NotificationPreferences
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        availableWidgets={mockWidgetMetadata}
      />
    );

    // Expand Quality Score to see info icon
    const qualityCard = screen.getByText('Quality Score').closest('[class*="MuiCard-root"]');
    const expandButton = within(qualityCard as HTMLElement).getByTestId('ExpandMoreIcon').closest('button');
    await user.click(expandButton!);

    // Info icon should be present within the expanded section
    const infoIcon = within(qualityCard as HTMLElement).getByTestId('InfoOutlinedIcon');
    expect(infoIcon).toBeInTheDocument();
  });
});
