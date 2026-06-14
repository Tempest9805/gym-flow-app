---
tags: [spec, design, gym-flow-app, calistenia, skill-tree]
date: 2026-06-13
status: draft
---

# Diseño — Reposicionamiento a especialista de calistenia con árbol de skills

> Spec de producto + diseño técnico. Resultado de la sesión de brainstorming del 2026-06-13.
> Decisión base: **iteración sobre la app actual (sin rewrite)**.

## 1. Visión en una línea

Convertir gym-flow-app en **el especialista de calistenia/entreno en casa, español-first**, cuyo gancho diferenciador es un **árbol de skills gamificado** (desbloqueas progresiones hacia muscle-up, plancha, front lever, handstand…), con **gamificación 100% opcional** para no estorbar al que solo quiere entrenar.

**Promesa de tienda:**
> *"Desbloquea el muscle-up, el pino, la plancha y la front lever con un plan claro — en casa, sin gimnasio."*

## 2. Posicionamiento

- **Público:** principiante–intermedio hispanohablante (LatAm/España), entrena en casa o parque, sin equipo o con equipo mínimo (barra, bandas).
- **Hueco de mercado:** entre Freeletics (adaptativo pero caro, sin gamificación de skills, español flojo) y las apps de skill-tree existentes (Thenix/Caliverse, UX mediocre). Ventaja propia = **UX limpia + español nativo + compartir viral por QR + motor Tabata** ya construido.
- **Categoría más rentable no-gaming** (Salud y Fitness) con alta disposición a pagar; arquitectura BaaS/serverless ya alineada con las apps top.

## 3. Principios de UX (no negociables)

1. **El footer nunca tiene más de 5 elementos.** Todo lo nuevo entra dentro de un tab, nunca como sexto tab.
2. **La gamificación es opcional y omitible.** Un usuario que solo quiere su rutina diaria vive en el tab **Entrenar** y nunca toca el árbol, retos ni avatar.
3. **El usuario gratis progresa de verdad** (niveles Principiante + Intermedio gratis) → buenas reseñas → ASO. Lo Avanzado se ve bloqueado (aspiración → conversión).
4. **Sin video** (la trampa cara de NTC/Sweat): imagen + texto claro; Lottie/animación solo para skills top si algún día hace falta.
5. **Cero servidores propios:** todo sobre Supabase + React Query; motores deterministas (sin IA, sin backend de cómputo).
6. **Equipment-aware (sin barra siempre):** siempre hay progresiones y retos hacibles en casa **sin barra ni equipo**. El equipamiento disponible se captura en onboarding y filtra el contenido u ofrece alternativas.

## 4. Arquitectura de información (5 tabs)

| Tab | Función | Reusa |
|---|---|---|
| **Árbol** | Mapa de progresiones (5 ramas), **avatar/cara HUD**, racha, retos. Surface de identidad/engagement (opt-in). Incluye CTA **"Empezar rutina de hoy"**. | nuevo + `exercises` |
| **Entrenar** ⭐ *(tab por defecto de fábrica)* | Sesión de hoy + semana: calentamiento → ejercicios guiados → circuitos **Tabata/HIIT**. **Surface frictionless del usuario diario.** | `workout-session`, `agenda`, `tabata` |
| **Ejercicios** | Librería (enfocada calistenia); cada ejercicio muestra su lugar en la progresión. | `exercises`, `exercise/[id]` |
| **Rutinas** | Crear/editar/compartir rutinas (aquí vive el **gate por nivel** al crear). | `routines`, `routine-*`, `share` |
| **Perfil** | Racha, stats, ajustes, **equipamiento disponible**, entrada al paywall. Permite cambiar el tab de inicio. | `profile` |

- **Agenda se absorbe dentro de "Entrenar"** (vista hoy + semana) → menos superficie, menos mantenimiento.
- **Default de fábrica = Entrenar** (fricción cero para el usuario diario). El usuario puede cambiar el tab de inicio a Árbol en Perfil. Nunca está obligado a pasar por retos.
- **CTA cruzado:** el Árbol tiene un botón "Empezar rutina de hoy" y Entrenar un acceso al Árbol, para que ambos perfiles de usuario fluyan.
- El timer **Tabata se mantiene tal cual** (funciona) e integra como motor de circuitos dentro de Entrenar.

## 5. El árbol de skills

