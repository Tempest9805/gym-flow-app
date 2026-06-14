import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutLogsApi, skillTreeApi, challengesApi } from '@/lib/api';
import type { LogSetInput } from '@/lib/api/workoutLogs';

export const useWorkoutLogs = (userId?: string) => {
  return useQuery({
    queryKey: ['workoutLogs', userId],
    queryFn: () => (userId ? workoutLogsApi.listForUser(userId) : []),
    enabled: !!userId,
  });
};

/**
 * Logs a set, then recomputes skill + challenge progress, then invalidates the
 * affected queries so the tree and challenge readiness refresh.
 */
export const useLogSet = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: LogSetInput) => {
      if (!userId) throw new Error('No user');
      await workoutLogsApi.log(userId, entry);
      await skillTreeApi.syncSkillProgress(userId);
      await challengesApi.syncChallengeProgress(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs', userId] });
      queryClient.invalidateQueries({ queryKey: ['skillProgress', userId] });
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', userId] });
    },
  });
};
