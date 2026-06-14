import type { NodeStatus } from './types';

export interface RoutineGateResult {
  locked: boolean;
  lockedExerciseIds: string[];
}

export function routineGateStatus(
  routineExerciseIds: string[],
  statuses: Record<string, NodeStatus>,
): RoutineGateResult {
  const lockedExerciseIds = routineExerciseIds.filter(
    (id) => statuses[id] === 'locked',
  );
  return { locked: lockedExerciseIds.length > 0, lockedExerciseIds };
}
