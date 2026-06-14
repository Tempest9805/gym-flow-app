import { supabase } from '@/lib/supabase'

export type PresetRoutine = {
  id: string
  name_en: string
  name_es: string
  description_en: string | null
  description_es: string | null
  training_type: 'calisthenics' | 'gym' | 'home'
  level: 'beginner' | 'intermediate'
  days_per_week: number
  goal?: string
  tags?: string[]
  goal_rank?: number
  goal_reason?: string
  exercises: PresetExercise[]
}

export type PresetExercise = {
  id: string
  exercise_slug: string
  day_label: string
  order_index: number
  sets: number
  reps: number | null
  duration_seconds: number | null
  exercise_type: 'reps' | 'time' | 'cardio'
  rest_seconds: number
}

export async function getPresetRoutines(): Promise<PresetRoutine[]> {
  const { data, error } = await supabase
    .from('preset_routines')
    .select(`
      *,
      exercises:preset_routine_exercises(*)
    `)
    .order('training_type')
    .order('level')
  if (error) throw error
  return data ?? []
}

export async function importPresetRoutine(
  userId: string,
  preset: PresetRoutine,
  language: string
): Promise<string> {
  // 1. Obtener exercise_ids desde slugs
  const slugs = [...new Set(preset.exercises.map(e => e.exercise_slug))]
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('id, slug')
    .in('slug', slugs)
  if (exError) throw exError

  const slugToId = Object.fromEntries(
    (exercises ?? []).map(e => [e.slug, e.id])
  )

  // 2. Crear la rutina
  const name = language === 'es' ? preset.name_es : preset.name_en
  const { data: routine, error: rError } = await supabase
    .from('routines')
    .insert({ user_id: userId, name })
    .select('id')
    .single()
  if (rError) throw rError

  // 3. Agrupar ejercicios por day_label (A, B, C)
  const dayMap: Record<string, number> = { A: 1, B: 3, C: 5 }
  // A=Lunes, B=Miércoles, C=Viernes por defecto

  // 4. Insertar routine_exercises
  const rows = preset.exercises
    .filter(e => slugToId[e.exercise_slug])
    .map(e => ({
      routine_id: routine.id,
      exercise_id: slugToId[e.exercise_slug],
      day_of_week: dayMap[e.day_label] ?? 1,
      order_index: e.order_index,
      sets: e.sets,
      reps: e.reps,
      duration_seconds: e.duration_seconds,
      exercise_type: e.exercise_type,
      rest_seconds: e.rest_seconds,
      weight: null,
      notes: null,
    }))

  const { error: insertError } = await supabase
    .from('routine_exercises')
    .insert(rows)
  if (insertError) throw insertError

  // 5. Update schedules for the assigned days (overwrite existing, keep it simple for presets)
  // Let's actually assign the days automatically based on the imported exercises.
  const assignedDays = [...new Set(rows.map(r => r.day_of_week))]
  
  for (const day of assignedDays) {
    // Upsert into workout_schedules
    await supabase
      .from('workout_schedules')
      .delete()
      .eq('user_id', userId)
      .eq('day_of_week', day)
      
    await supabase
      .from('workout_schedules')
      .insert({
        user_id: userId,
        routine_id: routine.id,
        day_of_week: day,
        is_active: true,
      })
  }

  return routine.id
}
