/**
 * Core application types.
 * Re-exporting from lib/api/schemas to ensure single source of truth and Zod validation.
 */

import * as Schemas from '../lib/api/schemas';

export type Status = Schemas.Status;
export type Profile = Schemas.Profile;
export type Exercise = Schemas.Exercise;
export type Routine = Schemas.Routine;
export type RoutineExercise = Schemas.RoutineExercise;
export type RoutineWithExercises = Schemas.RoutineWithExercises;
export type WorkoutSchedule = Schemas.WorkoutSchedule;
export type WorkoutScheduleWithRoutine = Schemas.WorkoutScheduleWithRoutine;
export type RoutineShare = Schemas.RoutineShare;
export type { ThemeTokens } from '@/lib/store/themeStore';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Exporting some legacy types if needed, but preferred to use Schemas
export interface BaseEntity {
  id: string;
  created_at: string;
}

export type ExerciseEntry = {
  id: string                          // UUID temporal o real
  exercise_id: string
  exercise_name_en: string
  exercise_name_es: string
  exercise_type: 'reps' | 'time' | 'cardio'
  day_of_week: number
  order_index: number
  sets: number
  reps: number | null                 // null si es tipo 'time'
  duration_seconds: number | null     // null si es tipo 'reps'
  weight: number | null               // SIEMPRE opcional
  rest_seconds: number
  notes: string | null
}

export type BuilderState = {
  routineId: string | null            // null = nueva rutina
  name: string
  exercises: ExerciseEntry[]
  activeDay: number                   // día de la semana activo
}
