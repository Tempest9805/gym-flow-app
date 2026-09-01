# gym-flow-app

Una hoja de entrenamiento en papel, digital. React Native + Expo, **solo local**.

Abres la app y ves la tabla del día: `▶ | Ejercicio | Series | Reps | Rest | ☐`.
Marcas lo que haces, el descanso cuenta atrás solo, el ▶ lleva al video.

> Contexto completo en `docs/`. Abrir `docs/` como vault en Obsidian para ver el grafo.

## Architecture Map

### Capas

```
app/ (Expo Router — 4 tabs + 6 pantallas ocultas)
  └── components/routine/  RoutineTable · DayTabs · CellEditor
        │                  ExercisePicker · TipsStrip · ShareSheet
        ▼
      lib/store/           Zustand (routineStore · themeStore · tabataStore)
        ▼
      lib/storage/         AsyncStorage + parser defensivo
        ▼
      lib/domain/          Lógica pura: sin I/O, sin React
```

**La regla de dependencia apunta hacia dentro.** `lib/domain/` no importa nada
de fuera; ahí viven los 131 tests.

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

Ocultas: `exercise/[id]`, `stopwatch`, `timer`, `timer-active`, `tabata`,
`tabata-active`, `tabata-summary`.

### Arranque

```
RootLayout → loadTheme() + load()  →  (app)/index
```

Sin AuthGuard, sin onboarding, sin redirecciones.

### Comandos útiles

```bash
npx expo start                # dev server
npx expo start --android      # Android
npx expo start --ios          # iOS
npx tsc --noEmit              # typecheck
npx jest                      # tests
npx expo lint                 # lint
npm run seed                  # regenerar semillas desde el CSV y el parte
```

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
- Nada de imágenes de ejercicios: el ▶ abre YouTube.
- Toda superficie tocable, mínimo 44 pt de alto.
