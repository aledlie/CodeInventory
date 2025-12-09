/**
 * InsightCard Component
 *
 * Displays an individual AI-generated insight with:
 * - Type indicator (improvement, concern, recommendation, prediction)
 * - Severity badge with color coding
 * - Confidence score visualization
 * - Metric snapshots with trend indicators
 * - Affected files list
 * - Action buttons (View Details, Acknowledge)
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as ImprovementIcon,
  Warning as ConcernIcon,
  Lightbulb as RecommendationIcon,
  Timeline as PredictionIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  InsertDriveFile as FileIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  TrendingFlat as TrendFlatIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as AcknowledgedIcon,
} from '@mui/icons-material';
import type { AIInsight, InsightType, MetricSnapshot } from '../../types';

/**
 * Props for InsightCard component
 */
export interface InsightCardProps {
  /** The insight to display */
  insight: AIInsight;
  /** Callback when acknowledge button is clicked */
  onAcknowledge?: (id: string) => void;
  /** Callback when view details is clicked */
  onViewDetails?: (id: string) => void;
  /** Whether the card is in a loading/pending state */
  isLoading?: boolean;
  /** Compact mode for list views */
  compact?: boolean;
}

/**
 * Get icon for insight type
 */
function getInsightIcon(type: InsightType) {
  const iconMap = {
    improvement: <ImprovementIcon />,
    concern: <ConcernIcon />,
    recommendation: <RecommendationIcon />,
    prediction: <PredictionIcon />,
  };
  return iconMap[type] || <RecommendationIcon />;
}

/**
 * Get color for insight type
 */
function getInsightColor(type: InsightType): string {
  const colorMap = {
    improvement: 'success',
    concern: 'error',
    recommendation: 'info',
    prediction: 'secondary',
  };
  return colorMap[type] || 'default';
}

/**
 * Get border color for insight type
 */
function getInsightBorderColor(type: InsightType): string {
  const colorMap = {
    improvement: 'var(--color-success, #28a745)',
    concern: 'var(--color-error, #dc3545)',
    recommendation: 'var(--color-info, #17a2b8)',
    prediction: 'var(--color-prediction, #9c27b0)',
  };
  return colorMap[type] || 'var(--color-neutral-400, #ccc)';
}

/**
 * Get severity badge color
 */
function getSeverityColor(severity: AIInsight['severity']): 'error' | 'warning' | 'info' | 'success' {
  const colorMap: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };
  return colorMap[severity] || 'info';
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: MetricSnapshot['trend']) {
  const iconMap = {
    up: <TrendUpIcon sx={{ color: 'success.main', fontSize: 16 }} />,
    down: <TrendDownIcon sx={{ color: 'error.main', fontSize: 16 }} />,
    stable: <TrendFlatIcon sx={{ color: 'text.secondary', fontSize: 16 }} />,
  };
  return iconMap[trend] || iconMap.stable;
}

/**
 * Render confidence stars (1-5 scale)
 */
function ConfidenceStars({ confidence }: { confidence: number }) {
  const stars = Math.round(confidence / 20); // 0-100 → 0-5 stars
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        star <= stars ? (
          <StarIcon key={star} sx={{ fontSize: 14, color: 'warning.main' }} />
        ) : (
          <StarBorderIcon key={star} sx={{ fontSize: 14, color: 'action.disabled' }} />
        )
      ))}
      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
        {confidence}%
      </Typography>
    </Box>
  );
}

/**
 * Render metric snapshot
 */
