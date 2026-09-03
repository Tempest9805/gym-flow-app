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

**Resultado: 31 rutas → 11, 221 MB → 9,4 MB de assets, −15 dependencias.**

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
