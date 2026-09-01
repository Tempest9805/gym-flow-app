import { formatDuration, parseDuration } from '../time';

describe('formatDuration', () => {
  it('formats as m:ss like the coaching sheet', () => {
    expect(formatDuration(120)).toBe('2:00');
    expect(formatDuration(180)).toBe('3:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('clamps negatives to zero so a finished countdown never shows -0:01', () => {
    expect(formatDuration(-5)).toBe('0:00');
  });

  it('keeps counting past an hour in minutes', () => {
    expect(formatDuration(3660)).toBe('61:00');
  });
});

describe('parseDuration', () => {
  it('reads m:ss', () => {
    expect(parseDuration('2:00')).toBe(120);
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('0:45')).toBe(45);
  });

  it('reads a bare number as seconds', () => {
    expect(parseDuration('90')).toBe(90);
  });

  it('returns null for nonsense', () => {
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('1:99')).toBeNull();
  });
});
