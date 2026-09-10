/**
 * Genera lib/data/exercise-images.ts a partir de assets/exercises/<slug>.webp
 *
 * Metro resuelve los assets en tiempo de compilacion, asi que `require()` con
 * una ruta variable no funciona: hace falta un mapa literal. Este script lo
 * escribe para no mantenerlo a mano, y avisa si alguna imagen no corresponde a
 * ningun ejercicio de la biblioteca (o al reves).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIR_IMAGENES = join(RAIZ, 'assets', 'exercises');
const SEMILLA = join(RAIZ, 'lib', 'data', 'exercises.seed.json');
const SALIDA = join(RAIZ, 'lib', 'data', 'exercise-images.ts');

const semilla = JSON.parse(readFileSync(SEMILLA, 'utf8'));
const lista = Array.isArray(semilla) ? semilla : (semilla.exercises ?? Object.values(semilla));
const idsBiblioteca = new Set(lista.map((e) => e.id));

const slugs = readdirSync(DIR_IMAGENES)
  .filter((f) => f.endsWith('.webp'))
  .map((f) => f.slice(0, -'.webp'.length))
  .sort();

const huerfanas = slugs.filter((s) => !idsBiblioteca.has(s));
if (huerfanas.length > 0) {
  // Una imagen sin ejercicio solo pesa en el bundle sin que nadie la vea.
  console.error(`Imagenes sin ejercicio en la biblioteca (${huerfanas.length}):`);
  for (const s of huerfanas) console.error(`  ${s}.webp`);
  process.exit(1);
}

const sinImagen = [...idsBiblioteca].filter((id) => !slugs.includes(id)).sort();

let bytes = 0;
for (const s of slugs) bytes += statSync(join(DIR_IMAGENES, `${s}.webp`)).size;

const cuerpo = slugs.map((s) => `  '${s}': require('@/assets/exercises/${s}.webp'),`).join('\n');

const fichero = `/**
 * GENERADO POR scripts/build-exercise-images.mjs — no editar a mano.
 * Regenerar con \`npm run seed\`.
 *
 * ${slugs.length} de ${idsBiblioteca.size} ejercicios tienen imagen.
 * Los ${sinImagen.length} restantes caen al estado sin imagen del detalle.
 */

/** Ilustracion del ejercicio, por slug. \`undefined\` si no hay. */
const IMAGENES: Record<string, number> = {
${cuerpo}
};

/** La imagen de un ejercicio, o null si no tiene. */
export function exerciseImage(exerciseId: string | null | undefined): number | null {
  if (!exerciseId) return null;
  return IMAGENES[exerciseId] ?? null;
}
`;

writeFileSync(SALIDA, fichero, 'utf8');

console.log(
  `exercise-images.ts: ${slugs.length}/${idsBiblioteca.size} ejercicios con imagen, ` +
    `${(bytes / 1048576).toFixed(1)} MB`,
);
if (sinImagen.length > 0) {
  console.log(`Sin imagen (${sinImagen.length}): ${sinImagen.join(', ')}`);
}
