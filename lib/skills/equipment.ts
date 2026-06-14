const NO_EQUIPMENT = new Set(['', 'none']);

export function isAvailableWithEquipment(
  required: string | null,
  available: string[],
): boolean {
  if (required === null || NO_EQUIPMENT.has(required)) return true;
  return available.includes(required);
}
