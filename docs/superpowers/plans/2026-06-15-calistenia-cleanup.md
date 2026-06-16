# Calistenia Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove confirmed dead code and focus the exercise library on calisthenics/home content (filter, no DB changes), without breaking features the calistenia spec keeps.

**Architecture:** A new pure helper (`equipmentFocus.ts`) classifies equipment as home-friendly vs gym; the Ejercicios library applies it as a base filter and drops the now-contradictory GYM browse category. Four orphan files (verified imported-by-nothing, no cascade) are deleted. Docs are corrected. No schema/data changes — the 25 `routine_exercises` references stay intact.

**Tech Stack:** React Native + Expo Router v6, Zustand v5, React Query v5, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-06-15-calistenia-cleanup-design.md`

> **Note on testing:** Per the owner, **manual** testing (`pnpm start`) is deferred to the end. Automated `pnpm test` + `pnpm typecheck` run inline as each task requires (TDD).

> **Repo-state caveat:** work on the current branch `feat/calistenia-foundation`. Use targeted `git add <path>` / `git rm <path>` every commit. NEVER `git add -A`/`.`.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/utils/equipmentFocus.ts` | **Pure**: `GYM_EQUIPMENT` set + `isHomeFriendly(equipment)` |
| `lib/utils/__tests__/equipmentFocus.test.ts` | Unit tests for the helper |
| `app/(app)/exercises.tsx` | **Modify**: base-filter library with `isHomeFriendly`; remove GYM category card + switch case |
| `lib/store/sessionStore.ts` | **Delete** (orphan) |
| `lib/store/tabataThemeStore.ts` | **Delete** (orphan) |
| `lib/hooks/useLocalMedia.ts` | **Delete** (orphan; `mediaMap` stays) |
| `lib/skills/index.ts` | **Delete** (orphan barrel; imports are direct-path) |
| `CLAUDE.md` | **Modify**: correct the Zustand stores table + diagram line |

---

## Task 1: `equipmentFocus` pure helper (TDD)

**Files:**
- Create: `lib/utils/equipmentFocus.ts`
- Test: `lib/utils/__tests__/equipmentFocus.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/utils/__tests__/equipmentFocus.test.ts`:
```ts
import { isHomeFriendly, GYM_EQUIPMENT } from '@/lib/utils/equipmentFocus';

describe('isHomeFriendly', () => {
  it('hides gym equipment', () => {
    for (const eq of [
      'machine', 'barbell', 'cable', 'smith machine', 'sled',
      'landmine', 'treadmill', 'bike', 'rowing machine', 'treadmill/outdoor',
    ]) {
      expect(isHomeFriendly(eq)).toBe(false);
    }
  });

  it('keeps home/calisthenics equipment', () => {
    for (const eq of [
      'bodyweight', 'dumbbells', 'dumbbell', 'kettlebell', 'jump rope',
      'box', 'ab wheel', 'medicine ball', 'battle ropes', 'bands', 'pull_up_bar',
    ]) {
      expect(isHomeFriendly(eq)).toBe(true);
    }
  });

  it('treats null/undefined/unknown as visible (default-show)', () => {
    expect(isHomeFriendly(null)).toBe(true);
    expect(isHomeFriendly(undefined)).toBe(true);
    expect(isHomeFriendly('some-new-thing')).toBe(true);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(isHomeFriendly('  BARBELL ')).toBe(false);
    expect(isHomeFriendly('Machine')).toBe(false);
  });

  it('exposes the gym set for reuse', () => {
    expect(GYM_EQUIPMENT.has('barbell')).toBe(true);
    expect(GYM_EQUIPMENT.has('bodyweight')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test equipmentFocus
```
Expected: FAIL — cannot find module `@/lib/utils/equipmentFocus`.

- [ ] **Step 3: Write the implementation**

