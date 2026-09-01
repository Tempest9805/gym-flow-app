import {
  startRest,
  remainingSeconds,
  isFinished,
  progress,
  toRemainingMap,
} from '../restTimer';

const NOW = 1_760_000_000_000;

describe('startRest', () => {
  it('ends the rest the given number of seconds from now', () => {
    const timer = startRest('row1', 120, NOW);
    expect(timer.endsAt).toBe(NOW + 120_000);
    expect(timer.totalSeconds).toBe(120);
    expect(timer.rowId).toBe('row1');
  });

  it('clamps a negative rest to zero rather than ending in the past', () => {
    const timer = startRest('row1', -30, NOW);
    expect(timer.endsAt).toBe(NOW);
    expect(timer.totalSeconds).toBe(0);
  });
});

describe('remainingSeconds', () => {
  const timer = startRest('row1', 120, NOW);

  it('shows the full duration at the moment it starts', () => {
    expect(remainingSeconds(timer, NOW)).toBe(120);
  });

  it('rounds up, so the first second still reads as the full time', () => {
    expect(remainingSeconds(timer, NOW + 1)).toBe(120);
    expect(remainingSeconds(timer, NOW + 1000)).toBe(119);
  });

  it('reaches zero exactly at the end', () => {
    expect(remainingSeconds(timer, NOW + 120_000)).toBe(0);
  });

  it('never goes negative, however long the app was away', () => {
    expect(remainingSeconds(timer, NOW + 999_000)).toBe(0);
  });
});

describe('isFinished', () => {
  const timer = startRest('row1', 120, NOW);

  it('is false while time remains', () => {
    expect(isFinished(timer, NOW + 119_000)).toBe(false);
  });

  it('is true at the end and after it', () => {
    expect(isFinished(timer, NOW + 120_000)).toBe(true);
    expect(isFinished(timer, NOW + 500_000)).toBe(true);
  });

  it('is true for a rest that expired while the app was backgrounded', () => {
    // The point of storing an end instant: no catching up on resume.
    const started = startRest('row1', 90, NOW);
    expect(isFinished(started, NOW + 10 * 60 * 1000)).toBe(true);
  });
});

describe('progress', () => {
  const timer = startRest('row1', 100, NOW);

  it('runs from 0 to 1', () => {
    expect(progress(timer, NOW)).toBe(0);
    expect(progress(timer, NOW + 50_000)).toBeCloseTo(0.5, 5);
    expect(progress(timer, NOW + 100_000)).toBe(1);
  });

  it('stays at 1 past the end', () => {
    expect(progress(timer, NOW + 900_000)).toBe(1);
  });

  it('treats a zero-length rest as already complete, not as 0/0', () => {
    expect(progress(startRest('row1', 0, NOW), NOW)).toBe(1);
  });
});

describe('toRemainingMap', () => {
  it('is empty when nothing is resting', () => {
    expect(toRemainingMap(null, NOW)).toEqual({});
  });

  it('maps the resting row to its seconds left', () => {
    expect(toRemainingMap(startRest('row7', 60, NOW), NOW + 20_000)).toEqual({ row7: 40 });
  });

  it('only ever holds the one running timer', () => {
    expect(Object.keys(toRemainingMap(startRest('row7', 60, NOW), NOW))).toEqual(['row7']);
  });
});
