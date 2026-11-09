// Real-time AI Selfie Segmentation & Virtual Backdrop Compositor using MediaPipe
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import { renderBackdrop } from './backdrops';

let segmenterInstance = null;
let isInitializing = false;
let initPromise = null;

// Offscreen canvases for zero-lag compositing
let maskCanvas = null;
let maskCtx = null;
let personCanvas = null;
let personCtx = null;

export async function getSegmenter() {
  if (segmenterInstance) return segmenterInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      isInitializing = true;
      // Load wasm from CDN (fast, cached by browser)
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      segmenterInstance = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/selfie_segmenter.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true, // Gives soft feathering around hair and edges
      });

      isInitializing = false;
      return segmenterInstance;
    } catch (err) {
      console.warn('GPU delegate failed or CDN wasm error, trying CPU fallback:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        segmenterInstance = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/selfie_segmenter.tflite',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });

        isInitializing = false;
        return segmenterInstance;
      } catch (e2) {
        console.error('Segmenter initialization completely failed:', e2);
        isInitializing = false;
        return null;
      }
    }
  })();

  return initPromise;
}

export function isSegmenterReady() {
  return segmenterInstance !== null;
}

// Composite video frame with the virtual backdrop
export function compositeBackdropFrame({
  video,
  targetCanvas,
  backdropId = 'fish',
  time = Date.now() / 1000,
  facing = 'user',
}) {
  if (!video || !targetCanvas) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;
  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) return;

  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';

  // If no backdrop selected, simply draw the camera feed directly
  if (backdropId === 'none') {
    targetCtx.save();
    if (facing === 'user') {
      targetCtx.translate(w, 0);
      targetCtx.scale(-1, 1);
    }
    targetCtx.drawImage(video, 0, 0, w, h);
    targetCtx.restore();
    return;
  }

  // 1. Draw the virtual backdrop scene (Fish, Space, Sunset, etc.)
  renderBackdrop(targetCtx, w, h, time, backdropId);

  // If segmenter is not yet ready or failed, blend person softly
  if (!segmenterInstance) {
    targetCtx.save();
    targetCtx.globalAlpha = 0.85;
    if (facing === 'user') {
      targetCtx.translate(w, 0);
      targetCtx.scale(-1, 1);
    }
    targetCtx.drawImage(video, 0, 0, w, h);
    targetCtx.restore();
    return;
  }

  // 2. Perform AI Segmentation
  try {
    const timestamp = performance.now();
    const result = segmenterInstance.segmentForVideo(video, timestamp);
    const confidenceMask = result.confidenceMasks?.[0];

    if (!confidenceMask) {
      // Fallback
      targetCtx.save();
      if (facing === 'user') {
        targetCtx.translate(w, 0);
        targetCtx.scale(-1, 1);
      }
      targetCtx.drawImage(video, 0, 0, w, h);
      targetCtx.restore();
      return;
    }

    const maskW = confidenceMask.width;
    const maskH = confidenceMask.height;
    const maskFloats = confidenceMask.getAsFloat32Array();

    // Prepare offscreen mask canvas
    if (!maskCanvas || maskCanvas.width !== maskW || maskCanvas.height !== maskH) {
      maskCanvas = document.createElement('canvas');
      maskCanvas.width = maskW;
      maskCanvas.height = maskH;
      maskCtx = maskCanvas.getContext('2d');
    }

    const imgData = maskCtx.createImageData(maskW, maskH);
    const data = imgData.data;

    // Convert confidence mask (0..1) to alpha channel
    for (let i = 0; i < maskFloats.length; i++) {
      const idx = i * 4;
      const alpha = Math.min(255, Math.max(0, Math.round(maskFloats[i] * 255)));
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
    maskCtx.putImageData(imgData, 0, 0);

    // Prepare offscreen person canvas (matching output size)
    if (!personCanvas || personCanvas.width !== w || personCanvas.height !== h) {
      personCanvas = document.createElement('canvas');
      personCanvas.width = w;
      personCanvas.height = h;
      personCtx = personCanvas.getContext('2d');
    }

    personCtx.clearRect(0, 0, w, h);
    personCtx.save();

    // Draw video into personCanvas (mirrored if front camera)
    if (facing === 'user') {
      personCtx.translate(w, 0);
      personCtx.scale(-1, 1);
    }
    personCtx.drawImage(video, 0, 0, w, h);

    // Cut out person using destination-in with maskCanvas
    personCtx.globalCompositeOperation = 'destination-in';
    // Mirror mask if front camera so mask aligns with mirrored person
    if (facing === 'user') {
      personCtx.translate(w, 0);
      personCtx.scale(-1, 1);
    }
    personCtx.drawImage(maskCanvas, 0, 0, w, h);
    personCtx.restore();

    // 3. Draw cut-out person onto the backdrop!
    targetCtx.drawImage(personCanvas, 0, 0, w, h);
  } catch (err) {
    // If inference error occurred on frame, fallback
    targetCtx.save();
    if (facing === 'user') {
      targetCtx.translate(w, 0);
      targetCtx.scale(-1, 1);
    }
    targetCtx.drawImage(video, 0, 0, w, h);
    targetCtx.restore();
  }
}
