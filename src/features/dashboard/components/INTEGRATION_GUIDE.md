# Header Component Integration Guide

Quick start guide for integrating the Header component into your dashboard application.

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

### Step 2: Import Required Styles

In your root `index.tsx` or `App.tsx`:

```typescript
import '@/styles/design-tokens.css';
import '@/styles/global.css';
```

### Step 3: Wrap with Theme Provider

```typescript
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dashboardTheme } from '@/theme/dashboardTheme';
import { Header } from '@/features/dashboard/components';

function App() {
  return (
    <ThemeProvider theme={dashboardTheme}>
      <CssBaseline />
      <Header lastGenerated={new Date()} />
      {/* Your dashboard content */}
    </ThemeProvider>
  );
}

export default App;
```

### Step 4: Add Callbacks (Optional)

```typescript
function App() {
  const handleSettings = () => {
    // Open settings modal
    console.log('Settings clicked');
  };

  const handleExport = () => {
    // Export dashboard data
    console.log('Export clicked');
  };

  return (
    <ThemeProvider theme={dashboardTheme}>
      <CssBaseline />
      <Header
        lastGenerated={new Date()}
        onSettingsClick={handleSettings}
        onExportClick={handleExport}
      />
      {/* Your dashboard content */}
    </ThemeProvider>
  );
}
```

## Complete Example

See `/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/HeaderExample.tsx` for a full working example with:
- Theme provider setup
- Auto-refreshing timestamp
- Settings modal integration
- Export functionality
- Sticky header demonstration

## Common Integration Patterns

### With React Router

```typescript
import { BrowserRouter as Router } from 'react-router-dom';
import { Header } from '@/features/dashboard/components';

function App() {
  return (
    <Router>
      <ThemeProvider theme={dashboardTheme}>
        <Header lastGenerated={new Date()} />
        <Routes>
          {/* Your routes */}
        </Routes>
      </ThemeProvider>
    </Router>
  );
}
```

### With Redux State

```typescript
import { useSelector } from 'react-redux';
import { Header } from '@/features/dashboard/components';

function Dashboard() {
  const lastGenerated = useSelector(state => state.dashboard.lastGenerated);

  return (
    <Header lastGenerated={lastGenerated} />
  );
}
```

### With Settings Modal

```typescript
import { useState } from 'react';
import { Header } from '@/features/dashboard/components';
import { SettingsDialog } from '@/components/SettingsDialog';

function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <Header
        lastGenerated={new Date()}
        onSettingsClick={() => setSettingsOpen(true)}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
```

### With Data Export

```typescript
import { Header } from '@/features/dashboard/components';
import { exportDashboardData } from '@/utils/export';

function Dashboard() {
  const handleExport = async () => {
    const data = await fetchDashboardData();
    exportDashboardData(data, 'dashboard-export.json');
  };

  return (
    <Header
      lastGenerated={new Date()}
      onExportClick={handleExport}
    />
  );
}
```

## Troubleshooting

### Issue: Header not sticky

**Cause**: Missing theme provider or incorrect parent container

**Solution**:
```typescript
// Ensure Header is wrapped with ThemeProvider
<ThemeProvider theme={dashboardTheme}>
  <Header />
</ThemeProvider>

// Ensure parent container allows sticky positioning
<Box sx={{ height: '100vh', overflow: 'auto' }}>
  <Header />
  {/* Content */}
</Box>
```

### Issue: Gradient not showing

**Cause**: CSS not imported

**Solution**:
```typescript
// Add to your root file
import '@/styles/design-tokens.css';
import '@/styles/global.css';
```

### Issue: Mobile menu not working

**Cause**: Viewport meta tag missing

**Solution**:
```html
<!-- Add to index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Issue: TypeScript errors

**Cause**: Missing type definitions

**Solution**:
```bash
npm install --save-dev @types/react @types/react-dom
```

## Testing Your Integration

### Manual Testing Checklist

- [ ] Header renders without errors
- [ ] Branding text "Code Inventory" is visible
- [ ] Timestamp displays (if provided)
- [ ] Settings button is clickable
- [ ] Export button is clickable
- [ ] Header sticks to top on scroll
- [ ] Gradient background is visible
- [ ] Mobile menu works on small screens
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus indicators visible on buttons

### Automated Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardTheme } from '@/theme/dashboardTheme';
import { Header } from '@/features/dashboard/components';

describe('Header Integration', () => {
  it('should render in application', () => {
    render(
      <ThemeProvider theme={dashboardTheme}>
        <Header lastGenerated={new Date()} />
      </ThemeProvider>
    );

    expect(screen.getByRole('heading', { name: /code inventory/i })).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const Header = lazy(() => import('@/features/dashboard/components/Header'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Header lastGenerated={new Date()} />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo } from 'react';

const MemoizedHeader = memo(Header, (prevProps, nextProps) => {
  return prevProps.lastGenerated?.getTime() === nextProps.lastGenerated?.getTime();
});
```

## Next Steps

1. **Add Sidebar**: Integrate Sidebar component (Task 1.2.2)
2. **Add Content**: Build dashboard content components
3. **Add Routing**: Set up React Router for navigation
4. **Add State Management**: Integrate Redux/Zustand for global state
5. **Add Data Fetching**: Connect to API for real data

## Resources

- [Component README](/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/Header.README.md)
- [Theme Documentation](/Users/alyshialedlie/code/Inventory/src/theme/README.md)
- [Design Tokens](/Users/alyshialedlie/code/Inventory/src/styles/design-tokens.css)
- [Storybook Stories](/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/__stories__/Header.stories.tsx)
- [Unit Tests](/Users/alyshialedlie/code/Inventory/tests/unit/components/test_Header.tsx)

## Support

For issues or questions:
1. Check the [Component README](Header.README.md)
2. Review the [complete example](HeaderExample.tsx)
3. Run Storybook: `npm run storybook`
4. Check unit tests: `npm test -- test_Header.tsx`

---

Last updated: December 8, 2025
