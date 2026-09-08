---
tags: [decisions, refactor, gym-flow-app]
---

# Decisiones del refactor a MVP

Ver también: [[_INDEX]], [[architecture]]

Antes de esto el proyecto era un sistema de gestión: auth Supabase, perfiles,
agenda semanal, compartir por QR, presets, y un pivote a calistenia con árbol
de skills gamificado. **31 pantallas, 7.176 líneas en `app/`, 14 tablas y
221 MB de assets.** Nada de eso ayudaba a ejecutar la rutina de hoy.

El criterio para cada decisión fue uno solo: *¿ayuda a entrenar más rápido?*

## Qué se eliminó

| Bloque | Por qué |
|---|---|
| Auth + Supabase (13 módulos, 14 tablas) | Sin nube no hay login. Además **el proyecto Supabase ya no existía**: su host no resolvía por DNS |
| Árbol de skills / calistenia | La rutina real es de gimnasio con máquinas |
| Compartir por QR e importar | Las dos pantallas eran huérfanas: cero navegación entrante |
| Agenda semanal y day-detail | También huérfanas. Las rutinas son cíclicas, no de calendario |
| Presets remotos | Catálogo en la nube que ya no hay |
| Onboarding (objetivo + equipamiento) | Fricción antes de entrenar |
| React Query | Es caché de estado *de servidor*. Sin red, Zustand basta |
| 200 MB de imágenes + `mediaMap` (441 `require`) | Sustituidas por un ▶ a YouTube: más ligero y más útil que un fotograma |
| `workout` → `workout-session` → `routine-detail` | Tres pantallas para llegar a entrenar, colapsadas en una |
| i18n (EN/ES) | Ver abajo |

**Resultado: 31 rutas → 12, 221 MB → 9,4 MB de assets, −15 dependencias.**

## Decisiones que conviene poder revertir

**Se quitó el bilingüe.** Al reescribir las pantallas, `useTranslation` se quedó
sin un solo consumidor: el ajuste de idioma seguía ahí pero no cambiaba nada
visible. Entre implementar EN/ES de verdad (más alcance) o quitarlo, se quitó:
el parte que originó la app es español y la app es española. Recuperarlo es
volver a meter `useTranslation` y `languageStore`, que están en el historial de
git.

**Tabata se conservó** aunque el brief inicial pedía quitar todo lo accesorio;
fue una petición explícita posterior. Se le sumó un cronómetro.

**Los links de YouTube son de dos niveles.** Si un ejercicio tiene `videoUrl`,
el ▶ lo abre; si no, abre una búsqueda de YouTube del ejercicio. El respaldo
funciona para los 169 desde el primer día, sin curación y sin links que se
pudran.

Hay **37 videos fijados** en `lib/data/video-links.json`, los que cubren las 47
filas de la rutina. **Están elegidos por título y canal en una búsqueda en
español: no se ha podido ver ninguno**, así que conviene revisarlos. El campo
es editable desde la app, y un link que se caiga solo degrada al buscador.
El canal del parte original (*Coaching Nach*) no aparece en los buscadores, así
que no se pudo priorizar.

**Se declaran permisos de alarma exacta.** El QA del 2026-09-02 midió que el
aviso de «Descanso completo» llegaba 2 min 15 s tarde con la app en segundo
plano. `expo-notifications` usa `setExactAndAllowWhileIdle` sólo si
`canScheduleExactAlarms()` es cierto, y si no cae a una alarma inexacta que
Android estrangula a ~1 disparo cada 9 minutos. Ni la librería ni su plugin ni
`app.json` declaraban permiso alguno.

`plugins/withExactAlarm.js` declara `USE_EXACT_ALARM` (Android 13+, concedido
al instalar, sin diálogo) y `SCHEDULE_EXACT_ALARM` limitado a `maxSdkVersion=32`
para cubrir Android 12, donde el primero aún no existe. Hace falta un plugin
porque `android.permissions` de app.json sólo sabe escribir `android:name`, y
el tope de versión es justo lo que evita que el segundo permiso llegue a
Android 13+, donde obligaría a pasar por los ajustes del sistema.

**Coste a vigilar:** Google Play restringe `USE_EXACT_ALARM` a apps cuya
función principal es una alarma, un temporizador o un calendario. Aquí la
cuenta atrás del descanso es esa función y hay que declararlo así al publicar.
Si Play lo rechazara, la alternativa es `SCHEDULE_EXACT_ALARM` sin tope, que sí
obliga a mandar al usuario a una pantalla de ajustes a concederlo.

**El tema pasa a ser claro/oscuro, no morado/naranja.** Los dos temas
anteriores eran ambos oscuros: el ajuste «Tema» elegía acento, no luminosidad,
que no es lo que espera nadie. Ahora hay `dark` y `light`, monocromos.

Ir a monocromo no es solo estética: **elimina por construcción la clase de bug
de contraste** que tenía la app. Un acento de tono medio no puede ser a la vez
relleno (con texto encima) y tinta (sobre el fondo); en blanco y negro esa
tensión no existe. La regla queda escrita en `lib/domain/theme.ts` por si algún
día vuelve un color de marca.

