import { findExercise, foldName } from '../matchExercise';
import type { Exercise } from '../types';

function ejercicio(id: string, nameEs: string, nameEn: string | null = null): Exercise {
  return {
    id,
    nameEs,
    nameEn,
    muscleGroup: 'pecho',
    videoUrl: null,
    description: null,
    tips: null,
    commonMistakes: null,
    progressesTo: null,
  };
}

const BIBLIOTECA: Exercise[] = [
  ejercicio('push-up', 'Flexiones', 'Push-Up'),
  ejercicio('pike-push-up', 'Flexiones pike', 'Pike Push-Up'),
  ejercicio('hip-thrust', 'Empuje de cadera', 'Hip Thrust'),
  ejercicio('goblet-squat', 'Sentadilla goblet', 'Goblet Squat'),
  ejercicio('inverted-row', 'Remo invertido', 'Inverted Row'),
  ejercicio('dumbbell-row', 'Remo con mancuerna', 'Dumbbell Row'),
  ejercicio('burpee', 'Burpee', 'Burpee'),
];

describe('foldName', () => {
  it('quita acentos, mayusculas y puntuacion', () => {
    expect(foldName('Flexiones pies elevados —')).toBe('flexiones pies elevados');
    expect(foldName('Abducción de cadera')).toBe('abduccion de cadera');
  });

  // El peso es carga, no otro ejercicio.
  it('se come el peso pegado al nombre', () => {
    expect(foldName('Goblet squat KB15')).toBe('goblet squat');
    expect(foldName('búlgara con KB 10 en mano')).toBe('bulgara con en mano');
  });
});

describe('findExercise', () => {
  it('encuentra por el nombre en espanol', () => {
    expect(findExercise('flexiones', BIBLIOTECA)?.id).toBe('push-up');
  });

  it('encuentra por el nombre en ingles', () => {
    expect(findExercise('Hip Thrust', BIBLIOTECA)?.id).toBe('hip-thrust');
  });

  it('ignora el peso al buscar', () => {
    expect(findExercise('Goblet squat KB15', BIBLIOTECA)?.id).toBe('goblet-squat');
  });

  // El caso que motiva las dos pasadas: "Remo invertido" no puede quedarse
  // con "Remo con mancuerna" solo por el orden de la lista.
  it('prefiere la coincidencia exacta a la parcial', () => {
    expect(findExercise('Remo invertido', BIBLIOTECA)?.id).toBe('inverted-row');
  });

  it('acepta un nombre con palabras de mas', () => {
    expect(findExercise('Remo invertido con toalla en la mesa', BIBLIOTECA)?.id).toBe(
      'inverted-row',
    );
  });

  it('no empareja una sola palabra ambigua', () => {
    expect(findExercise('Remo', BIBLIOTECA)).toBeNull();
  });

  it('no empareja lo que no esta', () => {
    expect(findExercise('Curl de muneca', BIBLIOTECA)).toBeNull();
    expect(findExercise('', BIBLIOTECA)).toBeNull();
  });

  // "Plancha con toque de hombro" contiene a "Plancha", pero el ejercicio es
  // el otro. Gana la entrada mas parecida, no la mas corta.
  it('entre varias parciales elige la mas parecida', () => {
    const anidada: Exercise[] = [
      ejercicio('plank', 'Plancha'),
      ejercicio('plank-shoulder-tap', 'Plancha con toque de hombro'),
    ];
    expect(findExercise('Plancha con toque de hombro 3x24', anidada)?.id).toBe(
      'plank-shoulder-tap',
    );
    expect(findExercise('Plancha estatica', anidada)?.id).toBe('plank');
  });

  // Ante un empate de verdad, ninguno: una foto equivocada ensena el
  // movimiento que no es.
  it('devuelve null cuando dos entradas encajan igual de bien', () => {
    const empatadas: Exercise[] = [
      ejercicio('a', 'Curl con mancuerna'),
      ejercicio('b', 'Curl a una mano'),
    ];
    expect(findExercise('Curl con mancuerna a una mano', empatadas)).toBeNull();
  });
});