Create `lib/utils/equipmentFocus.ts`:
```ts
/**
 * Equipment focus for the calisthenics/home library.
 *
 * Rule is by EXCLUSION: anything in GYM_EQUIPMENT is hidden from the library;
 * everything else (bodyweight, free weights, small home gear, and any unknown/
 * new value) is shown. This is intentionally lenient so new catalog equipment
 * defaults to visible rather than silently disappearing.
 *
 * The upcoming equipment-aware onboarding will refine visibility further using
 * `profiles.available_equipment` (e.g. hiding pull_up_bar items without a bar).
 */

/** Gym-only equipment that is hidden from the calisthenics/home library. */
export const GYM_EQUIPMENT: ReadonlySet<string> = new Set([
  'machine',
  'barbell',
  'cable',
  'smith machine',
  'sled',
  'landmine',
  'treadmill',
  'bike',
  'rowing machine',
  'treadmill/outdoor',
]);

/** true if the equipment is doable at home (bodyweight + minimal gear). */
export function isHomeFriendly(equipment: string | null | undefined): boolean {
  if (!equipment) return true; // null/unknown → visible
  return !GYM_EQUIPMENT.has(equipment.trim().toLowerCase());
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test equipmentFocus
```
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/equipmentFocus.ts lib/utils/__tests__/equipmentFocus.test.ts
git commit -m "feat(library): pure home-equipment focus helper"
```

---

## Task 2: Focus the Ejercicios library (apply filter + drop GYM category)

**Files:**
- Modify: `app/(app)/exercises.tsx`

The library currently exposes a GYM browse category and renders all catalog equipment. Applying the home filter as the base makes the GYM category empty/contradictory, so it is removed in the same task.

- [ ] **Step 1: Import the helper**

In `app/(app)/exercises.tsx`, after the line:
```ts
import { THUMB_MAP } from '@/lib/utils/mediaMap';
```
add:
```ts
import { isHomeFriendly } from '@/lib/utils/equipmentFocus';
```

- [ ] **Step 2: Remove the GYM browse category**

Replace:
```ts
const MAIN_CATEGORIES = [
  { id: 'CALISTHENICS', image: require('../../assets/exercises/Categories/CALISTHENICS.webp') },
  { id: 'FUNCTIONAL', image: require('../../assets/exercises/Categories/FUNCTIONAL.webp') },
  { id: 'GYM', image: require('../../assets/exercises/Categories/GYM.webp') },
  { id: 'HOME', image: require('../../assets/exercises/Categories/HOME.webp') },
];
```
with:
```ts
const MAIN_CATEGORIES = [
  { id: 'CALISTHENICS', image: require('../../assets/exercises/Categories/CALISTHENICS.webp') },
  { id: 'FUNCTIONAL', image: require('../../assets/exercises/Categories/FUNCTIONAL.webp') },
  { id: 'HOME', image: require('../../assets/exercises/Categories/HOME.webp') },
];
```

- [ ] **Step 3: Base-filter the list with `isHomeFriendly`**

Replace:
```ts
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    
    return exercises.filter((e) => {
```
with:
```ts
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];

    // Calistenia/casa: hide gym equipment from the whole library.
    return exercises.filter((e) => isHomeFriendly(e.equipment)).filter((e) => {
```

- [ ] **Step 4: Remove the now-dead GYM switch case**

Replace:
```ts
          case 'GYM':
            return ['barbell', 'machine', 'cable', 'smith machine', 'ez curl bar'].includes(eq) || 
                   (!['bodyweight', 'dumbbell', 'kettlebell', 'band'].includes(eq) && cat !== 'functional');
          case 'HOME':
```
with:
```ts
          case 'HOME':
```

- [ ] **Step 5: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/exercises.tsx"
git commit -m "feat(library): focus on calisthenics/home (filter gym + drop GYM category)"
```

---

## Task 3: Delete confirmed dead-code orphans

**Files:**
- Delete: `lib/store/sessionStore.ts`
- Delete: `lib/store/tabataThemeStore.ts`
- Delete: `lib/hooks/useLocalMedia.ts`
- Delete: `lib/skills/index.ts`

All four were confirmed imported by nothing (repo-wide import-graph sweep). No cascade: `mediaMap.ts` stays alive (used directly by exercises/exercise/workout/workout-session/routine-detail).

- [ ] **Step 1: Delete the files**

Run:
```bash
git rm lib/store/sessionStore.ts lib/store/tabataThemeStore.ts lib/hooks/useLocalMedia.ts lib/skills/index.ts
```
Expected: `rm 'lib/store/sessionStore.ts'` … 4 lines.

- [ ] **Step 2: Typecheck (catches any missed import)**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (If any error references a deleted file, that file was NOT an orphan — stop and re-audit.)

- [ ] **Step 3: Run the test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green (no suite imported the deleted files).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove dead stores/hook/barrel (sessionStore, tabataThemeStore, useLocalMedia, skills barrel)"
```

---

## Task 4: Docs hygiene — correct the Zustand stores in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

`CLAUDE.md` lists `sessionStore` (now deleted) and omits the real `settingsStore`.

- [ ] **Step 1: Fix the architecture-map diagram line**

In `CLAUDE.md`, replace:
```
  authStore | themeStore | languageStore | sessionStore | tabataStore
```
with:
```
  authStore | themeStore | languageStore | tabataStore | settingsStore
```

- [ ] **Step 2: Fix the stores table**

In `CLAUDE.md`, replace the row:
```
| `sessionStore` | Ejercicios/días completados esta semana | AsyncStorage (reset semanal) |
```
with:
```
| `settingsStore` | Tab de inicio + variante de avatar | AsyncStorage |
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: correct Zustand stores table (drop sessionStore, add settingsStore)"
```

---

## Task 5: Full verification + roadmap update

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Full test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green, including the new `equipmentFocus` suite.

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Record progress in the roadmap**

In `docs/roadmap.md`, under the "Secuencia de planes" list, mark the cleanup as done and note manual testing is pending. Add this line after the Plan 4 entry (item 4):

```markdown
4.5. **Limpieza de enfoque calistenia** ✅ *completo* (borrados 4 huérfanos: sessionStore, tabataThemeStore, useLocalMedia, skills barrel; librería filtrada a calistenia/casa vía `equipmentFocus` + categoría GYM removida; docs de stores corregidas). Spec → `superpowers/specs/2026-06-15-calistenia-cleanup-design.md`, plan → `superpowers/plans/2026-06-15-calistenia-cleanup.md`. ⚠️ Manual `pnpm start` diferido.
```

- [ ] **Step 4: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs(roadmap): record calistenia cleanup complete"
```

- [ ] **Step 5: Manual checklist (deferred — run when batching manual tests)**

Not unit-testable; verify by hand later with `pnpm start`:
- Ejercicios library shows only CALISTHENICS / FUNCTIONAL / HOME category cards (no GYM).
- Browsing/searching never surfaces barbell/machine/cable/etc. exercises.
- Tabata, routines, and exercise media still load (mediaMap intact).
- Opening an existing routine that references a gym exercise still resolves it (filter is library-only, not by id).

---

## Self-Review

**Spec coverage:**
- §3 delete 4 orphans → Task 3. ✅
- §4.1 pure helper `equipmentFocus.ts` (exclusion rule) → Task 1. ✅
- §4.2 apply filter in library → Task 2 (+ GYM category removal, the concrete realization of "focus the library"). ✅
- §5 docs hygiene (CLAUDE.md stores) → Task 4. ✅
- §7 testing (unit + typecheck inline; manual deferred) → Tasks 1, 5. ✅
- §6 out-of-scope (QR rewire, agenda absorption, ts-prune) → correctly absent. ✅

**Placeholder scan:** none — every step has concrete code/commands. The deferred manual checklist (Task 5 Step 5) is intentional per owner preference, not a plan gap.

**Type consistency:**
- `isHomeFriendly(equipment: string | null | undefined): boolean` (Task 1) ↔ `isHomeFriendly(e.equipment)` where `Exercise.equipment` is `string | null` (Task 2). ✅
- `GYM_EQUIPMENT` exported as `ReadonlySet<string>` (Task 1), asserted in test (Task 1). ✅
- No deleted file (Task 3) is imported by any remaining task or screen (verified by import-graph sweep + Task 3 Step 2 typecheck). ✅
