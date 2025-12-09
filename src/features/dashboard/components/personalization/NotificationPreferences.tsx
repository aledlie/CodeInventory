/**
 * NotificationPreferences Component
 *
 * Phase 5B: Dashboard Personalization
 * Configure notification alerts and delivery preferences
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Slider,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Card,
  CardContent,
  Grid2 as Grid,
  Alert,
  Skeleton,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import type {
  DashboardNotificationPreferencesProps,
  WidgetNotificationPreference,
  WidgetMetadata,
  WidgetId,
} from '../../types';

// ============================================================================
// Icon Mapping
// ============================================================================

// Using AssessmentIcon as fallback for all widget icons
const widgetIconMap: Record<string, typeof AssessmentIcon> = {
  Assessment: AssessmentIcon,
};

// ============================================================================
// Widget Notification Settings Card
// ============================================================================

interface WidgetNotificationCardProps {
  widget: WidgetMetadata;
  settings: WidgetNotificationPreference;
  onChange: (widgetId: WidgetId, updates: Partial<WidgetNotificationPreference>) => void;
}

function WidgetNotificationCard({
  widget,
  settings,
  onChange,
}: WidgetNotificationCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const IconComponent = widgetIconMap[widget.icon] || AssessmentIcon;

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: settings.enabled ? 1 : 0.6,
        transition: theme.transitions.create('opacity'),
      }}
    >
      <CardContent sx={{ pb: expanded ? 2 : '16px !important' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: 1,
                bgcolor: alpha(
                  settings.enabled
                    ? theme.palette.primary.main
                    : theme.palette.grey[500],
                  0.1
                ),
              }}
            >
              <IconComponent
                sx={{
                  fontSize: 20,
                  color: settings.enabled
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2">{widget.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {widget.description}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={settings.enabled}
              onChange={(e) =>
                onChange(widget.id, { enabled: e.target.checked })
              }
              size="small"
            />
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              disabled={!settings.enabled}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded && settings.enabled}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              {/* Threshold Setting */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Alert Threshold
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={settings.threshold ?? ''}
                  onChange={(e) =>
                    onChange(widget.id, {
                      threshold: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Alert when value exceeds this threshold">
                          <InfoOutlinedIcon fontSize="small" color="action" />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Change Threshold */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Change Threshold (%)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={settings.changeThreshold ?? ''}
                  onChange={(e) =>
                    onChange(widget.id, {
                      changeThreshold: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 10"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Max per Hour */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Max Notifications per Hour: {settings.maxPerHour}
                </Typography>
                <Slider
                  value={settings.maxPerHour}
                  onChange={(_, value) =>
                    onChange(widget.id, { maxPerHour: value as number })
                  }
                  min={1}
                  max={20}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                  ]}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function NotificationPreferencesSkeleton() {
  return (
    <Paper sx={{ p: 3 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={60} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
      <Skeleton variant="text" width={160} height={24} sx={{ mb: 2 }} />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 1 }} />
      ))}
    </Paper>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NotificationPreferences({
  settings,
  onUpdateSettings,
  availableWidgets,
  isLoading = false,
}: DashboardNotificationPreferencesProps) {
  const [showQuietHours, setShowQuietHours] = useState(settings.quietHours.enabled);

  // Group widgets by category
  const widgetsByCategory = useMemo(() => {
    const groups: Record<string, WidgetMetadata[]> = {};
    for (const widget of availableWidgets) {
      if (!groups[widget.category]) {
        groups[widget.category] = [];
      }
      groups[widget.category].push(widget);
    }
    return groups;
  }, [availableWidgets]);

  // Handle global toggle
  const handleGlobalToggle = (enabled: boolean) => {
    onUpdateSettings({ enabled });
  };

  // Handle channel toggles
  const handleSoundToggle = (enabled: boolean) => {
    onUpdateSettings({ soundEnabled: enabled });
  };

  const handleDesktopToggle = (enabled: boolean) => {
    onUpdateSettings({ desktopNotifications: enabled });
  };

  // Handle quiet hours
  const handleQuietHoursToggle = (enabled: boolean) => {
    setShowQuietHours(enabled);
    onUpdateSettings({
      quietHours: { ...settings.quietHours, enabled },
    });
  };

  const handleQuietHoursChange = (
    field: 'start' | 'end' | 'timezone',
    value: string
  ) => {
    onUpdateSettings({
      quietHours: { ...settings.quietHours, [field]: value },
    });
  };

  // Handle digest mode
  const handleDigestModeChange = (event: SelectChangeEvent<string>) => {
    onUpdateSettings({
      digestMode: event.target.value as 'immediate' | 'hourly' | 'daily',
    });
  };

  // Handle widget notification update
  const handleWidgetNotificationChange = (
    widgetId: WidgetId,
    updates: Partial<WidgetNotificationPreference>
  ) => {
    const updatedSettings = settings.widgetSettings.map((ws: WidgetNotificationPreference) =>
      ws.widgetId === widgetId ? { ...ws, ...updates } : ws
    );
    onUpdateSettings({ widgetSettings: updatedSettings });
  };

  if (isLoading) {
    return <NotificationPreferencesSkeleton />;
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Notification Preferences
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={settings.enabled}
              onChange={(e) => handleGlobalToggle(e.target.checked)}
            />
          }
          label={settings.enabled ? 'Enabled' : 'Disabled'}
        />
      </Box>

      {!settings.enabled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          All notifications are currently disabled. Enable notifications to
          receive alerts about metric changes.
        </Alert>
      )}

      {/* Delivery Channels */}
      <Box sx={{ mb: 4, opacity: settings.enabled ? 1 : 0.5 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          Delivery Channels
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(e) => handleSoundToggle(e.target.checked)}
                    disabled={!settings.enabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {settings.soundEnabled ? (
                      <VolumeUpIcon fontSize="small" />
                    ) : (
                      <VolumeOffIcon fontSize="small" />
                    )}
                    Sound Notifications
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.desktopNotifications}
                    onChange={(e) => handleDesktopToggle(e.target.checked)}
                    disabled={!settings.enabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DesktopWindowsIcon fontSize="small" />
                    Desktop Notifications
                  </Box>
                }
              />
            </FormGroup>
          </CardContent>
        </Card>
      </Box>

      {/* Digest Mode */}
      <Box sx={{ mb: 4, opacity: settings.enabled ? 1 : 0.5 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          Notification Frequency
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Delivery Mode</InputLabel>
          <Select
            value={settings.digestMode}
            label="Delivery Mode"
            onChange={handleDigestModeChange}
            disabled={!settings.enabled}
          >
            <MenuItem value="immediate">
              <Box>
                <Typography variant="body2">Immediate</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive notifications as they happen
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="hourly">
              <Box>
                <Typography variant="body2">Hourly Digest</Typography>
                <Typography variant="caption" color="text.secondary">
                  Bundled summary every hour
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="daily">
              <Box>
                <Typography variant="body2">Daily Digest</Typography>
                <Typography variant="caption" color="text.secondary">
                  Single daily summary email
                </Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quiet Hours */}
      <Box sx={{ mb: 4, opacity: settings.enabled ? 1 : 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="subtitle2">Quiet Hours</Typography>
          </Box>
          <Switch
            checked={showQuietHours}
            onChange={(e) => handleQuietHoursToggle(e.target.checked)}
            disabled={!settings.enabled}
            size="small"
          />
        </Box>

        <Collapse in={showQuietHours}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Start Time"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) =>
                      handleQuietHoursChange('start', e.target.value)
                    }
                    disabled={!settings.enabled}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="End Time"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) =>
                      handleQuietHoursChange('end', e.target.value)
                    }
                    disabled={!settings.enabled}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Timezone"
                    value={settings.quietHours.timezone}
                    disabled
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                Notifications will be silenced during quiet hours.
              </Typography>
            </CardContent>
          </Card>
        </Collapse>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Widget-Specific Settings */}
      <Box sx={{ opacity: settings.enabled ? 1 : 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="subtitle2">Widget Notifications</Typography>
          <Chip
            label={`${settings.widgetSettings.filter((w: WidgetNotificationPreference) => w.enabled).length} / ${
              settings.widgetSettings.length
            } active`}
            size="small"
            variant="outlined"
          />
        </Box>

        {Object.entries(widgetsByCategory).map(([category, widgets]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1, textTransform: 'capitalize' }}
            >
              {category}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {widgets.map((widget) => {
                const widgetSettings = settings.widgetSettings.find(
                  (ws: WidgetNotificationPreference) => ws.widgetId === widget.id
                );
                if (!widgetSettings) return null;

                return (
                  <WidgetNotificationCard
                    key={widget.id}
                    widget={widget}
                    settings={widgetSettings}
                    onChange={handleWidgetNotificationChange}
                  />
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default NotificationPreferences;
