# Navigation Components - Quick Start Guide

Get started with the Sidebar and MobileMenu components in under 5 minutes.

## Installation

These components are already built and ready to use. No installation needed!

**Dependencies**:
- `@mui/material` (for UI components)
- `@mui/icons-material` (for navigation icons)
- React 18+

## Basic Usage

### Step 1: Import Components

```tsx
import { Sidebar, MobileMenuButton } from '@/features/dashboard/components';
```

### Step 2: Add State Management

```tsx
import { useState } from 'react';

function App() {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // Your layout here
  );
}
```

### Step 3: Add Sidebar to Your Layout

```tsx
<Box sx={{ display: 'flex' }}>
  {/* Sidebar */}
  <Sidebar
    currentPath={currentPath}
    onNavigate={(path) => {
      console.log('Navigating to:', path);
      setCurrentPath(path);
    }}
    isMobileOpen={mobileOpen}
    onMobileClose={() => setMobileOpen(false)}
  />

  {/* Main content */}
  <Box component="main" sx={{ flexGrow: 1 }}>
    {/* Your content here */}
  </Box>
</Box>
```

### Step 4: Add Mobile Menu Button (in Header)

```tsx
<AppBar position="sticky">
  <Toolbar>
    {/* Hamburger button (only shows on mobile) */}
    <MobileMenuButton onClick={() => setMobileOpen(true)} />

    <Typography variant="h6">My Dashboard</Typography>
  </Toolbar>
</AppBar>
```

## Complete Example

```tsx
import { useState } from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { Sidebar, MobileMenuButton } from '@/features/dashboard/components';

function DashboardApp() {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    // Add your routing logic here
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Navigation Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <AppBar position="sticky" sx={{ backgroundColor: '#fff' }}>
          <Toolbar>
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
            <Typography variant="h6" color="textPrimary">
              Code Inventory Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ p: { xs: 2, md: 4 }, flexGrow: 1 }}>
          <Typography variant="h4">
            Current Page: {currentPath}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default DashboardApp;
```

## Alternative: Bottom Navigation

Want bottom tabs instead of a drawer on mobile?

```tsx
import { Sidebar, MobileMenu } from '@/features/dashboard/components';

function DashboardApp() {
  const [currentPath, setCurrentPath] = useState('/dashboard');

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar currentPath={currentPath} onNavigate={setCurrentPath} />

      <Box sx={{ flexGrow: 1, pb: { xs: 10, md: 4 } }}>
        {/* Content - note the bottom padding for mobile */}
      </Box>

      {/* Bottom navigation (only renders on mobile) */}
      <MobileMenu currentPath={currentPath} onNavigate={setCurrentPath} />
    </Box>
  );
}
```

## Integration with TanStack Router

```tsx
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Sidebar, MobileMenuButton } from '@/features/dashboard/components';

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar
        currentPath={location.pathname}
        onNavigate={(path) => navigate({ to: path })}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box sx={{ flexGrow: 1 }}>
        <AppBar>
          <Toolbar>
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
          </Toolbar>
        </AppBar>

        {/* Your routed content */}
      </Box>
    </Box>
  );
}
```

## Customization

### Change Navigation Items

Edit `Sidebar.tsx` lines 34-56 to modify the navigation items:

```tsx
const navigationItems: NavItem[] = [
  {
    label: 'Your Label',
    path: '/your/path',
    icon: <YourIcon />,
  },
  // Add more items...
];
```

### Change Active State Color

Update CSS variables in `design-tokens.css`:

```css
--color-primary: #your-color;
--color-primary-dark: #your-darker-color;
```

### Change Sidebar Width

Modify the width in both places:

```tsx
// In Sidebar.tsx
sx={{ width: 280 }}  // Change from 240 to 280

// In List component
sx={{ width: 280, ... }}
```

## Keyboard Shortcuts

- **Tab**: Navigate between items
- **Enter**: Activate selected item
- **Escape**: Close mobile drawer

## Accessibility

All components are WCAG 2.1 Level AA compliant:
- Keyboard navigable
- Screen reader friendly
- Proper ARIA labels
- Visible focus indicators
- Touch targets ≥44x44px

## Troubleshooting

### Active state not showing?
Make sure `currentPath` matches your route path exactly.

### Mobile drawer not opening?
Verify `isMobileOpen` state is being set to `true`.

### Hamburger button not visible?
Check that you're testing at <768px width.

### Navigation not working?
Ensure `onNavigate` callback is implemented and updates your route.

## Need More Help?

- **Full Documentation**: See `NAVIGATION_README.md`
- **Examples**: See `NavigationExample.tsx`
- **Task Verification**: See `TASK_1.2.2_VERIFICATION.md`

## File Locations

```
/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/
├── Sidebar.tsx              # Main component
├── MobileMenu.tsx           # Bottom nav alternative
├── index.ts                 # Exports
├── NAVIGATION_README.md     # Full documentation
├── NavigationExample.tsx    # Integration examples
└── QUICK_START.md          # This file
```

---

**Quick Links**:
- Design Tokens: `src/styles/design-tokens.css`
- Global Styles: `src/styles/global.css`
- MUI Theme: `src/theme/dashboardTheme.ts`
