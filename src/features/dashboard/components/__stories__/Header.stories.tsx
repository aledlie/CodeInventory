/**
 * Storybook Stories for Header Component
 *
 * Visual testing and documentation for the Header component.
 * Shows different states and configurations.
 *
 * Stories:
 * - Default: Basic header with all features
 * - Without Timestamp: Header without last generated time
 * - With Callbacks: Header with interactive callbacks
 * - Mobile View: Header in mobile viewport
 * - Desktop View: Header in desktop viewport
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardTheme } from '../../../../theme/dashboardTheme';
import { Header } from '../Header';
import { logger } from '../../helpers/logger';

// Wrapper component to provide theme
const ThemedHeader = (props: any) => (
  <ThemeProvider theme={dashboardTheme}>
    <Header {...props} />
  </ThemeProvider>
);

// Story metadata
const meta: Meta<typeof Header> = {
  title: 'Dashboard/Header',
  component: ThemedHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Header Component

A responsive, accessible header for the Code Inventory Dashboard.

## Features
- Sticky positioning on scroll
- Gradient background (#0066cc to #0052a3)
- Responsive layout (desktop horizontal, mobile stacked)
- WCAG AA compliant accessibility
- Keyboard navigation support
- Mobile drawer menu for actions

## Breakpoints
- **Desktop (>= 768px)**: Horizontal layout with branding left, actions right
- **Mobile (< 768px)**: Stacked layout with hamburger menu
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    lastGenerated: {
      control: 'date',
      description: 'Timestamp of when the dashboard data was last generated',
    },
    onSettingsClick: {
      action: 'settings clicked',
      description: 'Callback when settings button is clicked',
    },
    onExportClick: {
      action: 'export clicked',
      description: 'Callback when export button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

// Default story with all features
export const Default: Story = {
  args: {
    lastGenerated: new Date(),
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
};

// Without timestamp
export const WithoutTimestamp: Story = {
  args: {
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
};

// With specific timestamp
export const WithCustomTimestamp: Story = {
  args: {
    lastGenerated: new Date('2025-12-08T23:30:45'),
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
};

// Mobile viewport
export const MobileView: Story = {
  args: {
    lastGenerated: new Date(),
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Tablet viewport
export const TabletView: Story = {
  args: {
    lastGenerated: new Date(),
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// Desktop viewport
export const DesktopView: Story = {
  args: {
    lastGenerated: new Date(),
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

// Interactive example with console logging
export const Interactive: Story = {
  args: {
    lastGenerated: new Date(),
    onSettingsClick: () => {
      logger.info('Header.stories', 'Settings clicked');
      alert('Settings clicked! Check console for details.');
    },
    onExportClick: () => {
      logger.info('Header.stories', 'Export clicked');
      alert('Export clicked! Check console for details.');
    },
  },
};

// Accessibility testing
export const AccessibilityTest: Story = {
  args: {
    lastGenerated: new Date('2025-12-08T23:30:45'),
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'landmark-one-main',
            enabled: false, // Header is not a main landmark
          },
        ],
      },
    },
  },
};

// Dark mode simulation (if theme supports it)
export const DarkModeSimulation: Story = {
  args: {
    lastGenerated: new Date(),
    onSettingsClick: action('settings-clicked'),
    onExportClick: action('export-clicked'),
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};
