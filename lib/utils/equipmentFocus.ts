/**
 * Equipment focus for the calisthenics/home library.
 *
 * Rule is by EXCLUSION: anything in GYM_EQUIPMENT is hidden from the library;
 * everything else (bodyweight, free weights, small home gear, and any unknown/
 * new value) is shown. This is intentionally lenient so new catalog equipment
 * defaults to visible rather than silently disappearing.
 *
 * The upcoming equipment-aware onboarding will refine visibility further using
 * `profiles.available_equipment` (e.g. hiding pull_up_bar items without a bar).
 */

/** Gym-only equipment that is hidden from the calisthenics/home library. */
export const GYM_EQUIPMENT: ReadonlySet<string> = new Set([
  'machine',
  'barbell',
  'cable',
  'smith machine',
  'sled',
  'landmine',
  'treadmill',
  'bike',
  'rowing machine',
  'treadmill/outdoor',
]);

/** true if the equipment is doable at home (bodyweight + minimal gear). */
export function isHomeFriendly(equipment: string | null | undefined): boolean {
  if (!equipment) return true; // null/unknown → visible
  return !GYM_EQUIPMENT.has(equipment.trim().toLowerCase());
}
