import { supabase } from '@/lib/supabase';
import type { WorkoutSchedule, WorkoutScheduleWithRoutine, DayOfWeek } from '@/types';

export const scheduleApi = {
  /** Get the user's weekly schedule with routine names */
  getWeekSchedule: async (userId: string): Promise<WorkoutScheduleWithRoutine[]> => {
    const { data, error } = await supabase
      .from('workout_schedules')
      .select(`
        *,
        routine:routines(id, name, status, created_at, created_by_profile_id, gym_id)
      `)
      .eq('user_id', userId)
      .order('day_of_week');

    if (error) throw error;
    return (data || []) as unknown as WorkoutScheduleWithRoutine[];
  },

  /** Toggle a day on/off in the schedule */
  toggleDay: async (
    userId: string,
    dayOfWeek: DayOfWeek,
    routineId: string,
    gymId: string | null
  ): Promise<void> => {
    // Check if an entry already exists for this day
    const { data: existing } = await supabase
      .from('workout_schedules')
      .select('id')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (existing) {
      // Remove (toggle off)
      const { error } = await supabase
        .from('workout_schedules')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Add (toggle on)
      const { error } = await supabase
        .from('workout_schedules')
        .insert({
          user_id: userId,
          day_of_week: dayOfWeek,
          routine_id: routineId,
          gym_id: gymId,
        });
      if (error) throw error;
    }
  },

  /** Set a specific routine for a specific day */
  setDayRoutine: async (
    userId: string,
    dayOfWeek: DayOfWeek,
    routineId: string,
    gymId: string | null
  ): Promise<void> => {
    // Upsert: delete existing then insert
    await supabase
      .from('workout_schedules')
      .delete()
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek);

    const { error } = await supabase
      .from('workout_schedules')
      .insert({
        user_id: userId,
        day_of_week: dayOfWeek,
        routine_id: routineId,
        gym_id: gymId,
      });
    if (error) throw error;
  },

  /** Clear a specific day */
  clearDay: async (userId: string, dayOfWeek: DayOfWeek): Promise<void> => {
    const { error } = await supabase
      .from('workout_schedules')
      .delete()
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek);
    if (error) throw error;
  },
};
