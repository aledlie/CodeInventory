/**
 * AlertConfigurator Component
 *
 * Configure alert triggers for notifications:
 * - Create/edit/delete triggers
 * - Set conditions and thresholds
 * - Configure delivery channels
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Grid2 as Grid,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NotificationsActive as AlertIcon,
  Email as EmailIcon,
  Chat as SlackIcon,
  Http as WebhookIcon,
  Notifications as InAppIcon,
} from '@mui/icons-material';
import type {
  AlertTrigger,
  NotificationCategory,
  NotificationPriority,
  TriggerOperator,
  DeliveryChannel,
} from '../../types';

/**
 * Props for AlertConfigurator
 */
export interface AlertConfiguratorProps {
  triggers: AlertTrigger[];
  onCreateTrigger?: (trigger: Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTrigger?: (id: string, updates: Partial<AlertTrigger>) => void;
  onDeleteTrigger?: (id: string) => void;
  onToggleTrigger?: (id: string, enabled: boolean) => void;
  isLoading?: boolean;
}

/**
 * Category options
 */
const categoryOptions: { value: NotificationCategory; label: string }[] = [
  { value: 'quality_alert', label: 'Quality Alert' },
  { value: 'coverage_change', label: 'Coverage Change' },
  { value: 'dependency_issue', label: 'Dependency Issue' },
  { value: 'security_warning', label: 'Security Warning' },
  { value: 'goal_progress', label: 'Goal Progress' },
  { value: 'team_activity', label: 'Team Activity' },
];

/**
 * Operator options
 */
const operatorOptions: { value: TriggerOperator; label: string }[] = [
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'eq', label: 'Equals' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lte', label: 'Less than or equal' },
  { value: 'change', label: 'Change by' },
  { value: 'threshold', label: 'Threshold crossed' },
];

/**
 * Priority options
 */
const priorityOptions: { value: NotificationPriority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc3545' },
  { value: 'high', label: 'High', color: '#ff5722' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'low', label: 'Low', color: '#28a745' },
];

/**
 * Channel icons
 */
const channelIcons: Record<DeliveryChannel, React.ReactNode> = {
  in_app: <InAppIcon fontSize="small" />,
  email: <EmailIcon fontSize="small" />,
  slack: <SlackIcon fontSize="small" />,
  webhook: <WebhookIcon fontSize="small" />,
};

/**
 * Metric options (predefined metrics to track)
 */
const metricOptions = [
  { value: 'coverage_percentage', label: 'Test Coverage %' },
  { value: 'critical_issues_count', label: 'Critical Issues Count' },
  { value: 'high_issues_count', label: 'High Issues Count' },
  { value: 'total_issues_count', label: 'Total Issues Count' },
  { value: 'security_vulnerabilities', label: 'Security Vulnerabilities' },
  { value: 'circular_dependencies', label: 'Circular Dependencies' },
  { value: 'untested_functions', label: 'Untested Functions' },
];

/**
 * Default trigger values
 */
const defaultTrigger: Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  enabled: true,
  category: 'quality_alert',
  metric: 'critical_issues_count',
  operator: 'gt',
  value: 0,
  cooldownMinutes: 60,
  priority: 'high',
  channels: ['in_app'],
};

/**
 * Trigger form dialog
 */
