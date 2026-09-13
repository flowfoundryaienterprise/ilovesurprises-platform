const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 19942;
const TEMP_DIR = path.join(os.tmpdir(), 'edge_img_check_' + Date.now());

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function check() {
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--headless=new',
    'http://localhost:5173/'
  ]);

  await sleep(2500);
  const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      const handler = (m) => {
        const data = JSON.parse(m.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2500);

  // Expand to all 12 cards
  await send('Runtime.evaluate', {
    expression: '(() => { const btn = document.querySelector("#categories button[aria-expanded]"); if (btn) btn.click(); })()'
  });
  await sleep(1000);

  const evalRes = await send('Runtime.evaluate', {
    expression: '(() => {' +
      'const imgs = Array.from(document.querySelectorAll("#categories img"));' +
      'return imgs.map(img => ({' +
        'alt: img.alt,' +
        'src: img.src,' +
        'complete: img.complete,' +
        'naturalWidth: img.naturalWidth,' +
        'naturalHeight: img.naturalHeight,' +
        'isLoadedOk: img.complete && img.naturalWidth > 0' +
      '}));' +
    '})()',
    returnByValue: true
  });

  console.log('Images audit results:');
  const items = evalRes.result.value;
  items.forEach((item, idx) => {
    console.log(`  [${idx + 1}] ${item.alt}: ${item.isLoadedOk ? '✅ LOADED OK' : '❌ BROKEN'} (natural: ${item.naturalWidth}x${item.naturalHeight}) - ${item.src}`);
  });

  const allOk = items.every(i => i.isLoadedOk);
  console.log('\nALL 12 IMAGES LOADED STATUS:', allOk ? '✅ 100% PERFECT' : '❌ FAILED');

  ws.close();
  edge.kill();
  if (!allOk) process.exit(1);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
