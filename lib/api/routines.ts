import { supabase } from '@/lib/supabase';
import type { Routine, RoutineWithExercises, Profile, RoutineExercise } from '@/types';

export const routinesApi = {
  /** List routines with ABAC context (Gym vs Independent) */
  list: async (profile: Profile): Promise<Routine[]> => {
    let query = supabase.from('routines').select('*').order('created_at', { ascending: false });

    if (profile.gym_id) {
      // Gym Mode: Only routines within the same gym
      query = query.eq('gym_id', profile.gym_id);
    } else {
      // Independent Mode: Only routines created by the user
      query = query.eq('created_by_profile_id', profile.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** Get full routine with all exercises and exercise details */
  getById: async (id: string): Promise<RoutineWithExercises | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        exercises:routine_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // ABAC Check
    if (data.gym_id && data.gym_id !== profile?.gym_id) {
       // Not in the same gym, check if it's the creator
       if (data.created_by_profile_id !== user.id) {
         throw new Error('Unauthorized: You do not have access to this routine.');
       }
    } else if (!data.gym_id && data.created_by_profile_id !== user.id) {
       // Independent routine and not the creator
       throw new Error('Unauthorized: You do not have access to this routine.');
    }
    
    return data as RoutineWithExercises;
  },

  /** Create a new routine with role validation */
  create: async (
    profile: Profile,
    routine: Omit<Routine, 'id' | 'created_at' | 'created_by_profile_id' | 'gym_id'>,
    exercises: Omit<RoutineExercise, 'id' | 'routine_id'>[]
  ): Promise<RoutineWithExercises> => {
    // 1. Authentication & Role validation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profile.id) {
      throw new Error('Unauthorized: Identity mismatch.');
    }

    if (profile.role === 'user') {
      throw new Error('Unauthorized: Athletes cannot create routines.');
    }

    // 2. Build routine data with context
    const routineData = {
      ...routine,
      created_by_profile_id: profile.id,
      gym_id: profile.gym_id || null,
      status: 'active' as const,
    };

    // 3. Create routine
    const { data: newRoutine, error: routineError } = await supabase
      .from('routines')
      .insert(routineData)
      .select()
      .single();

    if (routineError) throw routineError;

    // 4. Add exercises
    const exercisesToInsert = exercises.map((e, index) => ({
      ...e,
      routine_id: newRoutine.id,
      order_index: index,
    }));

    const { error: exercisesError } = await supabase
      .from('routine_exercises')
      .insert(exercisesToInsert);

    if (exercisesError) throw exercisesError;

    return routinesApi.getById(newRoutine.id) as Promise<RoutineWithExercises>;
  },
};
