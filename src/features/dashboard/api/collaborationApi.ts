/**
 * Collaboration API Service
 *
 * Phase 4D: Team Collaboration Hub
 * Handles team activities, issues, comments, and goals
 */

import type {
  ActivityItem,
  Issue,
  Comment,
  TeamMemberCard,
  SprintGoal,
  CollaborationSummary,
  IssueStatus,
  User,
} from '../types';
import { logger } from '../helpers/logger';

const API_BASE = '/data/collaboration';

/**
 * Create a full User object from partial data
 */
function createUser(partial: { id: string; name: string; initials?: string; email?: string; role?: User['role'] }): User {
  return {
    id: partial.id,
    name: partial.name,
    email: partial.email || `${partial.id}@example.com`,
    role: partial.role || 'developer',
    initials: partial.initials || partial.name.split(' ').map(n => n[0]).join(''),
  };
}

/**
 * Fetch collaboration summary
 */
export async function fetchCollaborationSummary(): Promise<CollaborationSummary> {
  try {
    const response = await fetch(`${API_BASE}/summary.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch collaboration summary: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return mock data for development
    return {
      totalMembers: 8,
      openIssues: 24,
      assignedThisSprint: 18,
      resolvedThisSprint: 12,
      activeGoals: 3,
      recentActivityCount: 47,
      topContributors: [
        createUser({ id: 'user-3', name: 'Carol Davis', initials: 'CD' }),
        createUser({ id: 'user-1', name: 'Alice Chen', initials: 'AC' }),
      ],
    };
  }
}

/**
 * Fetch activity feed
 */
export async function fetchActivities(): Promise<ActivityItem[]> {
  try {
    const response = await fetch(`${API_BASE}/activities.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return mock data for development
    return generateMockActivities();
  }
}

/**
 * Fetch issues
 */
export async function fetchIssues(): Promise<Issue[]> {
  try {
    const response = await fetch(`${API_BASE}/issues.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch issues: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return mock data for development
    return generateMockIssues();
  }
}

/**
 * Fetch team members
 */
export async function fetchTeamMembers(): Promise<TeamMemberCard[]> {
  try {
    const response = await fetch(`${API_BASE}/team.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return mock data for development
    return generateMockTeamMembers();
  }
}

/**
 * Fetch sprint goals
 */
export async function fetchSprintGoals(): Promise<SprintGoal[]> {
  try {
    const response = await fetch(`${API_BASE}/goals.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sprint goals: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return mock data for development
    return generateMockGoals();
  }
}

/**
 * Fetch comments for an issue
 */
export async function fetchComments(issueId: string): Promise<Comment[]> {
  try {
    const response = await fetch(`${API_BASE}/comments/${issueId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }
    return response.json();
  } catch {
    // Return mock data for development
    return generateMockComments(issueId);
  }
}

/**
 * Assign issue to user
 */
export async function assignIssue(
  issueId: string,
  userId: string
): Promise<Issue> {
  // In production, this would be a POST request
  logger.info('collaborationApi', `Assigning issue ${issueId} to user ${userId}`);
  // Return mock updated issue
  const issues = await fetchIssues();
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) throw new Error('Issue not found');
  return { ...issue, status: 'assigned' as IssueStatus };
}

/**
 * Update issue status
 */
export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus
): Promise<Issue> {
  // In production, this would be a PATCH request
  logger.info('collaborationApi', `Updating issue ${issueId} status to ${status}`);
  const issues = await fetchIssues();
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) throw new Error('Issue not found');
  return { ...issue, status };
}

/**
 * Add comment
 */
export async function addComment(
  issueId: string,
  text: string,
  parentId?: string
): Promise<Comment> {
  // In production, this would be a POST request
  logger.info('collaborationApi', `Adding comment to issue ${issueId}`, { text, parentId });
  return {
    id: `comment-${Date.now()}`,
    issueId,
    parentId,
    author: createUser({ id: 'current-user', name: 'Current User', initials: 'CU' }),
    text,
    createdAt: new Date().toISOString(),
    reactions: [],
    mentions: [],
    isEdited: false,
    isDeleted: false,
  };
}

/**
 * Mark activity as read
 */
export async function markActivityAsRead(activityId: string): Promise<void> {
  // In production, this would be a PATCH request
  logger.info('collaborationApi', `Marking activity ${activityId} as read`);
}

