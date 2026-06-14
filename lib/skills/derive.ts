import { computeStatuses } from './unlock';
import { computeReadiness } from './readiness';
import type { Best, NodeStatus, ProgressionNode, ReadinessRequirement } from './types';

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

export interface ChallengeReadinessInput {
  id: string;
  exercise_id: string;
  target_reps: number | null;
  target_seconds: number | null;
  readiness_rule: Record<string, unknown> | null;
}

export interface ChallengeProgressRow {
  challenge_id: string;
  readiness: number;
  status: 'locked' | 'ready';
}

export function readinessRuleToRequirements(
  rule: Record<string, unknown> | null,
): ReadinessRequirement[] {
  if (!rule || !Array.isArray((rule as { requirements?: unknown }).requirements)) {
    return [];
  }
  const requirements = (rule as { requirements: Array<Record<string, unknown>> })
    .requirements;
  // Drop malformed entries: a requirement without an exercise_id can never be
  // matched against a best, so it would silently inflate readiness to 100%.
  return requirements
    .filter(
      (r): r is Record<string, unknown> =>
        r != null && typeof r === 'object' && (r as Record<string, unknown>).exercise_id != null,
    )
    .map((r) => ({
      exercise_id: String(r.exercise_id),
      target_reps: (r.target_reps as number | undefined) ?? null,
      target_seconds: (r.target_seconds as number | undefined) ?? null,
    }));
}

export function deriveChallengeProgressRows(
  challenges: ChallengeReadinessInput[],
  logs: LogInput[],
): ChallengeProgressRow[] {
  const bests = bestByExerciseFromLogs(logs);
  return challenges.map((c) => {
    const ruleReqs = readinessRuleToRequirements(c.readiness_rule);
    let reqs: ReadinessRequirement[];
    if (ruleReqs.length > 0) {
      reqs = ruleReqs;
    } else if (c.target_reps != null || c.target_seconds != null) {
      reqs = [
        {
          exercise_id: c.exercise_id,
          target_reps: c.target_reps,
          target_seconds: c.target_seconds,
        },
      ];
    } else {
      // No rule and no measurable target → nothing to be ready for. Never
      // let computeReadiness's "empty reqs = 100%" make this phantom-ready.
      return { challenge_id: c.id, readiness: 0, status: 'locked' as const };
    }
    const readiness = computeReadiness(reqs, bests);
    return {
      challenge_id: c.id,
      readiness,
      status: readiness >= 100 ? 'ready' : 'locked',
    };
  });
}
