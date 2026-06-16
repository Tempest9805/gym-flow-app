---
tags: [spec, design, gym-flow-app, calistenia, cleanup]
date: 2026-06-15
status: draft
---

# Diseño — Limpieza de enfoque calistenia (pre-onboarding)

> Spec de una pasada de limpieza acotada antes del feature de onboarding de equipamiento + gate de rutina.
> Resultado de la sesión de brainstorming del 2026-06-15.
> Principio base (heredado del spec de calistenia): **iteración, NO rewrite.** La limpieza retira solo lo confirmado muerto y enfoca la librería; no elimina features que el spec mantiene.

Ver también: [[roadmap]], spec calistenia → `2026-06-13-calistenia-skill-tree-design.md`.

## 1. Objetivo

Dejar el proyecto enfocado al nuevo posicionamiento (especialista calistenia/casa) retirando código realmente muerto y acotando la librería de ejercicios a contenido hacible en casa, **sin romper datos ni features que el spec conserva** (Tabata, compartir/importar por QR, rutinas, rachas, agenda pendiente de absorción).

Sirve además de base para el siguiente feature (onboarding equipment-aware), que reutilizará el helper de equipamiento.

## 2. Alcance (decisiones acordadas)

- **Alcance:** código muerto confirmado **+** enfoque del catálogo a calistenia.
- **Orden:** esta limpieza va **primero**; luego el onboarding de equipamiento + gate de rutina (spec aparte).
- **Catálogo:** se **filtra** por equipamiento (no se borra) → reversible y sin romper FKs.
- **Agenda:** `agenda.tsx` + `day-detail.tsx` se **conservan** para la futura absorción en Entrenar.
- **Barrido profundo:** sí — auditoría de huérfanos a nivel de archivo en `lib/` y `components/`.

## 3. Parte A — Eliminar código muerto confirmado

Resultado del barrido de imports de todo el repo (grafo a nivel de archivo, resolviendo alias `@/`, relativos y barrels). Cuatro archivos en `lib/`/`components/` no son importados por nada:

| Archivo | Qué es | Evidencia | Riesgo |
|---|---|---|---|
| `lib/store/sessionStore.ts` | Tracker de progreso semanal (ejercicios/días completados) del dashboard viejo | `useSessionStore` exportado, **0 consumidores** | Ninguno |
| `lib/store/tabataThemeStore.ts` | Store de tema de color del Tabata | Solo aparece en un comentario de `tabataStore.ts`; **0 imports** | Ninguno |
| `lib/hooks/useLocalMedia.ts` | Hook que envuelve `mediaMap`; abstracción que ninguna pantalla adoptó | **0 imports**; las pantallas usan `mediaMap` directo (`THUMB_MAP`/`NORMALIZED_MAP`/`HIRES_MAP`) | Ninguno — **no hay cascada**: `mediaMap.ts` sigue vivo (lo usan exercises, exercise/[id], workout, workout-session, routine-detail) |
| `lib/skills/index.ts` | Barrel de los motores de skills | **0 imports**; todo se importa por ruta directa (`@/lib/skills/treeView`, etc.) | Ninguno |

**Acción:** borrar los 4 archivos.

**No se tocan** (verificados vivos, aclaración explícita por contradecir suposiciones):
- `mediaMap.ts`, `ZoomableImage.tsx`, `scripts/generate-media-index.js`, `scripts/convert-to-webp.js` → media local activa.
- `timer.tsx`/`timer-active.tsx` → timer de descanso, alcanzable (AppTopBar, Home, routine-detail).
- `tabata*`, `tabataStore` → Tabata se mantiene (spec §4, §6 decisiones).
- `agenda.tsx`/`day-detail.tsx` → conservados para absorción.
- `import-routine.tsx`/`share/[id].tsx` → feature QR del spec (ver §6 follow-ups).

**Verificación:** `pnpm typecheck` exit 0 + `pnpm test` verde tras el borrado.

## 4. Parte B — Enfocar la librería a calistenia/casa (filtro, reversible)

El catálogo tiene 148 ejercicios; ~64 son de gimnasio puro y no encajan con casa/calistenia. Hay 25 `routine_exercises` (3 rutinas) que referencian el catálogo → **no se borra en DB**; se **filtra en la capa de presentación**.

### 4.1 Helper puro `lib/utils/equipmentFocus.ts`

