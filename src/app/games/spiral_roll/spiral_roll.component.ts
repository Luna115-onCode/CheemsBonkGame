import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-spiral-roll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spiral_roll.component.html',
  styleUrl: './spiral_roll.component.css'
})
export class SpiralRollComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;

  gameState: 'START' | 'PLAYING' | 'WIN' | 'LOSE' = 'START';
  sessionPoints = 0;
  levelPoints = 0;
  level = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private playerGroup!: THREE.Group;
  private blade!: THREE.Mesh;
  private handle!: THREE.Mesh;
  private activeRoll: THREE.Mesh | null = null;
  private rollRadius = 0;
  private maxRollRadius = 3.0;
  private launchedRolls: Array<{ mesh: THREE.Mesh; radius: number; speed: number; combo: number }> = [];
  
  // Game Objects
  private obstacles: Array<{ mesh: THREE.Mesh; active: boolean; type: string }> = [];
  private coins: Array<{ mesh: THREE.Mesh; active: boolean; color: string }> = [];
  private particles: Array<{ mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }> = [];
  private floatingTexts: Array<{ sprite: THREE.Sprite; life: number }> = [];
  private multiplierStairs: THREE.Group | null = null;
  
  private finishLineZ = -300;
  private finishLine!: THREE.Mesh;
  private trackLength = 300;
  private isHolding = false;
  private animationFrameId: number | null = null;
  private speed = 0.3;
  private baseSpeed = 0.3;
  private speedMultiplier = 1;

  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onResizeBound = this.onResize.bind(this);

  // Materials
  private woodMat!: THREE.MeshLambertMaterial;
  private spiralMat!: THREE.MeshLambertMaterial;
  private metalMat!: THREE.MeshLambertMaterial;
  private handleMat!: THREE.MeshLambertMaterial;
  private waterMat!: THREE.MeshLambertMaterial;
  private obstacleMat!: THREE.MeshLambertMaterial;
  private stoneMat!: THREE.MeshLambertMaterial;
  private enemyMat!: THREE.MeshLambertMaterial;
  private coinTex!: THREE.Texture;

  private onKeyDownBound = this.onKeyDown.bind(this);
  private onKeyUpBound = this.onKeyUp.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("spiral_roll" as any);
    this.tools.actPage = "spiral_roll" as any;
  }

  ngAfterViewInit(): void {
    this.init3D();
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
  }

  private disposeThreeObjects(obj: any) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat: any) => mat.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.children) {
      obj.children.forEach((child: any) => this.disposeThreeObjects(child));
    }
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    
    if (this.scene) {
      this.disposeThreeObjects(this.scene);
    }

    if (this.renderer) {
      this.renderer.dispose();
      const dom = this.gameContainer?.nativeElement;
      if (dom && dom.contains(this.renderer.domElement)) {
        dom.removeChild(this.renderer.domElement);
      }
    }
    // Only sessionPoints are converted to MG Coins when exiting
    this.tools.leaveMinigame('spiral_roll', this.sessionPoints, this.level);
  }

  startGame(): void {
    if (this.gameState === 'START' || this.gameState === 'LOSE') {
      this.levelPoints = 0;
    }
    this.gameState = 'PLAYING';
    this.resetLevel();
  }

  nextLevel(): void {
    this.level++;
    this.gameState = 'PLAYING';
    this.resetLevel();
  }

  private init3D(): void {
    const container = this.gameContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);
    this.camera.position.set(4, 5, 8);
    this.camera.lookAt(0, 0, -5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(-10, 20, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    this.scene.add(dirLight);

    // Textures & Materials
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 256; texCanvas.height = 256;
    const tCtx = texCanvas.getContext('2d')!;
    tCtx.fillStyle = '#f4a261';
    tCtx.fillRect(0, 0, 256, 256);
    tCtx.fillStyle = '#e76f51';
    tCtx.save();
    tCtx.translate(128, 128);
    tCtx.rotate(Math.PI / 4);
    for(let i = -300; i < 300; i += 32) {
      tCtx.fillRect(i, -300, 16, 600);
    }
    tCtx.restore();

    const spiralTex = new THREE.CanvasTexture(texCanvas);
    spiralTex.wrapS = THREE.RepeatWrapping;
    spiralTex.wrapT = THREE.RepeatWrapping;

    const textureLoader = new THREE.TextureLoader();
    this.coinTex = textureLoader.load('img/dogecoin.png');

    this.woodMat = new THREE.MeshLambertMaterial({ color: 0xe6b981 });
    this.spiralMat = new THREE.MeshLambertMaterial({ map: spiralTex });
    this.metalMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
    this.handleMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    this.waterMat = new THREE.MeshLambertMaterial({ color: 0x4facfe, transparent: true, opacity: 0.8 });
    this.obstacleMat = new THREE.MeshLambertMaterial({ color: 0xc0392b }); // red block
    this.stoneMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d }); // gray stone
    this.enemyMat = new THREE.MeshLambertMaterial({ color: 0x8e44ad }); // purple enemy

    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);

    const bladeGeo = new THREE.BoxGeometry(1.5, 0.2, 1);
    this.blade = new THREE.Mesh(bladeGeo, this.metalMat);
    this.blade.position.set(0, 0.5, 0);
    this.blade.castShadow = true;
    this.playerGroup.add(this.blade);
    
    const handleGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
    this.handle = new THREE.Mesh(handleGeo, this.handleMat);
    this.handle.rotation.x = Math.PI / 2;
    this.handle.position.set(0, 0.7, 1.5);
    this.handle.castShadow = true;
    this.playerGroup.add(this.handle);

    this.ngZone.runOutsideAngular(() => {
      container.addEventListener('pointerdown', this.onPointerDownBound);
      window.addEventListener('pointerup', this.onPointerUpBound);
      window.addEventListener('resize', this.onResizeBound);
    });

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private createRollMesh(radius: number) {
    const geo = new THREE.CylinderGeometry(radius, radius, 1.4, 32);
    const mesh = new THREE.Mesh(geo, this.spiralMat);
    mesh.rotation.z = Math.PI / 2;
    mesh.castShadow = true;
    return mesh;
  }

  private createFloatingText(text: string, position: THREE.Vector3, color: string = "white") {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.font = "Bold 80px Arial";
    context.fillStyle = color;
    context.strokeStyle = "black";
    context.lineWidth = 6;
    context.textAlign = "center";
    context.strokeText(text, 256, 128);
    context.fillText(text, 256, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 2;
    sprite.scale.set(6, 3, 1);
    this.scene.add(sprite);
    
    this.floatingTexts.push({ sprite, life: 1.0 });
  }

  private generateObjects(): void {
    // Generate Obstacles and Coins
    let zPos = -30;
    while (zPos > -this.trackLength + 30) {
      // Density increases with level (smaller gaps)
      const maxGap = Math.max(10, 30 - (this.level * 2));
      const minGap = Math.max(5, 15 - (this.level * 1));
      zPos -= Math.random() * maxGap + minGap; 
      
      const rand = Math.random();
      if (rand < 0.2) {
        // Coin
        const coinGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
        const colors = [0xf1c40f, 0xbdc3c7, 0xcd7f32, 0xff9ff3];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const coinMat = new THREE.MeshLambertMaterial({ map: this.coinTex, color: color });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set(0, 1.5, zPos);
        coin.castShadow = true;
        this.scene.add(coin);
        this.coins.push({ mesh: coin, active: true, color: color.toString() });
      } else if (rand < 0.4) {
        // Stone
        const stoneGeo = new THREE.DodecahedronGeometry(1.2);
        const stone = new THREE.Mesh(stoneGeo, this.stoneMat);
        stone.position.set(0, 1.2, zPos);
        stone.castShadow = true;
        this.scene.add(stone);
        this.obstacles.push({ mesh: stone, active: true, type: 'stone' });
      } else if (rand < 0.6) {
        // Wall
        const wallGeo = new THREE.BoxGeometry(3, 2, 0.5);
        const wall = new THREE.Mesh(wallGeo, this.woodMat);
        wall.position.set(0, 1, zPos);
        wall.castShadow = true;
        this.scene.add(wall);
        this.obstacles.push({ mesh: wall, active: true, type: 'wall' });
      } else if (rand < 0.8) {
        // Enemy
        const enemyGeo = new THREE.SphereGeometry(1.0, 16, 16);
        const enemy = new THREE.Mesh(enemyGeo, this.enemyMat);
        enemy.position.set(0, 1.0, zPos);
        enemy.castShadow = true;
        this.scene.add(enemy);
        this.obstacles.push({ mesh: enemy, active: true, type: 'enemy' });
      } else {
        // Standard Red Block
        const height = Math.random() * 2 + 1;
        const obsGeo = new THREE.BoxGeometry(1.8, height, 1);
        const obs = new THREE.Mesh(obsGeo, this.obstacleMat);
        obs.position.set(0, height / 2 + 0.5, zPos);
        obs.castShadow = true;
        this.scene.add(obs);
        this.obstacles.push({ mesh: obs, active: true, type: 'red' });
      }
    }
  }

  private resetLevel(): void {
    this.levelPoints = 0;
    this.speedMultiplier = 1;
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.obstacles = [];
    this.coins.forEach(c => this.scene.remove(c.mesh));
    this.coins = [];
    this.launchedRolls.forEach(r => this.scene.remove(r.mesh));
    this.launchedRolls = [];
    this.particles.forEach(p => {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];
    this.floatingTexts.forEach(f => {
        this.scene.remove(f.sprite);
        (f.sprite.material as THREE.Material).dispose();
    });
    this.floatingTexts = [];
    
    if (this.multiplierStairs) {
      this.scene.remove(this.multiplierStairs);
      this.multiplierStairs = null;
    }
    
    if (this.activeRoll) {
      this.scene.remove(this.activeRoll);
      this.activeRoll = null;
    }
    if (this.finishLine) this.scene.remove(this.finishLine);

    this.playerGroup.position.set(0, 0, 0);
    this.rollRadius = 0;
    this.isHolding = false;
    
    // Track gets longer every level
    this.trackLength = 300 + (this.level * 100);
    this.baseSpeed = 0.3 + Math.min(0.3, this.level * 0.02);
    this.speed = this.baseSpeed;
    this.finishLineZ = -this.trackLength;

    if (!this.scene.getObjectByName("water")) {
      const waterGeo = new THREE.PlaneGeometry(200, 2000);
      const water = new THREE.Mesh(waterGeo, this.waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, -1, -1000);
      water.name = "water";
      this.scene.add(water);
    }

    if (this.scene.getObjectByName("track")) {
      const oldTrack = this.scene.getObjectByName("track") as THREE.Mesh;
      this.scene.remove(oldTrack);
      oldTrack.geometry.dispose();
    }
    const trackGeo = new THREE.BoxGeometry(2, 1, this.trackLength + 100);
    const track = new THREE.Mesh(trackGeo, this.woodMat);
    track.position.set(0, 0, -this.trackLength / 2 + 30);
    track.receiveShadow = true;
    track.name = "track";
    this.scene.add(track);

    this.generateObjects();

    // Finish line
    const finGeo = new THREE.BoxGeometry(4, 0.5, 4);
    const finMat = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    this.finishLine = new THREE.Mesh(finGeo, finMat);
    this.finishLine.position.set(0, 0.75, this.finishLineZ);
    this.scene.add(this.finishLine);
    
    // Multiplier Stairs
    this.multiplierStairs = new THREE.Group();
    this.multiplierStairs.position.set(0, 0, this.finishLineZ - 5);
    const colors = [0x2ecc71, 0x3498db, 0x9b59b6, 0xf1c40f, 0xe74c3c];
    for(let i=1; i<=5; i++) {
        const stepGeo = new THREE.BoxGeometry(4, i * 1.5, 4);
        const stepMat = new THREE.MeshLambertMaterial({ color: colors[i-1] });
        const step = new THREE.Mesh(stepGeo, stepMat);
        step.position.set(0, (i*1.5)/2, -i * 4);
        step.receiveShadow = true;
        step.castShadow = true;
        // Text for step
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.font = "Bold 60px Arial"; ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText(`x${i}`, 64, 80);
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({map: tex});
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(0, (i*1.5)/2 + 1, -i * 4 + 2);
        this.multiplierStairs.add(step);
        this.multiplierStairs.add(sprite);
    }
    this.scene.add(this.multiplierStairs);
  }

  private onPointerDown(): void {
    if (this.gameState === 'PLAYING') {
      this.isHolding = true;
    }
  }

  private onPointerUp(): void {
    if (this.gameState === 'PLAYING' && this.isHolding) {
      this.isHolding = false;
      this.launchRoll();
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' && !e.repeat) {
      if (this.gameState === 'PLAYING') {
        this.onPointerDown();
      } else if (this.gameState === 'START' || this.gameState === 'LOSE') {
        this.ngZone.run(() => {
          this.startGame();
        });
      } else if (this.gameState === 'WIN') {
        this.ngZone.run(() => {
          this.nextLevel();
        });
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      this.onPointerUp();
    }
  }

  private spawnParticles(x: number, y: number, z: number, color: number, count: number) {
    const particleGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    for(let i=0; i<count; i++) {
        const particleMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1.0 });
        const particleMesh = new THREE.Mesh(particleGeo, particleMat);
        particleMesh.position.set(x, y, z);
        this.scene.add(particleMesh);
        
        this.particles.push({
            mesh: particleMesh,
            vx: (Math.random() - 0.5) * 0.4,
            vy: Math.random() * 0.4 + 0.2,
            vz: (Math.random() - 0.5) * 0.4,
            life: 1.0
        });
    }
  }

  private launchRoll() {
    if (this.rollRadius > 0.3) {
      let pointsGained = Math.floor(this.rollRadius * 100);
      this.ngZone.run(() => {
        this.levelPoints += pointsGained;
      });
      
      this.launchedRolls.push({
          mesh: this.activeRoll!,
          radius: this.rollRadius,
          speed: this.speed * 2.5,
          combo: 1
      });
      this.activeRoll = null; 
      this.tools.playSound('sfx_1');
    } else if (this.activeRoll) {
      this.scene.remove(this.activeRoll);
      this.activeRoll = null;
    }
    this.rollRadius = 0;
  }

  private updateCarving() {
    if (this.isHolding) {
      this.blade.position.y = 0.3;
      this.handle.position.y = 0.5;

      if (this.rollRadius < this.maxRollRadius) {
          this.rollRadius += 0.04;
      }

      if (!this.activeRoll) {
          this.activeRoll = this.createRollMesh(this.rollRadius);
          this.scene.add(this.activeRoll);
      } else {
          this.activeRoll.geometry.dispose();
          this.activeRoll.geometry = new THREE.CylinderGeometry(this.rollRadius, this.rollRadius, 1.4, 32);
      }

      this.activeRoll.position.set(
          this.playerGroup.position.x, 
          0.5 + this.rollRadius, 
          this.playerGroup.position.z - 0.5 - this.rollRadius
      );
      
      this.activeRoll.rotation.x -= 0.2; 

      if(Math.random() < 0.3) {
          this.spawnParticles(this.playerGroup.position.x, 0.5, this.playerGroup.position.z - 1, 0xf4a261, 2);
      }
    } else {
      this.blade.position.y = 0.5;
      this.handle.position.y = 0.7;
    }
  }

  private gameOver() {
    this.ngZone.run(() => {
        this.sessionPoints += this.levelPoints;
        this.gameState = 'LOSE';
        this.tools.playSound('sfx_8');
    });
    // Camera shake effect
    const shake = setInterval(() => {
        this.camera.position.x = 4 + (Math.random() - 0.5);
        this.camera.position.y = 5 + (Math.random() - 0.5);
    }, 50);
    setTimeout(() => {
        clearInterval(shake);
        this.camera.position.x = 4;
        this.camera.position.y = 5;
    }, 500);
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'PLAYING') {
      // Speed scales slowly over the level
      const progress = Math.abs(this.playerGroup.position.z) / this.trackLength;
      this.speed = this.baseSpeed + (progress * 0.2);
        
      this.playerGroup.position.z -= this.speed;

      // Smooth camera follow
      this.camera.position.x += (4 - this.camera.position.x) * 0.1;
      this.camera.position.y += (6 - this.camera.position.y) * 0.1;
      this.camera.position.z = this.playerGroup.position.z + 8;
      this.camera.lookAt(0, 0, this.playerGroup.position.z - 5);

      this.updateCarving();

      // Coin collision (Player only)
      for (let j = this.coins.length - 1; j >= 0; j--) {
        let coin = this.coins[j];
        if (coin.active) {
            coin.mesh.rotation.z += 0.05; // animate coin
            if (Math.abs(this.playerGroup.position.z - coin.mesh.position.z) < 1.0) {
                coin.active = false;
                this.scene.remove(coin.mesh);
                this.spawnParticles(coin.mesh.position.x, coin.mesh.position.y, coin.mesh.position.z, 0xf1c40f, 10);
                this.ngZone.run(() => {
                    this.sessionPoints += 100;
                });
                this.createFloatingText("+100", coin.mesh.position, "#f1c40f");
                this.tools.playSound('sfx_4'); // Or a custom coin sound
            }
        }
      }

      // Launched Rolls collision
      for (let i = this.launchedRolls.length - 1; i >= 0; i--) {
        let r = this.launchedRolls[i];
        r.mesh.position.z -= r.speed;
        r.mesh.rotation.x -= 0.3; 
        
        let hit = false;
        
        // Multiplier stairs collision check
        if (this.multiplierStairs && r.mesh.position.z < this.finishLineZ - 5) {
            let hitStep = 1;
            const diffZ = Math.abs(r.mesh.position.z - (this.finishLineZ - 5));
            hitStep = Math.floor(diffZ / 4) + 1; // 4 is step depth
            if (hitStep > 5) hitStep = 5; // max x5
            
            // Check if roll is large enough to reach this step (simple height check)
            if (r.mesh.position.y < (hitStep * 1.5)) {
                // Hit the stairs!
                const multiplier = hitStep;
                const bonusPoints = multiplier * 500;
                this.ngZone.run(() => {
                    this.levelPoints += bonusPoints;
                    this.tools.playSound('sfx_4');
                });
                const bonusStr = this.tools.spiral_roll[this.tools.lang]?.spiral_roll_bonus || 'BONUS!';
                this.createFloatingText(`+${bonusPoints} ${bonusStr}`, r.mesh.position, "#2ecc71");
                this.scene.remove(r.mesh);
                this.launchedRolls.splice(i, 1);
                continue;
            }
        }

        for (let j = this.obstacles.length - 1; j >= 0; j--) {
            let obs = this.obstacles[j];
            if (obs.active && Math.abs(r.mesh.position.z - obs.mesh.position.z) < (r.radius + 0.5)) {
                obs.active = false;
                this.scene.remove(obs.mesh);
                
                let color = 0xc0392b;
                if(obs.type === 'stone') color = 0x7f8c8d;
                if(obs.type === 'enemy') color = 0x8e44ad;
                if(obs.type === 'wall') color = 0xe6b981;
                
                this.spawnParticles(obs.mesh.position.x, obs.mesh.position.y, obs.mesh.position.z, color, 15);
                this.tools.playSound('sfx_4');
                
                const points = 50 * r.combo;
                this.ngZone.run(() => { this.levelPoints += points; });
                this.createFloatingText(`+${points}`, obs.mesh.position);
                r.combo++; // Combo goes up!
                
                if (obs.type === 'stone' || obs.type === 'wall') {
                    r.radius -= 1.5; // Heavy reduction
                } else {
                    r.radius -= 1.0;
                }
                
                if (r.radius < 0.5) {
                    hit = true;
                } else {
                    r.mesh.geometry.dispose();
                    r.mesh.geometry = new THREE.CylinderGeometry(r.radius, r.radius, 1.4, 32);
                    r.mesh.position.y = 0.5 + r.radius;
                }
            }
        }

        if (hit || r.mesh.position.z < this.playerGroup.position.z - 250) {
            this.scene.remove(r.mesh);
            this.launchedRolls.splice(i, 1);
        }
      }

      // Player Obstacle Collision
      for (let j = this.obstacles.length - 1; j >= 0; j--) {
        let obs = this.obstacles[j];
        if (obs.active && this.playerGroup.position.z <= obs.mesh.position.z + 0.5 && this.playerGroup.position.z >= obs.mesh.position.z - 0.5) {
            this.spawnParticles(this.playerGroup.position.x, 1, this.playerGroup.position.z, 0xbdc3c7, 10);
            this.gameOver();
        }
      }
      
      // Enemy movement
      this.obstacles.forEach(obs => {
        if (obs.active && obs.type === 'enemy') {
            obs.mesh.position.x = Math.sin(Date.now() * 0.002 + obs.mesh.position.z) * 1.5; // wiggle
        }
      });

      // End condition: Level ends when player touches the end.
      if (this.playerGroup.position.z <= this.finishLine.position.z) {
        this.speed = 0; 
        
        // Add flat bonus and any potential active rolls instantly
        this.ngZone.run(() => {
            this.levelPoints += 500;
            this.sessionPoints += this.levelPoints;
            this.gameState = 'WIN';
            this.tools.playSound('sfx_4');
        });
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
        let p = this.particles[i];
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.vy -= 0.02; 
        p.life -= 0.03;

        if (p.life <= 0) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            (p.mesh.material as THREE.Material).dispose();
            this.particles.splice(i, 1);
        } else {
            p.mesh.scale.setScalar(p.life);
            (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
        }
    }
    
    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        let f = this.floatingTexts[i];
        f.sprite.position.y += 0.05;
        f.life -= 0.02;
        if (f.life <= 0) {
            this.scene.remove(f.sprite);
            (f.sprite.material as THREE.Material).dispose();
            this.floatingTexts.splice(i, 1);
        } else {
            (f.sprite.material as THREE.SpriteMaterial).opacity = f.life;
        }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onResize(): void {
    if (!this.camera || !this.renderer) return;
    const container = this.gameContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
