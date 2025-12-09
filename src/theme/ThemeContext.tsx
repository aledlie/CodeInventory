/**
 * Theme Context Provider
 *
 * Phase 5C: Advanced Features
 * Provides theme switching functionality with system preference detection
 * and localStorage persistence.
 *
 * Features:
 * - Light/Dark/System theme modes
 * - System preference detection via prefers-color-scheme
 * - Automatic updates when system preference changes
 * - localStorage persistence
 * - Smooth theme transitions
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { dashboardTheme, darkDashboardTheme } from './dashboardTheme';

// ============================================================================
// Types
// ============================================================================

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme (actual theme being applied)
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme context value
 */
export interface ThemeContextValue {
  /** Current theme mode setting */
  mode: ThemeMode;
  /** Resolved theme (light or dark) - accounts for system preference when mode is 'system' */
  resolvedTheme: ResolvedTheme;
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark (or set to light if system) */
  toggleTheme: () => void;
  /** Check if the theme is dark */
  isDark: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'code-inventory-theme-mode';
const DEFAULT_MODE: ThemeMode = 'system';

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get stored theme mode from localStorage
 */
function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return DEFAULT_MODE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  return DEFAULT_MODE;
}

/**
 * Store theme mode to localStorage
 */
function storeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage not available
  }
}

/**
 * Get system color scheme preference
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve theme mode to actual theme
 */
function resolveTheme(mode: ThemeMode, systemPreference: ResolvedTheme): ResolvedTheme {
  if (mode === 'system') {
    return systemPreference;
  }
  return mode;
}

// ============================================================================
// Provider Component
// ============================================================================

export interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme mode (overrides stored preference on first load) */
  defaultMode?: ThemeMode;
}

/**
 * Theme Provider Component
 *
 * Wraps the application with MUI ThemeProvider and provides theme switching functionality.
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@/theme/ThemeContext';
 *
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export function ThemeProvider({ children, defaultMode }: ThemeProviderProps) {
  // Initialize mode from localStorage or default
  const [mode, setModeState] = useState<ThemeMode>(() => defaultMode ?? getStoredMode());

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(() =>
    getSystemPreference()
  );

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Resolve theme based on mode and system preference
  const resolvedTheme = useMemo(
    () => resolveTheme(mode, systemPreference),
    [mode, systemPreference]
  );

  // Select the appropriate MUI theme
  const theme = useMemo(
    () => (resolvedTheme === 'dark' ? darkDashboardTheme : dashboardTheme),
    [resolvedTheme]
  );

  // Set mode with persistence
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    storeMode(newMode);
  }, []);

  // Toggle theme (cycles through light -> dark -> system)
  const toggleTheme = useCallback(() => {
    setModeState((prevMode: ThemeMode) => {
      let newMode: ThemeMode;
      if (prevMode === 'light') newMode = 'dark';
      else if (prevMode === 'dark') newMode = 'system';
      else newMode = 'light';

      storeMode(newMode);
      return newMode;
    });
  }, []);

  // Update document with theme class for CSS targeting
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${resolvedTheme}-theme`);

    // Also set color-scheme for native elements
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Context value
  const value: ThemeContextValue = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
      toggleTheme,
      isDark: resolvedTheme === 'dark',
    }),
    [mode, resolvedTheme, setMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Use Theme Hook
 *
 * Access theme context to get current theme mode and toggle functions.
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { mode, setMode, isDark, toggleTheme } = useTheme();
 *
 *   return (
 *     <IconButton onClick={toggleTheme}>
 *       {isDark ? <LightModeIcon /> : <DarkModeIcon />}
 *     </IconButton>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// ============================================================================
// Exports
// ============================================================================

export default ThemeProvider;
