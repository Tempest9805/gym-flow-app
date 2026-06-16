import { isHomeFriendly, GYM_EQUIPMENT } from '@/lib/utils/equipmentFocus';

describe('isHomeFriendly', () => {
  it('hides gym equipment', () => {
    for (const eq of [
      'machine', 'barbell', 'cable', 'smith machine', 'sled',
      'landmine', 'treadmill', 'bike', 'rowing machine', 'treadmill/outdoor',
    ]) {
      expect(isHomeFriendly(eq)).toBe(false);
    }
  });

  it('keeps home/calisthenics equipment', () => {
    for (const eq of [
      'bodyweight', 'dumbbells', 'dumbbell', 'kettlebell', 'jump rope',
      'box', 'ab wheel', 'medicine ball', 'battle ropes', 'bands', 'pull_up_bar',
    ]) {
      expect(isHomeFriendly(eq)).toBe(true);
    }
  });

  it('treats null/undefined/unknown as visible (default-show)', () => {
    expect(isHomeFriendly(null)).toBe(true);
    expect(isHomeFriendly(undefined)).toBe(true);
    expect(isHomeFriendly('some-new-thing')).toBe(true);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(isHomeFriendly('  BARBELL ')).toBe(false);
    expect(isHomeFriendly('Machine')).toBe(false);
  });

  it('exposes the gym set for reuse', () => {
    expect(GYM_EQUIPMENT.has('barbell')).toBe(true);
    expect(GYM_EQUIPMENT.has('bodyweight')).toBe(false);
  });
});
