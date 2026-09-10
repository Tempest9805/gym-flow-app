/**
 * Exporting a routine as text.
 *
 * The output has two audiences at once: a person reading it in a chat, and
 * an LLM being asked to adjust the routine. So every column is spelled out
 * in a legend and nothing is encoded — rest is "3:00", not 180.
 */
import { formatDuration } from './time';
import type { Routine, RoutineDay } from './types';

const HEADER_ROW = '| # | Ejercicio | Series | Repeticiones | Descanso | Hecho |';
const SEPARATOR_ROW = '|---|---|---|---|---|---|';

const LEGEND = [
  'Leyenda:',
  '- Series: número de veces que se repite el ejercicio.',
  '- Repeticiones: puede ser un rango (6-8), un número exacto (12), "fallo" (hasta el fallo muscular) o un tiempo (1 min).',
  '- Descanso: pausa entre series, en minutos y segundos.',
  '- Hecho: si el ejercicio ya se completó (sí / no).',
  '- (tabata): ejercicio por intervalos, se ejecuta con temporizador en vez de series contadas.',
].join('\n');

/** A pipe inside a cell would break the table. */
function escapeCell(text: string): string {
  return text.replace(/\|/g, '\|');
}

/** "RUTINA: … — Atleta: … — Objetivo: … — Coach: …", skipping absent fields. */
function header(routine: Routine): string {
  const parts = [`RUTINA: ${routine.name}`];
  if (routine.athleteName) parts.push(`Atleta: ${routine.athleteName}`);
  if (routine.goal) parts.push(`Objetivo: ${routine.goal}`);
  if (routine.coachName) parts.push(`Coach: ${routine.coachName}`);
  return parts.join(' — ');
}

/** One day as a title plus a markdown table. */
function dayBlock(day: RoutineDay): string {
  const count = day.rows.length;
  const noun = count === 1 ? 'ejercicio' : 'ejercicios';
  const title = `${day.label.toUpperCase()} — ${day.focus} (${count} ${noun})`;

  const rows = day.rows.map((row, index) => {
    const name = escapeCell(row.mode === 'tabata' ? `${row.name} (tabata)` : row.name);
    const cells = [
      String(index + 1),
      name,
      String(row.sets),
      escapeCell(row.reps),
      formatDuration(row.restSeconds),
      row.done ? 'sí' : 'no',
    ];
    return `| ${cells.join(' | ')} |`;
  });

  return [title, '', HEADER_ROW, SEPARATOR_ROW, ...rows].join('\n');
}

/** A single training day, ready to paste into a chat. */
export function dayToMarkdown(routine: Routine, day: RoutineDay): string {
  return [header(routine), '', dayBlock(day), '', LEGEND].join('\n');
}

/** The whole routine: one header, every day, one legend. */
export function routineToMarkdown(routine: Routine): string {
  const blocks = routine.days.map(dayBlock).join('\n\n');
  return [header(routine), '', blocks, '', LEGEND].join('\n');
}
