/**
 * NotificationCenter Component
 *
 * Main notification panel displaying:
 * - Notification list with filters
 * - Quick actions (mark read, dismiss)
 * - Statistics summary
 */

import { useState, useCallback, Suspense } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Chip,
  Badge,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Tooltip,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsActive as ActiveIcon,
  Error as CriticalIcon,
  Warning as HighIcon,
  Info as MediumIcon,
  CheckCircle as LowIcon,
  MoreVert as MoreIcon,
  Done as ReadIcon,
  DoneAll as ReadAllIcon,
  Delete as DismissIcon,
  FilterList as FilterIcon,
  ArrowForward as ActionIcon,
} from '@mui/icons-material';
import type {
  Notification,
  NotificationStats,
  NotificationFilters,
  NotificationPriority,
  NotificationCategory,
} from '../../types';

/**
 * Props for NotificationCenter
 */
export interface NotificationCenterProps {
  notifications: Notification[];
  stats?: NotificationStats;
  isLoading?: boolean;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
  onAction?: (notification: Notification) => void;
  onFilterChange?: (filters: NotificationFilters) => void;
  filters?: NotificationFilters;
}

/**
 * Priority configuration
 */
const priorityConfig: Record<NotificationPriority, { icon: React.ReactNode; color: string }> = {
  critical: { icon: <CriticalIcon />, color: '#dc3545' },
  high: { icon: <HighIcon />, color: '#ff5722' },
  medium: { icon: <MediumIcon />, color: '#ff9800' },
  low: { icon: <LowIcon />, color: '#28a745' },
};

/**
 * Category icons
 */
const categoryIcons: Record<NotificationCategory, React.ReactNode> = {
  quality_alert: <HighIcon />,
  coverage_change: <NotificationIcon />,
  dependency_issue: <HighIcon />,
  security_warning: <CriticalIcon />,
  goal_progress: <LowIcon />,
  team_activity: <NotificationIcon />,
  system: <MediumIcon />,
};

/**
 * Filter tabs
 */
type FilterTab = 'all' | 'unread' | 'critical' | 'activity';

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
function NotificationSkeleton() {
  return (
    <List>
      {[1, 2, 3, 4, 5].map((i) => (
        <ListItem key={i} alignItems="flex-start">
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText
            primary={<Skeleton width="70%" />}
            secondary={<Skeleton width="90%" />}
          />
        </ListItem>
      ))}
    </List>
  );
}

/**
 * Single notification item
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  onAction,
}: {
  notification: Notification;
  onMarkAsRead?: () => void;
  onDismiss?: () => void;
  onAction?: () => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const priority = priorityConfig[notification.priority];
  const isUnread = notification.status === 'unread';

  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        bgcolor: isUnread ? 'action.hover' : 'transparent',
        borderLeft: 3,
        borderColor: priority.color,
        '&:hover': { bgcolor: 'action.selected' },
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {notification.actionUrl && (
            <Tooltip title={notification.actionLabel || 'View'}>
              <IconButton size="small" onClick={onAction}>
                <ActionIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      <ListItemAvatar>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={isUnread ? <ActiveIcon sx={{ fontSize: 12, color: 'primary.main' }} /> : null}
        >
          <Avatar sx={{ bgcolor: `${priority.color}20`, color: priority.color }}>
            {categoryIcons[notification.category]}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight={isUnread ? 600 : 400}
              sx={{ flex: 1 }}
            >
              {notification.title}
            </Typography>
            <Chip
              label={notification.priority}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                bgcolor: `${priority.color}20`,
                color: priority.color,
              }}
            />
          </Box>
        }
        secondary={
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {formatRelativeTime(notification.createdAt)}
            </Typography>
          </>
        }
      />
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {isUnread && (
          <MenuItem onClick={() => { onMarkAsRead?.(); setMenuAnchor(null); }}>
            <ReadIcon sx={{ mr: 1 }} fontSize="small" />
            Mark as read
          </MenuItem>
        )}
        <MenuItem onClick={() => { onDismiss?.(); setMenuAnchor(null); }}>
          <DismissIcon sx={{ mr: 1 }} fontSize="small" />
          Dismiss
        </MenuItem>
      </Menu>
    </ListItem>
  );
}

/**
 * Statistics summary
 */
function StatsSummary({ stats }: { stats: NotificationStats }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: 'action.hover' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          {stats.unread}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Unread
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          {stats.byPriority.critical || 0}
        </Typography>
        <Typography variant="caption" color="error.main">
          Critical
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          {stats.lastWeekCount}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This Week
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * NotificationCenter component
 */
export function NotificationCenter({
  notifications,
  stats,
  isLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onAction,
  onFilterChange,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const handleTabChange = useCallback(
    (_: unknown, value: FilterTab) => {
      setActiveTab(value);
      let filters: NotificationFilters = {};
      switch (value) {
        case 'unread':
          filters = { statuses: ['unread'] };
          break;
        case 'critical':
          filters = { priorities: ['critical', 'high'] };
          break;
        case 'activity':
          filters = { categories: ['team_activity', 'goal_progress'] };
          break;
      }
      onFilterChange?.(filters);
    },
    [onFilterChange]
  );

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case 'unread':
        return n.status === 'unread';
      case 'critical':
        return n.priority === 'critical' || n.priority === 'high';
      case 'activity':
        return n.category === 'team_activity' || n.category === 'goal_progress';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationIcon />
          </Badge>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<ReadAllIcon />}
              onClick={onMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
          <Tooltip title="Filter">
            <IconButton size="small">
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats */}
      {stats && <StatsSummary stats={stats} />}

      {/* Filter tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All" value="all" />
        <Tab
          label={
            <Badge badgeContent={unreadCount} color="primary" max={99}>
              Unread
            </Badge>
          }
          value="unread"
        />
        <Tab
          label={
            <Badge
              badgeContent={stats?.byPriority.critical || 0}
              color="error"
              max={99}
            >
              Critical
            </Badge>
          }
          value="critical"
        />
        <Tab label="Activity" value="activity" />
      </Tabs>

      {/* Notification list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <NotificationSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <NotificationIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
            <Typography>No notifications</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => onMarkAsRead?.(notification.id)}
                onDismiss={() => onDismiss?.(notification.id)}
                onAction={() => onAction?.(notification)}
              />
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}

/**
 * NotificationCenter with Suspense wrapper
 */
export function NotificationCenterWithSuspense(props: NotificationCenterProps) {
  return (
    <Suspense fallback={<NotificationSkeleton />}>
      <NotificationCenter {...props} />
    </Suspense>
  );
}

export default NotificationCenter;
