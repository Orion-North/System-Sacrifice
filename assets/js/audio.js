import { audioState } from './state.js';

export function ensureAudioContext() {
  if (audioState.context) {
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.4;
  master.connect(context.destination);
  audioState.context = context;
  audioState.masterGain = master;
}

export function resumeAudioContext() {
  if (audioState.context && audioState.context.state === 'suspended') {
    audioState.context.resume();
  }
}

function ensureThemeElement() {
  if (!audioState.themeElement) {
    const audio = new Audio('assets/audio/theme.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = 'auto';
    audioState.themeElement = audio;
  }
  return audioState.themeElement;
}

export function playTheme() {
  if (!audioState.themeEnabled) {
    return;
  }
  const element = ensureThemeElement();
  if (!element) {
    return;
  }
  if (!audioState.themePlaying && element.currentTime === 0) {
    element.currentTime = 0;
  }
  const playPromise = element.play();
  audioState.themePlaying = true;
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(function () {
      /* ignore autoplay failures */
    });
  }
}

export function stopTheme() {
  const element = audioState.themeElement;
  if (!element) {
    audioState.themePlaying = false;
    return;
  }
  element.pause();
  audioState.themePlaying = false;
}

export function playJumpSound() {
  if (!audioState.jumpEnabled) {
    return;
  }
  ensureAudioContext();
  if (!audioState.context) {
    return;
  }
  resumeAudioContext();
  const context = audioState.context;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = 'square';
  gain.gain.setValueAtTime(0.3, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
  osc.frequency.setValueAtTime(440, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.3);
  osc.connect(gain).connect(audioState.masterGain);
  osc.start();
  osc.stop(context.currentTime + 0.32);
}

export function playDeleteSound() {
  ensureAudioContext();
  if (!audioState.context) {
    return;
  }
  resumeAudioContext();
  const context = audioState.context;
  const buffer = context.createBuffer(1, context.sampleRate * 0.12, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * 0.4;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = 0.25;
  source.connect(gain).connect(audioState.masterGain);
  source.start();
}

export function playGlitchSound() {
  ensureAudioContext();
  if (!audioState.context) {
    return;
  }
  resumeAudioContext();
  const context = audioState.context;
  const buffer = context.createBuffer(1, context.sampleRate * 0.3, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * 0.6;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = 0.3;
  source.connect(gain).connect(audioState.masterGain);
  source.start();
}

export function resetAudioState() {
  stopTheme();
  if (audioState.themeElement) {
    audioState.themeElement.currentTime = 0;
  }
  audioState.themeEnabled = true;
  audioState.themePlaying = false;
  audioState.jumpEnabled = true;
}
