import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Matter from 'matter-js';
import { ToolsService } from '../../services/tools.service';

interface BlockDef {
  src?: string;
  solid?: boolean;
  spawn?: 'doge' | 'bees';
  kills?: 'both' | 'doge' | 'bee' | 'none';
  slow_rate?: number;
  physics?: boolean | {
    have_physics: boolean;
    bounce?: boolean;
    bounce_speed?: number;
    infinite_move_x?: number;
    infinite_move_y?: number;
  };
  shape?: 'cube' | 'circle' | 'triangle_bottom' | 'triangle_top' | 'triangle_left' | 'triangle_right';
  hit_converts?: { after: number; to: string; play_sound?: string };
}

interface LevelDef {
  id: string;
  duration: number;
  beesCount: number;
  tintLimit: number;
  brutality: { maxSpeed: number; force: number };
  map: string[][];
}

@Component({
  selector: 'app-doge-rescue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doge_rescue.component.html',
  styleUrl: './doge_rescue.component.css'
})
export class DogeRescueComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  gameState: 'LOADING' | 'START' | 'DRAWING' | 'ATTACK' | 'WIN' | 'LOSE' = 'LOADING';
  gamePoints = 0;
  level = 0;
  timerDisplay = 5;

  private engine!: Matter.Engine;
  private dogeBodies: Matter.Body[] = [];
  private drawnLineBody: Matter.Body | null = null;
  private bees: Array<{ body: Matter.Body; position: { x: number; y: number }; velocity: { x: number; y: number }; circleRadius: number }> = [];
  private particles: { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number }[] = [];
  
  private blocksDef: Record<string, BlockDef> = {};
  private levelsDef: LevelDef[] = [];
  private textures: Record<string, HTMLImageElement> = {};
  private mapGrid: { id: string; body: Matter.Body | null; rect: {x:number, y:number, w:number, h:number}; r: number; c: number; convertTimer?: any }[][] = [];
  private beeNests: { x: number; y: number }[] = [];
  private currentLevelDef!: LevelDef;

  private currentDrawing: { x: number; y: number }[] = [];
  private isDrawing = false;
  private lineLength = 0;
  private maxLineLength = 2000;
  private animationFrameId: number | null = null;
  private attackTimer: any = null;
  private beeSpawnTimer: any = null;
  private flowFieldTimer: any = null;
  private flowField: number[][] | null = null;

  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("doge_rescue" as any);
    this.tools.actPage = "doge_rescue" as any;
  }

  ngAfterViewInit(): void {
    this.initPhysics();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    if (this.attackTimer) clearInterval(this.attackTimer);
    if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
    if (this.flowFieldTimer) clearInterval(this.flowFieldTimer);
    window.removeEventListener('resize', this.onResizeBound);

    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onPointerDownBound);
      canvas.removeEventListener('pointermove', this.onPointerMoveBound);
      canvas.removeEventListener('pointerup', this.onPointerUpBound);
    }
    this.tools.leaveMinigame('doge_rescue', this.gamePoints, this.level);
  }

  async loadData(): Promise<void> {
    try {
      let resBlocks = await fetch('games/doge_rescue/data/blocks.json');
      if (!resBlocks.ok) resBlocks = await fetch('/games/doge_rescue/data/blocks.json');
      this.blocksDef = await resBlocks.json();

      let resLevels = await fetch('games/doge_rescue/data/levels.json');
      if (!resLevels.ok) resLevels = await fetch('/games/doge_rescue/data/levels.json');
      const levelsData = await resLevels.json();
      this.levelsDef = levelsData.levels;

      // Preload images
      const imagesToLoad: { key: string, url: string }[] = [
        { key: 'doge', url: 'games/doge_rescue/assets/dog.png' },
        { key: 'bee', url: 'games/doge_rescue/assets/bee.png' }
      ];

      for (const blockId in this.blocksDef) {
        if (this.blocksDef[blockId].src) {
          imagesToLoad.push({ key: blockId, url: this.blocksDef[blockId].src! });
        }
      }

      await Promise.all(imagesToLoad.map(img => new Promise<void>((resolve) => {
        const image = new Image();
        image.src = img.url;
        image.onload = () => {
          this.textures[img.key] = image;
          resolve();
        };
        image.onerror = () => resolve();
      })));

      this.startLevel();
    } catch (err) {
      console.error("Error loading Doge Rescue data", err);
    }
  }

  startLevel(): void {
    this.gameState = 'DRAWING';
    
    // Choose level randomly
    const randomIdx = Math.floor(Math.random() * this.levelsDef.length);
    this.currentLevelDef = this.levelsDef[randomIdx];
    this.timerDisplay = this.currentLevelDef.duration;
    this.maxLineLength = this.currentLevelDef.tintLimit || 2000;

    this.resetPhysics();
  }

  nextLevel(): void {
    this.level++;
    this.startLevel();
  }


  private removeEntity(body: Matter.Body, type: 'doge' | 'bee', color: string): void {
    const isBee = type === 'bee';
    
    // Spawn particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: body.position.x,
        y: body.position.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color,
        life: 0,
        maxLife: 30 + Math.random() * 20
      });
    }

    if (isBee) {
      this.bees = this.bees.filter(b => b.body !== body);
      Matter.World.remove(this.engine.world, body);
    } else {
      this.dogeBodies = this.dogeBodies.filter(b => b !== body);
      Matter.World.remove(this.engine.world, body);
      this.ngZone.run(() => {
        this.gameState = 'LOSE';
        if (this.attackTimer) clearInterval(this.attackTimer);
        if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
        this.tools.playSound('sfx_8');
      });
    }
  }

  private convertBlock(cell: any, newBlockId: string): void {
    const blockDef = this.blocksDef[newBlockId];
    if (cell.body) Matter.World.remove(this.engine.world, cell.body);
    cell.id = newBlockId;
    cell.body = null;
    cell.convertTimer = null;

    if (!blockDef) return;
    if (blockDef.solid || blockDef.kills || blockDef.slow_rate || blockDef.hit_converts) {
      const hasPhys = typeof blockDef.physics === 'object' ? blockDef.physics.have_physics : !!blockDef.physics;
      const isStatic = !hasPhys;
      const isSensor = !blockDef.solid;
      
      let rest = 0.1;
      let fric = 1;
      let fricAir = 0.01;
      if (typeof blockDef.physics === 'object') {
        if (blockDef.physics.bounce) rest = 1.0;
        if (blockDef.physics.infinite_move_x || blockDef.physics.infinite_move_y) {
          fric = 0;
          fricAir = 0;
        }
      }
      
      const opts: Matter.IChamferableBodyDefinition = {
        isStatic: isStatic,
        isSensor: isSensor,
        friction: fric,
        frictionAir: fricAir,
        restitution: rest,
        label: 'block_' + newBlockId
      };
      
      const centerX = cell.rect.x + cell.rect.w / 2;
      const centerY = cell.rect.y + cell.rect.h / 2;
      
      if (blockDef.shape === 'circle') {
        cell.body = Matter.Bodies.circle(centerX, centerY, cell.rect.w / 2, opts);
      } else if (blockDef.shape === 'triangle_bottom') {
        const polygon = [
          { x: -cell.rect.w / 2, y: cell.rect.h / 2 },
          { x: cell.rect.w / 2, y: cell.rect.h / 2 },
          { x: 0, y: -cell.rect.h / 2 }
        ];
        cell.body = Matter.Bodies.fromVertices(centerX, centerY + cell.rect.h / 6, [polygon], opts);
      } else if (blockDef.shape === 'triangle_top') {
        const polygon = [
          { x: -cell.rect.w / 2, y: -cell.rect.h / 2 },
          { x: cell.rect.w / 2, y: -cell.rect.h / 2 },
          { x: 0, y: cell.rect.h / 2 }
        ];
        cell.body = Matter.Bodies.fromVertices(centerX, centerY - cell.rect.h / 6, [polygon], opts);
      } else if (blockDef.shape === 'triangle_left') {
        const polygon = [
          { x: -cell.rect.w / 2, y: -cell.rect.h / 2 },
          { x: -cell.rect.w / 2, y: cell.rect.h / 2 },
          { x: cell.rect.w / 2, y: 0 }
        ];
        cell.body = Matter.Bodies.fromVertices(centerX - cell.rect.w / 6, centerY, [polygon], opts);
      } else if (blockDef.shape === 'triangle_right') {
        const polygon = [
          { x: cell.rect.w / 2, y: -cell.rect.h / 2 },
          { x: cell.rect.w / 2, y: cell.rect.h / 2 },
          { x: -cell.rect.w / 2, y: 0 }
        ];
        cell.body = Matter.Bodies.fromVertices(centerX + cell.rect.w / 6, centerY, [polygon], opts);
      } else {
        cell.body = Matter.Bodies.rectangle(centerX, centerY, cell.rect.w + 1, cell.rect.h + 1, opts);
      }
      Matter.World.add(this.engine.world, cell.body);
    }
  }

  private initPhysics(): void {
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 1;

    const canvas = this.canvasRef.nativeElement;
    const container = this.gameContainer.nativeElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    canvas.addEventListener('pointerdown', this.onPointerDownBound);
    canvas.addEventListener('pointermove', this.onPointerMoveBound);
    canvas.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('resize', this.onResizeBound);


    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      if (this.gameState !== 'ATTACK') return;
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        
        // Check Bee vs Doge
        if ((bodyA.label === 'doge' && bodyB.label === 'bee') || (bodyA.label === 'bee' && bodyB.label === 'doge')) {
          this.ngZone.run(() => {
            this.gameState = 'LOSE';
            if (this.attackTimer) clearInterval(this.attackTimer);
            if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
            this.tools.playSound('sfx_8');
          });
          return;
        }

        const handleBlockCollision = (blockBody: Matter.Body, otherBody: Matter.Body) => {
          const isDoge = otherBody.label === 'doge';
          const isBee = otherBody.label === 'bee';
          const blockId = blockBody.label.replace('block_', '');
          const blockDef = this.blocksDef[blockId];
          
          if (!blockDef) return;

          // Kills check
          if (blockDef.kills) {
            if ((blockDef.kills === 'both' || blockDef.kills === 'doge') && isDoge) {
              this.removeEntity(otherBody, 'doge', '#ffaa00');
            }
            if ((blockDef.kills === 'both' || blockDef.kills === 'bee') && isBee) {
              this.removeEntity(otherBody, 'bee', '#ffff00');
            }
          }

          // Hit converts check
          if (blockDef.hit_converts && (isDoge || isBee || otherBody.isStatic === false)) {
            // find cell
            let targetCell: any = null;
            for (let r = 0; r < this.mapGrid.length; r++) {
              for (let c = 0; c < this.mapGrid[r].length; c++) {
                if (this.mapGrid[r][c].body === blockBody) {
                  targetCell = this.mapGrid[r][c];
                  break;
                }
              }
            }
            if (targetCell && !targetCell.convertTimer) {
              targetCell.convertTimer = setTimeout(() => {
                this.ngZone.runOutsideAngular(() => {
                  if (blockDef.hit_converts!.play_sound) {
                    this.tools.playSound(blockDef.hit_converts!.play_sound as any);
                  }
                  this.convertBlock(targetCell, blockDef.hit_converts!.to);
                });
              }, blockDef.hit_converts.after * 1000);
            }
          }
        };

        if (bodyA.label.startsWith('block_')) handleBlockCollision(bodyA, bodyB);
        if (bodyB.label.startsWith('block_')) handleBlockCollision(bodyB, bodyA);
      }
    });


    this.ngZone.runOutsideAngular(() => {
      this.loop();
    });
  }

  private resetPhysics(): void {
    Matter.World.clear(this.engine.world, false);
    this.bees = [];
    this.currentDrawing = [];
    this.isDrawing = false;
    this.lineLength = 0;
    this.drawnLineBody = null;
    this.mapGrid = [];
    this.beeNests = [];
    this.dogeBodies = [];
    this.particles = [];

    if (this.attackTimer) clearInterval(this.attackTimer);
    if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);

    const canvas = this.canvasRef.nativeElement;
    const w = canvas.width;
    const h = canvas.height;

    // Boundaries
    const wallOpts = { isStatic: true, render: { visible: false } };
    const ground = Matter.Bodies.rectangle(w / 2, h + 100, w * 2, 200, wallOpts);
    const leftWall = Matter.Bodies.rectangle(-50, h / 2, 100, h * 2, wallOpts);
    const rightWall = Matter.Bodies.rectangle(w + 50, h / 2, 100, h * 2, wallOpts);
    const ceiling = Matter.Bodies.rectangle(w / 2, -100, w * 2, 200, wallOpts);
    Matter.World.add(this.engine.world, [ground, leftWall, rightWall, ceiling]);

    // Build map
    if (this.currentLevelDef && this.currentLevelDef.map.length > 0) {
      const rows = this.currentLevelDef.map.length;
      const cols = this.currentLevelDef.map[0].length;
      const blockW = w / cols;
      const blockH = h / rows;

      for (let r = 0; r < rows; r++) {
        const rowArr = [];
        for (let c = 0; c < cols; c++) {
          const blockId = this.currentLevelDef.map[r][c];
          const blockDef = this.blocksDef[blockId];
          const rect = { x: c * blockW, y: r * blockH, w: blockW, h: blockH };
          
          let body = null;
          if (blockDef) {
            const centerX = rect.x + blockW / 2;
            const centerY = rect.y + blockH / 2;
            
            if (blockDef.spawn === 'doge') {
              const dogeBody = Matter.Bodies.circle(centerX, centerY, blockW * 0.4, {
                restitution: 0.3,
                friction: 0.8,
                density: 0.05,
                label: 'doge'
              });
              Matter.World.add(this.engine.world, dogeBody);
              this.dogeBodies.push(dogeBody);
            } else if (blockDef.spawn === 'bees') {
              this.beeNests.push({ x: centerX, y: centerY });
            } else if (blockDef.solid || blockDef.kills || blockDef.slow_rate || blockDef.hit_converts) {
              const hasPhys = typeof blockDef.physics === 'object' ? blockDef.physics.have_physics : !!blockDef.physics;
              const isStatic = !hasPhys;
              const isSensor = !blockDef.solid;
              
              let rest = 0.1;
              let fric = 1;
              let fricAir = 0.01;
              if (typeof blockDef.physics === 'object') {
                if (blockDef.physics.bounce) rest = 1.0;
                if (blockDef.physics.infinite_move_x || blockDef.physics.infinite_move_y) {
                  fric = 0;
                  fricAir = 0;
                }
              }
              
              const opts: Matter.IChamferableBodyDefinition = {
                isStatic: isStatic,
                isSensor: isSensor,
                friction: fric,
                frictionAir: fricAir,
                restitution: rest,
                label: 'block_' + blockId
              };
              
              if (blockDef.shape === 'circle') {
                body = Matter.Bodies.circle(centerX, centerY, blockW / 2, opts);
              } else if (blockDef.shape === 'triangle_bottom') {
                const polygon = [
                  { x: -blockW / 2, y: blockH / 2 },
                  { x: blockW / 2, y: blockH / 2 },
                  { x: 0, y: -blockH / 2 }
                ];
                body = Matter.Bodies.fromVertices(centerX, centerY + blockH / 6, [polygon], opts);
              } else if (blockDef.shape === 'triangle_top') {
                const polygon = [
                  { x: -blockW / 2, y: -blockH / 2 },
                  { x: blockW / 2, y: -blockH / 2 },
                  { x: 0, y: blockH / 2 }
                ];
                body = Matter.Bodies.fromVertices(centerX, centerY - blockH / 6, [polygon], opts);
              } else if (blockDef.shape === 'triangle_left') {
                const polygon = [
                  { x: -blockW / 2, y: -blockH / 2 },
                  { x: -blockW / 2, y: blockH / 2 },
                  { x: blockW / 2, y: 0 }
                ];
                body = Matter.Bodies.fromVertices(centerX - blockW / 6, centerY, [polygon], opts);
              } else if (blockDef.shape === 'triangle_right') {
                const polygon = [
                  { x: blockW / 2, y: -blockH / 2 },
                  { x: blockW / 2, y: blockH / 2 },
                  { x: -blockW / 2, y: 0 }
                ];
                body = Matter.Bodies.fromVertices(centerX + blockW / 6, centerY, [polygon], opts);
              } else {
                body = Matter.Bodies.rectangle(centerX, centerY, blockW + 1, blockH + 1, opts);
              }
              Matter.World.add(this.engine.world, body);
            }
          }
          rowArr.push({ id: blockId, body, rect, r, c });
        }
        this.mapGrid.push(rowArr);
      }
    }
  }

  private isPointInSolidBlock(x: number, y: number): boolean {
    for (let r = 0; r < this.mapGrid.length; r++) {
      for (let c = 0; c < this.mapGrid[r].length; c++) {
        const cell = this.mapGrid[r][c];
        const blockDef = this.blocksDef[cell.id];
        if (blockDef && blockDef.solid) {
          if (x >= cell.rect.x && x <= cell.rect.x + cell.rect.w &&
              y >= cell.rect.y && y <= cell.rect.y + cell.rect.h) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.gameState !== 'DRAWING') return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isPointInSolidBlock(x, y)) return;

    this.isDrawing = true;
    this.currentDrawing = [{ x, y }];
    this.lineLength = 0;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDrawing || this.gameState !== 'DRAWING') return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isPointInSolidBlock(x, y)) return;

    const last = this.currentDrawing[this.currentDrawing.length - 1];
    const dist = Math.hypot(x - last.x, y - last.y);
    if (dist > 15) {
      if (this.lineLength + dist <= this.maxLineLength) {
        this.currentDrawing.push({ x, y });
        this.lineLength += dist;
      } else {
        this.onPointerUp();
      }
    }
  }

  private onPointerUp(): void {
    if (!this.isDrawing || this.gameState !== 'DRAWING') return;
    this.isDrawing = false;
    if (this.currentDrawing.length > 2) {
      this.createPhysicalLine(this.currentDrawing);
      this.currentDrawing = [];
      this.startAttack();
    } else {
      this.currentDrawing = [];
    }
  }

  private createPhysicalLine(points: { x: number; y: number }[]): void {
    const parts: Matter.Body[] = [];
    const thickness = 14;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;

      const seg = Matter.Bodies.rectangle(cx, cy, length + 5, thickness, {
        angle: angle,
        chamfer: { radius: thickness / 2 }
      });
      parts.push(seg);
    }
    
    this.drawnLineBody = Matter.Body.create({
      parts: parts,
      friction: 0.8,
      restitution: 0.2,
      density: 0.1
    });
    Matter.World.add(this.engine.world, this.drawnLineBody);
  }

  private getBlockCost(blockDef: BlockDef | undefined): number {
    if (!blockDef) return 1;
    if (blockDef.kills === 'both' || blockDef.kills === 'bee') return 9999;
    if (blockDef.solid) {
      if (blockDef.hit_converts) return 5;
      return 1000;
    }
    return 1;
  }

  private updateFlowField(): void {
    if (this.dogeBodies.length === 0 || this.mapGrid.length === 0 || this.mapGrid[0].length === 0) return;
    
    const rows = this.mapGrid.length;
    const cols = this.mapGrid[0].length;
    const blockW = this.mapGrid[0][0].rect.w;
    const blockH = this.mapGrid[0][0].rect.h;
    
    this.flowField = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const queue: { r: number, c: number, cost: number }[] = [];
    
    this.dogeBodies.forEach(doge => {
       let r = Math.floor((doge.position.y - this.mapGrid[0][0].rect.y) / blockH);
       let c = Math.floor((doge.position.x - this.mapGrid[0][0].rect.x) / blockW);
       r = Math.max(0, Math.min(rows - 1, r));
       c = Math.max(0, Math.min(cols - 1, c));
       
       this.flowField![r][c] = 0;
       queue.push({ r, c, cost: 0 });
    });

    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    while (queue.length > 0) {
       queue.sort((a, b) => a.cost - b.cost);
       const current = queue.shift()!;
       
       if (current.cost > this.flowField![current.r][current.c]) continue;

       for (let d of dirs) {
          const nr = current.r + d[0];
          const nc = current.c + d[1];
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
             const neighborCell = this.mapGrid[nr][nc];
             const blockDef = this.blocksDef[neighborCell.id];
             
             let moveCost = this.getBlockCost(blockDef);
             if (Math.abs(d[0]) + Math.abs(d[1]) === 2) moveCost *= 1.414;
             
             const newCost = current.cost + moveCost;
             if (newCost < this.flowField![nr][nc]) {
                this.flowField![nr][nc] = newCost;
                queue.push({ r: nr, c: nc, cost: newCost });
             }
          }
       }
    }
  }

  private startAttack(): void {
    this.gameState = 'ATTACK';
    this.timerDisplay = this.currentLevelDef.duration;

    // Bee Spawning logic
    let beesSpawnedPerNest = 0;
    const spawnBees = () => {
      if (this.gameState !== 'ATTACK') return;
      if (beesSpawnedPerNest >= this.currentLevelDef.beesCount) return;

      this.beeNests.forEach(nest => {
        const beeBody = Matter.Bodies.circle(nest.x + (Math.random() - 0.5) * 20, nest.y + 20, 10, {
          restitution: 0.8,
          frictionAir: 0.05,
          density: 0.01,
          label: 'bee'
        });
        Matter.Body.setVelocity(beeBody, { x: (Math.random() - 0.5) * 4, y: Math.random() * 2 });
        Matter.World.add(this.engine.world, beeBody);
        this.bees.push({
          body: beeBody,
          position: beeBody.position,
          velocity: beeBody.velocity,
          circleRadius: 10
        });
      });
      beesSpawnedPerNest++;
    };

    // Spawn first burst
    for(let i=0; i<3 && i<this.currentLevelDef.beesCount; i++) {
        spawnBees();
    }

    if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
    this.beeSpawnTimer = setInterval(() => {
      if (this.tools.isWindowBlurred) return;
      spawnBees();
    }, 500);

    this.updateFlowField();
    if (this.flowFieldTimer) clearInterval(this.flowFieldTimer);
    this.flowFieldTimer = setInterval(() => {
      if (this.tools.isWindowBlurred) return;
      this.updateFlowField();
    }, 500);

    if (this.attackTimer) clearInterval(this.attackTimer);
    this.attackTimer = setInterval(() => {
      if (this.tools.isWindowBlurred) return;
      if (this.gameState === 'ATTACK') {
        this.timerDisplay--;
        if (this.timerDisplay <= 0) {
          clearInterval(this.attackTimer);
          clearInterval(this.beeSpawnTimer);
          clearInterval(this.flowFieldTimer);
          this.ngZone.run(() => {
            this.gamePoints += 10;
            this.gameState = 'WIN';
            this.tools.playSound('sfx_4');
          });
        }
      }
    }, 1000);
  }

  private loop(): void {
    this.animationFrameId = requestAnimationFrame(() => this.loop());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'ATTACK') {
      Matter.Engine.update(this.engine, 1000 / 60);

      // Particle update
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.life++;
        if (p.life > p.maxLife) {
          this.particles.splice(i, 1);
        }
      }

      // Water Slow Rate
      for (let r = 0; r < this.mapGrid.length; r++) {
        for (let c = 0; c < this.mapGrid[r].length; c++) {
          const cell = this.mapGrid[r][c];
          const blockDef = this.blocksDef[cell.id];
          if (blockDef && blockDef.slow_rate && cell.body) {
             const slowMultiplier = 1 - blockDef.slow_rate; // 0.128 -> 0.872
             const cellBody = cell.body as Matter.Body;
             
             this.dogeBodies.forEach(doge => {
                if (Matter.Collision.collides(doge, cellBody)) {
                    Matter.Body.setVelocity(doge, { x: doge.velocity.x * slowMultiplier, y: doge.velocity.y * slowMultiplier });
                }
             });
             this.bees.forEach(bee => {
                if (Matter.Collision.collides(bee.body, cellBody)) {
                    Matter.Body.setVelocity(bee.body, { x: bee.body.velocity.x * slowMultiplier, y: bee.body.velocity.y * slowMultiplier });
                }
             });
             if (this.drawnLineBody && Matter.Collision.collides(this.drawnLineBody, cellBody)) {
                Matter.Body.setVelocity(this.drawnLineBody, { x: this.drawnLineBody.velocity.x * slowMultiplier, y: this.drawnLineBody.velocity.y * slowMultiplier });
             }
          }
        }
      }

      // Bee AI
      if (this.dogeBodies.length > 0) {
        const blockW = this.mapGrid.length > 0 ? this.mapGrid[0][0].rect.w : 50;
        const blockH = this.mapGrid.length > 0 ? this.mapGrid[0][0].rect.h : 50;
        const startX = this.mapGrid.length > 0 ? this.mapGrid[0][0].rect.x : 0;
        const startY = this.mapGrid.length > 0 ? this.mapGrid[0][0].rect.y : 0;
        
        this.bees.forEach(bee => {
          let targetX = this.dogeBodies[0].position.x;
          let targetY = this.dogeBodies[0].position.y;

          if (this.flowField && this.mapGrid.length > 0) {
            let r = Math.floor((bee.body.position.y - startY) / blockH);
            let c = Math.floor((bee.body.position.x - startX) / blockW);
            r = Math.max(0, Math.min(this.mapGrid.length - 1, r));
            c = Math.max(0, Math.min(this.mapGrid[0].length - 1, c));
            
            let minCost = this.flowField[r][c];
            let bestR = r;
            let bestC = c;
            const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
            for (let d of dirs) {
              const nr = r + d[0];
              const nc = c + d[1];
              if (nr >= 0 && nr < this.mapGrid.length && nc >= 0 && nc < this.mapGrid[0].length) {
                if (this.flowField[nr][nc] < minCost) {
                  minCost = this.flowField[nr][nc];
                  bestR = nr;
                  bestC = nc;
                }
              }
            }
            if (minCost !== Infinity && (bestR !== r || bestC !== c)) {
              let nextR = bestR;
              let nextC = bestC;
              let nextMinCost = minCost;
              for (let d of dirs) {
                const nnr = bestR + d[0];
                const nnc = bestC + d[1];
                if (nnr >= 0 && nnr < this.mapGrid.length && nnc >= 0 && nnc < this.mapGrid[0].length) {
                  if (this.flowField[nnr][nnc] < nextMinCost) {
                    nextMinCost = this.flowField[nnr][nnc];
                    nextR = nnr;
                    nextC = nnc;
                  }
                }
              }
              targetX = (this.mapGrid[bestR][bestC].rect.x + this.mapGrid[nextR][nextC].rect.x) / 2 + blockW / 2;
              targetY = (this.mapGrid[bestR][bestC].rect.y + this.mapGrid[nextR][nextC].rect.y) / 2 + blockH / 2;
            }
          } else {
             let minDist = Infinity;
             for (let doge of this.dogeBodies) {
                const dist = Math.hypot(doge.position.x - bee.body.position.x, doge.position.y - bee.body.position.y);
                if (dist < minDist) {
                   minDist = dist;
                   targetX = doge.position.x;
                   targetY = doge.position.y;
                }
             }
          }

          const dx = targetX - bee.body.position.x;
          const dy = targetY - bee.body.position.y;
          const distToTarget = Math.hypot(dx, dy);
          
          if (distToTarget > 0) {
            const dirX = dx / distToTarget;
            const dirY = dy / distToTarget;
            
            const desiredVx = dirX * this.currentLevelDef.brutality.maxSpeed;
            const desiredVy = dirY * this.currentLevelDef.brutality.maxSpeed;
            
            const errX = desiredVx - bee.body.velocity.x;
            const errY = desiredVy - bee.body.velocity.y;
            const errMag = Math.hypot(errX, errY);
            
            if (errMag > 0) {
              Matter.Body.applyForce(bee.body, bee.body.position, {
                x: (errX / errMag) * this.currentLevelDef.brutality.force,
                y: (errY / errMag) * this.currentLevelDef.brutality.force
              });
            }
          }

          if (bee.body.speed > this.currentLevelDef.brutality.maxSpeed) {
            Matter.Body.setVelocity(bee.body, {
              x: (bee.body.velocity.x / bee.body.speed) * this.currentLevelDef.brutality.maxSpeed,
              y: (bee.body.velocity.y / bee.body.speed) * this.currentLevelDef.brutality.maxSpeed
            });
          }
        });
      }

      // Keep physics blocks moving
      const canvas = this.canvasRef.nativeElement;
      for (let r = 0; r < this.mapGrid.length; r++) {
        for (let c = 0; c < this.mapGrid[r].length; c++) {
          const cell = this.mapGrid[r][c];
          if (cell.body && !cell.body.isStatic) {
            const blockDef = this.blocksDef[cell.id];
            
            if (blockDef && typeof blockDef.physics === 'object') {
              if (blockDef.physics.infinite_move_x) {
                const targetX = blockDef.physics.infinite_move_x;
                if (Math.abs(cell.body.velocity.x) < targetX) {
                  let dirX = cell.body.velocity.x >= 0 ? 1 : -1;
                  if (cell.body.velocity.x === 0) dirX = Math.random() > 0.5 ? 1 : -1;
                  Matter.Body.setVelocity(cell.body, { x: dirX * targetX, y: cell.body.velocity.y });
                }
              }
              if (blockDef.physics.infinite_move_y) {
                const targetY = blockDef.physics.infinite_move_y;
                if (Math.abs(cell.body.velocity.y) < targetY) {
                  let dirY = cell.body.velocity.y >= 0 ? 1 : -1;
                  if (cell.body.velocity.y === 0) dirY = Math.random() > 0.5 ? 1 : -1;
                  Matter.Body.setVelocity(cell.body, { x: cell.body.velocity.x, y: dirY * targetY });
                }
              }
              if (blockDef.physics.bounce && blockDef.physics.bounce_speed) {
                 const currentSpeed = Matter.Vector.magnitude(cell.body.velocity);
                 if (currentSpeed < blockDef.physics.bounce_speed) {
                    // maintain speed slightly
                    if (currentSpeed > 0) {
                      const scale = blockDef.physics.bounce_speed / currentSpeed;
                      Matter.Body.setVelocity(cell.body, { x: cell.body.velocity.x * scale, y: cell.body.velocity.y * scale });
                    }
                 }
              }
            } else {
              // Legacy minimal horizontal movement
              if (Math.abs(cell.body.velocity.x) < 1.0) {
                const pushX = cell.body.position.x > canvas.width / 2 ? -0.001 : 0.001;
                Matter.Body.applyForce(cell.body, cell.body.position, { x: pushX, y: 0 });
              }
            }
          }
        }
      }

      // Check Doge out of bounds
      for (let doge of this.dogeBodies) {
        if (doge.position.y > canvas.height + 50 || doge.position.x < -50 || doge.position.x > canvas.width + 50) {
          this.removeEntity(doge, 'doge', '#ffaa00');
          break; // removeEntity handles LOSE state
        }
      }
    }

    this.draw();
  }

  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map Blocks
    for (let r = 0; r < this.mapGrid.length; r++) {
      for (let c = 0; c < this.mapGrid[r].length; c++) {
        const cell = this.mapGrid[r][c];
        const blockDef = this.blocksDef[cell.id];
        if (blockDef && blockDef.src && this.textures[cell.id]) {
          const hasPhys = typeof blockDef.physics === 'object' ? blockDef.physics.have_physics : !!blockDef.physics;
          ctx.save();
          if (cell.body) {
            if (blockDef.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(cell.body.position.x, cell.body.position.y, cell.rect.w / 2, 0, Math.PI * 2);
              ctx.clip();
            } else if (blockDef.shape?.startsWith('triangle') && cell.body.vertices.length >= 3) {
              ctx.beginPath();
              ctx.moveTo(cell.body.vertices[0].x, cell.body.vertices[0].y);
              ctx.lineTo(cell.body.vertices[1].x, cell.body.vertices[1].y);
              ctx.lineTo(cell.body.vertices[2].x, cell.body.vertices[2].y);
              ctx.closePath();
              ctx.clip();
            }

            if (hasPhys) {
              ctx.translate(cell.body.position.x, cell.body.position.y);
              ctx.rotate(cell.body.angle);
              let offsetX = 0, offsetY = 0;
              if (blockDef.shape === 'triangle_bottom') offsetY = -cell.rect.h / 6;
              else if (blockDef.shape === 'triangle_top') offsetY = cell.rect.h / 6;
              else if (blockDef.shape === 'triangle_left') offsetX = cell.rect.w / 6;
              else if (blockDef.shape === 'triangle_right') offsetX = -cell.rect.w / 6;
              ctx.drawImage(this.textures[cell.id], -cell.rect.w/2 + offsetX, -cell.rect.h/2 + offsetY, cell.rect.w, cell.rect.h);
            } else {
              ctx.drawImage(this.textures[cell.id], cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
            }
          } else {
            ctx.drawImage(this.textures[cell.id], cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
          }
          ctx.restore();
        }
      }
    }

    // Draw Doges
    if (this.textures['doge']) {
      for (let dogeBody of this.dogeBodies) {
        ctx.save();
        ctx.translate(dogeBody.position.x, dogeBody.position.y);
        ctx.rotate(dogeBody.angle);
        const rad = dogeBody.circleRadius || 20;
        ctx.drawImage(this.textures['doge'], -rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      }
    }

    // Draw Pre-physics Line
    if (this.isDrawing && this.currentDrawing.length > 1) {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      this.currentDrawing.forEach((p, i) => {
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    // Draw Physical Line
    if (this.drawnLineBody) {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      for (let i = 1; i < this.drawnLineBody.parts.length; i++) {
        const part = this.drawnLineBody.parts[i];
        ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
        for (let j = 1; j < part.vertices.length; j++) {
          ctx.lineTo(part.vertices[j].x, part.vertices[j].y);
        }
        ctx.lineTo(part.vertices[0].x, part.vertices[0].y);
      }
      ctx.fill();
    }

    // Draw Bees
    if (this.textures['bee']) {
      this.bees.forEach(bee => {
        ctx.save();
        ctx.translate(bee.body.position.x, bee.body.position.y);
        let angle = Math.atan2(bee.body.velocity.y, bee.body.velocity.x);
        ctx.rotate(angle);
        const rad = bee.circleRadius * 1.5;
        ctx.drawImage(this.textures['bee'], -rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      });
    }

    // Draw Particles
    for (let p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Ink Bar UI
    if (this.gameState === 'DRAWING' || this.gameState === 'ATTACK') {
      const barWidth = canvas.width * 0.8;
      const barHeight = 15;
      const x = (canvas.width - barWidth) / 2;
      const y = 80;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, 8);
      else ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();

      const remainingRatio = Math.max(0, 1 - (this.lineLength / this.maxLineLength));
      if (remainingRatio > 0) {
        ctx.fillStyle = remainingRatio > 0.25 ? '#4CAF50' : '#F44336';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barWidth * remainingRatio, barHeight, 8);
        else ctx.rect(x, y, barWidth * remainingRatio, barHeight);
        ctx.fill();
      }

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, 8);
      else ctx.rect(x, y, barWidth, barHeight);
      ctx.stroke();
    }
  }

  private onResize(): void {
    const canvas = this.canvasRef?.nativeElement;
    const container = this.gameContainer?.nativeElement;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      // We don't dynamically reconstruct map bounds on resize during active play,
      // but restarting level corrects it.
      if (this.gameState === 'START' || this.gameState === 'DRAWING') {
         this.resetPhysics();
      }
    }
  }

  private stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
