---
tags: [architecture, gym-flow-app]
---

# Architecture

Ver también: [[entities]], [[screens]], [[stores]], [[services]]

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Estado | Zustand v5 |
| Data fetching | TanStack React Query v5 |
| Styling | NativeWind v4 (Tailwind para RN) |
| Validación | Zod v4 |
| Auth storage | expo-secure-store |
| Persistencia local | AsyncStorage |

## Capas

```
┌─────────────────────────────────────────────┐
│            app/ (Expo Router)               │
│   (auth)/  |  (app)/tabs+screens  |  onboarding/  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│         lib/hooks/  (React Query hooks)     │
│   useRoutines, useExercises, useSchedule…   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│           lib/api/  (API layer)             │
│   routinesApi, exercisesApi, authApi,       │
│   workoutLogsApi, skillTreeApi, challengesApi │
└──────────┬──────────────────────┬───────────┘
           │                      │
           │          ┌───────────▼───────────────┐
           │          │  lib/skills/ (motores PUROS) │
           │          │  unlock · readiness · derive │
           │          │  routineGate · avatar · equip │
           │          │  (sin Supabase/RN, testeados) │
           │          └──────────────────────────────┘
           ▼
┌─────────────────────────────────────────────┐
│         lib/supabase.ts (Supabase JS)       │
│   PostgreSQL RLS + Auth + Storage CDN       │
└─────────────────────────────────────────────┘

Estado global (transversal):
┌──────────────────────────────────────────────┐
│  lib/store/  (Zustand)                       │
│  authStore | themeStore | languageStore      │
│  sessionStore | tabataStore                  │
└──────────────────────────────────────────────┘
```

## Principio central

App mobile-first con backend Supabase. Sin offline-first real: los datos se leen desde Supabase en tiempo de ejecución con React Query como caché. El estado de sesión de workout se persiste localmente en AsyncStorage (reseteo semanal automático).

**Motores deterministas (`lib/skills/`)**: la lógica del árbol de skills (desbloqueos, readiness, gate de rutina, estado del avatar) son **funciones puras** sin dependencias de Supabase/RN, testeadas con Jest. Los `*Api.sync*` de `lib/api/` hacen el I/O (leer logs/progresiones → llamar al motor puro → upsert estado). Ver [[services]] y [[data-flow]] (Flujo 7).

## Secuencia de arranque

```
RootLayout monta
  │
  ├── initialize()      → supabase.auth.getSession()
  ├── loadTheme()       → AsyncStorage 'gymflow_theme'
  └── loadLanguage()    → AsyncStorage 'gymflow_language'
          │
          ▼
      AuthGuard evalúa:
          │
          ├── !isAuthenticated       → Redirect /(auth)/login
          ├── !profile.goal          → Redirect /onboarding/goal
          └── ok                     → Render (app)/ tabs
```

## Design system

- Estética "Stitch dark neon" — fondos oscuros (#19101c base)
- Dos temas: **Neon Purple** (default, `#bc13fe`) y **Neon Orange** (`#ff5f1f`)
- Custom tab bar (`StitchTabBar`) con indicador superior y glow effect
- Tokens en `lib/store/themeStore.ts` → acceso via `useTheme()` hook
