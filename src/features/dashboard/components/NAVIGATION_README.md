# Dashboard Navigation Components

Comprehensive navigation implementation for the Code Inventory Dashboard with responsive design and full accessibility support.

## Components Overview

### 1. Sidebar (`Sidebar.tsx`)
**Desktop**: Persistent 240px sidebar on the left
**Mobile**: Drawer that slides in from the left (triggered by hamburger menu)

**Features**:
- Active route highlighting with 4px blue underline
- Keyboard navigation (Tab, Enter)
- WCAG AA accessible focus indicators (2px blue outline)
- Smooth transitions (200ms)
- Icons + labels for all navigation items

**Props**:
```typescript
interface SidebarProps {
  currentPath?: string;        // Current active path (e.g., '/dashboard/quality')
  onNavigate?: (path: string) => void;  // Navigation callback
  isMobileOpen?: boolean;       // Mobile drawer open state
  onMobileClose?: () => void;   // Mobile drawer close callback
}
```

### 2. MobileMenuButton (`Sidebar.tsx`)
**Visibility**: Only visible on mobile (<768px)

**Features**:
- Hamburger icon (three lines)
- Triggers mobile drawer open
- Accessible aria-labels
- Focus indicator on keyboard navigation

**Props**:
```typescript
interface MobileMenuButtonProps {
  onClick?: () => void;  // Callback when button is clicked
}
```

### 3. MobileMenu (`MobileMenu.tsx`)
**Alternative mobile navigation pattern**: Bottom tab navigation
**Visibility**: Only visible on mobile (<768px)

**Features**:
- Fixed bottom position (z-index: 1030)
- Icon + label for each tab
- Active tab color highlighting
- Touch targets ≥44x44px (WCAG 2.1 Level AAA)
- Smooth transitions

**Props**:
```typescript
interface MobileMenuProps {
  currentPath?: string;        // Current active path
  onNavigate?: (path: string) => void;  // Navigation callback
}
```

## Navigation Routes

All navigation components use these routes:

| Label | Path | Icon | Description |
|-------|------|------|-------------|
| Dashboard | `/dashboard` | Home | Main dashboard overview |
| Code Quality | `/dashboard/quality` | Checklist | Code quality issues and metrics |
| Test Coverage | `/dashboard/coverage` | BarChart | Test coverage analysis |
| Dependencies | `/dashboard/dependencies` | AccountTree | Dependency graph and circular deps |
| Settings | `/dashboard/settings` | Settings | Dashboard settings |

## Usage Patterns

### Pattern 1: Desktop + Mobile Drawer (Recommended)

```tsx
import { useState } from 'react';
import { Sidebar, MobileMenuButton } from '@/features/dashboard/components';

function DashboardLayout() {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    // Add your navigation logic (e.g., router.push(path))
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar: persistent on desktop, drawer on mobile */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isMobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />

      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* Header with hamburger menu */}
        <AppBar>
          <Toolbar>
            <MobileMenuButton onClick={() => setMobileDrawerOpen(true)} />
            <Typography>Dashboard</Typography>
          </Toolbar>
        </AppBar>

        {/* Your page content */}
      </Box>
    </Box>
  );
}
```

### Pattern 2: Desktop + Mobile Bottom Tabs (Alternative)

```tsx
import { Sidebar, MobileMenu } from '@/features/dashboard/components';

function DashboardLayout() {
  const [currentPath, setCurrentPath] = useState('/dashboard');

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar currentPath={currentPath} onNavigate={setCurrentPath} />

      <Box component="main" sx={{ flexGrow: 1, pb: { xs: 10, md: 4 } }}>
        {/* Your content - add bottom padding on mobile for bottom nav */}
      </Box>

      {/* Bottom navigation (only renders on mobile) */}
      <MobileMenu currentPath={currentPath} onNavigate={setCurrentPath} />
    </Box>
  );
}
```

### Pattern 3: With TanStack Router Integration

```tsx
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Sidebar, MobileMenuButton } from '@/features/dashboard/components';

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate({ to: path });
  };

  return (
    <>
      <Sidebar
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <MobileMenuButton onClick={() => setMobileOpen(true)} />
    </>
  );
}
```

## Responsive Behavior

### Desktop (≥768px)
- **Sidebar**: Persistent, 240px width, sticky position
- **MobileMenuButton**: Hidden
- **MobileMenu**: Hidden

### Mobile (<768px)
- **Sidebar**: Drawer (slides in from left when triggered)
- **MobileMenuButton**: Visible in header
- **MobileMenu**: Option to use bottom tab navigation instead of drawer

### Breakpoints
Using MUI breakpoints:
- `md` breakpoint: 768px
- Mobile: `theme.breakpoints.down('md')` → <768px
- Desktop: `theme.breakpoints.up('md')` → ≥768px

## Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate between items
- **Enter**: Activate navigation item
- **Escape**: Close mobile drawer (when open)

### ARIA Attributes
- `aria-current="page"` on active route
- `aria-label` on all interactive elements
- `aria-expanded` on mobile menu button
- `aria-controls` linking button to drawer

