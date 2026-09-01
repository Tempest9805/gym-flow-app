/**
 * Reading persisted JSON back into domain objects.
 *
 * Storage is the app's only source of truth, and it can hold anything: data
 * written by an older build, a half-finished write, a value a user cleared.
 * So parsing is defensive — anything that does not match the shape is
 * rejected wholesale and the caller re-seeds rather than limping along with
 * half-valid data.
 *
 * Pure: no AsyncStorage, no React. See ./repository for the I/O shell.
 */
import type { Exercise, Routine, RoutineDay, RoutineRow, RowMode } from '@/lib/domain/types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** A string, or null. Absent and null are the same thing to us. */
const nullableString = (value: unknown): string | null =>
  isString(value) ? value : null;

function parseRow(raw: unknown): RoutineRow | null {
  if (!isObject(raw)) return null;
  if (!isString(raw.id) || !isString(raw.name)) return null;
  if (!isFiniteNumber(raw.sets) || !isFiniteNumber(raw.restSeconds)) return null;
  if (!isString(raw.reps)) return null;

  const mode: RowMode = raw.mode === 'tabata' ? 'tabata' : 'reps';

  return {
    id: raw.id,
    exerciseId: nullableString(raw.exerciseId),
    name: raw.name,
    sets: Math.max(1, Math.floor(raw.sets)),
    reps: raw.reps,
    restSeconds: Math.max(0, Math.floor(raw.restSeconds)),
    mode,
    done: raw.done === true,
  };
}

function parseDay(raw: unknown): RoutineDay | null {
  if (!isObject(raw)) return null;
  if (!isString(raw.id) || !isString(raw.label)) return null;
  if (!Array.isArray(raw.rows)) return null;

  const rows: RoutineRow[] = [];
  for (const entry of raw.rows) {
    const row = parseRow(entry);
    if (row === null) return null;
    rows.push(row);
  }

  return {
    id: raw.id,
    label: raw.label,
    focus: isString(raw.focus) ? raw.focus : '',
    icon: isString(raw.icon) ? raw.icon : 'dumbbell',
    rows,
    lastResetOn: nullableString(raw.lastResetOn),
  };
}

function parseRoutine(raw: unknown): Routine | null {
  if (!isObject(raw)) return null;
  if (!isString(raw.id) || !isString(raw.name)) return null;
  if (!Array.isArray(raw.days)) return null;

  const days: RoutineDay[] = [];
  for (const entry of raw.days) {
    const day = parseDay(entry);
    if (day === null) return null;
    days.push(day);
  }

  return {
    id: raw.id,
    name: raw.name,
    athleteName: nullableString(raw.athleteName),
    goal: nullableString(raw.goal),
    coachName: nullableString(raw.coachName),
    days,
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date(0).toISOString(),
  };
}

function parseExercise(raw: unknown): Exercise | null {
  if (!isObject(raw)) return null;
  if (!isString(raw.id) || !isString(raw.nameEs)) return null;

  return {
    id: raw.id,
    nameEs: raw.nameEs,
    nameEn: nullableString(raw.nameEn),
    muscleGroup: isString(raw.muscleGroup) ? raw.muscleGroup : 'general',
    videoUrl: nullableString(raw.videoUrl),
    description: nullableString(raw.description),
    tips: nullableString(raw.tips),
    commonMistakes: nullableString(raw.commonMistakes),
  };
}

/** Parse a stored routines payload. Returns null when it is unusable. */
export function parseRoutines(json: string | null): Routine[] | null {
  if (json === null || json.trim() === '') return null;

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;

  const routines: Routine[] = [];
  for (const entry of raw) {
    const routine = parseRoutine(entry);
    if (routine === null) return null;
    routines.push(routine);
  }
  return routines;
}

/** Parse a stored exercise library. Returns null when it is unusable. */
export function parseExercises(json: string | null): Exercise[] | null {
  if (json === null || json.trim() === '') return null;

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;

  const exercises: Exercise[] = [];
  for (const entry of raw) {
    const exercise = parseExercise(entry);
    if (exercise === null) return null;
    exercises.push(exercise);
  }
  return exercises;
}

/** Serialise for storage. Kept next to the parser so the pair stays in sync. */
export function serializeRoutines(routines: Routine[]): string {
  return JSON.stringify(routines);
}

export function serializeExercises(exercises: Exercise[]): string {
  return JSON.stringify(exercises);
}
