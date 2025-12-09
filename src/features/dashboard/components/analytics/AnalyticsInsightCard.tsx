/**
 * AnalyticsInsightCard Component
 *
 * Displays actionable insights with impact and effort estimation.
 *
 * Features:
 * - Priority badge with color coding
 * - Impact estimation range display
 * - Effort/difficulty indicator
 * - Affected files list
 * - Action buttons (View, Dismiss)
 * - WCAG AA accessible
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  InsertDriveFile as FileIcon,
  Schedule as EffortIcon,
  TrendingUp as ImpactIcon,
  Close as DismissIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { AnalyticsInsightCardProps, InsightPriority, EffortEstimate } from '../../types/analytics';
import { formatHours } from '../../types/analytics';

/**
 * Get priority config
 */
function getPriorityConfig(priority: InsightPriority) {
  const configs: Record<InsightPriority, { color: 'error' | 'warning' | 'info'; label: string; borderColor: string }> = {
    high: {
      color: 'error',
      label: 'High Priority',
      borderColor: 'var(--color-error, #dc3545)',
    },
    medium: {
      color: 'warning',
      label: 'Medium Priority',
      borderColor: 'var(--color-warning, #ff9800)',
    },
    low: {
      color: 'info',
      label: 'Low Priority',
      borderColor: 'var(--color-info, #17a2b8)',
    },
  };
  return configs[priority];
}

/**
 * Get difficulty config
 */
function getDifficultyConfig(difficulty: EffortEstimate['difficulty']) {
  const configs: Record<EffortEstimate['difficulty'], { color: 'success' | 'warning' | 'error'; label: string }> = {
    easy: { color: 'success', label: 'Easy' },
    moderate: { color: 'warning', label: 'Moderate' },
    complex: { color: 'error', label: 'Complex' },
  };
  return configs[difficulty];
}

/**
 * Impact indicator component
 */
interface ImpactIndicatorProps {
  min: number;
  max: number;
  unit: string;
}

function ImpactIndicator({ min, max, unit }: ImpactIndicatorProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        bgcolor: 'var(--color-success-lightest, #e7f5e1)',
        borderRadius: 1,
      }}
    >
      <ImpactIcon sx={{ fontSize: 18, color: 'success.main' }} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          Estimated Impact
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
          +{min}-{max}{unit}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Effort indicator component
 */
interface EffortIndicatorProps {
  hours: number;
  difficulty: EffortEstimate['difficulty'];
  skills?: string[];
}

function EffortIndicator({ hours, difficulty, skills }: EffortIndicatorProps) {
  const difficultyConfig = getDifficultyConfig(difficulty);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        bgcolor: 'var(--color-neutral-100, #f0f0f0)',
        borderRadius: 1,
      }}
    >
      <EffortIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          Effort Required
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatHours(hours)}
          </Typography>
          <Chip
            label={difficultyConfig.label}
            color={difficultyConfig.color}
            size="small"
            sx={{ height: 20, fontSize: 10 }}
          />
        </Box>
        {skills && skills.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Skills: {skills.join(', ')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/**
 * Loading skeleton
 */
function CardSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Paper sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="rectangular" width={60} height={20} />
          <Skeleton variant="text" width="60%" />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="text" width="60%" />
      </Box>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Skeleton variant="rectangular" width={140} height={60} />
        <Skeleton variant="rectangular" width={140} height={60} />
      </Box>
    </Paper>
  );
}

/**
 * AnalyticsInsightCard Component
 */
export function AnalyticsInsightCard({
  id,
  priority,
  title,
  description,
  affectedFiles,
  impact,
  effort,
  category,
  tags,
  onView,
  onDismiss,
  isLoading = false,
  compact = false,
}: AnalyticsInsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const priorityConfig = getPriorityConfig(priority);

  if (isLoading) {
    return <CardSkeleton compact={compact} />;
  }

  // Compact mode - single line
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Paper
          sx={{
            p: 1.5,
            borderLeft: 3,
            borderLeftColor: priorityConfig.borderColor,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: onView ? 'pointer' : 'default',
            '&:hover': onView
              ? {
                  bgcolor: 'var(--color-neutral-50, #f5f5f5)',
                }
              : undefined,
          }}
          onClick={onView}
          role="listitem"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onView) onView();
          }}
        >
          <Chip
            label={priority}
            color={priorityConfig.color}
            size="small"
            sx={{ textTransform: 'capitalize', minWidth: 60 }}
          />
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            +{impact.min}-{impact.max}{impact.unit}
          </Typography>
          {onDismiss && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              aria-label="Dismiss insight"
            >
              <DismissIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Paper>
      </motion.div>
    );
  }

  // Full mode
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
          borderLeftColor: priorityConfig.borderColor,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
        role="article"
        aria-labelledby={`insight-title-${id}`}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Chip
              label={priorityConfig.label}
              color={priorityConfig.color}
              size="small"
            />
            {category && (
              <Chip
                label={category}
                variant="outlined"
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Box>
          {onDismiss && (
            <Tooltip title="Dismiss">
              <IconButton
                size="small"
                onClick={onDismiss}
                aria-label="Dismiss insight"
              >
                <DismissIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Title */}
        <Typography
          id={`insight-title-${id}`}
          variant="h6"
          component="h3"
          sx={{ fontWeight: 600, mb: 1 }}
        >
          {title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {description}
        </Typography>

        {/* Impact & Effort */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <ImpactIndicator
            min={impact.min}
            max={impact.max}
            unit={impact.unit}
          />
          <EffortIndicator
            hours={effort.hours}
            difficulty={effort.difficulty}
            skills={effort.skills}
          />
        </Box>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: 10 }}
              />
            ))}
          </Box>
        )}

        {/* Affected files (expandable) */}
        {affectedFiles && affectedFiles.length > 0 && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' },
              }}
              onClick={() => setExpanded(!expanded)}
              role="button"
              aria-expanded={expanded}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
            >
              <FileIcon sx={{ fontSize: 16, mr: 0.5, color: 'action.active' }} />
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                {affectedFiles.length} affected file{affectedFiles.length !== 1 ? 's' : ''}
              </Typography>
              <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expanded}>
              <List dense disablePadding sx={{ mt: 1 }}>
                {affectedFiles.slice(0, 5).map((file, index) => (
                  <ListItem key={index} disableGutters sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <FileIcon sx={{ fontSize: 14, color: 'action.active' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={file}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: { fontFamily: 'monospace', fontSize: 11 },
                      }}
                    />
                  </ListItem>
                ))}
                {affectedFiles.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 3.5 }}>
                    +{affectedFiles.length - 5} more files
                  </Typography>
                )}
              </List>
            </Collapse>
          </>
        )}

        {/* Actions */}
        {onView && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid var(--color-border, #e0e0e0)' }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<ViewIcon />}
              onClick={onView}
            >
              View Details
            </Button>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
}

export default AnalyticsInsightCard;
