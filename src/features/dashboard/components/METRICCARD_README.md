# MetricCard Component

## Overview

The `MetricCard` component is a reusable, accessible metric display card designed for dashboard KPI visualization. It features status-based visual indicators, responsive typography, optional icons and trend data, and full keyboard navigation support.

## Features

- **Status Variants**: 4px left border accent in 5 colors (default, primary, success, warning, error)
- **Responsive Typography**: 48px value on desktop, 32px on mobile
- **Optional Elements**: Icon, unit suffix, trend indicator
- **Interactive**: Optional click handler with hover/focus states
- **Accessible**: WCAG AA compliant, keyboard navigable, proper ARIA roles
- **Smooth Transitions**: 200ms animations for hover/focus states
- **Theme Integration**: Fully integrated with MUI v7 theme and design tokens

---

## Props Interface

```typescript
interface MetricCardProps {
  /** Optional icon displayed in header alongside label */
  icon?: React.ReactNode;

  /** Metric label/title */
  label: string;

  /** Metric value (number or formatted string) */
  value: number | string;

  /** Optional unit suffix (e.g., "files", "%", "ms") */
  unit?: string;

  /** Status variant controlling left border color */
  status?: 'default' | 'primary' | 'success' | 'warning' | 'error';

  /** Optional trend indicator text (e.g., "+12% from last week") */
  trend?: string;

  /** Optional click handler - makes card interactive */
  onClick?: () => void;
}
```

---

## Usage Examples

### Basic Metric Card

```tsx
import { MetricCard } from '@/features/dashboard/components';

<MetricCard
  label="Total Files"
  value={1234}
/>
```

### With Unit

```tsx
<MetricCard
  label="Code Coverage"
  value={87.5}
  unit="%"
/>
```

### With Icon and Status

```tsx
import { Assessment as AssessmentIcon } from '@mui/icons-material';

<MetricCard
  icon={<AssessmentIcon />}
  label="Quality Score"
  value={8.7}
  unit="/10"
  status="success"
/>
```

### With Trend Indicator

```tsx
<MetricCard
  label="Tests Passing"
  value={98.2}
  unit="%"
  status="success"
  trend="+2.1% from last run"
/>
```

### Interactive Card

```tsx
import { BugReport as BugReportIcon } from '@mui/icons-material';

<MetricCard
  icon={<BugReportIcon />}
  label="Critical Bugs"
  value={5}
  status="error"
  trend="+2 new today"
  onClick={() => console.log('Navigate to bug list')}
/>
```

### Full-Featured Example

```tsx
import { Code as CodeIcon } from '@mui/icons-material';

<MetricCard
  icon={<CodeIcon />}
  label="Lines of Code"
  value={1234567}
  unit="lines"
  status="primary"
  trend="+5,432 this month"
  onClick={() => navigate('/metrics/loc')}
/>
```

---

## Status Variants

Each status variant applies a 4px left border with specific theme colors:

| Status    | Border Color            | Use Case                          |
|-----------|-------------------------|-----------------------------------|
| `default` | Transparent             | Neutral metrics, no status needed |
| `primary` | `#0066cc` (blue)        | Key metrics, primary KPIs         |
| `success` | `#28a745` (green)       | Positive metrics, goals met       |
| `warning` | `#ff9800` (orange)      | Caution metrics, attention needed |
| `error`   | `#dc3545` (red)         | Critical issues, failures         |

### Status Usage Examples

```tsx
// Default - No border
<MetricCard label="Total Repos" value={42} />

// Primary - Blue border
<MetricCard label="Active Projects" value={12} status="primary" />

// Success - Green border
<MetricCard label="Tests Passing" value={98.2} unit="%" status="success" />

// Warning - Orange border
<MetricCard label="Code Smells" value={23} status="warning" />

// Error - Red border
<MetricCard label="Failed Builds" value={3} status="error" />
```

---

## Layout Structure

The MetricCard follows a vertical layout:

```
┌─────────────────────────────────┐
│ 4px border │ [Icon] Label       │ ← Header (flex, gap: 8px)
│            │                    │
│            │ 1,234 units        │ ← Value + Unit (baseline aligned)
│            │                    │
│            │ +12% from last week│ ← Trend (12px, optional)
└─────────────────────────────────┘
```

### Spacing

- **Card Padding**: 24px (from MUI theme CardContent override)
- **Header-to-Value**: 16px margin-bottom
- **Value-to-Trend**: 8px margin-bottom
- **Icon-to-Label**: 8px gap (flex)
- **Value-to-Unit**: 4px gap (flex)

---

## Responsive Behavior

### Desktop (≥768px)