function MetricItem({ metric }: { metric: MetricSnapshot }) {
  const changePrefix = metric.change >= 0 ? '+' : '';
  const changeColor = metric.trend === 'up' ? 'success.main' : metric.trend === 'down' ? 'error.main' : 'text.secondary';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary">
          {metric.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>
            {metric.current}{metric.unit || ''}
          </Typography>
          {getTrendIcon(metric.trend)}
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="caption" sx={{ color: changeColor }}>
          {changePrefix}{metric.change}{metric.unit || ''} ({changePrefix}{metric.changePercent.toFixed(1)}%)
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          was {metric.previous}{metric.unit || ''}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * InsightCard component
 */
export function InsightCard({
  insight,
  onAcknowledge,
  onViewDetails,
  isLoading = false,
  compact = false,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isAcknowledged = Boolean(insight.acknowledgedAt);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderLeftColor: getInsightBorderColor(insight.type),
        transition: 'all 0.2s ease-in-out',
        opacity: isAcknowledged ? 0.7 : 1,
        '&:hover': {
          transform: compact ? 'none' : 'translateY(-2px)',
          boxShadow: compact ? 'inherit' : 4,
        },
      }}
      role="article"
      aria-labelledby={`insight-title-${insight.id}`}
      aria-describedby={`insight-desc-${insight.id}`}
    >
      {isLoading && <LinearProgress />}

      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        {/* Header Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            mb: compact ? 0.5 : 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Box
              sx={{
                color: getInsightBorderColor(insight.type),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {getInsightIcon(insight.type)}
            </Box>
            <Typography
              id={`insight-title-${insight.id}`}
              variant={compact ? 'body2' : 'h6'}
              component="h3"
              sx={{ fontWeight: 600, flex: 1 }}
            >
              {insight.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAcknowledged && (
              <Tooltip title={`Acknowledged by ${insight.acknowledgedBy}`}>
                <AcknowledgedIcon sx={{ color: 'success.main', fontSize: 20 }} />
              </Tooltip>
            )}
            <Chip
              label={insight.severity}
              size="small"
              color={getSeverityColor(insight.severity)}
              sx={{ textTransform: 'capitalize' }}
            />
            <Chip
              label={insight.type}
              size="small"
              color={getInsightColor(insight.type) as 'success' | 'error' | 'info' | 'secondary'}
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
        </Box>

        {/* Confidence Score */}
        <Box sx={{ mb: compact ? 0.5 : 1 }}>
          <ConfidenceStars confidence={insight.confidence} />
        </Box>

        {/* Explanation */}
        <Typography
          id={`insight-desc-${insight.id}`}
          variant="body2"
          color="text.secondary"
          sx={{
            mb: compact ? 0 : 2,
            display: compact ? '-webkit-box' : 'block',
            WebkitLineClamp: compact ? 2 : 'unset',
            WebkitBoxOrient: 'vertical',
            overflow: compact ? 'hidden' : 'visible',
          }}
        >
          {insight.explanation}
        </Typography>

        {/* Metrics (non-compact only) */}
        {!compact && insight.metrics.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Related Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {insight.metrics.map((metric, index) => (
                <Box key={index} sx={{ flex: '1 1 200px', maxWidth: '300px' }}>
                  <MetricItem metric={metric} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Expandable Section */}
        {!compact && (insight.affectedFiles.length > 0 || insight.recommendations.length > 0) && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' },
              }}
              onClick={handleExpandClick}
              role="button"
              aria-expanded={expanded}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleExpandClick()}
            >
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                {insight.affectedFiles.length > 0 && `${insight.affectedFiles.length} affected files`}
                {insight.affectedFiles.length > 0 && insight.recommendations.length > 0 && ' • '}
                {insight.recommendations.length > 0 && `${insight.recommendations.length} recommendations`}
              </Typography>
              <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expanded}>
              {/* Affected Files */}
              {insight.affectedFiles.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Affected Files
                  </Typography>
                  <List dense disablePadding>
                    {insight.affectedFiles.slice(0, 5).map((file, index) => (
                      <ListItem key={index} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <FileIcon sx={{ fontSize: 16, color: 'action.active' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={file.path}
                          secondary={
                            file.percentage !== undefined
                              ? `${file.percentage}%${file.previousPercentage !== undefined ? ` (was ${file.previousPercentage}%)` : ''}`
                              : file.line ? `Line ${file.line}` : undefined
                          }
                          primaryTypographyProps={{ variant: 'body2', sx: { fontFamily: 'monospace', fontSize: 12 } }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                    {insight.affectedFiles.length > 5 && (
                      <Typography variant="caption" color="text.secondary">
                        +{insight.affectedFiles.length - 5} more files
                      </Typography>
                    )}
                  </List>
                </Box>
              )}

              {/* Recommendations */}
              {insight.recommendations.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Recommendations
                  </Typography>
                  <List dense disablePadding>
                    {insight.recommendations.map((rec, index) => (
                      <ListItem key={index} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <RecommendationIcon sx={{ fontSize: 16, color: 'info.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={rec}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Collapse>
          </>
        )}
      </CardContent>

      {/* Actions */}
      {!compact && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          {onViewDetails && (
            <Button
              size="small"
              onClick={() => onViewDetails(insight.id)}
              aria-label={`View details for ${insight.title}`}
            >
              View Details
            </Button>
          )}
          {onAcknowledge && !isAcknowledged && (
            <Button
              size="small"
              onClick={() => onAcknowledge(insight.id)}
              disabled={isLoading}
              aria-label={`Acknowledge insight: ${insight.title}`}
            >
              Acknowledge
            </Button>
          )}
          {insight.category && (
            <Chip
              label={insight.category}
              size="small"
              variant="outlined"
              sx={{ ml: 'auto' }}
            />
          )}
        </CardActions>
      )}
    </Card>
  );
}

export default InsightCard;