// Mock data generators
function generateMockActivities(): ActivityItem[] {
  const now = new Date();
  return [
    {
      id: 'act-1',
      type: 'assignment',
      actor: createUser({ id: 'user-1', name: 'Alice Chen', initials: 'AC' }),
      message: 'assigned issue #142 to Bob',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      target: { id: 'issue-142', title: 'Fix memory leak in parser', type: 'issue', url: '/dashboard/collaboration/issues/142' },
      isRead: false,
      reactions: [],
    },
    {
      id: 'act-2',
      type: 'comment',
      actor: createUser({ id: 'user-2', name: 'Bob Smith', initials: 'BS' }),
      message: 'commented on "Add test coverage for API"',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      target: { id: 'issue-138', title: 'Add test coverage for API', type: 'issue', url: '/dashboard/collaboration/issues/138' },
      isRead: false,
      reactions: [{ emoji: '👍', count: 2, users: ['user-3', 'user-4'], hasReacted: false }],
    },
    {
      id: 'act-3',
      type: 'resolution',
      actor: createUser({ id: 'user-3', name: 'Carol Davis', initials: 'CD' }),
      message: 'resolved issue #135',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      target: { id: 'issue-135', title: 'Update dependencies', type: 'issue', url: '/dashboard/collaboration/issues/135' },
      isRead: true,
      reactions: [{ emoji: '🎉', count: 3, users: ['user-1', 'user-2', 'user-4'], hasReacted: true }],
    },
    {
      id: 'act-4',
      type: 'mention',
      actor: createUser({ id: 'user-1', name: 'Alice Chen', initials: 'AC' }),
      message: 'mentioned you in a comment',
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      target: { id: 'issue-140', title: 'Refactor authentication module', type: 'issue', url: '/dashboard/collaboration/issues/140' },
      isRead: false,
      reactions: [],
    },
    {
      id: 'act-5',
      type: 'goal',
      actor: createUser({ id: 'user-4', name: 'Dave Wilson', initials: 'DW' }),
      message: 'updated sprint goal progress to 75%',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      target: { id: 'goal-1', title: 'Improve test coverage to 80%', type: 'goal', url: '/dashboard/collaboration/goals/1' },
      isRead: true,
      reactions: [],
    },
  ];
}

function generateMockIssues(): Issue[] {
  const now = new Date();
  return [
    {
      id: 'issue-142',
      title: 'Fix memory leak in parser',
      description: 'Memory usage increases over time when parsing large files',
      severity: 'critical',
      category: 'performance',
      status: 'assigned',
      filePath: 'src/analyzers/parser.py',
      lineNumber: 156,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      assignee: createUser({ id: 'user-2', name: 'Bob Smith', initials: 'BS' }),
      labels: ['bug', 'performance'],
      commentCount: 3,
    },
    {
      id: 'issue-141',
      title: 'Add input validation for API endpoints',
      description: 'Missing validation on several API endpoints',
      severity: 'high',
      category: 'security',
      status: 'in_progress',
      filePath: 'src/api/routes.ts',
      lineNumber: 45,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      assignee: createUser({ id: 'user-3', name: 'Carol Davis', initials: 'CD' }),
      labels: ['security', 'api'],
      commentCount: 5,
    },
    {
      id: 'issue-140',
      title: 'Refactor authentication module',
      description: 'Complex authentication logic needs cleanup',
      severity: 'medium',
      category: 'maintenance',
      status: 'open',
      filePath: 'src/auth/handler.ts',
      lineNumber: 23,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      labels: ['refactor', 'tech-debt'],
      commentCount: 2,
    },
    {
      id: 'issue-139',
      title: 'Update deprecated API calls',
      description: 'Several API calls use deprecated methods',
      severity: 'low',
      category: 'maintenance',
      status: 'open',
      filePath: 'src/services/external.ts',
      lineNumber: 89,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      labels: ['deprecation'],
      commentCount: 0,
    },
  ];
}

