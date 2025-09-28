import { gameState, selectors } from './state.js';
import { playDeleteSound } from './audio.js';
import { updateProgress, appendLogEntry, trimLog } from './ui.js';
import { applyConsequences } from './consequences.js';

export function renderFileExplorer() {
  selectors.folderContainer.innerHTML = '';
  const allFiles = collectFilePaths(gameState.filesystem);
  allFiles.sort();

  if (allFiles.length === 0) {
    selectors.folderContainer.appendChild(createPlaceholderRow());
    return;
  }

  allFiles.forEach(function (path) {
    const row = createFileEntry(path);
    selectors.folderContainer.appendChild(row);
  });
}

function collectFilePaths(node, pathParts) {
  const currentParts = pathParts || [];
  if (Array.isArray(node)) {
    return node.map(function (fileName) {
      return currentParts.concat(fileName).join('/');
    });
  }
  return Object.keys(node).reduce(function (paths, key) {
    const child = node[key];
    const childPaths = collectFilePaths(child, currentParts.concat(key));
    return paths.concat(childPaths);
  }, []);
}

function createPlaceholderRow() {
  const empty = document.createElement('div');
  empty.className = 'file-entry empty';
  empty.textContent = '<< filesystem empty >>';
  return empty;
}

function createFileEntry(path) {
  const row = document.createElement('div');
  row.className = 'file-entry';
  row.dataset.path = path;

  const label = document.createElement('span');
  label.className = 'file-path';
  label.textContent = path;
  label.title = path;

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Delete ' + path);
  button.textContent = 'Delete';
  button.addEventListener('click', function () {
    handleDeleteClick(row);
  });

  row.append(label, button);
  return row;
}

function handleDeleteClick(rowElement) {
  if (gameState.ritualComplete) {
    return;
  }
  const path = rowElement.dataset.path;
  rowElement.classList.add('burning');
  window.setTimeout(function () {
    if (deleteFile(path)) {
      renderFileExplorer();
    } else {
      rowElement.classList.remove('burning');
    }
  }, 420);
}

function deleteFile(path) {
  if (!path) {
    return false;
  }
  const parts = path.split('/');
  const fileName = parts.pop();
  let parent = gameState.filesystem;
  for (let i = 0; i < parts.length; i += 1) {
    const segment = parts[i];
    parent = parent[segment];
    if (parent === undefined) {
      return false;
    }
  }
  if (!Array.isArray(parent)) {
    return false;
  }
  const index = parent.indexOf(fileName);
  if (index === -1) {
    return false;
  }
  parent.splice(index, 1);

  gameState.deletedFiles.push({ path: path, timestamp: Date.now() });
  playDeleteSound();
  updateProgress();
  appendLogEntry(path);
  applyConsequences(path);
  trimLog();
  return true;
}
