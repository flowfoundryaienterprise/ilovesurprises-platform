const fs = require('fs');
const path = require('path');

const csvFile = path.resolve(
  __dirname,
  '..',
  'Backend_Data',
  'I Love Surprises Backend Data',
  'ILoveSurprises_Final_Developer_Handoff',
  'ILoveSurprises_Developer_Handoff',
  'collections_master.csv'
);

const content = fs.readFileSync(csvFile, 'utf8');
const lines = content.split(/\r?\n/);
let count = 0;
let acc = '';
let isHeader = true;

for (const line of lines) {
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
  if (q % 2 !== 0) continue; // In quoted multiline

  count++;
  acc = '';
}

console.log('Exact RFC-4180 collection records:', count);
