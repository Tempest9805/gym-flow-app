# gym-flow-app

Aplicación móvil de fitness (React Native + Expo + Supabase).

> Contexto completo en `docs/`. Abrir `docs/` como vault en Obsidian para ver el grafo.

## Architecture Map

### Capas

```
app/ (Expo Router v6)
  └── (auth)/  |  onboarding/  |  (app)/tabs+screens
        │
lib/hooks/  (React Query — caching y data fetching)
        │
lib/api/  (Supabase JS — acceso a datos)
        │
Supabase  (PostgreSQL + Auth + Storage)

Estado global (Zustand — transversal a todas las capas):
  authStore | themeStore | languageStore | sessionStore | tabataStore
```

### Principio central

Mobile-first con Supabase como único backend. React Query como capa de caché entre UI y Supabase. Sin offline-first: los datos requieren conexión. El estado de progreso semanal se persiste en AsyncStorage con reset automático por semana.

### Stores (Zustand)

| Store | Propósito | Persistencia |
|---|---|---|
| `authStore` | Sesión Supabase, isAuthenticated | SecureStore (Supabase) |
| `themeStore` | Neon Purple / Neon Orange | AsyncStorage |
| `languageStore` | EN / ES | AsyncStorage |
| `sessionStore` | Ejercicios/días completados esta semana | AsyncStorage (reset semanal) |
| `tabataStore` | Config del timer Tabata | AsyncStorage |

### Pantallas principales

| Tab | Ruta | Función |
|---|---|---|
| Home | `(app)/index` | Dashboard semanal |
| Exercises | `(app)/exercises` | Librería de ejercicios |
| Agenda | `(app)/agenda` | Agenda semana actual |
| Routines | `(app)/routines` | Lista y gestión de rutinas |
| Profile | `(app)/profile` | Perfil y configuración |

Pantallas ocultas clave: `workout-session`, `routine-builder`, `routine-detail`, `routine-start`, `exercise/[id]`, `tabata`, `tabata-active`.

### Startup sequence

```
RootLayout → initialize() + loadTheme() + loadLanguage() (paralelo)
    └── AuthGuard
            ├── !authenticated  → (auth)/login
            ├── !profile.goal   → onboarding/goal
            └── ok              → (app) tabs
```

### Entidades clave

`Profile`, `Exercise`, `Routine`, `RoutineExercise`, `WorkoutSchedule`, `RoutineShare`, `UserStreak`
— definidas como Zod schemas en `lib/api/schemas.ts`

### Comandos útiles

```bash
pnpm start          # Expo dev server
pnpm android        # Android
pnpm ios            # iOS
pnpm typecheck      # tsc --noEmit
pnpm media:sync     # Sync exercises to Supabase
```
