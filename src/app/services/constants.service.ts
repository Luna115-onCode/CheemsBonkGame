import { Injectable } from '@angular/core';

export interface PageName {
  closet: string;
  devSettings: string;
  game: string;
  menu: string;
  onWork: string;
  p404: string;
  settings: string;
  offline: string;
  shop: string;
  block_breaker?: string;
  attack_hole?: string;
  doge_rescue?: string;
  flappy_dunk?: string;
  helix_jump?: string;
  magic_sort?: string;
  mob_control?: string;
  paper_io?: string;
  spiral_roll?: string;
  stack_colors?: string;
  minigames?: string;
  stats?: string;
  licenses?: string;
}

export function createLangMap<T extends object>(base: T): Record<string, T> {
  return new Proxy({} as Record<string, T>, {
    get(target, prop: string) {
      if (!(prop in target)) {
        target[prop] = JSON.parse(JSON.stringify(base));
      }
      return target[prop];
    }
  });
}

export interface CheemsSkinItem {
  id: string;
  nameKey?: string;
  nameEs?: string;
  nameEn?: string;
  img: string;
  imgUrl?: string;
  hitImg?: string;
  hitImgUrl?: string;
  cost?: number;
  default?: boolean;
  storageKey: string;
}

export interface SoundEffectItem {
  id: string;
  nameKey?: string;
  name?: string;
  cost?: number;
  default?: boolean;
  storageKey: string;
  file?: string;
  files?: string[];
  basePath?: string;
}

export interface MusicTrackItem {
  id: string | number;
  nameKey?: string;
  name?: string;
  file: string;
  basePath?: string;
  url?: string;
  default?: boolean;
  cost?: number;
  storageKey: string;
}

export interface LanguageItem {
  key: string;
  name: string;
}

export const AVAILABLE_LANGUAGES: Array<LanguageItem> = [
  { key: 'es', name: 'Español' },
  { key: 'en', name: 'English' }
];

export const showCoins: Array<string> = [
  "game", "dev-settings", "closet", "menu", "block_breaker", "attack_hole", "doge_rescue", "flappy_dunk", "helix_jump", "magic_sort", "mob_control", "paper_io", "spiral_roll", "stack_colors", "minigames"
];

export const pageName: PageName = {
  closet: "",
  devSettings: "",
  game: "",
  menu: "",
  onWork: "",
  p404: "",
  settings: "",
  offline: "",
  shop: "",
  block_breaker: "",
  attack_hole: "",
  doge_rescue: "",
  flappy_dunk: "",
  helix_jump: "",
  magic_sort: "",
  mob_control: "",
  paper_io: "",
  spiral_roll: "",
  stack_colors: "",
  minigames: "",
  stats: "",
  licenses: ""
};

export const menuText = {
  minigames: "",
  settings: "",
  offline: "",
  shop: "",
  closet: "",
  stats: "",
  licenses: "",
  devMenu: "",
  buyDogeCoin: "",
  buyDogeCoinSub: "",
  buyDogeCoinSuccess: "",
  buyDogeCoinFail: ""
};

export const minigamesText = {
  title: "",
  block_breaker_title: "",
  attack_hole_title: "",
  doge_rescue_title: "",
  flappy_dunk_title: "",
  helix_jump_title: "",
  magic_sort_title: "",
  mob_control_title: "",
  paper_io_title: "",
  spiral_roll_title: "",
  stack_colors_title: "",
  playerLevel: "",
  lvl: "",
  trash: "",
  lane1: "",
  lane2: "",
  lane3: "",
  lane4: "",
  lane5: "",
  dropTools: "",
  digging: "",
  buyShovel: "",
  buyPickaxe: "",
  levelCleared: "",
  levelClearedDesc: "",
  nextLevel: "",
  levelFailed: "",
  levelFailedDesc: "",
  tryAgain: "",
  startGame: "",
  score: "",
  best: "",
  time: "",
  level: "",
  youWin: "",
  gameOver: "",
  playAgain: "",
  restart: "",
  victory: "",
  defeat: "",
  convertedPointsToast: "",
  attack_hole_level: "",
  attack_hole_session_points: "",
  attack_hole_level_points: "",
  attack_hole_attack: "",
  attack_hole_inst: "",
  doge_rescue_inst: "",
  flappy_dunk_inst: "",
  helix_jump_inst: "",
  magic_sort_inst: "",
  mob_control_inst: "",
  paper_io_inst: "",
  spiral_roll_inst: "",
  stack_colors_inst: ""
};

