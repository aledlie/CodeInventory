/**
 * Phase 4D: Team Collaboration Types
 *
 * Type definitions for activity feeds, issue assignments,
 * comments, reactions, and sprint goals.
 */

/**
 * User role in the team
 */
export type UserRole = 'developer' | 'lead' | 'manager' | 'qa' | 'admin';

/**
 * Activity type
 */
export type ActivityType = 'comment' | 'assignment' | 'resolution' | 'goal' | 'mention' | 'status_change';

/**
 * Issue status
 */
export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'blocked' | 'wont_fix';

/**
 * Goal status
 */
export type GoalStatus = 'active' | 'completed' | 'missed' | 'cancelled';

/**
 * User profile
 */
export interface User {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** Avatar URL */
  avatar?: string;
  /** User role */
  role: UserRole;
  /** Initials for avatar fallback */
  initials?: string;
}

/**
 * Emoji reaction
 */
export interface Reaction {
  /** Emoji character or code */
  emoji: string;
  /** Number of users who reacted */
  count: number;
  /** IDs of users who reacted */
  users: string[];
  /** Whether current user has reacted */
  hasReacted?: boolean;
}

/**
 * Target of an activity
 */
export interface ActivityTarget {
  /** Target type */
  type: 'issue' | 'file' | 'goal' | 'comment';
  /** Target ID */
  id: string;
  /** Target title/name */
  title: string;
  /** URL to view target */
  url: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  /** Unique identifier */
  id: string;
  /** Activity type */
  type: ActivityType;
  /** User who performed the action */
  actor: User;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Target of the activity */
  target: ActivityTarget;
  /** Human-readable message */
  message: string;
  /** Reactions on this activity */
  reactions: Reaction[];
  /** Whether activity is read */
  isRead?: boolean;
  /** Related users (e.g., assigned to, mentioned) */
  relatedUsers?: User[];
}

/**
 * Issue for assignment
 */
export interface Issue {
  /** Unique identifier */
  id: string;
  /** Issue title */
  title: string;
  /** Detailed description */
  description: string;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Issue category */
  category: string;
  /** Current status */
  status: IssueStatus;
  /** File path where issue was found */
  filePath: string;
  /** Line number in file */
  lineNumber?: number;
  /** Code snippet */
  snippet?: string;
  /** Assigned user (if any) */
  assignee?: User;
  /** User who created/reported the issue */
  reporter?: User;
  /** ISO 8601 timestamp when created */
  createdAt: string;
  /** ISO 8601 timestamp when last updated */
  updatedAt: string;
  /** Due date (if set) */
  dueDate?: string;
  /** Labels/tags */
  labels: string[];
  /** Number of comments */
  commentCount: number;
  /** Priority score (computed) */
  priority?: number;
}

/**
 * Issue assignment record
 */
export interface IssueAssignment {
  /** Issue ID */
  issueId: string;
  /** Assigned user ID */
  userId: string;
  /** ISO 8601 timestamp when assigned */
  assignedAt: string;
  /** User who made the assignment */
  assignedBy: string;
  /** Due date (if set) */
  dueDate?: string;
  /** Current status */
  status: IssueStatus;
  /** Notes from assigner */
  notes?: string;
}

/**
 * Comment on an issue
 */
export interface Comment {
  /** Unique identifier */
  id: string;
  /** Issue ID this comment belongs to */
  issueId: string;
  /** Author of the comment */
  author: User;
  /** Comment text (supports Markdown) */
  text: string;
  /** ISO 8601 timestamp when created */
  createdAt: string;
  /** ISO 8601 timestamp when last edited */
  updatedAt?: string;
  /** Parent comment ID (for nested replies) */
  parentId?: string;
  /** Reactions on this comment */
  reactions: Reaction[];
  /** Mentioned user IDs */
  mentions: string[];
  /** Whether comment is edited */
  isEdited?: boolean;
  /** Whether comment is deleted (soft delete) */
  isDeleted?: boolean;
}

/**
 * Metric target for goals
 */
export interface MetricTarget {
  /** Metric name */
  metric: string;
  /** Current value */
  current: number;
  /** Target value */
  target: number;
  /** Unit of measurement */
  unit: string;
  /** Starting value when goal was set */
  baseline?: number;
}

/**
 * Sprint or team goal
 */
export interface SprintGoal {
  /** Unique identifier */
  id: string;
  /** Goal title */
  title: string;
  /** Detailed description */
  description: string;
  /** Metric target */
  target: MetricTarget;
  /** ISO 8601 start date */
  startDate: string;
  /** ISO 8601 end date */
  endDate: string;
  /** User who created the goal */
  createdBy: User;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current status */
  status: GoalStatus;
  /** Team members involved */
  participants?: User[];
  /** Related milestones */
  milestones?: GoalMilestone[];
  /** Comments/updates on the goal */
  updates?: GoalUpdate[];
}

/**
 * Milestone within a goal
 */
export interface GoalMilestone {
  /** Unique identifier */
  id: string;
  /** Milestone title */
  title: string;
  /** Target value */
  targetValue: number;
  /** ISO 8601 target date */
  targetDate: string;
  /** Whether milestone is achieved */
  isAchieved: boolean;
  /** Actual date achieved (if achieved) */
  achievedAt?: string;
}

/**
 * Update/comment on a goal
 */
export interface GoalUpdate {
  /** Unique identifier */
  id: string;
  /** Update author */
  author: User;
  /** Update text */
  text: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Progress at time of update */
  progressAtUpdate: number;
}

/**
 * Team member card data
 */
export interface TeamMemberCard {
  /** User profile */
  user: User;
  /** Number of assigned issues */
  assignedCount: number;
  /** Number of issues in progress */
  inProgressCount: number;
  /** Number of resolved issues (this sprint) */
  resolvedCount: number;
  /** Average resolution time (hours) */
  avgResolutionTime?: number;
  /** Current workload status */
  workloadStatus: 'light' | 'moderate' | 'heavy' | 'overloaded';
}

/**
 * Activity feed filters
 */
export interface ActivityFilters {
  /** Filter by activity types */
  types?: ActivityType[];
  /** Filter by user IDs */
  userIds?: string[];
  /** Filter by date range start */
  startDate?: string;
  /** Filter by date range end */
  endDate?: string;
  /** Show only unread */
  unreadOnly?: boolean;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Collaboration hub summary
 */
export interface CollaborationSummary {
  /** Total team members */
  totalMembers: number;
  /** Total open issues */
  openIssues: number;
  /** Issues assigned this sprint */
  assignedThisSprint: number;
  /** Issues resolved this sprint */
  resolvedThisSprint: number;
  /** Active goals */
  activeGoals: number;
  /** Recent activity count (last 24h) */
  recentActivityCount: number;
  /** Top contributors (by resolved issues) */
  topContributors: User[];
}
