import { supabase } from '@/lib/supabase';
import { RoutineSchema, RoutineWithExercisesSchema } from './schemas';
import type { Routine, RoutineWithExercises, Profile, RoutineExercise } from './schemas';

export const routinesApi = {
  /** List user routines */
  list: async (profile: Profile): Promise<Routine[]> => {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: false })
      .eq('user_id', profile.id);

    if (error) throw error;
    return RoutineSchema.array().parse(data || []);
  },

  /** Get full routine with all exercises and exercise details */
  getById: async (id: string): Promise<RoutineWithExercises | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

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

    const parsed = RoutineWithExercisesSchema.parse(data);

    if (parsed.user_id !== user.id) {
      throw new Error('Unauthorized: You do not have access to this routine.');
    }
    
    return parsed;
  },

  /** Create a new routine */
  create: async (
    profile: Profile,
    routine: Omit<Routine, 'id' | 'created_at' | 'user_id' | 'status'>,
    exercises: Omit<RoutineExercise, 'id' | 'routine_id'>[]
  ): Promise<RoutineWithExercises> => {
    // 1. Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profile.id) {
      throw new Error('Unauthorized: Identity mismatch.');
    }

    // 2. Build routine data
    const routineData = {
      ...routine,
      user_id: profile.id,
      status: 'active' as const,
    };

    // 3. Create routine
    const { data: newRoutine, error: routineError } = await supabase
      .from('routines')
      .insert(routineData)
      .select()
      .single();

    if (routineError) throw routineError;
    const parsedRoutine = RoutineSchema.parse(newRoutine);

    // 4. Add exercises
    const exercisesToInsert = exercises.map((e, index) => ({
      ...e,
      routine_id: parsedRoutine.id,
      order_index: index,
    }));

    const { error: exercisesError } = await supabase
      .from('routine_exercises')
      .insert(exercisesToInsert);

    if (exercisesError) throw exercisesError;

    const fullRoutine = await routinesApi.getById(parsedRoutine.id);
    if (!fullRoutine) throw new Error('Failed to retrieve created routine');
    return fullRoutine;
  },
};
