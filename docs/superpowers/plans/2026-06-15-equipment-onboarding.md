# Equipment Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture the user's available equipment in a dedicated onboarding step after goal selection, persisting it to `profiles.available_equipment`.

**Architecture:** A pure module owns the canonical equipment keys + selection normalization (testable, no React). A new onboarding screen reads/writes the profile via the existing `useUpdateProfile` hook. The AuthGuard gains one redirect so the step is shown once (incl. to existing users with an empty array). No schema change — `available_equipment text[]` already exists.

**Tech Stack:** React Native + Expo Router v6, React Query v5, NativeWind v4, Zod, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-06-15-equipment-onboarding-design.md`

> **Testing note:** manual testing (`pnpm start`) is deferred to the end per owner preference. Unit tests + `pnpm typecheck` run inline (TDD).

> **Repo-state caveat:** work on branch `feat/calistenia-foundation`. Use targeted `git add <path>` every commit. NEVER `git add -A`/`.`.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/hooks/useTranslation.ts` | **Modify**: add `onboarding.equipment.*` + `equipment.*` keys (en+es) |
| `lib/onboarding/equipment.ts` | **Create** — pure: `EQUIPMENT_OPTIONS`, `normalizeEquipmentSelection`, `isEquipmentCaptured` |
| `lib/onboarding/__tests__/equipment.test.ts` | **Create** — unit tests |
| `app/onboarding/equipment.tsx` | **Create** — the equipment selection screen |
| `app/onboarding/goal.tsx` | **Modify**: route to `/onboarding/equipment` after saving goal |
| `app/_layout.tsx` | **Modify**: AuthGuard redirect to equipment when goal set but equipment not captured |

`app/onboarding/_layout.tsx` is a `Stack` with route auto-discovery — no change needed.

---

## Task 1: Translation strings (en + es)

**Files:**
- Modify: `lib/hooks/useTranslation.ts`

`TranslationKey = keyof typeof TRANSLATIONS.en` — every key MUST exist in both `en` and `es`. The pure module (Task 2) types its `labelKey` as `TranslationKey`, so these keys must exist first.

- [ ] **Step 1: Add the English keys**

In `lib/hooks/useTranslation.ts`, in the `en` object, replace:
```ts
    'branch.skill': 'Skill',
  },
  es: {
```
with:
```ts
    'branch.skill': 'Skill',
    // Onboarding — equipment
    'onboarding.equipment.title': 'What equipment do you have?',
    'onboarding.equipment.subtitle': 'We keep a no-gear path always available. You can change this later.',
    'onboarding.equipment.bodyweight': 'Bodyweight only',
    'onboarding.equipment.bodyweightDesc': 'Train anywhere with no equipment.',
    'onboarding.equipment.continue': 'Continue',
    'equipment.pull_up_bar': 'Pull-up bar',
    'equipment.bands': 'Resistance bands',
    'equipment.parallettes': 'Parallettes / dip bars',
    'equipment.rings': 'Gymnastic rings',
    'equipment.dumbbells': 'Dumbbells',
  },
  es: {
```

- [ ] **Step 2: Add the Spanish keys**

In the `es` object, replace:
```ts
    'branch.skill': 'Skill',
  }
} as const;
```
with:
```ts
    'branch.skill': 'Skill',
    // Onboarding — equipment
    'onboarding.equipment.title': '¿Qué equipo tienes?',
    'onboarding.equipment.subtitle': 'Siempre dejamos una ruta sin equipo. Puedes cambiarlo después.',
    'onboarding.equipment.bodyweight': 'Solo peso corporal',
    'onboarding.equipment.bodyweightDesc': 'Entrena donde sea, sin equipo.',
    'onboarding.equipment.continue': 'Continuar',
    'equipment.pull_up_bar': 'Barra de dominadas',
    'equipment.bands': 'Bandas elásticas',
    'equipment.parallettes': 'Paralelas / parallettes',
    'equipment.rings': 'Anillas',
    'equipment.dumbbells': 'Mancuernas',
  }
} as const;
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors (identical 10 keys added to both tables).

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useTranslation.ts
git commit -m "feat(onboarding): equipment translation strings (en+es)"
```

---

## Task 2: Pure equipment module (TDD)

