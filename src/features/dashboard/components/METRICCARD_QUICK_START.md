# MetricCard - Quick Start Guide

Get up and running with the MetricCard component in 2 minutes.

---

## Installation

MetricCard is already part of the dashboard components. No installation needed.

---

## Basic Import

```typescript
import { MetricCard } from '@/features/dashboard/components';
```

---

## Simplest Example

```tsx
<MetricCard
  label="Total Files"
  value={1234}
/>
```

---

## With Status Color

```tsx
<MetricCard
  label="Tests Passing"
  value={98.2}
  unit="%"
  status="success"  // Green left border
/>
```

---

## With Icon

```tsx
import { Assessment as AssessmentIcon } from '@mui/icons-material/Assessment';

<MetricCard
  icon={<AssessmentIcon />}
  label="Quality Score"
  value={8.7}
  unit="/10"
  status="success"
/>
```

---

## Interactive Card

```tsx
<MetricCard
  label="Critical Bugs"
  value={5}
  status="error"
  onClick={() => navigate('/bugs/critical')}
/>
```

---

## Full Example

```tsx
import { Assessment as AssessmentIcon } from '@mui/icons-material/Assessment';

<MetricCard
  icon={<AssessmentIcon />}
  label="Lines of Code"
  value={1234567}
  unit="lines"
  status="primary"
  trend="+5,432 this month"
  onClick={() => console.log('Navigate to details')}
/>
```

---

## Dashboard Grid Layout

```tsx
import { Grid } from '@mui/material';
import { MetricCard } from '@/features/dashboard/components';
import {
  Assessment,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';

function DashboardMetrics() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<Assessment />}
          label="Total Files"
          value={1234}
          status="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<CheckCircle />}
          label="Tests Passing"
          value={98.2}
          unit="%"
          status="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<Warning />}
          label="Code Smells"
          value={23}
          status="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          icon={<Error />}
          label="Critical Bugs"
          value={5}
          status="error"
        />
      </Grid>
    </Grid>
  );
}
```

---

## Status Colors

| Status | Color | Use Case |
|--------|-------|----------|
| `"default"` | No border | Neutral metrics |
| `"primary"` | Blue | Key metrics |
| `"success"` | Green | Positive results |
| `"warning"` | Orange | Needs attention |
| `"error"` | Red | Critical issues |

---

## Common Props

| Prop | Type | Required | Example |
|------|------|----------|---------|
| `label` | string | ✅ | `"Total Files"` |
| `value` | number \| string | ✅ | `1234` or `"2m 34s"` |
| `icon` | ReactNode | ❌ | `<AssessmentIcon />` |
| `unit` | string | ❌ | `"%"`, `"files"`, `"ms"` |
| `status` | string | ❌ | `"success"` |
| `trend` | string | ❌ | `"+12% from last week"` |
| `onClick` | function | ❌ | `() => navigate('/details')` |

---

## Responsive Behavior

- **Desktop (≥768px)**: Value = 48px, Unit = 16px
- **Mobile (<768px)**: Value = 32px, Unit = 14px
- **Auto-scales**: No manual breakpoints needed

---

## Accessibility

- **Keyboard**: Tab to focus, Enter/Space to click
- **Screen Reader**: All text announced correctly
- **Color Contrast**: WCAG AA compliant

---

## Tips

1. **Import Icons Individually**: Reduces bundle size
   ```tsx
   // Good
   import { Assessment } from '@mui/icons-material/Assessment';

   // Avoid
   import { Assessment } from '@mui/icons-material';
   ```

2. **Number Formatting**: Pass numbers for auto-formatting
   ```tsx
   value={1234}        // Displays "1,234"
   value="1234"        // Displays "1234"
   ```

3. **Status for Context**: Use status to convey meaning
   ```tsx
   <MetricCard value={5} status="error" />    // Red = bad
   <MetricCard value={98} status="success" /> // Green = good
   ```

4. **Trend for Details**: Add context with trend
   ```tsx
   trend="+12% from last week"
   trend="Updated 5 minutes ago"
   trend="-3 from yesterday"
   ```

---

## Full Documentation

For complete API reference, see:
- `METRICCARD_README.md` - Comprehensive guide
- `MetricCardExample.tsx` - 20+ examples
- `MetricCard.tsx` - Inline code documentation

---

## Need Help?

- **Examples**: See `MetricCardExample.tsx`
- **API Docs**: See `METRICCARD_README.md`
- **Theme Setup**: See `src/theme/dashboardTheme.ts`
- **Integration**: See `INTEGRATION_GUIDE.md`

---

**Last Updated**: 2025-12-08 (Task 1.3.1)
