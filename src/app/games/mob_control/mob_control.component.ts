import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

interface Unit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  multiplied?: boolean;
}

interface Gate {
  x: number;
  y: number;
  width: number;
  height: number;
  multiplier: number;
  color: string;
}

@Component({
  selector: 'app-mob-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mob_control.component.html',
  styleUrl: './mob_control.component.css'
})
export class MobControlComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  gameState: 'START' | 'PLAYING' | 'WIN' | 'LOSE' = 'START';
  gamePoints = 0;
  level = 0;

  private cannonX = 200;
  private units: Unit[] = [];
  private gates: Gate[] = [];
  private enemyBaseHp = 100;
  private maxEnemyBaseHp = 100;
  private spawnCooldown = 0;
  private enemySpawnCooldown = 0;
  private animationFrameId: number | null = null;
  private isPointerDown = false;
  private pointerX = 200;

  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("mob_control" as any);
    this.tools.actPage = "mob_control" as any;
  }

  ngAfterViewInit(): void {
    this.initGame();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onPointerDownBound);
      canvas.removeEventListener('pointermove', this.onPointerMoveBound);
    }
    this.tools.leaveMinigame('mob_control', this.gamePoints, this.level);
  }

  startLevel(): void {
    this.gamePoints = 0;
    this.gameState = 'PLAYING';
    this.resetLevel();
  }

  nextLevel(): void {
    this.level++;
    this.gameState = 'PLAYING';
    this.resetLevel();
  }

  private initGame(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.gameContainer.nativeElement;
    canvas.width = container.clientWidth || 400;
    canvas.height = container.clientHeight || 600;

    canvas.addEventListener('pointerdown', this.onPointerDownBound);
    canvas.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('resize', this.onResizeBound);

    this.ngZone.runOutsideAngular(() => {
      this.loop();
    });
  }

  private resetLevel(): void {
    const canvas = this.canvasRef.nativeElement;
    this.units = [];
    this.gates = [];
    this.cannonX = canvas.width / 2;
    this.maxEnemyBaseHp = 80 + this.level * 30;
    this.enemyBaseHp = this.maxEnemyBaseHp;

    const mult1 = Math.floor(Math.random() * 2) + 2;
    const mult2 = Math.floor(Math.random() * 3) + 2;
    this.gates.push({
      x: canvas.width * 0.25,
      y: canvas.height * 0.5,
      width: canvas.width * 0.4,
      height: 25,
      multiplier: mult1,
      color: '#2196F3'
    });
    this.gates.push({
      x: canvas.width * 0.75,
      y: canvas.height * 0.5,
      width: canvas.width * 0.4,
      height: 25,
      multiplier: mult2,
      color: '#4CAF50'
    });
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.gameState !== 'PLAYING') return;
    this.isPointerDown = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.gameState !== 'PLAYING') return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
  }

  private onPointerUp(): void {
    this.isPointerDown = false;
  }

  private loop(): void {
    this.animationFrameId = requestAnimationFrame(() => this.loop());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'PLAYING') {
      const canvas = this.canvasRef.nativeElement;

      this.cannonX += (this.pointerX - this.cannonX) * 0.2;
      this.cannonX = Math.max(30, Math.min(canvas.width - 30, this.cannonX));

      if (this.isPointerDown) {
        this.spawnCooldown--;
        if (this.spawnCooldown <= 0) {
          this.units.push({
            x: this.cannonX,
            y: canvas.height - 50,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -5,
            radius: 8,
            color: '#00E5FF',
            isEnemy: false
          });
          this.spawnCooldown = 8;
          this.tools.playSound('sfx_1');
        }
      }

      this.enemySpawnCooldown--;
      if (this.enemySpawnCooldown <= 0) {
        this.units.push({
          x: 40 + Math.random() * (canvas.width - 80),
          y: 70,
          vx: (Math.random() - 0.5) * 1,
          vy: 2.2 + this.level * 0.2,
          radius: 10,
          color: '#FF5252',
          isEnemy: true
        });
        this.enemySpawnCooldown = 35 - Math.min(20, this.level * 2);
      }

      for (let i = this.units.length - 1; i >= 0; i--) {
        const u = this.units[i];
        u.x += u.vx;
        u.y += u.vy;

        if (u.x - u.radius < 0 || u.x + u.radius > canvas.width) {
          u.vx *= -1;
        }

        if (!u.isEnemy) {
          this.gates.forEach(g => {
            if (u.y - u.radius <= g.y + g.height / 2 && u.y + u.radius >= g.y - g.height / 2 &&
                u.x >= g.x - g.width / 2 && u.x <= g.x + g.width / 2 && !u.multiplied) {
              u.multiplied = true;
              for (let m = 1; m < g.multiplier; m++) {
                this.units.push({
                  x: u.x + (Math.random() - 0.5) * 20,
                  y: u.y + (Math.random() - 0.5) * 10,
                  vx: u.vx + (Math.random() - 0.5) * 2,
                  vy: u.vy,
                  radius: 8,
                  color: '#00E5FF',
                  isEnemy: false,
                  multiplied: true
                });
              }
            }
          });

          if (u.y < 45) {
            this.enemyBaseHp -= 2;
            this.ngZone.run(() => {
              this.gamePoints += 2;
            });
            this.units.splice(i, 1);
            if (this.enemyBaseHp <= 0) {
              this.ngZone.run(() => {
                this.gamePoints += 50;
                this.gameState = 'WIN';
                this.tools.playSound('sfx_4');
              });
            }
            continue;
          }
        } else {
          if (u.y > canvas.height - 30) {
            this.ngZone.run(() => {
              this.gameState = 'LOSE';
              this.tools.playSound('sfx_8');
            });
            break;
          }
        }

        for (let j = i - 1; j >= 0; j--) {
          const u2 = this.units[j];
          if (u.isEnemy !== u2.isEnemy) {
            const dist = Math.hypot(u.x - u2.x, u.y - u2.y);
            if (dist < u.radius + u2.radius) {
              this.units.splice(i, 1);
              this.units.splice(j, 1);
              if (!u.isEnemy || !u2.isEnemy) {
                this.ngZone.run(() => {
                  this.gamePoints += 5;
                });
              }
              break;
            }
          }
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

    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(20, 10, canvas.width - 40, 30);
    ctx.fillStyle = '#4CAF50';
    const hpWidth = Math.max(0, ((canvas.width - 40) * this.enemyBaseHp) / this.maxEnemyBaseHp);
    ctx.fillRect(20, 10, hpWidth, 30);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 10, canvas.width - 40, 30);

    this.gates.forEach(g => {
      ctx.fillStyle = g.color;
      ctx.fillRect(g.x - g.width / 2, g.y - g.height / 2, g.width, g.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${g.multiplier}`, g.x, g.y);
    });

    ctx.fillStyle = '#607D8B';
    ctx.fillRect(this.cannonX - 20, canvas.height - 35, 40, 25);
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(this.cannonX - 8, canvas.height - 45, 16, 15);

    this.units.forEach(u => {
      ctx.fillStyle = u.color;
      ctx.beginPath();
      ctx.arc(u.x, u.y, u.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    });
  }

  private onResize(): void {
    const canvas = this.canvasRef?.nativeElement;
    const container = this.gameContainer?.nativeElement;
    if (canvas && container) {
      canvas.width = container.clientWidth || 400;
      canvas.height = container.clientHeight || 600;
    }
  }

  private stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
