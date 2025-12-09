/**
 * Theme Module Exports
 *
 * Central export point for MUI theme configuration.
 * Import theme from this file in your application.
 */

export { dashboardTheme, darkDashboardTheme } from './dashboardTheme';
export { default } from './dashboardTheme';

// Phase 5C: Theme context and hook for dark mode support
export {
  ThemeProvider,
  useTheme,
  type ThemeMode,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemeProviderProps,
} from './ThemeContext';
