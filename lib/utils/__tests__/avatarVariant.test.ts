import { resolveAvatarVariant } from '@/lib/utils/avatarVariant';

describe('resolveAvatarVariant', () => {
  it('defaults to hombre', () => {
    expect(resolveAvatarVariant(null)).toBe('hombre');
    expect(resolveAvatarVariant(undefined)).toBe('hombre');
    expect(resolveAvatarVariant('nope')).toBe('hombre');
  });
  it('resolves mujer', () => {
    expect(resolveAvatarVariant('mujer')).toBe('mujer');
  });
});
