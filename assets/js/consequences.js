import { BARRIER_PATH, CAPYBARA_PATH, COFFEE_MUG_PATH } from './constants.js';
import { gameState, worldState, selectors, runtimeState, audioState } from './state.js';
import { setAssetActive } from './assetManager.js';
import { flashGlitchOverlay } from './ui.js';
import { playGlitchSound, stopTheme } from './audio.js';

export function applyConsequences(path) {
  switch (path) {
    case 'textures/avatars/Player.png':
      worldState.playerMissingTexture = true;
      setAssetActive(path, false);
      flashGlitchOverlay('Player texture missing');
      break;
    case COFFEE_MUG_PATH:
      worldState.mugPresent = false;
      worldState.mug.vy = 0;
      setAssetActive(COFFEE_MUG_PATH, false);
      flashGlitchOverlay('Coffee mug sacrificed');
      break;
    case 'core/security/reality_anchor.sys':
    case 'core/security/quantum_stability.dat':
    case 'core/security/consciousness_stream.bin':
    case 'core/security/dream_fragments.mem':
      triggerFinalEvent();
      break;
    case 'textures/environment/backgrounds/Background.png':
      worldState.backgroundBlackout = true;
      worldState.fadeTarget = Math.max(worldState.fadeTarget, 0.55);
      flashGlitchOverlay('Background asset lost');
      playGlitchSound();
      break;
    case 'textures/environment/tiles/grass/GrassTop.png':
    case 'textures/environment/tiles/grass/GrassBody.png':
    case 'textures/environment/tiles/wood/WoodTop.png':
    case 'textures/environment/tiles/wood/WoodBody.png':
      setAssetActive(path, false);
      flashGlitchOverlay(getTileMessage(path));
      break;
    case 'sounds/sfx/Jump.wav':
      audioState.jumpEnabled = false;
      flashGlitchOverlay('Jump audio muted');
      break;
    case 'sounds/music/ThemeSong.mp3':
      audioState.themeEnabled = false;
      stopTheme();
      if (audioState.themeElement) {
        audioState.themeElement.currentTime = 0;
      }
      flashGlitchOverlay('Theme music silenced');
      break;
    case 'ui/overlays/start/StartButton.png':
      worldState.startButtonPresent = false;
      selectors.startButton.classList.add('hidden');
      flashGlitchOverlay('Start UI corrupted');
      break;
    case 'ui/overlays/pause/PauseMenu.png':
      worldState.pauseMenuPresent = false;
      selectors.pauseOverlay.classList.add('hidden');
      flashGlitchOverlay('Pause overlay missing');
      break;
    case 'core/subsystems/Physics.dll':
      if (!worldState.physicsBroken) {
        worldState.physicsBroken = true;
        worldState.player.vy = -120;
        worldState.mug.vy = -140;
        worldState.barrierPhase = 0;
        flashGlitchOverlay('Gravity routines destabilised');
        playGlitchSound();
      }
      break;
    case 'core/runtime/System.exe':
      triggerFinalEvent();
      break;
    case BARRIER_PATH:
      if (worldState.barrierPresent) {
        setAssetActive(BARRIER_PATH, false);
        worldState.barrierPresent = false;
        worldState.capybara.unlocked = true;
        worldState.capybara.present = false;
        worldState.capybara.bobPhase = 0;
        flashGlitchOverlay('Brick wall collapses');
        playGlitchSound();
      }
      break;
    case CAPYBARA_PATH:
      worldState.capybara.present = false;
      worldState.capybara.unlocked = false;
      setAssetActive(CAPYBARA_PATH, false);
      flashGlitchOverlay('Capybara companion retreats.');
      playGlitchSound();
      break;
    default:
      break;
  }
}

function getTileMessage(path) {
  switch (path) {
    case 'textures/environment/tiles/grass/GrassTop.png':
      return 'Grass canopy shredded';
    case 'textures/environment/tiles/grass/GrassBody.png':
      return 'Grass underlayer eroded';
    case 'textures/environment/tiles/wood/WoodTop.png':
      return 'Wooden planks splinter';
    case 'textures/environment/tiles/wood/WoodBody.png':
      return 'Wooden subfloor lost';
    default:
      return 'Texture asset corrupted';
  }
}

export function triggerFinalEvent() {
  if (gameState.ritualComplete) {
    return;
  }
  gameState.ritualComplete = true;
  worldState.fadeTarget = 1;
  flashGlitchOverlay('The system has collapsed.');
  stopTheme();
  playGlitchSound();
  selectors.finalScreen.classList.remove('hidden');
  selectors.progressBar.style.width = '100%';
  selectors.progressContainer.setAttribute('aria-valuenow', '100');
  worldState.paused = true;
  if (runtimeState.animationFrameId) {
    window.cancelAnimationFrame(runtimeState.animationFrameId);
    runtimeState.animationFrameId = null;
  }
}
