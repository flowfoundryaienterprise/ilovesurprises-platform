const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PRODUCTS_CSV = path.resolve(
  __dirname,
  '..',
  'Backend_Data',
  'I Love Surprises Backend Data',
  'ILoveSurprises_Final_Developer_Handoff',
  'Products.csv'
);

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

async function verifyProductsCsvCounts() {
  const stream = fs.createReadStream(PRODUCTS_CSV);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  const options = new Set();
  const optionValues = new Set();

  let isHeader = true;
  let inQuotedMultiline = false;
  let accumulated = '';
  let totalRows = 0;

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!inQuotedMultiline) accumulated = line;
    else accumulated += '\n' + line;

    let q = 0;
    for (let i = 0; i < accumulated.length; i++) if (accumulated[i] === '"') q++;
    if (q % 2 !== 0) { inQuotedMultiline = true; continue; }
    inQuotedMultiline = false;

    const f = parseCSVFields(accumulated);
    accumulated = '';
    totalRows++;

    const productId = f[0];
    const isTopRow = f[20] === 'true';
    if (isTopRow) productCount++;

    const variantId = f[35];
    if (variantId && variantId.trim() !== '') variantCount++;

    const imageSrc = f[28];
    if (imageSrc && imageSrc.trim() !== '') imageCount++;

    if (productId) {
      const optDefs = [
        { name: f[37], val: f[38], pos: 1 },
        { name: f[39], val: f[40], pos: 2 },
        { name: f[41], val: f[42], pos: 3 }
      ];
      for (const o of optDefs) {
        if (o.name && o.name.trim() !== '') {
          const optKey = `${productId}_opt_${o.pos}`;
          options.add(optKey);
          if (o.val && o.val.trim() !== '') {
            optionValues.add(`${optKey}_${o.val.trim()}`);
          }
        }
      }
    }

    if (totalRows % 500000 === 0) {
      console.log(`Processed ${totalRows.toLocaleString()} rows...`);
    }
  }

  console.log('\n=== PRODUCTS.CSV EXTRACTION AUDIT ===');
  console.log('Total Rows:', totalRows);
  console.log('Products:', productCount, '(Expected: 57,479)');
  console.log('Variants:', variantCount, '(Expected: 1,547,749)');
  console.log('Images:', imageCount, '(Expected: 64,937)');
  console.log('Options:', options.size, '(Expected: 68,402)');
  console.log('Option Values:', optionValues.size, '(Expected: 726,907)');
}

verifyProductsCsvCounts().catch(console.error);
