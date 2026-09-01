import { dayToMarkdown, routineToMarkdown } from '../export';
import type { Routine, RoutineDay } from '../types';

const day: RoutineDay = {
  id: 'd2',
  label: 'Día 2',
  focus: 'Pierna',
  icon: 'run',
  lastResetOn: null,
  rows: [
    { id: '1', exerciseId: 'squat', name: 'Sentadilla libre', sets: 3, reps: '6-8', restSeconds: 180, mode: 'reps', done: true },
    { id: '2', exerciseId: 'dl', name: 'Peso muerto convencional', sets: 3, reps: '6-8', restSeconds: 180, mode: 'reps', done: false },
    { id: '3', exerciseId: null, name: 'Saltar la cuerda', sets: 3, reps: '1 min', restSeconds: 60, mode: 'tabata', done: false },
  ],
};

const routine: Routine = {
  id: 'r1',
  name: 'Rutina Pablo',
  athleteName: 'Pablo',
  goal: 'brazos',
  coachName: 'Coaching Nach',
  days: [day],
  updatedAt: '2026-09-01T10:00:00.000Z',
};

describe('dayToMarkdown', () => {
  const md = dayToMarkdown(routine, day);

  it('names the routine, athlete, goal and coach', () => {
    expect(md).toContain('Rutina Pablo');
    expect(md).toContain('Pablo');
    expect(md).toContain('brazos');
    expect(md).toContain('Coaching Nach');
  });

  it('titles the day with its focus and exercise count', () => {
    expect(md).toContain('DÍA 2 — Pierna (3 ejercicios)');
  });

  it('emits a markdown table with one row per exercise', () => {
    expect(md).toContain('| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |');
    expect(md).toContain('| 1 | Sentadilla libre | 3 | 6-8 | 3:00 | sí |');
    expect(md).toContain('| 2 | Peso muerto convencional | 3 | 6-8 | 3:00 | no |');
  });

  it('formats rest as m:ss, never as raw seconds', () => {
    expect(md).toContain('3:00');
    expect(md).not.toContain('180');
  });

  it('explains every column so a reader with no context understands it', () => {
    expect(md).toContain('Leyenda');
    expect(md).toContain('Series:');
    expect(md).toContain('Repeticiones:');
    expect(md).toContain('Descanso:');
  });

  it('marks tabata rows so the reader knows they are timed intervals', () => {
    expect(md).toContain('Saltar la cuerda');
    expect(md).toMatch(/tabata/i);
  });

  it('escapes pipes in a name so the table cannot break', () => {
    const tricky = { ...day, rows: [{ ...day.rows[0], name: 'Press | banca' }] };
    expect(dayToMarkdown(routine, tricky)).toContain('Press \| banca');
  });
});

describe('routineToMarkdown', () => {
  it('includes every day', () => {
    const two: Routine = { ...routine, days: [day, { ...day, id: 'd3', label: 'Día 3', focus: 'Pecho' }] };
    const md = routineToMarkdown(two);
    expect(md).toContain('DÍA 2 — Pierna');
    expect(md).toContain('DÍA 3 — Pecho');
  });

  it('states the header once, not once per day', () => {
    const two: Routine = { ...routine, days: [day, { ...day, id: 'd3', label: 'Día 3' }] };
    expect(routineToMarkdown(two).match(/Coaching Nach/g)).toHaveLength(1);
  });

  it('omits absent optional fields instead of printing null', () => {
    const bare: Routine = { ...routine, athleteName: null, goal: null, coachName: null };
    const md = routineToMarkdown(bare);
    expect(md).not.toMatch(/null|undefined/);
    expect(md).toContain('Rutina Pablo');
  });
});
