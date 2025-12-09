/**
 * Mobile Bottom Navigation Component
 *
 * Alternative mobile navigation pattern using bottom tabs.
 * Only visible at <768px breakpoint.
 *
 * Features:
 * - Fixed bottom position on mobile devices
 * - Icon + label for each navigation item
 * - Active state with color highlighting
 * - Touch-optimized tap targets (≥44x44px)
 * - Accessible labels and ARIA attributes
 */

import type { ReactElement, SyntheticEvent } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  ChecklistRtl as ChecklistIcon,
  BarChart as ChartIcon,
  AccountTree as NetworkIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

/**
 * Mobile navigation item
 */
export interface MobileNavItem {
  /** Display label */
  label: string;
  /** Route path */
  path: string;
  /** Icon component */
  icon: ReactElement;
}

/**
 * MobileMenu component props
 */
export interface MobileMenuProps {
  /** Current active path */
  currentPath?: string;
  /** Callback when navigation item is clicked */
  onNavigate?: (path: string) => void;
}

/**
 * Mobile navigation items (subset of main navigation)
 */
const mobileNavItems: MobileNavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <HomeIcon />,
  },
  {
    label: 'Quality',
    path: '/dashboard/quality',
    icon: <ChecklistIcon />,
  },
  {
    label: 'Coverage',
    path: '/dashboard/coverage',
    icon: <ChartIcon />,
  },
  {
    label: 'Dependencies',
    path: '/dashboard/dependencies',
    icon: <NetworkIcon />,
  },
  {
    label: 'Settings',
    path: '/dashboard/settings',
    icon: <SettingsIcon />,
  },
];

/**
 * Mobile Bottom Navigation Menu
 *
 * Alternative navigation pattern for mobile devices (<768px).
 * Displays as a fixed bottom tab bar with icons and labels.
 *
 * Accessibility:
 * - Touch targets ≥44x44px (WCAG 2.1 Level AAA)
 * - Keyboard navigable with Tab/Enter
 * - Active state clearly indicated
 * - Proper ARIA labels
 *
 * Usage:
 * ```tsx
 * <MobileMenu
 *   currentPath="/dashboard/quality"
 *   onNavigate={(path) => navigate(path)}
 * />
 * ```
 *
 * @remarks
 * This component only renders on mobile devices (<768px).
 * Use as an alternative to the drawer-based Sidebar on mobile.
 */
export function MobileMenu({
  currentPath = '/dashboard',
  onNavigate,
}: MobileMenuProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <768px

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  /**
   * Determine active tab index based on current path
   */
  const getActiveIndex = (): number => {
    const index = mobileNavItems.findIndex((item) => {
      // Exact match for root dashboard
      if (item.path === '/dashboard' && currentPath === '/dashboard') {
        return true;
      }
      // Prefix match for nested routes
      if (item.path !== '/dashboard' && currentPath?.startsWith(item.path)) {
        return true;
      }
      return false;
    });
    return index !== -1 ? index : 0;
  };

  /**
   * Handle navigation action change
   */
  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    const selectedItem = mobileNavItems[newValue];
    if (selectedItem && onNavigate) {
      onNavigate(selectedItem.path);
    }
  };

  return (
    <Paper
      component="nav"
      aria-label="Mobile bottom navigation"
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-index-fixed, 1030)',
        boxShadow: 'var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.12))',
      }}
    >
      <BottomNavigation
        value={getActiveIndex()}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          backgroundColor: 'var(--color-background-primary, #ffffff)',
          borderTop: '1px solid var(--color-border, #e0e0e0)',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 60,
            padding: '6px 12px 8px',
            transition: 'color var(--transition-normal, 200ms) var(--ease-in-out, ease-in-out)',
            '&:focus-visible': {
              outline: '2px solid var(--color-primary, #0066cc)',
              outlineOffset: '-2px',
              borderRadius: '4px',
            },
            // Ensure touch targets are ≥44x44px
            '& .MuiBottomNavigationAction-label': {
              fontSize: 'var(--font-size-small, 12px)',
              fontWeight: 400,
              marginTop: '4px',
            },
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: 'var(--color-primary, #0066cc)',
            fontWeight: 600,
            '& .MuiBottomNavigationAction-label': {
              fontSize: 'var(--font-size-small, 12px)',
              fontWeight: 600,
            },
          },
        }}
      >
        {mobileNavItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            aria-label={`Navigate to ${item.label}`}
            sx={{
              color: 'var(--color-text-secondary, #666666)',
              '&.Mui-selected': {
                color: 'var(--color-primary, #0066cc)',
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileMenu;
