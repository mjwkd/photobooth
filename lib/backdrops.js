// iOS Emoji Live Camera Effects: 🐠 Ocean Emoji, 💖 Y2K Sparkle, 🪐 Space Galaxy, 🌴 Tropical Sunset, B&W, Film
// Hardware-accelerated 60 FPS Canvas rendering using authentic Apple Color Emojis

export const EFFECTS = {
  original: {
    id: 'original',
    name: 'Original',
    icon: '✕',
    label: 'Natural Camera',
  },
  fish: {
    id: 'fish',
    name: 'Fish Emoji',
    icon: '🐠',
    label: 'iOS Ocean Aquarium',
  },
  y2k: {
    id: 'y2k',
    name: 'Y2K Emoji',
    icon: '💖',
    label: 'iOS Y2K & Sparkles',
  },
  space: {
    id: 'space',
    name: 'Space Emoji',
    icon: '🪐',
    label: 'iOS Cosmic Galaxy',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Emoji',
    icon: '🌴',
    label: 'iOS Tropical Sunset',
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

/**
 * Helper to draw authentic iOS Emoji stickers with drop shadows, scaling, rotation, and flipping.
 */
function drawEmojiSticker(ctx, emoji, x, y, size, options = {}) {
  const {
    flipX = false,
    rotation = 0,
    scaleX = 1,
    scaleY = 1,
    opacity = 1,
    shadow = true,
  } = options;

  ctx.save();
  ctx.translate(x, y);

  if (rotation) {
    ctx.rotate(rotation);
  }

  if (flipX) {
    ctx.scale(-scaleX, scaleY);
  } else {
    ctx.scale(scaleX, scaleY);
  }

  if (opacity < 1) {
    ctx.globalAlpha *= opacity;
  }

  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
    ctx.shadowBlur = Math.round(size * 0.18);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.round(size * 0.10);
  }

  // Native Apple Color Emoji font stack with system fallbacks
  ctx.font = `${Math.round(size)}px "Apple Color Emoji", "SF Pro", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);

  ctx.restore();
}

// ----------------------------------------------------
// 1. iOS Fish / Ocean Emoji Simulation State
// ----------------------------------------------------
const oceanEmojiFish = [
  // Tropical fish 🐠 (large, swims left to right)
  { emoji: '🐠', x: 0.10, y: 0.28, speed: 0.052, size: 68, dir: 1, wagSpeed: 3.8, wagAmp: 14, phase: 0 },
  // Tropical fish 🐠 (medium baby fish, swimming slightly faster)
  { emoji: '🐠', x: 0.35, y: 0.36, speed: 0.062, size: 48, dir: 1, wagSpeed: 4.5, wagAmp: 10, phase: 1.2 },
  // Blue fish 🐟 (swims right to left)
  { emoji: '🐟', x: 0.85, y: 0.18, speed: 0.046, size: 58, dir: -1, wagSpeed: 4.0, wagAmp: 12, phase: 2.1 },
  // Cute blowfish 🐡 (puffs up and down as it swims)
  { emoji: '🐡', x: 0.50, y: 0.58, speed: 0.038, size: 64, dir: 1, wagSpeed: 2.6, wagAmp: 8, phase: 3.5, isBlowfish: true },
  // Friendly Shark 🦈 (deep water background swimmer)
  { emoji: '🦈', x: 0.90, y: 0.74, speed: 0.032, size: 84, dir: -1, wagSpeed: 2.2, wagAmp: 6, phase: 4.8, opacity: 0.88 },
  // Dolphin 🐬 (arching across the upper waters)
  { emoji: '🐬', x: 0.18, y: 0.12, speed: 0.065, size: 74, dir: 1, wagSpeed: 3.0, wagAmp: 16, phase: 5.5, isDolphin: true },
];

// Rising Apple Bubble Emojis 🫧
const emojiBubbleList = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 0.056 + 0.03) % 1,
  y: Math.random(),
  speed: 0.065 + (i % 5) * 0.022,
  size: 26 + (i % 4) * 9,
  wobbleSpeed: 2.2 + (i % 3) * 0.8,
  wobbleAmp: 15 + (i % 3) * 8,
}));

// ----------------------------------------------------
// 2. iOS Y2K Sparkle & Angel Emoji Simulation State
// ----------------------------------------------------
const y2kEmojiList = [
  { emoji: '✨', x: 0.15, y: 0.18, size: 48, speed: 0.02, phase: 0 },
  { emoji: '💖', x: 0.82, y: 0.22, size: 54, speed: 0.03, phase: 1.5, pulse: true },
  { emoji: '🌸', x: 0.22, y: 0.72, size: 50, speed: 0.025, phase: 2.8, drift: true },
  { emoji: '🎀', x: 0.08, y: 0.08, size: 62, phase: 0, staticCorner: true },
  { emoji: '🎀', x: 0.92, y: 0.08, size: 62, phase: 0, staticCorner: true, flipX: true },
  { emoji: '🧚‍♀️', x: 0.85, y: 0.45, size: 58, speed: 0.035, phase: 4.1 },
  { emoji: '🧸', x: 0.12, y: 0.88, size: 64, phase: 0 },
  { emoji: '🍒', x: 0.88, y: 0.86, size: 52, phase: 1.8 },
  { emoji: '🧁', x: 0.50, y: 0.90, size: 48, phase: 3.2 },
  { emoji: '💫', x: 0.40, y: 0.12, size: 46, speed: 0.04, phase: 2.2 },
];

// Floating pastel sparkles for Y2K
const y2kFloatingSparkles = Array.from({ length: 15 }, (_, i) => ({
  x: (i * 0.068 + 0.05) % 1,
  y: Math.random(),
  speed: 0.04 + (i % 4) * 0.015,
  size: 24 + (i % 3) * 8,
  emoji: ['✨', '🌸', '🤍', '⭐'][i % 4],
}));

// ----------------------------------------------------
// 3. iOS Space Galaxy Emoji Simulation State
// ----------------------------------------------------
const spaceEmojiList = [
  { emoji: '🪐', x: 0.82, y: 0.18, size: 76, rotationSpeed: 0.05 },
  { emoji: '🚀', x: 0.20, y: 0.26, size: 66, speed: 0.045, dir: 1, angle: -0.3 },
  { emoji: '🛸', x: 0.15, y: 0.55, size: 62, speed: 0.028, dir: 1 },
  { emoji: '🌙', x: 0.48, y: 0.10, size: 52 },
  { emoji: '👾', x: 0.85, y: 0.70, size: 54 },
  { emoji: '👽', x: 0.14, y: 0.84, size: 58 },
  { emoji: '☄️', x: 0.70, y: 0.38, size: 48 },
];

const spaceTwinkleStars = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 0.055 + 0.04) % 1,
  y: (i * 0.052 + 0.05) % 1,
  size: 22 + (i % 3) * 6,
  emoji: ['⭐️', '🌟', '✨'][i % 3],
  phase: i * 0.8,
}));

/**
 * Main 60 FPS live frame renderer:
 * Composites the camera video and the active iOS emoji effect into targetCanvas seamlessly.
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

  // 1. Draw camera video with aspect-ratio cover (no distortion on any screen)
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

  // 2. Render the chosen iOS Emoji effect over the live camera feed
  if (effect === 'fish') {
    renderIOSEmojiFish(ctx, w, h, time);
  } else if (effect === 'y2k') {
    renderIOSEmojiY2K(ctx, w, h, time);
  } else if (effect === 'space') {
    renderIOSEmojiSpace(ctx, w, h, time);
  } else if (effect === 'sunset') {
    renderIOSEmojiSunset(ctx, w, h, time);
  } else if (effect === 'cyber') {
    renderLiveCyber(ctx, w, h, time);
  } else if (effect === 'bw') {
    renderLiveBW(ctx, w, h);
  } else if (effect === 'film') {
    renderLiveFilm(ctx, w, h);
  }
}

/**
 * 🐠 1. Authentic iOS Fish & Ocean Emoji Effect
 * Full of iconic Apple Emojis: 🐠 🐟 🐡 🦈 🪼 🐙 🐬 🦀 🫧 🪸
 * With swimming physics, directional flipping, pulsing jellyfish, and floating bubbles!
 */
function renderIOSEmojiFish(ctx, w, h, t) {
  // A. Atmospheric Underwater Ocean Tint (Translucent blue/cyan wash)
  ctx.save();
  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, 'rgba(14, 165, 233, 0.20)'); // Bright sunlit surface
  ocean.addColorStop(0.4, 'rgba(2, 132, 199, 0.28)'); // Mid ocean blue
  ocean.addColorStop(0.8, 'rgba(3, 105, 161, 0.38)');
  ocean.addColorStop(1, 'rgba(7, 89, 133, 0.50)'); // Deep seabed
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // B. Sunlight Caustic Rays shimmering from the water surface
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(186, 230, 253, 0.18)';
  for (let i = 0; i < 7; i++) {
    const rayX = (w * (i + 0.5)) / 7 + Math.sin(t * 0.9 + i * 1.3) * 26;
    ctx.beginPath();
    ctx.moveTo(rayX - 30, 0);
    ctx.lineTo(rayX + 30, 0);
    ctx.lineTo(rayX + 90, h);
    ctx.lineTo(rayX - 45, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // C. Rising Apple Bubble Emojis 🫧 (Floating up with sinusoidal wobble)
  for (const b of emojiBubbleList) {
    const by = (((b.y - t * b.speed) % 1) + 1) % 1 * h;
    const bx = b.x * w + Math.sin(t * b.wobbleSpeed + b.y * 10) * b.wobbleAmp;
    drawEmojiSticker(ctx, '🫧', bx, by, b.size, {
      opacity: 0.88,
      shadow: true,
    });
  }

  // D. Pulsing & Drifting Jellyfish Emojis 🪼
  // Jellyfish 1 (left mid-water)
  const j1Y = (((0.85 - t * 0.038) % 1) + 1) % 1 * h;
  const j1X = w * (0.18 + Math.sin(t * 1.6) * 0.04);
  const j1Pulse = Math.sin(t * 3.8);
  drawEmojiSticker(ctx, '🪼', j1X, j1Y, 58, {
    scaleX: 1 + j1Pulse * 0.14,
    scaleY: 1 - j1Pulse * 0.10,
    rotation: Math.sin(t * 1.8) * 0.08,
  });

  // Jellyfish 2 (right upper-water)
  const j2Y = (((0.65 - t * 0.045) % 1) + 1) % 1 * h;
  const j2X = w * (0.84 + Math.sin(t * 1.9 + 1.5) * 0.035);
  const j2Pulse = Math.sin(t * 4.2 + 1);
  drawEmojiSticker(ctx, '🪼', j2X, j2Y, 46, {
    scaleX: 1 + j2Pulse * 0.14,
    scaleY: 1 - j2Pulse * 0.10,
    rotation: Math.sin(t * 2.0 + 1) * 0.08,
  });

  // E. Cute Octopus Emoji 🐙 (Floating & bobbing in mid-left)
  const octX = w * (0.13 + Math.sin(t * 1.5) * 0.03);
  const octY = h * 0.44 + Math.sin(t * 2.4) * 12;
  const octRot = Math.sin(t * 2.0) * 0.12;
  drawEmojiSticker(ctx, '🐙', octX, octY, 56, {
    rotation: octRot,
  });

  // F. Swimming Fish Emojis: 🐠 🐟 🐡 🦈 🐬
  // (In Apple Color Emoji, fish face LEFT by default.
  //  So when dir > 0 (moving right), flipX: true flips them to face RIGHT!)
  for (const f of oceanEmojiFish) {
    const fx = (((f.x + t * f.speed * f.dir) % 1.4) + 1.4) % 1.4 - 0.2;
    const bob = Math.sin(t * f.wagSpeed + f.phase) * f.wagAmp;
    const fy = f.y * h + bob;
    const tilt = (bob / f.wagAmp) * 0.10 * f.dir;

    let scaleX = 1;
    let scaleY = 1;

    // Blowfish 🐡 periodically puffs up bigger!
    if (f.isBlowfish) {
      const puff = Math.max(0, Math.sin(t * 2.2));
      scaleX = 1 + puff * 0.28;
      scaleY = 1 + puff * 0.28;
    }

    // Dolphin 🐬 arches across water
    if (f.isDolphin) {
      scaleX = 1.05;
      scaleY = 1.05;
    }

    drawEmojiSticker(ctx, f.emoji, fx * w, fy, f.size, {
      flipX: f.dir > 0, // Faces forward in swimming direction
      rotation: tilt,
      scaleX,
      scaleY,
      opacity: f.opacity || 1,
    });
  }

  // G. Bottom Coral Reef Emojis 🪸 & Scuttling Crab 🦀
  // Corals rooted at bottom corners swaying gently
  const coralSway1 = Math.sin(t * 1.8) * 0.08;
  const coralSway2 = Math.sin(t * 1.8 + 1) * 0.08;

  // Left Coral 🪸
  drawEmojiSticker(ctx, '🪸', w * 0.09, h - 38, 76, {
    rotation: coralSway1,
  });
  // Right Coral 🪸
  drawEmojiSticker(ctx, '🪸', w * 0.90, h - 38, 72, {
    rotation: -coralSway2,
  });
  // Mid-left small coral 🪸
  drawEmojiSticker(ctx, '🪸', w * 0.24, h - 26, 48, {
    rotation: coralSway2,
  });

  // Cute Little Crab 🦀 scuttling back and forth along bottom
  const crabX = w * (0.55 + Math.sin(t * 1.4) * 0.22);
  const crabWiggle = Math.sin(t * 8) * 0.08;
  drawEmojiSticker(ctx, '🦀', crabX, h - 28, 46, {
    rotation: crabWiggle,
  });
}

/**
 * 💖 2. Authentic iOS Y2K Sparkle & Angel Emoji Effect
 * Emojis: ✨ 💖 🌸 🎀 🧚‍♀️ 🧸 🍒 🧁 💫
 * Girly, dreamy, nostalgic Instagram sticker aesthetic
 */
function renderIOSEmojiY2K(ctx, w, h, t) {
  // Soft dreamy pastel pink/rose gradient tint
  ctx.save();
  const y2kGrad = ctx.createLinearGradient(0, 0, 0, h);
  y2kGrad.addColorStop(0, 'rgba(251, 207, 232, 0.22)'); // Soft rose
  y2kGrad.addColorStop(0.5, 'rgba(244, 114, 182, 0.26)');
  y2kGrad.addColorStop(1, 'rgba(192, 132, 252, 0.32)'); // Lavender
  ctx.fillStyle = y2kGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Floating ambient sparkles & blossoms
  for (const s of y2kFloatingSparkles) {
    const sy = (((s.y + t * s.speed) % 1) + 1) % 1 * h;
    const sx = s.x * w + Math.sin(t * 2 + s.y * 10) * 16;
    const rot = Math.sin(t * 2 + s.x * 5) * 0.2;
    drawEmojiSticker(ctx, s.emoji, sx, sy, s.size, {
      opacity: 0.85,
      rotation: rot,
    });
  }

  // Animated Y2K Emojis
  for (const item of y2kEmojiList) {
    if (item.staticCorner) {
      // Pink ribbon bows 🎀 at top corners
      const ribbonBob = Math.sin(t * 2 + item.phase) * 3;
      drawEmojiSticker(ctx, item.emoji, item.x * w, item.y * h + ribbonBob, item.size, {
        flipX: item.flipX || false,
        rotation: Math.sin(t * 1.5) * 0.05,
      });
      continue;
    }

    let scale = 1;
    if (item.pulse) {
      // Pulsing sparkling heart 💖
      scale = 1 + Math.sin(t * 4) * 0.16;
    }

    const bob = Math.sin(t * 2.5 + item.phase) * 10;
    const rot = Math.sin(t * 2.0 + item.phase) * 0.12;

    drawEmojiSticker(ctx, item.emoji, item.x * w, item.y * h + bob, item.size, {
      scaleX: scale,
      scaleY: scale,
      rotation: rot,
    });
  }
}

/**
 * 🪐 3. Authentic iOS Space Galaxy Emoji Effect
 * Emojis: 🪐 🚀 🛸 ⭐️ 🌟 🌙 ☄️ 👾 👽
 */
function renderIOSEmojiSpace(ctx, w, h, t) {
  // Cosmic indigo vignette wash
  ctx.save();
  const spaceGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.2, w * 0.5, h * 0.5, Math.max(w, h));
  spaceGrad.addColorStop(0, 'rgba(46, 16, 101, 0.22)');
  spaceGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.40)');
  spaceGrad.addColorStop(1, 'rgba(2, 6, 23, 0.65)');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Twinkling star emojis ⭐️ 🌟 ✨
  for (const s of spaceTwinkleStars) {
    const twinkle = Math.sin(t * 4 + s.phase);
    const scale = 0.85 + twinkle * 0.25;
    drawEmojiSticker(ctx, s.emoji, s.x * w, s.y * h, s.size * scale, {
      opacity: 0.6 + twinkle * 0.4,
    });
  }

  // Rocket 🚀 zooming across space
  const rocketProg = (t * 0.08) % 1.4 - 0.2;
  const rocketX = rocketProg * w;
  const rocketY = h * 0.30 - rocketProg * (h * 0.15);
  drawEmojiSticker(ctx, '🚀', rocketX, rocketY, 66, {
    rotation: -Math.PI / 4 + Math.sin(t * 6) * 0.05,
  });

  // UFO 🛸 hovering with gentle wobble
  const ufoX = w * (0.80 + Math.sin(t * 1.8) * 0.05);
  const ufoY = h * 0.50 + Math.sin(t * 3) * 10;
  drawEmojiSticker(ctx, '🛸', ufoX, ufoY, 62, {
    rotation: Math.sin(t * 2.5) * 0.1,
  });

  // Big Saturn 🪐 in top corner
  const saturnBob = Math.sin(t * 1.5) * 6;
  drawEmojiSticker(ctx, '🪐', w * 0.82, h * 0.18 + saturnBob, 78, {
    rotation: -0.15,
  });

  // Crescent Moon 🌙
  drawEmojiSticker(ctx, '🌙', w * 0.18, h * 0.16 + saturnBob, 54);

  // Cute Alien 👽 peeking from bottom corner
  const alienPeek = Math.sin(t * 2) * 5;
  drawEmojiSticker(ctx, '👽', w * 0.12, h - 38 + alienPeek, 58);

  // Space Invader 👾
  drawEmojiSticker(ctx, '👾', w * 0.88, h - 38 + alienPeek, 54);
}

/**
 * 🌴 4. Authentic iOS Tropical Sunset Emoji Effect
 * Emojis: 🌴 🌅 ☀️ 🌺 🥥 🍹 🐬
 */
function renderIOSEmojiSunset(ctx, w, h, t) {
  // Golden sunset warm gradient wash
  ctx.save();
  const sunGrad = ctx.createLinearGradient(0, 0, 0, h);
  sunGrad.addColorStop(0, 'rgba(190, 18, 60, 0.20)');
  sunGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.28)');
  sunGrad.addColorStop(0.8, 'rgba(253, 224, 71, 0.25)');
  sunGrad.addColorStop(1, 'rgba(12, 74, 110, 0.35)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Glowing Sun ☀️ in top corner
  drawEmojiSticker(ctx, '☀️', w * 0.78, h * 0.20, 68, {
    rotation: t * 0.2,
  });

  // Palm Trees 🌴 swaying at left and right borders
  const palmSway = Math.sin(t * 2) * 0.08;
  drawEmojiSticker(ctx, '🌴', w * 0.10, h * 0.42, 84, {
    rotation: palmSway,
  });
  drawEmojiSticker(ctx, '🌴', w * 0.90, h * 0.44, 80, {
    flipX: true,
    rotation: -palmSway,
  });

  // Hibiscus flowers 🌺 floating
  drawEmojiSticker(ctx, '🌺', w * 0.22, h * 0.76, 52, {
    rotation: Math.sin(t * 1.8) * 0.15,
  });
  drawEmojiSticker(ctx, '🌺', w * 0.78, h * 0.78, 48, {
    rotation: -Math.sin(t * 1.8) * 0.15,
  });

  // Tropical Drink 🍹 & Coconut 🥥 at bottom
  drawEmojiSticker(ctx, '🍹', w * 0.12, h - 32, 52);
  drawEmojiSticker(ctx, '🥥', w * 0.88, h - 32, 50);

  // Leaping Dolphin 🐬 across horizon
  const dProg = (t * 0.07) % 1.4 - 0.2;
  const dX = dProg * w;
  const dY = h * 0.62 + Math.sin(t * 3.5) * 16;
  drawEmojiSticker(ctx, '🐬', dX, dY, 64, {
    flipX: true,
    rotation: Math.cos(t * 3.5) * 0.2,
  });
}

/**
 * 5. Retro Synthwave Cyberpunk Effect
 */
function renderLiveCyber(ctx, w, h, t) {
  ctx.save();
  const cyber = ctx.createLinearGradient(0, 0, w, h);
  cyber.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
  cyber.addColorStop(1, 'rgba(6, 182, 212, 0.32)');
  ctx.fillStyle = cyber;
  ctx.fillRect(0, 0, w, h);

  // Moving perspective grid at bottom third
  const horizonY = h * 0.72;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
  ctx.lineWidth = 1.5;

  for (let i = -7; i <= 7; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + i * (w * 0.15), h);
    ctx.stroke();
  }

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
 * 6. High-contrast Classic Black & White
 */
function renderLiveBW(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'multiply';
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.3, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  vig.addColorStop(0, '#ffffff');
  vig.addColorStop(1, '#888888');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * 7. Nostalgic 90s Film Tone
 */
function renderLiveFilm(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(254, 215, 170, 0.4)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
