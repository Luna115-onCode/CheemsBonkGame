import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  fontSize: string = "text-normal";
  themeColor: string = "theme-light";
  actPage: string = "/";
  constructor(private title: Title, private router: Router) { }

  setTitle(title:string): void {
    this.title.setTitle(title);
  }

  getTitle(): string {
    return this.title.getTitle()
  }

  redirect(url: string): void {
    this.router.navigate([url]);
  }

  redirectBack(): void {
    if (["/dev-settings", "/closet", "/settings", "/on-work"].includes(this.actPage)) {
      this.redirect("/menu");
    }
    else if (["/menu", "/404"].includes(this.actPage)) {
        this.redirect("/");
    }
    else if (["/"].includes(this.actPage)) {
      this.redirect("/menu");
    }
  }
}
