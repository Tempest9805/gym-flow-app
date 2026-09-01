/**
 * Rest countdown.
 *
 * The timer stores the wall-clock instant it ends at, not a ticking counter.
 * That is the difference between a timer that survives the screen turning
 * off and one that silently pauses in your pocket: on returning to the app we
 * simply ask again how long is left, and a timer that expired while away is
 * already finished rather than frozen mid-count.
 */

export interface RestTimer {
  /** The row whose rest is running. */
  rowId: string;
  /** Epoch milliseconds when the rest is over. */
  endsAt: number;
  /** What the rest was set to, for the progress ring and for restarting. */
  totalSeconds: number;
}

/** Start a rest for `seconds`, ending `seconds` from `nowMs`. */
export function startRest(rowId: string, seconds: number, nowMs: number): RestTimer {
  return {
    rowId,
    endsAt: nowMs + Math.max(0, seconds) * 1000,
    totalSeconds: Math.max(0, seconds),
  };
}

/**
 * Whole seconds left, never negative.
 *
 * Rounded up so a timer started at 2:00 shows "2:00" for its first second
 * rather than flicking straight to 1:59.
 */
export function remainingSeconds(timer: RestTimer, nowMs: number): number {
  return Math.max(0, Math.ceil((timer.endsAt - nowMs) / 1000));
}

/** True once the rest is over. */
export function isFinished(timer: RestTimer, nowMs: number): boolean {
  return nowMs >= timer.endsAt;
}

/** 0 at the start, 1 when the rest is done. Safe for a zero-length rest. */
export function progress(timer: RestTimer, nowMs: number): number {
  if (timer.totalSeconds <= 0) return 1;
  const elapsed = timer.totalSeconds - remainingSeconds(timer, nowMs);
  return Math.min(1, Math.max(0, elapsed / timer.totalSeconds));
}

/**
 * The countdown as the table shows it: a map of row id to seconds left.
 * Empty when nothing is resting, so the table renders its normal state.
 */
export function toRemainingMap(
  timer: RestTimer | null,
  nowMs: number,
): Record<string, number> {
  if (timer === null) return {};
  return { [timer.rowId]: remainingSeconds(timer, nowMs) };
}
