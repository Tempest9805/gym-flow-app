import type { Exercise } from '../types';
import { nextLevel, progressionPath } from '../progression';

function ejercicio(id: string, progressesTo: string | null = null): Exercise {
  return {
    id,
    nameEs: id,
    nameEn: null,
    muscleGroup: 'test',
    videoUrl: null,
    description: null,
    tips: null,
    commonMistakes: null,
    progressesTo,
  };
}

const BIBLIOTECA: Exercise[] = [
  ejercicio('incline-push-up', 'push-up'),
  ejercicio('push-up', 'decline-push-up'),
  ejercicio('decline-push-up', 'archer-push-up'),
  ejercicio('archer-push-up', null),
  ejercicio('plank', 'roto'),
  ejercicio('suelto'),
];

describe('nextLevel', () => {
  it('devuelve el ejercicio al que se progresa', () => {
    expect(nextLevel(BIBLIOTECA[1], BIBLIOTECA)?.id).toBe('decline-push-up');
  });

  it('devuelve null cuando el ejercicio no progresa a ninguno', () => {
    expect(nextLevel(ejercicio('suelto'), BIBLIOTECA)).toBeNull();
  });

  // Una entrada que apunta a un slug que ya no existe no debe romper la
  // pantalla: se comporta como si no hubiera progresion.
  it('devuelve null si apunta a un ejercicio que no esta en la biblioteca', () => {
    expect(nextLevel(ejercicio('plank', 'roto'), BIBLIOTECA)).toBeNull();
  });

  it('tolera que no le pasen ejercicio', () => {
    expect(nextLevel(null, BIBLIOTECA)).toBeNull();
  });
});

describe('progressionPath', () => {
  it('encadena la escalera completa desde el mas facil', () => {
    const camino = progressionPath(BIBLIOTECA[0], BIBLIOTECA).map((e) => e.id);
    expect(camino).toEqual([
      'incline-push-up',
      'push-up',
      'decline-push-up',
      'archer-push-up',
    ]);
  });

  it('un ejercicio sin progresion es un camino de uno', () => {
    expect(progressionPath(ejercicio('suelto'), BIBLIOTECA).map((e) => e.id)).toEqual(['suelto']);
  });

  // Un ciclo en los datos colgaria la pantalla; el camino tiene que cortarse.
  it('no se cuelga si los datos tienen un ciclo', () => {
    const ciclo = [ejercicio('a', 'b'), ejercicio('b', 'a')];
    const camino = progressionPath(ciclo[0], ciclo).map((e) => e.id);
    expect(camino).toEqual(['a', 'b']);
  });
});
