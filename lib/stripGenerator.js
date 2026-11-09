// Generates high-resolution vertical photobooth strip from 4 image data URLs or bitmaps

export const FRAME_THEMES = {
  white: {
    id: 'white',
    name: 'Classic White',
    bg: '#ffffff',
    photoBorder: '#ebebeb',
    textColor: '#1a1a1a',
    subtextColor: '#71717a',
    starColor: '#ff3b30',
  },
  black: {
    id: 'black',
    name: 'Midnight Black',
    bg: '#18181b',
    photoBorder: '#27272a',
    textColor: '#fafafa',
    subtextColor: '#a1a1aa',
    starColor: '#f43f5e',
  },
  cream: {
    id: 'cream',
    name: 'Vintage Cream',
    bg: '#faf6ee',
    photoBorder: '#eee6d3',
    textColor: '#382f2d',
    subtextColor: '#786c67',
    starColor: '#d97706',
  },
  pink: {
    id: 'pink',
    name: 'Pastel Pink',
    bg: '#fdf2f4',
    photoBorder: '#f9d5dc',
    textColor: '#831843',
    subtextColor: '#be185d',
    starColor: '#db2777',
  },
};

export const FILTERS = {
  normal: { id: 'normal', name: 'Normal', filter: 'none' },
  bw: { id: 'bw', name: 'B&W Film', filter: 'grayscale(100%) contrast(115%) brightness(105%)' },
  vintage: { id: 'vintage', name: 'Warm 90s', filter: 'sepia(30%) contrast(105%) brightness(102%) saturate(110%)' },
  cool: { id: 'cool', name: 'Cool Y2K', filter: 'saturate(115%) contrast(110%) hue-rotate(190deg)' },
};

export async function generatePhotoStrip(photos, options = {}) {
  const {
    theme = 'white',
    filter = 'normal',
    customDate = null,
  } = options;

  const currentTheme = FRAME_THEMES[theme] || FRAME_THEMES.white;
  const currentFilter = FILTERS[filter] || FILTERS.normal;

  // Strip layout dimensions (Retina 800px width)
  const STRIP_WIDTH = 800;
  const MARGIN_X = 44;
  const MARGIN_TOP = 48;
  const GAP = 32;
  const PHOTO_WIDTH = STRIP_WIDTH - MARGIN_X * 2; // 712px
  const PHOTO_HEIGHT = Math.round(PHOTO_WIDTH * 0.75); // 4:3 ratio -> 534px
  const FOOTER_HEIGHT = 160;

  const totalPhotos = photos.length;
  const STRIP_HEIGHT = MARGIN_TOP + (PHOTO_HEIGHT * totalPhotos) + (GAP * (totalPhotos - 1)) + FOOTER_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = STRIP_WIDTH;
  canvas.height = STRIP_HEIGHT;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not create canvas context');

  // 1. Draw strip background
  ctx.fillStyle = currentTheme.bg;
  ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);

  // 2. Load all images
  const loadedImages = await Promise.all(
    photos.map((src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    })
  );

  // 3. Draw each photo with crop and border
  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    const y = MARGIN_TOP + i * (PHOTO_HEIGHT + GAP);

    // Save context for filter application
    ctx.save();

    // Subtle photo border / drop inset
    ctx.strokeStyle = currentTheme.photoBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(MARGIN_X - 1, y - 1, PHOTO_WIDTH + 2, PHOTO_HEIGHT + 2);

    // Set filter if applied
    if (currentFilter.filter !== 'none') {
      ctx.filter = currentFilter.filter;
    }

    // Clip to rounded photo box (slight 4px radius for photographic paper look)
    ctx.beginPath();
    ctx.rect(MARGIN_X, y, PHOTO_WIDTH, PHOTO_HEIGHT);
    ctx.clip();

    // Center-crop drawing (cover fit)
    const imgAspect = img.width / img.height;
    const targetAspect = PHOTO_WIDTH / PHOTO_HEIGHT;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgAspect > targetAspect) {
      // Image is wider than 4:3
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      // Image is taller than 4:3
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, MARGIN_X, y, PHOTO_WIDTH, PHOTO_HEIGHT);
    ctx.restore();
  }

  // 4. Draw Footer (Branding & Date)
  const footerY = MARGIN_TOP + (PHOTO_HEIGHT * totalPhotos) + (GAP * (totalPhotos - 1));

  // Decorative divider
  ctx.strokeStyle = currentTheme.photoBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X + 40, footerY + 24);
  ctx.lineTo(STRIP_WIDTH - MARGIN_X - 40, footerY + 24);
  ctx.stroke();

  // "✦  PHOTO BOOTH  ✦"
  ctx.fillStyle = currentTheme.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('✦   PHOTO BOOTH   ✦', STRIP_WIDTH / 2, footerY + 68);

  // Formatted date
  const now = customDate ? new Date(customDate) : new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.fillStyle = currentTheme.subtextColor;
  ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(`${dateStr}  •  ${timeStr}`, STRIP_WIDTH / 2, footerY + 104);

  // Little heart / stamp at bottom
  ctx.fillStyle = currentTheme.starColor;
  ctx.font = '16px -apple-system, system-ui, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('♥  MEMORY ARCHIVE  ♥', STRIP_WIDTH / 2, footerY + 132);

  // Convert to high quality PNG
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const dataUrl = canvas.toDataURL('image/png', 0.98);
      resolve({
        dataUrl,
        blob,
        width: STRIP_WIDTH,
        height: STRIP_HEIGHT,
      });
    }, 'image/png', 0.98);
  });
}
