import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

export interface LevelConfig {
  id: string;
  levelSpeed: number;
  baskestsCount: number;
  basketSize: number;
  basketInclinationGrades: number;
  basketInclinationType: string;
  basketSeparation: number;
  basketColor: string;
  basketNetColor: string;
  ballSize: number;
  ballColor: string;
  ballLinesColor: string;
  ballWingsColor: string;
  bgColor: string;
  bgLinesColor: string;
  bgFigure: string;
}

interface Hoop {
  x: number;
  y: number;
  passed: boolean;
  swish: boolean;
  scored: boolean;
  color: string;
  rotation: number;
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

interface FinishLine {
  x: number;
  passed: boolean;
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
  private elRef: ElementRef = inject(ElementRef);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  gameState: 'START' | 'PLAYING' | 'GAMEOVER' | 'LEVEL_CLEAR' = 'START';
  
  levels: LevelConfig[] = [];
  currentLevelIndex = 0;
  currentLevelConfig: LevelConfig | null = null;
  
  gamePoints = 0;
  sessionPoints = 0;
  
  private combo = 1;
  private frames = 0;
  private bgOffset = 0;
  private bgFigureOffset = 0;

  private ball = {
    x: 0,
    y: 0,
    vy: 0,
    radius: 18,
    gravity: 0.35,
    jump: -7.5,
    rotation: 0,
    wingAngle: 0,
    prevX: 0,
    prevY: 0
  };

  private hoops: Hoop[] = [];
  private particles: Particle[] = [];
  private finishLine: FinishLine | null = null;
  private basketsSpawned = 0;
  private basketsPassed = 0;
  
  private rimRadius = 6;
  private animationFrameId: number | null = null;
  private ctx!: CanvasRenderingContext2D;

  private onPointerDownBound = this.onTap.bind(this);
  private onKeyDownBound = this.onKeyDown.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("flappy_dunk" as any);
    this.tools.actPage = "flappy_dunk" as any;
    this.sessionPoints = 0;
    this.currentLevelIndex = 0;

