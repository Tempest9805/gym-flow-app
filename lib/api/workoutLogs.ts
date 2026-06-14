import { supabase } from '@/lib/supabase';
import { WorkoutLogSchema } from './schemas';
import type { WorkoutLog } from './schemas';

export interface LogSetInput {
  exercise_id: string;
  reps: number | null;
  seconds: number | null;
}

export const workoutLogsApi = {
  /** Persist one performed set (reps OR hold seconds). */
  log: async (userId: string, entry: LogSetInput): Promise<WorkoutLog> => {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: userId, ...entry })
      .select()
      .single();
    if (error) throw error;
    return WorkoutLogSchema.parse(data);
  },

  /** All logs for a user, newest first. */
  listForUser: async (userId: string): Promise<WorkoutLog[]> => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false });
    if (error) throw error;
    return WorkoutLogSchema.array().parse(data ?? []);
  },
};
