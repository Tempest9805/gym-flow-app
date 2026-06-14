# Árbol Screen (vertical slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **⏳ Progreso (2026-06-14, sesión 2):** ejecución subagent-driven en curso sobre `feat/calistenia-foundation`.
> **Hechas:** T1 `96983db` · T2 `ac2dc83` · T3 `410befc` · T4 `e2d8fae` · T5 `cdece08`+`25352a7` (frames recalibrados visualmente).
> **Siguiente:** T6 (AvatarHud + BranchLevelStrip). Faltan T6–T12.
> Nota: la deuda menor de `markChallengeStatus` (`achieved_at: null` en `attempted`) sigue pendiente de endurecer. T11 (seed) necesita credenciales Supabase.

**Goal:** Replace the Árbol placeholder with a working, demoable screen — a serpentine 5-branch skill map fed by real seeded content, a live avatar HUD, per-branch level strip, node logging (log set → derive → unlock → level up), and challenges with readiness + self-reported completion.

**Architecture:** Pure view-logic (`lib/skills/treeView.ts`) groups the existing progression/progress data into branch sections + level counts; the data layer already provides reads (`useProgressions`/`useSkillProgress`/`useChallenges`/`useChallengeProgress`/`useWorkoutLogs`) and the `useLogSet` write+sync mutation. We add `markChallengeStatus`, a `useStreak` hook, an avatar-variant preference, an offline sprite-slicing script, focused RN components, and assemble `tree.tsx`. Content is seeded by a Node script that resolves `exercise_id` from the existing catalog by slug/name.

**Tech Stack:** React Native + Expo Router v6, Zustand v5, React Query v5, NativeWind v4, expo-image, Zod, Jest + ts-jest, sharp, @supabase/supabase-js.

**Spec:** `docs/superpowers/specs/2026-06-14-arbol-screen-slice-design.md`
**Builds on:** skill-tree data layer + nav 5-tabs plans (same `docs/superpowers/plans/` dir).

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/skills/treeView.ts` | **Pure**: branch ordering, `buildBranchSections`, `branchMasteredCounts`, `globalMasteredCount` |
| `lib/skills/__tests__/treeView.test.ts` | Unit tests for the above |
| `lib/utils/avatarVariant.ts` | **Pure** `AvatarVariant` type + `resolveAvatarVariant` |
| `lib/utils/__tests__/avatarVariant.test.ts` | Unit test |
| `lib/utils/avatarFrames.ts` | Static `require` map {variant → 6 frames} + `avatarFrame(variant, stage)` |
| `lib/store/settingsStore.ts` | **Modify**: add `avatarVariant` + load/set |
| `lib/api/challenges.ts` | **Modify**: add `markChallengeStatus` |
| `lib/hooks/useChallenges.ts` | **Modify**: add `useMarkChallengeStatus` |
| `lib/hooks/useStreak.ts` | New `useStreak(userId)` query hook |
| `lib/hooks/index.ts` | **Modify**: export `./useStreak` |
| `lib/hooks/useTranslation.ts` | **Modify**: add `tree.*` + `branch.*` keys (en+es) |
| `scripts/slice-avatars.js` | Offline: crop 6 portraits/gender from the design sheets → webp frames |
| `scripts/seed-skill-tree.mjs` | Seed `exercise_progressions` + `challenges` (resolve ids from catalog) |
| `components/skill/AvatarHud.tsx` | Avatar frame by stage |
| `components/skill/BranchLevelStrip.tsx` | 5 per-branch level chips |
| `components/skill/SkillNode.tsx` | One node circle + label (pressable) |
| `components/skill/NodeSheet.tsx` | Modal: register a set (reps/seconds) via `useLogSet` |
| `components/skill/ChallengeCard.tsx` | Readiness bar + Intentar/Lo logré via `useMarkChallengeStatus` |
| `app/(app)/tree.tsx` | **Replace**: compose header + serpentine sections + challenges + CTA |

### Repo-state caveats (read before executing)

- The working tree has unrelated uncommitted WIP (presets, onboarding, etc.). Use **targeted `git add <path>`** every commit. NEVER `git add -A`/`.`.
- `tree.tsx` is committed (the placeholder from the nav plan) — safe to replace.
- `settingsStore.ts`, `challenges.ts`, `useChallenges.ts`, `useTranslation.ts`, `index.ts` (hooks barrel) are committed/clean.
- Avatar frames (Task 5) and seeding (Task 11) require running tools. Frames are committed assets. The seed script needs `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars and is run by the operator.

---

## Task 1: Pure tree-view logic (TDD)

