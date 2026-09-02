---
description: Diagnóstico sistemático de un bug — antecedentes primero, código después
argument-hint: "<síntoma>"  (ej. "el descanso no avisa" | "se pierde lo editado")
---

# Debug — gym-flow-app

Flujo de 7 fases. **Buscar antecedentes antes de tocar código**: la mitad de los
bugs de este proyecto son una causa raíz que ya está escrita en algún sitio.

**Input**: $ARGUMENTS

---

## Fase 1 — Entender el síntoma

Responder antes de abrir un solo archivo:

1. **¿Qué falla exactamente?** (no "no funciona": "al marcar la fila 3 del Día 2,
   la celda Rest no cuenta atrás")
2. **¿Cuándo falla?** (siempre / tras reabrir / tras cambiar de día / solo en
   segundo plano / solo tras editar)
3. **¿Es una regresión?** ¿Funcionaba antes? ¿Qué cambió?
4. **¿Se reproduce desde estado limpio?** (`adb shell pm clear com.gymflow.app`)

Sin esto, seguir es adivinar.

---

## Fase 2 — Antecedentes

**Paso 1 — Hall of Fame** (`.claude/RULES.md`): ¿el síntoma se parece a una
causa raíz ya vista? Si sí, probar esa hipótesis **primero**.

**Paso 2 — Must Never** (`.claude/RULES.md`): ¿el área tocada tiene una regla?
Temporizadores, `isLoaded`, acciones con `dayId`, escrituras a AsyncStorage y
nombres de iconos tienen una cada uno.

**Paso 3 — Historial** (`docs/HISTORIAL.md`): buscar por pantalla y por síntoma.

**Paso 4 — Decisiones** (`docs/decisions.md`): ¿es un bug o es algo que se
eliminó a propósito? El bilingüe, la nube y las imágenes **no son bugs**.

---

## Fase 3 — Diagnóstico técnico

### 3A — Clasificar por patrón

| Síntoma | Causa probable | Dónde mirar |
|---|---|---|
| Un cambio se pierde al reabrir la app | La escritura no llegó al repositorio, o el parser la rechazó entera | `lib/storage/serialize.ts`, `repository.ts` |
| Toda la rutina vuelve a la semilla | El parser rechazó el payload por un campo inválido y resembró | `parseRoutines` — es deliberadamente todo-o-nada |
| Una edición no hace nada | La función pura devolvió el objeto original (id no encontrado) | `lib/domain/routine.ts`, `day.ts` |
| El descanso no arranca | `restSeconds` es 0, o `start()` salió temprano | `useRestTimer`, `handleToggle` |
| Suena un aviso que no tocaba | Programado tras un `await` sin comprobar la generación | `useRestTimer` |
| El contador se congela en background | Alguien lo convirtió en contador en vez de instante final | `lib/domain/restTimer.ts` |
| Una acción afecta al día equivocado | Se usó el día en pantalla en vez del `dayId` de la acción | `app/(app)/index.tsx` |
| Te expulsa a Hoy tras una acción | Algo puso `isLoaded` en `false` | `lib/store/routineStore.ts`, `app/_layout.tsx` |
| Un icono es un cuadro vacío | Nombre de glifo inexistente | verificar contra el glyphmap |
| Los checks no se limpian de un día para otro | `lastResetOn`, o `todayIso` calculado en UTC | `lib/domain/day.ts` |
| Un ejercicio no aparece al buscar | El plegado de acentos | `fold()` en la pantalla correspondiente |

### 3B — Comprobar la regla de dependencia

```bash
# lib/domain/ no puede importar nada de fuera. Esperado: 0 resultados.
grep -rn "from '@/lib/\(storage\|store\|hooks\)'\|from 'react'\|from 'react-native'" lib/domain/
```

### 3C — Ver el estado real en el dispositivo

```powershell
# ¿Qué hay guardado de verdad?
adb shell run-as com.gymflow.app ls files
# En un build de release run-as no está disponible: entonces exponer el valor
# temporalmente en un Alert desde la app y revertir.
```

### 3D — Aislar en el dominio

Si el síntoma se puede expresar sin React ni almacenamiento, **escribir un test
que falle** en `lib/domain/__tests__/`. Es más rápido que otra vuelta de
emulador, y deja la regresión cubierta para siempre.

Si **no** se puede expresar así, anotarlo: los tres bugs de la revisión del
2026-09-02 vivían todos en el cableado, que no tiene tests. Eso es una señal de
dónde falta cobertura, no una excusa.

---

## Fase 4 — Prevenir la recurrencia

Antes de escribir el arreglo:

1. **Causa raíz en una línea.**
2. **Por qué no se detectó antes** (qué test habría hecho falta).
3. **Qué invariante se violó** — o cuál debería existir y no existía.
4. **¿El patrón está en otros archivos?** Buscarlo antes de arreglar uno solo.

---

## Fase 5 — Implementación

- **Cambio mínimo.** Nada de refactorizar de paso ni renombrar variables.
- Sin abstracciones nuevas salvo que el bug las exija.
- Si toca varios archivos, listarlos antes de empezar.
- No tocar nada de Must Never sin aprobación explícita.

---

## Fase 6 — Verificación

```bash
npx tsc --noEmit
npx jest
npx expo lint
```

Y en el emulador, el módulo afectado: `/qa-adb screen <nombre>`.

**No basta con que compile.** Reproducir el escenario original y confirmar que
el síntoma desapareció, incluido el caso límite que lo provocaba.

---

## Fase 7 — Documentación

1. `docs/HISTORIAL.md` — entrada con síntoma, causa raíz, arreglo y archivos.
2. Si la causa raíz es nueva → **añadirla al Hall of Fame** de `.claude/RULES.md`.
3. Si reveló una regla → añadirla a Must Always / Must Never.
4. `/checkpoint create "fix: <descripción>"`.
