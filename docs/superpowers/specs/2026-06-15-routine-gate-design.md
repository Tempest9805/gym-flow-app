---
tags: [spec, design, gym-flow-app, calistenia, routine-gate]
date: 2026-06-15
status: draft
---

# Diseño — Gate de rutina por nivel

> Segundo de la tanda onboarding+gate (calistenia spec §7). **Iteración, NO rewrite.**
> Resultado del brainstorming del 2026-06-15.

Ver también: [[roadmap]], spec calistenia → `2026-06-13-calistenia-skill-tree-design.md` (§7 gate, §9 motores), onboarding equipamiento → `2026-06-15-equipment-onboarding-design.md`.

## 1. Objetivo

Cuando el usuario guarda una rutina que incluye nodos del árbol **por encima de su nivel probado** (estado `locked`), avisarle y dejar:
- **guardarla bloqueada** (`status: 'pending'`) para desbloquearla después, o
- ir al **Árbol** a desbloquear esos nodos (reusa el loop log→unlock ya construido).

Las rutinas dentro de nivel se guardan normal (`active`). Siempre se calcula y persiste el **nivel requerido por rama** en `Routine.metadata.required_levels` (seguridad anti-lesión + base para stats). **Sin cambio de esquema.**

## 2. Estado actual (verificado)

- `Routine` tiene `metadata` (jsonb) y `status` (`StatusSchema`, default `'active'`; existe `'pending'`). Sin cambio de esquema.
- El builder (`app/(app)/routine-builder.tsx`) guarda vía `upsertRoutine(userId, routineId, name, exercises)` (`lib/api/routines.ts`), que **no** escribe `metadata` ni `status` hoy.
- Motor puro existente: `routineGateStatus(routineExerciseIds, statuses) → { locked, lockedExerciseIds }` (`lib/skills/routineGate.ts`, 3 tests).
- Datos disponibles en cliente: `useProgressions()` (`exercise_progressions`: path, level, unlock_reps/hold), `useSkillProgress(userId)` (`user_skill_progress`: status por exercise_id), `useExercises()` (nombres).
- El gate **solo aplica a ejercicios que son nodos del árbol** (presentes en `exercise_progressions`); los demás nunca bloquean.

## 3. Decisiones acordadas

- **Disparo:** al **guardar** en el builder (no al iniciar).
- **Prueba de aptitud:** **ligera** — avisar + listar nodos bloqueados con su umbral; opciones guardar-bloqueada / ir-al-árbol. Sin test nuevo (el desbloqueo ocurre por el loop log→unlock existente).
- **Status:** a nivel → `active`; guardar bloqueada → `pending`. `required_levels` siempre en metadata.

## 4. Lógica pura (`lib/skills/routineGate.ts`, extender)

Mantiene `routineGateStatus` (ya existe). Añade:

```ts
import type { ExerciseProgression, UserSkillProgress, NodeStatus } from '@/lib/api/schemas';
import { BRANCH_ORDER, type Branch } from './treeView';

/** Mapa de status SOLO de ejercicios que son nodos del árbol; default 'locked' si el user no tiene fila. */
export function buildRoutineStatuses(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
  routineExerciseIds: string[],
): Record<string, NodeStatus>;

/** Nivel requerido por rama = nivel máximo (de exercise_progressions) entre los ejercicios-nodo de la rutina. */
export function requiredLevelsForRoutine(
  progressions: ExerciseProgression[],
  routineExerciseIds: string[],
): Partial<Record<Branch, number>>;

export interface RoutineGateEvaluation {
  locked: boolean;
  lockedExerciseIds: string[];
  requiredLevels: Partial<Record<Branch, number>>;
}

/** Combina lo anterior: detecta bloqueo + calcula required_levels en una pasada. */
export function evaluateRoutineGate(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
  routineExerciseIds: string[],
): RoutineGateEvaluation;
```

- `buildRoutineStatuses`: por cada `routineExerciseId` que exista en `progressions`, `status = skillProgress[id]?.status ?? 'locked'`. Excluye no-nodos.
- `requiredLevelsForRoutine`: agrupa los ejercicios-nodo por `path`, toma `max(level)`; solo ramas presentes (Partial).
- `evaluateRoutineGate`: usa `buildRoutineStatuses` + `routineGateStatus` + `requiredLevelsForRoutine`.
- Todo **puro y testeable**.

## 5. Persistencia (`lib/api/routines.ts`, extender `upsertRoutine`)

Añadir un 5º parámetro opcional:

```ts
export async function upsertRoutine(
  userId: string,
  routineId: string | null,
  name: string,
  exercises: ExerciseEntry[],
  options?: { metadata?: Record<string, unknown>; status?: 'active' | 'pending' },
): Promise<string>
```

