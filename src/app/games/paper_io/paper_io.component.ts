import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

interface BotTemplate {
  id: string;
  names: string[];
  spawnWithAreaMin: number;
  spawnWithAreaMax: number;
  behaviour: 'normal' | 'protective' | 'aggresive' | 'playerKiller' | 'chaotic';
  speed: number;
}

interface Player {
  id: number;
  name: string;
  color: string;
  trailColor: string;
  x: number;
  y: number;
  px: number;
  py: number;
  dir: number;
  nextDir: number;
  state: 'IDLE' | 'DRAWING';
  trail: { x: number; y: number }[];
  isDead: boolean;
  scoreCount: number;
  
  speed: number;
  tickAccumulator: number;
  behaviour: 'player' | 'normal' | 'protective' | 'aggresive' | 'playerKiller' | 'chaotic';
  template?: BotTemplate;
}

@Component({
  selector: 'app-paper-io',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paper_io.component.html',
  styleUrl: './paper_io.component.css'
})
export class PaperIoComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  gameState: 'START' | 'PLAYING' | 'GAMEOVER' = 'START';
  gamePoints = 0;
  leaderboard: Array<{ name: string; pct: string; color: string }> = [];

  private GRID_SIZE = 120;
  private TILE_SIZE = 25;
  private TICK_RATE = 70;
  
  private DIRS = [
    { x: 0, y: -1 }, // 0: UP
    { x: 1, y: 0 },  // 1: RIGHT
    { x: 0, y: 1 },  // 2: DOWN
    { x: -1, y: 0 }  // 3: LEFT
  ];

  private grid: number[][] = [];
  private trailGrid: number[][] = [];
  private players: Player[] = [];
  private botTemplates: BotTemplate[] = [];
  
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private botCounter = 0;

  private touchStartX = 0;
  private touchStartY = 0;

  private onKeyDownBound = this.onKeyDown.bind(this);
  private onResizeBound = this.onResize.bind(this);
  private onTouchStartBound = this.onTouchStart.bind(this);
  private onTouchMoveBound = this.onTouchMove.bind(this);
  private onTouchEndBound = this.onTouchEnd.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("paper_io" as any);
    this.tools.actPage = "paper_io" as any;
  }

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const container = this.gameContainer.nativeElement;
    canvas.width = container.clientWidth || window.innerWidth;
    canvas.height = container.clientHeight || window.innerHeight;

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('keydown', this.onKeyDownBound, { passive: false });
      window.addEventListener('resize', this.onResizeBound);
      canvas.addEventListener('touchstart', this.onTouchStartBound, { passive: true });
      canvas.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
      canvas.addEventListener('touchend', this.onTouchEndBound, { passive: true });
    });

    await this.loadData();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('resize', this.onResizeBound);
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('touchstart', this.onTouchStartBound);
      canvas.removeEventListener('touchmove', this.onTouchMoveBound);
      canvas.removeEventListener('touchend', this.onTouchEndBound);
    }
    this.tools.leaveMinigame('paper_io', this.tools.sessionPoints);
  }

  async loadData(): Promise<void> {
    try {
      let res = await fetch('games/paper_io/data/bots.json');
      if (!res.ok) res = await fetch('/games/paper_io/data/bots.json');
      this.botTemplates = await res.json();
    } catch (err) {
      console.error("Error loading bots.json, using defaults", err);
      this.botTemplates = [
        { id: 'default', names: ['Bot'], spawnWithAreaMin: 0.1, spawnWithAreaMax: 70, behaviour: 'normal', speed: 1 }
      ];
    }
  }

  startGame(): void {
    this.gamePoints = 0;
    this.gameState = 'PLAYING';
    
    this.grid = new Array(this.GRID_SIZE).fill(0).map(() => new Array(this.GRID_SIZE).fill(-1));
    this.trailGrid = new Array(this.GRID_SIZE).fill(0).map(() => new Array(this.GRID_SIZE).fill(-1));
    this.players = [];
    this.botCounter = 0;

    let sx = Math.floor(Math.random() * (this.GRID_SIZE - 40)) + 20;
    let sy = Math.floor(Math.random() * (this.GRID_SIZE - 40)) + 20;

    this.players.push({
        id: 0,
        name: 'You',
        color: '#FF4081',
        trailColor: 'rgba(255, 64, 129, 0.4)',
        x: sx, y: sy,
        px: sx, py: sy,
        dir: 1, nextDir: 1,
        state: 'IDLE',
        trail: [],
        isDead: false,
        scoreCount: 9,
        speed: 1,
        tickAccumulator: 0,
        behaviour: 'player'
    });

    for(let dx = -1; dx <= 1; dx++) {
        for(let dy = -1; dy <= 1; dy++) {
            this.grid[sx+dx][sy+dy] = 0;
        }
    }

    for (let i = 1; i <= 14; i++) {
        let bot = { id: i, isDead: true, scoreCount: 0 } as any;
        this.players.push(bot);
        this.reviveBot(bot);
    }

    this.lastTime = performance.now();
    this.accumulator = 0;
    
    this.ngZone.runOutsideAngular(() => {
      this.loop(performance.now());
    });
  }

  private reviveBot(bot: Player): void {
      if (this.botTemplates.length === 0) return;

      let template = this.botTemplates[Math.floor(Math.random() * this.botTemplates.length)];
      let sx = 0, sy = 0, radius = 0;
      let attempts = 0;
      let found = false;
      let human = this.players[0];

      while(attempts < 100) {
          let pct = Math.random() * (template.spawnWithAreaMax - template.spawnWithAreaMin) + template.spawnWithAreaMin;
          let targetArea = (this.GRID_SIZE * this.GRID_SIZE) * (pct / 100);
          radius = Math.floor(Math.sqrt(targetArea) / 2);

          let maxBound = Math.max(0, this.GRID_SIZE - radius * 2);
          sx = Math.floor(Math.random() * maxBound) + radius;
          sy = Math.floor(Math.random() * maxBound) + radius;
          
          let safe = true;

          if (!human.isDead) {
              let distToHuman = Math.hypot(sx - human.x, sy - human.y);
              if (distToHuman < radius + 40) {
                  safe = false;
              }
          }

          if (safe) {
              for (let i = 0; i < this.players.length; i++) {
                  let p = this.players[i];
                  if (!p.isDead && p.x >= sx - radius && p.x <= sx + radius && p.y >= sy - radius && p.y <= sy + radius) {
                      safe = false;
                      break;
                  }
              }
          }
          
          if (safe) {
              for(let dx = -radius; dx <= radius; dx++) {
                  for(let dy = -radius; dy <= radius; dy++) {
                      let nx = sx + dx, ny = sy + dy;
                      if(nx >= 0 && nx < this.GRID_SIZE && ny >= 0 && ny < this.GRID_SIZE) {
                          if(this.trailGrid[nx][ny] !== -1) {
                              safe = false; 
                              break;
                          }
                      }
                  }
                  if(!safe) break;
              }
          }

          if (safe) { 
              found = true; 
              break; 
          }
          attempts++;
      }
      
      if (!found) return; 

      this.botCounter++;
      let hue = Math.floor(Math.random() * 360);
      
      let randomName = template.names[Math.floor(Math.random() * template.names.length)] || "Bot";
      bot.name = `${randomName} ${this.botCounter}`;
      bot.color = `hsl(${hue}, 70%, 50%)`;
      bot.trailColor = `hsla(${hue}, 70%, 50%, 0.4)`;
      bot.x = sx; bot.y = sy;
      bot.px = sx; bot.py = sy;
      bot.dir = Math.floor(Math.random() * 4);
      bot.nextDir = bot.dir;
      bot.state = 'IDLE';
      bot.trail = [];
      bot.isDead = false;
      bot.scoreCount = 0;
      bot.speed = template.speed;
      bot.behaviour = template.behaviour;
      bot.template = template;
      bot.tickAccumulator = 0;

      for(let dx = -radius; dx <= radius; dx++) {
          for(let dy = -radius; dy <= radius; dy++) {
              let nx = sx + dx, ny = sy + dy;
              if(nx >= 0 && nx < this.GRID_SIZE && ny >= 0 && ny < this.GRID_SIZE) {
                  this.grid[nx][ny] = bot.id;
                  bot.scoreCount++;
              }
          }
      }

      this.players.forEach(p => {
          if(p.id !== bot.id && !p.isDead) {
              let count = 0;
              for (let x = 0; x < this.GRID_SIZE; x++) {
                  for (let y = 0; y < this.GRID_SIZE; y++) {
                      if (this.grid[x][y] === p.id) count++;
                  }
              }
              p.scoreCount = count;
          }
      });
  }

  private logicTickForPlayer(p: Player): void {
      if(p.isDead) return;

      p.px = p.x;
      p.py = p.y;

      if (Math.abs(p.dir - p.nextDir) !== 2) {
          p.dir = p.nextDir;
      }

      let nextX = p.x + this.DIRS[p.dir].x;
      let nextY = p.y + this.DIRS[p.dir].y;

      if (nextX < 0 || nextX >= this.GRID_SIZE || nextY < 0 || nextY >= this.GRID_SIZE) {
          let validTurns = [0, 1, 2, 3].filter(d => {
              if (Math.abs(d - p.dir) === 2) return false;
              let checkX = p.x + this.DIRS[d].x;
              let checkY = p.y + this.DIRS[d].y;
              return (checkX >= 0 && checkX < this.GRID_SIZE && checkY >= 0 && checkY < this.GRID_SIZE);
          });

          let safeTurns = validTurns.filter(d => {
              let checkX = p.x + this.DIRS[d].x;
              let checkY = p.y + this.DIRS[d].y;
              return this.trailGrid[checkX][checkY] !== p.id;
          });

          let chosenTurns = safeTurns.length > 0 ? safeTurns : validTurns;

          if (chosenTurns.length > 0) {
              p.dir = chosenTurns[Math.floor(Math.random() * chosenTurns.length)];
              p.nextDir = p.dir;
              nextX = p.x + this.DIRS[p.dir].x;
              nextY = p.y + this.DIRS[p.dir].y;
          } else {
              this.killPlayer(p.id);
              return;
          }
      }

      p.x = nextX;
      p.y = nextY;

      let hitTrailId = this.trailGrid[p.x][p.y];
      if (hitTrailId !== -1) {
          this.killPlayer(hitTrailId, p.id);
          if (hitTrailId === p.id) {
              return;
          }
      }

      let currentTerritoryId = this.grid[p.x][p.y];
      
      if (currentTerritoryId === p.id) {
          if (p.state === 'DRAWING') {
              this.closeLoop(p);
          }
      } else {
          p.state = 'DRAWING';
          p.trail.push({x: p.x, y: p.y});
          this.trailGrid[p.x][p.y] = p.id;
      }

      if (p.id !== 0 && !p.isDead) {
          this.updateBotAI(p);
      }
  }

  private killPlayer(id: number, killerId?: number): void {
      let p = this.players.find(p => p.id === id);
      if(!p || p.isDead) return;
      p.isDead = true;

      let validKiller = killerId !== undefined && killerId !== id;
      let isTouching = false;

      if (validKiller) {
          for (let x = 0; x < this.GRID_SIZE; x++) {
              for (let y = 0; y < this.GRID_SIZE; y++) {
                  if (this.grid[x][y] === id) {
                      for (let d of this.DIRS) {
                          let nx = x + d.x, ny = y + d.y;
                          if (nx >= 0 && nx < this.GRID_SIZE && ny >= 0 && ny < this.GRID_SIZE) {
                              if (this.grid[nx][ny] === killerId) {
                                  isTouching = true;
                                  break;
                              }
                          }
                      }
                  }
                  if (isTouching) break;
              }
              if (isTouching) break;
          }
      }

      let shouldTransfer = validKiller && isTouching;

      for(let x=0; x<this.GRID_SIZE; x++){
          for(let y=0; y<this.GRID_SIZE; y++){
              if(this.grid[x][y] === id) {
                  this.grid[x][y] = shouldTransfer ? killerId! : -1;
              }
              if(this.trailGrid[x][y] === id) {
                  this.trailGrid[x][y] = -1;
              }
          }
      }
      p.scoreCount = 0;
      
      if (validKiller) {
          // Recalculate score for the killer
          let killer = this.players.find(kp => kp.id === killerId);
          if (killer && !killer.isDead) {
              let count = 0;
              for (let x = 0; x < this.GRID_SIZE; x++) {
                  for (let y = 0; y < this.GRID_SIZE; y++) {
                      if (this.grid[x][y] === killerId) count++;
                  }
              }
              killer.scoreCount = count;
              
              if (killer.id === 0) {
                  this.ngZone.run(() => {
                      this.gamePoints = killer!.scoreCount * 2;
                  });
              }
          }
      }

      if (id === 0) {
          this.ngZone.run(() => {
              this.tools.sessionPoints += this.gamePoints;
              this.gameState = 'GAMEOVER';
              this.tools.playSound('sfx_8');
          });
      } else if (killerId === 0) {
          this.ngZone.run(() => {
              this.gamePoints += 100;
          });
      }
  }

  private closeLoop(player: Player): void {
      player.trail.forEach(t => {
          this.grid[t.x][t.y] = player.id;
          this.trailGrid[t.x][t.y] = -1;
      });
      player.trail = [];
      player.state = 'IDLE';

      let visited = new Array(this.GRID_SIZE + 2).fill(0).map(() => new Array(this.GRID_SIZE + 2).fill(false));
      let queue = [[-1, -1]];
      visited[0][0] = true;
      let head = 0; 

      while (head < queue.length) {
          let [cx, cy] = queue[head++];

          for (let d of this.DIRS) {
              let nx = cx + d.x;
              let ny = cy + d.y;

              if (nx >= -1 && nx <= this.GRID_SIZE && ny >= -1 && ny <= this.GRID_SIZE) {
                  if (!visited[nx + 1][ny + 1]) {
                      let isWall = false;
                      if (nx >= 0 && nx < this.GRID_SIZE && ny >= 0 && ny < this.GRID_SIZE) {
                          if (this.grid[nx][ny] === player.id) {
                              isWall = true;
                          }
                      }

                      if (!isWall) {
                          visited[nx + 1][ny + 1] = true;
                          queue.push([nx, ny]);
                      }
                  }
              }
          }
      }

      player.scoreCount = 0;
      for (let x = 0; x < this.GRID_SIZE; x++) {
          for (let y = 0; y < this.GRID_SIZE; y++) {
              if (!visited[x + 1][y + 1]) {
                  this.grid[x][y] = player.id;
              }
              if (this.grid[x][y] === player.id) {
                  player.scoreCount++;
              }
          }
      }
      
      this.players.forEach(p => {
          if(p.id !== player.id && !p.isDead) {
              let count = 0;
              for (let x = 0; x < this.GRID_SIZE; x++) {
                  for (let y = 0; y < this.GRID_SIZE; y++) {
                      if (this.grid[x][y] === p.id) count++;
                  }
              }
              p.scoreCount = count;
              
              // 2. Lost all territory
              if (p.scoreCount === 0) {
                  this.killPlayer(p.id, player.id);
              } 
              // 3. Connection is cut (trail no longer connects to their territory)
              else if (p.state === 'DRAWING' && p.trail.length > 0) {
                  let start = p.trail[0];
                  let isConnected = false;
                  for (let d of this.DIRS) {
                      let nx = start.x + d.x;
                      let ny = start.y + d.y;
                      if (nx >= 0 && nx < this.GRID_SIZE && ny >= 0 && ny < this.GRID_SIZE) {
                          if (this.grid[nx][ny] === p.id) {
                              isConnected = true;
                              break;
                          }
                      }
                  }
                  if (!isConnected) {
                      this.killPlayer(p.id, player.id);
                  }
              }
          }
      });

      if (player.id === 0) {
        this.ngZone.run(() => {
            this.gamePoints = player.scoreCount * 2;
        });
      }
  }

  private updateBotAI(bot: Player): void {
      let possibleDirs = [0, 1, 2, 3].filter(d => Math.abs(d - bot.dir) !== 2);

      let safeDirs = possibleDirs.filter(d => {
          let nx = bot.x + this.DIRS[d].x;
          let ny = bot.y + this.DIRS[d].y;
          
          if (nx < 0 || nx >= this.GRID_SIZE || ny < 0 || ny >= this.GRID_SIZE) return false;
          if (this.trailGrid[nx][ny] === bot.id) return false; 
          
          let openSpaces = 0;
          for (let nextD of [0, 1, 2, 3]) {
              if (Math.abs(nextD - d) === 2) continue; 
              let nnx = nx + this.DIRS[nextD].x;
              let nny = ny + this.DIRS[nextD].y;
              if (nnx >= 0 && nnx < this.GRID_SIZE && nny >= 0 && nny < this.GRID_SIZE && this.trailGrid[nnx][nny] !== bot.id) {
                  openSpaces++;
              }
          }
          
          if (openSpaces === 0 && bot.state === 'DRAWING') return false; 
          return true;
      });

      if (safeDirs.length === 0) safeDirs = possibleDirs; 

      let chosenDir = bot.nextDir;
      let immediateDanger = !safeDirs.includes(bot.dir);

      if (immediateDanger) {
          chosenDir = safeDirs[Math.floor(Math.random() * safeDirs.length)];
      } else {
          // --- Behaviors ---
          let p0 = this.players[0];

          if (bot.behaviour === 'normal') {
              let turnChance = bot.state === 'IDLE' ? 0.05 : 0.1;
              if (bot.state === 'DRAWING' && bot.trail.length > 8) turnChance = 0.4;
              
              if (Math.random() < turnChance) {
                  chosenDir = safeDirs[Math.floor(Math.random() * safeDirs.length)];
              }
          }
          else if (bot.behaviour === 'chaotic') {
              let turnChance = 0.4;
              if (Math.random() < turnChance) {
                  chosenDir = safeDirs[Math.floor(Math.random() * safeDirs.length)];
              }
          }
          else if (bot.behaviour === 'protective') {
              let turnChance = bot.state === 'IDLE' ? 0.02 : 0.2;
              if (bot.state === 'DRAWING' && bot.trail.length > 5) turnChance = 0.7;
              
              if (Math.random() < turnChance) {
                  let bestDir = safeDirs[Math.floor(Math.random() * safeDirs.length)];
                  let minDistance = 9999;
                  for (let d of safeDirs) {
                      let checkX = bot.x + this.DIRS[d].x;
                      let checkY = bot.y + this.DIRS[d].y;
                      let dist = this.findNearestGrid(checkX, checkY, bot.id, 10);
                      if (dist < minDistance) {
                          minDistance = dist;
                          bestDir = d;
                      }
                  }
                  chosenDir = bestDir;
              }
          }
          else if (bot.behaviour === 'aggresive') {
              let turnChance = bot.state === 'IDLE' ? 0.05 : 0.2;
              if (bot.state === 'DRAWING' && bot.trail.length > 10) turnChance = 0.5;
              
              if (Math.random() < turnChance) {
                  chosenDir = safeDirs[Math.floor(Math.random() * safeDirs.length)];
              }

              let targetInfo = this.findNearestEnemy(bot, 15, -1);
              if (targetInfo) {
                  let dx = targetInfo.x - bot.x;
                  let dy = targetInfo.y - bot.y;
                  let prefDirs = this.getPreferredDirs(dx, dy);
                  let validPref = prefDirs.filter(d => safeDirs.includes(d));
                  if (validPref.length > 0) chosenDir = validPref[0];
              }
          }
          else if (bot.behaviour === 'playerKiller') {
              let turnChance = bot.state === 'IDLE' ? 0.05 : 0.2;
              if (bot.state === 'DRAWING' && bot.trail.length > 10) turnChance = 0.5;
              
              if (Math.random() < turnChance) {
                  chosenDir = safeDirs[Math.floor(Math.random() * safeDirs.length)];
              }

              if (!p0.isDead) {
                  let targetInfo = this.findNearestEnemy(bot, 30, 0); 
                  if (targetInfo) {
                      let dx = targetInfo.x - bot.x;
                      let dy = targetInfo.y - bot.y;
                      let prefDirs = this.getPreferredDirs(dx, dy);
                      let validPref = prefDirs.filter(d => safeDirs.includes(d));
                      if (validPref.length > 0) chosenDir = validPref[0];
                  }
              }
          }
      }

      // --- Safety Overrides ---
      let foundOverride = false;
      for (let d of safeDirs) {
          let checkX = bot.x + this.DIRS[d].x;
          let checkY = bot.y + this.DIRS[d].y;
          if (checkX >= 0 && checkX < this.GRID_SIZE && checkY >= 0 && checkY < this.GRID_SIZE) {
              let tId = this.trailGrid[checkX][checkY];
              if (tId !== -1 && tId !== bot.id) {
                  chosenDir = d; 
                  foundOverride = true;
                  break;
              }
          }
      }

      if (!foundOverride && bot.state === 'DRAWING' && bot.trail.length > 5) {
          for (let d of safeDirs) {
              let checkX = bot.x + this.DIRS[d].x;
              let checkY = bot.y + this.DIRS[d].y;
              if (checkX >= 0 && checkX < this.GRID_SIZE && checkY >= 0 && checkY < this.GRID_SIZE) {
                  if (this.grid[checkX][checkY] === bot.id) {
                      chosenDir = d; 
                      break;
                  }
              }
          }
      }

      bot.nextDir = chosenDir;
  }

  private findNearestGrid(x: number, y: number, id: number, radius: number): number {
      let minDist = 9999;
      for(let dx = -radius; dx <= radius; dx++) {
          for(let dy = -radius; dy <= radius; dy++) {
              let nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < this.GRID_SIZE && ny >= 0 && ny < this.GRID_SIZE) {
                  if (this.grid[nx][ny] === id) {
                      let dist = Math.hypot(dx, dy);
                      if (dist < minDist) minDist = dist;
                  }
              }
          }
      }
      return minDist;
  }

  private findNearestEnemy(bot: Player, radius: number, targetId: number): {x: number, y: number} | null {
      let minDist = 9999;
      let target = null;
      this.players.forEach(p => {
          if (p.isDead || p.id === bot.id) return;
          if (targetId !== -1 && p.id !== targetId) return;
          
          let dist = Math.hypot(p.x - bot.x, p.y - bot.y);
          if (dist < radius && dist < minDist) {
              minDist = dist;
              target = {x: p.x, y: p.y};
          }
          
          p.trail.forEach(t => {
              let d2 = Math.hypot(t.x - bot.x, t.y - bot.y);
              if (d2 < radius && d2 < minDist) {
                  minDist = d2;
                  target = {x: t.x, y: t.y};
              }
          });
      });
      return target;
  }
  
  private getPreferredDirs(dx: number, dy: number): number[] {
      let dirs = [];
      if (Math.abs(dx) > Math.abs(dy)) {
          dirs.push(dx > 0 ? 3 : 1);
          dirs.push(dy > 0 ? 0 : 2);
          dirs.push(dy > 0 ? 2 : 0);
          dirs.push(dx > 0 ? 1 : 3);
      } else {
          dirs.push(dy > 0 ? 0 : 2);
          dirs.push(dx > 0 ? 3 : 1);
          dirs.push(dx > 0 ? 1 : 3);
          dirs.push(dy > 0 ? 2 : 0);
      }
      return dirs;
  }

  private updateLeaderboard(): void {
      let sorted = [...this.players].sort((a,b) => b.scoreCount - a.scoreCount);
      let list: any[] = [];
      
      let top7 = sorted.slice(0, 7);
      top7.forEach((p, index) => {
          if(!p.isDead) {
              let pct = ((p.scoreCount / (this.GRID_SIZE * this.GRID_SIZE)) * 100).toFixed(1);
              let displayName = p.id === 0 ? p.name : `${index+1}. ${p.name}`;
              list.push({
                  name: displayName,
                  pct: `${pct}%`,
                  color: p.color
              });
          }
      });
      
      this.ngZone.run(() => {
          this.leaderboard = list;
      });
  }

  private loop(timestamp: number): void {
      if (this.tools.isWindowBlurred || this.gameState !== 'PLAYING') {
         this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
         return;
      }

      let deltaTime = timestamp - this.lastTime;
      if (deltaTime > 200) {
          deltaTime = this.TICK_RATE;
      }
      this.lastTime = timestamp;

      this.players.forEach(p => {
          if (p.isDead) return;
          p.tickAccumulator += deltaTime;
          let pTickRate = this.TICK_RATE / (p.speed || 1);
          
          while (p.tickAccumulator >= pTickRate) {
              this.logicTickForPlayer(p);
              p.tickAccumulator -= pTickRate;
          }
      });

      let aliveBots = this.players.filter(p => p.id !== 0 && !p.isDead).length;
      if (aliveBots < 14 && Math.random() < 0.05) {
          let deadBot = this.players.find(p => p.id !== 0 && p.isDead);
          if (deadBot) this.reviveBot(deadBot);
      }

      this.updateLeaderboard();

      let p0 = this.players[0];
      let lerp = p0 && !p0.isDead ? p0.tickAccumulator / (this.TICK_RATE / (p0.speed || 1)) : 0;
      this.draw(lerp);

      this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  private draw(lerp: number): void {
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let mainPlayer = this.players[0];
      if (!mainPlayer) return;

      let cx = (mainPlayer.px + (mainPlayer.x - mainPlayer.px) * lerp) * this.TILE_SIZE;
      let cy = (mainPlayer.py + (mainPlayer.y - mainPlayer.py) * lerp) * this.TILE_SIZE;

      ctx.save();
      ctx.translate(canvas.width / 2 - cx, canvas.height / 2 - cy);

      ctx.strokeStyle = '#e1e8ed';
      ctx.lineWidth = 1;
      
      let startX = Math.max(0, Math.floor((cx - canvas.width / 2) / this.TILE_SIZE));
      let endX = Math.min(this.GRID_SIZE, Math.ceil((cx + canvas.width / 2) / this.TILE_SIZE));
      let startY = Math.max(0, Math.floor((cy - canvas.height / 2) / this.TILE_SIZE));
      let endY = Math.min(this.GRID_SIZE, Math.ceil((cy + canvas.height / 2) / this.TILE_SIZE));

      for(let x = startX; x <= endX; x++) {
          ctx.beginPath();
          ctx.moveTo(x * this.TILE_SIZE, startY * this.TILE_SIZE);
          ctx.lineTo(x * this.TILE_SIZE, endY * this.TILE_SIZE);
          ctx.stroke();
      }
      for(let y = startY; y <= endY; y++) {
          ctx.beginPath();
          ctx.moveTo(startX * this.TILE_SIZE, y * this.TILE_SIZE);
          ctx.lineTo(endX * this.TILE_SIZE, y * this.TILE_SIZE);
          ctx.stroke();
      }

      for(let x = startX; x < endX; x++) {
          for(let y = startY; y < endY; y++) {
              let pId = this.grid[x][y];
              if(pId !== -1) {
                  let colorObj = this.players.find(c => c.id === pId);
                  if(colorObj) {
                      ctx.fillStyle = colorObj.color;
                      ctx.fillRect(x * this.TILE_SIZE, y * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
                  }
              }
          }
      }

      for(let x = startX; x < endX; x++) {
          for(let y = startY; y < endY; y++) {
              let pId = this.trailGrid[x][y];
              if(pId !== -1) {
                  let colorObj = this.players.find(c => c.id === pId);
                  if(colorObj) {
                      ctx.fillStyle = colorObj.trailColor;
                      ctx.fillRect(x * this.TILE_SIZE, y * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
                  }
              }
          }
      }

      this.players.forEach(p => {
          if(p.isDead) return;

          let playerLerp = p.tickAccumulator / (this.TICK_RATE / (p.speed || 1));
          if (playerLerp > 1) playerLerp = 1;

          let drawX = p.px + (p.x - p.px) * playerLerp;
          let drawY = p.py + (p.y - p.py) * playerLerp;

          if (p.state === 'DRAWING') {
              ctx.fillStyle = p.trailColor;
              if (p.dir === 0) ctx.fillRect(p.x * this.TILE_SIZE, drawY * this.TILE_SIZE, this.TILE_SIZE, (p.py - drawY + 1) * this.TILE_SIZE);
              if (p.dir === 1) ctx.fillRect(p.px * this.TILE_SIZE, p.y * this.TILE_SIZE, (drawX - p.px + 1) * this.TILE_SIZE, this.TILE_SIZE);
              if (p.dir === 2) ctx.fillRect(p.x * this.TILE_SIZE, p.py * this.TILE_SIZE, this.TILE_SIZE, (drawY - p.py + 1) * this.TILE_SIZE);
              if (p.dir === 3) ctx.fillRect(drawX * this.TILE_SIZE, p.y * this.TILE_SIZE, (p.px - drawX + 1) * this.TILE_SIZE, this.TILE_SIZE);
          }

          let pad = 2;
          ctx.fillStyle = p.color;
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 5;
          ctx.shadowOffsetY = 3;
          ctx.fillRect(drawX * this.TILE_SIZE - pad, drawY * this.TILE_SIZE - pad, this.TILE_SIZE + pad*2, this.TILE_SIZE + pad*2);
          ctx.shadowColor = 'transparent'; 

          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 14px "Comic Sans MS", "Chalkboard SE", sans-serif'; // Doge/Cheems themed font
          ctx.textAlign = 'center';
          ctx.fillText(p.name, drawX * this.TILE_SIZE + (this.TILE_SIZE / 2), drawY * this.TILE_SIZE - 10);
      });

      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, this.GRID_SIZE * this.TILE_SIZE, this.GRID_SIZE * this.TILE_SIZE);

      ctx.restore();
  }

  private onKeyDown(e: KeyboardEvent): void {
      if (this.gameState !== 'PLAYING') return;
      let p = this.players[0];
      if(!p || p.isDead) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        if (e.cancelable) e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (p.dir !== 2) p.nextDir = 0; }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { if (p.dir !== 3) p.nextDir = 1; }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { if (p.dir !== 0) p.nextDir = 2; }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { if (p.dir !== 1) p.nextDir = 3; }
  }

  private onTouchStart(e: TouchEvent): void {
      if (this.gameState !== 'PLAYING') return;
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
  }

  private onTouchMove(e: TouchEvent): void {
      if (this.gameState === 'PLAYING') {
        if (e.cancelable) e.preventDefault();
      }
  }

  private onTouchEnd(e: TouchEvent): void {
      if (this.gameState !== 'PLAYING') return;
      let p = this.players[0];
      if (!p || p.isDead) return;

      if (e.changedTouches.length > 0) {
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;
        
        let dx = touchEndX - this.touchStartX;
        let dy = touchEndY - this.touchStartY;
        
        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) { if (p.dir !== 3) p.nextDir = 1; } 
                else { if (p.dir !== 1) p.nextDir = 3; } 
            } else {
                if (dy > 0) { if (p.dir !== 0) p.nextDir = 2; } 
                else { if (p.dir !== 2) p.nextDir = 0; }
            }
        }
      }
  }

  private onResize(): void {
      const canvas = this.canvasRef?.nativeElement;
      const container = this.gameContainer?.nativeElement;
      if (canvas && container) {
          canvas.width = container.clientWidth || window.innerWidth;
          canvas.height = container.clientHeight || window.innerHeight;
      }
  }

  private stopLoop(): void {
      if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
      }
  }
}