- **5 ramas:** `push`, `pull`, `core`, `legs`, `skill`.
- Cada rama recorre **3 niveles: Principiante → Intermedio → Avanzado** (~8–12 nodos por rama).
- Estados de nodo por usuario: `locked` | `available` | `in_progress` | `mastered`.
- El árbol **completo es visible siempre** (los nodos avanzados se ven con candado → deseo), aunque su contenido/uso esté gateado por nivel o por premium.
- Mayormente lineal con pocos cruces entre ramas (ej. requiere dominada antes de muscle-up) → barato de sembrar y mantener.

## 6. Retos + readiness

Los retos viven en su propia tabla (`challenges`, §8.4) y se clasifican en **4 tiers** según horizonte de logro. Pueden ser *skills* (nodos del árbol) o *retos de volumen/tiempo* (metas sobre ejercicios existentes).

| Tier | Horizonte | Ejemplos | Tipo |
|---|---|---|---|
| **1 — Élite** | Meses | Handstand Hold, Handstand Push-Up, L-Sit, Pistol Squat | skill (metas a largo plazo, no ejercicios de rutina) |
| **2 — Técnicas** | 3–6 meses | Pseudo Planche Push-Up, Archer Push-Up, Nordic Curl, Hanging Leg Raise | skill (progresión desde el catálogo) |
| **3 — 4–8 semanas** | Semanas | Pull-Up, Dips paralelas, Hollow Body Hold 60s, Single-Leg Hip Thrust con pausa | skill (prerequisitos claros) |
| **4 — Volumen/tiempo** | Variable | 100 Push-Ups, Plank 5 min, 100 Burpees en 10 min, 10 Pull-Ups consecutivos | volumen (criterio 100% objetivo y verificable → **los más virales**) |

- **Sin barra siempre:** cada tier debe tener retos hacibles en casa sin barra (push-ups, pistol, handstand, plancha, plank, burpees, hollow body, nordic curl, hip thrust). Los de barra (pull-up, muscle-up, hanging leg raise, dips) solo se muestran si el usuario marcó tener barra.
- **Barra de readiness** calculada de `workout_logs` (determinista). Ejemplo muscle-up:
  ```
  readiness = mín( dominadas_estrictas/8, fondos/10, dominadas_explosivas/3 ) × 100%
  ```
  - `< 100%` → reto con candado + barra ("78% listo — faltan 2 dominadas explosivas").
  - `= 100%` → reto se ilumina con CTA *"Intentar reto"*. Al lograrlo → `achieved_at` + badge + pantalla compartible (QR/redes → viralidad).
- **Niveles:** el nivel por rama = nº de nodos `mastered`; un "nivel calistenia" global alimenta el estado del avatar (§10). Termómetro de readiness sin cálculo extra.
- **Rachas** (`UserStreak`, ya existe) suben a primer plano en el Árbol. Uso diario → racha; lograr reto → logro destacado.

## 7. Rutinas con gate por nivel (mecánica nueva)

Objetivo: que los retos signifiquen algo (desbloquean rutinas aspiracionales) **sin** forzar fricción al uso diario, y servir de **seguridad anti-lesión**.

- Al guardar una rutina se calcula su **nivel requerido por rama** = nivel máximo (de `exercise_progressions`) entre sus ejercicios. Se guarda en `Routine.metadata` (**sin cambio de esquema**).
- Una rutina está **al alcance** si para cada ejercicio el usuario tiene ese nodo `available` o `mastered`.
- Si la rutina **incluye un nodo `locked`** (supera tu nivel probado):
  - Crear/usarla dispara una **prueba de aptitud** = el/los reto(s) del/los nodo(s) que faltan.
  - **Pasa** → rutina desbloqueada y usable cuando quiera.
  - **No quiere** → puede guardarla como `status: 'pending'` (bloqueada) para desbloquear después, o quedarse con rutinas a su nivel.
- Rutinas **dentro del nivel** → cero pruebas, flujo normal.
- La prueba en sí es **gratis** (es seguridad + engagement); el límite premium está en *cantidad* de rutinas y en *nodos avanzados* (ver §11).

## 8. Modelo de datos

Reusa el esquema actual (`lib/api/schemas.ts`). Añade tablas de progresión y retos + una columna de equipamiento en `profiles`; el **gate de rutina no cambia esquema** (usa `Routine.metadata`).

