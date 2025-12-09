/**
 * IssueAssignments Component
 *
 * Panel for viewing and managing issue assignments:
 * - View assigned issues by team member
 * - Assign/reassign issues
 * - Track workload distribution
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
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Tooltip,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  PersonAdd as AssignIcon,
  MoreVert as MoreIcon,
  Error as CriticalIcon,
  Warning as HighIcon,
  Info as MediumIcon,
  CheckCircle as LowIcon,
  SwapHoriz as ReassignIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { Issue, IssueStatus, TeamMemberCard, User } from '../../types';

/**
 * Props for IssueAssignments
 */
export interface IssueAssignmentsProps {
  /** Issues to display */
  issues: Issue[];
  /** Team members */
  teamMembers: TeamMemberCard[];
  /** Current user */
  currentUser?: User;
  /** Callback when issue is assigned */
  onAssign?: (issueId: string, userId: string) => void;
  /** Callback when issue status changes */
  onStatusChange?: (issueId: string, status: IssueStatus) => void;
  /** Callback when issue is clicked */
  onIssueClick?: (issue: Issue) => void;
  /** Whether loading */
  isLoading?: boolean;
}

/**
 * Severity icons and colors
 */
const severityConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  critical: { icon: <CriticalIcon fontSize="small" />, color: '#dc3545' },
  high: { icon: <HighIcon fontSize="small" />, color: '#ff5722' },
  medium: { icon: <MediumIcon fontSize="small" />, color: '#ff9800' },
  low: { icon: <LowIcon fontSize="small" />, color: '#28a745' },
};

/**
 * Status colors
 */
const statusColors: Record<IssueStatus, string> = {
  open: '#ff9800',
  assigned: '#17a2b8',
  in_progress: '#0066cc',
  resolved: '#28a745',
  blocked: '#dc3545',
  wont_fix: '#6c757d',
};

/**
 * Workload status colors
 */
const workloadColors = {
  light: '#28a745',
  moderate: '#17a2b8',
  heavy: '#ff9800',
  overloaded: '#dc3545',
};

/**
 * Assign dialog component
 */
