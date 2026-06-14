'use strict';

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'assets', 'avatares');
const OUT_DIR = path.join(SRC_DIR, 'frames');

const SHEETS = {
  hombre: 'avatar_hombre_pixelArt.png',
  mujer: 'avatar_mujer_pixelArt.png',
};

// 3x2 grid of face portraits on the right of the 1343x800 sheet.
// Calibrated visually against avatar_hombre_pixelArt.png (faces, not labels).
// Editable: tweak these 6 numbers if the crop is off.
const GRID = {
  startX: 665,   // left edge of column 1 (cols at 665 / 880 / 1095)
  startY: 110,   // top edge of row 1 (rows at 110 / 430)
  cellW: 215,    // horizontal stride between columns
  rowStride: 320, // vertical stride between rows
  cropW: 175,    // portrait crop width
  cropH: 205,    // portrait crop height
};

function boxes() {
  const out = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      out.push({
        left: GRID.startX + col * GRID.cellW,
        top: GRID.startY + row * GRID.rowStride,
        width: GRID.cropW,
        height: GRID.cropH,
      });
    }
  }
  return out; // index 0..5 = nivel 1..6
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const regions = boxes();
  for (const [variant, file] of Object.entries(SHEETS)) {
    const src = path.join(SRC_DIR, file);
    for (let i = 0; i < regions.length; i++) {
      const out = path.join(OUT_DIR, `${variant}_${i + 1}.webp`);
      await sharp(src).extract(regions[i]).webp({ quality: 90 }).toFile(out);
      console.log('wrote', path.relative(SRC_DIR, out));
    }
  }
  console.log('done — 12 frames in assets/avatares/frames/');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
