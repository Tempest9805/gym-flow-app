---
tags: [spec, design, gym-flow-app, calistenia, skill-tree, arbol]
date: 2026-06-14
status: draft
---

# Diseño — Pantalla Árbol (slice vertical fino)

> Spec de incremento. Resultado de la sesión de brainstorming del 2026-06-14.
> **Builds on:** data layer del árbol (`docs/superpowers/plans/2026-06-14-skill-tree-data-layer.md`) y navegación 5 tabs (`docs/superpowers/plans/2026-06-14-nav-restructure-5-tabs.md`).
> **Spec madre:** `docs/superpowers/specs/2026-06-13-calistenia-skill-tree-design.md` (este incremento implementa parte de §5, §6, §10, §12 del MVP).

## 1. Objetivo

Reemplazar el placeholder de `app/(app)/tree.tsx` por una **pantalla Árbol funcional y demoable de punta a punta**: contenido real sembrado (subconjunto), camino serpenteante navegable, avatar HUD vivo, retos con readiness, y el **bucle completo** registrar → derivar → desbloquear → subir nivel. Es el slice que valida la UX estrella **antes** de curar los ~50 nodos completos (§15 de la spec madre: la calibración es el foso y se valida con el dueño).

## 2. Alcance

### Dentro
1. **Semilla de contenido** (subconjunto): 5 ramas, Principiante→Intermedio, **todo sin barra** (~15–20 nodos). Nodos Avanzados visibles **con candado** (gancho). Catálogo de retos del slice (sin barra).
2. **Pantalla Árbol** (`tree.tsx`): camino serpenteante seccionado por rama (layout B) + header con avatar HUD y tira de nivel por rama + sección de retos + CTA "Empezar rutina de hoy".
3. **Registro mínimo en nodo**: hoja para registrar reps/segundos → `workout_log` → re-sync de `user_skill_progress`.
4. **Avatar HUD estático** (1-de-6 según nodos `mastered`), variante hombre/mujer, frames recortados del design sheet.
5. **`markChallengeStatus`**: mutación nueva (`ready → attempted → achieved`), verificación por auto-reporte.

### Fuera (diferido, increments posteriores)
- Captura de equipamiento + onboarding (`available_equipment`) y filtrado por equipamiento.
- Paywall RevenueCat real (los nodos Avanzados se muestran bloqueados pero el corte premium es solo visual aquí).
- Gate por nivel al crear rutinas.
- Animación de level-up del avatar; selección de variante en onboarding.
- Contador/timer guiado de retos (Tier 4 verificado por la app).
- Estadísticas premium / historial.
- Seed completo de los ~50 nodos (este slice siembra un subconjunto).

## 3. Supuestos fijados

- **Home / sin barra:** como aún no hay captura de equipamiento, el slice asume usuario en casa sin barra y **solo siembra contenido sin barra** (satisface la regla dura "sin barra siempre" de la spec madre §6). Los nodos/retos de barra (pull-up, muscle-up) aparecen como Avanzado bloqueado, no como ruta requerida.
- **Premium = solo visual:** los nodos Avanzados se renderizan con candado/etiqueta premium; no hay verificación de compra todavía.
- **Verificación de retos = auto-reporte honesto** para el slice.

## 4. Semilla de contenido (`exercise_progressions` + `challenges`)

Se aplica vía **migración SQL nueva** `supabase/migrations/0002_seed_skill_tree.sql`, idempotente, que inserta referenciando ejercicios existentes por nombre (subselect sobre `public.exercises`). **Prerrequisito de implementación:** verificar los nombres contra la tabla real `exercises` (usar `scripts/inspect_db_cats.ts`); para ejercicios sin fila (ej. handstand, pistol, hollow body) el plan decide si se insertan filas mínimas o si esos nodos quedan como Avanzado bloqueado sin imagen.

### 4.1 Nodos por rama (umbrales = propuesta inicial, el dueño calibra)

