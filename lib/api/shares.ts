import { supabase } from '@/lib/supabase';
import { RoutineShareSchema, RoutineWithExercisesSchema } from './schemas';
import type { RoutineShare, RoutineWithExercises, Profile } from './schemas';
import { routinesApi } from './routines';

// Generate a random 6 character alphanumeric code
function generateShareCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const sharesApi = {
  /** Create a share for a routine */
  create: async (routineId: string, senderId: string, shareType: 'code' | 'qr'): Promise<RoutineShare> => {
    // Check if there is already a pending share for this routine
    const { data: existing } = await supabase
      .from('routine_shares')
      .select('*')
      .eq('routine_id', routineId)
      .eq('sender_user_id', senderId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return RoutineShareSchema.parse(existing);
    }

    const shareData = {
      routine_id: routineId,
      sender_user_id: senderId,
      share_code: generateShareCode(),
      share_type: shareType,
      status: 'pending' as const,
    };

    const { data, error } = await supabase
      .from('routine_shares')
      .insert(shareData)
      .select()
      .single();

    if (error) throw error;
    return RoutineShareSchema.parse(data);
  },

  /** Get a share by code along with the routine */
  getByCode: async (code: string): Promise<{ share: RoutineShare, routine: RoutineWithExercises }> => {
    const { data: shareData, error: shareError } = await supabase
      .from('routine_shares')
      .select('*')
      .eq('share_code', code.toUpperCase())
      .eq('status', 'pending')
      .single();

    if (shareError || !shareData) throw new Error('Invalid or expired share code');
    const share = RoutineShareSchema.parse(shareData);

    // Fetch the routine via raw query because of RLS logic
    // Note: If strict RLS is applied, this might fail unless the user is the owner 
    // or a specialized sharing RLS is in place.
    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .select(`
        *,
        exercises:routine_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('id', share.routine_id)
      .single();

    if (routineError || !routineData) throw new Error('Could not fetch the shared routine');

    return { 
      share, 
      routine: RoutineWithExercisesSchema.parse(routineData) 
    };
  },

  /** Import a shared routine */
  importRoutine: async (shareCode: string, profile: Profile): Promise<RoutineWithExercises> => {
    const { share, routine } = await sharesApi.getByCode(shareCode);
    
    if (share.sender_user_id === profile.id) {
      throw new Error('You cannot import your own routine');
    }

    // 1. Duplicate the routine
    const newRoutineData = {
      name: `${routine.name} (Imported)`,
      description: routine.description,
      user_id: profile.id,
      status: 'active' as const,
    };

    const { data: newRoutine, error: routineError } = await supabase
      .from('routines')
      .insert(newRoutineData)
      .select()
      .single();

    if (routineError) throw routineError;

    // 2. Duplicate exercises
    const exercisesToInsert = routine.exercises.map((e) => ({
      routine_id: newRoutine.id,
      exercise_id: e.exercise_id,
      day_of_week: e.day_of_week,
      order_index: e.order_index,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      rest_seconds: e.rest_seconds,
      duration_seconds: e.duration_seconds,
      notes: e.notes
    }));

    if (exercisesToInsert.length > 0) {
      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;
    }

    const result = await routinesApi.getById(newRoutine.id);
    if (!result) throw new Error('Failed to retrieve imported routine');
    return result;
  }
};
