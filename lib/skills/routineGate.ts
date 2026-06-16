import type { NodeStatus } from './types';
import type { ExerciseProgression, UserSkillProgress } from '@/lib/api/schemas';
import type { Branch } from './treeView';

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

/** Status map for ONLY the routine exercises that are tree nodes; missing progress defaults to 'locked'. */
export function buildRoutineStatuses(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
  routineExerciseIds: string[],
): Record<string, NodeStatus> {
  const nodeIds = new Set(progressions.map((p) => p.exercise_id));
  const statusById = new Map(skillProgress.map((s) => [s.exercise_id, s.status]));
  const out: Record<string, NodeStatus> = {};
  for (const id of routineExerciseIds) {
    if (nodeIds.has(id)) out[id] = statusById.get(id) ?? 'locked';
  }
  return out;
}

/** Required level per branch = max progression level among the routine's node exercises. */
export function requiredLevelsForRoutine(
  progressions: ExerciseProgression[],
  routineExerciseIds: string[],
): Partial<Record<Branch, number>> {
  const ids = new Set(routineExerciseIds);
  const out: Partial<Record<Branch, number>> = {};
  for (const p of progressions) {
    if (ids.has(p.exercise_id)) {
      const branch = p.path as Branch;
      out[branch] = Math.max(out[branch] ?? 0, p.level);
    }
  }
  return out;
}

export interface RoutineGateEvaluation {
  locked: boolean;
  lockedExerciseIds: string[];
  requiredLevels: Partial<Record<Branch, number>>;
}

/** One-pass gate evaluation: locked detection + required levels. */
export function evaluateRoutineGate(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
  routineExerciseIds: string[],
): RoutineGateEvaluation {
  const statuses = buildRoutineStatuses(progressions, skillProgress, routineExerciseIds);
  const { locked, lockedExerciseIds } = routineGateStatus(routineExerciseIds, statuses);
  const requiredLevels = requiredLevelsForRoutine(progressions, routineExerciseIds);
  return { locked, lockedExerciseIds, requiredLevels };
}
