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

async function auditAllFiles() {
  const files = fs.readdirSync(ORDERS_DIR).filter(f => f.endsWith('.csv')).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  const auditReport = [];
  const globalUniqueOrders = new Set();
  const globalUniqueOrderIds = new Set();
  const globalUniqueEmails = new Set();
  const globalUniquePhones = new Set();
  const globalUniqueSkus = new Set();
  const globalUniqueLineNames = new Set();
  let globalTotalRows = 0;
  let globalTotalLineItems = 0;
  let globalLineItemsCount = 0;
  let globalMissingNameCount = 0;
  let globalMissingIdCount = 0;
  let globalEarliestDate = '9999';
  let globalLatestDate = '0000';

  for (const f of files) {
    const filePath = path.join(ORDERS_DIR, f);
    let nameIdx = -1, idIdx = -1, emailIdx = -1, phoneIdx = -1, dateIdx = -1;
    let skuIdx = -1, itemNameIdx = -1, itemQtyIdx = -1;

    let fileRowCount = 0;
    const fileOrderNames = new Set();
    let fileMinDate = '9999', fileMaxDate = '0000';
    let fileMissingName = 0, fileMissingId = 0;
    let fileLineItems = 0;

    await parseCSVRows(filePath, (row, head) => {
      fileRowCount++;
      if (nameIdx === -1) {
        nameIdx = head.indexOf('Name');
        idIdx = head.indexOf('Id');
        emailIdx = head.indexOf('Email');
        phoneIdx = head.indexOf('Phone');
        dateIdx = head.indexOf('Created at');
        skuIdx = head.indexOf('Lineitem sku');
        itemNameIdx = head.indexOf('Lineitem name');
        itemQtyIdx = head.indexOf('Lineitem quantity');
      }

      const name = nameIdx !== -1 ? row[nameIdx]?.trim() : '';
      const id = idIdx !== -1 ? row[idIdx]?.trim() : '';
      const email = emailIdx !== -1 ? row[emailIdx]?.trim() : '';
      const phone = phoneIdx !== -1 ? row[phoneIdx]?.trim() : '';
      const date = dateIdx !== -1 ? row[dateIdx]?.trim() : '';
      const sku = skuIdx !== -1 ? row[skuIdx]?.trim() : '';
      const itemName = itemNameIdx !== -1 ? row[itemNameIdx]?.trim() : '';
      const itemQty = itemQtyIdx !== -1 ? parseInt(row[itemQtyIdx], 10) || 0 : 0;

      if (!name) {
        fileMissingName++;
        globalMissingNameCount++;
      } else {
        fileOrderNames.add(name);
        globalUniqueOrders.add(name);
      }

      if (!id) {
        fileMissingId++;
        globalMissingIdCount++;
      } else {
        globalUniqueOrderIds.add(id);
      }

      if (email && email.includes('@')) globalUniqueEmails.add(email.toLowerCase());
      if (phone) globalUniquePhones.add(phone);
      if (sku) globalUniqueSkus.add(sku);
      if (itemName) {
        globalUniqueLineNames.add(itemName);
        fileLineItems++;
        globalLineItemsCount++;
        globalTotalLineItems += itemQty > 0 ? itemQty : 1;
      }

      if (date && date.length >= 10) {
        if (date < fileMinDate) fileMinDate = date;
        if (date > fileMaxDate) fileMaxDate = date;
        if (date < globalEarliestDate) globalEarliestDate = date;
        if (date > globalLatestDate) globalLatestDate = date;
      }
    });

    globalTotalRows += fileRowCount;

    auditReport.push({
      file: f,
      rows: fileRowCount,
      uniqueOrdersInFile: fileOrderNames.size,
      lineItemRows: fileLineItems,
      missingName: fileMissingName,
      missingId: fileMissingId,
      dateRange: `${fileMinDate.slice(0, 10)} to ${fileMaxDate.slice(0, 10)}`
    });
  }

  console.log('========================================================================');
  console.log('AUDIT PER FILE:');
  console.log('========================================================================');
  console.table(auditReport);

  console.log('\n========================================================================');
  console.log('GLOBAL AUDIT SUMMARY:');
  console.log('========================================================================');
  console.log(`Total Source Files:             ${files.length}`);
  console.log(`Total Source Rows:              ${globalTotalRows.toLocaleString()}`);
  console.log(`Total Unique Order Names:       ${globalUniqueOrders.size.toLocaleString()}`);
  console.log(`Total Unique Order IDs:         ${globalUniqueOrderIds.size.toLocaleString()}`);
  console.log(`Total Line Item Rows:           ${globalLineItemsCount.toLocaleString()}`);
  console.log(`Total Line Item Quantity Sum:   ${globalTotalLineItems.toLocaleString()}`);
  console.log(`Unique Customer Emails:         ${globalUniqueEmails.size.toLocaleString()}`);
  console.log(`Unique Customer Phone Numbers:  ${globalUniquePhones.size.toLocaleString()}`);
  console.log(`Unique Lineitem SKUs:           ${globalUniqueSkus.size.toLocaleString()}`);
  console.log(`Unique Lineitem Names:          ${globalUniqueLineNames.size.toLocaleString()}`);
  console.log(`Earliest Date:                  ${globalEarliestDate}`);
  console.log(`Latest Date:                    ${globalLatestDate}`);
  console.log(`Missing Name Rows:              ${globalMissingNameCount}`);
  console.log(`Missing Id Rows:                ${globalMissingIdCount}`);
}

auditAllFiles().catch(console.error);
