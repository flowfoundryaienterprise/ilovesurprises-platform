const fs = require('fs');
const path = require('path');

const ORDERS_DIR = path.join(__dirname, '..', 'Backend_Data', 'I Love Surprises Backend Data', 'Orders_export');

function parseCSVRows(filePath, onRow) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 128 * 1024 });
    let leftover = '';
    let inQuotes = false;
    let row = [];
    let field = '';
    let header = null;
    let rowCount = 0;

    stream.on('data', (chunk) => {
      const text = leftover + chunk;
      leftover = '';
      const len = text.length;

      for (let i = 0; i < len; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(field);
          field = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(field);
          field = '';

          if (row.length > 1 || row[0] !== '') {
            if (!header) {
              header = row;
            } else {
              rowCount++;
              onRow(row, header, rowCount);
            }
          }
          row = [];
        } else {
          field += c;
        }
      }
    });

    stream.on('end', () => {
      if (row.length > 0 || field !== '') {
        row.push(field);
        if (header) {
          rowCount++;
          onRow(row, header, rowCount);
        } else {
          header = row;
        }
      }
      resolve({ header, rowCount });
    });

    stream.on('error', reject);
  });
}

async function auditOrders() {
  const files = fs.readdirSync(ORDERS_DIR).filter(f => f.endsWith('.csv')).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  console.log(`Found ${files.length} order files.`);

  let totalRows = 0;
  const uniqueOrderNames = new Set();
  const uniqueOrderIds = new Set();
  const uniqueEmails = new Set();
  let minDate = '9999', maxDate = '0000';
  let totalLineItems = 0;
  let fileStats = [];
  let detectedHeader = null;

  for (const f of files) {
    const filePath = path.join(ORDERS_DIR, f);
    let nameIdx = -1, idIdx = -1, emailIdx = -1, dateIdx = -1, itemQtyIdx = -1;
    let fileOrders = new Set();

    const { rowCount } = await parseCSVRows(filePath, (row, head) => {
      if (nameIdx === -1) {
        nameIdx = head.indexOf('Name');
        idIdx = head.indexOf('Id');
        emailIdx = head.indexOf('Email');
        dateIdx = head.indexOf('Created at');
        itemQtyIdx = head.indexOf('Lineitem quantity');
        if (!detectedHeader) detectedHeader = head;
      }

      const name = nameIdx !== -1 ? row[nameIdx]?.trim() : '';
      const id = idIdx !== -1 ? row[idIdx]?.trim() : '';
      const email = emailIdx !== -1 ? row[emailIdx]?.trim() : '';
      const date = dateIdx !== -1 ? row[dateIdx]?.trim() : '';
      const qty = itemQtyIdx !== -1 ? parseInt(row[itemQtyIdx], 10) || 0 : 1;

      if (name) {
        uniqueOrderNames.add(name);
        fileOrders.add(name);
      }
      if (id) uniqueOrderIds.add(id);
      if (email && email.includes('@')) uniqueEmails.add(email.toLowerCase());
      if (date && date.length >= 10) {
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;
      }
      if (qty > 0) totalLineItems += qty;
    });

    totalRows += rowCount;
    fileStats.push({
      file: f,
      rows: rowCount,
      uniqueOrders: fileOrders.size
    });
    console.log(`File: ${f} -> Rows: ${rowCount.toLocaleString()}, Unique Orders in file: ${fileOrders.size.toLocaleString()}`);
  }

  console.log('\n====================================================');
  console.log('AUDIT SUMMARY ACROSS ALL 15 FILES');
  console.log('====================================================');
  console.log(`Total Source CSV Rows:        ${totalRows.toLocaleString()}`);
  console.log(`Total Unique Order Names:     ${uniqueOrderNames.size.toLocaleString()}`);
  console.log(`Total Unique Order IDs:       ${uniqueOrderIds.size.toLocaleString()}`);
  console.log(`Total Line Items (Qty sum):   ${totalLineItems.toLocaleString()}`);
  console.log(`Unique Customer Emails:       ${uniqueEmails.size.toLocaleString()}`);
  console.log(`Earliest Order Date:          ${minDate}`);
  console.log(`Latest Order Date:            ${maxDate}`);
  console.log('\nColumns in header (Count: ' + detectedHeader.length + '):');
  console.log(detectedHeader);
}

auditOrders().catch(console.error);
