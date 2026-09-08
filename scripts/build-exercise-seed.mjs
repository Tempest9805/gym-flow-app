/**
 * Build the local exercise library from the curated CSV.
 *
 *   node scripts/build-exercise-seed.mjs
 *
 * Offline; no network, no Supabase. Writes lib/data/exercises.seed.json,
 * which ships in the bundle and is copied into AsyncStorage on first run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'assets', 'exercises_final_updated.csv');
const EXTRAS = path.join(root, 'lib', 'data', 'extra-exercises.json');
const VIDEOS = path.join(root, 'lib', 'data', 'video-links.json');
const PROGRESIONES = path.join(root, 'lib', 'data', 'progressions.json');
const TEXTOS_ES = path.join(root, 'lib', 'data', 'exercise-text-es.json');
const MUSCULOS_ES = path.join(root, 'lib', 'data', 'muscle-groups-es.json');
const TARGET = path.join(root, 'lib', 'data', 'exercises.seed.json');

/** Minimal RFC-4180 reader: handles quoted fields with commas and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += char;
      continue;
    }

    if (char === '"') { quoted = true; continue; }
    if (char === ',') { row.push(field); field = ''; continue; }
    if (char === '\r') continue;
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += char;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const slugify = (text) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const clean = (value) => {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

const rows = parseCsv(fs.readFileSync(SOURCE, 'utf8'));
const header = rows[0].map((h) => h.trim());
const index = Object.fromEntries(header.map((name, i) => [name, i]));

const required = ['name_en', 'name_es', 'muscle_group', 'slug', 'description', 'instructions', 'notes', 'demonstration_url'];
for (const column of required) {
  if (!(column in index)) throw new Error(`CSV is missing the "${column}" column`);
}

const seen = new Set();
const exercises = [];

for (const row of rows.slice(1)) {
  if (row.length < header.length) continue;

  const nameEn = clean(row[index.name_en]);
  const nameEs = clean(row[index.name_es]);
  if (!nameEn && !nameEs) continue;

  let id = clean(row[index.slug]) ?? slugify(nameEn ?? nameEs);
  if (seen.has(id)) {
    let n = 2;
    while (seen.has(`${id}-${n}`)) n += 1;
    id = `${id}-${n}`;
  }
  seen.add(id);

  exercises.push({
    id,
    nameEs: nameEs ?? nameEn,
    nameEn: nameEn,
    muscleGroup: clean(row[index.muscle_group]) ?? 'general',
    videoUrl: clean(row[index.demonstration_url]),
    description: clean(row[index.description]),
    tips: clean(row[index.instructions]),
    commonMistakes: clean(row[index.notes]),
  });
}

// Movements the coaching sheet uses that the CSV does not cover.
const extras = JSON.parse(fs.readFileSync(EXTRAS, 'utf8'));
for (const extra of extras) {
  if (seen.has(extra.id)) throw new Error(`Extra "${extra.id}" collides with a CSV slug`);
  seen.add(extra.id);
  exercises.push(extra);
}

// Pinned videos. Anything without one falls back to a YouTube search at
// runtime, so a missing entry is a soft landing, not a hole.
const videos = JSON.parse(fs.readFileSync(VIDEOS, 'utf8'));
const known = new Set(exercises.map((e) => e.id));
for (const id of Object.keys(videos)) {
  if (id.startsWith('_')) continue;
  if (!known.has(id)) throw new Error(`video-links.json points at unknown exercise "${id}"`);
}
for (const exercise of exercises) {
  const pinned = videos[exercise.id];
  if (pinned) exercise.videoUrl = pinned;
}

// Escaleras de dificultad. Solo hay entrada cuando progresar significa cambiar
// de movimiento; anadir peso no es otro ejercicio. Se valida en los dos
// sentidos para que un slug renombrado no deje una progresion apuntando al aire.
const progresiones = JSON.parse(fs.readFileSync(PROGRESIONES, 'utf8'));
for (const [de, a] of Object.entries(progresiones)) {
  if (de.startsWith('_')) continue;
  if (!known.has(de)) throw new Error(`progressions.json parte de un ejercicio inexistente: "${de}"`);
  if (!known.has(a)) throw new Error(`progressions.json apunta a un ejercicio inexistente: "${a}"`);
  if (de === a) throw new Error(`progressions.json: "${de}" apunta a si mismo`);
}
for (const exercise of exercises) {
  exercise.progressesTo = progresiones[exercise.id] ?? null;
}

// El CSV de origen viene en ingles. Traducirlo entero seria perder el original
// y romper cualquier futura actualizacion de la fuente, asi que la version
// espanola vive aparte y se aplica encima, igual que los videos y las
// progresiones. Un slug desconocido es un error: si el CSV renombra algo, la
// traduccion huerfana se ve aqui y no en la pantalla del usuario.
const textosEs = JSON.parse(fs.readFileSync(TEXTOS_ES, 'utf8'));
const CAMPOS_TRADUCIBLES = ['description', 'tips', 'commonMistakes'];

for (const id of Object.keys(textosEs)) {
  if (id.startsWith('_')) continue;
  if (!known.has(id)) throw new Error(`exercise-text-es.json traduce un ejercicio inexistente: "${id}"`);
  for (const campo of Object.keys(textosEs[id])) {
    if (!CAMPOS_TRADUCIBLES.includes(campo)) {
      throw new Error(`exercise-text-es.json: "${id}" trae un campo que no se traduce: "${campo}"`);
    }
  }
}

for (const exercise of exercises) {
  const es = textosEs[exercise.id];
  if (!es) continue;
  for (const campo of CAMPOS_TRADUCIBLES) {
    if (es[campo]) exercise[campo] = es[campo];
  }
}

// Los grupos musculares del CSV vienen en ingles y compuestos con "/". Se
// traducen PIEZA A PIEZA y se recomponen: son 48 palabras frente a 67
// combinaciones, y una combinacion nueva del CSV no vuelve a colar ingles.
// Una pieza sin traducir revienta el seed, que es donde se quiere ver.
const musculosEs = JSON.parse(fs.readFileSync(MUSCULOS_ES, 'utf8'));

function traducirMusculos(grupo) {
  return grupo
    .split('/')
    .map((pieza) => {
      const limpia = pieza.trim();
      if (limpia === '') return limpia;
      const es = musculosEs[limpia.toLowerCase()];
      if (!es) throw new Error(`muscle-groups-es.json no traduce "${limpia}" (de "${grupo}")`);
      return es;
    })
    .join(' / ');
}

for (const exercise of exercises) {
  exercise.muscleGroup = traducirMusculos(exercise.muscleGroup);
}

exercises.sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es'));

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, `${JSON.stringify(exercises, null, 2)}\n`, 'utf8');

const withVideo = exercises.filter((e) => e.videoUrl).length;
console.log(`${exercises.length} ejercicios (${exercises.length - extras.length} del CSV + ${extras.length} extras) -> ${path.relative(root, TARGET)}`);
const conProgresion = exercises.filter((e) => e.progressesTo).length;
console.log(`  con progresion: ${conProgresion}`);
console.log(`  con video fijado: ${withVideo} | con descripcion: ${exercises.filter((e) => e.description).length} | con tips: ${exercises.filter((e) => e.tips).length}`);
console.log(`  traducidos al espanol: ${Object.keys(textosEs).filter((k) => !k.startsWith('_')).length}`);