### 8.1 `exercise_progressions` (contenido sembrado una vez)
```ts
exercise_progressions {
  id: uuid
  path: 'push'|'pull'|'core'|'legs'|'skill'
  exercise_id: uuid
  level: number                      // orden dentro de la ruta (1,2,3…)
  tier: 'beginner'|'intermediate'|'advanced'
  unlock_reps: number | null         // umbral de reps para avanzar
  unlock_hold_seconds: number | null // umbral de hold (plancha/lever)
  prerequisite_exercise_id: uuid | null // gate entre ramas
  equipment: string | null           // null = sin barra / en casa
}
```
(los retos viven en su propia tabla `challenges`, §8.4)

### 8.2 `user_skill_progress` (estado por persona)
```ts
user_skill_progress {
  id: uuid
  user_id: uuid
  exercise_id: uuid
  status: 'locked'|'available'|'in_progress'|'mastered'
  best_reps: number | null
  best_hold_seconds: number | null
  mastered_at: timestamp | null
}
```

### 8.3 `workout_logs` (lo que hoy NO se persiste)
```ts
workout_logs {
  id: uuid
  user_id: uuid
  exercise_id: uuid
  reps: number | null
  seconds: number | null
  performed_at: timestamp
}
```
Triple ganancia: alimenta desbloqueos del árbol, habilita estadísticas avanzadas premium, y genera el resumen post-entreno compartible.

### 8.4 `challenges` + `user_challenge_progress` (catálogo de retos)
```ts
challenges {
  id: uuid
  name_en: string; name_es: string
  challenge_tier: 1|2|3|4               // élite / técnica / 4-8 sem / volumen
  kind: 'skill'|'volume_reps'|'hold_time'|'reps_in_time'
  exercise_id: uuid                     // ejercicio representativo/objetivo
  target_reps: number | null            // 100 push-ups, 10 pull-ups, 1 muscle-up
  target_seconds: number | null         // plank 300s, hold 60s
  time_window_seconds: number | null    // 100 burpees en 600s
  equipment: string | null              // null = sin barra / en casa
  readiness_rule: jsonb                 // prerequisitos + umbrales
  is_premium: boolean
}

user_challenge_progress {
  id: uuid; user_id: uuid; challenge_id: uuid
  status: 'locked'|'ready'|'attempted'|'achieved'
  readiness: number                     // 0-100 (derivado)
  achieved_at: timestamp | null
}
```

### 8.5 Cambios mínimos / sin cambio de esquema
- **Profiles** → añadir columna `available_equipment text[]` (ej. `['none']`, `['pull_up_bar']`, `['bands']`), capturada en onboarding. Único cambio a una tabla existente.
- **Gate de rutina** → `Routine.metadata.required_levels` (jsonb ya existente, sin cambio).
- **Holds y cardio** → `exercise_type: reps|time|cardio` + `duration_seconds` (ya existen).
- **Difficulty / movement_pattern / is_compound / equipment** (ya existen) sirven para sembrar progresiones.

### 8.6 RLS
`workout_logs`, `user_skill_progress`, `user_challenge_progress` → política `user_id = auth.uid()`. `exercise_progressions` y `challenges` son contenido público (solo lectura).

## 9. Motores deterministas (sin IA, gratis de operar)

- **Desbloqueo:** al insertar un `workout_log`, si `best_reps ≥ unlock_reps` (o hold ≥ `unlock_hold_seconds`) **y** el prerequisito está `mastered` → el siguiente nodo pasa a `available`.
- **Readiness (0–100%):** `mín` de los ratios `desempeño_actual / umbral` de los prerequisitos del reto.
- **Gate de rutina:** intersección de los ejercicios de la rutina con `user_skill_progress.status == 'locked'`.
- **Filtro por equipamiento:** progresiones y retos se filtran por `profiles.available_equipment`; siempre queda al menos una ruta sin barra visible.
- Todos son **funciones puras** → fáciles de testear (bajo riesgo de regresión).

## 10. Dirección de arte

- **Base:** UI moderna oscura/futurista **legible** (reusa theme Neon Purple / Neon Orange). Instrucciones y formularios siempre legibles.
- **Pixel art como capa de ACENTO** (no toda la UI): avatar, iconos de nodo/skill, jefes, badges, celebraciones de subida de nivel.
- **Avatar = retrato/cara estilo HUD (Wolfenstein 3D / DOOM)** en el header del Árbol y en Perfil. **El arte ya existe** en `assets/avatares/`:
  - `avatar_hombre_pixelArt.png` y `avatar_mujer_pixelArt.png` — hoja de personaje con **6 niveles de progresión física** (Nivel 1 "comienzo débil" → Nivel 6 "el campeón" con **máscara Oni** neón). El rostro evoluciona con el nivel global del usuario.
  - `ej_animacion_lvlUp.png` / `avatar_mujer_animacionlvlup_pixelArt.png` — secuencia de **animación de subida de nivel** (energía → transformación Oni → onda de choque → "¡NIVEL UP!").
