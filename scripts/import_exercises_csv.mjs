/**
 * import_exercises_csv.mjs
 *
 * Imports exercises_final.csv (or exercises_export.csv) into Supabase.
 *
 * Strategy: UPSERT on `id` (UUID from CSV).
 *   - No duplicates
 *   - Idempotent — safe to re-run
 *   - Null demonstration_url is stored as NULL (not empty string)
 *   - is_compound is cast to boolean
 *
 * Usage:
 *   node scripts/import_exercises_csv.mjs [path/to/file.csv]
 *
 * If no path is given, defaults to ./exercises_export.csv
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────
const SUPABASE_URL     = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||   // preferred: service role bypasses RLS
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // fallback: anon key (needs write RLS open)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing env vars. Need EXPO_PUBLIC_SUPABASE_URL and');
  console.error('   SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CSV_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'exercises_export.csv');

// ── CSV Parser (no external deps) ────────────────────────────

/**
 * Very simple RFC-4180 CSV parser.
 * Handles quoted fields and embedded commas/newlines inside quotes.
 */
function parseCSV(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let i = 0;

  const parseField = () => {
    if (lines[i] === '"') {
      i++; // skip opening quote
      let field = '';
      while (i < lines.length) {
        if (lines[i] === '"' && lines[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (lines[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += lines[i++];
        }
      }
      return field;
    }
    // Unquoted field
    let field = '';
    while (i < lines.length && lines[i] !== ',' && lines[i] !== '\n') {
      field += lines[i++];
    }
    return field;
  };

  while (i < lines.length) {
    const row = [];
    while (i < lines.length && lines[i] !== '\n') {
      row.push(parseField());
      if (lines[i] === ',') i++;
    }
    if (lines[i] === '\n') i++;
    if (row.length > 0) rows.push(row);
  }

  return rows;
}

// ── Normalizers ───────────────────────────────────────────────

const nullIfEmpty = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const toBool = (v) => {
  if (v === null || v === undefined || v === '') return false;
  return String(v).toLowerCase() === 'true';
};

// ── Main ──────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  File not found: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log(`📂  Reading CSV: ${CSV_PATH}`);
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(raw);

  if (rows.length < 2) {
    console.error('❌  CSV appears empty or has no data rows.');
    process.exit(1);
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  console.log(`📋  Columns: ${headers.join(', ')}`);
  console.log(`📊  Rows to process: ${dataRows.length}`);

  // Map CSV rows → Supabase records
  const records = dataRows
    .filter((row) => row.some((cell) => cell.trim() !== '')) // skip blank rows
    .map((row) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] !== undefined ? row[idx] : '';
      });

      return {
        id:                nullIfEmpty(obj.id),
        slug:              nullIfEmpty(obj.slug),
        name_en:           nullIfEmpty(obj.name_en),
        name_es:           nullIfEmpty(obj.name_es),
        category:          nullIfEmpty(obj.category),
        muscle_group:      nullIfEmpty(obj.muscle_group),
        difficulty:        nullIfEmpty(obj.difficulty),
        equipment:         nullIfEmpty(obj.equipment),
        type:              nullIfEmpty(obj.type),
        is_compound:       toBool(obj.is_compound),
        movement_pattern:  nullIfEmpty(obj.movement_pattern),
        description:       nullIfEmpty(obj.description),
        instructions:      nullIfEmpty(obj.instructions),
        demonstration_url: nullIfEmpty(obj.demonstration_url),
        notes:             nullIfEmpty(obj.notes),
        created_at:        nullIfEmpty(obj.created_at) || new Date().toISOString(),
      };
    })
    .filter((r) => r.id !== null); // Must have a valid UUID

  console.log(`✅  Valid records after normalization: ${records.length}`);

  // UPSERT in batches of 50
  const BATCH = 50;
  let inserted = 0;
  let updated  = 0;
  let errors   = 0;

  for (let start = 0; start < records.length; start += BATCH) {
    const batch = records.slice(start, start + BATCH);

    // Dynamically filter payload keys to only include columns that exist in the DB schema
    const { data: schemaCheck } = await supabase.from('exercises').select('*').limit(1);
    const validColumns = schemaCheck && schemaCheck.length > 0 ? Object.keys(schemaCheck[0]) : null;

    const cleanBatch = validColumns 
      ? batch.map(row => {
          const cleanRow = {};
          validColumns.forEach(col => {
            if (row[col] !== undefined) cleanRow[col] = row[col];
          });
          return cleanRow;
        })
      : batch;

    const { data, error } = await supabase
      .from('exercises')
      .upsert(cleanBatch, {
        onConflict:        'id',
        ignoreDuplicates:  false, // update on conflict
      })
      .select('id');

    if (error) {
      console.error(`❌  Batch ${Math.floor(start / BATCH) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      const count = data?.length ?? batch.length;
      inserted += count;
      console.log(`  ✓ Batch ${Math.floor(start / BATCH) + 1}: ${count} records upserted`);
    }
  }

  console.log('\n──────────────────────────────');
  console.log(`✅  Upserted : ${inserted}`);
  console.log(`❌  Errors   : ${errors}`);
  console.log('──────────────────────────────');

  if (errors === 0) {
    console.log('\n🎉  Import complete. All exercises are in Supabase.');
  } else {
    console.log('\n⚠️   Import finished with errors. Check output above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
