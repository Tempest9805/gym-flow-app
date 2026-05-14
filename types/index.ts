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
  /** URL-friendly unique identifier */
  slug: string | null;
  /** English display name (canonical) */
  name_en: string;
  /** Spanish display name */
  name_es: string | null;
  /** Body region: arms | back | chest | legs | core | shoulders | cardio | functional */
  category: string;
  /** Target muscle(s), e.g. "biceps", "glutes/hamstrings" */
  muscle_group: string;
  /** Equipment required, e.g. "barbell", "bodyweight" */
  equipment: string | null;
  /** beginner | intermediate | advanced */
  difficulty: string | null;
  /** gym | calisthenics | cardio | functional */
  type: string | null;
  /** True when exercise recruits multiple major muscle groups */
  is_compound: boolean | null;
  /** Movement taxonomy, e.g. "hip_hinge", "vertical_pull" */
  movement_pattern: string | null;
  /** Short summary / overview */
  description: string | null;
  /** Step-by-step execution guide */
  instructions: string | null;
  /** GIF / video / normalized image URL for live demo */
  demonstration_url: string | null;
  /** Lightweight WebP thumbnail for list views */
  thumbnail_url: string | null;
  /** High-resolution WebP for zoom views */
  hires_url: string | null;
  /** Internal storage path */
  media_storage_path: string | null;
  /** Status of media upload */
  media_status: string | null;
  /** Coach or trainer notes */
  notes: string | null;
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
