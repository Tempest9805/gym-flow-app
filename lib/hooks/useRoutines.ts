import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesApi } from '@/lib/api';
import type { Routine, Profile, RoutineExercise, RoutineWithExercises } from '@/types';

export const useRoutines = (profile?: Profile) => {
  return useQuery({
    queryKey: ['routines', profile?.id],
    queryFn: () => (profile ? routinesApi.list(profile) : []),
    enabled: !!profile,
  });
};

export const useRoutine = (id?: string) => {
  return useQuery({
    queryKey: ['routine', id],
    queryFn: () => (id ? routinesApi.getById(id) : null),
    enabled: !!id,
  });
};

export const useCreateRoutine = (profile?: Profile) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      routine, 
      exercises 
    }: { 
      routine: Omit<Routine, 'id' | 'created_at' | 'user_id'>; 
      exercises: Omit<RoutineExercise, 'id' | 'routine_id'>[];
    }) =>
      profile ? routinesApi.create(profile, routine, exercises) : Promise.reject('No profile'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
};
