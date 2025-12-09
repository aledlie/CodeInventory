/**
 * Phase 4C: Custom Visualization Hooks
 *
 * React Query hooks for visualization builder operations.
 */

import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { visualizationApi } from '../api/visualizationApi';
import type {
  VisualizationConfig,
  SavedVisualization,
  ExportOptions,
} from '../types/visualizations';

/**
 * Hook to fetch all saved visualizations
 */
export function useSavedVisualizations() {
  return useSuspenseQuery<SavedVisualization[]>({
    queryKey: ['visualizations'],
    queryFn: () => visualizationApi.getVisualizations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single visualization by ID
 */
export function useVisualization(id: string | null) {
  return useQuery<VisualizationConfig | null>({
    queryKey: ['visualization', id],
    queryFn: () => (id ? visualizationApi.getVisualization(id) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new visualization
 */
export function useCreateVisualization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => visualizationApi.createVisualization(),
    onSuccess: (newViz) => {
      // Add to visualizations list
      queryClient.setQueryData<SavedVisualization[]>(['visualizations'], (old = []) => [
        ...old,
        {
          id: newViz.id,
          title: newViz.title,
          createdAt: newViz.createdAt,
          updatedAt: newViz.updatedAt,
          isFavorite: false,
        },
      ]);
      // Cache the new visualization
      queryClient.setQueryData(['visualization', newViz.id], newViz);
    },
  });
}

/**
 * Hook to save/update a visualization
 */
export function useSaveVisualization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: VisualizationConfig) => visualizationApi.saveVisualization(config),
    onSuccess: (updatedViz) => {
      // Update cache
      queryClient.setQueryData(['visualization', updatedViz.id], updatedViz);
      // Update list
      queryClient.setQueryData<SavedVisualization[]>(['visualizations'], (old = []) =>
        old.map((v) =>
          v.id === updatedViz.id
            ? { ...v, title: updatedViz.title, updatedAt: updatedViz.updatedAt }
            : v
        )
      );
    },
  });
}

/**
 * Hook to delete a visualization
 */
export function useDeleteVisualization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => visualizationApi.deleteVisualization(id),
    onSuccess: (_, deletedId) => {
      // Remove from list
      queryClient.setQueryData<SavedVisualization[]>(['visualizations'], (old = []) =>
        old.filter((v) => v.id !== deletedId)
      );
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['visualization', deletedId] });
    },
  });
}

/**
 * Hook to duplicate a visualization
 */
export function useDuplicateVisualization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => visualizationApi.duplicateVisualization(id),
    onSuccess: (newViz) => {
      if (newViz) {
        // Add to list
        queryClient.setQueryData<SavedVisualization[]>(['visualizations'], (old = []) => [
          ...old,
          {
            id: newViz.id,
            title: newViz.title,
            createdAt: newViz.createdAt,
            updatedAt: newViz.updatedAt,
            isFavorite: false,
          },
        ]);
        // Cache the new visualization
        queryClient.setQueryData(['visualization', newViz.id], newViz);
      }
    },
  });
}

/**
 * Hook to export a visualization
 */
export function useExportVisualization() {
  return useMutation({
    mutationFn: ({ id, options }: { id: string; options: ExportOptions }) =>
      visualizationApi.exportVisualization(id, options),
  });
}

/**
 * Hook to get available metrics
 */
export function useAvailableMetrics() {
  return visualizationApi.getAvailableMetrics();
}

/**
 * Hook to get available chart types
 */
export function useAvailableChartTypes() {
  return visualizationApi.getAvailableChartTypes();
}
