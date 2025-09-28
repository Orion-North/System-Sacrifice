export function cloneFilesystem(node) {
  if (Array.isArray(node)) {
    return node.slice();
  }
  const clone = {};
  Object.keys(node).forEach(function (key) {
    clone[key] = cloneFilesystem(node[key]);
  });
  return clone;
}

export function countTotalFiles(node) {
  if (Array.isArray(node)) {
    return node.length;
  }
  return Object.values(node).reduce(function (total, child) {
    return total + countTotalFiles(child);
  }, 0);
}

export function loadImage(src) {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  return img;
}
