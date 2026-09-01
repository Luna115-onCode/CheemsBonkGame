import { Injectable, signal, computed, effect } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  gameText,
  optionsText,
  PageName,
  pageName,
  menuText,
  closetText,
  redeemText,
  onWorkText,
  p404Text,
  minigamesText,
  statsText,
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
  ShopItem,
  flappy_dunkText,
  magic_sortText,
  attack_holeText,
  block_breakerText,
  doge_rescueText,
  helix_jumpText,
  mob_controlText,
  paper_ioText,
  spiral_rollText,
  stack_colorsText,
  rock_paper_pokeText,
  tic_tac_toeText,
  black_jackText
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
  minigameCoins: number = 50;
  sessionPoints: number = 0;
  
  totalPointsEarned: number = 0;
  totalDogeCoinsEarned: number = 0;
  totalMinigameCoinsEarned: number = 0;

  idlePoints: number = 0;
  idleTime: number = 1;
  clickPoints: number = 1;
  private idleTimer: any = null;
  purchasedUpgrades: Record<string, number> = {};

  effVol: number = 100;
  musVol: number = 50;

  redeemedCodes: string[] = [];

  unlockedCheems: Record<string, boolean> = {};
  unlockedSounds: Record<string, boolean> = {};
  unlockedMusic: Record<string, boolean> = {};
  unlockedMinigames: Record<string, boolean> = {};

  game: any = createLangMap(gameText);
  options: any = createLangMap(optionsText);
  menu: any = createLangMap(menuText);
  closet: any = createLangMap(closetText);
  redeem: any = createLangMap(redeemText);
  onWork: any = createLangMap(onWorkText);
  p404: any = createLangMap(p404Text);
  offline: any = createLangMap(offlineText);
  shop: any = {};
  gallery: any = {};
  licensesPage: any = {};
  minigames: any = createLangMap(minigamesText);
  stats: any = createLangMap(statsText);
  pageName: any = createLangMap(pageName);
  flappy_dunk: any = createLangMap(flappy_dunkText);
  magic_sort: any = createLangMap(magic_sortText);
  attack_hole: any = createLangMap(attack_holeText);
  block_breaker: any = createLangMap(block_breakerText);
  doge_rescue: any = createLangMap(doge_rescueText);
  helix_jump: any = createLangMap(helix_jumpText);
  mob_control: any = createLangMap(mob_controlText);
  paper_io: any = createLangMap(paper_ioText);
  spiral_roll: any = createLangMap(spiral_rollText);
  stack_colors: any = createLangMap(stack_colorsText);
  rock_paper_poke: any = createLangMap(rock_paper_pokeText);
  tic_tac_toe: any = createLangMap(tic_tac_toeText);
  black_jack: any = createLangMap(black_jackText);
  shopItemsText: Record<string, Record<string, string>> = {};
  itemsText: Record<string, Record<string, string>> = {};
  shopItems: Array<ShopItem> = [];
  boosterEndTime: number = 0;
  boosterMultiplier: number = 1;
  minigameConversions: Record<string, { id?: string; name?: string; points: number; mgPoints: number; levelMgPoints?: number }> = {
    'block_breaker': { points: 100, mgPoints: 10, levelMgPoints: 5 },
    'attack_hole': { points: 100, mgPoints: 10, levelMgPoints: 5 },
    'doge_rescue': { points: 10, mgPoints: 10, levelMgPoints: 5 },
    'flappy_dunk': { points: 10, mgPoints: 10, levelMgPoints: 5 },
    'helix_jump': { points: 100, mgPoints: 10, levelMgPoints: 5 },
    'magic_sort': { points: 10, mgPoints: 10, levelMgPoints: 5 },
    'mob_control': { points: 100, mgPoints: 10, levelMgPoints: 5 },
    'paper_io': { points: 100, mgPoints: 10, levelMgPoints: 5 },
    'spiral_roll': { points: 100, mgPoints: 10, levelMgPoints: 5 },
    'stack_colors': { points: 100, mgPoints: 10, levelMgPoints: 5 },
    'rock_paper_poke': { points: 10, mgPoints: 1, levelMgPoints: 1 }
  };
  private audioCtx: AudioContext | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private currentMusicBuffer: AudioBuffer | null = null;
  private currentMusicFile: string = "";
  public isWindowBlurred: boolean = false;
  public isImportingSave: boolean = false;
  public isBackgroundMusicPaused: boolean = false;

  availableLanguages: Array<LanguageItem> = AVAILABLE_LANGUAGES;

  cheemsSkins: Array<CheemsSkinItem> = CHEEMS_SKINS;
  soundEffects: Array<SoundEffectItem> = SOUND_EFFECTS;
  musicTracks: Array<MusicTrackItem> = MUSIC_TRACKS;

  private musicAudio: HTMLAudioElement = new Audio();

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
      if (String(this.selectedMusic) !== '0' && this.musicAudio.paused && !this.isBackgroundMusicPaused) {
        this.playMusic(this.selectedMusic);
      }
    };
    document.addEventListener('click', resumeMusicOnInteraction, { passive: true });
    document.addEventListener('touchstart', resumeMusicOnInteraction, { passive: true });
    document.addEventListener('keydown', resumeMusicOnInteraction, { passive: true });
  }

  private readonly PREFIX = "CheemsBonkGame115_";

  saveData(key: string, value: string): void {
    localStorage.setItem(this.PREFIX + key, value);
  }

  loadData(key: string): string | null {
    return localStorage.getItem(this.PREFIX + key);
  }

  deleteData(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  parseArrayString(str: string): string[] {
    if (!str) return [];
    return str.split(';').filter(s => s.trim().length > 0);
  }

  stringifyArray(arr: string[]): string {
    if (!arr || arr.length === 0) return "";
    return arr.join(';');
  }

  parseObjectString(str: string): Record<string, string> {
    if (!str) return {};
    const obj: Record<string, string> = {};
    const pairs = str.split(',');
    for (const p of pairs) {
      if (!p) continue;
      const idx = p.indexOf(':');
      if (idx !== -1) {
        obj[p.substring(0, idx)] = p.substring(idx + 1);
      }
    }
    return obj;
  }

  stringifyObject(obj: Record<string, string | number>): string {
    if (!obj) return "";
    const pairs: string[] = [];
    for (const key of Object.keys(obj)) {
      pairs.push(`${key}:${obj[key]}`);
    }
    return pairs.join(',');
  }

  parseArrayOfObjectsString(str: string): Record<string, string>[] {
    if (!str) return [];
    const items = str.split(';');
    const result: Record<string, string>[] = [];
    for (const item of items) {
      if (item.trim().length > 0) {
        result.push(this.parseObjectString(item));
      }
    }
    return result;
  }

  stringifyArrayOfObjects(arr: Record<string, string | number>[]): string {
    if (!arr || arr.length === 0) return "";
    const strings = arr.map(obj => this.stringifyObject(obj));
    return strings.join(';') + (strings.length > 0 ? ';' : '');
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
      this.saveData("language", this.lang);
      this.loadLanguageFile(this.lang);
      this.setTitle(this.actPage);
    }
  }

  async loadLanguageFile(langCode: string): Promise<void> {
    try {
      const res = await this.safeFetch(`lang/texts.${langCode}.lang`);
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
        if (data.redeemText) this.redeem[langCode] = { ...this.redeem[langCode], ...data.redeemText };
        if (data.onWork) this.onWork[langCode] = { ...this.onWork[langCode], ...data.onWork };
        if (data.p404) this.p404[langCode] = { ...this.p404[langCode], ...data.p404 };
        if (data.offline) this.offline[langCode] = { ...this.offline[langCode], ...data.offline };
        if (data.shop) this.shop[langCode] = { ...this.shop[langCode], ...data.shop };
        if (data.minigames) this.minigames[langCode] = { ...this.minigames[langCode], ...data.minigames };
        if (data.flappy_dunk) this.flappy_dunk[langCode] = { ...this.flappy_dunk[langCode], ...data.flappy_dunk };
        if (data.magic_sort) this.magic_sort[langCode] = { ...this.magic_sort[langCode], ...data.magic_sort };
        if (data.attack_hole) this.attack_hole[langCode] = { ...this.attack_hole[langCode], ...data.attack_hole };
        if (data.block_breaker) this.block_breaker[langCode] = { ...this.block_breaker[langCode], ...data.block_breaker };
        if (data.doge_rescue) this.doge_rescue[langCode] = { ...this.doge_rescue[langCode], ...data.doge_rescue };
        if (data.helix_jump) this.helix_jump[langCode] = { ...this.helix_jump[langCode], ...data.helix_jump };
        if (data.mob_control) this.mob_control[langCode] = { ...this.mob_control[langCode], ...data.mob_control };
        if (data.paper_io) this.paper_io[langCode] = { ...this.paper_io[langCode], ...data.paper_io };
        if (data.spiral_roll) this.spiral_roll[langCode] = { ...this.spiral_roll[langCode], ...data.spiral_roll };
        if (data.stack_colors) this.stack_colors[langCode] = { ...this.stack_colors[langCode], ...data.stack_colors };
        if (data.rock_paper_poke) this.rock_paper_poke[langCode] = { ...this.rock_paper_poke[langCode], ...data.rock_paper_poke };
        if (data.tic_tac_toe) this.tic_tac_toe[langCode] = { ...this.tic_tac_toe[langCode], ...data.tic_tac_toe };
        if (data.black_jack) this.black_jack[langCode] = { ...this.black_jack[langCode], ...data.black_jack };
        if (data.gallery) this.gallery[langCode] = { ...this.gallery[langCode], ...data.gallery };
        if (data.licensesPage) this.licensesPage[langCode] = { ...this.licensesPage[langCode], ...data.licensesPage };
        if (data.shopItemsText) this.shopItemsText[langCode] = { ...this.shopItemsText[langCode], ...data.shopItemsText };
        if (data.itemsText) this.itemsText[langCode] = { ...this.itemsText[langCode], ...data.itemsText };
      }
    } catch (err) {
      console.warn(`Could not load language file lang/texts.${langCode}.lang`, err);
    }
  }

  async safeFetch(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetch(url);
      } catch (e) {
        console.warn(`Fetch failed for ${url}, retrying... (${i + 1}/${retries})`, e);
        if (i === retries - 1) throw e;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    throw new Error('Unreachable');
  }

  formatBigNumber(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num == null) return "0";
    
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    
    if (absNum < 1000) return String(isNegative ? Math.ceil(num) : Math.floor(num));

    const suffixes = ["", "K", "M", "B", "T", "P", "E", "Z", "Y", "?"];
    let suffixNum = 0;
    let shortValue = absNum;

    while (shortValue >= 1000 && suffixNum < suffixes.length - 1) {
       shortValue /= 1000;
       suffixNum++;
    }

    let str = shortValue.toFixed(1);
    if (str === "1000.0") {
        if (suffixNum < suffixes.length - 1) {
            suffixNum++;
            str = "1";
        } else {
            str = "1000";
        }
    } else if (str.endsWith('.0')) {
        str = str.slice(0, -2);
    }

    return (isNegative ? "-" : "") + str + suffixes[suffixNum];
  }

  async loadClosetPrices(): Promise<void> {
    try {
      const [cheemsRes, soundsRes, musicRes, closetRes] = await Promise.all([
        this.safeFetch('data/cheems.json').catch(() => null),
        this.safeFetch('data/sound_effects.json').catch(() => null),
        this.safeFetch('data/music.json').catch(() => null),
        this.safeFetch('data/closet.json').catch(() => null)
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
      console.warn('Could not load data/closet.json or data/ items, using default arrays', err);
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
    const minigamePages = ["block_breaker", "attack_hole", "doge_rescue", "flappy_dunk", "helix_jump", "magic_sort", "mob_control", "paper_io", "spiral_roll", "stack_colors", "rock_paper_poke", "tic_tac_toe", "black_jack"];
    if (minigamePages.includes(this.actPage as string)) {
      this.redirect("minigames");
    } else if (["redeem", "closet", "gallery", "settings", "onWork", "shop", "minigames", "stats", "licenses"].includes(this.actPage as string)) {
      this.redirect("menu");
    } else if (["menu", "p404"].includes(this.actPage as string)) {
      this.redirect("game");
    } else if (["game"].includes(this.actPage as string)) {
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
    let finalValue = value * this.boosterMultiplier;
    this.actScore += finalValue;
    this.points += finalValue;
    this.totalScore += finalValue;
    this.totalPointsEarned += finalValue;

    if (this.actScore > this.highScore) {
      this.highScore = this.actScore;
    }

    
    this.saveData("points", String(this.points));
    this.saveData("total_score", String(this.totalScore));
    this.saveData("high_score", String(this.highScore));
    this.saveData("lifetime_points", String(this.totalPointsEarned));
    
    
  }

  addMinigameCoins(amount: number): void {
    this.minigameCoins = Math.floor(this.minigameCoins + amount);
    this.totalMinigameCoinsEarned += amount;
    this.saveData("mg", String(this.minigameCoins));
    this.saveData("lifetime_mg", String(this.totalMinigameCoinsEarned));
  }

  spendMinigameCoins(amount: number): boolean {
    if (this.minigameCoins >= amount) {
      this.minigameCoins = Math.floor(this.minigameCoins - amount);
      this.saveData("mg", String(this.minigameCoins));
      return true;
    }
    return false;
  }

  isMinigameUnlocked(id: string): boolean {
    const key = id.replace('minigames/', '').replace(/-/g, '_');
    return !!this.unlockedMinigames[key];
  }

  async loadMinigamesConfig(): Promise<void> {
    try {
      const res = await this.safeFetch("data/minigames.json");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item && item.id) {
              this.minigameConversions[item.id] = item;
            }
          });
        }
      }
    } catch (err) {
      console.warn("Could not load data/minigames.json", err);
    }
  }

  leaveMinigame(gameId: string, gamePoints: number, gameLevel: number = 0): void {
    if ((!gamePoints || gamePoints <= 0) && (!gameLevel || gameLevel <= 0)) return;
    const cfg = this.minigameConversions[gameId] || { points: 100, mgPoints: 10, levelMgPoints: 5 };
    const levelMult = cfg.levelMgPoints || 5;
    const earnedFromPoints = (gamePoints > 0 && cfg.points > 0) ? Math.floor((gamePoints / cfg.points) * cfg.mgPoints) : 0;
    const earnedFromLevel = gameLevel > 0 ? (gameLevel * levelMult) : 0;
    const totalEarned = earnedFromPoints + earnedFromLevel;

    if (totalEarned > 0) {
      this.addMinigameCoins(totalEarned);
      let template = this.minigames[this.lang]?.convertedPointsToast || "Converted {0} game points to +{1} MG Coins!";
      let msg = template.replace("{0}", String(Math.floor(gamePoints))).replace("{1}", String(totalEarned));
      if (gameLevel > 0) {
        msg = msg.replace("game points", "points & level " + gameLevel);
        msg = msg.replace("puntos del juego", "puntos y nivel " + gameLevel);
      }
      this.showToast(msg, 4000);
      this.playSound("sfx_4");
    }
  }

  getDailyDogeCoinPrice(priceType: number = 1): number {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateNum = Number(`${yyyy}${mm}${dd}`);
    const product = dateNum * Math.PI;
    const str = (product.toString().replace('.', '') + '00000000000000000000').slice(0, 30);

    let digits = "";

    switch (priceType) {
      case 2:
        digits = str.slice(1, 4);
        break;
      case 3:
        digits = str.slice(4, 7);
        break;
      case 4:
        digits = str.slice(11, 14);
        break;
      case 1:
      default:
        digits = str.slice(8, 11);
        break;
    }

    const price = parseInt(digits, 10);
    return (!isNaN(price) && price > 0) ? price : 100;
  }

  buyDogeCoin(customCost?: number, coinsAmount: number = 1, itemId: string = "dogecoin_daily"): boolean {
    const cost = customCost !== undefined ? customCost : this.getDailyDogeCoinPrice();
    const coinsToAdd = (coinsAmount && coinsAmount > 0) ? coinsAmount : 1;
    if (this.points >= cost) {
      this.points -= cost;
      this.dogeCoins += coinsToAdd;
      this.totalDogeCoinsEarned += coinsToAdd;
      this.saveData("points", String(this.points));
      this.saveData("dg", String(this.dogeCoins));
      this.saveData("lifetime_dg", String(this.totalDogeCoinsEarned));
      this.recordDailyPurchase(itemId);
      let successMsg = this.menu[this.lang]?.buyDogeCoinSuccess || `You bought ${coinsToAdd} DogeCoin(s)!`;
      if (coinsToAdd !== 1) {
        successMsg = successMsg.replace('1 DogeCoin', `${coinsToAdd} DogeCoins`);
      }
      this.showToast(successMsg);
      this.playSound();
      return true;
    } else {
      this.showToast(this.menu[this.lang].buyDogeCoinFail);
      this.playSound('sfx_8');
      return false;
    }
  }

  buyUpgrade(item: ShopItem, currentCost: number, coinsCost: number): void {
    if (this.points >= currentCost && this.dogeCoins >= coinsCost) {
      this.points -= currentCost;
      this.dogeCoins -= coinsCost;
      this.saveData("points", String(this.points));
      this.saveData("dg", String(this.dogeCoins));

      const times = this.purchasedUpgrades[item.id] || 0;
      this.purchasedUpgrades[item.id] = times + 1;
      this.saveData("upgrades", this.stringifyObject(this.purchasedUpgrades));

      this.recalculateIdleStats();
      this.recordDailyPurchase(item.id);
      
      this.showToast(this.closet[this.lang]?.purchased || "Purchased!");
      this.playSound('sfx_4');
    } else {
      this.showToast(this.shop[this.lang]?.notEnoughCoins || "Not enough currency!");
      this.playSound('sfx_8');
    }
  }

  saveRedeemedCodes(): void {
    this.saveData("redeemed_codes", JSON.stringify(this.redeemedCodes));
  }

  playSound(customSoundId?: string): void {
    if (this.isWindowBlurred) return;
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

    const sfx = new Audio(basePath + file);
    sfx.volume = this.effVol / 100;
    sfx.play().catch(() => {});
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
        const arrayBuf = await new Promise<ArrayBuffer>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', targetSrc, true);
          xhr.responseType = 'arraybuffer';
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(new Error(xhr.statusText));
            }
          };
          xhr.onerror = () => reject(new Error('XHR Network error'));
          xhr.send();
        });
        const audioBuf = await this.audioCtx.decodeAudioData(arrayBuf);
        this.currentMusicBuffer = audioBuf;
        this.startWebAudioMusic();
        return;
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
    this.saveData("music_volume", String(this.musVol));
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
    this.saveData("sfx_volume", String(this.effVol));
  }

  switchTheme(themeIndex: number): void {
    switch (themeIndex) {
      case 0: this.themeColor = "theme-light"; break;
      case 1: this.themeColor = "theme-dark"; break;
      case 2: this.themeColor = "theme-contrast"; break;
      default: this.themeColor = "theme-dark"; break;
    }
    this.saveData("app_theme", String(themeIndex));
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
    this.saveData("font_size", String(sizeIndex));
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
      this.saveData("selected_cheems", skin.id);
      
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
      this.saveData("selected_sfx", sound.id);
      
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
    this.saveData("selected_music", String(track.id));
    this.playMusic(track.id);
    this.showToast(this.closet[this.lang].itemSelected);
  }

  unlockAll(): void {
    this.actScore = 999999;
    this.points = 999999;
    this.totalScore = 999999;
    this.highScore = 999999;
    this.dogeCoins = 999999;
    this.minigameCoins = 999999;
    const allMinigames = ['block_breaker', 'attack_hole', 'doge_rescue', 'flappy_dunk', 'helix_jump', 'magic_sort', 'mob_control', 'paper_io', 'spiral_roll', 'stack_colors', 'rock_paper_poke', 'tic_tac_toe', 'black_jack'];
    allMinigames.forEach(id => {
      this.unlockedMinigames[id] = true;
    });
    this.saveUnlockedMinigames();
    this.minigameCoins = 999999;
    this.saveData("mg", "999999");
    this.cheemsSkins.forEach(s => {
      this.unlockedCheems[s.storageKey] = true;
    });
    this.saveUnlockedCheems();
    this.soundEffects.forEach(s => {
      this.unlockedSounds[s.storageKey] = true;
    });
    this.saveUnlockedSounds();
    this.musicTracks.forEach(s => {
      this.unlockedMusic[s.storageKey] = true;
    });
    this.saveUnlockedMusic();
    
    this.saveData("points", String(this.points));
    this.saveData("total_score", String(this.totalScore));
    this.saveData("high_score", String(this.highScore));
    this.saveData("dg", String(this.dogeCoins));
    this.showToast(this.redeem[this.lang]?.success || "Success");
    this.playSound('sfx_4');
  }

  resetToZero(): void {
    this.actScore = 0;
    this.points = 0;
    this.totalScore = 0;
    this.highScore = 0;
    this.dogeCoins = 0;
    this.minigameCoins = 0;
    this.totalPointsEarned = 0;
    this.totalDogeCoinsEarned = 0;
    this.totalMinigameCoinsEarned = 0;
    this.unlockedMinigames = {};
    
    this.saveData("mg", "0");
    this.deleteData("unlocked_minigames");

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
    });
    this.saveUnlockedCheems();

    this.soundEffects.forEach(s => {
      const isDef = !s.default;
      this.unlockedSounds[s.storageKey] = !isDef;
    });
    this.saveUnlockedSounds();

    this.musicTracks.forEach(s => {
      const isDef = s.default || s.cost === 0;
      this.unlockedMusic[s.storageKey] = isDef;
    });
    this.saveUnlockedMusic();

    this.saveData("points", "0");
    this.saveData("total_score", "0");
    this.saveData("high_score", "0");
    this.saveData("dg", "0");
    this.saveData("lifetime_points", "0");
    this.saveData("lifetime_dg", "0");
    this.saveData("lifetime_mg", "0");

    this.deleteData("lifetime_purchases");
    this.deleteData("daily_purchases_limit");
    this.deleteData("upgrades");
    this.deleteData("idle_points");
    this.deleteData("redeemed_codes");
    
    this.purchasedUpgrades = {};
    this.redeemedCodes = [];
    this.recalculateIdleStats();

    this.boosterMultiplier = 1;
    this.boosterEndTime = 0;
    this.saveData("active_booster", "multiplier:1,end_time:0");

    this.saveData("selected_cheems", "cheems_normal");
    this.saveData("selected_sfx", "sfx_1");
    this.saveData("selected_music", "music_1");
    this.saveData("music_volume", "50");
    this.saveData("sfx_volume", "100");
    this.saveData("app_theme", "1");
    this.saveData("font_size", "2");

    this.showToast(this.redeem[this.lang]?.success || "Success");
    this.playSound();
    this.currentMusicFile = "";
    this.playMusic();
    this.redirect('game');
  }

  loadApp(): void {
    this.loadSettings();
    this.loadLanguageFile(this.lang);
    this.loadClosetPrices();
    this.loadMinigamesConfig();
    this.loadBoosterState();
    this.setupWindowFocusListeners();
    this.loadCheems();
    this.loadSounds();
    this.loadMusic();
    this.loadScore();
    this.loadUnlocks();
    this.loadShopItems().then(() => {
      this.initIdlePoints();
    });
    this.loadRedeemedCodes();
  }

  loadSettings(): void {
    const savedLang = this.loadData("language");
    this.lang = savedLang && this.availableLanguages.some(l => l.key === savedLang) ? savedLang : "es";

    const savedTheme = this.loadData("app_theme");
    const themeIdx = savedTheme !== null ? +savedTheme : 1;
    this.switchTheme(themeIdx);

    const savedSize = this.loadData("font_size");
    const sizeIdx = savedSize !== null ? +savedSize : 2;
    this.setAccessibility(sizeIdx);

    const savedMusVol = this.loadData("music_volume");
    this.musVol = savedMusVol !== null ? +savedMusVol : 50;

    const savedEffVol = this.loadData("sfx_volume");
    this.effVol = savedEffVol !== null ? +savedEffVol : 100;
  }

  loadCheems(): void {
    const savedCheems = this.loadData("selected_cheems");
    this.selectedCheems = savedCheems ? savedCheems.replace(/"/g, '') : "cheems_normal";
  }

  loadSounds(): void {
    const savedSound = this.loadData("selected_sfx");
    this.selectedSound = savedSound ? savedSound.replace(/"/g, '') : "sfx_1";
  }

  loadMusic(): void {
    const savedMusic = this.loadData("selected_music");
    this.selectedMusic = savedMusic ? savedMusic.replace(/"/g, '') : "music_1";
    this.playMusic(this.selectedMusic);
  }

  loadScore(): void {
    const totalScore = this.loadData("total_score");
    const highScore = this.loadData("high_score");
    const savedPoints = this.loadData("points");
    const dogeCoins = this.loadData("dg");

    this.highScore = highScore ? this.parseNumber(highScore) : 0;
    this.totalScore = totalScore ? this.parseNumber(totalScore) : 0;
    this.points = savedPoints ? this.parseNumber(savedPoints) : 0;
    this.dogeCoins = dogeCoins ? this.parseNumber(dogeCoins) : 0;

    const tPoints = this.loadData("lifetime_points");
    this.totalPointsEarned = tPoints ? this.parseNumber(tPoints) : this.totalScore;

    const tDGC = this.loadData("lifetime_dg");
    this.totalDogeCoinsEarned = tDGC ? this.parseNumber(tDGC) : this.dogeCoins;

    const tMG = this.loadData("lifetime_mg");
    this.totalMinigameCoinsEarned = tMG ? this.parseNumber(tMG) : this.minigameCoins;

    this.loadMinigameCoins();

    this.actScore = 0;
  }

  loadMinigameCoins(): void {
    const mgCoins = this.loadData("mg");
    this.minigameCoins = mgCoins ? this.parseNumber(mgCoins) : 0;
  }

  loadUnlocks(): void {
    const allMinigames = ['block_breaker', 'attack_hole', 'doge_rescue', 'flappy_dunk', 'helix_jump', 'magic_sort', 'mob_control', 'paper_io', 'spiral_roll', 'stack_colors', 'rock_paper_poke', 'tic_tac_toe', 'black_jack'];
    const unlockedMgs = this.parseArrayString(this.loadData("unlocked_minigames") || "");
    allMinigames.forEach(id => {
      this.unlockedMinigames[id] = unlockedMgs.includes(id);
    });

    const unlockedChms = this.parseArrayString(this.loadData("unlocked_cheems") || "");
    this.cheemsSkins.forEach(s => {
      this.unlockedCheems[s.storageKey] = s.default || unlockedChms.includes(s.id);
    });

    const unlockedSnds = this.parseArrayString(this.loadData("unlocked_sfx") || "");
    this.soundEffects.forEach(s => {
      this.unlockedSounds[s.storageKey] = s.default || unlockedSnds.includes(String(s.id));
    });

    const unlockedMsc = this.parseArrayString(this.loadData("unlocked_music") || "");
    this.musicTracks.forEach(s => {
      this.unlockedMusic[s.storageKey] = s.default || s.cost === 0 || unlockedMsc.includes(String(s.id));
    });
  }

  saveUnlockedMinigames(): void {
    const list = Object.keys(this.unlockedMinigames).filter(k => this.unlockedMinigames[k]);
    this.saveData("unlocked_minigames", this.stringifyArray(list));
  }

  saveUnlockedCheems(): void {
    const list = this.cheemsSkins.filter(s => this.unlockedCheems[s.storageKey] && !s.default).map(s => s.id);
    this.saveData("unlocked_cheems", this.stringifyArray(list));
  }

  saveUnlockedSounds(): void {
    const list = this.soundEffects.filter(s => this.unlockedSounds[s.storageKey] && !s.default).map(s => String(s.id));
    this.saveData("unlocked_sfx", this.stringifyArray(list));
  }

  saveUnlockedMusic(): void {
    const list = this.musicTracks.filter(s => this.unlockedMusic[s.storageKey] && !s.default && s.cost !== 0).map(s => String(s.id));
    this.saveData("unlocked_music", this.stringifyArray(list));
  }

  loadRedeemedCodes(): void {
    const stored = this.loadData("redeemed_codes");
    if (stored) {
      try {
        this.redeemedCodes = JSON.parse(stored);
      } catch (e) {
        this.redeemedCodes = [];
      }
    } else {
      this.redeemedCodes = [];
    }
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

  loadBoosterState(): void {
    const multStr = this.loadData("active_booster");
    if (multStr) {
       const b = this.parseObjectString(multStr);
       this.boosterMultiplier = b['multiplier'] ? parseInt(b['multiplier']) : 1;
       this.boosterEndTime = b['end_time'] ? parseInt(b['end_time']) : 0;
    } else {
       this.boosterMultiplier = 1;
       this.boosterEndTime = 0;
    }
  }

  async loadShopItems(): Promise<void> {
    try {
      const res = await this.safeFetch("data/shop.json");
      if (res.ok) {
        const rawItems = await res.json();

        this.shopItems = rawItems.map((item: any) => ({
          ...item,
          cost: this.evaluatePriceExpression(item.cost),
          costCoins: this.evaluatePriceExpression(item.costCoins),
          coinsGiven: item.coinsGiven !== undefined ? this.evaluatePriceExpression(item.coinsGiven) : undefined,
          dailyLimit: item.dailyLimit !== undefined ? this.evaluatePriceExpression(item.dailyLimit) : undefined
        }));
      }
    } catch (err) {
      console.warn("Could not load data/shop.json", err);
    }
    this.appendUnlockableShopItems();
    this.recalculateIdleStats();
  }

  private evaluatePriceExpression(expression: string | number | undefined): number {
    if (expression === undefined || expression === null) return 0;
    if (typeof expression === 'number') return Math.max(0, Math.round(expression));
    if (typeof expression !== 'string') return 0;

    try {
      let parsedStr = expression;

      parsedStr = parsedStr.replace(/\$\{daily_price_1\}/g, String(this.getDailyDogeCoinPrice(1)));
      parsedStr = parsedStr.replace(/\$\{daily_price_2\}/g, String(this.getDailyDogeCoinPrice(2)));
      parsedStr = parsedStr.replace(/\$\{daily_price_3\}/g, String(this.getDailyDogeCoinPrice(3)));
      parsedStr = parsedStr.replace(/\$\{daily_price_4\}/g, String(this.getDailyDogeCoinPrice(4)));

      parsedStr = parsedStr.replace(/\$\{daily_price\}/g, String(this.getDailyDogeCoinPrice(1)));

      if (/[^0-9\+\-\*\/\%\.\s\(\)]/.test(parsedStr)) {
        console.warn("Invalid characters in price expression:", parsedStr);
        return 0;
      }

      const result = new Function(`return (${parsedStr})`)();

      const num = Number(result);
      if (isNaN(num)) return 0;
      return Math.max(0, Math.round(num));
    } catch (e) {
      console.warn("Could not evaluate price expression:", expression, e);
      return 0;
    }
  }

  getActiveMultiplier(): number {
    let base = this.clickPoints;
    const now = Date.now();
    if (now < this.boosterEndTime) {
      return base * this.boosterMultiplier;
    } else if (this.boosterEndTime !== 0) {
      this.boosterEndTime = 0;
      this.boosterMultiplier = 1;
      this.saveData("active_booster", "multiplier:1,end_time:0");
    }
    return base;
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
    this.saveData("active_booster", `multiplier:${this.boosterMultiplier},end_time:${this.boosterEndTime}`);
    this.showToast(this.shop[this.lang]?.boosterActivated || "Booster activated!");
    this.playSound();
  }

  getDailyPurchaseCount(itemId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const storedStr = this.loadData("daily_purchases_limit");
    if (!storedStr) return 0;
    const purchasesArr = this.parseArrayOfObjectsString(storedStr);
    const itemData = purchasesArr.find(p => p['id'] === itemId);
    if (itemData && itemData['date'] === today) {
      return parseInt(itemData['count']) || 0;
    }
    return 0;
  }

  recordDailyPurchase(itemId: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const storedStr = this.loadData("daily_purchases_limit");
    const purchasesArr = this.parseArrayOfObjectsString(storedStr || "");
    const itemData = purchasesArr.find(p => p['id'] === itemId);
    if (itemData) {
      if (itemData['date'] === today) {
        itemData['count'] = String((parseInt(itemData['count']) || 0) + 1);
      } else {
        itemData['date'] = today;
        itemData['count'] = "1";
      }
    } else {
      purchasesArr.push({ id: itemId, count: "1", date: today });
    }
    this.saveData("daily_purchases_limit", this.stringifyArrayOfObjects(purchasesArr));
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
    const stored = this.loadData("lifetime_purchases");
    const arr = this.parseArrayString(stored || "");
    return arr.includes(itemId) ? 1 : 0;
  }

  recordLifetimePurchase(itemId: string): void {
    const stored = this.loadData("lifetime_purchases");
    const arr = this.parseArrayString(stored || "");
    if (!arr.includes(itemId)) {
      arr.push(itemId);
      this.saveData("lifetime_purchases", this.stringifyArray(arr));
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
      this.saveData("points", String(this.points));
      this.saveData("dg", String(this.dogeCoins));

      if (item.type === 'cheems') {
        const targetId = String(item.targetId !== undefined ? item.targetId : item.id);
        const skin = this.cheemsSkins.find(s => s.id === targetId);
        if (skin) {
          this.unlockedCheems[skin.storageKey] = true;
          this.saveUnlockedCheems();
        }
      } else if (item.type === 'sound') {
        const targetId = String(item.targetId !== undefined ? item.targetId : item.id);
        const sound = this.soundEffects.find(s => String(s.id) === targetId);
        if (sound) {
          this.unlockedSounds[sound.storageKey] = true;
          this.saveUnlockedSounds();
        }
      } else if (item.type === 'music') {
        const targetId = String(item.targetId !== undefined ? item.targetId : item.id);
        const track = this.musicTracks.find(m => String(m.id) === targetId);
        if (track) {
          this.unlockedMusic[track.storageKey] = true;
          this.saveUnlockedMusic();
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
    this.saveData("last_active_time", String(Date.now()));
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
    this.calculateIdleCatchup();
    this.resumeBackground();
  }

  public pauseBackground(): void {
    this.isBackgroundMusicPaused = true;
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend().catch(() => {});
    }
    if (!this.musicAudio.paused) {
      this.musicAudio.pause();
    }
  }

  public resumeBackground(): void {
    this.isBackgroundMusicPaused = false;
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
    const fallbackId = id.replace('cheems_', '');
    return "img/cheems/" + (skin?.img || fallbackId + ".webp");
  }

  getCheemsHitImg(id: string): string {
    const skin = this.cheemsSkins.find(s => s.id === id);
    if (skin?.hitImgUrl) return skin.hitImgUrl;
    const fallbackId = id.replace('cheems_', '');
    return "img/hit/" + (skin?.hitImg || skin?.img || fallbackId + ".webp");
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

  getCheemsDescription(skin: CheemsSkinItem): string {
    if (skin.description && this.itemsText[this.lang]?.[skin.description]) {
      return this.itemsText[this.lang][skin.description];
    }
    return '';
  }

  getSoundName(sound: SoundEffectItem): string {
    if (sound.nameKey && this.itemsText[this.lang]?.[sound.nameKey]) {
      return this.itemsText[this.lang][sound.nameKey];
    }
    return sound.name || sound.id;
  }

  getSoundDescription(sound: SoundEffectItem): string {
    if (sound.description && this.itemsText[this.lang]?.[sound.description]) {
      return this.itemsText[this.lang][sound.description];
    }
    return '';
  }

  getMusicName(track: MusicTrackItem): string {
    if (track.nameKey && this.itemsText[this.lang]?.[track.nameKey]) {
      return this.itemsText[this.lang][track.nameKey];
    }
    return track.name || String(track.id);
  }

  getMusicDescription(track: MusicTrackItem): string {
    if (track.description && this.itemsText[this.lang]?.[track.description]) {
      return this.itemsText[this.lang][track.description];
    }
    return '';
  }


  async exportSave(): Promise<void> {
    const saveData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        saveData[key] = localStorage.getItem(key) || '';
      }
    }
    const jsonStr = JSON.stringify(saveData);
    const obfuscated = btoa(encodeURIComponent(jsonStr));
    
    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = 'cheems_save.dat';
        const result = await Filesystem.writeFile({
          path: fileName,
          data: obfuscated,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: this.options[this.lang]?.exportSaveTitle || 'Export Cheems Save',
          text: this.options[this.lang]?.exportSaveText || 'Here is your Cheems Bonk Game save file.',
          url: result.uri,
          dialogTitle: this.options[this.lang]?.exportSaveDialogTitle || 'Save or share your progress',
        });
      } catch (err) {
        console.error('Error exporting save via Capacitor', err);
        this.showToast(this.options[this.lang]?.exportSave + " Error");
      }
    } else {
      const blob = new Blob([obfuscated], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cheems_save.dat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  importSave(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const jsonStr = decodeURIComponent(atob(result));
        const saveData = JSON.parse(jsonStr);
        
        if (this.idleTimer) clearInterval(this.idleTimer);
        this.isImportingSave = true;

        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.PREFIX)) {
            localStorage.removeItem(key);
          }
        }
        
        for (const key of Object.keys(saveData)) {
          if (key.startsWith(this.PREFIX)) {
            localStorage.setItem(key, saveData[key]);
          }
        }
        
        this.showToast(this.redeem[this.lang]?.success || "Success");
        setTimeout(() => {
          location.reload();
        }, 100);
      } catch (err) {
        console.error("Save import failed", err);
        this.showToast("Import failed! Invalid save file.");
      }
    };
    reader.readAsText(file);
  }

  initIdlePoints(): void {
    const idleConfigStr = this.loadData("idle_points");
    if (idleConfigStr) {
      const cfg = this.parseObjectString(idleConfigStr);
      if (cfg['points']) this.idlePoints = parseFloat(cfg['points']);
      this.idleTime = 1;
    } else {
      this.saveData("idle_points", this.stringifyObject({ points: 0, time: 1 }));
    }

    const upgradesStr = this.loadData("upgrades");
    if (upgradesStr) {
      this.purchasedUpgrades = this.parseObjectString(upgradesStr) as any;
      for (const key of Object.keys(this.purchasedUpgrades)) {
        this.purchasedUpgrades[key] = parseInt(this.purchasedUpgrades[key] as any, 10) || 0;
      }
    } else {
      this.purchasedUpgrades = {};
    }
    this.recalculateIdleStats();

    this.calculateIdleCatchup();
    this.startIdleTimer();
  }

  recalculateIdleStats(): void {
    let basePoints = 0;
    let baseTime = 1;
    let clickPoints = 1;

    const idleConfigStr = this.loadData("idle_points");
    if (idleConfigStr) {
      const cfg = this.parseObjectString(idleConfigStr);
      if (cfg['points']) basePoints = parseFloat(cfg['points']);
      if (cfg['time']) baseTime = parseInt(cfg['time'], 10);
    }

    // Apply upgrades from loaded shop items
    if (this.shopItems && this.shopItems.length > 0) {
      for (const upgradeId of Object.keys(this.purchasedUpgrades)) {
        const times = this.purchasedUpgrades[upgradeId];
        if (times > 0) {
          const item = this.shopItems.find(i => i.id === upgradeId);
          if (item && item.type === 'upgrade' && item.upgradeValue) {
            if (item.upgradeType === 'quantity') {
              basePoints += item.upgradeValue * times;
            } else if (item.upgradeType === 'click') {
              clickPoints += item.upgradeValue * times;
            }
          }
        }
      }
    }

    this.idlePoints = basePoints;
    this.clickPoints = clickPoints;
    this.saveData("touch_points", String(this.clickPoints));
    this.idleTime = 1;
    
    // Restart the timer so the new interval takes effect
    this.startIdleTimer();
  }

  startIdleTimer(): void {
    if (this.idleTimer) clearInterval(this.idleTimer);
    this.idleTimer = setInterval(() => {
      if (!this.isWindowBlurred) {
        this.updateScore(Math.floor(this.idlePoints));
        this.saveData("last_active_time", String(Date.now()));
      }
    }, this.idleTime * 1000);
  }

  calculateIdleCatchup(): void {
    const lastActiveStr = this.loadData("last_active_time");
    const now = Date.now();

    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      const diffMs = now - lastActive;
      const offlineIntervalMs = this.idleTime * 1000;

      if (diffMs >= offlineIntervalMs) {
        const missedOfflineIntervals = Math.floor(diffMs / offlineIntervalMs);
        const offlinePoints = Math.floor(missedOfflineIntervals * (this.idlePoints / 4));

        if (offlinePoints > 0) {
          this.updateScore(offlinePoints);
          let msg = this.game[this.lang]?.idleBonusToast?.replace('{0}', String(offlinePoints)) || `Idle Bonus: +${offlinePoints} pts while you were away!`;
          this.showToast(msg);
        }
      }
    }
    this.saveData("last_active_time", String(now));
  }
}
