---
tags: [roadmap, status, gym-flow-app, calistenia]
updated: 2026-06-14
---

# Roadmap — Pivote a calistenia con árbol de skills

Estado vivo del rediseño. Dirección estratégica completa en el spec; este archivo es el "dónde estamos" para retomar entre sesiones.

Ver también: [[_INDEX]], [[market_research]], spec → `superpowers/specs/2026-06-13-calistenia-skill-tree-design.md`, plan 1 → `superpowers/plans/2026-06-13-logic-core-and-data-schema.md`, plan 2 → `superpowers/plans/2026-06-14-skill-tree-data-layer.md`, plan 3 (nav) → `superpowers/plans/2026-06-14-nav-restructure-5-tabs.md`, spec Árbol → `superpowers/specs/2026-06-14-arbol-screen-slice-design.md`, plan 4 (Árbol slice) → `superpowers/plans/2026-06-14-arbol-screen-slice.md`

## Dónde estamos (2026-06-14, sesión 2)

- [x] Brainstorming completo (decisiones de producto fijadas)
- [x] Spec escrito y revisado
- [x] Plan 1 escrito y autorrevisado
- [x] **Plan 1 ejecutado y verificado** (rama `feat/calistenia-foundation`, 9 commits, 26 tests, typecheck limpio)
- [x] ✅ **Migración `0001_skill_tree.sql` aplicada en Supabase**
- [x] **Plan 2 (acceso a datos + hooks) ejecutado y verificado** (9 commits, 40 tests, typecheck limpio, revisión final "ready to merge")
- [x] **Plan 3 — Navegación 5 tabs ejecutado y verificado** (6 commits `feat(nav):`, footer Árbol·Entrenar·Ejercicios·Rutinas·Perfil con default Entrenar, Agenda oculta, 44 tests, typecheck limpio)
- [~] **Plan 4 — Pantalla Árbol (slice vertical fino)** EN EJECUCIÓN (subagent-driven): T1–T5 ✅ commiteadas, T6–T12 pendientes
- [ ] Planes restantes (onboarding equipamiento + gate · paywall · seeding completo)

> El "Plan UI" original se dividió: **nav 5 tabs** (Plan 3, ✅) y **pantalla Árbol** (Plan 4, en curso).

## Decisiones clave (resumen)

- App = especialista **casa/calistenia, español-first**, principiante→avanzado. **Iteración, NO rewrite.**
- Gancho = **árbol de skills gamificado** (5 ramas push/pull/core/legs/skill × 3 niveles) con **retos en 4 tiers** (élite / técnicas / 4-8 sem / volumen) + barra de **readiness** determinista.
- **Gamificación opcional/omitible.** Footer máx 5 tabs. **Tab por defecto = Entrenar** (fricción cero).
- **Gate por nivel al crear rutinas** (prueba de aptitud; usa `Routine.metadata`).
- **Equipment-aware:** siempre hay retos/rutas **sin barra**; equipamiento capturado en onboarding.
- **Monetización:** freemium suscripción (RevenueCat) — Principiante+Intermedio gratis; Avanzado+automatización+stats premium.
- **Avatar:** cara HUD estilo DOOM, **6 niveles** (tema Oni/neón), hombre/mujer + animación level-up. Arte ya en `assets/avatares/`. Entra en v1.

## Secuencia de planes

1. **Plan 1 — Núcleo de lógica y datos** ✅ *completo* (jest, migración SQL, Zod schemas, 5 motores puros)
2. **Plan 2 — Acceso a datos + hooks** ✅ *completo* (API Supabase `lib/api/{workoutLogs,skillTree,challenges}` + hooks React Query; `derive.ts` puro conecta los motores)
3. **Plan 3 — Navegación 5 tabs** ✅ *completo* (footer reestructurado, default Entrenar, Agenda oculta, resolver puro `startTab` + `settingsStore`, placeholder Árbol, setting Start Screen en Perfil)
4. **Plan 4 — Pantalla Árbol (slice vertical fino)** ⏳ *en ejecución* (viz serpenteante + avatar HUD + registro en nodo + retos con readiness + `markChallengeStatus`; seed reducido sin barra)
5. Plan — Onboarding equipamiento (`available_equipment`) + gate de rutina al crear
6. Plan — Paywall RevenueCat + gating free/premium
7. Plan — Seeding completo de contenido (~50 progresiones, catálogo de retos, calentamientos) — el foso

> Nota: el "Plan UI" se dividió en Plan 3 (nav) + Plan 4 (Árbol). El Plan 4 es un **slice fino**: siembra un subconjunto real sin barra y valida la UX estrella antes de curar los ~50 nodos completos.

## Progreso de ejecución del Plan 4 (pantalla Árbol — slice)

Ejecución subagent-driven sobre `feat/calistenia-foundation`. Especificación: `superpowers/specs/2026-06-14-arbol-screen-slice-design.md`.

