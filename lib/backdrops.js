// Procedural real-time live camera effects: Fish Aquarium, Space Galaxy, Sunset, Cyberpunk, B&W, Film
// Runs at 60 FPS directly on Canvas 2D with zero latency and zero external dependencies

export const EFFECTS = {
  original: {
    id: 'original',
    name: 'Original',
    icon: '✕',
    label: 'Natural Camera',
  },
  fish: {
    id: 'fish',
    name: 'Fish',
    icon: '🐠',
    label: 'Underwater Aquarium',
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
    label: 'Golden Hour',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber',
    icon: '🌆',
    label: 'Retro Synthwave',
  },
  bw: {
    id: 'bw',
    name: 'B & W',
    icon: '🎬',
    label: 'Classic Monochrome',
  },
  film: {
    id: 'film',
    name: 'Film',
    icon: '🎞️',
    label: 'Vintage 90s Film',
  },
};

// Aliases for backwards compatibility with any existing state references
export const BACKDROPS = EFFECTS;

// Animated school of tropical fish with realistic swimming & wagging
const fishList = [
  { x: 0.12, y: 0.22, speed: 0.055, size: 52, dir: 1, type: 'clownfish', phase: 0 },
  { x: 0.78, y: 0.38, speed: 0.042, size: 62, dir: -1, type: 'blueTang', phase: 1.8 },
  { x: 0.42, y: 0.62, speed: 0.048, size: 44, dir: 1, type: 'yellowTang', phase: 3.2 },
  { x: 0.88, y: 0.18, speed: 0.035, size: 56, dir: -1, type: 'angelfish', phase: 4.5 },
  { x: 0.28, y: 0.78, speed: 0.065, size: 38, dir: 1, type: 'clownfish', phase: 2.3 },
  { x: 0.65, y: 0.82, speed: 0.045, size: 42, dir: -1, type: 'yellowTang', phase: 5.1 },
  { x: 0.15, y: 0.48, speed: 0.028, size: 70, dir: 1, type: 'turtle', phase: 0.8 },
];

// Floating air bubbles with sinusoidal wobble
const bubbleList = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 0.047 + 0.02) % 1,
  y: Math.random(),
  speed: 0.07 + (i % 5) * 0.02,
  r: 3 + (i % 4) * 2.5,
  wobbleSpeed: 2 + (i % 3),
}));

// Cosmic stars for Space effect
const starList = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 0.017 + 0.03) % 1,
  y: (i * 0.031 + 0.05) % 1,
  r: 0.8 + (i % 3) * 0.8,
  twinkle: i * 0.7,
}));

/**
 * Main 60 FPS live frame renderer:
 * Composites the camera video and the active effect into targetCanvas seamlessly.
 */
export function renderLiveEffect({
  ctx,
  video,
  w,
  h,
  effect = 'fish',
  time = performance.now() / 1000,
  facing = 'user',
}) {
  if (!ctx || !video || w <= 0 || h <= 0) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw camera video with aspect-ratio cover (no stretching on any screen)
  const vw = video.videoWidth || w;
  const vh = video.videoHeight || h;
  const scale = Math.max(w / vw, h / vh);
  const sw = vw * scale;
  const sh = vh * scale;
  const sx = (w - sw) / 2;
  const sy = (h - sh) / 2;

  ctx.save();
  if (facing === 'user') {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, (w - sw) / 2, sy, sw, sh);
  } else {
    ctx.drawImage(video, sx, sy, sw, sh);
  }
  ctx.restore();

  // 2. Apply selected effect directly over the live camera stream
  if (effect === 'fish') {
    renderLiveFish(ctx, w, h, time);
  } else if (effect === 'space') {
    renderLiveSpace(ctx, w, h, time);
  } else if (effect === 'sunset') {
    renderLiveSunset(ctx, w, h, time);
  } else if (effect === 'cyber') {
    renderLiveCyber(ctx, w, h, time);
  } else if (effect === 'bw') {
    renderLiveBW(ctx, w, h);
  } else if (effect === 'film') {
    renderLiveFilm(ctx, w, h);
  }
}

