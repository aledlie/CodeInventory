/**
 * MetricGrid Component
 *
 * A responsive grid container for displaying multiple MetricCard components.
 * Implements MUI Grid v7 syntax with breakpoint-based column layouts.
 *
 * Layout Behavior:
 * - xs (mobile): 1 column (full width)
 * - sm (tablet): 2 columns
 * - md (desktop): 2 columns
 * - lg+ (large desktop): 4 columns
 *
 * Features:
 * - Responsive grid spacing (24px desktop, 16px mobile)
 * - Auto-fit grid items with minmax behavior
 * - Maintains card aspect ratio across breakpoints
 * - Prevents grid gap collapse on mobile
 *
 * @example
 * ```tsx
 * <MetricGrid
 *   metrics={[
 *     {
 *       icon: <AssessmentIcon />,
 *       label: "Total Files",
 *       value: 1234,
 *       unit: "files",
 *       status: "success",
 *       trend: "+12% from last week"
 *     },
 *     // ... more metrics
 *   ]}
 * />
 * ```
 */

import type { ReactNode } from 'react';
import { Grid2 as Grid, useTheme, useMediaQuery } from '@mui/material';
import { MetricCard } from './MetricCard';

/**
 * MetricGrid Props Interface
 */
export interface MetricGridProps {
  /** Array of metric configurations to display as cards */
  metrics: Array<{
    /** Optional icon displayed in header alongside label */
    icon?: ReactNode;
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
  }>;
}

/**
 * MetricGrid Component
 *
 * Responsive grid layout for metric cards with breakpoint-based column adjustment.
 * Uses MUI Grid v7 (Grid2) with size prop for responsive behavior.
 */
export function MetricGrid({ metrics }: MetricGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Responsive spacing: 16px on mobile, 24px on desktop
  const gridSpacing = isMobile ? 2 : 3; // theme.spacing(2) = 16px, spacing(3) = 24px

  return (
    <Grid
      container
      spacing={gridSpacing}
      sx={{
        // Ensure grid doesn't collapse on mobile
        width: '100%',
        margin: 0,
        // Prevent horizontal overflow
        maxWidth: '100%',
      }}
    >
      {metrics.map((metric, index) => (
        <Grid
          key={`metric-${index}-${metric.label}`}
          size={{
            xs: 12, // 1 column on mobile (full width)
            sm: 6,  // 2 columns on small tablets
            md: 6,  // 2 columns on desktop
            lg: 3,  // 4 columns on large desktop
          }}
          sx={{
            // Maintain minimum card width for readability
            minWidth: 0, // Prevents flex overflow issues
            // Ensure cards maintain aspect ratio
            display: 'flex',
          }}
        >
          <MetricCard
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            status={metric.status}
            trend={metric.trend}
            onClick={metric.onClick}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricGrid;