### Focus Indicators
- 2px blue outline on focus-visible
- 2px outline offset for clarity
- Visible on all interactive elements
- Respects `:focus-visible` (no outline on mouse click)

### Screen Reader Support
- Semantic HTML (`<nav>`, `<aside>`)
- Descriptive labels on all icons
- Proper heading hierarchy
- Live regions for state changes

### Touch Targets
- All touch targets ≥44x44px (WCAG 2.1 Level AAA)
- Adequate spacing between tappable elements (≥12px)
- Bottom navigation optimized for thumb reach

## Styling & Theming

### CSS Variables Used
```css
/* Colors */
--color-primary: #0066cc
--color-primary-dark: #004099
--color-primary-light: #3385ff
--color-text-primary: #1a1a1a
--color-text-secondary: #666666
--color-background-primary: #ffffff
--color-background-secondary: #f5f5f5
--color-border: #e0e0e0

/* Typography */
--font-size-body: 14px
--font-size-small: 12px

/* Spacing */
--spacing-md: 16px
--spacing-lg: 24px

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.12)

/* Transitions */
--transition-normal: 200ms
--ease-in-out: ease-in-out

/* Z-Index */
--z-index-fixed: 1030
```

### Active State Styling
- 4px blue left border (`var(--color-primary)`)
- Light blue background (rgba(0, 102, 204, 0.1))
- Bold font weight (600)
- Blue icon color
- Dark blue text color

### Hover State
- Light blue background (rgba(0, 102, 204, 0.08))
- Lighter border color (`var(--color-primary-light)`)

## Testing Checklist

### Functional Testing
- [ ] Navigation items render correctly
- [ ] Active route is highlighted with 4px underline
- [ ] Clicking item triggers `onNavigate` callback
- [ ] Mobile drawer opens when hamburger clicked
- [ ] Mobile drawer closes when item clicked
- [ ] Mobile drawer closes when close button clicked

### Responsive Testing
- [ ] Desktop sidebar is persistent at ≥768px
- [ ] Mobile drawer triggers at <768px
- [ ] MobileMenuButton only shows at <768px
- [ ] MobileMenu only shows at <768px (if used)
- [ ] No horizontal scroll at any breakpoint
- [ ] Test at 320px (iPhone SE), 768px (tablet), 1440px (desktop)

### Accessibility Testing
- [ ] Tab through all navigation items
- [ ] Enter key activates navigation
- [ ] Escape closes mobile drawer
- [ ] Focus indicators visible (2px blue outline)
- [ ] Screen reader announces "Navigation" and item labels
- [ ] aria-current="page" on active route
- [ ] All icons have accessible labels
- [ ] Touch targets ≥44x44px on mobile

### Browser Testing
- [ ] Chrome (90+)
- [ ] Firefox (88+)
- [ ] Safari (14+)
- [ ] Edge (90+)

## Performance Considerations

### Code Splitting
- Components can be lazy-loaded if not immediately needed
- MUI icons are tree-shakeable (only imports used icons)

### Optimizations
- `keepMounted: true` on mobile drawer for better performance
- CSS transitions (hardware-accelerated)
- No re-renders on inactive state changes

## Common Issues & Solutions

### Issue: Active state not updating
**Solution**: Ensure `currentPath` prop is updated when route changes
```tsx
const location = useLocation();
<Sidebar currentPath={location.pathname} />
```

### Issue: Mobile drawer not closing after navigation
**Solution**: Ensure `onMobileClose` is called in navigation handler
```tsx
const handleNavigate = (path: string) => {
  navigate(path);
  setMobileDrawerOpen(false); // Close drawer
};
```

### Issue: Focus indicators not visible
**Solution**: Check that CSS variables are loaded and design-tokens.css is imported

### Issue: Bottom navigation overlapping content
**Solution**: Add bottom padding to main content area on mobile
```tsx
<Box sx={{ pb: { xs: 10, md: 4 } }}>
  {/* Content */}
</Box>
```

## Future Enhancements

### Phase 5 (Optional)
- [ ] Dark mode support (via theme toggle)
- [ ] Collapsible desktop sidebar (minimize to icons only)
- [ ] Breadcrumb navigation integration
- [ ] Keyboard shortcuts (e.g., Cmd+1 for Dashboard)
- [ ] Recent pages history in dropdown

## Related Files

- **Design System**: `src/styles/design-tokens.css`
- **Global Styles**: `src/styles/global.css`
- **MUI Theme**: `src/theme/dashboardTheme.ts` (Task 1.1.3)
- **Header Component**: `src/features/dashboard/components/Header.tsx` (Task 1.2.1)

## References

- [MUI Drawer Documentation](https://mui.com/material-ui/react-drawer/)
- [MUI Bottom Navigation](https://mui.com/material-ui/react-bottom-navigation/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [TanStack Router](https://tanstack.com/router/latest)

---

**Task**: 1.2.2 - Navigation Sidebar & Mobile Menu
**Status**: COMPLETE
**Created**: 2025-12-08
**Dependencies**: Task 1.1.3 (MUI Theme)
