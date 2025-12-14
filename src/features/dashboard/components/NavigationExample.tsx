/**
 * Navigation Integration Example
 *
 * This file demonstrates how to integrate the Sidebar and MobileMenu components
 * in a complete dashboard layout.
 *
 * DO NOT USE IN PRODUCTION - This is for reference only.
 */

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { Sidebar, MobileMenuButton } from './index';
import { logger } from '../helpers/logger';

/**
 * Example Dashboard Layout with Navigation
 *
 * Demonstrates:
 * 1. Desktop: Persistent sidebar + header
 * 2. Mobile: Hamburger menu (drawer) OR bottom navigation
 * 3. State management for mobile drawer
 * 4. Navigation callback handling
 *
 * @example
 * ```tsx
 * // In your main app/router:
 * function App() {
 *   return (
 *     <NavigationExample>
 *       <YourDashboardContent />
 *     </NavigationExample>
 *   );
 * }
 * ```
 */
export function NavigationExample({ children }: { children?: ReactNode }) {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // For demonstration - in production, use TanStack Router
  const handleNavigate = (path: string) => {
    logger.info('NavigationExample', 'Navigating to', { path });
    setCurrentPath(path);
    // In production: navigate(path) from TanStack Router
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isMobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {/* Header with mobile hamburger */}
        <AppBar
          position="sticky"
          sx={{
            backgroundColor: 'var(--color-background-primary, #ffffff)',
            color: 'var(--color-text-primary, #1a1a1a)',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08))',
          }}
        >
          <Toolbar>
            {/* Mobile hamburger menu button (only visible <768px) */}
            <MobileMenuButton onClick={() => setMobileDrawerOpen(true)} />

            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              Code Inventory Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          sx={{
            p: { xs: 2, md: 4 },
            flexGrow: 1,
            pb: { xs: 10, md: 4 }, // Extra bottom padding on mobile for bottom nav
          }}
        >
          {children || (
            <Box>
              <Typography variant="h4" gutterBottom>
                Current Path: {currentPath}
              </Typography>
              <Typography variant="body1">
                Click navigation items to test routing.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Mobile Bottom Navigation (alternative to drawer) */}
      {/* OPTION 1: Use drawer-based sidebar (already implemented above) */}
      {/* OPTION 2: Use bottom navigation (uncomment below) */}
      {/*
      <MobileMenu
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
      */}
    </Box>
  );
};

/**
 * Usage Patterns
 *
 * ## Pattern 1: Drawer-based Mobile Navigation (Default)
 * ```tsx
 * <Sidebar
 *   currentPath={currentPath}
 *   onNavigate={handleNavigate}
 *   isMobileOpen={mobileDrawerOpen}
 *   onMobileClose={() => setMobileDrawerOpen(false)}
 * />
 * <MobileMenuButton onClick={() => setMobileDrawerOpen(true)} />
 * ```
 *
 * ## Pattern 2: Bottom Tab Navigation (Alternative)
 * ```tsx
 * <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
 * <MobileMenu currentPath={currentPath} onNavigate={handleNavigate} />
 * ```
 *
 * ## Pattern 3: With TanStack Router
 * ```tsx
 * import { useNavigate, useLocation } from '@tanstack/react-router';
 *
 * function DashboardLayout() {
 *   const navigate = useNavigate();
 *   const location = useLocation();
 *   const [mobileOpen, setMobileOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Sidebar
 *         currentPath={location.pathname}
 *         onNavigate={(path) => navigate({ to: path })}
 *         isMobileOpen={mobileOpen}
 *         onMobileClose={() => setMobileOpen(false)}
 *       />
 *       <MobileMenuButton onClick={() => setMobileOpen(true)} />
 *     </>
 *   );
 * }
 * ```
 *
 * ## Accessibility Testing Checklist
 * - [ ] Tab through all navigation items (keyboard navigation)
 * - [ ] Press Enter on focused item (activates navigation)
 * - [ ] Press Escape in mobile drawer (closes drawer)
 * - [ ] Verify focus indicators are visible (2px blue outline)
 * - [ ] Test with screen reader (NVDA, VoiceOver)
 * - [ ] Verify aria-current="page" on active route
 * - [ ] Check touch targets ≥44x44px on mobile
 * - [ ] Test responsive breakpoints (320px, 768px, 1440px)
 */

export default NavigationExample;
