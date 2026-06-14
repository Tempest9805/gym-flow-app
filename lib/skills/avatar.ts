export const DEFAULT_AVATAR_THRESHOLDS = [0, 3, 8, 15, 25, 40];

export function avatarStageFromLevel(
  masteredCount: number,
  thresholds: number[] = DEFAULT_AVATAR_THRESHOLDS,
): number {
  let stage = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (masteredCount >= thresholds[i]) stage = i + 1;
  }
  return Math.min(stage, thresholds.length);
}
