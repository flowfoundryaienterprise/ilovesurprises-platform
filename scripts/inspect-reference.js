import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const html = await fetchUrl('https://ilovesuprises.netlify.app/');
  console.log('--- REFERENCE HTML (First 2000 chars) ---');
  console.log(html.slice(0, 2000));
  
  // Find all stylesheet links or inline styles
  const cssMatches = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/g) || [];
  const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/g) || [];
  console.log('--- STYLESHEET LINKS ---', cssMatches);
  console.log('--- SCRIPTS ---', scriptMatches);

  // Extract CSS files if any
  const hrefMatches = html.match(/href=["']([^"']+\.css)["']/g) || [];
  for (const h of hrefMatches) {
    const cssPath = h.replace(/href=["']/, '').replace(/["']/, '');
    const fullCssUrl = cssPath.startsWith('http') ? cssPath : `https://ilovesuprises.netlify.app${cssPath.startsWith('/') ? '' : '/'}${cssPath}`;
    console.log('Fetching CSS:', fullCssUrl);
    try {
      const cssContent = await fetchUrl(fullCssUrl);
      console.log(`--- CSS Content from ${fullCssUrl} (${cssContent.length} bytes) ---`);
      console.log(cssContent.slice(0, 3000));
    } catch (e) {
      console.error('Error fetching css:', e.message);
    }
  }
}

main().catch(console.error);
