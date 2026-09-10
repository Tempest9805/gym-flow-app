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
import type { Exercise, Routine } from '@/lib/domain/types';
import {
  parseExercises,
  parseRoutines,
  serializeExercises,
  serializeRoutines,
} from './serialize';

export const ROUTINES_KEY = 'gymflow_routines';
export const EXERCISES_KEY = 'gymflow_exercises';
export const LIBRARY_VERSION_KEY = 'gymflow_library_version';
export const WELCOME_KEY = 'gymflow_welcome_seen';

/**
 * Version de la biblioteca empaquetada. **Subir al tocar `lib/data/`.**
 *
 * La biblioteca es dato de referencia: nadie la edita desde la app, solo se
 * consulta. Si se congelara en la primera instalacion, todo lo que se le anada
 * despues —videos, progresiones, traducciones— solo lo verian las instalaciones
 * nuevas. Las RUTINAS son lo contrario: son del usuario y no se tocan nunca.
 *
 * 1 → semilla original
 * 2 → escaleras de progresion (`progressesTo`)
 * 3 → descripciones, consejos y errores comunes en espanol
 */
export const LIBRARY_VERSION = 3;

/** The bundled library, validated through the same parser as stored data. */
function seedExercises(): Exercise[] {
  return parseExercises(JSON.stringify(exerciseSeed)) ?? [];
}

/** Que version de la biblioteca hay guardada. 0 si no hay o es ilegible. */
async function storedLibraryVersion(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LIBRARY_VERSION_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Carga la biblioteca, sembrandola en el primer arranque y **refrescandola
 * cuando la version empaquetada es mas nueva**.
 *
 * Refrescar es seguro porque nadie edita la biblioteca desde la app; lo que el
 * usuario sí edita son las rutinas, y esas no se tocan aqui. Un payload
 * corrupto se trata como primer arranque: mejor resembrar que dejar a alguien
 * sin biblioteca.
 */
export async function loadExercises(): Promise<Exercise[]> {
  try {
    const stored = parseExercises(await AsyncStorage.getItem(EXERCISES_KEY));
    if (stored !== null && (await storedLibraryVersion()) >= LIBRARY_VERSION) {
      return stored;
    }
  } catch {
    // Sigue hacia la siembra.
  }

  const seed = seedExercises();
  await saveExercises(seed);
  return seed;
}

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  await AsyncStorage.multiSet([
    [EXERCISES_KEY, serializeExercises(exercises)],
    [LIBRARY_VERSION_KEY, String(LIBRARY_VERSION)],
  ]);
}

/**
 * Todas las rutinas guardadas. **Sin rutina de arranque.**
 *
 * Antes se sembraba la de Pablo, que es de gimnasio: quien entrena en casa
 * aterrizaba en la rutina de otro y lo primero que tenia que hacer era
 * borrarla. Ahora se arranca vacio y la bienvenida ofrece elegir plantilla,
 * que es donde esta la decision de verdad —casa o gimnasio, y con que.
 *
 * Devolver `[]` no escribe nada: sin la clave, la bienvenida sigue saliendo.
 */
export async function loadRoutines(): Promise<Routine[]> {
  try {
    const stored = parseRoutines(await AsyncStorage.getItem(ROUTINES_KEY));
    if (stored !== null) return stored;
  } catch {
    // Ilegible: se trata como si no hubiera nada.
  }

  return [];
}

export async function saveRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, serializeRoutines(routines));
}

/**
 * Si ya se ha visto la bienvenida.
 *
 * Es un booleano y no una fecha ni un contador a proposito: lo unico que hay
 * que saber es si esta persona ya ha pasado por ahi. Un fallo de lectura
 * responde `true`, porque colar una bienvenida a quien ya la vio molesta mas
 * que saltarsela a quien no.
 */
export async function hasSeenWelcome(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(WELCOME_KEY)) !== null;
  } catch {
    return true;
  }
}

/** Marca la bienvenida como vista. No vuelve a salir. */
export async function markWelcomeSeen(): Promise<void> {
  await AsyncStorage.setItem(WELCOME_KEY, '1');
}

/** Wipe stored data so the next load re-seeds. Used by the reset in Ajustes. */
export async function resetToSeed(): Promise<void> {
  await AsyncStorage.multiRemove([ROUTINES_KEY, EXERCISES_KEY, LIBRARY_VERSION_KEY, WELCOME_KEY]);
}
