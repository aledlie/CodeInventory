/**
 * ComparisonCard Component
 *
 * Displays a side-by-side comparison of a metric between two time periods.
 */

import { Box, Paper, Typography } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import type { MetricDiff } from '../../types/comparison';

interface ComparisonCardProps {
  label: string;
  diff: MetricDiff;
  /** Format function for displaying values */
  format?: (value: number) => string;
  /** Whether lower values are better (e.g., for issue counts) */
  lowerIsBetter?: boolean;
  /** Unit suffix */
  unit?: string;
}

/**
 * Get trend icon based on direction
 */
function getTrendIcon(trend: 'up' | 'down' | 'stable', lowerIsBetter: boolean) {
  const isGood = lowerIsBetter ? trend === 'down' : trend === 'up';
  const isBad = lowerIsBetter ? trend === 'up' : trend === 'down';

  if (trend === 'stable') {
    return <TrendingFlatIcon sx={{ color: 'text.secondary', fontSize: 24 }} />;
  }

  if (trend === 'up') {
    return (
      <TrendingUpIcon
        sx={{
          color: isGood ? 'success.main' : isBad ? 'error.main' : 'text.secondary',
          fontSize: 24,
        }}
      />
    );
  }

  return (
    <TrendingDownIcon
      sx={{
        color: isGood ? 'success.main' : isBad ? 'error.main' : 'text.secondary',
        fontSize: 24,
      }}
    />
  );
}

/**
 * Get color for the change indicator
 */
function getChangeColor(trend: 'up' | 'down' | 'stable', lowerIsBetter: boolean): string {
  if (trend === 'stable') return 'text.secondary';
  const isGood = lowerIsBetter ? trend === 'down' : trend === 'up';
  return isGood ? 'success.main' : 'error.main';
}

export function ComparisonCard({
  label,
  diff,
  format = (v) => v.toLocaleString(),
  lowerIsBetter = false,
  unit = '',
}: ComparisonCardProps) {
  const changeSign = diff.change > 0 ? '+' : '';
  const percentSign = diff.percentChange > 0 ? '+' : '';

  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="subtitle2"
        color="text.secondary"
        gutterBottom
        sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>

      {/* Current Value */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
        <Typography variant="h4" component="span" fontWeight={600}>
          {format(diff.current)}
        </Typography>
        {unit && (
          <Typography variant="body2" color="text.secondary">
            {unit}
          </Typography>
        )}
      </Box>

      {/* Change Indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getTrendIcon(diff.trend, lowerIsBetter)}
        <Box>
          <Typography
            variant="body2"
            sx={{ color: getChangeColor(diff.trend, lowerIsBetter), fontWeight: 500 }}
          >
            {changeSign}{format(diff.change)} ({percentSign}{diff.percentChange}%)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            from {format(diff.previous)}{unit}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default ComparisonCard;
