---
tags: [historial, sesiones, gym-flow-app]
---

# Historial

Timeline de sesiones. **Más reciente primero.** Lo escribe `/checkpoint`.

Ver también: [[_INDEX]], [[decisions]], `.claude/RULES.md`

---

## 2026-09-08 — Contraste en los timers, insets, e imágenes de vuelta

### Los bugs de contraste, medidos

`AppTopBar` hardcodeaba fondo `#0A0A0A` y tomaba la tinta del tema: en claro
daba **1,14:1**, invisible. Era la barra de Tabata y del Temporizador. Se borró
—se titulaba «ELITE PERFORMANCE» y llevaba un selector de idioma muerto— y las
dos pantallas pasaron a la misma cabecera con ‹ que ya usaban Cronómetro y el
detalle de ejercicio.

Además:

- `outlineVariant` (token de **borde**) usado como color de texto en dos sitios:
  **1,39:1** en claro, **1,55:1** en oscuro. Invisible en ambos, y anterior al
  cambio de tema.
- Temporizador: 6 fondos de botón en `rgba(255,255,255,0.05)`, invisibles sobre
  claro.
- **Un bug propio**: al despurpurar, el script cambió `#bc13fe` por blanco en el
  botón de Tabata, cuyo texto ya era blanco. Botón blanco con letras blancas.
- `tabata.tsx` reescrita contra el tema (tenía **0 tokens y 31 valores fijos**)
  y traducida.

### La barra de navegación tapaba las pestañas

`edgeToEdgeEnabled` hace que la app dibuje bajo la barra del sistema, y la tab
bar usaba `paddingBottom: 10` fijo. Con gestos (~24dp) casi colaba; **con los
tres botones (~48dp) las cuatro pestañas quedaban detrás de ◀ ● ■ y no se
podían tocar.** Verificado en el emulador antes y después. Ahora usa
`useSafeAreaInsets()`, y las tres hojas ancladas abajo también.

### Números cortados en el temporizador

Un `<Text>` de 40px con otro de 16px anidado dentro y sin `lineHeight`: Android
recortaba ascendentes y descendentes. La unidad pasa a ser `Text` hermano con
`lineHeight` explícito. De paso, `ControlRow` se redefinía en cada render.

### Imágenes de ejercicio

Recuperadas de `git` (`2855fdc^`), juego `normalized` (900×536): **146 de 169
ejercicios, 12,3 MB**. Van en el detalle encima del botón de video, sobre lámina
blanca porque el dibujo tiene fondo blanco. Los 23 sin imagen simplemente no la
muestran. El mapa de `require()` lo genera `scripts/build-exercise-images.mjs`
dentro de `npm run seed`, y falla si sobra una imagen sin ejercicio.

Se anotó la excepción en `.claude/RULES.md`: los 198 MB de PNG originales siguen
prohibidos; los webp de 12,3 MB entran.

### Hallazgo sin resolver: el contenido está en inglés

**161 de los 169 ejercicios tienen `description` y `tips` en inglés.** El detalle
muestra «EJECUCIÓN» y «RECOMENDACIONES» con el cuerpo en inglés. Solo los 8
escritos a mano están en español. Esto cambia el encargo del bilingüe: no falta
inglés, falta **español**. Pendiente de decidir.


### Progresiones, y por qué la biblioteca no se actualizaba

La progresión vive en la **biblioteca**, no en la tabla: es dato de referencia
(«cuando las flexiones dejen de costar, pasa a las declinadas»), no algo que
cambie de un día para otro. `Exercise.progressesTo` + `lib/data/progressions.json`
con **39 escaleras** curadas, validadas en los dos sentidos por `npm run seed`.
Solo hay entrada cuando cambia el movimiento: añadir peso no es otro ejercicio.

Al probarlo salió algo más gordo: **la tarjeta no aparecía porque el
almacenamiento manda tras la primera siembra.** La biblioteca es dato de
referencia que nadie edita, así que congelarla en la instalación dejaba fuera
todo lo que se le añadiera después — progresiones, videos, y las traducciones al
español que están pendientes. Ahora `LIBRARY_VERSION` la refresca cuando la
empaquetada es más nueva; las rutinas, que sí son del usuario, no se tocan.

### Imagen del ejercicio anterior

