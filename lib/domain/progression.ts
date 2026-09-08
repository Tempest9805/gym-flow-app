/**
 * Escaleras de dificultad entre ejercicios.
 *
 * La progresion vive en la BIBLIOTECA, no en la rutina: es dato de referencia
 * ("cuando las flexiones dejen de costar, pasa a las de arquero"), no algo que
 * cambie de un dia para otro. Por eso no aparece en la tabla de Hoy, que es
 * para ejecutar, sino en el detalle del ejercicio, que es para consultar.
 *
 * Solo hay progresion cuando cambia el MOVIMIENTO. Anadir peso o repeticiones
 * es progresar tambien, pero no es otro ejercicio y no se modela aqui.
 */
import type { Exercise } from './types';

/** Cuantos saltos se siguen antes de rendirse, por si los datos tienen un ciclo. */
const MAX_PASOS = 12;

/**
 * El ejercicio al que pasar cuando este deje de costar, o null.
 *
 * Devuelve null tambien cuando el slug apunta a algo que ya no esta en la
 * biblioteca: un dato viejo no debe romper la pantalla.
 */
export function nextLevel(
  exercise: Exercise | null | undefined,
  library: readonly Exercise[],
): Exercise | null {
  if (!exercise?.progressesTo) return null;
  return library.find((e) => e.id === exercise.progressesTo) ?? null;
}

/**
 * La escalera completa desde este ejercicio hacia arriba, el incluido.
 *
 * Se corta si los datos se muerden la cola, para que un ciclo no cuelgue a
 * quien la esta pintando.
 */
export function progressionPath(
  exercise: Exercise | null | undefined,
  library: readonly Exercise[],
): Exercise[] {
  if (!exercise) return [];

  const camino: Exercise[] = [exercise];
  const vistos = new Set([exercise.id]);

  let actual = exercise;
  for (let paso = 0; paso < MAX_PASOS; paso += 1) {
    const siguiente = nextLevel(actual, library);
    if (!siguiente || vistos.has(siguiente.id)) break;
    camino.push(siguiente);
    vistos.add(siguiente.id);
    actual = siguiente;
  }

  return camino;
}