**Files:**
- Create: `lib/onboarding/equipment.ts`
- Test: `lib/onboarding/__tests__/equipment.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/onboarding/__tests__/equipment.test.ts`:
```ts
import {
  EQUIPMENT_OPTIONS,
  normalizeEquipmentSelection,
  isEquipmentCaptured,
} from '@/lib/onboarding/equipment';

describe('EQUIPMENT_OPTIONS', () => {
  it('lists the 5 focused gear keys in order', () => {
    expect(EQUIPMENT_OPTIONS.map((o) => o.key)).toEqual([
      'pull_up_bar', 'bands', 'parallettes', 'rings', 'dumbbells',
    ]);
  });
});

describe('normalizeEquipmentSelection', () => {
  it('returns ["none"] for an empty selection', () => {
    expect(normalizeEquipmentSelection([])).toEqual(['none']);
  });
  it('strips "none" when real gear is present', () => {
    expect(normalizeEquipmentSelection(['none', 'pull_up_bar'])).toEqual(['pull_up_bar']);
  });
  it('returns ["none"] when only "none" is given', () => {
    expect(normalizeEquipmentSelection(['none'])).toEqual(['none']);
  });
  it('dedupes and orders by EQUIPMENT_OPTIONS', () => {
    expect(normalizeEquipmentSelection(['rings', 'pull_up_bar', 'rings'])).toEqual(['pull_up_bar', 'rings']);
  });
  it('ignores unknown keys', () => {
    expect(normalizeEquipmentSelection(['pull_up_bar', 'spaceship'])).toEqual(['pull_up_bar']);
  });
});

describe('isEquipmentCaptured', () => {
  it('is false for empty/null/undefined', () => {
    expect(isEquipmentCaptured([])).toBe(false);
    expect(isEquipmentCaptured(null)).toBe(false);
    expect(isEquipmentCaptured(undefined)).toBe(false);
  });
  it('is true for any non-empty array (including ["none"])', () => {
    expect(isEquipmentCaptured(['none'])).toBe(true);
    expect(isEquipmentCaptured(['pull_up_bar'])).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test onboarding/__tests__/equipment
```
Expected: FAIL — cannot find module `@/lib/onboarding/equipment`.

- [ ] **Step 3: Write the implementation**

Create `lib/onboarding/equipment.ts`:
```ts
import type { TranslationKey } from '@/lib/hooks/useTranslation';

export interface EquipmentOption {
  key: string;
  labelKey: TranslationKey;
  icon: string;
}

/**
 * Focused calisthenics/home gear shown in onboarding.
 * 'none' (bodyweight) is the implicit baseline — NOT listed here.
 * Keys match the `equipment` tags used by skill-tree/challenge content.
 */
export const EQUIPMENT_OPTIONS: readonly EquipmentOption[] = [
  { key: 'pull_up_bar', labelKey: 'equipment.pull_up_bar', icon: '🏋️' },
  { key: 'bands',       labelKey: 'equipment.bands',       icon: '➰' },
  { key: 'parallettes', labelKey: 'equipment.parallettes', icon: '🤸' },
  { key: 'rings',       labelKey: 'equipment.rings',       icon: '⭕' },
  { key: 'dumbbells',   labelKey: 'equipment.dumbbells',   icon: '💪' },
];

const ORDER: readonly string[] = EQUIPMENT_OPTIONS.map((o) => o.key);

/**
 * Normalize a raw selection into what we persist in profiles.available_equipment.
 * - empty (or only unknown/'none') → ['none']  (captured, bodyweight only)
 * - otherwise → selected gear keys, deduped, 'none'/unknown stripped, in EQUIPMENT_OPTIONS order.
 */
export function normalizeEquipmentSelection(selected: string[]): string[] {
  const gear = ORDER.filter((k) => selected.includes(k));
  return gear.length > 0 ? gear : ['none'];
}

/** A profile has captured equipment once the array is non-empty. */
export function isEquipmentCaptured(equipment: string[] | null | undefined): boolean {
  return (equipment?.length ?? 0) > 0;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test onboarding/__tests__/equipment
```
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/equipment.ts lib/onboarding/__tests__/equipment.test.ts
git commit -m "feat(onboarding): pure equipment options + selection normalize"
```

---

## Task 3: Equipment selection screen

**Files:**
- Create: `app/onboarding/equipment.tsx`

Mirrors the dark/neon aesthetic of `goal.tsx`. "Solo peso corporal" is active when no gear is selected (mutual exclusivity emerges from `selected.length === 0`).

- [ ] **Step 1: Write the screen**

Create `app/onboarding/equipment.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentProfile, useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useTranslation } from '@/lib/hooks';
import { EQUIPMENT_OPTIONS, normalizeEquipmentSelection } from '@/lib/onboarding/equipment';