**Files:**
- Create: `lib/skills/treeView.ts`
- Test: `lib/skills/__tests__/treeView.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/skills/__tests__/treeView.test.ts`:
```ts
import {
  BRANCH_ORDER,
  buildBranchSections,
  branchMasteredCounts,
  globalMasteredCount,
} from '@/lib/skills/treeView';
import type { ExerciseProgression, UserSkillProgress } from '@/lib/api/schemas';

const prog = (
  exercise_id: string,
  path: string,
  level: number,
  tier: 'beginner' | 'intermediate' | 'advanced',
): ExerciseProgression =>
  ({
    id: `prog-${exercise_id}`,
    path,
    exercise_id,
    level,
    tier,
    unlock_reps: null,
    unlock_hold_seconds: null,
    prerequisite_exercise_id: null,
    equipment: null,
    created_at: '2026-06-14T00:00:00.000Z',
  }) as ExerciseProgression;

const sp = (exercise_id: string, status: UserSkillProgress['status']): UserSkillProgress =>
  ({
    id: `sp-${exercise_id}`,
    user_id: 'u1',
    exercise_id,
    status,
    best_reps: null,
    best_hold_seconds: null,
    mastered_at: null,
    created_at: '2026-06-14T00:00:00.000Z',
  }) as UserSkillProgress;

describe('buildBranchSections', () => {
  it('groups by branch in canonical order and sorts nodes by level', () => {
    const progressions = [
      prog('a', 'core', 2, 'beginner'),
      prog('b', 'push', 1, 'beginner'),
      prog('c', 'core', 1, 'beginner'),
    ];
    const sections = buildBranchSections(progressions, []);
    expect(sections.map((s) => s.path)).toEqual(['push', 'core']);
    expect(sections[1].nodes.map((n) => n.exercise_id)).toEqual(['c', 'a']);
  });

  it('defaults missing progress to locked and applies known status', () => {
    const sections = buildBranchSections([prog('b', 'push', 1, 'beginner')], [sp('b', 'mastered')]);
    expect(sections[0].nodes[0].status).toBe('mastered');
    const locked = buildBranchSections([prog('x', 'push', 1, 'beginner')], []);
    expect(locked[0].nodes[0].status).toBe('locked');
  });
});

describe('branchMasteredCounts', () => {
  it('counts mastered nodes per branch', () => {
    const progressions = [
      prog('b', 'push', 1, 'beginner'),
      prog('d', 'push', 2, 'beginner'),
      prog('c', 'core', 1, 'beginner'),
    ];
    const counts = branchMasteredCounts(progressions, [sp('b', 'mastered'), sp('c', 'mastered')]);
    expect(counts.push).toBe(1);
    expect(counts.core).toBe(1);
    expect(counts.legs).toBe(0);
  });
});

describe('globalMasteredCount', () => {
  it('counts all mastered rows', () => {
    expect(globalMasteredCount([sp('b', 'mastered'), sp('c', 'available'), sp('d', 'mastered')])).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test treeView
```
Expected: FAIL — cannot find module `@/lib/skills/treeView`.

- [ ] **Step 3: Write the implementation**

