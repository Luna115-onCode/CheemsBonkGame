import { HostListener } from '@angular/core';

export class AppComponent {

  // Listen for the PWA install prompt event
  @HostListener('window:appinstalled', ['$event'])
  onAppInstalled() {
    console.log('PWA installed! Initiating automated asset download...');
    this.downloadRemainingAssets();
  }

  async downloadRemainingAssets() {
    try {
      // Use a Set to automatically prevent duplicate URL downloads
      const urlsToCache = new Set<string>();

      // 1. Fetch your item JSON files in parallel
      const [sfxRes, musicRes, cheemsRes] = await Promise.all([
        fetch('/items/sound_effects.json'),
        fetch('/items/music.json'),
        fetch('/items/cheems.json')
      ]);

      const sfxData = await sfxRes.json();
      const musicData = await musicRes.json();
      const cheemsData = await cheemsRes.json();

      // 2. Extract Sound Effects URLs
      // SFX uses 'file' (string) or 'files' (array)[span_3](start_span)[span_3](end_span)
      sfxData.forEach((sfx: any) => {
        if (sfx.file) {
          urlsToCache.add(`/sound/${sfx.file}`);
        }
        if (sfx.files) {
          sfx.files.forEach((file: string) => urlsToCache.add(`/sound/${file}`));
        }
      });

      // 3. Extract Music URLs
      // Music uses 'file', 'basePath', and 'cover' properties[span_4](start_span)[span_4](end_span)
      musicData.forEach((music: any) => {
        if (music.file && music.basePath) {
          urlsToCache.add(`/${music.basePath}${music.file}`);
        }
        if (music.cover) {
          urlsToCache.add(`/${music.cover}`);
        }
      });

      // 4. Extract Cheems Skins URLs
      // Cheems uses 'img' and 'hitImg' (just the filenames)[span_5](start_span)[span_5](end_span)
      cheemsData.forEach((cheems: any) => {
        if (cheems.img) {
          urlsToCache.add(`/img/cheems/${cheems.img}`);
        }
        if (cheems.hitImg) {
          urlsToCache.add(`/img/cheems/${cheems.hitImg}`);
        }
      });

      // (Optional) Add your minigame HTML/JS files here if you have a minigames.json

      console.log(`Found ${urlsToCache.size} unique assets to cache.`);

      // 5. Fetch all URLs to trigger the Service Worker's "lazy" cache
      // We use 'no-cors' just in case, but since they are local it should be fine.
      // We also map them into an array of Promises so they download asynchronously.
      const fetchPromises = Array.from(urlsToCache).map(url => 
        fetch(url, { mode: 'no-cors' })
          .catch(err => console.error(`Failed to cache: ${url}`, err))
      );

      await Promise.all(fetchPromises);
      console.log('All assets have been successfully downloaded for offline use!');

    } catch (error) {
      console.error('Error during automated offline resource download:', error);
    }
  }
}
