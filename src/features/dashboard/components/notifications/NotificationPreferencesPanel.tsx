/**
 * NotificationPreferencesPanel Component
 *
 * User preferences for notifications:
 * - Channel settings (email, Slack, webhook)
 * - Quiet hours configuration
 * - Category preferences
 * - Digest mode
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2 as Grid,
  Divider,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Email as EmailIcon,
  Chat as SlackIcon,
  Http as WebhookIcon,
  Notifications as InAppIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type {
  NotificationPreferences,
  NotificationCategory,
  NotificationPriority,
} from '../../types';

/**
 * Props for NotificationPreferencesPanel
 */
export interface NotificationPreferencesPanelProps {
  preferences: NotificationPreferences;
  onUpdatePreferences?: (updates: Partial<NotificationPreferences>) => void;
  isLoading?: boolean;
}

/**
 * Category configuration
 */
const categories: { value: NotificationCategory; label: string; description: string }[] = [
  {
    value: 'quality_alert',
    label: 'Quality Alerts',
    description: 'Code quality issues and improvements',
  },
  {
    value: 'coverage_change',
    label: 'Coverage Changes',
    description: 'Test coverage increases or decreases',
  },
  {
    value: 'dependency_issue',
    label: 'Dependency Issues',
    description: 'Outdated or problematic dependencies',
  },
  {
    value: 'security_warning',
    label: 'Security Warnings',
    description: 'Vulnerabilities and security concerns',
  },
  {
    value: 'goal_progress',
    label: 'Goal Progress',
    description: 'Updates on sprint goal completion',
  },
  {
    value: 'team_activity',
    label: 'Team Activity',
    description: 'Comments, assignments, and mentions',
  },
];

/**
 * Priority options
 */
const priorityOptions: { value: NotificationPriority; label: string }[] = [
  { value: 'critical', label: 'Critical only' },
  { value: 'high', label: 'High and above' },
  { value: 'medium', label: 'Medium and above' },
  { value: 'low', label: 'All priorities' },
];

/**
 * Digest mode options
 */
const digestOptions = [
  { value: 'immediate', label: 'Immediate', description: 'Get notified right away' },
  { value: 'hourly', label: 'Hourly Digest', description: 'Summary every hour' },
  { value: 'daily', label: 'Daily Digest', description: 'Summary once per day' },
];

/**
 * Timezone options (common ones)
 */
const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

/**
 * Channel card
 */
function ChannelCard({
  icon,
  title,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ opacity: enabled ? 1 : 0.6 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Switch
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
        </Box>
        {enabled && children}
      </CardContent>
    </Card>
  );
}

/**
 * NotificationPreferencesPanel component
 */
