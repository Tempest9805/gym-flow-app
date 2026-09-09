---
tags: [architecture, gym-flow-app]
---

# Arquitectura

Ver también: [[_INDEX]], [[domain]], [[screens]], [[decisions]]

## Capas

```
app/                      Expo Router — 4 tabs + 8 pantallas ocultas
  └── components/         Welcome · RoutineTable · DayTabs · CellEditor
        │                 ExercisePicker · TipsStrip · ShareSheet
        ▼
      lib/store/          Zustand: estado en memoria
        │                 routineStore · themeStore · tabataStore
        ▼
      lib/storage/        AsyncStorage: repositorio + parser defensivo
        │
        ▼
      lib/domain/         Lógica pura: sin I/O, sin React, sin storage
```

**La regla de dependencia apunta hacia dentro.** `lib/domain/` no importa nada
de las capas de fuera; por eso es la única parte con tests unitarios de verdad
(264 de ellos) y la que sobreviviría intacta si algún día vuelve un backend.

## Arranque

```
RootLayout
  ├── loadTheme()   AsyncStorage
  └── load()        AsyncStorage → siembra si está vacío
        │
        └── (app)/index — Hoy
```

Tres lecturas locales —tema, datos y si ya se vio la bienvenida— y a entrenar.
**No hay AuthGuard ni cadena de redirecciones**: nada se interpone entre abrir
la app y ver la tabla.

La bienvenida del primer arranque es un `Modal` dentro de Hoy, no una ruta con
guarda: se decide en la misma lectura del arranque, así que no hay pantalla de
espera extra ni parpadeo. Ver [[decisions]].

## Persistencia

Dos claves de AsyncStorage:

| Clave | Contenido |
|---|---|
| `gymflow_routines` | Las rutinas, con sus días y filas |
| `gymflow_exercises` | La biblioteca de 169 ejercicios |
| `gymflow_library_version` | Con qué versión de la biblioteca se sembró |
| `gymflow_welcome_seen` | Si ya se vio la bienvenida |

Más `gymflow_theme` y `gymflow_tabata_config` para preferencias.

**En el primer arranque** se copian las semillas de `lib/data/`. A partir de
ahí manda el almacenamiento y las semillas se ignoran, así que actualizar la
app nunca pisa lo que el usuario ha editado. Ajustes → «Restaurar datos
originales» borra las claves y vuelve a sembrar.

**Con una excepción: la biblioteca.** Es dato de referencia y nadie la edita
desde la app, así que se refresca sola cuando `LIBRARY_VERSION` empaquetada es
mayor que la guardada. Sin ese mecanismo, todo lo que se le añada después
—videos, progresiones, las traducciones al español— solo lo verían las
instalaciones nuevas. **Las rutinas son lo contrario: son del usuario y no se
tocan nunca.** Por eso tocar `lib/data/` obliga a subir la versión; está en
`.claude/RULES.md`.

`lib/storage/serialize.ts` valida al leer: cualquier cosa que no encaje con el
modelo se rechaza entera y se vuelve a sembrar, en vez de arrastrar datos a
medio validar. Lo que se puede arreglar sin riesgo (un `focus` ausente, un
`mode` desconocido) se normaliza en lugar de descartarse.

## Escrituras

El store escribe primero en memoria y persiste en segundo plano
(`void save(...).catch(...)`). La UI nunca espera al disco, y un fallo de
almacenamiento no interrumpe a quien está entrenando.

## Estado del día

Los checks se reinician solos: al cargar, cualquier día cuyo `lastResetOn` no
sea hoy y tenga marcas se limpia. Cada día empieza como una hoja en blanco,
igual que en papel. La fecha se calcula en la zona del dispositivo, no en UTC
—si no, entrenar por la noche al oeste de Greenwich reiniciaría un día antes.

## Stack

Expo ~54 · React Native 0.81 · React 19.1 · expo-router ~6 · Zustand ~5 ·
NativeWind ~4 · AsyncStorage · expo-notifications · expo-haptics ·
expo-keep-awake · expo-clipboard

**Sin** Supabase, sin React Query, sin autenticación, sin red.
