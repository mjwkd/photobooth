// Procedural virtual backdrop scenes: Fish, Space, Sunset, Cyber, Clouds

export const BACKDROPS = {
  none: {
    id: 'none',
    name: 'None',
    icon: '✕',
    label: 'Real Background',
  },
  fish: {
    id: 'fish',
    name: 'Fish',
    icon: '🐠',
    label: 'Tropical Aquarium',
  },
  space: {
    id: 'space',
    name: 'Space',
    icon: '🪐',
    label: 'Cosmic Galaxy',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    label: 'Golden Beach',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber',
    icon: '🌆',
    label: 'Retro Synthwave',
  },
  clouds: {
    id: 'clouds',
    name: 'Clouds',
    icon: '☁️',
    label: 'Dreamy Sky',
  },
};

// State for animated elements
const fishList = [
  { x: 0.15, y: 0.28, speed: 0.05, size: 45, dir: 1, type: 'clownfish', phase: 0 },
  { x: 0.75, y: 0.42, speed: 0.038, size: 55, dir: -1, type: 'blueTang', phase: 1.5 },
  { x: 0.40, y: 0.65, speed: 0.045, size: 38, dir: 1, type: 'yellowTang', phase: 3 },
  { x: 0.85, y: 0.22, speed: 0.032, size: 48, dir: -1, type: 'angelFish', phase: 4.2 },
  { x: 0.25, y: 0.80, speed: 0.06, size: 32, dir: 1, type: 'clownfish', phase: 2.1 },
  { x: 0.60, y: 0.18, speed: 0.042, size: 36, dir: 1, type: 'yellowTang', phase: 5.0 },
];

const bubbleList = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random(),
  y: Math.random(),
  speed: 0.06 + Math.random() * 0.08,
  r: 2 + Math.random() * 5,
}));

const starList = Array.from({ length: 65 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.6 + Math.random() * 1.6,
  twinkle: Math.random() * 6,
}));

// Main backdrop render function
export function renderBackdrop(ctx, width, height, time = Date.now() / 1000, backdropId = 'fish') {
  if (backdropId === 'fish') {
    renderFishAquarium(ctx, width, height, time);
  } else if (backdropId === 'space') {
    renderSpace(ctx, width, height, time);
  } else if (backdropId === 'sunset') {
    renderSunset(ctx, width, height, time);
  } else if (backdropId === 'cyber') {
    renderCyber(ctx, width, height, time);
  } else if (backdropId === 'clouds') {
    renderClouds(ctx, width, height, time);
  }
}

