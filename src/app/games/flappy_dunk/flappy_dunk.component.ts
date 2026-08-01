import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

interface Hoop {
  x: number;
  y: number;
  passed: boolean;
  swish: boolean;
  scored: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
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
  private renderer: Renderer2 = inject(Renderer2);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  gameState: 'START' | 'PLAYING' | 'GAMEOVER' = 'START';
  gamePoints = 0;
  
  private combo = 1;
  private frames = 0;
  private bgOffset = 0;

  private ball = {
    x: 0,
    y: 0,
    vy: 0,
    radius: 18,
    gravity: 0.35,
    jump: -7.5,
    rotation: 0,
    wingAngle: 0
  };

  private hoops: Hoop[] = [];
  private particles: Particle[] = [];
  
  private hoopSpeed = 4;
  private hoopWidth = 110;
  private rimRadius = 6;

  private animationFrameId: number | null = null;
  private ctx!: CanvasRenderingContext2D;

  private onPointerDownBound = this.onTap.bind(this);
  private onKeyDownBound = this.onKeyDown.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("flappy_dunk" as any);
    this.tools.actPage = "flappy_dunk" as any;
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    this.onResize();
    window.addEventListener('resize', this.onResizeBound);
    
    // Using renderer to bind to document
    document.addEventListener('mousedown', this.onPointerDownBound);
    document.addEventListener('touchstart', this.onPointerDownBound, { passive: false });
    window.addEventListener('keydown', this.onKeyDownBound);
    
    this.initGameState();
    
    this.ngZone.runOutsideAngular(() => {
      this.loop();
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    document.removeEventListener('mousedown', this.onPointerDownBound);
    document.removeEventListener('touchstart', this.onPointerDownBound);
    
    this.tools.leaveMinigame('flappy_dunk', this.tools.sessionPoints);
  }

  private onResize(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  initGameState(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ball.x = canvas.width * 0.3;
    this.ball.y = canvas.height / 2;
    this.ball.vy = 0;
    this.ball.rotation = 0;
    
    this.hoops = [];
    this.particles = [];
    
    this.gamePoints = 0;
    this.combo = 1;
    this.frames = 0;
    
    this.gameState = 'START';
    this.spawnHoop(canvas.width + 200);
  }

  startGame(): void {
    this.gameState = 'PLAYING';
    this.flap();
  }

  private endGame(): void {
    this.ngZone.run(() => {
      this.gameState = 'GAMEOVER';
      this.createExplosion(this.ball.x, this.ball.y, '#e65100');
    });
  }

  private onTap(e?: Event): void {
    if (e && e.type === 'touchstart') e.preventDefault();
    this.ngZone.run(() => {
      if (this.gameState === 'START') {
        this.startGame();
      } else if (this.gameState === 'PLAYING') {
        this.flap();
      }
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      this.onTap();
    }
  }

  private flap(): void {
    if (this.gameState === 'PLAYING') {
      this.ball.vy = this.ball.jump;
      // Add tiny particles on flap
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: this.ball.x - 15, y: this.ball.y,
          vx: (Math.random() - 0.5) * 2 - 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1, color: '#fff', size: Math.random() * 3 + 2
        });
      }
      this.tools.playSound('sfx_1'); // Use a generic valid sound
    }
  }

  private spawnHoop(xPos: number): void {
    const canvas = this.canvasRef.nativeElement;
    const minY = 200;
    const maxY = canvas.height - 200;
    const yPos = Math.random() * (maxY - minY) + minY;

    this.hoops.push({
      x: xPos,
      y: yPos,
      passed: false,
      swish: true,
      scored: false,
      color: '#9C27B0'
    });
  }

