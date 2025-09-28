import { selectors, gameState, worldState, inputState, runtimeState } from './state.js';
import { INITIAL_FILESYSTEM, JUMP_BUFFER_TIME } from './constants.js';
import { cloneFilesystem, countTotalFiles } from './utils.js';
import { resetAssetStates } from './assetManager.js';
import {
  resetAudioState,
  ensureAudioContext,
  resumeAudioContext,
  playTheme,
  stopTheme,
  playGlitchSound,
} from './audio.js';
import { clearGlitchOverlay, updateProgress, flashGlitchOverlay } from './ui.js';
import { renderFileExplorer } from './fileExplorer.js';
import { resetWorldState, updateWorld, drawScene } from './world.js';

let uiBound = false;

export function initGame() {
  runtimeState.ctx = selectors.canvas.getContext('2d');
  if (!uiBound) {
    bindUI();
    uiBound = true;
  }
  resetGame();
}

function bindUI() {
  selectors.restartButton.addEventListener('click', resetGame);
  selectors.resetButton.addEventListener('click', resetGame);
  selectors.startButton.addEventListener('click', startGame);
  selectors.resumeButton.addEventListener('click', function () {
    togglePause(false);
  });
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function resetGame() {
  gameState.filesystem = cloneFilesystem(INITIAL_FILESYSTEM);
  gameState.totalFiles = countTotalFiles(INITIAL_FILESYSTEM);
  gameState.deletedFiles = [];
  gameState.ritualComplete = false;
  gameState.glitchLevel = 0;
  gameState.gameStarted = false;
  gameState.openFolders.clear();

  resetAssetStates();
  resetWorldState();
  resetAudioState();

  selectors.progressBar.style.width = '0';
  selectors.progressContainer.setAttribute('aria-valuenow', '0');
  selectors.finalScreen.classList.add('hidden');
  selectors.pauseOverlay.classList.add('hidden');
  selectors.logList.innerHTML = '';

  clearGlitchOverlay();

  if (runtimeState.animationFrameId) {
    window.cancelAnimationFrame(runtimeState.animationFrameId);
    runtimeState.animationFrameId = null;
  }
  runtimeState.lastTimestamp = 0;

  renderFileExplorer();
  updateProgress();
  drawScene();
}

function startGame() {
  if (worldState.started) {
    return;
  }
  worldState.started = true;
  worldState.paused = false;
  gameState.gameStarted = true;
  selectors.startButton.classList.add('hidden');
  selectors.pauseOverlay.classList.add('hidden');
  ensureAudioContext();
  resumeAudioContext();
  playTheme();
  if (runtimeState.animationFrameId) {
    window.cancelAnimationFrame(runtimeState.animationFrameId);
    runtimeState.animationFrameId = null;
  }
  runtimeState.lastTimestamp = 0;
  runtimeState.animationFrameId = window.requestAnimationFrame(gameLoop);
}

function togglePause(paused) {
  if (!worldState.started || gameState.ritualComplete) {
    return;
  }
  if (paused) {
    if (!worldState.pauseMenuPresent) {
      flashGlitchOverlay('Pause interface missing');
      playGlitchSound();
      return;
    }
    if (worldState.paused) {
      return;
    }
    worldState.paused = true;
    selectors.pauseOverlay.classList.remove('hidden');
    stopTheme();
    if (runtimeState.animationFrameId) {
      window.cancelAnimationFrame(runtimeState.animationFrameId);
      runtimeState.animationFrameId = null;
    }
  } else {
    if (!worldState.paused) {
      return;
    }
    worldState.paused = false;
    selectors.pauseOverlay.classList.add('hidden');
    resumeAudioContext();
    playTheme();
    runtimeState.lastTimestamp = 0;
    runtimeState.animationFrameId = window.requestAnimationFrame(gameLoop);
  }
}

function handleKeyDown(event) {
  if (event.repeat) {
    return;
  }
  const key = event.key.toLowerCase();
  if (!worldState.started && (key === 'enter' || key === ' ')) {
    startGame();
    return;
  }
  if (key === 'escape') {
    togglePause(!worldState.paused);
    return;
  }
  if (!worldState.started || worldState.paused || gameState.ritualComplete) {
    return;
  }
  if (key === 'arrowleft' || key === 'a') {
    inputState.left = true;
  }
  if (key === 'arrowright' || key === 'd') {
    inputState.right = true;
  }
  if (key === 'arrowup' || key === 'w' || key === ' ') {
    inputState.jumpHeld = true;
    inputState.jumpBuffer = JUMP_BUFFER_TIME;
  }
}

function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') {
    inputState.left = false;
  }
  if (key === 'arrowright' || key === 'd') {
    inputState.right = false;
  }
  if (key === 'arrowup' || key === 'w' || key === ' ') {
    inputState.jumpHeld = false;
  }
}

function gameLoop(timestamp) {
  if (worldState.paused) {
    return;
  }
  if (!runtimeState.lastTimestamp) {
    runtimeState.lastTimestamp = timestamp;
  }
  const dt = Math.min((timestamp - runtimeState.lastTimestamp) / 1000, 0.05);
  runtimeState.lastTimestamp = timestamp;
  updateWorld(dt);
  drawScene();
  runtimeState.animationFrameId = window.requestAnimationFrame(gameLoop);
}
