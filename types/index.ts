/**
 * Core application types.
 * Domain types will be added as features are implemented.
 */

/** Supported user roles in the system */
export type UserRole = 'user' | 'trainer' | 'coach';

/** Context mode for authorization */
export type ContextType = 'gym' | 'independent';

/** Generic status enum */
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'archived' | 'revoked';

/** Base database interface */
export interface BaseEntity {
  id: string;
  created_at: string;
}

export interface Gym extends BaseEntity {
  name: string;
  owner_profile_id: string;
  metadata?: Record<string, any>;
}

export interface Profile extends BaseEntity {
  email: string;
  full_name: string | null;
  role: UserRole;
  gym_id: string | null;
  avatar_url: string | null;
  status: Status;
}

export interface Exercise extends BaseEntity {
  name: string;
  category: string;
  muscle_group: string;
  difficulty: string;
  demonstration_url: string | null;
  description: string | null;
}

export interface Routine extends BaseEntity {
  name: string;
  created_by_profile_id: string;
  gym_id: string | null;
  metadata?: Record<string, any>;
  status: Status;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  order_index: number;
  notes: string | null;
}

/** Composite type for Routine with its Exercises */
export interface RoutineWithExercises extends Routine {
  exercises: (RoutineExercise & { exercise: Exercise })[];
}

export interface CoachingRelation extends BaseEntity {
  coach_profile_id: string;
  user_profile_id: string;
  status: Status;
  context_type: ContextType;
  gym_id: string | null;
}

export interface Assignment extends BaseEntity {
  user_profile_id: string;
  routine_id: string;
  assigned_by_profile_id: string;
  gym_id: string | null;
  coaching_relation_id: string | null;
  context_type: ContextType;
  status: Status;
  assigned_at: string;
  completed_at: string | null;
}

/** Composite type for Assignment with details */
export interface AssignmentWithDetails extends Assignment {
  routine: RoutineWithExercises;
  assigned_by: Profile;
}

/** Day of week (0 = Sunday, 6 = Saturday) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Lightweight schedule entry linking a day to a routine */
export interface WorkoutSchedule {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  routine_id: string;
  gym_id: string | null;
  created_at: string;
}

/** Schedule with routine details for display */
export interface WorkoutScheduleWithRoutine extends WorkoutSchedule {
  routine: Routine;
}
