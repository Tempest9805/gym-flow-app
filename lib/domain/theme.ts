/**
 * La paleta, en el dominio.
 *
 * Vive aqui y no en el store porque es un dato puro: sin React, sin disco.
 * Eso permite que `theme.test.ts` compruebe el contraste de cada par que la
 * app pinta de verdad, y que un retoque futuro que rompa la legibilidad falle
 * en jest en vez de en una pantalla.
 *
 * Dos temas, un solo eje: claro u oscuro.
 * El claro es la hoja de papel; el oscuro es su negativo.
 *
 * **La regla que evita el bug de contraste.** `primary` es TINTA: va sobre el
 * fondo. `primaryContainer` es RELLENO: el texto va encima, en
 * `onPrimaryContainer`. Un acento de tono medio no puede cumplir las dos cosas
 * a la vez, y mezclarlas fue justo el fallo medido en el tema morado: 4,12:1
 * sobre el fondo, por debajo del 4,5 que pide WCAG AA.
 */

export type ThemeId = 'dark' | 'light';

export interface ThemeTokens {
  // Fondos
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  surfaceBright: string;
  surfaceDim: string;
  surfaceVariant: string;
  // Acento
  primary: string;
  primaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  inversePrimary: string;
  onPrimary: string;
  onPrimaryContainer: string;
  onPrimaryFixed: string;
  // Secundario
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  // Texto
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  // Bordes
  outline: string;
  outlineVariant: string;
  // Estado
  error: string;
  errorContainer: string;
  onError: string;
  // Sombra del titulo (cadena rgba, no hex)
  glowPrimary: string;
  glowPrimaryStrong: string;
  // Fases de tabata: aqui el color SI carga significado, asi que sobrevive al
  // monocromo. Se leen de reojo a mitad de serie.
  tabataPrepare: string;
  tabataWork: string;
  tabataRest: string;
}

export interface Theme {
  id: ThemeId;
  label: string;
  tokens: ThemeTokens;
}

/**
 * Luminancia relativa de un color hexadecimal, segun WCAG 2.1.
 * Acepta `#rrggbb` o `rrggbb`, en cualquier caja.
 */
