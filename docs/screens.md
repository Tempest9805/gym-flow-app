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
│   ├── goal.tsx         Selección de objetivo de fitness
│   └── equipment.tsx    Captura de equipamiento disponible (available_equipment)
│
└── (app)/               Grupo principal (requiere sesión + profile.goal)
    ├── _layout.tsx      Tabs + StitchTabBar custom
    │
    │   ── TABS VISIBLES (bottom nav, default = Entrenar) ──
    ├── tree.tsx          Árbol de skills (calistenia) — avatar HUD, ramas, retos
    ├── index.tsx         Entrenar — dashboard / sesión de hoy
    ├── exercises.tsx     Exercise library — calistenia/casa (filtra gimnasio)
    ├── routines.tsx      Lista de rutinas (badge "Bloqueada" si pending)
    ├── profile.tsx       Perfil de usuario
    │
    │   ── PANTALLAS OCULTAS (no en nav) ──
    ├── agenda.tsx             Agenda semanal (oculta; absorber en Entrenar)
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
    ├── Sesión, sin equipamiento ────► onboarding/equipment
    │
    └── Sesión + goal + equipo ──────► (app) tabs (default Entrenar)
                                            │
                            ┌───────────────┼────────────────┐
                            ▼               ▼                ▼
                         Árbol          exercises         routines
                            │                                │
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
| Árbol | `tree` | ◬ |
| Entrenar ⭐ | `index` | ⌂ |
| Exercises | `exercises` | ◈ |
| Routines | `routines` | ≡ |
| Profile | `profile` | ◯/● |

> Default de fábrica = **Entrenar** (cambiable en Perfil). Agenda ya no es tab (oculta, pendiente de absorber en Entrenar).
