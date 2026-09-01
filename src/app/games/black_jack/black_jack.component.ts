import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToolsService } from '../../services/tools.service';

interface Card {
  id: string;
  type: string;
  color: string;
  rank: string;
  rank_label: string;
  symbol: string;
  value: number;
  name: string;
  front_texture: string;
  back_texture: string;
}

interface Chip {
  id: string;
  color: string;
  value: number;
  name: string;
  texture: string;
}

@Component({
  selector: 'app-black-jack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './black_jack.component.html',
  styleUrl: './black_jack.component.css'
})
export class BlackJackComponent implements OnInit, OnDestroy {
  tools = inject(ToolsService);
  router = inject(Router);

  allCards: Card[] = [];
  deck: Card[] = [];
  chips: Chip[] = [];

  playerHand: Card[] = [];
  dealerHand: Card[] = [];

  gameState: 'loading' | 'betting' | 'playing' | 'dealer_turn' | 'game_over' | 'bankrupt' = 'loading';
  resultMessage: string = '';

  playerInventory: Record<string, number> = {};
  betInventory: Record<string, number> = {};
  initialChipsValue: number = 0;
  
  get currentBet(): number {
    return this.getInventoryValue(this.betInventory);
  }

  get playerChips(): number {
    return this.getInventoryValue(this.playerInventory);
  }

  get lang() {
    return this.tools.black_jack[this.tools.lang] || {};
  }

  async ngOnInit() {
    this.tools.actPage = "black_jack" as any;
    this.tools.setTitle("Black Jack");
    this.tools.playMusic("music_1");
    
    await this.loadAssets();
    this.restartGame();
  }

  async loadAssets() {
    try {
      const [cardsRes, chipsRes] = await Promise.all([
        fetch('games/pokar-cards/data/cards.json'),
        fetch('games/pokar-cards/data/chips.json')
      ]);
      const cards: Card[] = await cardsRes.json();
      this.chips = await chipsRes.json();
      // Sort chips descending by value for greedy algorithms
      this.chips.sort((a, b) => b.value - a.value);
      
      this.allCards = cards.filter(c => c.type !== 'joker');
    } catch (e) {
      console.error('Failed to load blackjack assets', e);
    }
  }

  restartGame() {
    this.playerInventory = {
      'chips_gray': 10,
      'chips_white': 4,
      'chips_red': 3,
      'chips_green': 2,
      'chips_blue': 2,
      'chips_black': 1,
      'chips_yellow': 1,
      'chips_pink': 0
    };
    this.betInventory = {};
    for (const c of this.chips) {
      if (!this.playerInventory[c.id]) this.playerInventory[c.id] = 0;
      this.betInventory[c.id] = 0;
    }
    this.initialChipsValue = this.getInventoryValue(this.playerInventory);
    this.gameState = 'betting';
  }

  getInventoryValue(inv: Record<string, number>): number {
    let total = 0;
    for (const chip of this.chips) {
      total += (inv[chip.id] || 0) * chip.value;
    }
    return total;
  }

  addBet(chipId: string) {
    if (this.playerInventory[chipId] > 0) {
      this.playerInventory[chipId]--;
      this.betInventory[chipId] = (this.betInventory[chipId] || 0) + 1;
      this.tools.playSound('sfx_1');
    }
  }

  clearBet() {
    let cleared = false;
    for (const chip of this.chips) {
      if (this.betInventory[chip.id] > 0) {
        this.playerInventory[chip.id] += this.betInventory[chip.id];
        this.betInventory[chip.id] = 0;
        cleared = true;
      }
    }
    if (cleared) this.tools.playSound('sfx_1');
  }

  exchange(chipId: string) {
    if (this.playerInventory[chipId] <= 0) return;
    const chip = this.chips.find(c => c.id === chipId);
    if (!chip) return;
    
    this.playerInventory[chipId]--;
    let remaining = chip.value;
    for (const c of this.chips) {
      if (c.value >= chip.value) continue;
      const count = Math.floor(remaining / c.value);
      if (count > 0) {
        this.playerInventory[c.id] = (this.playerInventory[c.id] || 0) + count;
        remaining %= c.value;
      }
    }
    this.tools.playSound('sfx_1');
  }

  getExchangeUpRule(chipId: string): { to: string, qtyNeeded: number, qtyGiven: number } | null {
    const chip = this.chips.find(c => c.id === chipId);
    if (!chip) return null;
    
    const largerChips = this.chips.filter(c => c.value > chip.value).sort((a, b) => a.value - b.value);
    if (largerChips.length === 0) return null;

    const nextChip = largerChips[0];
    
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(nextChip.value, chip.value);
    const lcm = (nextChip.value * chip.value) / g;
    
    const qtyNeeded = lcm / chip.value;
    const qtyGiven = lcm / nextChip.value;
    
    return { to: nextChip.id, qtyNeeded, qtyGiven };
  }

  hasExchangeUpRule(chipId: string): boolean {
    return this.getExchangeUpRule(chipId) !== null;
  }

