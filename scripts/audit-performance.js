import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://localhost:4173';

async function runAudit(options = {}) {
  const { viewport = { width: 1440, height: 900 }, throttle = false, name = 'Desktop Fast' } = options;
  console.log(`\n========================================`);
  console.log(`Starting Audit: ${name}`);
  console.log(`========================================`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport(viewport);

  const client = await page.createCDPSession();

  if (throttle) {
    // Fast 3G / Slow 4G simulation: ~1.6 Mbps download, 750 Kbps upload, 150ms RTT
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      connectionType: 'cellular3g'
    });
    // 4x CPU slowdown
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }

  const requests = [];
  let totalBytes = 0;

  page.on('response', async (response) => {
    try {
      const reqUrl = response.url();
      const status = response.status();
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      requests.push({
        url: reqUrl,
        status,
        size: contentLength,
        contentType: headers['content-type'] || ''
      });
      totalBytes += contentLength;
    } catch (e) {
      // ignore
    }
  });

  // Collect Web Vitals in-page
  await page.evaluateOnNewDocument(() => {
    window.__vitals = { fcp: 0, lcp: 0, cls: 0, lcpElement: '' };
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window.__vitals.fcp = entry.startTime;
        }
      }
    }).observe({ type: 'paint', buffered: true });

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const last = entries[entries.length - 1];
        window.__vitals.lcp = last.startTime;
        window.__vitals.lcpElement = last.element ? last.element.outerHTML.slice(0, 150) : '';
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__vitals.cls += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const startTime = Date.now();
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  const loadTime = Date.now() - startTime;

  // Wait a little for any remaining layout shifts or paints
  await new Promise((r) => setTimeout(r, 2000));

  const vitals = await page.evaluate(() => window.__vitals);

  // Analyze network requests
  const assetSizes = requests
    .filter((r) => r.size > 0)
    .sort((a, b) => b.size - a.size);

  const topAssets = assetSizes.slice(0, 10).map((r) => ({
    name: r.url.split('/').pop().split('?')[0] || r.url,
    sizeKB: Math.round(r.size / 1024),
    url: r.url.length > 80 ? '...' + r.url.slice(-70) : r.url
  }));

  console.log(`Results for ${name}:`);
  console.log(`- FCP: ${Math.round(vitals.fcp)} ms`);
  console.log(`- LCP: ${Math.round(vitals.lcp)} ms`);
  console.log(`- CLS: ${vitals.cls.toFixed(4)}`);
  console.log(`- Total Page Load Time: ${loadTime} ms`);
  console.log(`- Total Requests: ${requests.length}`);
  console.log(`- Total Transferred Size: ${Math.round(totalBytes / 1024)} KB (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`- Largest Assets:`);
  topAssets.forEach((a, i) => console.log(`   ${i + 1}. ${a.name}: ${a.sizeKB} KB`));

  await browser.close();

  return {
    name,
    fcp: Math.round(vitals.fcp),
    lcp: Math.round(vitals.lcp),
    cls: vitals.cls,
    loadTime,
    requestsCount: requests.length,
    totalKB: Math.round(totalBytes / 1024),
    topAssets
  };
}

async function runAll() {
  const desktop = await runAudit({ name: 'Desktop (1440x900)' });
  const mobile = await runAudit({
    name: 'Mobile (390x844)',
    viewport: { width: 390, height: 844, isMobile: true }
  });
  const slow4g = await runAudit({
    name: 'Desktop Slow 4G / Throttled',
    throttle: true
  });

  console.log('\n========================================');
  console.log('AUDIT SUMMARY COMPLETE');
  console.log('========================================');
}

runAll().catch(console.error);
