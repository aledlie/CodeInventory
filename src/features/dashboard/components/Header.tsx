/**
 * Header Component for Code Inventory Dashboard
 *
 * A responsive, accessible header with sticky positioning that displays:
 * - Branding/Logo ("Code Inventory")
 * - Last generated timestamp
 * - Quick action buttons (Settings, Export)
 *
 * Features:
 * - Gradient background (linear-gradient(135deg, #0066cc to #0052a3))
 * - Sticky positioning on scroll
 * - Responsive layout (horizontal desktop, stacked mobile)
 * - WCAG AA compliant accessibility
 * - Keyboard navigation support
 *
 * Breakpoints:
 * - Desktop (>= 768px): Horizontal layout with branding left, actions right
 * - Mobile (< 768px): Stacked layout with hamburger menu for actions
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Download as ExportIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

/**
 * Props interface for Header component
 */
export interface HeaderProps {
  /**
   * Timestamp of when the dashboard data was last generated
   * Optional - if not provided, timestamp section will not be displayed
   */
  lastGenerated?: Date;

  /**
   * Callback function triggered when settings button is clicked
   * Optional - if not provided, settings button will still render but do nothing
   */
  onSettingsClick?: () => void;

  /**
   * Callback function triggered when export button is clicked
   * Optional - if not provided, export button will still render but do nothing
   */
  onExportClick?: () => void;
}

/**
 * Formats a Date object to a localized string with date and time
 *
 * @param date - Date object to format
 * @returns Formatted string (e.g., "12/8/2025, 11:30:45 PM")
 */
const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

/**
 * Header component with responsive layout and accessibility features
 *
 * Desktop layout: [Logo] -------------------- [Timestamp] [Settings] [Export]
 * Mobile layout:  [Menu] [Logo]
 *                 [Timestamp]
 *                 Drawer: [Settings] [Export]
 */
export const Header: React.FC<HeaderProps> = ({
  lastGenerated,
  onSettingsClick,
  onExportClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * Toggle mobile drawer menu
   */
  const handleMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  /**
   * Handle settings click - close mobile menu if open and trigger callback
   */
  const handleSettingsClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
    onSettingsClick?.();
  };

  /**
   * Handle export click - close mobile menu if open and trigger callback
   */
  const handleExportClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
    onExportClick?.();
  };

  /**
   * Render quick action buttons (desktop layout)
   */
  const renderActionButtons = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton
        color="inherit"
        onClick={handleSettingsClick}
        aria-label="Open settings"
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        }}
      >
        <SettingsIcon />
      </IconButton>
      <IconButton
        color="inherit"
        onClick={handleExportClick}
        aria-label="Export dashboard data"
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        }}
      >
        <ExportIcon />
      </IconButton>
    </Box>
  );

  /**
   * Render mobile drawer menu with action items
   */
  const renderMobileDrawer = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMenuToggle}
      PaperProps={{
        sx: {
          width: 250,
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="text.primary">
          Actions
        </Typography>
        <IconButton
          onClick={handleMenuToggle}
          aria-label="Close menu"
          sx={{
            '&:focus-visible': {
              outline: '2px solid currentColor',
              outlineOffset: '2px',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleSettingsClick}
            aria-label="Open settings"
            sx={{
              '&:focus-visible': {
                outline: '2px solid #0066cc',
                outlineOffset: '-2px',
              },
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleExportClick}
            aria-label="Export dashboard data"
            sx={{
              '&:focus-visible': {
                outline: '2px solid #0066cc',
                outlineOffset: '-2px',
              },
            }}
          >
            <ListItemIcon>
              <ExportIcon />
            </ListItemIcon>
            <ListItemText primary="Export" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 70 },
            px: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: { xs: 1, md: 0 },
            py: { xs: 2, md: 0 },
          }}
        >
          {/* Mobile menu button and branding row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', md: 'auto' },
              justifyContent: 'space-between',
            }}
          >
            {/* Branding/Logo */}
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Code Inventory
            </Typography>

            {/* Mobile hamburger menu button */}
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={handleMenuToggle}
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu-drawer"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid currentColor',
                    outlineOffset: '2px',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>

          {/* Spacer for desktop layout */}
          {!isMobile && <Box sx={{ flexGrow: 1 }} />}

          {/* Timestamp display */}
          {lastGenerated && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: { xs: 0, md: 2 },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                Last updated: {formatTimestamp(lastGenerated)}
              </Typography>
            </Box>
          )}

          {/* Desktop action buttons */}
          {!isMobile && renderActionButtons()}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer menu */}
      {isMobile && renderMobileDrawer()}
    </>
  );
};

// Default export
export default Header;
