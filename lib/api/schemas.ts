import { z } from 'zod';

// --- Shared Enumerations ---

export const StatusSchema = z.enum(['active', 'inactive', 'pending', 'completed', 'archived', 'revoked']);
export const ExerciseCategorySchema = z.enum(['arms', 'back', 'chest', 'legs', 'core', 'shoulders', 'cardio', 'functional']);
export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const ShareTypeSchema = z.enum(['code', 'qr']);
export const ShareStatusSchema = z.enum(['pending', 'accepted', 'revoked', 'expired']);
export const SkillPathSchema = z.enum(['push', 'pull', 'core', 'legs', 'skill']);
export const NodeStatusSchema = z.enum(['locked', 'available', 'in_progress', 'mastered']);
export const ChallengeTierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export const ChallengeKindSchema = z.enum(['skill', 'volume_reps', 'hold_time', 'reps_in_time']);
export const ChallengeStatusSchema = z.enum(['locked', 'ready', 'attempted', 'achieved']);

export type Status = z.infer<typeof StatusSchema>;

// --- Base Fields ---

const BaseEntityFields = {
  id: z.string().uuid(),
  created_at: z.string(),
};

// --- Schemas ---

export const ProfileSchema = z.object({
  ...BaseEntityFields,
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  goal: z.string().nullable().optional(),
  available_equipment: z.array(z.string()).default([]),
});

export const ExerciseSchema = z.object({
  ...BaseEntityFields,
  slug: z.string().nullable(),
  name_en: z.string(),
  name_es: z.string().nullable(),
  category: z.string(), 
  muscle_group: z.string(),
  equipment: z.string().nullable(),
  difficulty: z.string().nullable(),
  type: z.string().nullable(),
  is_compound: z.boolean().nullable(),
  movement_pattern: z.string().nullable(),
  description: z.string().nullable(),
  instructions: z.string().nullable(),
  demonstration_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  hires_url: z.string().nullable(),
  media_storage_path: z.string().nullable(),
  media_status: z.string().nullable(),
  notes: z.string().nullable(),
});

export const RoutineSchema = z.object({
  ...BaseEntityFields,
  name: z.string(),
  user_id: z.string().uuid(),
  description: z.string().nullable().optional(),
  status: StatusSchema.default('active'),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
});

export const RoutineExerciseSchema = z.object({
  id: z.string().uuid(),
  routine_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6).nullable(),
  order_index: z.number().int(),
  sets: z.number().int().min(1).default(3),
  reps: z.number().int().min(1).nullable().default(10),
  weight: z.number().nullable().default(null),
  rest_seconds: z.number().int().nullable().default(60),
  duration_seconds: z.number().int().nullable().default(null),
  exercise_type: z.enum(['reps', 'time', 'cardio']).default('reps'),
  notes: z.string().nullable(),
  created_at: z.string().datetime().optional(),
  exercise: ExerciseSchema.optional(),
});

// Composite schema for Routine with its Exercises (exercises MUST have detail for UI compatibility)
export const RoutineWithExercisesSchema = RoutineSchema.extend({
  exercises: z.array(
    RoutineExerciseSchema.extend({
      exercise: ExerciseSchema // Not optional here
    })
  ),
});

export const WorkoutScheduleSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  routine_id: z.string().uuid(),
  is_active: z.boolean().optional(),
  created_at: z.string(),
});

export const WorkoutScheduleWithRoutineSchema = WorkoutScheduleSchema.extend({
  routine: RoutineSchema,
});

export const RoutineShareSchema = z.object({
  ...BaseEntityFields,
  routine_id: z.string().uuid(),
  sender_user_id: z.string().uuid(),
  receiver_user_id: z.string().uuid().nullable(),
  share_code: z.string(),
  share_type: ShareTypeSchema,
  status: ShareStatusSchema,
  accepted_at: z.string().nullable(),
});

export const UserStreakSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  current_streak: z.number().int().min(0),
  longest_streak: z.number().int().min(0),
  last_active_week: z.string().nullable(),
  completed_days_this_week: z.array(z.number()).default([]),
  updated_at: z.string().datetime().optional(),
});

export const ExerciseProgressionSchema = z.object({
  ...BaseEntityFields,
  path: SkillPathSchema,
  exercise_id: z.string().uuid(),
  level: z.number().int().min(1),
  tier: DifficultySchema,
  unlock_reps: z.number().int().nullable(),
  unlock_hold_seconds: z.number().int().nullable(),
  prerequisite_exercise_id: z.string().uuid().nullable(),
  equipment: z.string().nullable(),
});

export const WorkoutLogSchema = z.object({
  ...BaseEntityFields,
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  reps: z.number().int().nullable(),
  seconds: z.number().int().nullable(),
  performed_at: z.string(),
});

export const ChallengeSchema = z.object({
  ...BaseEntityFields,
  name_en: z.string(),
  name_es: z.string(),
  challenge_tier: ChallengeTierSchema,
  kind: ChallengeKindSchema,
  exercise_id: z.string().uuid(),
  target_reps: z.number().int().nullable(),
  target_seconds: z.number().int().nullable(),
  time_window_seconds: z.number().int().nullable(),
  equipment: z.string().nullable(),
  readiness_rule: z.record(z.string(), z.any()).nullable(),
  is_premium: z.boolean(),
});

export const UserSkillProgressSchema = z.object({
  ...BaseEntityFields,
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  status: NodeStatusSchema,
  best_reps: z.number().int().nullable(),
  best_hold_seconds: z.number().int().nullable(),
  mastered_at: z.string().nullable(),
});

export const UserChallengeProgressSchema = z.object({
  ...BaseEntityFields,
  user_id: z.string().uuid(),
  challenge_id: z.string().uuid(),
  status: ChallengeStatusSchema,
  readiness: z.number().min(0).max(100),
  achieved_at: z.string().nullable(),
});

// --- Inferred Types ---

export type Profile = z.infer<typeof ProfileSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Routine = z.infer<typeof RoutineSchema>;
export type RoutineExercise = z.infer<typeof RoutineExerciseSchema>;
export type RoutineWithExercises = z.infer<typeof RoutineWithExercisesSchema>;
export type WorkoutSchedule = z.infer<typeof WorkoutScheduleSchema>;
export type WorkoutScheduleWithRoutine = z.infer<typeof WorkoutScheduleWithRoutineSchema>;
export type RoutineShare = z.infer<typeof RoutineShareSchema>;
export type UserStreak = z.infer<typeof UserStreakSchema>;
export type SkillPath = z.infer<typeof SkillPathSchema>;
export type NodeStatus = z.infer<typeof NodeStatusSchema>;
export type ExerciseProgression = z.infer<typeof ExerciseProgressionSchema>;
export type WorkoutLog = z.infer<typeof WorkoutLogSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type UserSkillProgress = z.infer<typeof UserSkillProgressSchema>;
export type UserChallengeProgress = z.infer<typeof UserChallengeProgressSchema>;
