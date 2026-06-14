import {
  ExerciseProgressionSchema,
  WorkoutLogSchema,
  ChallengeSchema,
  UserSkillProgressSchema,
  UserChallengeProgressSchema,
  ProfileSchema,
} from '@/lib/api/schemas';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('new entity schemas', () => {
  it('parses a valid exercise progression', () => {
    const parsed = ExerciseProgressionSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      path: 'push',
      exercise_id: UUID,
      level: 1,
      tier: 'beginner',
      unlock_reps: 10,
      unlock_hold_seconds: null,
      prerequisite_exercise_id: null,
      equipment: null,
    });
    expect(parsed.path).toBe('push');
  });

  it('rejects an invalid progression path', () => {
    expect(() =>
      ExerciseProgressionSchema.parse({
        id: UUID,
        created_at: '2026-06-13T00:00:00Z',
        path: 'cardio',
        exercise_id: UUID,
        level: 1,
        tier: 'beginner',
        unlock_reps: null,
        unlock_hold_seconds: null,
        prerequisite_exercise_id: null,
        equipment: null,
      }),
    ).toThrow();
  });

  it('parses a valid workout log', () => {
    const parsed = WorkoutLogSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      user_id: UUID,
      exercise_id: UUID,
      reps: 12,
      seconds: null,
      performed_at: '2026-06-13T00:00:00Z',
    });
    expect(parsed.reps).toBe(12);
  });

  it('parses a valid challenge', () => {
    const parsed = ChallengeSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      name_en: '100 Push-Ups',
      name_es: '100 Flexiones',
      challenge_tier: 4,
      kind: 'volume_reps',
      exercise_id: UUID,
      target_reps: 100,
      target_seconds: null,
      time_window_seconds: null,
      equipment: null,
      readiness_rule: null,
      is_premium: false,
    });
    expect(parsed.challenge_tier).toBe(4);
  });

  it('parses skill and challenge progress', () => {
    expect(
      UserSkillProgressSchema.parse({
        id: UUID,
        created_at: '2026-06-13T00:00:00Z',
        user_id: UUID,
        exercise_id: UUID,
        status: 'available',
        best_reps: 5,
        best_hold_seconds: null,
        mastered_at: null,
      }).status,
    ).toBe('available');

    expect(
      UserChallengeProgressSchema.parse({
        id: UUID,
        created_at: '2026-06-13T00:00:00Z',
        user_id: UUID,
        challenge_id: UUID,
        status: 'ready',
        readiness: 78,
        achieved_at: null,
      }).readiness,
    ).toBe(78);
  });

  it('defaults available_equipment to an empty array', () => {
    const parsed = ProfileSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      email: 'a@b.com',
      full_name: null,
      avatar_url: null,
    });
    expect(parsed.available_equipment).toEqual([]);
  });
});
