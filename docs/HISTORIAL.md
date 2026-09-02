---
tags: [historial, sesiones, gym-flow-app]
---

# Historial

Timeline de sesiones. **Más reciente primero.** Lo escribe `/checkpoint`.

Ver también: [[_INDEX]], [[decisions]], `.claude/RULES.md`

---

## 2026-09-02 — Herramientas de trabajo

Importados y adaptados los comandos de `DailyBudget` (mismo stack Expo + RN +
ADB): `/qa-adb`, `/debug`, `/checkpoint`, `/ui-review`, `/feature`, más
`.claude/RULES.md` con el Hall of Fame de este proyecto. De `ECC` no se importó
nada: sus comandos son andamios autogenerados de otro repo.

Las coordenadas ADB de DailyBudget **no** se copiaron: son de otra resolución.
`/qa-adb` las deriva del `uiautomator dump`.

---

## 2026-09-02 — Revisión del refactor: 3 bugs

Los 133 tests cubren `lib/domain/`, que es puro. Los tres bugs vivían en el
cableado y la UI, donde no llega ningún test.

- **DESHACER restauraba en el día equivocado** — el handler usaba el día en
  pantalla, no el de origen de la acción. `RemovedRow` ahora lleva su `dayId`,
  y el aviso se retira al cambiar de día. `8161552`
- **El descanso podía programar un aviso ya cancelado** — pedir permiso de
  notificaciones es asíncrono; sin token de generación el programado stale
  sobrevivía y sonaba minutos después. Peor: su id pisaba el del temporizador
  nuevo. El comentario decía que esto se comprobaba; el código no lo hacía.
- **"Restaurar datos originales" expulsaba a Hoy** — `isLoaded: false` hace que
  el layout raíz cambie el navegador entero por la pantalla de carga.

Además: `removeRoutine` tenía una condición con una mitad lógicamente
redundante, y se quitó un `as any` sobre `/tabata-summary` que ocultaba errores
de ruta justo después de renumerarlas.

tsc ✅ · jest 133 ✅ · lint ✅ · Metro empaqueta ✅

---

## 2026-09-01 — Refactor a MVP (F1–F6)

Reducción de un sistema de gestión (31 pantallas, 14 tablas Supabase, 221 MB de
assets) a una hoja de entrenamiento local. Disparador: `Rutina pablo.pdf`, un
parte real de coach que además es **de gimnasio**, no de calistenia — lo que
descartó el pivote anterior. El proyecto Supabase asociado ya no resolvía por
DNS, así que quitar la nube pasó de opción a necesidad.

| Fase | Qué | Commit |
|---|---|---|
| F1 | Demolición sin riesgo: árbol de skills, QR, agenda, presets, 158 MB de PNG | `2855fdc` |
| F2 | Núcleo local: `lib/domain/` con TDD, `lib/storage/`, semillas (169 ejercicios, 47 filas) | `aa33d1f` |
| F3 | Corte del cordón: sin auth, sin Supabase, sin React Query. 31 rutas → 11 | `3849240` |
| F4 | Tabla editable, gestión de días y cabecera del parte | `da627c5` |
| F5 | Descanso con aviso en segundo plano, cronómetro, tabata | `4740083` |
| F6 | Exportar/copiar, eslint (llevaba roto todo el proyecto), poda de 15 deps, docs | `52acebd` |
| — | 37 videos de YouTube fijados para la rutina | `12b726f` |

Resultado: 31 rutas → 11 · assets 221 MB → 9,4 MB · −15 dependencias ·
0 tests útiles → 133.

Plan completo y decisiones en [[decisions]].
