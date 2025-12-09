/**
 * Personalization Components Barrel Export
 *
 * Phase 5B: Dashboard Personalization
 * Phase 5C: Theme Settings
 */

export { WidgetLibrary } from './WidgetLibrary';
export { SavedViewsDropdown } from './SavedViewsDropdown';
export { NotificationPreferences } from './NotificationPreferences';
export { DashboardEditor } from './DashboardEditor';

// Phase 5C: Theme Settings
export { ThemeSettings, ThemeToggleButton } from './ThemeSettings';
export type { ThemeSettingsProps, ThemeToggleButtonProps } from './ThemeSettings';

// Re-export types for convenience
export type {
  WidgetLibraryProps,
  SavedViewsDropdownProps,
  DashboardNotificationPreferencesProps,
  DashboardEditorProps,
} from '../../types';
