import {
  bestByExerciseFromLogs,
  deriveSkillProgressRows,
} from '@/lib/skills/derive';
import type { ProgressionNode } from '@/lib/skills/types';

const node = (over: Partial<ProgressionNode>): ProgressionNode => ({
  exercise_id: 'x',
  path: 'push',
  level: 1,
  unlock_reps: null,
  unlock_hold_seconds: null,
  prerequisite_exercise_id: null,
  ...over,
});

describe('bestByExerciseFromLogs', () => {
  it('returns an empty map for no logs', () => {
    expect(bestByExerciseFromLogs([])).toEqual({});
  });

  it('takes the max reps and max seconds per exercise', () => {
    const best = bestByExerciseFromLogs([
      { exercise_id: 'pushup', reps: 8, seconds: null },
      { exercise_id: 'pushup', reps: 12, seconds: null },
      { exercise_id: 'plank', reps: null, seconds: 30 },
      { exercise_id: 'plank', reps: null, seconds: 45 },
    ]);
    expect(best.pushup).toEqual({ reps: 12, seconds: null });
    expect(best.plank).toEqual({ reps: null, seconds: 45 });
  });
});

describe('deriveSkillProgressRows', () => {
  it('marks a node with logs but an unmet threshold as in_progress', () => {
    const nodes = [node({ exercise_id: 'pushup', unlock_reps: 20, level: 1 })];
    const rows = deriveSkillProgressRows(nodes, [
      { exercise_id: 'pushup', reps: 10, seconds: null },
    ]);
    const row = rows.find((r) => r.exercise_id === 'pushup')!;
    expect(row.status).toBe('in_progress');
    expect(row.best_reps).toBe(10);
  });

  it('keeps an available node available when it has no logs', () => {
    const nodes = [node({ exercise_id: 'pushup', unlock_reps: 20, level: 1 })];
    const rows = deriveSkillProgressRows(nodes, []);
    expect(rows[0].status).toBe('available');
    expect(rows[0].best_reps).toBeNull();
  });

  it('masters a node whose best meets the threshold', () => {
    const nodes = [node({ exercise_id: 'pushup', unlock_reps: 20, level: 1 })];
    const rows = deriveSkillProgressRows(nodes, [
      { exercise_id: 'pushup', reps: 25, seconds: null },
    ]);
    expect(rows[0].status).toBe('mastered');
    expect(rows[0].best_reps).toBe(25);
  });

  it('does not mark a node in_progress for an all-null log', () => {
    const nodes = [node({ exercise_id: 'pushup', unlock_reps: 20, level: 1 })];
    const rows = deriveSkillProgressRows(nodes, [
      { exercise_id: 'pushup', reps: null, seconds: null },
    ]);
    expect(rows[0].status).toBe('available');
  });

  it('leaves a locked node locked even if it has logs', () => {
    const nodes = [
      node({ exercise_id: 'pushup', unlock_reps: 20, level: 1 }),
      node({ exercise_id: 'diamond', unlock_reps: 10, level: 2 }),
    ];
    const rows = deriveSkillProgressRows(nodes, [
      { exercise_id: 'diamond', reps: 1, seconds: null },
    ]);
    expect(rows.find((r) => r.exercise_id === 'diamond')!.status).toBe('locked');
  });
});
