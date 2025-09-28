import { FILE_ASSET_MAP, TEXTURE_PLACEHOLDER_SRC } from './constants.js';
import { loadImage } from './utils.js';

const managedAssets = {};
const placeholderImage = loadImage(TEXTURE_PLACEHOLDER_SRC);

function getAssetEntry(path) {
  let entry = managedAssets[path];
  if (!entry) {
    const src = FILE_ASSET_MAP[path];
    entry = {
      image: src ? loadImage(src) : null,
      active: true,
    };
    managedAssets[path] = entry;
  }
  return entry;
}

export function getActiveImage(path) {
  const entry = getAssetEntry(path);
  if (!entry.active) {
    return placeholderImage;
  }
  if (!entry.image) {
    return placeholderImage;
  }
  const img = entry.image;
  if (!img.complete || img.naturalWidth === 0) {
    return placeholderImage;
  }
  return img;
}

export function setAssetActive(path, active) {
  const entry = getAssetEntry(path);
  entry.active = active;
}

export function resetAssetStates() {
  Object.keys(managedAssets).forEach(function (key) {
    managedAssets[key].active = true;
  });
}

export function getPlaceholderImage() {
  return placeholderImage;
}
