import { meetsThreshold, computeStatuses } from '@/lib/skills/unlock';
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

describe('meetsThreshold', () => {
  it('is false when no thresholds are defined', () => {
    expect(meetsThreshold({ reps: 100, seconds: 100 }, node({}))).toBe(false);
  });

  it('checks rep thresholds', () => {
    const n = node({ unlock_reps: 10 });
    expect(meetsThreshold({ reps: 9, seconds: null }, n)).toBe(false);
    expect(meetsThreshold({ reps: 10, seconds: null }, n)).toBe(true);
  });

  it('checks hold thresholds', () => {
    const n = node({ unlock_hold_seconds: 20 });
    expect(meetsThreshold({ reps: null, seconds: 19 }, n)).toBe(false);
    expect(meetsThreshold({ reps: null, seconds: 20 }, n)).toBe(true);
  });
});

describe('computeStatuses', () => {
  it('masters a node whose best meets the threshold', () => {
    const nodes = [node({ exercise_id: 'pushup', unlock_reps: 10, level: 1 })];
    const statuses = computeStatuses(nodes, { pushup: { reps: 12, seconds: null } });
    expect(statuses.pushup).toBe('mastered');
  });

  it('makes the first node of a path available by default', () => {
    const nodes = [node({ exercise_id: 'pushup', unlock_reps: 10, level: 1 })];
    const statuses = computeStatuses(nodes, {});
    expect(statuses.pushup).toBe('available');
  });

  it('locks a higher level until the previous level is mastered', () => {
    const nodes = [
      node({ exercise_id: 'pushup', unlock_reps: 10, level: 1 }),
      node({ exercise_id: 'diamond', unlock_reps: 10, level: 2 }),
    ];
    const locked = computeStatuses(nodes, {});
    expect(locked.pushup).toBe('available');
    expect(locked.diamond).toBe('locked');

    const unlocked = computeStatuses(nodes, { pushup: { reps: 10, seconds: null } });
    expect(unlocked.pushup).toBe('mastered');
    expect(unlocked.diamond).toBe('available');
  });

  it('respects a cross-path prerequisite', () => {
    const nodes = [
      node({ exercise_id: 'pullup', path: 'pull', unlock_reps: 8, level: 3 }),
      node({
        exercise_id: 'muscleup',
        path: 'pull',
        unlock_reps: 1,
        level: 4,
        prerequisite_exercise_id: 'pullup',
      }),
    ];
    const locked = computeStatuses(nodes, {});
    expect(locked.muscleup).toBe('locked');

    const ready = computeStatuses(nodes, { pullup: { reps: 8, seconds: null } });
    expect(ready.muscleup).toBe('available');
  });
});
