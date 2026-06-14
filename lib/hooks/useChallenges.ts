import { useQuery } from '@tanstack/react-query';
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
