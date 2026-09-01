/**
 * A training day behaves like a fresh sheet of paper: whatever you ticked
 * yesterday is gone when you open it today.
 *
 * Every function here is pure and returns a new day; callers persist the
 * result. When nothing would change, the original object is returned so
 * callers can skip a write.
 */
import type { RoutineDay } from './types';

/** True when this day still carries checks from an earlier date. */
export function needsReset(day: RoutineDay, todayIso: string): boolean {
  if (day.lastResetOn === null) return false;
  if (day.lastResetOn === todayIso) return false;
  return day.rows.some((row) => row.done);
}

/** Clear every check and stamp the day as belonging to today. */
export function resetDay(day: RoutineDay, todayIso: string): RoutineDay {
  return {
    ...day,
    rows: day.rows.map((row) => (row.done ? { ...row, done: false } : row)),
    lastResetOn: todayIso,
  };
}

/** Flip one row's checkbox. Unknown ids are a no-op. */
export function toggleRow(day: RoutineDay, rowId: string, todayIso: string): RoutineDay {
  if (!day.rows.some((row) => row.id === rowId)) return day;
  return {
    ...day,
    rows: day.rows.map((row) => (row.id === rowId ? { ...row, done: !row.done } : row)),
    lastResetOn: todayIso,
  };
}

/** How far through the day the athlete is. */
export function dayProgress(day: RoutineDay): { done: number; total: number } {
  return {
    done: day.rows.filter((row) => row.done).length,
    total: day.rows.length,
  };
}

/** True only when there was something to do and all of it is done. */
export function isDayComplete(day: RoutineDay): boolean {
  return day.rows.length > 0 && day.rows.every((row) => row.done);
}
