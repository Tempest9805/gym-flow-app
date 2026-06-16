# Routine Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user saves a routine containing skill-tree nodes above their tested level, warn them and let them save it locked (`status: 'pending'`) or go unlock those nodes in the Tree; always persist per-branch `required_levels` to `Routine.metadata`.

**Architecture:** Pure logic extends `lib/skills/routineGate.ts` (build node-status map, required levels, full evaluation). The builder's save flow evaluates the gate and either saves normally or opens a modal. `upsertRoutine` gains optional `{ metadata, status }`. No schema change.

**Tech Stack:** React Native + Expo Router v6, React Query v5, Zustand v5, NativeWind v4, Zod, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-06-15-routine-gate-design.md`

> **Testing note:** manual testing (`pnpm start`) is deferred to the end per owner preference. Unit tests + `pnpm typecheck` run inline (TDD).

> **Repo-state caveat:** work on branch `feat/calistenia-foundation`. Use targeted `git add <path>` every commit. NEVER `git add -A`/`.`.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/skills/routineGate.ts` | **Modify**: add `buildRoutineStatuses`, `requiredLevelsForRoutine`, `evaluateRoutineGate` |
| `lib/skills/__tests__/routineGate.test.ts` | **Modify**: tests for the new functions |
| `lib/hooks/useTranslation.ts` | **Modify**: add `gate.*` keys (en+es) |
| `lib/api/routines.ts` | **Modify**: `upsertRoutine` accepts `{ metadata, status }` |
| `components/skill/RoutineGateSheet.tsx` | **Create**: modal listing locked nodes + actions |
| `app/(app)/routine-builder.tsx` | **Modify**: evaluate gate on save, open sheet, persist metadata+status |
| `app/(app)/routines.tsx` | **Modify**: "Locked" badge for `status === 'pending'` |

---

## Task 1: Pure gate logic (TDD)

**Files:**
- Modify: `lib/skills/routineGate.ts`
- Test: `lib/skills/__tests__/routineGate.test.ts`

- [ ] **Step 1: Write the failing tests**

In `lib/skills/__tests__/routineGate.test.ts`, append:
```ts
import {
  buildRoutineStatuses,
  requiredLevelsForRoutine,
  evaluateRoutineGate,
} from '@/lib/skills/routineGate';
import type { ExerciseProgression, UserSkillProgress } from '@/lib/api/schemas';

const gprog = (exercise_id: string, path: string, level: number): ExerciseProgression =>
  ({
    id: `prog-${exercise_id}`, path, exercise_id, level, tier: 'beginner',
    unlock_reps: null, unlock_hold_seconds: null, prerequisite_exercise_id: null,
    equipment: null, created_at: '2026-06-15T00:00:00.000Z',
  }) as ExerciseProgression;

const gsp = (exercise_id: string, status: UserSkillProgress['status']): UserSkillProgress =>
  ({
    id: `sp-${exercise_id}`, user_id: 'u1', exercise_id, status,
    best_reps: null, best_hold_seconds: null, mastered_at: null,
    created_at: '2026-06-15T00:00:00.000Z',
  }) as UserSkillProgress;

describe('buildRoutineStatuses', () => {
  it('includes only node exercises, defaulting missing progress to locked', () => {
    const progs = [gprog('a', 'push', 1), gprog('b', 'push', 2)];
    const statuses = buildRoutineStatuses(progs, [gsp('a', 'mastered')], ['a', 'b', 'not-a-node']);
    expect(statuses).toEqual({ a: 'mastered', b: 'locked' });
  });
});

describe('requiredLevelsForRoutine', () => {
  it('takes the max level per branch, only present branches', () => {
    const progs = [gprog('a', 'push', 1), gprog('b', 'push', 3), gprog('c', 'core', 2)];
    expect(requiredLevelsForRoutine(progs, ['a', 'b', 'c'])).toEqual({ push: 3, core: 2 });
  });
  it('returns {} when no routine exercise is a node', () => {
    expect(requiredLevelsForRoutine([gprog('a', 'push', 1)], ['x'])).toEqual({});
  });
});

describe('evaluateRoutineGate', () => {
  it('flags locked when a node has no/locked progress', () => {
    const progs = [gprog('a', 'push', 1), gprog('b', 'pull', 2)];
    const res = evaluateRoutineGate(progs, [gsp('a', 'mastered')], ['a', 'b']);
    expect(res.locked).toBe(true);
    expect(res.lockedExerciseIds).toEqual(['b']);
    expect(res.requiredLevels).toEqual({ push: 1, pull: 2 });
  });
  it('is unlocked when all nodes are available/mastered', () => {
    const progs = [gprog('a', 'push', 1)];
    const res = evaluateRoutineGate(progs, [gsp('a', 'available')], ['a']);
    expect(res.locked).toBe(false);
    expect(res.lockedExerciseIds).toEqual([]);
  });
  it('never gates non-node exercises', () => {
    const res = evaluateRoutineGate([], [], ['x', 'y']);
    expect(res.locked).toBe(false);
    expect(res.requiredLevels).toEqual({});
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
pnpm test routineGate
```
Expected: FAIL — `buildRoutineStatuses`/`requiredLevelsForRoutine`/`evaluateRoutineGate` are not exported.

