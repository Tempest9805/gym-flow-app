---
tags: [index, gym-flow-app]
---

# gym-flow-app

Aplicación móvil de fitness construida con Expo + Supabase. Permite gestionar rutinas de ejercicio, seguir una agenda semanal, compartir rutinas entre usuarios y usar timers Tabata.

## Notas

- [[architecture]] — Stack, capas, secuencia de arranque
- [[entities]] — Modelo de datos (Zod schemas)
- [[screens]] — Mapa de rutas y pantallas
- [[data-flow]] — Flujos principales de datos
- [[stores]] — Estado global (Zustand)
- [[services]] — Capa de API / Supabase

## Pivote calistenia (2026-06)

- [[roadmap]] — **Estado vivo del rediseño** (dónde estamos, secuencia de planes, cómo retomar)
- [[market_research]] — Investigación de mercado que motivó el pivote
- Spec de diseño (madre) → `superpowers/specs/2026-06-13-calistenia-skill-tree-design.md`
- Spec Árbol (slice) → `superpowers/specs/2026-06-14-arbol-screen-slice-design.md`
- Plan 1 (núcleo lógica+datos) ✅ → `superpowers/plans/2026-06-13-logic-core-and-data-schema.md`
- Plan 2 (capa de datos + hooks) ✅ → `superpowers/plans/2026-06-14-skill-tree-data-layer.md`
- Plan 3 (navegación 5 tabs) ✅ → `superpowers/plans/2026-06-14-nav-restructure-5-tabs.md`
- Plan 4 (pantalla Árbol slice) ⏳ T1–T5 → `superpowers/plans/2026-06-14-arbol-screen-slice.md`

## Links rápidos

| Archivo | Propósito |
|---|---|
| `app/_layout.tsx` | Entry point, providers, AuthGuard |
| `app/(app)/_layout.tsx` | Tab navigator + StitchTabBar |
| `lib/api/schemas.ts` | Todos los tipos Zod |
| `lib/supabase.ts` | Cliente Supabase con SecureStore |
| `lib/store/` | Todos los stores Zustand |
| `lib/api/` | Capa de acceso a datos |
