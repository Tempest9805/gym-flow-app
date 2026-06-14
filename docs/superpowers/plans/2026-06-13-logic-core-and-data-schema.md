# Logic Core & Data Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tested, UI-free foundation for the calisthenics skill-tree pivot — the database schema, Zod schemas/types, and the five deterministic engines (equipment filter, unlock, readiness, routine gate, avatar stage).

**Architecture:** Pure TypeScript functions in `lib/skills/` that take plain data and return plain data (no React Native, no Supabase imports) so they are trivially unit-testable. New Zod schemas extend the existing source of truth in `lib/api/schemas.ts`. New Postgres tables live in a SQL migration applied to Supabase. This plan delivers no UI; later plans build on top of it.

**Tech Stack:** TypeScript 5.9, Zod 4, Jest + ts-jest (added here), Supabase Postgres.

**Spec:** `docs/superpowers/specs/2026-06-13-calistenia-skill-tree-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `jest.config.js` | Jest config (ts-jest preset, `@/` alias, scopes tests to `lib/`) |
| `package.json` | Add `test` script + dev deps |
| `supabase/migrations/0001_skill_tree.sql` | New tables, `profiles.available_equipment`, RLS |
| `lib/skills/types.ts` | Shared engine types (`NodeStatus`, `Best`, `ProgressionNode`, `ReadinessRequirement`) |
| `lib/skills/equipment.ts` | `isAvailableWithEquipment` |
| `lib/skills/unlock.ts` | `meetsThreshold`, `computeStatuses` |
| `lib/skills/readiness.ts` | `computeReadiness` |
| `lib/skills/routineGate.ts` | `routineGateStatus` |
| `lib/skills/avatar.ts` | `avatarStageFromLevel`, `DEFAULT_AVATAR_THRESHOLDS` |
| `lib/skills/index.ts` | Barrel re-export |
| `lib/skills/__tests__/*.test.ts` | Unit tests (one per engine + schemas) |
| `lib/api/schemas.ts` | Extend with new Zod schemas/types |

All engine files import **only** from `lib/skills/types.ts` (or nothing). No engine imports `@/lib/supabase` or any RN/Expo module, so tests run in a plain Node environment.

---

## Task 1: Set up Jest + ts-jest for pure-logic tests

**Files:**
- Create: `jest.config.js`
- Modify: `package.json` (scripts + devDependencies)

- [ ] **Step 1: Install test dependencies**

Run:
```bash
pnpm add -D jest@^29 ts-jest@^29 @types/jest@^29
```
Expected: pnpm adds the three packages to `devDependencies` and updates the lockfile.

- [ ] **Step 2: Create the Jest config**

Create `jest.config.js`:
```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to the `scripts` block (after `"typecheck"`):
```json
    "test": "jest"
```

- [ ] **Step 4: Create a smoke test to prove the runner works**

Create `lib/skills/__tests__/smoke.test.ts`:
```ts
describe('jest setup', () => {
  it('runs typescript tests', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(2, 3)).toBe(5);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run:
```bash
pnpm test smoke
```
Expected: PASS — `1 passed`. If ts-jest complains it cannot find a tsconfig, confirm `tsconfig.json` exists at the repo root (it does); ts-jest auto-discovers it.

- [ ] **Step 6: Delete the smoke test and commit the setup**

Run:
```bash
git rm lib/skills/__tests__/smoke.test.ts
git add jest.config.js package.json pnpm-lock.yaml
git commit -m "chore: add jest + ts-jest for pure-logic unit tests"
```

---

## Task 2: Database migration (new tables + equipment column + RLS)

**Files:**
- Create: `supabase/migrations/0001_skill_tree.sql`

This task has no unit test (it is SQL DDL). Verification is by review + applying to Supabase and running a sanity query.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_skill_tree.sql`:
```sql
-- Calisthenics skill-tree foundation
-- Spec: docs/superpowers/specs/2026-06-13-calistenia-skill-tree-design.md

-- 1. profiles: equipment the user has at home
alter table public.profiles
  add column if not exists available_equipment text[] not null default '{}';

-- 2. exercise_progressions: skill-tree structure (public content)
create table if not exists public.exercise_progressions (
  id uuid primary key default gen_random_uuid(),
  path text not null check (path in ('push','pull','core','legs','skill')),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  level int not null check (level >= 1),
  tier text not null check (tier in ('beginner','intermediate','advanced')),
  unlock_reps int,
  unlock_hold_seconds int,
  prerequisite_exercise_id uuid references public.exercises(id) on delete set null,
  equipment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_exercise_progressions_path
  on public.exercise_progressions(path, level);

-- 3. challenges: catalog of retos (public content)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_es text not null,
  challenge_tier int not null check (challenge_tier between 1 and 4),
  kind text not null check (kind in ('skill','volume_reps','hold_time','reps_in_time')),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  target_reps int,
  target_seconds int,
  time_window_seconds int,
  equipment text,
  readiness_rule jsonb,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. workout_logs: per-set performance
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  reps int,
  seconds int,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_workout_logs_user
  on public.workout_logs(user_id, exercise_id);

-- 5. user_skill_progress: per-user node state
create table if not exists public.user_skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  status text not null default 'locked'
    check (status in ('locked','available','in_progress','mastered')),
  best_reps int,
  best_hold_seconds int,
  mastered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- 6. user_challenge_progress: per-user reto state
create table if not exists public.user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status text not null default 'locked'
    check (status in ('locked','ready','attempted','achieved')),
  readiness numeric not null default 0 check (readiness >= 0 and readiness <= 100),
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

-- 7. Row Level Security
alter table public.exercise_progressions enable row level security;
alter table public.challenges enable row level security;
alter table public.workout_logs enable row level security;
alter table public.user_skill_progress enable row level security;
alter table public.user_challenge_progress enable row level security;

-- Public read for content tables
create policy "progressions readable" on public.exercise_progressions
  for select using (true);
create policy "challenges readable" on public.challenges
  for select using (true);

-- Per-user access for user-owned tables
create policy "own workout logs" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own skill progress" on public.user_skill_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own challenge progress" on public.user_challenge_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply the migration to Supabase**

Apply by ONE of:
- Supabase Dashboard → SQL Editor → paste the file contents → Run, **or**
- If the Supabase CLI is configured for this project: `supabase db push`.

Expected: no errors. (If `gen_random_uuid()` is missing, run `create extension if not exists pgcrypto;` first — it is enabled by default on Supabase.)

- [ ] **Step 3: Sanity-check the schema**

In the SQL Editor, run:
```sql
select column_name from information_schema.columns
where table_name = 'profiles' and column_name = 'available_equipment';
select count(*) from public.exercise_progressions;
select count(*) from public.challenges;
```
Expected: first query returns one row (`available_equipment`); the two counts return `0` (tables exist, empty).

- [ ] **Step 4: Commit the migration**

Run:
```bash
git add supabase/migrations/0001_skill_tree.sql
git commit -m "feat(db): add skill-tree tables, equipment column, and RLS"
```

---

## Task 3: Zod schemas + types for the new entities

**Files:**
- Modify: `lib/api/schemas.ts`
- Test: `lib/skills/__tests__/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/schemas.test.ts`:
```ts
import {
  ExerciseProgressionSchema,
  WorkoutLogSchema,
  ChallengeSchema,
  UserSkillProgressSchema,
  UserChallengeProgressSchema,
  ProfileSchema,
} from '@/lib/api/schemas';

const UUID = '00000000-0000-0000-0000-000000000001';

describe('new entity schemas', () => {
  it('parses a valid exercise progression', () => {
    const parsed = ExerciseProgressionSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      path: 'push',
      exercise_id: UUID,
      level: 1,
      tier: 'beginner',
      unlock_reps: 10,
      unlock_hold_seconds: null,
      prerequisite_exercise_id: null,
      equipment: null,
    });
    expect(parsed.path).toBe('push');
  });

  it('rejects an invalid progression path', () => {
    expect(() =>
      ExerciseProgressionSchema.parse({
        id: UUID,
        created_at: '2026-06-13T00:00:00Z',
        path: 'cardio',
        exercise_id: UUID,
        level: 1,
        tier: 'beginner',
        unlock_reps: null,
        unlock_hold_seconds: null,
        prerequisite_exercise_id: null,
        equipment: null,
      }),
    ).toThrow();
  });

  it('parses a valid workout log', () => {
    const parsed = WorkoutLogSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      user_id: UUID,
      exercise_id: UUID,
      reps: 12,
      seconds: null,
      performed_at: '2026-06-13T00:00:00Z',
    });
    expect(parsed.reps).toBe(12);
  });

  it('parses a valid challenge', () => {
    const parsed = ChallengeSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      name_en: '100 Push-Ups',
      name_es: '100 Flexiones',
      challenge_tier: 4,
      kind: 'volume_reps',
      exercise_id: UUID,
      target_reps: 100,
      target_seconds: null,
      time_window_seconds: null,
      equipment: null,
      readiness_rule: null,
      is_premium: false,
    });
    expect(parsed.challenge_tier).toBe(4);
  });

  it('parses skill and challenge progress', () => {
    expect(
      UserSkillProgressSchema.parse({
        id: UUID,
        created_at: '2026-06-13T00:00:00Z',
        user_id: UUID,
        exercise_id: UUID,
        status: 'available',
        best_reps: 5,
        best_hold_seconds: null,
        mastered_at: null,
      }).status,
    ).toBe('available');

    expect(
      UserChallengeProgressSchema.parse({
        id: UUID,
        created_at: '2026-06-13T00:00:00Z',
        user_id: UUID,
        challenge_id: UUID,
        status: 'ready',
        readiness: 78,
        achieved_at: null,
      }).readiness,
    ).toBe(78);
  });

  it('defaults available_equipment to an empty array', () => {
    const parsed = ProfileSchema.parse({
      id: UUID,
      created_at: '2026-06-13T00:00:00Z',
      email: 'a@b.com',
      full_name: null,
      avatar_url: null,
    });
    expect(parsed.available_equipment).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test schemas
```
Expected: FAIL — module has no exports named `ExerciseProgressionSchema`, etc.

- [ ] **Step 3: Add the schemas**

In `lib/api/schemas.ts`, add these enums after the existing `ShareStatusSchema` line:
```ts
export const SkillPathSchema = z.enum(['push', 'pull', 'core', 'legs', 'skill']);
export const NodeStatusSchema = z.enum(['locked', 'available', 'in_progress', 'mastered']);
export const ChallengeTierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export const ChallengeKindSchema = z.enum(['skill', 'volume_reps', 'hold_time', 'reps_in_time']);
export const ChallengeStatusSchema = z.enum(['locked', 'ready', 'attempted', 'achieved']);
```

In `ProfileSchema`, add one field after `goal`:
```ts
  goal: z.string().nullable().optional(),
  available_equipment: z.array(z.string()).default([]),
```

Add these schemas after `UserStreakSchema` (before the `--- Inferred Types ---` block):
```ts
export const ExerciseProgressionSchema = z.object({
  ...BaseEntityFields,
  path: SkillPathSchema,
  exercise_id: z.string().uuid(),
  level: z.number().int().min(1),
  tier: DifficultySchema,
  unlock_reps: z.number().int().nullable(),
  unlock_hold_seconds: z.number().int().nullable(),
  prerequisite_exercise_id: z.string().uuid().nullable(),
  equipment: z.string().nullable(),
});

export const WorkoutLogSchema = z.object({
  ...BaseEntityFields,
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  reps: z.number().int().nullable(),
  seconds: z.number().int().nullable(),
  performed_at: z.string(),
});

export const ChallengeSchema = z.object({
  ...BaseEntityFields,
  name_en: z.string(),
  name_es: z.string(),
  challenge_tier: ChallengeTierSchema,
  kind: ChallengeKindSchema,
  exercise_id: z.string().uuid(),
  target_reps: z.number().int().nullable(),
  target_seconds: z.number().int().nullable(),
  time_window_seconds: z.number().int().nullable(),
  equipment: z.string().nullable(),
  readiness_rule: z.record(z.string(), z.any()).nullable(),
  is_premium: z.boolean(),
});

export const UserSkillProgressSchema = z.object({
  ...BaseEntityFields,
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  status: NodeStatusSchema,
  best_reps: z.number().int().nullable(),
  best_hold_seconds: z.number().int().nullable(),
  mastered_at: z.string().nullable(),
});

export const UserChallengeProgressSchema = z.object({
  ...BaseEntityFields,
  user_id: z.string().uuid(),
  challenge_id: z.string().uuid(),
  status: ChallengeStatusSchema,
  readiness: z.number().min(0).max(100),
  achieved_at: z.string().nullable(),
});
```

Add these inferred types at the end of the `--- Inferred Types ---` block:
```ts
export type SkillPath = z.infer<typeof SkillPathSchema>;
export type NodeStatus = z.infer<typeof NodeStatusSchema>;
export type ExerciseProgression = z.infer<typeof ExerciseProgressionSchema>;
export type WorkoutLog = z.infer<typeof WorkoutLogSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type UserSkillProgress = z.infer<typeof UserSkillProgressSchema>;
export type UserChallengeProgress = z.infer<typeof UserChallengeProgressSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test schemas
```
Expected: PASS — `6 passed`.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/api/schemas.ts lib/skills/__tests__/schemas.test.ts
git commit -m "feat(schemas): add zod schemas for skill tree, challenges, logs, equipment"
```

---

## Task 4: Engine — equipment filter

**Files:**
- Create: `lib/skills/types.ts`
- Create: `lib/skills/equipment.ts`
- Test: `lib/skills/__tests__/equipment.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/equipment.test.ts`:
```ts
import { isAvailableWithEquipment } from '@/lib/skills/equipment';

describe('isAvailableWithEquipment', () => {
  it('is always available when no equipment is required', () => {
    expect(isAvailableWithEquipment(null, [])).toBe(true);
    expect(isAvailableWithEquipment('none', [])).toBe(true);
    expect(isAvailableWithEquipment('', [])).toBe(true);
  });

  it('requires the equipment to be owned', () => {
    expect(isAvailableWithEquipment('pull_up_bar', [])).toBe(false);
    expect(isAvailableWithEquipment('pull_up_bar', ['bands'])).toBe(false);
    expect(isAvailableWithEquipment('pull_up_bar', ['pull_up_bar'])).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test equipment
```
Expected: FAIL — cannot find module `@/lib/skills/equipment`.

- [ ] **Step 3: Write the types and implementation**

Create `lib/skills/types.ts`:
```ts
export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface Best {
  reps: number | null;
  seconds: number | null;
}

export interface ProgressionNode {
  exercise_id: string;
  path: string;
  level: number;
  unlock_reps: number | null;
  unlock_hold_seconds: number | null;
  prerequisite_exercise_id: string | null;
}

export interface ReadinessRequirement {
  exercise_id: string;
  target_reps?: number | null;
  target_seconds?: number | null;
}
```

Create `lib/skills/equipment.ts`:
```ts
const NO_EQUIPMENT = new Set(['', 'none']);

export function isAvailableWithEquipment(
  required: string | null,
  available: string[],
): boolean {
  if (required === null || NO_EQUIPMENT.has(required)) return true;
  return available.includes(required);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test equipment
```
Expected: PASS — `2 passed`.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/skills/types.ts lib/skills/equipment.ts lib/skills/__tests__/equipment.test.ts
git commit -m "feat(skills): add equipment availability engine"
```

---

## Task 5: Engine — unlock (mastery + node status)

**Files:**
- Create: `lib/skills/unlock.ts`
- Test: `lib/skills/__tests__/unlock.test.ts`

Behaviour:
- `meetsThreshold(best, node)` → `true` only if at least one threshold is defined and every defined threshold is met.
- `computeStatuses(nodes, bestByExercise)` returns a status per `exercise_id`:
  - `mastered` if `meetsThreshold`.
  - else `available` if the prerequisite is satisfied (null OR mastered) AND the previous level in the same path is mastered (or it is level 1).
  - else `locked`.
  - (`in_progress` is NOT produced here — it is derived later from "has logs but not mastered".)

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/unlock.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test unlock
```
Expected: FAIL — cannot find module `@/lib/skills/unlock`.

- [ ] **Step 3: Write the implementation**

Create `lib/skills/unlock.ts`:
```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test unlock
```
Expected: PASS — `6 passed`.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/skills/unlock.ts lib/skills/__tests__/unlock.test.ts
git commit -m "feat(skills): add unlock engine (mastery + node status)"
```

---

## Task 6: Engine — readiness

**Files:**
- Create: `lib/skills/readiness.ts`
- Test: `lib/skills/__tests__/readiness.test.ts`

Behaviour: `computeReadiness(reqs, bestByExercise)` returns an integer 0–100 = `round(min(performance/target across all reqs) * 100)`, clamped to [0,100]. Empty reqs → 100.

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/readiness.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test readiness
```
Expected: FAIL — cannot find module `@/lib/skills/readiness`.

- [ ] **Step 3: Write the implementation**

Create `lib/skills/readiness.ts`:
```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test readiness
```
Expected: PASS — `5 passed`.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/skills/readiness.ts lib/skills/__tests__/readiness.test.ts
git commit -m "feat(skills): add readiness engine"
```

---

## Task 7: Engine — routine gate

**Files:**
- Create: `lib/skills/routineGate.ts`
- Test: `lib/skills/__tests__/routineGate.test.ts`

Behaviour: a routine is locked if any of its exercises has status `locked`. Exercises not present in the status map are treated as ungated (not part of any progression).

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/routineGate.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test routineGate
```
Expected: FAIL — cannot find module `@/lib/skills/routineGate`.

- [ ] **Step 3: Write the implementation**

Create `lib/skills/routineGate.ts`:
```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test routineGate
```
Expected: PASS — `3 passed`.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/skills/routineGate.ts lib/skills/__tests__/routineGate.test.ts
git commit -m "feat(skills): add routine-level gate engine"
```

---

## Task 8: Engine — avatar stage from level

**Files:**
- Create: `lib/skills/avatar.ts`
- Test: `lib/skills/__tests__/avatar.test.ts`

Behaviour: `avatarStageFromLevel(masteredCount, thresholds)` returns a stage 1–6. `thresholds` is an ascending array of 6 minimum mastered-node counts; the stage is the highest index whose threshold is met. Default thresholds: `[0, 3, 8, 15, 25, 40]`.

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/avatar.test.ts`:
```ts
import { avatarStageFromLevel, DEFAULT_AVATAR_THRESHOLDS } from '@/lib/skills/avatar';

describe('avatarStageFromLevel', () => {
  it('exposes 6 default thresholds', () => {
    expect(DEFAULT_AVATAR_THRESHOLDS).toHaveLength(6);
  });

  it('maps mastered counts to stages 1..6', () => {
    expect(avatarStageFromLevel(0)).toBe(1);
    expect(avatarStageFromLevel(2)).toBe(1);
    expect(avatarStageFromLevel(3)).toBe(2);
    expect(avatarStageFromLevel(7)).toBe(2);
    expect(avatarStageFromLevel(8)).toBe(3);
    expect(avatarStageFromLevel(40)).toBe(6);
    expect(avatarStageFromLevel(1000)).toBe(6);
  });

  it('accepts custom thresholds', () => {
    expect(avatarStageFromLevel(5, [0, 5, 10, 15, 20, 25])).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test avatar
```
Expected: FAIL — cannot find module `@/lib/skills/avatar`.

- [ ] **Step 3: Write the implementation**

Create `lib/skills/avatar.ts`:
```ts
export const DEFAULT_AVATAR_THRESHOLDS = [0, 3, 8, 15, 25, 40];

export function avatarStageFromLevel(
  masteredCount: number,
  thresholds: number[] = DEFAULT_AVATAR_THRESHOLDS,
): number {
  let stage = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (masteredCount >= thresholds[i]) stage = i + 1;
  }
  return Math.min(stage, thresholds.length);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test avatar
```
Expected: PASS — `3 passed`.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/skills/avatar.ts lib/skills/__tests__/avatar.test.ts
git commit -m "feat(skills): add avatar stage mapping engine"
```

---

## Task 9: Barrel export + full verification

**Files:**
- Create: `lib/skills/index.ts`

- [ ] **Step 1: Create the barrel**

Create `lib/skills/index.ts`:
```ts
export * from './types';
export * from './equipment';
export * from './unlock';
export * from './readiness';
export * from './routineGate';
export * from './avatar';
```

- [ ] **Step 2: Run the full test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green (schemas, equipment, unlock, readiness, routineGate, avatar).

- [ ] **Step 3: Typecheck the whole project**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (If `tsc` reports the new files, confirm imports use `import type` for type-only symbols as written.)

- [ ] **Step 4: Commit**

Run:
```bash
git add lib/skills/index.ts
git commit -m "feat(skills): add barrel export for skill engines"
```

---

## Self-Review

**Spec coverage (this plan only — the logic/data core):**
- `exercise_progressions`, `user_skill_progress`, `workout_logs`, `challenges`, `user_challenge_progress`, `profiles.available_equipment` → Task 2 (SQL) + Task 3 (Zod). ✅
- Unlock engine (reps/holds + prerequisites + previous level) → Task 5. ✅
- Readiness engine → Task 6. ✅
- Routine gate engine → Task 7. ✅
- Equipment filter → Task 4. ✅
- Avatar stage mapping (level → 6 states) → Task 8. ✅
- Gate via `Routine.metadata` → no schema change needed; consumed in a later plan (routine-creation UI). ✅
- *Out of scope here (later plans):* API/data-access modules, React Query hooks, all UI, onboarding equipment capture, paywall, content seeding.

**Placeholder scan:** none — every step has concrete code and exact commands.

**Type consistency:** `NodeStatus`, `Best`, `ProgressionNode`, `ReadinessRequirement` defined in `lib/skills/types.ts` (Task 4) and reused unchanged in Tasks 5–7. `computeStatuses` returns `Record<string, NodeStatus>`, consumed by `routineGateStatus` with the same type. `RoutineGateResult` fields (`locked`, `lockedExerciseIds`) match the test assertions. Zod `NodeStatus`/`SkillPath` enums (Task 3) mirror the engine string unions.

---

## Notes for later plans
- `user_skill_progress.status` includes `in_progress`, but the pure `computeStatuses` engine only emits `locked|available|mastered`. The data-access plan should derive `in_progress` (e.g., "has ≥1 workout_log for this exercise but not yet mastered") when persisting status.
- The unlock/readiness engines are pure; the data-access plan calls them after fetching `workout_logs` + `exercise_progressions` and writes the resulting statuses to `user_skill_progress`.
