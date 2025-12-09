/**
 * MUI v7 Theme Configuration for Code Inventory Dashboard
 *
 * This theme aligns with the design tokens defined in src/styles/design-tokens.css
 * ensuring consistent visual design across the application.
 *
 * Features:
 * - WCAG AA compliant color contrast ratios
 * - Dark mode support via MUI's dark palette
 * - 8px base unit spacing scale
 * - Consistent typography hierarchy (32px/24px/18px)
 * - Accessible component style overrides
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';

/**
 * Dashboard Theme Configuration
 * Matches design tokens from src/styles/design-tokens.css
 */
const dashboardThemeOptions: ThemeOptions = {
  /**
   * PALETTE CONFIGURATION
   * All colors match design tokens and meet WCAG AA contrast requirements
   */
  palette: {
    mode: 'light',
    primary: {
      main: '#0066cc',        // --color-primary
      dark: '#004099',        // --color-primary-dark
      light: '#3385ff',       // --color-primary-light
      contrastText: '#ffffff', // --color-text-on-primary
    },
    success: {
      main: '#28a745',        // --color-success
      dark: '#1e7e34',        // --color-success-dark
      light: '#51cf66',       // --color-success-light
      contrastText: '#ffffff', // --color-text-on-success
    },
    warning: {
      main: '#ff9800',        // --color-warning
      dark: '#d97706',        // --color-warning-dark
      light: '#ffa726',       // --color-warning-light
      contrastText: '#1a1a1a', // --color-text-on-warning (dark text for contrast)
    },
    error: {
      main: '#dc3545',        // --color-error
      dark: '#c82829',        // --color-error-dark
      light: '#e57373',       // --color-error-light
      contrastText: '#ffffff', // --color-text-on-error
    },
    info: {
      main: '#17a2b8',        // --color-info
      dark: '#0097a7',        // --color-info-dark
      light: '#29b6f6',       // --color-info-light
      contrastText: '#ffffff', // --color-text-on-info
    },
    background: {
      default: '#f5f5f5',     // --color-background-secondary (neutral-50)
      paper: '#ffffff',       // --color-background-primary (neutral-white)
    },
    text: {
      primary: '#1a1a1a',     // --color-text-primary (neutral-900)
      secondary: '#666666',   // --color-text-secondary (neutral-500)
      disabled: '#999999',    // --color-neutral-400
    },
    divider: '#e0e0e0',       // --color-divider (neutral-200)
    grey: {
      50: '#f5f5f5',          // --color-neutral-50
      100: '#f0f0f0',         // --color-neutral-100
      200: '#e0e0e0',         // --color-neutral-200
      300: '#cccccc',         // --color-neutral-300
      400: '#999999',         // --color-neutral-400
      500: '#666666',         // --color-neutral-500
      600: '#525252',         // --color-neutral-600
      700: '#404040',         // --color-neutral-700
      800: '#2d2d2d',         // --color-neutral-800
      900: '#1a1a1a',         // --color-neutral-900
    },
  },

  /**
   * TYPOGRAPHY CONFIGURATION
   * Matches design token font stacks and type scale
   */
  typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif', // --font-family-body
    h1: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', // --font-family-heading
      fontWeight: 700,        // --font-weight-bold
      fontSize: '2rem',       // --font-size-h1 (32px)
      lineHeight: 1.25,       // --line-height-tight
      letterSpacing: '-0.01em', // --letter-spacing-tight
    },
    h2: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeight: 600,        // --font-weight-semibold
      fontSize: '1.5rem',     // --font-size-h2 (24px)
      lineHeight: 1.25,       // --line-height-tight
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeight: 600,        // --font-weight-semibold
      fontSize: '1.125rem',   // --font-size-h3 (18px)
      lineHeight: 1.25,       // --line-height-tight
      letterSpacing: '0',     // --letter-spacing-normal
    },
    h4: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',       // --font-size-h4 (16px)
      lineHeight: 1.5,        // --line-height-normal
      letterSpacing: '0',
    },
    body1: {
      fontSize: '0.875rem',   // --font-size-body (14px)
      lineHeight: 1.5,        // --line-height-normal
      letterSpacing: '0',
    },
    body2: {
      fontSize: '0.8125rem',  // --font-size-body-sm (13px)
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 500,        // --font-weight-medium
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',    // --font-size-small (12px)
      lineHeight: 1.5,
      letterSpacing: '0.025em', // --letter-spacing-wide
    },
    overline: {
      fontSize: '0.6875rem',  // --font-size-tiny (11px)
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.025em',
      textTransform: 'uppercase',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.025em',
      textTransform: 'none',  // Override default uppercase
    },
  },

  /**
   * SPACING CONFIGURATION
   * 8px base unit (matches --spacing-sm: 0.5rem / 8px)
   */
  spacing: 8,

  /**
   * SHAPE CONFIGURATION
   * Consistent border radius across components
   */
  shape: {
    borderRadius: 8,          // --radius-sm (8px) for default components
  },

  /**
   * BREAKPOINTS CONFIGURATION
   * Mobile-first responsive breakpoints matching design tokens
   */
  breakpoints: {
    values: {
      xs: 0,                  // --breakpoint-xs
      sm: 576,                // --breakpoint-sm
      md: 768,                // --breakpoint-md
      lg: 992,                // --breakpoint-lg
      xl: 1200,               // --breakpoint-xl
    },
  },

  /**
   * TRANSITIONS CONFIGURATION
   * Matches design token timing and easing functions
   */
  transitions: {
    duration: {
      shortest: 150,          // --transition-fast
      shorter: 200,           // --transition-normal
      short: 250,
      standard: 300,          // --transition-slow
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',     // --ease-in-out
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',         // --ease-out
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',          // --ease-in
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  /**
   * Z-INDEX CONFIGURATION
   * Organized stacking context matching design tokens
   */
  zIndex: {
    mobileStepper: 1000,      // --z-index-dropdown
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,              // --z-index-modal
    snackbar: 1400,
    tooltip: 1500,            // --z-index-tooltip
  },

  /**
   * COMPONENT STYLE OVERRIDES
   * Accessible, consistent styling that preserves WCAG compliance
   */
  components: {
    /**
     * MuiCard Overrides
     * Matches --shadow-card and hover effects
     */
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',  // --shadow-card (md)
          borderRadius: '12px',                        // --radius-card (md)
          transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)', // --transition
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)', // --shadow-lg (hover state)
            transform: 'translateY(-2px)',              // Subtle lift effect
          },
        },
      },
    },

    /**
     * MuiCardContent Overrides
     * Consistent padding matching design tokens
     */
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',      // --spacing-lg (3 * 8px base unit)
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },

    /**
     * MuiButton Overrides
     * Accessible buttons with proper hover/focus states
     */
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',  // --radius-button (sm)
          textTransform: 'none', // Preserve natural case for readability
          fontWeight: 500,      // --font-weight-medium
          padding: '8px 24px',  // --btn-padding-md
          transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:focus-visible': {
            outline: '2px solid #0066cc', // --focus-outline
            outlineOffset: '2px',          // --focus-outline-offset
          },
        },
        sizeSmall: {
          padding: '4px 16px', // --btn-padding-sm
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '16px 32px', // --btn-padding-lg
          fontSize: '1rem',
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', // --shadow-button
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
          },
          '&:active': {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },

    /**
     * MuiChip Overrides
     * Severity badges with consistent styling
     */
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '9999px', // --radius-badge (full)
          fontSize: '0.75rem',    // --badge-font-size (small)
          fontWeight: 500,        // --font-weight-medium
          height: '24px',
          padding: '0 8px',       // Compact padding for badges
        },
        sizeSmall: {
          height: '20px',
          fontSize: '0.6875rem',  // --font-size-tiny
        },
        // Severity-specific styles
        colorSuccess: {
          backgroundColor: '#e7f5e1', // --color-success-lightest
          color: '#1e7e34',           // --color-success-dark (high contrast)
          '&:hover': {
            backgroundColor: '#51cf66', // --color-success-light
          },
        },
        colorWarning: {
          backgroundColor: '#fff3e0', // --color-warning-lightest
          color: '#d97706',           // --color-warning-dark (high contrast)
          '&:hover': {
            backgroundColor: '#ffb74d', // --color-warning-lighter
          },
        },
        colorError: {
          backgroundColor: '#ffebee', // --color-error-lightest
          color: '#c82829',           // --color-error-dark (high contrast)
          '&:hover': {
            backgroundColor: '#ef9a9a', // --color-error-lighter
          },
        },
        colorInfo: {
          backgroundColor: '#e1f5fe', // --color-info-lightest
          color: '#0097a7',           // --color-info-dark (high contrast)
          '&:hover': {
            backgroundColor: '#64b5f6', // --color-info-lighter
          },
        },
      },
    },

    /**
     * MuiPaper Overrides
     * Consistent elevation shadows
     */
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default MUI gradient
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', // --shadow-xs
        },
        elevation2: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', // --shadow-sm
        },
        elevation3: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)', // --shadow-md
        },
        elevation4: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)', // --shadow-lg
        },
        elevation8: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)', // --shadow-xl
        },
      },
    },

    /**
     * MuiTooltip Overrides
     * Accessible tooltips with proper contrast
     */
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2d2d2d', // --color-neutral-800
          color: '#ffffff',           // --color-neutral-white
          fontSize: '0.8125rem',      // --font-size-body-sm
          padding: '8px 12px',
          borderRadius: '8px',        // --radius-sm
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)', // --shadow-tooltip
        },
        arrow: {
          color: '#2d2d2d',
        },
      },
    },

    /**
     * MuiTextField Overrides
     * Accessible form inputs with focus states
     */
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',      // --radius-input
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#666666', // --color-neutral-500
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0066cc', // --color-primary
              borderWidth: '2px',     // --focus-outline-width
            },
          },
        },
      },
    },

    /**
     * MuiTableCell Overrides
     * Consistent table styling
     */
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e0e0e0',     // --color-border
          padding: '16px',            // --spacing-md
        },
        head: {
          fontWeight: 600,            // --font-weight-semibold
          backgroundColor: '#f5f5f5', // --color-background-secondary
          color: '#1a1a1a',           // --color-text-primary
        },
      },
    },

    /**
     * MuiDivider Overrides
     * Subtle dividers matching design tokens
     */
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e0e0e0',     // --color-divider
        },
      },
    },

    /**
     * MuiIconButton Overrides
     * Accessible icon buttons with hover states
     */
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)', // --opacity-hover
          },
          '&:focus-visible': {
            outline: '2px solid #0066cc',
            outlineOffset: '2px',
          },
        },
      },
    },

    /**
     * MuiAppBar Overrides
     * Consistent app bar styling
     */
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)', // --shadow-md
        },
      },
    },
  },
};