- [x] T1 — Lógica pura `lib/skills/treeView.ts` (commit `96983db`, 4 tests) · buildBranchSections / branchMasteredCounts / globalMasteredCount
- [x] T2 — `markChallengeStatus` API + `useMarkChallengeStatus` (commit `ac2dc83`)
- [x] T3 — `useStreak` hook (commit `410befc`)
- [x] T4 — Preferencia variante avatar: resolver puro + `settingsStore` (commit `e2d8fae`, 2 tests)
- [x] T5 — Script `scripts/slice-avatars.js` + 12 frames recortados + `lib/utils/avatarFrames.ts` (commits `cdece08`, `25352a7` recalibración visual de crops)
- [ ] T6 — `AvatarHud` + `BranchLevelStrip` ← SIGUIENTE
- [ ] T7 — `SkillNode` + `NodeSheet` (registrar serie vía `useLogSet`)
- [ ] T8 — `ChallengeCard` (readiness + auto-reporte)
- [ ] T9 — Strings `tree.*` + `branch.*` (en+es)
- [ ] T10 — Ensamblar `app/(app)/tree.tsx`
- [ ] T11 — `scripts/seed-skill-tree.mjs` + correrlo (necesita `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; resuelve exercise_id por slug/nombre y reporta faltantes)
- [ ] T12 — Verificación full + review final + finishing-a-development-branch

> Deuda menor anotada: `markChallengeStatus` escribe `achieved_at: null` al marcar `attempted` — no se dispara en el flujo del slice (un reto logrado no muestra botones), pero conviene endurecerlo (omitir `achieved_at` salvo `achieved`) en una pasada de limpieza.

## Progreso de ejecución del Plan 1

- [x] Task 1 — Setup Jest + ts-jest (commit `4cf4037`)
- [x] Task 2 — Migración SQL (commit `72c5a51`) ⚠️ aplicar en Supabase = paso manual pendiente
- [x] Task 3 — Zod schemas + tipos (commit `9768ef7`) · nota: Zod v4 exige UUID válido RFC 4122
- [x] Task 4 — Motor: equipment filter (commit `9cf282b`) · crea `lib/skills/types.ts`
- [x] Task 5 — Motor: unlock (commit `bb94cd2`, 7 tests)
- [x] Task 6 — Motor: readiness (commit `642302b`, 5 tests)
- [x] Task 7 — Motor: routine gate (commit `a5d9624`, 3 tests)
- [x] Task 8 — Motor: avatar stage (commit `525bd9d`, 3 tests)
- [x] Task 9 — Barrel export + verificación full (commit `b454a6b`) · **26 tests / 6 suites · typecheck exit 0**

> Marcar cada casilla al terminar la tarea (su commit aparece en `git log`).

## Progreso de ejecución del Plan 2 (data layer)

- [x] Task 1 — derive puro: best-from-logs + skill rows (commits `6b85754`, `233467f`)
- [x] Task 2 — derive puro: readiness de challenges + barrel (commits `0539a92`, `19cfa52`)
- [x] Task 3 — `lib/api/workoutLogs.ts` (commit `1fecbe5`)
- [x] Task 4 — `lib/api/skillTree.ts` + `syncSkillProgress` (commit `5cbfd85`)
- [x] Task 5 — `lib/api/challenges.ts` + `syncChallengeProgress` (commit `56bba9f`)
- [x] Task 6 — barrel exports api (commit `c4e3314`) + hooks React Query (commit `e76b960`)
- [x] Task 7 — verificación full · **40 tests / 7 suites · typecheck exit 0**

> ⚠️ Cuidado con `lib/api/index.ts`: tiene WIP del usuario sin commitear (`export * from './presets'`, con `presets.ts` sin trackear). Los commits del data layer lo excluyen a propósito. Al commitear presets, incluir `presets.ts` + `app/(app)/routine-start.tsx`.

## Cómo retomar si se corta la sesión

1. Lee este archivo + el spec del Árbol (`superpowers/specs/2026-06-14-arbol-screen-slice-design.md`) + el Plan 4 (`superpowers/plans/2026-06-14-arbol-screen-slice.md`).
2. `git log --oneline` para ver qué tareas ya tienen commit. **Última ejecutada: T5 (commit `25352a7`). Siguiente: T6.**
3. Continúa con el skill `superpowers:subagent-driven-development` (un subagente fresco por tarea + review; el dueño debe autorizar el spawn de agentes). Cada tarea del Plan 4 trae su código completo.
4. Trabajo en rama `feat/calistenia-foundation` (no en `main`). La rama tiene WIP del usuario sin commitear (presets/onboarding/avatares) — usar `git add <path>` dirigido, nunca `git add -A`.
5. T11 (seed) corre contra Supabase: requiere `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` en el entorno; sin eso, dejar el script commiteado y marcar el seed como paso manual.
6. La migración `0001_skill_tree.sql` ya está aplicada; T11 solo siembra datos de contenido.
