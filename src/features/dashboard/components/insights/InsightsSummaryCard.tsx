/**
 * InsightsSummaryCard Component
 *
 * Hero card displaying AI-generated summary with:
 * - Headline summary from AI
 * - Overall confidence score
 * - Key metrics carousel
 * - Quick action buttons
 */

import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  TrendingFlat as TrendFlatIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import type { InsightsSummary, MetricSnapshot } from '../../types';

/**
 * Props for InsightsSummaryCard
 */
export interface InsightsSummaryCardProps {
  /** Summary data from insights report */
  summary: InsightsSummary | null;
  /** Key metrics to display */
  keyMetrics?: MetricSnapshot[];
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Callback when share is clicked */
  onShare?: () => void;
  /** Callback when export is clicked */
  onExport?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Refreshing state */
  isRefreshing?: boolean;
}

/**
 * Render confidence stars (1-5 scale)
 */
function ConfidenceStars({ confidence }: { confidence: number }) {
  const stars = Math.round(confidence / 20);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        star <= stars ? (
          <StarIcon key={star} sx={{ fontSize: 20, color: 'warning.main' }} />
        ) : (
          <StarBorderIcon key={star} sx={{ fontSize: 20, color: 'action.disabled' }} />
        )
      ))}
    </Box>
  );
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: MetricSnapshot['trend']) {
  if (trend === 'up') return <TrendUpIcon sx={{ color: 'success.main', fontSize: 20 }} />;
  if (trend === 'down') return <TrendDownIcon sx={{ color: 'error.main', fontSize: 20 }} />;
  return <TrendFlatIcon sx={{ color: 'text.secondary', fontSize: 20 }} />;
}

/**
 * Get trend color
 */
function getTrendColor(trend: MetricSnapshot['trend'], isPositive: boolean = true): string {
  if (trend === 'stable') return 'text.secondary';
  if (isPositive) {
    return trend === 'up' ? 'success.main' : 'error.main';
  }
  return trend === 'up' ? 'error.main' : 'success.main';
}

/**
 * Metric card within summary
 */
function MetricCard({ metric }: { metric: MetricSnapshot }) {
  const changePrefix = metric.change >= 0 ? '+' : '';
  // For metrics like "Issues", down is good. For most others, up is good.
  const isPositiveMetric = !metric.name.toLowerCase().includes('issue');

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 2,
        minWidth: 140,
        boxShadow: 1,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {metric.name}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          {metric.current}
          {metric.unit || ''}
        </Typography>
        {getTrendIcon(metric.trend)}
      </Box>
      <Typography
        variant="caption"
        sx={{ color: getTrendColor(metric.trend, isPositiveMetric) }}
      >
        {changePrefix}{metric.change}{metric.unit || ''} ({changePrefix}{metric.changePercent.toFixed(1)}%)
      </Typography>
    </Box>
  );
}

/**
 * Loading skeleton for summary card
 */
function SummarySkeleton() {
  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, var(--color-primary-lightest, #e6f0ff) 0%, #ffffff 100%)',
        border: '2px solid',
        borderColor: 'primary.light',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={120} />
          <Box sx={{ ml: 'auto' }}>
            <Skeleton variant="text" width={100} />
          </Box>
        </Box>
        <Skeleton variant="text" width="100%" height={60} />
        <Skeleton variant="text" width="80%" />
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={140} height={80} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * InsightsSummaryCard component
 */
export function InsightsSummaryCard({
  summary,
  keyMetrics = [],
  onRefresh,
  onShare,
  onExport,
  isLoading = false,
  isRefreshing = false,
}: InsightsSummaryCardProps) {
  if (isLoading || !summary) {
    return <SummarySkeleton />;
  }

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, var(--color-primary-lightest, #e6f0ff) 0%, #ffffff 100%)',
        border: '2px solid',
        borderColor: 'primary.light',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: '50%',
                p: 0.75,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AIIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              AI Insights
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Confidence:
            </Typography>
            <ConfidenceStars confidence={summary.overallConfidence} />
          </Box>
        </Box>

        {/* Headline */}
        <Typography
          variant="h5"
          component="p"
          sx={{
            fontWeight: 500,
            lineHeight: 1.4,
            mb: 1,
            color: 'text.primary',
          }}
        >
          "{summary.headline}"
        </Typography>

        {/* Stats chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip
            label={`${summary.total} insights`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {summary.byType.improvement > 0 && (
            <Chip
              label={`${summary.byType.improvement} improvements`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {summary.byType.concern > 0 && (
            <Chip
              label={`${summary.byType.concern} concerns`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          {summary.unacknowledged > 0 && (
            <Chip
              label={`${summary.unacknowledged} unread`}
              size="small"
              color="warning"
            />
          )}
        </Box>

        {/* Key Metrics */}
        {keyMetrics.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'action.hover',
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'action.selected',
                  borderRadius: 3,
                },
              }}
            >
              {keyMetrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              ))}
            </Box>
          </>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          {onRefresh && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
          {onShare && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShareIcon />}
              onClick={onShare}
            >
              Share Report
            </Button>
          )}
          {onExport && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={onExport}
            >
              Export PDF
            </Button>
          )}
        </Box>

        {/* Last updated */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2 }}
        >
          Last updated: {new Date(summary.lastUpdated).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default InsightsSummaryCard;