- **En v1 desde el inicio** (no placeholder): el usuario elige variante (hombre/mujer); el avatar muestra 1 de 6 estados según su nivel global y reproduce la animación al subir.
- **Mapeo:** el nivel global (derivado de nodos `mastered`) se reparte en 6 umbrales → 6 estados del avatar.
- **Jefes y arte de personaje completo = capa "extra" de polish** (el cuerpo completo del sheet, efectos), enriquecibles incrementalmente. Arte adicional lo provee el dueño → costo de arte fuera del dev.

## 11. Monetización (freemium suscripción, límites suaves)

Vía **RevenueCat** (sin backend de pagos propio). Corte por **nivel de progresión**, no mutilando funciones básicas.

**Gratis (el gancho):**
- Librería completa + guía de forma (descripción + imagen)
- Calentamientos
- Árbol **completo visible** (avanzado con candado)
- Progresión real por niveles **Principiante + Intermedio** de las 5 ramas
- Pruebas de aptitud (gate de rutina) — gratis (seguridad/engagement)
- Hasta **3 rutinas** propias
- Timer descanso básico + **Tabata básico**
- Registro de entrenos + **historial 30 días**
- Resumen post-entreno básico
- Compartir/importar por **QR**

**Premium (límites suaves):**
- **Nivel Avanzado del árbol** (muscle-up, plancha, front lever, one-arm…)
- **Rutinas ilimitadas**
- **Auto-progresión / plan personalizado** (motor determinista elige tu siguiente sesión)
- **Estadísticas a largo plazo** (curvas por ruta, balance muscular, export CSV)
- **Circuitos Tabata/HIIT avanzados** guardados
- Seguimiento fino de holds + calistenia con lastre

## 12. Alcance

### MVP v1.0 (sale a la tienda)
1. **Navegación 5 tabs**, **default = Entrenar** (Agenda absorbida en Entrenar). Tab **Árbol** con CTA "Empezar rutina de hoy".
2. **Onboarding + captura de equipamiento** (`available_equipment`) tras el objetivo.
3. **Registro de series** (reps/segundos) en Entrenar.
4. **Motor de desbloqueo + readiness** deterministas, **filtrados por equipamiento** (siempre rutas sin barra).
5. **Retos** — set inicial con cobertura sin barra: Tier 4 virales (**100 push-ups, plank 5 min, 100 burpees en 10 min** = sin barra; **10 pull-ups consecutivos** = con barra) + skills estrella (**pistol squat, handstand hold, L-sit** sin barra; **primera dominada / muscle-up** con barra).
6. **Gate por nivel al crear rutinas**.
7. **Contenido sembrado** ~8–12 nodos por rama (~50 nodos), Principiante→Avanzado, reusando catálogo + tags de equipamiento.
8. **Avatar 6 niveles (hombre/mujer)** desde `assets/avatares` + animación de level-up. Selección de variante.
9. **Paywall (RevenueCat)** gateando Avanzado + rutinas ilimitadas.
10. **Calentamiento**: set estático pequeño por rama.
11. Se mantiene: auth, librería, rutinas, compartir QR, Tabata, rachas.

### Fast-follow v1.1
- **Offline-first** completo (logs locales + sync). Defendido como fast-follow: es app de casa, no de gym con WiFi muerto.
- Resumen post-entreno enriquecido + showcase de badges.
- Estadísticas avanzadas premium (empezar básicas).

### Más adelante / expansión premium
- Auto-progresión / plan personalizado.
- Calistenia con lastre, retos comunitarios mensuales, más ramas/skills, animaciones de jefe completas.

## 13. Guardas de bajo costo / mantenimiento

- Cero servidores propios; motores deterministas; RevenueCat para pagos.
- Contenido como datos, sembrado una vez vía migración/CSV (`exercises_final_updated.csv`, `scripts/`, `media:sync`).
- Cambios aditivos; única pantalla realmente nueva = Árbol.
- Footer tope 5 tabs por diseño.
- Imágenes: reusar el pool existente (webp), servidas desde Supabase Storage.
- Motores = funciones puras testeables.
- Bilingüe ya resuelto → ASO español-first sin builds extra.

## 14. Contenido y assets

