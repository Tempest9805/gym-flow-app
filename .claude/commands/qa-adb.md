---
description: QA manual exhaustivo por ADB contra el emulador — recorre las 4 tabs, el temporizador de descanso y los timers, y emite veredicto ✅/❌
argument-hint: [full (default) | screen <hoy|rutinas|ejercicios|ajustes|timers> para re-testear tras un fix]
---

# QA ADB — gym-flow-app

> Revisión manual detallada contra el emulador. No inicia ni cierra el emulador,
> no usa Android Studio: todo por ADB.
>
> **Regla de oro del veredicto: nunca aprobar con un P0 o un P1 abierto.**
> Si se rechaza, generar la lista priorizada de correcciones antes de seguir.

**Input**: $ARGUMENTS

---

## Por qué este QA es corto comparado con el de una app con backend

No hay cuenta, ni login, ni servidor, ni sincronización, ni compras. El estado
entero son cuatro claves de AsyncStorage. Eso elimina categorías enteras de bug
(sesión, RLS, offline, deadlocks de auth) y concentra el riesgo en tres sitios:

1. **El temporizador de descanso** — es lo único asíncrono y con permisos.
2. **La persistencia** — que lo editado sobreviva a cerrar la app.
3. **El reset diario** — que los checks se limpien al cambiar de día.

Gasta el tiempo ahí.

---

## PRE-FLIGHT (bloqueante)

### 0.1 Contexto
- [ ] `CLAUDE.md` — arquitectura y convenciones
- [ ] `.claude/RULES.md` — Must Always / Must Never / Hall of Fame
- [ ] `docs/decisions.md` — qué se eliminó y por qué (no re-discutir)
- [ ] `docs/HISTORIAL.md` — qué se tocó en la última sesión

### 0.2 Gates verdes
```bash
npx tsc --noEmit     # 0 errores
npx jest             # todos verdes
npx expo lint        # limpio
```
Con gates rojos **no se arranca el QA**.

### 0.3 Emulador y app
```powershell
adb devices                                      # emulator-XXXX  device (no 'offline')
adb shell pm list packages | Select-String "gymflow"
adb shell am start -n com.gymflow.app/.MainActivity
Start-Sleep -Seconds 3
adb shell uiautomator dump
```
- [ ] Emulador en estado `device`
- [ ] Paquete `com.gymflow.app` presente
- [ ] Arranca sin crash

Si no hay emulador o la app no está instalada → **DETENER** y pedirlo.

---

## Caja de herramientas ADB

```powershell
# Screenshot al scratchpad (no ensuciar el repo)
adb exec-out screencap -p > "$env:TEMP\qa_<fase>_<pantalla>.png"

# UI dump → texto + centro de cada elemento (para taps precisos)
adb shell uiautomator dump
$xml = adb shell "cat /sdcard/window_dump.xml"    # OJO: comillas — sin ellas Git Bash rompe el path
[regex]::Matches($xml, 'text="([^"]+)"[^/]* bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') | ForEach-Object {
    [PSCustomObject]@{ Text=$_.Groups[1].Value
        CX=[int](([int]$_.Groups[2].Value+[int]$_.Groups[4].Value)/2)
        CY=[int](([int]$_.Groups[3].Value+[int]$_.Groups[5].Value)/2) }
} | Where-Object { $_.Text -ne "" }

adb shell input tap $cx $cy
adb shell input swipe $cx $cy $cx $cy 600         # long-press
adb shell input swipe 500 1400 500 600 800        # scroll abajo
adb shell input text "texto"
adb shell pm clear com.gymflow.app                # RESET total: borra AsyncStorage, resiembra al abrir
```

> **Las coordenadas se derivan del dump, no se hardcodean.** La resolución del
> emulador varía; medir con `adb shell wm size` y anotar las de la tab bar en
> `docs/HISTORIAL.md` la primera vez, para reusarlas en la sesión.

### Lecciones ADB (heredadas, no repetir)
- **No usar `KEYCODE_BACK` para cerrar el teclado** dentro de un `<Modal>`: BACK
  cierra el modal entero. Para pasar de campo a campo, tapear el siguiente input.
  Afecta directamente a `CellEditor`, `ExercisePicker` y los sheets de Rutinas.
- **Los logs de JS no llegan a logcat** en este setup. Si hace falta ver un error
  real, exponerlo temporalmente en un `Alert` y revertir después.
- **Para elementos pequeños**, no estimar a ojo sobre el PNG: usar el dump o
  abrir la imagen y localizar por color exacto del token.
- **`pm clear` es el reset canónico aquí** — borra AsyncStorage entero y la
  siguiente apertura resiembra desde `lib/data/`. No hay flag en SecureStore que
  le sobreviva, porque no hay SecureStore.

---

## FASE 1 — UI review (antes de tocar nada funcional)

