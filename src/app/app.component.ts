import { CommonModule, PlatformLocation } from '@angular/common';
import { Component, inject, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolsService } from './services/tools.service';
import { NavbarComponent } from "./components/navbar/navbar.component";

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, CommonModule, NavbarComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  
  constructor (private platformLocation: PlatformLocation) {}

  ngOnInit(): void {
    document.oncontextmenu = function(){return false};
    document.ondragstart = function(){return false};
    document.onselectstart = function(){return false};

    window.onkeydown = this.onKeyDown.bind(this);
    document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });

    window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Changes may not be saved';
      return 'Changes may not be saved';
    });
    
    this.tools.loadApp();
  }
  
  onKeyDown(event: KeyboardEvent) {
    if (event.key === ' ' || event.code === 'Space' || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
      if (event.cancelable) {
        event.preventDefault();
      }
    }
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length >= 2 && event.cancelable) {
      event.preventDefault();
    }
  }

  // --- PWA Offline Caching Logic ---

  @HostListener('window:appinstalled', ['$event'])
  onAppInstalled() {
    console.log('PWA installed! Initiating automated asset download...');
    this.downloadRemainingAssets();
  }

  async downloadRemainingAssets() {
    try {
      const urlsToCache = new Set<string>();

      // Fetch your JSON files
      const [sfxRes, musicRes, cheemsRes] = await Promise.all([
        fetch('/items/sound_effects.json'),
        fetch('/items/music.json'),
        fetch('/items/cheems.json')
      ]);

      const sfxData = await sfxRes.json();
      const musicData = await musicRes.json();
      const cheemsData = await cheemsRes.json();

      // Parse SFX
      sfxData.forEach((sfx: any) => {
        if (sfx.file) urlsToCache.add(`/sound/${sfx.file}`);
        if (sfx.files) sfx.files.forEach((file: string) => urlsToCache.add(`/sound/${file}`));
      });

      // Parse Music
      musicData.forEach((music: any) => {
        if (music.file && music.basePath) urlsToCache.add(`/${music.basePath}${music.file}`);
        if (music.cover) urlsToCache.add(`/${music.cover}`);
      });

      // Parse Skins
      cheemsData.forEach((cheems: any) => {
        if (cheems.img) urlsToCache.add(`/img/cheems/${cheems.img}`);
        if (cheems.hitImg) urlsToCache.add(`/img/cheems/${cheems.hitImg}`);
      });

      console.log(`Found ${urlsToCache.size} unique assets to cache.`);

      // Fire off fetch requests to trigger the Service Worker "lazy" cache
      const fetchPromises = Array.from(urlsToCache).map(url => 
        fetch(url, { mode: 'no-cors' })
          .catch(err => console.error(`Failed to cache: ${url}`, err))
      );

      await Promise.all(fetchPromises);
      console.log('All assets successfully cached for offline use!');

    } catch (error) {
      console.error('Error during automated offline resource download:', error);
    }
  }
}