`expo-router` reutiliza la pantalla de detalle, y `expo-image` mantenía la
imagen vieja mientras cargaba la nueva. `recyclingKey` — su documentación
describe el síntoma literalmente.

### Fluidez: el APK es de debug

`DEBUGGABLE`, con el bundle de JS descargándose de Metro en cada arranque en vez
de embebido. Revisados los selectores de Zustand: estables, ninguno crea objetos
por render. El build de release para medirlo falló por el mismo problema de
rutas largas de Windows. **Pendiente de medir de verdad.**


### Importador: pegar la rutina como texto

`lib/domain/importRoutine.ts` — parsing puro, sin IA y sin red. Entiende
cabeceras, viñetas, `4x15`, `5×5`, `10 por lado`, `3x60seg`, separadores
decorativos, y convierte una línea de cuerda en fila de tabata. Lo que va tras
una flecha se descarta: es progresión, y esa vive en la biblioteca.

Regla del parser: **no perder nunca una línea.** Lo que no sabe leer entra con
su texto literal para corregirlo de un toque.

Probado contra la rutina real de 4 días: filas 8/8/7/7, cada día terminando en
la cuerda, **cero líneas sin leer**.

tsc ✅ · jest 202 ✅ · lint ✅ · comprobado en emulador

Commits: `71ba25c` tema · `2159e67` ejercicios · `65f10e8` importador

---

## 2026-09-03 — Tema en blanco y negro, con el contraste como test

Neon Purple y Neon Orange desaparecen. El eje del ajuste deja de ser «qué
acento» y pasa a ser **claro u oscuro**: el claro es la hoja de papel, el
oscuro su negativo, que es literalmente lo que la app dice ser.

### Dos bugs de contraste reales, medidos

| | Antes | Ahora |
|---|---|---|
| Acento como texto (contador `0/7`, `+ Añadir`) — tema morado | **4,12:1** ❌ | 21:1 · 14,7:1 |
| Botón «Copiado» — tema naranja | **2,48:1** ❌ | 14,2:1 · 8,5:1 |
| Cabecera de tabla (margen sobre AA) | 4,50 y 4,55 — cero margen | 21:1 · 17,4:1 |

La causa raíz era una sola: **`primaryContainer` hacía de relleno y de tinta a
la vez** — 54 usos frente a 9 de `primary`. Un acento de tono medio no puede
cumplir las dos cosas. Se separaron los roles en 33 sitios.

### Dónde vive ahora

`lib/domain/theme.ts` — la paleta es dato puro, así que baja al dominio. Eso
permite que `theme.test.ts` compruebe los **15 pares fondo/texto que la app
pinta de verdad**, en los dos temas: un retoque futuro que rompa la
legibilidad falla en jest, no en una pantalla. El store se queda solo con
elegir y persistir.

`themeIdFromStored()` migra lo guardado: `purple` y `orange` eran los dos
oscuros, así que ambos caen en `dark`. Nadie se encuentra la app en claro
después de actualizar.

### De paso

- Se quitó el morado hardcodeado de las tres pantallas de tabata (27 valores).
  Siguen siendo oscuras a propósito: son pantallas inmersivas de temporizador.
- `LoadingScreen` importaba `PURPLE_THEME`, que ya no existe.

tsc ✅ · jest 174 (133 + 41 del tema) ✅ · lint ✅

Diseño y auditoría completa: artefacto «Tema blanco y negro».

---

## 2026-09-02 — P1 del descanso: arreglado y verificado en un dev build

`plugins/withExactAlarm.js` declara `USE_EXACT_ALARM` (Android 13+, concedido al
instalar) y `SCHEDULE_EXACT_ALARM` con `maxSdkVersion=32` para Android 12. Hace
falta un plugin porque `android.permissions` de app.json sólo escribe
`android:name` y el tope de versión es justo lo que evita que el segundo permiso
llegue a Android 13+, donde exigiría pasar por los ajustes del sistema.

**Medido de punta a punta**, con un dev build instalado en el emulador:

| | Antes | Después |
|---|---|---|
| Desviación del aviso | 135.000 ms (2 min 15 s) | **816 ms** |

