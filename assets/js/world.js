import {
  TILE_SIZE,
  GROUND_SURFACE_OFFSET,
  SCENES,
  SCENE_COUNT,
  BARRIER_SCENE_INDEX,
  BARRIER_PATH,
  BARRIER_WIDTH,
  BARRIER_HEIGHT,
  TILE_DEFINITIONS,
  CHARACTER_ASSET_PATH,
  COFFEE_MUG_PATH,
  CAPYBARA_PATH,
  SKELETON_PATH,
  CHARACTER_SPRITE_COLUMNS,
  CHARACTER_SPRITE_ROWS,
  CHARACTER_ANIMATION_FPS,
  SKELETON_SPRITE_COLUMNS,
  SKELETON_SPRITE_ROWS,
  SKELETON_ANIMATION_FPS,
  BLOB_PLACEHOLDER_SRC,
  physicsState,
  COYOTE_TIME,
} from './constants.js';
import { worldState, inputState, selectors, runtimeState } from './state.js';
import { getActiveImage, getPlaceholderImage, setAssetActive } from './assetManager.js';
import { loadImage } from './utils.js';
import { playJumpSound, playGlitchSound } from './audio.js';
import { flashGlitchOverlay } from './ui.js';



const blobPlaceholderImage = loadImage(BLOB_PLACEHOLDER_SRC);
const SKELETON_TOTAL_FRAMES = Math.max(1, SKELETON_SPRITE_COLUMNS * SKELETON_SPRITE_ROWS);

export function resetWorldState() {
  worldState.started = false;
  worldState.paused = false;
  worldState.playerMissingTexture = false;
  worldState.mugPresent = true;
  worldState.backgroundBlackout = false;
  worldState.startButtonPresent = true;
  worldState.pauseMenuPresent = true;
  worldState.physicsBroken = false;
  worldState.barrierPresent = true;
  worldState.currentScene = 0;
  worldState.fadeLevel = 0;
  worldState.fadeTarget = 0;
  worldState.coyoteTimer = COYOTE_TIME;
  worldState.barrierPhase = 0;

  const surfaceY = getGroundSurfaceY();
  const player = worldState.player;
  player.x = 160;
  player.y = surfaceY - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.animationFrame = 0;
  player.animationTimer = 0;
  player.facing = 1;

  const mug = worldState.mug;
  mug.x = SCENES[0].mugX;
  mug.y = surfaceY - mug.height;
  mug.vy = 0;
  const capy = worldState.capybara;
  capy.present = false;
  capy.unlocked = false;
  capy.bobPhase = 0;
  capy.x = Math.max(120, selectors.canvas.width - capy.width - 140);
  capy.baseY = surfaceY - capy.height;
  capy.y = capy.baseY;

  const playerMorph = worldState.playerMorph;
  playerMorph.animating = false;
  playerMorph.completed = false;
  playerMorph.animationFrame = 0;
  playerMorph.animationTimer = 0;
  playerMorph.deactivateSkeletonAsset = false;

  inputState.left = false;
  inputState.right = false;
  inputState.jumpHeld = false;
  inputState.jumpBuffer = 0;

  selectors.startButton.classList.remove('hidden');
  selectors.pauseOverlay.classList.add('hidden');
}