Create `lib/skills/treeView.ts`:
```ts
import type { ExerciseProgression, UserSkillProgress, NodeStatus } from '@/lib/api/schemas';

export const BRANCH_ORDER = ['push', 'pull', 'core', 'legs', 'skill'] as const;
export type Branch = (typeof BRANCH_ORDER)[number];

export interface TreeNode {
  exercise_id: string;
  level: number;
  tier: ExerciseProgression['tier'];
  status: NodeStatus;
}

export interface BranchSection {
  path: Branch;
  nodes: TreeNode[];
}

/** Group progressions into branch sections (canonical order, sorted by level), applying per-user status. */
export function buildBranchSections(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
): BranchSection[] {
  const statusById = new Map(skillProgress.map((s) => [s.exercise_id, s.status]));
  return BRANCH_ORDER.map((path) => ({
    path,
    nodes: progressions
      .filter((p) => p.path === path)
      .sort((a, b) => a.level - b.level)
      .map((p) => ({
        exercise_id: p.exercise_id,
        level: p.level,
        tier: p.tier,
        status: statusById.get(p.exercise_id) ?? ('locked' as NodeStatus),
      })),
  })).filter((s) => s.nodes.length > 0);
}

/** mastered-node count per branch (the per-branch "level"). */
export function branchMasteredCounts(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
): Record<Branch, number> {
  const mastered = new Set(
    skillProgress.filter((s) => s.status === 'mastered').map((s) => s.exercise_id),
  );
  const counts = Object.fromEntries(BRANCH_ORDER.map((b) => [b, 0])) as Record<Branch, number>;
  for (const p of progressions) {
    if (mastered.has(p.exercise_id) && (BRANCH_ORDER as readonly string[]).includes(p.path)) {
      counts[p.path as Branch] += 1;
    }
  }
  return counts;
}

/** Total mastered nodes (feeds the avatar stage). */
export function globalMasteredCount(skillProgress: UserSkillProgress[]): number {
  return skillProgress.filter((s) => s.status === 'mastered').length;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test treeView
```
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/skills/treeView.ts lib/skills/__tests__/treeView.test.ts
git commit -m "feat(skills): pure tree-view grouping + branch/level counts"
```

---

## Task 2: `markChallengeStatus` API + hook

**Files:**
- Modify: `lib/api/challenges.ts`
- Modify: `lib/hooks/useChallenges.ts`

- [ ] **Step 1: Add the API method**

In `lib/api/challenges.ts`, inside the `challengesApi` object, after the `syncChallengeProgress` method (before the closing `};`), add a comma after the previous method and insert:
```ts
  /**
   * User-driven status transition for a challenge (self-report).
   * 'attempted' on "Intentar reto"; 'achieved' (sets achieved_at) on "Lo logré".
   * readiness is omitted: on conflict it is left untouched, on insert it defaults to 0.
   */
  markChallengeStatus: async (
    userId: string,
    challengeId: string,
    status: 'attempted' | 'achieved',
  ): Promise<UserChallengeProgress> => {
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .upsert(
        {
          user_id: userId,
          challenge_id: challengeId,
          status,
          achieved_at: status === 'achieved' ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,challenge_id' },
      )
      .select()
      .single();
    if (error) throw error;
    return UserChallengeProgressSchema.parse(data);
  },
```

- [ ] **Step 2: Add the mutation hook**

In `lib/hooks/useChallenges.ts`, replace the first import line:
```ts
import { useQuery } from '@tanstack/react-query';
```
with:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
```

Then at the end of the file add:
```ts
export const useMarkChallengeStatus = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, status }: { challengeId: string; status: 'attempted' | 'achieved' }) => {
      if (!userId) throw new Error('No user');
      return challengesApi.markChallengeStatus(userId, challengeId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', userId] });
    },
  });
};
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (`UserChallengeProgressSchema` is already imported in `challenges.ts`.)

- [ ] **Step 4: Commit**

```bash
git add lib/api/challenges.ts lib/hooks/useChallenges.ts
git commit -m "feat(api): markChallengeStatus mutation + hook"
```

---

## Task 3: Streak hook

**Files:**
- Create: `lib/hooks/useStreak.ts`
- Modify: `lib/hooks/index.ts`

- [ ] **Step 1: Write the hook**

Create `lib/hooks/useStreak.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { getOrCreateStreak } from '@/lib/api/streak';

/** Current user's streak (creates a zero row on first read). */
export const useStreak = (userId?: string) =>
  useQuery({
    queryKey: ['streak', userId],
    queryFn: () => (userId ? getOrCreateStreak(userId) : null),
    enabled: !!userId,
  });
```

- [ ] **Step 2: Export from the barrel**

In `lib/hooks/index.ts`, add a line alongside the other `export *` lines:
```ts
export * from './useStreak';
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (`getOrCreateStreak` is exported from `lib/api/streak.ts`.)

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useStreak.ts lib/hooks/index.ts
git commit -m "feat(hooks): useStreak query hook"
```

---

## Task 4: Avatar-variant preference (pure resolver + store)

**Files:**
- Create: `lib/utils/avatarVariant.ts`
- Test: `lib/utils/__tests__/avatarVariant.test.ts`
- Modify: `lib/store/settingsStore.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/utils/__tests__/avatarVariant.test.ts`:
```ts
import { resolveAvatarVariant } from '@/lib/utils/avatarVariant';

describe('resolveAvatarVariant', () => {
  it('defaults to hombre', () => {
    expect(resolveAvatarVariant(null)).toBe('hombre');
    expect(resolveAvatarVariant(undefined)).toBe('hombre');
    expect(resolveAvatarVariant('nope')).toBe('hombre');
  });
  it('resolves mujer', () => {
    expect(resolveAvatarVariant('mujer')).toBe('mujer');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test avatarVariant
```
Expected: FAIL — cannot find module `@/lib/utils/avatarVariant`.

- [ ] **Step 3: Write the resolver**

Create `lib/utils/avatarVariant.ts`:
```ts
export type AvatarVariant = 'hombre' | 'mujer';

/** Normalize a persisted avatar variant; defaults to 'hombre'. */
export function resolveAvatarVariant(raw: string | null | undefined): AvatarVariant {
  return raw === 'mujer' ? 'mujer' : 'hombre';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test avatarVariant
```
Expected: PASS — 2 tests green.

- [ ] **Step 5: Extend the settings store**

In `lib/store/settingsStore.ts`:

Change the import of `startTab` to also bring in the avatar helpers — replace:
```ts
import { resolveStartRoute, type StartTab } from '@/lib/utils/startTab';
```
with:
```ts
import { resolveStartRoute, type StartTab } from '@/lib/utils/startTab';
import { resolveAvatarVariant, type AvatarVariant } from '@/lib/utils/avatarVariant';
```

Add a second storage key after the existing one:
```ts
const START_TAB_STORAGE_KEY = 'gymflow_start_tab';
const AVATAR_VARIANT_STORAGE_KEY = 'gymflow_avatar_variant';
```

Extend the `SettingsState` interface (add the three avatar members):
```ts
interface SettingsState {
  startTab: StartTab;
  isLoaded: boolean;
  loadStartTab: () => Promise<void>;
  setStartTab: (tab: StartTab) => Promise<void>;
  avatarVariant: AvatarVariant;
  loadAvatarVariant: () => Promise<void>;
  setAvatarVariant: (variant: AvatarVariant) => Promise<void>;
}
```

In the `create<SettingsState>((set) => ({ ... }))` body, add `avatarVariant: 'hombre',` next to the initial `startTab: 'index',`, and add these two methods after `setStartTab`:
```ts
  loadAvatarVariant: async () => {
    try {
      const stored = await AsyncStorage.getItem(AVATAR_VARIANT_STORAGE_KEY);
      set({ avatarVariant: resolveAvatarVariant(stored) });
    } catch {
      // keep default
    }
  },

  setAvatarVariant: async (variant: AvatarVariant) => {
    try {
      await AsyncStorage.setItem(AVATAR_VARIANT_STORAGE_KEY, variant);
      set({ avatarVariant: variant });
    } catch {
      set({ avatarVariant: variant });
    }
  },
```

- [ ] **Step 6: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/utils/avatarVariant.ts lib/utils/__tests__/avatarVariant.test.ts lib/store/settingsStore.ts
git commit -m "feat(nav): avatar-variant preference (pure resolver + settings store)"
```

---

## Task 5: Avatar sprite slicing + frames map

**Files:**
- Create: `scripts/slice-avatars.js`
- Generates: `assets/avatares/frames/{hombre,mujer}_{1..6}.webp`
- Create: `lib/utils/avatarFrames.ts`

The design sheets are 1343×800 with the 6 portraits in a 3×2 grid on the right ~60%. Crop boxes are estimated from that grid and **exposed as editable constants** so the owner can refine them. `avatar_hombre_pixelArt.png` is the hombre sheet; `avatar_mujer_pixelArt.png` is the mujer sheet.

- [ ] **Step 1: Write the slicing script**

Create `scripts/slice-avatars.js`:
```js
'use strict';

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'assets', 'avatares');
const OUT_DIR = path.join(SRC_DIR, 'frames');

const SHEETS = {
  hombre: 'avatar_hombre_pixelArt.png',
  mujer: 'avatar_mujer_pixelArt.png',
};

// 3x2 grid of portraits on the right of the 1343x800 sheet.
// Editable: tweak these 6 numbers if the crop is off.
const GRID = {
  startX: 470,   // left edge of column 1
  startY: 70,    // top edge of row 1
  cellW: 285,    // horizontal stride between columns
  rowStride: 175, // vertical stride between rows (portrait + label gap)
  cropW: 250,    // portrait crop width
  cropH: 150,    // portrait crop height
};

function boxes() {
  const out = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      out.push({
        left: GRID.startX + col * GRID.cellW,
        top: GRID.startY + row * GRID.rowStride,
        width: GRID.cropW,
        height: GRID.cropH,
      });
    }
  }
  return out; // index 0..5 = nivel 1..6
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const regions = boxes();
  for (const [variant, file] of Object.entries(SHEETS)) {
    const src = path.join(SRC_DIR, file);
    for (let i = 0; i < regions.length; i++) {
      const out = path.join(OUT_DIR, `${variant}_${i + 1}.webp`);
      await sharp(src).extract(regions[i]).webp({ quality: 90 }).toFile(out);
      console.log('wrote', path.relative(SRC_DIR, out));
    }
  }
  console.log('done — 12 frames in assets/avatares/frames/');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script**

Run:
```bash
node scripts/slice-avatars.js
```
Expected: prints 12 `wrote …` lines and `done`. Verify with:
```bash
ls assets/avatares/frames
```
Expected: `hombre_1.webp … hombre_6.webp`, `mujer_1.webp … mujer_6.webp`.

> If a crop is visibly off-center, adjust the 6 `GRID` numbers and re-run. The frames are committed assets; exact alignment can be refined later by the owner.

- [ ] **Step 3: Write the frames map**

Create `lib/utils/avatarFrames.ts`:
```ts
import type { AvatarVariant } from './avatarVariant';

const FRAMES: Record<AvatarVariant, number[]> = {
  hombre: [
    require('@/assets/avatares/frames/hombre_1.webp'),
    require('@/assets/avatares/frames/hombre_2.webp'),
    require('@/assets/avatares/frames/hombre_3.webp'),
    require('@/assets/avatares/frames/hombre_4.webp'),
    require('@/assets/avatares/frames/hombre_5.webp'),
    require('@/assets/avatares/frames/hombre_6.webp'),
  ],
  mujer: [
    require('@/assets/avatares/frames/mujer_1.webp'),
    require('@/assets/avatares/frames/mujer_2.webp'),
    require('@/assets/avatares/frames/mujer_3.webp'),
    require('@/assets/avatares/frames/mujer_4.webp'),
    require('@/assets/avatares/frames/mujer_5.webp'),
    require('@/assets/avatares/frames/mujer_6.webp'),
  ],
};

/** Image source for a stage (1..6); clamps out-of-range. */
export function avatarFrame(variant: AvatarVariant, stage: number): number {
  const arr = FRAMES[variant] ?? FRAMES.hombre;
  const i = Math.min(Math.max(Math.trunc(stage), 1), arr.length) - 1;
  return arr[i];
}
```

- [ ] **Step 4: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (`.webp` requires resolve via the existing Expo/Metro asset typing already used by `lib/utils/mediaMap.ts`.)

- [ ] **Step 5: Commit**

```bash
git add scripts/slice-avatars.js lib/utils/avatarFrames.ts assets/avatares/frames
git commit -m "feat(avatar): slice 6-stage portraits + static frames map"
```

---

## Task 6: Avatar HUD + branch level strip components

**Files:**
- Create: `components/skill/AvatarHud.tsx`
- Create: `components/skill/BranchLevelStrip.tsx`

- [ ] **Step 1: Write the avatar HUD**

Create `components/skill/AvatarHud.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/lib/hooks/useTheme';
import { avatarFrame } from '@/lib/utils/avatarFrames';
import type { AvatarVariant } from '@/lib/utils/avatarVariant';

export function AvatarHud({ variant, stage }: { variant: AvatarVariant; stage: number }) {
  const t = useTheme();
  return (
    <View className="items-center gap-1">
      <View
        className="w-16 h-16 rounded-full overflow-hidden border-2"
        style={{ borderColor: t.primaryContainer, backgroundColor: t.surfaceContainer }}
      >
        <Image source={avatarFrame(variant, stage)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      </View>
      <Text className="text-[10px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>
        Nv {stage}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Write the branch level strip**

Create `components/skill/BranchLevelStrip.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';
import type { TranslationKey } from '@/lib/hooks/useTranslation';
import { BRANCH_ORDER, type Branch } from '@/lib/skills/treeView';

const ICONS: Record<Branch, string> = {
  push: '⌃',
  pull: '⌄',
  core: '◆',
  legs: '⏚',
  skill: '✦',
};

export function BranchLevelStrip({ counts }: { counts: Record<Branch, number> }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View className="flex-row justify-between mt-4">
      {BRANCH_ORDER.map((b) => (
        <View key={b} className="items-center gap-1 flex-1">
          <Text className="text-lg" style={{ color: t.primaryContainer }}>{ICONS[b]}</Text>
          <Text className="text-[10px] uppercase tracking-wide" style={{ color: t.onSurfaceVariant }}>
            {tr(`branch.${b}` as TranslationKey)}
          </Text>
          <Text className="text-sm font-bold text-white">{counts[b]}</Text>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (The `branch.*` keys are added in Task 9; if run before Task 9, `tsc` will flag the cast — Task 9 resolves it. Run Task 9 before the final typecheck.)

- [ ] **Step 4: Commit**

```bash
git add components/skill/AvatarHud.tsx components/skill/BranchLevelStrip.tsx
git commit -m "feat(skill): AvatarHud + BranchLevelStrip components"
```

---

## Task 7: SkillNode + NodeSheet components

**Files:**
- Create: `components/skill/SkillNode.tsx`
- Create: `components/skill/NodeSheet.tsx`

- [ ] **Step 1: Write the node**

Create `components/skill/SkillNode.tsx`:
```tsx
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import type { NodeStatus } from '@/lib/api/schemas';

const ALIGN = ['flex-start', 'center', 'flex-end'] as const;

export function SkillNode({
  label,
  status,
  index,
  onPress,
}: {
  label: string;
  status: NodeStatus;
  index: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const filled = status === 'mastered';
  const active = status === 'available' || status === 'in_progress';
  const locked = status === 'locked';

  const bg = filled ? t.primaryContainer : t.surfaceContainer;
  const border = locked ? t.surfaceContainerHighest : t.primaryContainer;

  return (
    <View style={{ alignSelf: ALIGN[index % 3], maxWidth: '70%' }} className="my-2">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="flex-row items-center gap-3"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View
          className="w-11 h-11 rounded-full border-2 items-center justify-center"
          style={{ backgroundColor: bg, borderColor: border, opacity: locked ? 0.55 : 1 }}
        >
          <Text style={{ color: filled ? t.surfaceContainerLowest : border, fontSize: 16 }}>
            {locked ? '🔒' : active ? '◆' : '✓'}
          </Text>
        </View>
        <Text
          className="text-sm flex-shrink"
          style={{ color: locked ? t.onSurfaceVariant : 'white', opacity: locked ? 0.7 : 1 }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Write the node sheet (register a set)**

Create `components/skill/NodeSheet.tsx`:
```tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';
import { useLogSet } from '@/lib/hooks/useWorkoutLogs';

export function NodeSheet({
  visible,
  onClose,
  userId,
  exerciseId,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  exerciseId: string | null;
  title: string;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const logSet = useLogSet(userId);
  const [reps, setReps] = useState('');
  const [seconds, setSeconds] = useState('');

  const save = () => {
    if (!exerciseId) return;
    const r = reps.trim() ? parseInt(reps, 10) : null;
    const s = seconds.trim() ? parseInt(seconds, 10) : null;
    if (r === null && s === null) return;
    logSet.mutate(
      { exercise_id: exerciseId, reps: Number.isNaN(r as number) ? null : r, seconds: Number.isNaN(s as number) ? null : s },
      {
        onSuccess: () => {
          setReps('');
          setSeconds('');
          onClose();
        },
      },
    );
  };

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
          <Text className="text-[22px] font-bold mb-1 text-white">{title}</Text>
          <Text className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {tr('tree.logSet')}
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs uppercase tracking-wide" style={{ color: t.onSurfaceVariant }}>{tr('tree.reps')}</Text>
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={t.onSurfaceVariant}
                className="rounded-xl px-4 py-3 text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xs uppercase tracking-wide" style={{ color: t.onSurfaceVariant }}>{tr('tree.seconds')}</Text>
              <TextInput
                value={seconds}
                onChangeText={setSeconds}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={t.onSurfaceVariant}
                className="rounded-xl px-4 py-3 text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
            </View>
          </View>

          <TouchableOpacity
            className="h-12 rounded-lg items-center justify-center mt-2"
            style={{ backgroundColor: t.primaryContainer, opacity: logSet.isPending ? 0.6 : 1 }}
            disabled={logSet.isPending}
            onPress={save}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
              {tr('tree.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (`tree.logSet/reps/seconds/save` keys added in Task 9; run Task 9 before the final typecheck.)

- [ ] **Step 4: Commit**

```bash
git add components/skill/SkillNode.tsx components/skill/NodeSheet.tsx
git commit -m "feat(skill): SkillNode + NodeSheet (log a set)"
```

---

## Task 8: ChallengeCard component

**Files:**
- Create: `components/skill/ChallengeCard.tsx`

- [ ] **Step 1: Write the card**

Create `components/skill/ChallengeCard.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';
import type { Challenge, UserChallengeProgress } from '@/lib/api/schemas';

export function ChallengeCard({
  challenge,
  progress,
  language,
  onAttempt,
  onAchieve,
}: {
  challenge: Challenge;
  progress?: UserChallengeProgress;
  language: 'en' | 'es';
  onAttempt: () => void;
  onAchieve: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const status = progress?.status ?? 'locked';
  const readiness = Math.round(progress?.readiness ?? 0);
  const name = language === 'es' ? challenge.name_es : challenge.name_en;
  const ready = status === 'ready' || readiness >= 100;

  return (
    <View
      className="rounded-2xl border p-4 gap-3"
      style={{
        backgroundColor: t.surfaceContainer,
        borderColor: ready ? t.primaryContainer : t.surfaceContainerHighest,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white flex-shrink">{name}</Text>
        <Text className="text-[10px] font-bold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>
          T{challenge.challenge_tier}
        </Text>
      </View>

      {status === 'achieved' ? (
        <View className="flex-row items-center gap-2">
          <Text style={{ color: t.primaryContainer }}>✓</Text>
          <Text className="text-sm font-bold" style={{ color: t.primaryContainer }}>{tr('tree.achieved')}</Text>
        </View>
      ) : (
        <>
          <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ width: `${readiness}%`, height: '100%', backgroundColor: t.primaryContainer }} />
          </View>
          {ready ? (
            status === 'attempted' ? (
              <TouchableOpacity
                className="h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: t.primaryContainer }}
                onPress={onAchieve}
              >
                <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
                  {tr('tree.iDidIt')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="h-10 rounded-lg items-center justify-center border"
                style={{ borderColor: t.primaryContainer }}
                onPress={onAttempt}
              >
                <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
                  {tr('tree.tryChallenge')}
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <Text className="text-xs" style={{ color: t.onSurfaceVariant }}>
              {readiness}% {tr('tree.ready')}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (`tree.achieved/iDidIt/tryChallenge/ready` keys added in Task 9.)

- [ ] **Step 3: Commit**

```bash
git add components/skill/ChallengeCard.tsx
git commit -m "feat(skill): ChallengeCard with readiness + self-report"
```

---

## Task 9: Translation strings

**Files:**
- Modify: `lib/hooks/useTranslation.ts`

`TranslationKey = keyof typeof TRANSLATIONS.en` — every key MUST exist in both `en` and `es`.

- [ ] **Step 1: Add the English keys**

In `lib/hooks/useTranslation.ts`, in the `en` object, immediately after the line `'tree.subtitle': 'Unlock the muscle-up, handstand, planche and more — your path, one node at a time.',` add:
```ts
    // Tree screen
    'tree.streak': 'Streak',
    'tree.startToday': "Start today's routine",
    'tree.challenges': 'Challenges',
    'tree.tryChallenge': 'Try challenge',
    'tree.iDidIt': 'I did it',
    'tree.achieved': 'Achieved',
    'tree.ready': 'ready',
    'tree.logSet': 'Log a set',
    'tree.reps': 'Reps',
    'tree.seconds': 'Seconds',
    'tree.save': 'Save',
    // Branches
    'branch.push': 'Push',
    'branch.pull': 'Pull',
    'branch.core': 'Core',
    'branch.legs': 'Legs',
    'branch.skill': 'Skill',
```

- [ ] **Step 2: Add the Spanish keys**

In the `es` object, immediately after the line `'tree.subtitle': 'Desbloquea el muscle-up, el pino, la plancha y más — tu camino, nodo a nodo.',` add:
```ts
    // Tree screen
    'tree.streak': 'Racha',
    'tree.startToday': 'Empezar rutina de hoy',
    'tree.challenges': 'Retos',
    'tree.tryChallenge': 'Intentar reto',
    'tree.iDidIt': 'Lo logré',
    'tree.achieved': 'Logrado',
    'tree.ready': 'listo',
    'tree.logSet': 'Registrar serie',
    'tree.reps': 'Reps',
    'tree.seconds': 'Segundos',
    'tree.save': 'Guardar',
    // Branches
    'branch.push': 'Empuje',
    'branch.pull': 'Tracción',
    'branch.core': 'Core',
    'branch.legs': 'Piernas',
    'branch.skill': 'Skill',
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors (identical 16 keys added to both tables). This is the typecheck that also clears the `branch.*`/`tree.*` references from Tasks 6–8.

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useTranslation.ts
git commit -m "feat(nav): tree + branch translation strings"
```

---

## Task 10: Assemble the Árbol screen

**Files:**
- Replace: `app/(app)/tree.tsx`

Composes: header (AvatarHud + streak + BranchLevelStrip), serpentine branch sections (SkillNode), challenges section (ChallengeCard), CTA. Node tap → NodeSheet. Exercise display names/best come from `useExercises` + `useSkillProgress`.

- [ ] **Step 1: Replace the file**

Overwrite `app/(app)/tree.tsx` with:
```tsx
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import {
  useTranslation,
  useCurrentProfile,
  useExercises,
  useProgressions,
  useSkillProgress,
  useChallenges,
  useChallengeProgress,
  useStreak,
} from '@/lib/hooks';
import { useMarkChallengeStatus } from '@/lib/hooks/useChallenges';
import { useSettingsStore } from '@/lib/store/settingsStore';
import {
  buildBranchSections,
  branchMasteredCounts,
  globalMasteredCount,
} from '@/lib/skills/treeView';
import { avatarStageFromLevel } from '@/lib/skills/avatar';
import { AvatarHud } from '@/components/skill/AvatarHud';
import { BranchLevelStrip } from '@/components/skill/BranchLevelStrip';
import { SkillNode } from '@/components/skill/SkillNode';
import { NodeSheet } from '@/components/skill/NodeSheet';
import { ChallengeCard } from '@/components/skill/ChallengeCard';

export default function TreeScreen() {
  const t = useTheme();
  const { t: tr, language } = useTranslation();
  const { data: profile } = useCurrentProfile();
  const userId = profile?.id;

  const { data: exercises = [] } = useExercises();
  const { data: progressions = [] } = useProgressions();
  const { data: skillProgress = [] } = useSkillProgress(userId);
  const { data: challenges = [] } = useChallenges();
  const { data: challengeProgress = [] } = useChallengeProgress(userId);
  const { data: streak } = useStreak(userId);
  const { avatarVariant } = useSettingsStore();
  const markChallenge = useMarkChallengeStatus(userId);

  const [sheetExerciseId, setSheetExerciseId] = useState<string | null>(null);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of exercises) m.set(e.id, (language === 'es' ? e.name_es : e.name_en) ?? e.name_en);
    return m;
  }, [exercises, language]);

  const sections = useMemo(
    () => buildBranchSections(progressions, skillProgress),
    [progressions, skillProgress],
  );
  const counts = useMemo(
    () => branchMasteredCounts(progressions, skillProgress),
    [progressions, skillProgress],
  );
  const stage = avatarStageFromLevel(globalMasteredCount(skillProgress));
  const progressByChallenge = useMemo(
    () => new Map(challengeProgress.map((p) => [p.challenge_id, p])),
    [challengeProgress],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          className="rounded-2xl border p-4"
          style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceContainerHighest }}
        >
          <View className="flex-row items-center gap-4">
            <AvatarHud variant={avatarVariant} stage={stage} />
            <View className="gap-0.5">
              <Text className="text-2xl font-extrabold text-white">{tr('tree.title')}</Text>
              <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>
                {tr('tree.streak')}: {streak?.current_streak ?? 0}
              </Text>
            </View>
          </View>
          <BranchLevelStrip counts={counts} />
        </View>

        {/* CTA */}
        <TouchableOpacity
          className="h-12 rounded-xl items-center justify-center mt-4"
          style={{ backgroundColor: t.primaryContainer }}
          activeOpacity={0.85}
          onPress={() => router.push('/index')}
        >
          <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
            {tr('tree.startToday')}
          </Text>
        </TouchableOpacity>

        {/* Serpentine branch sections */}
        {sections.map((section) => (
          <View key={section.path} className="mt-8">
            <Text
              className="text-lg font-bold uppercase tracking-widest mb-2 pl-2 border-l-2"
              style={{ color: t.onSurface, borderLeftColor: t.primaryContainer }}
            >
              {tr(`branch.${section.path}` as any)}
            </Text>
            <View
              className="rounded-2xl border px-3 py-2"
              style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceContainerHighest }}
            >
              {section.nodes.map((node, i) => (
                <SkillNode
                  key={node.exercise_id}
                  index={i}
                  status={node.status}
                  label={nameById.get(node.exercise_id) ?? '—'}
                  onPress={() => setSheetExerciseId(node.exercise_id)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Challenges */}
        <Text
          className="text-lg font-bold uppercase tracking-widest mb-3 mt-10 pl-2 border-l-2"
          style={{ color: t.onSurface, borderLeftColor: t.primaryContainer }}
        >
          {tr('tree.challenges')}
        </Text>
        <View className="gap-3">
          {challenges
            .slice()
            .sort((a, b) => a.challenge_tier - b.challenge_tier)
            .map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                progress={progressByChallenge.get(c.id)}
                language={language}
                onAttempt={() => markChallenge.mutate({ challengeId: c.id, status: 'attempted' })}
                onAchieve={() => markChallenge.mutate({ challengeId: c.id, status: 'achieved' })}
              />
            ))}
        </View>
      </ScrollView>

      <NodeSheet
        visible={sheetExerciseId !== null}
        onClose={() => setSheetExerciseId(null)}
        userId={userId}
        exerciseId={sheetExerciseId}
        title={sheetExerciseId ? (nameById.get(sheetExerciseId) ?? '') : ''}
      />
    </SafeAreaView>
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
git add "app/(app)/tree.tsx"
git commit -m "feat(tree): assemble Árbol screen (serpentine + avatar + challenges + node logging)"
```

---

## Task 11: Seed content script + run

**Files:**
- Create: `scripts/seed-skill-tree.mjs`

Resolves `exercise_id` from the existing catalog by slug (then name_en LIKE), wipes & reinserts the seed content (both tables are pure seed content), and logs any unmatched nodes/challenges for the owner to add. Mirrors the env handling of `scripts/sync-exercises-to-supabase.mjs`.

- [ ] **Step 1: Write the seed script**

Create `scripts/seed-skill-tree.mjs`:
```js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Need EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key).');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// path, level, tier, slug, name (fallback match), unlock_reps?, unlock_hold_seconds?, prereq slug?, equipment?
const NODES = [
  { path: 'push', level: 1, tier: 'beginner',     slug: 'incline-push-up',       name: 'Incline Push-Up',  reps: 12 },
  { path: 'push', level: 2, tier: 'beginner',     slug: 'push-up',               name: 'Push-Up',          reps: 15, prereq: 'incline-push-up' },
  { path: 'push', level: 3, tier: 'intermediate', slug: 'diamond-push-up',       name: 'Diamond Push-Up',  reps: 12, prereq: 'push-up' },
  { path: 'push', level: 4, tier: 'advanced',     slug: 'archer-push-up',        name: 'Archer Push-Up',   reps: 8,  prereq: 'diamond-push-up' },

  { path: 'pull', level: 1, tier: 'beginner',     slug: 'inverted-row',          name: 'Inverted Row',     reps: 12 },
  { path: 'pull', level: 2, tier: 'intermediate', slug: 'australian-pull-up',    name: 'Australian Pull-Up', reps: 12, prereq: 'inverted-row' },
  { path: 'pull', level: 3, tier: 'advanced',     slug: 'pull-up',               name: 'Pull-Up',          reps: 5,  prereq: 'australian-pull-up', equipment: 'pull_up_bar' },

  { path: 'core', level: 1, tier: 'beginner',     slug: 'plank',                 name: 'Plank',            hold: 45 },
  { path: 'core', level: 2, tier: 'beginner',     slug: 'side-plank',            name: 'Side Plank',       hold: 40, prereq: 'plank' },
  { path: 'core', level: 3, tier: 'intermediate', slug: 'leg-raise',             name: 'Leg Raise',        reps: 15, prereq: 'side-plank' },
  { path: 'core', level: 4, tier: 'advanced',     slug: 'l-sit',                 name: 'L-Sit',            hold: 10, prereq: 'leg-raise' },

  { path: 'legs', level: 1, tier: 'beginner',     slug: 'squat',                 name: 'Squat',            reps: 25 },
  { path: 'legs', level: 2, tier: 'beginner',     slug: 'lunge',                 name: 'Lunge',            reps: 16, prereq: 'squat' },
  { path: 'legs', level: 3, tier: 'intermediate', slug: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', reps: 12, prereq: 'lunge' },
  { path: 'legs', level: 4, tier: 'advanced',     slug: 'pistol-squat',          name: 'Pistol Squat',     reps: 1,  prereq: 'bulgarian-split-squat' },

  { path: 'skill', level: 1, tier: 'intermediate', slug: 'pike-push-up',         name: 'Pike Push-Up',     reps: 8 },
  { path: 'skill', level: 2, tier: 'advanced',     slug: 'handstand-push-up',    name: 'Handstand Push-Up', reps: 3, prereq: 'pike-push-up' },
];

const CHALLENGES = [
  { slug: 'push-up', name: 'Push-Up',   name_en: '100 Push-Ups',          name_es: '100 Push-Ups',          tier: 4, kind: 'volume_reps',  target_reps: 100 },
  { slug: 'plank',   name: 'Plank',     name_en: 'Plank 5 min',           name_es: 'Plancha 5 min',         tier: 4, kind: 'hold_time',    target_seconds: 300 },
  { slug: 'burpee',  name: 'Burpee',    name_en: '100 Burpees in 10 min', name_es: '100 Burpees en 10 min', tier: 4, kind: 'reps_in_time', target_reps: 100, time_window_seconds: 600 },
  { slug: 'l-sit',   name: 'L-Sit',     name_en: 'L-Sit Hold',            name_es: 'L-Sit',                 tier: 1, kind: 'skill',        target_seconds: 10 },
  { slug: 'handstand-push-up', name: 'Handstand Push-Up', name_en: 'Handstand Push-Up', name_es: 'Handstand Push-Up', tier: 1, kind: 'skill', target_reps: 1 },
];

async function loadCatalog() {
  const { data, error } = await supabase.from('exercises').select('id, slug, name_en');
  if (error) throw error;
  const bySlug = new Map();
  const byName = new Map();
  for (const e of data) {
    if (e.slug) bySlug.set(e.slug.toLowerCase(), e.id);
    if (e.name_en) byName.set(e.name_en.toLowerCase(), e.id);
  }
  return { bySlug, byName };
}

function resolve(cat, slug, name) {
  return cat.bySlug.get(slug?.toLowerCase()) ?? cat.byName.get(name?.toLowerCase()) ?? null;
}

async function run() {
  const cat = await loadCatalog();

  const progRows = [];
  const unmatched = [];
  for (const n of NODES) {
    const exercise_id = resolve(cat, n.slug, n.name);
    if (!exercise_id) { unmatched.push(`node ${n.path}/${n.slug}`); continue; }
    progRows.push({
      path: n.path,
      exercise_id,
      level: n.level,
      tier: n.tier,
      unlock_reps: n.reps ?? null,
      unlock_hold_seconds: n.hold ?? null,
      prerequisite_exercise_id: n.prereq ? resolve(cat, n.prereq, n.prereq) : null,
      equipment: n.equipment ?? null,
    });
  }

  const chRows = [];
  for (const c of CHALLENGES) {
    const exercise_id = resolve(cat, c.slug, c.name);
    if (!exercise_id) { unmatched.push(`challenge ${c.slug}`); continue; }
    chRows.push({
      name_en: c.name_en,
      name_es: c.name_es,
      challenge_tier: c.tier,
      kind: c.kind,
      exercise_id,
      target_reps: c.target_reps ?? null,
      target_seconds: c.target_seconds ?? null,
      time_window_seconds: c.time_window_seconds ?? null,
      equipment: null,
      readiness_rule: {
        requirements: [
          { exercise_id, target_reps: c.target_reps ?? null, target_seconds: c.target_seconds ?? null },
        ],
      },
      is_premium: false,
    });
  }

  // Both tables are pure seed content → wipe and reinsert (idempotent).
  await supabase.from('exercise_progressions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('challenges').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (progRows.length) {
    const { error } = await supabase.from('exercise_progressions').insert(progRows);
    if (error) throw error;
  }
  if (chRows.length) {
    const { error } = await supabase.from('challenges').insert(chRows);
    if (error) throw error;
  }

  console.log(`✅  Seeded ${progRows.length} progressions, ${chRows.length} challenges.`);
  if (unmatched.length) {
    console.log('⚠️  Unmatched (add these exercises to the catalog, then re-run):');
    for (const u of unmatched) console.log('   -', u);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seed**

Run (with Supabase env vars set in the shell):
```bash
node scripts/seed-skill-tree.mjs
```
Expected: `✅  Seeded N progressions, M challenges.` and a list of any unmatched slugs (e.g. `pistol-squat`, `pike-push-up`, `burpee` if absent). Unmatched nodes/challenges are expected per spec §10 — note them for the owner; the screen still renders with whatever seeded.

> If the operator cannot run it now (no service key), commit the script and flag that the seed run is a manual prerequisite for the manual checklist.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-skill-tree.mjs
git commit -m "feat(seed): skill-tree progressions + challenges seed script"
```

---

## Task 12: Full verification

**Files:** none.

- [ ] **Step 1: Run the full test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green, including new `treeView` and `avatarVariant` suites.

- [ ] **Step 2: Typecheck the whole project**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Manual checklist (`pnpm start`)**

Not unit-testable (RN/expo-router). With the seed applied, verify by hand:
- Árbol tab shows header (avatar + streak + 5-branch level strip), 5 serpentine branch sections, and a challenges list — no crash.
- Tapping a node opens the sheet; entering reps/seconds and saving updates the node's state (e.g. an `available` node becomes `in_progress`/`mastered`) and the branch count / avatar stage when thresholds are met.
- A challenge at 100% readiness shows "Intentar reto" → tap → "Lo logré" → shows Logrado.
- CTA "Empezar rutina de hoy" navigates to the Entrenar tab.
- Switching app language flips branch/tab/challenge labels.

---

## Self-Review

**Spec coverage:**
- §2.1 seed subset (5 ramas, sin barra, Avanzado locked) → Task 11 (NODES/CHALLENGES, equipment null except bar-locked). ✅
- §2.2 pantalla serpentine + header + retos + CTA → Tasks 6–10. ✅
- §2.3 registro mínimo en nodo → Task 7 (NodeSheet + existing `useLogSet`). ✅
- §2.4 avatar estático 1-de-6 + variante → Tasks 4, 5, 6. ✅
- §2.5 `markChallengeStatus` → Task 2. ✅
- §4 seed via subselect on catalog → Task 11 (slug/name resolve). ✅
- §5 loop log→derive→unlock→avatar → Task 7 + `useLogSet` + screen recompute. ✅
- §6 anatomy (HUD, branch strip, serpentine sections, node sheet, challenges, CTA) → Tasks 6–10. ✅
- §7 frame slicing + stage mapping (`avatarStageFromLevel`) → Tasks 5, 10. ✅
- §9 testing (pure unit + typecheck + manual) → Tasks 1, 4, 12. ✅
- *Out of scope (deferred):* equipment onboarding/filtering, real paywall, routine gate, level-up animation, guided challenge verification, full ~50-node seed. Correctly absent.

**Placeholder scan:** none — every step has concrete code/commands. The seed's "unmatched" reporting is intentional runtime behavior, not a plan placeholder.

**Type consistency:**
- `Branch`/`BRANCH_ORDER`/`BranchSection`/`TreeNode` defined in Task 1, consumed in Tasks 6 & 10. ✅
- `AvatarVariant`/`resolveAvatarVariant` (Task 4) used by `settingsStore` (Task 4), `avatarFrames` (Task 5), `AvatarHud` (Task 6), screen (Task 10). ✅
- `avatarFrame(variant, stage)` (Task 5) + `avatarStageFromLevel` (existing) consumed in Tasks 6 & 10. ✅
- `markChallengeStatus(userId, challengeId, status)` (Task 2) ↔ `useMarkChallengeStatus` mutation arg `{ challengeId, status }` (Task 2) ↔ screen `markChallenge.mutate({ challengeId, status })` (Task 10). ✅
- `useLogSet` arg `LogSetInput` `{ exercise_id, reps, seconds }` (existing) ↔ NodeSheet `logSet.mutate({ exercise_id, reps, seconds })` (Task 7). ✅
- `tree.*` + `branch.*` keys (Task 9) consumed in Tasks 6–8, 10. ✅
- `useStreak` returns `UserStreak | null` → screen reads `streak?.current_streak` (Task 10). ✅
