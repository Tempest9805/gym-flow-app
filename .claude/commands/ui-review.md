---
description: Auditar la interfaz — tabla, spacing, temas, teclado, tablet y accesibilidad
argument-hint: [quick | screen <hoy|rutinas|ejercicios|ajustes|detalle|timers>]
---

# UI Review — gym-flow-app

**Input**: $ARGUMENTS

La referencia visual es **una hoja de entrenamiento en papel**: densa, legible de
un vistazo, sin adornos. Si un elemento no ayuda a leer la fila o a marcarla, sobra.

---

## Tokens del proyecto

Vienen de `useTheme()` (`lib/store/themeStore.ts`). Dos temas: morado y naranja.

```
background · surfaceContainerLow/High/Highest · outline · outlineVariant
primary · primaryContainer · onPrimaryContainer
onSurface · onSurfaceVariant · secondary · error
```

**Nunca hardcodear un color.** Si un valor no sale de `useTheme()`, es un
hallazgo — se ve mal en el otro tema por definición.

---

## Check 1 — La tabla (`RoutineTable`)

Es el 90% del uso. Se audita primero y con más rigor.

- [ ] **Cero scroll horizontal** en cualquier ancho.
- [ ] Cabecera alineada columna a columna con las filas.
- [ ] Nombres largos envuelven a 2 líneas sin descuadrar la fila.
- [ ] Fila marcada: tachada **y** atenuada. Se distingue de un vistazo cuál toca.
- [ ] Filas alternas distinguibles sin ser ruidosas.
- [ ] Celda Rest en cuenta atrás: más grande y en `primaryContainer`, claramente
      destacada sobre el resto.
- [ ] Modo edición: `↑ ↓ ✕` caben y la tabla no se descuadra.
- [ ] El ▶ de una fila `tabata` se distingue del ▶ normal.

## Check 2 — Spacing y alineación

- [ ] Padding consistente entre pantallas; nada pegado al borde.
- [ ] Las cuatro pantallas principales usan la misma cabecera (título 2xl).
- [ ] Separaciones entre bloques coherentes (no 12 aquí y 20 allá sin motivo).

## Check 3 — Teclado

- [ ] `CellEditor`: el input y el botón Guardar quedan visibles con teclado.
- [ ] Buscador de Ejercicios y de `ExercisePicker`: la lista sigue usable.
- [ ] Sheets de Rutinas (enfoque, cabecera): los 4 campos alcanzables.
- [ ] **BACK no cierra el modal entero** al intentar salir del teclado. Para
      cambiar de campo, tapear el siguiente input.

## Check 4 — Barra de gestos y safe areas

- [ ] La tab bar respeta `insets.bottom`; la barra de gestos no la tapa.
- [ ] El aviso de DESHACER, que va `absolute bottom-4`, no queda debajo de la
      tab bar ni de la barra de gestos.
- [ ] Los sheets anclados abajo respetan el inset.

## Check 5 — Temas

- [ ] Alternar morado ↔ naranja: las 4 tabs cambian al instante, sin flicker.
- [ ] Contraste legible en ambos: texto sobre `surfaceContainerLow`, y sobre
      `primaryContainer` en la cabecera de la tabla.
- [ ] La fila atenuada sigue siendo legible (no desaparece).

## Check 6 — Estados

- [ ] Vacío: rutina sin días, día sin filas, búsqueda sin resultados — cada uno
      con su mensaje y su salida, nunca una pantalla en blanco.
- [ ] Deshabilitado: `Vuelta`/`Reiniciar` del cronómetro parado; Guardar con
      valor inválido.
- [ ] Carga: la pantalla inicial no parpadea entre `LoadingScreen` y contenido.

## Check 7 — Accesibilidad

- [ ] **Toda superficie tocable mide 44 pt de alto o más.** Es regla dura.
- [ ] Todo control tiene `accessibilityLabel` en español y con sentido.
- [ ] Checkbox con `accessibilityRole="checkbox"` y su `checked`.
- [ ] Pestañas de día con `role="tab"` y `selected`.
- [ ] El label del descanso dice cuánto queda y que se puede detener.

## Check 8 — Iconos

- [ ] Ninguno se ve como cuadro vacío.
- [ ] Verificar cualquier nombre nuevo contra el glyphmap **antes** de usarlo:
      ```bash
      node -e "const g=require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'); console.log('NOMBRE' in g)"
      ```

## Check 9 — Tablet

```powershell
adb shell wm size 1600x2560   # probar
adb shell wm size reset       # restaurar SIEMPRE al terminar
```
- [ ] Columnas y tipografía crecen (`>= 768` pt).
- [ ] Sigue sin scroll horizontal; la tabla usa el ancho, no se queda estrecha.

---

## Modo `quick` — los 5 críticos

1. Sin scroll horizontal en la tabla, en móvil y tablet.
2. Fila marcada tachada y distinguible.
3. Cambio de tema instantáneo en las 4 tabs.
4. Teclado no tapa Guardar en `CellEditor`.
5. Ningún icono roto.

---

## Salida esperada

```
UI REVIEW — <pantalla o full> — <fecha>

HALLAZGOS
  P1 — <rompe la lectura o el uso>
  P2 — <notable, no bloqueante>
  P3 — <cosmético>

CAPTURAS: <pantalla + tema>
```

Cada hallazgo lleva pantalla, tema y descripción. Sin eso no es accionable.
