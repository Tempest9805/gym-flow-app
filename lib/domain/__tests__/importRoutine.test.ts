import seed from '@/lib/data/exercises.seed.json';
import { countLinked, parseRoutineText, routineFromParsed } from '../importRoutine';
import type { Exercise } from '../types';

const BIBLIOTECA = seed as Exercise[];

// La rutina real que motivo el importador, tal cual se pega desde WhatsApp.
const RUTINA_DANIEL = `
═══════════════════════════
DÍA A — Empuje (pecho/hombro/tríceps)
═══════════════════════════
1. Push ups clásicas — 4x15 → Archer push up 4x10
2. Pike push ups — 4x12 → Pike pies elevados 3x8
3. KB Press militar a una mano — 3x10 por lado → KB10 3x10
4. Flexiones pies elevados — 3x10 → Silla→mesa 3x8
5. Plancha estática — 3x60seg → Plancha toque hombro 3x20
6. Fondos en silla (dips) — 3x15 → Pies elevados 3x10
7. Curl de muñeca 3x30

🔥 CUERDA 40/20 x12 rondas

═══════════════════════════
DÍA B — Tirón + Bíceps + Espalda
═══════════════════════════
1. Remo invertido (toalla/mesa) — 4x10 → Pies elevados 4x10
2. KB Curl a una mano — 4x12 por lado → KB15 4x10
3. Superman hold Brazos extendidos 3x60seg

🔥 CUERDA 40/20 x12 rondas
`;

describe('parseRoutineText', () => {
  const parsed = parseRoutineText(RUTINA_DANIEL);

  it('encuentra los dias', () => {
    expect(parsed.days).toHaveLength(2);
    expect(parsed.days[0].label).toBe('Día A');
    expect(parsed.days[1].label).toBe('Día B');
  });

  it('separa la etiqueta del enfoque', () => {
    expect(parsed.days[0].focus).toBe('Empuje (pecho/hombro/tríceps)');
    expect(parsed.days[1].focus).toBe('Tirón + Bíceps + Espalda');
  });

  it('cuenta las filas, la cuerda incluida', () => {
    expect(parsed.days[0].rows).toHaveLength(8);
    expect(parsed.days[1].rows).toHaveLength(4);
  });

  it('lee series y repeticiones', () => {
    const primera = parsed.days[0].rows[0];
    expect(primera.name).toBe('Push ups clásicas');
    expect(primera.sets).toBe(4);
    expect(primera.reps).toBe('15');
  });

  // La progresion se descarta a proposito: vive en la biblioteca, no en la hoja.
  it('descarta lo que va despues de la flecha', () => {
    expect(parsed.days[0].rows[1].name).toBe('Pike push ups');
    expect(parsed.days[0].rows[1].reps).toBe('12');
  });

  it('conserva "por lado" en las repeticiones', () => {
    const fila = parsed.days[0].rows[2];
    expect(fila.name).toBe('KB Press militar a una mano');
    expect(fila.sets).toBe(3);
    expect(fila.reps).toBe('10 por lado');
  });

  it('conserva los tiempos tal cual', () => {
    expect(parsed.days[0].rows[4].reps).toBe('60seg');
  });

  it('lee una fila sin guion separador', () => {
    const fila = parsed.days[0].rows[6];
    expect(fila.name).toBe('Curl de muñeca');
    expect(fila.sets).toBe(3);
    expect(fila.reps).toBe('30');
  });

  it('convierte la cuerda en una fila de tabata', () => {
    const cuerda = parsed.days[0].rows[7];
    expect(cuerda.mode).toBe('tabata');
    expect(cuerda.name).toMatch(/cuerda/i);
  });

  it('pone el mismo descanso en todas las filas de fuerza', () => {
    for (const fila of parsed.days[0].rows) {
      if (fila.mode === 'reps') expect(fila.restSeconds).toBe(120);
    }
  });

  it('ignora los separadores decorativos', () => {
    const nombres = parsed.days.flatMap((d) => d.rows.map((r) => r.name));
    expect(nombres.some((n) => n.includes('═'))).toBe(false);
  });
});

describe('formatos que también deben entrar', () => {
  it('acepta "Día 1" con numero y dos puntos', () => {
    const r = parseRoutineText('Día 1: Pecho\n- Press banca 4x8\n- Aperturas 3x12');
    expect(r.days[0].label).toBe('Día 1');
    expect(r.days[0].focus).toBe('Pecho');
    expect(r.days[0].rows).toHaveLength(2);
  });

  it('acepta viñetas y la equis por unicode', () => {
    const r = parseRoutineText('Día 1 - Pierna\n• Sentadilla 5×5');
    expect(r.days[0].rows[0].name).toBe('Sentadilla');
    expect(r.days[0].rows[0].sets).toBe(5);
    expect(r.days[0].rows[0].reps).toBe('5');
  });

  // Nadie debe perder una linea por no haberla sabido leer.
  it('guarda una linea sin series como fila con el texto literal', () => {
    const r = parseRoutineText('Día 1 - Full body\nEstiramientos al terminar');
    expect(r.days[0].rows[0].name).toBe('Estiramientos al terminar');
    expect(r.days[0].rows[0].sets).toBe(3);
  });

  it('mete las filas sueltas en un día si el texto no trae cabeceras', () => {
    const r = parseRoutineText('Sentadilla 4x8\nPeso muerto 3x5');
    expect(r.days).toHaveLength(1);
    expect(r.days[0].rows).toHaveLength(2);
  });

  it('devuelve cero días con texto vacío o basura', () => {
    expect(parseRoutineText('').days).toHaveLength(0);
    expect(parseRoutineText('   \n\n  ').days).toHaveLength(0);
  });
});

