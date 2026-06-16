import { routineGateStatus } from '@/lib/skills/routineGate';
import type { NodeStatus } from '@/lib/skills/types';

describe('routineGateStatus', () => {
  const statuses: Record<string, NodeStatus> = {
    pushup: 'mastered',
    pullup: 'available',
    planche: 'locked',
  };

  it('is unlocked when all exercises are available or mastered', () => {
    expect(routineGateStatus(['pushup', 'pullup'], statuses)).toEqual({
      locked: false,
      lockedExerciseIds: [],
    });
  });

  it('is locked and lists the gating exercises', () => {
    expect(routineGateStatus(['pushup', 'planche'], statuses)).toEqual({
      locked: true,
      lockedExerciseIds: ['planche'],
    });
  });

  it('treats unknown exercises as ungated', () => {
    expect(routineGateStatus(['stretch'], statuses)).toEqual({
      locked: false,
      lockedExerciseIds: [],
    });
  });
});

import {
  buildRoutineStatuses,
  requiredLevelsForRoutine,
  evaluateRoutineGate,
} from '@/lib/skills/routineGate';
import type { ExerciseProgression, UserSkillProgress } from '@/lib/api/schemas';

const gprog = (exercise_id: string, path: string, level: number): ExerciseProgression =>
  ({
    id: `prog-${exercise_id}`, path, exercise_id, level, tier: 'beginner',
    unlock_reps: null, unlock_hold_seconds: null, prerequisite_exercise_id: null,
    equipment: null, created_at: '2026-06-15T00:00:00.000Z',
  }) as ExerciseProgression;

const gsp = (exercise_id: string, status: UserSkillProgress['status']): UserSkillProgress =>
  ({
    id: `sp-${exercise_id}`, user_id: 'u1', exercise_id, status,
    best_reps: null, best_hold_seconds: null, mastered_at: null,
    created_at: '2026-06-15T00:00:00.000Z',
  }) as UserSkillProgress;

describe('buildRoutineStatuses', () => {
  it('includes only node exercises, defaulting missing progress to locked', () => {
    const progs = [gprog('a', 'push', 1), gprog('b', 'push', 2)];
    const statuses = buildRoutineStatuses(progs, [gsp('a', 'mastered')], ['a', 'b', 'not-a-node']);
    expect(statuses).toEqual({ a: 'mastered', b: 'locked' });
  });
});

describe('requiredLevelsForRoutine', () => {
  it('takes the max level per branch, only present branches', () => {
    const progs = [gprog('a', 'push', 1), gprog('b', 'push', 3), gprog('c', 'core', 2)];
    expect(requiredLevelsForRoutine(progs, ['a', 'b', 'c'])).toEqual({ push: 3, core: 2 });
  });
  it('returns {} when no routine exercise is a node', () => {
    expect(requiredLevelsForRoutine([gprog('a', 'push', 1)], ['x'])).toEqual({});
  });
});

describe('evaluateRoutineGate', () => {
  it('flags locked when a node has no/locked progress', () => {
    const progs = [gprog('a', 'push', 1), gprog('b', 'pull', 2)];
    const res = evaluateRoutineGate(progs, [gsp('a', 'mastered')], ['a', 'b']);
    expect(res.locked).toBe(true);
    expect(res.lockedExerciseIds).toEqual(['b']);
    expect(res.requiredLevels).toEqual({ push: 1, pull: 2 });
  });
  it('is unlocked when all nodes are available/mastered', () => {
    const progs = [gprog('a', 'push', 1)];
    const res = evaluateRoutineGate(progs, [gsp('a', 'available')], ['a']);
    expect(res.locked).toBe(false);
    expect(res.lockedExerciseIds).toEqual([]);
  });
  it('never gates non-node exercises', () => {
    const res = evaluateRoutineGate([], [], ['x', 'y']);
    expect(res.locked).toBe(false);
    expect(res.requiredLevels).toEqual({});
  });
});
