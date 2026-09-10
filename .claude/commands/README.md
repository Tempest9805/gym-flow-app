# gym-flow-app — Slash Commands

Invocar con `/nombre` en Claude Code.

| Comando | Cuándo | Duración |
|---|---|---|
| `/qa-adb` | QA contra el emulador. El gate de calidad real | 15–30 min |
| `/debug` | Un bug concreto: antecedentes → causa raíz → arreglo verificado | variable |
| `/checkpoint` | Guardar estado limpio: gates + commit + HISTORIAL | 1–2 min |
| `/ui-review` | Auditar tabla, spacing, temas, teclado, tablet, a11y | 10–15 min |
| `/feature` | Feature nueva sin romper la arquitectura ni el alcance | variable |

---

## Flujos

**Sesión de trabajo normal**
```
/feature "<qué>"          → o edición directa
/qa-adb screen <pantalla> → verificar en el emulador
/checkpoint create "..."  → guardar
```

**Algo está roto**
```
/debug "<síntoma>"
/qa-adb screen <pantalla>   ← confirmar el arreglo
/checkpoint create "fix: ..."
```

**Antes de dar algo por terminado**
```
/qa-adb full
/ui-review quick
/checkpoint create "..."
```

---

## Argumentos

```
/qa-adb                          # full
/qa-adb screen hoy
/ui-review quick
/ui-review screen rutinas
/debug "el descanso no avisa en background"
/checkpoint create "fix: DESHACER usaba el día equivocado"
/checkpoint list
```

---

## Archivos de apoyo

- `.claude/RULES.md` — Must Always / Must Never / Hall of Fame
- `docs/HISTORIAL.md` — timeline de sesiones y bugs resueltos
- `docs/decisions.md` — qué se eliminó y por qué (no re-discutir)
- `CLAUDE.md` — Architecture Map

---

## Qué NO se importó, y por qué

Adaptados de `DailyBudget`, que comparte stack (Expo + RN + ADB). Se dejaron
fuera a propósito:

| Comando | Por qué no |
|---|---|
| `/supabase-check` | No hay Supabase. El proyecto ya ni existe |
| `/revenuecat-check` | No hay pagos ni entitlements |
| `/release` | No hay `eas.json` ni Play Console para esta app todavía. Cuando lo haya, se adapta |
| `/qa-regression` | Se solapaba casi entero con `/qa-adb`; lo útil está incorporado ahí |
| `/product-review` | Es para rondas de feedback de testers. No hay testers aún |

De `ECC` no se importó nada: sus comandos son andamios autogenerados que
apuntan a los archivos de aquel repo (`manifests/*`, `schemas/*`) con pasos
genéricos, y su skill son convenciones autogeneradas de un proyecto JavaScript
distinto. Su propio archivo de guardrails advierte que se revise antes de
tratarlo como política.
