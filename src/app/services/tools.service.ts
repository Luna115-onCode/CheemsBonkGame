import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { gameText, optionsText, PageName, pageName } from './constants.service';


@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  fontSize: string = "text-normal";
  themeColor: string = "theme-light";
  actPage: keyof PageName[""] = "game";
  lang: string = "en";
  selectedCheems: string = "normal";
  selectedSound: string = "hit";

  actScore: number = 0;
  highScore: number = 0;
  totalScore: number = 0;
  dogeCoins: number = 0;

  game: any = gameText;
  options: any = optionsText;
  pageName: PageName = pageName;

  constructor(private titleInt: Title, private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (event.navigationTrigger === 'popstate') {
          this.redirectBack(true);
        }
      }
    });
  }

  setTitle(page: keyof PageName[""]): void {
    let title = pageName[this.lang][page];
    this.titleInt.setTitle(title);
  }

  changeLanguage() {
    this.lang === 'es' ? this.lang = 'en' : this.lang = 'es';
    localStorage.setItem("CheemsBonkLang", this.lang);
    this.reload();
  }

  redirect(url: string): void {
    this.router.navigate([url]);
  }

  reload(): void {
    window.location.reload();
  }

  redirectBack(fromSystem:boolean=false): void {
    if (["devSettings", "closet", "settings", "onWork"].includes(this.actPage)) {
      this.redirect("menu");
    }
    else if (["menu", "p404"].includes(this.actPage)) {
        this.redirect("game");
    }
    else if (["game"].includes(this.actPage)) {
      fromSystem ? this.redirect("game") : this.redirect("menu");
    }
  }

  updateScore(value: number): void {
    this.actScore += value;
    this.totalScore += value;
    if (this.actScore >= this.highScore) {
      this.highScore = this.actScore;
    }

    localStorage.setItem("CheemsBonkTotalScore", JSON.stringify(this.totalScore));
    localStorage.setItem("CheemsBonkHighScore", JSON.stringify(this.highScore));
  }

  playSound(): void {
    let sfx = new Audio("sound/"+this.selectedSound+".ogg");
    sfx.play();
  }








  loadApp(): void {
    this.loadSettings();
    this.loadCheems();
    this.loadSounds();
    this.loadScore();
  }

  loadSettings(): void {
    let savedLang = localStorage.getItem("CheemsBonkLang");
    let lang: string = savedLang === null ? "en" : savedLang;
    this.lang = lang;
  }

  loadCheems(): void {
    let savedCheems = localStorage.getItem("CheemsBonkCheems");
    let cheems: string = savedCheems === null ? "normal" : savedCheems;
    this.selectedCheems = cheems;
  }

  loadSounds(): void {
    let savedSound = localStorage.getItem("CheemsBonkSound");
    let sound: string = savedSound === null ? "hit" : savedSound;
    this.selectedSound = sound;
  }

  loadScore(): void {
    let totalScore = localStorage.getItem("CheemsBonkTotalScore");
    let highScore = localStorage.getItem("CheemsBonkHighScore");
    let dogeCoins = localStorage.getItem("CheemsBonkDogeCoins");
    let total: number = totalScore === null ? 0 : this.parseNumber(totalScore);
    let high: number = highScore === null ? 0 : this.parseNumber(highScore);
    let dc: number = dogeCoins === null ? 0 : this.parseNumber(dogeCoins);
    this.highScore = high;
    this.totalScore = total;
    this.dogeCoins = dc;
  }

  parseNumber(value: string): number {
    return +value
  }

  parseString(value: any): string {
    return value+""
  }

  async sleep(time:number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, time));
  }
}
