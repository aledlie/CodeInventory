# Dashboard Theme

MUI v7 theme configuration for the Code Inventory Dashboard, fully aligned with the design tokens defined in `src/styles/design-tokens.css`.

## Features

- **WCAG AA Compliant**: All color combinations meet accessibility standards (4.5:1 for text, 3:1 for UI elements)
- **Design Token Alignment**: Every color, spacing, and typography value matches the design system
- **Dark Mode Support**: Pre-configured dark theme variant with maintained contrast ratios
- **8px Base Unit**: Consistent spacing scale using MUI's spacing function
- **Typography Hierarchy**: 32px/24px/18px heading scale with Inter font for headings
- **Component Overrides**: Pre-styled MUI components (Card, Button, Chip, etc.)

## Usage

### Basic Theme Setup

```typescript
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dashboardTheme } from './theme';

function App() {
  return (
    <ThemeProvider theme={dashboardTheme}>
      <CssBaseline />
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### Dark Mode Theme

```typescript
import { darkDashboardTheme } from './theme';

<ThemeProvider theme={darkDashboardTheme}>
  {/* Your app components */}
</ThemeProvider>
```

### Dynamic Theme Switching

```typescript
import { dashboardTheme, darkDashboardTheme } from './theme';
import { useState } from 'react';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ThemeProvider theme={darkMode ? darkDashboardTheme : dashboardTheme}>
      <CssBaseline />
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

## Color Palette

### Primary Colors
- **Primary**: `#0066cc` - Main brand color
- **Success**: `#28a745` - Positive states
- **Warning**: `#ff9800` - Caution states
- **Error**: `#dc3545` - Error states
- **Info**: `#17a2b8` - Informational states

### Neutral Colors
- **Text Primary**: `#1a1a1a` (neutral-900)
- **Text Secondary**: `#666666` (neutral-500)
- **Background Default**: `#f5f5f5` (neutral-50)
- **Background Paper**: `#ffffff` (white)
- **Divider**: `#e0e0e0` (neutral-200)

## Typography Scale

All typography uses the design token values:

| Variant | Font Size | Font Weight | Line Height | Use Case |
|---------|-----------|-------------|-------------|----------|
| h1 | 2rem (32px) | 700 | 1.25 | Page titles |
| h2 | 1.5rem (24px) | 600 | 1.25 | Section headers |
| h3 | 1.125rem (18px) | 600 | 1.25 | Subsection headers |
| h4 | 1rem (16px) | 600 | 1.5 | Card titles |
| body1 | 0.875rem (14px) | 400 | 1.5 | Default body text |
| body2 | 0.8125rem (13px) | 400 | 1.5 | Secondary text |
| caption | 0.75rem (12px) | 400 | 1.5 | Helper text |
| button | 0.875rem (14px) | 500 | 1.5 | Button labels |

## Component Overrides

### MuiCard
- **Border Radius**: 12px (radius-card)
- **Box Shadow**: `0 2px 4px rgba(0, 0, 0, 0.08)` (shadow-card)
- **Hover Effect**: Lifts 2px with enhanced shadow
- **Padding**: 24px (spacing-lg)

### MuiButton
- **Border Radius**: 8px (radius-button)
- **Text Transform**: None (preserves natural case)
- **Padding**: 8px 24px (btn-padding-md)
- **Focus State**: 2px solid outline with 2px offset

### MuiChip
- **Border Radius**: Full (9999px for pill shape)
- **Font Size**: 0.75rem (12px)
- **Height**: 24px
- **Severity Colors**: Uses lightest background with dark text for contrast

### MuiTextField
- **Border Radius**: 8px (radius-input)
- **Focus Border**: 2px solid primary color
- **Hover Border**: neutral-500

## Spacing System

The theme uses an 8px base unit. Use MUI's spacing function:

```typescript
import { Box } from '@mui/material';

<Box sx={{
  padding: 3,      // 24px (3 * 8px)
  margin: 2,       // 16px (2 * 8px)
  gap: 1,          // 8px (1 * 8px)
}}>
```

Common spacing values:
- `1` = 8px (sm)
- `2` = 16px (md)
- `3` = 24px (lg)
- `4` = 32px (xl)
- `6` = 48px (2xl)
- `8` = 64px (3xl)

## Shadows

Elevation-based shadow system:

- **elevation0**: None
- **elevation1**: `0 1px 2px rgba(0, 0, 0, 0.05)` (shadow-xs)
- **elevation2**: `0 1px 3px rgba(0, 0, 0, 0.08)` (shadow-sm)
- **elevation3**: `0 2px 4px rgba(0, 0, 0, 0.08)` (shadow-md)
- **elevation4**: `0 4px 12px rgba(0, 0, 0, 0.12)` (shadow-lg)
- **elevation8**: `0 8px 24px rgba(0, 0, 0, 0.15)` (shadow-xl)

## Responsive Breakpoints

Mobile-first breakpoints matching design tokens:

- **xs**: 0px
- **sm**: 576px
- **md**: 768px
- **lg**: 992px
- **xl**: 1200px

## Accessibility

All theme values maintain WCAG AA compliance:

- **Text Contrast**: Minimum 4.5:1 ratio
- **UI Element Contrast**: Minimum 3:1 ratio
- **Focus Indicators**: 2px solid outline with 2px offset
- **Color Independence**: Never rely solely on color to convey information

## Design Token Mapping

This theme directly maps to CSS custom properties in `design-tokens.css`:

| Theme Property | Design Token |
|----------------|--------------|
| `palette.primary.main` | `--color-primary` |
| `palette.success.main` | `--color-success` |
| `palette.warning.main` | `--color-warning` |
| `palette.error.main` | `--color-error` |
| `palette.info.main` | `--color-info` |
| `palette.text.primary` | `--color-text-primary` |
| `palette.background.default` | `--color-background-secondary` |
| `typography.h1.fontSize` | `--font-size-h1` |
| `typography.fontFamily` | `--font-family-body` |
| `spacing(1)` | `--spacing-sm` |
| `shape.borderRadius` | `--radius-sm` |

## Examples

### Using Theme Colors

```typescript
import { Box } from '@mui/material';

<Box sx={{
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  p: 2,
  borderRadius: 1,
}}>
  Primary Box
</Box>
```

### Using Severity Chips

```typescript
import { Chip } from '@mui/material';

<Chip label="Success" color="success" />
<Chip label="Warning" color="warning" />
<Chip label="Error" color="error" />
<Chip label="Info" color="info" />
```

### Custom Component with Theme

```typescript
import { styled } from '@mui/material/styles';
import { Card } from '@mui/material';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius * 1.5,
}));
```

## Files

- **`dashboardTheme.ts`**: Main theme configuration with component overrides
- **`index.ts`**: Export module for clean imports
- **`README.md`**: This documentation file

## Maintenance

When updating this theme:

1. Always reference `src/styles/design-tokens.css` for values
2. Test color contrast ratios at https://webaim.org/resources/contrastchecker/
3. Verify dark mode maintains accessibility standards
4. Document any new component overrides in this README
5. Add inline comments mapping theme values to design tokens

## Related Documentation

- [Design Tokens Documentation](../styles/design-tokens.css)
- [MUI Theme Documentation](https://mui.com/material-ui/customization/theming/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
