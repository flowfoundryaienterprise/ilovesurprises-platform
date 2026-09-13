const fs = require('fs');

const files = [
  'Backend_Data/I Love Surprises Backend Data/ILoveSurprises_Final_Developer_Handoff/ILoveSurprises_Developer_Handoff/collections_master.csv',
  'Backend_Data/I Love Surprises Backend Data/ILoveSurprises_Final_Developer_Handoff/ILoveSurprises_Developer_Handoff/product_collections.csv',
  'Backend_Data/I Love Surprises Backend Data/ILoveSurprises_Final_Developer_Handoff/ILoveSurprises_Developer_Handoff/collection_conditions.csv',
  'Backend_Data/I Love Surprises Backend Data/ILoveSurprises_Final_Developer_Handoff/ILoveSurprises_Developer_Handoff/collection_metafields.csv'
];

for (const f of files) {
  console.log(`\n=== File: ${f.split('/').pop()} ===`);
  const fd = fs.openSync(f, 'r');
  const buf = Buffer.alloc(4096);
  fs.readSync(fd, buf, 0, 4096, 0);
  fs.closeSync(fd);
  const str = buf.toString('utf8');
  const headerLine = str.split(/\r?\n/)[0];
  headerLine.split(',').forEach((h, i) => console.log(`  ${i}: ${h.replace(/^"|"$/g, '')}`));
}
