import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'public', 'ILoveSurprises');
const targetBaseDir = path.join(rootDir, 'public', 'assets', 'ilovesurprises');

const categories = {
  logo: [
    '2_Horizontal_LOGO_I-Love-Surprises_JC.avif',
    '2_Horizontal_LOGO_I-Love-Surprises_JC-1.avif',
    'Layer_4_d788fddc-1d27-4110-805e-8ec512991c7d.png',
    'Layer_4_d788fddc-1d27-4110-805e-8ec512991c7d-1.png'
  ],
  hero: [
    'wowsz.png',
    'wowsz-1.png',
    '1205230800a.jpg',
    '1000039771_1.jpg',
    '100_266e4391-9dbd-432d-a705-9d06bac3a963.png',
    '120_1cb28d37-c335-4513-808d-912cb52afde6.png'
  ],
  banners: [
    'mjb.png',
    'guad1.png',
    '97_504db631-143e-43f4-820a-eab09c21be36.png',
    '98_f1eaa320-fa4d-4351-ba47-909c0401cb99.png',
    '99_467f5a07-5323-4d9e-90f0-3a82dc5889e9.png'
  ],
  categories: [
    '1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
    'Coke_CSH_Sodapop-CND_JC.jpg',
    'Cat-2_Figurines_JWL_wax_melts.jpg',
    'goats_milk_soaps.jpg',
    'BDayCake.webp',
    'BDayCake.png',
    'Heartfelt-Hugs.jpg',
    'AQUARIUSZODIACCANDLE.webp'
  ],
  products: [
    '1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
    '2_Mockup_Jewelry_JewelryCandles_ff0372e7-4dfa-481d-b13c-f0ff63f7313e.jpg',
    '7_Mockup_Jewelry_JewelryCandles_7b09cf38-5d8c-4e23-b1df-9d427644bb5d.jpg',
    '8_Mockup_Jewelry_JewelryCandles_974252ae-1261-4dbe-982e-d9777a6b2fa8.jpg',
    '11_Mockup_Jewelry_JewelryCandles_b10da722-07c0-43b2-a263-388ab37d7a96.jpg',
    '16_Mockup_Jewelry_JewelryCandles_6df1cda4-8954-4272-b3aa-01cc070d5a21.jpg',
    '16_Mockup_Jewelry_Jewelry_Candles_08f5b7f3-c073-4558-8891-1df9125d44fc.jpg',
    '18_Mockup_Jewelry_Jewelry_Candles_12843050-0243-41d5-9caa-315508f3f645.jpg',
    '21_Mockup_Jewelry_Jewelry_Candles_c9431a01-4f55-4359-8efd-73db455a537b.jpg',
    '25_Mockup_Jewelry_JewelryCandles_455d8a9d-bd79-4284-977d-6cfad7ce1853.jpg',
    '27_Mockup_Jewelry_JewelryCandles_60c7894b-fd45-42ba-8474-32cb23a92472.jpg',
    '7_Mockup_JC_c4d7b0a0-8353-4e0c-b8af-eb0ccc5b41d8.jpg',
    '8_Mockup_JC_2451633d-d973-43fe-ab95-81a909da02b8.jpg',
    '18_Mockup_JC_af97ffd1-196d-4e5b-b1e6-887e74218266.jpg',
    '19_Mockup_JC_0bac61a5-2c36-49e6-b296-138658aa4e6d.jpg',
    'Coke_CSH_Sodapop-CND_JC.jpg',
    'DrPepper_CSH_Sodapop-CND_JC.jpg',
    'Mtdew_CSH_Sodapop-CND_JC.jpg',
    'Pepsi_CSH_Sodapop-CND_JC_1.jpg',
    'AQUARIUSZODIACCANDLE.webp',
    'AQUARIUSZODIACCANDLE_5b627bfe-2c91-4c39-a21b-802181ffaf05.webp',
    'AQUARIUSZODIACCANDLE_5b627bfe-2c91-4c39-a21b-802181ffaf05-1.webp',
    'CANCERZODIACCANDLE.jpg',
    'CAPRICORNZODIACCANDLE.webp',
    'GEMINIZODIACCANDLE.webp',
    'Cat-2_Figurines_JWL_wax_melts.jpg',
    'Cheese_Figurines_JWL_wax_melts.jpg',
    'Dog_Figurines_JWL_wax_melts.jpg',
    'Dog_Figurines_JWL_wax_melts-1.jpg',
    'Gummy-Bear_Figurines_JWL_wax_melts.jpg',
    'birthday_cake_goat_milk_soap.jpg',
    'goats_milk_soaps.jpg',
    'happy_birthday_to_you_goat_milk_soap.jpg',
    'lavender_vanilla_goat_milk_soap.jpg',
    'man_cave_goat_milk_soap.jpg',
    'BDayCake-1.webp',
    'BDayCake.webp',
    'Best-Friends.jpg',
    'Best-Friends-1.jpg',
    'Electric-Snack.jpg',
    'Heartfelt-Hugs.jpg',
    'Heartfelt-Hugs_d198b058-97fd-493a-8fc3-461c6003c8cd.jpg',
    'Style-Clash.jpg'
  ],
  experiences: [
    'Layer_857_baf15cc7-4659-4d6d-8098-4716620d87f6.png',
    'Layer_873_f79eb86d-769e-4cd5-bbed-b7f753c8cfe7.png',
    'Layer_880_2a95eacd-ab55-42f0-978c-963e1a03014a.png',
    'Layer_889.png',
    'Layer_889-1.png',
    'Layer_28_a9e2c333-4c07-4ce9-9c44-22ff2e71e08a.png',
    'Layer_28_b19ab2d3-d18c-46ef-93ad-7d4a505aafc5.png'
  ],
  affiliate: [
    'WhatsApp_Image_2026-08-19_at_6.15.11_PM_1.jpg',
    'WhatsApp_Image_2026-08-19_at_6.15.11_PM_2.jpg',
    'WhatsApp_Image_2026-08-19_at_6.15.11_PM.jpg',
    'WhatsApp_Image_2026-08-19_at_3.42.29_PM.jpg',
    'WhatsApp_Image_2026-08-19_at_3.42.29_PM_1.jpg'
  ],
  reviews: [
    'WhatsApp_Image_2026-08-19_at_3.42.29_PM.jpg',
    'WhatsApp_Image_2026-08-19_at_3.42.29_PM_1.jpg',
    'WhatsApp_Image_2026-08-19_at_6.15.11_PM.jpg',
    'WhatsApp_Image_2026-08-19_at_6.15.11_PM_1.jpg',
    'WhatsApp_Image_2026-08-19_at_6.15.11_PM_2.jpg'
  ]
};

// Ensure all dirs exist
const allSubdirs = ['logo', 'hero', 'banners', 'categories', 'products', 'experiences', 'affiliate', 'reviews', 'icons', 'other'];
for (const sub of allSubdirs) {
  const dirPath = path.join(targetBaseDir, sub);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

if (!fs.existsSync(sourceDir)) {
  console.error('Source dir public/ILoveSurprises does not exist!');
  process.exit(1);
}

const allFiles = fs.readdirSync(sourceDir);
console.log(`Found ${allFiles.length} files in ${sourceDir}`);

const copiedFiles = new Set();

// Copy SVGs to icons
for (const file of allFiles) {
  if (file.endsWith('.svg')) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetBaseDir, 'icons', file));
    copiedFiles.add(file);
  }
}

// Copy categorized items
for (const [category, files] of Object.entries(categories)) {
  const targetDir = path.join(targetBaseDir, category);
  for (const file of files) {
    const src = path.join(sourceDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(targetDir, file));
      copiedFiles.add(file);
    }
  }
}

// Anything not in copiedFiles goes into 'other'
for (const file of allFiles) {
  if (!copiedFiles.has(file)) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetBaseDir, 'other', file));
  }
}

console.log('Asset organization complete!');
