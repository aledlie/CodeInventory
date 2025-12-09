/**
 * Notification System Types
 *
 * Phase 4E: Smart Notifications
 * Alert triggers, delivery preferences, and notification history
 */

/**
 * Notification priority levels
 */
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Notification categories
 */
export type NotificationCategory =
  | 'quality_alert'
  | 'coverage_change'
  | 'dependency_issue'
  | 'security_warning'
  | 'goal_progress'
  | 'team_activity'
  | 'system';

/**
 * Delivery channels
 */
export type DeliveryChannel = 'in_app' | 'email' | 'slack' | 'webhook';

/**
 * Trigger condition operators
 */
export type TriggerOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change' | 'threshold';

/**
 * Notification status
 */
export type NotificationStatus = 'unread' | 'read' | 'dismissed' | 'actioned';

/**
 * Alert trigger configuration
 */
export interface AlertTrigger {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  category: NotificationCategory;
  metric: string;
  operator: TriggerOperator;
  value: number;
  unit?: string;
  cooldownMinutes: number;
  priority: NotificationPriority;
  channels: DeliveryChannel[];
  createdAt: string;
  updatedAt: string;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  channels: {
    in_app: boolean;
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  emailAddress?: string;
  slackChannel?: string;
  webhookUrl?: string;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  categoryPreferences: Record<NotificationCategory, {
    enabled: boolean;
    minPriority: NotificationPriority;
  }>;
  digestMode: 'immediate' | 'hourly' | 'daily';
  updatedAt: string;
}

/**
 * Individual notification
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  triggerId?: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
}

/**
 * Notification with delivery status
 */
export interface NotificationDelivery extends Notification {
  deliveryStatus: Record<DeliveryChannel, {
    sent: boolean;
    sentAt?: string;
    error?: string;
  }>;
}

/**
 * Notification group for batched display
 */
export interface NotificationGroup {
  id: string;
  category: NotificationCategory;
  count: number;
  latestTimestamp: string;
  notifications: Notification[];
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  lastWeekCount: number;
  averageResponseTime?: number; // minutes
}

/**
 * Toast notification for immediate display
 */
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Notification filter options
 */
export interface NotificationFilters {
  categories?: NotificationCategory[];
  priorities?: NotificationPriority[];
  statuses?: NotificationStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Props for notification components
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

export interface AlertConfiguratorProps {
  triggers: AlertTrigger[];
  onCreateTrigger?: (trigger: Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTrigger?: (id: string, updates: Partial<AlertTrigger>) => void;
  onDeleteTrigger?: (id: string) => void;
  onToggleTrigger?: (id: string, enabled: boolean) => void;
  isLoading?: boolean;
}

export interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onUpdatePreferences?: (updates: Partial<NotificationPreferences>) => void;
  isLoading?: boolean;
}