Recorrer en **tema morado y naranja** (Ajustes → Tema). Pantallas: Hoy ·
Rutinas · Ejercicios · Ajustes · detalle de ejercicio · Cronómetro · Tabata
(setup/activo/resumen) · Temporizador de intervalos.

**Texto**
- [ ] Sin texto cortado, overflow ni wrapping raro.
- [ ] Nombres de ejercicio largos ("Rotación interna y externa del fémur")
      envuelven a 2 líneas sin romper la fila.
- [ ] Cero cadenas en inglés visibles (la app es española).

**Tabla — el corazón**
- [ ] **Nunca hay scroll horizontal**, en ningún ancho.
- [ ] Cabecera `▶ | Ejercicio | Series | Reps | Rest | ✓` alineada con sus filas.
- [ ] Filas alternas se distinguen; la fila marcada se ve tachada y atenuada.
- [ ] En modo edición la última columna cambia a `↑ ↓ ✕` y sigue cuadrando.

**Layout**
- [ ] Safe areas y notch respetados; la barra de gestos no tapa la tab bar.
- [ ] El teclado no tapa el input de `CellEditor` ni el de búsqueda.
- [ ] El scroll llega al final; las "Indicaciones generales" son alcanzables.

**Tema**
- [ ] Cambiar tema → las 4 tabs reflejan el cambio al instante, sin flicker.
- [ ] Sin colores hardcodeados que queden ilegibles en el otro tema.

**Iconos**
- [ ] Ningún icono se ve como cuadro vacío (nombre de glifo inexistente).
- [ ] Cada día muestra un icono coherente con su enfoque.

**Tablet** — [ ] `adb shell wm size 1600x2560` → columnas y tipografía crecen,
sigue sin scroll horizontal. Restaurar con `adb shell wm size reset`.

---

## FASE 2 — Baseline limpio

```powershell
adb shell pm clear com.gymflow.app
adb shell am start -n com.gymflow.app/.MainActivity
```
- [ ] Abre **directamente en Hoy**. Sin login, sin onboarding, sin redirecciones.
- [ ] Menos de ~2 s hasta ver la tabla.
- [ ] Rutina de Pablo sembrada: 6 días, Día 1 = Espalda con 7 filas.
- [ ] Ajustes muestra "1 rutinas · 169 ejercicios".

---

## FASE 3 — QA funcional

### Hoy
- [ ] Pestañas de día: cambiar de día es **1 toque**, sin scroll.
- [ ] El contador `hechos` y el `n/n` de cada pestaña cuadran con lo marcado.
- [ ] Marcar una fila → se tacha **y arranca su descanso**.
- [ ] ▶ abre YouTube (video fijado en los 47 de la rutina).
- [ ] Editar `Ejercicio`, `Series`, `Reps`, `Rest` → persiste al reabrir la app.
- [ ] Atajos del editor (3, 6-8, 2:00) rellenan el campo.
- [ ] Validación: `Series` con letras y `Rest` con `abc` bloquean Guardar.
- [ ] Editar → `+ Añadir ejercicio` → buscar → añadir; aparece al final.
- [ ] Añadir un nombre que no está en la biblioteca (fila libre).
- [ ] `↑ ↓` reordenan; `✕` quita y ofrece DESHACER.
- [ ] **DESHACER restaura la fila en su posición exacta.**
- [ ] **Quitar una fila, cambiar de día → el aviso de DESHACER desaparece.**
      *(Regresión conocida: antes restauraba en el día equivocado.)*
- [ ] `Reiniciar día` desmarca todo.
- [ ] Copiar → pegar en un editor: la tabla se entiende sin contexto, el
      descanso sale como `3:00` y no como `180`.

### Descanso (la zona de mayor riesgo)
- [ ] Al marcar, la celda Rest se agranda, se resalta y cuenta atrás.
- [ ] Tocar la celda mientras corre → se detiene.
- [ ] Desmarcar la fila → también se detiene.
- [ ] Marcar otra fila mientras una descansa → el contador se mueve a la nueva.
- [ ] **Al llegar a 0: vibra y avisa.**
- [ ] **Con la app en segundo plano también** (`adb shell input keyevent KEYCODE_HOME`
      y esperar). Este es el requisito que motivó `expo-notifications`.
- [ ] Apagar la pantalla y volver: el tiempo restante es **el real**, no el
      congelado. *(El temporizador guarda el instante final, no un contador.)*
- [ ] Un descanso que venció estando fuera aparece ya terminado, no a mitad.
- [ ] Marcar y cancelar muy rápido varias veces → **no suena ningún aviso
      fantasma minutos después**. *(Regresión conocida: la carrera del permiso.)*

