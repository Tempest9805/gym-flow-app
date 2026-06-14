---
tags: [spec, design, gym-flow-app, calistenia, navigation, ui]
date: 2026-06-14
status: approved
---

# Diseño — Incremento UI #1: Reestructura de navegación (5 tabs)

> Primer incremento del bloque de UI del pivote a calistenia. **Solo estructural**: cambia la arquitectura de información (tabs), NO rediseña el contenido de las pantallas. Resultado de brainstorming del 2026-06-14.
>
> Parte de la secuencia de UI: **#1 Navegación → #2 Registro de series → #3 Pantalla Árbol**.
> Spec de producto base: `docs/superpowers/specs/2026-06-13-calistenia-skill-tree-design.md` (§3 principios UX, §4 IA 5 tabs).
> Construye sobre: el data layer ya entregado (`docs/superpowers/plans/2026-06-14-skill-tree-data-layer.md`).

## 1. Objetivo

Llevar la app de su footer actual (Home · Exercises · Agenda · Routines · Profile) a la IA del pivote: **Árbol · Entrenar · Ejercicios · Rutinas · Perfil**, con **Entrenar como tab por defecto de fábrica** y un ajuste en Perfil para abrir en Árbol. Sin tocar el contenido de las pantallas existentes — el rediseño de Entrenar y el árbol llegan en incrementos posteriores.

Respeta los principios UX no negociables del spec base: **footer máximo 5 elementos** y **gamificación omitible** (el usuario diario vive en Entrenar; Árbol es opt-in).

## 2. Arquitectura de información

| Tab | Ruta (archivo) | Estado en este incremento |
|---|---|---|
| **Árbol** | `app/(app)/tree.tsx` *(nuevo)* | Placeholder con marca (header + teaser "próximamente"). Sin consumir hooks aún. |
| **Entrenar** ⭐ *(default)* | `app/(app)/index.tsx` *(Home actual)* | Solo se reetiqueta. Contenido intacto (saludo, racha, tracker semanal, rutina de hoy, accesos). |
| **Ejercicios** | `app/(app)/exercises.tsx` | Reetiquetar. |
| **Rutinas** | `app/(app)/routines.tsx` | Reetiquetar. |
| **Perfil** | `app/(app)/profile.tsx` | Reetiquetar + nuevo ajuste "tab de inicio". |

- **Agenda** (`app/(app)/agenda.tsx`) sale del footer. Se mantiene como **pantalla oculta** (`Tabs.Screen … href:null`), accesible por `router.push('/agenda')`, sin borrar código. Su merge real dentro de Entrenar es del incremento #2.
- **Labels localizados (ES/EN)** vía el sistema `useTranslation` existente. Hoy las etiquetas del tab bar están hardcodeadas en inglés en `TAB_ICONS`; pasan a claves de traducción.
- Orden del footer: `Árbol · Entrenar · Ejercicios · Rutinas · Perfil`. Entrenar es el default (no necesariamente el centrado).

## 3. Piezas de implementación

Componentes pequeños, con una responsabilidad clara cada uno:

1. **Tab navigator** (`app/(app)/_layout.tsx` → `StitchTabBar` + `AppLayout`):
   - `visibleRoutes` filtra a `['tree','index','exercises','routines','profile']` (este orden).
   - `TAB_ICONS`: añadir entrada `tree` (icono de árbol/skills); labels via `useTranslation` en vez de strings fijos.
   - Registrar `<Tabs.Screen name="tree" />`; mover `<Tabs.Screen name="agenda" options={{ href: null }} />` a la zona de pantallas ocultas.

2. **Pantalla Árbol placeholder** (`app/(app)/tree.tsx`):
   - Layout oscuro/neón consistente con el resto (reusa `useTheme`).
   - Header "Árbol de skills" (localizado) + teaser neutro de "próximamente". **Sin avatar todavía** (el slicing del sprite-sheet del avatar es del incremento #3) y **sin** consumir `useProgressions`/`useSkillProgress`.

3. **Preferencia de tab de inicio**:
   - Función **pura** `resolveStartRoute(raw: string | null): StartTab` en `lib/utils/startTab.ts`, donde `StartTab = 'index' | 'tree'`. Devuelve `'index'` salvo que `raw === 'tree'`. **Unit-testeable con Jest** (es el único pedazo de lógica del incremento).
   - Store `lib/store/settingsStore.ts` (Zustand + AsyncStorage, mismo patrón que `themeStore`/`languageStore`): estado `startTab: StartTab`, acciones `loadStartTab()` (lee AsyncStorage, normaliza con `resolveStartRoute`) y `setStartTab(tab)` (persiste). Clave AsyncStorage p. ej. `gymflow_start_tab`.

4. **Redirección al arranque** (`AppLayout`):
   - Tras tener perfil/tema cargados, leer `startTab`. Si `startTab !== 'index'`, hacer `router.replace('/<startTab>')` **una sola vez** en arranque en frío (guard con `useRef` para no redirigir en cada render ni al navegar manualmente luego).

5. **Ajuste en Perfil** (`app/(app)/profile.tsx`):
   - Fila/selector que escribe `setStartTab('index' | 'tree')` — opciones **Entrenar** o **Árbol** (alineado al spec base; no se permite arrancar en otros tabs para evitar UX rara).

## 4. Fuera de alcance (diferido explícitamente)

- Merge real Agenda→Entrenar y rediseño de la pantalla Entrenar → **incremento #2** (con registro de series).
- Viz del árbol, nodos, readiness, retos, `markChallengeStatus`, avatar HUD + animación de nivel → **incremento #3**.
- Captura de equipamiento en onboarding, gate de rutina, paywall RevenueCat, seeding de contenido → planes posteriores.
- Migrar los iconos unicode del tab bar a pixel-art (capa de acento del spec) → polish posterior; este incremento mantiene el estilo de iconos actual y solo añade el de Árbol.

## 5. Testing

- **Unit (Jest):** `resolveStartRoute` — default `'index'` para `null`/`undefined`/valor desconocido; `'index'` para `'index'`; `'tree'` para `'tree'`.
- **Resto (`tsc` + corrida manual):** tab bar, registro de rutas, redirección de arranque, placeholder y ajuste de Perfil. La navegación RN/expo-router no es unit-testeable en este setup (jest corre en Node sobre `lib/`). Se declara honestamente; verificación = `pnpm typecheck` + abrir la app y comprobar (tabs correctos, default Entrenar, cambiar a Árbol en Perfil reabre en Árbol, Agenda ya no en footer pero accesible).

## 6. Decisiones registradas

1. Incremento #1 = **solo estructural**; contenido de pantallas sin cambios.
2. 5 tabs: **Árbol · Entrenar · Ejercicios · Rutinas · Perfil**; **Entrenar = default de fábrica**.
3. **Entrenar = `index.tsx`** actual (relabel), **no** se crea pantalla nueva; **Árbol = `tree.tsx`** nuevo (placeholder, sin avatar ni hooks).
4. **Agenda** sale del footer pero se conserva como pantalla oculta accesible (no se borra).
5. Tab de inicio configurable **solo entre Entrenar/Árbol**, persistido en `settingsStore` (AsyncStorage), con `resolveStartRoute` pura y testeada; redirección de arranque única vía `router.replace`.
6. Labels del footer **localizados** (ES/EN) con `useTranslation`.

> Nota de repo: `docs/` es WIP sin trackear del usuario; este spec vive ahí y **no se commitea por separado** (se commitearía al absorber todo el vault, lo cual se evita). El código del incremento sí se commitea en `feat/calistenia-foundation`.
