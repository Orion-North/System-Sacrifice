import { gameState, selectors } from './state.js';
import { playDeleteSound } from './audio.js';
import { updateProgress, appendLogEntry, trimLog } from './ui.js';
import { applyConsequences } from './consequences.js';

export function renderFileExplorer() {
  selectors.folderContainer.innerHTML = '';
  Object.keys(gameState.filesystem)
    .sort()
    .forEach(function (folderName) {
      const node = gameState.filesystem[folderName];
      const element = buildFolderElement(folderName, node, [folderName], 0);
      selectors.folderContainer.appendChild(element);
    });
}

function buildFolderElement(name, node, pathParts, depth) {
  const details = document.createElement('details');
  details.className = 'folder';
  details.dataset.depth = String(depth);
  const folderPath = pathParts.join('/');
  details.dataset.path = folderPath;
  if (gameState.openFolders.has(folderPath)) {
    details.open = true;
  }

  const summary = document.createElement('summary');
  summary.textContent = name;
  details.appendChild(summary);

  details.addEventListener('toggle', function () {
    if (details.open) {
      gameState.openFolders.add(folderPath);
    } else {
      gameState.openFolders.delete(folderPath);
    }
  });

  if (Array.isArray(node)) {
    if (node.length === 0) {
      details.appendChild(createPlaceholderRow(depth + 1));
    } else {
      node.forEach(function (file) {
        const row = createFileEntry(pathParts.concat(file), depth + 1);
        details.appendChild(row);
      });
    }
  } else {
    const childKeys = Object.keys(node).sort();
    if (childKeys.length === 0) {
      details.appendChild(createPlaceholderRow(depth + 1));
    }
    childKeys.forEach(function (childName) {
      const childNode = node[childName];
      const childElement = buildFolderElement(childName, childNode, pathParts.concat(childName), depth + 1);
      details.appendChild(childElement);
    });
  }

  return details;
}

function createPlaceholderRow(depth) {
  const empty = document.createElement('div');
  empty.className = 'file-entry empty';
  empty.dataset.depth = String(depth);
  empty.textContent = '<< empty >>';
  return empty;
}

function createFileEntry(pathParts, depth) {
  const fileName = pathParts[pathParts.length - 1];
  const row = document.createElement('div');
  row.className = 'file-entry';
  row.dataset.path = pathParts.join('/');
  row.dataset.depth = String(depth);

  const label = document.createElement('span');
  label.textContent = fileName;

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Delete ' + fileName);
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