Cadena de evidencia: el permiso aparece en el APK (`aapt2 dump permissions`) ·
`dumpsys package com.gymflow.app` da `USE_EXACT_ALARM: granted=true` sin diálogo ·
`SCHEDULE_EXACT_ALARM` no aparece en API 37, que es lo que debe pasar con el tope ·
alarma programada 13:09:06.844, notificación posteada 13:09:07.660.

### Dos bloqueos reales al compilar nativo (primera vez que se intenta)

1. **Ninja revienta con rutas >260 caracteres.** Los long paths de Windows están
   activados, pero ninja no los soporta. La ruta de objeto que falla mide 391
   caracteres, y **más de 260 son intrínsecos**: ni con el proyecto en la raíz
   del disco cabría. Se sorteó con un junction corto (`C:\g`) y redirigiendo el
   directorio de build a `C:\b`.
2. **`react-native-reanimated` y `react-native-worklets` emiten los dos
   `libworklets.so`** y `mergeDebugNativeLibs` aborta. Las versiones son
   coherentes (reanimated 4.1.7, worklets 0.5.1, dentro del peer `0.5 - 0.8`),
   así que no es un desajuste. Se sorteó con
   `android.packagingOptions.pickFirsts=**/libworklets.so`.

Ambos parches viven en `android/`, que está **gitignored y se regenera**: al
siguiente `expo prebuild` desaparecen. Hay que darles un sitio permanente antes
de pensar en publicar.

---

## 2026-09-02 — Primer QA real en emulador: 1 P1

Primera vez que la app se ejecuta en un dispositivo desde el refactor. Emulador
`sdk_gphone16k_x86_64`, 1280x2856 @480dpi, Android 16, vía Expo Go + Metro.

**Verdicto: RECHAZADO.** Un P1 abierto.

### P1 — El aviso de descanso llega tarde o no llega en Android 12+

Marcado un ejercicio con descanso 3:00 y app en segundo plano: la notificación
«Descanso completo» se posteó **2 min 15 s tarde** (11:54:35 en vez de 11:52:20).
Un segundo descanso de 0:15 no llegó dentro de la ventana observada.

Causa raíz, leída en la implementación:

    ExpoSchedulingDelegate.kt:106
    if (SDK_INT < S || alarmManager.canScheduleExactAlarms())
        setExactAndAllowWhileIdle(...)
    else
        setAndAllowWhileIdle(...)   // inexacta: Android la estrangula a ~1/9 min

`canScheduleExactAlarms()` es falso porque **nadie declara el permiso**: ni el
AndroidManifest de `expo-notifications`, ni su config plugin, ni nuestro
`app.json` (`android.permissions` no existe). El propio CHANGELOG de la librería
lo dice: *«If scheduleNotificationAsync needs a precise timer, the
SCHEDULE_EXACT_ALARM should be explicitly added to AndroidManifest.xml»*.

**No es una limitación de Expo Go**: una build de producción hereda la misma
ausencia. Decisión pendiente: `USE_EXACT_ALARM` se auto-concede en Android 13+
pero Google Play lo restringe a apps de alarma/reloj/calendario;
`SCHEDULE_EXACT_ALARM` obliga a mandar al usuario a una pantalla de ajustes.

### P2

- **Grupos musculares en inglés** — 67 valores distintos (`pectorals`,
  `abdominals`, `glutes medius`) visibles en Ejercicios y en el detalle. Rompe
  la búsqueda por músculo en español: «pecho» da 7 resultados, todos por nombre,
  y cuela «Jalón al pecho», que es de espalda. Origen: la columna `muscle_group`
  del CSV pasa sin traducir por `scripts/build-exercise-seed.mjs`.
- **Nombres truncados en modo edición** — `RoutineTable.tsx`: la columna de
  nombre se estrecha para ↑ ↓ ✕ y deja «Curl de bíceps en …». Se borra a ciegas.

### P3

`Press de pecho en máquina` duplicado en la semilla · `expo-keep-awake` usado
sin declarar en `package.json` (llega por ser dependencia de `expo`) · `fold()`
copiado en tres archivos en vez de vivir en `lib/domain/` · «1 rutinas» ·
Hombro y Pecho comparten glifo · teclado alfabético en campos numéricos · en
tablet la cabecera EJERCICIO queda centrada sobre una columna muy ancha ·
`.env` sigue exportando variables de Supabase y un GITHUB_TOKEN.

### Verificado en verde