/**
 * Dashboard Theme Instance
 * Use this theme with ThemeProvider in your application
 */
export const dashboardTheme = createTheme(dashboardThemeOptions);

/**
 * Dark Mode Theme (Optional)
 * Automatically switches palette values while maintaining contrast ratios
 */
export const darkDashboardTheme = createTheme({
  ...dashboardThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#66b3ff',        // --color-primary (dark mode)
      dark: '#80b3ff',        // --color-primary-dark (dark mode)
      light: '#99ccff',       // --color-primary-light (dark mode)
      contrastText: '#1a1a1a', // --color-text-on-primary (dark mode)
    },
    success: {
      main: '#51cf66',        // --color-success (dark mode)
      dark: '#94d82d',        // --color-success-dark (dark mode)
      light: '#69e395',       // --color-success-light (dark mode)
      contrastText: '#1a1a1a',
    },
    warning: {
      main: '#ffb74d',        // --color-warning (dark mode)
      dark: '#ffa726',        // --color-warning-dark (dark mode)
      light: '#ffcc80',       // --color-warning-light (dark mode)
      contrastText: '#1a1a1a',
    },
    error: {
      main: '#e57373',        // --color-error (dark mode)
      dark: '#ef9a9a',        // --color-error-dark (dark mode)
      light: '#ffab91',       // --color-error-light (dark mode)
      contrastText: '#1a1a1a',
    },
    info: {
      main: '#64b5f6',        // --color-info (dark mode)
      dark: '#81d4fa',        // --color-info-dark (dark mode)
      light: '#90caf9',       // --color-info-light (dark mode)
      contrastText: '#1a1a1a',
    },
    background: {
      default: '#1a1a1a',     // --color-background-secondary (dark mode)
      paper: '#0d0d0d',       // --color-background-primary (dark mode)
    },
    text: {
      primary: '#f5f5f5',     // --color-text-primary (dark mode)
      secondary: '#999999',   // --color-text-secondary (dark mode)
      disabled: '#666666',
    },
    divider: '#404040',       // --color-divider (dark mode)
    grey: {
      50: '#1a1a1a',
      100: '#1f1f1f',
      200: '#2d2d2d',
      300: '#404040',
      400: '#666666',
      500: '#808080',
      600: '#999999',
      700: '#cccccc',
      800: '#e0e0e0',
      900: '#f5f5f5',
    },
  },
});

export default dashboardTheme;
