import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api';
import type { Profile } from '@/types';

export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => (userId ? profilesApi.getById(userId) : null),
    enabled: !!userId,
  });
};

export const useCurrentProfile = () => {
  return useQuery({
    queryKey: ['profile', 'current'],
    queryFn: () => profilesApi.getCurrent(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Profile> }) =>
      profilesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', 'current'], data);
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
    },
  });
};
