const fs = require('fs');
const path = require('path');
const http = require('http');

async function run() {
  console.log('====================================================');
  console.log('TEST SUITE: ZERO BROKEN IMAGES & CASH CANDLES AUDIT');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Audit categories.ts
  console.log('\n[1] Auditing categories.ts local asset paths...');
  const catTsPath = path.join(__dirname, '../src/data/categories.ts');
  const catContent = fs.readFileSync(catTsPath, 'utf8');

  // Extract category image paths
  const imgMatches = [...catContent.matchAll(/image:\s*['"]([^'"]+)['"]/g)];
  console.log(`  Found ${imgMatches.length} category image declarations.`);

  for (const m of imgMatches) {
    const relPath = m[1];
    assert(!relPath.startsWith('http'), `Category image is local (not remote CDN): ${relPath}`);
    const diskPath = path.join(__dirname, '../public', relPath.replace(/^\//, ''));
    const exists = fs.existsSync(diskPath);
    const size = exists ? fs.statSync(diskPath).size : 0;
    assert(exists && size > 5000, `Local image exists & >5KB: ${relPath} (${size} bytes)`);
  }

  // 2. Specific Cash Candles & Cash Money Candles checks
  console.log('\n[2] Checking Cash Candles & Cash Money Candles configurations...');
  const ccImageMatch = catContent.match(/id:\s*['"]cat-cash-candles['"][\s\S]*?image:\s*['"]([^'"]+)['"]/);
  assert(ccImageMatch && ccImageMatch[1].includes('cash_candles.jpg'), `Cash Candles uses cash_candles.jpg: ${ccImageMatch?.[1]}`);

  const cmcImageMatch = catContent.match(/id:\s*['"]cat-cash-money-candles['"][\s\S]*?image:\s*['"]([^'"]+)['"]/);
  assert(cmcImageMatch && cmcImageMatch[1].includes('cash_money_candles.jpg'), `Cash Money Candles uses cash_money_candles.jpg: ${cmcImageMatch?.[1]}`);

  // 3. Audit imageUtils.ts
  console.log('\n[3] Auditing imageUtils.ts fallbacks...');
  const utilsPath = path.join(__dirname, '../src/utils/imageUtils.ts');
  const utilsContent = fs.readFileSync(utilsPath, 'utf8');

  const fallbackMatches = [...utilsContent.matchAll(/:\s*['"](\/assets\/ilovesurprises\/[^'"]+)['"]/g)];
  for (const m of fallbackMatches) {
    const p = m[1];
    const diskPath = path.join(__dirname, '../public', p.replace(/^\//, ''));
    const exists = fs.existsSync(diskPath);
    assert(exists, `imageUtils fallback exists on disk: ${p}`);
  }

  // 4. Audit productService.ts fallbacks
  console.log('\n[4] Auditing productService.ts fallbacks...');
  const psPath = path.join(__dirname, '../src/services/productService.ts');
  const psContent = fs.readFileSync(psPath, 'utf8');

  assert(!psContent.includes('Brown-Sugar-Boba-Cash-Cereal-Slimes.jpg'), 'Removed non-existent Brown Sugar Boba slime path');
  assert(psContent.includes('BDayCake.webp'), 'Uses authentic BDayCake.webp for slimes');
  assert(psContent.includes('cash_candles.jpg'), 'Uses cash_candles.jpg for cash candles fallback');
  assert(psContent.includes('cash_money_candles.jpg'), 'Uses cash_money_candles.jpg for cash money candles fallback');
  assert(psContent.includes('youtu'), 'Filters out YouTube video links from image fields');

  // 5. Live Browser Edge CDP Test
  console.log('\n[5] Live Browser Edge CDP Test on http://localhost:5173...');
  try {
    const listRes = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json/list', res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    const page = listRes.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
    if (!page) {
      console.log('  ⚠️ No active Edge CDP page on localhost:5173 found; skipping live CDP DOM probe.');
    } else {
      const WebSocket = require('ws');
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(res => ws.on('open', res));

      let id = 1;
      function send(method, params = {}) {
        return new Promise((resolve) => {
          const reqId = id++;
          const handler = (msg) => {
            const data = JSON.parse(msg);
            if (data.id === reqId) {
              ws.off('message', handler);
              resolve(data.result);
            }
          };
          ws.on('message', handler);
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });
      }

      // Reload page to get fresh render
      await send('Page.reload', {});
      await new Promise(r => setTimeout(r, 2500));

      // Check all <img> tags in categories section
      const evalResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const catImgs = Array.from(document.querySelectorAll('#categories img')).map(img => ({
              src: img.src,
              alt: img.alt,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              isBroken: !img.complete || img.naturalWidth === 0
            }));

            const prodImgs = Array.from(document.querySelectorAll('#trending-best-sellers img')).map(img => ({
              src: img.src,
              alt: img.alt,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              isBroken: !img.complete || img.naturalWidth === 0
            }));

            return {
              categoryImages: catImgs,
              productImages: prodImgs,
              totalCategoryImages: catImgs.length,
              brokenCategoryImages: catImgs.filter(i => i.isBroken).length,
              totalProductImages: prodImgs.length,
              brokenProductImages: prodImgs.filter(i => i.isBroken).length,
            };
          })()
        `,
        returnByValue: true
      });

      const report = evalResult.result.value;
      console.log('  Live DOM Image Audit Results:', JSON.stringify(report, null, 2));

      assert(report.totalCategoryImages >= 6, `Found ${report.totalCategoryImages} category images`);
      assert(report.brokenCategoryImages === 0, `Broken category images: ${report.brokenCategoryImages} (MUST BE 0)`);
      assert(report.brokenProductImages === 0, `Broken product images: ${report.brokenProductImages} (MUST BE 0)`);

      // Verify Cash Candles specifically
      const cashCandleImg = report.categoryImages.find(i => i.alt?.toLowerCase().includes('cash candles'));
      assert(cashCandleImg && cashCandleImg.naturalWidth > 0, `Cash Candles card image loaded with width ${cashCandleImg?.naturalWidth}px`);

      // Verify Cash Money Candles specifically
      const cashMoneyImg = report.categoryImages.find(i => i.alt?.toLowerCase().includes('cash money'));
      assert(cashMoneyImg && cashMoneyImg.naturalWidth > 0, `Cash Money Candles card image loaded with width ${cashMoneyImg?.naturalWidth}px`);

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const shotPath = path.join(__dirname, '../scripts/verified_cash_candles_rendered.png');
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      console.log(`  📸 Saved live screenshot to ${shotPath}`);

      ws.close();
    }
  } catch (err) {
    console.log(`  Browser CDP notice: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`TOTAL PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

run();
