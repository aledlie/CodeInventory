/**
 * Sidebar Navigation Component
 *
 * Responsive navigation sidebar with:
 * - Desktop: Persistent 240px sidebar
 * - Mobile: Hamburger-triggered drawer (<768px)
 * - Keyboard navigation support
 * - Active route highlighting with 4px blue underline
 * - WCAG AA accessible focus indicators
 */

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  ChecklistRtl as ChecklistIcon,
  BarChart as ChartIcon,
  AccountTree as NetworkIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Hub as GraphIcon,
  CompareArrows as CompareIcon,
  Description as ReportsIcon,
  AutoAwesome as InsightsIcon,
  Timeline as PredictionsIcon,
} from '@mui/icons-material';

/**
 * Navigation item structure
 */
export interface NavItem {
  /** Display label for navigation item */
  label: string;
  /** Route path (e.g., /dashboard, /dashboard/quality) */
  path: string;
  /** Icon component to display */
  icon: React.ReactNode;
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  /** Current active path for highlighting */
  currentPath?: string;
  /** Callback when navigation item is clicked */
  onNavigate?: (path: string) => void;
  /** Mobile drawer open state (controlled) */
  isMobileOpen?: boolean;
  /** Callback when mobile drawer should close */
  onMobileClose?: () => void;
}

/**
 * Navigation items configuration
 */
const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <HomeIcon />,
  },
  {
    label: 'Code Quality',
    path: '/dashboard/quality',
    icon: <ChecklistIcon />,
  },
  {
    label: 'Test Coverage',
    path: '/dashboard/coverage',
    icon: <ChartIcon />,
  },
  {
    label: 'Dependencies',
    path: '/dashboard/dependencies',
    icon: <NetworkIcon />,
  },
  {
    label: 'Trends',
    path: '/dashboard/trends',
    icon: <TrendingUpIcon />,
  },
  {
    label: 'Graph',
    path: '/dashboard/graph',
    icon: <GraphIcon />,
  },
  {
    label: 'Compare',
    path: '/dashboard/compare',
    icon: <CompareIcon />,
  },
  {
    label: 'Reports',
    path: '/dashboard/reports',
    icon: <ReportsIcon />,
  },
  {
    label: 'AI Insights',
    path: '/dashboard/insights',
    icon: <InsightsIcon />,
  },
  {
    label: 'Predictions',
    path: '/dashboard/predictions',
    icon: <PredictionsIcon />,
  },
  {
    label: 'Settings',
    path: '/dashboard/settings',
    icon: <SettingsIcon />,
  },
];

/**
 * Sidebar Navigation Component
 *
 * Provides primary navigation for the dashboard with responsive behavior:
 * - Desktop (≥768px): Persistent sidebar on the left
 * - Mobile (<768px): Hamburger menu triggering a drawer
 *
 * Accessibility features:
 * - Keyboard navigable (Tab, Enter)
 * - aria-current="page" on active route
 * - 2px blue outline on focus
 * - Screen reader friendly labels
 *
 * @example
 * ```tsx
 * <Sidebar
 *   currentPath="/dashboard/quality"
 *   onNavigate={(path) => navigate(path)}
 *   isMobileOpen={mobileOpen}
 *   onMobileClose={() => setMobileOpen(false)}
 * />
 * ```
 */
