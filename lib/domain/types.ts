/**
 * Domain types — the whole data model of the app.
 *
 * Pure data: no I/O, no React, no storage concerns. Everything the app
 * persists is one of these shapes.
 *
 * Shaped after a real coaching sheet (see docs/): a routine is an ordered
 * list of days, each day an ordered list of rows, each row one exercise
 * with its sets / reps / rest.
 */

/** A row's prescribed reps. Coaches write these as free text, not numbers. */
export type RepsSpec =
  | { kind: 'fixed'; value: number }        // "12"
  | { kind: 'range'; min: number; max: number } // "6-8"
  | { kind: 'failure' }                     // "fallo"
  | { kind: 'time'; seconds: number }       // "1 min"
  | { kind: 'raw'; text: string };          // anything else, shown as written

/** How a row is performed. `tabata` rows open the interval timer instead. */
export type RowMode = 'reps' | 'tabata';

/** An entry in the exercise library. */
export interface Exercise {
  /** Stable slug, e.g. "barbell-curl". */
  id: string;
  nameEs: string;
  nameEn: string | null;
  muscleGroup: string;
  /** Pinned video. When null the UI falls back to a YouTube search. */
  videoUrl: string | null;
  /** How to execute the movement. */
  description: string | null;
  /** Coaching cues. */
  tips: string | null;
  /** What people get wrong. */
  commonMistakes: string | null;
  /**
   * El ejercicio al que pasar cuando este deje de costar, por slug.
   *
   * Solo hay entrada cuando progresar significa cambiar de movimiento. Si la
   * progresion es anadir peso o repeticiones, esto es null: eso no es otro
   * ejercicio.
   */
  progressesTo: string | null;
}

/** One line of a training day. */
export interface RoutineRow {
  id: string;
  /** Library entry this row came from; null for a hand-typed row. */
  exerciseId: string | null;
  /** Editable snapshot of the name, so renaming a row never edits the library. */
  name: string;
  sets: number;
  /** Free text, as the coach wrote it: "6-8", "12", "fallo", "1 min". */
  reps: string;
  restSeconds: number;
  mode: RowMode;
  done: boolean;
}

/** One training day: "Día 1 — Espalda". */
export interface RoutineDay {
  id: string;
  /** "Día 1" */
  label: string;
  /** "Espalda" */
  focus: string;
  /** MaterialCommunityIcons glyph name. */
  icon: string;
  rows: RoutineRow[];
  /** ISO date (YYYY-MM-DD) the checks were last cleared on. */
  lastResetOn: string | null;
}

/** A full routine. Days are cyclic ("Día 1..N"), not tied to weekdays. */
export interface Routine {
  id: string;
  name: string;
  athleteName: string | null;
  goal: string | null;
  coachName: string | null;
  /** 1..7 days in practice; the model does not enforce a count. */
  days: RoutineDay[];
  updatedAt: string;
}

/**
 * Los tiempos y la estructura de un tabata.
 *
 * Vive aqui y no en el store porque es dato puro: `lib/domain/tabata.ts` lo
 * necesita para decidir las fases, y el dominio no importa nada de fuera. El
 * store lo reexporta, asi que nadie mas ha tenido que cambiar de sitio.
 */
export interface TabataConfig {
  prepSeconds: number;
  workSeconds: number;
  restSeconds: number;
  cooldownSeconds: number;
  cycleRestSeconds: number;
  rounds: number;
  cycles: number;
  soundEnabled: boolean;
}

/** Un tabata clasico: 3 rondas de 40/20, 5 ciclos. */
export const DEFAULT_TABATA_CONFIG: TabataConfig = {
  prepSeconds: 5,
  workSeconds: 40,
  restSeconds: 20,
  cooldownSeconds: 30,
  cycleRestSeconds: 15,
  rounds: 3,
  cycles: 5,
  soundEnabled: true,
};
