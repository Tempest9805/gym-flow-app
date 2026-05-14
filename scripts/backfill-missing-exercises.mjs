import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'your_service_role_key_here') {
  console.error('❌ Missing or invalid SUPABASE_SERVICE_ROLE_KEY.');
  console.error('   This script requires a real service role key to safely bypass RLS for the backfill.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = 'exercise-media';

const ROOT = path.join(__dirname, '..');
const EXERCISES_CSV_PATH = path.join(ROOT, 'assets', 'exercises_final.csv');
const MEDIA_MAP_PATH = path.join(ROOT, 'assets', 'exercises', 'refs', 'media-map.csv');

// ── CSV Parser ────────────────────────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let i = 0;

  const parseField = () => {
    if (lines[i] === '"') {
      i++;
      let field = '';
      while (i < lines.length) {
        if (lines[i] === '"' && lines[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (lines[i] === '"') {
          i++;
          break;
        } else {
          field += lines[i++];
        }
      }
      return field;
    }
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

const nullIfEmpty = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const toBool = (v) => {
  if (v === null || v === undefined || v === '') return false;
  return String(v).toLowerCase() === 'true';
};

async function main() {
  console.log(`🚀 Starting Missing Exercises Backfill...`);

  // 1. Fetch current database state
  console.log('Fetching current exercises from Supabase...');
  const { data: currentDbExercises, error: dbError } = await supabase.from('exercises').select('*');
  if (dbError) {
    console.error('❌ Error fetching from Supabase:', dbError.message);
    process.exit(1);
  }

  const existingSlugs = new Set();
  const dbRecordsMap = new Map();
  currentDbExercises.forEach(ex => {
    if (ex.slug) {
      existingSlugs.add(ex.slug);
      dbRecordsMap.set(ex.slug, ex);
    }
  });

  console.log(`📊 Found ${currentDbExercises.length} existing exercises in the database.`);

  // 2. Load CSV Source of Truth
  if (!fs.existsSync(EXERCISES_CSV_PATH)) {
    console.error(`❌ Exercises CSV not found: ${EXERCISES_CSV_PATH}`);
    process.exit(1);
  }
  const exRaw = fs.readFileSync(EXERCISES_CSV_PATH, 'utf8');
  const exRows = parseCSV(exRaw);
  const exHeaders = exRows[0].map(h => h.trim());
  
  // 3. Load Media Map
  const cdnUrls = {};
  if (fs.existsSync(MEDIA_MAP_PATH)) {
    const mediaMapRaw = fs.readFileSync(MEDIA_MAP_PATH, 'utf8');
    const mediaMapRows = parseCSV(mediaMapRaw);
    const mediaHeaders = mediaMapRows[0].map(h => h.trim());
    const mediaData = mediaMapRows.slice(1).map(row => {
      const obj = {};
      mediaHeaders.forEach((h, idx) => { obj[h] = row[idx] || ''; });
      return obj;
    });

    for (const media of mediaData) {
      if (media.slug) {
        cdnUrls[media.slug] = {
          thumb: media.thumb_path ? `https://fztvawwtsixuuhqfxxiy.supabase.co/storage/v1/object/public/exercise-media/thumbs/${media.slug}.webp` : null,
          norm: media.normalized_path ? `https://fztvawwtsixuuhqfxxiy.supabase.co/storage/v1/object/public/exercise-media/normalized/${media.slug}.webp` : null,
          hires: media.hires_path ? `https://fztvawwtsixuuhqfxxiy.supabase.co/storage/v1/object/public/exercise-media/hires/${media.slug}.webp` : null,
        };
      }
    }
  }

  // 4. Map CSV records
  const allCsvRecords = exRows.slice(1).filter(row => row.some(c => c.trim() !== '')).map(row => {
    const obj = {};
    exHeaders.forEach((h, idx) => { obj[h] = row[idx] !== undefined ? row[idx] : ''; });
    
    const slug = nullIfEmpty(obj.slug);
    const urls = slug ? cdnUrls[slug] : null;

    return {
      id: nullIfEmpty(obj.id),
      slug,
      name_en: nullIfEmpty(obj.name_en),
      name_es: nullIfEmpty(obj.name_es),
      category: nullIfEmpty(obj.category),
      muscle_group: nullIfEmpty(obj.muscle_group),
      difficulty: nullIfEmpty(obj.difficulty),
      equipment: nullIfEmpty(obj.equipment),
      type: nullIfEmpty(obj.type),
      is_compound: toBool(obj.is_compound),
      movement_pattern: nullIfEmpty(obj.movement_pattern),
      description: nullIfEmpty(obj.description),
      instructions: nullIfEmpty(obj.instructions),
      notes: nullIfEmpty(obj.notes),
      
      // Inject CDN URLs if available
      thumbnail_url: urls?.thumb || null,
      demonstration_url: urls?.norm || null,
      hires_url: urls?.hires || null,
      media_storage_path: slug ? `${slug}` : null,
      media_status: urls?.norm ? 'uploaded' : 'pending',
    };
  }).filter(r => r.slug !== null);

  // 5. Compute Discrepancies
  const missingRecords = [];
  const patchRecords = [];

  allCsvRecords.forEach(csvRecord => {
    if (!existingSlugs.has(csvRecord.slug)) {
      missingRecords.push(csvRecord);
    } else {
      // Check if existing record is explicitly missing safe fields that we can patch
      const dbRec = dbRecordsMap.get(csvRecord.slug);
      let needsPatch = false;
      const patchObj = { id: dbRec.id, slug: dbRec.slug }; // use existing ID

      // Safe patch fields (only if DB is null/empty and CSV has value)
      const safeFields = ['instructions', 'name_en', 'name_es', 'notes', 'type', 'movement_pattern', 'is_compound'];
      safeFields.forEach(f => {
        if ((dbRec[f] === null || dbRec[f] === '') && csvRecord[f] != null && csvRecord[f] !== '') {
          patchObj[f] = csvRecord[f];
          needsPatch = true;
        }
      });

      if (needsPatch) {
        patchRecords.push(patchObj);
      }
    }
  });

  console.log(`\n🔍 Discrepancy Report:`);
  console.log(`   - Total CSV records: ${allCsvRecords.length}`);
  console.log(`   - Missing from DB: ${missingRecords.length}`);
  if (missingRecords.length > 0) {
    console.log(`   - Missing Slugs:`);
    missingRecords.forEach(r => console.log(`       * ${r.slug}`));
  }
  console.log(`   - Existing rows needing safe patch: ${patchRecords.length}`);

  if (missingRecords.length === 0 && patchRecords.length === 0) {
    console.log(`\n✅ Database is fully synchronized with the CSV. Nothing to backfill.`);
    process.exit(0);
  }

  // 6. Execute Backfill (Upsert)
  const { data: schemaCheck } = await supabase.from('exercises').select('*').limit(1);
  const validColumns = schemaCheck && schemaCheck.length > 0 ? Object.keys(schemaCheck[0]) : null;

  const upsertBatch = (batch) => {
    return validColumns 
      ? batch.map(row => {
          const cleanRow = {};
          validColumns.forEach(col => {
            if (row[col] !== undefined) cleanRow[col] = row[col];
          });
          return cleanRow;
        })
      : batch;
  };

  let insertedCount = 0;
  let patchedCount = 0;

  if (missingRecords.length > 0) {
    console.log(`\n💾 Inserting ${missingRecords.length} missing records...`);
    const cleanMissing = upsertBatch(missingRecords);
    const { error } = await supabase.from('exercises').upsert(cleanMissing, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) {
      console.error(`❌ Error inserting missing records:`, error.message);
    } else {
      console.log(`✅ Inserted ${missingRecords.length} records successfully.`);
      insertedCount = missingRecords.length;
    }
  }

  if (patchRecords.length > 0) {
    console.log(`\n💾 Patching ${patchRecords.length} existing records with missing fields...`);
    const cleanPatch = upsertBatch(patchRecords);
    const { error } = await supabase.from('exercises').upsert(cleanPatch, { onConflict: 'id', ignoreDuplicates: false });
    if (error) {
      console.error(`❌ Error patching existing records:`, error.message);
    } else {
      console.log(`✅ Patched ${patchRecords.length} records successfully.`);
      patchedCount = patchRecords.length;
    }
  }

  // 7. Verify Final Count
  const { count: finalCount, error: countError } = await supabase.from('exercises').select('*', { count: 'exact', head: true });
  
  console.log('\n──────────────────────────────');
  console.log(`🏁 BACKFILL COMPLETE`);
  console.log(`✅ Missing Inserted: ${insertedCount}`);
  console.log(`✅ Existing Patched: ${patchedCount}`);
  console.log(`📊 Final DB Count:   ${finalCount} (Expected: ${allCsvRecords.length})`);
  console.log('──────────────────────────────');
  
  if (finalCount === allCsvRecords.length) {
    console.log('🎉 Success! The Supabase table perfectly matches the CSV count.');
  } else {
    console.log('⚠️ Warning: Final count does not match the CSV. Please verify your data.');
  }
}

main().catch(console.error);
