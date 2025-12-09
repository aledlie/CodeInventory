/**
 * ActivityFeed Component
 *
 * Real-time activity feed showing team actions:
 * - Issue assignments
 * - Comments and discussions
 * - Goal updates
 * - Resolutions
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Assignment as AssignIcon,
  Comment as CommentIcon,
  CheckCircle as ResolveIcon,
  Flag as GoalIcon,
  AlternateEmail as MentionIcon,
  MoreVert as MoreIcon,
  Circle as UnreadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import type { ActivityItem, ActivityType, ActivityFilters } from '../../types';

/**
 * Props for ActivityFeed
 */
export interface ActivityFeedProps {
  /** Activity items to display */
  activities: ActivityItem[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when activity is clicked */
  onActivityClick?: (activity: ActivityItem) => void;
  /** Callback when activity is marked as read */
  onMarkAsRead?: (activityId: string) => void;
  /** Current filters */
  filters?: ActivityFilters;
  /** Callback when filters change */
  onFiltersChange?: (filters: ActivityFilters) => void;
  /** Show filter tabs */
  showFilters?: boolean;
  /** Maximum height (scrollable) */
  maxHeight?: number;
}

/**
 * Activity type icons and colors
 */
const activityConfig: Record<ActivityType, { icon: React.ReactNode; color: string }> = {
  comment: { icon: <CommentIcon />, color: '#17a2b8' },
  assignment: { icon: <AssignIcon />, color: '#ff9800' },
  resolution: { icon: <ResolveIcon />, color: '#28a745' },
  goal: { icon: <GoalIcon />, color: '#9c27b0' },
  mention: { icon: <MentionIcon />, color: '#dc3545' },
  status_change: { icon: <PersonIcon />, color: '#607d8b' },
};

/**
 * Filter tabs
 */
type FilterTab = 'all' | 'mentions' | 'assignments' | 'comments';

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Loading skeleton
 */
function ActivitySkeleton() {
  return (
    <List>
      {[1, 2, 3, 4, 5].map((i) => (
        <ListItem key={i} alignItems="flex-start">
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText
            primary={<Skeleton width="60%" />}
            secondary={<Skeleton width="80%" />}
          />
        </ListItem>
      ))}
    </List>
  );
}

/**
 * Single activity item
 */
function ActivityListItem({
  activity,
  onClick,
  onMarkAsRead,
}: {
  activity: ActivityItem;
  onClick?: () => void;
  onMarkAsRead?: () => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const config = activityConfig[activity.type];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMarkRead = () => {
    onMarkAsRead?.();
    handleMenuClose();
  };

  return (
    <ListItem
      alignItems="flex-start"
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: activity.isRead ? 'transparent' : 'action.hover',
        '&:hover': {
          bgcolor: 'action.selected',
        },
        borderLeft: 3,
        borderColor: config.color,
      }}
      secondaryAction={
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreIcon fontSize="small" />
        </IconButton>
      }
    >
      <ListItemAvatar>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            !activity.isRead && (
              <UnreadIcon sx={{ fontSize: 10, color: 'primary.main' }} />
            )
          }
        >
          <Avatar
            src={activity.actor.avatar}
            sx={{ bgcolor: config.color }}
          >
            {activity.actor.initials || activity.actor.name.charAt(0)}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {activity.actor.name}
            </Typography>
            <Chip
              icon={config.icon as React.ReactElement}
              label={activity.type.replace('_', ' ')}
              size="small"
              sx={{
                height: 20,
                '& .MuiChip-icon': { fontSize: 14 },
                bgcolor: `${config.color}20`,
                color: config.color,
              }}
            />
          </Box>
        }
        secondary={
          <>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ display: 'inline' }}
            >
              {activity.message}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {formatRelativeTime(activity.timestamp)}
              {activity.target && ` · ${activity.target.title}`}
            </Typography>
            {activity.reactions.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                {activity.reactions.map((reaction, idx) => (
                  <Chip
                    key={idx}
                    label={`${reaction.emoji} ${reaction.count}`}
                    size="small"
                    variant={reaction.hasReacted ? 'filled' : 'outlined'}
                    sx={{ height: 20, fontSize: 12 }}
                  />
                ))}
              </Box>
            )}
          </>
        }
      />

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkRead}>
          {activity.isRead ? 'Mark as unread' : 'Mark as read'}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>View details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Copy link</MenuItem>
      </Menu>
    </ListItem>
  );
}

/**
 * ActivityFeed component
 */
export function ActivityFeed({
  activities,
  isLoading = false,
  onActivityClick,
  onMarkAsRead,
  filters,
  onFiltersChange,
  showFilters = true,
  maxHeight = 500,
}: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const handleTabChange = useCallback(
    (_: unknown, value: FilterTab) => {
      setActiveTab(value);
      const typeMap: Record<FilterTab, ActivityType[] | undefined> = {
        all: undefined,
        mentions: ['mention'],
        assignments: ['assignment'],
        comments: ['comment'],
      };
      onFiltersChange?.({ ...filters, types: typeMap[value] });
    },
    [filters, onFiltersChange]
  );

  // Count unread by type
  const unreadCounts = {
    all: activities.filter((a) => !a.isRead).length,
    mentions: activities.filter((a) => !a.isRead && a.type === 'mention').length,
    assignments: activities.filter((a) => !a.isRead && a.type === 'assignment').length,
    comments: activities.filter((a) => !a.isRead && a.type === 'comment').length,
  };

  // Filter activities based on active tab
  const filteredActivities = activeTab === 'all'
    ? activities
    : activities.filter((a) => {
        if (activeTab === 'mentions') return a.type === 'mention';
        if (activeTab === 'assignments') return a.type === 'assignment';
        if (activeTab === 'comments') return a.type === 'comment';
        return true;
      });

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">Activity</Typography>
        <Tooltip title="Filter">
          <IconButton size="small">
            <FilterIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filter tabs */}
      {showFilters && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={
              <Badge badgeContent={unreadCounts.all} color="primary" max={99}>
                All
              </Badge>
            }
            value="all"
          />
          <Tab
            label={
              <Badge badgeContent={unreadCounts.mentions} color="error" max={99}>
                Mentions
              </Badge>
            }
            value="mentions"
          />
          <Tab
            label={
              <Badge badgeContent={unreadCounts.assignments} color="warning" max={99}>
                Assignments
              </Badge>
            }
            value="assignments"
          />
          <Tab
            label={
              <Badge badgeContent={unreadCounts.comments} color="info" max={99}>
                Comments
              </Badge>
            }
            value="comments"
          />
        </Tabs>
      )}

      {/* Activity list */}
      <Box sx={{ flex: 1, overflow: 'auto', maxHeight }}>
        {isLoading ? (
          <ActivitySkeleton />
        ) : filteredActivities.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography>No activity to show</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredActivities.map((activity) => (
              <ActivityListItem
                key={activity.id}
                activity={activity}
                onClick={() => onActivityClick?.(activity)}
                onMarkAsRead={() => onMarkAsRead?.(activity.id)}
              />
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}

export default ActivityFeed;
