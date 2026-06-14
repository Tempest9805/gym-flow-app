import { avatarStageFromLevel, DEFAULT_AVATAR_THRESHOLDS } from '@/lib/skills/avatar';

describe('avatarStageFromLevel', () => {
  it('exposes 6 default thresholds', () => {
    expect(DEFAULT_AVATAR_THRESHOLDS).toHaveLength(6);
  });

  it('maps mastered counts to stages 1..6', () => {
    expect(avatarStageFromLevel(0)).toBe(1);
    expect(avatarStageFromLevel(2)).toBe(1);
    expect(avatarStageFromLevel(3)).toBe(2);
    expect(avatarStageFromLevel(7)).toBe(2);
    expect(avatarStageFromLevel(8)).toBe(3);
    expect(avatarStageFromLevel(40)).toBe(6);
    expect(avatarStageFromLevel(1000)).toBe(6);
  });

  it('accepts custom thresholds', () => {
    expect(avatarStageFromLevel(5, [0, 5, 10, 15, 20, 25])).toBe(2);
  });
});
