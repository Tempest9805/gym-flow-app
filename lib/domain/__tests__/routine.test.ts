import {
  addRow, insertRow, removeRow, updateRow, moveRow, replaceDay, blankRow,
  blankDay, blankRoutine, addDay, removeDay, setDayFocus, updateRoutineMeta,
} from '../routine';
import type { Routine, RoutineDay, RoutineRow } from '../types';

const row = (id: string): RoutineRow => ({
  id, exerciseId: id, name: `E${id}`, sets: 3, reps: '10', restSeconds: 120, mode: 'reps', done: false,
});

const day: RoutineDay = {
  id: 'd1', label: 'Día 1', focus: 'Espalda', icon: 'weight-lifter', lastResetOn: null,
  rows: [row('a'), row('b'), row('c')],
};

const routine: Routine = {
  id: 'r1', name: 'R', athleteName: null, goal: null, coachName: null, equipment: null,
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

describe('insertRow', () => {
  it('puts a row back where it was', () => {
    const removed = removeRow(day, 'b');
    const restored = insertRow(removed, row('b'), 1);
    expect(restored.rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('clamps an index past the end', () => {
    expect(insertRow(day, row('z'), 99).rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'z']);
  });

  it('clamps a negative index to the start', () => {
    expect(insertRow(day, row('z'), -5).rows.map((r) => r.id)).toEqual(['z', 'a', 'b', 'c']);
  });

  it('does not mutate the input', () => {
    insertRow(day, row('z'), 0);
    expect(day.rows).toHaveLength(3);
  });
});

describe('blankDay', () => {
  it('derives the icon from the focus', () => {
    expect(blankDay('Día 1', 'Espalda').icon).toBe('weight-lifter');
    expect(blankDay('Día 1', '').icon).toBe('dumbbell');
  });

  it('starts empty and unchecked', () => {
    const d = blankDay('Día 1', 'Pecho');
    expect(d.rows).toEqual([]);
    expect(d.lastResetOn).toBeNull();
  });
});

describe('blankRoutine', () => {
  it('starts with exactly one day so it is trainable immediately', () => {
    const r = blankRoutine('Mi rutina', '2026-09-01T00:00:00.000Z');
    expect(r.days).toHaveLength(1);
    expect(r.days[0].label).toBe('Día 1');
    expect(r.name).toBe('Mi rutina');
  });
});

describe('addDay', () => {
  it('numbers the new day after the existing ones', () => {
    const r = addDay(routine, 'Pecho', '2026-09-02T00:00:00.000Z');
    expect(r.days.map((d) => d.label)).toEqual(['Día 1', 'Día 2']);
    expect(r.days[1].focus).toBe('Pecho');
    expect(r.updatedAt).toBe('2026-09-02T00:00:00.000Z');
  });

  it('supports growing to seven days', () => {
    let r = routine;
    for (let i = 0; i < 6; i += 1) r = addDay(r, 'X', '2026-09-02T00:00:00.000Z');
    expect(r.days).toHaveLength(7);
    expect(r.days[6].label).toBe('Día 7');
  });
});

describe('removeDay', () => {
  const three = addDay(addDay(routine, 'Pecho', 'x'), 'Pierna', 'x');

  it('renumbers the remaining days so labels have no gaps', () => {
    const r = removeDay(three, three.days[1].id, '2026-09-02T00:00:00.000Z');
    expect(r.days.map((d) => d.label)).toEqual(['Día 1', 'Día 2']);
    expect(r.days.map((d) => d.focus)).toEqual(['Espalda', 'Pierna']);
  });

  it('refuses to remove the only day', () => {
    expect(removeDay(routine, routine.days[0].id, 'x')).toBe(routine);
  });

  it('is a no-op for an unknown day', () => {
    expect(removeDay(three, 'nope', 'x')).toBe(three);
  });

  // El importador guarda el nombre que escribio el coach —«Dia A», «Lunes»,
  // «Push»— a proposito. Renumerar todo se lo llevaba por delante al borrar
  // cualquier otro dia.
  it('respeta los nombres que no son «Dia N»', () => {
    const conNombres: Routine = {
      ...three,
      days: [
        { ...three.days[0], label: 'Día A' },
        { ...three.days[1], label: 'Lunes' },
        { ...three.days[2], label: 'Día 3' },
      ],
    };

    const r = removeDay(conNombres, conNombres.days[1].id, 'x');
    expect(r.days.map((d) => d.label)).toEqual(['Día A', 'Día 2']);
  });

  it('renumera solo los automaticos, por su posicion', () => {
    const mezcla: Routine = {
      ...three,
      days: [
        { ...three.days[0], label: 'Push' },
        { ...three.days[1], label: 'Día 2' },
        { ...three.days[2], label: 'Día 3' },
      ],
    };

    const r = removeDay(mezcla, mezcla.days[1].id, 'x');
    expect(r.days.map((d) => d.label)).toEqual(['Push', 'Día 2']);
  });
});

describe('setDayFocus', () => {
  it('updates the icon alongside the focus', () => {
    const r = setDayFocus(routine, routine.days[0].id, 'Movilidad', '2026-09-02T00:00:00.000Z');
    expect(r.days[0].focus).toBe('Movilidad');
    expect(r.days[0].icon).toBe('yoga');
  });

  it('is a no-op for an unknown day', () => {
    expect(setDayFocus(routine, 'nope', 'X', 'x')).toBe(routine);
  });
});

describe('updateRoutineMeta', () => {
  it('patches only what it is given', () => {
    const r = updateRoutineMeta(routine, { coachName: 'Nach' }, '2026-09-02T00:00:00.000Z');
    expect(r.coachName).toBe('Nach');
    expect(r.name).toBe('R');
    expect(r.updatedAt).toBe('2026-09-02T00:00:00.000Z');
  });

  it('can clear an optional field back to null', () => {
    const withCoach = updateRoutineMeta(routine, { coachName: 'Nach' }, 'x');
    expect(updateRoutineMeta(withCoach, { coachName: null }, 'x').coachName).toBeNull();
  });
});
