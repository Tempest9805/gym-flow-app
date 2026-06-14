import { computeReadiness } from '@/lib/skills/readiness';
import type { ReadinessRequirement } from '@/lib/skills/types';

describe('computeReadiness', () => {
  it('is 100 when there are no requirements', () => {
    expect(computeReadiness([], {})).toBe(100);
  });

  it('is the rounded min ratio across requirements', () => {
    const reqs: ReadinessRequirement[] = [
      { exercise_id: 'pullup', target_reps: 8 },
      { exercise_id: 'dip', target_reps: 10 },
    ];
    const best = {
      pullup: { reps: 6, seconds: null }, // 0.75
      dip: { reps: 10, seconds: null }, // 1.0
    };
    expect(computeReadiness(reqs, best)).toBe(75);
  });

  it('clamps over-performance to 100', () => {
    const reqs: ReadinessRequirement[] = [{ exercise_id: 'pushup', target_reps: 10 }];
    expect(computeReadiness(reqs, { pushup: { reps: 50, seconds: null } })).toBe(100);
  });

  it('treats a missing best as zero', () => {
    const reqs: ReadinessRequirement[] = [{ exercise_id: 'pushup', target_reps: 10 }];
    expect(computeReadiness(reqs, {})).toBe(0);
  });

  it('supports hold-time targets', () => {
    const reqs: ReadinessRequirement[] = [{ exercise_id: 'plank', target_seconds: 60 }];
    expect(computeReadiness(reqs, { plank: { reps: null, seconds: 30 } })).toBe(50);
  });
});
