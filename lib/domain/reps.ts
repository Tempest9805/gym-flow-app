/**
 * Reps are free text on a coaching sheet: "6-8", "12", "fallo", "1 min".
 * We store exactly what the coach wrote and interpret it only when we need
 * to reason about it (e.g. is this row timed?).
 */
import type { RepsSpec } from './types';

const RANGE = /^(\d+)\s*[-–—]\s*(\d+)$/;
const FIXED = /^\d+$/;
const DURATION = /^(\d+)\s*(s|seg|segs|segundos?|m|min|mins|minutos?)$/;

/** Interpret the reps text a coach wrote. Never throws; unknown text stays raw. */
export function parseReps(input: string): RepsSpec {
  const text = input.trim();
  if (text === '') return { kind: 'raw', text: '' };

  const lower = text.toLowerCase();
  if (lower === 'fallo' || lower === 'failure') return { kind: 'failure' };

  const duration = DURATION.exec(lower);
  if (duration) {
    const value = Number(duration[1]);
    const isMinutes = duration[2].startsWith('m');
    return { kind: 'time', seconds: isMinutes ? value * 60 : value };
  }

  const range = RANGE.exec(text);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    // A reversed range ("12-8") is a typo, not a range — keep it verbatim.
    if (max >= min) return { kind: 'range', min, max };
    return { kind: 'raw', text };
  }

  if (FIXED.test(text)) return { kind: 'fixed', value: Number(text) };

  return { kind: 'raw', text };
}

/** Render a spec back to the short form a coach would write. */
export function formatReps(spec: RepsSpec): string {
  switch (spec.kind) {
    case 'fixed':
      return String(spec.value);
    case 'range':
      return `${spec.min}-${spec.max}`;
    case 'failure':
      return 'fallo';
    case 'time':
      return spec.seconds % 60 === 0 ? `${spec.seconds / 60} min` : `${spec.seconds}s`;
    case 'raw':
      return spec.text;
  }
}

/** True when the row is held or performed for a duration rather than counted. */
export function isTimeBased(input: string): boolean {
  return parseReps(input).kind === 'time';
}
