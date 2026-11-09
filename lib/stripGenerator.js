// Generates high-resolution photo booth prints: Vertical Strip, 2x2 Grid, or Single Polaroid

export const FRAME_THEMES = {
  white: {
    id: 'white',
    name: 'Classic White',
    bg: '#ffffff',
    photoBorder: '#ebebeb',
    textColor: '#1a1a1a',
    subtextColor: '#71717a',
    starColor: '#ff3b30',
    inkColor: '#27272a',
  },
  black: {
    id: 'black',
    name: 'Midnight Black',
    bg: '#18181b',
    photoBorder: '#27272a',
    textColor: '#fafafa',
    subtextColor: '#a1a1aa',
    starColor: '#f43f5e',
    inkColor: '#f4f4f5',
  },
  cream: {
    id: 'cream',
    name: 'Vintage Cream',
    bg: '#faf6ee',
    photoBorder: '#eee6d3',
    textColor: '#382f2d',
    subtextColor: '#786c67',
    starColor: '#d97706',
    inkColor: '#3c3228',
  },
  pink: {
    id: 'pink',
    name: 'Pastel Pink',
    bg: '#fdf2f4',
    photoBorder: '#f9d5dc',
    textColor: '#831843',
    subtextColor: '#be185d',
    starColor: '#db2777',
    inkColor: '#701a40',
  },
};

export const FILTERS = {
  original: {
    id: 'original',
    name: 'Original',
    filter: 'none',
  },
  bw: {
    id: 'bw',
    name: 'Black & White',
    filter: 'grayscale(100%) contrast(120%) brightness(105%)',
  },
  film: {
    id: 'film',
    name: 'Film',
    filter: 'sepia(35%) contrast(115%) brightness(108%) saturate(125%)',
  },
};

export const LAYOUTS = {
  strip: {
    id: 'strip',
    name: 'Vertical Strip',
    description: 'Classic 4-shot vertical photobooth strip',
  },
  grid: {
    id: 'grid',
    name: '2×2 Grid',
    description: 'Postcard style 4-photo square grid',
  },
  polaroid: {
    id: 'polaroid',
    name: 'Polaroid',
    description: 'Instant film with handwritten caption',
  },
};