  canExchangeDown(chipId: string): boolean {
    const chip = this.chips.find(c => c.id === chipId);
    if (!chip) return false;
    return this.chips.some(c => c.value < chip.value);
  }

  canExchangeUp(chipId: string): boolean {
    const rule = this.getExchangeUpRule(chipId);
    return !!rule && this.playerInventory[chipId] >= rule.qtyNeeded;
  }

  exchangeUp(chipId: string) {
    const rule = this.getExchangeUpRule(chipId);
    if (rule && this.playerInventory[chipId] >= rule.qtyNeeded) {
      this.playerInventory[chipId] -= rule.qtyNeeded;
      this.playerInventory[rule.to] = (this.playerInventory[rule.to] || 0) + rule.qtyGiven;
      this.tools.playSound('sfx_1');
    }
  }

  allIn() {
    let played = false;
    for (const chip of this.chips) {
      if (this.playerInventory[chip.id] > 0) {
        this.betInventory[chip.id] = (this.betInventory[chip.id] || 0) + this.playerInventory[chip.id];
        this.playerInventory[chip.id] = 0;
        played = true;
      }
    }
    if (played) this.tools.playSound('sfx_1');
  }

  deal() {
    if (this.currentBet === 0) {
      this.tools.showToast("Place a bet first!");
      this.tools.playSound('sfx_2');
      return;
    }
    
    this.tools.playSound('sfx_1');
    
    // Shuffle Deck
    this.deck = [...this.allCards];
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }

    this.playerHand = [this.deck.pop()!, this.deck.pop()!];
    this.dealerHand = [this.deck.pop()!, this.deck.pop()!];
    
    this.gameState = 'playing';
    