export function NotificationPreferencesPanel({
  preferences,
  onUpdatePreferences,
}: NotificationPreferencesPanelProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleUpdate = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      const newPrefs = { ...localPrefs, ...updates };
      setLocalPrefs(newPrefs);
      onUpdatePreferences?.(updates);
    },
    [localPrefs, onUpdatePreferences]
  );

  const handleChannelToggle = useCallback(
    (channel: keyof NotificationPreferences['channels'], enabled: boolean) => {
      handleUpdate({
        channels: { ...localPrefs.channels, [channel]: enabled },
      });
    },
    [localPrefs.channels, handleUpdate]
  );

  const handleCategoryToggle = useCallback(
    (category: NotificationCategory, enabled: boolean) => {
      handleUpdate({
        categoryPreferences: {
          ...localPrefs.categoryPreferences,
          [category]: { ...localPrefs.categoryPreferences[category], enabled },
        },
      });
    },
    [localPrefs.categoryPreferences, handleUpdate]
  );

  const handleCategoryPriority = useCallback(
    (category: NotificationCategory, minPriority: NotificationPriority) => {
      handleUpdate({
        categoryPreferences: {
          ...localPrefs.categoryPreferences,
          [category]: { ...localPrefs.categoryPreferences[category], minPriority },
        },
      });
    },
    [localPrefs.categoryPreferences, handleUpdate]
  );

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SettingsIcon color="primary" />
        <Typography variant="h6">Notification Preferences</Typography>
      </Box>

      {/* Delivery Channels */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Delivery Channels
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChannelCard
            icon={<InAppIcon color="primary" />}
            title="In-App"
            enabled={localPrefs.channels.in_app}
            onToggle={(enabled) => handleChannelToggle('in_app', enabled)}
          >
            <Typography variant="body2" color="text.secondary">
              Notifications appear in the dashboard notification center.
            </Typography>
          </ChannelCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChannelCard
            icon={<EmailIcon color="primary" />}
            title="Email"
            enabled={localPrefs.channels.email}
            onToggle={(enabled) => handleChannelToggle('email', enabled)}
          >
            <TextField
              fullWidth
              size="small"
              label="Email Address"
              value={localPrefs.emailAddress || ''}
              onChange={(e) => handleUpdate({ emailAddress: e.target.value })}
            />
          </ChannelCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChannelCard
            icon={<SlackIcon color="primary" />}
            title="Slack"
            enabled={localPrefs.channels.slack}
            onToggle={(enabled) => handleChannelToggle('slack', enabled)}
          >
            <TextField
              fullWidth
              size="small"
              label="Slack Channel"
              placeholder="#channel-name"
              value={localPrefs.slackChannel || ''}
              onChange={(e) => handleUpdate({ slackChannel: e.target.value })}
            />
          </ChannelCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChannelCard
            icon={<WebhookIcon color="primary" />}
            title="Webhook"
            enabled={localPrefs.channels.webhook}
            onToggle={(enabled) => handleChannelToggle('webhook', enabled)}
          >
            <TextField
              fullWidth
              size="small"
              label="Webhook URL"
              placeholder="https://..."
              value={localPrefs.webhookUrl || ''}
              onChange={(e) => handleUpdate({ webhookUrl: e.target.value })}
            />
          </ChannelCard>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Quiet Hours */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Quiet Hours
          </Typography>
          <Switch
            checked={localPrefs.quietHours?.enabled || false}
            onChange={(e) =>
              handleUpdate({
                quietHours: { ...localPrefs.quietHours!, enabled: e.target.checked },
              })
            }
          />
        </Box>
        {localPrefs.quietHours?.enabled && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Start Time"
                type="time"
                value={localPrefs.quietHours?.start || '22:00'}
                onChange={(e) =>
                  handleUpdate({
                    quietHours: { ...localPrefs.quietHours!, start: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="End Time"
                type="time"
                value={localPrefs.quietHours?.end || '08:00'}
                onChange={(e) =>
                  handleUpdate({
                    quietHours: { ...localPrefs.quietHours!, end: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={localPrefs.quietHours?.timezone || 'America/Los_Angeles'}
                  label="Timezone"
                  onChange={(e) =>
                    handleUpdate({
                      quietHours: { ...localPrefs.quietHours!, timezone: e.target.value },
                    })
                  }
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Digest Mode */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Notification Frequency
        </Typography>
        <Grid container spacing={2}>
          {digestOptions.map((option) => (
            <Grid key={option.value} size={{ xs: 12, md: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  borderColor:
                    localPrefs.digestMode === option.value
                      ? 'primary.main'
                      : 'divider',
                  borderWidth: localPrefs.digestMode === option.value ? 2 : 1,
                }}
                onClick={() => handleUpdate({ digestMode: option.value as NotificationPreferences['digestMode'] })}
              >
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {option.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Category Preferences */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Category Settings
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Enable or disable notifications by category and set minimum priority levels.
      </Alert>
      <Grid container spacing={2}>
        {categories.map((category) => {
          const pref = localPrefs.categoryPreferences[category.value];
          return (
            <Grid key={category.value} size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ opacity: pref?.enabled ? 1 : 0.6 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {category.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {category.description}
                      </Typography>
                    </Box>
                    <Switch
                      checked={pref?.enabled ?? true}
                      onChange={(e) =>
                        handleCategoryToggle(category.value, e.target.checked)
                      }
                    />
                  </Box>
                  {pref?.enabled && (
                    <Box sx={{ mt: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Min Priority</InputLabel>
                        <Select
                          value={pref.minPriority || 'medium'}
                          label="Min Priority"
                          onChange={(e) =>
                            handleCategoryPriority(
                              category.value,
                              e.target.value as NotificationPriority
                            )
                          }
                        >
                          {priorityOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}

export default NotificationPreferencesPanel;
