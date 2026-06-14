# Skill-Tree Data Layer & Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the already-built pure engines (`lib/skills/`) to Supabase — read progressions/challenges, log sets, recompute node statuses + challenge readiness, persist them, and expose React Query hooks — so the Árbol/Entrenar UI (a later plan) has live data.

**Architecture:** Keep deterministic transforms **pure and testable** in `lib/skills/derive.ts` (no Supabase, runs under the existing Jest/node setup). Put all Supabase I/O + orchestration in `lib/api/` modules that import those pure functions plus `@/lib/supabase` — mirroring the existing `routinesApi`/`streak` pattern (object literal of async methods, Zod-validated returns). Expose one hook file per API module under `lib/hooks/`, following the existing React Query conventions (array `queryKey`, `enabled: !!id`, invalidation in `onSuccess`). The I/O modules are verified by `tsc` (the repo does not unit-test Supabase glue); all logic lives in pure functions that ARE unit-tested.

**Tech Stack:** TypeScript 5.9, Zod 4, `@supabase/supabase-js` 2, `@tanstack/react-query` 5, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-06-13-calistenia-skill-tree-design.md` (§8 data model, §9 engines)
**Builds on:** `docs/superpowers/plans/2026-06-13-logic-core-and-data-schema.md` (engines + schema, complete; migration applied)

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/skills/derive.ts` | **Pure** transforms: `bestByExerciseFromLogs`, `deriveSkillProgressRows` (statuses + `in_progress`), `readinessRuleToRequirements`, `deriveChallengeProgressRows` |
| `lib/skills/__tests__/derive.test.ts` | Unit tests for the pure transforms |
| `lib/skills/index.ts` | Add `export * from './derive'` |
| `lib/api/workoutLogs.ts` | I/O: `workoutLogsApi.log`, `workoutLogsApi.listForUser` |
| `lib/api/skillTree.ts` | I/O + orchestration: `skillTreeApi.listProgressions`, `listSkillProgress`, `syncSkillProgress` |
| `lib/api/challenges.ts` | I/O + orchestration: `challengesApi.listChallenges`, `listChallengeProgress`, `syncChallengeProgress` |
| `lib/api/index.ts` | Add barrel exports for the three new modules |
| `lib/hooks/useWorkoutLogs.ts` | `useWorkoutLogs`, `useLogSet` (logs a set → triggers both syncs → invalidates) |
| `lib/hooks/useSkillTree.ts` | `useProgressions`, `useSkillProgress` |
| `lib/hooks/useChallenges.ts` | `useChallenges`, `useChallengeProgress` |
| `lib/hooks/index.ts` | Add barrel exports for the three new hook files |

