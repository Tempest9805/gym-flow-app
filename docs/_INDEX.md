---
tags: [index, gym-flow-app]
---

# gym-flow-app

Una hoja de entrenamiento en papel, digital.

Abres la app y ves la tabla del día: `▶ | Ejercicio | Series | Reps | Rest | ☐`.
Marcas lo que vas haciendo, el descanso cuenta atrás solo, y el ▶ te lleva al
video. Nada más.

**Sin cuenta, sin servidor, sin sincronización, sin pagos.** Todo vive en el
dispositivo.

## Notas

- [[architecture]] — Capas, arranque, y por qué está montado así
- [[domain]] — El modelo de datos y la lógica pura
- [[screens]] — Las 4 pestañas y las pantallas ocultas
- [[decisions]] — Qué se eliminó del proyecto anterior y por qué
- [[HISTORIAL]] — Timeline de sesiones y bugs resueltos

## Referencia rápida

| Archivo | Para qué |
|---|---|
| `app/(app)/index.tsx` | Hoy — la pantalla que importa |
| `app/(app)/import.tsx` | Pegar una rutina escrita |
| `components/routine/RoutineTable.tsx` | La tabla |
| `lib/domain/` | Toda la lógica, sin I/O ni React |
| `lib/storage/repository.ts` | AsyncStorage: la única persistencia |
| `lib/store/routineStore.ts` | Estado en memoria + escritura diferida |
| `lib/data/*.seed.json` | Semillas generadas por `npm run seed` |
| `lib/data/*-es.json` | La biblioteca en español, encima del CSV inglés |

## Comandos de Claude Code

`/qa-adb` · `/debug` · `/checkpoint` · `/ui-review` · `/feature`
Ver `.claude/commands/README.md`. Reglas duras en `.claude/RULES.md`.

## Comandos

```bash
npx expo start          # dev server
npx tsc --noEmit        # typecheck
npx jest                # tests
npx expo lint           # lint
npm run seed            # regenerar las semillas desde el CSV y el parte
```
