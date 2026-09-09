/**
 * Editing a routine. All pure: each function returns a new object, or the
 * original when the edit would change nothing.
 */
import { iconForFocus } from './icons';
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

/** Put a row back at a given position. Out-of-range indexes clamp to the ends. */
export function insertRow(day: RoutineDay, row: RoutineRow, index: number): RoutineDay {
  const at = Math.min(Math.max(0, index), day.rows.length);
  const rows = [...day.rows];
  rows.splice(at, 0, row);
  return { ...day, rows };
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

let dayCounter = 0;

function uid(prefix: string): string {
  dayCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${dayCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A new empty training day. The icon follows from the focus. */
export function blankDay(label: string, focus: string): RoutineDay {
  return {
    id: uid('day'),
    label,
    focus,
    icon: iconForFocus(focus),
    rows: [],
    lastResetOn: null,
  };
}

/** A new routine with a single day, ready to fill in. */
export function blankRoutine(name: string, nowIso: string): Routine {
  return {
    id: uid('routine'),
    name,
    athleteName: null,
    goal: null,
    coachName: null,
    equipment: null,
    days: [blankDay('Día 1', '')],
    updatedAt: nowIso,
  };
}

/** Append a day, numbered after the ones already there. */
export function addDay(routine: Routine, focus: string, nowIso: string): Routine {
  const day = blankDay(`Día ${routine.days.length + 1}`, focus);
  return { ...routine, days: [...routine.days, day], updatedAt: nowIso };
}

/**
 * Una etiqueta que puso la app, no el usuario.
 *
 * Es lo unico que distingue «Día 3» —que hay que renumerar para que no queden
 * huecos— de «Día A», «Lunes» o «Push», que los escribio el coach y son suyos.
 * El importador guarda el nombre literal a proposito; renumerar sin mirar se lo
 * llevaba por delante al borrar cualquier otro dia.
 */
function esEtiquetaAutomatica(label: string): boolean {
  return /^Día \d+$/.test(label);
}

/**
 * Drop a day and renumber the rest, so labels never show a gap.
 * Removing the last remaining day is refused: a routine with no days
 * cannot be trained and has no way back.
 */
export function removeDay(routine: Routine, dayId: string, nowIso: string): Routine {
  if (routine.days.length <= 1) return routine;
  if (!routine.days.some((d) => d.id === dayId)) return routine;

  const days = routine.days
    .filter((d) => d.id !== dayId)
    .map((day, index) =>
      esEtiquetaAutomatica(day.label) ? { ...day, label: `Día ${index + 1}` } : day,
    );

  return { ...routine, days, updatedAt: nowIso };
}

/** Change a day's focus, keeping its icon in step. */
export function setDayFocus(routine: Routine, dayId: string, focus: string, nowIso: string): Routine {
  if (!routine.days.some((d) => d.id === dayId)) return routine;
  return {
    ...routine,
    days: routine.days.map((d) => (d.id === dayId ? { ...d, focus, icon: iconForFocus(focus) } : d)),
    updatedAt: nowIso,
  };
}

/** Patch the routine header: name, athlete, goal, coach. */
export function updateRoutineMeta(
  routine: Routine,
  patch: Partial<Pick<Routine, 'name' | 'athleteName' | 'goal' | 'coachName'>>,
  nowIso: string,
): Routine {
  return { ...routine, ...patch, updatedAt: nowIso };
}
