# Navigation Restructure (5 Tabs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the footer to the calisthenics IA — **Árbol · Entrenar · Ejercicios · Rutinas · Perfil** — with Entrenar as the factory-default tab, a localized tab bar, an Árbol placeholder screen, and a Perfil setting to open the app on Árbol. Pure structural change: no existing screen's content is redesigned.

**Architecture:** Add a tiny **pure** helper (`resolveStartRoute`) + a Zustand `settingsStore` (AsyncStorage, mirroring `themeStore`) for the start-tab preference. Add localized footer labels via the existing `useTranslation` table. The tab navigator (`app/(app)/_layout.tsx`) swaps Agenda out of the footer for a new `tree` route and redirects once on cold start to the chosen start tab. The Árbol screen is a branded placeholder (no avatar, no hooks). Only the pure helper is unit-tested; the rest is RN/expo-router config verified by `tsc` + a manual checklist.

**Tech Stack:** React Native + Expo Router v6, Zustand v5, AsyncStorage, NativeWind v4, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-06-14-nav-restructure-5-tabs-design.md`
**Builds on:** the skill-tree data layer (`docs/superpowers/plans/2026-06-14-skill-tree-data-layer.md`).

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/utils/startTab.ts` | **Pure** `StartTab` type + `resolveStartRoute(raw)` (normalize persisted value → valid tab) |
| `lib/utils/__tests__/startTab.test.ts` | Unit test for `resolveStartRoute` |
| `lib/store/settingsStore.ts` | Zustand store: `startTab` + `loadStartTab`/`setStartTab` (AsyncStorage) |
| `lib/hooks/useTranslation.ts` | Add `tabs.*` + `tree.*` translation keys (en + es) |
| `app/(app)/tree.tsx` | New Árbol placeholder screen (branded, no avatar, no hooks) |
| `app/(app)/_layout.tsx` | Tab bar route set/order + localized labels + register `tree`, hide `agenda` + cold-start redirect |
| `app/(app)/profile.tsx` | "Start Screen" preference row + modal |

### Repo-state caveats (read before executing)