export const Sidebar: React.FC<SidebarProps> = ({
  currentPath = '/dashboard',
  onNavigate,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <768px

  /**
   * Handle navigation item click
   */
  const handleNavigationClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    // Close mobile drawer after navigation
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  /**
   * Handle keyboard navigation (Enter key)
   */
  const handleKeyDown = (event: React.KeyboardEvent, path: string) => {
    if (event.key === 'Enter') {
      handleNavigationClick(path);
    }
  };

  /**
   * Check if a navigation item is active
   */
  const isActive = (path: string): boolean => {
    // Exact match for root dashboard
    if (path === '/dashboard' && currentPath === '/dashboard') {
      return true;
    }
    // Prefix match for nested routes
    if (path !== '/dashboard' && currentPath?.startsWith(path)) {
      return true;
    }
    return false;
  };

  /**
   * Navigation list content (shared between desktop and mobile)
   */
  const navList = (
    <List
      component="nav"
      aria-label="Primary navigation"
      sx={{ width: 240, height: '100%', pt: 2 }}
    >
      {navigationItems.map((item) => {
        const active = isActive(item.path);

        return (
          <ListItem
            key={item.path}
            disablePadding
            sx={{ mb: 0.5 }}
          >
            <ListItemButton
              onClick={() => handleNavigationClick(item.path)}
              onKeyDown={(e) => handleKeyDown(e, item.path)}
              aria-current={active ? 'page' : undefined}
              sx={{
                borderLeft: active ? '4px solid var(--color-primary, #0066cc)' : '4px solid transparent',
                pl: 2,
                transition: 'all var(--transition-normal, 200ms) var(--ease-in-out, ease-in-out)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 102, 204, 0.08)',
                  borderLeftColor: 'var(--color-primary-light, #3385ff)',
                },
                '&:focus-visible': {
                  outline: '2px solid var(--color-primary, #0066cc)',
                  outlineOffset: '2px',
                  borderRadius: '2px',
                },
                // Active state styling
                ...(active && {
                  backgroundColor: 'rgba(0, 102, 204, 0.1)',
                  fontWeight: 600,
                  '& .MuiListItemIcon-root': {
                    color: 'var(--color-primary, #0066cc)',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'var(--color-primary-dark, #004099)',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: active ? 'var(--color-primary, #0066cc)' : 'var(--color-text-secondary, #666666)',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 'var(--font-size-body, 14px)',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--color-primary-dark, #004099)' : 'var(--color-text-primary, #1a1a1a)',
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  // Desktop: Persistent sidebar
  if (!isMobile) {
    return (
      <Box
        component="aside"
        sx={{
          width: 240,
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
          borderRight: '1px solid var(--color-border, #e0e0e0)',
          overflowY: 'auto',
        }}
      >
        {navList}
      </Box>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer
      anchor="left"
      open={isMobileOpen}
      onClose={onMobileClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 240,
          backgroundColor: 'var(--color-background-primary, #ffffff)',
          boxShadow: 'var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.12))',
        },
      }}
    >
      {/* Close button for mobile drawer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid var(--color-border, #e0e0e0)',
        }}
      >
        <Box
          component="h2"
          sx={{
            margin: 0,
            fontSize: 'var(--font-size-h4, 16px)',
            fontWeight: 600,
            color: 'var(--color-text-primary, #1a1a1a)',
          }}
        >
          Navigation
        </Box>
        <IconButton
          onClick={onMobileClose}
          aria-label="Close navigation menu"
          sx={{
            '&:focus-visible': {
              outline: '2px solid var(--color-primary, #0066cc)',
              outlineOffset: '2px',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      {navList}
    </Drawer>
  );
};

/**
 * Hamburger Menu Button Component
 *
 * Mobile-only button to trigger the navigation drawer.
 * Only visible at <768px breakpoint.
 *
 * @example
 * ```tsx
 * <MobileMenuButton onClick={() => setMobileOpen(true)} />
 * ```
 */
export interface MobileMenuButtonProps {
  /** Callback when hamburger button is clicked */
  onClick?: () => void;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ onClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <768px

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <IconButton
      onClick={onClick}
      aria-label="Open navigation menu"
      aria-expanded={false}
      aria-controls="mobile-navigation-drawer"
      sx={{
        mr: 2,
        color: 'var(--color-text-primary, #1a1a1a)',
        '&:focus-visible': {
          outline: '2px solid var(--color-primary, #0066cc)',
          outlineOffset: '2px',
          borderRadius: '2px',
        },
      }}
    >
      <MenuIcon />
    </IconButton>
  );
};

export default Sidebar;
