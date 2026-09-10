/**
 * Las plantillas de rutina: lo que se ofrece la primera vez.
 *
 * Antes la app sembraba la rutina de Pablo y punto. Si entrenas en casa,
 * aterrizabas en la rutina de gimnasio de otro y lo primero que tenías que
 * hacer era borrarla — al revés de lo que promete la app.
 *
 * Una plantilla **es un parte escrito**, no una estructura aparte: su campo
 * `text` se lee con el mismo `parseRoutineText` que usa el importador, que ya
 * tiene sus tests. Así una plantilla nueva es pegar texto en un archivo, y no
 * hay dos formatos que mantener sincronizados.
 *
 * Lo único que la plantilla añade sobre el texto es el **contexto para
 * elegir**: dónde se hace y qué hace falta para hacerla.
 */
import { countLinked, parseRoutineText, routineFromParsed } from './importRoutine';
import type { Exercise, Routine } from './types';

/** Dónde se entrena. Es el primer filtro real: en casa o fuera. */
export type TemplateEnvironment = 'casa' | 'calistenia' | 'gimnasio' | 'funcional';

export interface RoutineTemplate {
  id: string;
  name: string;
  /** Una línea que dice de qué va, para elegir sin abrirla. */
  tagline: string;
  environment: TemplateEnvironment;
  /**
   * Lo que hace falta, en palabras: «Mancuerna y cuerda de saltar».
   * No es una lista de códigos — se lee de un vistazo y se decide.
   */
  equipment: string;
  level: string;
  /** El parte tal cual, en el mismo formato que se pega desde WhatsApp. */
  text: string;
}

/**
 * El orden importa: es el que ve el usuario, de menos a más equipamiento.
 * Los iconos están comprobados contra el glyphmap de MaterialCommunityIcons.
 */
export const ENVIRONMENTS: Record<TemplateEnvironment, { label: string; icon: string }> = {
  casa: { label: 'En casa', icon: 'home-variant' },
  calistenia: { label: 'Calistenia', icon: 'human-handsup' },
  gimnasio: { label: 'Gimnasio', icon: 'dumbbell' },
  funcional: { label: 'Funcional', icon: 'lightning-bolt' },
};

const ORDEN = Object.keys(ENVIRONMENTS) as TemplateEnvironment[];

export interface TemplateGroup {
  environment: TemplateEnvironment;
  label: string;
  icon: string;
  templates: RoutineTemplate[];
}

/** Las plantillas por entorno, sin grupos vacíos y en el orden de arriba. */
export function groupByEnvironment(templates: readonly RoutineTemplate[]): TemplateGroup[] {
  return ORDEN.map((environment) => ({
    environment,
    label: ENVIRONMENTS[environment].label,
    icon: ENVIRONMENTS[environment].icon,
    templates: templates.filter((t) => t.environment === environment),
  })).filter((grupo) => grupo.templates.length > 0);
}

/**
 * Una rutina nueva a partir de una plantilla, lista para guardar.
 *
 * Pasa por el importador, así que hereda gratis lo que este ya sabe hacer:
 * atar cada fila a su ficha de la biblioteca, entender «40/20 x12 rondas» como
 * tabata y no perder una sola línea. Los ids son nuevos en cada llamada, de
 * modo que elegir la misma plantilla dos veces da dos rutinas independientes.
 */
export function routineFromTemplate(
  template: RoutineTemplate,
  library: readonly Exercise[],
  nowIso: string,
): Routine {
  const parsed = parseRoutineText(template.text);
  const rutina = routineFromParsed(parsed, template.name, library, nowIso);
  return { ...rutina, equipment: template.equipment };
}

/** Cuántas de sus filas encuentran ficha en la biblioteca. Para la vista previa. */
export function linkedCount(template: RoutineTemplate, library: readonly Exercise[]): number {
  return countLinked(routineFromTemplate(template, library, new Date(0).toISOString()));
}
