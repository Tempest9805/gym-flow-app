/**
 * Core application types.
 * Domain types will be added as features are implemented.
 */

/** Generic status enum */
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'archived' | 'revoked';

/** Base database interface */
export interface BaseEntity {
  id: string;
  created_at: string;
}


export interface Profile extends BaseEntity {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Exercise extends BaseEntity {
  slug: string | null;
  name: string;
  name_en: string | null;
  name_es: string | null;
  category: string;
  muscle_group: string;
  equipment: string | null;
  difficulty: string | null;
  type: string | null;
  is_compound: boolean | null;
  movement_pattern: string | null;
  demonstration_url: string | null;
  description: string | null;
  notes: string | null;
  media_url: string | null;
  media_type: string | null;
  media_source: string | null;
  media_storage_path: string | null;
  media_status: string | null;
}

export interface Routine extends BaseEntity {
  name: string;
  user_id: string;
  description?: string;
  metadata?: Record<string, any>;
  status: Status;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  day_of_week: number | null;
  order_index: number | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  rest_seconds: number | null;
  duration_seconds: number | null;
  notes: string | null;
  exercise?: Exercise;
}

/** Composite type for Routine with its Exercises */
export interface RoutineWithExercises extends Routine {
  exercises: (RoutineExercise & { exercise: Exercise })[];
}



/** Day of week (0 = Sunday, 6 = Saturday) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Lightweight schedule entry linking a day to a routine */
export interface WorkoutSchedule {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  routine_id: string;
  is_active?: boolean;
  created_at: string;
}

/** Schedule with routine details for display */
export interface WorkoutScheduleWithRoutine extends WorkoutSchedule {
  routine: Routine;
}

export interface RoutineShare extends BaseEntity {
  routine_id: string;
  sender_user_id: string;
  receiver_user_id: string | null;
  share_code: string;
  share_type: 'code' | 'qr';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  accepted_at: string | null;
}
