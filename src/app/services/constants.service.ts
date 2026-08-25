import { Injectable } from '@angular/core';

export interface PageName {
  closet: string;
  redeem: string;
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
  description?: string;
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
  description?: string;
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
  description?: string;
  cover?: string;
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
  "game", "redeem", "closet", "menu", "block_breaker", "attack_hole", "doge_rescue", "flappy_dunk", "helix_jump", "magic_sort", "mob_control", "paper_io", "spiral_roll", "stack_colors", "minigames"
];

export const pageName: PageName = {
  closet: "",
  redeem: "",
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
  redeem: "",
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
  exportSaveTitle: "",
  exportSaveText: "",
  exportSaveDialogTitle: "",
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

export const redeemText = {
  title: "",
  enterCode: "",
  redeemBtn: "",
  history: "",
  invalidCode: "",
  alreadyRedeemed: "",
  success: ""
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

export const CHEEMS_SKINS: Array<CheemsSkinItem> = [];

export const SOUND_EFFECTS: Array<SoundEffectItem> = [];

export const MUSIC_TRACKS: Array<MusicTrackItem> = [];

export interface ShopItem {
  id: string;
  type: 'dogecoin' | 'currency' | 'minigame' | 'booster' | 'cheems' | 'sound' | 'music' | 'upgrade';
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
  upgradeType?: 'frequency' | 'quantity';
  upgradeValue?: number;
  priceMultiplier?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationsService {
  constructor() { }
}

export const attack_holeText = {
  title: ""
};

export const block_breakerText = {
  title: ""
};

export const doge_rescueText = {
  title: ""
};

export const helix_jumpText = {
  title: ""
};

export const mob_controlText = {
  title: ""
};

export const paper_ioText = {
  title: ""
};

export const spiral_rollText = {
  title: ""
};

export const stack_colorsText = {
  title: ""
};