- [ ] **Step 3: Write the implementation**

In `lib/skills/routineGate.ts`, replace the entire file with:
```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
pnpm test routineGate
```
Expected: PASS — original + new tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/skills/routineGate.ts lib/skills/__tests__/routineGate.test.ts
git commit -m "feat(skills): routine gate evaluation (statuses + required levels)"
```

---

## Task 2: Translation strings (en + es)

**Files:**
- Modify: `lib/hooks/useTranslation.ts`

The threshold reuses the existing `tree.reps` key — no new unit keys.

- [ ] **Step 1: Add the English keys**

In the `en` object, replace:
```ts
    'equipment.dumbbells': 'Dumbbells',
  },
  es: {
```
with:
```ts
    'equipment.dumbbells': 'Dumbbells',
    // Routine gate
    'gate.title': 'This routine is above your tested level',
    'gate.subtitle': 'These exercises are still locked. Save it locked, or unlock them in the Tree.',
    'gate.saveLocked': 'Save locked',
    'gate.viewTree': 'View in Tree',
    'gate.keepEditing': 'Keep editing',
    'gate.locked': 'Locked',
  },
  es: {
```

- [ ] **Step 2: Add the Spanish keys**

In the `es` object, replace:
```ts
    'equipment.dumbbells': 'Mancuernas',
  }
} as const;
```
with:
```ts
    'equipment.dumbbells': 'Mancuernas',
    // Routine gate
    'gate.title': 'Esta rutina supera tu nivel probado',
    'gate.subtitle': 'Estos ejercicios siguen bloqueados. Guárdala bloqueada o desbloquéalos en el Árbol.',
    'gate.saveLocked': 'Guardar bloqueada',
    'gate.viewTree': 'Ver en Árbol',
    'gate.keepEditing': 'Seguir editando',
    'gate.locked': 'Bloqueada',
  }
} as const;
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors (identical 6 keys in both tables).

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useTranslation.ts
git commit -m "feat(gate): routine gate translation strings (en+es)"
```

---

## Task 3: Extend `upsertRoutine` with metadata + status

**Files:**
- Modify: `lib/api/routines.ts`

- [ ] **Step 1: Add the optional options param**

In `lib/api/routines.ts`, replace the `upsertRoutine` signature and the routine insert/update block:
```ts
export async function upsertRoutine(
  userId: string,
  routineId: string | null,
  name: string,
  exercises: ExerciseEntry[]
): Promise<string> {
  // 1. Crear o actualizar la rutina
  let finalRoutineId = routineId

  if (!routineId) {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: userId, name })
      .select('id')
      .single()
    if (error) throw error
    finalRoutineId = data.id
  } else {
    const { error } = await supabase
      .from('routines')
      .update({ name }) // "updated_at: new Date().toISOString()" may not exist on routines table schema in Supabase yet, better to stick to existing schema or omit updated_at if error occurs. Wait, user included updated_at in snippet. I'll include it.
      .eq('id', routineId)
    if (error) throw error
  }
```
with:
```ts
export async function upsertRoutine(
  userId: string,
  routineId: string | null,
  name: string,
  exercises: ExerciseEntry[],
  options?: { metadata?: Record<string, unknown>; status?: 'active' | 'pending' }
): Promise<string> {
  // Optional fields (gate writes required_levels metadata + locked status).
  const extra: Record<string, unknown> = {}
  if (options?.metadata !== undefined) extra.metadata = options.metadata
  if (options?.status !== undefined) extra.status = options.status

  // 1. Crear o actualizar la rutina
  let finalRoutineId = routineId

  if (!routineId) {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: userId, name, ...extra })
      .select('id')
      .single()
    if (error) throw error
    finalRoutineId = data.id
  } else {
    const { error } = await supabase
      .from('routines')
      .update({ name, ...extra })
      .eq('id', routineId)
    if (error) throw error
  }