- Existe pool de imágenes en `assets/exercises/`. Subconjunto de calistenia reutilizable: Push-Up (+ diamond/incline/decline/wide), Pull-Up, Chin-Up, Australian Pull-Up, Inverted Row, Dips, Bench Dip, Plank, Side Plank, L-Sit, Hanging Leg/Knee Raise, Mountain Climbers, Bird Dog, Dead Bug, Burpee, Glute Bridge, Lunges, Step-Up, Box Jump, Jump Rope, etc.
- Faltan imágenes para skills avanzados: muscle-up, plancha, front lever, handstand push-up, one-arm → costo incremental mínimo.
- El **mayor costo del proyecto es sembrar bien el grafo de progresiones** (nodos, umbrales, prerequisitos, retos) — esfuerzo único y es el foso competitivo.

### 14.1 Catálogo de retos por tier (semilla)
- **Tier 1 — Élite (meses):** Handstand Hold, Handstand Push-Up, L-Sit, Pistol Squat. Metas a largo plazo, no ejercicios de rutina.
- **Tier 2 — Técnicas (3–6 meses):** Pseudo Planche Push-Up, Archer Push-Up, Nordic Curl, Hanging Leg Raise. Alcanzables con progresión desde el catálogo actual.
- **Tier 3 — 4–8 semanas:** Pull-Up, Dips paralelas, Hollow Body Hold 60s, Single-Leg Hip Thrust con pausa. Prerequisitos claros en el catálogo.
- **Tier 4 — Volumen/tiempo (metas sobre existentes, los más virales, criterio 100% verificable):** 100 Push-Ups, Plank 5 min, 100 Burpees en 10 min, 10 Pull-Ups consecutivos.
- **Equipamiento:** cada nodo/reto se etiqueta (`equipment`). Garantizar ≥1 ruta y varios retos **sin barra** por tier (push-ups, pistol, handstand, plancha, plank, burpees, hollow body, nordic curl, hip thrust). Los de barra (pull-up, muscle-up, hanging leg raise, dips) se ofrecen solo si el usuario marcó tener barra.

### 14.2 Assets de avatar (ya existen)
`assets/avatares/`: `avatar_hombre_pixelArt.png`, `avatar_mujer_pixelArt.png` (6 niveles c/u, tema Oni/neón), `ej_animacion_lvlUp.png`, `avatar_mujer_animacionlvlup_pixelArt.png` (animación de level-up).

## 15. Riesgos y decisiones abiertas

- **Curaduría del árbol y umbrales:** los `unlock_reps`/`hold` y los `readiness_rule` deben ser realistas (validar con fuentes de calistenia). Mal calibrados → frustración.
- **Equilibrio del paywall:** que el corte Avanzado no asfixie al gratis (vigilar reseñas y conversión post-lanzamiento).
- **Verificación de retos de volumen (Tier 4):** definir el modo de validación — ¿temporizador/contador guiado en la app (cuenta reps/tiempo) o auto-reporte honesto? Afecta credibilidad y viralidad.
- **Mapeo nivel→avatar:** definir los 6 umbrales de nivel global que disparan cada estado del avatar.
- **Granularidad de equipamiento:** lista exacta de opciones en onboarding (sin equipo / barra / bandas / paralelas / anillas…).

---

## Decisiones acordadas (registro)

1. App = especialista casa/calistenia, español-first, principiante→avanzado.
2. Gancho = árbol de skills gamificado (5 ramas × 3 niveles) con retos + readiness.
3. Gamificación **opcional/omitible**; usuario diario vive en Entrenar sin fricción. **Tab por defecto de fábrica = Entrenar.**
4. Gate por nivel al crear rutinas que superan el nivel probado (prueba de aptitud).
5. Ingresos = freemium suscripción (Princ.+Interm. gratis; Avanzado+automatización+stats premium) vía RevenueCat.
6. Alcance = iteración sobre la base actual (sin rewrite); 5 tabs; Tabata se queda.
7. Arte = UI oscura futurista + pixel art de acento; **avatar = cara HUD con 6 niveles (Oni champion), hombre/mujer, arte ya en `assets/avatares/`, en v1**; jefes/personaje completo = extra de polish.
8. Datos = `exercise_progressions`, `user_skill_progress`, `workout_logs`, `challenges` + `user_challenge_progress`; gate vía `Routine.metadata`; `profiles.available_equipment`.
9. **Retos en 4 tiers** (élite / técnicas / 4-8 sem / volumen). Tier 4 = retos de volumen/tiempo, los más virales y 100% verificables.
10. **Equipment-aware:** siempre hay retos y rutas sin barra (en casa); equipamiento capturado en onboarding.
