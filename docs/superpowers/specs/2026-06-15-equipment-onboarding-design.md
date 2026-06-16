---
tags: [spec, design, gym-flow-app, calistenia, onboarding, equipment]
date: 2026-06-15
status: draft
---

# Diseño — Captura de equipamiento en onboarding

> Sub-feature del MVP (calistenia spec §12.2). Primero de dos planes; el segundo es el **gate de rutina** (spec aparte).
> Resultado del brainstorming del 2026-06-15. **Iteración, NO rewrite.**

Ver también: [[roadmap]], spec calistenia → `2026-06-13-calistenia-skill-tree-design.md` (§6 equipment-aware, §8.5, §12.2), limpieza → `2026-06-15-calistenia-cleanup-design.md` (helper `equipmentFocus`).

## 1. Objetivo

Capturar el equipamiento disponible del usuario (`profiles.available_equipment`) en el onboarding, tras elegir su objetivo. Es la base equipment-aware del producto: el contenido del árbol/retos siempre deja una ruta "sin barra", y más adelante se filtra/ofrece alternativas según lo que el usuario tiene.

Este plan cubre **solo la captura**. El uso de `available_equipment` para filtrar contenido del árbol/retos va con el seeding/gate (fuera de alcance, §7).

## 2. Estado actual (verificado)

- `profiles.available_equipment text[]` **ya existe** (columna + `ProfileSchema: z.array(z.string()).default([])`). Sin cambio de esquema.
- Onboarding hoy = 1 paso: `app/onboarding/goal.tsx` captura `full_name` + `goal`, luego `router.replace('/(app)')`.
- AuthGuard (`app/_layout.tsx`) redirige a `/onboarding/goal` cuando `isAuthenticated && profile && !profile.goal`.
- `app/onboarding/_layout.tsx` = `Stack` con auto-discovery (añadir `equipment.tsx` lo registra solo).
- El contenido sembrado usa la clave `pull_up_bar` (nodo Pull-Up). Las demás claves son forward-looking.

## 3. Decisiones acordadas

- **Granularidad enfocada:** 5 equipos + base "solo peso corporal".
- **Flujo:** pantalla propia tras Goal → `goal → equipment → app`.
- **Captura única:** el AuthGuard manda a equipment si hay `goal` pero `available_equipment` vacío (también captura a usuarios existentes una vez).

## 4. Datos y claves canónicas

Claves canónicas de equipamiento (fuente única de verdad en el módulo puro), pensadas para coincidir con los tags `equipment` del contenido:

| Clave | Etiqueta (es) | Gatea contenido hoy |
|---|---|---|
| `pull_up_bar` | Barra de dominadas | ✅ (nodo Pull-Up) |
| `bands` | Bandas elásticas | — (futuro) |
| `parallettes` | Paralelas / parallettes | — (futuro) |
| `rings` | Anillas | — (futuro) |
| `dumbbells` | Mancuernas | — (futuro) |
| `none` | (sentinela: capturado, solo peso corporal) | n/a |

**Convención de "capturado":** `available_equipment.length === 0` ⇒ **no capturado** (dispara el guard). Al continuar siempre se escribe ≥1 valor (`['none']` si no se marca equipo).

## 5. Componentes

### 5.1 Módulo puro `lib/onboarding/equipment.ts`

- `EQUIPMENT_OPTIONS`: array ordenado de `{ key: string; labelKey: TranslationKey; icon: string }` para los 5 equipos (no incluye `none`; el "solo peso corporal" es la base/ausencia).
- `normalizeEquipmentSelection(selected: string[]): string[]`
  - quita duplicados y la clave `none`;
  - si tras eso queda vacío → `['none']`;
  - si no → las claves de equipo seleccionadas (en orden de `EQUIPMENT_OPTIONS`).
- `isEquipmentCaptured(equipment: string[] | null | undefined): boolean` → `(equipment?.length ?? 0) > 0`.
- **Pura y testeable** (sin React).

### 5.2 Pantalla `app/onboarding/equipment.tsx`