function AssignDialog({
  open,
  issue,
  teamMembers,
  onClose,
  onAssign,
}: {
  open: boolean;
  issue: Issue | null;
  teamMembers: TeamMemberCard[];
  onClose: () => void;
  onAssign: (userId: string, dueDate?: string) => void;
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleAssign = () => {
    if (selectedUser) {
      onAssign(selectedUser, dueDate || undefined);
      onClose();
      setSelectedUser('');
      setDueDate('');
    }
  };

  if (!issue) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignIcon />
          Assign Issue
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {issue.title}
        </Typography>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Assign to</InputLabel>
          <Select
            value={selectedUser}
            label="Assign to"
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {teamMembers.map((member) => (
              <MenuItem
                key={member.user.id}
                value={member.user.id}
                disabled={member.workloadStatus === 'overloaded'}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Avatar
                    src={member.user.avatar}
                    sx={{ width: 24, height: 24 }}
                  >
                    {member.user.initials}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{member.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {member.assignedCount} assigned
                    </Typography>
                  </Box>
                  <Chip
                    label={member.workloadStatus}
                    size="small"
                    sx={{
                      height: 20,
                      bgcolor: `${workloadColors[member.workloadStatus]}20`,
                      color: workloadColors[member.workloadStatus],
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={!selectedUser}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Team member workload card
 */
function TeamMemberWorkloadCard({ member }: { member: TeamMemberCard }) {
  const total = member.assignedCount + member.inProgressCount + member.resolvedCount;
  const progressValue = total > 0 ? (member.resolvedCount / total) * 100 : 0;

  return (
    <Card variant="outlined" sx={{ minWidth: 180 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar
            src={member.user.avatar}
            sx={{ width: 32, height: 32 }}
          >
            {member.user.initials}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {member.user.name}
            </Typography>
            <Chip
              label={member.workloadStatus}
              size="small"
              sx={{
                height: 16,
                fontSize: 10,
                bgcolor: `${workloadColors[member.workloadStatus]}20`,
                color: workloadColors[member.workloadStatus],
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, fontSize: 12 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Assigned
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {member.assignedCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              In Progress
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {member.inProgressCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Resolved
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {member.resolvedCount}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{ mt: 1, height: 4, borderRadius: 2 }}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Issue list item
 */
function IssueListItem({
  issue,
  onClick,
  onAssign,
  onStatusChange,
}: {
  issue: Issue;
  onClick?: () => void;
  onAssign?: () => void;
  onStatusChange?: (status: IssueStatus) => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const severity = severityConfig[issue.severity];

  return (
    <ListItem
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': { bgcolor: 'action.hover' },
        borderLeft: 3,
        borderColor: severity.color,
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: `${severity.color}20`, color: severity.color }}>
          {severity.icon}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {issue.title}
            </Typography>
            <Chip
              label={issue.status.replace('_', ' ')}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                bgcolor: `${statusColors[issue.status]}20`,
                color: statusColors[issue.status],
              }}
            />
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {issue.filePath}
            </Typography>
            {issue.dueDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: 12 }} />
                <Typography variant="caption">
                  {new Date(issue.dueDate).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {issue.assignee ? (
            <Tooltip title={issue.assignee.name}>
              <Avatar
                src={issue.assignee.avatar}
                sx={{ width: 28, height: 28 }}
              >
                {issue.assignee.initials}
              </Avatar>
            </Tooltip>
          ) : (
            <Tooltip title="Assign">
              <IconButton size="small" onClick={onAssign}>
                <AssignIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => { onAssign?.(); setMenuAnchor(null); }}>
            <ReassignIcon sx={{ mr: 1 }} fontSize="small" />
            {issue.assignee ? 'Reassign' : 'Assign'}
          </MenuItem>
          <Divider />
          {(['in_progress', 'resolved', 'blocked'] as IssueStatus[]).map((status) => (
            <MenuItem
              key={status}
              onClick={() => { onStatusChange?.(status); setMenuAnchor(null); }}
              disabled={issue.status === status}
            >
              Mark as {status.replace('_', ' ')}
            </MenuItem>
          ))}
        </Menu>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

/**
 * IssueAssignments component
 */
export function IssueAssignments({
  issues,
  teamMembers,
  onAssign,
  onStatusChange,
  onIssueClick,
}: IssueAssignmentsProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const handleAssignClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue);
    setAssignDialogOpen(true);
  }, []);

  const handleAssign = useCallback(
    (userId: string) => {
      if (selectedIssue) {
        onAssign?.(selectedIssue.id, userId);
      }
    },
    [selectedIssue, onAssign]
  );

  // Group issues by status
  const unassigned = issues.filter((i) => !i.assignee);
  const assigned = issues.filter((i) => i.assignee && i.status !== 'resolved');

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Issue Assignments</Typography>
        <Typography variant="body2" color="text.secondary">
          {unassigned.length} unassigned · {assigned.length} in progress
        </Typography>
      </Box>

      {/* Team workload overview */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          Team Workload
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          {teamMembers.map((member) => (
            <TeamMemberWorkloadCard key={member.user.id} member={member} />
          ))}
        </Box>
      </Box>

      {/* Issues list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Unassigned section */}
        {unassigned.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 1, bgcolor: 'warning.lighter' }}>
              <Typography variant="subtitle2" color="warning.dark">
                Unassigned ({unassigned.length})
              </Typography>
            </Box>
            <List disablePadding>
              {unassigned.map((issue) => (
                <IssueListItem
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick?.(issue)}
                  onAssign={() => handleAssignClick(issue)}
                  onStatusChange={(status) => onStatusChange?.(issue.id, status)}
                />
              ))}
            </List>
          </>
        )}

        {/* Assigned section */}
        {assigned.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 1, bgcolor: 'info.lighter' }}>
              <Typography variant="subtitle2" color="info.dark">
                In Progress ({assigned.length})
              </Typography>
            </Box>
            <List disablePadding>
              {assigned.map((issue) => (
                <IssueListItem
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick?.(issue)}
                  onAssign={() => handleAssignClick(issue)}
                  onStatusChange={(status) => onStatusChange?.(issue.id, status)}
                />
              ))}
            </List>
          </>
        )}
      </Box>

      {/* Assign dialog */}
      <AssignDialog
        open={assignDialogOpen}
        issue={selectedIssue}
        teamMembers={teamMembers}
        onClose={() => setAssignDialogOpen(false)}
        onAssign={handleAssign}
      />
    </Paper>
  );
}

export default IssueAssignments;
