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
      'chips_black': 3, // 300
      'chips_blue': 5,  // 100
      'chips_green': 5, // 50
      'chips_red': 8,   // 40
      'chips_white': 10 // 10
    };
    this.betInventory = {};
    for (const c of this.chips) {
      if (!this.playerInventory[c.id]) this.playerInventory[c.id] = 0;
      this.betInventory[c.id] = 0;
    }
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
    
    // Define exchange rates
    const rules: Record<string, { to: string, qty: number }> = {
      'chips_black': { to: 'chips_blue', qty: 5 }, // 100 -> 5x20
      'chips_blue': { to: 'chips_green', qty: 2 }, // 20 -> 2x10
      'chips_green': { to: 'chips_red', qty: 2 },  // 10 -> 2x5
      'chips_red': { to: 'chips_white', qty: 5 }   // 5 -> 5x1
    };
    
    const rule = rules[chipId];
    if (rule) {
      this.playerInventory[chipId]--;
      this.playerInventory[rule.to] += rule.qty;
      this.tools.playSound('sfx_1');
    }
  }

  canExchangeUp(chipId: string): boolean {
    const rules: Record<string, { to: string, qty: number }> = {
      'chips_blue': { to: 'chips_black', qty: 5 },
      'chips_green': { to: 'chips_blue', qty: 2 },
      'chips_red': { to: 'chips_green', qty: 2 },
      'chips_white': { to: 'chips_red', qty: 5 }
    };
    const rule = rules[chipId];
    return !!rule && this.playerInventory[chipId] >= rule.qty;
  }

  exchangeUp(chipId: string) {
    const rules: Record<string, { to: string, qty: number }> = {
      'chips_blue': { to: 'chips_black', qty: 5 },
      'chips_green': { to: 'chips_blue', qty: 2 },
      'chips_red': { to: 'chips_green', qty: 2 },
      'chips_white': { to: 'chips_red', qty: 5 }
    };
    
    const rule = rules[chipId];
    if (rule && this.playerInventory[chipId] >= rule.qty) {
      this.playerInventory[chipId] -= rule.qty;
      this.playerInventory[rule.to]++;
      this.tools.playSound('sfx_1');
    }
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
    
    if (reason === 'blackjack') {
      this.resultMessage = this.lang.blackjack || "Blackjack!";
      const win = Math.floor(originalBet * 2.5);
      this.greedyAdd(this.playerInventory, win);
      this.tools.playSound('sfx_4'); // win
    } else if (reason === 'player_win' || reason === 'dealer_bust') {
      this.resultMessage = reason === 'dealer_bust' ? (this.lang.dealer_bust || "Dealer Busts!") : (this.lang.player_win || "Player Wins!");
      this.greedyAdd(this.playerInventory, originalBet * 2);
      this.tools.playSound('sfx_4'); // win
    } else if (reason === 'push') {
      this.resultMessage = this.lang.push || "Push";
      this.greedyAdd(this.playerInventory, originalBet);
      this.tools.playSound('sfx_1'); // neutral
    } else {
      this.resultMessage = reason === 'bust' ? (this.lang.bust || "Bust!") : (this.lang.dealer_win || "Dealer Wins!");
      this.tools.playSound('sfx_2'); // lose
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
    let earnedPoints = this.playerChips - 500;
    if (earnedPoints > 0) {
      this.tools.leaveMinigame("blackjack", earnedPoints, 0);
    }
  }
  
  // UI Helpers
  getArray(n: number): any[] {
    return Array(n).fill(0);
  }

  getChipPiles(total: number): number[] {
    if (total <= 0) return [0];
    const piles: number[] = [];
    let remaining = total;
    while (remaining > 0 && piles.length < 2) {
      piles.push(Math.min(remaining, 80));
      remaining -= 80;
    }
    if (remaining > 0) {
      piles.push(remaining); // 3rd pile has the rest
    }
    return piles;
  }

  getStackHeight(pile: number): number {
    if (pile <= 0) return 50;
    const count = pile > 80 ? 80 : pile;
    return 47 + (count * 3);
  }
}
