/**
 * Editing a routine. All pure: each function returns a new object, or the
 * original when the edit would change nothing.
 */
import type { Routine, RoutineDay, RoutineRow } from './types';

let rowCounter = 0;

/** Defaults for a hand-added row: 3 sets of 10 with a 2 minute rest. */
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = '10';
export const DEFAULT_REST_SECONDS = 120;

/** A new blank row, ready to edit. */
export function blankRow(name: string): RoutineRow {
  rowCounter += 1;
  return {
    id: `row-${Date.now().toString(36)}-${rowCounter}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: null,
    name,
    sets: DEFAULT_SETS,
    reps: DEFAULT_REPS,
    restSeconds: DEFAULT_REST_SECONDS,
    mode: 'reps',
    done: false,
  };
}

/** Append a row to the end of the day. */
export function addRow(day: RoutineDay, row: RoutineRow): RoutineDay {
  return { ...day, rows: [...day.rows, row] };
}

/** Drop a row. Unknown ids are a no-op. */
export function removeRow(day: RoutineDay, rowId: string): RoutineDay {
  if (!day.rows.some((row) => row.id === rowId)) return day;
  return { ...day, rows: day.rows.filter((row) => row.id !== rowId) };
}

/** Patch named fields of one row. Unknown ids are a no-op. */
export function updateRow(
  day: RoutineDay,
  rowId: string,
  patch: Partial<Omit<RoutineRow, 'id'>>,
): RoutineDay {
  if (!day.rows.some((row) => row.id === rowId)) return day;
  return {
    ...day,
    rows: day.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
  };
}

/** Move a row by `delta` positions. Clamps at the edges rather than wrapping. */
export function moveRow(day: RoutineDay, rowId: string, delta: number): RoutineDay {
  const from = day.rows.findIndex((row) => row.id === rowId);
  if (from === -1) return day;

  const to = from + delta;
  if (to < 0 || to >= day.rows.length) return day;

  const rows = [...day.rows];
  const [moved] = rows.splice(from, 1);
  rows.splice(to, 0, moved);
  return { ...day, rows };
}

/** Swap an edited day back into its routine. Unknown days are a no-op. */
export function replaceDay(routine: Routine, day: RoutineDay, nowIso: string): Routine {
  if (!routine.days.some((d) => d.id === day.id)) return routine;
  return {
    ...routine,
    days: routine.days.map((d) => (d.id === day.id ? day : d)),
    updatedAt: nowIso,
  };
}
