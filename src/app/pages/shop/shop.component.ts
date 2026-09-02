import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';
import { ShopItem } from '../../services/constants.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent implements OnInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  dailyPrice: number = 100;
  showScrollTop: boolean = false;
  private timerInterval: any = null;
  
  boosterRemainingSeconds: number = 0;
  activeMultiplier: number = 1;
  boosterFormattedTime: string = '00:00';

  updateBoosterStats(): void {
    this.boosterRemainingSeconds = this.tools.getBoosterRemainingSeconds();
    if (this.boosterRemainingSeconds > 0) {
      this.activeMultiplier = this.tools.getActiveMultiplier();
      this.boosterFormattedTime = this.tools.getBoosterFormattedTime();
    }
  }

  ngOnInit(): void {
    this.tools.setTitle("shop");
    this.tools.actPage = "shop";
    this.dailyPrice = this.tools.getDailyDogeCoinPrice();
    if (this.tools.shopItems.length === 0) {
      this.tools.loadShopItems();
    }
    this.updateBoosterStats();
    this.timerInterval = setInterval(() => {
      this.updateBoosterStats();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showScrollTop = window.scrollY > 300;
  }

  buyItem(item: ShopItem): void {
    if (this.isUpgradeMaxLevel(item)) {
      return;
    }

    if (!this.tools.canBuyDailyLimit(item)) {
      this.tools.showToast(this.tools.shop[this.tools.lang]?.dailyLimitReached || "Daily limit reached!");
      return;
    }

    if (this.tools.isLifetimeLimitReached(item)) {
      return;
    }

    const costObj = this.getDynamicCost(item);

    if (item.type === 'dogecoin') {
      const coinsGiven = item.coinsGiven || 1;
      this.tools.buyDogeCoin(costObj.pts, coinsGiven, item.id);
    } else if (item.type === 'upgrade') {
      this.tools.buyUpgrade(item, costObj.pts, costObj.coins);
    } else if (item.type === 'currency') {
      if (this.tools.points >= costObj.pts && this.tools.dogeCoins >= costObj.coins && this.tools.minigameCoins >= costObj.mg) {
        this.tools.points -= costObj.pts;
        this.tools.dogeCoins -= costObj.coins;
        this.tools.minigameCoins -= costObj.mg;
        if (item.coinsGiven) {
          this.tools.dogeCoins += item.coinsGiven;
        }
        if (item.minigameCoinsGiven) {
          this.tools.addMinigameCoins(item.minigameCoinsGiven);
        }
        this.tools.saveData("points", String(this.tools.points));
        this.tools.saveData("dg", String(this.tools.dogeCoins));
        this.tools.saveData("mg", String(this.tools.minigameCoins));
        this.tools.recordDailyPurchase(item.id);
        this.tools.showToast(this.tools.closet[this.tools.lang]?.purchased || "Purchased!");
        this.tools.playSound('sfx_4');
      } else {
        this.tools.showToast(this.tools.shop[this.tools.lang]?.notEnoughCoins || "Not enough currency!");
      }
    } else if (item.type === 'minigame') {
      if (this.tools.points >= costObj.pts && this.tools.dogeCoins >= costObj.coins && this.tools.minigameCoins >= costObj.mg) {
        this.tools.points -= costObj.pts;
        this.tools.dogeCoins -= costObj.coins;
        this.tools.minigameCoins -= costObj.mg;
        this.tools.saveData("points", String(this.tools.points));
        this.tools.saveData("dg", String(this.tools.dogeCoins));
        this.tools.saveData("mg", String(this.tools.minigameCoins));
        const target = String(item.targetId || item.id);
        this.tools.unlockedMinigames[target] = true;
        this.tools.saveUnlockedMinigames();
        this.tools.recordLifetimePurchase(item.id);
        this.tools.showToast(this.tools.closet[this.tools.lang]?.purchased || "Purchased!");
        this.tools.playSound('sfx_4');
      } else {
        this.tools.showToast(this.tools.shop[this.tools.lang]?.notEnoughCoins || "Not enough currency!");
      }
    } else if (item.type === 'booster') {
      if (this.tools.points >= costObj.pts && this.tools.dogeCoins >= costObj.coins) {
        const isOverride = this.tools.boosterEndTime !== 0 && this.tools.getBoosterRemainingSeconds() > 0 && this.tools.boosterMultiplier !== item.multiplier;
        if (isOverride) {
          const warningTemplate = this.tools.shop[this.tools.lang]?.boosterOverrideWarning || "Warning! You already have an active x{current} booster. Buying a x{new} booster will override your remaining time. Do you want to continue?";
          const warningMsg = warningTemplate
            .replace('{current}', String(this.tools.boosterMultiplier))
            .replace('{new}', String(item.multiplier || 1));
          if (!confirm(warningMsg)) {
            return;
          }
        }
        this.tools.points -= costObj.pts;
        this.tools.dogeCoins -= costObj.coins;
        this.tools.saveData("points", String(this.tools.points));
        this.tools.saveData("dg", String(this.tools.dogeCoins));
        this.tools.recordDailyPurchase(item.id);
        this.tools.activateBooster(item.multiplier || 1, item.durationMin || 0);
      } else {
        if (this.tools.points < costObj.pts) {
          this.tools.showToast(this.tools.shop[this.tools.lang]?.needMorePoints || "Not enough points!");
        } else {
          this.tools.showToast(this.tools.shop[this.tools.lang]?.notEnoughCoins || "Not enough DogeCoins!");
        }
      }
    } else if (item.type === 'cheems' || item.type === 'sound' || item.type === 'music') {
      this.tools.buyShopUnlockableItem(item);
    }
  }

  getDynamicCost(item: ShopItem): { pts: number, coins: number, mg: number } {
    const times = this.tools.purchasedUpgrades[item.id] || 0;
    const mult = 1 + (item.priceMultiplier || 1) * times;
    
    let ptsCost = item.cost !== undefined ? item.cost : (item.type === 'dogecoin' ? this.dailyPrice : 0);
    let coinsCost = item.costCoins || 0;
    let mgCost = item.costMinigames || 0;

    if (item.type === 'upgrade') {
      ptsCost = Math.ceil(ptsCost * mult);
      coinsCost = Math.ceil(coinsCost * mult);
      mgCost = Math.ceil(mgCost * mult);
    }

    return { pts: ptsCost, coins: coinsCost, mg: mgCost };
  }

  isUpgradeMaxLevel(item: ShopItem): boolean {
    if (item.type === 'upgrade' && item.upgradeType === 'frequency') {
      return this.tools.idleTime <= 1;
    }
    return false;
  }

  canBuy(item: ShopItem): boolean {
    if (this.tools.isLifetimeLimitReached(item)) {
      return false;
    }
    if (!this.tools.canBuyDailyLimit(item)) {
      return false;
    }
    if (this.isUpgradeMaxLevel(item)) {
      return false;
    }
    const costObj = this.getDynamicCost(item);
    return this.tools.points >= costObj.pts && this.tools.dogeCoins >= costObj.coins && this.tools.minigameCoins >= costObj.mg;
  }

  formatItemCost(item: ShopItem): string {
    const costObj = this.getDynamicCost(item);

    if (costObj.pts === 0 && costObj.coins === 0 && costObj.mg === 0) {
      return this.tools.shop[this.tools.lang]?.free || "Free";
    }

    const parts: string[] = [];
    if (costObj.pts > 0) {
      parts.push(`${this.tools.formatBigNumber(costObj.pts)} Pts`);
    }
    if (costObj.coins > 0) {
      parts.push(`${this.tools.formatBigNumber(costObj.coins)} DGC`);
    }
    if (costObj.mg > 0) {
      parts.push(`${this.tools.formatBigNumber(costObj.mg)} MG`);
    }
    return parts.join(' + ');
  }

  get dogecoinItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'dogecoin' || i.type === 'currency');
  }

  get upgradeItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'upgrade');
  }

  get minigameItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'minigame');
  }

  get boosterItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'booster');
  }

  get cheemsItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'cheems');
  }

  get soundItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'sound');
  }

  get musicItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'music');
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const el = document.getElementById('shop-top');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getShopCardIcon(item: ShopItem): string {
    if (this.tools.isLifetimeLimitReached(item)) {
      return item.icon;
    }
    if (item.type === 'cheems') {
      return 'img/cheems/locked-cheems.webp';
    }
    if (item.type === 'sound') {
      return 'img/icons/black-sound-svgrepo-com.svg';
    }
    if (item.type === 'music') {
      return 'img/icons/black-music-svgrepo-com.svg';
    }
    return item.icon;
  }
}