| Rama | L1 (beginner) | L2 (beginner/inter) | L3 (intermediate) | Avanzado (locked) |
|---|---|---|---|---|
| push | Knee Push-Up · `unlock_reps 12` | Push-Up · `unlock_reps 15` | Diamond Push-Up · `unlock_reps 12` | Archer / Pseudo-Planche |
| pull | Towel Door Row · `reps 12` | Table/Inverted Row · `reps 12` | Elevated-Feet Table Row · `reps 12` | Pull-Up *(barra)* |
| core | Plank · `hold 45s` | Hollow Body Hold · `hold 30s` | Side Plank · `hold 40s` | L-Sit |
| legs | Bodyweight Squat · `reps 25` | Reverse Lunge · `reps 16` | Bulgarian Split Squat · `reps 12` | Pistol Squat |
| skill | Pike Hold · `hold 30s` | Pike Push-Up · `reps 8` | Wall Handstand Hold · `hold 30s` | Handstand Push-Up |

- `prerequisite_exercise_id` encadena L1→L2→L3 dentro de la rama; un cruce de ejemplo (push-up como prereq de pike push-up) se permite.
- `equipment = null` en todo el seed del slice (sin barra). Los Avanzados de barra llevan `equipment = 'pull_up_bar'`.

### 4.2 Retos del slice (`challenges`, sin barra)

| Reto | tier | kind | target | readiness_rule (prerequisitos) |
|---|---|---|---|---|
| 100 Push-Ups | 4 | volume_reps | `target_reps 100` | push-up best_reps / 100 |
| Plank 5 min | 4 | hold_time | `target_seconds 300` | plank best_hold / 300 |
| 100 Burpees en 10 min | 4 | reps_in_time | `target_reps 100`, `time_window_seconds 600` | burpee best_reps / 100 |
| Pistol Squat | 1 | skill | `target_reps 1` | mín(bulgarian split/12, squat/30) |
| Handstand Hold | 1 | skill | `target_seconds 10` | wall handstand best_hold / 30 |
| L-Sit | 1 | skill | `target_seconds 10` | mín(plank/60, hollow/45) |

`readiness_rule` jsonb sigue el formato fijado en el data layer: `{ requirements: [{ exercise_id, target_reps?, target_seconds? }] }`. `is_premium = false` en el slice.

## 5. Flujo de datos — el bucle "que cobra vida"

```
Tocar nodo → hoja "registrar serie" (reps | segundos)
   → insert workout_log (workoutLogsApi)
   → re-sync user_skill_progress (derive.ts: best recalculado, desbloqueo, in_progress/mastered)
   → invalidar queries (skillProgress, challengeProgress)
   → re-sync readiness de retos
   → UI: nodo cambia de estado; avatar recalcula stage; tira de rama sube
```

- **Fuente de verdad:** `workout_logs` (best recalculado en cada sync), consistente con el data layer.
- **Lectura:** hooks existentes `useProgressions`, `useSkillProgress(userId)`, `useChallenges`, `useChallengeProgress(userId)`, `useWorkoutLogs`.
- **Escritura nueva:** hook de mutación para registrar serie (envuelve el insert + sync) y `markChallengeStatus`.

## 6. Anatomía de la pantalla (`tree.tsx`)

- **Header (HUD):** avatar (frame 1-6 vía `avatarStageFromLevel(masteredCount)`), racha (`UserStreak`), y **tira de 5 indicadores de nivel por rama** (nivel de rama = nodos `mastered` de esa rama). Variante de avatar leída de `settingsStore`.
- **Cuerpo:** `ScrollView` vertical con **camino serpenteante** (layout B). Cada rama es un **tramo contiguo** con un banner de rama; los nodos se ordenan por `level` dentro del tramo. Estados visuales: `mastered` (relleno), `available` (contorno neón), `in_progress` (contorno + marca), `locked` (gris + candado). Avanzados bloqueados visibles al final del tramo.
- **Nodo (tap):** abre hoja con nombre, imagen, su lugar en la progresión, estado/readiness, y acción **registrar serie**.
- **Sección retos:** lista de cards (agrupadas por tier) con barra de readiness 0–100%. `< 100%` → candado + "X% listo". `= 100%` → se ilumina "Intentar reto". Al lograr → estado compartible (badge); pantalla de compartir se reutiliza si aplica, si no, simple por ahora.
- **CTA "Empezar rutina de hoy":** navega al tab Entrenar (`/index`).