export async function generatePhotoStrip(photos, options = {}) {
  const {
    layout = 'strip', // 'strip' | 'grid' | 'polaroid'
    theme = 'white',
    filter = 'original',
    caption = 'best memories ♥',
    polaroidShotIndex = 0,
    customDate = null,
  } = options;

  const currentTheme = FRAME_THEMES[theme] || FRAME_THEMES.white;
  const currentFilter = FILTERS[filter] || FILTERS.original;

  // Load all images first
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

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  // Helper for drawing a cropped image with border and filter
  function drawPhoto(img, x, y, w, h, targetAspect = w / h) {
    ctx.save();

    // Photo inset border
    ctx.strokeStyle = currentTheme.photoBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

    // Apply active filter
    if (currentFilter.filter && currentFilter.filter !== 'none') {
      ctx.filter = currentFilter.filter;
    }

    // Clip to photo box
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Center crop
    const imgAspect = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
  }

  // Date strings
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

  // ----------------------------------------------------------------
  // LAYOUT 1: Vertical Strip (Classic 4 photos)
  // ----------------------------------------------------------------
  if (layout === 'strip') {
    const STRIP_WIDTH = 800;
    const MARGIN_X = 44;
    const MARGIN_TOP = 48;
    const GAP = 32;
    const PHOTO_WIDTH = STRIP_WIDTH - MARGIN_X * 2; // 712px
    const PHOTO_HEIGHT = Math.round(PHOTO_WIDTH * 0.75); // 534px (4:3)
    const FOOTER_HEIGHT = 160;

    const totalPhotos = loadedImages.length;
    const STRIP_HEIGHT = MARGIN_TOP + (PHOTO_HEIGHT * totalPhotos) + (GAP * (totalPhotos - 1)) + FOOTER_HEIGHT;

    canvas.width = STRIP_WIDTH;
    canvas.height = STRIP_HEIGHT;

    // Fill Background
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);

    // Draw photos
    for (let i = 0; i < loadedImages.length; i++) {
      const y = MARGIN_TOP + i * (PHOTO_HEIGHT + GAP);
      drawPhoto(loadedImages[i], MARGIN_X, y, PHOTO_WIDTH, PHOTO_HEIGHT, PHOTO_WIDTH / PHOTO_HEIGHT);
    }

    // Footer
    const footerY = MARGIN_TOP + (PHOTO_HEIGHT * totalPhotos) + (GAP * (totalPhotos - 1));

    // Divider line
    ctx.strokeStyle = currentTheme.photoBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN_X + 40, footerY + 24);
    ctx.lineTo(STRIP_WIDTH - MARGIN_X - 40, footerY + 24);
    ctx.stroke();

    // Brand title
    ctx.fillStyle = currentTheme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('✦   PHOTO BOOTH   ✦', STRIP_WIDTH / 2, footerY + 68);

    // Timestamp
    ctx.fillStyle = currentTheme.subtextColor;
    ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(`${dateStr}  •  ${timeStr}`, STRIP_WIDTH / 2, footerY + 104);

    // Sub watermark
    ctx.fillStyle = currentTheme.starColor;
    ctx.font = '16px -apple-system, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('♥  MEMORY ARCHIVE  ♥', STRIP_WIDTH / 2, footerY + 132);
  }

  // ----------------------------------------------------------------
  // LAYOUT 2: 2x2 Grid (Postcard format)
  // ----------------------------------------------------------------
  else if (layout === 'grid') {
    const GRID_WIDTH = 1000;
    const MARGIN_X = 48;
    const MARGIN_TOP = 52;
    const GAP = 28;
    const CELL_W = Math.round((GRID_WIDTH - MARGIN_X * 2 - GAP) / 2); // 438px
    const CELL_H = CELL_W; // Square 1:1 ratio
    const FOOTER_HEIGHT = 140;

    const GRID_HEIGHT = MARGIN_TOP + CELL_H * 2 + GAP + FOOTER_HEIGHT;

    canvas.width = GRID_WIDTH;
    canvas.height = GRID_HEIGHT;

    // Fill Background
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

    // 2x2 photos
    const positions = [
      { x: MARGIN_X, y: MARGIN_TOP },
      { x: MARGIN_X + CELL_W + GAP, y: MARGIN_TOP },
      { x: MARGIN_X, y: MARGIN_TOP + CELL_H + GAP },
      { x: MARGIN_X + CELL_W + GAP, y: MARGIN_TOP + CELL_H + GAP },
    ];

    for (let i = 0; i < 4; i++) {
      const img = loadedImages[i] || loadedImages[0];
      const pos = positions[i];
      drawPhoto(img, pos.x, pos.y, CELL_W, CELL_H, 1);
    }

    // Footer
    const footerY = MARGIN_TOP + CELL_H * 2 + GAP;

    // Divider
    ctx.strokeStyle = currentTheme.photoBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN_X + 40, footerY + 20);
    ctx.lineTo(GRID_WIDTH - MARGIN_X - 40, footerY + 20);
    ctx.stroke();

    // Brand title
    ctx.fillStyle = currentTheme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('✦   PHOTO BOOTH 2×2   ✦', GRID_WIDTH / 2, footerY + 58);

    // Date
    ctx.fillStyle = currentTheme.subtextColor;
    ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(`${dateStr}  •  ${timeStr}`, GRID_WIDTH / 2, footerY + 92);

    // Bottom heart
    ctx.fillStyle = currentTheme.starColor;
    ctx.font = '15px -apple-system, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('♥  POCKET BOOTH ARCHIVE  ♥', GRID_WIDTH / 2, footerY + 118);
  }

  // ----------------------------------------------------------------
  // LAYOUT 3: Single Polaroid (with handwritten-style caption)
  // ----------------------------------------------------------------
  else if (layout === 'polaroid') {
    const POLAROID_WIDTH = 800;
    const MARGIN_SIDE = 52;
    const MARGIN_TOP = 52;
    const PHOTO_SIZE = POLAROID_WIDTH - MARGIN_SIDE * 2; // 696px (1:1 square)
    const CHIN_HEIGHT = 260; // Classic wide polaroid bottom chin

    const POLAROID_HEIGHT = MARGIN_TOP + PHOTO_SIZE + CHIN_HEIGHT; // 1008px

    canvas.width = POLAROID_WIDTH;
    canvas.height = POLAROID_HEIGHT;

    // Fill Background
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

    // Pick photo
    const selectedImg = loadedImages[polaroidShotIndex] || loadedImages[0];
    drawPhoto(selectedImg, MARGIN_SIDE, MARGIN_TOP, PHOTO_SIZE, PHOTO_SIZE, 1);

    // Handwritten-style caption on the Polaroid bottom chin
    const chinCenterY = MARGIN_TOP + PHOTO_SIZE + 105;

    ctx.fillStyle = currentTheme.inkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Handwritten font with cursive fallbacks
    ctx.font = '600 48px "Caveat", "Nanum Pen Script", "Bradley Hand", cursive';
    const displayCaption = (caption || 'best memories ♥').trim();
    ctx.fillText(displayCaption, POLAROID_WIDTH / 2, chinCenterY);

    // Subtle handwritten date underneath
    ctx.fillStyle = currentTheme.subtextColor;
    ctx.font = '500 28px "Caveat", "Nanum Pen Script", "Bradley Hand", cursive';
    const polaroidDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    ctx.fillText(`${polaroidDate}  •  photo booth`, POLAROID_WIDTH / 2, chinCenterY + 54);
  }

  // Convert to high quality PNG
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const dataUrl = canvas.toDataURL('image/png', 0.98);
      resolve({
        dataUrl,
        blob,
        width: canvas.width,
        height: canvas.height,
      });
    }, 'image/png', 0.98);
  });
}
