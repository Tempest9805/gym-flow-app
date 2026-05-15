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