    const pVal = this.getHandValue(this.playerHand);
    if (pVal === 21) {
      this.endGame('blackjack');
    }
  }

  hit() {
    if (this.gameState !== 'playing') return;
    
    this.tools.playSound('sfx_3');
    this.playerHand.push(this.deck.pop()!);
    
    if (this.getHandValue(this.playerHand) > 21) {
      this.endGame('bust');
    }
  }

  stand() {
    if (this.gameState !== 'playing') return;
    this.tools.playSound('sfx_1');
    this.playDealer();
  }

  canDouble(): boolean {
    return this.canPayAmount(this.currentBet);
  }

  double() {
    if (this.gameState !== 'playing' || this.playerHand.length !== 2) return;
    
    const betAmt = this.currentBet;
    if (this.payAmount(betAmt)) {
      // Double the bet inventory by mirroring it (easiest way to represent a doubled bet)
      for (const chip of this.chips) {
        this.betInventory[chip.id] += this.betInventory[chip.id]; // effectively x2 visually? No, wait.
        // Wait, if they paid via `payAmount`, they might have used different chips to cover the bet.
        // Let's just dispense the exact chips they paid with into the bet area!
      }
      // Actually, let's just do a greedy payout to the betInventory for the doubled amount
      // The `payAmount` already deducted from playerInventory.
      this.greedyAdd(this.betInventory, betAmt);
      
      this.tools.playSound('sfx_1');
      
      this.hit();
      if (this.gameState === 'playing') {
        this.playDealer();
      }
    } else {
      this.tools.showToast("Not enough correct chips to double! Try exchanging.");
      this.tools.playSound('sfx_2');
    }
  }

  // Checks if the player can pay a specific amount using their chips
  canPayAmount(amount: number): boolean {
    if (this.playerChips < amount) return false;
    
    // Simulate payment
    let remaining = amount;
    const tempInv = { ...this.playerInventory };
    
    // Greedy approach
    for (const chip of this.chips) {
      while (remaining >= chip.value && tempInv[chip.id] > 0) {
        remaining -= chip.value;
        tempInv[chip.id]--;
      }
    }
    
    if (remaining === 0) return true;
    
    // If greedy fails, check if a single larger chip can cover it with change
    for (let i = this.chips.length - 1; i >= 0; i--) {
      const chip = this.chips[i];
      if (tempInv[chip.id] > 0 && chip.value >= remaining) {
        return true; // We can give them change
      }
    }
    
    return false;
  }

  // Deducts the amount from playerInventory and returns true, or false if unable
  payAmount(amount: number): boolean {
    if (!this.canPayAmount(amount)) return false;
    
    let remaining = amount;
    
    // 1. Try greedy exact match
    for (const chip of this.chips) {
      while (remaining >= chip.value && this.playerInventory[chip.id] > 0) {
        remaining -= chip.value;
        this.playerInventory[chip.id]--;
      }
    }
    
    if (remaining === 0) return true;
    
    // 2. We need to break a larger chip. Find the smallest chip that is larger than remaining
    let usedLarger = false;
    for (let i = this.chips.length - 1; i >= 0; i--) {
      const chip = this.chips[i];
      if (this.playerInventory[chip.id] > 0 && chip.value > remaining) {
        this.playerInventory[chip.id]--;
        // Give change back to player
        const change = chip.value - remaining;
        this.greedyAdd(this.playerInventory, change);
        usedLarger = true;
        break;
      }
    }
    
    return usedLarger;
  }

  // Adds an amount to an inventory greedily
  greedyAdd(inv: Record<string, number>, amount: number) {
    let remaining = amount;
    for (const chip of this.chips) {
      const count = Math.floor(remaining / chip.value);
      if (count > 0) {
        inv[chip.id] = (inv[chip.id] || 0) + count;
        remaining %= chip.value;
      }
    }
  }

  async playDealer() {
    this.gameState = 'dealer_turn';
    
    while (this.getHandValue(this.dealerHand) < 17) {
      await new Promise(r => setTimeout(r, 600)); // slight delay for suspense
      this.dealerHand.push(this.deck.pop()!);
      this.tools.playSound('sfx_3');
    }
    
    const pVal = this.getHandValue(this.playerHand);
    const dVal = this.getHandValue(this.dealerHand);
    
    if (dVal > 21) {
      this.endGame('dealer_bust');
    } else if (dVal > pVal) {
      this.endGame('dealer_win');
    } else if (dVal < pVal) {
      this.endGame('player_win');
    } else {
      this.endGame('push');
    }
  }

  getHandValue(hand: Card[]): number {
    let value = 0;
    let aces = 0;
    for (const c of hand) {
      if (c.rank === 'ace') {
        aces += 1;
        value += 11;
      } else if (c.value >= 10) {
        value += 10;
      } else {
        value += c.value;
      }
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }
    return value;
  }

  endGame(reason: string) {
    this.gameState = 'game_over';
    
    const originalBet = this.currentBet;
    let totalWin = 0;
    
    if (reason === 'blackjack') {
      this.resultMessage = this.lang.blackjack || "Blackjack!";
      totalWin = Math.floor(originalBet * 2.5);
      this.tools.playSound('sfx_4'); // win
    } else if (reason === 'player_win' || reason === 'dealer_bust') {
      this.resultMessage = reason === 'dealer_bust' ? (this.lang.dealer_bust || "Dealer Busts!") : (this.lang.player_win || "Player Wins!");
      totalWin = originalBet * 2;
      this.tools.playSound('sfx_4'); // win
    } else if (reason === 'push') {
      this.resultMessage = this.lang.push || "Push";
      totalWin = originalBet;
      this.tools.playSound('sfx_1'); // neutral
    } else {
      this.resultMessage = reason === 'bust' ? (this.lang.bust || "Bust!") : (this.lang.dealer_win || "Dealer Wins!");
      totalWin = 0;
      this.tools.playSound('sfx_2'); // lose
    }
    
    if (totalWin >= originalBet && originalBet > 0) {
      // 1. Return the original bet chips exactly
      for (const chip of this.chips) {
        if (this.betInventory[chip.id] > 0) {
          this.playerInventory[chip.id] += this.betInventory[chip.id];
        }
      }
      
      let remainingWin = totalWin - originalBet;
      
      // 2. Replicate the bet structure as many times as possible
      while (remainingWin >= originalBet) {
        for (const chip of this.chips) {
          if (this.betInventory[chip.id] > 0) {
            this.playerInventory[chip.id] += this.betInventory[chip.id];
          }
        }
        remainingWin -= originalBet;
      }
      
      // 3. Give remaining odd amount greedily
      if (remainingWin > 0) {
        this.greedyAdd(this.playerInventory, remainingWin);
      }
    } else if (totalWin > 0) {
      this.greedyAdd(this.playerInventory, totalWin);
    }
    
    // Clear the bet area
    for (const chip of this.chips) {
      this.betInventory[chip.id] = 0;
    }
    
    setTimeout(() => {
      if (this.playerChips <= 0) {
        this.gameState = 'bankrupt';
      } else {
        this.gameState = 'betting';
      }
    }, 3000);
  }

  ngOnDestroy() {
    let earnedPoints = this.playerChips - this.initialChipsValue;
    if (earnedPoints > 0) {
      this.tools.leaveMinigame("blackjack", earnedPoints, 0);
    }
  }
  
  // UI Helpers
  private _arrayCache = new Map<number, any[]>();
  getArray(n: number): any[] {
    if (!this._arrayCache.has(n)) {
      this._arrayCache.set(n, Array(n).fill(0));
    }
    return this._arrayCache.get(n)!;
  }

  private _pilesCache = new Map<number, number[]>();
  getChipPiles(total: number): number[] {
    if (total <= 0) return [0];
    if (this._pilesCache.has(total)) return this._pilesCache.get(total)!;
    
    const piles: number[] = [];
    let remaining = total;
    while (remaining > 0 && piles.length < 2) {
      piles.push(Math.min(remaining, 80));
      remaining -= 80;
    }
    if (remaining > 0) {
      piles.push(remaining); // 3rd pile has the rest
    }
    this._pilesCache.set(total, piles);
    return piles;
  }

  getStackHeight(pile: number): number {
    if (pile <= 0) return 50;
    const count = pile > 80 ? 80 : pile;
    return 47 + (count * 3);
  }
}
