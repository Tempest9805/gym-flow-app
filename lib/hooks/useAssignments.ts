import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '@/lib/api';
import type { Assignment } from '@/types';

export const useUserAssignments = (userId?: string) => {
  return useQuery({
    queryKey: ['assignments', 'user', userId],
    queryFn: () => (userId ? assignmentsApi.getUserAssignments(userId) : []),
    enabled: !!userId,
  });
};

export const useCompleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.complete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: Omit<Assignment, 'id' | 'created_at' | 'assigned_at' | 'completed_at' | 'assigned_by_profile_id'>) => 
      assignmentsApi.create(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};
