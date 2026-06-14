import { isAvailableWithEquipment } from '@/lib/skills/equipment';

describe('isAvailableWithEquipment', () => {
  it('is always available when no equipment is required', () => {
    expect(isAvailableWithEquipment(null, [])).toBe(true);
    expect(isAvailableWithEquipment('none', [])).toBe(true);
    expect(isAvailableWithEquipment('', [])).toBe(true);
  });

  it('requires the equipment to be owned', () => {
    expect(isAvailableWithEquipment('pull_up_bar', [])).toBe(false);
    expect(isAvailableWithEquipment('pull_up_bar', ['bands'])).toBe(false);
    expect(isAvailableWithEquipment('pull_up_bar', ['pull_up_bar'])).toBe(true);
  });
});
