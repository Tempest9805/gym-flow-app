import type { Best, NodeStatus, ProgressionNode } from './types';

const EMPTY_BEST: Best = { reps: null, seconds: null };

export function meetsThreshold(best: Best, node: ProgressionNode): boolean {
  const { unlock_reps, unlock_hold_seconds } = node;
  if (unlock_reps == null && unlock_hold_seconds == null) return false;
  if (unlock_reps != null) {
    if (best.reps == null || best.reps < unlock_reps) return false;
  }
  if (unlock_hold_seconds != null) {
    if (best.seconds == null || best.seconds < unlock_hold_seconds) return false;
  }
  return true;
}

export function computeStatuses(
  nodes: ProgressionNode[],
  bestByExercise: Record<string, Best>,
): Record<string, NodeStatus> {
  const bestFor = (id: string): Best => bestByExercise[id] ?? EMPTY_BEST;

  const mastered = new Set<string>();
  for (const node of nodes) {
    if (meetsThreshold(bestFor(node.exercise_id), node)) {
      mastered.add(node.exercise_id);
    }
  }

  const byPath: Record<string, ProgressionNode[]> = {};
  for (const node of nodes) {
    if (!byPath[node.path]) byPath[node.path] = [];
    byPath[node.path].push(node);
  }

  const previousLevelMastered = (node: ProgressionNode): boolean => {
    const lowerLevels = byPath[node.path]
      .filter((n) => n.level < node.level)
      .sort((a, b) => b.level - a.level);
    const prev = lowerLevels[0];
    if (!prev) return true;
    return mastered.has(prev.exercise_id);
  };

  const result: Record<string, NodeStatus> = {};
  for (const node of nodes) {
    if (mastered.has(node.exercise_id)) {
      result[node.exercise_id] = 'mastered';
      continue;
    }
    const prereqOk =
      node.prerequisite_exercise_id == null ||
      mastered.has(node.prerequisite_exercise_id);
    result[node.exercise_id] =
      prereqOk && previousLevelMastered(node) ? 'available' : 'locked';
  }
  return result;
}
