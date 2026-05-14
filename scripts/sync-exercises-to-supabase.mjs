/**
 * sync-exercises-to-supabase.mjs
 *
 * 1. Uploads WebP media from local tiers to Supabase Storage `exercise-media` bucket.
 * 2. Upserts exercise metadata from `exercises_export.csv` into `exercises` table,
 *    attaching the CDN URLs for thumbs, normalized (demonstration_url), and hires.
 *
 * Idempotent, safe to rerun.
 *
 * Usage:
 *   node scripts/sync-exercises-to-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing env vars. Need EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = 'exercise-media';

const ROOT = path.join(__dirname, '..');
const MEDIA_MAP_PATH = path.join(ROOT, 'assets', 'exercises', 'refs', 'media-map.csv');
const EXERCISES_CSV_PATH = path.join(ROOT, 'assets', 'exercises_final.csv');

// ── CSV Parser (RFC-4180) ────────────────────────────────────────────────────
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

// ── Upload helper ────────────────────────────────────────────────────────────
async function uploadFileSafe(localPath, storagePath) {
  if (!fs.existsSync(localPath)) return null;

  try {
    // Check if exists
    const { data: listData, error: listError } = await supabase.storage.from(BUCKET).list(path.dirname(storagePath), {
      search: path.basename(storagePath),
    });

    // For simplicity in this script, we'll try to just upload with upsert: true
    const fileBuffer = fs.readFileSync(localPath);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.warn(`⚠️  Failed to upload ${storagePath}: ${error.message}`);
      return null;
    }
    
    // Return public URL
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn(`⚠️  Exception uploading ${storagePath}: ${err.message}`);
    return null;
  }
}

// ── Main Sync ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🚀  Starting Supabase Sync...`);

  // Ensure bucket exists (using RPC or API if possible, otherwise rely on dashboard/migration)
  // We'll proceed assuming it exists from the migration.

  // 1. Read Media Map
  if (!fs.existsSync(MEDIA_MAP_PATH)) {
    console.error(`❌  Media map not found: ${MEDIA_MAP_PATH}`);
    process.exit(1);
  }
  const mediaMapRaw = fs.readFileSync(MEDIA_MAP_PATH, 'utf8');
  const mediaMapRows = parseCSV(mediaMapRaw);
  const mediaHeaders = mediaMapRows[0].map(h => h.trim());
  const mediaData = mediaMapRows.slice(1).map(row => {
    const obj = {};
    mediaHeaders.forEach((h, idx) => { obj[h] = row[idx] || ''; });
    return obj;
  });

  // Upload Media
  console.log(`📦  Uploading media assets to Supabase Storage (Bucket: ${BUCKET})...`);
  const cdnUrls = {}; // slug -> { thumb, norm, hires }

  for (const media of mediaData) {
    const slug = media.slug;
    if (!slug) continue;

    console.log(`  - Processing: ${slug}`);
    
    const thumbUrl = media.thumb_path ? await uploadFileSafe(path.join(ROOT, media.thumb_path), `thumbs/${slug}.webp`) : null;
    const normUrl = media.normalized_path ? await uploadFileSafe(path.join(ROOT, media.normalized_path), `normalized/${slug}.webp`) : null;
    const hiresUrl = media.hires_path ? await uploadFileSafe(path.join(ROOT, media.hires_path), `hires/${slug}.webp`) : null;

    cdnUrls[slug] = {
      thumb: thumbUrl,
      norm: normUrl,
      hires: hiresUrl,
    };
  }

  // 2. Read Exercises CSV
  if (!fs.existsSync(EXERCISES_CSV_PATH)) {
    console.error(`❌  Exercises CSV not found: ${EXERCISES_CSV_PATH}`);
    process.exit(1);
  }
  const exRaw = fs.readFileSync(EXERCISES_CSV_PATH, 'utf8');
  const exRows = parseCSV(exRaw);
  const exHeaders = exRows[0].map(h => h.trim());
  
  const nullIfEmpty = (v) => (!v || String(v).trim() === '') ? null : String(v).trim();
  const toBool = (v) => String(v).toLowerCase() === 'true';

  const records = exRows.slice(1).filter(row => row.some(c => c.trim() !== '')).map(row => {
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
      created_at: nullIfEmpty(obj.created_at) || new Date().toISOString(),
      
      // Inject CDN URLs
      thumbnail_url: urls?.thumb || null,
      demonstration_url: urls?.norm || null,
      hires_url: urls?.hires || null,
      media_storage_path: slug ? `${slug}` : null,
      media_status: urls?.norm ? 'uploaded' : 'pending',
    };
  }).filter(r => r.id !== null);

  console.log(`\n💾  Upserting ${records.length} records to Supabase database...`);

  const BATCH = 50;
  let inserted = 0;
  let errors = 0;

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
      : batch; // fallback if schema check fails

    const { data, error } = await supabase
      .from('exercises')
      .upsert(cleanBatch, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.error(`❌  Batch ${Math.floor(start / BATCH) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      const count = data?.length ?? batch.length;
      inserted += count;
      console.log(`  ✓ Batch ${Math.floor(start / BATCH) + 1}: ${count} upserted`);
    }
  }

  console.log('\n──────────────────────────────');
  console.log(`✅  Upserted : ${inserted}`);
  console.log(`❌  Errors   : ${errors}`);
  console.log('──────────────────────────────');

  if (errors === 0) {
    console.log('\n🎉  Sync complete. All content & media is live on CDN.');
  } else {
    console.log('\n⚠️   Sync finished with errors.');
    process.exit(1);
  }
}

main().catch(console.error);