La paleta vive en `lib/domain/`, no en el store, porque es dato puro y así
`theme.test.ts` puede comprobar los 15 pares que la app pinta. Recuperar los
temas de neón es volver a `git`, pero habría que devolverles también los dos
fallos medidos.

**En el tabata, el color de fase es relleno y no depende del tema; los mandos
sí.** Los colores de fase (ámbar, verde, rojo) son señales funcionales que se
leen de reojo, sudando, desde un metro: ahí el color carga significado y
sobrevive al monocromo. Como llenan el 70 % de la pantalla con texto negro
encima, son **relleno**, y un relleno no puede cambiar con el tema sin dejar de
contrastar. Viven en `TABATA_FILL`, fuera de los dos temas.

La barra de mandos sí sigue al tema, y ahí la misma fase se escribe con su
token **tinta** (`t.tabataWork`), que es otro color a propósito — es la regla
de relleno/tinta aplicada al único sitio donde queda color.

Los valores claros de esos tokens se oscurecieron al registrarlos como pares:
`#a16207` daba 4,17:1 y `#4d7c0f` 4,23:1 sobre el fondo claro, los dos por
debajo de AA.

**La biblioteca se traduce encima del CSV, no en el CSV.** El origen
(`assets/exercises_final_updated.csv`) viene en inglés y se queda así:
traducirlo perdería el original y rompería cualquier actualización futura de la
fuente. La versión española vive en `lib/data/exercise-text-es.json` y
`lib/data/muscle-groups-es.json`, y `npm run seed` la aplica encima — el mismo
patrón que ya usaban los videos fijados y las progresiones.

Los grupos musculares se traducen **palabra a palabra** y se recomponen: son 48
piezas frente a 67 combinaciones, y una combinación nueva del CSV no vuelve a
colar inglés. Un slug o una pieza sin traducir revientan el seed, que es donde
se quiere ver. `seeds.test.ts` remata: si una descripción, un consejo o un grupo
muscular tiene palabras funcionales inglesas, falla.

De la lista de delatoras quedan fuera a propósito los nombres prestados que ya
se dicen así en el gimnasio —*hollow hold*, *hip thrust*, *face pull*, *bird
dog*—: traducirlos sería más confuso, no menos.

**El emparejador de rutinas pegadas prefiere no acertar a acertar mal.**
`findExercise` solo une una línea pegada con la biblioteca por juego exacto de
palabras o por contención completa, y ante un empate devuelve `null`. Medido
contra la rutina real de cuatro días: **19 de 26, y ninguno mal**. Los fallos
son huecos de la biblioteca («curl de muñeca» no está) o falta de contexto
(«búlgara» a secas), no errores. Una foto equivocada enseña el movimiento que
no es, y eso cuesta más que la foto que falta.

**La bienvenida es un `Modal`, no una ruta.** Aparece una vez y ofrece dos
caminos: pegar la rutina propia o empezar con la de ejemplo. Va en un modal
dentro de Hoy para que el arranque siga siendo directo a la tabla —sin guardas
ni cadenas de redirección— y para que tape también la barra de pestañas. No
pregunta nombre, ni objetivo, ni nivel: cada pregunta de más es gente que
cierra la app antes de entrenar una vez.

**Las acciones del importador van en la cabecera, no al pie.** Con
`edgeToEdgeEnabled` la ventana ya no se encoge al abrir el teclado, así que un
botón anclado abajo queda debajo de las teclas e inalcanzable. Subirlas arriba
resuelve el caso sin pelearse con la altura del teclado ni añadir dependencias.
Manda la que toca en cada momento: *Pegar* mientras está vacío, *Crear* en
cuanto hay algo que leer.

## Deuda conocida

- `.env` sigue teniendo credenciales de Supabase que ya no usa nadie. Está en
  `.gitignore`; borrarlo es seguro.
- `pnpm-lock.yaml` convive con la instrucción de usar `npx`/`node`. El árbol de
  `node_modules` es de pnpm; `npx expo install` lo detecta y hace lo correcto.
- Los avisos de peer dependency de `react-dom@19.2.6` vs `react@19.1.0` vienen
  de antes de este refactor.
- El manifest generado incluye `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` y
  `WRITE_EXTERNAL_STORAGE`, que vienen de la plantilla de Expo y que esta app no
  usa: no hay galería, ni cámara, ni superposición. Se quitan con
  `android.blockedPermissions` en `app.json`. Conviene hacerlo antes de publicar,
  porque pedir «mostrar sobre otras apps» invita a mirar con lupa la
  declaración de `USE_EXACT_ALARM`.
- La nota de arriba sobre que *«el canal Coaching Nach no aparece en los
  buscadores»* quedó en duda: en el QA el video de Dominadas resultó ser de
  `@nahuelsaluzzofitness`. Conviene revisar de qué canal es cada uno de los 37.