**Decisions locked here:**
- **Logs are the source of truth.** `best_reps`/`best_hold_seconds` on `user_skill_progress` is a cache recomputed from `workout_logs` on every sync (max reps / max seconds per exercise). No incremental best-tracking.
- **`in_progress` is derived, not emitted by the engine.** A node the engine returns as `available` becomes `in_progress` iff the user has ≥1 `workout_log` for it (per the logic-core plan's "Notes for later plans"). `locked`/`mastered` are never downgraded.
- **Status derivation is equipment-agnostic.** Equipment filtering (`isAvailableWithEquipment`) is a display/availability concern applied later in the UI; it does NOT change a node's persisted `locked/available/mastered` status.
- **`readiness_rule` jsonb shape** = `{ "requirements": [{ "exercise_id": uuid, "target_reps"?: number, "target_seconds"?: number }] }`. When a challenge has no `readiness_rule`, readiness is computed against a single requirement built from the challenge's own `exercise_id` + `target_reps`/`target_seconds` (covers volume/hold challenges).
- **User-driven challenge states are preserved.** `attempted`/`achieved` (set by future UI actions) are never overwritten by a sync; sync only moves `locked ⇄ ready` and always refreshes the numeric `readiness`.

All `lib/skills/*` files import only from `./types`, `./unlock`, `./readiness` (or nothing) — never `@/lib/supabase` — so they run in the plain Node test environment.

---

## Task 1: Pure transform — best-from-logs + skill progress rows

**Files:**
- Create: `lib/skills/derive.ts`
- Test: `lib/skills/__tests__/derive.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/derive.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test derive
```
Expected: FAIL — cannot find module `@/lib/skills/derive`.

- [ ] **Step 3: Write the implementation**

Create `lib/skills/derive.ts`:
```ts
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
  const withLogs = new Set(logs.map((l) => l.exercise_id));

  return nodes.map((n) => {
    const base = statuses[n.exercise_id];
    const status: NodeStatus =
      base === 'available' && withLogs.has(n.exercise_id) ? 'in_progress' : base;
    const best = bests[n.exercise_id] ?? { reps: null, seconds: null };
    return {
      exercise_id: n.exercise_id,
      status,
      best_reps: best.reps,
      best_hold_seconds: best.seconds,
    };
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test derive
```
Expected: PASS — `6 passed`.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/skills/derive.ts lib/skills/__tests__/derive.test.ts
git commit -m "feat(skills): derive best-from-logs and skill progress rows"
```

---

## Task 2: Pure transform — readiness rule + challenge progress rows

**Files:**
- Modify: `lib/skills/derive.ts`
- Modify: `lib/skills/__tests__/derive.test.ts`
- Modify: `lib/skills/index.ts`

- [ ] **Step 1: Add the failing tests**

Append to `lib/skills/__tests__/derive.test.ts` (add the two imports to the existing import from `@/lib/skills/derive` so the first line becomes the four-name import below, then append the two `describe` blocks):
```ts
import {
  bestByExerciseFromLogs,
  deriveSkillProgressRows,
  readinessRuleToRequirements,
  deriveChallengeProgressRows,
} from '@/lib/skills/derive';
```
```ts
describe('readinessRuleToRequirements', () => {
  it('returns [] for a null rule', () => {
    expect(readinessRuleToRequirements(null)).toEqual([]);
  });

  it('returns [] when there is no requirements array', () => {
    expect(readinessRuleToRequirements({ foo: 'bar' })).toEqual([]);
  });

  it('reads the requirements array', () => {
    const reqs = readinessRuleToRequirements({
      requirements: [
        { exercise_id: 'pullup', target_reps: 8 },
        { exercise_id: 'dip', target_reps: 10 },
      ],
    });
    expect(reqs).toHaveLength(2);
    expect(reqs[0]).toEqual({
      exercise_id: 'pullup',
      target_reps: 8,
      target_seconds: null,
    });
  });
});

describe('deriveChallengeProgressRows', () => {
  it('uses the challenge own target when there is no readiness_rule', () => {
    const rows = deriveChallengeProgressRows(
      [
        {
          id: 'c1',
          exercise_id: 'pushup',
          target_reps: 100,
          target_seconds: null,
          readiness_rule: null,
        },
      ],
      [{ exercise_id: 'pushup', reps: 50, seconds: null }],
    );
    expect(rows[0]).toEqual({ challenge_id: 'c1', readiness: 50, status: 'locked' });
  });

  it('marks ready at 100% and uses the readiness_rule when present', () => {
    const rows = deriveChallengeProgressRows(
      [
        {
          id: 'c2',
          exercise_id: 'muscleup',
          target_reps: 1,
          target_seconds: null,
          readiness_rule: {
            requirements: [
              { exercise_id: 'pullup', target_reps: 8 },
              { exercise_id: 'dip', target_reps: 10 },
            ],
          },
        },
      ],
      [
        { exercise_id: 'pullup', reps: 8, seconds: null },
        { exercise_id: 'dip', reps: 10, seconds: null },
      ],
    );
    expect(rows[0]).toEqual({ challenge_id: 'c2', readiness: 100, status: 'ready' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test derive
```
Expected: FAIL — `readinessRuleToRequirements`/`deriveChallengeProgressRows` are not exported.

- [ ] **Step 3: Extend the implementation**

Append to `lib/skills/derive.ts`:
```ts
import { computeReadiness } from './readiness';
import type { ReadinessRequirement } from './types';

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
  return requirements.map((r) => ({
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
    const reqs: ReadinessRequirement[] =
      ruleReqs.length > 0
        ? ruleReqs
        : [
            {
              exercise_id: c.exercise_id,
              target_reps: c.target_reps,
              target_seconds: c.target_seconds,
            },
          ];
    const readiness = computeReadiness(reqs, bests);
    return {
      challenge_id: c.id,
      readiness,
      status: readiness >= 100 ? 'ready' : 'locked',
    };
  });
}
```

Note: the `import` lines added here may be merged with the existing imports at the top of the file — TypeScript allows the appended `import` statements anywhere at module top level, but keeping all imports grouped at the top is cleaner. Either compiles.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test derive
```
Expected: PASS — `10 passed`.

- [ ] **Step 5: Export from the barrel**

In `lib/skills/index.ts`, add after the existing exports:
```ts
export * from './derive';
```

- [ ] **Step 6: Run the full skills suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green (equipment, unlock, readiness, routineGate, avatar, schemas, derive).

- [ ] **Step 7: Commit**

Run:
```bash
git add lib/skills/derive.ts lib/skills/__tests__/derive.test.ts lib/skills/index.ts
git commit -m "feat(skills): derive challenge readiness rows + barrel export"
```

---

## Task 3: workout_logs data-access module

**Files:**
- Create: `lib/api/workoutLogs.ts`
- Modify: `lib/api/index.ts`

This module is Supabase I/O glue (matches the repo convention of not unit-testing the client layer). Verification = `tsc`.

- [ ] **Step 1: Write the module**

Create `lib/api/workoutLogs.ts`:
```ts
import { supabase } from '@/lib/supabase';
import { WorkoutLogSchema } from './schemas';
import type { WorkoutLog } from './schemas';

export interface LogSetInput {
  exercise_id: string;
  reps: number | null;
  seconds: number | null;
}

export const workoutLogsApi = {
  /** Persist one performed set (reps OR hold seconds). */
  log: async (userId: string, entry: LogSetInput): Promise<WorkoutLog> => {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: userId, ...entry })
      .select()
      .single();
    if (error) throw error;
    return WorkoutLogSchema.parse(data);
  },

  /** All logs for a user, newest first. */
  listForUser: async (userId: string): Promise<WorkoutLog[]> => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false });
    if (error) throw error;
    return WorkoutLogSchema.array().parse(data ?? []);
  },
};
```

- [ ] **Step 2: Export from the barrel**

In `lib/api/index.ts`, add after the existing exports:
```ts
export * from './workoutLogs';
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

Run:
```bash
git add lib/api/workoutLogs.ts lib/api/index.ts
git commit -m "feat(api): workout_logs data access"
```

---

## Task 4: skill-tree data-access module (progressions + skill progress sync)

**Files:**
- Create: `lib/api/skillTree.ts`
- Modify: `lib/api/index.ts`

- [ ] **Step 1: Write the module**

Create `lib/api/skillTree.ts`:
```ts
import { supabase } from '@/lib/supabase';
import {
  ExerciseProgressionSchema,
  UserSkillProgressSchema,
  WorkoutLogSchema,
} from './schemas';
import type { ExerciseProgression, UserSkillProgress } from './schemas';
import { deriveSkillProgressRows } from '@/lib/skills/derive';
import type { ProgressionNode } from '@/lib/skills/types';

function toNode(p: ExerciseProgression): ProgressionNode {
  return {
    exercise_id: p.exercise_id,
    path: p.path,
    level: p.level,
    unlock_reps: p.unlock_reps,
    unlock_hold_seconds: p.unlock_hold_seconds,
    prerequisite_exercise_id: p.prerequisite_exercise_id,
  };
}

export const skillTreeApi = {
  /** Public content: the whole progression graph. */
  listProgressions: async (): Promise<ExerciseProgression[]> => {
    const { data, error } = await supabase
      .from('exercise_progressions')
      .select('*');
    if (error) throw error;
    return ExerciseProgressionSchema.array().parse(data ?? []);
  },

  /** Persisted per-user node states. */
  listSkillProgress: async (userId: string): Promise<UserSkillProgress[]> => {
    const { data, error } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return UserSkillProgressSchema.array().parse(data ?? []);
  },

  /**
   * Recompute every node's status + best from the user's logs and persist it.
   * mastered_at is preserved when a node was already mastered, set to now when
   * newly mastered, and cleared otherwise.
   */
  syncSkillProgress: async (userId: string): Promise<UserSkillProgress[]> => {
    const [
      { data: progData, error: progErr },
      { data: logData, error: logErr },
      { data: existingData, error: existErr },
    ] = await Promise.all([
      supabase.from('exercise_progressions').select('*'),
      supabase.from('workout_logs').select('*').eq('user_id', userId),
      supabase.from('user_skill_progress').select('*').eq('user_id', userId),
    ]);
    if (progErr) throw progErr;
    if (logErr) throw logErr;
    if (existErr) throw existErr;

    const progressions = ExerciseProgressionSchema.array().parse(progData ?? []);
    const logs = WorkoutLogSchema.array().parse(logData ?? []);
    const existing = UserSkillProgressSchema.array().parse(existingData ?? []);
    const masteredAtById = new Map(
      existing.map((e) => [e.exercise_id, e.mastered_at] as const),
    );

    const now = new Date().toISOString();
    const rows = deriveSkillProgressRows(progressions.map(toNode), logs).map(
      (r) => ({
        user_id: userId,
        exercise_id: r.exercise_id,
        status: r.status,
        best_reps: r.best_reps,
        best_hold_seconds: r.best_hold_seconds,
        mastered_at:
          r.status === 'mastered'
            ? masteredAtById.get(r.exercise_id) ?? now
            : null,
      }),
    );

    if (rows.length === 0) return [];

    const { data, error } = await supabase
      .from('user_skill_progress')
      .upsert(rows, { onConflict: 'user_id,exercise_id' })
      .select();
    if (error) throw error;
    return UserSkillProgressSchema.array().parse(data ?? []);
  },
};
```

- [ ] **Step 2: Export from the barrel**

In `lib/api/index.ts`, add after the `workoutLogs` export:
```ts
export * from './skillTree';
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (If `tsc` complains that `progressions.map(toNode)` is not assignable to `ProgressionNode[]`, confirm `toNode` returns the exact `ProgressionNode` shape — it does.)

- [ ] **Step 4: Commit**

Run:
```bash
git add lib/api/skillTree.ts lib/api/index.ts
git commit -m "feat(api): skill-tree progressions + skill progress sync"
```

---

## Task 5: challenges data-access module (catalog + readiness sync)

**Files:**
- Create: `lib/api/challenges.ts`
- Modify: `lib/api/index.ts`

- [ ] **Step 1: Write the module**

Create `lib/api/challenges.ts`:
```ts
import { supabase } from '@/lib/supabase';
import {
  ChallengeSchema,
  UserChallengeProgressSchema,
  WorkoutLogSchema,
} from './schemas';
import type { Challenge, UserChallengeProgress } from './schemas';
import { deriveChallengeProgressRows } from '@/lib/skills/derive';

export const challengesApi = {
  /** Public content: the full challenge catalog. */
  listChallenges: async (): Promise<Challenge[]> => {
    const { data, error } = await supabase.from('challenges').select('*');
    if (error) throw error;
    return ChallengeSchema.array().parse(data ?? []);
  },

  /** Persisted per-user challenge states. */
  listChallengeProgress: async (
    userId: string,
  ): Promise<UserChallengeProgress[]> => {
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return UserChallengeProgressSchema.array().parse(data ?? []);
  },

  /**
   * Recompute readiness for every challenge from the user's logs and persist it.
   * Preserves user-driven states (attempted / achieved); only flips locked <-> ready
   * and always refreshes the numeric readiness.
   */
  syncChallengeProgress: async (
    userId: string,
  ): Promise<UserChallengeProgress[]> => {
    const [
      { data: chData, error: chErr },
      { data: logData, error: logErr },
      { data: existData, error: existErr },
    ] = await Promise.all([
      supabase.from('challenges').select('*'),
      supabase.from('workout_logs').select('*').eq('user_id', userId),
      supabase.from('user_challenge_progress').select('*').eq('user_id', userId),
    ]);
    if (chErr) throw chErr;
    if (logErr) throw logErr;
    if (existErr) throw existErr;

    const challenges = ChallengeSchema.array().parse(chData ?? []);
    const logs = WorkoutLogSchema.array().parse(logData ?? []);
    const existing = UserChallengeProgressSchema.array().parse(existData ?? []);
    const existingById = new Map(
      existing.map((e) => [e.challenge_id, e] as const),
    );

    const derived = deriveChallengeProgressRows(
      challenges.map((c) => ({
        id: c.id,
        exercise_id: c.exercise_id,
        target_reps: c.target_reps,
        target_seconds: c.target_seconds,
        readiness_rule: c.readiness_rule,
      })),
      logs,
    );

    const rows = derived.map((d) => {
      const prev = existingById.get(d.challenge_id);
      if (prev && (prev.status === 'achieved' || prev.status === 'attempted')) {
        return {
          user_id: userId,
          challenge_id: d.challenge_id,
          status: prev.status,
          readiness: d.readiness,
          achieved_at: prev.achieved_at,
        };
      }
      return {
        user_id: userId,
        challenge_id: d.challenge_id,
        status: d.status,
        readiness: d.readiness,
        achieved_at: null,
      };
    });

    if (rows.length === 0) return [];

    const { data, error } = await supabase
      .from('user_challenge_progress')
      .upsert(rows, { onConflict: 'user_id,challenge_id' })
      .select();
    if (error) throw error;
    return UserChallengeProgressSchema.array().parse(data ?? []);
  },
};
```

- [ ] **Step 2: Export from the barrel**

In `lib/api/index.ts`, add after the `skillTree` export:
```ts
export * from './challenges';
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

Run:
```bash
git add lib/api/challenges.ts lib/api/index.ts
git commit -m "feat(api): challenge catalog + readiness sync"
```

---

## Task 6: React Query hooks

**Files:**
- Create: `lib/hooks/useWorkoutLogs.ts`
- Create: `lib/hooks/useSkillTree.ts`
- Create: `lib/hooks/useChallenges.ts`
- Modify: `lib/hooks/index.ts`

- [ ] **Step 1: Write `useWorkoutLogs.ts`**

Create `lib/hooks/useWorkoutLogs.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutLogsApi, skillTreeApi, challengesApi } from '@/lib/api';
import type { LogSetInput } from '@/lib/api/workoutLogs';

export const useWorkoutLogs = (userId?: string) => {
  return useQuery({
    queryKey: ['workoutLogs', userId],
    queryFn: () => (userId ? workoutLogsApi.listForUser(userId) : []),
    enabled: !!userId,
  });
};

/**
 * Logs a set, then recomputes skill + challenge progress, then invalidates the
 * affected queries so the tree and challenge readiness refresh.
 */
export const useLogSet = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: LogSetInput) => {
      if (!userId) throw new Error('No user');
      await workoutLogsApi.log(userId, entry);
      await skillTreeApi.syncSkillProgress(userId);
      await challengesApi.syncChallengeProgress(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs', userId] });
      queryClient.invalidateQueries({ queryKey: ['skillProgress', userId] });
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', userId] });
    },
  });
};
```

- [ ] **Step 2: Write `useSkillTree.ts`**

Create `lib/hooks/useSkillTree.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { skillTreeApi } from '@/lib/api';

export const useProgressions = () => {
  return useQuery({
    queryKey: ['progressions'],
    queryFn: () => skillTreeApi.listProgressions(),
  });
};

export const useSkillProgress = (userId?: string) => {
  return useQuery({
    queryKey: ['skillProgress', userId],
    queryFn: () => (userId ? skillTreeApi.listSkillProgress(userId) : []),
    enabled: !!userId,
  });
};
```

- [ ] **Step 3: Write `useChallenges.ts`**

Create `lib/hooks/useChallenges.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { challengesApi } from '@/lib/api';

export const useChallenges = () => {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.listChallenges(),
  });
};

export const useChallengeProgress = (userId?: string) => {
  return useQuery({
    queryKey: ['challengeProgress', userId],
    queryFn: () => (userId ? challengesApi.listChallengeProgress(userId) : []),
    enabled: !!userId,
  });
};
```

- [ ] **Step 4: Export from the barrel**

In `lib/hooks/index.ts`, add after the existing exports:
```ts
export * from './useWorkoutLogs';
export * from './useSkillTree';
export * from './useChallenges';
```

- [ ] **Step 5: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (If `tsc` cannot find `LogSetInput`, confirm it is exported from `lib/api/workoutLogs.ts` as written in Task 3.)

- [ ] **Step 6: Commit**

Run:
```bash
git add lib/hooks/useWorkoutLogs.ts lib/hooks/useSkillTree.ts lib/hooks/useChallenges.ts lib/hooks/index.ts
git commit -m "feat(hooks): skill-tree, challenge, and workout-log query hooks"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green, including the new `derive` suite (`10 passed` in that file).

- [ ] **Step 2: Typecheck the whole project**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Confirm the working tree is clean**

Run:
```bash
git status
```
Expected: no uncommitted changes in `lib/skills/`, `lib/api/`, or `lib/hooks/` (all committed in Tasks 1–6).

---

## Self-Review

**Spec coverage (this plan = the skill-tree data-access layer):**
- §8.3 `workout_logs` read/write → Task 3 (`workoutLogsApi`). ✅
- §8.1/§8.2 progressions + per-user node state, incl. `in_progress` derivation → Tasks 1 (`deriveSkillProgressRows`) + 4 (`syncSkillProgress`). ✅
- §8.4 challenges catalog + `user_challenge_progress` readiness → Tasks 2 (`deriveChallengeProgressRows`) + 5 (`syncChallengeProgress`). ✅
- §9 deterministic engines wired to data: unlock + readiness consumed via `lib/skills/derive` (pure) called from the API orchestrators. ✅
- §9 "best ≥ unlock_reps / hold" recomputed from logs each sync → `bestByExerciseFromLogs`. ✅
- React Query hooks for all of the above → Task 6. ✅
- *Out of scope here (later plans, explicitly):* equipment filtering at the UI layer (engine `isAvailableWithEquipment` already exists), routine gate at create-time (uses `Routine.metadata`, consumed in the routine-UI plan), onboarding equipment capture, paywall/RevenueCat, content seeding of progressions + challenges, the Árbol/Entrenar screens, marking a challenge `attempted`/`achieved` from the UI (sync already preserves those states).

**Placeholder scan:** none — every step has concrete code and exact commands.

**Type consistency:**
- `LogInput` (derive) ⊇ `WorkoutLog` fields used (`exercise_id`, `reps`, `seconds`) → `WorkoutLog[]` is assignable to `LogInput[]`. ✅
- `ProgressionNode` produced by `toNode` (Task 4) matches the shape consumed by `deriveSkillProgressRows`/`computeStatuses`. ✅
- `SkillProgressRow` fields (`exercise_id`, `status`, `best_reps`, `best_hold_seconds`) are exactly the columns the `user_skill_progress` upsert sets (plus `user_id`, `mastered_at` added by the orchestrator). ✅
- `ChallengeProgressRow.status` (`'locked' | 'ready'`) ⊂ `ChallengeStatusSchema` enum; preserved `prev.status` (`'attempted' | 'achieved'`) covers the rest. ✅
- `ReadinessRequirement` shape returned by `readinessRuleToRequirements` matches `computeReadiness`'s parameter. ✅
- Hook `queryKey`s are consistent between writers and readers: `useLogSet` invalidates `['skillProgress', userId]` / `['challengeProgress', userId]` / `['workoutLogs', userId]`, matching `useSkillProgress` / `useChallengeProgress` / `useWorkoutLogs`. ✅
- `LogSetInput` exported from `workoutLogsApi` module and imported by `useLogSet`. ✅

**Note for the next plan:** marking a challenge as `attempted`/`achieved` (the "Intentar reto" → success flow, §6) needs a small `challengesApi.markChallengeStatus(userId, challengeId, status)` mutation; intentionally deferred to the UI plan that adds the button, since the sync logic already preserves those states once set.
