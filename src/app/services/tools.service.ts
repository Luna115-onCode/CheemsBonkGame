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
  texts: any;
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

  changeLanguage(page: keyof PageName[""]) {
    this.lang === 'es' ? this.lang = 'en' : this.lang = 'es';
    localStorage.setItem("CheemsBonkLang", this.lang);
    this.reload();
  }

  getTexts(page: keyof PageName[""]): void {
    switch (page) {
      case "settings":
        this.texts = optionsText;
        break;
      case "game":
        this.texts = gameText;
        break;
    }
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

  loadApp(): void {
    let savedLang = localStorage.getItem("CheemsBonkLang");
    let lang: string = savedLang === null ? "en" : savedLang;
    this.lang = lang;
  }
}
