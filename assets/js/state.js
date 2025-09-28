import { INITIAL_FILESYSTEM, SCENES, COYOTE_TIME, CAPYBARA_SCENE_ID } from './constants.js';
import { cloneFilesystem, countTotalFiles } from './utils.js';
const CAPYBARA_SCENE_INDEX = SCENES.findIndex(function (scene) {
  return scene.id === CAPYBARA_SCENE_ID;
});
const DEFAULT_CAPYBARA_SCENE_INDEX = CAPYBARA_SCENE_INDEX === -1 ? SCENES.length - 1 : CAPYBARA_SCENE_INDEX;

export const gameState = {
  filesystem: cloneFilesystem(INITIAL_FILESYSTEM),
  totalFiles: countTotalFiles(INITIAL_FILESYSTEM),
  deletedFiles: [],
  ritualComplete: false,
  glitchLevel: 0,
  gameStarted: false,
  openFolders: new Set(),
};

export const selectors = {
  folderContainer: document.getElementById('folder-container'),
  logList: document.getElementById('log-list'),
  progressBar: document.getElementById('progress-bar'),
  progressContainer: document.querySelector('.progress-container'),
  glitchOverlay: document.getElementById('glitch-overlay'),
  finalScreen: document.getElementById('final-screen'),
  restartButton: document.getElementById('restart-button'),
  resetButton: document.getElementById('reset-button'),
  startButton: document.getElementById('start-button'),
  pauseOverlay: document.getElementById('pause-overlay'),
  resumeButton: document.getElementById('resume-button'),
  canvas: document.getElementById('game-canvas'),
};

export const worldState = {
  started: false,
  paused: false,
  playerMissingTexture: false,
  mugPresent: true,
  backgroundBlackout: false,
  startButtonPresent: true,
  pauseMenuPresent: true,
  physicsBroken: false,
  barrierPresent: true,
  currentScene: 0,
  fadeLevel: 0,
  fadeTarget: 0,
  coyoteTimer: COYOTE_TIME,
  barrierPhase: 0,
  player: {
    x: 160,
    y: 0,
    width: 64,
    height: 96,
    vx: 0,
    vy: 0,
    onGround: true,
    animationFrame: 0,
    animationTimer: 0,
    facing: 1,
  },
  mug: {
    x: SCENES[0].mugX,
    y: 0,
    width: 28,
    height: 42,
    vy: 0,
  },
  capybara: {
    present: false,
    unlocked: false,
    x: 520,
    y: 0,
    width: 84,
    height: 48,
    baseY: 0,
    bobPhase: 0,
    sceneIndex: DEFAULT_CAPYBARA_SCENE_INDEX,
  },
  playerMorph: {
    animating: false,
    completed: false,
    animationFrame: 0,
    animationTimer: 0,
    deactivateSkeletonAsset: false,
  },
};

export const inputState = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpBuffer: 0,
};

export const audioState = {
  context: null,
  masterGain: null,
  themeElement: null,
  themeEnabled: true,
  themePlaying: false,
  jumpEnabled: true,
};

export const runtimeState = {
  ctx: null,
  animationFrameId: null,
  lastTimestamp: 0,
  glitchTimeoutId: null,
};
