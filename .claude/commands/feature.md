---
description: Implementar una feature nueva respetando la arquitectura y el alcance del MVP
argument-hint: "<descripción de la feature>"
---

# Feature — gym-flow-app

**Input**: $ARGUMENTS

---

## Fase 0 — El filtro (antes que nada)

Una sola pregunta:

> **¿Ayuda al usuario a ejecutar su rutina más rápido?**

Si la respuesta es no, la feature **no entra ahora**: se anota en
`docs/decisions.md` como futuro posible y se dice al usuario. Construir "por si
acaso" es exactamente lo que llevó este proyecto a 31 pantallas y 221 MB.

Y comprobar que no contradiga algo ya decidido (`docs/decisions.md`): la nube,
las cuentas, el bilingüe y las imágenes de ejercicios se retiraron a propósito.

---

## Fase 1 — Entender

Antes de abrir un archivo:

1. **Resumen en una línea.**
2. **Qué fricción quita.**
3. **Capas implicadas:**
   - Dominio (`lib/domain/`) — ¿hay una decisión que tomar sin React ni disco?
   - Almacenamiento (`lib/storage/`) — ¿cambia la forma de lo guardado?
   - Estado (`lib/store/`) — ¿nueva acción?
   - UI (`app/`, `components/`) — ¿pantalla, componente, modal?
4. **Camino feliz en 3-5 pasos.**
5. **¿Cambia el modelo persistido?** Si sí → el parser de `serialize.ts` tiene
   que seguir aceptando lo viejo, o resembrará y **el usuario pierde sus datos**.

---

## Fase 2 — Revisar la arquitectura

Leer antes de diseñar:
- `CLAUDE.md` — Architecture Map y convenciones
- `.claude/RULES.md` — Must Always / Must Never
- `lib/domain/types.ts` — el modelo entero
- `docs/domain.md` — qué módulo puro hace qué

Preguntas:
- [ ] ¿Existe ya una función pura que haga esto? (`lib/domain/`)
- [ ] ¿Se puede resolver **sin** tocar el modelo persistido?
- [ ] ¿Necesita una dependencia nueva? Si sí, justificar: el MVP quitó 15.

---

## Fase 3 — Plan

Escribir antes de codificar:

```
Dominio:  <funciones puras nuevas + sus tests>
Storage:  <cambio de forma + compatibilidad hacia atrás>
Store:    <acciones nuevas>
UI:       <pantallas/componentes>
Orden:    dominio (con test) → storage → store → UI
```

**El orden no es negociable.** La lógica primero, con test, y hacia fuera. Si se
empieza por la UI, la lógica termina dentro de un componente y ahí no hay tests.

---

## Fase 4 — Implementación

- **Test primero** para todo lo que viva en `lib/domain/`. Ver fallar, luego pasar.
- Las funciones puras devuelven el objeto original cuando no hay cambio.
- El store solo guarda estado y persiste; no decide nada.
- Verificar nombres de icono contra el glyphmap antes de usarlos.
- Toda superficie tocable, 44 pt mínimo, con `accessibilityLabel` en español.
- Nada de `as any` en nombres de ruta.

---

## Fase 5 — Validación

```bash
npx tsc --noEmit
npx jest
npx expo lint
```

Y en el emulador — **esto no es opcional**:
```
/qa-adb screen <pantalla afectada>
```

Los gates verdes prueban que el dominio está bien. No prueban que la feature
funcione: los tres bugs de la revisión del 2026-09-02 pasaron los tres gates.

---

## Fase 6 — Documentación

- `docs/HISTORIAL.md` — entrada de sesión
- `docs/screens.md` — si hay pantalla nueva
- `docs/domain.md` — si hay módulo puro nuevo
- `CLAUDE.md` — si cambia el Architecture Map
- `.claude/RULES.md` — si apareció un invariante nuevo
- `/checkpoint create "feat: <descripción>"`

---

## Entregable

```
FEATURE — <nombre>

QUÉ HACE      — <una línea>
ARCHIVOS      — <lista con nuevo/modificado>
TESTS         — <N nuevos en lib/domain>
VERIFICADO EN — tsc ✅ jest ✅ lint ✅ emulador ✅
FUERA DE ALCANCE — <lo que se decidió no hacer y por qué>
```
