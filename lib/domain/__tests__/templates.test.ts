import seed from '@/lib/data/exercises.seed.json';
import {
  ENVIRONMENTS,
  groupByEnvironment,
  routineFromTemplate,
  type RoutineTemplate,
} from '../templates';
import type { Exercise } from '../types';

const BIBLIOTECA = seed as Exercise[];

const CASERA: RoutineTemplate = {
  id: 'prueba-casa',
  name: 'Prueba en casa',
  tagline: 'Dos días cortos',
  environment: 'casa',
  equipment: 'Mancuerna y cuerda de saltar',
  level: 'intermedio',
  text: `Día A — Empuje
1. Flexiones — 4x15
2. Fondos en silla — 3x12

Día B — Tirón
1. Remo invertido — 4x10`,
};

const DE_GIMNASIO: RoutineTemplate = {
  ...CASERA,
  id: 'prueba-gym',
  name: 'Prueba en gimnasio',
  environment: 'gimnasio',
  equipment: 'Gimnasio completo',
};

describe('routineFromTemplate', () => {
  const rutina = routineFromTemplate(CASERA, BIBLIOTECA, '2026-09-09T00:00:00.000Z');

  it('lee los días y las filas del texto de la plantilla', () => {
    expect(rutina.days).toHaveLength(2);
    expect(rutina.days[0].rows).toHaveLength(2);
    expect(rutina.days[1].rows).toHaveLength(1);
  });

  it('se queda con el nombre de la plantilla', () => {
    expect(rutina.name).toBe('Prueba en casa');
  });

  // Lo que motiva todo esto: saber si hay que salir de casa sin abrir la tabla.
  it('guarda el equipamiento en la rutina', () => {
    expect(rutina.equipment).toBe('Mancuerna y cuerda de saltar');
  });

  it('respeta las series y las repeticiones escritas', () => {
    expect(rutina.days[0].rows[0]).toMatchObject({ sets: 4, reps: '15' });
  });

  it('ata a la biblioteca lo que reconoce', () => {
    const enlazadas = rutina.days.flatMap((d) => d.rows).filter((r) => r.exerciseId !== null);
    expect(enlazadas.length).toBeGreaterThan(0);
  });

  it('arranca sin nada marcado y sin fecha de reinicio', () => {
    const filas = rutina.days.flatMap((d) => d.rows);
    expect(filas.every((r) => !r.done)).toBe(true);
    expect(rutina.days.every((d) => d.lastResetOn === null)).toBe(true);
  });

  it('cada rutina creada es nueva: ids distintos', () => {
    const otra = routineFromTemplate(CASERA, BIBLIOTECA, '2026-09-09T00:00:00.000Z');
    expect(otra.id).not.toBe(rutina.id);
    expect(otra.days[0].id).not.toBe(rutina.days[0].id);
  });
});

describe('groupByEnvironment', () => {
  it('agrupa y conserva el orden de los entornos', () => {
    const grupos = groupByEnvironment([DE_GIMNASIO, CASERA]);
    expect(grupos.map((g) => g.environment)).toEqual(['casa', 'gimnasio']);
    expect(grupos[0].templates).toEqual([CASERA]);
  });

  it('no deja grupos vacíos', () => {
    const grupos = groupByEnvironment([CASERA]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].label).toBe(ENVIRONMENTS.casa.label);
  });

  it('sin plantillas, ningún grupo', () => {
    expect(groupByEnvironment([])).toEqual([]);
  });
});

describe('ENVIRONMENTS', () => {
  it('cada entorno tiene etiqueta e icono', () => {
    for (const entorno of Object.values(ENVIRONMENTS)) {
      expect(entorno.label.length).toBeGreaterThan(0);
      expect(entorno.icon.length).toBeGreaterThan(0);
    }
  });
});
