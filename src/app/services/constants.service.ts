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

export const showCoins: Array<string> = [
  "game", "dev-settings"
];

export const pageName: PageName = {
  es: {
    closet: "Armario",
    devSettings: "Opciones de desarrollador",
    game: "Juego de Cheems Bonk",
    menu: "Menu",
    onWork: "En desarrollo",
    p404: "Error 404",
    settings: "Opciones"
  },
  en: {
    closet: "Closet",
    devSettings: "Developer settings",
    game: "Cheems Bonk Game",
    menu: "Menu",
    onWork: "On development",
    p404: "Error 404",
    settings: "Settings"
  },
};

export const optionsText = {
  es: {
    changeLang: {
      button: "Cambiar idioma"
    }
  },
  en: {
    changeLang: {
      button: "Change Language"
    }
  }
}

export const gameText = {
  es: {
    navbar: {
      highScore: "Mayor puntaje de toques",
      actScore: "Toques actuales",
      totalScore: "Toques totales"
    }
  },
  en: {
    navbar: {
      highScore: "Highest touch score",
      actScore: "Current touches",
      totalScore: "Total touches"
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class TranslationsService {
  constructor() { }
}