/**
 * 1. Classic macOS Photo Booth "Fish" Effect
 * Under-water blue color grade + shimmering light caustics + swimming tropical fish + rising bubbles + coral reef
 */
function renderLiveFish(ctx, w, h, t) {
  // A. Underwater Ocean Color Grade (Translucent sea tint over camera)
  ctx.save();
  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, 'rgba(14, 165, 233, 0.22)'); // Sunlit cyan water at top
  ocean.addColorStop(0.35, 'rgba(2, 132, 199, 0.30)'); // Ocean blue mid-water
  ocean.addColorStop(0.8, 'rgba(3, 105, 161, 0.42)');
  ocean.addColorStop(1, 'rgba(7, 89, 133, 0.55)'); // Deep seabed
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // B. Sunlight Caustic Rays rippling from water surface
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
  for (let i = 0; i < 7; i++) {
    const rayX = (w * (i + 0.5)) / 7 + Math.sin(t * 0.9 + i * 1.2) * 28;
    ctx.beginPath();
    ctx.moveTo(rayX - 32, 0);
    ctx.lineTo(rayX + 32, 0);
    ctx.lineTo(rayX + 95, h);
    ctx.lineTo(rayX - 50, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // C. Floating Air Bubbles rising with wobble
  ctx.save();
  for (const b of bubbleList) {
    const by = (((b.y - t * b.speed) % 1) + 1) % 1 * h;
    const bx = (b.x + Math.sin(t * b.wobbleSpeed + b.y * 10) * 0.025) * w;

    // Bubble body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bx, by, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shimmering reflection highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(bx - b.r * 0.32, by - b.r * 0.32, b.r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // D. Swimming Tropical Fish (Foreground & Midground across the screen)
  for (const f of fishList) {
    // Continuous wrapping across screen (-0.15w to 1.15w)
    const fx = (((f.x + t * f.speed * f.dir) % 1.35) + 1.35) % 1.35 - 0.18;
    const fy = f.y * h + Math.sin(t * 2.2 + f.phase) * 14;
    drawFish(ctx, fx * w, fy, f.size, f.dir, f.type, t + f.phase);
  }

  // E. Coral Reef & Swaying Sea Kelp at bottom
  ctx.save();
  // Deep sea floor silhouette
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h - 55, w * 0.5, h - 35);
  ctx.quadraticCurveTo(w * 0.75, h - 15, w, h - 65);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Magenta & Orange Coral branches
  ctx.fillStyle = 'rgba(244, 63, 94, 0.55)';
  ctx.beginPath();
  ctx.arc(w * 0.12, h - 25, 42, 0, Math.PI * 2);
  ctx.arc(w * 0.20, h - 15, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(249, 115, 22, 0.55)';
  ctx.beginPath();
  ctx.arc(w * 0.85, h - 28, 48, 0, Math.PI * 2);
  ctx.arc(w * 0.77, h - 18, 34, 0, Math.PI * 2);
  ctx.fill();

  // Swaying Sea Kelp (Green underwater ribbons)
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (let k = 0; k < 5; k++) {
    const kx = w * (0.04 + k * 0.05);
    const sway = Math.sin(t * 2.5 + k) * 18;
    ctx.beginPath();
    ctx.moveTo(kx, h);
    ctx.quadraticCurveTo(kx + sway * 0.5, h - 60, kx + sway, h - 120);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw individual high-detail tropical fish with animated wagging fins
 */
function drawFish(ctx, x, y, size, dir, type, time) {
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) {
    ctx.scale(-1, 1);
  }

  const wag = Math.sin(time * 8.5) * (size * 0.12);

  if (type === 'clownfish') {
    // Orange Clownfish (Nemo)
    // Body
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.52, size * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // White stripes with black borders
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;

    // Middle stripe
    ctx.beginPath();
    ctx.roundRect(-size * 0.08, -size * 0.29, size * 0.14, size * 0.58, 4);
    ctx.fill();
    ctx.stroke();

    // Head stripe
    ctx.beginPath();
    ctx.roundRect(size * 0.18, -size * 0.25, size * 0.11, size * 0.50, 4);
    ctx.fill();
    ctx.stroke();

    // Tail fin with animated wag
    ctx.fillStyle = '#ea580c';
    ctx.strokeStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-size * 0.46, 0);
    ctx.lineTo(-size * 0.78, -size * 0.28 + wag);
    ctx.lineTo(-size * 0.78, size * 0.28 + wag);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dorsal fin
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.3);
    ctx.quadraticCurveTo(0, -size * 0.48, size * 0.2, -size * 0.28);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size * 0.36, -size * 0.08, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.38, -size * 0.08, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'blueTang') {
    // Royal Blue Tang (Dory)
    // Body
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.54, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black curved pattern
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(-size * 0.05, 0, size * 0.35, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.ellipse(-size * 0.05, 0, size * 0.22, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant Yellow Tail with wag
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.48, 0);
    ctx.lineTo(-size * 0.82, -size * 0.32 + wag);
    ctx.lineTo(-size * 0.72, 0 + wag * 0.5);
    ctx.lineTo(-size * 0.82, size * 0.32 + wag);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size * 0.36, -size * 0.1, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.38, -size * 0.1, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'angelfish') {
    // Striped Angelfish with majestic tall fins
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(size * 0.45, 0);
    ctx.lineTo(-size * 0.35, -size * 0.38);
    ctx.lineTo(-size * 0.35, size * 0.38);
    ctx.closePath();
    ctx.fill();

    // Bold black stripes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-size * 0.05, -size * 0.35, size * 0.12, size * 0.7);
    ctx.fillRect(size * 0.18, -size * 0.22, size * 0.09, size * 0.44);

    // Long trailing dorsal fin
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.35);
    ctx.quadraticCurveTo(-size * 0.3, -size * 0.85, -size * 0.6, -size * 0.75 + wag);
    ctx.stroke();

    // Long ventral fin
    ctx.beginPath();
    ctx.moveTo(-size * 0.05, size * 0.35);
    ctx.quadraticCurveTo(-size * 0.25, size * 0.8, -size * 0.5, size * 0.7 + wag);
    ctx.stroke();

    // Tail fin
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-size * 0.35, 0);
    ctx.lineTo(-size * 0.72, -size * 0.25 + wag);
    ctx.lineTo(-size * 0.72, size * 0.25 + wag);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.32, -size * 0.06, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'turtle') {
    // Gentle Sea Turtle gliding in the background
    ctx.save();
    ctx.globalAlpha = 0.88;

    // Shell
    ctx.fillStyle = '#15803d';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flippers rowing
    const row = Math.sin(time * 3) * (size * 0.2);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(size * 0.2, -size * 0.4 + row, size * 0.3, size * 0.12, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.2, size * 0.4 - row, size * 0.3, size * 0.12, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(size * 0.58, 0, size * 0.16, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.64, -size * 0.04, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Lemon Yellow Tang
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(size * 0.52, 0);
    ctx.lineTo(-size * 0.42, -size * 0.42);
    ctx.lineTo(-size * 0.42, size * 0.42);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.74, -size * 0.22 + wag);
    ctx.lineTo(-size * 0.74, size * 0.22 + wag);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.34, -size * 0.08, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 2. Cosmic Space Effect:
 * Dark nebula wash + twinkling stars + glowing Saturn planet + occasional shooting star
 */
function renderLiveSpace(ctx, w, h, t) {
  ctx.save();
  // Deep cosmic vignette
  const spaceGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.2, w * 0.5, h * 0.5, Math.max(w, h));
  spaceGrad.addColorStop(0, 'rgba(46, 16, 101, 0.28)');
  spaceGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.45)');
  spaceGrad.addColorStop(1, 'rgba(2, 6, 23, 0.7)');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, w, h);

  // Twinkling stars
  for (const s of starList) {
    const twinkle = (Math.sin(t * 3.5 + s.twinkle) + 1) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + twinkle * 0.65})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing Saturn Planet in top right
  const px = w * 0.82;
  const py = h * 0.22;
  const pr = 34;

  const planetGrad = ctx.createLinearGradient(px - pr, py - pr, px + pr, py + pr);
  planetGrad.addColorStop(0, '#fde68a');
  planetGrad.addColorStop(0.7, '#d97706');
  planetGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();

  // Planet rings
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.75)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(px, py, pr * 1.85, pr * 0.45, Math.PI / 6, 0, Math.PI * 2);
  ctx.stroke();

  // Periodic Shooting Star
  const shootCycle = (t * 0.6) % 4; // streaks once every 4 seconds
  if (shootCycle < 0.8) {
    const prog = shootCycle / 0.8;
    const startX = w * 0.1 + prog * (w * 0.5);
    const startY = h * 0.08 + prog * (h * 0.25);
    const starGrad = ctx.createLinearGradient(startX - 60, startY - 30, startX, startY);
    starGrad.addColorStop(0, 'transparent');
    starGrad.addColorStop(1, '#ffffff');
    ctx.strokeStyle = starGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX - 60, startY - 30);
    ctx.lineTo(startX, startY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 3. Golden Hour Sunset Effect:
 * Warm amber/coral wash + radiant sun halo + silhouetted palm branches
 */
function renderLiveSunset(ctx, w, h, t) {
  ctx.save();
  // Warm golden sunset gradient wash
  const sunGrad = ctx.createLinearGradient(0, 0, 0, h);
  sunGrad.addColorStop(0, 'rgba(190, 18, 60, 0.22)');
  sunGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.32)');
  sunGrad.addColorStop(0.8, 'rgba(253, 224, 71, 0.28)');
  sunGrad.addColorStop(1, 'rgba(12, 74, 110, 0.38)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);

  // Radiant Sun Glow in top corner
  const sunX = w * 0.78;
  const sunY = h * 0.24;
  const sunR = Math.min(w, h) * 0.16;

  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 1.8);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  glow.addColorStop(0.4, 'rgba(254, 240, 138, 0.5)');
  glow.addColorStop(0.8, 'rgba(249, 115, 22, 0.3)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Palm Fronds silhouette swaying at left border
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(5, 5, 5, 0.75)';
  const palmSway = Math.sin(t * 1.8) * 8;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.4);
  ctx.quadraticCurveTo(w * 0.18 + palmSway, h * 0.32, w * 0.35 + palmSway, h * 0.38);
  ctx.quadraticCurveTo(w * 0.15 + palmSway, h * 0.38, 0, h * 0.46);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, h * 0.28);
  ctx.quadraticCurveTo(w * 0.22 + palmSway * 0.8, h * 0.2, w * 0.42 + palmSway * 0.8, h * 0.24);
  ctx.quadraticCurveTo(w * 0.18 + palmSway * 0.8, h * 0.26, 0, h * 0.34);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 4. Retro Synthwave Cyberpunk Effect:
 * Neon magenta/cyan gradient + moving perspective grid + glowing sun
 */
