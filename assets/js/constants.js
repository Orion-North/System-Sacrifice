export const INITIAL_FILESYSTEM = {
  textures: {
    avatars: ['Player.png'],
    props: {
      beverages: ['CoffeeMug.png'],
    },
    environment: {
      backgrounds: ['Background.png'],
      tiles: {
        grass: ['GrassTop.png', 'GrassBody.png'],
        wood: ['WoodTop.png', 'WoodBody.png'],
      },
    },
  },
  sounds: {
    sfx: ['Jump.wav'],
    music: ['ThemeSong.mp3'],
  },
  ui: {
    overlays: {
      start: ['StartButton.png'],
      pause: ['PauseMenu.png'],
    },
  },
  core: {
    subsystems: ['Physics.dll'],
    runtime: ['System.exe'],
  },
  world: {
    barriers: ['ObsidianWall.asset'],
    fauna: ['Capybara.png', 'Skelleton.anim'],
  },
};

export const CONSEQUENCE_DESCRIPTIONS = {
  'textures/avatars/Player.png': 'Player sprite replaced with a missing-texture box.',
  'textures/props/beverages/CoffeeMug.png': 'Coffee mug object removed from the scene.',
  'textures/environment/backgrounds/Background.png': 'Background dissolved into darkness.',
  'textures/environment/tiles/grass/GrassTop.png': 'Grass canopy texture shredded.',
  'textures/environment/tiles/grass/GrassBody.png': 'Grass underlayer eroded.',
  'textures/environment/tiles/wood/WoodTop.png': 'Wooden floorboards splinter.',
  'textures/environment/tiles/wood/WoodBody.png': 'Wood subfloor disintegrates.',
  'sounds/sfx/Jump.wav': 'Jump sound effect muted.',
  'sounds/music/ThemeSong.mp3': 'Ambient theme silenced.',
  'ui/overlays/start/StartButton.png': 'Start button asset deleted.',
  'ui/overlays/pause/PauseMenu.png': 'Pause menu no longer renders.',
  'core/subsystems/Physics.dll': 'Gravity routines destabilised.',
  'core/runtime/System.exe': 'Core system terminated.',
  'world/barriers/ObsidianWall.asset': 'Brick barrier removed from the Archive.',
  'world/fauna/Capybara.png': 'Capybara companion retreats beyond the veil.',
  'world/fauna/Skelleton.anim': 'Skeleton liquefies into a shimmering blob.',
};

export const TILE_SIZE = 48;
export const GROUND_SURFACE_OFFSET = TILE_SIZE * 2 + 32;

export const FILE_ASSET_MAP = {
  'textures/avatars/Player.png': 'assets/gfx/characterwalk.png',
  'textures/environment/tiles/grass/GrassTop.png': 'assets/gfx/ground_grass_top.png',
  'textures/environment/tiles/grass/GrassBody.png': 'assets/gfx/ground_grass.png',
  'textures/environment/tiles/wood/WoodTop.png': 'assets/gfx/ground_wood_top.png',
  'textures/environment/tiles/wood/WoodBody.png': 'assets/gfx/ground_wood.png',
  'world/barriers/ObsidianWall.asset': 'assets/gfx/wall_brick.png',
  'textures/props/beverages/CoffeeMug.png': 'assets/gfx/coffee_placeholder.png',
  'world/fauna/Capybara.png': 'assets/gfx/capybara.png',
  'world/fauna/Skelleton.anim': 'assets/gfx/blobanimation.png',
};

export const TEXTURE_PLACEHOLDER_SRC = 'assets/gfx/texture_missing.png';

export const TILE_DEFINITIONS = {
  grass: {
    top: 'textures/environment/tiles/grass/GrassTop.png',
    body: 'textures/environment/tiles/grass/GrassBody.png',
  },
  wood: {
    top: 'textures/environment/tiles/wood/WoodTop.png',
    body: 'textures/environment/tiles/wood/WoodBody.png',
  },
};

export const CHARACTER_ASSET_PATH = 'textures/avatars/Player.png';
export const COFFEE_MUG_PATH = 'textures/props/beverages/CoffeeMug.png';
export const CHARACTER_SPRITE_COLUMNS = 2;
export const CHARACTER_SPRITE_ROWS = 2;
export const CHARACTER_ANIMATION_FPS = 2;

export const SKELETON_PATH = 'world/fauna/Skelleton.anim';
export const SKELETON_SPRITE_COLUMNS = 6;
export const SKELETON_SPRITE_ROWS = 4;
export const SKELETON_ANIMATION_FPS = 16;
export const BLOB_PLACEHOLDER_SRC = 'assets/gfx/blob_placeholder.png';

export const CAPYBARA_PATH = 'world/fauna/Capybara.png';
export const CAPYBARA_SCENE_ID = 'sanctum';
export const SCENES = [
  {
    id: 'atrium',
    name: 'Atrium of Boot Sequences',
    sky: ['#3d4cd0', '#0b1030'],
    floor: '#181b36',
    accent: '#67ffb0',
    mugX: 360,
    ground: 'grass',
  },
  {
    id: 'archive',
    name: 'Archive of Lost Assets',
    sky: ['#4a3322', '#130903'],
    floor: '#21120d',
    accent: '#ffb347',
    mugX: 500,
    barrier: true,
    ground: 'wood',
  },
  {
    id: 'sanctum',
    name: 'Sanctum of Null Pointers',
    sky: ['#2b173d', '#050007'],
    floor: '#130815',
    accent: '#ff4e6d',
    mugX: 260,
    ground: 'grass',
  },
];

export const SCENE_COUNT = SCENES.length;
export const BARRIER_SCENE_INDEX = SCENES.findIndex(function (scene) {
  return Boolean(scene.barrier);
});
export const BARRIER_PATH = 'world/barriers/ObsidianWall.asset';
export const BARRIER_WIDTH = 48;
export const BARRIER_HEIGHT = 180;

export const COYOTE_TIME = 0.14;
export const JUMP_BUFFER_TIME = 0.14;

export const physicsState = {
  normal: {
    gravity: 1700,
    jumpVelocity: 620,
    maxSpeed: 260,
    acceleration: 1500,
    groundDrag: 1400,
    airDrag: 620,
  },
  float: {
    gravity: -320,
    jumpVelocity: 420,
    maxSpeed: 210,
    acceleration: 900,
    groundDrag: 900,
    airDrag: 420,
  },
};

