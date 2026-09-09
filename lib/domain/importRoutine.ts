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

import { findExercise } from './matchExercise';
import { parseDuration } from './time';
import { blankDay, blankRow } from './routine';
import type { Exercise, Routine } from './types';

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

/**
 * Lo que exporta la propia app, de vuelta.
 *
 * «Copiar» en Hoy y «Pegar» en Rutinas estan a un toque, asi que duplicar la
 * rutina es el gesto obvio — y sin esto el markdown volvia como 16 ejercicios
 * donde habia 7: la cabecera de la tabla, la fila de guiones y la leyenda
 * entraban como filas.
 */

/** Una fila de tabla markdown: `| a | b | c |`. */
const FILA_TABLA = /^\|(.+)\|\s*$/;

/** La linea de metadatos que abre el export. No es un ejercicio. */
const CABECERA_RUTINA = /^\s*rutina\s*:/i;

/** A partir de aqui solo hay explicaciones de las columnas. */
const LEYENDA = /^\s*leyenda\s*:/i;

/** «(8 ejercicios)» al cierre de una cabecera es el conteo, no el enfoque. */
const CONTEO_EJERCICIOS = /\s*\(\s*\d+\s*ejercicios?\s*\)\s*$/i;

/** El sufijo con el que el export marca las filas por intervalos. */
const SUFIJO_TABATA = /\s*\(tabata\)\s*$/i;

/** Las columnas de la tabla, aprendidas de su cabecera. */
interface Columnas {
  nombre: number;
  series: number;
  reps: number;
  descanso: number;
}

function celdas(linea: string): string[] | null {
  const match = FILA_TABLA.exec(linea.trim());
  return match ? match[1].split('|').map((celda) => celda.trim()) : null;
}

/** `|---|---|`: separa la cabecera del cuerpo y no dice nada. */
function esSeparadorDeTabla(cs: readonly string[]): boolean {
  return cs.every((celda) => celda === '' || /^:?-{2,}:?$/.test(celda));
}

/**
 * Aprende que columna es cual leyendo la cabecera, en vez de dar por hecho el
 * orden: asi una tabla escrita a mano con las columnas en otro orden tambien
 * entra. Sin columna de ejercicio no hay tabla que valga la pena.
 */
function leerCabeceraTabla(cs: readonly string[]): Columnas | null {
  const columnas: Columnas = { nombre: -1, series: -1, reps: -1, descanso: -1 };

  cs.forEach((celda, i) => {
    const texto = celda.toLowerCase();
    if (/ejercicio|movimiento/.test(texto)) columnas.nombre = i;
    else if (/series|sets/.test(texto)) columnas.series = i;
    else if (/repeticion|reps/.test(texto)) columnas.reps = i;
    else if (/descanso|rest/.test(texto)) columnas.descanso = i;
  });

  return columnas.nombre === -1 ? null : columnas;
}

/** Una fila de datos, ya sabiendo donde esta cada cosa. */
function filaDeTabla(cs: readonly string[], columnas: Columnas): ParsedRow | null {
  const bruto = cs[columnas.nombre] ?? '';
  const esTabata = SUFIJO_TABATA.test(bruto);
  const name = limpiar(bruto.replace(SUFIJO_TABATA, ''));
  if (name === '') return null;

  const series = Number(cs[columnas.series]);
  const descanso = parseDuration(cs[columnas.descanso] ?? '');
  const reps = limpiar(cs[columnas.reps] ?? '');

  return {
    name,
    sets: Number.isInteger(series) && series > 0 ? series : 3,
    reps: esTabata ? 'tabata' : reps === '' ? '10' : reps,
    restSeconds: esTabata ? 0 : (descanso ?? DEFAULT_REST_SECONDS),
    mode: esTabata ? 'tabata' : 'reps',
  };
}

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
  const focus = nombreLimpio((match[3] ?? '').replace(CONTEO_EJERCICIOS, ''));

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
  let columnas: Columnas | null = null;

  for (const cruda of text.split(/\r?\n/)) {
    const linea = cruda.trim();
    if (linea === '' || SEPARADOR.test(linea)) continue;

    // Lo que hay bajo «Leyenda:» explica las columnas; no son ejercicios.
    if (LEYENDA.test(linea)) break;
    // «RUTINA: … — Atleta: …» son metadatos, y sin esto abrian un dia extra.
    if (CABECERA_RUTINA.test(linea)) continue;

    const cabecera = leerCabecera(linea);
    if (cabecera) {
      actual = { label: cabecera.label, focus: cabecera.focus, rows: [] };
      days.push(actual);
      continue;
    }

    const cs = celdas(linea);
    if (cs) {
      if (esSeparadorDeTabla(cs)) continue;

      const nuevasColumnas = leerCabeceraTabla(cs);
      if (nuevasColumnas) {
        columnas = nuevasColumnas;
        continue;
      }

      if (columnas) {
        const fila = filaDeTabla(cs, columnas);
        if (!fila) continue;
        if (!actual) {
          actual = { label: 'Día 1', focus: '', rows: [] };
          days.push(actual);
        }
        actual.rows.push(fila);
        continue;
      }
      // Una tabla sin cabecera reconocible: se lee como texto suelto antes que
      // perder la linea.
    }

    const leida = leerFila(cs ? cs.join(' ') : linea);
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

/**
 * Convierte lo leido en una rutina de verdad, lista para guardar.
 *
 * Cada fila intenta atarse a la biblioteca: si lo consigue, hereda gratis la
 * ilustracion, el video y la escalera de progresion. Si no, se queda con su
 * nombre tal cual y el boton de video cae en la busqueda de YouTube — que
 * funciona igual, solo que sin foto.
 *
 * El nombre que se guarda es **siempre el que escribio el usuario**, tambien
 * cuando hay ejercicio enlazado. Su parte dice "Push ups clasicas" y eso es
 * lo que reconoce de un vistazo; "Flexiones" seria mas correcto y menos suyo.
 */
export function routineFromParsed(
  parsed: ParsedRoutine,
  name: string,
  library: readonly Exercise[],
  nowIso: string,
): Routine {
  const days = parsed.days.map((dia, i) => {
    const base = blankDay(dia.label.trim() === '' ? 'Día ' + (i + 1) : dia.label, dia.focus);

    return {
      ...base,
      rows: dia.rows.map((fila) => {
        const encontrado = findExercise(fila.name, library);
        return {
          ...blankRow(fila.name),
          exerciseId: encontrado?.id ?? null,
          sets: fila.sets,
          reps: fila.reps,
          restSeconds: fila.restSeconds,
          mode: fila.mode,
        };
      }),
    };
  });

  return {
    id: 'routine-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    name: name.trim() === '' ? 'Mi rutina' : name.trim(),
    athleteName: null,
    goal: null,
    coachName: null,
    days,
    updatedAt: nowIso,
  };
}

/** Cuantas filas quedaron enlazadas a la biblioteca. Para poder decirlo. */
export function countLinked(routine: Routine): number {
  return routine.days.reduce(
    (total, dia) => total + dia.rows.filter((fila) => fila.exerciseId !== null).length,
    0,
  );
}
