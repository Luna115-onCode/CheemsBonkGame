import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import {
  gameText,
  optionsText,
  PageName,
  pageName,
  menuText,
  closetText,
  devText,
  onWorkText,
  p404Text,
  CHEEMS_SKINS,
  SOUND_EFFECTS,
  MUSIC_TRACKS,
  CheemsSkinItem,
  SoundEffectItem,
  MusicTrackItem,
  createLangMap,
  AVAILABLE_LANGUAGES,
  LanguageItem,
  offlineText,
  OfflineCategory,
  OFFLINE_CATEGORIES,
  ShopItem
} from './constants.service';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  fontSize: string = "text-normal";
  themeColor: string = "theme-dark";
  actPage: keyof PageName = "game";
  lang: string = "es";
  selectedCheems: string = "cheems_normal";
  selectedSound: string = "sfx_1";
  selectedMusic: string = "music_1";

  actScore: number = 0;
  points: number = 0;
  highScore: number = 0;
  totalScore: number = 0;
  dogeCoins: number = 0;

  effVol: number = 100;
  musVol: number = 50;

  devMenuUnlocked: boolean = false;
  private devClickCount: number = 0;

  unlockedCheems: Record<string, boolean> = {};
  unlockedSounds: Record<string, boolean> = {};
  unlockedMusic: Record<string, boolean> = {};

  game: any = createLangMap(gameText);
  options: any = createLangMap(optionsText);
  menu: any = createLangMap(menuText);
  closet: any = createLangMap(closetText);
  dev: any = createLangMap(devText);
  onWork: any = createLangMap(onWorkText);
  p404: any = createLangMap(p404Text);
  offline: any = createLangMap(offlineText);
  shop: any = {};
  pageName: any = createLangMap(pageName);
  offlineCategories: Array<OfflineCategory> = OFFLINE_CATEGORIES;
  shopItemsText: Record<string, Record<string, string>> = {};
  itemsText: Record<string, Record<string, string>> = {};
  shopItems: Array<ShopItem> = [];
  boosterEndTime: number = 0;
  boosterMultiplier: number = 1;
  private audioCtx: AudioContext | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private currentMusicBuffer: AudioBuffer | null = null;
  private currentMusicFile: string = "";
  private isWindowBlurred: boolean = false;

  availableLanguages: Array<LanguageItem> = AVAILABLE_LANGUAGES;

  cheemsSkins: Array<CheemsSkinItem> = CHEEMS_SKINS;
  soundEffects: Array<SoundEffectItem> = SOUND_EFFECTS;
  musicTracks: Array<MusicTrackItem> = MUSIC_TRACKS;

  private musicAudio: HTMLAudioElement = new Audio();
  private soundAudio: HTMLAudioElement = new Audio();

  toastMessage: string = "";
  private toastTimer: any = null;

  constructor(private titleInt: Title, private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (event.navigationTrigger === 'popstate') {
          this.redirectBack(true);
        }
      }
    });

    this.musicAudio.loop = true;
    this.musicAudio.addEventListener('ended', () => {
      if (String(this.selectedMusic) !== '0') {
        this.musicAudio.play().catch(() => {});
      }
    });

    const resumeMusicOnInteraction = () => {
      if (String(this.selectedMusic) !== '0' && this.musicAudio.paused) {
        this.playMusic(this.selectedMusic);
      }
    };
    document.addEventListener('click', resumeMusicOnInteraction, { passive: true });
    document.addEventListener('touchstart', resumeMusicOnInteraction, { passive: true });
    document.addEventListener('keydown', resumeMusicOnInteraction, { passive: true });
  }

  setTitle(page: string): void {
    let title = this.pageName[this.lang]?.[page] || "Cheems Bonk Game";
    this.titleInt.setTitle(title);
  }

  changeLanguage(): void {
    const currentIdx = this.availableLanguages.findIndex(l => l.key === this.lang);
    const nextIdx = (currentIdx + 1) % this.availableLanguages.length;
    this.setLanguage(this.availableLanguages[nextIdx].key);
  }

  setLanguage(key: string): void {
    if (this.availableLanguages.some(l => l.key === key)) {
      this.lang = key;
      localStorage.setItem("CheemsBonkLang", this.lang);
      this.loadLanguageFile(this.lang);
      this.setTitle(this.actPage);
    }
  }

  async loadLanguageFile(langCode: string): Promise<void> {
    try {
      const res = await fetch(`lang/texts.${langCode}.lang`);
      if (res.ok) {
        const data = await res.json();
        if (data.pageName) this.pageName[langCode] = { ...this.pageName[langCode], ...data.pageName };
        if (data.game) this.game[langCode] = {
          ...this.game[langCode],
          ...data.game,
          navbar: { ...this.game[langCode]?.navbar, ...data.game?.navbar }
        };
        if (data.options) this.options[langCode] = {
          ...this.options[langCode],
          ...data.options,
          changeLang: { ...this.options[langCode]?.changeLang, ...data.options?.changeLang },
          themes: { ...this.options[langCode]?.themes, ...data.options?.themes },
          sizes: { ...this.options[langCode]?.sizes, ...data.options?.sizes }
        };
        if (data.menu) this.menu[langCode] = { ...this.menu[langCode], ...data.menu };
        if (data.closet) this.closet[langCode] = { ...this.closet[langCode], ...data.closet };
        if (data.dev) this.dev[langCode] = { ...this.dev[langCode], ...data.dev };
        if (data.onWork) this.onWork[langCode] = { ...this.onWork[langCode], ...data.onWork };
        if (data.p404) this.p404[langCode] = { ...this.p404[langCode], ...data.p404 };
        if (data.offline) this.offline[langCode] = { ...this.offline[langCode], ...data.offline };
        if (data.shop) this.shop[langCode] = { ...this.shop[langCode], ...data.shop };
        if (data.shopItemsText) this.shopItemsText[langCode] = { ...this.shopItemsText[langCode], ...data.shopItemsText };
        if (data.itemsText) this.itemsText[langCode] = { ...this.itemsText[langCode], ...data.itemsText };
      }
    } catch (err) {
      console.warn(`Could not load language file lang/texts.${langCode}.lang`, err);
    }
  }

  async loadClosetPrices(): Promise<void> {
    try {
      const [cheemsRes, soundsRes, musicRes, closetRes] = await Promise.all([
        fetch('items/cheems.json').catch(() => null),
        fetch('items/sound_effects.json').catch(() => null),
        fetch('items/music.json').catch(() => null),
        fetch('closet.json').catch(() => null)
      ]);

      const cheemsCatalog: Array<CheemsSkinItem> = cheemsRes && cheemsRes.ok ? await cheemsRes.json() : [];
      const soundsCatalog: Array<SoundEffectItem> = soundsRes && soundsRes.ok ? await soundsRes.json() : [];
      const musicCatalog: Array<MusicTrackItem> = musicRes && musicRes.ok ? await musicRes.json() : [];

      let closetData: any = null;
      if (closetRes && closetRes.ok) {
        closetData = await closetRes.json();
      }

      if (closetData) {
        this.cheemsSkins = this.buildItemsList<CheemsSkinItem>(closetData.cheems, cheemsCatalog);
        this.soundEffects = this.buildItemsList<SoundEffectItem>(closetData.sounds, soundsCatalog);
        this.musicTracks = this.buildItemsList<MusicTrackItem>(closetData.music, musicCatalog);
      } else {
        this.cheemsSkins = [...cheemsCatalog];
        this.soundEffects = [...soundsCatalog];
        this.musicTracks = [...musicCatalog];
      }

      this.loadUnlocks();
      this.appendUnlockableShopItems();
      this.playMusic(this.selectedMusic);
    } catch (err) {
      console.warn('Could not load closet.json or items, using default arrays', err);
    }
  }

  private buildItemsList<T extends { id: any; cost?: number }>(
    closetSection: any,
    catalog: Array<T>
  ): Array<T> {
    const result: Array<T> = [];
    if (!closetSection || !catalog || catalog.length === 0) {
      return result;
    }

    if (Array.isArray(closetSection)) {
      for (const entry of closetSection) {
        let itemId: any;
        let overrideCost: number | undefined;

        if (typeof entry === 'object' && entry !== null) {
          itemId = entry.id;
          if (entry.cost !== undefined) {
            overrideCost = Number(entry.cost);
          }
        } else {
          itemId = entry;
        }

        const found = catalog.find(item => String(item.id) === String(itemId));
        if (found) {
          const itemCopy = { ...found };
          if (overrideCost !== undefined && !isNaN(overrideCost)) {
            itemCopy.cost = overrideCost;
          }
          result.push(itemCopy);
        }
      }
    } else if (typeof closetSection === 'object' && closetSection !== null) {
      for (const key of Object.keys(closetSection)) {
        const found = catalog.find(item => String(item.id) === String(key));
        if (found) {
          const itemCopy = { ...found };
          const overrideCost = Number(closetSection[key]);
          if (!isNaN(overrideCost)) {
            itemCopy.cost = overrideCost;
          }
          result.push(itemCopy);
        }
      }
    }

    return result;
  }

  redirect(url: string): void {
    this.router.navigate([url]);
  }

  reload(): void {
    window.location.reload();
  }

  redirectBack(fromSystem: boolean = false): void {
    if (["devSettings", "closet", "settings", "onWork", "offline", "shop"].includes(this.actPage)) {
      this.redirect("menu");
    } else if (["menu", "p404"].includes(this.actPage)) {
      this.redirect("game");
    } else if (["game"].includes(this.actPage)) {
      fromSystem ? this.redirect("game") : this.redirect("menu");
    }
  }

  showToast(message: string, durationMs: number = 3000): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastTimer = setTimeout(() => {
      this.toastMessage = "";
    }, durationMs);
  }

  updateScore(value: number): void {
    this.actScore += value;
    this.points += value;
    this.totalScore += value;
    if (this.actScore >= this.highScore) {
      this.highScore = this.actScore;
    }

    localStorage.setItem("CheemsAppLiActPoints", JSON.stringify(this.actScore));
    localStorage.setItem("CheemsAppLiPoints", JSON.stringify(this.points));
    localStorage.setItem("CheemsAppLiTotalCounter", JSON.stringify(this.totalScore));
    localStorage.setItem("CheemsAppLiMaxCounter", JSON.stringify(this.highScore));
    localStorage.setItem("CheemsBonkTotalScore", JSON.stringify(this.totalScore));
    localStorage.setItem("CheemsBonkHighScore", JSON.stringify(this.highScore));
  }

  getDailyDogeCoinPrice(): number {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateNum = Number(`${yyyy}${mm}${dd}`);
    const product = dateNum * Math.PI;
    const str = product.toString().replace('.', '');
    const digits = str.slice(8, 11);
    const price = parseInt(digits, 10);
    return isNaN(price) ? 100 : price;
  }

  buyDogeCoin(): boolean {
    const cost = this.getDailyDogeCoinPrice();
    if (this.points >= cost) {
      this.points -= cost;
      this.dogeCoins += 1;
      localStorage.setItem("CheemsAppLiPoints", JSON.stringify(this.points));
      localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.dogeCoins));
      this.recordDailyPurchase("dogecoin_daily");
      this.showToast(this.menu[this.lang].buyDogeCoinSuccess);
      this.playSound();
      return true;
    } else {
      this.showToast(this.menu[this.lang].buyDogeCoinFail);
      return false;
    }
  }

  registerDevClick(): void {
    this.devClickCount++;
    if (this.devClickCount === 5) {
      this.devMenuUnlocked = !this.devMenuUnlocked;
      localStorage.setItem("CheemsAppLiDevMenu", JSON.stringify(this.devMenuUnlocked));
      if (this.devMenuUnlocked) {
        this.showToast(this.dev[this.lang].unlocked);
      } else {
        this.showToast(this.dev[this.lang].locked);
      }
      this.devClickCount = 0;
      this.playSound('sfx_4');
    }
  }

  playSound(customSoundId?: string): void {
    const soundToPlay = customSoundId || this.selectedSound;
    const item = this.soundEffects.find(s => String(s.id) === String(soundToPlay));
    let file = "hit.ogg";
    let basePath = "sound/";
    if (item) {
      if (item.basePath) basePath = item.basePath;
      if (item.files && item.files.length > 0) {
        const idx = Math.floor(Math.random() * item.files.length);
        file = item.files[idx];
      } else if (item.file) {
        file = item.file;
      }
    }
    this.soundAudio.src = basePath + file;
    this.soundAudio.volume = this.effVol / 100;
    this.soundAudio.play().catch(() => {});
  }

  playMusic(songId?: string | number): void {
    const trackId = songId !== undefined ? songId : this.selectedMusic;
    const track = this.musicTracks.find(t => String(t.id) === String(trackId));
    if (!track || String(track.id) === '0' || !track.file) {
      this.stopBackgroundMusic();
      return;
    }
    const basePath = track.basePath || "sound/music/";
    const fullPath = track.url || (basePath + track.file);
    this.playBackgroundMusic(track.file, fullPath);
  }

  async playBackgroundMusic(file: string, customUrl?: string): Promise<void> {
    if (!file || this.musVol <= 0 || String(this.selectedMusic) === '0') {
      this.stopBackgroundMusic();
      return;
    }

    const targetSrc = customUrl || ("sound/music/" + file);
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.currentMusicFile !== file) {
        this.currentMusicFile = file;
        const res = await fetch(targetSrc);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const audioBuf = await this.audioCtx.decodeAudioData(arrayBuf);
          this.currentMusicBuffer = audioBuf;
          this.startWebAudioMusic();
          return;
        }
      } else {
        if (this.audioCtx.state === 'suspended' && !this.isWindowBlurred) {
          this.audioCtx.resume().catch(() => {});
        }
        return;
      }
    } catch (e) {
      console.warn("Web Audio API failed, falling back to HTMLAudioElement", e);
    }

    if (!this.musicAudio.src.endsWith(targetSrc)) {
      this.musicAudio.src = targetSrc;
      this.musicAudio.loop = true;
      this.musicAudio.load();
    }
    this.musicAudio.volume = this.musVol / 100;
    if (!this.isWindowBlurred) {
      this.musicAudio.play().catch(() => {});
    }
  }

  startWebAudioMusic(): void {
    if (!this.audioCtx || !this.currentMusicBuffer) return;
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch {}
      this.musicSource.disconnect();
    }
    if (!this.musicGain) {
      this.musicGain = this.audioCtx.createGain();
      this.musicGain.connect(this.audioCtx.destination);
    }
    this.musicGain.gain.value = this.musVol / 100;
    this.musicSource = this.audioCtx.createBufferSource();
    this.musicSource.buffer = this.currentMusicBuffer;
    this.musicSource.loop = true;
    this.musicSource.connect(this.musicGain);
    if (!this.isWindowBlurred) {
      this.musicSource.start(0);
    }
  }

  stopBackgroundMusic(): void {
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch {}
      this.musicSource = null;
    }
    if (!this.musicAudio.paused) {
      this.musicAudio.pause();
      this.musicAudio.src = "";
    }
  }

  setMusicVolume(vol: number): void {
    this.musVol = Math.max(0, Math.min(100, vol));
    this.musicAudio.volume = this.musVol / 100;
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.value = this.musVol / 100;
    }
    localStorage.setItem("CheemsAppLiMusicVolume", String(this.musVol));
    if (this.musVol === 0) {
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend().catch(() => {});
      }
      this.musicAudio.pause();
    } else if (!this.isWindowBlurred && String(this.selectedMusic) !== '0') {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if (this.musicAudio.paused && this.musicAudio.src) {
        this.musicAudio.play().catch(() => {});
      }
    }
  }

  setEffectVolume(vol: number): void {
    this.effVol = Math.max(0, Math.min(100, vol));
    localStorage.setItem("CheemsAppLiEffectsVolume", String(this.effVol));
  }

  switchTheme(themeIndex: number): void {
    switch (themeIndex) {
      case 0: this.themeColor = "theme-light"; break;
      case 1: this.themeColor = "theme-dark"; break;
      case 2: this.themeColor = "theme-contrast"; break;
      default: this.themeColor = "theme-dark"; break;
    }
    localStorage.setItem("CheemsAppLiActTheme", String(themeIndex));
    document.body.className = `${this.themeColor} ${this.fontSize}`;
  }

  setAccessibility(sizeIndex: number): void {
    switch (sizeIndex) {
      case 0: this.fontSize = "text-smaller"; break;
      case 1: this.fontSize = "text-small"; break;
      case 2: this.fontSize = "text-normal"; break;
      case 3: this.fontSize = "text-big"; break;
      case 4: this.fontSize = "text-max"; break;
      default: this.fontSize = "text-normal"; break;
    }
    localStorage.setItem("CheemsAppLiFontSize", String(sizeIndex));
    const sizeMap = ["12px", "14px", "16px", "19px", "22px"];
    document.documentElement.style.fontSize = sizeMap[sizeIndex] || "16px";
    document.body.className = `${this.themeColor} ${this.fontSize}`;
  }

  isCheemsUnlocked(id: string): boolean {
    if (id === 'normal' || id === 'cheems_normal') return true;
    const item = this.cheemsSkins.find(s => s.id === id);
    if (!item) return false;
    return !!this.unlockedCheems[item.storageKey];
  }

  buyOrSelectCheems(skin: CheemsSkinItem): boolean {
    if (this.isCheemsUnlocked(skin.id)) {
      this.selectedCheems = skin.id;
      localStorage.setItem("CheemsAppLiSelCheems", skin.id);
      localStorage.setItem("CheemsBonkCheems", skin.id);
      this.showToast(this.closet[this.lang]?.itemSelected || "Selected!");
      this.playSound();
      return true;
    } else {
      this.showToast(this.closet[this.lang]?.buyInShop || "Buy this item in the Shop!");
      this.playSound('sfx_8');
      return false;
    }
  }

  isSoundUnlocked(id: string): boolean {
    if (id === '1' || id === 'sfx_1') return true;
    const item = this.soundEffects.find(s => String(s.id) === String(id));
    if (!item) return false;
    return !!this.unlockedSounds[item.storageKey];
  }

  buyOrSelectSound(sound: SoundEffectItem): boolean {
    if (this.isSoundUnlocked(sound.id)) {
      this.selectedSound = sound.id;
      localStorage.setItem("CheemsAppLiSelSound", sound.id);
      localStorage.setItem("CheemsBonkSound", sound.id);
      this.showToast(this.closet[this.lang]?.itemSelected || "Selected!");
      this.playSound(sound.id);
      return true;
    } else {
      this.showToast(this.closet[this.lang]?.buyInShop || "Buy this item in the Shop!");
      this.playSound('sfx_8');
      return false;
    }
  }

  isMusicUnlocked(id: any): boolean {
    if (String(id) === '0' || String(id) === '1' || id === 'music_0' || id === 'music_1') return true;
    const item = this.musicTracks.find(m => String(m.id) === String(id));
    if (!item) return false;
    return !!this.unlockedMusic[item.storageKey];
  }

  buyOrSelectMusic(track: MusicTrackItem): boolean {
    if (this.isMusicUnlocked(track.id)) {
      this.selectMusic(track);
      return true;
    } else {
      this.showToast(this.closet[this.lang]?.buyInShop || "Buy this item in the Shop!");
      this.playSound('sfx_8');
      return false;
    }
  }

  selectMusic(track: MusicTrackItem): void {
    this.selectedMusic = track.id as any;
    localStorage.setItem("CheemsAppLiSelMusic", String(track.id));
    this.playMusic(track.id);
    this.showToast(this.closet[this.lang].itemSelected);
  }

  unlockAll(): void {
    this.actScore = 999999;
    this.points = 999999;
    this.totalScore = 999999;
    this.highScore = 999999;
    this.dogeCoins = 999999;
    this.cheemsSkins.forEach(s => {
      this.unlockedCheems[s.storageKey] = true;
      localStorage.setItem(s.storageKey, JSON.stringify(true));
    });
    this.soundEffects.forEach(s => {
      this.unlockedSounds[s.storageKey] = true;
      localStorage.setItem(s.storageKey, JSON.stringify(true));
    });
    this.musicTracks.forEach(s => {
      this.unlockedMusic[s.storageKey] = true;
      localStorage.setItem(s.storageKey, JSON.stringify(true));
    });
    localStorage.setItem("CheemsAppLiActPoints", JSON.stringify(this.actScore));
    localStorage.setItem("CheemsAppLiPoints", JSON.stringify(this.points));
    localStorage.setItem("CheemsAppLiTotalCounter", JSON.stringify(this.totalScore));
    localStorage.setItem("CheemsAppLiMaxCounter", JSON.stringify(this.highScore));
    localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.dogeCoins));
    this.showToast(this.dev[this.lang].success);
    this.playSound('sfx_4');
  }

  resetToZero(): void {
    this.actScore = 0;
    this.points = 0;
    this.totalScore = 0;
    this.highScore = 0;
    this.dogeCoins = 0;
    this.selectedCheems = "cheems_normal";
    this.selectedSound = "sfx_1";
    this.selectedMusic = "music_1";
    this.effVol = 100;
    this.musVol = 50;
    this.themeColor = "theme-dark";
    this.fontSize = "text-normal";
    this.unlockedCheems = {};
    this.unlockedSounds = {};
    this.unlockedMusic = {};
    this.cheemsSkins.forEach(s => {
      const isDef = !s.default;
      this.unlockedCheems[s.storageKey] = !isDef;
      localStorage.setItem(s.storageKey, JSON.stringify(!isDef));
    });
    this.soundEffects.forEach(s => {
      const isDef = !s.default;
      this.unlockedSounds[s.storageKey] = !isDef;
      localStorage.setItem(s.storageKey, JSON.stringify(!isDef));
    });
    this.musicTracks.forEach(s => {
      const isDef = s.default || s.cost === 0;
      this.unlockedMusic[s.storageKey] = isDef;
      localStorage.setItem(s.storageKey, JSON.stringify(isDef));
    });
    localStorage.setItem("CheemsAppLiActPoints", "0");
    localStorage.setItem("CheemsAppLiPoints", "0");
    localStorage.setItem("CheemsAppLiTotalCounter", "0");
    localStorage.setItem("CheemsAppLiMaxCounter", "0");
    localStorage.setItem("CheemsAppLiDogecoins", "0");
    localStorage.setItem("CheemsAppLiSelCheems", "cheems_normal");
    localStorage.setItem("CheemsAppLiSelSound", "sfx_1");
    localStorage.setItem("CheemsAppLiSelMusic", "music_1");
    localStorage.setItem("CheemsAppLiMusicVolume", "50");
    localStorage.setItem("CheemsAppLiEffectsVolume", "100");
    localStorage.setItem("CheemsAppLiActTheme", "1");
    localStorage.setItem("CheemsAppLiFontSize", "2");
    this.showToast(this.dev[this.lang].success);
    this.playSound();
  }

  loadApp(): void {
    this.loadSettings();
    this.loadLanguageFile(this.lang);
    this.loadClosetPrices();
    this.loadShopItems();
    this.loadBoosterState();
    this.setupWindowFocusListeners();
    this.loadCheems();
    this.loadSounds();
    this.loadMusic();
    this.loadScore();
    this.loadUnlocks();
    this.loadDevMenu();
  }

  loadSettings(): void {
    const savedLang = localStorage.getItem("CheemsBonkLang");
    this.lang = savedLang && this.availableLanguages.some(l => l.key === savedLang) ? savedLang : "es";

    const savedTheme = localStorage.getItem("CheemsAppLiActTheme");
    const themeIdx = savedTheme !== null ? +savedTheme : 1;
    this.switchTheme(themeIdx);

    const savedSize = localStorage.getItem("CheemsAppLiFontSize");
    const sizeIdx = savedSize !== null ? +savedSize : 2;
    this.setAccessibility(sizeIdx);

    const savedMusVol = localStorage.getItem("CheemsAppLiMusicVolume");
    this.musVol = savedMusVol !== null ? +savedMusVol : 50;

    const savedEffVol = localStorage.getItem("CheemsAppLiEffectsVolume");
    this.effVol = savedEffVol !== null ? +savedEffVol : 100;
  }

  loadCheems(): void {
    const savedCheems = localStorage.getItem("CheemsAppLiSelCheems") || localStorage.getItem("CheemsBonkCheems");
    this.selectedCheems = savedCheems ? savedCheems.replace(/"/g, '') : "cheems_normal";
  }

  loadSounds(): void {
    const savedSound = localStorage.getItem("CheemsAppLiSelSound") || localStorage.getItem("CheemsBonkSound");
    this.selectedSound = savedSound ? savedSound.replace(/"/g, '') : "sfx_1";
  }

  loadMusic(): void {
    const savedMusic = localStorage.getItem("CheemsAppLiSelMusic");
    this.selectedMusic = savedMusic ? savedMusic.replace(/"/g, '') : "music_1";
    this.playMusic(this.selectedMusic);
  }

  loadScore(): void {
    const totalScore = localStorage.getItem("CheemsBonkTotalScore") || localStorage.getItem("CheemsAppLiTotalCounter");
    const highScore = localStorage.getItem("CheemsBonkHighScore") || localStorage.getItem("CheemsAppLiMaxCounter");
    const savedPoints = localStorage.getItem("CheemsAppLiPoints");
    const dogeCoins = localStorage.getItem("CheemsBonkDogeCoins") || localStorage.getItem("CheemsAppLiDogecoins");

    this.highScore = highScore ? this.parseNumber(highScore) : 0;
    this.totalScore = totalScore ? this.parseNumber(totalScore) : 0;
    this.points = savedPoints ? this.parseNumber(savedPoints) : 0;
    this.dogeCoins = dogeCoins ? this.parseNumber(dogeCoins) : 0;

    this.actScore = 0;
    localStorage.setItem("CheemsAppLiActPoints", "0");
  }

  loadUnlocks(): void {
    this.cheemsSkins.forEach(s => {
      const stored = localStorage.getItem(s.storageKey);
      if (s.default) {
        this.unlockedCheems[s.storageKey] = true;
      } else {
        this.unlockedCheems[s.storageKey] = stored ? stored.replace(/"/g, '') === 'true' : false;
      }
    });

    this.soundEffects.forEach(s => {
      const stored = localStorage.getItem(s.storageKey);
      if (s.default) {
        this.unlockedSounds[s.storageKey] = true;
      } else {
        this.unlockedSounds[s.storageKey] = stored ? stored.replace(/"/g, '') === 'true' : false;
      }
    });

    this.musicTracks.forEach(s => {
      const stored = localStorage.getItem(s.storageKey);
      if (s.default || s.cost === 0) {
        this.unlockedMusic[s.storageKey] = true;
      } else {
        this.unlockedMusic[s.storageKey] = stored ? stored.replace(/"/g, '') === 'true' : false;
      }
    });
  }

  loadDevMenu(): void {
    const stored = localStorage.getItem("CheemsAppLiDevMenu");
    this.devMenuUnlocked = stored ? stored.replace(/"/g, '') === 'true' : false;
  }

  parseNumber(value: string): number {
    return +value.replace(/"/g, '') || 0;
  }

  parseString(value: any): string {
    return String(value);
  }

  async sleep(time: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  async checkCategoryCached(category: OfflineCategory): Promise<boolean> {
    if (!('caches' in window)) return false;
    try {
      const cache = await caches.open('cheems-bonk-offline-v1');
      for (const url of category.urls) {
        const match = await cache.match(url);
        if (!match) {
          return localStorage.getItem(`cheems_offline_cached_${category.id}`) === 'true';
        }
      }
      return true;
    } catch {
      return localStorage.getItem(`cheems_offline_cached_${category.id}`) === 'true';
    }
  }

  async cacheCategory(category: OfflineCategory, onProgress?: (progress: number) => void): Promise<boolean> {
    if (!('caches' in window)) return false;
    try {
      const cache = await caches.open('cheems-bonk-offline-v1');
      let completed = 0;
      for (const url of category.urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            await cache.put(url, res);
          }
        } catch (e) {
          console.warn(`Failed to cache ${url}`, e);
        }
        completed++;
        if (onProgress) {
          onProgress(Math.round((completed / category.urls.length) * 100));
        }
      }
      localStorage.setItem(`cheems_offline_cached_${category.id}`, 'true');
      return true;
    } catch (err) {
      console.error("Error caching category:", err);
      return false;
    }
  }

  loadBoosterState(): void {
    const storedEndTime = localStorage.getItem("CheemsAppLiBoosterEndTime");
    const storedMultiplier = localStorage.getItem("CheemsAppLiBoosterMultiplier");
    this.boosterEndTime = storedEndTime ? +storedEndTime : 0;
    this.boosterMultiplier = storedMultiplier ? +storedMultiplier : 1;
  }

  async loadShopItems(): Promise<void> {
    try {
      const res = await fetch("shop.json");
      if (res.ok) {
        this.shopItems = await res.json();
      }
    } catch (err) {
      console.warn("Could not load shop.json", err);
    }
    this.appendUnlockableShopItems();
  }

  getActiveMultiplier(): number {
    const now = Date.now();
    if (now < this.boosterEndTime) {
      return this.boosterMultiplier;
    } else if (this.boosterEndTime !== 0) {
      this.boosterEndTime = 0;
      this.boosterMultiplier = 1;
      localStorage.setItem("CheemsAppLiBoosterEndTime", "0");
      localStorage.setItem("CheemsAppLiBoosterMultiplier", "1");
    }
    return 1;
  }

  getBoosterRemainingSeconds(): number {
    const now = Date.now();
    if (now < this.boosterEndTime) {
      return Math.max(0, Math.ceil((this.boosterEndTime - now) / 1000));
    }
    return 0;
  }

  getBoosterFormattedTime(): string {
    const totalSeconds = this.getBoosterRemainingSeconds();
    if (totalSeconds <= 60) {
      return String(totalSeconds).padStart(2, '0');
    }
    const secs = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    if (totalSeconds <= 3600) {
      return `${String(totalMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const mins = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    if (totalSeconds <= 86400) {
      return `${String(totalHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);
    return `${days} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  activateBooster(multiplier: number, durationMin: number): void {
    const durationMs = durationMin * 60 * 1000;
    const now = Date.now();
    if (now < this.boosterEndTime && this.boosterMultiplier === multiplier) {
      this.boosterEndTime += durationMs;
    } else {
      this.boosterEndTime = now + durationMs;
      this.boosterMultiplier = multiplier;
    }
    localStorage.setItem("CheemsAppLiBoosterEndTime", String(this.boosterEndTime));
    localStorage.setItem("CheemsAppLiBoosterMultiplier", String(this.boosterMultiplier));
    this.showToast(this.shop[this.lang]?.boosterActivated || "Booster activated!");
    this.playSound();
  }

  getDailyPurchaseCount(itemId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const stored = localStorage.getItem("CheemsAppLiShopDailyPurchases");
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data.date === today && data.purchases) {
          return data.purchases[itemId] || 0;
        }
      }
    } catch (e) {
      // ignore
    }
    return 0;
  }

  recordDailyPurchase(itemId: string): void {
    const today = new Date().toISOString().slice(0, 10);
    let purchases: Record<string, number> = {};
    try {
      const stored = localStorage.getItem("CheemsAppLiShopDailyPurchases");
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data.date === today && data.purchases) {
          purchases = data.purchases;
        }
      }
    } catch (e) {
      // ignore
    }
    purchases[itemId] = (purchases[itemId] || 0) + 1;
    localStorage.setItem("CheemsAppLiShopDailyPurchases", JSON.stringify({ date: today, purchases }));
  }

  canBuyDailyLimit(item: ShopItem): boolean {
    if (!item.dailyLimit || item.dailyLimit <= 0) {
      return true;
    }
    return this.getDailyPurchaseCount(item.id) < item.dailyLimit;
  }

  getRemainingDailyLimit(item: ShopItem): number {
    if (!item.dailyLimit || item.dailyLimit <= 0) {
      return 0;
    }
    return Math.max(0, item.dailyLimit - this.getDailyPurchaseCount(item.id));
  }

  getLifetimePurchaseCount(itemId: string): number {
    try {
      const stored = localStorage.getItem("CheemsAppLiShopLifetimePurchases");
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data[itemId]) {
          return data[itemId];
        }
      }
    } catch (e) {
      // ignore
    }
    return 0;
  }

  recordLifetimePurchase(itemId: string): void {
    try {
      const stored = localStorage.getItem("CheemsAppLiShopLifetimePurchases");
      const data = stored ? JSON.parse(stored) : {};
      data[itemId] = (data[itemId] || 0) + 1;
      localStorage.setItem("CheemsAppLiShopLifetimePurchases", JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  isLifetimeLimitReached(item: ShopItem): boolean {
    if (item.type === 'cheems') {
      const target = String(item.targetId !== undefined ? item.targetId : item.id);
      return this.isCheemsUnlocked(target);
    }
    if (item.type === 'sound') {
      const target = String(item.targetId !== undefined ? item.targetId : item.id);
      return this.isSoundUnlocked(target);
    }
    if (item.type === 'music') {
      const target = String(item.targetId !== undefined ? item.targetId : item.id);
      return this.isMusicUnlocked(target);
    }
    if (item.oneTimePurchase) {
      return this.getLifetimePurchaseCount(item.id) >= 1;
    }
    return false;
  }

  appendUnlockableShopItems(): void {
    if (!this.cheemsSkins.length && !this.soundEffects.length && !this.musicTracks.length) {
      return;
    }

    this.cheemsSkins.forEach(skin => {
      if (!skin.default && skin.id !== 'cheems_normal' && skin.id !== 'normal' && !this.shopItems.some(i => i.id === skin.id)) {
        this.shopItems.push({
          id: skin.id,
          type: 'cheems',
          targetId: skin.id,
          nameKey: skin.nameKey,
          cost: 0,
          costCoins: skin.cost,
          icon: this.getCheemsImg(skin.id),
          oneTimePurchase: true
        });
      }
    });

    this.soundEffects.forEach(sound => {
      if (!sound.default && sound.id !== 'sfx_1' && sound.id !== '1' && !this.shopItems.some(i => i.id === sound.id)) {
        this.shopItems.push({
          id: sound.id,
          type: 'sound',
          targetId: sound.id,
          nameKey: sound.nameKey,
          cost: 0,
          costCoins: sound.cost,
          icon: "img/icons/sound-svgrepo-com.svg",
          oneTimePurchase: true
        });
      }
    });

    this.musicTracks.forEach(track => {
      if (!track.default && String(track.id) !== 'music_0' && String(track.id) !== 'music_1' && String(track.id) !== '0' && String(track.id) !== '1' && !this.shopItems.some(i => i.id === String(track.id))) {
        this.shopItems.push({
          id: String(track.id),
          type: 'music',
          targetId: track.id,
          nameKey: track.nameKey,
          cost: 0,
          costCoins: track.cost,
          icon: "img/icons/music-svgrepo-com.svg",
          oneTimePurchase: true
        });
      }
    });
  }

  buyShopUnlockableItem(item: ShopItem): boolean {
    if (this.isLifetimeLimitReached(item)) {
      this.showToast(this.shop[this.lang]?.alreadyPurchased || "Already purchased!");
      return false;
    }
    const ptsCost = item.cost || 0;
    const coinCost = item.costCoins || 0;
    if (this.points >= ptsCost && this.dogeCoins >= coinCost) {
      this.points -= ptsCost;
      this.dogeCoins -= coinCost;
      localStorage.setItem("CheemsAppLiPoints", JSON.stringify(this.points));
      localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.dogeCoins));

      if (item.type === 'cheems') {
        const targetId = String(item.targetId !== undefined ? item.targetId : item.id);
        const skin = this.cheemsSkins.find(s => s.id === targetId);
        if (skin) {
          this.unlockedCheems[skin.storageKey] = true;
          localStorage.setItem(skin.storageKey, JSON.stringify(true));
        }
      } else if (item.type === 'sound') {
        const targetId = String(item.targetId !== undefined ? item.targetId : item.id);
        const sound = this.soundEffects.find(s => s.id === targetId);
        if (sound) {
          this.unlockedSounds[sound.storageKey] = true;
          localStorage.setItem(sound.storageKey, JSON.stringify(true));
        }
      } else if (item.type === 'music') {
        const targetId = String(item.targetId !== undefined ? item.targetId : item.id);
        const track = this.musicTracks.find(m => String(m.id) === targetId);
        if (track) {
          this.unlockedMusic[track.storageKey] = true;
          localStorage.setItem(track.storageKey, JSON.stringify(true));
        }
      }

      this.recordDailyPurchase(item.id);
      this.recordLifetimePurchase(item.id);
      this.showToast(this.shop[this.lang]?.itemBoughtGoToCloset || "Item purchased! Go to Closet to equip.");
      this.playSound();
      return true;
    } else {
      if (this.points < ptsCost) {
        this.showToast(this.shop[this.lang]?.needMorePoints || "Not enough points!");
      } else {
        this.showToast(this.shop[this.lang]?.needMoreCoins || "Need more DogeCoins!");
      }
      this.playSound('sfx_8');
      return false;
    }
  }


  private setupWindowFocusListeners(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllAudioForBlur();
      } else {
        this.resumeAllAudioForFocus();
      }
    });

    window.addEventListener('blur', () => {
      this.pauseAllAudioForBlur();
    });

    window.addEventListener('focus', () => {
      if (!document.hidden) {
        this.resumeAllAudioForFocus();
      }
    });
  }

  private pauseAllAudioForBlur(): void {
    if (this.isWindowBlurred) return;
    this.isWindowBlurred = true;
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend().catch(() => {});
    }
    if (!this.musicAudio.paused) {
      this.musicAudio.pause();
    }
  }

  private resumeAllAudioForFocus(): void {
    if (!this.isWindowBlurred) return;
    this.isWindowBlurred = false;
    if (String(this.selectedMusic) !== '0' && this.musVol > 0) {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      } else if (this.musicAudio.paused && this.musicAudio.src) {
        this.musicAudio.play().catch(() => {});
      }
    }
  }

  getCheemsImg(id: string): string {
    const skin = this.cheemsSkins.find(s => s.id === id);
    if (skin?.imgUrl) return skin.imgUrl;
    return "img/cheems/" + (skin?.img || id + ".png");
  }

  getCheemsHitImg(id: string): string {
    const skin = this.cheemsSkins.find(s => s.id === id);
    if (skin?.hitImgUrl) return skin.hitImgUrl;
    return "img/hit/" + (skin?.hitImg || skin?.img || id + ".png");
  }

  getShopItemName(item: ShopItem): string {
    if (item.nameKey && this.shopItemsText[this.lang]?.[item.nameKey]) {
      return this.shopItemsText[this.lang][item.nameKey];
    }
    if (item.nameKey && this.itemsText[this.lang]?.[item.nameKey]) {
      return this.itemsText[this.lang][item.nameKey];
    }
    return this.lang === 'es' ? (item.nameEs || item.nameEn || item.id) : (item.nameEn || item.nameEs || item.id);
  }

  getShopItemDesc(item: ShopItem): string {
    if (item.descKey && this.shopItemsText[this.lang]?.[item.descKey]) {
      return this.shopItemsText[this.lang][item.descKey];
    }
    return this.lang === 'es' ? (item.descEs || item.descEn || '') : (item.descEn || item.descEs || '');
  }

  getCheemsName(skin: CheemsSkinItem): string {
    if (skin.nameKey && this.itemsText[this.lang]?.[skin.nameKey]) {
      return this.itemsText[this.lang][skin.nameKey];
    }
    return this.lang === 'es' ? (skin.nameEs || skin.nameEn || skin.id) : (skin.nameEn || skin.nameEs || skin.id);
  }

  getSoundName(sound: SoundEffectItem): string {
    if (sound.nameKey && this.itemsText[this.lang]?.[sound.nameKey]) {
      return this.itemsText[this.lang][sound.nameKey];
    }
    return sound.name || sound.id;
  }

  getMusicName(track: MusicTrackItem): string {
    if (track.nameKey && this.itemsText[this.lang]?.[track.nameKey]) {
      return this.itemsText[this.lang][track.nameKey];
    }
    return track.name || String(track.id);
  }
}
