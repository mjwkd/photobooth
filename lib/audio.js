// Synthesized sound effects using Web Audio API (no external asset dependencies)
let audioCtx = null;
let activeNodes = [];

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function stopAllAudio() {
  try {
    for (const node of activeNodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    }
    activeNodes = [];
    if (audioCtx && audioCtx.state === 'running') {
      audioCtx.suspend().catch(() => {});
    }
  } catch {}
}

export function playCountdownBeep(isFinal = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 1200 : 800, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.22 : 0.12));

    osc.connect(gain);
    gain.connect(ctx.destination);

    activeNodes.push(osc);
    osc.onended = () => {
      activeNodes = activeNodes.filter((n) => n !== osc);
    };

    osc.start();
    osc.stop(ctx.currentTime + (isFinal ? 0.25 : 0.15));

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isFinal ? [40, 30, 40] : 25);
    }
  } catch {
    // Ignore audio errors
  }
}

export function playShutterSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Click attack (white noise burst)
    const bufferSize = ctx.sampleRate * 0.05;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    activeNodes.push(whiteNoise);
    whiteNoise.onended = () => {
      activeNodes = activeNodes.filter((n) => n !== whiteNoise);
    };
    whiteNoise.start(t);

    // 2. Low mechanical thud
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    oscGain.gain.setValueAtTime(0.25, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    activeNodes.push(osc);
    osc.onended = () => {
      activeNodes = activeNodes.filter((n) => n !== osc);
    };

    osc.start(t);
    osc.stop(t + 0.09);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 40, 30]);
    }
  } catch {
    // Ignore audio errors
  }
}

// Gentle mechanical printer stepper motor sound when photo paper slides out of slot
export function playPrintSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const duration = 1.4;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(120, t + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(80, t + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.1);
    gain.gain.setValueAtTime(0.07, t + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    activeNodes.push(osc);
    osc.onended = () => {
      activeNodes = activeNodes.filter((n) => n !== osc);
    };

    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // Ignore
  }
}
