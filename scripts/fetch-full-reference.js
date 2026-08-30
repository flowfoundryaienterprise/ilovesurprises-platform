import https from 'https';
import fs from 'fs';
import path from 'path';

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
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'reference.html'), html);
  console.log('Saved reference.html, size:', html.length);
}

main().catch(console.error);
