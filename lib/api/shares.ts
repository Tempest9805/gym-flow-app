import { supabase } from '@/lib/supabase';
import type { RoutineShare, RoutineWithExercises, Profile } from '@/types';
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
      .single();

    if (existing) {
      return existing as RoutineShare;
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
    return data as RoutineShare;
  },

  /** Get a share by code along with the routine */
  getByCode: async (code: string): Promise<{ share: RoutineShare, routine: RoutineWithExercises }> => {
    const { data: share, error } = await supabase
      .from('routine_shares')
      .select('*')
      .eq('share_code', code.toUpperCase())
      .eq('status', 'pending')
      .single();

    if (error || !share) throw new Error('Invalid or expired share code');

    // Fetch the routine via raw query because of RLS logic
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

    return { share: share as RoutineShare, routine: routineData as RoutineWithExercises };
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

    // 3. Mark the share as accepted (if it's a 1-to-1 share) 
    // We can just keep the share pending so multiple people can import it, 
    // or we can update it if we want single-use codes. 
    // For MVP, letting it be reused is simpler, or we just leave status='pending' 
    // Wait, let's just insert a record of acceptance or leave it. The schema says receiver_user_id.
    // If we want multiple imports, we shouldn't update the share, or we change it to 'accepted'.
    // Let's just leave it 'pending' so it acts like a permanent link, unless the user revokes it.

    return routinesApi.getById(newRoutine.id) as Promise<RoutineWithExercises>;
  }
};