- **`app/(app)/_layout.tsx` has 2 pre-existing uncommitted lines** (registering `routine-start` and `routine-detail` as hidden screens — the user's routine WIP). They are **required** for the working tree (otherwise those screens would appear as tabs), so they are **kept** and will ride along in Task 5's commit. That is expected; the user will commit the corresponding screen files with their routine feature. Do NOT remove them.
- **Do NOT touch `app/(app)/index.tsx`** — it has unrelated uncommitted WIP and this increment does not change its content (the Entrenar label lives in `_layout.tsx`).
- `profile.tsx` and `useTranslation.ts` are clean (committed) — safe to `git add` directly.
- Use targeted `git add <path>` per task. NEVER `git add -A`/`git add .` (the tree has ~50 unrelated WIP files).

---

## Task 1: Pure start-tab resolver

**Files:**
- Create: `lib/utils/startTab.ts`
- Test: `lib/utils/__tests__/startTab.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/utils/__tests__/startTab.test.ts`:
```ts
import { resolveStartRoute } from '@/lib/utils/startTab';

describe('resolveStartRoute', () => {
  it('defaults to index for null/undefined', () => {
    expect(resolveStartRoute(null)).toBe('index');
    expect(resolveStartRoute(undefined)).toBe('index');
  });

  it('defaults to index for an unrecognized value', () => {
    expect(resolveStartRoute('profile')).toBe('index');
    expect(resolveStartRoute('')).toBe('index');
  });

  it('keeps index', () => {
    expect(resolveStartRoute('index')).toBe('index');
  });

  it('resolves tree', () => {
    expect(resolveStartRoute('tree')).toBe('tree');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test startTab
```
Expected: FAIL — cannot find module `@/lib/utils/startTab`.

- [ ] **Step 3: Write the implementation**

Create `lib/utils/startTab.ts`:
```ts
export type StartTab = 'index' | 'tree';

/**
 * Normalize a persisted/raw start-tab value to a valid tab route.
 * Defaults to 'index' (the Entrenar tab) for anything unrecognized.
 */
export function resolveStartRoute(raw: string | null | undefined): StartTab {
  return raw === 'tree' ? 'tree' : 'index';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test startTab
```
Expected: PASS — `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/startTab.ts lib/utils/__tests__/startTab.test.ts
git commit -m "feat(nav): pure start-tab resolver"
```

---

## Task 2: Settings store (start-tab preference)

**Files:**
- Create: `lib/store/settingsStore.ts`

This store imports AsyncStorage (a React Native module) so it is NOT unit-tested under the Node jest setup — mirroring `themeStore`/`languageStore`, which are also untested. Verification = `pnpm typecheck`.

- [ ] **Step 1: Write the store**

Create `lib/store/settingsStore.ts`:
```ts
/**
 * Settings store — app-level preferences that aren't theme/language.
 * Currently: which tab the app opens on (Entrenar by default, or Árbol).
 * Persists via AsyncStorage, mirroring themeStore.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveStartRoute, type StartTab } from '@/lib/utils/startTab';

const START_TAB_STORAGE_KEY = 'gymflow_start_tab';

interface SettingsState {
  startTab: StartTab;
  isLoaded: boolean;
  loadStartTab: () => Promise<void>;
  setStartTab: (tab: StartTab) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  startTab: 'index',
  isLoaded: false,

  loadStartTab: async () => {
    try {
      const stored = await AsyncStorage.getItem(START_TAB_STORAGE_KEY);
      set({ startTab: resolveStartRoute(stored), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setStartTab: async (tab: StartTab) => {
    try {
      await AsyncStorage.setItem(START_TAB_STORAGE_KEY, tab);
      set({ startTab: tab });
    } catch {
      // Keep the in-memory choice even if persistence fails.
      set({ startTab: tab });
    }
  },
}));
```

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/store/settingsStore.ts
git commit -m "feat(nav): settings store for start-tab preference"
```

---

## Task 3: Localized footer + Árbol placeholder strings

**Files:**
- Modify: `lib/hooks/useTranslation.ts`

`TranslationKey` is derived from `keyof typeof TRANSLATIONS.en`, and `t()` indexes the active-language table by that key — so every new key MUST be added to **both** `en` and `es` (identical key sets) or `tsc` fails.

- [ ] **Step 1: Add the English keys**

In `lib/hooks/useTranslation.ts`, in the `en` object, immediately after the line `'tabata.repeatWorkout': 'Repeat Workout',` add:
```ts
    // Tabs (footer)
    'tabs.tree': 'Tree',
    'tabs.train': 'Train',
    'tabs.exercises': 'Exercises',
    'tabs.routines': 'Routines',
    'tabs.profile': 'Profile',
    // Skill tree (placeholder)
    'tree.title': 'Skill Tree',
    'tree.comingSoon': 'Coming soon',
    'tree.subtitle': 'Unlock the muscle-up, handstand, planche and more — your path, one node at a time.',
```

- [ ] **Step 2: Add the Spanish keys**

In the same file, in the `es` object, immediately after the line `'tabata.repeatWorkout': 'Repetir',` add:
```ts
    // Tabs (footer)
    'tabs.tree': 'Árbol',
    'tabs.train': 'Entrenar',
    'tabs.exercises': 'Ejercicios',
    'tabs.routines': 'Rutinas',
    'tabs.profile': 'Perfil',
    // Skill tree (placeholder)
    'tree.title': 'Árbol de skills',
    'tree.comingSoon': 'Próximamente',
    'tree.subtitle': 'Desbloquea el muscle-up, el pino, la plancha y más — tu camino, nodo a nodo.',
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (If `tsc` complains a key is missing in one language, confirm both `en` and `es` got the identical 8 keys.)

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useTranslation.ts
git commit -m "feat(nav): localized tab labels + tree placeholder strings"
```

---

## Task 4: Árbol placeholder screen

**Files:**
- Create: `app/(app)/tree.tsx`

The route file must exist before `_layout.tsx` (Task 5) registers `<Tabs.Screen name="tree" />`. Branded placeholder only — no avatar slicing, no skill-tree hooks (those are increment #3).

- [ ] **Step 1: Write the screen**

Create `app/(app)/tree.tsx`:
```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';

export default function TreeScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-2 mb-8">
          <View
            className="flex-row items-center gap-2 border rounded-full px-3 py-1 self-start"
            style={{ backgroundColor: `${t.primaryContainer}22`, borderColor: `${t.primaryContainer}44` }}
          >
            <Text className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: t.primaryContainer }}>
              {tr('tree.comingSoon')}
            </Text>
          </View>
          <Text className="text-[48px] font-extrabold tracking-tighter leading-[52px]" style={{ color: t.onSurface }}>
            {tr('tree.title')}
          </Text>
          <Text className="text-base leading-6" style={{ color: t.onSurfaceVariant }}>
            {tr('tree.subtitle')}
          </Text>
        </View>

        {/* Placeholder panel */}
        <View
          className="rounded-2xl border items-center justify-center"
          style={{
            backgroundColor: t.surfaceContainer,
            borderColor: t.surfaceContainerHighest,
            minHeight: 280,
          }}
        >
          <Text style={{ fontSize: 72, color: t.surfaceContainerHighest }}>◬</Text>
          <Text className="text-sm mt-3" style={{ color: t.onSurfaceVariant }}>
            {tr('tree.comingSoon')}
          </Text>
        </View>
      </ScrollView>
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
git commit -m "feat(nav): Árbol placeholder screen"
```

---

## Task 5: Tab navigator restructure + cold-start redirect

**Files:**
- Modify: `app/(app)/_layout.tsx` (full replacement below)

Replaces the whole file. Changes vs. current: footer route set/order = `tree, index, exercises, routines, profile`; localized labels via `useTranslation`; `agenda` moved to hidden; `tree` registered; load + redirect to the chosen start tab once on cold start. The 2 pre-existing WIP lines (`routine-start`, `routine-detail`) are preserved in the hidden block (required for the working tree).

- [ ] **Step 1: Replace the file**

Overwrite `app/(app)/_layout.tsx` with:
```tsx
import React, { useEffect, useRef } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCurrentProfile, useTranslation } from '@/lib/hooks';
import type { TranslationKey } from '@/lib/hooks/useTranslation';
import { LoadingScreen } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useTheme } from '@/lib/hooks/useTheme';
import { cn } from '@/lib/utils/cn';