Arranque directo en Hoy · semilla 6 días / 47 filas / 47 videos fijados ·
cuenta atrás guardada como instante final (exacta tras background) · descanso
vencido aparece terminado, sin contador zombi · edición inline con validación ·
**DESHACER restaura en su posición y se retira al cambiar de día** ·
**restaurar datos deja en Ajustes** (las dos regresiones del refactor,
corregidas) · persistencia tras `force-stop` · reset diario (2/6 → 0/6, las
ediciones sobreviven) · export con `3:00` y leyenda · ▶ abre el canal correcto ·
búsqueda sin acentos · tema instantáneo y persistente · tablet sin scroll
horizontal · cronómetro exacto en background (18,69 s medidos) · 0 crashes,
0 ANR.

### Sin probar todavía

Tabata y temporizador de intervalos · añadir ejercicio desde la biblioteca ·
reordenar con ↑ ↓ · crear y borrar rutinas · bajar a 1 día · modo avión ·
háptica y Doze reales (requieren dispositivo físico).

---

## 2026-09-02 — Herramientas de trabajo

Importados y adaptados los comandos de `DailyBudget` (mismo stack Expo + RN +
ADB): `/qa-adb`, `/debug`, `/checkpoint`, `/ui-review`, `/feature`, más
`.claude/RULES.md` con el Hall of Fame de este proyecto. De `ECC` no se importó
nada: sus comandos son andamios autogenerados de otro repo.

Las coordenadas ADB de DailyBudget **no** se copiaron: son de otra resolución.
`/qa-adb` las deriva del `uiautomator dump`.

---

## 2026-09-02 — Revisión del refactor: 3 bugs

Los 133 tests cubren `lib/domain/`, que es puro. Los tres bugs vivían en el
cableado y la UI, donde no llega ningún test.

- **DESHACER restauraba en el día equivocado** — el handler usaba el día en
  pantalla, no el de origen de la acción. `RemovedRow` ahora lleva su `dayId`,
  y el aviso se retira al cambiar de día. `8161552`
- **El descanso podía programar un aviso ya cancelado** — pedir permiso de
  notificaciones es asíncrono; sin token de generación el programado stale
  sobrevivía y sonaba minutos después. Peor: su id pisaba el del temporizador
  nuevo. El comentario decía que esto se comprobaba; el código no lo hacía.
- **"Restaurar datos originales" expulsaba a Hoy** — `isLoaded: false` hace que
  el layout raíz cambie el navegador entero por la pantalla de carga.

Además: `removeRoutine` tenía una condición con una mitad lógicamente
redundante, y se quitó un `as any` sobre `/tabata-summary` que ocultaba errores
de ruta justo después de renumerarlas.

tsc ✅ · jest 133 ✅ · lint ✅ · Metro empaqueta ✅

---

## 2026-09-01 — Refactor a MVP (F1–F6)

Reducción de un sistema de gestión (31 pantallas, 14 tablas Supabase, 221 MB de
assets) a una hoja de entrenamiento local. Disparador: `Rutina pablo.pdf`, un
parte real de coach que además es **de gimnasio**, no de calistenia — lo que
descartó el pivote anterior. El proyecto Supabase asociado ya no resolvía por
DNS, así que quitar la nube pasó de opción a necesidad.

| Fase | Qué | Commit |
|---|---|---|
| F1 | Demolición sin riesgo: árbol de skills, QR, agenda, presets, 158 MB de PNG | `2855fdc` |
| F2 | Núcleo local: `lib/domain/` con TDD, `lib/storage/`, semillas (169 ejercicios, 47 filas) | `aa33d1f` |
| F3 | Corte del cordón: sin auth, sin Supabase, sin React Query. 31 rutas → 11 | `3849240` |
| F4 | Tabla editable, gestión de días y cabecera del parte | `da627c5` |
| F5 | Descanso con aviso en segundo plano, cronómetro, tabata | `4740083` |
| F6 | Exportar/copiar, eslint (llevaba roto todo el proyecto), poda de 15 deps, docs | `52acebd` |
| — | 37 videos de YouTube fijados para la rutina | `12b726f` |

Resultado: 31 rutas → 11 · assets 221 MB → 9,4 MB · −15 dependencias ·
0 tests útiles → 133.

Plan completo y decisiones en [[decisions]].
