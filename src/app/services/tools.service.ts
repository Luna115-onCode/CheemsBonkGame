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
  MusicTrackItem
} from './constants.service';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  fontSize: string = "text-normal";
  themeColor: string = "theme-dark";
  actPage: keyof PageName[""] = "game";
  lang: string = "es";
  selectedCheems: string = "normal";
  selectedSound: string = "1";
  selectedMusic: number = 1;

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

  game: any = gameText;
  options: any = optionsText;
  menu: any = menuText;
  closet: any = closetText;
  dev: any = devText;
  onWork: any = onWorkText;
  p404: any = p404Text;
  pageName: any = pageName;

  availableLanguages: Array<{ code: string; name: string }> = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' }
  ];

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
      if (this.selectedMusic !== 0) {
        this.musicAudio.play().catch(() => {});
      }
    });

    const resumeMusicOnInteraction = () => {
      if (this.selectedMusic !== 0 && this.musicAudio.paused) {
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
    const currentIdx = this.availableLanguages.findIndex(l => l.code === this.lang);
    const nextIdx = (currentIdx + 1) % this.availableLanguages.length;
    this.lang = this.availableLanguages[nextIdx].code;
    localStorage.setItem("CheemsBonkLang", this.lang);
    this.loadLanguageFile(this.lang);
    this.setTitle(this.actPage);
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
      }
    } catch (err) {
      console.warn(`Could not load language file lang/texts.${langCode}.lang`, err);
    }
  }

  async loadStorePrices(): Promise<void> {
    try {
      const res = await fetch('store.json');
      if (res.ok) {
        const prices = await res.json();
        if (prices.cheems) {
          this.cheemsSkins.forEach(skin => {
            if (prices.cheems[skin.id] !== undefined) {
              skin.cost = prices.cheems[skin.id];
            }
          });
        }
        if (prices.sounds) {
          this.soundEffects.forEach(sound => {
            if (prices.sounds[sound.id] !== undefined) {
              sound.cost = prices.sounds[sound.id];
            }
          });
        }
        if (prices.music) {
          this.musicTracks.forEach(track => {
            if (prices.music[String(track.id)] !== undefined) {
              track.cost = prices.music[String(track.id)];
            }
          });
        }
      }
    } catch (err) {
      console.warn('Could not load store.json, using default prices', err);
    }
  }

  redirect(url: string): void {
    this.router.navigate([url]);
  }

  reload(): void {
    window.location.reload();
  }

  redirectBack(fromSystem: boolean = false): void {
    if (["devSettings", "closet", "settings", "onWork"].includes(this.actPage)) {
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
    const todayStr = new Date().toISOString().slice(0, 10);
    let seed = 0;
    for (let i = 0; i < todayStr.length; i++) {
      seed = ((seed << 5) - seed) + todayStr.charCodeAt(i);
      seed |= 0;
    }
    const absSeed = Math.abs(seed);
    const offset = (absSeed % 101) - 50;
    return 100 + offset;
  }

  buyDogeCoin(): boolean {
    const cost = this.getDailyDogeCoinPrice();
    if (this.points >= cost) {
      this.points -= cost;
      this.dogeCoins += 1;
      localStorage.setItem("CheemsAppLiPoints", JSON.stringify(this.points));
      localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.dogeCoins));
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
      this.playSound('4');
    }
  }

  playSound(customSoundId?: string): void {
    const soundToPlay = customSoundId || this.selectedSound;
    let file = "hit.ogg";
    switch (soundToPlay) {
      case '1': file = "hit.ogg"; break;
      case '2': file = "hurt-minecraft.ogg"; break;
      case '3': file = "hurt-roblox.ogg"; break;
      case '4':
        const randLvl = Math.floor(Math.random() * 5) + 1;
        file = randLvl === 4 ? "levelup2.ogg" : "levelup1.ogg";
        break;
      case '5':
        const randDis = Math.floor(Math.random() * 3) + 1;
        if (randDis === 1) file = "discord-connect.ogg";
        else if (randDis === 2) file = "discord-disconnect.ogg";
        else file = "discord-msg.ogg";
        break;
      case '6': file = "hello.ogg"; break;
      case '7': file = "hit-minecraft.ogg"; break;
      case '8': file = "no.ogg"; break;
      case '9': file = "pato.ogg"; break;
      case '10': file = "peluche.ogg"; break;
      case '11': file = "splat.ogg"; break;
      case '12': file = "windows-error.ogg"; break;
      default: file = "hit.ogg"; break;
    }
    this.soundAudio.src = "sound/" + file;
    this.soundAudio.volume = this.effVol / 100;
    this.soundAudio.play().catch(() => {});
  }

  playMusic(songId?: number): void {
    const trackId = songId !== undefined ? songId : this.selectedMusic;
    const track = this.musicTracks.find(t => t.id === trackId);
    if (!track || track.id === 0 || !track.file) {
      this.musicAudio.pause();
      this.musicAudio.src = "";
      return;
    }
    const targetSrc = "sound/music/" + track.file;
    if (!this.musicAudio.src.endsWith(targetSrc)) {
      this.musicAudio.src = targetSrc;
      this.musicAudio.loop = true;
      this.musicAudio.load();
    }
    this.musicAudio.volume = this.musVol / 100;
    this.musicAudio.play().catch(() => {});
  }

  setMusicVolume(vol: number): void {
    this.musVol = Math.max(0, Math.min(100, vol));
    this.musicAudio.volume = this.musVol / 100;
    localStorage.setItem("CheemsAppLiMusicVolume", String(this.musVol));
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
    if (id === 'normal') return true;
    const item = this.cheemsSkins.find(s => s.id === id);
    if (!item) return false;
    return !!this.unlockedCheems[item.storageKey];
  }

  buyOrSelectCheems(skin: CheemsSkinItem): boolean {
    if (this.isCheemsUnlocked(skin.id)) {
      this.selectedCheems = skin.id;
      localStorage.setItem("CheemsAppLiSelCheems", skin.id);
      localStorage.setItem("CheemsBonkCheems", skin.id);
      this.showToast(this.closet[this.lang].itemSelected);
      this.playSound();
      return true;
    } else {
      if (this.dogeCoins >= skin.cost) {
        this.dogeCoins -= skin.cost;
        this.unlockedCheems[skin.storageKey] = true;
        this.selectedCheems = skin.id;
        localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.dogeCoins));
        localStorage.setItem(skin.storageKey, JSON.stringify(true));
        localStorage.setItem("CheemsAppLiSelCheems", skin.id);
        localStorage.setItem("CheemsBonkCheems", skin.id);
        this.showToast(this.closet[this.lang].itemBought);
        this.playSound();
        return true;
      } else {
        this.showToast(this.closet[this.lang].needMoreCoins);
        this.playSound('8');
        return false;
      }
    }
  }

  isSoundUnlocked(id: string): boolean {
    if (id === '1') return true;
    const item = this.soundEffects.find(s => s.id === id);
    if (!item) return false;
    return !!this.unlockedSounds[item.storageKey];
  }

  buyOrSelectSound(sound: SoundEffectItem): boolean {
    if (this.isSoundUnlocked(sound.id)) {
      this.selectedSound = sound.id;
      localStorage.setItem("CheemsAppLiSelSound", sound.id);
      localStorage.setItem("CheemsBonkSound", sound.id);
      this.showToast(this.closet[this.lang].itemSelected);
      this.playSound(sound.id);
      return true;
    } else {
      if (this.dogeCoins >= sound.cost) {
        this.dogeCoins -= sound.cost;
        this.unlockedSounds[sound.storageKey] = true;
        this.selectedSound = sound.id;
        localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.dogeCoins));
        localStorage.setItem(sound.storageKey, JSON.stringify(true));
        localStorage.setItem("CheemsAppLiSelSound", sound.id);
        localStorage.setItem("CheemsBonkSound", sound.id);
        this.showToast(this.closet[this.lang].itemBought);
        this.playSound(sound.id);
        return true;
      } else {
        this.showToast(this.closet[this.lang].needMoreCoins);
        this.playSound('8');
        return false;
      }
    }
  }

  isMusicUnlocked(id: number): boolean {
    if (id === 0 || id === 1) return true;
    const item = this.musicTracks.find(m => m.id === id);
    if (!item) return false;
    return !!this.unlockedMusic[item.storageKey];
  }

  buyOrSelectMusic(track: MusicTrackItem): boolean {
    if (this.isMusicUnlocked(track.id)) {
      this.selectMusic(track);
      return true;
    } else {
      if (this.dogeCoins >= track.cost) {
        this.dogeCoins -= track.cost;
        this.unlockedMusic[track.storageKey] = true;
        localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.dogeCoins));
        localStorage.setItem(track.storageKey, JSON.stringify(true));
        this.selectMusic(track);
        this.showToast(this.closet[this.lang].itemBought);
        return true;
      } else {
        this.showToast(this.closet[this.lang].needMoreCoins);
        this.playSound('8');
        return false;
      }
    }
  }

  selectMusic(track: MusicTrackItem): void {
    this.selectedMusic = track.id;
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
    this.playSound('4');
  }

  resetToZero(): void {
    this.actScore = 0;
    this.points = 0;
    this.totalScore = 0;
    this.highScore = 0;
    this.dogeCoins = 0;
    this.selectedCheems = "normal";
    this.selectedSound = "1";
    this.selectedMusic = 1;
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
    localStorage.setItem("CheemsAppLiSelCheems", "normal");
    localStorage.setItem("CheemsAppLiSelSound", "1");
    localStorage.setItem("CheemsAppLiSelMusic", "1");
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
    this.loadStorePrices();
    this.loadCheems();
    this.loadSounds();
    this.loadMusic();
    this.loadScore();
    this.loadUnlocks();
    this.loadDevMenu();
  }

  loadSettings(): void {
    const savedLang = localStorage.getItem("CheemsBonkLang");
    this.lang = savedLang && this.availableLanguages.some(l => l.code === savedLang) ? savedLang : "es";

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
    this.selectedCheems = savedCheems ? savedCheems.replace(/"/g, '') : "normal";
  }

  loadSounds(): void {
    const savedSound = localStorage.getItem("CheemsAppLiSelSound") || localStorage.getItem("CheemsBonkSound");
    this.selectedSound = savedSound ? savedSound.replace(/"/g, '') : "1";
  }

  loadMusic(): void {
    const savedMusic = localStorage.getItem("CheemsAppLiSelMusic");
    this.selectedMusic = savedMusic !== null && !isNaN(+savedMusic) ? +savedMusic : 1;
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
}
