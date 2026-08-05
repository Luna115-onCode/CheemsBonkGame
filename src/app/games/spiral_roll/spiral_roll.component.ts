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
  gamePoints = 0;
  level = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private playerGroup!: THREE.Group;
  private chisel!: THREE.Mesh;
  private activeRoll: THREE.Mesh | null = null;
  private rollRadius = 0.2;
  private launchedRolls: Array<{ mesh: THREE.Mesh; radius: number; speed: number }> = [];
  private obstacles: Array<{ mesh: THREE.Mesh; active: boolean }> = [];
  private finishLineZ = -150;
  private isHolding = false;
  private animationFrameId: number | null = null;

  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("spiral_roll" as any);
    this.tools.actPage = "spiral_roll" as any;
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
    this.tools.leaveMinigame('spiral_roll', this.gamePoints, this.level);
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
    this.scene.background = new THREE.Color(0x4facfe);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 4, 8);
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

    const trackGeo = new THREE.BoxGeometry(4, 1, 300);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0xD7CCC8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, -0.5, -100);
    track.receiveShadow = true;
    this.scene.add(track);

    const woodGeo = new THREE.BoxGeometry(2, 0.5, 250);
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    const wood = new THREE.Mesh(woodGeo, woodMat);
    wood.position.set(0, 0.25, -100);
    wood.receiveShadow = true;
    this.scene.add(wood);

    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 1, 0);
    this.scene.add(this.playerGroup);

    const chiselGeo = new THREE.BoxGeometry(1.6, 0.2, 0.8);
    const chiselMat = new THREE.MeshLambertMaterial({ color: 0xB0BEC5 });
    this.chisel = new THREE.Mesh(chiselGeo, chiselMat);
    this.chisel.rotation.x = 0.3;
    this.playerGroup.add(this.chisel);

    container.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('resize', this.onResizeBound);

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private resetLevel(): void {
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.obstacles = [];
    this.launchedRolls.forEach(r => this.scene.remove(r.mesh));
    this.launchedRolls = [];
    if (this.activeRoll) {
      this.playerGroup.remove(this.activeRoll);
      this.activeRoll = null;
    }

    this.playerGroup.position.set(0, 1, 0);
    this.finishLineZ = -150 - this.level * 20;

    const numObs = 5 + this.level * 2;
    for (let i = 0; i < numObs; i++) {
      const z = -15 - i * 22;
      const obsGeo = new THREE.BoxGeometry(1.8, 1.8, 0.8);
      const obsMat = new THREE.MeshLambertMaterial({ color: 0xE53935 });
      const mesh = new THREE.Mesh(obsGeo, obsMat);
      mesh.position.set(0, 1.4, z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.obstacles.push({ mesh, active: true });
    }
  }

  private onPointerDown(): void {
    if (this.gameState !== 'PLAYING') return;
    this.isHolding = true;
    if (!this.activeRoll) {
      this.rollRadius = 0.2;
      const geo = new THREE.CylinderGeometry(this.rollRadius, this.rollRadius, 1.6, 16);
      const mat = new THREE.MeshLambertMaterial({ color: 0xFFD54F });
      this.activeRoll = new THREE.Mesh(geo, mat);
      this.activeRoll.rotation.z = Math.PI / 2;
      this.activeRoll.position.set(0, 0.4, -0.6);
      this.playerGroup.add(this.activeRoll);
    }
  }

  private onPointerUp(): void {
    if (!this.isHolding || this.gameState !== 'PLAYING') return;
    this.isHolding = false;
    if (this.activeRoll) {
      this.playerGroup.remove(this.activeRoll);
      const worldPos = new THREE.Vector3();
      this.activeRoll.getWorldPosition(worldPos);
      this.activeRoll.position.copy(worldPos);
      this.scene.add(this.activeRoll);

      this.launchedRolls.push({
        mesh: this.activeRoll,
        radius: this.rollRadius,
        speed: 0.45 + this.rollRadius * 0.2
      });
      this.activeRoll = null;
      this.tools.playSound('sfx_1');
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'PLAYING') {
      this.playerGroup.position.z -= 0.25;

      if (this.isHolding && this.activeRoll) {
        this.rollRadius = Math.min(1.8, this.rollRadius + 0.015);
        this.activeRoll.geometry.dispose();
        this.activeRoll.geometry = new THREE.CylinderGeometry(this.rollRadius, this.rollRadius, 1.6, 16);
        this.activeRoll.position.y = this.rollRadius;
        this.activeRoll.position.z = -this.rollRadius - 0.3;
      }

      for (let i = this.launchedRolls.length - 1; i >= 0; i--) {
        const r = this.launchedRolls[i];
        r.mesh.position.z -= r.speed;
        r.mesh.rotation.x -= 0.15;

        for (let j = 0; j < this.obstacles.length; j++) {
          const obs = this.obstacles[j];
          if (obs.active) {
            const dz = Math.abs(r.mesh.position.z - obs.mesh.position.z);
            if (dz < r.radius + 0.5) {
              obs.active = false;
              this.scene.remove(obs.mesh);
              this.ngZone.run(() => {
                this.gamePoints += 50;
                this.tools.playSound('sfx_4');
              });
            }
          }
        }

        if (r.mesh.position.z < this.playerGroup.position.z - 200) {
          this.scene.remove(r.mesh);
          this.launchedRolls.splice(i, 1);
        }
      }

      for (let j = 0; j < this.obstacles.length; j++) {
        const obs = this.obstacles[j];
        if (obs.active && Math.abs(this.playerGroup.position.z - obs.mesh.position.z) < 0.6) {
          this.ngZone.run(() => {
            this.gameState = 'LOSE';
            this.tools.playSound('sfx_8');
          });
          break;
        }
      }

      if (this.playerGroup.position.z <= this.finishLineZ) {
        this.ngZone.run(() => {
          this.gamePoints += 100;
          this.gameState = 'WIN';
          this.tools.playSound('sfx_4');
        });
      }

      this.camera.position.z = this.playerGroup.position.z + 8;
      this.camera.lookAt(0, 1, this.playerGroup.position.z - 5);
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
