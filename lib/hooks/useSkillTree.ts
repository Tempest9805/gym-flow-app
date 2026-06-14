import { useQuery } from '@tanstack/react-query';
import { skillTreeApi } from '@/lib/api';

export const useProgressions = () => {
  return useQuery({
    queryKey: ['progressions'],
    queryFn: () => skillTreeApi.listProgressions(),
  });
};

export const useSkillProgress = (userId?: string) => {
  return useQuery({
    queryKey: ['skillProgress', userId],
    queryFn: () => (userId ? skillTreeApi.listSkillProgress(userId) : []),
    enabled: !!userId,
  });
};
