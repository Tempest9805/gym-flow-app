/**
 * Picking a day's icon from its focus.
 *
 * All names are MaterialCommunityIcons glyphs, which ship with
 * @expo/vector-icons — no extra dependency, no SVG assets to maintain.
 */

/**
 * Keywords are stored without accents and matched against a folded focus,
 * so "Glúteo" and "Gluteo" behave the same and each concept is listed once.
 */
const BY_KEYWORD: [string, string][] = [
  ['movilidad', 'yoga'],
  ['estiramiento', 'yoga'],
  ['abdomen', 'ab-testing'],
  ['core', 'ab-testing'],
  ['espalda', 'weight-lifter'],
  ['dorsal', 'weight-lifter'],
  ['pecho', 'human-handsup'],
  ['pectoral', 'human-handsup'],
  ['hombro', 'human-handsup'],
  ['brazo', 'arm-flex'],
  ['biceps', 'arm-flex'],
  ['triceps', 'arm-flex'],
  ['pierna', 'run'],
  ['gluteo', 'run'],
  ['cuadriceps', 'run'],
  ['femoral', 'run'],
  ['cardio', 'heart-pulse'],
  ['full body', 'kettlebell'],
  ['cuerpo completo', 'kettlebell'],
];

/** Fallback for a focus we do not recognise. */
export const DEFAULT_DAY_ICON = 'dumbbell';

function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/**
 * A sensible glyph for a training focus like "Espalda" or "Movilidad y abdomen".
 *
 * Coaches name a compound day after its primary muscle first ("Espalda y
 * bíceps" is a back day), so the keyword appearing earliest in the text wins
 * rather than whichever happens to sit first in the table above. Ties go to
 * the longer keyword, which is the more specific one.
 */
export function iconForFocus(focus: string): string {
  const needle = fold(focus);
  if (needle === '') return DEFAULT_DAY_ICON;

  let bestIcon = DEFAULT_DAY_ICON;
  let bestPosition = Number.POSITIVE_INFINITY;
  let bestLength = 0;

  for (const [keyword, icon] of BY_KEYWORD) {
    const position = needle.indexOf(keyword);
    if (position === -1) continue;

    if (position < bestPosition || (position === bestPosition && keyword.length > bestLength)) {
      bestIcon = icon;
      bestPosition = position;
      bestLength = keyword.length;
    }
  }

  return bestIcon;
}
