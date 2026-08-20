import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ToolsService } from '../../services/tools.service';

interface Collectible {
  mesh: THREE.Mesh;
  colorName: string;
  collected: boolean;
}

@Component({
  selector: 'app-stack-colors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stack_colors.component.html',
  styleUrl: './stack_colors.component.css'
})
export class StackColorsComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;

  gameState: 'START' | 'PLAYING' | 'PREP_KICK' | 'KICKING' | 'WIN' | 'LOSE' = 'START';
  sessionPoints = 0;
  levelPoints = 0;
  level = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private playerGroup!: THREE.Group;
  private character!: THREE.Mesh;
  stack: THREE.Mesh[] = [];
  private flyingStackGroup!: THREE.Group;

  private currentColor = 'orange';
  private colorMap: Record<string, number> = {
    orange: 0xFF9800,
    blue: 0x2196F3,
    green: 0x4CAF50
  };

  private collectibles: Collectible[] = [];
  private multipliers: THREE.Object3D[] = [];
  private floatingTexts: Array<{ sprite: THREE.Sprite; life: number }> = [];
  
  private trackLength = 160;
  private isDragging = false;
  private targetX = 0;
  private animationFrameId: number | null = null;
  private speed = 0.35;
  private keys = { left: false, right: false };
  private shakeOffset = new THREE.Vector3();
  private shakeStrength = 0;

  // Kick Mechanics
  kickPower = 0;
  private kickDecayInterval: any;
  private stackVelocity = { y: 0, z: 0 };

  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onResizeBound = this.onResize.bind(this);
  private onKeyDownBound = this.onKeyDown.bind(this);
  private onKeyUpBound = this.onKeyUp.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("stack_colors" as any);
    this.tools.actPage = "stack_colors" as any;
  }

  ngAfterViewInit(): void {
    this.init3D();
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
  }

  ngOnDestroy(): void {
    this.stopLoop();
    if (this.kickDecayInterval) clearInterval(this.kickDecayInterval);
    
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    
    if (this.renderer) {
      this.renderer.dispose();
      const dom = this.gameContainer?.nativeElement;
      if (dom && dom.contains(this.renderer.domElement)) {
        dom.removeChild(this.renderer.domElement);
      }
    }
    this.tools.leaveMinigame('stack_colors', this.sessionPoints, this.level);
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
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 1, -5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    this.flyingStackGroup = new THREE.Group();
    this.scene.add(this.flyingStackGroup);

    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);

    const charGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const charMat = new THREE.MeshLambertMaterial({ color: this.colorMap[this.currentColor] });
    this.character = new THREE.Mesh(charGeo, charMat);
    this.character.position.y = 0.75;
    this.character.castShadow = true;
    this.playerGroup.add(this.character);

    container.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('resize', this.onResizeBound);

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
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

  private resetLevel(): void {
    this.levelPoints = 0;
    this.collectibles.forEach(c => this.scene.remove(c.mesh));
    this.collectibles = [];
    this.multipliers.forEach(m => this.scene.remove(m));
    this.multipliers = [];
    this.stack.forEach(s => this.playerGroup.remove(s));
    this.stack = [];
    
    // Clear flying group
    while(this.flyingStackGroup.children.length > 0){ 
      this.flyingStackGroup.remove(this.flyingStackGroup.children[0]); 
    }
    this.flyingStackGroup.position.set(0,0,0);
    this.flyingStackGroup.rotation.set(0,0,0);

    this.playerGroup.position.set(0, 0, 0);
    this.targetX = 0;
    this.kickPower = 0;
    this.currentColor = 'orange';
    (this.character.material as THREE.MeshLambertMaterial).color.setHex(this.colorMap[this.currentColor]);
    this.updateCharacterHeight();

    this.trackLength = 160 + this.level * 40;
    this.speed = 0.35 + (this.level * 0.02);

    if (this.scene.getObjectByName("track")) {
      const oldTrack = this.scene.getObjectByName("track") as THREE.Mesh;
      this.scene.remove(oldTrack);
      oldTrack.geometry.dispose();
    }
    
    const trackGeo = new THREE.BoxGeometry(6, 1, this.trackLength + 100);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, -0.5, -this.trackLength / 2 + 10);
    track.receiveShadow = true;
    track.name = "track";
    this.scene.add(track);

    const colors = ['orange', 'blue', 'green'];
    let expectedColor = 'orange';
    let rowCount = 0;
    let noMatchRowCount = 0;

    for (let z = -15; z > -this.trackLength; z -= 4) {
      const progress = Math.abs(z) / this.trackLength; 
      const difficulty = this.level * 0.1 + progress * 0.5;

      if (z % 40 === 0) {
        // Guarantee color changes at gates by picking from the other colors
        const otherColors = colors.filter(c => c !== expectedColor);
        const nextCol = otherColors[Math.floor(Math.random() * otherColors.length)];
        const lineGeo = new THREE.BoxGeometry(6, 0.1, 1);
        const lineMat = new THREE.MeshBasicMaterial({ color: this.colorMap[nextCol], transparent: true, opacity: 0.5 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(0, 0.05, z);
        line.userData = { colorName: nextCol, passed: false };
        this.scene.add(line);
        this.multipliers.push(line);
        
        expectedColor = nextCol; 
        rowCount = 0; 
        noMatchRowCount = 0;
        continue;
      }

      let rowColors: string[] = [];
      if (rowCount < 2) {
        // First 2 rows after start or gate are purely the player's color
        rowColors = [expectedColor, expectedColor, expectedColor];
        noMatchRowCount = 0;
      } else {
        let matchProb = 0.8 - (difficulty * 0.4); 
        if (matchProb < 0.2) matchProb = 0.2;

        // At max 3 rows in a row without the same color
        if (noMatchRowCount >= 3) {
           matchProb = 1.0;
        }

        if (Math.random() < matchProb) {
           // Spawn expected color
           const quantityPattern = Math.random();
           const otherColors = colors.filter(c => c !== expectedColor);
           
           if (quantityPattern > difficulty) {
               // 3 blocks of expected color
               rowColors = [expectedColor, expectedColor, expectedColor];
           } else if (quantityPattern > difficulty / 2) {
               // 2 expected, 1 different
               const diffColor = otherColors[Math.floor(Math.random() * otherColors.length)];
               rowColors = [expectedColor, expectedColor, diffColor];
           } else {
               // 1 expected, 2 different
               const diff1 = otherColors[0];
               const diff2 = otherColors[1];
               rowColors = [expectedColor, diff1, diff2];
           }
           noMatchRowCount = 0;
        } else {
           // 0 blocks of expected color
           const otherColors = colors.filter(c => c !== expectedColor);
           const diff1 = otherColors[0];
           const diff2 = otherColors[1];
           rowColors = [diff1, diff2, Math.random() > 0.5 ? diff1 : diff2];
           noMatchRowCount++;
        }
        
        rowColors.sort(() => 0.5 - Math.random());
      }

      const xPositions = [-2, 0, 2];
      for (let i = 0; i < 3; i++) {
        const cName = rowColors[i];
        const geo = new THREE.BoxGeometry(1.4, 0.4, 0.8);
        const mat = new THREE.MeshLambertMaterial({ color: this.colorMap[cName] });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPositions[i], 0.2, z);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.collectibles.push({ mesh, colorName: cName, collected: false });
      }
      rowCount++;
    }

    // Multiplier Zones at end
    const multVals = [1, 2, 3, 5, 10];
    for (let i = 0; i < multVals.length; i++) {
      const mz = -this.trackLength - 5 - i * 10;
      const geo = new THREE.PlaneGeometry(6, 10);
      const hue = (i * 45) % 360;
      const mat = new THREE.MeshBasicMaterial({ color: `hsl(${hue}, 80%, 50%)` });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.01, mz);
      mesh.userData = { multiplier: multVals[i] };
      this.scene.add(mesh);
      this.multipliers.push(mesh);
      
      // Add Text
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.font = "Bold 60px Arial"; ctx.fillStyle = "white"; ctx.textAlign = "center";
      ctx.fillText(`x${multVals[i]}`, 64, 80);
      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({map: tex});
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, 1, mz);
      this.scene.add(sprite);
      this.multipliers.push(sprite);
    }
  }

  private triggerCameraShake() {
    this.shakeStrength = 0.5; // Initial strength
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.gameState === 'PLAYING') {
      this.isDragging = true;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || this.gameState !== 'PLAYING') return;
    const container = this.gameContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.targetX = Math.max(-2.2, Math.min(2.2, nx * 3));
  }

  private onPointerUp(): void {
    this.isDragging = false;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' && !e.repeat) {
      if (this.gameState === 'START' || this.gameState === 'LOSE') {
        this.ngZone.run(() => this.startGame());
      } else if (this.gameState === 'WIN') {
        this.ngZone.run(() => this.nextLevel());
      } else if (this.gameState === 'PREP_KICK') {
        this.addKickPower(e as any);
      }
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
  }

  public addKickPower(e: Event) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (this.gameState === 'PREP_KICK') {
      this.ngZone.run(() => {
        this.kickPower += 15;
        if (this.kickPower > 100) this.kickPower = 100;
      });
    }
  }

  private prepKick() {
    this.ngZone.run(() => {
        this.gameState = 'PREP_KICK';
        this.kickPower = 0;
    });
    
    if (this.kickDecayInterval) clearInterval(this.kickDecayInterval);
    this.kickDecayInterval = setInterval(() => {
        this.ngZone.run(() => {
            this.kickPower -= 1;
            if(this.kickPower < 0) this.kickPower = 0;
        });
    }, 50);

    setTimeout(() => {
        this.executeKick();
    }, 3000);
  }

  private executeKick() {
    if (this.kickDecayInterval) clearInterval(this.kickDecayInterval);
    
    this.ngZone.run(() => {
        this.gameState = 'KICKING';
    });

    // Transfer stack to flying group
    while(this.stack.length > 0) {
        let b = this.stack.shift()!;
        let worldPos = new THREE.Vector3();
        b.getWorldPosition(worldPos);
        b.position.copy(worldPos);
        this.flyingStackGroup.add(b);
    }
    this.playerGroup.remove(...this.playerGroup.children.filter(c => c !== this.character));

    let powerMult = (this.kickPower / 100);
    this.stackVelocity.y = 0.5 + (powerMult * 1.5);
    this.stackVelocity.z = -1.0 - (powerMult * 2.0);
  }

  private changePlayerColor(newColorName: string) {
    this.currentColor = newColorName;
    (this.character.material as THREE.MeshLambertMaterial).color.setHex(this.colorMap[this.currentColor]);
    this.stack.forEach(b => (b.material as THREE.MeshLambertMaterial).color.setHex(this.colorMap[this.currentColor]));
  }

  private updateCharacterHeight() {
    this.character.position.y = (this.stack.length * 0.4) + 0.75;
  }

  private gameOver() {
    this.ngZone.run(() => {
        this.sessionPoints += this.levelPoints;
        this.gameState = 'LOSE';
        this.tools.playSound('sfx_8');
    });
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'PLAYING') {
      this.playerGroup.position.z -= this.speed;
      
      // Keyboard input
      if (this.keys.left) this.targetX -= 0.15;
      if (this.keys.right) this.targetX += 0.15;
      this.targetX = Math.max(-2.2, Math.min(2.2, this.targetX));

      this.playerGroup.position.x += (this.targetX - this.playerGroup.position.x) * 0.2;

      // Gate collisions
      this.multipliers.forEach(m => {
        if (m.userData && m.userData['colorName'] && !m.userData['passed'] && this.playerGroup.position.z < m.position.z) {
            m.userData['passed'] = true;
            this.changePlayerColor(m.userData['colorName']);
        }
      });

      const playerBox = new THREE.Box3().setFromObject(this.character);
      // Extend box downwards to catch blocks
      playerBox.min.y = 0; 

      this.collectibles.forEach(c => {
        if (!c.collected) {
          const colBox = new THREE.Box3().setFromObject(c.mesh);
          if (playerBox.intersectsBox(colBox)) {
            c.collected = true;
            if (c.colorName === this.currentColor) {
              this.scene.remove(c.mesh);
              const stackHeight = this.stack.length * 0.4 + 0.2;
              c.mesh.position.set(0, stackHeight, 0);
              this.playerGroup.add(c.mesh);
              this.stack.push(c.mesh);
              this.updateCharacterHeight();
              
              this.ngZone.run(() => {
                this.levelPoints += 5;
              });
              this.tools.playSound('sfx_1');
            } else {
              this.scene.remove(c.mesh);
              this.triggerCameraShake();
              
              if (this.stack.length > 0) {
                const popped = this.stack.pop();
                if (popped) this.playerGroup.remove(popped);
                this.updateCharacterHeight();
                this.tools.playSound('sfx_1');
              } else {
                this.gameOver();
              }
            }
          }
        }
      });

      if (this.playerGroup.position.z <= -this.trackLength) {
        this.prepKick();
      }

      let camTargetX = this.playerGroup.position.x * 0.5;
      let camTargetY = this.character.position.y + 7;
      let camTargetZ = this.playerGroup.position.z + 11;
      
      if (this.shakeStrength > 0) {
          this.shakeOffset.set(
              (Math.random() - 0.5) * this.shakeStrength,
              (Math.random() - 0.5) * this.shakeStrength,
              (Math.random() - 0.5) * this.shakeStrength
          );
          this.shakeStrength -= 0.05; // Decay
          if (this.shakeStrength < 0) this.shakeStrength = 0;
      }

      this.camera.position.x += (camTargetX - this.camera.position.x) * 0.1 + this.shakeOffset.x;
      this.camera.position.y += (camTargetY - this.camera.position.y) * 0.1 + this.shakeOffset.y;
      this.camera.position.z = camTargetZ + this.shakeOffset.z;
      this.camera.lookAt(this.playerGroup.position.x, this.character.position.y, this.playerGroup.position.z - 5);

    } else if (this.gameState === 'KICKING') {
      this.stackVelocity.y -= 0.05; // Gravity
                
      this.flyingStackGroup.position.y += this.stackVelocity.y;
      this.flyingStackGroup.position.z += this.stackVelocity.z;

      this.flyingStackGroup.rotation.x -= 0.1;

      this.camera.position.z += this.stackVelocity.z * 0.8;
      this.camera.lookAt(this.flyingStackGroup.position);

      if (this.flyingStackGroup.position.y <= 0) {
          this.flyingStackGroup.position.y = 0;
          
          let finalZ = this.flyingStackGroup.position.z;
          let mult = 1;
          
          this.multipliers.forEach(m => {
              if (m.userData && m.userData['multiplier']) {
                  let mZ = m.position.z;
                  if (finalZ < mZ + 5 && finalZ > mZ - 5) {
                      mult = m.userData['multiplier'];
                  }
              }
          });

          this.ngZone.run(() => {
              const bonusStr = this.tools.stack_colors[this.tools.lang]?.stack_colors_bonus || 'BONUS!';
              const bonusPts = mult * 200;
              this.levelPoints += bonusPts;
              this.sessionPoints += this.levelPoints;
              this.gameState = 'WIN';
              this.createFloatingText(`+${bonusPts} ${bonusStr}`, this.flyingStackGroup.position, "#2ecc71");
              this.tools.playSound('sfx_4');
          });
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