- En el insert/update de `routines`, incluir `metadata` y `status` cuando `options` los trae (no romper llamadas existentes: ambos opcionales).
- El builder pasa `{ metadata: { required_levels }, status }` calculados por el gate.

## 6. UX del gate (`app/(app)/routine-builder.tsx`)

En el handler de guardar (la `saveMutation`):

1. Construir `routineExerciseIds` de los ejercicios actuales.
2. `const gate = evaluateRoutineGate(progressions, skillProgress, routineExerciseIds);` (con `useProgressions` + `useSkillProgress`).
3. Ramas:
   - **`!gate.locked`** → `upsertRoutine(..., { metadata: { required_levels: gate.requiredLevels }, status: 'active' })`. Flujo normal.
   - **`gate.locked`** → abrir `RoutineGateSheet` (modal) en vez de guardar directo.

### 6.1 `components/skill/RoutineGateSheet.tsx`

- Modal (estilo coherente con `NodeSheet`). Muestra:
  - Título + explicación ("Esta rutina supera tu nivel probado").
  - Lista de ejercicios bloqueados (`gate.lockedExerciseIds` → nombre vía `useExercises` + umbral `unlock_reps`/`unlock_hold_seconds` de la progresión).
  - Acciones:
    - **"Guardar bloqueada"** → `upsertRoutine(..., { metadata: { required_levels }, status: 'pending' })`, cierra, vuelve.
    - **"Ver en Árbol"** → guarda `pending` (igual) y `router.push('/tree')`.
    - **"Seguir editando"** → cierra el modal sin guardar.

## 7. Mostrar rutinas bloqueadas (`app/(app)/routines.tsx`)

- Badge "Bloqueada" / "Locked" cuando `routine.status === 'pending'` en la tarjeta de rutina.

## 8. i18n (`lib/hooks/useTranslation.ts`)

`gate.*` en `en`+`es`: `gate.title`, `gate.subtitle`, `gate.saveLocked`, `gate.viewTree`, `gate.keepEditing`, `gate.locked` (badge). El umbral se muestra **sin claves de unidad nuevas**: reps como `` `${n} ${tr('tree.reps')}` `` (clave existente) y holds como `` `${n}s` ``.

## 9. Flujo de datos

```
Builder "Guardar"
  └── evaluateRoutineGate(progressions, skillProgress, ids)
        ├── !locked → upsertRoutine(..., { metadata:{required_levels}, status:'active' })
        └── locked  → RoutineGateSheet
                        ├── "Guardar bloqueada" → upsertRoutine(..., status:'pending')
                        ├── "Ver en Árbol"       → upsertRoutine(..., status:'pending') + push('/tree')
                        └── "Seguir editando"    → cierra

routines.tsx: status==='pending' → badge "Bloqueada"
```

## 10. Fuera de alcance (follow-ups)

- **Auto-desbloqueo** de rutinas `pending` cuando sus nodos pasan a `available`/`mastered` (por ahora: re-evaluar al re-abrir y re-guardar la rutina).
- **Gate al iniciar** la rutina (elegido: solo al guardar).
- **Reto formal** con la tabla `challenges` como prueba.
- Filtrado/uso de `required_levels` para recomendaciones o stats.

## 11. Testing

- **Unit (inline):** `lib/skills/__tests__/routineGate.test.ts` (extender) — `buildRoutineStatuses` (default locked, excluye no-nodos), `requiredLevelsForRoutine` (max por rama, solo ramas presentes), `evaluateRoutineGate` (locked/!locked + required_levels).
- **Typecheck:** exit 0.
- **Manual (diferido):** guardar rutina a-nivel → active sin modal; guardar rutina con nodo bloqueado → modal → "Guardar bloqueada" → aparece con badge; "Ver en Árbol" navega; rutina sin nodos del árbol nunca dispara el gate.

## 12. Riesgos

- **Bajo–medio.** Sin cambio de esquema; lógica pura testeable; `upsertRoutine` retrocompatible (params opcionales).
- Atención: asegurar que el gate **solo** considera ejercicios-nodo (no romper rutinas de ejercicios fuera del árbol, que deben guardarse siempre `active`).
- Atención: `buildRoutineStatuses` debe defaultear a `'locked'` los nodos sin fila de progreso (un nodo nunca entrenado está bloqueado), no ignorarlos.

---

## Decisiones acordadas (registro)

1. Gate al **guardar**; prueba **ligera** (avisar + guardar-bloqueada / ir-al-árbol).
2. `required_levels` siempre en `Routine.metadata`; `status` `active`/`pending`.
3. Solo ejercicios-nodo del árbol gatean; los demás siempre `active`.
4. Lógica pura extiende `routineGate.ts`; persistencia extiende `upsertRoutine` (retrocompatible).
5. Badge "Bloqueada" en la lista; auto-desbloqueo y gate-al-iniciar = follow-ups.
