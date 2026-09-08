import {
  parseRoutines,
  parseExercises,
  serializeRoutines,
  serializeExercises,
} from '../serialize';
import type { Exercise, Routine } from '@/lib/domain/types';

const routine: Routine = {
  id: 'r1',
  name: 'Rutina Pablo',
  athleteName: 'Pablo',
  goal: 'brazos',
  coachName: 'Coaching Nach',
  updatedAt: '2026-09-01T00:00:00.000Z',
  days: [
    {
      id: 'd1',
      label: 'Día 1',
      focus: 'Espalda',
      icon: 'weight-lifter',
      lastResetOn: null,
      rows: [
        {
          id: 'row1',
          exerciseId: 'pull-up',
          name: 'Dominadas',
          sets: 3,
          reps: '6-8',
          restSeconds: 180,
          mode: 'reps',
          done: false,
        },
      ],
    },
  ],
};

const exercise: Exercise = {
  id: 'pull-up',
  nameEs: 'Dominada',
  nameEn: 'Pull-Up',
  muscleGroup: 'lats',
  progressesTo: null,
  videoUrl: null,
  description: 'Tracción vertical.',
  tips: 'Escápulas abajo.',
  commonMistakes: 'Balancearse.',
};

describe('routines round-trip', () => {
  it('survives serialize then parse unchanged', () => {
    expect(parseRoutines(serializeRoutines([routine]))).toEqual([routine]);
  });

  it('handles an empty list', () => {
    expect(parseRoutines(serializeRoutines([]))).toEqual([]);
  });
});

describe('parseRoutines rejects unusable payloads', () => {
  it('rejects nothing stored yet', () => {
    expect(parseRoutines(null)).toBeNull();
    expect(parseRoutines('')).toBeNull();
    expect(parseRoutines('   ')).toBeNull();
  });

  it('rejects a truncated write', () => {
    expect(parseRoutines('[{"id":"r1","name":')).toBeNull();
  });

  it('rejects a payload that is not a list', () => {
    expect(parseRoutines('{"id":"r1"}')).toBeNull();
    expect(parseRoutines('"hello"')).toBeNull();
  });

  it('rejects a routine missing its id or name', () => {
    expect(parseRoutines('[{"name":"X","days":[]}]')).toBeNull();
    expect(parseRoutines('[{"id":"r1","days":[]}]')).toBeNull();
  });

  it('rejects the whole payload when one row is malformed', () => {
    const broken = JSON.parse(serializeRoutines([routine]));
    broken[0].days[0].rows[0].sets = 'three';
    expect(parseRoutines(JSON.stringify(broken))).toBeNull();
  });
});

describe('parseRoutines repairs what it safely can', () => {
  it('defaults a missing focus and icon rather than discarding the day', () => {
    const raw = JSON.parse(serializeRoutines([routine]));
    delete raw[0].days[0].focus;
    delete raw[0].days[0].icon;
    const parsed = parseRoutines(JSON.stringify(raw));
    expect(parsed?.[0].days[0].focus).toBe('');
    expect(parsed?.[0].days[0].icon).toBe('dumbbell');
  });

  it('treats an unknown mode as plain reps', () => {
    const raw = JSON.parse(serializeRoutines([routine]));
    raw[0].days[0].rows[0].mode = 'nonsense';
    expect(parseRoutines(JSON.stringify(raw))?.[0].days[0].rows[0].mode).toBe('reps');
  });

  it('coerces a fractional or zero set count into a usable one', () => {
    const raw = JSON.parse(serializeRoutines([routine]));
    raw[0].days[0].rows[0].sets = 0;
    expect(parseRoutines(JSON.stringify(raw))?.[0].days[0].rows[0].sets).toBe(1);
  });

  it('treats a missing done flag as not done', () => {
    const raw = JSON.parse(serializeRoutines([routine]));
    delete raw[0].days[0].rows[0].done;
    expect(parseRoutines(JSON.stringify(raw))?.[0].days[0].rows[0].done).toBe(false);
  });

  it('normalises absent optional routine fields to null', () => {
    const parsed = parseRoutines('[{"id":"r1","name":"X","days":[]}]');
    expect(parsed?.[0]).toMatchObject({ athleteName: null, goal: null, coachName: null });
  });
});

describe('exercises round-trip', () => {
  it('survives serialize then parse unchanged', () => {
    expect(parseExercises(serializeExercises([exercise]))).toEqual([exercise]);
  });

  it('rejects an entry with no id or Spanish name', () => {
    expect(parseExercises('[{"nameEs":"Dominada"}]')).toBeNull();
    expect(parseExercises('[{"id":"pull-up"}]')).toBeNull();
  });

  it('defaults a missing muscle group', () => {
    expect(parseExercises('[{"id":"x","nameEs":"X"}]')?.[0].muscleGroup).toBe('general');
  });

  it('rejects a corrupt payload', () => {
    expect(parseExercises('not json')).toBeNull();
    expect(parseExercises(null)).toBeNull();
  });
});
