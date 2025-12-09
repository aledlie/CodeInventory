/**
 * PredictiveTrendCard Component
 *
 * Displays predictive trend information for a metric with confidence indicators.
 *
 * Features:
 * - Current vs projected value comparison
 * - Confidence bar with color coding
 * - AI-generated insight text
 * - Action buttons for details and goal setting
 * - WCAG AA accessible
 */

import {
  Box,
  Typography,
  Paper,
  Button,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  Flag as GoalIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { PredictiveTrendCardProps, ConfidenceLevel } from '../../types/analytics';
import { formatTimeframe } from '../../types/analytics';

/**
 * Get confidence level config
 */
function getConfidenceConfig(level: ConfidenceLevel, confidence: number) {
  const configs: Record<ConfidenceLevel, { color: string; label: string; borderStyle: string }> = {
    high: {
      color: 'var(--color-confidence-high, #0066cc)',
      label: 'High Confidence',
      borderStyle: 'solid',
    },
    medium: {
      color: 'var(--color-confidence-medium, #ff9800)',
      label: 'Medium Confidence',
      borderStyle: 'dashed',
    },
    low: {
      color: 'var(--color-confidence-low, #9e9e9e)',
      label: 'Low Confidence',
      borderStyle: 'dotted',
    },
  };
  return { ...configs[level], percentage: confidence };
}

/**
 * Get metric color
 */
function getMetricColor(metric: string): string {
  const colors: Record<string, string> = {
    quality: 'var(--color-primary, #0066cc)',
    coverage: 'var(--color-success, #28a745)',
    issues: 'var(--color-warning, #ff9800)',
    debt: 'var(--color-error, #dc3545)',
    complexity: 'var(--color-info, #17a2b8)',
  };
  return colors[metric] || 'var(--color-primary, #0066cc)';
}

/**
 * Get trend icon
 */
function getTrendIcon(current: number, projected: number, increaseIsGood: boolean) {
  const isIncrease = projected > current;
  const isPositive = increaseIsGood ? isIncrease : !isIncrease;

  if (Math.abs(projected - current) < 0.5) {
    return <TrendingFlatIcon sx={{ color: 'text.secondary' }} />;
  }

  if (isIncrease) {
    return (
      <TrendingUpIcon
        sx={{ color: isPositive ? 'success.main' : 'error.main' }}
      />
    );
  }

  return (
    <TrendingDownIcon
      sx={{ color: isPositive ? 'success.main' : 'error.main' }}
    />
  );
}

/**
 * Format value with unit
 */
function formatValue(value: number, unit?: string): string {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'hrs' || unit === 'h') return `${value.toFixed(0)}h`;
  return value.toFixed(1);
}

/**
 * Confidence bar component
 */
interface ConfidenceBarProps {
  confidence: number;
  level: ConfidenceLevel;
}

function ConfidenceBar({ confidence, level }: ConfidenceBarProps) {
  const config = getConfidenceConfig(level, confidence);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Confidence:
      </Typography>
      <Tooltip title={`${config.label} (${confidence}%)`}>
        <Box sx={{ width: 120, position: 'relative' }}>
          <Box
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'var(--color-neutral-200, #e0e0e0)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                backgroundColor: config.color,
                borderRadius: 4,
              }}
            />
          </Box>
        </Box>
      </Tooltip>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: config.color }}
      >
        {level.charAt(0).toUpperCase() + level.slice(1)} ({confidence}%)
      </Typography>
    </Box>
  );
}

/**
 * Loading skeleton
 */
function CardSkeleton() {
  return (
    <Paper sx={{ p: 2 }}>
      <Skeleton variant="text" width={200} height={28} />
      <Skeleton variant="text" width={150} height={24} sx={{ my: 1 }} />
      <Skeleton variant="rectangular" height={8} width={120} sx={{ my: 1 }} />
      <Skeleton variant="text" width="100%" height={60} />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Skeleton variant="rectangular" width={100} height={32} />
        <Skeleton variant="rectangular" width={100} height={32} />
      </Box>
    </Paper>
  );
}

/**
 * PredictiveTrendCard Component
 */
export function PredictiveTrendCard({
  metric,
  metricLabel,
  currentValue,
  projectedValue,
  confidence,
  confidenceLevel,
  timeframe,
  insight,
  actions,
  unit = '%',
  increaseIsGood = true,
  isLoading = false,
  goalValue,
  goalDate,
}: PredictiveTrendCardProps) {
  const metricColor = getMetricColor(metric);
  const change = projectedValue - currentValue;
  const changePercent = currentValue !== 0 ? (change / currentValue) * 100 : 0;
  const isPositiveChange = increaseIsGood ? change > 0 : change < 0;

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 2,
          borderLeft: 4,
          borderLeftColor: metricColor,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
        role="article"
        aria-label={`${metricLabel} prediction`}
      >
        {/* Header */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            {metricLabel} Trend ({formatTimeframe(timeframe)})
          </Typography>
        </Box>

        {/* Values */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 1.5,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Current
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {formatValue(currentValue, unit)}
            </Typography>
          </Box>

          {getTrendIcon(currentValue, projectedValue, increaseIsGood)}

          <Box>
            <Typography variant="caption" color="text.secondary">
              Projected
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: isPositiveChange ? 'success.main' : 'error.main',
              }}
            >
              {formatValue(projectedValue, unit)}
            </Typography>
          </Box>

          <Box sx={{ ml: 'auto' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: isPositiveChange ? 'success.main' : 'error.main',
              }}
            >
              {change >= 0 ? '+' : ''}
              {formatValue(change, unit)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(1)}%)
            </Typography>
          </Box>
        </Box>

        {/* Confidence */}
        <Box sx={{ mb: 1.5 }}>
          <ConfidenceBar confidence={confidence} level={confidenceLevel} />
        </Box>

        {/* Goal indicator */}
        {goalValue !== undefined && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
              p: 1,
              bgcolor: 'var(--color-info-lightest, #e1f5fe)',
              borderRadius: 1,
            }}
          >
            <GoalIcon sx={{ fontSize: 16, color: 'info.main' }} />
            <Typography variant="caption">
              Goal: {formatValue(goalValue, unit)}
              {goalDate && (
                <> (Est. {new Date(goalDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</>
              )}
            </Typography>
          </Box>
        )}

        {/* AI Insight */}
        {insight && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'var(--color-info-lightest, #e1f5fe)',
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <InfoIcon sx={{ fontSize: 16, color: 'info.main', mt: 0.25 }} />
              <Typography
                variant="body2"
                sx={{
                  fontStyle: 'italic',
                  color: 'text.secondary',
                }}
              >
                {insight}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                size="small"
                variant={action.variant === 'primary' ? 'contained' : 'outlined'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Paper>
    </motion.div>
  );
}

export default PredictiveTrendCard;
