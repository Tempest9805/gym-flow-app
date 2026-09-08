---
tags: [domain, model, gym-flow-app]
---

# Dominio

Ver también: [[_INDEX]], [[architecture]], [[screens]]

Todo en `lib/domain/` es puro: mismas entradas, mismas salidas, sin I/O ni
React. Cada función devuelve un objeto nuevo, o **el original cuando el cambio
no cambiaría nada**, para que quien llama pueda saltarse la escritura.

## Modelo

```
Routine ── name · athleteName? · goal? · coachName?
   └── days: RoutineDay[]        1..7, cíclicos (no días de semana)
         └── label · focus · icon · lastResetOn
         └── rows: RoutineRow[]
               └── name · sets · reps · restSeconds · mode · done
               └── exerciseId? ──► Exercise (biblioteca)

Exercise ── nameEs · muscleGroup · videoUrl? ·
            description? · tips? · commonMistakes?
```

### `reps` es texto, no un número

Es la decisión de modelado que lo condiciona todo. Un parte de coach escribe
`6-8`, `12`, `fallo` o `1 min` — un `number` no puede representarlo. Se guarda
literal lo que escribió el coach y se interpreta solo cuando hace falta
(`lib/domain/reps.ts`), nunca al guardar.

El esquema anterior tenía `reps: z.number()`, y por eso **era incapaz de
representar la rutina real que originó este MVP**.

## Módulos

| Módulo | Responsabilidad |
|---|---|
| `types.ts` | El modelo entero |
| `reps.ts` | Interpretar y formatear repeticiones libres |
| `time.ts` | `m:ss` ↔ segundos, y `m:ss.cc` para el cronómetro |
| `day.ts` | Reset diario, toggle, progreso, `todayIso` |
| `routine.ts` | Alta/baja/edición/orden de filas, días y cabecera |
| `restTimer.ts` | Cuenta atrás del descanso |
| `video.ts` | Link fijado, o búsqueda de YouTube como respaldo |
| `export.ts` | Markdown para persona o LLM |
| `icons.ts` | Glifo del día según su enfoque |
| `theme.ts` | La paleta y el contraste WCAG de cada par que se pinta |
| `progression.ts` | A qué ejercicio pasar cuando este deje de costar |
| `importRoutine.ts` | Leer una rutina pegada como texto y construirla, sin IA |
| `matchExercise.ts` | Unir un nombre escrito a mano con la biblioteca |
| `plural.ts` | Contar en español sin que salga «1 rutinas» |

## Dos detalles que costaron un test

**El temporizador guarda el instante en que termina**, no un contador que baja.
Es la diferencia entre un descanso que sobrevive a la pantalla apagada y uno
que se congela en el bolsillo: al volver se recalcula desde el reloj, y uno que
venció estando fuera ya está terminado.

**Un día compuesto lo define su primer músculo.** «Espalda y bíceps» es día de
espalda; «Bíceps y espalda» es día de brazo. `iconForFocus` elige la palabra
clave que aparece antes en el texto, no la que esté primero en su tabla
interna. Un test lo destapó: la primera versión daba icono de brazo a un día
de espalda.

## Pegar una rutina

Dos piezas, las dos puras y con tests:

`parseRoutineText` convierte el texto en días y filas. La regla que lo gobierna
es **no perder nunca una línea**: lo que no sabe leer se guarda como fila con
su texto literal y sus valores por defecto, que el usuario corrige de un toque.
Es preferible una fila a medias que una línea desaparecida en silencio.

`routineFromParsed` lo vuelve una `Routine` de verdad y, de paso, intenta atar
cada fila a la biblioteca con `findExercise`. Cuando lo consigue, la fila hereda
gratis la ilustración, el video y la escalera de progresión. El nombre que se
guarda es **siempre el que escribió el usuario**, también cuando hay ejercicio
enlazado: su parte dice «Push ups clásicas» y eso es lo que reconoce de un
vistazo.

`findExercise` es deliberadamente estricto —juego exacto de palabras, o
contención completa, y `null` ante un empate—. Mide 19 de 26 sobre la rutina
real de cuatro días, sin ningún emparejamiento incorrecto. Ver [[decisions]].

## Semillas

`lib/data/` se genera offline y se versiona:

| Archivo | Contenido | Generador |
|---|---|---|
| `exercises.seed.json` | 169 ejercicios | `scripts/build-exercise-seed.mjs` |
| `extra-exercises.json` | Los 8 que el CSV no cubría, escritos a mano | — |
| `routine-pablo.seed.json` | 6 días / 47 filas | `scripts/build-routine-seed.mjs` |
| `progressions.json` | 39 escaleras de dificultad, curadas a mano | — |
| `exercise-text-es.json` | Descripción, consejos y errores de los 161 del CSV, en español | — |
| `muscle-groups-es.json` | Las 48 piezas de grupo muscular, en español | — |
| `exercise-images.ts` | Mapa de `require()` de las 146 ilustraciones | `scripts/build-exercise-images.mjs` |

`npm run seed` los regenera todos. `lib/data/__tests__/seeds.test.ts` es el
contrato entre los generadores y la app: si una semilla deja de encajar con el
modelo, si una fila apunta a un ejercicio que ya no existe, o si una
descripción o un grupo muscular se quedan en inglés, falla antes de que la app
arranque.

**El CSV de origen está en inglés y se queda así.** La versión española se
aplica encima al generar, no sustituye a la fuente. Un ejercicio nuevo sin su
entrada en `exercise-text-es.json` no revienta el seed, pero sí el test — que
es donde se quiere ver.