// La rutina completa de cuatro dias, tal cual llego. Sirve de red: si el
// parser se rompe con un formato real, esto lo dice.
const RUTINA_COMPLETA = `
═══════════════════════════
DÍA A — Empuje (pecho/hombro/tríceps)
═══════════════════════════
1. Push ups clásicas — 4x15 → Archer push up 4x10
2. Pike push ups — 4x12 → Pike pies elevados 3x8
3. KB Press militar a una mano — 3x10 por lado → KB10 3x10
4. Flexiones pies elevados — 3x10 → Silla→mesa 3x8
5. Plancha estática — 3x60seg → Plancha toque hombro 3x20
6. Fondos en silla (dips) — 3x15 → Pies elevados 3x10
7. Curl de muñeca 3x30

🔥 CUERDA 40/20 x12 rondas

═══════════════════════════
DÍA B — Tirón + Bíceps + Espalda
═══════════════════════════
1. Remo invertido (toalla/mesa) — 4x10 → Pies elevados 4x10
2. KB Curl a una mano — 4x12 por lado → KB15 4x10
3. Remo a una mano con mancuerna — 4x12 por lado → +peso
4. Curl martillo mancuerna a una mano — 3x30 por lado → KB10
5. Superman hold Brazos extendidos 3x60seg
6. Face pull con toalla en puerta — 3x15 → 3x20
7. Curl de muñeca inversa 3x40
🔥 CUERDA 40/20 x12 rondas

═══════════════════════════
DÍA C — Piernas + Glúteo
═══════════════════════════
1. Goblet squat KB15 — 4x15 → KB con pausa 2seg 4x12
2. búlgara con KB en mano — 3x10 por pierna → +peso
3. KB Swing a dos manos — 4x15 → 4x20
4. Hip thrust — 4x20 → Unilateral 4x12
5. Elevación talón con KB en mano — 3x30 → Unilateral 3x15
6. Peso muerto rumano a una pierna con KB — 3x8 por lado → +peso

🔥 CUERDA 40/20 x12 rondas

═══════════════════════════
DÍA D (opcional) — Core + Full body
═══════════════════════════
1. Bicycle crunch — 3x20 por lado
2. Plancha con toque de hombro — 3x24
3. KB Russian twist — 3x15 por lado
4. Mountain climbers — 4x20 por lado
5. Hollow hold — 3x40seg
6. Burpee — 3x10

🔥 CUERDA 40/20 x12 rondas
`;

describe('la rutina completa de cuatro dias', () => {
  const r = parseRoutineText(RUTINA_COMPLETA);

  it('saca los cuatro dias con su enfoque', () => {
    expect(r.days.map((d) => d.label)).toEqual([
      'Día A',
      'Día B',
      'Día C',
      'Día D (opcional)',
    ]);
    expect(r.days[3].focus).toBe('Core + Full body');
  });

  it('cuenta las filas de cada dia, cuerda incluida', () => {
    expect(r.days.map((d) => d.rows.length)).toEqual([8, 8, 7, 7]);
  });

  it('cada dia termina en la cuerda', () => {
    for (const dia of r.days) {
      expect(dia.rows[dia.rows.length - 1].mode).toBe('tabata');
    }
  });

  it('lee todas las lineas sin recurrir al texto literal', () => {
    expect(r.unparsedLines).toBe(0);
  });

  it('acepta "por pierna" igual que "por lado"', () => {
    const bulgara = r.days[2].rows[1];
    expect(bulgara.name).toBe('búlgara con KB en mano');
    expect(bulgara.sets).toBe(3);
  });
});

describe('routineFromParsed', () => {
  const rutina = routineFromParsed(
    parseRoutineText(RUTINA_COMPLETA),
    'Mi rutina',
    BIBLIOTECA,
    '2026-01-01T00:00:00.000Z',
  );

  it('conserva los dias y las filas que se leyeron', () => {
    expect(rutina.days).toHaveLength(4);
    expect(rutina.days.map((d) => d.rows.length)).toEqual([8, 8, 7, 7]);
  });

  it('cada dia estrena su icono segun el enfoque', () => {
    expect(rutina.days[2].focus).toBe('Piernas + Glúteo');
    expect(rutina.days[2].icon).toBe('run');
  });

  it('los identificadores no se repiten', () => {
    const ids = rutina.days.flatMap((d) => d.rows.map((r) => r.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Es lo que hace que la fila pegada traiga foto, video y progresion.
  it('ata a la biblioteca mas de la mitad de las filas', () => {
    const deFuerza = rutina.days.flatMap((d) => d.rows).filter((r) => r.mode === 'reps');
    expect(countLinked(rutina) / deFuerza.length).toBeGreaterThan(0.5);
  });

  it('guarda el nombre que escribio el usuario, no el de la biblioteca', () => {
    const primera = rutina.days[0].rows[0];
    expect(primera.name).toBe('Push ups clásicas');
    expect(primera.exerciseId).toBe('push-up');
  });

  it('deja sin atar lo que no reconoce, sin perder la fila', () => {
    const muneca = rutina.days[0].rows[6];
    expect(muneca.name).toBe('Curl de muñeca');
    expect(muneca.exerciseId).toBeNull();
  });

  it('respeta el descanso de dos minutos', () => {
    expect(rutina.days[0].rows[0].restSeconds).toBe(120);
  });

  it('arranca sin nada marcado', () => {
    const hechas = rutina.days.flatMap((d) => d.rows).filter((r) => r.done);
    expect(hechas).toHaveLength(0);
  });

  it('cae en un nombre por defecto si no le dan ninguno', () => {
    expect(routineFromParsed(parseRoutineText('Sentadilla 4x8'), '  ', BIBLIOTECA, 'x').name).toBe(
      'Mi rutina',
    );
  });
});