function generateMockTeamMembers(): TeamMemberCard[] {
  return [
    {
      user: createUser({ id: 'user-1', name: 'Alice Chen', initials: 'AC', role: 'lead' }),
      assignedCount: 3,
      inProgressCount: 1,
      resolvedCount: 8,
      workloadStatus: 'moderate',
    },
    {
      user: createUser({ id: 'user-2', name: 'Bob Smith', initials: 'BS' }),
      assignedCount: 5,
      inProgressCount: 2,
      resolvedCount: 5,
      workloadStatus: 'heavy',
    },
    {
      user: createUser({ id: 'user-3', name: 'Carol Davis', initials: 'CD' }),
      assignedCount: 2,
      inProgressCount: 1,
      resolvedCount: 12,
      workloadStatus: 'light',
    },
    {
      user: createUser({ id: 'user-4', name: 'Dave Wilson', initials: 'DW' }),
      assignedCount: 4,
      inProgressCount: 3,
      resolvedCount: 6,
      workloadStatus: 'moderate',
    },
  ];
}

function generateMockGoals(): SprintGoal[] {
  const now = new Date();
  const sprintEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sprintStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const admin = createUser({ id: 'admin-1', name: 'Sprint Admin', role: 'manager' });

  return [
    {
      id: 'goal-1',
      title: 'Improve test coverage to 80%',
      description: 'Increase overall test coverage from 65% to 80%',
      status: 'active',
      progress: 75,
      target: { metric: 'test_coverage', current: 78, target: 80, unit: '%' },
      startDate: sprintStart.toISOString(),
      endDate: sprintEnd.toISOString(),
      createdBy: admin,
      participants: [
        createUser({ id: 'user-1', name: 'Alice Chen', initials: 'AC' }),
        createUser({ id: 'user-3', name: 'Carol Davis', initials: 'CD' }),
      ],
    },
    {
      id: 'goal-2',
      title: 'Reduce critical issues to zero',
      description: 'Address all critical severity issues',
      status: 'active',
      progress: 50,
      target: { metric: 'critical_issues', current: 2, target: 0, unit: ' issues' },
      startDate: sprintStart.toISOString(),
      endDate: sprintEnd.toISOString(),
      createdBy: admin,
      participants: [
        createUser({ id: 'user-2', name: 'Bob Smith', initials: 'BS' }),
      ],
    },
    {
      id: 'goal-3',
      title: 'Document all public APIs',
      description: 'Add JSDoc comments to all exported functions',
      status: 'active',
      progress: 30,
      target: { metric: 'documented_functions', current: 15, target: 50, unit: ' functions' },
      startDate: sprintStart.toISOString(),
      endDate: sprintEnd.toISOString(),
      createdBy: admin,
      participants: [
        createUser({ id: 'user-4', name: 'Dave Wilson', initials: 'DW' }),
      ],
    },
  ];
}

function generateMockComments(issueId: string): Comment[] {
  const now = new Date();
  return [
    {
      id: `${issueId}-comment-1`,
      issueId,
      author: createUser({ id: 'user-1', name: 'Alice Chen', initials: 'AC' }),
      text: 'I\'ve identified the root cause. The memory leak occurs when parsing files larger than 10MB.',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      reactions: [{ emoji: '👍', count: 2, users: ['user-2', 'user-3'], hasReacted: false }],
      mentions: [],
      isEdited: false,
      isDeleted: false,
    },
    {
      id: `${issueId}-comment-2`,
      issueId,
      parentId: `${issueId}-comment-1`,
      author: createUser({ id: 'user-2', name: 'Bob Smith', initials: 'BS' }),
      text: 'Thanks for the analysis! I\'ll work on a streaming solution.',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      reactions: [],
      mentions: [],
      isEdited: false,
      isDeleted: false,
    },
    {
      id: `${issueId}-comment-3`,
      issueId,
      author: createUser({ id: 'user-3', name: 'Carol Davis', initials: 'CD' }),
      text: 'We should also add a memory limit configuration option for production deployments.',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      reactions: [{ emoji: '🤔', count: 1, users: ['user-1'], hasReacted: true }],
      mentions: [],
      isEdited: false,
      isDeleted: false,
    },
  ];
}

export const collaborationApi = {
  fetchCollaborationSummary,
  fetchActivities,
  fetchIssues,
  fetchTeamMembers,
  fetchSprintGoals,
  fetchComments,
  assignIssue,
  updateIssueStatus,
  addComment,
  markActivityAsRead,
};
