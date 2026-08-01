import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

interface Hoop {
  x: number;
  y: number;
  radius: number;
  scored: boolean;
  angle: number;
}

@Component({
  selector: 'app-flappy-dunk',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flappy_dunk.component.html',
  styleUrl: './flappy_dunk.component.css'
})
export class FlappyDunkComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  gameState: 'START' | 'PLAYING' | 'GAMEOVER' = 'START';
  gamePoints = 0;
  bestScore = 0;

  private ball = {
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 18,
    rotation: 0,
    wingAngle: 0
  };

  private hoops: Hoop[] = [];
  private gravity = 0.45;
  private jumpForce = -7.5;
  private scrollSpeed = 2.5;
  private animationFrameId: number | null = null;

  private onPointerDownBound = this.onTap.bind(this);
  private onKeyDownBound = this.onKeyDown.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("flappy_dunk" as any);
    this.tools.actPage = "flappy_dunk" as any;
  }

  ngAfterViewInit(): void {
    this.initGame();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onPointerDownBound);
    }
    this.tools.leaveMinigame('flappy_dunk', this.gamePoints);
  }

  startGame(): void {
    this.gamePoints = 0;
    this.gameState = 'PLAYING';
    const canvas = this.canvasRef.nativeElement;
    this.ball = {
      x: canvas.width * 0.25,
      y: canvas.height * 0.5,
      vx: 0,
      vy: 0,
      radius: 18,
      rotation: 0,
      wingAngle: 0
    };
    this.hoops = [];
    this.spawnHoop(canvas.width + 150);
    this.spawnHoop(canvas.width + 450);
  }

  private initGame(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.gameContainer.nativeElement;
    canvas.width = container.clientWidth || window.innerWidth;
    canvas.height = container.clientHeight || window.innerHeight;

    canvas.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('resize', this.onResizeBound);

    this.ngZone.runOutsideAngular(() => {
      this.loop();
    });
  }

  private onTap(): void {
    if (this.gameState === 'START' || this.gameState === 'GAMEOVER') {
      this.ngZone.run(() => this.startGame());
      return;
    }
    if (this.gameState === 'PLAYING') {
      this.ball.vy = this.jumpForce;
      this.ball.wingAngle = -0.5;
      this.tools.playSound('sfx_1');
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      this.onTap();
    }
  }

  private spawnHoop(x: number): void {
    const canvas = this.canvasRef.nativeElement;
    const minY = 140;
    const maxY = canvas.height - 140;
    const y = minY + Math.random() * (maxY - minY);
    this.hoops.push({
      x,
      y,
      radius: 45,
      scored: false,
      angle: 0
    });
  }

  private loop(): void {
    this.animationFrameId = requestAnimationFrame(() => this.loop());

    if (this.gameState === 'PLAYING') {
      const canvas = this.canvasRef.nativeElement;

      this.ball.vy += this.gravity;
      this.ball.y += this.ball.vy;
      this.ball.rotation += 0.05;
      this.ball.wingAngle *= 0.9;

      if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > canvas.height) {
        this.ngZone.run(() => this.gameOver());
      }

      for (let i = this.hoops.length - 1; i >= 0; i--) {
        const h = this.hoops[i];
        h.x -= this.scrollSpeed;

        if (!h.scored && Math.abs(this.ball.x - h.x) < 20 && Math.abs(this.ball.y - h.y) < h.radius * 0.7) {
          h.scored = true;
          this.ngZone.run(() => {
            this.gamePoints++;
            if (this.gamePoints > this.bestScore) {
              this.bestScore = this.gamePoints;
            }
            this.tools.playSound('sfx_4');
          });
        }

        if (h.x + h.radius < 0) {
          this.hoops.splice(i, 1);
          const lastX = this.hoops.length > 0 ? this.hoops[this.hoops.length - 1].x : canvas.width;
          this.spawnHoop(lastX + 320);
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

    // Draw hoops
    this.hoops.forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, h.radius, 0, Math.PI);
      ctx.stroke();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -h.radius + 10; x <= h.radius - 10; x += 15) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x * 0.7, 40);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Draw ball
    ctx.save();
    ctx.translate(this.ball.x, this.ball.y);
    ctx.rotate(this.ball.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e65100';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -this.ball.radius);
    ctx.lineTo(0, this.ball.radius);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-this.ball.radius, 0);
    ctx.lineTo(this.ball.radius, 0);
    ctx.stroke();
    ctx.restore();
  }

  private gameOver(): void {
    this.gameState = 'GAMEOVER';
    this.tools.playSound('sfx_8');
  }

  private onResize(): void {
    const canvas = this.canvasRef?.nativeElement;
    const container = this.gameContainer?.nativeElement;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }

  private stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
