import {
  CRITICAL_PAIRS,
  TABATA_FILL,
  TABATA_ON_FILL,
  DARK_THEME,
  DEFAULT_THEME_ID,
  LIGHT_THEME,
  THEMES,
  contrastRatio,
  relativeLuminance,
  themeIdFromStored,
} from '../theme';

describe('themeIdFromStored', () => {
  it('respeta un id valido', () => {
    expect(themeIdFromStored('dark')).toBe('dark');
    expect(themeIdFromStored('light')).toBe('light');
  });

  // Los dos temas viejos eran oscuros: nadie debe encontrarse la app en
  // claro despues de actualizar.
  it('migra los temas viejos a oscuro', () => {
    expect(themeIdFromStored('purple')).toBe('dark');
    expect(themeIdFromStored('orange')).toBe('dark');
  });

  it('cae al tema por defecto con nada o con basura', () => {
    expect(themeIdFromStored(null)).toBe(DEFAULT_THEME_ID);
    expect(themeIdFromStored(undefined)).toBe(DEFAULT_THEME_ID);
    expect(themeIdFromStored('')).toBe(DEFAULT_THEME_ID);
    expect(themeIdFromStored('neon-verde')).toBe(DEFAULT_THEME_ID);
  });
});

describe('relativeLuminance', () => {
  it('devuelve 0 para el negro y 1 para el blanco', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('acepta mayusculas y la almohadilla es opcional', () => {
    expect(relativeLuminance('FFFFFF')).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('da 21 entre blanco y negro, en cualquier orden', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 2);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
  });

  it('da 1 para un color contra si mismo', () => {
    expect(contrastRatio('#7f7f7f', '#7f7f7f')).toBeCloseTo(1, 5);
  });

  // Valor de referencia conocido: gris web #767676 sobre blanco es el
  // gris mas claro que aun pasa AA.
  it('coincide con el valor de referencia de #767676 sobre blanco', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });
});

describe('los dos temas', () => {
  it('exponen los mismos tokens', () => {
    expect(Object.keys(DARK_THEME.tokens).sort()).toEqual(
      Object.keys(LIGHT_THEME.tokens).sort(),
    );
  });

  it('estan registrados por su id', () => {
    expect(THEMES.dark).toBe(DARK_THEME);
    expect(THEMES.light).toBe(LIGHT_THEME);
  });

  it('el oscuro es oscuro y el claro es claro', () => {
    expect(relativeLuminance(DARK_THEME.tokens.background)).toBeLessThan(0.05);
    expect(relativeLuminance(LIGHT_THEME.tokens.background)).toBeGreaterThan(0.6);
  });
});

// El encargo era "un color de texto que no cause bugs de contraste".
// Esto lo convierte en una prueba: si alguien retoca la paleta y rompe un
// par, el test lo dice antes de que llegue a una pantalla.
describe.each([
  ['oscuro', DARK_THEME],
  ['claro', LIGHT_THEME],
])('contraste WCAG AA en el tema %s', (_nombre, theme) => {
  it.each(CRITICAL_PAIRS.map((pair) => [pair.label, pair] as const))('%s', (_label, pair) => {
    const ratio = contrastRatio(theme.tokens[pair.fg], theme.tokens[pair.bg]);

    // Si esto falla, el mensaje ya dice que par es y donde se pinta.
    expect({
      donde: pair.where,
      ratio: Number(ratio.toFixed(2)),
      minimo: pair.min,
      pasa: ratio >= pair.min,
    }).toMatchObject({ pasa: true });
  });
});

// La pantalla inmersiva del tabata pinta el color de fase a pantalla completa
// con texto negro encima. No depende del tema, asi que se comprueba una vez.
describe('relleno de fase del tabata', () => {
  it.each(Object.entries(TABATA_FILL))('%s aguanta tinta negra', (_fase, relleno) => {
    // 4.5 aunque el numero sea enorme: la etiqueta pequena va sobre el mismo
    // relleno, y esa si es texto normal.
    expect(Number(contrastRatio(TABATA_ON_FILL, relleno).toFixed(2))).toBeGreaterThanOrEqual(4.5);
  });

  it('las cuatro fases se distinguen entre si', () => {
    const valores = Object.values(TABATA_FILL);
    expect(new Set(valores).size).toBe(valores.length);
  });
});
