/**
 * The app's only persistence: AsyncStorage on the device.
 *
 * No account, no network, no sync. On first run the bundled seeds are copied
 * into storage; from then on storage is authoritative and the seeds are
 * ignored, so edits are never overwritten by an app update.
 *
 * All parsing lives in ./serialize; this module is the I/O shell.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import exerciseSeed from '@/lib/data/exercises.seed.json';
import routineSeed from '@/lib/data/routine-pablo.seed.json';
import type { Exercise, Routine } from '@/lib/domain/types';
import {
  parseExercises,
  parseRoutines,
  serializeExercises,
  serializeRoutines,
} from './serialize';

export const ROUTINES_KEY = 'gymflow_routines';
export const EXERCISES_KEY = 'gymflow_exercises';

/** The bundled library, validated through the same parser as stored data. */
function seedExercises(): Exercise[] {
  return parseExercises(JSON.stringify(exerciseSeed)) ?? [];
}

/** The bundled starter routine, validated the same way. */
function seedRoutines(): Routine[] {
  return parseRoutines(JSON.stringify([routineSeed])) ?? [];
}

/**
 * Load the exercise library, seeding it on first run.
 *
 * A corrupt or unreadable payload is treated as a first run: the seed is
 * restored rather than leaving the user with an empty library.
 */
export async function loadExercises(): Promise<Exercise[]> {
  try {
    const stored = parseExercises(await AsyncStorage.getItem(EXERCISES_KEY));
    if (stored !== null) return stored;
  } catch {
    // Fall through to seeding.
  }

  const seed = seedExercises();
  await saveExercises(seed);
  return seed;
}

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  await AsyncStorage.setItem(EXERCISES_KEY, serializeExercises(exercises));
}

/** Load every routine, seeding the starter routine on first run. */
export async function loadRoutines(): Promise<Routine[]> {
  try {
    const stored = parseRoutines(await AsyncStorage.getItem(ROUTINES_KEY));
    if (stored !== null) return stored;
  } catch {
    // Fall through to seeding.
  }

  const seed = seedRoutines();
  await saveRoutines(seed);
  return seed;
}

export async function saveRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, serializeRoutines(routines));
}

/** Wipe stored data so the next load re-seeds. Used by the reset in Ajustes. */
export async function resetToSeed(): Promise<void> {
  await AsyncStorage.multiRemove([ROUTINES_KEY, EXERCISES_KEY]);
}
