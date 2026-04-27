import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sharesApi } from '../api/shares';
import { useCurrentProfile } from './useProfiles';

export function useCreateShare() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async ({ routineId, type }: { routineId: string; type: 'code' | 'qr' }) => {
      if (!profile) throw new Error('Not authenticated');
      return sharesApi.create(routineId, profile.id, type);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routine_shares', variables.routineId] });
    },
  });
}

export function useImportRoutine() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!profile) throw new Error('Not authenticated');
      return sharesApi.importRoutine(code, profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}
