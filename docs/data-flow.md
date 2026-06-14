---
tags: [data-flow, gym-flow-app]
---

# Data Flow

Ver también: [[services]], [[stores]], [[entities]]

## Flujo 1 — Autenticación

```
Usuario abre app
    │
    ▼
RootLayout.useEffect → authStore.initialize()
    │                         │
    │               supabase.auth.getSession()
    │                         │
    │               ┌─────────┴──────────┐
    │            sesión ok          sin sesión
    │               │                    │
    │         set isAuthenticated=true   set isAuthenticated=false
    │               │                    │
    ▼               ▼                    ▼
AuthGuard      → (app)/tabs        → (auth)/login
    │
    └── también evalúa profile.goal
              │
           sin goal → onboarding/goal
```

Auth tokens se guardan en `expo-secure-store` (encriptado, nativo).
`onAuthStateChange` mantiene el store sincronizado con cambios de sesión externos.

## Flujo 2 — Cargar rutinas

```
routines.tsx monta
    │
    ▼
useRoutines hook (React Query)
    │
    ├── queryKey: ['routines', profile.id]
    │
    ▼
routinesApi.list(profile)
    │
    ▼
supabase.from('routines').select(* + join routine_exercises + join exercises)
    │
    ▼
Zod parse (RoutineWithExercisesSchema.array())
    │
    ▼
React Query cache → UI render
```

React Query gestiona loading/error/stale. Sin invalidación explícita → refetch on focus.

## Flujo 3 — Crear/editar rutina

```
routine-builder.tsx
    │
    ├── Estado local (useState) — nombre, ejercicios añadidos
    │
    ▼
Submit → upsertRoutine(userId, routineId, name, exercises)
    │
    ├── routineId=null → INSERT routine → INSERT routine_exercises
    │
    └── routineId!=null → UPDATE routine name
                        → DELETE all routine_exercises WHERE routine_id
                        → INSERT nuevos routine_exercises
    │
    ▼
queryClient.invalidateQueries(['routines']) → refetch
```

## Flujo 4 — Sesión de workout semanal

```
Usuario completa ejercicio
    │
    ▼
sessionStore.toggleExercise(routineExercise.id)
    │
    ▼
AsyncStorage.setItem('gym-flow-session-storage', ...)
    │
    ▼ (al volver a abrir la app o cambiar de semana)
sessionStore.checkAndResetWeekly(currentWeekStart)
    │
    ├── weekStartDate === currentWeekStart → sin cambios
    └── weekStartDate !== currentWeekStart → reset completedDays + completedExercises
```

## Flujo 5 — Compartir rutina

```
Usuario crea share en routine-detail.tsx
    │
    ▼
sharesApi.create(routineId, shareType)
    │
    ▼
INSERT routine_shares → genera share_code único
    │
    ▼
UI muestra QR o código de texto
    │
    ▼ (receptor)
import-routine.tsx → sharesApi.accept(shareCode)
    │
    ▼
Copia routine + routine_exercises bajo el nuevo user_id
```

## Flujo 7 — Registro de serie → árbol + readiness (Plan 2, data layer)

```
Usuario registra una serie (reps o segundos) en Entrenar
    │
    ▼
useLogSet(userId).mutate({ exercise_id, reps, seconds })
    │
    ├─ 1. workoutLogsApi.log()            → INSERT workout_logs (fuente de verdad)
    │
    ├─ 2. skillTreeApi.syncSkillProgress(userId)
    │        lee exercise_progressions + workout_logs
    │        → deriveSkillProgressRows() [PURO: best, computeStatuses, in_progress]
    │        → upsert user_skill_progress (preserva mastered_at)
    │
    └─ 3. challengesApi.syncChallengeProgress(userId)
             lee challenges + workout_logs
             → deriveChallengeProgressRows() [PURO: computeReadiness]
             → upsert user_challenge_progress (preserva attempted/achieved)
    │
    ▼
onSuccess → invalidateQueries(['workoutLogs',uid], ['skillProgress',uid], ['challengeProgress',uid])
    │
    ▼
El árbol y la barra de readiness refrescan automáticamente
```

Los motores (`lib/skills/`) son funciones puras testeadas; los `*Api.sync*` solo hacen I/O. Ver [[services]] y [[architecture]].

## Flujo 6 — Timer Tabata

```
tabata.tsx — configuración
    │
    ▼
tabataStore.setConfig(config) → AsyncStorage persist
    │
    ▼
router.push('tabata-active')
    │
    ▼
tabata-active.tsx — consume tabataStore.config
    │
    ▼ (al terminar)
router.push('tabata-summary')
```
