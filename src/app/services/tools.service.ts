import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { OptionsText, optionsText, PageName, pageName } from './constants.service';


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
  constructor(private titleInt: Title, private router: Router) { }

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
    }
  }

  redirect(url: string): void {
    this.router.navigate([url]);
  }

  reload(): void {
    window.location.reload();
  }

  redirectBack(): void {
    if (["devSettings", "closet", "settings", "onWork"].includes(this.actPage)) {
      this.redirect("menu");
    }
    else if (["menu", "p404"].includes(this.actPage)) {
        this.redirect("game");
    }
    else if (["game"].includes(this.actPage)) {
      this.redirect("menu");
    }
  }

  loadApp(): void {
    let savedLang = localStorage.getItem("CheemsBonkLang");
    let lang: string = savedLang === null ? "en" : savedLang;
    this.lang = lang;
  }
}
