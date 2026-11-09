'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Check,
  Smartphone,
  Eye,
  Sliders,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCountdownBeep, playShutterSound } from '../lib/audio';
import { generatePhotoStrip, FRAME_THEMES, FILTERS } from '../lib/stripGenerator';

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

  // Results & Filter state: 'original' | 'bw' | 'film'
  const [selectedTheme, setSelectedTheme] = useState('white');
  const [selectedFilter, setSelectedFilter] = useState('original');
  const [stripData, setStripData] = useState(null); // { dataUrl, blob }
  const [isGeneratingStrip, setIsGeneratingStrip] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saved' | 'downloaded'

  // Domestic references
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isCapturingRef = useRef(false);

  // Initialize camera stream
  const startCamera = useCallback(async (facing = cameraFacing) => {
    try {
      setPermissionError(null);
      setCameraReady(false);

      // Stop previous stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Constraints prioritizing front camera
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 1920 },
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

  // Handle switching camera
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

  // Capture a single frame from the live video onto a canvas
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 960;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror horizontally so saved photo matches preview
    if (cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.95);
  }, [cameraFacing]);

  // Start the 4-shot sequence
  const startBoothSequence = async () => {
    if (!cameraReady || isCapturingRef.current) return;

    isCapturingRef.current = true;
    setAppState('capturing');
    setCapturedPhotos([]);
    const photos = [];

    for (let shot = 0; shot < 4; shot++) {
      setCurrentShotIndex(shot);

      // Countdown: 3, 2, 1
      for (let count = 3; count >= 1; count--) {
        setCountdown(count);
        playCountdownBeep(count === 1);
        await new Promise((r) => setTimeout(r, 850));
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

      // Pause briefly between shots so user can pose for next shot
      if (shot < 3) {
        await new Promise((r) => setTimeout(r, 900));
      }
    }

    isCapturingRef.current = false;
    setCountdown(null);

    // Sequence completed! Celebrate with confetti and generate strip
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#ff3b30', '#ff9500', '#34c759', '#007aff'],
    });

    setAppState('results');
  };

  // Re-generate photo strip whenever capturedPhotos, selectedTheme, or selectedFilter changes
  useEffect(() => {
    if (appState === 'results' && capturedPhotos.length > 0) {
      let isMounted = true;
      setIsGeneratingStrip(true);

      generatePhotoStrip(capturedPhotos, {
        theme: selectedTheme,
        filter: selectedFilter,
      }).then((result) => {
        if (isMounted) {
          setStripData(result);
          setIsGeneratingStrip(false);
        }
      }).catch((err) => {
        console.error('Failed to generate strip:', err);
        if (isMounted) setIsGeneratingStrip(false);
      });

      return () => {
        isMounted = false;
      };
    }
  }, [appState, capturedPhotos, selectedTheme, selectedFilter]);

  // Retake photos
  const handleRetake = () => {
    setCapturedPhotos([]);
    setStripData(null);
    setSaveStatus(null);
    setAppState('camera');
    startCamera();
  };

  // Save handler (Web Share API for iPhone Save Image, Download fallback for laptop)
  const handleSave = async () => {
    if (!stripData?.blob) return;

    const fileName = `photobooth-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([stripData.blob], fileName, { type: 'image/png' });

    // 1. Try mobile native share sheet with file (iPhone Safari / Android)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Photo Booth Strip',
          text: 'Captured with Pocket Photo Booth!',
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      } catch (err) {
        // User canceled share sheet, or fallback needed
        if (err.name !== 'AbortError') {
          console.warn('Share sheet failed, falling back to download:', err);
        } else {
          return;
        }
      }
    }

    // 2. Fallback: Trigger direct image download for desktop / laptop
    try {
      const a = document.createElement('a');
      a.href = stripData.dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSaveStatus('downloaded');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Demo mode photos (for testing on laptops without webcam or simulator)
  const loadDemoPhotos = () => {
    const demoSvgs = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="100%" height="100%" fill="%23f43f5e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">📸 Smile 1</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="100%" height="100%" fill="%238b5cf6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">✌️ Peace 2</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="100%" height="100%" fill="%230ea5e9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">😎 Fun 3</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="100%" height="100%" fill="%2310b981"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">✨ Pout 4</text></svg>',
    ];
    setCapturedPhotos(demoSvgs);
    setAppState('results');
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
          opacity: appState === 'results' ? 0.15 : 1,
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
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
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

          {/* Bottom Bar: Filter selector & iPhone Shutter Button */}
          <footer
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

      {/* 4. Results Screen: Vertical Photo Strip, Save & Retake */}
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
            paddingTop: 'calc(var(--safe-top) + 16px)',
            paddingBottom: 'calc(var(--safe-bottom) + 24px)',
            paddingLeft: 'calc(var(--safe-left) + 16px)',
            paddingRight: 'calc(var(--safe-right) + 16px)',
          }}
        >
          {/* Results Top Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={handleRetake} className="glass-btn" aria-label="Close to camera">
                <X size={20} />
              </button>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                Your Photo Strip
              </h1>
            </div>

            {/* Quick theme switcher pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {Object.keys(FRAME_THEMES).map((key) => {
                const t = FRAME_THEMES[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    style={{
                      width: '26px',
                      height: '26px',
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

          {/* Photo Strip Display Container */}
          <div
            style={{
              flex: '1 1 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
              minHeight: '380px',
            }}
          >
            {stripData ? (
              <div
                style={{
                  position: 'relative',
                  maxHeight: '62vh',
                  boxShadow: '0 20px 48px -10px rgba(0,0,0,0.9), 0 0 1px 1px rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stripData.dataUrl}
                  alt="Your 4-shot photobooth strip"
                  style={{
                    display: 'block',
                    maxHeight: '62vh',
                    width: 'auto',
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                />
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={18} className="animate-spin" />
                <span>Developing photo strip...</span>
              </div>
            )}
          </div>

          {/* Filter options selector on results screen: Original, Black & White, Film */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              margin: '12px 0 16px 0',
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
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    fontSize: '13px',
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

          {/* Action Buttons: Save (Share/Photos) & Retake */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {/* Retake Button */}
              <button
                onClick={handleRetake}
                className="ios-btn-secondary"
                style={{ flex: 1, maxWidth: '160px' }}
              >
                <RotateCcw size={18} />
                <span>Retake</span>
              </button>

              {/* Save Button (Shares to Photos on iPhone, Downloads on Laptop) */}
              <button
                onClick={handleSave}
                disabled={!stripData || isGeneratingStrip}
                className="ios-btn-primary"
                style={{ flex: 2, maxWidth: '240px' }}
              >
                {saveStatus ? (
                  <>
                    <Check size={20} color="#34c759" />
                    <span>{saveStatus === 'saved' ? 'Saved to Photos!' : 'Downloaded!'}</span>
                  </>
                ) : (
                  <>
                    <Share2 size={20} />
                    <span>Save Strip</span>
                  </>
                )}
              </button>
            </div>

            <p
              style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '12px',
                marginTop: '4px',
              }}
            >
              On iPhone, tap &ldquo;Save Image&rdquo; in the share sheet to add to Photos.
            </p>
          </div>
        </div>
      )}

      {/* 5. Camera Permission Denied / Error Screen */}
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

          {/* Native iOS settings guide */}
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
                Select <strong>Allow</strong>, then tap Try Again below
              </li>
            </ol>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <button onClick={() => startCamera()} className="ios-btn-primary">
              <RefreshCw size={18} />
              <span>Try Again</span>
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