function renderLiveCyber(ctx, w, h, t) {
  ctx.save();
  // Magenta/cyan split gradient
  const cyber = ctx.createLinearGradient(0, 0, w, h);
  cyber.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
  cyber.addColorStop(1, 'rgba(6, 182, 212, 0.32)');
  ctx.fillStyle = cyber;
  ctx.fillRect(0, 0, w, h);

  // Moving perspective grid at bottom third
  const horizonY = h * 0.72;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
  ctx.lineWidth = 1.5;

  // Perspective vertical rays
  for (let i = -7; i <= 7; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + i * (w * 0.15), h);
    ctx.stroke();
  }

  // Horizontal moving lines
  const gridOffset = (t * 45) % 25;
  for (let y = horizonY; y < h; y += 16) {
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

/**
 * 5. High-contrast Classic Black & White
 */
function renderLiveBW(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // High contrast vignette
  ctx.globalCompositeOperation = 'multiply';
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.3, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  vig.addColorStop(0, '#ffffff');
  vig.addColorStop(1, '#888888');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * 6. Nostalgic 90s Film Tone:
 * Warm amber sepia + subtle film softness
 */
function renderLiveFilm(ctx, w, h) {
  ctx.save();
  // Warm sepia overlay
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
  ctx.fillRect(0, 0, w, h);

  // Film soft light
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(254, 215, 170, 0.4)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