- UI dark/neón coherente con `goal.tsx`.
- Una opción "Solo peso corporal" (base, **mutuamente excluyente** con los equipos; marcada por defecto) + chips multi-select de los 5 equipos.
  - Seleccionar un equipo deselecciona "Solo peso corporal"; seleccionar "Solo peso corporal" limpia los equipos.
  - Si el usuario deselecciona todo, al continuar se normaliza a `['none']`.
- Estado local `selected: string[]` (claves de equipo). Continuar:
  - `await updateProfile.mutateAsync({ id: profile.id, updates: { available_equipment: normalizeEquipmentSelection(selected) } })`
  - `router.replace('/(app)')`.
- Carga inicial: pre-marca desde `profile.available_equipment` (para usuarios que vuelven a la pantalla).

### 5.3 Wiring del flujo

- `app/onboarding/goal.tsx`: tras guardar goal con éxito, `router.replace('/onboarding/equipment')` (en vez de `/(app)`).
- `app/_layout.tsx` (AuthGuard): añadir, **después** del redirect de goal:
  ```tsx
  if (
    isAuthenticated && profile && profile.goal &&
    !isEquipmentCaptured(profile.available_equipment) && !inOnboardingGroup
  ) {
    return <Redirect href="/onboarding/equipment" />;
  }
  ```
- `app/onboarding/_layout.tsx`: sin cambios (auto-discovery del Stack).

### 5.4 i18n `lib/hooks/useTranslation.ts`

Añadir en `en` y `es` (mismas claves en ambos): `onboarding.equipment.title`, `.subtitle`, `.bodyweight`, `.bodyweightDesc`, `.continue`, y una etiqueta por equipo: `equipment.pull_up_bar`, `equipment.bands`, `equipment.parallettes`, `equipment.rings`, `equipment.dumbbells`.

## 6. Flujo de datos

```
goal.tsx (guarda goal)
  └── router.replace('/onboarding/equipment')
        └── equipment.tsx (multi-select)
              └── updateProfile({ available_equipment: normalize(selected) })
                    └── router.replace('/(app)')

AuthGuard en cada navegación:
  !goal                              → /onboarding/goal
  goal && !equipmentCaptured         → /onboarding/equipment
  ok                                 → app
```

## 7. Fuera de alcance (follow-ups)

- **Editar equipamiento en Perfil** (calistenia spec §4) — fast-follow.
- **Filtrado de contenido por equipamiento** (árbol/retos: ocultar/alternar `pull_up_bar` etc.) — va con el seeding completo / gate; el helper `equipmentFocus` (de la limpieza) y este `available_equipment` son los cimientos.
- **Gate de rutina** — segundo plan de esta tanda.

## 8. Testing

- **Unit (inline):** `lib/onboarding/__tests__/equipment.test.ts` — `normalizeEquipmentSelection` (vacío→['none'], dedup, quita 'none' con equipo, orden) e `isEquipmentCaptured` (vacío/null/undefined→false, no-vacío→true).
- **Typecheck:** `pnpm typecheck` exit 0.
- **Manual (diferido, por preferencia del usuario):** nuevo usuario goal→equipment→app; al elegir equipo se persiste; usuario existente sin equipamiento entra a equipment una vez; "solo peso corporal" guarda `['none']`.

## 9. Riesgos

- **Bajo.** Sin cambio de esquema; un solo redirect nuevo en el guard; pantalla aislada.
- Atención: el guard nuevo afecta a **usuarios existentes** (goal seteado, equipamiento vacío) → verán equipment una vez. Es intencional (captura retroactiva), no un bug.

---

## Decisiones acordadas (registro)

1. Capturar `available_equipment` en pantalla propia tras Goal (`goal → equipment → app`).
2. Lista enfocada: `pull_up_bar`, `bands`, `parallettes`, `rings`, `dumbbells` + base "solo peso corporal" (`none`).
3. "Capturado" = array no vacío; continuar siempre escribe ≥1 (`['none']` si sin equipo).
4. Guard captura a usuarios existentes una vez.
5. Solo captura; filtrado de contenido y edición en Perfil = follow-ups.
