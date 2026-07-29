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
    closet: "Personalización",
    devSettings: "Opciones de desarrollador",
    game: "Juego de Cheems Bonk",
    menu: "Menú principal",
    onWork: "En desarrollo",
    p404: "Error 404",
    settings: "Ajustes"
  },
  en: {
    closet: "Customization",
    devSettings: "Developer Settings",
    game: "Cheems Bonk Game",
    menu: "Main Menu",
    onWork: "On Development",
    p404: "Error 404",
    settings: "Settings"
  },
};

export const menuText = {
  es: {
    settings: "Ajustes",
    offline: "Descarga de recursos (Modo offline)",
    shop: "Tienda de personalización",
    closet: "Personalización",
    stats: "Estadísticas",
    licenses: "Licencias",
    devMenu: "Opciones de desarrollo",
    buyDogeCoin: "Comprar 1 DogeCoin",
    buyDogeCoinSub: "Costo de hoy: ",
    buyDogeCoinSuccess: "¡Compraste 1 DogeCoin!",
    buyDogeCoinFail: "¡Necesitas más puntos!"
  },
  en: {
    settings: "Settings",
    offline: "Download Resources (Offline Mode)",
    shop: "Customization Shop",
    closet: "Closet / Customization",
    stats: "Statistics",
    licenses: "Licenses",
    devMenu: "Developer Options",
    buyDogeCoin: "Buy 1 DogeCoin",
    buyDogeCoinSub: "Today's price: ",
    buyDogeCoinSuccess: "You bought 1 DogeCoin!",
    buyDogeCoinFail: "You need more points!"
  }
};

export const optionsText = {
  es: {
    changeLang: {
      button: "Cambiar idioma (Switch Language)"
    },
    musicVolume: "Volumen de la música",
    effectsVolume: "Volumen de los efectos",
    appTheme: "Tema de la app (colores):",
    themes: {
      light: "Modo claro",
      dark: "Modo oscuro",
      contrast: "Modo alto contraste"
    },
    fontSize: "Tamaño de la fuente:",
    sizes: {
      smaller: "Muy pequeña",
      small: "Pequeña",
      normal: "Normal",
      big: "Grande",
      max: "Muy grande"
    }
  },
  en: {
    changeLang: {
      button: "Switch Language (Cambiar idioma)"
    },
    musicVolume: "Music volume",
    effectsVolume: "Effects volume",
    appTheme: "App theme (colors):",
    themes: {
      light: "Light Mode",
      dark: "Dark Mode",
      contrast: "High Contrast Mode"
    },
    fontSize: "Font size:",
    sizes: {
      smaller: "Smallest",
      small: "Small",
      normal: "Normal",
      big: "Big",
      max: "Biggest"
    }
  }
};

export const gameText = {
  es: {
    navbar: {
      highScore: "Mayor puntaje",
      actScore: "Toques actuales",
      totalScore: "Toques totales"
    },
    tapToBonk: "¡Haz clic en Cheems para un BONK!"
  },
  en: {
    navbar: {
      highScore: "High score",
      actScore: "Current touches",
      totalScore: "Total touches"
    },
    tapToBonk: "Click Cheems for a BONK!"
  }
};

export const closetText = {
  es: {
    title: "Personalización",
    cheemsSection: "Cheems (Skins)",
    soundsSection: "Sonidos de golpe",
    musicSection: "Música de fondo",
    selected: "Seleccionado",
    equipped: "Equipado",
    purchased: "Comprado",
    cost: "Costo:",
    free: "Gratis",
    buy: "Comprar",
    equip: "Equipado",
    needMoreCoins: "¡Necesitas más DogeCoins!",
    itemBought: "¡Comprado con éxito!",
    itemSelected: "¡Seleccionado!"
  },
  en: {
    title: "Customization Shop",
    cheemsSection: "Cheems (Skins)",
    soundsSection: "Hit Sounds",
    musicSection: "Background Music",
    selected: "Selected",
    equipped: "Equipped",
    purchased: "Purchased",
    cost: "Cost:",
    free: "Free",
    buy: "Buy",
    equip: "Equip",
    needMoreCoins: "Need more DogeCoins!",
    itemBought: "Successfully purchased!",
    itemSelected: "Selected!"
  }
};

export const devText = {
  es: {
    title: "Opciones de desarrollo",
    resetToZero: "Restablecer a cero (Reset)",
    unlockAll: "Desbloquear todo",
    giveDogeCoins: "Añadir +100 DogeCoins",
    givePoints: "Añadir +1000 Puntos",
    success: "¡Completado!"
  },
  en: {
    title: "Developer Options",
    resetToZero: "Reset to zero",
    unlockAll: "Unlock All",
    giveDogeCoins: "Add +100 DogeCoins",
    givePoints: "Add +1000 Points",
    success: "Done!"
  }
};

export const onWorkText = {
  es: {
    title: "Página en desarrollo",
    message: "Esta página está en desarrollo aún. ¡Vuelve pronto!",
    backToMenu: "Volver al menú"
  },
  en: {
    title: "Page Under Development",
    message: "This page is still under development. Check back soon!",
    backToMenu: "Back to Menu"
  }
};

export const p404Text = {
  es: {
    title: "Error 404",
    message: "La página que buscas no existe en el universo Cheems.",
    backToGame: "Volver al juego"
  },
  en: {
    title: "Error 404",
    message: "The page you are looking for does not exist in the Cheems universe.",
    backToGame: "Back to Game"
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
