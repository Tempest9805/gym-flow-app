import { addRow, removeRow, updateRow, moveRow, replaceDay, blankRow } from '../routine';
import type { Routine, RoutineDay, RoutineRow } from '../types';

const row = (id: string): RoutineRow => ({
  id, exerciseId: id, name: `E${id}`, sets: 3, reps: '10', restSeconds: 120, mode: 'reps', done: false,
});

const day: RoutineDay = {
  id: 'd1', label: 'Día 1', focus: 'Espalda', icon: 'weight-lifter', lastResetOn: null,
  rows: [row('a'), row('b'), row('c')],
};

const routine: Routine = {
  id: 'r1', name: 'R', athleteName: null, goal: null, coachName: null,
  days: [day], updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('blankRow', () => {
  it('creates a usable row with sane defaults', () => {
    const r = blankRow('Fondos');
    expect(r.name).toBe('Fondos');
    expect(r.sets).toBeGreaterThan(0);
    expect(r.restSeconds).toBeGreaterThan(0);
    expect(r.done).toBe(false);
    expect(r.id).toBeTruthy();
  });

  it('gives each row a distinct id', () => {
    expect(blankRow('a').id).not.toBe(blankRow('a').id);
  });
});

describe('addRow', () => {
  it('appends at the end', () => {
    const result = addRow(day, row('d'));
    expect(result.rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not mutate the input', () => {
    addRow(day, row('d'));
    expect(day.rows).toHaveLength(3);
  });
});

describe('removeRow', () => {
  it('drops the row', () => {
    expect(removeRow(day, 'b').rows.map((r) => r.id)).toEqual(['a', 'c']);
  });

  it('is a no-op for an unknown id', () => {
    expect(removeRow(day, 'zzz')).toBe(day);
  });
});

describe('updateRow', () => {
  it('patches only the named fields of one row', () => {
    const result = updateRow(day, 'b', { sets: 5, reps: '6-8' });
    expect(result.rows[1]).toMatchObject({ id: 'b', sets: 5, reps: '6-8', restSeconds: 120 });
    expect(result.rows[0].sets).toBe(3);
  });

  it('is a no-op for an unknown id', () => {
    expect(updateRow(day, 'zzz', { sets: 9 })).toBe(day);
  });
});

describe('moveRow', () => {
  it('moves a row up', () => {
    expect(moveRow(day, 'c', -1).rows.map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });

  it('moves a row down', () => {
    expect(moveRow(day, 'a', 1).rows.map((r) => r.id)).toEqual(['b', 'a', 'c']);
  });

  it('clamps at the edges instead of wrapping around', () => {
    expect(moveRow(day, 'a', -1).rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(moveRow(day, 'c', 1).rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('replaceDay', () => {
  it('swaps the day in place and refreshes updatedAt', () => {
    const edited = { ...day, focus: 'Dorsales' };
    const result = replaceDay(routine, edited, '2026-09-02T00:00:00.000Z');
    expect(result.days[0].focus).toBe('Dorsales');
    expect(result.updatedAt).toBe('2026-09-02T00:00:00.000Z');
  });

  it('is a no-op when the day does not belong to the routine', () => {
    expect(replaceDay(routine, { ...day, id: 'nope' }, '2026-09-02T00:00:00.000Z')).toBe(routine);
  });
});