export const optionsText = {
  changeLang: {
    button: ""
  },
  musicVolume: "",
  effectsVolume: "",
  appTheme: "",
  themes: {
    light: "",
    dark: "",
    contrast: ""
  },
  fontSize: "",
  sizes: {
    smaller: "",
    small: "",
    normal: "",
    big: "",
    max: ""
  },
  saveManagement: "",
  deleteProgress: "",
  deleteProgressConfirm: "",
  exportSave: "",
  importSave: "",
  importSaveConfirm: ""
};

export const statsText = {
  title: "",
  highScore: "",
  totalTouches: "",
  lifetimePoints: "",
  lifetimeDogeCoins: "",
  lifetimeMinigameCoins: ""
};

export const gameText = {
  navbar: {
    highScore: "",
    actScore: "",
    totalScore: ""
  },
  tapToBonk: ""
};

export const closetText = {
  title: "",
  cheemsSection: "",
  soundsSection: "",
  musicSection: "",
  selected: "",
  equipped: "",
  purchased: "",
  cost: "",
  free: "",
  buy: "",
  equip: "",
  needMoreCoins: "",
  itemBought: "",
  itemSelected: ""
};

export const devText = {
  title: "",
  resetToZero: "",
  unlockAll: "",
  giveDogeCoins: "",
  givePoints: "",
  success: "",
  unlocked: "",
  locked: ""
};

export const onWorkText = {
  title: "",
  message: "",
  backToMenu: ""
};

export const p404Text = {
  title: "",
  message: "",
  backToGame: ""
};

export const flappy_dunkText = {
  title: "",
  instructions_finite: "",
  instructions_infinite: "",
  tapToPlay: "",
  gameOver: "",
  scoreLabel: "",
  playAgain: ""
};

export const magic_sortText = {
  title: "",
  instructions: "",
  startGame: "",
  levelCleared: "",
  nextLevel: "",
  levelPrefix: "",
  restart: ""
};

export const offlineText = {
  title: "",
  subtitle: "",
  downloadAll: "",
  essentialsTitle: "",
  essentialsDesc: "",
  sfxTitle: "",
  sfxDesc: "",
  musicTitle: "",
  musicDesc: "",
  downloaded: "",
  download: "",
  downloading: "",
  successToast: "",
  errorToast: "",
  checkForUpdates: "",
  minigamesTitle: "",
  minigamesDesc: ""
};

export interface OfflineCategory {
  id: 'essentials' | 'sfx' | 'music' | 'minigames';
  titleKey: string;
  descKey: string;
  sizeLabel: string;
  urls: string[];
}

