import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '@/lib/api';

export const useChallenges = () => {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.listChallenges(),
  });
};

export const useChallengeProgress = (userId?: string) => {
  return useQuery({
    queryKey: ['challengeProgress', userId],
    queryFn: () => (userId ? challengesApi.listChallengeProgress(userId) : []),
    enabled: !!userId,
  });
};

export const useMarkChallengeStatus = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, status }: { challengeId: string; status: 'attempted' | 'achieved' }) => {
      if (!userId) throw new Error('No user');
      return challengesApi.markChallengeStatus(userId, challengeId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', userId] });
    },
  });
};
