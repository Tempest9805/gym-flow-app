export type AvatarVariant = 'hombre' | 'mujer';

/** Normalize a persisted avatar variant; defaults to 'hombre'. */
export function resolveAvatarVariant(raw: string | null | undefined): AvatarVariant {
  return raw === 'mujer' ? 'mujer' : 'hombre';
}
