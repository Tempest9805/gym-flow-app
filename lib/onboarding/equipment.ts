import type { TranslationKey } from '@/lib/hooks/useTranslation';

export interface EquipmentOption {
  key: string;
  labelKey: TranslationKey;
  icon: string;
}

/**
 * Focused calisthenics/home gear shown in onboarding.
 * 'none' (bodyweight) is the implicit baseline — NOT listed here.
 * Keys match the `equipment` tags used by skill-tree/challenge content.
 */
export const EQUIPMENT_OPTIONS: readonly EquipmentOption[] = [
  { key: 'pull_up_bar', labelKey: 'equipment.pull_up_bar', icon: '🏋️' },
  { key: 'bands',       labelKey: 'equipment.bands',       icon: '➰' },
  { key: 'parallettes', labelKey: 'equipment.parallettes', icon: '🤸' },
  { key: 'rings',       labelKey: 'equipment.rings',       icon: '⭕' },
  { key: 'dumbbells',   labelKey: 'equipment.dumbbells',   icon: '💪' },
];

const ORDER: readonly string[] = EQUIPMENT_OPTIONS.map((o) => o.key);

/**
 * Normalize a raw selection into what we persist in profiles.available_equipment.
 * - empty (or only unknown/'none') → ['none']  (captured, bodyweight only)
 * - otherwise → selected gear keys, deduped, 'none'/unknown stripped, in EQUIPMENT_OPTIONS order.
 */
export function normalizeEquipmentSelection(selected: string[]): string[] {
  const gear = ORDER.filter((k) => selected.includes(k));
  return gear.length > 0 ? gear : ['none'];
}

/** A profile has captured equipment once the array is non-empty. */
export function isEquipmentCaptured(equipment: string[] | null | undefined): boolean {
  return (equipment?.length ?? 0) > 0;
}
