import { needsReset, resetDay, dayProgress, toggleRow, isDayComplete } from '../day';
import type { RoutineDay, RoutineRow } from '../types';

const row = (id: string, done = false): RoutineRow => ({
  id,
  exerciseId: id,
  name: `Ejercicio ${id}`,
  sets: 3,
  reps: '6-8',
  restSeconds: 120,
  mode: 'reps',
  done,
});

const day = (rows: RoutineRow[], lastResetOn: string | null = null): RoutineDay => ({
  id: 'd1',
  label: 'Día 1',
  focus: 'Espalda',
  icon: 'weight-lifter',
  rows,
  lastResetOn,
});

describe('needsReset', () => {
  it('is true when the day was last used on an earlier date', () => {
    expect(needsReset(day([row('a', true)], '2026-08-31'), '2026-09-01')).toBe(true);
  });

  it('is false on the same date', () => {
    expect(needsReset(day([row('a', true)], '2026-09-01'), '2026-09-01')).toBe(false);
  });

  it('is false when nothing is checked, whatever the date', () => {
    expect(needsReset(day([row('a', false)], '2026-08-01'), '2026-09-01')).toBe(false);
  });

  it('is false for a day never used', () => {
    expect(needsReset(day([row('a', false)], null), '2026-09-01')).toBe(false);
  });
});

describe('resetDay', () => {
  it('clears every check and stamps the date', () => {
    const result = resetDay(day([row('a', true), row('b', true)], '2026-08-31'), '2026-09-01');
    expect(result.rows.every((r) => !r.done)).toBe(true);
    expect(result.lastResetOn).toBe('2026-09-01');
  });

  it('does not mutate the input', () => {
    const original = day([row('a', true)], '2026-08-31');
    resetDay(original, '2026-09-01');
    expect(original.rows[0].done).toBe(true);
    expect(original.lastResetOn).toBe('2026-08-31');
  });
});

describe('toggleRow', () => {
  it('flips one row and stamps the day', () => {
    const result = toggleRow(day([row('a'), row('b')]), 'b', '2026-09-01');
    expect(result.rows[0].done).toBe(false);
    expect(result.rows[1].done).toBe(true);
    expect(result.lastResetOn).toBe('2026-09-01');
  });

  it('leaves the day untouched when the row is unknown', () => {
    const input = day([row('a')]);
    expect(toggleRow(input, 'zzz', '2026-09-01')).toBe(input);
  });

  it('does not mutate the input', () => {
    const original = day([row('a')]);
    toggleRow(original, 'a', '2026-09-01');
    expect(original.rows[0].done).toBe(false);
  });
});

describe('dayProgress', () => {
  it('counts done over total', () => {
    expect(dayProgress(day([row('a', true), row('b'), row('c', true)]))).toEqual({ done: 2, total: 3 });
  });

  it('handles an empty day without dividing by zero', () => {
    expect(dayProgress(day([]))).toEqual({ done: 0, total: 0 });
  });
});

describe('isDayComplete', () => {
  it('is true when every row is done', () => {
    expect(isDayComplete(day([row('a', true), row('b', true)]))).toBe(true);
  });

  it('is false when any row is pending', () => {
    expect(isDayComplete(day([row('a', true), row('b')]))).toBe(false);
  });

  it('is false for an empty day — nothing was trained', () => {
    expect(isDayComplete(day([]))).toBe(false);
  });
});
