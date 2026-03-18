/**
 * useOptimisticMutation
 * React Query mutation hook with built-in optimistic UI updates
 * Provides onMutate/onError patterns for instant feedback
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Create a mutation with optimistic updates
 * 
 * @param {Object} config
 * @param {Function} config.mutationFn - Async function to execute
 * @param {string} config.queryKey - Query key to update optimistically
 * @param {Function} config.onMutate - Called before mutation with variables
 * @param {Function} config.onSuccess - Called on success
 * @param {Function} config.onError - Called on error
 * @param {Function} config.optimisticUpdate - Updates cache before mutation
 * 
 * @returns {Object} Mutation object with optimistic support
 */
export function useOptimisticMutation({
  mutationFn,
  queryKey,
  onMutate,
  onSuccess,
  onError,
  optimisticUpdate
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      if (optimisticUpdate && previousData) {
        const updatedData = optimisticUpdate(previousData, variables);
        queryClient.setQueryData(queryKey, updatedData);
      }

      // Call user's onMutate if provided
      if (onMutate) {
        onMutate(variables);
      }

      return { previousData };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate to refetch if needed
      queryClient.invalidateQueries({ queryKey });
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      if (onError) {
        onError(error, variables);
      }
    }
  });
}

/**
 * Common optimistic update patterns
 */
export const OptimisticPatterns = {
  /**
   * Add item to list
   */
  addItem: (item) => (previousData) => {
    if (Array.isArray(previousData)) {
      return [item, ...previousData];
    }
    return previousData;
  },

  /**
   * Update item in list
   */
  updateItem: (itemId, updates) => (previousData) => {
    if (Array.isArray(previousData)) {
      return previousData.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
    }
    return previousData;
  },

  /**
   * Remove item from list
   */
  removeItem: (itemId) => (previousData) => {
    if (Array.isArray(previousData)) {
      return previousData.filter((item) => item.id !== itemId);
    }
    return previousData;
  },

  /**
   * Update single object
   */
  updateObject: (updates) => (previousData) => {
    if (previousData && typeof previousData === "object") {
      return { ...previousData, ...updates };
    }
    return previousData;
  }
};