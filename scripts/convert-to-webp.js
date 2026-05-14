/**
 * convert-to-webp.js
 *
 * SAFE IMAGE OPTIMIZATION PIPELINE — NON-DESTRUCTIVE
 * =====================================================
 * Reads:    assets/Excercices/*.png  (originals — never touched)
 * Writes:   assets/exercises/normalized/*.webp  (optimized derivatives)
 * Mapping:  assets/exercises/refs/media-map.csv  (slug → paths → status)
 *
 * Safety guarantees:
 *  - Originals are NEVER deleted, moved, or overwritten
 *  - Re-running is safe (skips already-done files by default)
 *  - Use --force to re-process all files
 *  - Use --hires to also generate a 1200px high-res tier
 *
 * Usage:
 *   node scripts/convert-to-webp.js
 *   node scripts/convert-to-webp.js --force
 *   node scripts/convert-to-webp.js --hires
 *   node scripts/convert-to-webp.js --force --hires
 */

'use strict';

const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');

// ── Paths ──────────────────────────────────────────────────────────────────
const ROOT          = path.join(__dirname, '..');
const SOURCE_DIR    = path.join(ROOT, 'assets', 'exercises');           // originals (immutable)
const THUMB_DIR     = path.join(ROOT, 'assets', 'exercises', 'thumbs');     // thumbnails output
const NORM_DIR      = path.join(ROOT, 'assets', 'exercises', 'normalized'); // main output
const HIRES_DIR     = path.join(ROOT, 'assets', 'exercises', 'hires');      // optional hi-res tier
const RAW_LINK_DIR  = path.join(ROOT, 'assets', 'exercises', 'raw');        // README pointing to originals
const REFS_DIR      = path.join(ROOT, 'assets', 'exercises', 'refs');
const MAP_FILE      = path.join(REFS_DIR, 'media-map.csv');

// ── Flags ──────────────────────────────────────────────────────────────────
const FORCE  = process.argv.includes('--force');
const HIRES  = process.argv.includes('--hires');

// ── Quality Strategy ───────────────────────────────────────────────────────
/**
 * WebP quality settings (0-100).
 *
 * We prioritize VISUAL FIDELITY over file size.
 *
 * normalized (list/card view):
 *   - quality 88, lossless: false  → very high quality, ~70-80% size reduction vs PNG
 *   - nearLossless: false, smart subsample: enabled
 *   - max width: 900px (preserves aspect ratio, fine for 4:3 cards)
 *   - For images with transparency → lossless: true to keep edges clean
 *
 * hires (detail/zoom view):
 *   - quality 95, lossless: false  → near-lossless for zoom use
 *   - max width: 1400px (full resolution for zoom, avoids blurring)
 *   - For images with transparency → lossless: true
 */
const THUMB_QUALITY  = 80;   // fast lists
const NORM_QUALITY   = 88;   // detail
const HIRES_QUALITY  = 95;   // zoom
const THUMB_MAX_W    = 300;
const NORM_MAX_W     = 900;
const HIRES_MAX_W    = 1400;

// ── Helpers ────────────────────────────────────────────────────────────────