export function updateWorld(dt) {
  if (!worldState.started || worldState.paused) {
    return;
  }

  const player = worldState.player;
  const physics = worldState.physicsBroken ? physicsState.float : physicsState.normal;
  const canvasWidth = selectors.canvas.width;
  const groundY = getGroundSurfaceY();

  worldState.coyoteTimer = Math.max(0, worldState.coyoteTimer - dt);
  inputState.jumpBuffer = Math.max(0, inputState.jumpBuffer - dt);

  let direction = 0;
  if (inputState.left) {
    direction -= 1;
  }
  if (inputState.right) {
    direction += 1;
  }

  if (direction !== 0) {
    player.vx += direction * physics.acceleration * dt;
    if (Math.abs(player.vx) > physics.maxSpeed) {
      player.vx = physics.maxSpeed * Math.sign(player.vx);
    }
  } else {
    const decel = physics.groundDrag * dt;
    if (Math.abs(player.vx) <= decel) {
      player.vx = 0;
    } else {
      player.vx -= decel * Math.sign(player.vx);
    }
  }

  if (direction > 0) {
    player.facing = 1;
  } else if (direction < 0) {
    player.facing = -1;
  }
  player.x += player.vx * dt;
  player.vy += physics.gravity * dt;

  if (inputState.jumpBuffer > 0 && (player.onGround || worldState.coyoteTimer > 0)) {
    player.vy = worldState.physicsBroken ? physics.jumpVelocity : -physics.jumpVelocity;
    player.onGround = false;
    inputState.jumpBuffer = 0;
    worldState.coyoteTimer = 0;
    playJumpSound();
  }

  if (!inputState.jumpHeld) {
    if (!worldState.physicsBroken && player.vy < 0) {
      player.vy += physics.gravity * dt * 0.45;
    }
    if (worldState.physicsBroken && player.vy > 0) {
      player.vy += physics.gravity * dt * 0.45;
    }
  }

  player.y += player.vy * dt;

  if (!worldState.physicsBroken) {
    if (player.y + player.height >= groundY) {
      player.y = groundY - player.height;
      player.vy = 0;
      if (!player.onGround) {
        worldState.coyoteTimer = COYOTE_TIME;
      }
      player.onGround = true;
    } else {
      player.onGround = false;
    }
  } else {
    const ceiling = 60;
    if (player.y <= ceiling) {
      player.y = ceiling;
      if (player.vy < 0) {
        player.vy = 0;
      }
      player.onGround = true;
      worldState.coyoteTimer = COYOTE_TIME;
    } else {
      player.onGround = false;
    }
    if (player.y + player.height >= groundY) {
      player.y = groundY - player.height;
      if (player.vy > 0) {
        player.vy *= -0.25;
      }
    }
  }

  if (worldState.currentScene === BARRIER_SCENE_INDEX && worldState.barrierPresent) {
    const barrierX = getBarrierX();
    if (player.x + player.width > barrierX) {
      player.x = barrierX - player.width;
      if (player.vx > 0) {
        player.vx = 0;
      }
    }
  }

  if (worldState.mugPresent) {
    resolveMugCollision(player, worldState.mug);
  }

  if (player.x + player.width > canvasWidth - 4) {
    if (!attemptSceneTransition('next', groundY)) {
      player.x = canvasWidth - player.width - 4;
    } else {
      return;
    }
  }
  if (player.x < -4) {
    if (!attemptSceneTransition('prev', groundY)) {
      player.x = -4;
    } else {
      return;
    }
  }

  const totalFrames = CHARACTER_SPRITE_COLUMNS * CHARACTER_SPRITE_ROWS;
  const frameDuration = CHARACTER_ANIMATION_FPS > 0 ? 1 / CHARACTER_ANIMATION_FPS : 0.5;
  const moving = direction !== 0 || !player.onGround || Math.abs(player.vx) > 4;
  if (moving && frameDuration > 0) {
    player.animationTimer += dt;
    while (player.animationTimer >= frameDuration) {
      player.animationTimer -= frameDuration;
      player.animationFrame = (player.animationFrame + 1) % Math.max(1, totalFrames);
    }
  } else if (player.animationFrame !== 0) {
    player.animationFrame = 0;
    player.animationTimer = 0;
  } else {
    player.animationTimer = 0;
  }
  updateMugState(dt, physics, groundY);
  updateSkeleton(dt, groundY);
  updateCapybara(dt, groundY);

  if (worldState.physicsBroken) {
    worldState.barrierPhase += dt * 2.8;
  } else if (worldState.barrierPhase !== 0) {
    worldState.barrierPhase = 0;
  }

  if (worldState.fadeLevel < worldState.fadeTarget) {
    worldState.fadeLevel = Math.min(worldState.fadeTarget, worldState.fadeLevel + dt * 0.25);
  } else if (worldState.fadeLevel > worldState.fadeTarget) {
    worldState.fadeLevel = Math.max(worldState.fadeTarget, worldState.fadeLevel - dt * 0.3);
  }
}

