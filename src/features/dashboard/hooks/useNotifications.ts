/**
 * Notification Hooks
 *
 * Phase 4E: Smart Notifications
 * React Query hooks for notifications, triggers, and preferences
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import type { NotificationFilters, AlertTrigger, NotificationPreferences } from '../types';

/**
 * Query keys for notifications data
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters?: NotificationFilters) =>
    [...notificationKeys.all, 'list', filters] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
  triggers: () => [...notificationKeys.all, 'triggers'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

/**
 * Fetch notifications list
 */
export function useNotifications(filters?: NotificationFilters) {
  return useSuspenseQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationsApi.fetchNotifications(filters),
    staleTime: 15 * 1000, // 15 seconds
  });
}

/**
 * Fetch notification statistics
 */
export function useNotificationStats() {
  return useSuspenseQuery({
    queryKey: notificationKeys.stats(),
    queryFn: notificationsApi.fetchNotificationStats,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch alert triggers
 */
export function useAlertTriggers() {
  return useSuspenseQuery({
    queryKey: notificationKeys.triggers(),
    queryFn: notificationsApi.fetchAlertTriggers,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch notification preferences
 */
export function useNotificationPreferences() {
  return useSuspenseQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationsApi.fetchNotificationPreferences,
    staleTime: 60 * 1000,
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Dismiss notification
 */
export function useDismissNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.dismissNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Create alert trigger
 */
export function useCreateAlertTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      trigger: Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'>
    ) => notificationsApi.createAlertTrigger(trigger),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.triggers() });
    },
  });
}

/**
 * Update alert trigger
 */
export function useUpdateAlertTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      triggerId,
      updates,
    }: {
      triggerId: string;
      updates: Partial<AlertTrigger>;
    }) => notificationsApi.updateAlertTrigger(triggerId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.triggers() });
    },
  });
}

/**
 * Delete alert trigger
 */
export function useDeleteAlertTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (triggerId: string) =>
      notificationsApi.deleteAlertTrigger(triggerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.triggers() });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) =>
      notificationsApi.updateNotificationPreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.preferences(),
      });
    },
  });
}

/**
 * Combined hook for notification center
 */
export function useNotificationCenter(filters?: NotificationFilters) {
  const { data: notifications } = useNotifications(filters);
  const { data: stats } = useNotificationStats();

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const dismiss = useDismissNotification();

  return {
    notifications,
    stats,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    dismiss: dismiss.mutate,
    isMarking: markAsRead.isPending || markAllAsRead.isPending,
    isDismissing: dismiss.isPending,
  };
}

/**
 * Hook for managing alert triggers
 */
export function useAlertTriggersManager() {
  const { data: triggers } = useAlertTriggers();

  const create = useCreateAlertTrigger();
  const update = useUpdateAlertTrigger();
  const remove = useDeleteAlertTrigger();

  return {
    triggers,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
}
