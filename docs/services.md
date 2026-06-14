---
tags: [services, api, supabase, gym-flow-app]
---

# Services

Capa de acceso a datos en `lib/api/`. Todas las funciones son async y lanzan excepciones en error.
Los hooks de React Query en `lib/hooks/` envuelven estas funciones.

Ver también: [[entities]], [[data-flow]]

## Supabase client (`lib/supabase.ts`)

```ts
supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,   // tokens en SecureStore
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})
```

Variables de entorno: `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## authApi (`lib/api/auth.ts`)

Operaciones de autenticación Supabase (signIn, signUp, signOut, resetPassword).

## profilesApi (`lib/api/profiles.ts`)

CRUD de perfiles de usuario en tabla `profiles`.

## exercisesApi (`lib/api/exercises.ts`)

Queries a tabla `exercises`. Soporta filtros por categoría/muscle_group/difficulty.

## routinesApi (`lib/api/routines.ts`)

```
routinesApi.list(profile)         → RoutineWithExercises[]
routinesApi.getById(id)           → RoutineWithExercises | null
routinesApi.create(profile, routine, exercises) → RoutineWithExercises

deleteRoutine(id)                 → void
upsertRoutine(userId, routineId, name, exercises) → string (routineId)
```

Las queries usan join eager: `routine_exercises(*,exercise:exercises(*))`.

`upsertRoutine` hace delete+reinsert de exercises (no patch incremental).

## scheduleApi / schedulesApi (`lib/api/schedule.ts`, `lib/api/schedules.ts`)

CRUD de `workout_schedules`. Mapea rutinas a días de la semana (0-6).

> ⚠️ verificar — hay dos archivos (`schedule.ts` y `schedules.ts`). Consolidar o confirmar cuál es el activo.

## sharesApi (`lib/api/shares.ts`)

Crear y consumir `routine_shares`. Genera share_code único. Soporta tipos `code` y `qr`.

## streakApi (`lib/api/streak.ts`)

Lee y actualiza `user_streaks` — current/longest streak y días completados en la semana actual.

## presetsApi (`lib/api/presets.ts`)

Rutinas preset/plantillas (`getPresetRoutines`, `importPresetRoutine`). Consumido directamente por `app/(app)/routine-start.tsx`. **WIP del usuario sin commitear** (el archivo está untracked; ver aviso en [[roadmap]]).

## Capa de datos del árbol de skills (Plan 2 — 2026-06-14)

Conecta los motores puros de `lib/skills/` con Supabase. Toda la lógica determinista vive en funciones puras (`lib/skills/derive.ts`, testeadas); estos módulos solo hacen I/O + orquestación.

### workoutLogsApi (`lib/api/workoutLogs.ts`)
```
workoutLogsApi.log(userId, { exercise_id, reps, seconds }) → WorkoutLog   // inserta una serie
workoutLogsApi.listForUser(userId) → WorkoutLog[]                          // historial, newest first
```
Los `workout_logs` son la **fuente de verdad**; el "best" por ejercicio se recalcula de ellos.

### skillTreeApi (`lib/api/skillTree.ts`)
```
skillTreeApi.listProgressions() → ExerciseProgression[]        // grafo público (contenido)
skillTreeApi.listSkillProgress(userId) → UserSkillProgress[]   // estado persistido por usuario
skillTreeApi.syncSkillProgress(userId) → UserSkillProgress[]   // recalcula estados+best y upsert
```
`syncSkillProgress` lee progresiones+logs, llama `deriveSkillProgressRows` (puro), deriva `in_progress`, preserva `mastered_at`, y hace upsert con `onConflict: 'user_id,exercise_id'`.

### challengesApi (`lib/api/challenges.ts`)
```
challengesApi.listChallenges() → Challenge[]                            // catálogo público
challengesApi.listChallengeProgress(userId) → UserChallengeProgress[]
challengesApi.syncChallengeProgress(userId) → UserChallengeProgress[]   // recalcula readiness
```
`syncChallengeProgress` usa `deriveChallengeProgressRows` (puro); **preserva** `attempted`/`achieved` (solo refresca `readiness` y mueve `locked ⇄ ready`). `readiness_rule` jsonb = `{ requirements: [{ exercise_id, target_reps?, target_seconds? }] }`.

> Pendiente para el plan de UI: `markChallengeStatus(userId, challengeId, status)` para el botón "Intentar reto" (el sync ya preserva esos estados una vez puestos).

## Hooks de React Query (`lib/hooks/`)

| Hook | API que envuelve |
|---|---|
| `useRoutines` | routinesApi.list |
| `useExercises` | exercisesApi |
| `useSchedule` | scheduleApi |
| `useShares` | sharesApi |
| `useProfiles` / `useCurrentProfile` | profilesApi |
| `useLocalMedia` | assets locales (lib/utils/mediaMap.ts) |
| `useWorkoutLogs(userId)` | workoutLogsApi.listForUser |
| `useLogSet(userId)` | mutación: log + syncSkill + syncChallenge → invalida caché |
| `useProgressions()` | skillTreeApi.listProgressions |
| `useSkillProgress(userId)` | skillTreeApi.listSkillProgress |
| `useChallenges()` | challengesApi.listChallenges |
| `useChallengeProgress(userId)` | challengesApi.listChallengeProgress |
