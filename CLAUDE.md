# gym-flow-app

Una hoja de entrenamiento en papel, digital. React Native + Expo, **solo local**.

Abres la app y ves la tabla del día: `▶ | Ejercicio | Series | Reps | Rest | ☐`.
Marcas lo que haces, el descanso cuenta atrás solo, el ▶ lleva al video.

> Contexto completo en `docs/`. Abrir `docs/` como vault en Obsidian para ver el grafo.
> **Reglas duras en `.claude/RULES.md`** (Must Always / Must Never / Hall of Fame).
> Comandos de workflow en `.claude/commands/` — `/qa-adb`, `/debug`, `/checkpoint`,
> `/ui-review`, `/feature`.

## Architecture Map

### Capas

```
app/ (Expo Router — 4 tabs + 7 pantallas ocultas)
  └── components/          Welcome (bienvenida, solo la 1ª vez)
        │  routine/        RoutineTable · DayTabs · CellEditor
        │                  ExercisePicker · TipsStrip · ShareSheet
        ▼
      lib/store/           Zustand (routineStore · themeStore · tabataStore)
        ▼
      lib/storage/         AsyncStorage + parser defensivo
        ▼
      lib/domain/          Lógica pura: sin I/O, sin React
                           (incluida la paleta, en theme.ts)
```

**La regla de dependencia apunta hacia dentro.** `lib/domain/` no importa nada
de fuera; ahí viven los 242 tests.

**La biblioteca es española, pero su CSV de origen está en inglés.** La
traducción vive en `lib/data/exercise-text-es.json` y `muscle-groups-es.json` y
`npm run seed` la aplica encima. Un ejercicio nuevo sin traducir lo caza
`seeds.test.ts`.

**El tema son dos: claro y oscuro**, monocromos. La paleta vive en
`lib/domain/theme.ts` porque es dato puro, y por eso `theme.test.ts` puede
comprobar el contraste de los 15 pares fondo/texto que la app pinta de verdad.
La regla que evita el bug: **`primary` es tinta** (va sobre el fondo),
**`primaryContainer` es relleno** (el texto va encima, en `onPrimaryContainer`).
Mezclarlas fue un fallo medido de 4,12:1.

### Principio central

**Sin cuenta, sin servidor, sin sincronización, sin pagos.** AsyncStorage es la
única persistencia. En el primer arranque se copian las semillas de `lib/data/`;
después manda el almacenamiento, así que actualizar la app nunca pisa lo editado.

### Modelo

```
Routine → RoutineDay[] (1..7, cíclicos) → RoutineRow[]
Exercise (biblioteca de 169, enlazada por RoutineRow.exerciseId)
```

`reps` es **string**, no number: un parte de coach escribe `6-8`, `fallo` o
`1 min`. Se guarda literal y se interpreta solo al usarlo (`lib/domain/reps.ts`).

### Pantallas

| Pestaña | Ruta | Función |
|---|---|---|
| Hoy ⭐ | `(app)/index` | La tabla del día — el 90% del uso |
| Rutinas | `(app)/routines` | Rutina activa, días, cabecera del parte |
| Ejercicios | `(app)/exercises` | Biblioteca + búsqueda |
| Ajustes | `(app)/settings` | Tema, timers, restaurar datos |

Ocultas: `import` (pegar una rutina), `exercise/[id]`, `stopwatch`, `timer`,
`timer-active`, `tabata`, `tabata-active`, `tabata-summary`.

**Pegar es el camino corto para meter una rutina** y por eso manda sobre
«Nueva» en Rutinas: la rutina ya existe escrita en algún sitio y teclearla
nunca merece la pena.

### Arranque

```
RootLayout → loadTheme() + load()  →  (app)/index
```

Sin AuthGuard y sin redirecciones. La bienvenida del primer arranque es un
`Modal` dentro de Hoy, decidido en la misma lectura del arranque.

### Comandos útiles

```bash
npx expo start                # dev server (Expo Go — ojo con el aviso de abajo)
npm run android               # dev build: prebuild + gradle + instalar
npx tsc --noEmit              # typecheck
npx jest                      # tests
npx expo lint                 # lint
npm run seed                  # regenerar semillas desde el CSV y el parte
```

> **El aviso del descanso no se puede probar en Expo Go.** Expo Go corre con su
> propio AndroidManifest, así que los permisos de alarma exacta que declara
> `plugins/withExactAlarm.js` no existen ahí y la notificación llega minutos
> tarde. Para cualquier cosa que dependa del manifest, dev build.
>
> `android/` está gitignored: se regenera con `npx expo prebuild`.

**Compilar en Windows tiene dos trampas conocidas** (ver `docs/HISTORIAL.md`):

1. `npx expo run:android` se cuelga eligiendo dispositivo si no hay stdin.
   Compilar a mano: `cd android && ./gradlew.bat assembleDebug --no-daemon`,
   luego `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
2. Ninja no soporta rutas >260 caracteres y la del proyecto no cabe. Se sortea
   con un junction corto y un directorio de build corto — ya creados en esta
   máquina:
   - `C:\g` → junction a la raíz del proyecto (`mklink /J`), se compila desde
     `C:\g\android`
   - `C:\b` → salida de Gradle (`subprojects { buildDir }` en
     `android/build.gradle`)
   - `android/gradle.properties` lleva
     `android.packagingOptions.pickFirsts=**/libworklets.so`, porque reanimated
     y worklets emiten los dos el mismo `.so`
   Los tres parches viven en `android/`, que se regenera: **al siguiente
   prebuild hay que volver a ponerlos.** Para deshacerlos: `rmdir C:\g` y
   borrar `C:\b`.

> Toolchain: usar **npx/node**. `node_modules` está montado con pnpm y
> `npx expo install` lo detecta solo; no hace falta invocar pnpm a mano.

## Convenciones

- **La lógica va en `lib/domain/`, con test primero.** Si algo se puede decidir
  sin React ni almacenamiento, ahí es donde vive.
- Las funciones puras devuelven **el objeto original cuando no hay cambio**, para
  que quien llama pueda saltarse la escritura.
- Los iconos son glifos de `MaterialCommunityIcons` (ya viene con
  `@expo/vector-icons`). **Verificar que el nombre existe** en el glyphmap antes
  de usarlo: un nombre inválido no falla en typecheck, se ve en pantalla.
- El detalle de ejercicio lleva ilustración (146 de 169) encima del ▶.
  El mapa lo genera `npm run seed`; los PNG originales de 198 MB no vuelven.
- Toda superficie tocable, mínimo 44 pt de alto.
