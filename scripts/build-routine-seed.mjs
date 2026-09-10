/**
 * Build the starter routine from the coaching sheet (Rutina pablo.pdf).
 *
 *   node scripts/build-routine-seed.mjs
 *
 * Transcribes the 6 days / 47 rows and links each row to the exercise
 * library by name. Spelling and accents are normalised from the original
 * sheet; the exercise identity is unchanged and every name stays editable
 * in the app. Rows the library does not cover are reported so they can be
 * added as extras.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIBRARY = path.join(root, 'lib', 'data', 'exercises.seed.json');
const TARGET = path.join(root, 'lib', 'data', 'routine-pablo.seed.json');

// [name, sets, reps, restSeconds]
const DAYS = [
  ['Día 1', 'Espalda', 'weight-lifter', [
    ['Dominadas', 3, '6-8', 180],
    ['Remo en Smith', 3, '8-10', 120],
    ['Remo horizontal unilateral', 3, '8-10', 120],
    ['Curl de bíceps en polea', 3, '10-12', 120],
    ['Elevaciones laterales', 3, '12', 120],
    ['Curl inclinado en banco', 3, '10', 120],
    ['Extensión de tríceps', 3, '10', 120],
  ]],
  ['Día 2', 'Pierna', 'run', [
    ['Sentadilla libre', 3, '6-8', 180],
    ['Peso muerto convencional', 3, '6-8', 180],
    ['Prensa inclinada', 3, '10-12', 120],
    ['Extensión de rodilla', 3, '10-12', 120],
    ['Hip thrust en máquina', 3, '12', 120],
    ['Abducción', 3, '15-20', 120],
    ['Pantorrilla en prensa inclinada', 3, '15', 120],
  ]],
  ['Día 3', 'Pecho', 'human-handsup', [
    ['Peck deck', 3, '8-10', 120],
    ['Press hammer', 3, '6-8', 120],
    ['Press inclinado', 3, '8-10', 120],
    ['Extensión de tríceps', 3, '8-10', 120],
    ['Curl de bíceps con barra', 3, '6-8', 120],
    ['Elevaciones laterales', 4, '12', 120],
    ['Martillos', 3, '10-12', 120],
  ]],
  ['Día 4', 'Espalda', 'weight-lifter', [
    ['Jalón al pecho', 3, '6-8', 180],
    ['Remo en Smith', 3, '8-10', 120],
    ['Face pull con polea', 3, '8-10', 120],
    ['Curl de bíceps en polea', 3, '10-12', 120],
    ['Elevaciones laterales', 3, '12', 120],
    ['Curl inclinado en banco', 3, '10', 120],
    ['Extensión de tríceps', 3, '10', 120],
    ['Posterior en peck deck', 3, '15', 90],
  ]],
  ['Día 5', 'Brazo', 'arm-flex', [
    ['Press militar con mancuernas', 4, '6-8', 120],
    ['Curl de bíceps con mancuernas', 3, '6-8', 120],
    ['Martillos', 3, '10', 120],
    ['Laterales con mancuernas', 3, '10', 120],
    ['Extensión de tríceps', 3, '10', 120],
    ['Copa con mancuerna', 3, '10', 120],
    ['Laterales con polea', 3, '10', 120],
  ]],
  ['Día 6', 'Movilidad y abdomen', 'yoga', [
    ['Rotación de brazos', 2, '12', 60],
    ['Empuje de escápulas', 2, '15', 60],
    ['Rotación de hombros en pared', 2, '12', 60],
    ['Rotación interna y externa del fémur', 2, '15', 60],
    ['Sentadilla con palo', 2, '10', 60],
    ['Puente de glúteo en fitball', 2, '10', 60],
    ['Crunch en máquina', 3, '12', 60],
    ['Plancha dinámica', 3, 'fallo', 60],
    ['Press pallof', 3, '15', 60],
    ['Caminata de granjero', 3, '1 min', 60],
    ['Elevación de piernas', 3, '10', 60],
  ]],
];

/**
 * The coach's wording differs from the library's. Keys are folded names
 * (lowercase, no accents); values are library slugs.
 */