export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`relativeLuminance espera un hex de 6 digitos, recibio "${hex}"`);
  }
  const channel = (offset: number): number => {
    const raw = parseInt(clean.slice(offset, offset + 2), 16) / 255;
    return raw <= 0.04045 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** Ratio de contraste WCAG entre dos colores. Va de 1 (iguales) a 21. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastPair {
  /** Que se ve en pantalla. */
  label: string;
  fg: keyof ThemeTokens;
  bg: keyof ThemeTokens;
  /** 4.5 para texto normal; 3 para texto grande (>=24px, o >=18.66px en negrita). */
  min: number;
  /** El archivo que lo pinta, para no tener que buscarlo. */
  where: string;
}

/**
 * Los pares fondo/texto que la app pinta de verdad. Salen de leer el codigo,
 * no de imaginarlos: si aparece una superficie nueva, su par se anade aqui.
 */
export const CRITICAL_PAIRS: ContrastPair[] = [
  { label: 'Cabecera de la tabla', fg: 'onPrimaryContainer', bg: 'primaryContainer', min: 4.5, where: 'RoutineTable.tsx' },
  { label: 'Fila par, nombre', fg: 'onSurface', bg: 'surfaceContainerLow', min: 4.5, where: 'RoutineTable.tsx' },
  { label: 'Fila impar, nombre', fg: 'onSurface', bg: 'surfaceContainer', min: 4.5, where: 'RoutineTable.tsx' },
  { label: 'Celda de descanso', fg: 'onSurfaceVariant', bg: 'surfaceContainer', min: 4.5, where: 'RoutineTable.tsx' },
  { label: 'Fila hecha, tachada', fg: 'outline', bg: 'surfaceContainer', min: 4.5, where: 'RoutineTable.tsx' },
  { label: 'Titulo de pantalla', fg: 'onBackground', bg: 'background', min: 4.5, where: 'index.tsx' },
  { label: 'Subtitulo y meta', fg: 'onSurfaceVariant', bg: 'background', min: 4.5, where: 'index.tsx' },
  { label: 'Pestana de dia activa', fg: 'onSurface', bg: 'surfaceContainerHigh', min: 4.5, where: 'DayTabs.tsx' },
  { label: 'Pestana de dia inactiva', fg: 'onSurfaceVariant', bg: 'surfaceContainerLow', min: 4.5, where: 'DayTabs.tsx' },
  { label: 'Acento como TINTA sobre el fondo', fg: 'primary', bg: 'background', min: 4.5, where: 'index.tsx (contador, anadir)' },
  { label: 'Cuenta atras del descanso', fg: 'primary', bg: 'surfaceContainer', min: 4.5, where: 'RoutineTable.tsx' },
  { label: 'Boton Copiado', fg: 'onSecondaryContainer', bg: 'secondaryContainer', min: 4.5, where: 'ShareSheet.tsx' },
  { label: 'Boton Pausar', fg: 'onSurface', bg: 'errorContainer', min: 4.5, where: 'stopwatch.tsx' },
  { label: 'Texto de error sobre el fondo', fg: 'error', bg: 'background', min: 4.5, where: 'settings.tsx, routines.tsx' },
  { label: 'Icono de fila tabata', fg: 'secondary', bg: 'surfaceContainer', min: 4.5, where: 'RoutineTable.tsx' },
  { label: 'Fase preparar como TINTA', fg: 'tabataPrepare', bg: 'background', min: 4.5, where: 'tabata-active.tsx' },
  { label: 'Fase trabajo como TINTA', fg: 'tabataWork', bg: 'background', min: 4.5, where: 'tabata-active.tsx' },
  { label: 'Fase descanso como TINTA', fg: 'tabataRest', bg: 'background', min: 4.5, where: 'tabata-active.tsx' },
];

export const DARK_THEME: Theme = {
  id: 'dark',
  label: 'Oscuro',
  tokens: {
    background: '#000000',
    surface: '#000000',
    surfaceContainer: '#151515',
    surfaceContainerHigh: '#1f1f1f',
    surfaceContainerHighest: '#292929',
    surfaceContainerLow: '#0d0d0d',
    surfaceContainerLowest: '#000000',
    surfaceBright: '#333333',
    surfaceDim: '#000000',
    surfaceVariant: '#292929',
    primary: '#ffffff',
    primaryContainer: '#ffffff',
    primaryFixed: '#ffffff',
    primaryFixedDim: '#d4d4d4',
    inversePrimary: '#1a1a1a',
    onPrimary: '#000000',
    onPrimaryContainer: '#000000',
    onPrimaryFixed: '#000000',
    secondary: '#b0b0b0',
    secondaryContainer: '#d4d4d4',
    onSecondary: '#000000',
    onSecondaryContainer: '#000000',
    onBackground: '#f2f2f2',
    onSurface: '#f2f2f2',
    onSurfaceVariant: '#b0b0b0',
    outline: '#8a8a8a',
    outlineVariant: '#2e2e2e',
    error: '#ff8a80',
    errorContainer: '#7f1d1a',
    onError: '#000000',
    glowPrimary: 'rgba(255, 255, 255, 0.16)',
    glowPrimaryStrong: 'rgba(255, 255, 255, 0.28)',
    tabataPrepare: '#eab308',
    tabataWork: '#c0ff00',
    tabataRest: '#ff3b30',
  },
};

export const LIGHT_THEME: Theme = {
  id: 'light',
  label: 'Claro',
  tokens: {
    background: '#ececed',
    surface: '#ececed',
    surfaceContainer: '#f1f1f2',
    surfaceContainerHigh: '#e6e6e8',
    surfaceContainerHighest: '#dcdcde',
    surfaceContainerLow: '#f7f7f8',
    surfaceContainerLowest: '#ffffff',
    surfaceBright: '#ffffff',
    surfaceDim: '#d8d8da',
    surfaceVariant: '#dcdcde',
    primary: '#1a1a1a',
    primaryContainer: '#1a1a1a',
    primaryFixed: '#1a1a1a',
    primaryFixedDim: '#4a4d52',
    inversePrimary: '#ffffff',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#ffffff',
    onPrimaryFixed: '#ffffff',
    secondary: '#65686d',
    secondaryContainer: '#4a4d52',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#ffffff',
    onBackground: '#16171a',
    onSurface: '#16171a',
    onSurfaceVariant: '#4a4d52',
    outline: '#65686d',
    outlineVariant: '#c9cacd',
    error: '#b3261e',
    errorContainer: '#f6d8d5',
    onError: '#ffffff',
    glowPrimary: 'rgba(0, 0, 0, 0.12)',
    glowPrimaryStrong: 'rgba(0, 0, 0, 0.20)',
    tabataPrepare: '#854d0e',
    tabataWork: '#3f6212',
    tabataRest: '#b91c1c',
  },
};

export const THEMES: Record<ThemeId, Theme> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};

/**
 * Los colores de fase como RELLENO, para la pantalla inmersiva del tabata.
 *
 * No dependen del tema, y es a proposito: ahi el color ocupa el 70% de la
 * pantalla y su trabajo es leerse de reojo, sudando, desde un metro. Los tokens
 * `tabataPrepare/Work/Rest` de cada tema son la version TINTA — el mismo
 * significado escrito sobre el fondo — y esa si cambia, porque un lima sobre
 * blanco no se ve.
 *
 * Es la misma regla que ya evito un bug: relleno y tinta no son el mismo color.
 * El texto que va encima es siempre `TABATA_ON_FILL`.
 */
export const TABATA_FILL = {
  prepare: '#eab308',
  work: '#c0ff00',
  rest: '#ff3b30',
  /** El descanso largo entre ciclos: neutro a proposito, para no confundirlo
   *  con el corto de 20 segundos. */
  cooldown: '#d4d4d4',
} as const;

/** La tinta que va sobre cualquier `TABATA_FILL`. Negra en los cuatro. */
export const TABATA_ON_FILL = '#000000';

export type TabataFillId = keyof typeof TABATA_FILL;

/** El tema con el que arranca alguien que nunca ha elegido. */
export const DEFAULT_THEME_ID: ThemeId = 'dark';

/**
 * Traduce lo que hay guardado en disco al eje actual.
 *
 * Antes se guardaba `purple` u `orange`, que eran dos temas **los dos
 * oscuros**. Quien tuviera cualquiera de los dos se queda en oscuro: es el
 * unico mapeo que no le cambia el aspecto de la app sin avisar. Cualquier
 * otra cosa (nulo, basura, una version futura) cae al tema por defecto.
 */
export function themeIdFromStored(stored: string | null | undefined): ThemeId {
  if (stored === 'dark' || stored === 'light') return stored;
  if (stored === 'purple' || stored === 'orange') return 'dark';
  return DEFAULT_THEME_ID;
}
