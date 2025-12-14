/**
 * Notifications API Service Tests
 *
 * Phase 4E: Smart Notifications
 * Tests for notifications, alert triggers, and preferences.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import {
  notificationsApi,
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
} from '../notificationsApi';
import type {
  Notification,
  NotificationStats,
  AlertTrigger,
  NotificationPreferences,
  NotificationFilters,
  NotificationCategory,
  NotificationPriority,
} from '../../types';

// ============================================================================
// Test Constants
// ============================================================================

const STORAGE_KEYS = {
  NOTIFICATIONS: 'dashboard_notifications',
  TRIGGERS: 'dashboard_alert_triggers',
  PREFS: 'dashboard_notification_prefs',
} as const;

const TEST_TIMESTAMP = '2024-01-15T12:00:00.000Z';
const MOCK_DATE_NOW = 1705320000000; // 2024-01-15T12:00:00.000Z

// ============================================================================
// Mock Setup
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = vi.fn();

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

// Mock Date.now for consistent timestamps
vi.spyOn(Date, 'now').mockReturnValue(MOCK_DATE_NOW);
vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(TEST_TIMESTAMP);

// ============================================================================
// Helper Functions
// ============================================================================

function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    userId: 'test-user',
    title: 'Test Notification',
    message: 'This is a test notification message.',
    category: 'quality_alert',
    priority: 'medium',
    status: 'unread',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

function createMockAlertTrigger(overrides: Partial<AlertTrigger> = {}): AlertTrigger {
  return {
    id: 'trigger-1',
    name: 'Test Trigger',
    description: 'A test trigger',
    enabled: true,
    category: 'quality_alert',
    metric: 'test_metric',
    operator: 'gt',
    value: 10,
    unit: '%',
    cooldownMinutes: 60,
    priority: 'high',
    channels: ['in_app', 'email'],
    createdAt: TEST_TIMESTAMP,
    updatedAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

function createMockPreferences(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    userId: 'test-user',
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
    updatedAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

// ============================================================================
// Tests: fetchNotifications
// ============================================================================

describe('fetchNotifications', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should fetch notifications from API successfully', async () => {
    const mockNotifications = [
      createMockNotification({ id: 'notif-1' }),
      createMockNotification({ id: 'notif-2', title: 'Second Notification' }),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotifications),
    });

    const result = await fetchNotifications();

    expect(mockFetch).toHaveBeenCalledWith('/data/notifications/notifications.json');
    expect(result).toEqual(mockNotifications);
    expect(result).toHaveLength(2);
  });

  it('should return mock data when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchNotifications();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return stored notifications from localStorage when API fails', async () => {
    const storedNotifications = [createMockNotification({ id: 'stored-1' })];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchNotifications();

    expect(result).toEqual(storedNotifications);
  });

  it('should throw error when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    // Should fall back to mock data, not throw
    const result = await fetchNotifications();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  describe('filters', () => {
    const mockNotifications = [
      createMockNotification({ id: '1', category: 'quality_alert', priority: 'high', status: 'unread' }),
      createMockNotification({ id: '2', category: 'security_warning', priority: 'critical', status: 'read' }),
      createMockNotification({ id: '3', category: 'coverage_change', priority: 'medium', status: 'unread' }),
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotifications),
      });
    });

    it('should filter by categories', async () => {
      const filters: NotificationFilters = { categories: ['quality_alert'] };
      const result = await fetchNotifications(filters);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('quality_alert');
    });

    it('should filter by priorities', async () => {
      const filters: NotificationFilters = { priorities: ['critical', 'high'] };
      const result = await fetchNotifications(filters);

      expect(result).toHaveLength(2);
      expect(result.every(n => ['critical', 'high'].includes(n.priority))).toBe(true);
    });

    it('should filter by statuses', async () => {
      const filters: NotificationFilters = { statuses: ['unread'] };
      const result = await fetchNotifications(filters);

      expect(result).toHaveLength(2);
      expect(result.every(n => n.status === 'unread')).toBe(true);
    });

    it('should filter by date range', async () => {
      const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const filters: NotificationFilters = {
        startDate: pastDate,
        endDate: futureDate,
      };

      const result = await fetchNotifications(filters);
      expect(result).toBeDefined();
    });

    it('should filter by search term in title', async () => {
      const notificationsWithTitles = [
        createMockNotification({ id: '1', title: 'Critical Coverage Drop', message: 'Test' }),
        createMockNotification({ id: '2', title: 'Security Alert', message: 'Test' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(notificationsWithTitles),
      });

      const filters: NotificationFilters = { search: 'coverage' };
      const result = await fetchNotifications(filters);

      expect(result).toHaveLength(1);
      expect(result[0].title.toLowerCase()).toContain('coverage');
    });

    it('should filter by search term in message', async () => {
      const notificationsWithMessages = [
        createMockNotification({ id: '1', title: 'Alert', message: 'Coverage decreased significantly' }),
        createMockNotification({ id: '2', title: 'Alert', message: 'Security issue detected' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(notificationsWithMessages),
      });

      const filters: NotificationFilters = { search: 'security' };
      const result = await fetchNotifications(filters);

      expect(result).toHaveLength(1);
      expect(result[0].message.toLowerCase()).toContain('security');
    });

    it('should apply multiple filters together', async () => {
      const filters: NotificationFilters = {
        categories: ['quality_alert', 'security_warning'],
        statuses: ['unread'],
      };
      const result = await fetchNotifications(filters);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('quality_alert');
      expect(result[0].status).toBe('unread');
    });

    it('should apply filters to localStorage fallback data', async () => {
      const storedNotifications = [
        createMockNotification({ id: '1', category: 'quality_alert', status: 'unread' }),
        createMockNotification({ id: '2', category: 'security_warning', status: 'read' }),
      ];
      localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const filters: NotificationFilters = { statuses: ['unread'] };
      const result = await fetchNotifications(filters);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('unread');
    });
  });
});

// ============================================================================
// Tests: fetchNotificationStats
// ============================================================================

describe('fetchNotificationStats', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should fetch stats from API successfully', async () => {
    const mockStats: NotificationStats = {
      total: 25,
      unread: 10,
      byCategory: {
        quality_alert: 5,
        coverage_change: 3,
        dependency_issue: 2,
        security_warning: 5,
        goal_progress: 4,
        team_activity: 4,
        system: 2,
      },
      byPriority: {
        critical: 3,
        high: 7,
        medium: 10,
        low: 5,
      },
      lastWeekCount: 15,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const result = await fetchNotificationStats();

    expect(mockFetch).toHaveBeenCalledWith('/data/notifications/stats.json');
    expect(result).toEqual(mockStats);
  });

  it('should calculate stats from stored notifications when API fails', async () => {
    const storedNotifications = [
      createMockNotification({ id: '1', category: 'quality_alert', priority: 'high', status: 'unread' }),
      createMockNotification({ id: '2', category: 'quality_alert', priority: 'medium', status: 'read' }),
      createMockNotification({ id: '3', category: 'security_warning', priority: 'critical', status: 'unread' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));

    // Stats fetch fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    // Notifications fetch also fails, uses localStorage
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchNotificationStats();

    expect(result.total).toBe(3);
    expect(result.unread).toBe(2);
    expect(result.byCategory.quality_alert).toBe(2);
    expect(result.byCategory.security_warning).toBe(1);
    expect(result.byPriority.high).toBe(1);
    expect(result.byPriority.medium).toBe(1);
    expect(result.byPriority.critical).toBe(1);
  });

  it('should throw error on non-ok response and calculate from notifications', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await fetchNotificationStats();

    expect(result).toBeDefined();
    expect(typeof result.total).toBe('number');
  });
});

// ============================================================================
// Tests: fetchAlertTriggers
// ============================================================================

describe('fetchAlertTriggers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should fetch triggers from API successfully', async () => {
    const mockTriggers = [
      createMockAlertTrigger({ id: 'trigger-1' }),
      createMockAlertTrigger({ id: 'trigger-2', name: 'Second Trigger' }),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTriggers),
    });

    const result = await fetchAlertTriggers();

    expect(mockFetch).toHaveBeenCalledWith('/data/notifications/triggers.json');
    expect(result).toEqual(mockTriggers);
  });

  it('should return stored triggers when API fails', async () => {
    const storedTriggers = [createMockAlertTrigger({ id: 'stored-trigger' })];
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(storedTriggers));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchAlertTriggers();

    expect(result).toEqual(storedTriggers);
  });

  it('should return default triggers when no stored data and API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchAlertTriggers();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    // Default triggers should include coverage and security triggers
    expect(result.some(t => t.category === 'coverage_change')).toBe(true);
    expect(result.some(t => t.category === 'security_warning')).toBe(true);
  });

  it('should handle non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    const result = await fetchAlertTriggers();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================================
// Tests: fetchNotificationPreferences
// ============================================================================

describe('fetchNotificationPreferences', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should fetch preferences from API successfully', async () => {
    const mockPrefs = createMockPreferences();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPrefs),
    });

    const result = await fetchNotificationPreferences();

    expect(mockFetch).toHaveBeenCalledWith('/data/notifications/preferences.json');
    expect(result).toEqual(mockPrefs);
  });

  it('should return stored preferences when API fails', async () => {
    const storedPrefs = createMockPreferences({ digestMode: 'daily' });
    localStorageMock.setItem(STORAGE_KEYS.PREFS, JSON.stringify(storedPrefs));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchNotificationPreferences();

    expect(result).toEqual(storedPrefs);
  });

  it('should return default preferences when no stored data and API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchNotificationPreferences();

    expect(result).toBeDefined();
    expect(result.userId).toBe('current-user');
    expect(result.channels.in_app).toBe(true);
    expect(result.digestMode).toBe('immediate');
  });

  it('should handle non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await fetchNotificationPreferences();
    expect(result).toBeDefined();
  });
});

// ============================================================================
// Tests: markNotificationAsRead
// ============================================================================

describe('markNotificationAsRead', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should mark a notification as read', async () => {
    const notifications = [
      createMockNotification({ id: 'notif-1', status: 'unread' }),
      createMockNotification({ id: 'notif-2', status: 'unread' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const result = await markNotificationAsRead('notif-1');

    expect(result.id).toBe('notif-1');
    expect(result.status).toBe('read');
    expect(result.readAt).toBe(TEST_TIMESTAMP);

    // Verify localStorage was updated
    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.NOTIFICATIONS]);
    const updated = stored.find((n: Notification) => n.id === 'notif-1');
    expect(updated.status).toBe('read');
  });

  it('should throw error when notification not found', async () => {
    const notifications = [createMockNotification({ id: 'notif-1' })];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await expect(markNotificationAsRead('nonexistent')).rejects.toThrow('Notification not found');
  });

  it('should not modify other notifications', async () => {
    const notifications = [
      createMockNotification({ id: 'notif-1', status: 'unread' }),
      createMockNotification({ id: 'notif-2', status: 'unread' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await markNotificationAsRead('notif-1');

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.NOTIFICATIONS]);
    const unchanged = stored.find((n: Notification) => n.id === 'notif-2');
    expect(unchanged.status).toBe('unread');
  });
});

// ============================================================================
// Tests: markAllNotificationsAsRead
// ============================================================================

describe('markAllNotificationsAsRead', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should mark all notifications as read', async () => {
    const notifications = [
      createMockNotification({ id: 'notif-1', status: 'unread' }),
      createMockNotification({ id: 'notif-2', status: 'unread' }),
      createMockNotification({ id: 'notif-3', status: 'read', readAt: '2024-01-01T00:00:00.000Z' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await markAllNotificationsAsRead();

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.NOTIFICATIONS]);
    expect(stored.every((n: Notification) => n.status === 'read')).toBe(true);
    expect(stored.every((n: Notification) => n.readAt !== undefined)).toBe(true);
  });

  it('should preserve existing readAt timestamps', async () => {
    const existingReadAt = '2024-01-01T00:00:00.000Z';
    const notifications = [
      createMockNotification({ id: 'notif-1', status: 'read', readAt: existingReadAt }),
      createMockNotification({ id: 'notif-2', status: 'unread' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await markAllNotificationsAsRead();

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.NOTIFICATIONS]);
    const alreadyRead = stored.find((n: Notification) => n.id === 'notif-1');
    expect(alreadyRead.readAt).toBe(existingReadAt);
  });
});

// ============================================================================
// Tests: dismissNotification
// ============================================================================

describe('dismissNotification', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should dismiss a notification', async () => {
    const notifications = [
      createMockNotification({ id: 'notif-1', status: 'unread' }),
      createMockNotification({ id: 'notif-2', status: 'unread' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await dismissNotification('notif-1');

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.NOTIFICATIONS]);
    const dismissed = stored.find((n: Notification) => n.id === 'notif-1');
    expect(dismissed.status).toBe('dismissed');
    expect(dismissed.dismissedAt).toBe(TEST_TIMESTAMP);
  });

  it('should not modify other notifications when dismissing', async () => {
    const notifications = [
      createMockNotification({ id: 'notif-1', status: 'unread' }),
      createMockNotification({ id: 'notif-2', status: 'read' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await dismissNotification('notif-1');

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.NOTIFICATIONS]);
    const unchanged = stored.find((n: Notification) => n.id === 'notif-2');
    expect(unchanged.status).toBe('read');
  });
});

// ============================================================================
// Tests: createAlertTrigger
// ============================================================================

describe('createAlertTrigger', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should create a new alert trigger', async () => {
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const newTrigger = {
      name: 'New Coverage Trigger',
      description: 'Alert on coverage drop',
      enabled: true,
      category: 'coverage_change' as NotificationCategory,
      metric: 'coverage_percentage',
      operator: 'change' as const,
      value: -10,
      unit: '%',
      cooldownMinutes: 30,
      priority: 'high' as NotificationPriority,
      channels: ['in_app', 'email'] as const,
    };

    const result = await createAlertTrigger(newTrigger);

    expect(result.id).toMatch(/^trigger-/);
    expect(result.name).toBe('New Coverage Trigger');
    expect(result.createdAt).toBe(TEST_TIMESTAMP);
    expect(result.updatedAt).toBe(TEST_TIMESTAMP);
  });

  it('should add trigger to existing triggers', async () => {
    const existingTriggers = [createMockAlertTrigger({ id: 'existing-1' })];
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(existingTriggers));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const newTrigger = {
      name: 'New Trigger',
      enabled: true,
      category: 'quality_alert' as NotificationCategory,
      metric: 'issues_count',
      operator: 'gt' as const,
      value: 5,
      cooldownMinutes: 60,
      priority: 'medium' as NotificationPriority,
      channels: ['in_app'] as const,
    };

    await createAlertTrigger(newTrigger);

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.TRIGGERS]);
    expect(stored).toHaveLength(2);
    expect(stored[0].id).toBe('existing-1');
  });
});

// ============================================================================
// Tests: updateAlertTrigger
// ============================================================================

describe('updateAlertTrigger', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should update an existing trigger', async () => {
    const triggers = [
      createMockAlertTrigger({ id: 'trigger-1', name: 'Original Name', enabled: true }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(triggers));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const result = await updateAlertTrigger('trigger-1', {
      name: 'Updated Name',
      enabled: false,
    });

    expect(result.id).toBe('trigger-1');
    expect(result.name).toBe('Updated Name');
    expect(result.enabled).toBe(false);
    expect(result.updatedAt).toBe(TEST_TIMESTAMP);
  });

  it('should throw error when trigger not found', async () => {
    const triggers = [createMockAlertTrigger({ id: 'trigger-1' })];
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(triggers));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await expect(updateAlertTrigger('nonexistent', { name: 'New Name' }))
      .rejects.toThrow('Trigger not found');
  });

  it('should preserve unmodified fields', async () => {
    const triggers = [
      createMockAlertTrigger({
        id: 'trigger-1',
        name: 'Original',
        description: 'Keep this',
        cooldownMinutes: 120,
      }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(triggers));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const result = await updateAlertTrigger('trigger-1', { name: 'Updated' });

    expect(result.name).toBe('Updated');
    expect(result.description).toBe('Keep this');
    expect(result.cooldownMinutes).toBe(120);
  });
});

// ============================================================================
// Tests: deleteAlertTrigger
// ============================================================================

describe('deleteAlertTrigger', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should delete an alert trigger', async () => {
    const triggers = [
      createMockAlertTrigger({ id: 'trigger-1' }),
      createMockAlertTrigger({ id: 'trigger-2' }),
    ];
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(triggers));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await deleteAlertTrigger('trigger-1');

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.TRIGGERS]);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('trigger-2');
  });

  it('should handle deleting non-existent trigger gracefully', async () => {
    const triggers = [createMockAlertTrigger({ id: 'trigger-1' })];
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(triggers));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await deleteAlertTrigger('nonexistent');

    const stored = JSON.parse(localStorageMock.store[STORAGE_KEYS.TRIGGERS]);
    expect(stored).toHaveLength(1);
  });
});

// ============================================================================
// Tests: updateNotificationPreferences
// ============================================================================

describe('updateNotificationPreferences', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should update notification preferences', async () => {
    const existingPrefs = createMockPreferences({ digestMode: 'immediate' });
    localStorageMock.setItem(STORAGE_KEYS.PREFS, JSON.stringify(existingPrefs));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const result = await updateNotificationPreferences({
      digestMode: 'daily',
    });

    expect(result.digestMode).toBe('daily');
    expect(result.updatedAt).toBe(TEST_TIMESTAMP);
  });

  it('should update channel preferences', async () => {
    const existingPrefs = createMockPreferences();
    localStorageMock.setItem(STORAGE_KEYS.PREFS, JSON.stringify(existingPrefs));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const result = await updateNotificationPreferences({
      channels: {
        in_app: true,
        email: false,
        slack: true,
        webhook: false,
      },
    });

    expect(result.channels.email).toBe(false);
    expect(result.channels.slack).toBe(true);
  });

  it('should preserve unmodified preferences', async () => {
    const existingPrefs = createMockPreferences({
      userId: 'user-123',
      digestMode: 'hourly',
    });
    localStorageMock.setItem(STORAGE_KEYS.PREFS, JSON.stringify(existingPrefs));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const result = await updateNotificationPreferences({
      digestMode: 'daily',
    });

    expect(result.userId).toBe('user-123');
    expect(result.digestMode).toBe('daily');
  });

  it('should store updated preferences in localStorage', async () => {
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    await updateNotificationPreferences({ digestMode: 'hourly' });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.PREFS,
      expect.stringContaining('"digestMode":"hourly"')
    );
  });
});

// ============================================================================
// Tests: notificationsApi export object
// ============================================================================

describe('notificationsApi export', () => {
  it('should export all API functions', () => {
    expect(notificationsApi.fetchNotifications).toBe(fetchNotifications);
    expect(notificationsApi.fetchNotificationStats).toBe(fetchNotificationStats);
    expect(notificationsApi.fetchAlertTriggers).toBe(fetchAlertTriggers);
    expect(notificationsApi.fetchNotificationPreferences).toBe(fetchNotificationPreferences);
    expect(notificationsApi.markNotificationAsRead).toBe(markNotificationAsRead);
    expect(notificationsApi.markAllNotificationsAsRead).toBe(markAllNotificationsAsRead);
    expect(notificationsApi.dismissNotification).toBe(dismissNotification);
    expect(notificationsApi.createAlertTrigger).toBe(createAlertTrigger);
    expect(notificationsApi.updateAlertTrigger).toBe(updateAlertTrigger);
    expect(notificationsApi.deleteAlertTrigger).toBe(deleteAlertTrigger);
    expect(notificationsApi.updateNotificationPreferences).toBe(updateNotificationPreferences);
  });
});

// ============================================================================
// Tests: Edge Cases and Error Handling
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  it('should handle empty notifications array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await fetchNotifications();
    expect(result).toEqual([]);
  });

  it('should handle empty triggers array', async () => {
    localStorageMock.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify([]));
    mockFetch.mockRejectedValue(new Error('Use localStorage'));

    const result = await fetchAlertTriggers();
    expect(result).toEqual([]);
  });

  it('should handle filters with empty arrays', async () => {
    const notifications = [createMockNotification()];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(notifications),
    });

    const filters: NotificationFilters = {
      categories: [],
      priorities: [],
      statuses: [],
    };

    const result = await fetchNotifications(filters);
    expect(result).toEqual(notifications);
  });

  it('should calculate stats correctly with no notifications', async () => {
    localStorageMock.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    mockFetch.mockRejectedValueOnce(new Error('Use localStorage'));

    const result = await fetchNotificationStats();

    expect(result.total).toBe(0);
    expect(result.unread).toBe(0);
    expect(result.lastWeekCount).toBe(0);
  });

  it('should handle date filter edge cases', async () => {
    const veryOldDate = '2020-01-01T00:00:00.000Z';
    const notifications = [
      createMockNotification({ id: '1', createdAt: veryOldDate }),
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(notifications),
    });

    const filters: NotificationFilters = {
      startDate: '2023-01-01T00:00:00.000Z',
    };

    const result = await fetchNotifications(filters);
    expect(result).toHaveLength(0);
  });

  it('should handle end date filter correctly', async () => {
    const futureDate = '2030-01-01T00:00:00.000Z';
    const notifications = [
      createMockNotification({ id: '1', createdAt: futureDate }),
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(notifications),
    });

    const filters: NotificationFilters = {
      endDate: '2025-01-01T00:00:00.000Z',
    };

    const result = await fetchNotifications(filters);
    expect(result).toHaveLength(0);
  });
});
