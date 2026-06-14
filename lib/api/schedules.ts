import { supabase } from '@/lib/supabase';

export async function getTodaySchedule(userId: string) {
  const today = new Date().getDay()

  const { data, error } = await supabase
    .from('workout_schedules')
    .select(`
      id,
      day_of_week,
      routine:routines (
        id,
        name,
        description,
        routine_exercises (
          id,
          sets,
          reps,
          weight,
          rest_seconds,
          day_of_week,
          order_index,
          notes,
          exercise:exercises (
            id,
            slug,
            name_en,
            name_es,
            category,
            muscle_group,
            type
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('day_of_week', today)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getWeekSchedule(userId: string) {
  const { data, error } = await supabase
    .from('workout_schedules')
    .select('id, day_of_week, routine:routines(id, name)')
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw error
  return data ?? []
}

export async function getAllRoutines(userId: string) {
  const { data, error } = await supabase
    .from('routines')
    .select(`
      id, name, description, created_at,
      routine_exercises(id, exercise:exercises(id, name_en))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAssignedDays(
  routineId: string,
  userId: string
): Promise<number[]> {
  const { data, error } = await supabase
    .from('workout_schedules')
    .select('day_of_week')
    .eq('routine_id', routineId)
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw error
  return (data ?? []).map(d => d.day_of_week)
}

export async function toggleDayAssignment(
  routineId: string,
  userId: string,
  dayOfWeek: number,
  currentlyAssigned: boolean
): Promise<void> {
  if (currentlyAssigned) {
    const { error } = await supabase
      .from('workout_schedules')
      .delete()
      .eq('routine_id', routineId)
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
    if (error) throw error
  } else {
    // Ensure we delete any existing schedule for this day before inserting
    await supabase
      .from('workout_schedules')
      .delete()
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)

    const { error } = await supabase
      .from('workout_schedules')
      .insert({
        user_id: userId,
        routine_id: routineId,
        day_of_week: dayOfWeek,
        is_active: true,
      })
    if (error) throw error
  }
}
