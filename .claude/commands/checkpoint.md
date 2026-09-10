---
description: Guardar un estado limpio — gates verdes + commit + entrada en HISTORIAL + sync de docs
argument-hint: [create <descripción> | list]
---

# Checkpoint — gym-flow-app

**Input**: $ARGUMENTS

---

## Modo `list`

```bash
git log --oneline -10
```
Y mostrar las últimas 5 entradas de `docs/HISTORIAL.md`.

---

## Modo `create <descripción>` (por defecto)

### Paso 1 — Gates

```bash
npx tsc --noEmit
npx jest
npx expo lint
```

Si algo falla → **parar y arreglar**. Un checkpoint con gates rojos no sirve
para nada: su único valor es ser un punto al que volver con confianza.

### Paso 2 — Revisar qué entra

```bash
git status --short
git diff --stat
```

Verificar que **no entra `.env`** (está en `.gitignore`; que siga así) ni
`dist/` ni binarios.

### Paso 3 — Commit

```bash
git add -A
git commit -m "<tipo>: <descripción>"
```

Tipos: `feat` · `fix` · `refactor` · `docs` · `chore` · `test`.

El cuerpo explica **por qué**, no qué. El diff ya dice qué.

### Paso 4 — HISTORIAL

Añadir entrada en `docs/HISTORIAL.md`, **arriba del todo** (más reciente
primero):

```
- **<fecha>** — <descripción> — tsc ✅ · jest <N> ✅ · lint ✅ — `<sha>`
```

Si se corrigió un bug, incluir la causa raíz en una línea.

### Paso 5 — Sincronizar docs

Revisar y actualizar solo lo que cambió de verdad:

- `docs/decisions.md` — si se tomó o revirtió una decisión de producto
- `docs/architecture.md` — si cambiaron capas, arranque o persistencia
- `docs/domain.md` — si cambió el modelo o se añadió un módulo puro
- `docs/screens.md` — si se añadió, quitó o renombró una pantalla
- `.claude/RULES.md` — si se descubrió una regla o una causa raíz nueva
- `CLAUDE.md` — si cambió el Architecture Map o las convenciones

Saltar los que no cambiaron. No inventar entradas para parecer completo.

### Paso 6 — Commit de docs (si hubo cambios)

```bash
git add docs/ CLAUDE.md .claude/RULES.md
git commit -m "docs: <qué se actualizó>"
```

Solo si realmente cambiaron. Nada de commits vacíos.

### Paso 7 — Reporte

```
✅ Checkpoint
Commit:  <sha> (<descripción>)
Docs:    <sha> | sin cambios
tsc ✅   jest <N>/<N> ✅   lint ✅

Volver aquí: git checkout <sha>
```

---

## Cuándo hacer checkpoint

- Antes de un refactor arriesgado
- Después de confirmar que un bug está arreglado **en el emulador**, no solo en tsc
- Después de un QA con buen resultado
- Al cerrar una sesión de trabajo

## Trampas

- Nunca con gates rojos.
- El HISTORIAL va **más reciente primero**.
- Un checkpoint no es un push. Pushear es decisión aparte y explícita.
