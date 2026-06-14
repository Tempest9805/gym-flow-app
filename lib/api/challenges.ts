import { supabase } from '@/lib/supabase';
import {
  ChallengeSchema,
  UserChallengeProgressSchema,
  WorkoutLogSchema,
} from './schemas';
import type { Challenge, UserChallengeProgress } from './schemas';
import { deriveChallengeProgressRows } from '@/lib/skills/derive';

export const challengesApi = {
  /** Public content: the full challenge catalog. */
  listChallenges: async (): Promise<Challenge[]> => {
    const { data, error } = await supabase.from('challenges').select('*');
    if (error) throw error;
    return ChallengeSchema.array().parse(data ?? []);
  },

  /** Persisted per-user challenge states. */
  listChallengeProgress: async (
    userId: string,
  ): Promise<UserChallengeProgress[]> => {
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return UserChallengeProgressSchema.array().parse(data ?? []);
  },

  /**
   * Recompute readiness for every challenge from the user's logs and persist it.
   * Preserves user-driven states (attempted / achieved); only flips locked <-> ready
   * and always refreshes the numeric readiness.
   */
  syncChallengeProgress: async (
    userId: string,
  ): Promise<UserChallengeProgress[]> => {
    const [
      { data: chData, error: chErr },
      { data: logData, error: logErr },
      { data: existData, error: existErr },
    ] = await Promise.all([
      supabase.from('challenges').select('*'),
      supabase.from('workout_logs').select('*').eq('user_id', userId),
      supabase.from('user_challenge_progress').select('*').eq('user_id', userId),
    ]);
    if (chErr) throw chErr;
    if (logErr) throw logErr;
    if (existErr) throw existErr;

    const challenges = ChallengeSchema.array().parse(chData ?? []);
    const logs = WorkoutLogSchema.array().parse(logData ?? []);
    const existing = UserChallengeProgressSchema.array().parse(existData ?? []);
    const existingById = new Map(
      existing.map((e) => [e.challenge_id, e] as const),
    );

    const derived = deriveChallengeProgressRows(
      challenges.map((c) => ({
        id: c.id,
        exercise_id: c.exercise_id,
        target_reps: c.target_reps,
        target_seconds: c.target_seconds,
        readiness_rule: c.readiness_rule,
      })),
      logs,
    );

    const rows = derived.map((d) => {
      const prev = existingById.get(d.challenge_id);
      if (prev && (prev.status === 'achieved' || prev.status === 'attempted')) {
        return {
          user_id: userId,
          challenge_id: d.challenge_id,
          status: prev.status,
          readiness: d.readiness,
          achieved_at: prev.achieved_at,
        };
      }
      return {
        user_id: userId,
        challenge_id: d.challenge_id,
        status: d.status,
        readiness: d.readiness,
        achieved_at: null,
      };
    });

    if (rows.length === 0) return [];

    const { data, error } = await supabase
      .from('user_challenge_progress')
      .upsert(rows, { onConflict: 'user_id,challenge_id' })
      .select();
    if (error) throw error;
    return UserChallengeProgressSchema.array().parse(data ?? []);
  },
};
