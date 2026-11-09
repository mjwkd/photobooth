// Real-time Live Camera Effects & Background Compositor
import { renderLiveEffect, EFFECTS } from './backdrops';

/**
 * Composite video frame with the active live effect in real-time (60 FPS).
 * WYSIWYG: What you see on the live camera is 100% what gets saved into the photo strip!
 */
export function compositeBackdropFrame({
  video,
  targetCanvas,
  backdropId = 'fish',
  time = performance.now() / 1000,
  facing = 'user',
}) {
  if (!video || !targetCanvas) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return;

  renderLiveEffect({
    ctx,
    video,
    w,
    h,
    effect: backdropId,
    time,
    facing,
  });
}

export async function getSegmenter() {
  return Promise.resolve(null);
}

export function isSegmenterReady() {
  return true;
}
