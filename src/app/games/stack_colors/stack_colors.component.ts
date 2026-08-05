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

  gameState: 'START' | 'PLAYING' | 'KICKING' | 'WIN' | 'LOSE' = 'START';
  gamePoints = 0;
  level = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private playerGroup!: THREE.Group;
  private character!: THREE.Mesh;
  private stack: THREE.Mesh[] = [];

  private currentColor = 'orange';
  private colorMap: Record<string, number> = {
    orange: 0xFF9800,
    blue: 0x2196F3,
    green: 0x4CAF50
  };

  private collectibles: Collectible[] = [];
  private multipliers: THREE.Mesh[] = [];
  private trackLength = 160;
  private isDragging = false;
  private targetX = 0;
  private animationFrameId: number | null = null;

  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("stack_colors" as any);
    this.tools.actPage = "stack_colors" as any;
  }

  ngAfterViewInit(): void {
    this.init3D();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    if (this.renderer) {
      this.renderer.dispose();
      const dom = this.gameContainer?.nativeElement;
      if (dom && dom.contains(this.renderer.domElement)) {
        dom.removeChild(this.renderer.domElement);
      }
    }
    this.tools.leaveMinigame('stack_colors', this.gamePoints, this.level);
  }

  startGame(): void {
    this.gamePoints = 0;
    this.level = 0;
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

    const trackGeo = new THREE.BoxGeometry(6, 1, 400);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, -0.5, -150);
    track.receiveShadow = true;
    this.scene.add(track);

    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);

    const charGeo = new THREE.BoxGeometry(1, 1.5, 1);
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

  private resetLevel(): void {
    this.collectibles.forEach(c => this.scene.remove(c.mesh));
    this.collectibles = [];
    this.multipliers.forEach(m => this.scene.remove(m));
    this.multipliers = [];
    this.stack.forEach(s => this.playerGroup.remove(s));
    this.stack = [];

    this.playerGroup.position.set(0, 0, 0);
    this.targetX = 0;
    this.currentColor = 'orange';
    (this.character.material as THREE.MeshLambertMaterial).color.setHex(this.colorMap[this.currentColor]);

    this.trackLength = 120 + this.level * 20;
    const colors = ['orange', 'blue', 'green'];

    for (let z = -15; z > -this.trackLength; z -= 4) {
      if (z % 40 === 0) {
        const nextCol = colors[Math.floor(Math.random() * colors.length)];
        const lineGeo = new THREE.BoxGeometry(6, 0.1, 1);
        const lineMat = new THREE.MeshBasicMaterial({ color: this.colorMap[nextCol] });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(0, 0.05, z);
        this.scene.add(line);
        continue;
      }

      for (let x = -2; x <= 2; x += 2) {
        if (Math.random() < 0.65) {
          const cName = colors[Math.floor(Math.random() * colors.length)];
          const geo = new THREE.BoxGeometry(1.4, 0.4, 0.8);
          const mat = new THREE.MeshLambertMaterial({ color: this.colorMap[cName] });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, 0.2, z);
          mesh.castShadow = true;
          this.scene.add(mesh);
          this.collectibles.push({ mesh, colorName: cName, collected: false });
        }
      }
    }

    const multVals = [1, 2, 3, 5, 10];
    for (let i = 0; i < multVals.length; i++) {
      const mz = -this.trackLength - 10 - i * 8;
      const geo = new THREE.BoxGeometry(6, 0.2, 7);
      const mat = new THREE.MeshLambertMaterial({
        color: i % 2 === 0 ? 0xFFEB3B : 0xFFC107
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0.1, mz);
      mesh.userData = { multiplier: multVals[i] };
      this.scene.add(mesh);
      this.multipliers.push(mesh);
    }
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.gameState !== 'PLAYING') return;
    this.isDragging = true;
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

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'PLAYING') {
      this.playerGroup.position.z -= 0.35;
      this.playerGroup.position.x += (this.targetX - this.playerGroup.position.x) * 0.2;

      const playerBox = new THREE.Box3().setFromObject(this.playerGroup);

      this.collectibles.forEach(c => {
        if (!c.collected) {
          const colBox = new THREE.Box3().setFromObject(c.mesh);
          if (playerBox.intersectsBox(colBox)) {
            c.collected = true;
            if (c.colorName === this.currentColor) {
              this.scene.remove(c.mesh);
              const stackHeight = this.stack.length * 0.4 + 0.2;
              c.mesh.position.set(0, stackHeight, 1.2);
              this.playerGroup.add(c.mesh);
              this.stack.push(c.mesh);
              this.ngZone.run(() => {
                this.gamePoints += 5;
              });
              this.tools.playSound('sfx_1');
            } else {
              this.scene.remove(c.mesh);
              if (this.stack.length > 0) {
                const popped = this.stack.pop();
                if (popped) this.playerGroup.remove(popped);
                this.tools.playSound('sfx_8');
              } else {
                this.ngZone.run(() => {
                  this.gameState = 'LOSE';
                  this.tools.playSound('sfx_8');
                });
              }
            }
          }
        }
      });

      if (this.playerGroup.position.z <= -this.trackLength) {
        this.ngZone.run(() => {
          this.gamePoints += 50 + this.stack.length * 10;
          this.gameState = 'WIN';
          this.tools.playSound('sfx_4');
        });
      }

      this.camera.position.x = this.playerGroup.position.x * 0.5;
      this.camera.position.y = this.character.position.y + 7;
      this.camera.position.z = this.playerGroup.position.z + 11;
      this.camera.lookAt(this.playerGroup.position.x, 1, this.playerGroup.position.z - 5);
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