// 1. Classic "Fish" Underwater Backdrop (Matches macOS Photo Booth)
function renderFishAquarium(ctx, w, h, t) {
  // Deep underwater ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#0284c7'); // Bright sunlight top water
  oceanGrad.addColorStop(0.25, '#0369a1');
  oceanGrad.addColorStop(0.65, '#075985');
  oceanGrad.addColorStop(1, '#082f49'); // Deep sea bottom
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Sunlight caustic light rays from surface
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#bae6fd';
  for (let i = 0; i < 6; i++) {
    const rayX = (w * (i + 0.5)) / 6 + Math.sin(t * 0.8 + i) * 25;
    ctx.beginPath();
    ctx.moveTo(rayX - 35, 0);
    ctx.lineTo(rayX + 35, 0);
    ctx.lineTo(rayX + 110, h);
    ctx.lineTo(rayX - 40, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Floating ambient bubbles
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  for (const b of bubbleList) {
    const by = ((b.y - t * b.speed) % 1 + 1) % 1 * h;
    const bx = (b.x + Math.sin(t * 2 + b.y * 10) * 0.02) * w;
    ctx.beginPath();
    ctx.arc(bx, by, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Swimming tropical fish
  for (const f of fishList) {
    const fx = (((f.x + t * f.speed * f.dir) % 1.3) + 1.3) % 1.3 - 0.15;
    const fy = f.y * h + Math.sin(t * 2 + f.phase) * 12;
    drawFish(ctx, fx * w, fy, f.size, f.dir, f.type, t + f.phase);
  }

  // Coral reef and seaweed at bottom
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h - 70, w * 0.5, h - 45);
  ctx.quadraticCurveTo(w * 0.75, h - 20, w, h - 85);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Colorful coral silhouettes
  ctx.fillStyle = 'rgba(225, 29, 72, 0.45)';
  ctx.beginPath();
  ctx.arc(w * 0.15, h - 30, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(234, 88, 12, 0.5)';
  ctx.beginPath();
  ctx.arc(w * 0.82, h - 40, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFish(ctx, x, y, size, dir, type, time) {
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) {
    ctx.scale(-1, 1);
  }

  const wag = Math.sin(time * 8) * 4;

  if (type === 'clownfish') {
    // Orange Clownfish with white stripes
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // White stripes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-size * 0.08, -size * 0.28, size * 0.12, size * 0.56);
    ctx.fillRect(size * 0.18, -size * 0.24, size * 0.10, size * 0.48);

    // Tail with wag
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, 0);
    ctx.lineTo(-size * 0.75, -size * 0.25 + wag);
    ctx.lineTo(-size * 0.75, size * 0.25 + wag);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.35, -size * 0.08, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'blueTang') {
    // Royal Blue Tang (Dory)
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.55, size * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yellow tail and fins
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-size * 0.48, 0);
    ctx.lineTo(-size * 0.8, -size * 0.3 + wag);
    ctx.lineTo(-size * 0.8, size * 0.3 + wag);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.38, -size * 0.08, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Yellow Tang
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(size * 0.5, 0);
    ctx.lineTo(-size * 0.4, -size * 0.4);
    ctx.lineTo(-size * 0.4, size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-size * 0.38, 0);
    ctx.lineTo(-size * 0.7, -size * 0.2 + wag);
    ctx.lineTo(-size * 0.7, size * 0.2 + wag);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.32, -size * 0.08, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 2. Cosmic Space Backdrop
function renderSpace(ctx, w, h, t) {
  // Deep space background
  const spaceGrad = ctx.createRadialGradient(w * 0.6, h * 0.4, 20, w * 0.5, h * 0.5, Math.max(w, h));
  spaceGrad.addColorStop(0, '#2e1065');
  spaceGrad.addColorStop(0.4, '#0f172a');
  spaceGrad.addColorStop(1, '#020617');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, w, h);

  // Purple/magenta nebula clouds
  ctx.save();
  ctx.globalAlpha = 0.25;
  const nebGrad = ctx.createRadialGradient(w * 0.3, h * 0.3, 10, w * 0.3, h * 0.3, w * 0.5);
  nebGrad.addColorStop(0, '#d946ef');
  nebGrad.addColorStop(0.5, '#7c3aed');
  nebGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = nebGrad;
  ctx.beginPath();
  ctx.arc(w * 0.3, h * 0.3, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Twinkling stars
  ctx.save();
  for (const s of starList) {
    const twinkle = (Math.sin(t * 3 + s.twinkle) + 1) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Saturn Planet
  const px = w * 0.82;
  const py = h * 0.22;
  const pr = 36;

  // Planet body
  const planetGrad = ctx.createLinearGradient(px - pr, py - pr, px + pr, py + pr);
  planetGrad.addColorStop(0, '#fde68a');
  planetGrad.addColorStop(0.7, '#d97706');
  planetGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();

  // Planet rings
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(px, py, pr * 1.8, pr * 0.45, Math.PI / 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// 3. Sunset Beach Backdrop
function renderSunset(ctx, w, h, t) {
  const sunGrad = ctx.createLinearGradient(0, 0, 0, h);
  sunGrad.addColorStop(0, '#4c0519');
  sunGrad.addColorStop(0.35, '#be123c');
  sunGrad.addColorStop(0.65, '#f97316');
  sunGrad.addColorStop(0.85, '#fde047');
  sunGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);

  // Big Glowing Sun
  const sunY = h * 0.65;
  const sunX = w * 0.5;
  const sunR = Math.min(w, h) * 0.16;

  const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2);
  sunGlow.addColorStop(0, '#ffffff');
  sunGlow.addColorStop(0.3, '#fef08a');
  sunGlow.addColorStop(0.6, '#f97316');
  sunGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2, 0, Math.PI * 2);
  ctx.fill();

  // Ocean reflection
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, sunY + sunR * 0.3, w, h - (sunY + sunR * 0.3));

  // Sun trail on water
  ctx.save();
  ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
  for (let i = 0; i < 10; i++) {
    const yLine = sunY + sunR * 0.4 + i * 14;
    const waveW = (10 - i) * 16 + Math.sin(t * 3 + i) * 12;
    ctx.fillRect(sunX - waveW / 2, yLine, waveW, 3);
  }

  // Palm tree silhouette on left
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h);
  ctx.quadraticCurveTo(w * 0.12, h * 0.6, w * 0.18, h * 0.4);
  ctx.lineTo(w * 0.19, h * 0.4);
  ctx.quadraticCurveTo(w * 0.14, h * 0.6, w * 0.11, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 4. Retro 80s Cyber Synthwave
function renderCyber(ctx, w, h, t) {
  // Dark purple sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#0f051d');
  skyGrad.addColorStop(0.7, '#2e1065');
  skyGrad.addColorStop(1, '#ec4899');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.65);

  // Retro Wireframe Sun
  const sunX = w * 0.5;
  const sunY = h * 0.55;
  const sunR = 80;

  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, '#fde047');
  sunGrad.addColorStop(0.5, '#f43f5e');
  sunGrad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI, true);
  ctx.fill();

  // Horizon floor
  ctx.fillStyle = '#090014';
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Perspective grid
  ctx.save();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.5;
  const horizonY = h * 0.65;

  // Vertical perspective rays
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + i * (w * 0.14), h);
    ctx.stroke();
  }

  // Horizontal moving grid lines
  const gridOffset = (t * 40) % 30;
  for (let y = horizonY; y < h; y += 18) {
    const prog = (y - horizonY) / (h - horizonY);
    const lineY = horizonY + Math.pow(prog, 1.8) * (h - horizonY) + gridOffset * prog;
    if (lineY <= h) {
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(w, lineY);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 5. Dreamy Clouds & Sky
function renderClouds(ctx, w, h, t) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#38bdf8');
  skyGrad.addColorStop(0.7, '#7dd3fc');
  skyGrad.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Floating fluffy clouds
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

  function drawCloud(cx, cy, scale) {
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 30 * scale, cy - 15 * scale, 45 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 70 * scale, cy - 5 * scale, 38 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 100 * scale, cy + 10 * scale, 30 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  const c1X = (((w * 0.1 + t * 15) % (w + 200)) - 100);
  drawCloud(c1X, h * 0.25, 0.9);

  const c2X = (((w * 0.6 + t * 22) % (w + 250)) - 120);
  drawCloud(c2X, h * 0.45, 1.2);

  const c3X = (((w * 0.3 + t * 10) % (w + 180)) - 80);
  drawCloud(c3X, h * 0.72, 0.7);

  ctx.restore();
}
