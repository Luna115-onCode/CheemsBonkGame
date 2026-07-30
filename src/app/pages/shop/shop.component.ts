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

  ngOnInit(): void {
    this.tools.setTitle("shop");
    this.tools.actPage = "shop";
    this.dailyPrice = this.tools.getDailyDogeCoinPrice();
    if (this.tools.shopItems.length === 0) {
      this.tools.loadShopItems();
    }
    this.timerInterval = setInterval(() => {
      // Refresh component for live timer updates
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
    if (!this.tools.canBuyDailyLimit(item)) {
      this.tools.showToast(this.tools.shop[this.tools.lang]?.dailyLimitReached || "Daily limit reached!");
      return;
    }

    if (this.tools.isLifetimeLimitReached(item)) {
      return;
    }

    if (item.type === 'dogecoin') {
      this.tools.buyDogeCoin();
    } else if (item.type === 'booster') {
      const ptsCost = item.cost || 0;
      const coinCost = item.costCoins || 0;
      if (this.tools.points >= ptsCost && this.tools.dogeCoins >= coinCost) {
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
        this.tools.points -= ptsCost;
        this.tools.dogeCoins -= coinCost;
        localStorage.setItem("CheemsAppLiPoints", JSON.stringify(this.tools.points));
        localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.tools.dogeCoins));
        this.tools.recordDailyPurchase(item.id);
        this.tools.activateBooster(item.multiplier || 1, item.durationMin || 0);
      } else {
        if (this.tools.points < ptsCost) {
          this.tools.showToast(this.tools.shop[this.tools.lang]?.needMorePoints || "Not enough points!");
        } else {
          this.tools.showToast(this.tools.shop[this.tools.lang]?.notEnoughCoins || "Not enough DogeCoins!");
        }
      }
    } else if (item.type === 'cheems' || item.type === 'sound' || item.type === 'music') {
      this.tools.buyShopUnlockableItem(item);
    }
  }

  canBuy(item: ShopItem): boolean {
    if (this.tools.isLifetimeLimitReached(item)) {
      return false;
    }
    if (!this.tools.canBuyDailyLimit(item)) {
      return false;
    }
    const ptsCost = item.type === 'dogecoin' ? this.dailyPrice : (item.cost || 0);
    const coinsCost = item.type === 'dogecoin' ? 0 : (item.costCoins || 0);
    return this.tools.points >= ptsCost && this.tools.dogeCoins >= coinsCost;
  }

  formatItemCost(item: ShopItem): string {
    const ptsCost = item.type === 'dogecoin' ? this.dailyPrice : (item.cost || 0);
    const coinsCost = item.type === 'dogecoin' ? 0 : (item.costCoins || 0);

    if (ptsCost === 0 && coinsCost === 0) {
      return this.tools.shop[this.tools.lang]?.free || "Free";
    }

    const parts: string[] = [];
    if (ptsCost > 0) {
      parts.push(`${ptsCost.toLocaleString()} Pts`);
    }
    if (coinsCost > 0) {
      parts.push(`${coinsCost.toLocaleString()} DGC`);
    }
    return parts.join(' + ');
  }

  get dogecoinItems(): ShopItem[] {
    return this.tools.shopItems.filter(i => i.type === 'dogecoin');
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
      return 'img/cheems/locked-cheems.png';
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
