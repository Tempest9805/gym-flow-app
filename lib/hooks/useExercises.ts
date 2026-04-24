import { useQuery } from '@tanstack/react-query';
import { exercisesApi } from '@/lib/api';

export const useExercises = (muscleGroup?: string) => {
  return useQuery({
    queryKey: ['exercises', { muscleGroup }],
    queryFn: () => exercisesApi.list(muscleGroup),
  });
};

export const useExerciseFilters = () => {
  return useQuery({
    queryKey: ['exercise-filters'],
    queryFn: () => exercisesApi.getFilterOptions(),
    staleTime: Infinity, // These don't change often
  });
};

export const useExercise = (id?: string) => {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: () => (id ? exercisesApi.getById(id) : null),
    enabled: !!id,
  });
};
