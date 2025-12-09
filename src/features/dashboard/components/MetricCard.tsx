/**
 * MetricCard Component
 *
 * A reusable metric display card with optional icon, trend indicator, and status variants.
 * Designed for dashboard KPI displays with responsive typography and accessible interactions.
 *
 * Features:
 * - Status-based left border accent (4px)
 * - Optional icon and trend indicator
 * - Responsive font scaling (48px desktop → 32px mobile)
 * - Hover/focus states with 200ms transitions
 * - Keyboard accessible with onClick handler
 *
 * @example
 * ```tsx
 * <MetricCard
 *   icon={<AssessmentIcon />}
 *   label="Total Files"
 *   value={1234}
 *   unit="files"
 *   status="success"
 *   trend="+12% from last week"
 *   onClick={() => console.log('Card clicked')}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * MetricCard Props Interface
 */
export interface MetricCardProps {
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

/**
 * Status Color Mapping
 * Maps status variants to theme palette colors for left border accent
 */
const STATUS_COLORS = {
  default: 'transparent',
  primary: 'primary.main',
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
} as const;

/**
 * Styled Card with Status Border
 *
 * Features:
 * - 4px left border with status-based color
 * - Hover lift effect (translateY -2px)
 * - Enhanced shadow on hover
 * - 200ms transitions
 * - Pointer cursor when clickable
 * - Keyboard focus outline
 */
interface StyledMetricCardProps {
  status: 'default' | 'primary' | 'success' | 'warning' | 'error';
  clickable: boolean;
}

const StyledMetricCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'clickable',
})<StyledMetricCardProps>(({ theme, status, clickable }) => ({
  position: 'relative',
  borderLeft: `4px solid ${status === 'default' ? 'transparent' : theme.palette[status].main}`,
  cursor: clickable ? 'pointer' : 'default',
  transition: theme.transitions.create(
    ['box-shadow', 'transform', 'border-color'],
    {
      duration: theme.transitions.duration.shorter, // 200ms
      easing: theme.transitions.easing.easeInOut,
    }
  ),

  // Hover state (only when clickable)
  ...(clickable && {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4], // --shadow-lg
    },
  }),

  // Focus state for keyboard navigation
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

/**
 * MetricCard Component
 *
 * Displays a single metric with optional icon, trend, and status indicator.
 * Responsive design with mobile-first font scaling.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  status = 'default',
  trend,
  onClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Format value for display
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  // Card is interactive if onClick is provided
  const isClickable = Boolean(onClick);

  return (
    <StyledMetricCard
      status={status}
      clickable={isClickable}
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardContent>
        {/* Header: Icon + Label */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            marginBottom: 2,
          }}
        >
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: status === 'default' ? 'text.secondary' : `${status}.main`,
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: '0.875rem', // 14px
            }}
          >
            {label}
          </Typography>
        </Box>

        {/* Value Display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
            marginBottom: trend ? 1 : 0,
          }}
        >
          <Typography
            variant="h2"
            component="div"
            sx={{
              fontWeight: 700,
              fontSize: isMobile ? '2rem' : '3rem', // 32px mobile, 48px desktop
              lineHeight: 1.2,
              color: 'text.primary',
            }}
          >
            {formattedValue}
          </Typography>

          {/* Optional Unit */}
          {unit && (
            <Typography
              variant="body1"
              component="span"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: isMobile ? '0.875rem' : '1rem', // 14px mobile, 16px desktop
              }}
            >
              {unit}
            </Typography>
          )}
        </Box>

        {/* Optional Trend Indicator */}
        {trend && (
          <Typography
            variant="caption"
            component="div"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem', // 12px
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            {trend}
          </Typography>
        )}
      </CardContent>
    </StyledMetricCard>
  );
};

export default MetricCard;
