import fs from 'fs';
import path from 'path';
import { categoriesData } from '../src/data/categories.ts';
import { productsData } from '../src/data/products.ts';
import { reviewsData } from '../src/data/reviews.ts';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

let missing = 0;
let checked = 0;

function checkAsset(relPath, sourceName) {
  if (!relPath || !relPath.startsWith('/')) return;
  checked++;
  const fullPath = path.join(publicDir, relPath.slice(1));
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ MISSING ASSET: ${relPath} (referenced in ${sourceName})`);
    missing++;
  } else {
    console.log(`✓ OK: ${relPath}`);
  }
}

console.log('--- Checking Categories Assets ---');
for (const c of categoriesData) {
  checkAsset(c.image, `Category: ${c.name}`);
}

console.log('--- Checking Products Assets ---');
for (const p of productsData) {
  checkAsset(p.image, `Product: ${p.name}`);
}

console.log('--- Checking Reviews Assets ---');
for (const r of reviewsData) {
  if (r.avatar) {
    checkAsset(r.avatar, `Review: ${r.author}`);
  }
}

console.log('--- Checking Hardcoded Component Assets ---');
const extraAssets = [
  '/assets/ilovesurprises/logo/2_Horizontal_LOGO_I-Love-Surprises_JC.avif',
  '/assets/ilovesurprises/hero/wowsz.png',
  '/assets/ilovesurprises/banners/mjb.png',
  '/assets/ilovesurprises/banners/guad1.png',
  '/assets/ilovesurprises/banners/99_467f5a07-5323-4d9e-90f0-3a82dc5889e9.png',
  '/assets/ilovesurprises/affiliate/WhatsApp_Image_2026-08-19_at_6.15.11_PM_2.jpg'
];

for (const a of extraAssets) {
  checkAsset(a, 'Component Hero / Logo / Promo Banners / Affiliate');
}

console.log(`\n========================================`);
console.log(`Total Checked: ${checked}`);
console.log(`Total Missing: ${missing}`);
if (missing === 0) {
  console.log(`✅ ZERO BROKEN IMAGE PATHS! ALL LOCAL ASSETS VERIFIED!`);
} else {
  process.exit(1);
}