const ALIASES = {
  'dominadas': 'pull-up',
  'remo en smith': 'smith-machine-row',
  'remo horizontal unilateral': 'single-arm-cable-row',
  'curl de biceps en polea': 'cable-curl',
  'elevaciones laterales': 'lateral-raise',
  'curl inclinado en banco': 'incline-dumbbell-curl',
  'extension de triceps': 'triceps-pushdown',
  'sentadilla libre': 'barbell-back-squat',
  'peso muerto convencional': 'deadlift',
  'prensa inclinada': 'leg-press',
  'extension de rodilla': 'leg-extension',
  'hip thrust en maquina': 'hip-thrust',
  'abduccion': 'hip-abduction',
  'pantorrilla en prensa inclinada': 'calf-raise',
  'peck deck': 'pec-deck',
  'press hammer': 'chest-press-machine',
  'press inclinado': 'incline-barbell-bench-press',
  'curl de biceps con barra': 'barbell-curl',
  'martillos': 'hammer-curl',
  'jalon al pecho': 'lat-pulldown',
  'face pull con polea': 'face-pull',
  'posterior en peck deck': 'reverse-pec-deck',
  'press militar con mancuernas': 'dumbbell-shoulder-press',
  'curl de biceps con mancuernas': 'dumbbell-curl',
  'laterales con mancuernas': 'lateral-raise',
  'laterales con polea': 'cable-lateral-raise',
  'copa con mancuerna': 'overhead-triceps-extension',
  'rotacion de brazos': 'arm-circles',
  'empuje de escapulas': 'scapular-push-up',
  'rotacion de hombros en pared': 'wall-shoulder-rotation',
  'rotacion interna y externa del femur': 'hip-rotation',
  'sentadilla con palo': 'stick-overhead-squat',
  'puente de gluteo en fitball': 'glute-bridge',
  'crunch en maquina': 'ab-crunch-machine',
  'plancha dinamica': 'plank',
  'press pallof': 'pallof-press',
  'caminata de granjero': 'farmer-s-walk',
  'elevacion de piernas': 'leg-raise',
};

const fold = (text) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const library = JSON.parse(fs.readFileSync(LIBRARY, 'utf8'));
const byId = new Map(library.map((e) => [e.id, e]));
const byName = new Map();
for (const entry of library) {
  byName.set(fold(entry.nameEs), entry.id);
  if (entry.nameEn) byName.set(fold(entry.nameEn), entry.id);
}

const unmatched = [];
const badAliases = [];
let rowSeq = 0;

const days = DAYS.map(([label, focus, icon, rows], dayIndex) => ({
  id: `pablo-d${dayIndex + 1}`,
  label,
  focus,
  icon,
  lastResetOn: null,
  rows: rows.map(([name, sets, reps, restSeconds]) => {
    const key = fold(name);
    const alias = ALIASES[key];
    let exerciseId = null;

    if (alias) {
      if (byId.has(alias)) exerciseId = alias;
      else badAliases.push(`${alias}  (para "${name}")`);
    }
    if (!exerciseId && byName.has(key)) exerciseId = byName.get(key);
    if (!exerciseId) unmatched.push(`${label}: ${name}`);

    rowSeq += 1;
    return {
      id: `pablo-r${rowSeq}`,
      exerciseId,
      name,
      sets,
      reps,
      restSeconds,
      mode: 'reps',
      done: false,
    };
  }),
}));

const routine = {
  id: 'pablo',
  name: 'Rutina Pablo',
  athleteName: 'Pablo',
  goal: 'brazos',
  coachName: 'Coaching Nach',
  days,
  updatedAt: new Date('2026-07-05T00:00:00.000Z').toISOString(),
};

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, `${JSON.stringify(routine, null, 2)}\n`, 'utf8');

const total = days.reduce((n, d) => n + d.rows.length, 0);
console.log(`${days.length} dias / ${total} filas -> ${path.relative(root, TARGET)}`);
console.log(`enlazadas: ${total - unmatched.length} | sin enlazar: ${unmatched.length}`);

if (badAliases.length) {
  console.log('\nALIAS QUE NO EXISTEN EN LA BIBLIOTECA:');
  for (const line of [...new Set(badAliases)]) console.log(`  - ${line}`);
}
if (unmatched.length) {
  console.log('\nSIN ENLAZAR:');
  for (const line of unmatched) console.log(`  - ${line}`);
}
