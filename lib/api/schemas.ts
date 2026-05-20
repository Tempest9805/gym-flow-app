import { z } from 'zod';

// --- Shared Enumerations ---

export const StatusSchema = z.enum(['active', 'inactive', 'pending', 'completed', 'archived', 'revoked']);
export const ExerciseCategorySchema = z.enum(['arms', 'back', 'chest', 'legs', 'core', 'shoulders', 'cardio', 'functional']);
export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const ShareTypeSchema = z.enum(['code', 'qr']);
export const ShareStatusSchema = z.enum(['pending', 'accepted', 'revoked', 'expired']);

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
  order_index: z.number().int().nullable(),
  sets: z.number().int().nullable(),
  reps: z.number().int().nullable(),
  weight: z.number().nullable(),
  rest_seconds: z.number().int().nullable(),
  duration_seconds: z.number().int().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().optional(),
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

// --- Inferred Types ---

export type Profile = z.infer<typeof ProfileSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Routine = z.infer<typeof RoutineSchema>;
export type RoutineExercise = z.infer<typeof RoutineExerciseSchema>;
export type RoutineWithExercises = z.infer<typeof RoutineWithExercisesSchema>;
export type WorkoutSchedule = z.infer<typeof WorkoutScheduleSchema>;
export type WorkoutScheduleWithRoutine = z.infer<typeof WorkoutScheduleWithRoutineSchema>;
export type RoutineShare = z.infer<typeof RoutineShareSchema>;