export const OFFLINE_CATEGORIES: OfflineCategory[] = [
  {
    id: 'essentials',
    titleKey: 'essentialsTitle',
    descKey: 'essentialsDesc',
    sizeLabel: '~9.5 MB',
    urls: [
      '/',
      'index.html',
      'favicon.ico',
      'manifest.webmanifest',
      'closet.json',
      'items/cheems.json',
      'items/sound_effects.json',
      'items/music.json',
      'lang/texts.en.lang',
      'lang/texts.es.lang',
      'img/dogecoin-min.png',
      'img/dogecoin-min.svg',
      'img/dogecoin.png',
      'img/dogecoin.svg',
      'img/favicon.ico',
      'img/cheems/3d.png',
      'img/cheems/adult.png',
      'img/cheems/black.png',
      'img/cheems/elegant.png',
      'img/cheems/kid.png',
      'img/cheems/little.png',
      'img/cheems/locked-cheems.png',
      'img/cheems/mamado.png',
      'img/cheems/normal.png',
      'img/cheems/pixelart.png',
      'img/hit/3d.png',
      'img/hit/adult.png',
      'img/hit/black.png',
      'img/hit/elegant.png',
      'img/hit/kid.png',
      'img/hit/little.png',
      'img/hit/mamado.png',
      'img/hit/normal.png',
      'img/hit/pixelart.png',
      'img/icons/application-svgrepo-com.svg',
      'img/icons/black-music-svgrepo-com.svg',
      'img/icons/black-sound-svgrepo-com.svg',
      'img/icons/earphone-svgrepo-com.svg',
      'img/icons/front-page-svgrepo-com.svg',
      'img/icons/link-svgrepo-com.svg',
      'img/icons/lock-keyhole-minimalistic-svgrepo-com.svg',
      'img/icons/lock-keyhole-minimalistic-unlocked-svgrepo-com.svg',
      'img/icons/menu-svgrepo-com.svg',
      'img/icons/music-svgrepo-com.svg',
      'img/icons/personal-svgrepo-com.svg',
      'img/icons/picture-svgrepo-com.svg',
      'img/icons/play-svgrepo-com.svg',
      'img/icons/report-svgrepo-com.svg',
      'img/icons/set-up-svgrepo-com.svg',
      'img/icons/shopping-svgrepo-com.svg',
      'img/icons/sound-svgrepo-com.svg',
      'img/icons/the-internet-svgrepo-com.svg',
      'img/icons/trophy-svgrepo-com.svg',
      'img/icons/volume-cross-svgrepo-com.svg',
      'img/icons/volume-loud-svgrepo-com.svg',
      'img/icons/volume-small-svgrepo-com.svg',
      'img/icons/pwa/icon-144x144.png',
      'img/icons/pwa/icon-192x192.png',
      'img/icons/pwa/icon-512x512.png',
      'img/icons/pwa/icon-72x72.png'
    ]
  },
  {
    id: 'sfx',
    titleKey: 'sfxTitle',
    descKey: 'sfxDesc',
    sizeLabel: '~550 KB',
    urls: [
      'sound/discord-connect.ogg',
      'sound/discord-disconnect.ogg',
      'sound/discord-msg.ogg',
      'sound/hello.ogg',
      'sound/hit-minecraft.ogg',
      'sound/hit.ogg',
      'sound/hurt-minecraft.ogg',
      'sound/hurt-roblox.ogg',
      'sound/levelup1.ogg',
      'sound/levelup2.ogg',
      'sound/no.ogg',
      'sound/pato.ogg',
      'sound/peluche.ogg',
      'sound/splat.ogg',
      'sound/windows-error.ogg',
      'sound/menu/Desaparecer.ogg',
      'sound/menu/deslis.ogg',
      'sound/menu/teclas.ogg'
    ]
  },
  {
    id: 'music',
    titleKey: 'musicTitle',
    descKey: 'musicDesc',
    sizeLabel: '~119 MB',
    urls: [
      'sound/music/A_Jazz_Piano.ogg',
      'sound/music/Jack_Bootleg.ogg',
      'sound/music/Magic_night.ogg',
      'sound/music/Minimalism_No10.ogg',
      'sound/music/Minimalism_No9.ogg',
      'sound/music/TETRIS (Joey iLLah Bootleg) (Final).wav',
      'sound/music/When_you_smile.ogg',
      'sound/music/believe-me-143530.mp3',
      'sound/music/city-streets-background-version-166003.mp3',
      'sound/music/coffee-shop-189585.mp3',
      'sound/music/electro-summer-positive-party-141081.mp3',
      'sound/music/separation-185196.mp3',
      'sound/music/titanium-170190.mp3',
      'sound/music/trap-future-bass-royalty-free-music-167020.mp3'
    ]
  },
  {
    id: 'minigames',
    titleKey: 'minigamesTitle',
    descKey: 'minigamesDesc',
    sizeLabel: '~500 KB',
    urls: [
      'games/paper_io/data/bots.json'
    ]
  }
];

export const CHEEMS_SKINS: Array<CheemsSkinItem> = [];

export const SOUND_EFFECTS: Array<SoundEffectItem> = [];

export const MUSIC_TRACKS: Array<MusicTrackItem> = [];

export interface ShopItem {
  id: string;
  type: 'dogecoin' | 'currency' | 'minigame' | 'booster' | 'cheems' | 'sound' | 'music';
  targetId?: string | number;
  nameKey?: string;
  nameEs?: string;
  nameEn?: string;
  descKey?: string;
  descEs?: string;
  descEn?: string;
  cost: number;
  costCoins?: number;
  costMinigames?: number;
  multiplier?: number;
  durationMin?: number;
  coinsGiven?: number;
  minigameCoinsGiven?: number;
  icon: string;
  dailyLimit?: number;
  oneTimePurchase?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationsService {
  constructor() { }
}
