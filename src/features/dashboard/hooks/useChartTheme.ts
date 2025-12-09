/**
 * Chart Theme Hook for Phase 3 Visualizations
 *
 * Provides Chart.js configuration that integrates with the MUI theme,
 * ensuring consistent styling across all chart components.
 */

import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import type { ChartOptions } from 'chart.js';
import type { ChartTheme, ChartColorScheme } from '../types/charts';

/**
 * Hook to get chart theme configuration based on MUI theme
 */
export function useChartTheme(): ChartTheme {
  const theme = useTheme();

  const colorScheme: ChartColorScheme = useMemo(
    () => ({
      primary: theme.palette.primary.main,
      secondary: theme.palette.info.main,
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main,
      info: theme.palette.info.main,
      backgroundFill: 'rgba(0, 102, 204, 0.1)',
      gridColor: theme.palette.divider,
      textColor: theme.palette.text.primary,
    }),
    [theme]
  );

  return {
    colors: {
      default: colorScheme,
      dark: colorScheme,
      highContrast: colorScheme,
    },
    typography: {
      fontFamily: theme.typography.fontFamily as string,
      fontSize: {
        title: 16,
        label: 12,
        legend: 12,
        tooltip: 13,
      },
    },
    spacing: {
      padding: 16,
      legendSpacing: 8,
      tickPadding: 8,
    },
    animation: {
      duration: 300,
      easing: 'easeInOut',
      delay: 0,
    },
    grid: {
      display: true,
      color: colorScheme.gridColor,
      lineWidth: 1,
    },
  };
}

/**
 * Generate default Chart.js options with theme integration
 */
export function useChartOptions<T extends 'line' | 'bar' | 'doughnut' | 'radar'>(
  type: T,
  overrides?: Partial<ChartOptions<T>>
): ChartOptions<T> {
  const chartTheme = useChartTheme();
  const theme = useTheme();

  return useMemo(() => {
    const baseOptions: ChartOptions<T> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              family: chartTheme.typography.fontFamily,
              size: chartTheme.typography.fontSize.legend,
            },
            color: chartTheme.colors.default.textColor,
            padding: chartTheme.spacing.legendSpacing,
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: theme.palette.grey[800],
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          titleFont: {
            family: chartTheme.typography.fontFamily,
            size: chartTheme.typography.fontSize.tooltip,
            weight: 'bold',
          },
          bodyFont: {
            family: chartTheme.typography.fontFamily,
            size: chartTheme.typography.fontSize.tooltip,
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      animation: {
        duration: chartTheme.animation.duration,
      },
    } as ChartOptions<T>;

    // Type-specific configurations for line and bar charts
    if (type === 'line' || type === 'bar') {
      (baseOptions as ChartOptions<'line' | 'bar'>).scales = {
        x: {
          grid: {
            display: chartTheme.grid.display,
            color: chartTheme.grid.color,
            lineWidth: chartTheme.grid.lineWidth,
          },
          ticks: {
            font: {
              family: chartTheme.typography.fontFamily,
              size: chartTheme.typography.fontSize.label,
            },
            color: chartTheme.colors.default.textColor,
            padding: chartTheme.spacing.tickPadding,
          },
        },
        y: {
          grid: {
            display: chartTheme.grid.display,
            color: chartTheme.grid.color,
            lineWidth: chartTheme.grid.lineWidth,
          },
          ticks: {
            font: {
              family: chartTheme.typography.fontFamily,
              size: chartTheme.typography.fontSize.label,
            },
            color: chartTheme.colors.default.textColor,
            padding: chartTheme.spacing.tickPadding,
          },
        },
      };
    }

    return { ...baseOptions, ...(overrides || {}) } as ChartOptions<T>;
  }, [chartTheme, theme, type, overrides]);
}

/**
 * Get severity color from theme
 */
export function useSeverityColors() {
  const theme = useTheme();

  return useMemo(
    () => ({
      critical: theme.palette.error.main,
      high: theme.palette.warning.main,
      medium: theme.palette.info.main,
      low: theme.palette.success.main,
    }),
    [theme]
  );
}
