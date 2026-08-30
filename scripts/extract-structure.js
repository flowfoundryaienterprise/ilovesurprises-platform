import fs from 'fs';
import path from 'path';

const htmlPath = path.join(process.cwd(), 'scripts', 'reference.html');
const content = fs.readFileSync(htmlPath, 'utf8');

// Extract style
const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
if (styleMatch) {
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'reference.css'), styleMatch[1]);
  console.log('Saved reference.css, length:', styleMatch[1].length);
}

// Remove base64 images to make HTML clean
const cleanHtml = content
  .replace(/src="data:image\/[^"]+"/g, 'src="[BASE64_IMAGE]"')
  .replace(/srcset="[^"]+"/g, 'srcset="[SRCSET]"')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '<style>/* Extracted to reference.css */</style>');

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'clean_reference.html'), cleanHtml);
console.log('Saved clean_reference.html, length:', cleanHtml.length);
