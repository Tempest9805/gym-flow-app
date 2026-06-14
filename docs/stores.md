---
tags: [stores, state, zustand, gym-flow-app]
---

# Stores

Estado global gestionado con **Zustand v5**. Todos en `lib/store/`.

Ver también: [[architecture]], [[data-flow]]

## authStore (`lib/store/authStore.ts`)

Conecta con Supabase Auth. Gestiona sesión y estado de autenticación para el AuthGuard.

```ts
AuthState {
  session: Session | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean          // true durante inicialización
}
```

- `initialize()` — lee sesión de Supabase y suscribe a `onAuthStateChange`
- `signOut()` — llama a authApi.signOut() y limpia estado
- Se inicializa en `RootLayout` al montar

## themeStore (`lib/store/themeStore.ts`)

Dos temas: **Neon Purple** (default) y **Neon Orange**. Persiste en AsyncStorage (`gymflow_theme`).

```ts
ThemeState {
  themeId: 'purple' | 'orange'
  theme: Theme           // contiene tokens de color
  isLoaded: boolean
}
```

`ThemeTokens` — ~40 tokens: backgrounds, primary, secondary, text, borders, error, glow, tabata colors.

Acceso en componentes: `useTheme()` hook en `lib/hooks/useTheme.ts`.

## languageStore (`lib/store/languageStore.ts`)

Idioma: **EN** (default) o **ES**. Persiste en AsyncStorage (`gymflow_language`).

```ts
LanguageState {
  language: 'en' | 'es'
  isLoaded: boolean
}
```

Los ejercicios tienen `name_en` y `name_es` — el idioma seleccionado determina cuál mostrar.

## sessionStore (`lib/store/sessionStore.ts`)

Progreso de workout de la semana actual. Persiste en AsyncStorage (`gym-flow-session-storage`). Se resetea automáticamente al cambiar de semana.

```ts
SessionState {
  completedExercises: Record<string, boolean>  // key: routine_exercise.id
  completedDays: Record<number, boolean>       // key: día 0-6
  weekStartDate: string | null
}
```

- `toggleExercise(id)` — marca/desmarca ejercicio completado
- `toggleDay(dayIndex, currentWeekStart)` — marca día; resetea si cambió la semana
- `checkAndResetWeekly(currentWeekStart)` — llamado en boot para limpiar datos de semana anterior

## tabataStore (`lib/store/tabataStore.ts`)

Configuración del timer Tabata. Persiste en AsyncStorage (`gymflow_tabata_config`).

```ts
TabataConfig {
  prepSeconds: 5
  workSeconds: 40
  restSeconds: 20
  cooldownSeconds: 30
  cycleRestSeconds: 15
  rounds: 3
  cycles: 5
  soundEnabled: true
}
```

- `tabata.tsx` configura → `tabata-active.tsx` consume

## tabataThemeStore (`lib/store/tabataThemeStore.ts`)

> ⚠️ verificar — store separado del themeStore principal. Gestiona colores de las fases Tabata (prepare/work/rest). Los colores base están en `themeStore.tokens.tabataPrepare|Work|Rest`.

## Resumen de persistencia

| Store | Clave AsyncStorage | Reset |
|---|---|---|
| themeStore | `gymflow_theme` | Manual |
| languageStore | `gymflow_language` | Manual |
| sessionStore | `gym-flow-session-storage` | Semanal automático |
| tabataStore | `gymflow_tabata_config` | Manual |
| authStore | SecureStore (Supabase) | signOut |
