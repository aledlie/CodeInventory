/**
 * CollaborationHub Component
 *
 * Main page for team collaboration features:
 * - Activity feed
 * - Issue assignments
 * - Team workload
 * - Sprint goals
 */

import { useState, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid2 as Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  AvatarGroup,
  Chip,
  Skeleton,
  Alert,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
import {
  Group as TeamIcon,
  Assignment as IssueIcon,
  Flag as GoalIcon,
  TrendingUp as ProgressIcon,
} from '@mui/icons-material';
import { ActivityFeed } from './ActivityFeed';
import { IssueAssignments } from './IssueAssignments';
import type {
  ActivityItem,
  Issue,
  TeamMemberCard,
  SprintGoal,
  CollaborationSummary,
  User,
} from '../../types';

/**
 * Props for CollaborationHub
 */
export interface CollaborationHubProps {
  /** Activity feed items */
  activities?: ActivityItem[];
  /** Issues for assignment */
  issues?: Issue[];
  /** Team member cards */
  teamMembers?: TeamMemberCard[];
  /** Sprint goals */
  goals?: SprintGoal[];
  /** Collaboration summary */
  summary?: CollaborationSummary;
  /** Current user */
  currentUser?: User;
  /** Whether loading */
  isLoading?: boolean;
  /** Callback handlers */
  onAssignIssue?: (issueId: string, userId: string) => void;
  onChangeIssueStatus?: (issueId: string, status: string) => void;
  onActivityClick?: (activity: ActivityItem) => void;
  onIssueClick?: (issue: Issue) => void;
}

/**
 * Summary stat card
 */
function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={700} color={`${color}.main`}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Goal progress card
 */
function GoalCard({ goal }: { goal: SprintGoal }) {
  const isOnTrack = goal.progress >= 50 || goal.status === 'completed';
  const daysLeft = Math.ceil(
    (new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <GoalIcon color={goal.status === 'completed' ? 'success' : 'primary'} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {goal.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
            </Typography>
          </Box>
          <Chip
            label={goal.status}
            size="small"
            color={
              goal.status === 'completed'
                ? 'success'
                : goal.status === 'active'
                ? 'primary'
                : 'default'
            }
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">
              {goal.target.current.toFixed(0)}{goal.target.unit} / {goal.target.target}{goal.target.unit}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {goal.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={goal.progress}
            color={isOnTrack ? 'primary' : 'warning'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {goal.participants && goal.participants.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Participants:
            </Typography>
            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
              {goal.participants.map((user) => (
                <Avatar key={user.id} src={user.avatar}>
                  {user.initials}
                </Avatar>
              ))}
            </AvatarGroup>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
function CollaborationSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton variant="text" width={200} height={48} sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 6, md: 3 }}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="rounded" height={400} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="rounded" height={400} />
        </Grid>
      </Grid>
    </Container>
  );
}

/**
 * Tab panel content
 */
type TabValue = 'overview' | 'activity' | 'issues' | 'goals';

/**
 * CollaborationHub content
 */
function CollaborationHubContent({
  activities = [],
  issues = [],
  teamMembers = [],
  goals = [],
  summary,
  currentUser,
  onAssignIssue,
  onChangeIssueStatus,
  onActivityClick,
  onIssueClick,
}: CollaborationHubProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // No summary available
  if (!summary) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          <AlertTitle>Collaboration Hub</AlertTitle>
          Team collaboration features require setup. Configure team members and enable real-time
          updates to use this feature.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Collaboration Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Coordinate with your team on code quality improvements.
        </Typography>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Team Members"
            value={summary.totalMembers}
            icon={<TeamIcon />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Open Issues"
            value={summary.openIssues}
            subtitle={`${summary.assignedThisSprint} assigned this sprint`}
            icon={<IssueIcon />}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Resolved"
            value={summary.resolvedThisSprint}
            subtitle="This sprint"
            icon={<ProgressIcon />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Active Goals"
            value={summary.activeGoals}
            icon={<GoalIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" value="overview" />
          <Tab
            label={`Activity (${summary.recentActivityCount})`}
            value="activity"
          />
          <Tab label={`Issues (${summary.openIssues})`} value="issues" />
          <Tab label={`Goals (${summary.activeGoals})`} value="goals" />
        </Tabs>
      </Paper>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ActivityFeed
              activities={activities.slice(0, 10)}
              onActivityClick={onActivityClick}
              showFilters={false}
              maxHeight={400}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <IssueAssignments
              issues={issues.slice(0, 5)}
              teamMembers={teamMembers}
              currentUser={currentUser}
              onAssign={onAssignIssue}
              onStatusChange={onChangeIssueStatus}
              onIssueClick={onIssueClick}
            />
          </Grid>
          {goals.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Active Goals
              </Typography>
              <Grid container spacing={2}>
                {goals.filter((g) => g.status === 'active').slice(0, 3).map((goal) => (
                  <Grid key={goal.id} size={{ xs: 12, md: 4 }}>
                    <GoalCard goal={goal} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 'activity' && (
        <ActivityFeed
          activities={activities}
          onActivityClick={onActivityClick}
          maxHeight={600}
        />
      )}

      {activeTab === 'issues' && (
        <IssueAssignments
          issues={issues}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onAssign={onAssignIssue}
          onStatusChange={onChangeIssueStatus}
          onIssueClick={onIssueClick}
        />
      )}

      {activeTab === 'goals' && (
        <Grid container spacing={2}>
          {goals.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No goals defined. Create a sprint goal to track team progress.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            goals.map((goal) => (
              <Grid key={goal.id} size={{ xs: 12, md: 4 }}>
                <GoalCard goal={goal} />
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Container>
  );
}

/**
 * CollaborationHub with Suspense
 */
export function CollaborationHub(props: CollaborationHubProps) {
  if (props.isLoading) {
    return <CollaborationSkeleton />;
  }

  return (
    <Suspense fallback={<CollaborationSkeleton />}>
      <CollaborationHubContent {...props} />
    </Suspense>
  );
}

export default CollaborationHub;
