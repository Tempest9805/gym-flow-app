import type { AvatarVariant } from './avatarVariant';

const FRAMES: Record<AvatarVariant, number[]> = {
  hombre: [
    require('@/assets/avatares/frames/hombre_1.webp'),
    require('@/assets/avatares/frames/hombre_2.webp'),
    require('@/assets/avatares/frames/hombre_3.webp'),
    require('@/assets/avatares/frames/hombre_4.webp'),
    require('@/assets/avatares/frames/hombre_5.webp'),
    require('@/assets/avatares/frames/hombre_6.webp'),
  ],
  mujer: [
    require('@/assets/avatares/frames/mujer_1.webp'),
    require('@/assets/avatares/frames/mujer_2.webp'),
    require('@/assets/avatares/frames/mujer_3.webp'),
    require('@/assets/avatares/frames/mujer_4.webp'),
    require('@/assets/avatares/frames/mujer_5.webp'),
    require('@/assets/avatares/frames/mujer_6.webp'),
  ],
};

/** Image source for a stage (1..6); clamps out-of-range. */
export function avatarFrame(variant: AvatarVariant, stage: number): number {
  const arr = FRAMES[variant] ?? FRAMES.hombre;
  const i = Math.min(Math.max(Math.trunc(stage), 1), arr.length) - 1;
  return arr[i];
}