    fetch('games/flappy_dunk/data/levels.json')
      .then(res => res.json())
      .then((data: LevelConfig[]) => {
        this.levels = data;
        this.loadLevel(this.currentLevelIndex);
      })
      .catch(err => console.error("Could not load levels.json", err));
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    this.onResize();
    const host = this.elRef.nativeElement;
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.onResizeBound);
      host.addEventListener('mousedown', this.onPointerDownBound);
      host.addEventListener('touchstart', this.onPointerDownBound, { passive: false });
      window.addEventListener('keydown', this.onKeyDownBound);
    });
    
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
    
    const host = this.elRef.nativeElement;
    host.removeEventListener('mousedown', this.onPointerDownBound);
    host.removeEventListener('touchstart', this.onPointerDownBound);
    
    this.tools.leaveMinigame('flappy_dunk', this.sessionPoints);
  }

  private onResize(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  loadLevel(index: number) {
    if (this.levels.length === 0) return;
    this.currentLevelIndex = index;
    const randomIndex = Math.floor(Math.random() * this.levels.length);
    this.currentLevelConfig = this.levels[randomIndex];
    this.initGameState();
  }

  initGameState(): void {
    if (!this.canvasRef || !this.currentLevelConfig) return;
    const canvas = this.canvasRef.nativeElement;
    
    this.ball.x = canvas.width * 0.3;
    this.ball.y = canvas.height / 2;
    this.ball.vy = 0;
    this.ball.rotation = 0;
    this.ball.radius = this.currentLevelConfig.ballSize;
    
    this.hoops = [];
    this.particles = [];
    this.finishLine = null;
    this.basketsSpawned = 0;
    this.basketsPassed = 0;
    
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

  private winLevel(): void {
    this.ngZone.run(() => {
      this.gameState = 'LEVEL_CLEAR';
      this.currentLevelIndex++;
      this.createExplosion(this.ball.x, this.ball.y, '#4CAF50');
      this.tools.playSound('sfx_4');
    });
  }

  private endGame(): void {
    this.ngZone.run(() => {
      if (this.currentLevelConfig?.baskestsCount === 0 && this.basketsPassed >= 1) {
        this.winLevel();
      } else {
        this.gameState = 'GAMEOVER';
        this.createExplosion(this.ball.x, this.ball.y, '#e65100');
        this.tools.playSound('sfx_3');
      }
    });
  }

  private onTap(e?: Event): void {
    if (e && e.type === 'touchstart') e.preventDefault();
    this.ngZone.run(() => {
      if (this.gameState === 'START') {
        this.startGame();
      } else if (this.gameState === 'PLAYING') {
        this.flap();
      } else if (this.gameState === 'LEVEL_CLEAR' || this.gameState === 'GAMEOVER') {
        // If clicking during game over, reset or next level
        if (this.gameState === 'LEVEL_CLEAR') {
           this.loadLevel(this.currentLevelIndex);
        } else {
           this.loadLevel(this.currentLevelIndex); // Retry same level
        }
      }
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.key === ' ') {
      if (e.cancelable) {
        e.preventDefault();
      }
      this.onTap();
    }
  }

  private flap(): void {
    if (this.gameState === 'PLAYING') {
      this.ball.vy = this.ball.jump;
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: this.ball.x - 15, y: this.ball.y,
          vx: (Math.random() - 0.5) * 2 - 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1, color: '#fff', size: Math.random() * 3 + 2
        });
      }
      this.tools.playSound('sfx_1');
    }
  }

  private spawnHoop(xPos: number): void {
    if (!this.currentLevelConfig) return;
    const config = this.currentLevelConfig;
    
    if (config.baskestsCount > 0 && this.basketsSpawned >= config.baskestsCount) {
      if (!this.finishLine) {
        this.finishLine = { x: xPos, passed: false };
      }
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const minY = 200;
    const maxY = canvas.height - 200;
    const yPos = Math.random() * (maxY - minY) + minY;
    
    let rotation = 0;
    if (config.basketInclinationGrades > 0) {
      const maxRad = config.basketInclinationGrades * (Math.PI / 180);
      if (config.basketInclinationType === 'aligned') {
        rotation = maxRad;
      } else if (config.basketInclinationType === 'serpent') {
        rotation = (this.basketsSpawned % 2 === 0) ? maxRad : -maxRad;
      } else if (config.basketInclinationType === 'random') {
        rotation = (Math.random() * 2 * maxRad) - maxRad;
      }
    }

    this.hoops.push({
      x: xPos,
      y: yPos,
      passed: false,
      swish: true,
      scored: false,
      color: config.basketColor,
      rotation: rotation
    });
    this.basketsSpawned++;
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
    if (this.tools.isWindowBlurred) {
       this.animationFrameId = requestAnimationFrame(() => this.loop());
       return;
    }
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private update(): void {
    if (!this.canvasRef || !this.currentLevelConfig) return;
    const canvas = this.canvasRef.nativeElement;
    const config = this.currentLevelConfig;

    if (this.gameState === 'PLAYING') {
      this.frames++;
      this.bgOffset -= config.levelSpeed * 0.1; // Slower grid scrolling as requested


      this.ball.prevX = this.ball.x;
      this.ball.prevY = this.ball.y;
      
      this.ball.vy += this.ball.gravity;
      this.ball.y += this.ball.vy;
      this.ball.rotation += this.ball.vy * 0.05;
      this.ball.wingAngle = Math.max(-0.5, Math.min(0.5, this.ball.vy * 0.1));

      if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > canvas.height) {
        this.endGame();
      }

      if (this.finishLine) {
        this.finishLine.x -= config.levelSpeed;
        if (this.ball.x > this.finishLine.x && !this.finishLine.passed) {
          this.finishLine.passed = true;
          this.winLevel();
        }
      } else {
        if (this.hoops.length > 0) {
          let lastHoop = this.hoops[this.hoops.length - 1];
          let sep = config.basketSize * config.basketSeparation;
          if (canvas.width - lastHoop.x >= sep) {
            this.spawnHoop(canvas.width + 100);
          }
        }
      }

      for (let i = 0; i < this.hoops.length; i++) {
        let h = this.hoops[i];
        h.x -= config.levelSpeed;

        let rotLeftX = h.x + (-config.basketSize/2 * Math.cos(h.rotation));
        let rotLeftY = h.y + (-config.basketSize/2 * Math.sin(h.rotation));
        let rotRightX = h.x + (config.basketSize/2 * Math.cos(h.rotation));
        let rotRightY = h.y + (config.basketSize/2 * Math.sin(h.rotation));

        let distL = Math.hypot(this.ball.x - rotLeftX, this.ball.y - rotLeftY);
        let distR = Math.hypot(this.ball.x - rotRightX, this.ball.y - rotRightY);

        if (distL < this.ball.radius + this.rimRadius || distR < this.ball.radius + this.rimRadius) {
          this.ball.vy = -Math.abs(this.ball.vy) * 0.7 - 2;
          h.swish = false;
          this.createExplosion(distL < distR ? rotLeftX : rotRightX, distL < distR ? rotLeftY : rotRightY, '#fff');
          this.tools.playSound('sfx_1'); 
        }

        let dxPrev = this.ball.prevX - h.x;
        let dyPrev = this.ball.prevY - h.y;
        let localPrevY = h.y + (dxPrev * Math.sin(-h.rotation) + dyPrev * Math.cos(-h.rotation));
        
        let dxCurr = this.ball.x - h.x;
        let dyCurr = this.ball.y - h.y;
        let localCurrX = h.x + (dxCurr * Math.cos(-h.rotation) - dyCurr * Math.sin(-h.rotation));
        let localCurrY = h.y + (dxCurr * Math.sin(-h.rotation) + dyCurr * Math.cos(-h.rotation));

        if (!h.scored && localPrevY <= h.y && localCurrY > h.y) {
          if (localCurrX > h.x - config.basketSize / 2 && localCurrX < h.x + config.basketSize / 2) {
            h.scored = true;
            this.basketsPassed++;
            
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
              this.sessionPoints += pts;
              this.tools.playSound('sfx_1');
            });

            const scoreUI = document.getElementById('scoreUI');
            if (scoreUI) {
              scoreUI.style.transform = 'scale(1.3)';
              setTimeout(() => { scoreUI.style.transform = 'scale(1)'; }, 100);
            }
            this.createExplosion(this.ball.x, h.y, h.swish ? '#FFEB3B' : '#4CAF50');
          }
        }

        if (!h.scored && h.x < this.ball.x - config.basketSize && !h.passed) {
          h.passed = true;
          this.endGame();
        }
      }

      if (this.hoops.length > 0 && this.hoops[0].x < -300) {
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

  private drawBgFigures(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: LevelConfig) {
    if (!config.bgFigure || config.bgFigure === 'none') return;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    
    // Draw figures across the background that scroll slower than the main grid
    const parallaxOffset = this.bgOffset * 0.5;
    const spacing = 100; // Align with the big grid spacing
    
    for (let x = (parallaxOffset % spacing) - spacing; x < canvas.width + spacing; x += spacing) {
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.save();
        ctx.translate(x + spacing/2, y + spacing/2);
        
        ctx.beginPath();
        let size = 40;
        
        if (config.bgFigure === 'squares') {
          ctx.rect(-size/2, -size/2, size, size);
        } else if (config.bgFigure === 'triangles') {
          ctx.moveTo(0, -size/2); ctx.lineTo(size/2, size/2); ctx.lineTo(-size/2, size/2); ctx.closePath();
        } else if (config.bgFigure === 'diamonds') {
          ctx.moveTo(0, -size/2); ctx.lineTo(size/2, 0); ctx.lineTo(0, size/2); ctx.lineTo(-size/2, 0); ctx.closePath();
        } else if (config.bgFigure === 'pentagons') {
          for(let j=0; j<5; j++) {
            ctx.lineTo(size/2 * Math.cos(j * 2 * Math.PI / 5 - Math.PI/2), size/2 * Math.sin(j * 2 * Math.PI / 5 - Math.PI/2));
          }
          ctx.closePath();
        } else if (config.bgFigure === 'hexagons') {
          for(let j=0; j<6; j++) {
            ctx.lineTo(size/2 * Math.cos(j * 2 * Math.PI / 6), size/2 * Math.sin(j * 2 * Math.PI / 6));
          }
          ctx.closePath();
        } else if (config.bgFigure === 'stars') {
          for(let j=0; j<10; j++) {
            let r = j%2===0 ? size/2 : size/4;
            ctx.lineTo(r * Math.cos(j * Math.PI / 5 - Math.PI/2), r * Math.sin(j * Math.PI / 5 - Math.PI/2));
          }
          ctx.closePath();
        }
        
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  private draw(): void {
    if (!this.canvasRef || !this.currentLevelConfig) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const config = this.currentLevelConfig;
    
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    this.drawBgFigures(ctx, canvas, config);
    
    // Big Grid (only big squares)
    ctx.save();
    ctx.beginPath();
    for (let x = this.bgOffset % 100; x < canvas.width; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let y = 0; y < canvas.height; y += 100) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.strokeStyle = config.bgLinesColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    if (this.finishLine) {
      ctx.save();
      ctx.translate(this.finishLine.x, 0);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(-20, 0, 40, canvas.height);
      for(let yy=0; yy<canvas.height; yy+=40) {
        ctx.fillStyle = (yy/40)%2===0 ? '#000' : '#fff';
        ctx.fillRect(-10, yy, 10, 20);
        ctx.fillStyle = (yy/40)%2===0 ? '#fff' : '#000';
        ctx.fillRect(0, yy, 10, 20);
      }
      ctx.restore();
    }

    this.hoops.forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      
      ctx.beginPath();
      ctx.moveTo(-config.basketSize / 2, 0);
      ctx.lineTo(-config.basketSize / 2 + 15, 70);
      ctx.lineTo(config.basketSize / 2 - 15, 70);
      ctx.lineTo(config.basketSize / 2, 0);
      ctx.fillStyle = config.basketNetColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = config.basketNetColor;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, config.basketSize / 2, 10, 0, Math.PI, 0);
      ctx.strokeStyle = config.basketColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, config.basketSize / 2, 10, 0, 0, Math.PI);
      ctx.strokeStyle = config.basketColor;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = config.basketColor;
      ctx.beginPath(); ctx.arc(-config.basketSize / 2, 0, this.rimRadius, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(config.basketSize / 2, 0, this.rimRadius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
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
      
      ctx.fillStyle = config.ballWingsColor;
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

      ctx.rotate(this.ball.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = config.ballColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = config.ballLinesColor;
      ctx.stroke();

      ctx.beginPath(); ctx.moveTo(0, -this.ball.radius); ctx.lineTo(0, this.ball.radius); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-this.ball.radius, 0); ctx.lineTo(this.ball.radius, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(-this.ball.radius, 0, this.ball.radius * 0.7, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(this.ball.radius, 0, this.ball.radius * 0.7, Math.PI / 2, Math.PI * 1.5); ctx.stroke();

      ctx.restore();
    }
  }
}
