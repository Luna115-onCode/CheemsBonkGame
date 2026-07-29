import { Injectable } from '@angular/core';

export interface PageName {
  [key: string]: {
    closet: string;
    devSettings: string;
    game: string;
    menu: string;
    onWork: string;
    p404: string;
    settings: string;
  };
}

export interface CheemsSkinItem {
  id: string;
  nameEs: string;
  nameEn: string;
  img: string;
  cost: number;
  default?: boolean;
  storageKey: string;
}

export interface SoundEffectItem {
  id: string;
  name: string;
  cost: number;
  default?: boolean;
  storageKey: string;
}

export interface MusicTrackItem {
  id: number;
  name: string;
  file: string;
  default?: boolean;
  cost: number;
  storageKey: string;
}

export const showCoins: Array<string> = [
  "game", "dev-settings", "closet", "menu"
];

export const pageName: PageName = {
  es: {
    closet: "",
    devSettings: "",
    game: "",
    menu: "",
    onWork: "",
    p404: "",
    settings: ""
  },
  en: {
    closet: "",
    devSettings: "",
    game: "",
    menu: "",
    onWork: "",
    p404: "",
    settings: ""
  },
};

export const menuText = {
  es: {
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
  },
  en: {
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
  }
};

export const optionsText = {
  es: {
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
    }
  },
  en: {
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
    }
  }
};

export const gameText = {
  es: {
    navbar: {
      highScore: "",
      actScore: "",
      totalScore: ""
    },
    tapToBonk: ""
  },
  en: {
    navbar: {
      highScore: "",
      actScore: "",
      totalScore: ""
    },
    tapToBonk: ""
  }
};

export const closetText = {
  es: {
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
  },
  en: {
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
  }
};

export const devText = {
  es: {
    title: "",
    resetToZero: "",
    unlockAll: "",
    giveDogeCoins: "",
    givePoints: "",
    success: "",
    unlocked: "",
    locked: ""
  },
  en: {
    title: "",
    resetToZero: "",
    unlockAll: "",
    giveDogeCoins: "",
    givePoints: "",
    success: "",
    unlocked: "",
    locked: ""
  }
};

export const onWorkText = {
  es: {
    title: "",
    message: "",
    backToMenu: ""
  },
  en: {
    title: "",
    message: "",
    backToMenu: ""
  }
};

export const p404Text = {
  es: {
    title: "",
    message: "",
    backToGame: ""
  },
  en: {
    title: "",
    message: "",
    backToGame: ""
  }
};

export const CHEEMS_SKINS: Array<CheemsSkinItem> = [
  { id: 'normal', nameEs: 'Cheems Normal', nameEn: 'Normal Cheems', img: 'normal.png', cost: 0, default: true, storageKey: 'c1' },
  { id: 'little', nameEs: 'Cheems Chiquito', nameEn: 'Little Cheems', img: 'little.png', cost: 10, storageKey: 'c2' },
  { id: 'adult', nameEs: 'Cheems Adulto', nameEn: 'Adult Cheems', img: 'adult.png', cost: 10, storageKey: 'c3' },
  { id: 'kid', nameEs: 'Cheems Niño', nameEn: 'Kid Cheems', img: 'kid.png', cost: 10, storageKey: 'c4' },
  { id: 'mamado', nameEs: 'Cheems Mamado', nameEn: 'Buff Cheems', img: 'mamado.png', cost: 10, storageKey: 'c5' },
  { id: 'pixelart', nameEs: 'Cheems Pixel', nameEn: 'Pixel Cheems', img: 'pixelart.png', cost: 10, storageKey: 'c6' },
  { id: 'elegant', nameEs: 'Cheems Elegante', nameEn: 'Elegant Cheems', img: 'elegant.png', cost: 10, storageKey: 'c7' },
  { id: '3d', nameEs: 'Cheems 3D', nameEn: '3D Cheems', img: '3d.png', cost: 10, storageKey: 'c8' },
  { id: 'black', nameEs: 'Cheems Oscuro', nameEn: 'Dark Cheems', img: 'black.png', cost: 10, storageKey: 'c9' }
];

export const SOUND_EFFECTS: Array<SoundEffectItem> = [
  { id: '1', name: 'Hit (Bonk)', cost: 0, default: true, storageKey: 's1' },
  { id: '2', name: 'Hurt Minecraft', cost: 10, storageKey: 's2' },
  { id: '3', name: 'Hurt Roblox', cost: 10, storageKey: 's3' },
  { id: '4', name: 'Level Up', cost: 10, storageKey: 's4' },
  { id: '5', name: 'Discord', cost: 10, storageKey: 's5' },
  { id: '6', name: 'Hello FNAF', cost: 10, storageKey: 's6' },
  { id: '7', name: 'Hit Minecraft', cost: 10, storageKey: 's7' },
  { id: '8', name: 'NO', cost: 10, storageKey: 's8' },
  { id: '9', name: 'Duck', cost: 10, storageKey: 's9' },
  { id: '10', name: 'Toy', cost: 10, storageKey: 's10' },
  { id: '11', name: 'Splat', cost: 10, storageKey: 's11' },
  { id: '12', name: 'Windows Error', cost: 10, storageKey: 's12' }
];

export const MUSIC_TRACKS: Array<MusicTrackItem> = [
  { id: 0, name: 'Mute / Sin música', file: '', default: true, cost: 0, storageKey: 'm0' },
  { id: 1, name: 'A Jazz Piano', file: 'A_Jazz_Piano.ogg', default: true, cost: 0, storageKey: 'm1' },
  { id: 2, name: 'Jack Bootleg', file: 'Jack_Bootleg.ogg', default: false, cost: 10, storageKey: 'm2' },
  { id: 3, name: 'Magic Night', file: 'Magic_night.ogg', default: false, cost: 10, storageKey: 'm3' },
  { id: 4, name: 'Minimalism No9', file: 'Minimalism_No9.ogg', default: false, cost: 10, storageKey: 'm4' },
  { id: 5, name: 'Minimalism No10', file: 'Minimalism_No10.ogg', default: false, cost: 10, storageKey: 'm5' },
  { id: 6, name: 'When You Smile', file: 'When_you_smile.ogg', default: false, cost: 10, storageKey: 'm6' }
];

@Injectable({
  providedIn: 'root'
})
export class TranslationsService {
  constructor() { }
}