```

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors (param is optional → existing callers unaffected).

- [ ] **Step 3: Commit**

```bash
git add lib/api/routines.ts
git commit -m "feat(api): upsertRoutine accepts metadata + status"
```

---

## Task 4: `RoutineGateSheet` component

**Files:**
- Create: `components/skill/RoutineGateSheet.tsx`

- [ ] **Step 1: Write the component**

Create `components/skill/RoutineGateSheet.tsx`:
```tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';

export interface LockedExerciseRow {
  id: string;
  name: string;
  threshold: string;
}

export function RoutineGateSheet({
  visible,
  lockedExercises,
  isSaving,
  onSaveLocked,
  onViewTree,
  onClose,
}: {
  visible: boolean;
  lockedExercises: LockedExerciseRow[];
  isSaving: boolean;
  onSaveLocked: () => void;
  onViewTree: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          className="rounded-t-[20px] border-t p-6 pb-12 gap-3"
          style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceVariant }}
          onStartShouldSetResponder={() => true}
        >
          <Text className="text-[22px] font-bold text-white">{tr('gate.title')}</Text>
          <Text className="text-sm mb-1" style={{ color: t.onSurfaceVariant }}>
            {tr('gate.subtitle')}
          </Text>

          <ScrollView style={{ maxHeight: 220 }}>
            {lockedExercises.map((ex) => (
              <View
                key={ex.id}
                className="flex-row items-center justify-between py-2 border-b"
                style={{ borderColor: t.surfaceVariant }}
              >
                <Text className="text-base text-white flex-shrink pr-3">🔒 {ex.name}</Text>
                {ex.threshold ? (
                  <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>{ex.threshold}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            className="h-12 rounded-lg items-center justify-center mt-2"
            style={{ backgroundColor: t.primaryContainer, opacity: isSaving ? 0.6 : 1 }}
            disabled={isSaving}
            onPress={onSaveLocked}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
              {tr('gate.saveLocked')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-12 rounded-lg items-center justify-center border"
            style={{ borderColor: t.primaryContainer, opacity: isSaving ? 0.6 : 1 }}
            disabled={isSaving}
            onPress={onViewTree}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
              {tr('gate.viewTree')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="h-10 items-center justify-center" onPress={onClose}>
            <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>{tr('gate.keepEditing')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/skill/RoutineGateSheet.tsx
git commit -m "feat(gate): RoutineGateSheet modal (locked nodes + actions)"
```

---

## Task 5: Wire the gate into the routine builder

**Files:**
- Modify: `app/(app)/routine-builder.tsx`

- [ ] **Step 1: Add imports**

Replace:
```ts
import { useExercises, useRoutine } from '@/lib/hooks';
import { upsertRoutine } from '@/lib/api/routines';
import { useTranslation } from '@/lib/hooks/useTranslation';
```
with:
```ts
import { useExercises, useRoutine, useProgressions, useSkillProgress } from '@/lib/hooks';
import { upsertRoutine } from '@/lib/api/routines';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { evaluateRoutineGate, requiredLevelsForRoutine } from '@/lib/skills/routineGate';
import { RoutineGateSheet, type LockedExerciseRow } from '@/components/skill/RoutineGateSheet';
```

- [ ] **Step 2: Add `t` to the translation hook**

Replace:
```ts
  const { language } = useTranslation();
```
with:
```ts
  const { language, t: tr } = useTranslation();
```

- [ ] **Step 3: Add gate data + state**

Immediately after the line:
```ts
  const { data: existingRoutine } = useRoutine(id);
```
add:
```ts
  const { data: progressions = [] } = useProgressions();
  const { data: skillProgress = [] } = useSkillProgress(user?.id);
  const [gateVisible, setGateVisible] = useState(false);
  const [lockedRows, setLockedRows] = useState<LockedExerciseRow[]>([]);
```

- [ ] **Step 4: Make the save mutation status-aware**

Replace the whole `saveMutation` definition:
```ts
  const saveMutation = useMutation({
    mutationFn: () => {
      // Map back to the API format
      const apiExercises = exercises.map((e, index) => ({
        id: e.tempId,
        exercise_id: e.exercise_id,
        exercise_name_en: e.name_en,
        exercise_name_es: e.name_es,
        exercise_type: e.auto_type,
        day_of_week: 0, // Not assigned here anymore
        order_index: index,
        sets: e.sets,
        reps: e.auto_type === 'reps' ? e.reps : null,
        duration_seconds: e.auto_type !== 'reps' ? e.duration_seconds : null,
        weight: e.showWeight ? e.weight : null,
        rest_seconds: e.rest_seconds,
        notes: null,
      }));

      return upsertRoutine(user!.id, routineId, name, apiExercises as any);
    },
    onSuccess: (newRoutineId) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['all-routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine', newRoutineId] });
      router.replace(`/routine-detail?id=${newRoutineId}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Could not save routine.');
      console.error(error);
    },
  });
```
with:
```ts
  const saveMutation = useMutation({
    mutationFn: ({ status }: { status: 'active' | 'pending'; navigateTo: 'detail' | 'tree' }) => {
      // Map back to the API format
      const apiExercises = exercises.map((e, index) => ({
        id: e.tempId,
        exercise_id: e.exercise_id,
        exercise_name_en: e.name_en,
        exercise_name_es: e.name_es,
        exercise_type: e.auto_type,
        day_of_week: 0, // Not assigned here anymore
        order_index: index,
        sets: e.sets,
        reps: e.auto_type === 'reps' ? e.reps : null,
        duration_seconds: e.auto_type !== 'reps' ? e.duration_seconds : null,
        weight: e.showWeight ? e.weight : null,
        rest_seconds: e.rest_seconds,
        notes: null,
      }));

      const requiredLevels = requiredLevelsForRoutine(
        progressions,
        exercises.map((e) => e.exercise_id),
      );

      return upsertRoutine(user!.id, routineId, name, apiExercises as any, {
        metadata: { required_levels: requiredLevels },
        status,
      });
    },
    onSuccess: (newRoutineId, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['all-routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine', newRoutineId] });
      setGateVisible(false);
      if (variables.navigateTo === 'tree') {
        router.replace('/tree');
      } else {
        router.replace(`/routine-detail?id=${newRoutineId}`);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Could not save routine.');
      console.error(error);
    },
  });

  const handleSave = () => {
    const ids = exercises.map((e) => e.exercise_id);
    const gate = evaluateRoutineGate(progressions, skillProgress, ids);
    if (!gate.locked) {
      saveMutation.mutate({ status: 'active', navigateTo: 'detail' });
      return;
    }
    const progById = new Map(progressions.map((p) => [p.exercise_id, p]));
    const nameById = new Map(
      exercises.map((e) => [e.exercise_id, language === 'es' ? e.name_es : e.name_en]),
    );
    setLockedRows(
      gate.lockedExerciseIds.map((exId) => {
        const p = progById.get(exId);
        const threshold =
          p?.unlock_reps != null
            ? `${p.unlock_reps} ${tr('tree.reps')}`
            : p?.unlock_hold_seconds != null
              ? `${p.unlock_hold_seconds}s`
              : '';
        return { id: exId, name: nameById.get(exId) ?? '—', threshold };
      }),
    );
    setGateVisible(true);
  };
```

- [ ] **Step 5: Point the Save button at `handleSave`**

Replace:
```ts
            onPress={() => saveMutation.mutate()}
```
with:
```ts
            onPress={handleSave}
```

- [ ] **Step 6: Mount the gate sheet**

Find the screen's root closing tag `</SafeAreaView>` (the last one in the file) and insert immediately before it:
```tsx
      <RoutineGateSheet
        visible={gateVisible}
        lockedExercises={lockedRows}
        isSaving={saveMutation.isPending}
        onSaveLocked={() => saveMutation.mutate({ status: 'pending', navigateTo: 'detail' })}
        onViewTree={() => saveMutation.mutate({ status: 'pending', navigateTo: 'tree' })}
        onClose={() => setGateVisible(false)}
      />
```

- [ ] **Step 7: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add "app/(app)/routine-builder.tsx"
git commit -m "feat(gate): evaluate gate on save + open RoutineGateSheet"
```

---

## Task 6: "Locked" badge in the routines list

**Files:**
- Modify: `app/(app)/routines.tsx`

- [ ] **Step 1: Add the translation hook to RoutineCard**

In `app/(app)/routines.tsx`, in the `RoutineCard` function, replace:
```tsx
  const { data: assignedDays = [] } = useQuery({
    queryKey: ['assigned-days', routine.id, userId],
    queryFn: () => getAssignedDays(routine.id, userId),
    enabled: !!userId,
  })
```
with:
```tsx
  const { t: tr } = useTranslation();
  const { data: assignedDays = [] } = useQuery({
    queryKey: ['assigned-days', routine.id, userId],
    queryFn: () => getAssignedDays(routine.id, userId),
    enabled: !!userId,
  })
```

- [ ] **Step 2: Render the badge next to the name**

Replace:
```tsx
          <Text className="text-lg font-black text-white">
            {routine.name}
          </Text>
```
with:
```tsx
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-black text-white">
              {routine.name}
            </Text>
            {routine.status === 'pending' && (
              <View className="px-2 py-0.5 rounded-full border" style={{ borderColor: '#BC13FE' }}>
                <Text className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#BC13FE' }}>
                  {tr('gate.locked')}
                </Text>
              </View>
            )}
          </View>
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors (`useTranslation` is already imported in this file; `RoutineWithExercises` includes `status`).

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/routines.tsx"
git commit -m "feat(gate): show Locked badge for pending routines"
```

---

## Task 7: Full verification + roadmap

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Full test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green, including the extended `routineGate` suite.

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Record progress in the roadmap**

In `docs/roadmap.md`, replace:
```markdown
5b. Plan — **Gate de rutina al crear** (required_levels en `Routine.metadata` + prueba de aptitud) ← **SIGUIENTE**
```
with:
```markdown
5b. **Gate de rutina al crear** ✅ *completo* (lógica pura `evaluateRoutineGate`, `upsertRoutine` con metadata+status, `RoutineGateSheet`, badge "Bloqueada"; sin cambio de esquema). Spec → `superpowers/specs/2026-06-15-routine-gate-design.md`, plan → `superpowers/plans/2026-06-15-routine-gate.md`. ⚠️ Manual `pnpm start` diferido.
6. Plan — Paywall RevenueCat + gating free/premium ← **SIGUIENTE**
```

- [ ] **Step 4: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs(roadmap): record routine gate complete"
```

- [ ] **Step 5: Manual checklist (deferred — run when batching manual tests)**

With `pnpm start`:
- Save a routine whose exercises are all at/under your level (or not tree nodes) → saves directly, no modal.
- Save a routine with a locked tree node → gate modal lists the locked exercise(s) + threshold.
- "Guardar bloqueada" → routine appears in the list with a "Bloqueada" badge.
- "Ver en Árbol" → routine saved pending + lands on the Árbol tab.
- "Seguir editando" → modal closes, nothing saved.

---

## Self-Review

**Spec coverage:**
- §4 pure logic (`buildRoutineStatuses`, `requiredLevelsForRoutine`, `evaluateRoutineGate`) → Task 1. ✅
- §5 `upsertRoutine` metadata+status → Task 3. ✅
- §6 gate UX (evaluate on save, RoutineGateSheet, actions) → Tasks 4, 5. ✅
- §7 pending badge → Task 6. ✅
- §8 i18n `gate.*` (threshold reuses `tree.reps`) → Task 2. ✅
- §11 testing (unit inline + typecheck; manual deferred) → Tasks 1, 7. ✅
- §10 out-of-scope (auto-unblock, gate-on-start, formal challenges) → correctly absent. ✅

**Placeholder scan:** none — every step has concrete code/commands. Task 5 Step 6 references the file's existing closing `</SafeAreaView>` as the insertion anchor (resolved against the file at execution); the inserted JSX is fully specified.

**Type consistency:**
- `evaluateRoutineGate(progressions, skillProgress, ids): RoutineGateEvaluation` (Task 1) ↔ used in builder `handleSave` (Task 5). ✅
- `requiredLevelsForRoutine(progressions, ids)` (Task 1) ↔ called in `saveMutation` (Task 5). ✅
- `upsertRoutine(..., { metadata, status })` (Task 3) ↔ called with `{ metadata: { required_levels }, status }` (Task 5). ✅
- `LockedExerciseRow { id, name, threshold }` (Task 4) ↔ `setLockedRows([...])` shape (Task 5). ✅
- `RoutineGateSheet` props (`visible`, `lockedExercises`, `isSaving`, `onSaveLocked`, `onViewTree`, `onClose`) (Task 4) ↔ mount site (Task 5 Step 6). ✅
- `gate.*` keys (Task 2) consumed in Tasks 4, 6. ✅
- saveMutation variable `{ status, navigateTo }` used in `onSuccess(_, variables)` (Task 5). ✅
```
