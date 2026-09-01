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

## Deuda conocida

- `.env` sigue teniendo credenciales de Supabase que ya no usa nadie. Está en
  `.gitignore`; borrarlo es seguro.
- `pnpm-lock.yaml` convive con la instrucción de usar `npx`/`node`. El árbol de
  `node_modules` es de pnpm; `npx expo install` lo detecta y hace lo correcto.
- Los avisos de peer dependency de `react-dom@19.2.6` vs `react@19.1.0` vienen
  de antes de este refactor.
