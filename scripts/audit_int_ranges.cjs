const fs = require('fs');
const readline = require('readline');
const path = require('path');

function parseCSVFields(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

const stats = {
  total_inventory_qty: { min: Infinity, max: -Infinity, overInt32: 0, nonInt: 0 },
  variant_inventory_qty: { min: Infinity, max: -Infinity, overInt32: 0, nonInt: 0 },
  variant_pos: { min: Infinity, max: -Infinity, overInt32: 0, nonInt: 0 },
  img_pos: { min: Infinity, max: -Infinity, overInt32: 0, nonInt: 0 },
  img_width: { min: Infinity, max: -Infinity, overInt32: 0, nonInt: 0 },
  img_height: { min: Infinity, max: -Infinity, overInt32: 0, nonInt: 0 }
};

const productsCsv = path.resolve(__dirname, '..', 'Backend_Data', 'I Love Surprises Backend Data', 'ILoveSurprises_Final_Developer_Handoff', 'Products.csv');

const rl = readline.createInterface({
  input: fs.createReadStream(productsCsv),
  crlfDelay: Infinity
});

let isHeader = true;
let inQuotedMultiline = false;
let accumulated = '';
let rowCount = 0;

rl.on('line', (line) => {
  if (isHeader) { isHeader = false; return; }
  if (!inQuotedMultiline) accumulated = line;
  else accumulated += '\n' + line;

  let q = 0;
  for (let i = 0; i < accumulated.length; i++) if (accumulated[i] === '"') q++;
  if (q % 2 !== 0) { inQuotedMultiline = true; return; }
  inQuotedMultiline = false;

  const f = parseCSVFields(accumulated);
  accumulated = '';
  rowCount++;

  // col 18: Total Inventory Qty
  if (f[18] && f[18].trim() !== '') {
    const v = Number(f[18].trim());
    if (isNaN(v)) stats.total_inventory_qty.nonInt++;
    else {
      if (v < stats.total_inventory_qty.min) stats.total_inventory_qty.min = v;
      if (v > stats.total_inventory_qty.max) stats.total_inventory_qty.max = v;
      if (v > 2147483647 || v < -2147483648) stats.total_inventory_qty.overInt32++;
    }
  }

  // col 57: Variant Inventory Qty
  if (f[57] && f[57].trim() !== '') {
    const v = Number(f[57].trim());
    if (isNaN(v)) stats.variant_inventory_qty.nonInt++;
    else {
      if (v < stats.variant_inventory_qty.min) stats.variant_inventory_qty.min = v;
      if (v > stats.variant_inventory_qty.max) stats.variant_inventory_qty.max = v;
      if (v > 2147483647 || v < -2147483648) stats.variant_inventory_qty.overInt32++;
    }
  }

  if (rowCount % 400000 === 0) {
    console.log(`Processed ${rowCount.toLocaleString()} rows...`, stats);
  }
});

rl.on('close', () => {
  console.log(`\nFINAL STATS after ${rowCount.toLocaleString()} rows:`);
  console.log(JSON.stringify(stats, null, 2));
});
