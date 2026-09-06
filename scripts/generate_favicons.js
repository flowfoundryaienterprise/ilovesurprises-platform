import fs from 'fs';
import zlib from 'zlib';

function decodePNG(buf) {
  let pos = 8;
  const idats = [];
  let width = 0;
  let height = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') {
      idats.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }

  let srcPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[srcPos++];
    const rowStart = y * stride;
    const prevRowStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const b = raw[srcPos++];
      const left = x >= bpp ? pixels[rowStart + x - bpp] : 0;
      const up = y > 0 ? pixels[prevRowStart + x] : 0;
      const upleft = (y > 0 && x >= bpp) ? pixels[prevRowStart + x - bpp] : 0;
      let val = 0;
      if (filter === 0) val = b;
      else if (filter === 1) val = (b + left) & 0xff;
      else if (filter === 2) val = (b + up) & 0xff;
      else if (filter === 3) val = (b + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) val = (b + paeth(left, up, upleft)) & 0xff;
      pixels[rowStart + x] = val;
    }
  }
  return { width, height, pixels };
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    crc32.table = table;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function encodePNG(width, height, rgbaBuffer) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(crc32(ihdrChunk.subarray(4, 21)), 21);

  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));
  let rawPos = 0;
  for (let y = 0; y < height; y++) {
    rawData[rawPos++] = 0;
    rgbaBuffer.copy(rawData, rawPos, y * stride, (y + 1) * stride);
    rawPos += stride;
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(crc32(idatChunk.subarray(4, 8 + compressed.length)), 8 + compressed.length);

  const iendChunk = Buffer.alloc(4 + 4 + 0 + 4);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4);
  iendChunk.writeUInt32BE(crc32(Buffer.from('IEND')), 8);

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function encodeICO(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  const imageBuffers = [];

  for (const item of entries) {
    const entry = Buffer.alloc(16);
    entry[0] = item.size >= 256 ? 0 : item.size;
    entry[1] = item.size >= 256 ? 0 : item.size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    imageBuffers.push(item.png);
    offset += item.png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

const { width: srcW, height: srcH, pixels: srcPixels } = decodePNG(fs.readFileSync('public/assets/ilovesurprises/logo/logo-ultra-hd.png'));
const heartMinX = 906;
const heartMaxX = 1462;
const heartMinY = 370;
const heartMaxY = 750;
const heartW = heartMaxX - heartMinX + 1;
const heartH = heartMaxY - heartMinY + 1;

function renderHeartCanvas(canvasSize) {
  const outBuf = Buffer.alloc(canvasSize * canvasSize * 4);
  const targetW = Math.round(canvasSize * 0.88);
  const scale = targetW / heartW;
  const targetH = Math.round(heartH * scale);
  const dstX0 = Math.round((canvasSize - targetW) / 2);
  const dstY0 = Math.round((canvasSize - targetH) / 2);

  function getCleanRGBA(x, y) {
    if (x < heartMinX || x > heartMaxX || y < heartMinY || y > heartMaxY) return [0, 0, 0, 0];
    const i = (y * srcW + x) * 4;
    const r = srcPixels[i];
    const a = srcPixels[i + 3];
    if (a < 15 || (a < 120 && r < 120)) return [0, 0, 0, 0];
    if (a > 240) return [211, 9, 21, 255];
    return [211, 9, 21, a];
  }

  for (let dy = 0; dy < canvasSize; dy++) {
    for (let dx = 0; dx < canvasSize; dx++) {
      if (dx < dstX0 || dx >= dstX0 + targetW || dy < dstY0 || dy >= dstY0 + targetH) continue;
      const sx = heartMinX + (dx - dstX0 + 0.5) / scale - 0.5;
      const sy = heartMinY + (dy - dstY0 + 0.5) / scale - 0.5;

      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y0 = Math.floor(sy);
      const y1 = Math.min(y0 + 1, srcH - 1);
      const fx = sx - x0;
      const fy = sy - y0;

      const p00 = getCleanRGBA(x0, y0);
      const p10 = getCleanRGBA(x1, y0);
      const p01 = getCleanRGBA(x0, y1);
      const p11 = getCleanRGBA(x1, y1);

      const a00 = p00[3] / 255;
      const a10 = p10[3] / 255;
      const a01 = p01[3] / 255;
      const a11 = p11[3] / 255;
      const topA = a00 * (1 - fx) + a10 * fx;
      const botA = a01 * (1 - fx) + a11 * fx;
      const interpA = topA * (1 - fy) + botA * fy;

      if (interpA <= 0.005) continue;

      const outIdx = (dy * canvasSize + dx) * 4;
      outBuf[outIdx] = 211;
      outBuf[outIdx + 1] = 9;
      outBuf[outIdx + 2] = 21;
      outBuf[outIdx + 3] = Math.min(255, Math.max(0, Math.round(interpA * 255)));
    }
  }
  return outBuf;
}

// 1. Generate 512x512 PNG
const buf512 = renderHeartCanvas(512);
const png512 = encodePNG(512, 512, buf512);
fs.writeFileSync('public/favicon.png', png512);
fs.writeFileSync('public/logo.png', png512);
console.log('Written public/favicon.png and public/logo.png:', png512.length, 'bytes');

// 2. Generate multi-resolution ICO
const icoSizes = [16, 32, 48, 64, 128, 256];
const icoEntries = icoSizes.map((sz) => ({
  size: sz,
  png: encodePNG(sz, sz, renderHeartCanvas(sz)),
}));
const icoBuf = encodeICO(icoEntries);
fs.writeFileSync('public/favicon.ico', icoBuf);
console.log('Written public/favicon.ico:', icoBuf.length, 'bytes');

// 3. Update public/favicon.svg with the exact brand heart
const base64Png = png512.toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,${base64Png}" />
</svg>
`;
fs.writeFileSync('public/favicon.svg', svgContent);
console.log('Written public/favicon.svg');

// Remove test file if exists
if (fs.existsSync('public/test_favicon512.png')) {
  fs.unlinkSync('public/test_favicon512.png');
}
