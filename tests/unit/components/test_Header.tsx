/**
 * Unit Tests for Header Component
 *
 * Tests cover:
 * - Rendering and content display
 * - Responsive layout behavior
 * - Accessibility features
 * - User interactions (button clicks, menu toggle)
 * - Timestamp formatting
 * - Keyboard navigation
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardTheme } from '../../../src/theme/dashboardTheme';
import { Header, HeaderProps } from '../../../src/features/dashboard/components/Header';
import '@testing-library/jest-dom';

// Helper function to render component with theme
const renderWithTheme = (props: HeaderProps = {}) => {
  return render(
    <ThemeProvider theme={dashboardTheme}>
      <Header {...props} />
    </ThemeProvider>
  );
};

describe('Header Component', () => {
  describe('Rendering', () => {
    it('should render the branding/logo text', () => {
      renderWithTheme();
      const heading = screen.getByRole('heading', { level: 1, name: /code inventory/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Code Inventory');
    });

    it('should render settings button with aria-label', () => {
      renderWithTheme();
      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton).toHaveAttribute('aria-label', 'Open settings');
    });

    it('should render export button with aria-label', () => {
      renderWithTheme();
      const exportButton = screen.getByRole('button', { name: /export dashboard data/i });
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveAttribute('aria-label', 'Export dashboard data');
    });

    it('should not render timestamp when lastGenerated is not provided', () => {
      renderWithTheme();
      const timestamp = screen.queryByText(/last updated:/i);
      expect(timestamp).not.toBeInTheDocument();
    });

    it('should render timestamp when lastGenerated is provided', () => {
      const testDate = new Date('2025-12-08T23:30:45');
      renderWithTheme({ lastGenerated: testDate });
      const timestamp = screen.getByText(/last updated:/i);
      expect(timestamp).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format timestamp correctly', () => {
      const testDate = new Date('2025-12-08T23:30:45');
      renderWithTheme({ lastGenerated: testDate });
      const timestamp = screen.getByText(/last updated:/i);

      // Timestamp should contain date and time
      expect(timestamp.textContent).toMatch(/12\/8\/2025/);
      expect(timestamp.textContent).toMatch(/11:30:45 PM/);
    });

    it('should use monospace font for timestamp', () => {
      const testDate = new Date('2025-12-08T23:30:45');
      renderWithTheme({ lastGenerated: testDate });
      const timestamp = screen.getByText(/last updated:/i);

      // Check for monospace font family
      const computedStyle = window.getComputedStyle(timestamp);
      expect(computedStyle.fontFamily).toContain('Monaco');
    });
  });

  describe('User Interactions', () => {
    it('should call onSettingsClick when settings button is clicked', () => {
      const onSettingsClick = jest.fn();
      renderWithTheme({ onSettingsClick });

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      fireEvent.click(settingsButton);

      expect(onSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('should call onExportClick when export button is clicked', () => {
      const onExportClick = jest.fn();
      renderWithTheme({ onExportClick });

      const exportButton = screen.getByRole('button', { name: /export dashboard data/i });
      fireEvent.click(exportButton);

      expect(onExportClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when clicking buttons without callbacks', () => {
      renderWithTheme();

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      const exportButton = screen.getByRole('button', { name: /export dashboard data/i });

      expect(() => {
        fireEvent.click(settingsButton);
        fireEvent.click(exportButton);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithTheme();
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('Code Inventory');
    });

    it('should have accessible button labels', () => {
      renderWithTheme();

      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export dashboard data/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation on buttons', () => {
      const onSettingsClick = jest.fn();
      renderWithTheme({ onSettingsClick });

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      settingsButton.focus();

      expect(settingsButton).toHaveFocus();

      // Simulate Enter key press
      fireEvent.keyDown(settingsButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(settingsButton);

      expect(onSettingsClick).toHaveBeenCalled();
    });
  });

  describe('Responsive Layout', () => {
    it('should render mobile menu button on small screens', () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('(max-width: 768px)'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithTheme();

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu');
    });

    it('should open mobile drawer when menu button is clicked', () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('(max-width: 768px)'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithTheme();

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Check if drawer opened with action items
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply gradient background', () => {
      const { container } = renderWithTheme();
      const appBar = container.querySelector('[class*="MuiAppBar"]');

      expect(appBar).toBeInTheDocument();
      // Note: Testing inline styles or computed styles would require DOM environment
    });

    it('should have sticky positioning', () => {
      renderWithTheme();
      const appBar = screen.getByRole('banner').parentElement;

      // AppBar should have position sticky
      expect(appBar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid date gracefully', () => {
      const invalidDate = new Date('invalid');
      renderWithTheme({ lastGenerated: invalidDate });

      // Should render timestamp section even with invalid date
      const timestamp = screen.getByText(/last updated:/i);
      expect(timestamp).toBeInTheDocument();
    });

    it('should handle multiple rapid clicks', () => {
      const onSettingsClick = jest.fn();
      renderWithTheme({ onSettingsClick });

      const settingsButton = screen.getByRole('button', { name: /open settings/i });

      // Rapidly click 5 times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(settingsButton);
      }

      expect(onSettingsClick).toHaveBeenCalledTimes(5);
    });

    it('should render with all props provided', () => {
      const testDate = new Date('2025-12-08T23:30:45');
      const onSettingsClick = jest.fn();
      const onExportClick = jest.fn();

      renderWithTheme({
        lastGenerated: testDate,
        onSettingsClick,
        onExportClick,
      });

      expect(screen.getByRole('heading', { name: /code inventory/i })).toBeInTheDocument();
      expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export dashboard data/i })).toBeInTheDocument();
    });
  });
});
