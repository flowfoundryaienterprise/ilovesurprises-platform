const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DIR = path.resolve(
  __dirname,
  '..',
  'Backend_Data',
  'I Love Surprises Backend Data',
  'ILoveSurprises_Final_Developer_Handoff',
  'ILoveSurprises_Developer_Handoff'
);

async function countRFC4180(filename) {
  const filePath = path.resolve(DIR, filename);
  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  let isHeader = true;
  let acc = '';

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    if (!line.trim() && !acc) continue;
    acc = acc ? acc + '\n' + line : line;
    let q = 0;
    for (let i = 0; i < acc.length; i++) {
      if (acc[i] === '"') q++;
    }
    if (q % 2 !== 0) continue;

    count++;
    acc = '';
  }
  return count;
}

async function run() {
  console.log('collections_master.csv:', await countRFC4180('collections_master.csv'));
  console.log('collection_conditions.csv:', await countRFC4180('collection_conditions.csv'));
  console.log('collection_metafields.csv:', await countRFC4180('collection_metafields.csv'));
  console.log('product_collections.csv:', await countRFC4180('product_collections.csv'));
}

run();
