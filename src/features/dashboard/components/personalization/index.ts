/**
 * Personalization Components Barrel Export
 *
 * Phase 5B: Dashboard Personalization
 */

export { WidgetLibrary } from './WidgetLibrary';
export { SavedViewsDropdown } from './SavedViewsDropdown';
export { NotificationPreferences } from './NotificationPreferences';
export { DashboardEditor } from './DashboardEditor';

// Re-export types for convenience
export type {
  WidgetLibraryProps,
  SavedViewsDropdownProps,
  DashboardNotificationPreferencesProps,
  DashboardEditorProps,
} from '../../types';
