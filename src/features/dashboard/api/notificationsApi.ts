/**
 * Notifications API Service
 *
 * Phase 4E: Smart Notifications
 * Handles notifications, alert triggers, and preferences
 */

import type {
  Notification,
  NotificationStats,
  AlertTrigger,
  NotificationPreferences,
  NotificationFilters,
  NotificationStatus,
  NotificationCategory,
  NotificationPriority,
} from '../types';

const API_BASE = '/data/notifications';
const STORAGE_KEY = 'dashboard_notifications';
const TRIGGERS_KEY = 'dashboard_alert_triggers';
const PREFS_KEY = 'dashboard_notification_prefs';

/**
 * Fetch notifications
 */
export async function fetchNotifications(
  filters?: NotificationFilters
): Promise<Notification[]> {
  try {
    const response = await fetch(`${API_BASE}/notifications.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }
    let notifications = await response.json();

    // Apply filters
    if (filters) {
      notifications = applyFilters(notifications, filters);
    }

    return notifications;
  } catch {
    // Return stored notifications or mock data
    const stored = localStorage.getItem(STORAGE_KEY);
    let notifications = stored ? JSON.parse(stored) : generateMockNotifications();

    if (filters) {
      notifications = applyFilters(notifications, filters);
    }

    return notifications;
  }
}

/**
 * Fetch notification statistics
 */
export async function fetchNotificationStats(): Promise<NotificationStats> {
  try {
    const response = await fetch(`${API_BASE}/stats.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notification stats: ${response.status}`);
    }
    return response.json();
  } catch {
    // Calculate from stored notifications
    const notifications = await fetchNotifications();
    return calculateStats(notifications);
  }
}

/**
 * Fetch alert triggers
 */
export async function fetchAlertTriggers(): Promise<AlertTrigger[]> {
  try {
    const response = await fetch(`${API_BASE}/triggers.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch alert triggers: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return stored triggers or defaults
    const stored = localStorage.getItem(TRIGGERS_KEY);
    return stored ? JSON.parse(stored) : generateDefaultTriggers();
  }
}

/**
 * Fetch notification preferences
 */
export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await fetch(`${API_BASE}/preferences.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch preferences: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return stored preferences or defaults
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? JSON.parse(stored) : generateDefaultPreferences();
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<Notification> {
  const notifications = await fetchNotifications();
  const notification = notifications.find((n) => n.id === notificationId);

  if (!notification) {
    throw new Error('Notification not found');
  }

  const updated: Notification = {
    ...notification,
    status: 'read' as NotificationStatus,
    readAt: new Date().toISOString(),
  };

  // Update storage
  const updatedList = notifications.map((n) =>
    n.id === notificationId ? updated : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  return updated;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const notifications = await fetchNotifications();
  const now = new Date().toISOString();

  const updatedList = notifications.map((n) => ({
    ...n,
    status: 'read' as NotificationStatus,
    readAt: n.readAt || now,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
}

/**
 * Dismiss notification
 */
export async function dismissNotification(
  notificationId: string
): Promise<void> {
  const notifications = await fetchNotifications();
  const updatedList = notifications.map((n) =>
    n.id === notificationId
      ? { ...n, status: 'dismissed' as NotificationStatus, dismissedAt: new Date().toISOString() }
      : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
}

/**
 * Create alert trigger
 */
export async function createAlertTrigger(
  trigger: Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AlertTrigger> {
  const triggers = await fetchAlertTriggers();
  const now = new Date().toISOString();

  const newTrigger: AlertTrigger = {
    ...trigger,
    id: `trigger-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  triggers.push(newTrigger);
  localStorage.setItem(TRIGGERS_KEY, JSON.stringify(triggers));

  return newTrigger;
}

/**
 * Update alert trigger
 */
export async function updateAlertTrigger(
  triggerId: string,
  updates: Partial<AlertTrigger>
): Promise<AlertTrigger> {
  const triggers = await fetchAlertTriggers();
  const index = triggers.findIndex((t) => t.id === triggerId);

  if (index === -1) {
    throw new Error('Trigger not found');
  }

  const updated: AlertTrigger = {
    ...triggers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  triggers[index] = updated;
  localStorage.setItem(TRIGGERS_KEY, JSON.stringify(triggers));

  return updated;
}

/**
 * Delete alert trigger
 */
export async function deleteAlertTrigger(triggerId: string): Promise<void> {
  const triggers = await fetchAlertTriggers();
  const filtered = triggers.filter((t) => t.id !== triggerId);
  localStorage.setItem(TRIGGERS_KEY, JSON.stringify(filtered));
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const prefs = await fetchNotificationPreferences();
  const updated: NotificationPreferences = {
    ...prefs,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
}

// Helper functions
function applyFilters(
  notifications: Notification[],
  filters: NotificationFilters
): Notification[] {
  return notifications.filter((n) => {
    if (filters.categories?.length && !filters.categories.includes(n.category)) {
      return false;
    }
    if (filters.priorities?.length && !filters.priorities.includes(n.priority)) {
      return false;
    }
    if (filters.statuses?.length && !filters.statuses.includes(n.status)) {
      return false;
    }
    if (filters.startDate && new Date(n.createdAt) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(n.createdAt) > new Date(filters.endDate)) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
}

function calculateStats(notifications: Notification[]): NotificationStats {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const byCategory = {} as Record<NotificationCategory, number>;
  const byPriority = {} as Record<NotificationPriority, number>;

  notifications.forEach((n) => {
    byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
  });

  return {
    total: notifications.length,
    unread: notifications.filter((n) => n.status === 'unread').length,
    byCategory,
    byPriority,
    lastWeekCount: notifications.filter(
      (n) => new Date(n.createdAt) >= weekAgo
    ).length,
  };
}

function generateMockNotifications(): Notification[] {
  const now = new Date();
  return [
    {
      id: 'notif-1',
      userId: 'current-user',
      title: 'Critical: Test Coverage Dropped',
      message: 'Test coverage decreased from 78% to 65% in the last commit.',
      category: 'coverage_change',
      priority: 'critical',
      status: 'unread',
      actionUrl: '/dashboard/coverage',
      actionLabel: 'View Coverage',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'current-user',
      title: 'Security Warning: Vulnerable Dependency',
      message: 'lodash@4.17.20 has a known vulnerability (CVE-2021-23337).',
      category: 'security_warning',
      priority: 'high',
      status: 'unread',
      actionUrl: '/dashboard/dependencies',
      actionLabel: 'View Dependencies',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-3',
      userId: 'current-user',
      title: 'Quality Alert: High Complexity',
      message: '3 new functions exceed cyclomatic complexity threshold of 15.',
      category: 'quality_alert',
      priority: 'medium',
      status: 'unread',
      actionUrl: '/dashboard/quality',
      actionLabel: 'View Issues',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-4',
      userId: 'current-user',
      title: 'Goal Progress: 75% Complete',
      message: 'Sprint goal "Improve test coverage to 80%" is 75% complete.',
      category: 'goal_progress',
      priority: 'low',
      status: 'read',
      readAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-5',
      userId: 'current-user',
      title: 'New Issue Assigned',
      message: 'Alice Chen assigned you to "Fix memory leak in parser".',
      category: 'team_activity',
      priority: 'medium',
      status: 'read',
      readAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      actionUrl: '/dashboard/collaboration',
      actionLabel: 'View Issue',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateDefaultTriggers(): AlertTrigger[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'trigger-coverage-drop',
      name: 'Coverage Drop Alert',
      description: 'Alert when test coverage drops by more than 5%',
      enabled: true,
      category: 'coverage_change',
      metric: 'coverage_percentage',
      operator: 'change',
      value: -5,
      unit: '%',
      cooldownMinutes: 60,
      priority: 'critical',
      channels: ['in_app', 'email'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'trigger-critical-issues',
      name: 'Critical Issues Alert',
      description: 'Alert when any critical issues are detected',
      enabled: true,
      category: 'quality_alert',
      metric: 'critical_issues_count',
      operator: 'gt',
      value: 0,
      cooldownMinutes: 30,
      priority: 'critical',
      channels: ['in_app', 'slack'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'trigger-security',
      name: 'Security Vulnerability Alert',
      description: 'Alert on new security vulnerabilities',
      enabled: true,
      category: 'security_warning',
      metric: 'security_vulnerabilities',
      operator: 'gt',
      value: 0,
      cooldownMinutes: 0, // No cooldown for security
      priority: 'high',
      channels: ['in_app', 'email', 'slack'],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function generateDefaultPreferences(): NotificationPreferences {
  return {
    userId: 'current-user',
    channels: {
      in_app: true,
      email: true,
      slack: false,
      webhook: false,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/Los_Angeles',
    },
    categoryPreferences: {
      quality_alert: { enabled: true, minPriority: 'medium' },
      coverage_change: { enabled: true, minPriority: 'high' },
      dependency_issue: { enabled: true, minPriority: 'medium' },
      security_warning: { enabled: true, minPriority: 'low' },
      goal_progress: { enabled: true, minPriority: 'low' },
      team_activity: { enabled: true, minPriority: 'medium' },
      system: { enabled: true, minPriority: 'high' },
    },
    digestMode: 'immediate',
    updatedAt: new Date().toISOString(),
  };
}

export const notificationsApi = {
  fetchNotifications,
  fetchNotificationStats,
  fetchAlertTriggers,
  fetchNotificationPreferences,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  createAlertTrigger,
  updateAlertTrigger,
  deleteAlertTrigger,
  updateNotificationPreferences,
};