### Lógica pura nueva (testeable)
- Agrupar progresiones+progreso en tramos por rama, ordenados por `level` → estructura que consume el camino serpenteante.
- Nivel por rama (conteo de `mastered` por `path`) para la tira del header.
- (Reusa `avatarStageFromLevel` y `derive.ts` existentes.)

## 7. Avatar — extracción de frames

- **Script una-vez** (`scripts/slice-avatars.mjs`, usa `sharp` como el pipeline webp existente): recorta los 6 retratos del grid 3×2 de cada design sheet a `assets/avatares/frames/{hombre,mujer}_{1..6}.webp`. Cajas de recorte estimadas del grid (afinable por el dueño). Las animaciones de level-up se ignoran en el slice.
- **Mapeo:** `avatarStageFromLevel(masteredCountGlobal)` con `DEFAULT_AVATAR_THRESHOLDS = [0,3,8,15,25,40]`. Nota: con el seed reducido del slice (Princ.→Inter.), en la práctica solo se alcanzan stages bajos; los umbrales se recalibran cuando exista el seed completo.
- **Variante** (hombre/mujer): preferencia en `settingsStore` (AsyncStorage), elegible desde Perfil; default `hombre`. (Migrar a columna de `profiles` se difiere.)

## 8. `markChallengeStatus` (mutación nueva)

- En `lib/api/challenges.ts`: `markChallengeStatus(userId, challengeId, status)` → upsert en `user_challenge_progress` (`status`, y `achieved_at = now()` cuando `status = 'achieved'`). Respeta RLS (`user_id = auth.uid()`).
- Hook de mutación en `lib/hooks/useChallenges.ts` que invalida `challengeProgress`.
- Transición del slice: `ready → attempted` (tap "Intentar reto"), `attempted → achieved` (tap "Lo logré", auto-reporte).

## 9. Testing

- **Unit (Jest, lógica pura):** agrupación nodos→tramos por rama; nivel por rama; (avatar/derive ya cubiertos).
- **Typecheck:** sync, mutación, hooks, pantalla.
- **Manual (RN/expo, `pnpm start`):** registrar una serie sube el estado del nodo y, si corresponde, el avatar; un reto al 100% permite "Intentar"→"Lo logré"→badge; CTA lleva a Entrenar; el camino serpenteante hace scroll y muestra los 5 tramos con Avanzado bloqueado.

## 10. Decisiones abiertas / riesgos heredados

- **Calibración de umbrales y `readiness_rule`** (spec madre §15): los valores aquí son propuesta inicial; el dueño los valida.
- **Cajas de recorte del avatar:** estimadas; el dueño puede afinar coordenadas o entregar frames limpios después.
- **Nombres de ejercicios en DB:** el seed depende de que existan; el plan resuelve faltantes.
- **Recalibración de `DEFAULT_AVATAR_THRESHOLDS`** cuando exista el seed completo.

---

## Decisiones acordadas (registro)

1. Primer plan = **slice vertical fino** (no seed completo ni mock-only).
2. Seed = **5 ramas poco profundas** (Princ.→Inter.), todo **sin barra**, Avanzado con candado.
3. Layout = **B, camino serpenteante** (elección del dueño sobre la recomendación A), reconciliado con el modelo por-rama vía **tramos contiguos por rama** + tira de nivel por rama en el header.
4. Avatar = **script de recorte + estático 1-de-6**, variante local, sin animación de level-up.
5. **Registro mínimo en nodo** incluido → bucle real registrar→derivar→desbloquear.
6. Verificación de retos = **auto-reporte honesto**; contador/timer guiado diferido.
7. Premium/equipamiento/gate de rutinas/onboarding = **fuera** del slice.
