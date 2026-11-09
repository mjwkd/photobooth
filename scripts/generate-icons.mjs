import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function makePng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const full = Buffer.concat([typeBuf, data]);
    let c = 0xffffffff;
    for (let i = 0; i < full.length; i++) {
      c ^= full[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    crcBuf.writeInt32BE(~c, 0);
    return Buffer.concat([len, full, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderBoothIconPixel(x, y, w, h) {
  // Normalize coordinates from -1 to 1
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Squircle rounded background for iOS icon
  const rBg = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);
  if (rBg > 1.05) {
    return [0, 0, 0, 0]; // Transparent outside icon squircle
  }

  // Base background: sleek dark metallic gradient
  const grad = (ny + 1) * 0.5;
  let r = Math.round(28 - grad * 16);
  let g = Math.round(28 - grad * 16);
  let b = Math.round(34 - grad * 18);
  let a = 255;

  // Distance from center for camera lens
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Outer camera ring
  if (dist < 0.65 && dist >= 0.58) {
    // Silver metallic bezel
    const angle = Math.atan2(ny, nx);
    const spec = Math.sin(angle * 2) * 25;
    r = Math.min(255, 180 + spec);
    g = Math.min(255, 185 + spec);
    b = Math.min(255, 195 + spec);
  } else if (dist < 0.58 && dist >= 0.52) {
    // Dark groove
    r = 15; g = 15; b = 18;
  } else if (dist < 0.52 && dist >= 0.20) {
    // Deep blue glass lens with reflection
    const glDist = Math.sqrt(Math.pow(nx + 0.15, 2) + Math.pow(ny + 0.15, 2));
    const glare = Math.max(0, 1 - glDist * 2.5) * 80;
    r = Math.min(255, Math.round(20 + glare * 0.5));
    g = Math.min(255, Math.round(35 + glare * 0.8));
    b = Math.min(255, Math.round(65 + glare * 1.4));
  } else if (dist < 0.20) {
    // Aperture inner core / bright iris
    const coreGrad = (0.20 - dist) / 0.20;
    r = Math.round(240 * coreGrad + 15);
    g = Math.round(240 * coreGrad + 20);
    b = Math.round(255 * coreGrad + 35);
  }

  // Flash indicator at top right (nx ~ 0.45, ny ~ -0.45)
  const flashDist = Math.sqrt(Math.pow(nx - 0.48, 2) + Math.pow(ny + 0.48, 2));
  if (flashDist < 0.12) {
    if (flashDist < 0.08) {
      r = 255; g = 215; b = 80; // warm flash gold
    } else {
      r = 70; g = 70; b = 80; // bezel
    }
  }

  // 4 photobooth indicator dots at bottom (film strip dots)
  // ny ~ 0.65, nx = -0.3, -0.1, 0.1, 0.3
  if (Math.abs(ny - 0.72) < 0.06) {
    const dotXs = [-0.36, -0.12, 0.12, 0.36];
    for (const dx of dotXs) {
      if (Math.sqrt(Math.pow(nx - dx, 2) + Math.pow(ny - 0.72, 2)) < 0.05) {
        r = 255; g = 255; b = 255; a = 255;
      }
    }
  }

  return [Math.round(r), Math.round(g), Math.round(b), a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
console.log('Generating icon-192.png...');
const icon192 = makePng(192, 192, renderBoothIconPixel);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

// Generate 512x512
console.log('Generating icon-512.png...');
const icon512 = makePng(512, 512, renderBoothIconPixel);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

// Generate apple-touch-icon.png (180x180)
console.log('Generating apple-touch-icon.png...');
const iconApple = makePng(180, 180, renderBoothIconPixel);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconApple);

// Generate favicon.ico (32x32 png)
const favicon = makePng(32, 32, renderBoothIconPixel);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

// Also generate SVG version
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="lensGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="40%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#090d16"/>
    </radialGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="50%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="160" fill="url(#ringGrad)"/>
  <circle cx="256" cy="256" r="140" fill="#0f172a"/>
  <circle cx="256" cy="256" r="120" fill="url(#lensGrad)"/>
  <circle cx="210" cy="210" r="30" fill="white" opacity="0.35"/>
  <circle cx="390" cy="120" r="24" fill="#fbbf24"/>
  <circle cx="390" cy="120" r="18" fill="#fef08a"/>
  <circle cx="160" cy="430" r="12" fill="white"/>
  <circle cx="224" cy="430" r="12" fill="white"/>
  <circle cx="288" cy="430" r="12" fill="white"/>
  <circle cx="352" cy="430" r="12" fill="white"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('All icons generated successfully!');