export function drawScene() {
  const ctx = runtimeState.ctx;
  if (!ctx) {
    return;
  }
  const width = selectors.canvas.width;
  const height = selectors.canvas.height;
  const surfaceY = getGroundSurfaceY();
  const baseY = surfaceY + TILE_SIZE;
  const scene = SCENES[worldState.currentScene];

  if (worldState.backgroundBlackout) {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, scene.sky[0]);
    gradient.addColorStop(1, scene.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = scene.floor;
  ctx.fillRect(0, baseY, width, height - baseY);
  drawGroundTiles(ctx, scene, surfaceY, width, height);

  drawSceneDecorations(ctx, scene, baseY);

  if (worldState.mugPresent) {
    drawMug(ctx, scene);
  }
  drawSkeleton(ctx, scene);
  drawCapybara(ctx, scene);
  drawPlayer(ctx, scene);
  drawBarrier(ctx, scene, baseY);

  if (worldState.fadeLevel > 0.001) {
    ctx.fillStyle = 'rgba(0, 0, 0, ' + worldState.fadeLevel + ')';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText(scene.name, 24, 32);
}

export function getGroundSurfaceY() {
  return selectors.canvas.height - GROUND_SURFACE_OFFSET;
}

function getGroundBaseY() {
  return getGroundSurfaceY() + TILE_SIZE;
}

function getBarrierX() {
  return selectors.canvas.width - 170;
}

function updateMugState(dt, physics, groundY) {
  const mug = worldState.mug;
  if (!worldState.mugPresent) {
    return;
  }
  if (worldState.physicsBroken) {
    mug.vy += physics.gravity * dt * 0.5;
    mug.y += mug.vy * dt;
    const upperBound = Math.max(groundY - 260, 110);
    const lowerBound = groundY - mug.height;
    if (mug.y < upperBound) {
      mug.y = upperBound;
      mug.vy = Math.abs(mug.vy) * 0.35;
    }
    if (mug.y > lowerBound) {
      mug.y = lowerBound;
      mug.vy = -Math.abs(mug.vy) * 0.55;
    }
  } else {
    mug.vy = 0;
    mug.y = groundY - mug.height;
  }
}

function updatePlayerMorph(dt) {
  const morph = worldState.playerMorph;
  if (!morph.animating) {
    return;
  }
  const frameDuration = SKELETON_ANIMATION_FPS > 0 ? 1 / SKELETON_ANIMATION_FPS : 0.0625;
  morph.animationTimer += dt;
  while (morph.animationTimer >= frameDuration) {
    morph.animationTimer -= frameDuration;
    morph.animationFrame += 1;
    if (morph.animationFrame >= SKELETON_TOTAL_FRAMES) {
      morph.animating = false;
      morph.completed = true;
      morph.animationFrame = SKELETON_TOTAL_FRAMES - 1;
      morph.animationTimer = 0;
      if (morph.deactivateSkeletonAsset) {
        setAssetActive(SKELETON_PATH, false);
        morph.deactivateSkeletonAsset = false;
      }
      break;
    }
  }
}



function updateCapybara(dt, groundY) {
  const capy = worldState.capybara;
  if (!capy.unlocked) {
    capy.present = false;
    capy.y = capy.baseY;
    return;
  }
  const shouldBeVisible = worldState.currentScene === capy.sceneIndex;
  capy.present = shouldBeVisible;
  capy.baseY = groundY - capy.height;
  if (shouldBeVisible) {
    capy.x = Math.max(120, selectors.canvas.width - capy.width - 140);
  }
  if (!shouldBeVisible) {
    capy.bobPhase = 0;
    capy.y = capy.baseY;
    return;
  }
  capy.bobPhase = (capy.bobPhase + dt * 1.6) % (Math.PI * 2);
  const bobOffset = Math.sin(capy.bobPhase) * 4;
  capy.y = capy.baseY + bobOffset;
}

function resolveMugCollision(player, mug) {
  const playerLeft = player.x;
  const playerRight = player.x + player.width;
  const playerTop = player.y;
  const playerBottom = player.y + player.height;
  const mugLeft = mug.x;
  const mugRight = mug.x + mug.width;
  const mugTop = mug.y;
  const mugBottom = mug.y + mug.height;

  if (playerRight <= mugLeft || playerLeft >= mugRight || playerBottom <= mugTop || playerTop >= mugBottom) {
    return;
  }

  const overlapLeft = playerRight - mugLeft;
  const overlapRight = mugRight - playerLeft;
  const overlapTop = playerBottom - mugTop;
  const overlapBottom = mugBottom - playerTop;

  const minOverlapX = Math.min(overlapLeft, overlapRight);
  const minOverlapY = Math.min(overlapTop, overlapBottom);

  if (minOverlapX < minOverlapY) {
    if (overlapLeft < overlapRight) {
      player.x = mugLeft - player.width;
      if (player.vx > 0) {
        player.vx = 0;
      }
    } else {
      player.x = mugRight;
      if (player.vx < 0) {
        player.vx = 0;
      }
    }
  } else {
    if (overlapTop < overlapBottom) {
      player.y = mugTop - player.height;
      if (player.vy > 0) {
        player.vy = 0;
      }
      player.onGround = true;
      worldState.coyoteTimer = COYOTE_TIME;
    } else {
      player.y = mugBottom;
      if (player.vy < 0) {
        player.vy = 0;
      }
      player.onGround = false;
    }
  }
}

function attemptSceneTransition(direction, groundY) {
  const current = worldState.currentScene;
  const next = direction === 'next' ? (current + 1) % SCENE_COUNT : (current + SCENE_COUNT - 1) % SCENE_COUNT;
  if (direction === 'next' && current === BARRIER_SCENE_INDEX && worldState.barrierPresent) {
    flashGlitchOverlay('A brick barricade blocks the path.');
    playGlitchSound();
    const player = worldState.player;
    player.x = getBarrierX() - player.width - 2;
    player.vx = 0;
    return false;
  }
  worldState.currentScene = next;
  const player = worldState.player;
  if (direction === 'next') {
    player.x = 32;
  } else {
    player.x = selectors.canvas.width - player.width - 32;
  }
  player.y = Math.min(player.y, groundY - player.height);
  player.vy = 0;
  player.onGround = player.y >= groundY - player.height - 0.5;
  worldState.coyoteTimer = COYOTE_TIME;

  const scene = SCENES[next];
  worldState.mug.x = scene.mugX;
  worldState.mug.y = groundY - worldState.mug.height;
  worldState.mug.vy = worldState.physicsBroken ? Math.min(worldState.mug.vy, -120) : 0;
  let message = 'Entering ' + scene.name;
  if (worldState.capybara.unlocked && worldState.capybara.sceneIndex === next) {
    worldState.capybara.bobPhase = 0;
    message += ' — a capybara greets you.';
  }
  flashGlitchOverlay(message);
  return true;
}

function drawGroundTiles(ctx, scene, surfaceY, width, height) {
  const tileSet = TILE_DEFINITIONS[scene.ground] || TILE_DEFINITIONS.grass;
  const topImage = tileSet ? getActiveImage(tileSet.top) : null;
  const bodyImage = tileSet ? getActiveImage(tileSet.body) : null;
  const tilesAcross = Math.ceil(width / TILE_SIZE) + 1;
  const fallback = scene.floor;
  for (let column = 0; column < tilesAcross; column += 1) {
    const x = column * TILE_SIZE;
    drawTileImage(ctx, topImage, x, surfaceY, fallback);
    for (let y = surfaceY + TILE_SIZE; y < height; y += TILE_SIZE) {
      drawTileImage(ctx, bodyImage, x, y, fallback);
    }
  }
}

function drawTileImage(ctx, image, x, y, fallbackColor) {
  if (image) {
    ctx.drawImage(image, x, y, TILE_SIZE, TILE_SIZE);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
}

function drawSceneDecorations(ctx, scene, groundY) {
  ctx.save();
  if (scene.id === 'atrium') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 3; i += 1) {
      const x = 140 + i * 210;
      ctx.fillRect(x, groundY - 160, 26, 160);
      ctx.strokeStyle = scene.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, groundY - 150, 18, 120);
    }
  } else if (scene.id === 'archive') {
    ctx.fillStyle = 'rgba(255, 190, 120, 0.08)';
    for (let y = groundY - 40; y > groundY - 160; y -= 26) {
      ctx.fillRect(90, y, 560, 6);
    }
  } else if (scene.id === 'sanctum') {
    ctx.strokeStyle = 'rgba(255, 78, 109, 0.4)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(400, groundY - 180, 140 - i * 24, 58 - i * 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}


function drawPlayer(ctx, scene) {
  const player = worldState.player;
  const placeholder = getPlaceholderImage();
  ctx.save();
  if (worldState.playerMissingTexture) {
    if (placeholder && placeholder.complete && placeholder.naturalWidth > 0) {
      ctx.drawImage(placeholder, player.x, player.y, player.width, player.height);
    } else {
      ctx.fillStyle = '#ff55ff';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.strokeStyle = '#2d0032';
      ctx.lineWidth = 3;
      ctx.strokeRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = '#2d0032';
      ctx.font = '12px monospace';
      ctx.fillText('NO TEX', player.x + 6, player.y + player.height / 2);
    }
    ctx.restore();
    return;
  }

  const sprite = getActiveImage(CHARACTER_ASSET_PATH);
  const sheetUsable =
    sprite &&
    sprite !== placeholder &&
    sprite.naturalWidth >= CHARACTER_SPRITE_COLUMNS &&
    sprite.naturalHeight >= CHARACTER_SPRITE_ROWS;

  if (sheetUsable) {
    const totalFrames = Math.max(1, CHARACTER_SPRITE_COLUMNS * CHARACTER_SPRITE_ROWS);
    const frameIndex = player.animationFrame % totalFrames;
    const column = frameIndex % CHARACTER_SPRITE_COLUMNS;
    const row = Math.floor(frameIndex / CHARACTER_SPRITE_COLUMNS);
    const frameWidth = sprite.naturalWidth / CHARACTER_SPRITE_COLUMNS;
    const frameHeight = sprite.naturalHeight / CHARACTER_SPRITE_ROWS;

    if (player.facing < 0) {
      ctx.translate(player.x + player.width, player.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(player.x, player.y);
    }

    ctx.drawImage(
      sprite,
      column * frameWidth,
      row * frameHeight,
      frameWidth,
      frameHeight,
      0,
      0,
      player.width,
      player.height
    );
    ctx.restore();
    return;
  }

  const gradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
  gradient.addColorStop(0, '#ffca68');
  gradient.addColorStop(1, '#d17a36');
  ctx.fillStyle = gradient;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = '#1a1325';
  ctx.fillRect(player.x + 12, player.y + 18, 10, 10);
  ctx.fillRect(player.x + player.width - 22, player.y + 18, 10, 10);
  ctx.fillStyle = scene.accent;
  ctx.fillRect(player.x + 10, player.y + player.height - 14, player.width - 20, 6);
  ctx.restore();
}

function drawMug(ctx, scene) {
  const mug = worldState.mug;
  const mugImage = getActiveImage(COFFEE_MUG_PATH);
  const placeholder = getPlaceholderImage();
  const hasImage = mugImage && mugImage !== placeholder;
  const wobble = worldState.physicsBroken ? Math.sin(worldState.barrierPhase * 1.4) * 0.22 : 0;

  ctx.save();
  ctx.translate(mug.x + mug.width / 2, mug.y + mug.height / 2);
  if (wobble) {
    ctx.rotate(wobble);
  }

  if (hasImage) {
    ctx.drawImage(mugImage, -mug.width / 2, -mug.height / 2, mug.width, mug.height);
  } else {
    ctx.fillStyle = scene.accent;
    ctx.fillRect(-mug.width / 2, -mug.height / 2, mug.width, mug.height);
    ctx.fillStyle = 'rgba(12, 20, 32, 0.9)';
    ctx.fillRect(-mug.width / 2, mug.height / 2 - 10, mug.width, 10);
  }

  ctx.restore();
}



function drawCapybara(ctx, scene) {
  const capy = worldState.capybara;
  if (!capy.present) {
    return;
  }
  const image = getActiveImage(CAPYBARA_PATH);
  const placeholder = getPlaceholderImage();
  const hasImage = image && image !== placeholder;
  const sway = worldState.physicsBroken ? Math.sin(worldState.barrierPhase * 0.8) * 0.05 : 0;

  ctx.save();
  ctx.translate(capy.x + capy.width / 2, capy.y + capy.height / 2);
  if (sway) {
    ctx.rotate(sway);
  }

  if (hasImage) {
    ctx.drawImage(image, -capy.width / 2, -capy.height / 2, capy.width, capy.height);
  } else {
    ctx.fillStyle = '#b3835a';
    ctx.beginPath();
    ctx.ellipse(0, 6, capy.width / 2.2, capy.height / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6d4a2f';
    ctx.beginPath();
    ctx.ellipse(-capy.width / 2.8, -capy.height / 4, capy.width / 3.6, capy.height / 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(capy.width / 8, -capy.height / 6, capy.height / 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}function drawBarrier(ctx, scene, groundY) {
  if (!worldState.barrierPresent || worldState.currentScene !== BARRIER_SCENE_INDEX) {
    return;
  }
  const barrierX = getBarrierX();
  const barrierTop = groundY - BARRIER_HEIGHT;
  const texture = getActiveImage(BARRIER_PATH);
  const placeholder = getPlaceholderImage();

  ctx.save();
  ctx.shadowColor = 'rgba(24, 18, 18, 0.55)';
  ctx.shadowBlur = 10;

  if (texture === placeholder) {
    ctx.fillStyle = '#5c2c2c';
    ctx.fillRect(barrierX, barrierTop, BARRIER_WIDTH, BARRIER_HEIGHT);
  } else {
    const tileWidth = texture.naturalWidth || TILE_SIZE;
    const tileHeight = texture.naturalHeight || TILE_SIZE;
    for (let y = barrierTop; y < groundY; y += tileHeight) {
      const drawHeight = Math.min(tileHeight, groundY - y);
      ctx.drawImage(texture, 0, 0, tileWidth, tileHeight, barrierX, y, BARRIER_WIDTH, drawHeight);
    }
  }

  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = scene.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(barrierX + 2, barrierTop + 2, BARRIER_WIDTH - 4, BARRIER_HEIGHT - 4);
  ctx.restore();
}