function TriggerDialog({
  open,
  trigger,
  onClose,
  onSave,
}: {
  open: boolean;
  trigger: Partial<AlertTrigger> | null;
  onClose: () => void;
  onSave: (trigger: Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [form, setForm] = useState<Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'>>(
    trigger ? { ...defaultTrigger, ...trigger } : defaultTrigger
  );

  const handleChange = <K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChannelToggle = (channel: DeliveryChannel) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  const isEdit = trigger?.id !== undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Alert Trigger' : 'Create Alert Trigger'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Name */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Trigger Name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              value={form.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>

          {/* Category */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                label="Category"
                onChange={(e) =>
                  handleChange('category', e.target.value as NotificationCategory)
                }
              >
                {categoryOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Priority */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={form.priority}
                label="Priority"
                onChange={(e) =>
                  handleChange('priority', e.target.value as NotificationPriority)
                }
              >
                {priorityOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: opt.color,
                        }}
                      />
                      {opt.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Metric */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Metric</InputLabel>
              <Select
                value={form.metric}
                label="Metric"
                onChange={(e) => handleChange('metric', e.target.value)}
              >
                {metricOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Operator */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={form.operator}
                label="Condition"
                onChange={(e) =>
                  handleChange('operator', e.target.value as TriggerOperator)
                }
              >
                {operatorOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Value */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Value"
              type="number"
              value={form.value}
              onChange={(e) => handleChange('value', Number(e.target.value))}
              InputProps={{
                endAdornment: form.unit && (
                  <Typography variant="caption" color="text.secondary">
                    {form.unit}
                  </Typography>
                ),
              }}
            />
          </Grid>

          {/* Cooldown */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Cooldown (minutes)"
              type="number"
              value={form.cooldownMinutes}
              onChange={(e) =>
                handleChange('cooldownMinutes', Number(e.target.value))
              }
              helperText="Minimum time between notifications"
            />
          </Grid>

          {/* Channels */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              Delivery Channels
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {(['in_app', 'email', 'slack', 'webhook'] as DeliveryChannel[]).map(
                (channel) => (
                  <FormControlLabel
                    key={channel}
                    control={
                      <Checkbox
                        checked={form.channels.includes(channel)}
                        onChange={() => handleChannelToggle(channel)}
                        icon={channelIcons[channel]}
                        checkedIcon={channelIcons[channel]}
                      />
                    }
                    label={channel.replace('_', ' ')}
                  />
                )
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!form.name || form.channels.length === 0}
        >
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * AlertConfigurator component
 */
export function AlertConfigurator({
  triggers,
  onCreateTrigger,
  onUpdateTrigger,
  onDeleteTrigger,
  onToggleTrigger,
}: AlertConfiguratorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<AlertTrigger | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingTrigger(null);
    setDialogOpen(true);
  };

  const handleEdit = (trigger: AlertTrigger) => {
    setEditingTrigger(trigger);
    setDialogOpen(true);
  };

  const handleSave = (
    trigger: Omit<AlertTrigger, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingTrigger) {
      onUpdateTrigger?.(editingTrigger.id, trigger);
    } else {
      onCreateTrigger?.(trigger);
    }
  };

  const handleDelete = (id: string) => {
    onDeleteTrigger?.(id);
    setDeleteConfirm(null);
  };

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
          <AlertIcon color="primary" />
          <Typography variant="h6">Alert Triggers</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          size="small"
        >
          New Trigger
        </Button>
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ m: 2 }}>
        Configure triggers to receive notifications when metrics exceed thresholds
        or change significantly.
      </Alert>

      {/* Trigger list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {triggers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <AlertIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
            <Typography>No triggers configured</Typography>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Create your first trigger
            </Button>
          </Box>
        ) : (
          <List>
            {triggers.map((trigger) => {
              const priority = priorityOptions.find(
                (p) => p.value === trigger.priority
              );
              return (
                <ListItem
                  key={trigger.id}
                  sx={{
                    borderLeft: 3,
                    borderColor: priority?.color || 'divider',
                    opacity: trigger.enabled ? 1 : 0.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {trigger.name}
                        </Typography>
                        <Chip
                          label={trigger.priority}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            bgcolor: `${priority?.color}20`,
                            color: priority?.color,
                          }}
                        />
                        {!trigger.enabled && (
                          <Chip label="Disabled" size="small" color="default" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {trigger.description || `${trigger.metric} ${trigger.operator} ${trigger.value}${trigger.unit || ''}`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {trigger.channels.map((channel) => (
                            <Tooltip key={channel} title={channel.replace('_', ' ')}>
                              <Box sx={{ color: 'text.secondary' }}>
                                {channelIcons[channel]}
                              </Box>
                            </Tooltip>
                          ))}
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={trigger.enabled}
                      onChange={(e) =>
                        onToggleTrigger?.(trigger.id, e.target.checked)
                      }
                    />
                    <IconButton onClick={() => handleEdit(trigger)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => setDeleteConfirm(trigger.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Edit/Create Dialog */}
      <TriggerDialog
        open={dialogOpen}
        trigger={editingTrigger}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Delete Trigger?</DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. The trigger will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default AlertConfigurator;