function toSlug(filename) {
  return filename
    .replace(/\.(png|jpg|jpeg)$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created: ${path.relative(ROOT, dir)}`);
  }
}

function relPath(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

/** Check whether a PNG has an alpha channel */
async function hasAlpha(filePath) {
  try {
    const meta = await sharp(filePath).metadata();
    return meta.hasAlpha === true || meta.channels === 4;
  } catch {
    return false;
  }
}

/** Convert one image, returns { ok, outPath, hiresPath, error } */
async function convert(srcPath, slug) {
  const alpha       = await hasAlpha(srcPath);
  const outName     = `${slug}.webp`;
  const thumbOut    = path.join(THUMB_DIR, outName);
  const normOut     = path.join(NORM_DIR, outName);
  const hiresOut    = path.join(HIRES_DIR, outName);

  const results = { thumbPath: null, normPath: null, hiresPath: null, error: null };

  // ── Thumbnails (fast lists) ──────────────────────────────────────────
  const thumbSkip = !FORCE && fs.existsSync(thumbOut);
  if (!thumbSkip) {
    try {
      const img = sharp(srcPath).resize({
        width:  THUMB_MAX_W,
        height: THUMB_MAX_W,
        fit:    'inside',
        withoutEnlargement: true,
      });

      if (alpha) {
        await img.webp({ lossless: true }).toFile(thumbOut);
      } else {
        await img.webp({
          quality:        THUMB_QUALITY,
          smartSubsample: true,
          effort:         4,
        }).toFile(thumbOut);
      }
      results.thumbPath = thumbOut;
    } catch (err) {
      results.error = err.message;
      return results;
    }
  } else {
    results.thumbPath = thumbOut; // already exists
  }

  // ── Normalized (list view) ───────────────────────────────────────────
  const normSkip = !FORCE && fs.existsSync(normOut);
  if (!normSkip) {
    try {
      const img = sharp(srcPath).resize({
        width:  NORM_MAX_W,
        height: NORM_MAX_W,
        fit:    'inside',       // preserve aspect ratio, never crop
        withoutEnlargement: true,
      });

      if (alpha) {
        // Lossless WebP to preserve transparency perfectly
        await img.webp({ lossless: true }).toFile(normOut);
      } else {
        // High-quality lossy — still excellent at 88
        await img.webp({
          quality:        NORM_QUALITY,
          smartSubsample: true,
          effort:         4,          // 0-6, higher = better compression but slower
        }).toFile(normOut);
      }
      results.normPath = normOut;
    } catch (err) {
      results.error = err.message;
      return results;
    }
  } else {
    results.normPath = normOut; // already exists
  }

  // ── Hi-res (detail/zoom view) ────────────────────────────────────────
  if (HIRES) {
    const hiresSkip = !FORCE && fs.existsSync(hiresOut);
    if (!hiresSkip) {
      try {
        const img = sharp(srcPath).resize({
          width:  HIRES_MAX_W,
          height: HIRES_MAX_W,
          fit:    'inside',
          withoutEnlargement: true,
        });

        if (alpha) {
          await img.webp({ lossless: true }).toFile(hiresOut);
        } else {
          await img.webp({
            quality:        HIRES_QUALITY,
            smartSubsample: false,  // full chroma at 95q
            effort:         4,
          }).toFile(hiresOut);
        }
        results.hiresPath = hiresOut;
      } catch (err) {
        // Non-fatal: hi-res failure just means app falls back to norm
        console.warn(`    ⚠️  Hi-res failed for ${slug}: ${err.message}`);
      }
    } else {
      results.hiresPath = hiresOut;
    }
  }

  return results;
}

// ── CSV helpers ────────────────────────────────────────────────────────────

const CSV_HEADER = [
  'slug',
  'name_display',
  'source_format',
  'original_preserved',
  'raw_path',
  'thumb_path',
  'normalized_path',
  'hires_path',
  'output_format',
  'status',
  'notes',
].join(',');

function csvRow(fields) {
  return fields.map(f => {
    const s = String(f ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔒  SAFE IMAGE OPTIMIZATION PIPELINE');
  console.log('=====================================');
  console.log(`📂  Source (immutable): ${relPath(SOURCE_DIR)}`);
  console.log(`📦  Thumbs output:      ${relPath(THUMB_DIR)}`);
  console.log(`📦  Normalized output:  ${relPath(NORM_DIR)}`);
  if (HIRES) console.log(`🔍  Hi-res output:      ${relPath(HIRES_DIR)}`);
  console.log(`🗺️   Mapping file:       ${relPath(MAP_FILE)}`);
  console.log(`⚙️   Force re-process:   ${FORCE ? 'YES' : 'NO (skip existing)'}`);
  console.log('');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌  Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Create output directories
  ensureDir(THUMB_DIR);
  ensureDir(NORM_DIR);
  ensureDir(REFS_DIR);
  ensureDir(RAW_LINK_DIR);
  if (HIRES) ensureDir(HIRES_DIR);

  // Write a README in raw/ to explain it points to the originals
  const rawReadme = path.join(RAW_LINK_DIR, 'README.md');
  if (!fs.existsSync(rawReadme)) {
    fs.writeFileSync(rawReadme, [
      '# assets/exercises/raw',
      '',
      'This directory is a reference pointer only.',
      '',
      '**The actual original PNG files are stored in:**',
      '```',
      'assets/exercises/',
      '```',
      '',
      'Those files are the **immutable masters** and must NEVER be deleted,',
      'moved, or overwritten.',
      '',
      'Optimized derivatives are stored in:',
      '- `assets/exercises/thumbs/` — WebP thumbnails for lists',
      '- `assets/exercises/normalized/` — WebP for detail views',
      '- `assets/exercises/hires/` — WebP for detail/zoom views (optional)',
    ].join('\n'));
  }

  // Scan source files
  const allFiles = fs.readdirSync(SOURCE_DIR).filter(f =>
    /\.(png|jpg|jpeg)$/i.test(f)
  );

  console.log(`📊  Found ${allFiles.length} source files\n`);

  const rows = [];
  let ok = 0, skipped = 0, failed = 0;

  for (const file of allFiles) {
    const srcPath    = path.join(SOURCE_DIR, file);
    const slug       = toSlug(file);
    const nameDisplay = file.replace(/\.(png|jpg|jpeg)$/i, '');
    const ext        = path.extname(file).replace('.', '').toLowerCase();

    const thumbOut = path.join(THUMB_DIR, `${slug}.webp`);
    const normOut  = path.join(NORM_DIR, `${slug}.webp`);
    const hiresOut = path.join(HIRES_DIR, `${slug}.webp`);

    // Skip check (without --force)
    const thumbExists = fs.existsSync(thumbOut);
    const normExists  = fs.existsSync(normOut);
    const hiresExists = HIRES && fs.existsSync(hiresOut);

    if (!FORCE && thumbExists && normExists && (!HIRES || hiresExists)) {
      skipped++;
      rows.push(csvRow([
        slug, nameDisplay, ext, 'yes',
        relPath(srcPath),
        relPath(thumbOut),
        relPath(normOut),
        HIRES ? relPath(hiresOut) : '',
        'webp', 'skipped', 'already processed',
      ]));
      process.stdout.write(`  ⏭  ${slug}\n`);
      continue;
    }

    process.stdout.write(`  ⚙️  ${slug} ...`);
    const result = await convert(srcPath, slug);

    if (result.error) {
      failed++;
      rows.push(csvRow([
        slug, nameDisplay, ext, 'yes',
        relPath(srcPath), '', '', '',
        'webp', 'error', result.error,
      ]));
      process.stdout.write(` ❌  ${result.error}\n`);
      continue;
    }

    ok++;

    // Compute size reduction (using norm size for comparison)
    const srcSize  = fs.statSync(srcPath).size;
    const normSize = fs.statSync(result.normPath).size;
    const pct      = Math.round((1 - normSize / srcSize) * 100);
    const hiresRel = result.hiresPath ? relPath(result.hiresPath) : '';

    rows.push(csvRow([
      slug, nameDisplay, ext, 'yes',
      relPath(srcPath),
      relPath(result.thumbPath),
      relPath(result.normPath),
      hiresRel,
      'webp', 'ok',
      `${(srcSize/1024).toFixed(0)}KB → norm: ${(normSize/1024).toFixed(0)}KB (-${pct}%)`,
    ]));

    process.stdout.write(` ✅  (${(srcSize/1024/1024).toFixed(1)}MB → ${(normSize/1024).toFixed(0)}KB, -${pct}%)\n`);
  }

  // Write CSV map
  const csv = [CSV_HEADER, ...rows].join('\n');
  fs.writeFileSync(MAP_FILE, csv, 'utf8');

  // Summary
  console.log('\n──────────────────────────────────────────────');
  console.log(`✅  Converted : ${ok}`);
  console.log(`⏭   Skipped   : ${skipped} (already done)`);
  console.log(`❌  Errors    : ${failed}`);
  console.log(`🗺️   Map saved  : ${relPath(MAP_FILE)}`);
  console.log('──────────────────────────────────────────────');
  console.log('\n🔒  SAFETY CONFIRMATION:');
  console.log(`    Original PNGs in "${relPath(SOURCE_DIR)}" are UNTOUCHED.`);
  console.log('    Zero originals were deleted, moved, or overwritten.');
  console.log('    Pipeline is safe to re-run at any time.\n');
}

main().catch(err => {
  console.error('\n💥  Fatal error:', err);
  process.exit(1);
});
