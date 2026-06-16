import {
  EQUIPMENT_OPTIONS,
  normalizeEquipmentSelection,
  isEquipmentCaptured,
} from '@/lib/onboarding/equipment';

describe('EQUIPMENT_OPTIONS', () => {
  it('lists the 5 focused gear keys in order', () => {
    expect(EQUIPMENT_OPTIONS.map((o) => o.key)).toEqual([
      'pull_up_bar', 'bands', 'parallettes', 'rings', 'dumbbells',
    ]);
  });
});

describe('normalizeEquipmentSelection', () => {
  it('returns ["none"] for an empty selection', () => {
    expect(normalizeEquipmentSelection([])).toEqual(['none']);
  });
  it('strips "none" when real gear is present', () => {
    expect(normalizeEquipmentSelection(['none', 'pull_up_bar'])).toEqual(['pull_up_bar']);
  });
  it('returns ["none"] when only "none" is given', () => {
    expect(normalizeEquipmentSelection(['none'])).toEqual(['none']);
  });
  it('dedupes and orders by EQUIPMENT_OPTIONS', () => {
    expect(normalizeEquipmentSelection(['rings', 'pull_up_bar', 'rings'])).toEqual(['pull_up_bar', 'rings']);
  });
  it('ignores unknown keys', () => {
    expect(normalizeEquipmentSelection(['pull_up_bar', 'spaceship'])).toEqual(['pull_up_bar']);
  });
});

describe('isEquipmentCaptured', () => {
  it('is false for empty/null/undefined', () => {
    expect(isEquipmentCaptured([])).toBe(false);
    expect(isEquipmentCaptured(null)).toBe(false);
    expect(isEquipmentCaptured(undefined)).toBe(false);
  });
  it('is true for any non-empty array (including ["none"])', () => {
    expect(isEquipmentCaptured(['none'])).toBe(true);
    expect(isEquipmentCaptured(['pull_up_bar'])).toBe(true);
  });
});