export default function EquipmentSelectionScreen() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();

  const [selected, setSelected] = useState<string[]>(
    (profile?.available_equipment ?? []).filter((k) => k !== 'none'),
  );
  const bodyweightOnly = selected.length === 0;

  const toggle = (key: string) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const handleContinue = async () => {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { available_equipment: normalizeEquipmentSelection(selected) },
      });
      router.replace('/(app)');
    } catch (error) {
      console.error('Failed to save equipment', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#19101C]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8 mt-8 gap-3">
          <Text className="text-[12px] font-bold tracking-[3px] text-zinc-500 uppercase">
            Personalización
          </Text>
          <Text className="text-[32px] font-black text-white text-center tracking-tighter leading-9">
            {tr('onboarding.equipment.title')}
          </Text>
          <Text className="text-base text-zinc-400 text-center leading-6 px-4">
            {tr('onboarding.equipment.subtitle')}
          </Text>
        </View>

        {/* Bodyweight baseline */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelected([])}
          className="rounded-2xl p-5 border mb-4 flex-row items-center gap-4"
          style={{
            backgroundColor: bodyweightOnly ? '#1E1428' : '#251C28',
            borderColor: bodyweightOnly ? '#BC13FE' : '#3b313e',
          }}
        >
          <View className="w-14 h-14 rounded-xl items-center justify-center" style={{ backgroundColor: bodyweightOnly ? '#BC13FE' : '#19101C' }}>
            <Text className="text-2xl">🧍</Text>
          </View>
          <View className="flex-1">
            <Text style={{ fontSize: 18, fontWeight: '900', color: bodyweightOnly ? '#fff' : '#eeddee', marginBottom: 4 }}>
              {tr('onboarding.equipment.bodyweight')}
            </Text>
            <Text style={{ fontSize: 13, color: bodyweightOnly ? '#BC13FE' : '#9d8ba0', lineHeight: 18 }}>
              {tr('onboarding.equipment.bodyweightDesc')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Gear chips */}
        <View className="gap-3">
          {EQUIPMENT_OPTIONS.map((opt) => {
            const isActive = selected.includes(opt.key);
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                onPress={() => toggle(opt.key)}
                className="rounded-2xl p-4 border flex-row items-center gap-4"
                style={{
                  backgroundColor: isActive ? '#1E1428' : '#251C28',
                  borderColor: isActive ? '#BC13FE' : '#3b313e',
                }}
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: isActive ? '#BC13FE' : '#19101C' }}>
                  <Text className="text-xl">{opt.icon}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: isActive ? '#fff' : '#eeddee', flex: 1 }}>
                  {tr(opt.labelKey)}
                </Text>
                <View
                  className="w-6 h-6 rounded-md border items-center justify-center"
                  style={{ borderColor: isActive ? '#BC13FE' : '#504254', backgroundColor: isActive ? '#BC13FE' : 'transparent' }}
                >
                  {isActive && <Text style={{ color: '#19101C', fontSize: 14, fontWeight: '900' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-8 pt-2">
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={updateProfile.isPending}
          onPress={handleContinue}
          className="h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: '#BC13FE', opacity: updateProfile.isPending ? 0.6 : 1 }}
        >
          <Text className="text-[13px] font-black tracking-[2px] uppercase text-white">
            {tr('onboarding.equipment.continue')}
          </Text>
        </TouchableOpacity>
      </View>
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
git add "app/onboarding/equipment.tsx"
git commit -m "feat(onboarding): equipment selection screen"
```

---

## Task 4: Wire the flow (goal → equipment → app) + guard

**Files:**
- Modify: `app/onboarding/goal.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Route to equipment after saving the goal**

In `app/onboarding/goal.tsx`, inside `handleSelect`, replace:
```ts
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { goal: goalId, full_name: name.trim() }
      });
      router.replace('/(app)');
```
with:
```ts
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { goal: goalId, full_name: name.trim() }
      });
      router.replace('/onboarding/equipment');
```

- [ ] **Step 2: Add the guard redirect**

In `app/_layout.tsx`, add the import after the existing `useCurrentProfile` import:
```ts
import { useCurrentProfile } from '@/lib/hooks/useProfiles';
import { isEquipmentCaptured } from '@/lib/onboarding/equipment';
```

Then in `AuthGuard`, replace:
```tsx
  if (isAuthenticated && profile && !profile.goal && !inOnboardingGroup) {
    return <Redirect href="/onboarding/goal" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(app)" />;
  }
```
with:
```tsx
  if (isAuthenticated && profile && !profile.goal && !inOnboardingGroup) {
    return <Redirect href="/onboarding/goal" />;
  }

  if (
    isAuthenticated &&
    profile &&
    profile.goal &&
    !isEquipmentCaptured(profile.available_equipment) &&
    !inOnboardingGroup
  ) {
    return <Redirect href="/onboarding/equipment" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(app)" />;
  }
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/onboarding/goal.tsx" "app/_layout.tsx"
git commit -m "feat(onboarding): wire goal→equipment→app + guard redirect"
```

---

## Task 5: Full verification + roadmap

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Full test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green, including the new `equipment` suite.

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Record progress in the roadmap**

In `docs/roadmap.md`, replace:
```markdown
5. Plan — Onboarding equipamiento (`available_equipment`) + gate de rutina al crear ← **SIGUIENTE**
```
with:
```markdown
5a. **Onboarding equipamiento** ✅ *completo* (pantalla `equipment` tras goal, módulo puro `lib/onboarding/equipment`, guard redirect, i18n; sin cambio de esquema). Spec → `superpowers/specs/2026-06-15-equipment-onboarding-design.md`, plan → `superpowers/plans/2026-06-15-equipment-onboarding.md`. ⚠️ Manual `pnpm start` diferido.
5b. Plan — **Gate de rutina al crear** (required_levels en `Routine.metadata` + prueba de aptitud) ← **SIGUIENTE**
```

- [ ] **Step 4: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs(roadmap): record equipment onboarding complete"
```

- [ ] **Step 5: Manual checklist (deferred — run when batching manual tests)**

With `pnpm start`, verify by hand:
- New user: goal → equipment screen appears → pick gear / or leave bodyweight → Continue → lands in app.
- Selecting any gear deselects "Solo peso corporal" and vice-versa.
- Re-opening the app does not re-show equipment once captured.
- An existing user (goal set, `available_equipment` empty) is sent to equipment once, then into the app.
- Language toggle flips the equipment labels.

---

## Self-Review

**Spec coverage:**
- §4 canonical keys + capture convention → Task 2 (`EQUIPMENT_OPTIONS`, `normalizeEquipmentSelection`, `isEquipmentCaptured`). ✅
- §5.1 pure module → Task 2. ✅
- §5.2 screen (bodyweight baseline + gear chips, persist) → Task 3. ✅
- §5.3 wiring (goal redirect + guard) → Task 4. ✅
- §5.4 i18n keys → Task 1. ✅
- §6 data flow (goal→equipment→app, guard) → Tasks 3, 4. ✅
- §8 testing (unit inline + typecheck; manual deferred) → Tasks 2, 5. ✅
- §7 out-of-scope (Perfil edit, content filtering, gate) → correctly absent. ✅

**Placeholder scan:** none — every step has concrete code/commands. Task 5 Step 5 is the intentionally-deferred manual checklist.

**Type consistency:**
- `EquipmentOption.labelKey: TranslationKey` (Task 2) ↔ keys added in Task 1 (`equipment.*`). Task 1 precedes Task 2 so typecheck passes. ✅
- `normalizeEquipmentSelection(selected: string[]): string[]` (Task 2) ↔ called in screen as `normalizeEquipmentSelection(selected)` with `selected: string[]` (Task 3). ✅
- `isEquipmentCaptured(equipment: string[] | null | undefined)` (Task 2) ↔ called with `profile.available_equipment` (`string[]` from `ProfileSchema`) in guard (Task 4). ✅
- `updateProfile.mutateAsync({ id, updates })` shape matches existing `goal.tsx` usage. ✅