- Value font size: **48px**
- Unit font size: **16px**
- Card hover lift: **-2px translateY**
- Shadow: elevation 2 → elevation 4 on hover

### Mobile (<768px)

- Value font size: **32px** (scales down)
- Unit font size: **14px**
- Card hover lift: **-2px translateY** (same)
- Shadow: elevation 2 → elevation 4 on hover (same)

### Responsive Breakpoint

The component uses `useMediaQuery(theme.breakpoints.down('md'))` which maps to `<768px` based on the MUI theme configuration.

```tsx
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

// Applied in sx prop:
fontSize: isMobile ? '2rem' : '3rem' // 32px : 48px
```

---

## Accessibility Features

### Keyboard Navigation

When `onClick` is provided:

- **Tab**: Focus on card
- **Enter**: Trigger onClick
- **Space**: Trigger onClick
- **Focus Visible**: 2px blue outline with 2px offset

### ARIA Attributes

- **role="button"**: Applied when clickable
- **tabIndex={0}**: Applied when clickable (enables keyboard focus)
- **Keyboard event handlers**: Enter/Space trigger onClick

### Screen Reader Support

- Label announced via `<h3>` heading with `subtitle1` variant
- Value announced as main content
- Trend announced as caption text
- Status conveyed via visual border (icon recommended for clarity)

### Color Contrast

All text meets WCAG AA requirements:

