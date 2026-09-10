/**
 * Guardas del catálogo de plantillas.
 *
 * Una plantilla es texto, así que nada impide escribir una que no se lea. Estos
 * tests son lo que hace que eso falle aquí y no en el móvil de alguien que
 * acaba de instalar la app y se encuentra una rutina vacía.
 */
import seedExercises from '@/lib/data/exercises.seed.json';
import pabloSeed from '@/lib/data/routine-pablo.seed.json';
import { ROUTINE_TEMPLATES } from '@/lib/data/routine-templates';
import { ENVIRONMENTS, groupByEnvironment, routineFromTemplate } from '@/lib/domain/templates';
import type { Exercise, Routine } from '@/lib/domain/types';

const BIBLIOTECA = seedExercises as Exercise[];
const PABLO = pabloSeed as unknown as Routine;

const crear = (id: string) => {
  const plantilla = ROUTINE_TEMPLATES.find((t) => t.id === id);
  if (!plantilla) throw new Error(`No existe la plantilla ${id}`);
  return routineFromTemplate(plantilla, BIBLIOTECA, '2026-09-09T00:00:00.000Z');
};

describe('el catálogo', () => {
  it('tiene plantillas', () => {
    expect(ROUTINE_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('no repite ids', () => {
    const ids = ROUTINE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ROUTINE_TEMPLATES.map((t) => [t.id, t] as const))(
    '«%s» está completa y se lee',
    (_id, plantilla) => {
      expect(plantilla.name.trim()).not.toBe('');
      expect(plantilla.tagline.trim()).not.toBe('');
      expect(plantilla.equipment.trim()).not.toBe('');
      expect(plantilla.level.trim()).not.toBe('');
      expect(ENVIRONMENTS[plantilla.environment]).toBeDefined();

      const rutina = routineFromTemplate(plantilla, BIBLIOTECA, '2026-09-09T00:00:00.000Z');
      expect(rutina.days.length).toBeGreaterThan(0);
      for (const dia of rutina.days) {
        expect(dia.rows.length).toBeGreaterThan(0);
        expect(dia.focus.trim()).not.toBe('');
      }
    },
  );

  it('todas caen en un entorno conocido y ninguna se queda fuera al agrupar', () => {
    const agrupadas = groupByEnvironment(ROUTINE_TEMPLATES).flatMap((g) => g.templates);
    expect(agrupadas).toHaveLength(ROUTINE_TEMPLATES.length);
  });
});

describe('la de casa', () => {
  const rutina = crear('casa-mancuerna');

  // Tres días de trabajo y un cuarto opcional: es la rutina real del dueño.
  it('trae los cuatro días, con el opcional marcado', () => {
    expect(rutina.days).toHaveLength(4);
    expect(rutina.days[3].label).toContain('opcional');
  });

  it('cada día acaba en cuerda, como tabata', () => {
    for (const dia of rutina.days) {
      const ultima = dia.rows[dia.rows.length - 1];
      expect(ultima.mode).toBe('tabata');
    }
  });

  it('la progresión no entra: la hoja del día es solo lo de hoy', () => {
    const nombres = rutina.days.flatMap((d) => d.rows).map((r) => r.name);
    expect(nombres.some((n) => n.includes('→'))).toBe(false);
  });

  it('dice que se hace en casa y con qué', () => {
    expect(rutina.equipment).toMatch(/cuerda/i);
  });
});

describe('la de gimnasio', () => {
  const rutina = crear('gym-pablo');

  // Si alguien toca `routine-pablo.seed.json` y no la plantilla, esto avisa.
  it('coincide con la semilla de la que salió', () => {
    expect(rutina.days).toHaveLength(PABLO.days.length);
    expect(rutina.days.map((d) => d.rows.length)).toEqual(PABLO.days.map((d) => d.rows.length));
  });

  it('conserva los descansos largos del parte', () => {
    expect(rutina.days[0].rows[0].restSeconds).toBe(PABLO.days[0].rows[0].restSeconds);
  });

  it('avisa de que hay que ir al gimnasio', () => {
    expect(rutina.equipment).toMatch(/gimnasio/i);
  });
});
