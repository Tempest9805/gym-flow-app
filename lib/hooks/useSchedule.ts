import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '@/lib/api';
import type { DayOfWeek } from '@/types';

export const useWeekSchedule = (userId?: string) => {
  return useQuery({
    queryKey: ['schedule', userId],
    queryFn: () => (userId ? scheduleApi.getWeekSchedule(userId) : []),
    enabled: !!userId,
  });
};

export const useToggleScheduleDay = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dayOfWeek,
      routineId,
      gymId,
    }: {
      dayOfWeek: DayOfWeek;
      routineId: string;
      gymId: string | null;
    }) => (userId ? scheduleApi.toggleDay(userId, dayOfWeek, routineId, gymId) : Promise.reject()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
    },
  });
};

export const useClearScheduleDay = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dayOfWeek: DayOfWeek) =>
      userId ? scheduleApi.clearDay(userId, dayOfWeek) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
    },
  });
};
