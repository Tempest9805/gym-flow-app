/**
 * Unir un nombre escrito a mano con un ejercicio de la biblioteca.
 *
 * Al pegar una rutina, cada linea es texto suelto: "Push ups clasicas",
 * "Goblet squat KB15", "Hip thrust". Si se consigue atar esa linea a la
 * biblioteca, la fila hereda gratis la ilustracion, el video y la escalera de
 * progresion. Si no se consigue, no pasa nada: la fila guarda su nombre tal
 * cual y el boton de video cae en la busqueda de YouTube.
 *
 * La regla es **preferir no emparejar antes que emparejar mal**. Una foto
 * equivocada es peor que ninguna: quien la mira aprende el movimiento que no
 * es. Por eso solo hay dos caminos, y los dos son estrictos:
 *
 *   1. El nombre plegado coincide entero con el espanol o el ingles.
 *   2. Todas las palabras significativas de uno estan en el otro.
 *
 * Nada de distancias de edicion ni de parecidos: eso acierta mucho y falla
 * feo, y aqui fallar feo cuesta mas de lo que ahorra acertar.
 */
import type { Exercise } from './types';

/**
 * Palabras que no distinguen un ejercicio de otro y solo estorban al comparar.
 * "a una mano" o "con mancuerna" son matices del parte, no otro movimiento.
 */
const VACIAS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'e',
  'el',
  'en',
  'la',
  'las',
  'lo',
  'los',
  'o',
  'para',
  'por',
  'sin',
  'su',
  'un',
  'una',
  'uno',
  'y',
  'the',
  'to',
  'with',
]);

/**
 * Deja un nombre en minusculas, sin acentos y sin puntuacion.
 *
 * Tambien se comen los pesos que el parte lleva pegados al nombre —"KB15",
 * "KB 10"— porque son carga, no ejercicio distinto.
 */
export function foldName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\bkb\s*\d+\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Quita el plural de una palabra ya plegada.
 *
 * No es un lematizador ni pretende serlo: se aplica igual a los dos lados de
 * la comparacion, asi que pasarse de corto no junta ejercicios distintos, solo
 * junta el singular con su plural. Es lo que hace que "Push ups clasicas"
 * encuentre a "Push-Up", que era el fallo mas repetido al pegar una rutina.
 */
function singular(palabra: string): string {
  if (palabra.length >= 5 && palabra.endsWith('es')) return palabra.slice(0, -2);
  if (palabra.length >= 3 && palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

/** Las palabras que de verdad distinguen: plegadas, sin vacias y en singular. */
function significantes(name: string): string[] {
  return foldName(name)
    .split(' ')
    .filter((palabra) => palabra !== '' && !VACIAS.has(palabra))
    .map(singular);
}

/** Las mismas palabras, en cualquier orden. */
function mismoJuego(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  const restantes = [...b];
  for (const palabra of a) {
    const i = restantes.indexOf(palabra);
    if (i === -1) return false;
    restantes.splice(i, 1);
  }
  return true;
}

/** `true` si todas las palabras de `pocas` estan en `muchas`. */
function contenido(pocas: string[], muchas: readonly string[]): boolean {
  return pocas.every((palabra) => muchas.includes(palabra));
}

/**
 * Cuantas palabras separan a dos nombres: las que le sobran a uno mas las que
 * le sobran al otro. Cero es el mismo juego de palabras.
 */
function distancia(a: readonly string[], b: readonly string[]): number {
  const sobranA = a.filter((palabra) => !b.includes(palabra)).length;
  const sobranB = b.filter((palabra) => !a.includes(palabra)).length;
  return sobranA + sobranB;
}

/**
 * El ejercicio de la biblioteca que corresponde a este nombre, o null.
 *
 * Recorre la biblioteca dos veces a proposito: primero busca la coincidencia
 * exacta en toda ella, y solo si no hay ninguna prueba con las parciales. Asi
 * "Remo" nunca se lleva por delante a "Remo invertido" por estar antes.
 *
 * Entre varias parciales gana la mas parecida, no la primera: "Plancha con
 * toque de hombro" contiene a "Plancha", pero el ejercicio es el otro. Si
 * dos empatan no hay forma de elegir sin inventar, y entonces se devuelve null.
 */
export function findExercise(
  name: string,
  library: readonly Exercise[],
): Exercise | null {
  const palabras = significantes(name);
  if (palabras.length === 0) return null;

  for (const exercise of library) {
    if (mismoJuego(palabras, significantes(exercise.nameEs))) return exercise;
    if (exercise.nameEn !== null && mismoJuego(palabras, significantes(exercise.nameEn))) {
      return exercise;
    }
  }

  // Con una sola palabra el parcial deja de discriminar: "press" entraria en
  // media biblioteca. Se exige contexto.
  if (palabras.length < 2) return null;

  let mejor: Exercise | null = null;
  let mejorDistancia = Infinity;
  let empatada = false;

  for (const exercise of library) {
    const nombres = [exercise.nameEs, exercise.nameEn].filter(
      (n): n is string => n !== null && n !== '',
    );

    let suya = Infinity;
    for (const nombre of nombres) {
      const suyas = significantes(nombre);
      if (suyas.length === 0) continue;
      if (!contenido(suyas, palabras) && !contenido(palabras, suyas)) continue;
      suya = Math.min(suya, distancia(suyas, palabras));
    }

    if (suya === Infinity) continue;

    if (suya < mejorDistancia) {
      mejor = exercise;
      mejorDistancia = suya;
      empatada = false;
    } else if (suya === mejorDistancia) {
      empatada = true;
    }
  }

  return empatada ? null : mejor;
}
