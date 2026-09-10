import { parseReps, formatReps, isTimeBased } from '../reps';

describe('parseReps', () => {
  it('reads a plain number as fixed reps', () => {
    expect(parseReps('12')).toEqual({ kind: 'fixed', value: 12 });
  });

  it('reads a range', () => {
    expect(parseReps('6-8')).toEqual({ kind: 'range', min: 6, max: 8 });
    expect(parseReps('15-20')).toEqual({ kind: 'range', min: 15, max: 20 });
  });

  it('tolerates spaces and en-dashes around a range', () => {
    expect(parseReps(' 10 – 12 ')).toEqual({ kind: 'range', min: 10, max: 12 });
  });

  it('reads "fallo" and "failure" as to-failure', () => {
    expect(parseReps('fallo')).toEqual({ kind: 'failure' });
    expect(parseReps('Fallo')).toEqual({ kind: 'failure' });
    expect(parseReps('failure')).toEqual({ kind: 'failure' });
  });

  it('reads a duration', () => {
    expect(parseReps('1 min')).toEqual({ kind: 'time', seconds: 60 });
    expect(parseReps('90s')).toEqual({ kind: 'time', seconds: 90 });
    expect(parseReps('2 minutos')).toEqual({ kind: 'time', seconds: 120 });
  });

  it('keeps anything else as raw text', () => {
    expect(parseReps('al fallo tecnico')).toEqual({ kind: 'raw', text: 'al fallo tecnico' });
  });

  it('treats empty input as raw empty', () => {
    expect(parseReps('')).toEqual({ kind: 'raw', text: '' });
    expect(parseReps('   ')).toEqual({ kind: 'raw', text: '' });
  });

  it('does not read a reversed range as a range', () => {
    expect(parseReps('12-8')).toEqual({ kind: 'raw', text: '12-8' });
  });
});

describe('formatReps', () => {
  it('round-trips every well-formed spec', () => {
    expect(formatReps({ kind: 'fixed', value: 12 })).toBe('12');
    expect(formatReps({ kind: 'range', min: 6, max: 8 })).toBe('6-8');
    expect(formatReps({ kind: 'failure' })).toBe('fallo');
    expect(formatReps({ kind: 'time', seconds: 60 })).toBe('1 min');
    expect(formatReps({ kind: 'time', seconds: 90 })).toBe('90s');
    expect(formatReps({ kind: 'raw', text: 'lo que sea' })).toBe('lo que sea');
  });
});

describe('isTimeBased', () => {
  it('is true only for durations', () => {
    expect(isTimeBased('1 min')).toBe(true);
    expect(isTimeBased('45s')).toBe(true);
    expect(isTimeBased('12')).toBe(false);
    expect(isTimeBased('fallo')).toBe(false);
  });
});
