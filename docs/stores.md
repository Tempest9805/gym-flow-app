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

## settingsStore (`lib/store/settingsStore.ts`)

Preferencias de UI del pivote calistenia. Persiste en AsyncStorage.

```ts
SettingsState {
  startTab: StartTab                  // tab de inicio (Entrenar por defecto)
  avatarVariant: 'hombre' | 'mujer'   // variante del avatar HUD
  isLoaded: boolean
}
```

- `loadStartTab()` / `setStartTab(tab)` — clave `gymflow_start_tab` (resolver puro en `lib/utils/startTab.ts`)
- `loadAvatarVariant()` / `setAvatarVariant(v)` — clave `gymflow_avatar_variant` (resolver puro en `lib/utils/avatarVariant.ts`)

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

## Resumen de persistencia

| Store | Clave AsyncStorage | Reset |
|---|---|---|
| themeStore | `gymflow_theme` | Manual |
| languageStore | `gymflow_language` | Manual |
| tabataStore | `gymflow_tabata_config` | Manual |
| settingsStore | `gymflow_start_tab`, `gymflow_avatar_variant` | Manual |
| authStore | SecureStore (Supabase) | signOut |