// Visible tabs, in footer order. Entrenar (index) is the factory default.
const TAB_ORDER = ['tree', 'index', 'exercises', 'routines', 'profile'] as const;

const TAB_META: Record<string, { outline: string; fill: string; labelKey: TranslationKey }> = {
  tree:      { outline: '◬', fill: '◬', labelKey: 'tabs.tree' },
  index:     { outline: '⌂', fill: '⌂', labelKey: 'tabs.train' },
  exercises: { outline: '◈', fill: '◈', labelKey: 'tabs.exercises' },
  routines:  { outline: '≡', fill: '≡', labelKey: 'tabs.routines' },
  profile:   { outline: '◯', fill: '●', labelKey: 'tabs.profile' },
};

function StitchTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  // Only render the 5 primary tabs (hide hidden screens), in TAB_ORDER.
  const visibleRoutes = state.routes.filter((r) =>
    (TAB_ORDER as readonly string[]).includes(r.name)
  );

  return (
    <View
      className="flex-row h-20 border-t shadow-2xl elevation-2xl"
      style={{
        backgroundColor: t.background + 'EE',
        borderTopColor: t.surfaceContainerHighest,
        shadowColor: '#000',
        paddingBottom: Platform.OS === 'ios' ? 16 : 8,
      }}
    >
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
        const meta = TAB_META[route.name] ?? { outline: '○', fill: '●', labelKey: 'tabs.train' as TranslationKey };
        const label = tr(meta.labelKey);
        const color = isFocused ? t.primaryContainer : 'rgba(255,255,255,0.4)';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center relative pt-1.5"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            {isFocused && (
              <View
                className="absolute -top-0.5 w-10 h-1 rounded-sm"
                style={{ backgroundColor: t.primaryContainer }}
              />
            )}
            <Text
              className="text-[22px] mb-0.5"
              style={[
                { color },
                isFocused && {
                  textShadowColor: t.glowPrimary,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10,
                },
              ]}
            >
              {isFocused ? meta.fill : meta.outline}
            </Text>
            <Text
              className={cn(
                'text-[10px] uppercase tracking-widest',
                isFocused ? 'font-bold' : 'font-medium'
              )}
              style={{ color }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { data: profile, isLoading } = useCurrentProfile();
  const { loadTheme, isLoaded } = useThemeStore();
  const { startTab, isLoaded: startTabLoaded, loadStartTab } = useSettingsStore();
  const didRedirect = useRef(false);

  // Load persisted prefs on mount
  useEffect(() => {
    loadTheme();
    loadStartTab();
  }, []);

  // Cold-start redirect to the user's chosen start tab (exactly once).
  useEffect(() => {
    if (startTabLoaded && !didRedirect.current) {
      didRedirect.current = true;
      if (startTab !== 'index') {
        router.replace(`/${startTab}`);
      }
    }
  }, [startTabLoaded, startTab]);

  if (isLoading || !isAuthenticated || !isLoaded || !startTabLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <StitchTabBar {...props} />}
    >
      <Tabs.Screen name="tree" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="exercises" />
      <Tabs.Screen name="routines" />
      <Tabs.Screen name="profile" />
      {/* Hidden screens — not in bottom nav */}
      <Tabs.Screen name="agenda" options={{ href: null }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="workout-session" options={{ href: null }} />
      <Tabs.Screen name="day-detail" options={{ href: null }} />
      <Tabs.Screen name="routine-start" options={{ href: null }} />
      <Tabs.Screen name="routine-detail" options={{ href: null }} />
      <Tabs.Screen name="routine-builder" options={{ href: null }} />
      <Tabs.Screen name="import-routine" options={{ href: null }} />
      <Tabs.Screen name="exercise/[id]" options={{ href: null }} />
      <Tabs.Screen name="share/[id]" options={{ href: null }} />
      <Tabs.Screen name="timer" options={{ href: null }} />
      <Tabs.Screen name="timer-active" options={{ href: null }} />
      <Tabs.Screen name="tabata" options={{ href: null }} />
      <Tabs.Screen name="tabata-active" options={{ href: null }} />
      <Tabs.Screen name="tabata-summary" options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors. (If `tsc` cannot find `tabs.tree`/`tabs.train` on `TranslationKey`, Task 3 was not applied.)

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/_layout.tsx"
git commit -m "feat(nav): 5-tab footer (Árbol/Entrenar default) + start-tab redirect"
```
Note: this commit also includes the 2 pre-existing WIP lines (`routine-start`/`routine-detail` hidden registration). That is expected and required — do not strip them.

---

## Task 6: Perfil "Start Screen" setting

**Files:**
- Modify: `app/(app)/profile.tsx`

Adds a Preferences row + a bottom-sheet modal (mirroring the existing Language modal) that writes `setStartTab('index' | 'tree')`. Option labels reuse the localized tab names.

- [ ] **Step 1: Add imports + hooks state**

In `app/(app)/profile.tsx`, change the import line:
```ts
import { useCurrentProfile, useTranslation } from '@/lib/hooks';
```
to also import the settings store and the `StartTab` type — add these two lines right after it:
```ts
import { useSettingsStore } from '@/lib/store/settingsStore';
import type { StartTab } from '@/lib/utils/startTab';
```

Then, inside `ProfileScreen`, change:
```ts
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { language, setLanguage } = useTranslation();
```
to:
```ts
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [startTabModalVisible, setStartTabModalVisible] = useState(false);
  const { t: tr, language, setLanguage } = useTranslation();
  const { startTab, setStartTab } = useSettingsStore();
```

- [ ] **Step 2: Add the Preferences row**

In the Preferences list, after the Language `TouchableOpacity` block and the `<View className="h-[1px]" ... />` divider that follows it (i.e., immediately before the `{/* Units */}` comment), insert:
```tsx
            {/* Start Screen */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-6 min-h-[72px]"
              activeOpacity={0.7}
              onPress={() => setStartTabModalVisible(true)}
            >
              <View className="flex-row items-center gap-4">
                <Text className="text-xl" style={{ color: t.onSurfaceVariant }}>🚀</Text>
                <View className="gap-0.5">
                  <Text className="text-lg font-medium text-white">Start Screen</Text>
                  <Text className="text-sm leading-5" style={{ color: t.onSurfaceVariant }}>
                    {startTab === 'tree' ? tr('tabs.tree') : tr('tabs.train')}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl" style={{ color: t.onSurfaceVariant }}>›</Text>
            </TouchableOpacity>

            <View className="h-[1px]" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
```

- [ ] **Step 3: Add the modal**

Immediately before the closing `</SafeAreaView>` tag (after the Language Selector `</Modal>`), insert:
```tsx
      {/* ── Start Screen Selector Modal ── */}
      <Modal
        visible={startTabModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStartTabModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          activeOpacity={1}
          onPress={() => setStartTabModalVisible(false)}
        >
          <View
            className="rounded-t-[20px] border-t p-6 pb-12 gap-3"
            style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceVariant }}
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-[22px] font-bold mb-1 text-white">Start Screen</Text>
            <Text className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Which tab the app opens on
            </Text>

            {([
              { id: 'index' as StartTab, label: tr('tabs.train') },
              { id: 'tree' as StartTab, label: tr('tabs.tree') },
            ]).map((opt) => {
              const isActive = startTab === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  className="flex-row items-center rounded-xl border p-4 gap-4 min-h-[64px]"
                  style={{
                    backgroundColor: isActive ? `${t.primaryContainer}18` : 'rgba(255,255,255,0.04)',
                    borderColor: isActive ? t.primaryContainer : 'rgba(255,255,255,0.1)',
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    setStartTab(opt.id);
                    setStartTabModalVisible(false);
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">{opt.label}</Text>
                    {isActive && (
                      <Text className="text-[12px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>
                        Active
                      </Text>
                    )}
                  </View>
                  {isActive && (
                    <Text className="text-xl font-bold" style={{ color: t.primaryContainer }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              className="h-12 border rounded-lg items-center justify-center mt-2"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              onPress={() => setStartTabModalVisible(false)}
            >
              <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
```

- [ ] **Step 4: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/profile.tsx"
git commit -m "feat(nav): Perfil start-screen preference (Entrenar/Árbol)"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run:
```bash
pnpm test
```
Expected: PASS — all suites green, including the new `startTab` suite (`4 passed`).

- [ ] **Step 2: Typecheck the whole project**

Run:
```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Manual checklist (run the app — `pnpm start`)**

Not unit-testable (RN/expo-router). Verify by hand:
- Footer shows exactly 5 tabs in order: **Árbol · Entrenar · Ejercicios · Rutinas · Perfil** (labels follow the app language).
- App opens on **Entrenar** by default.
- **Agenda is no longer a footer tab**, but `router.push('/agenda')` still reaches it.
- **Árbol** tab shows the placeholder (header + "Próximamente" panel), no crash.
- Perfil → **Start Screen** → choose **Árbol** → fully close & reopen the app → it opens on **Árbol**. Switch back to **Entrenar** → reopens on Entrenar.

---

## Self-Review

**Spec coverage:**
- §2 IA — 5 tabs Árbol/Entrenar/Ejercicios/Rutinas/Perfil, Entrenar default, Agenda hidden → Task 5. ✅
- §2 localized labels → Task 3 + Task 5 (StitchTabBar uses `tr(meta.labelKey)`). ✅
- §3.1 tab navigator (route set/order, register tree, hide agenda) → Task 5. ✅
- §3.2 Árbol placeholder (no avatar, no hooks) → Task 4. ✅
- §3.3 `resolveStartRoute` pure + tested, `settingsStore` (AsyncStorage) → Tasks 1 + 2. ✅
- §3.4 cold-start redirect (once, `router.replace`, `useRef` guard) → Task 5. ✅
- §3.5 Perfil start-tab setting (Entrenar/Árbol) → Task 6. ✅
- §5 testing — `resolveStartRoute` unit-tested; rest tsc + manual checklist → Tasks 1 + 7. ✅
- *Out of scope (deferred):* Agenda→Entrenar merge, registro de series (#2); tree viz, avatar, retos, `markChallengeStatus` (#3); equipment onboarding, gate, paywall, seeding (later). Correctly absent.

**Placeholder scan:** none — every step has concrete code/commands. ("Placeholder" refers only to the intentional Árbol placeholder screen.)

**Type consistency:**
- `StartTab = 'index' | 'tree'` defined in Task 1, reused by `settingsStore` (Task 2), `_layout.tsx` redirect (Task 5), and `profile.tsx` modal (Task 6). ✅
- `resolveStartRoute` signature `(string | null | undefined) => StartTab` matches `settingsStore`'s `getItem` result (`string | null`). ✅
- `TranslationKey` keys `tabs.tree|train|exercises|routines|profile` + `tree.title|comingSoon|subtitle` added in Task 3 and consumed in Tasks 4–6. ✅
- `useSettingsStore` fields (`startTab`, `isLoaded`, `loadStartTab`, `setStartTab`) defined in Task 2 and used exactly so in Tasks 5 & 6. ✅
- `TAB_ORDER`/`TAB_META` route names match the registered `<Tabs.Screen>` names and the existing route files (`tree`, `index`, `exercises`, `routines`, `profile`). ✅
