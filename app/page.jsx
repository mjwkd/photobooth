'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  Share2,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Film,
  LayoutGrid,
  Square,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCountdownBeep, playShutterSound, playPrintSound, stopAllAudio } from '../lib/audio';
import { generatePhotoStrip, FRAME_THEMES, FILTERS, LAYOUTS } from '../lib/stripGenerator';

export default function PhotoBooth() {
  // App states: 'camera' | 'capturing' | 'results' | 'denied'
  const [appState, setAppState] = useState('camera');
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' (front) or 'environment' (back)
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  // Capture sequence states
  const [currentShotIndex, setCurrentShotIndex] = useState(0); // 0..3
  const [countdown, setCountdown] = useState(null); // null, 3, 2, 1
  const [flashing, setFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);

  // Results screen customizations
  const [selectedLayout, setSelectedLayout] = useState('strip'); // 'strip' | 'grid' | 'polaroid'
  const [selectedTheme, setSelectedTheme] = useState('white');
  const [selectedFilter, setSelectedFilter] = useState('original'); // 'original' | 'bw' | 'film'
  const [polaroidCaption, setPolaroidCaption] = useState('best memories ♥');
  const [polaroidShotIndex, setPolaroidShotIndex] = useState(0); // 0..3

  // Print animation and data
  const [stripData, setStripData] = useState(null); // { dataUrl, blob }
  const [isGeneratingStrip, setIsGeneratingStrip] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saved' | 'downloaded' | 'error'

  // References
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isCapturingRef = useRef(false);
  const cancelCaptureRef = useRef(false);
  const isSavingRef = useRef(false);

  // Initialize camera stream with high resolution constraints
  const startCamera = useCallback(async (facing = cameraFacing) => {
    try {
      setPermissionError(null);
      setCameraReady(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 2560, min: 1920 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraReady(true);
            setAppState('camera');
          }).catch((err) => {
            console.error('Video play failed:', err);
          });
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraReady(false);
      setPermissionError(err.name || 'CameraError');
      setAppState('denied');
    }
  }, [cameraFacing]);

  // Handle switching front/back camera
  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    await startCamera(nextFacing);
  };

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Edge Case 3 Fix: Handle leaving the app mid-countdown (tab switch, minimize, lock)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isCapturingRef.current) {
          cancelCaptureRef.current = true;
          isCapturingRef.current = false;
          stopAllAudio();
          setCountdown(null);
          setFlashing(false);
          setAppState('camera');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, []);

  // Edge Case 4 Fix: High-resolution frame capture without quality downsampling
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1440;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Mirror front camera horizontally
    if (cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    // Use lossless PNG or max quality JPEG for the intermediate shot buffer
    return canvas.toDataURL('image/png');
  }, [cameraFacing]);

  // Start the 4-shot sequence with cancel-protection
  const startBoothSequence = async () => {
    if (!cameraReady || isCapturingRef.current) return;

    isCapturingRef.current = true;
    cancelCaptureRef.current = false;
    setAppState('capturing');
    setCapturedPhotos([]);
    const photos = [];

    for (let shot = 0; shot < 4; shot++) {
      if (cancelCaptureRef.current) {
        isCapturingRef.current = false;
        stopAllAudio();
        return;
      }

      setCurrentShotIndex(shot);

      // Countdown: 3, 2, 1
      for (let count = 3; count >= 1; count--) {
        if (cancelCaptureRef.current) {
          isCapturingRef.current = false;
          stopAllAudio();
          return;
        }

        setCountdown(count);
        playCountdownBeep(count === 1);
        await new Promise((r) => setTimeout(r, 850));
      }

      if (cancelCaptureRef.current) {
        isCapturingRef.current = false;
        stopAllAudio();
        return;
      }

      setCountdown(null);

      // Shutter click & Flash
      playShutterSound();
      setFlashing(true);

      // Capture frame
      const photoData = captureFrame();
      if (photoData) {
        photos.push(photoData);
        setCapturedPhotos([...photos]);
      }

      // Hide flash after 180ms
      await new Promise((r) => setTimeout(r, 180));
      setFlashing(false);

      // Pause between shots so user can change poses
      if (shot < 3) {
        await new Promise((r) => setTimeout(r, 900));
      }
    }

    if (cancelCaptureRef.current) {
      isCapturingRef.current = false;
      stopAllAudio();
      return;
    }

    isCapturingRef.current = false;
    setCountdown(null);

    // Sequence completed! Switch to results and trigger printer slide-out
    setAppState('results');
    setIsPrinting(true);
    playPrintSound();

    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ffffff', '#ff3b30', '#ff9500', '#34c759', '#007aff'],
      });
    }, 1100);

    setTimeout(() => {
      setIsPrinting(false);
    }, 1900);
  };

  // Re-generate photo print whenever capturedPhotos, layout, theme, filter, or polaroid options change
  useEffect(() => {
    if (appState === 'results' && capturedPhotos.length > 0) {
      let isMounted = true;
      setIsGeneratingStrip(true);

      generatePhotoStrip(capturedPhotos, {
        layout: selectedLayout,
        theme: selectedTheme,
        filter: selectedFilter,
        caption: polaroidCaption,
        polaroidShotIndex: polaroidShotIndex,
      }).then((result) => {
        if (isMounted) {
          setStripData(result);
          setIsGeneratingStrip(false);
        }
      }).catch((err) => {
        console.error('Failed to generate print:', err);
        if (isMounted) setIsGeneratingStrip(false);
      });

      return () => {
        isMounted = false;
      };
    }
  }, [
    appState,
    capturedPhotos,
    selectedLayout,
    selectedTheme,
    selectedFilter,
    polaroidCaption,
    polaroidShotIndex,
  ]);

  // Retake photos
  const handleRetake = () => {
    cancelCaptureRef.current = true;
    isCapturingRef.current = false;
    stopAllAudio();
    setCapturedPhotos([]);
    setStripData(null);
    setSaveStatus(null);
    setIsPrinting(false);
    setAppState('camera');
    startCamera();
  };

  // Trigger printer emerge animation manually
  const triggerPrintEmerge = (newLayout) => {
    if (newLayout) setSelectedLayout(newLayout);
    setIsPrinting(true);
    playPrintSound();
    setTimeout(() => {
      setIsPrinting(false);
    }, 1900);
  };

  // Edge Case 5 Fix: Guard against saving twice & handle permission rejection
  const handleSave = async () => {
    if (isSavingRef.current || isSaving || !stripData?.blob) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus(null);

    const fileName = `photobooth-${selectedLayout}-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([stripData.blob], fileName, { type: 'image/png' });

    try {
      // 1. Mobile native share sheet with file (iPhone Safari / Android)
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: 'My Photo Booth Print',
            text: 'Captured with Pocket Photo Booth!',
          });
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 3000);
          return;
        } catch (err) {
          // User dismissed or canceled share sheet cleanly
          if (err.name === 'AbortError') {
            return;
          }
          // Another share in progress: ignore double trigger
          if (err.name === 'InvalidStateError') {
            return;
          }
          console.warn('Share sheet failed:', err);
        }
      }

      // 2. Direct image download for desktop / laptop
      const a = document.createElement('a');
      a.href = stripData.dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSaveStatus('downloaded');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3500);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // Demo mode photos
  const loadDemoPhotos = () => {
    const demoSvgs = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675"><rect width="100%" height="100%" fill="%23f43f5e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="64" font-family="sans-serif">📸 Smile 1</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675"><rect width="100%" height="100%" fill="%238b5cf6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="64" font-family="sans-serif">✌️ Peace 2</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675"><rect width="100%" height="100%" fill="%230ea5e9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="64" font-family="sans-serif">😎 Fun 3</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675"><rect width="100%" height="100%" fill="%2310b981"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="64" font-family="sans-serif">✨ Pout 4</text></svg>',
    ];
    setCapturedPhotos(demoSvgs);
    setAppState('results');
    triggerPrintEmerge();
  };

  return (
    <main
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        backgroundColor: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* 1. Fullscreen Live Video Stream with Real-time Filter */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
          filter: FILTERS[selectedFilter]?.filter || 'none',
          opacity: appState === 'results' ? 0.12 : 1,
          transition: 'opacity 0.4s ease, filter 0.25s ease',
          pointerEvents: 'none',
        }}
      />

      {/* 2. White Xenon Flash Effect */}
      {flashing && (
        <div
          className="flash-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#ffffff',
            zIndex: 90,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 3. Camera View & Top Navigation Bar */}
      {appState !== 'results' && appState !== 'denied' && (
        <>
          {/* Top Bar respecting iOS Safe Area */}
          <header
            className="camera-header"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              paddingTop: 'calc(var(--safe-top) + 14px)',
              paddingLeft: 'calc(var(--safe-left) + 20px)',
              paddingRight: 'calc(var(--safe-right) + 20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30,
              pointerEvents: 'auto',
            }}
          >
            <div className="glass-pill">
              <Sparkles size={16} color="#ffd60a" />
              <span>4-Shot Photo Booth</span>
            </div>

            {/* Camera Switch Button */}
            <button
              onClick={toggleCameraFacing}
              className="glass-btn"
              title="Switch front/back camera"
              aria-label="Switch camera"
              disabled={appState === 'capturing'}
            >
              <RotateCcw size={20} />
            </button>
          </header>

          {/* Countdown & Burst Progress Overlay */}
          {appState === 'capturing' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 40,
                pointerEvents: 'none',
              }}
            >
              {/* Active countdown number */}
              {countdown !== null && (
                <div
                  key={countdown}
                  className="countdown-number"
                  style={{
                    fontSize: '140px',
                    fontWeight: '800',
                    color: '#ffffff',
                    lineHeight: 1,
                    textShadow: '0 8px 32px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  {countdown}
                </div>
              )}

              {/* Shot Status Badge */}
              <div
                style={{
                  marginTop: '24px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px',
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                <span>Photo {currentShotIndex + 1} of 4</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0, 1, 2, 3].map((dot) => (
                    <div
                      key={dot}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                          dot < currentShotIndex
                            ? '#34c759'
                            : dot === currentShotIndex
                            ? '#ff9500'
                            : 'rgba(255, 255, 255, 0.3)',
                        transition: 'background-color 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Bar: Filter Selector & iPhone Shutter Button */}
          <footer
            className="camera-footer"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: 'calc(var(--safe-bottom) + 24px)',
              paddingLeft: 'calc(var(--safe-left) + 20px)',
              paddingRight: 'calc(var(--safe-right) + 20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
              gap: '14px',
            }}
          >
            {/* Filter buttons row above the shutter: Original, Black & White, Film */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(24, 24, 27, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '4px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
                pointerEvents: appState === 'capturing' ? 'none' : 'auto',
                opacity: appState === 'capturing' ? 0.4 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {Object.keys(FILTERS).map((key) => {
                const f = FILTERS[key];
                const isSelected = selectedFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedFilter(key);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate(20);
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: isSelected ? '600' : '500',
                      color: isSelected ? '#000000' : '#ffffff',
                      backgroundColor: isSelected ? '#ffffff' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      letterSpacing: '-0.2px',
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    {f.name}
                  </button>
                );
              })}
            </div>

            <p
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '13px',
                fontWeight: '500',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                letterSpacing: '-0.1px',
              }}
            >
              {appState === 'capturing' ? 'Hold steady...' : 'Tap shutter to take 4 photos'}
            </p>

            <button
              onClick={startBoothSequence}
              disabled={appState === 'capturing' || !cameraReady}
              className={`shutter-btn ${appState === 'capturing' ? 'capturing' : ''}`}
              aria-label="Take 4 photos"
            >
              <div className="shutter-inner" />
            </button>
          </footer>
        </>
      )}

      {/* 4. Results Screen: Layout Picker, Printer Slot Animation & Sticky Save Bar */}
      {appState === 'results' && (
        <div
          className="results-enter"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#09090b',
            zIndex: 50,
            overflowY: 'auto',
            paddingTop: 'calc(var(--safe-top) + 12px)',
            paddingLeft: 'calc(var(--safe-left) + 16px)',
            paddingRight: 'calc(var(--safe-right) + 16px)',
          }}
        >
          {/* Header: Close / Retake & Layout Picker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexShrink: 0,
            }}
          >
            <button onClick={handleRetake} className="glass-btn" aria-label="Close to camera">
              <X size={20} />
            </button>

            {/* Layout Picker: Vertical Strip | 2x2 Grid | Polaroid */}
            <div className="layout-pill-group">
              <button
                className={`layout-pill-btn ${selectedLayout === 'strip' ? 'active' : ''}`}
                onClick={() => triggerPrintEmerge('strip')}
              >
                <Film size={14} />
                <span>Strip</span>
              </button>
              <button
                className={`layout-pill-btn ${selectedLayout === 'grid' ? 'active' : ''}`}
                onClick={() => triggerPrintEmerge('grid')}
              >
                <LayoutGrid size={14} />
                <span>2×2 Grid</span>
              </button>
              <button
                className={`layout-pill-btn ${selectedLayout === 'polaroid' ? 'active' : ''}`}
                onClick={() => triggerPrintEmerge('polaroid')}
              >
                <Square size={14} />
                <span>Polaroid</span>
              </button>
            </div>

            {/* Quick theme colors */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {Object.keys(FRAME_THEMES).map((key) => {
                const t = FRAME_THEMES[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: t.bg,
                      border: selectedTheme === key ? '2px solid #007aff' : '1px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      transform: selectedTheme === key ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                    title={t.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Polaroid-specific controls: Handwritten Caption & Shot Picker */}
          {selectedLayout === 'polaroid' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center',
                margin: '4px 0 10px 0',
                flexShrink: 0,
              }}
            >
              {/* Handwritten caption edit field */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(28, 28, 30, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '12px',
                  padding: '5px 12px',
                  width: '100%',
                  maxWidth: '320px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                  Caption:
                </span>
                <input
                  type="text"
                  value={polaroidCaption}
                  onChange={(e) => setPolaroidCaption(e.target.value)}
                  maxLength={30}
                  placeholder="Write a cute caption..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontFamily: 'var(--handwritten-font)',
                    outline: 'none',
                    flex: 1,
                    width: '100%',
                  }}
                />
              </div>

              {/* Pick which shot to display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Shot:</span>
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setPolaroidShotIndex(idx)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: polaroidShotIndex === idx ? '2px solid #007aff' : '1px solid rgba(255,255,255,0.2)',
                      background: polaroidShotIndex === idx ? '#ffffff' : 'rgba(255,255,255,0.1)',
                      color: polaroidShotIndex === idx ? '#000000' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photo Dispenser: Realistic Slot with Sliding Paper Animation */}
          <div
            style={{
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '4px 0',
              minHeight: '340px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* The photo booth printer slot at the top */}
            <div className="printer-slot-mouth" title="Photo Booth Printer Slot" />

            {/* Paper sliding out of the dispenser slot */}
            <div
              style={{
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '2px',
              }}
            >
              {stripData ? (
                <div
                  key={`${selectedLayout}-${polaroidShotIndex}-${isPrinting ? 'print' : 'static'}`}
                  className={isPrinting ? 'paper-emerge' : ''}
                  style={{
                    position: 'relative',
                    maxHeight: selectedLayout === 'strip' ? '54vh' : '48vh',
                    boxShadow: '0 20px 48px -10px rgba(0,0,0,0.9), 0 0 1px 1px rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stripData.dataUrl}
                    alt="Photo booth print"
                    style={{
                      display: 'block',
                      maxHeight: selectedLayout === 'strip' ? '54vh' : '48vh',
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px' }}>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Printing your photos...</span>
                </div>
              )}
            </div>
          </div>

          {/* Filter options selector on results screen: Original, Black & White, Film */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              margin: '8px 0 10px 0',
              flexShrink: 0,
            }}
          >
            {Object.keys(FILTERS).map((fKey) => {
              const f = FILTERS[fKey];
              const isSelected = selectedFilter === fKey;
              return (
                <button
                  key={fKey}
                  onClick={() => setSelectedFilter(fKey)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? '#000000' : '#ffffff',
                    backgroundColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.name}
                </button>
              );
            })}
          </div>

          {/* Edge Case 6 Fix: Sticky Bottom Bar (never hidden behind the home bar) */}
          <div className="results-bottom-bar">
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleRetake}
                className="ios-btn-secondary"
                style={{ flex: 1, maxWidth: '140px' }}
              >
                <RotateCcw size={18} />
                <span>Retake</span>
              </button>

              <button
                onClick={handleSave}
                disabled={!stripData || isGeneratingStrip || isSaving}
                className="ios-btn-primary"
                style={{ flex: 2, maxWidth: '240px' }}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check size={20} color="#34c759" />
                    <span>Saved to Photos!</span>
                  </>
                ) : saveStatus === 'downloaded' ? (
                  <>
                    <Check size={20} color="#34c759" />
                    <span>Downloaded!</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle size={20} color="#ff3b30" />
                    <span>Save Failed</span>
                  </>
                ) : (
                  <>
                    <Share2 size={20} />
                    <span>Save {LAYOUTS[selectedLayout]?.name || 'Print'}</span>
                  </>
                )}
              </button>
            </div>

            <p
              style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '11px',
              }}
            >
              On iPhone, tap &ldquo;Save Image&rdquo; in the share sheet to add to Photos.
            </p>
          </div>
        </div>
      )}

      {/* 5. Camera Permission Denied / Error Screen (Edge Case 1 Fix: Auto reload & clear guide) */}
      {appState === 'denied' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#000000',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            paddingTop: 'calc(var(--safe-top) + 24px)',
            paddingBottom: 'calc(var(--safe-bottom) + 24px)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <Camera size={36} color="#ff3b30" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>
            Camera Access Required
          </h2>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              maxWidth: '320px',
              lineHeight: 1.45,
              marginBottom: '24px',
            }}
          >
            Photo Booth needs front camera permission to take your photos. No photos leave your phone.
          </p>

          <div
            style={{
              backgroundColor: 'rgba(28, 28, 30, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '16px 20px',
              maxWidth: '340px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#d1d1d6',
            }}
          >
            <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
              How to turn camera back on:
            </div>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                Tap the <strong>Page Settings (aA)</strong> or lock icon in the address bar
              </li>
              <li>
                Tap <strong>Website Settings</strong> &gt; <strong>Camera</strong>
              </li>
              <li>
                Select <strong>Allow</strong>, then tap <strong>Reload &amp; Try Again</strong> below
              </li>
            </ol>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="ios-btn-primary"
            >
              <RefreshCw size={18} />
              <span>Reload &amp; Try Again</span>
            </button>

            <button
              onClick={loadDemoPhotos}
              className="ios-btn-secondary"
              style={{ fontSize: '14px' }}
            >
              <span>Test with Demo Photos</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
