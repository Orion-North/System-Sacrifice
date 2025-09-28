import { CONSEQUENCE_DESCRIPTIONS } from './constants.js';
import { gameState, runtimeState, selectors } from './state.js';

export function updateProgress() {
  const total = gameState.totalFiles || 1;
  const progress = Math.min((gameState.deletedFiles.length / total) * 100, 100);
  selectors.progressBar.style.width = progress + '%';
  selectors.progressContainer.setAttribute('aria-valuenow', String(Math.round(progress)));
}

export function appendLogEntry(path) {
  const entry = document.createElement('li');
  entry.className = 'log-entry';
  const stamp = new Date().toLocaleTimeString();
  const note = CONSEQUENCE_DESCRIPTIONS[path];
  let html = '<strong>[' + stamp + '] ' + path + '</strong>';
  if (note) {
    html += '<span class="log-note">' + note + '</span>';
  }
  entry.innerHTML = html;
  selectors.logList.prepend(entry);
}

export function trimLog() {
  while (selectors.logList.children.length > 32) {
    selectors.logList.removeChild(selectors.logList.lastChild);
  }
}

export function flashGlitchOverlay(message) {
  selectors.glitchOverlay.textContent = message;
  selectors.glitchOverlay.classList.add('active');
  if (runtimeState.glitchTimeoutId) {
    window.clearTimeout(runtimeState.glitchTimeoutId);
  }
  runtimeState.glitchTimeoutId = window.setTimeout(function () {
    selectors.glitchOverlay.classList.remove('active');
    runtimeState.glitchTimeoutId = null;
  }, 1800);
}

export function clearGlitchOverlay() {
  selectors.glitchOverlay.classList.remove('active');
  if (runtimeState.glitchTimeoutId) {
    window.clearTimeout(runtimeState.glitchTimeoutId);
    runtimeState.glitchTimeoutId = null;
  }
}
