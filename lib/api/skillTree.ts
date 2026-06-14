import { supabase } from '@/lib/supabase';
import {
  ExerciseProgressionSchema,
  UserSkillProgressSchema,
  WorkoutLogSchema,
} from './schemas';
import type { ExerciseProgression, UserSkillProgress } from './schemas';
import { deriveSkillProgressRows } from '@/lib/skills/derive';
import type { ProgressionNode } from '@/lib/skills/types';

function toNode(p: ExerciseProgression): ProgressionNode {
  return {
    exercise_id: p.exercise_id,
    path: p.path,
    level: p.level,
    unlock_reps: p.unlock_reps,
    unlock_hold_seconds: p.unlock_hold_seconds,
    prerequisite_exercise_id: p.prerequisite_exercise_id,
  };
}

export const skillTreeApi = {
  /** Public content: the whole progression graph. */
  listProgressions: async (): Promise<ExerciseProgression[]> => {
    const { data, error } = await supabase
      .from('exercise_progressions')
      .select('*');
    if (error) throw error;
    return ExerciseProgressionSchema.array().parse(data ?? []);
  },

  /** Persisted per-user node states. */
  listSkillProgress: async (userId: string): Promise<UserSkillProgress[]> => {
    const { data, error } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return UserSkillProgressSchema.array().parse(data ?? []);
  },

  /**
   * Recompute every node's status + best from the user's logs and persist it.
   * mastered_at is preserved when a node was already mastered, set to now when
   * newly mastered, and cleared otherwise.
   */
  syncSkillProgress: async (userId: string): Promise<UserSkillProgress[]> => {
    const [
      { data: progData, error: progErr },
      { data: logData, error: logErr },
      { data: existingData, error: existErr },
    ] = await Promise.all([
      supabase.from('exercise_progressions').select('*'),
      supabase.from('workout_logs').select('*').eq('user_id', userId),
      supabase.from('user_skill_progress').select('*').eq('user_id', userId),
    ]);
    if (progErr) throw progErr;
    if (logErr) throw logErr;
    if (existErr) throw existErr;

    const progressions = ExerciseProgressionSchema.array().parse(progData ?? []);
    const logs = WorkoutLogSchema.array().parse(logData ?? []);
    const existing = UserSkillProgressSchema.array().parse(existingData ?? []);
    const masteredAtById = new Map(
      existing.map((e) => [e.exercise_id, e.mastered_at] as const),
    );

    const now = new Date().toISOString();
    const rows = deriveSkillProgressRows(progressions.map(toNode), logs).map(
      (r) => ({
        user_id: userId,
        exercise_id: r.exercise_id,
        status: r.status,
        best_reps: r.best_reps,
        best_hold_seconds: r.best_hold_seconds,
        mastered_at:
          r.status === 'mastered'
            ? masteredAtById.get(r.exercise_id) ?? now
            : null,
      }),
    );

    if (rows.length === 0) return [];

    const { data, error } = await supabase
      .from('user_skill_progress')
      .upsert(rows, { onConflict: 'user_id,exercise_id' })
      .select();
    if (error) throw error;
    return UserSkillProgressSchema.array().parse(data ?? []);
  },
};
