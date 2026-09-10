/**
 * Durations are shown the way the coaching sheet writes them: m:ss.
 */

/** Seconds to "m:ss". Negatives clamp to 0:00 so a finished countdown reads cleanly. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** Read "m:ss" or a bare seconds count. Returns null when the text is not a duration. */
export function parseDuration(input: string): number | null {
  const text = input.trim();
  if (text === '') return null;

  const clock = /^(\d+):([0-5]\d)$/.exec(text);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  if (/^\d+$/.test(text)) return Number(text);

  return null;
}

/**
 * Stopwatch display: m:ss.cc.
 *
 * Hundredths rather than milliseconds — three digits flicker too fast to
 * read and nobody times a set to the millisecond.
 */
export function formatStopwatch(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const hundredths = Math.floor((total % 1000) / 10);

  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}
