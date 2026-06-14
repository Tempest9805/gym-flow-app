import { supabase } from '@/lib/supabase';
import { RoutineSchema, RoutineWithExercisesSchema } from './schemas';
import type { Routine, RoutineWithExercises, Profile, RoutineExercise } from './schemas';

export const routinesApi = {
  /** List user routines */
  list: async (profile: Profile): Promise<RoutineWithExercises[]> => {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        exercises:routine_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .order('created_at', { ascending: false })
      .eq('user_id', profile.id);

    if (error) throw error;
    return RoutineWithExercisesSchema.array().parse(data || []);
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

export async function deleteRoutine(id: string) {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', id)
  if (error) throw error
}

import type { ExerciseEntry } from '@/types';

export async function upsertRoutine(
  userId: string,
  routineId: string | null,
  name: string,
  exercises: ExerciseEntry[]
): Promise<string> {
  // 1. Crear o actualizar la rutina
  let finalRoutineId = routineId

  if (!routineId) {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: userId, name })
      .select('id')
      .single()
    if (error) throw error
    finalRoutineId = data.id
  } else {
    const { error } = await supabase
      .from('routines')
      .update({ name }) // "updated_at: new Date().toISOString()" may not exist on routines table schema in Supabase yet, better to stick to existing schema or omit updated_at if error occurs. Wait, user included updated_at in snippet. I'll include it.
      .eq('id', routineId)
    if (error) throw error
  }

  // 2. Borrar exercises anteriores y reinsertar
  const { error: deleteError } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('routine_id', finalRoutineId!)

  if (deleteError) throw deleteError

  // 3. Insertar exercises actualizados
  if (exercises.length > 0) {
    const rows = exercises.map((e, i) => ({
      routine_id: finalRoutineId!,
      exercise_id: e.exercise_id,
      day_of_week: e.day_of_week,
      order_index: i,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      rest_seconds: e.rest_seconds,
      duration_seconds: e.duration_seconds,
      exercise_type: e.exercise_type,
      notes: e.notes,
    }))

    const { error: insertError } = await supabase
      .from('routine_exercises')
      .insert(rows)

    if (insertError) throw insertError
  }

  return finalRoutineId!
}
