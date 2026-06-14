import type { Best, ReadinessRequirement } from './types';

const EMPTY_BEST: Best = { reps: null, seconds: null };

export function computeReadiness(
  reqs: ReadinessRequirement[],
  bestByExercise: Record<string, Best>,
): number {
  if (reqs.length === 0) return 100;

  const ratios = reqs.map((req) => {
    const best = bestByExercise[req.exercise_id] ?? EMPTY_BEST;
    const sub: number[] = [];
    if (req.target_reps != null && req.target_reps > 0) {
      sub.push((best.reps ?? 0) / req.target_reps);
    }
    if (req.target_seconds != null && req.target_seconds > 0) {
      sub.push((best.seconds ?? 0) / req.target_seconds);
    }
    if (sub.length === 0) return 1;
    return Math.min(...sub);
  });

  const overall = Math.min(...ratios);
  return Math.round(Math.max(0, Math.min(1, overall)) * 100);
}
