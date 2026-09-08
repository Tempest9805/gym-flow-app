/**
 * Importar una rutina pegando el texto.
 *
 * La gente ya tiene su rutina escrita en algun sitio — WhatsApp, notas, un PDF
 * del coach — y volver a teclearla es exactamente la friccion que hace que
 * nadie llegue a usar la app. Pegar y listo.
 *
 * Sin IA y sin red: es parsing puro, aqui en el dominio y con tests. La regla
 * que lo gobierna es **no perder nunca una linea**: lo que no se sabe leer se
 * guarda como fila con su texto literal, que el usuario corrige de un toque.
 * Es preferible una fila a medias que una linea desaparecida en silencio.
 */

/** Descanso por defecto cuando el texto pegado no lo dice, que es casi siempre. */
export const DEFAULT_REST_SECONDS = 120;

export interface ParsedRow {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  mode: 'reps' | 'tabata';
}

export interface ParsedDay {
  label: string;
  focus: string;
  rows: ParsedRow[];
}

export interface ParsedRoutine {
  days: ParsedDay[];
  /** Cuantas lineas se guardaron sin poder leer sus series. */
  unparsedLines: number;
}

/** Adornos: lineas de ═══, ---, ===, ***. */
const SEPARADOR = /^[\s═=＝\-–—_*·•~#]+$/;

/** "DÍA A", "Dia 1", "DAY B" — con lo que venga detras. */
const CABECERA_DIA = /^\s*(?:d[íi]a|day)\s+([\wÁÉÍÓÚÑ]+)\s*(\([^)]*\))?\s*(?:[—–\-:]\s*(.*))?$/i;

/**
 * "4x15", "5×5", "3 x 10", y lo que siga: "60seg", "10 por lado".
 *
 * El espacio de la unidad va DENTRO de su grupo opcional a proposito: si se
 * saca fuera se come el espacio que necesita " por lado" y las repeticiones
 * unilaterales se quedan en un numero pelado.
 */
const SERIES_REPS = /(\d{1,2})\s*[x×]\s*(\d{1,3}(?:\s*(?:seg|segs|s|min|m))?(?:\s+por\s+lado)?)/i;

/** Una linea de cuerda / comba: lleva el nombre y un patron 40/20. */
const CUERDA = /\b(cuerda|comba|jump\s*rope|salto\s+de\s+cuerda)\b/i;

/** Numeracion o vineta al principio: "1.", "2)", "-", "•". */
const VINETA = /^\s*(?:\d{1,2}\s*[.)\-]|[-–—•*·])\s*/;

/** Emojis y simbolos decorativos sueltos al principio de una linea. */
const ADORNO_INICIAL = /^[\s\p{Extended_Pictographic}☀-➿️]+/u;

function limpiar(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/** Quita la numeracion, los emojis y los separadores de cola. */
function nombreLimpio(texto: string): string {
  return limpiar(texto.replace(VINETA, '').replace(ADORNO_INICIAL, '')).replace(
    /[\s—–\-:,.]+$/,
    '',
  );
}

/**
 * Lee una linea de ejercicio.
 *
 * Lo que va detras de una flecha es la progresion del que la escribio, y esa
 * vive en la biblioteca, no en la hoja del dia: se descarta aqui.
 */
function leerFila(lineaOriginal: string): { row: ParsedRow; leida: boolean } | null {
  const sinProgresion = lineaOriginal.split(/[→➜=]>|→/)[0];
  const linea = limpiar(sinProgresion);
  if (linea === '' || SEPARADOR.test(linea)) return null;

  if (CUERDA.test(linea)) {
    return {
      row: {
        name: nombreLimpio(linea) || 'Cuerda',
        sets: 1,
        reps: 'tabata',
        restSeconds: 0,
        mode: 'tabata',
      },
      leida: true,
    };
  }

  const match = SERIES_REPS.exec(linea);
  if (!match) {
    // No se pudo leer, pero no se tira: queda como fila para editar.
    const nombre = nombreLimpio(linea);
    if (nombre === '') return null;
    return {
      row: { name: nombre, sets: 3, reps: '10', restSeconds: DEFAULT_REST_SECONDS, mode: 'reps' },
      leida: false,
    };
  }

  const nombre = nombreLimpio(linea.slice(0, match.index));
  return {
    row: {
      name: nombre === '' ? limpiar(linea) : nombre,
      sets: Number(match[1]),
      reps: limpiar(match[2]),
      restSeconds: DEFAULT_REST_SECONDS,
      mode: 'reps',
    },
    leida: true,
  };
}

/** Lee una cabecera de dia, o null si la linea no lo es. */
function leerCabecera(linea: string): { label: string; focus: string } | null {
  const limpia = limpiar(linea.replace(ADORNO_INICIAL, ''));
  const match = CABECERA_DIA.exec(limpia);
  if (!match) return null;

  const token = match[1];
  const parentesis = match[2] ?? '';
  const focus = nombreLimpio(match[3] ?? '');

  return {
    label: limpiar(`Día ${token} ${parentesis}`),
    focus,
  };
}

/**
 * Convierte texto pegado en dias y filas.
 *
 * Si el texto no trae cabeceras de dia, todo cae en un unico dia: alguien que
 * pega solo una lista de ejercicios sigue obteniendo algo usable.
 */
export function parseRoutineText(text: string): ParsedRoutine {
  const days: ParsedDay[] = [];
  let actual: ParsedDay | null = null;
  let unparsedLines = 0;

  for (const cruda of text.split(/\r?\n/)) {
    const linea = cruda.trim();
    if (linea === '' || SEPARADOR.test(linea)) continue;

    const cabecera = leerCabecera(linea);
    if (cabecera) {
      actual = { label: cabecera.label, focus: cabecera.focus, rows: [] };
      days.push(actual);
      continue;
    }

    const leida = leerFila(linea);
    if (!leida) continue;
    if (!leida.leida) unparsedLines += 1;

    if (!actual) {
      actual = { label: 'Día 1', focus: '', rows: [] };
      days.push(actual);
    }
    actual.rows.push(leida.row);
  }

  // Una cabecera sin ejercicios debajo no es un dia, es ruido.
  return { days: days.filter((d) => d.rows.length > 0), unparsedLines };
}
