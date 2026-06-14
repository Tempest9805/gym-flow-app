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