  private createExplosion(x: number, y: number, color: string): void {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1, color: color, size: Math.random() * 6 + 2
      });
    }
  }

  private showPopup(text: string, x: number, y: number, isSwish: boolean): void {
    const el = this.renderer.createElement('div');
    this.renderer.addClass(el, 'swish-text');
    this.renderer.setProperty(el, 'innerText', text);
    this.renderer.setStyle(el, 'left', `${x}px`);
    this.renderer.setStyle(el, 'top', `${y}px`);
    
    if (isSwish) {
      this.renderer.setStyle(el, 'color', '#FFEB3B');
      this.renderer.setStyle(el, 'textShadow', '0 2px 10px #FF9800');
    } else {
      this.renderer.setStyle(el, 'color', '#fff');
    }
    
    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) {
      this.renderer.appendChild(uiLayer, el);
      setTimeout(() => {
        if (el.parentNode) {
          this.renderer.removeChild(el.parentNode, el);
        }
      }, 1000);
    }
  }

  private loop(): void {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private update(): void {
    const canvas = this.canvasRef.nativeElement;

    if (this.gameState === 'PLAYING') {
      this.frames++;
      this.bgOffset -= 0.5;

      let prevY = this.ball.y;
      this.ball.vy += this.ball.gravity;
      this.ball.y += this.ball.vy;
      this.ball.rotation += this.ball.vy * 0.05;
      this.ball.wingAngle = Math.max(-0.5, Math.min(0.5, this.ball.vy * 0.1));

      // Bounds check
      if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > canvas.height) {
        this.endGame();
      }

      // Hoop Logic
      if (this.hoops.length > 0) {
        let lastHoop = this.hoops[this.hoops.length - 1];
        if (lastHoop.x < canvas.width - 350) {
          this.spawnHoop(canvas.width + 100);
        }
      }

      for (let i = 0; i < this.hoops.length; i++) {
        let h = this.hoops[i];
        h.x -= this.hoopSpeed;

        let leftRim = { x: h.x - this.hoopWidth / 2, y: h.y };
        let rightRim = { x: h.x + this.hoopWidth / 2, y: h.y };

        let distL = Math.hypot(this.ball.x - leftRim.x, this.ball.y - leftRim.y);
        let distR = Math.hypot(this.ball.x - rightRim.x, this.ball.y - rightRim.y);

        if (distL < this.ball.radius + this.rimRadius || distR < this.ball.radius + this.rimRadius) {
          this.ball.vy = -Math.abs(this.ball.vy) * 0.7 - 2;
          h.swish = false;
          this.createExplosion(distL < distR ? leftRim.x : rightRim.x, h.y, '#fff');
          this.tools.playSound('sfx_1'); // Hit rim sound
        }

        // Scoring Logic
        if (!h.scored && prevY <= h.y && this.ball.y > h.y) {
          if (this.ball.x > leftRim.x && this.ball.x < rightRim.x) {
            h.scored = true;
            
            let pts = 1;
            if (h.swish) {
              this.combo++;
              pts = this.combo;
              this.ngZone.run(() => {
                this.showPopup("SWISH! +" + pts, this.ball.x, this.ball.y - 40, true);
              });
            } else {
              this.combo = 1;
              this.ngZone.run(() => {
                this.showPopup("+" + pts, this.ball.x, this.ball.y - 40, false);
              });
            }
            
            this.ngZone.run(() => {
              this.gamePoints += pts;
              this.tools.sessionPoints += pts;
              this.tools.playSound('sfx_1'); // Score sound
            });

            const scoreUI = document.getElementById('scoreUI');
            if (scoreUI) {
              scoreUI.style.transform = 'scale(1.3)';
              setTimeout(() => { scoreUI.style.transform = 'scale(1)'; }, 100);
            }

            this.createExplosion(this.ball.x, h.y, h.swish ? '#FFEB3B' : '#4CAF50');
          }
        }

        // Miss condition
        if (!h.scored && h.x < this.ball.x - this.hoopWidth && !h.passed) {
          h.passed = true;
          this.endGame();
        }
      }

      if (this.hoops.length > 0 && this.hoops[0].x < -200) {
        this.hoops.shift();
      }
    } else if (this.gameState === 'START') {
      this.ball.y = canvas.height / 2 + Math.sin(Date.now() / 200) * 10;
      this.ball.wingAngle = Math.sin(Date.now() / 150) * 0.5;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    canvas.style.backgroundPosition = `${this.bgOffset}px 0px, ${this.bgOffset}px 0px, ${this.bgOffset / 2}px 0px, ${this.bgOffset / 2}px 0px`;

    this.hoops.forEach(h => {
      // Back of the net
      ctx.beginPath();
      ctx.moveTo(h.x - this.hoopWidth / 2, h.y);
      ctx.lineTo(h.x - this.hoopWidth / 2 + 15, h.y + 70);
      ctx.lineTo(h.x + this.hoopWidth / 2 - 15, h.y + 70);
      ctx.lineTo(h.x + this.hoopWidth / 2, h.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.stroke();

      // Back rim
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, this.hoopWidth / 2, 10, 0, Math.PI, 0);
      ctx.strokeStyle = '#7B1FA2';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Front rim
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, this.hoopWidth / 2, 10, 0, 0, Math.PI);
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 6;
      ctx.stroke();

      // Rim connectors
      ctx.fillStyle = h.color;
      ctx.beginPath(); ctx.arc(h.x - this.hoopWidth / 2, h.y, this.rimRadius, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(h.x + this.hoopWidth / 2, h.y, this.rimRadius, 0, Math.PI * 2); ctx.fill();
    });

    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    if (this.gameState !== 'GAMEOVER' || this.particles.length > 0) {
      ctx.save();
      ctx.translate(this.ball.x, this.ball.y);
      
      // Wings
      ctx.fillStyle = '#fff';
      ctx.save();
      ctx.translate(-this.ball.radius, -5);
      ctx.rotate(this.ball.wingAngle);
      ctx.beginPath(); ctx.ellipse(-10, 0, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(this.ball.radius, -5);
      ctx.rotate(-this.ball.wingAngle);
      ctx.beginPath(); ctx.ellipse(10, 0, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Ball Body
      ctx.rotate(this.ball.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#e65100';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#333';
      ctx.stroke();

      // Basketball Lines
      ctx.beginPath(); ctx.moveTo(0, -this.ball.radius); ctx.lineTo(0, this.ball.radius); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-this.ball.radius, 0); ctx.lineTo(this.ball.radius, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(-this.ball.radius, 0, this.ball.radius * 0.7, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(this.ball.radius, 0, this.ball.radius * 0.7, Math.PI / 2, Math.PI * 1.5); ctx.stroke();

      ctx.restore();
    }
  }
}
