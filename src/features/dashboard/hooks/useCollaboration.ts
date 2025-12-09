/**
 * Collaboration Hooks
 *
 * Phase 4D: Team Collaboration Hub
 * React Query hooks for collaboration data
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborationApi } from '../api/collaborationApi';
import type { IssueStatus } from '../types';

/**
 * Query keys for collaboration data
 */
export const collaborationKeys = {
  all: ['collaboration'] as const,
  summary: () => [...collaborationKeys.all, 'summary'] as const,
  activities: () => [...collaborationKeys.all, 'activities'] as const,
  issues: () => [...collaborationKeys.all, 'issues'] as const,
  team: () => [...collaborationKeys.all, 'team'] as const,
  goals: () => [...collaborationKeys.all, 'goals'] as const,
  comments: (issueId: string) => [...collaborationKeys.all, 'comments', issueId] as const,
};

/**
 * Fetch collaboration summary
 */
export function useCollaborationSummary() {
  return useSuspenseQuery({
    queryKey: collaborationKeys.summary(),
    queryFn: collaborationApi.fetchCollaborationSummary,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch activity feed
 */
export function useActivities() {
  return useSuspenseQuery({
    queryKey: collaborationKeys.activities(),
    queryFn: collaborationApi.fetchActivities,
    staleTime: 15 * 1000, // 15 seconds - more frequent updates
  });
}

/**
 * Fetch issues
 */
export function useIssues() {
  return useSuspenseQuery({
    queryKey: collaborationKeys.issues(),
    queryFn: collaborationApi.fetchIssues,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch team members
 */
export function useTeamMembers() {
  return useSuspenseQuery({
    queryKey: collaborationKeys.team(),
    queryFn: collaborationApi.fetchTeamMembers,
    staleTime: 60 * 1000, // 1 minute - less frequent changes
  });
}

/**
 * Fetch sprint goals
 */
export function useSprintGoals() {
  return useSuspenseQuery({
    queryKey: collaborationKeys.goals(),
    queryFn: collaborationApi.fetchSprintGoals,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch comments for an issue
 */
export function useComments(issueId: string) {
  return useSuspenseQuery({
    queryKey: collaborationKeys.comments(issueId),
    queryFn: () => collaborationApi.fetchComments(issueId),
    staleTime: 15 * 1000,
  });
}

/**
 * Assign issue mutation
 */
export function useAssignIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, userId }: { issueId: string; userId: string }) =>
      collaborationApi.assignIssue(issueId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.issues() });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.activities() });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.team() });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.summary() });
    },
  });
}

/**
 * Update issue status mutation
 */
export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: IssueStatus }) =>
      collaborationApi.updateIssueStatus(issueId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.issues() });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.activities() });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.summary() });
    },
  });
}

/**
 * Add comment mutation
 */
export function useAddComment(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string }) =>
      collaborationApi.addComment(issueId, text, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.comments(issueId) });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.activities() });
    },
  });
}

/**
 * Mark activity as read mutation
 */
export function useMarkActivityAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) =>
      collaborationApi.markActivityAsRead(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.activities() });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.summary() });
    },
  });
}

/**
 * Combined hook for collaboration hub data
 */
export function useCollaborationHub() {
  const { data: summary } = useCollaborationSummary();
  const { data: activities } = useActivities();
  const { data: issues } = useIssues();
  const { data: teamMembers } = useTeamMembers();
  const { data: goals } = useSprintGoals();

  const assignIssue = useAssignIssue();
  const updateIssueStatus = useUpdateIssueStatus();
  const markActivityAsRead = useMarkActivityAsRead();

  return {
    summary,
    activities,
    issues,
    teamMembers,
    goals,
    assignIssue: assignIssue.mutate,
    updateIssueStatus: updateIssueStatus.mutate,
    markActivityAsRead: markActivityAsRead.mutate,
    isAssigning: assignIssue.isPending,
    isUpdatingStatus: updateIssueStatus.isPending,
  };
}