Regla por **exclusión** (robusta a valores nuevos: lo desconocido se muestra por defecto).

```ts
/** Equipamiento de gimnasio: se oculta de la librería calistenia/casa. */
export const GYM_EQUIPMENT: ReadonlySet<string> = new Set([
  'machine', 'barbell', 'cable', 'smith machine',
  'sled', 'landmine', 'treadmill', 'bike',
  'rowing machine', 'treadmill/outdoor',
]);

/** true si el equipamiento es hacible en casa (bodyweight + equipo mínimo). */
export function isHomeFriendly(equipment: string | null | undefined): boolean {
  if (!equipment) return true; // null/desconocido → visible
  return !GYM_EQUIPMENT.has(equipment.trim().toLowerCase());
}
```

- **Oculta** (~64): machine (27), barbell (18), cable (12), smith machine, sled, landmine, treadmill, bike, rowing machine, treadmill/outdoor.
- **Mantiene** (~84): bodyweight (57), dumbbells/dumbbell (21), kettlebell, jump rope, box, ab wheel, medicine ball, battle ropes, bands, pull_up_bar y cualquier valor nuevo.
- Tests unitarios: gimnasio→false, casero→true, null/desconocido→true, case/espacios.

### 4.2 Aplicación

- Filtrar la lista de la **librería de Ejercicios** (`app/(app)/exercises.tsx`, sobre el resultado de `useExercises`) con `isHomeFriendly(e.equipment)`.
- Filtro **a nivel de presentación** (cliente), no en la query ni en DB → reversible, y los ejercicios de gimnasio siguen accesibles si una rutina existente los referencia.
- El helper es puro y reutilizable: el onboarding equipment-aware (siguiente spec) lo extenderá con `profiles.available_equipment` para un filtrado más granular (barra/bandas/etc.).

## 5. Parte C — Higiene de documentación

- **CLAUDE.md** → tabla de Stores (Zustand): el listado actual (authStore, themeStore, languageStore, **sessionStore**, tabataStore) está desactualizado. Dejarla en: `authStore`, `themeStore`, `languageStore`, `tabataStore`, `settingsStore`. (Quitar `sessionStore`; añadir `settingsStore`, que es el real activo.)

## 6. Fuera de alcance (follow-ups anotados, NO en esta limpieza)

- **Re-cablear la entrada al flujo QR** (compartir/importar): `import-routine.tsx` y `share/[id].tsx` existen y el spec los mantiene en el tier gratis, pero perdieron su botón de entrada en la reestructura de nav. Es un fix de wiring (feature), no limpieza.
- **Absorción de Agenda en Entrenar:** reusar `agenda.tsx`/`day-detail.tsx` (feature futuro).
- **Detección de exports sin usar** (no solo archivos): correr `ts-prune`/`knip` para podar exports muertos dentro de barrels activos. Se omite aquí para no arriesgar falsos positivos sin la herramienta.

## 7. Testing

- Unit nuevo: `lib/utils/__tests__/equipmentFocus.test.ts` (helper puro).
- Regresión: `pnpm test` + `pnpm typecheck` verdes tras borrar los 4 huérfanos y aplicar el filtro.
- Manual (diferido, por preferencia del usuario "testing al final"): la librería de Ejercicios ya no muestra ejercicios de gimnasio; Tabata, rutinas y media siguen funcionando.

## 8. Riesgos

- **Bajo.** Los 4 borrados están verificados sin referencias ni cascada. El catálogo no se toca en DB. El filtro por exclusión deja visible lo desconocido (no oculta de más).
- Único punto de atención: confirmar que ninguna pantalla distinta de la librería dependa de ver ejercicios de gimnasio en su listado (rutinas que los referencian los siguen resolviendo por id, no por listado filtrado).

---

## Decisiones acordadas (registro)

1. Limpieza = código muerto confirmado + filtro de catálogo; **iteración, no rewrite**.
2. Borrar 4 huérfanos: `sessionStore`, `tabataThemeStore`, `useLocalMedia`, `lib/skills/index.ts`.
3. Catálogo: **filtrar** por equipamiento (helper puro por exclusión), no borrar.
4. Conservar Tabata, QR share/import, agenda/day-detail, media local (`mediaMap`).
5. Orden: limpieza primero, luego onboarding equipamiento + gate.
6. Testing manual diferido al final.
