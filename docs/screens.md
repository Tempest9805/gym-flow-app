---
tags: [screens, routing, gym-flow-app]
---

# Screens

Framework de routing: **Expo Router v6** (file-based). Todas las rutas en `app/`.

Ver también: [[architecture]], [[data-flow]]

## Mapa de rutas

```
app/
├── _layout.tsx          RootLayout — providers + AuthGuard
│
├── (auth)/              Grupo de autenticación (no requiere sesión)
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── sign-up.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   └── email-confirmed.tsx
│
├── onboarding/          Onboarding post-registro
│   ├── _layout.tsx
│   └── goal.tsx         Selección de objetivo de fitness
│
└── (app)/               Grupo principal (requiere sesión + profile.goal)
    ├── _layout.tsx      Tabs + StitchTabBar custom
    │
    │   ── TABS VISIBLES (bottom nav) ──
    ├── index.tsx         Home — dashboard / resumen semanal
    ├── exercises.tsx     Exercise library — búsqueda y filtros
    ├── agenda.tsx        Agenda semanal
    ├── routines.tsx      Lista de rutinas
    ├── profile.tsx       Perfil de usuario
    │
    │   ── PANTALLAS OCULTAS (no en nav) ──
    ├── workout.tsx            Workout (modo no-sesión)
    ├── workout-session.tsx    Sesión activa de workout
    ├── day-detail.tsx         Detalle del día en agenda
    ├── routine-start.tsx      Pantalla pre-inicio de rutina
    ├── routine-detail.tsx     Detalle de rutina
    ├── routine-builder.tsx    Crear/editar rutinas
    ├── import-routine.tsx     Importar rutina desde share
    ├── exercise/[id].tsx      Detalle de ejercicio
    ├── share/[id].tsx         Pantalla de share recibido
    ├── timer.tsx              Configuración de timer
    ├── timer-active.tsx       Timer activo
    ├── tabata.tsx             Configuración Tabata
    ├── tabata-active.tsx      Sesión Tabata activa
    └── tabata-summary.tsx     Resumen post-Tabata
```

## Flujo de navegación principal

```
App launch
    │
    ▼
AuthGuard
    ├── Sin sesión ──────────────────► (auth)/login
    │                                       │
    │                                  sign-up / forgot-password
    │
    ├── Sesión, sin goal ────────────► onboarding/goal
    │
    └── Sesión + goal ───────────────► (app)/index (Home)
                                            │
                            ┌───────────────┼────────────────┐
                            ▼               ▼                ▼
                        exercises        agenda          routines
                            │                               │
                     exercise/[id]              routine-detail / routine-builder
                                                            │
                                                      routine-start
                                                            │
                                                    workout-session
```

## Bottom Navigation

5 tabs visibles definidos en `StitchTabBar` (`app/(app)/_layout.tsx`):

| Tab | Ruta | Icono |
|---|---|---|
| Home | `index` | ⌂ |
| Exercises | `exercises` | ◈ |
| Agenda | `agenda` | ▦ |
| Routines | `routines` | ≡ |
| Profile | `profile` | ◯/● |
