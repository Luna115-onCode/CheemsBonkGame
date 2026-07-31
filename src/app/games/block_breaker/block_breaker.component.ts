import { Component, inject, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

interface ToolItem {
  type: string;
  level: number;
}

interface ActiveTool {
  col: number;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  level: number;
  img?: HTMLImageElement;
  damage: number;
  hitsRemaining: number;
  maxHits: number;
  rotation: number;
}

interface DigBlock {
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  img?: HTMLImageElement;
  prize: number;
  unbreakable: boolean;
  desired_tools: string[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

@Component({
  selector: 'app-block-breaker',
  imports: [],
  templateUrl: './block_breaker.component.html',
  styleUrl: './block_breaker.component.css'
})
export class BlockBreakerComponent implements OnInit, OnDestroy, AfterViewInit {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  readonly cols = 5;
  readonly rows = 2;
  laneWidth = 84;
  assetPath = 'games/block_breaker/assets/';

  toolTypes: Record<string, Array<{ level: number; name: string; src: string; damage: number; maxHits: number; price?: number; img?: HTMLImageElement }>> = {
    'shovel': [
      { level: 1, name: "Wood", src: "items/wood_shovel.png", damage: 1, maxHits: 5, price: 5 },
      { level: 2, name: "Stone", src: "items/stone_shovel.png", damage: 4, maxHits: 12, price: 12 },
      { level: 3, name: "Iron", src: "items/iron_shovel.png", damage: 15, maxHits: 25, price: 28 },
      { level: 4, name: "Gold", src: "items/gold_shovel.png", damage: 60, maxHits: 6, price: 65 },
      { level: 5, name: "Diamond", src: "items/diamond_shovel.png", damage: 150, maxHits: 75, price: 150 },
      { level: 6, name: "Netherite", src: "items/netherite_shovel.png", damage: 500, maxHits: 150, price: 350 }
    ],
    'pickaxe': [
      { level: 1, name: "Wood", src: "items/wood_pickaxe.png", damage: 1, maxHits: 5, price: 5 },
      { level: 2, name: "Stone", src: "items/stone_pickaxe.png", damage: 4, maxHits: 12, price: 12 },
      { level: 3, name: "Iron", src: "items/iron_pickaxe.png", damage: 15, maxHits: 25, price: 28 },
      { level: 4, name: "Gold", src: "items/gold_pickaxe.png", damage: 60, maxHits: 6, price: 65 },
      { level: 5, name: "Diamond", src: "items/diamond_pickaxe.png", damage: 150, maxHits: 75, price: 150 },
      { level: 6, name: "Netherite", src: "items/netherite_pickaxe.png", damage: 500, maxHits: 150, price: 350 }
    ]
  };

  blockRegistry: Record<string, { hp: number; solid: boolean; src: string | null; desired_tools: string[]; prize?: number; unbreakable?: boolean; img?: HTMLImageElement }> = {
    "air": { hp: 0, solid: false, src: null, desired_tools: [] },
    "dirt": { hp: 5, solid: true, src: "blocks/dirt.png", desired_tools: ['shovel'] },
    "grass": { hp: 6, solid: true, src: "blocks/grass_side_carried.png", desired_tools: ['shovel'] },
    "gravel": { hp: 12, solid: true, src: "blocks/gravel.png", desired_tools: ['shovel'] },

    "stone": { hp: 25, solid: true, src: "blocks/stone.png", desired_tools: ['pickaxe'] },
    "diorite": { hp: 30, solid: true, src: "blocks/stone_diorite.png", desired_tools: ['pickaxe'] },
    "granite": { hp: 30, solid: true, src: "blocks/stone_granite.png", desired_tools: ['pickaxe'] },
    "andesite": { hp: 30, solid: true, src: "blocks/stone_andesite.png", desired_tools: ['pickaxe'] },
    "cobblestone": { hp: 40, solid: true, src: "blocks/cobblestone.png", desired_tools: ['pickaxe'] },
    "deepslate": { hp: 100, solid: true, src: "blocks/deepslate.png", desired_tools: ['pickaxe'] },
    "cobbled_deepslate": { hp: 120, solid: true, src: "blocks/cobbled_deepslate.png", desired_tools: ['pickaxe'] },

    "bedrock": { hp: Infinity, solid: true, unbreakable: true, src: "blocks/bedrock.png", desired_tools: [] },
    "chest_50": { hp: 1, solid: true, src: "blocks/chest_front.png", prize: 50, desired_tools: [] },
    "chest_100": { hp: 1, solid: true, src: "blocks/chest_front.png", prize: 100, desired_tools: [] },
    "chest_250": { hp: 1, solid: true, src: "blocks/chest_front.png", prize: 250, desired_tools: [] },
    "chest_500": { hp: 1, solid: true, src: "blocks/chest_front.png", prize: 500, desired_tools: [] },
    "chest_1000": { hp: 1, solid: true, src: "blocks/chest_front.png", prize: 1000, desired_tools: [] }
  };

  gameState: 'MERGE' | 'DIG' = 'MERGE';
  playerLevel = 1;
  selectedSlotIndex: number | null = null;
  get coins(): number {
    return this.tools.minigameCoins;
  }
  set coins(val: number) {
    this.tools.minigameCoins = Math.floor(val);
    localStorage.setItem("CheemsAppLiMinigameCoins", String(Math.floor(val)));
    document.cookie = `CheemsAppLiMinigameCoins=${Math.floor(val)}; path=/; max-age=31536000`;
  }
  currentCost: Record<string, number> = { 'shovel': 10, 'pickaxe': 10 };
  grid: Array<ToolItem | null> = new Array(this.cols * this.rows).fill(null);
  isDragOver: boolean[] = new Array(this.cols * this.rows).fill(false);
  isTrashDragOver = false;

  allLevelDefs: any[] = [];
  currentLevelData: any = null;
  digBlocks: DigBlock[] = [];
  activeTools: ActiveTool[] = [];
  particles: Particle[] = [];
  bedrockHit = false;

  overlayHidden = true;
  overlaySuccess = false;
  overlayDanger = false;
  overlayTitleText = this.tools.minigames[this.tools.lang]?.title || "Title";
  overlayDescText = "Description goes here";
  overlayBtnText = "Continue";
  actionBtnText = this.tools.minigames[this.tools.lang]?.dropTools || "DROP TOOLS!";
  showLevelUpModal = false;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  ngOnInit(): void {
    this.tools.setTitle("block_breaker" as any);
    this.tools.actPage = "block_breaker" as any;
    this.loadLevel();
    this.loadGrid();
    this.loadCosts();
  }

  async loadDefinitions(): Promise<void> {
    try {
      let resItems = await fetch('games/block_breaker/definitions/items.json');
      if (!resItems.ok) resItems = await fetch('/games/block_breaker/definitions/items.json');
      
      if (resItems.ok) {
        this.toolTypes = await resItems.json();
        Object.keys(this.toolTypes).forEach(key => {
          if (!this.currentCost[key]) {
            this.currentCost[key] = 10;
          }
        });
      }
    } catch (e) {
      console.warn('Could not load items.json', e);
    }

    try {
      let resBlocks = await fetch('games/block_breaker/definitions/blocks.json');
      if (!resBlocks.ok) resBlocks = await fetch('/games/block_breaker/definitions/blocks.json');

      if (resBlocks.ok) {
        const rawBlocks = await resBlocks.json();
        this.blockRegistry = {};
        Object.keys(rawBlocks).forEach(k => {
          this.blockRegistry[k] = {
            ...rawBlocks[k],
            hp: rawBlocks[k].hp === null ? Infinity : rawBlocks[k].hp
          };
        });
      }
    } catch (e) {
      console.warn('Could not load blocks.json', e);
    }

    this.preloadImages();
  }

  ngAfterViewInit(): void {
    this.canvas = document.getElementById('dig-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d')!;
      this.laneWidth = this.canvas.width / this.cols;
    }
    this.initGame();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  preloadImages(): void {
    Object.keys(this.toolTypes).forEach(type => {
      this.toolTypes[type].forEach(t => {
        t.img = new Image();
        t.img.src = this.assetPath + t.src;
        t.img.onload = () => {
          if (this.gameState === 'MERGE') {
            this.drawCanvasStatic();
          }
        };
      });
    });

    Object.values(this.blockRegistry).forEach(b => {
      if (b.src) {
        b.img = new Image();
        b.img.src = this.assetPath + b.src;
        b.img.onload = () => {
          if (this.gameState === 'MERGE') {
            this.drawCanvasStatic();
          }
        };
      }
    });
  }

  async fetchLevels(): Promise<any[]> {
    try {
      let response = await fetch('games/block_breaker/definitions/level.json');
      if (!response.ok) {
        response = await fetch('/games/block_breaker/definitions/level.json');
      }
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.levels)) {
          return data.levels;
        }
      }
      throw new Error('Failed to load level.json');
    } catch (e) {
      console.warn("Could not fetch level.json, using fallback level system:", e);
      return [
        {
          "id": "starter_level",
          "background_color": "#87CEEB",
          "min_level": 1,
          "max_level": 2,
          "random_pools": {
            "rand_surface": ["dirt", "grass", "air"],
            "rand_mid": ["stone", "coal_ore", "copper_ore", "iron_ore"],
            "rand_deep": ["deepslate", "deepslate_iron_ore", "deepslate_diamond_ore"],
            "rand_treasure": ["chest_100", "chest_250", "chest_500"]
          },
          "map": [
            ["rand_surface", "air", "rand_surface", "air", "rand_surface"],
            ["dirt", "dirt", "stone", "dirt", "dirt"],
            ["stone", "stone", "stone", "stone", "stone"],
            ["rand_mid", "rand_mid", "air", "rand_mid", "rand_mid"],
            ["stone", "stone", "stone", "stone", "stone"],
            ["rand_mid", "rand_mid", "rand_mid", "rand_mid", "rand_mid"],
            ["stone", "stone", "barrel_50", "stone", "stone"],
            ["rand_mid", "rand_mid", "rand_mid", "rand_mid", "rand_mid"],
            ["rand_deep", "rand_deep", "rand_deep", "rand_deep", "rand_deep"],
            ["rand_deep", "copper_chest_inventory_front", "rand_deep", "rand_deep", "rand_deep"],
            ["rand_deep", "rand_deep", "rand_deep", "rand_deep", "rand_deep"],
            ["rand_deep", "rand_deep", "rand_deep", "rand_deep", "rand_deep"],
            ["air", "air", "air", "air", "air"],
            ["rand_treasure", "chest_250", "rand_treasure", "chest_250", "rand_treasure"],
            ["bedrock", "bedrock", "bedrock", "bedrock", "bedrock"]
          ]
        }
      ];
    }
  }

  pickEligibleLevel(): void {
    if (!this.allLevelDefs || this.allLevelDefs.length === 0) return;
    let eligible = this.allLevelDefs.filter(l => {
      if (l.max_level === undefined || l.max_level === null || l.max_level === 0) {
        return true;
      }
      return this.playerLevel <= l.max_level;
    });
    if (eligible.length === 0) eligible = this.allLevelDefs;
    this.currentLevelData = eligible[Math.floor(Math.random() * eligible.length)];
  }

  async initGame(): Promise<void> {
    await this.loadDefinitions();
    this.allLevelDefs = await this.fetchLevels();
    this.pickEligibleLevel();
    this.buildLevel();
    setTimeout(() => {
      this.drawCanvasStatic();
      this.cdr.detectChanges();
    }, 200);
  }

  buildLevel(): void {
    this.digBlocks = [];
    if (!this.currentLevelData || !this.currentLevelData.map) return;
    const blockHeight = 40;
    const startY = 100;

    const requiredHeight = Math.max(480, startY + this.currentLevelData.map.length * blockHeight + 20);
    if (this.canvas && this.canvas.height !== requiredHeight) {
      this.canvas.height = requiredHeight;
    }
    const bgColor = this.currentLevelData?.background_color || this.currentLevelData?.backgroundColor || "#87CEEB";
    if (this.canvas) {
      this.canvas.style.backgroundColor = bgColor;
    }

    for (let r = 0; r < this.currentLevelData.map.length; r++) {
      const row = this.currentLevelData.map[r];
      for (let c = 0; c < row.length; c++) {
        let blockId = row[c];

        if (this.currentLevelData.random_pools && this.currentLevelData.random_pools[blockId]) {
          const pool = this.currentLevelData.random_pools[blockId];
          blockId = pool[Math.floor(Math.random() * pool.length)];
        }

        const def = this.blockRegistry[blockId];

        if (def && def.solid) {
          this.digBlocks.push({
            col: c,
            x: c * this.laneWidth,
            y: startY + r * blockHeight,
            w: this.laneWidth,
            h: blockHeight,
            hp: def.hp,
            maxHp: def.hp,
            img: def.img,
            prize: def.prize || 0,
            unbreakable: def.unbreakable || false,
            desired_tools: def.desired_tools || []
          });
        }
      }
    }
  }

  getFloorCoins(): number {
    return Math.floor(this.coins);
  }

  getToolKeys(): string[] {
    return Object.keys(this.toolTypes);
  }

  isBuyToolDisabled(toolKey: string): boolean {
    const cost = this.currentCost[toolKey] || 10;
    return this.coins < cost || !this.grid.includes(null) || this.gameState !== 'MERGE';
  }

  getToolBuyLabel(toolKey: string): string {
    const langObj = this.tools.minigames[this.tools.lang];
    if (toolKey === 'shovel' && langObj?.buyShovel) return langObj.buyShovel;
    if (toolKey === 'pickaxe' && langObj?.buyPickaxe) return langObj.buyPickaxe;
    const buyWord = langObj?.buy || 'Buy';
    return `${buyWord} ${toolKey.charAt(0).toUpperCase() + toolKey.slice(1)}`;
  }

  isActionDisabled(): boolean {
    return this.gameState !== 'MERGE' || !this.grid.some(t => t !== null);
  }

  getToolImage(item: ToolItem): string {
    const toolData = this.toolTypes[item.type][item.level - 1];
    return this.assetPath + toolData.src;
  }

  getToolDamage(item: ToolItem): number {
    const toolData = this.toolTypes[item.type][item.level - 1];
    return toolData.damage;
  }

  buyTool(type: string): void {
    const cost = this.currentCost[type] || 10;
    if (this.coins >= cost && this.gameState === 'MERGE') {
      const emptyIndex = this.grid.indexOf(null);
      if (emptyIndex !== -1) {
        this.coins -= cost;
        this.currentCost[type] = Math.floor(cost * 1.15);
        this.grid[emptyIndex] = { type, level: 1 };
        this.tools.playSound('sfx_1');
        this.saveGrid();
        this.saveCosts();
      } else {
        this.tools.showToast("Grid is full!");
        this.tools.playSound('sfx_8');
      }
    } else {
      this.tools.showToast(this.tools.minigames[this.tools.lang]?.notEnoughMinigameCoins || "Not enough Minigame Points!");
      this.tools.playSound('sfx_8');
    }
  }

  clickSlot(index: number): void {
    if (this.gameState !== 'MERGE') return;
    const clickedObj = this.grid[index];

    if (this.selectedSlotIndex === null) {
      if (clickedObj !== null) {
        this.selectedSlotIndex = index;
        this.tools.playSound('sfx_1');
      }
      return;
    }

    const fromIndex = this.selectedSlotIndex;
    if (fromIndex === index) {
      this.selectedSlotIndex = null;
      return;
    }

    const fromObj = this.grid[fromIndex];
    const toObj = this.grid[index];
    if (!fromObj) {
      this.selectedSlotIndex = null;
      return;
    }

    if (toObj === null) {
      this.grid[index] = fromObj;
      this.grid[fromIndex] = null;
      this.tools.playSound('sfx_1');
    } else if (fromObj.type === toObj.type && fromObj.level === toObj.level && fromObj.level < (this.toolTypes[fromObj.type]?.length || 0)) {
      this.grid[index] = { type: fromObj.type, level: fromObj.level + 1 };
      this.grid[fromIndex] = null;
      this.tools.playSound('sfx_4');
    } else {
      this.grid[index] = fromObj;
      this.grid[fromIndex] = toObj;
      this.tools.playSound('sfx_1');
    }
    this.selectedSlotIndex = null;
    this.saveGrid();
  }

  getToolPrice(item: ToolItem): number {
    const toolData = this.toolTypes[item.type]?.[item.level - 1];
    return toolData?.price || (item.level * 5);
  }

  sellSelectedTool(): void {
    if (this.selectedSlotIndex !== null && this.gameState === 'MERGE') {
      this.sellToolAtIndex(this.selectedSlotIndex);
      this.selectedSlotIndex = null;
    }
  }

  sellToolAtIndex(index: number): void {
    const item = this.grid[index];
    if (item) {
      const price = this.getToolPrice(item);
      this.grid[index] = null;
      this.coins += price;
      this.tools.playSound('sfx_4');
      this.tools.showToast(`Sold ${item.type} Lv${item.level} for +${price} 🎮`);
      this.saveGrid();
    }
  }

  onDragOver(e: DragEvent, index: number): void {
    e.preventDefault();
    if (this.gameState === 'MERGE') {
      this.isDragOver[index] = true;
    }
  }

  onDragLeave(e: DragEvent, index: number): void {
    this.isDragOver[index] = false;
  }

  onDragStart(e: DragEvent, index: number): void {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragEnd(e: DragEvent, index: number): void {
    this.isDragOver[index] = false;
  }

  onDrop(e: DragEvent, index: number): void {
    e.preventDefault();
    this.isDragOver[index] = false;
    if (this.gameState !== 'MERGE') return;

    const fromIndexStr = e.dataTransfer?.getData('text/plain');
    if (!fromIndexStr) return;
    const fromIndex = parseInt(fromIndexStr, 10);
    const toIndex = index;
    if (fromIndex === toIndex || isNaN(fromIndex) || fromIndex < 0 || fromIndex >= this.grid.length) return;

    const fromObj = this.grid[fromIndex];
    const toObj = this.grid[toIndex];
    if (!fromObj) return;

    if (toObj === null) {
      this.grid[toIndex] = fromObj;
      this.grid[fromIndex] = null;
    } else if (fromObj.type === toObj.type && fromObj.level === toObj.level && fromObj.level < (this.toolTypes[fromObj.type]?.length || 0)) {
      this.grid[toIndex] = { type: fromObj.type, level: fromObj.level + 1 };
      this.grid[fromIndex] = null;
      this.tools.playSound('sfx_4');
    } else {
      this.grid[toIndex] = fromObj;
      this.grid[fromIndex] = toObj;
    }
    this.tools.playSound('sfx_1');
    this.saveGrid();
  }

  allowDrop(e: DragEvent): void {
    e.preventDefault();
    if (this.gameState === 'MERGE') {
      this.isTrashDragOver = true;
    }
  }

  leaveTrash(e: DragEvent): void {
    this.isTrashDragOver = false;
  }

  dropTrash(e: DragEvent): void {
    e.preventDefault();
    this.isTrashDragOver = false;
    if (this.gameState !== 'MERGE') return;
    const fromIndexStr = e.dataTransfer?.getData('text/plain');
    if (!fromIndexStr) return;
    const fromIndex = parseInt(fromIndexStr, 10);
    if (!isNaN(fromIndex) && fromIndex >= 0 && fromIndex < this.grid.length) {
      this.sellToolAtIndex(fromIndex);
    }
  }

  spawnParticles(x: number, y: number, color = "#ffffff"): void {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color
      });
    }
  }

  startDigging(): void {
    if (this.gameState !== 'MERGE' || !this.grid.some(t => t !== null)) return;

    this.gameState = 'DIG';
    this.bedrockHit = false;
    this.actionBtnText = this.tools.minigames[this.tools.lang]?.digging || "DIGGING...";
    this.activeTools = [];

    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== null) {
        const col = i % this.cols;
        const toolObj = this.grid[i]!;
        const typeData = this.toolTypes[toolObj.type][toolObj.level - 1];

        let toolImg = typeData.img;
        if (!toolImg) {
          toolImg = new Image();
          toolImg.src = this.assetPath + typeData.src;
          typeData.img = toolImg;
        }

        this.activeTools.push({
          col,
          type: toolObj.type,
          x: col * this.laneWidth + (this.laneWidth / 2),
          y: (Math.floor(i / this.cols) * -50) - 20,
          vx: 0,
          vy: 0,
          radius: 14,
          level: toolObj.level,
          img: toolImg,
          damage: typeData.damage,
          hitsRemaining: typeData.maxHits,
          maxHits: typeData.maxHits,
          rotation: 0
        });
      }
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(() => this.digLoop());
    });
  }

  digLoop(): void {
    if (this.gameState !== 'DIG' || !this.ctx || !this.canvas) return;
    const bgColor = this.currentLevelData?.background_color || this.currentLevelData?.backgroundColor || "#87CEEB";
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const b of this.digBlocks) {
      if (b.img && b.img.complete && b.img.naturalWidth !== 0) {
        this.ctx.drawImage(b.img, b.x, b.y, b.w, b.h);
      } else {
        this.ctx.fillStyle = b.unbreakable ? "#222" : "#555";
        this.ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      this.ctx.strokeStyle = "rgba(0,0,0,0.5)";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(b.x, b.y, b.w, b.h);

      if (!b.unbreakable) {
        this.ctx.font = "bold 16px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeText(String(Math.ceil(b.hp)), b.x + b.w / 2, b.y + b.h / 2);
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(String(Math.ceil(b.hp)), b.x + b.w / 2, b.y + b.h / 2);
      }
    }

    let toolsActive = false;

    for (let i = this.activeTools.length - 1; i >= 0; i--) {
      const t = this.activeTools[i];
      t.x += t.vx;
      t.y += t.vy;
      t.vy += 0.25;

      t.rotation += 0.1;

      if (t.x - t.radius < 0) {
        t.x = t.radius;
        t.vx *= -0.7;
      } else if (t.x + t.radius > this.canvas.width) {
        t.x = this.canvas.width - t.radius;
        t.vx *= -0.7;
      }

      let hitBlock = false;
      for (const targetBlock of this.digBlocks) {
        if (
          t.x + t.radius > targetBlock.x &&
          t.x - t.radius < targetBlock.x + targetBlock.w &&
          t.y + t.radius > targetBlock.y &&
          t.y - t.radius < targetBlock.y + targetBlock.h
        ) {
          hitBlock = true;
          this.tools.playSound('sfx_1');

          const overlapLeft = (t.x + t.radius) - targetBlock.x;
          const overlapRight = (targetBlock.x + targetBlock.w) - (t.x - t.radius);
          const overlapTop = (t.y + t.radius) - targetBlock.y;
          const overlapBottom = (targetBlock.y + targetBlock.h) - (t.y - t.radius);

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            t.vx *= -0.8;
          } else {
            t.vy *= -0.8;
          }

          if (!targetBlock.unbreakable) {
            targetBlock.hp -= t.damage;
            const hasPreferred = targetBlock.desired_tools && targetBlock.desired_tools.length > 0;
            const isPreferredTool = hasPreferred ? targetBlock.desired_tools.includes(t.type) : true;
            t.hitsRemaining -= isPreferredTool ? 1 : 2;

            this.spawnParticles(t.x, t.y, "#8B4513");

            if (targetBlock.hp <= 0) {
              if (targetBlock.prize > 0) {
                this.coins += targetBlock.prize;
              } else {
                this.coins += targetBlock.maxHp * 0.5;
              }
              this.digBlocks = this.digBlocks.filter(b => b !== targetBlock);
            }
          } else {
            this.spawnParticles(t.x, t.y, "#333333");
            t.hitsRemaining = 0;

            if (targetBlock.hp === Infinity) {
              this.bedrockHit = true;
            }
          }

          if (t.hitsRemaining <= 0) {
            this.spawnParticles(t.x, t.y, "#ff0000");
            this.activeTools.splice(i, 1);
            continue;
          }
        }
      }

      const renderSize = 40;
      this.ctx.save();
      this.ctx.translate(t.x, t.y);
      this.ctx.rotate(t.rotation);
      if (t.img && t.img.complete && t.img.naturalWidth !== 0) {
        this.ctx.drawImage(t.img, -renderSize / 2, -renderSize / 2, renderSize, renderSize);
      } else {
        this.ctx.fillStyle = t.type === 'shovel' ? '#8B4513' : '#708090';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, renderSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`L${t.level}`, 0, 0);
      }
      this.ctx.restore();

      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, renderSize / 2 + 2, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (t.hitsRemaining / t.maxHits)));
      this.ctx.strokeStyle = "#0f0";
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      toolsActive = true;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, 4, 4);
      this.ctx.globalAlpha = 1.0;
    }

    if (toolsActive || this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(() => this.digLoop());
    } else {
      this.ngZone.run(() => {
        this.endDigging();
        this.cdr.detectChanges();
      });
    }
  }

  endDigging(): void {
    this.overlayHidden = false;

    if (this.bedrockHit) {
      this.overlayTitleText = this.tools.minigames[this.tools.lang]?.levelCleared || "Level Cleared!";
      this.overlayDescText = this.tools.minigames[this.tools.lang]?.levelClearedDesc || "You successfully broke through to the bedrock.";
      this.overlayBtnText = this.tools.minigames[this.tools.lang]?.nextLevel || "Next Level";
      this.overlaySuccess = true;
      this.overlayDanger = false;
      this.playerLevel++;
      this.saveLevel();
    } else {
      this.overlayTitleText = this.tools.minigames[this.tools.lang]?.levelFailed || "Level Failed";
      this.overlayDescText = this.tools.minigames[this.tools.lang]?.levelFailedDesc || "Your tools broke before reaching the bottom.";
      this.overlayBtnText = this.tools.minigames[this.tools.lang]?.tryAgain || "Try Again";
      this.overlaySuccess = false;
      this.overlayDanger = true;
    }
  }

  closeOverlay(): void {
    this.overlayHidden = true;

    this.pickEligibleLevel();
    this.buildLevel();
    this.drawCanvasStatic();

    this.gameState = 'MERGE';
    this.actionBtnText = this.tools.minigames[this.tools.lang]?.dropTools || "DROP TOOLS!";
  }

  drawCanvasStatic(): void {
    if (!this.ctx || !this.canvas) return;
    const bgColor = this.currentLevelData?.background_color || this.currentLevelData?.backgroundColor || "#87CEEB";
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (const b of this.digBlocks) {
      if (b.img && b.img.complete) {
        this.ctx.drawImage(b.img, b.x, b.y, b.w, b.h);
      } else {
        this.ctx.fillStyle = b.unbreakable ? "#222" : "#555";
        this.ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      this.ctx.strokeStyle = "rgba(0,0,0,0.5)";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(b.x, b.y, b.w, b.h);
      if (!b.unbreakable) {
        this.ctx.font = "bold 16px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeText(String(Math.ceil(b.hp)), b.x + b.w / 2, b.y + b.h / 2);
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(String(Math.ceil(b.hp)), b.x + b.w / 2, b.y + b.h / 2);
      }
    }
  }

  loadLevel(): void {
    let savedLevel = localStorage.getItem("CheemsAppLiMinigame_PlayerLevel");
    if (!savedLevel) {
      const match = document.cookie.match(/(^| )CheemsAppLiMinigame_PlayerLevel=([^;]+)/);
      if (match) savedLevel = match[2];
    }
    if (savedLevel) {
      this.playerLevel = Math.max(1, +savedLevel || 1);
    }
  }

  saveLevel(): void {
    localStorage.setItem("CheemsAppLiMinigame_PlayerLevel", String(this.playerLevel));
    document.cookie = `CheemsAppLiMinigame_PlayerLevel=${this.playerLevel}; path=/; max-age=31536000`;
  }

  loadGrid(): void {
    try {
      let saved = localStorage.getItem("CheemsAppLiMinigame_Grid");
      if (!saved) {
        const match = document.cookie.match(/(^| )CheemsAppLiMinigame_Grid=([^;]+)/);
        if (match) saved = decodeURIComponent(match[2]);
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === this.cols * this.rows) {
          this.grid = parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load grid from storage", e);
    }
  }

  saveGrid(): void {
    const jsonStr = JSON.stringify(this.grid);
    localStorage.setItem("CheemsAppLiMinigame_Grid", jsonStr);
    document.cookie = `CheemsAppLiMinigame_Grid=${encodeURIComponent(jsonStr)}; path=/; max-age=31536000`;
  }

  loadCosts(): void {
    try {
      let saved = localStorage.getItem("CheemsAppLiMinigame_Costs");
      if (!saved) {
        const match = document.cookie.match(/(^| )CheemsAppLiMinigame_Costs=([^;]+)/);
        if (match) saved = decodeURIComponent(match[2]);
      }
      if (saved) {
        this.currentCost = { ...this.currentCost, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }

  saveCosts(): void {
    const jsonStr = JSON.stringify(this.currentCost);
    localStorage.setItem("CheemsAppLiMinigame_Costs", jsonStr);
    document.cookie = `CheemsAppLiMinigame_Costs=${encodeURIComponent(jsonStr)}; path=/; max-age=31536000`;
  }

  openSellLevelConfirm(): void {
    if (this.playerLevel <= 1) {
      this.tools.showToast("You need to be at least Level 2 to sell your level!");
      this.tools.playSound('sfx_8');
      return;
    }
    this.showLevelUpModal = true;
  }

  closeSellLevelConfirm(): void {
    this.showLevelUpModal = false;
  }

  confirmSellLevel(): void {
    if (this.playerLevel > 1) {
      const reward = this.playerLevel * 20;
      this.tools.addMinigameCoins(reward);
      this.playerLevel = 1;
      this.saveLevel();
      this.pickEligibleLevel();
      this.buildLevel();
      this.drawCanvasStatic();
      this.tools.showToast(`Sold level for +${reward} 🎮!`);
      this.tools.playSound('sfx_4');
      this.showLevelUpModal = false;
    }
  }
}