- **Label**: `text.secondary` (#666666) on white (4.54:1 ratio)
- **Value**: `text.primary` (#1a1a1a) on white (12.63:1 ratio)
- **Trend**: `text.secondary` (#666666) on white (4.54:1 ratio)
- **Status borders**: All status colors meet 3:1 UI element contrast

---

## Styling Details

### Card Styles

```tsx
{
  position: 'relative',
  borderLeft: '4px solid [status-color]',
  cursor: clickable ? 'pointer' : 'default',
  transition: 'box-shadow 200ms, transform 200ms, border-color 200ms',

  // Hover (clickable only)
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4], // --shadow-lg
  },

  // Focus (keyboard)
  '&:focus-visible': {
    outline: '2px solid #0066cc',
    outlineOffset: '2px',
  }
}
```

### Typography Styles

| Element | Font Size       | Font Weight | Color           |
|---------|-----------------|-------------|-----------------|
| Label   | 14px            | 500         | text.secondary  |
| Value   | 48px / 32px     | 700         | text.primary    |
| Unit    | 16px / 14px     | 500         | text.secondary  |
| Trend   | 12px            | 400         | text.secondary  |

---

## Integration with Theme

### Design Tokens Used

- **Colors**: All status colors from `src/styles/design-tokens.css`
- **Typography**: Font sizes, weights, line heights from theme
- **Spacing**: 8px base unit spacing scale
- **Shadows**: `--shadow-card`, `--shadow-lg`
- **Transitions**: `--transition-normal` (200ms)
- **Breakpoints**: `--breakpoint-md` (768px)

### Theme Palette Mapping

```typescript
const STATUS_COLORS = {
  default: 'transparent',
  primary: 'primary.main',    // theme.palette.primary.main (#0066cc)
  success: 'success.main',    // theme.palette.success.main (#28a745)
  warning: 'warning.main',    // theme.palette.warning.main (#ff9800)
  error: 'error.main',        // theme.palette.error.main (#dc3545)
};
```

---

## Performance Considerations

### Rendering Optimization

- **Pure functional component**: No unnecessary re-renders
- **Memoization**: Component is memo-eligible (add `React.memo` if needed)
- **Conditional styles**: Uses `shouldForwardProp` to avoid DOM warnings
- **Theme hooks**: `useTheme` and `useMediaQuery` cached by MUI

### Bundle Size

- **Direct imports**: Use named imports to enable tree-shaking
- **Icon imports**: Import individual icons from `@mui/icons-material` not index
- **MUI components**: Only imports Card, CardContent, Box, Typography

```tsx
// Good - tree-shakeable
import { MetricCard } from '@/features/dashboard/components';
import { Assessment as AssessmentIcon } from '@mui/icons-material/Assessment';

// Bad - imports entire icon library
import { Assessment } from '@mui/icons-material';
```

---

## Testing

### Unit Test Coverage

Test file: `tests/unit/test_metric_card.tsx`

Coverage includes:

- [x] Renders with required props (label, value)
- [x] Displays optional icon
- [x] Displays optional unit
- [x] Displays optional trend
- [x] Applies correct status border colors
- [x] Handles onClick interaction
- [x] Keyboard navigation (Enter/Space)
- [x] Responsive font scaling
- [x] Number formatting (toLocaleString)
- [x] ARIA attributes when clickable

### Integration Testing

Test with:

1. **Screen reader**: Verify label, value, trend announced correctly
2. **Keyboard navigation**: Tab to focus, Enter/Space to activate
3. **Mobile viewport**: Verify 32px font size
4. **Desktop viewport**: Verify 48px font size
5. **Status variants**: Verify all 5 border colors render correctly

---

## Common Use Cases

### Dashboard Overview

```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <MetricCard
      icon={<AssessmentIcon />}
      label="Total Files"
      value={1234}
      status="primary"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <MetricCard
      icon={<CheckCircleIcon />}
      label="Tests Passing"
      value={98.2}
      unit="%"
      status="success"
      trend="+2.1% from last run"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <MetricCard
      icon={<WarningIcon />}
      label="Code Smells"
      value={23}
      status="warning"
      onClick={() => navigate('/quality/smells')}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <MetricCard
      icon={<ErrorIcon />}
      label="Critical Bugs"
      value={5}
      status="error"
      trend="+2 new today"
      onClick={() => navigate('/bugs/critical')}
    />
  </Grid>
</Grid>
```

### Large Number Display

```tsx
<MetricCard
  icon={<CodeIcon />}
  label="Total Lines of Code"
  value={1234567} // Displays as "1,234,567"
  unit="lines"
  status="primary"
/>
```

### String Values

```tsx
<MetricCard
  label="Build Time"
  value="2m 34s"
  status="warning"
  trend="+15s slower than average"
/>
```

---

## Comparison with Similar Components

| Feature                  | MetricCard | MUI Card | Custom Div |
|--------------------------|------------|----------|------------|
| Status border            | ✅          | ❌        | Manual     |
| Responsive typography    | ✅          | ❌        | Manual     |
| Hover/focus states       | ✅          | ❌        | Manual     |
| Keyboard navigation      | ✅          | ❌        | Manual     |
| Icon support             | ✅          | Manual   | Manual     |
| Trend indicator          | ✅          | ❌        | Manual     |
| Theme integration        | ✅          | ✅        | Manual     |
| Accessible by default    | ✅          | Partial  | Manual     |

---

## Troubleshooting

### Issue: Icon not showing

**Solution**: Ensure you're importing the icon component correctly:

```tsx
import { Assessment as AssessmentIcon } from '@mui/icons-material/Assessment';

<MetricCard icon={<AssessmentIcon />} ... />
```

### Issue: Card not clickable

**Solution**: Verify `onClick` prop is provided:

```tsx
<MetricCard
  onClick={() => console.log('Clicked')} // Must be present
  ...
/>
```

### Issue: Value not formatting with commas

**Solution**: Pass a number, not a string:

```tsx
<MetricCard value={1234} />      // ✅ Displays "1,234"
<MetricCard value="1234" />      // ❌ Displays "1234"
```

### Issue: Border color not matching theme

**Solution**: Verify theme is correctly set up and status matches palette:

```tsx
// Ensure status is one of: 'default' | 'primary' | 'success' | 'warning' | 'error'
<MetricCard status="success" ... /> // ✅
<MetricCard status="good" ... />    // ❌ Falls back to default
```

---

## Changelog

### v1.0.0 (Initial Release)

- Created MetricCard component with all core features
- 5 status variants (default, primary, success, warning, error)
- Responsive typography (48px → 32px)
- Optional icon, unit, trend, onClick
- Full keyboard navigation support
- WCAG AA compliant
- Integrated with MUI v7 theme

---

## Related Components

- **Header**: Dashboard header with navigation
- **Sidebar**: Side navigation panel
- **DashboardLayout**: Main layout wrapper
- **DataTable** (upcoming): Tabular data display
- **ChartCard** (upcoming): Chart visualization card

---

## File Locations

- **Component**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/MetricCard.tsx`
- **Example**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/MetricCardExample.tsx`
- **Documentation**: `/Users/alyshialedlie/code/Inventory/src/features/dashboard/components/METRICCARD_README.md`
- **Theme**: `/Users/alyshialedlie/code/Inventory/src/theme/dashboardTheme.ts`
- **Design Tokens**: `/Users/alyshialedlie/code/Inventory/src/styles/design-tokens.css`

---

## Support

For questions or issues, refer to:

- **Dashboard Task Assignments**: `DASHBOARD_TASK_ASSIGNMENTS.md`
- **Integration Guide**: `INTEGRATION_GUIDE.md`
- **Theme Documentation**: `src/theme/dashboardTheme.ts` (inline comments)

---

**Last Updated**: 2025-12-08 (Task 1.3.1 Completion)
