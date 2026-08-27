import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  dice_roll: [number, number];
  skin: string;
  shiny: string;
  isShiny?: boolean;
}

interface TypeChart {
  [key: string]: {
    strong_against: string[];
    weak_to: string[];
    immune_to: string[];
  };
}

@Component({
  selector: 'app-rock-paper-poke',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rock_paper_poke.component.html',
  styleUrl: './rock_paper_poke.component.css'
})
export class RockPaperPokeComponent implements OnInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  
  pokemonList: Pokemon[] = [];
  typeChart: TypeChart = {};
  
  playerChoices: Pokemon[] = [];
  opponentChoices: Pokemon[] = [];
  
  selectedPlayerPokemon: Pokemon | null = null;
  selectedOpponentPokemon: Pokemon | null = null;
  
  playerRoll: number = 0;
  opponentRoll: number = 0;
  
  playerFinalScore: number = 0;
  opponentFinalScore: number = 0;
  
  playerMultiplier: number = 1;
  opponentMultiplier: number = 1;
  
  battleResult: 'win' | 'lose' | 'draw' | null = null;
  
  eggSkin: string = 'games/rock-paper-poke/assets/egg.png';
  
  isLoading: boolean = true;
  
  level: number = 0;
  points: number = 0;
  
  battleState: 'SELECT' | 'REVEAL' | 'BASE_POINTS' | 'MULTIPLIERS' | 'RESULT' = 'SELECT';
  showImmune: boolean = false;
  showWeak: boolean = false;
  showStrong: boolean = false;
  showShiny: boolean = false;
  
  hasImmuneMultiplier: boolean = false;
  hasWeakMultiplier: boolean = false;
  hasStrongMultiplier: boolean = false;
  
  playerCurrentDisplayScore: number = 0;
  opponentCurrentDisplayScore: number = 0;
  
  pMults: any;
  oMults: any;
  
  get lang() {
    return this.tools.rock_paper_poke[this.tools.lang] || {};
  }
  
  async ngOnInit() {
    this.tools.setTitle("rock_paper_poke" as any);
    this.tools.actPage = "rock_paper_poke" as any;
    
    await this.loadData();
    this.startNewGame();
  }
  
  async loadData() {
    try {
      const [pokeRes, typeRes] = await Promise.all([
        fetch('games/rock-paper-poke/data/pokemon.json'),
        fetch('games/rock-paper-poke/data/type_chart.json')
      ]);
      
      let pokeData = [];
      let typeData = {};
      
      if (pokeRes.ok) {
        pokeData = await pokeRes.json();
      } else {
        const fallbackRes = await fetch('/games/rock-paper-poke/data/pokemon.json');
        pokeData = await fallbackRes.json();
      }
      
      if (typeRes.ok) {
        typeData = await typeRes.json();
      } else {
        const fallbackRes = await fetch('/games/rock-paper-poke/data/type_chart.json');
        typeData = await fallbackRes.json();
      }
      
      this.pokemonList = pokeData.filter((p: Pokemon) => p.id !== 0); // Exclude egg
      this.typeChart = typeData;
      
      const eggData = pokeData.find((p: Pokemon) => p.id === 0);
      if (eggData) {
        this.eggSkin = eggData.skin;
      }
      
      this.isLoading = false;
    } catch (e) {
      console.error("Failed to load pokemon data:", e);
      this.isLoading = false;
    }
  }
  
  startNewGame() {
    this.selectedPlayerPokemon = null;
    this.selectedOpponentPokemon = null;
    this.battleResult = null;
    this.battleState = 'SELECT';
    this.showImmune = false;
    this.showWeak = false;
    this.showStrong = false;
    this.showShiny = false;
    
    this.playerCurrentDisplayScore = 0;
    this.opponentCurrentDisplayScore = 0;
    
    this.playerChoices = this.getRandomPokemon(3);
    this.opponentChoices = this.getRandomPokemon(3);
  }
  
  getRandomPokemon(count: number): Pokemon[] {
    const result: Pokemon[] = [];
    const listCopy = [...this.pokemonList];
    
    for (let i = 0; i < count; i++) {
      if (listCopy.length === 0) break;
      const randIndex = Math.floor(Math.random() * listCopy.length);
      const chosen = listCopy.splice(randIndex, 1)[0];
      result.push({ ...chosen, isShiny: Math.random() < 0.1 });
    }
    
    return result;
  }
  
  selectPokemon(pokemon: Pokemon, index: number) {
    if (this.battleState !== 'SELECT') return;
    
    this.selectedPlayerPokemon = pokemon;
    this.selectedOpponentPokemon = this.opponentChoices[index];
    
    this.prepareBattleData();
    this.runBattleSequence();
  }
  
  prepareBattleData() {
    if (!this.selectedPlayerPokemon || !this.selectedOpponentPokemon) return;
    
    const p = this.selectedPlayerPokemon;
    const o = this.selectedOpponentPokemon;
    
    this.playerRoll = Math.floor(Math.random() * (p.dice_roll[1] - p.dice_roll[0] + 1)) + p.dice_roll[0];
    this.opponentRoll = Math.floor(Math.random() * (o.dice_roll[1] - o.dice_roll[0] + 1)) + o.dice_roll[0];
    
    this.pMults = this.getMultiplierDetails(p, o);
    this.oMults = this.getMultiplierDetails(o, p);
    
    this.hasImmuneMultiplier = this.pMults.immune || this.oMults.immune;
    this.hasWeakMultiplier = this.pMults.weak || this.oMults.weak;
    this.hasStrongMultiplier = this.pMults.strong || this.oMults.strong;
    
    this.playerMultiplier = this.pMults.value * (p.isShiny ? 1.5 : 1);
    this.opponentMultiplier = this.oMults.value * (o.isShiny ? 1.5 : 1);
    
    this.playerFinalScore = this.playerRoll * this.playerMultiplier;
    this.opponentFinalScore = this.opponentRoll * this.opponentMultiplier;
  }
  
  async runBattleSequence() {
    this.battleState = 'REVEAL';
    await this.delay(1000);
    
    this.battleState = 'BASE_POINTS';
    this.playerCurrentDisplayScore = this.playerRoll;
    this.opponentCurrentDisplayScore = this.opponentRoll;
    await this.delay(1500);
    
    if (this.hasImmuneMultiplier) {
      this.battleState = 'MULTIPLIERS';
      this.showImmune = true;
      if (this.pMults.immune) this.playerCurrentDisplayScore = 0;
      if (this.oMults.immune) this.opponentCurrentDisplayScore = 0;
      await this.delay(1500);
    } else {
      if (this.hasWeakMultiplier) {
        this.battleState = 'MULTIPLIERS';
        this.showWeak = true;
        if (this.pMults.weak) this.playerCurrentDisplayScore *= this.pMults.value;
        if (this.oMults.weak) this.opponentCurrentDisplayScore *= this.oMults.value;
        await this.delay(1500);
      }
      if (this.hasStrongMultiplier) {
        this.battleState = 'MULTIPLIERS';
        this.showStrong = true;
        if (this.pMults.strong) this.playerCurrentDisplayScore *= this.pMults.value;
        if (this.oMults.strong) this.opponentCurrentDisplayScore *= this.oMults.value;
        await this.delay(1500);
      }
    }
    
    if (this.selectedPlayerPokemon?.isShiny || this.selectedOpponentPokemon?.isShiny) {
      this.battleState = 'MULTIPLIERS';
      this.showShiny = true;
      if (this.selectedPlayerPokemon?.isShiny) this.playerCurrentDisplayScore *= 1.5;
      if (this.selectedOpponentPokemon?.isShiny) this.opponentCurrentDisplayScore *= 1.5;
      await this.delay(1500);
    }
    
    this.battleState = 'RESULT';
    
    if (this.playerFinalScore > this.opponentFinalScore) {
      this.battleResult = 'win';
      this.level++;
      this.tools.playSound('sfx_success');
    } else if (this.playerFinalScore < this.opponentFinalScore) {
      this.battleResult = 'lose';
      this.tools.playSound('sfx_fail');
    } else {
      this.battleResult = 'draw';
    }
    
    const diff = this.playerFinalScore - this.opponentFinalScore;
    this.points = Math.max(0, this.points + diff);
  }
  
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getMultiplierDetails(attacker: Pokemon, defender: Pokemon): { strong: boolean, weak: boolean, immune: boolean, value: number } {
    let bestValue = 0;
    
    for (const aType of attacker.types) {
      const aTypeInfo = this.typeChart[aType];
      let currentTypeMult = 1;
      
      for (const dType of defender.types) {
        const dTypeInfo = this.typeChart[dType];
        
        if (aTypeInfo && aTypeInfo.strong_against.includes(dType)) {
          currentTypeMult *= 2;
        }
        if (aTypeInfo && aTypeInfo.weak_to.includes(dType)) {
          currentTypeMult *= 0.5;
        }
        // The defender is immune to the attacker if the defender's immune_to list includes the attacker's type
        if (dTypeInfo && dTypeInfo.immune_to.includes(aType)) {
          currentTypeMult *= 0;
        }
      }
      
      if (currentTypeMult > bestValue) {
        bestValue = currentTypeMult;
      }
    }
    
    return { 
      strong: bestValue > 1, 
      weak: bestValue > 0 && bestValue < 1, 
      immune: bestValue === 0, 
      value: bestValue 
    };
  }

  getDynamicTagText(baseText: string, value: number): string {
    return baseText.replace(/x[0-9.]+/, 'x' + value);
  }

  ngOnDestroy() {
    this.tools.leaveMinigame('rock_paper_poke', this.points, this.level);
  }
}
