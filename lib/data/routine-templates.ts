/**
 * El catalogo de plantillas que se ofrece la primera vez.
 *
 * Cada plantilla es **un parte escrito**, en el mismo formato que se pega
 * desde WhatsApp: lo lee `parseRoutineText`, que ya tiene sus tests. Anadir una
 * plantilla es pegar texto aqui, no inventarse una estructura nueva.
 *
 * La progresion («-> Archer push up 4x10») se deja fuera a proposito: el
 * importador la descarta porque esa vive en la biblioteca, no en la hoja del
 * dia. Aqui se escribe solo lo que toca hacer hoy.
 *
 * `equipment` es lo que decide de verdad: si hay que salir de casa o no.
 */
import type { RoutineTemplate } from '@/lib/domain/templates';

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'casa-mancuerna',
    name: 'Casa con mancuerna',
    tagline: 'Empuje, tirón y pierna en tres días — el cuarto, de core, es opcional',
    environment: 'casa',
    equipment: 'Mancuerna o kettlebell, cuerda de saltar, una silla y una toalla',
    level: 'intermedio',
    text: `DÍA A — Empuje (pecho/hombro/tríceps)
1. Push ups clásicas — 4x15
2. Pike push ups — 4x12
3. KB Press militar a una mano — 3x10 por lado
4. Flexiones pies elevados — 3x10
5. Plancha estática — 3x60seg
6. Fondos en silla (dips) — 3x15
7. Curl de muñeca 3x30

🔥 CUERDA 40/20 x12 rondas

DÍA B — Tirón + Bíceps + Espalda
1. Remo invertido (toalla/mesa) — 4x10
2. KB Curl a una mano — 4x12 por lado
3. Remo a una mano con mancuerna — 4x12 por lado
4. Curl martillo mancuerna a una mano — 3x30 por lado
5. Superman hold Brazos extendidos 3x60seg
6. Face pull con toalla en puerta — 3x15
7. Curl de muñeca inversa 3x40

🔥 CUERDA 40/20 x12 rondas

DÍA C — Piernas + Glúteo
1. Goblet squat KB15 — 4x15
2. Búlgara con KB en mano — 3x10 por pierna
3. KB Swing a dos manos — 4x15
4. Hip thrust — 4x20
5. Elevación talón con KB en mano — 3x30
6. Peso muerto rumano a una pierna con KB — 3x8 por lado

🔥 CUERDA 40/20 x12 rondas

DÍA D (opcional) — Core + Full body
1. Bicycle crunch — 3x20 por lado
2. Plancha con toque de hombro — 3x24
3. KB Russian twist — 3x15 por lado
4. Mountain climbers — 4x20 por lado
5. Hollow hold — 3x40seg
6. Burpee — 3x10

🔥 CUERDA 40/20 x12 rondas`,
  },
  {
    id: 'gym-pablo',
    name: 'Rutina Pablo',
    tagline: 'Seis días de gimnasio: espalda, pierna, pecho, brazo y movilidad',
    environment: 'gimnasio',
    equipment: 'Gimnasio completo: máquinas, poleas, barra y mancuernas',
    level: 'intermedio',
    text: `DÍA 1 — Espalda (7 ejercicios)

| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |
|---|---|---|---|---|---|
| 1 | Dominadas | 3 | 6-8 | 3:00 | no |
| 2 | Remo en Smith | 3 | 8-10 | 2:00 | no |
| 3 | Remo horizontal unilateral | 3 | 8-10 | 2:00 | no |
| 4 | Curl de bíceps en polea | 3 | 10-12 | 2:00 | no |
| 5 | Elevaciones laterales | 3 | 12 | 2:00 | no |
| 6 | Curl inclinado en banco | 3 | 10 | 2:00 | no |
| 7 | Extensión de tríceps | 3 | 10 | 2:00 | no |

DÍA 2 — Pierna (7 ejercicios)

| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |
|---|---|---|---|---|---|
| 1 | Sentadilla libre | 3 | 6-8 | 3:00 | no |
| 2 | Peso muerto convencional | 3 | 6-8 | 3:00 | no |
| 3 | Prensa inclinada | 3 | 10-12 | 2:00 | no |
| 4 | Extensión de rodilla | 3 | 10-12 | 2:00 | no |
| 5 | Hip thrust en máquina | 3 | 12 | 2:00 | no |
| 6 | Abducción | 3 | 15-20 | 2:00 | no |
| 7 | Pantorrilla en prensa inclinada | 3 | 15 | 2:00 | no |

DÍA 3 — Pecho (7 ejercicios)

| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |
|---|---|---|---|---|---|
| 1 | Peck deck | 3 | 8-10 | 2:00 | no |
| 2 | Press hammer | 3 | 6-8 | 2:00 | no |
| 3 | Press inclinado | 3 | 8-10 | 2:00 | no |
| 4 | Extensión de tríceps | 3 | 8-10 | 2:00 | no |
| 5 | Curl de bíceps con barra | 3 | 6-8 | 2:00 | no |
| 6 | Elevaciones laterales | 4 | 12 | 2:00 | no |
| 7 | Martillos | 3 | 10-12 | 2:00 | no |

DÍA 4 — Espalda (8 ejercicios)

| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |
|---|---|---|---|---|---|
| 1 | Jalón al pecho | 3 | 6-8 | 3:00 | no |
| 2 | Remo en Smith | 3 | 8-10 | 2:00 | no |
| 3 | Face pull con polea | 3 | 8-10 | 2:00 | no |
| 4 | Curl de bíceps en polea | 3 | 10-12 | 2:00 | no |
| 5 | Elevaciones laterales | 3 | 12 | 2:00 | no |
| 6 | Curl inclinado en banco | 3 | 10 | 2:00 | no |
| 7 | Extensión de tríceps | 3 | 10 | 2:00 | no |
| 8 | Posterior en peck deck | 3 | 15 | 1:30 | no |

DÍA 5 — Brazo (7 ejercicios)

| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |
|---|---|---|---|---|---|
| 1 | Press militar con mancuernas | 4 | 6-8 | 2:00 | no |
| 2 | Curl de bíceps con mancuernas | 3 | 6-8 | 2:00 | no |
| 3 | Martillos | 3 | 10 | 2:00 | no |
| 4 | Laterales con mancuernas | 3 | 10 | 2:00 | no |
| 5 | Extensión de tríceps | 3 | 10 | 2:00 | no |
| 6 | Copa con mancuerna | 3 | 10 | 2:00 | no |
| 7 | Laterales con polea | 3 | 10 | 2:00 | no |

DÍA 6 — Movilidad y abdomen (11 ejercicios)

| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |
|---|---|---|---|---|---|
| 1 | Rotación de brazos | 2 | 12 | 1:00 | no |
| 2 | Empuje de escápulas | 2 | 15 | 1:00 | no |
| 3 | Rotación de hombros en pared | 2 | 12 | 1:00 | no |
| 4 | Rotación interna y externa del fémur | 2 | 15 | 1:00 | no |
| 5 | Sentadilla con palo | 2 | 10 | 1:00 | no |
| 6 | Puente de glúteo en fitball | 2 | 10 | 1:00 | no |
| 7 | Crunch en máquina | 3 | 12 | 1:00 | no |
| 8 | Plancha dinámica | 3 | fallo | 1:00 | no |
| 9 | Press pallof | 3 | 15 | 1:00 | no |
| 10 | Caminata de granjero | 3 | 1 min | 1:00 | no |
| 11 | Elevación de piernas | 3 | 10 | 1:00 | no |`,
  },
];
