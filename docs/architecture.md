---
tags: [architecture, gym-flow-app]
---

# Arquitectura

Ver también: [[_INDEX]], [[domain]], [[screens]], [[decisions]]

## Capas

```
app/                      Expo Router — 4 tabs + 6 pantallas ocultas
  └── components/         RoutineTable · DayTabs · CellEditor · ExercisePicker
        │                 TipsStrip · ShareSheet
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
(131 de ellos) y la que sobreviviría intacta si algún día vuelve un backend.

## Arranque

```
RootLayout
  ├── loadTheme()   AsyncStorage
  └── load()        AsyncStorage → siembra si está vacío
        │
        └── (app)/index — Hoy
```

Dos lecturas locales y a entrenar. **No hay AuthGuard, ni onboarding, ni
redirecciones**: nada se interpone entre abrir la app y ver la tabla.

## Persistencia

Dos claves de AsyncStorage:

| Clave | Contenido |
|---|---|
| `gymflow_routines` | Las rutinas, con sus días y filas |
| `gymflow_exercises` | La biblioteca de 169 ejercicios |

Más `gymflow_theme` y `gymflow_tabata_config` para preferencias.

**En el primer arranque** se copian las semillas de `lib/data/`. A partir de
ahí manda el almacenamiento y las semillas se ignoran, así que actualizar la
app nunca pisa lo que el usuario ha editado. Ajustes → «Restaurar datos
originales» borra las claves y vuelve a sembrar.

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