### Rutinas
- [ ] `Nueva` crea una rutina y la deja activa.
- [ ] Añadir días hasta 7 y quitar hasta 1; los días **se renumeran sin huecos**.
- [ ] Con 1 día, quitar avisa "una rutina necesita al menos un día".
- [ ] Cambiar el enfoque de un día → cambia también su icono.
- [ ] Editar cabecera (rutina/atleta/objetivo/coach) → se refleja en Hoy.
- [ ] `Entrenar` cambia la rutina activa y lleva a Hoy.
- [ ] Borrar la rutina activa → pasa a otra; borrar la última → Hoy muestra el
      estado vacío con CTA, no una pantalla rota.

### Ejercicios
- [ ] Buscar sin acentos encuentra con acentos ("biceps" → "Curl de bíceps").
- [ ] Buscar por grupo muscular funciona.
- [ ] Detalle: ejecución, recomendaciones y errores comunes presentes.
- [ ] Un ejercicio sin video fijado abre la **búsqueda** de YouTube.

### Ajustes
- [ ] Tema alterna y persiste tras reabrir.
- [ ] Tabata, Cronómetro y Temporizador abren y vuelven con back.
- [ ] `Restaurar datos originales` → confirma, resiembra **y te deja en Ajustes**.
      *(Regresión conocida: antes te expulsaba a Hoy.)*

### Timers
- [ ] Cronómetro: empezar/pausar/seguir/reiniciar; vueltas con parcial y total.
- [ ] El cronómetro no pierde tiempo al ir a background y volver.
- [ ] Tabata corre sus fases y el resumen vuelve a Hoy.

### Reset diario
- [ ] Marcar filas, `adb shell "date $(date -d tomorrow +%m%d%H%M%Y).00"` o
      cambiar la fecha en Ajustes de Android, reabrir la app → **los checks
      aparecen limpios**. Restaurar la fecha al terminar.

---

## FASE 4 — Validaciones continuas

En cada acción, sin excepción:
- [ ] El dato **se guarda de verdad** (matar la app y reabrir, no solo navegar).
- [ ] La UI refleja el cambio al instante.
- [ ] Ningún loader infinito.
- [ ] Cero crashes (`adb logcat -d | Select-String "FATAL|ANR"`).
- [ ] Ninguna acción que "no hace nada" — un error silencioso es un bug.

---

## FASE 5 — Exploratorio (romper la app)

- [ ] Pulsar Guardar / Añadir varias veces muy rápido → no duplica ni crashea.
- [ ] Abrir dos modales seguidos → sin overlay huérfano.
- [ ] Marcar y desmarcar filas a toda velocidad → el contador no se descuadra.
- [ ] Quitar todas las filas de un día → tabla vacía usable, se puede añadir.
- [ ] Poner `Rest` en `0:00` → al marcar no arranca cuenta atrás (correcto).
- [ ] `Reps` con texto raro ("al fallo técnico") → se guarda literal y se muestra.
- [ ] Crear 7 días y navegar entre ellos rápido.
- [ ] Cambiar de tema en mitad de un descanso → el contador sigue.
- [ ] Matar la app con un descanso corriendo → al reabrir no hay contador
      zombi, y el aviso programado no suena después.
- [ ] Navegación agresiva entre tabs mientras corre el cronómetro.
- [ ] Modo avión → todo funciona salvo el ▶ (que debe fallar con mensaje, no
      crash).

---

## FASE 6 — Informe y veredicto

```
QA ADB — gym-flow-app — <fecha>
Emulador: <avd> <resolución>

RESUMEN — <2-3 líneas>

UI        — <hallazgos o "sin hallazgos">
FUNCIONAL — <hallazgos>
DESCANSO/TIMERS — <hallazgos>
PERSISTENCIA    — <hallazgos>

BUGS NUEVOS:
  P0 (crash / pérdida de datos / bloqueante)
  P1 (funcional roto / flujo core degradado)
  P2 (UX/UI notable, no bloqueante)
  P3 (cosmético)

SKIP (no testeable en emulador): <lista>

VEREDICTO:  ✅ APROBADO   |   ❌ RECHAZADO
```

**❌ RECHAZADO si hay cualquier P0 o P1.** No se aprueba "con salvedades".

Si se rechaza, producir la lista priorizada con archivo probable y repro, y
registrarla en `docs/HISTORIAL.md`. Tras corregir, re-correr solo el módulo
afectado: `/qa-adb screen <nombre>`.

Si se aprueba: `/checkpoint create "QA ADB aprobado"`.

---

## SKIP en emulador (no cuentan como fallo)

| Qué | Por qué | Dónde se valida |
|---|---|---|
| Vibración háptica real | El emulador no vibra; la notificación sí se ve | Device físico |
| Notificación con pantalla apagada de verdad | El emulador la muestra, pero el comportamiento de Doze no es representativo | Device físico |
| Abrir YouTube en la app nativa | El emulador suele no traerla; abre en navegador | Device físico |
