import { iconForFocus, DEFAULT_DAY_ICON } from '../icons';

describe('iconForFocus', () => {
  it('maps the focuses of a real sheet', () => {
    expect(iconForFocus('Espalda')).toBe('weight-lifter');
    expect(iconForFocus('Pierna')).toBe('run');
    expect(iconForFocus('Pecho')).toBe('human-handsup');
    expect(iconForFocus('Brazo')).toBe('arm-flex');
    expect(iconForFocus('Movilidad y abdomen')).toBe('yoga');
  });

  it('ignores case and matches inside a longer phrase', () => {
    expect(iconForFocus('ESPALDA y bíceps')).toBe('weight-lifter');
    expect(iconForFocus('día de pierna pesada')).toBe('run');
  });

  it('matches with or without accents', () => {
    expect(iconForFocus('Glúteo')).toBe('run');
    expect(iconForFocus('Gluteo')).toBe('run');
  });

  it('falls back for an unknown or empty focus', () => {
    expect(iconForFocus('')).toBe(DEFAULT_DAY_ICON);
    expect(iconForFocus('   ')).toBe(DEFAULT_DAY_ICON);
    expect(iconForFocus('Algo raro')).toBe(DEFAULT_DAY_ICON);
  });

  it('prefers the more specific focus when two keywords fit', () => {
    // "Movilidad y abdomen" contains both; movilidad is the day's real theme.
    expect(iconForFocus('Movilidad y abdomen')).toBe('yoga');
  });
});

describe('compound focuses', () => {
  it('names a compound day after its first muscle, as coaches write it', () => {
    expect(iconForFocus('Espalda y bíceps')).toBe('weight-lifter');
    expect(iconForFocus('Bíceps y espalda')).toBe('arm-flex');
    expect(iconForFocus('Pecho y tríceps')).toBe('human-handsup');
  });

  it('prefers the longer keyword when two start at the same place', () => {
    expect(iconForFocus('full body')).toBe('kettlebell');
  });
});

// Partir por patron de movimiento es tan comun como partir por musculo, y la
// rutina que motivo el importador lo hace asi.
describe('dias de empuje y tiron', () => {
  it('reconoce el empuje', () => {
    expect(iconForFocus('Empuje (pecho/hombro/tríceps)')).toBe('human-handsup');
    expect(iconForFocus('Push day')).toBe('human-handsup');
  });

  it('reconoce el tiron, con acento o sin el', () => {
    expect(iconForFocus('Tirón + Bíceps + Espalda')).toBe('weight-lifter');
    expect(iconForFocus('Tiron')).toBe('weight-lifter');
  });
});
