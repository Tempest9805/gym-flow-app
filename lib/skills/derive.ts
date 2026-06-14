import { computeStatuses } from './unlock';
import type { Best, NodeStatus, ProgressionNode } from './types';

export interface LogInput {
  exercise_id: string;
  reps: number | null;
  seconds: number | null;
}

export interface SkillProgressRow {
  exercise_id: string;
  status: NodeStatus;
  best_reps: number | null;
  best_hold_seconds: number | null;
}

function maxNullable(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

export function bestByExerciseFromLogs(logs: LogInput[]): Record<string, Best> {
  const result: Record<string, Best> = {};
  for (const log of logs) {
    const cur = result[log.exercise_id] ?? { reps: null, seconds: null };
    result[log.exercise_id] = {
      reps: maxNullable(cur.reps, log.reps),
      seconds: maxNullable(cur.seconds, log.seconds),
    };
  }
  return result;
}

export function deriveSkillProgressRows(
  nodes: ProgressionNode[],
  logs: LogInput[],
): SkillProgressRow[] {
  const bests = bestByExerciseFromLogs(logs);
  const statuses = computeStatuses(nodes, bests);

  return nodes.map((n) => {
    const base = statuses[n.exercise_id];
    const best = bests[n.exercise_id] ?? { reps: null, seconds: null };
    // in_progress = an available node that has at least one measurable log.
    const hasMeasurableLog = best.reps != null || best.seconds != null;
    const status: NodeStatus =
      base === 'available' && hasMeasurableLog ? 'in_progress' : base;
    return {
      exercise_id: n.exercise_id,
      status,
      best_reps: best.reps,
      best_hold_seconds: best.seconds,
    };
  });
}
