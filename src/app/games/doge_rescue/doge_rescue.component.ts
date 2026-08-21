import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Matter from 'matter-js';
import { ToolsService } from '../../services/tools.service';

interface BlockDef {
  src?: string;
  solid?: boolean;
  spawn?: 'doge' | 'bees';
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
  private dogeBody: Matter.Body | null = null;
  private drawnLineBody: Matter.Body | null = null;
  private bees: Array<{ body: Matter.Body; position: { x: number; y: number }; velocity: { x: number; y: number }; circleRadius: number }> = [];
  
  private blocksDef: Record<string, BlockDef> = {};
  private levelsDef: LevelDef[] = [];
  private textures: Record<string, HTMLImageElement> = {};
  private mapGrid: { id: string; body: Matter.Body | null; rect: {x:number, y:number, w:number, h:number} }[][] = [];
  private beeNests: { x: number; y: number }[] = [];
  private currentLevelDef!: LevelDef;

  private currentDrawing: { x: number; y: number }[] = [];
  private isDrawing = false;
  private lineLength = 0;
  private maxLineLength = 2000;
  private animationFrameId: number | null = null;
  private attackTimer: any = null;
  private beeSpawnTimer: any = null;

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

    // Collision listener
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      if (this.gameState !== 'ATTACK') return;
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        if ((bodyA.label === 'doge' && bodyB.label === 'bee') || (bodyA.label === 'bee' && bodyB.label === 'doge')) {
          this.ngZone.run(() => {
            this.gameState = 'LOSE';
            if (this.attackTimer) clearInterval(this.attackTimer);
            if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
            this.tools.playSound('sfx_8');
          });
          return;
        }
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
    this.dogeBody = null;

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
            
            if (blockDef.solid) {
              body = Matter.Bodies.rectangle(centerX, centerY, blockW + 1, blockH + 1, {
                isStatic: true,
                friction: 1,
                restitution: 0.1
              });
              Matter.World.add(this.engine.world, body);
            }
            
            if (blockDef.spawn === 'doge') {
              this.dogeBody = Matter.Bodies.circle(centerX, centerY, blockW * 0.4, {
                restitution: 0.3,
                friction: 0.8,
                density: 0.05,
                label: 'doge'
              });
              Matter.World.add(this.engine.world, this.dogeBody);
            } else if (blockDef.spawn === 'bees') {
              this.beeNests.push({ x: centerX, y: centerY });
            }
          }
          rowArr.push({ id: blockId, body, rect });
        }
        this.mapGrid.push(rowArr);
      }
    }
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.gameState !== 'DRAWING') return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.isDrawing = true;
    this.currentDrawing = [{ x, y }];
    this.lineLength = 0;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDrawing || this.gameState !== 'DRAWING') return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    if (this.attackTimer) clearInterval(this.attackTimer);
    this.attackTimer = setInterval(() => {
      if (this.tools.isWindowBlurred) return;
      if (this.gameState === 'ATTACK') {
        this.timerDisplay--;
        if (this.timerDisplay <= 0) {
          clearInterval(this.attackTimer);
          clearInterval(this.beeSpawnTimer);
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

      // Bee AI
      if (this.dogeBody) {
        this.bees.forEach(bee => {
          const dx = this.dogeBody!.position.x - bee.body.position.x;
          const dy = this.dogeBody!.position.y - bee.body.position.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 0) {
            Matter.Body.applyForce(bee.body, bee.body.position, {
              x: (dx / dist) * this.currentLevelDef.brutality.force,
              y: (dy / dist) * this.currentLevelDef.brutality.force
            });
          }

          if (bee.body.speed > this.currentLevelDef.brutality.maxSpeed) {
            Matter.Body.setVelocity(bee.body, {
              x: (bee.body.velocity.x / bee.body.speed) * this.currentLevelDef.brutality.maxSpeed,
              y: (bee.body.velocity.y / bee.body.speed) * this.currentLevelDef.brutality.maxSpeed
            });
          }
        });
      }

      // Check Doge out of bounds
      if (this.dogeBody) {
        const canvas = this.canvasRef.nativeElement;
        if (this.dogeBody.position.y > canvas.height + 50 || this.dogeBody.position.x < -50 || this.dogeBody.position.x > canvas.width + 50) {
          this.ngZone.run(() => {
            this.gameState = 'LOSE';
            if (this.attackTimer) clearInterval(this.attackTimer);
            if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
            this.tools.playSound('sfx_8');
          });
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
          ctx.drawImage(this.textures[cell.id], cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
        }
      }
    }

    // Draw Doge
    if (this.dogeBody && this.textures['doge']) {
      ctx.save();
      ctx.translate(this.dogeBody.position.x, this.dogeBody.position.y);
      ctx.rotate(this.dogeBody.angle);
      const rad = this.dogeBody.circleRadius || 20;
      ctx.drawImage(this.textures['doge'], -rad, -rad, rad * 2, rad * 2);
      ctx.restore();
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
        // If speed is very low, stay upright or last angle, but simple rotation here is fine
        ctx.rotate(angle);
        const rad = bee.circleRadius * 1.5; // Visual size vs physics size
        ctx.drawImage(this.textures['bee'], -rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      });
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
