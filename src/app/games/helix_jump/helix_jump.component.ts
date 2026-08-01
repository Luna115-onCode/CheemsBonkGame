import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-helix-jump',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './helix_jump.component.html',
  styleUrl: './helix_jump.component.css'
})
export class HelixJumpComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;

  gameState: 'START' | 'PLAYING' | 'WIN' | 'LOSE' = 'START';
  gamePoints = 0;
  level = 1;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private towerGroup!: THREE.Group;
  private ball!: THREE.Mesh;

  private ballVy = 0;
  private gravity = -0.015;
  private bounceVelocity = 0.28;
  private ballRadius = 0.45;
  private platformThickness = 0.4;
  private currentPlatformIndex = 0;
  private platformsData: Array<{ y: number; group: THREE.Group }> = [];

  private isDragging = false;
  private previousMouseX = 0;
  private animationFrameId: number | null = null;
  private raycaster = new THREE.Raycaster();
  private downVector = new THREE.Vector3(0, -1, 0);

  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onResizeBound = this.onResize.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("helix_jump" as any);
    this.tools.actPage = "helix_jump" as any;
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
    this.tools.leaveMinigame('helix_jump', this.gamePoints, this.level);
  }

  startGame(): void {
    this.gamePoints = 0;
    this.level = 1;
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
    this.scene.background = new THREE.Color(0xECECEC);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 8, 11);
    this.camera.lookAt(0, 4, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    this.towerGroup = new THREE.Group();
    this.scene.add(this.towerGroup);

    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, 80, 32);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xD0D0D0 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = -20;
    this.towerGroup.add(pillar);

    const ballGeo = new THREE.SphereGeometry(this.ballRadius, 32, 32);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0xFF4081 });
    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    container.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('resize', this.onResizeBound);

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private resetLevel(): void {
    this.platformsData.forEach(p => this.towerGroup.remove(p.group));
    this.platformsData = [];

    this.currentPlatformIndex = 0;
    this.ball.position.set(0, 8, 2.5);
    this.ballVy = 0;
    this.towerGroup.rotation.y = 0;

    const numPlatforms = 6 + this.level * 2;
    const startY = 6;
    const gapY = 3.5;

    for (let i = 0; i < numPlatforms; i++) {
      const y = startY - i * gapY;
      const group = new THREE.Group();
      group.position.y = y;

      const isLast = i === numPlatforms - 1;
      const numSlices = 12;
      const missingSlices = isLast ? 0 : 3;
      const dangerChance = isLast ? 0 : 0.25;

      let startAngle = 0;
      const sliceAngle = (Math.PI * 2) / numSlices;
      const missingStart = Math.floor(Math.random() * numSlices);

      for (let s = 0; s < numSlices; s++) {
        if (!isLast && s >= missingStart && s < missingStart + missingSlices) {
          continue;
        }

        const wedgeGeo = new THREE.CylinderGeometry(3.2, 3.2, this.platformThickness, 8, 1, false, startAngle, sliceAngle);
        let color = 0x00E676;
        let isDanger = false;
        let isWin = false;

        if (isLast) {
          color = 0xFFD54F;
          isWin = true;
        } else if (Math.random() < dangerChance) {
          color = 0xD32F2F;
          isDanger = true;
        }

        const mat = new THREE.MeshLambertMaterial({ color });
        const wedge = new THREE.Mesh(wedgeGeo, mat);
        wedge.receiveShadow = true;
        wedge.userData = { isDanger, isWin };
        group.add(wedge);

        startAngle += sliceAngle;
      }

      this.towerGroup.add(group);
      this.platformsData.push({ y, group });
    }
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.gameState !== 'PLAYING') return;
    this.isDragging = true;
    this.previousMouseX = e.clientX;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || this.gameState !== 'PLAYING') return;
    const deltaX = e.clientX - this.previousMouseX;
    this.towerGroup.rotation.y += deltaX * 0.01;
    this.previousMouseX = e.clientX;
  }

  private onPointerUp(): void {
    this.isDragging = false;
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.gameState === 'PLAYING') {
      this.ballVy += this.gravity;
      this.ball.position.y += this.ballVy;

      this.ball.scale.x += (1 - this.ball.scale.x) * 0.1;
      this.ball.scale.y += (1 - this.ball.scale.y) * 0.1;
      this.ball.scale.z += (1 - this.ball.scale.z) * 0.1;

      const pData = this.platformsData[this.currentPlatformIndex];
      if (pData) {
        const platformTopY = pData.y + this.platformThickness / 2;

        if (this.ballVy < 0 && this.ball.position.y - this.ballRadius <= platformTopY && this.ball.position.y > pData.y - this.platformThickness) {
          this.raycaster.set(this.ball.position, this.downVector);
          const intersects = this.raycaster.intersectObjects(pData.group.children);

          if (intersects.length > 0 && intersects[0].distance < this.ballRadius + 0.25) {
            const hit = intersects[0].object;
            if (hit.userData['isDanger']) {
              this.ngZone.run(() => {
                this.gameState = 'LOSE';
                this.tools.playSound('sfx_8');
              });
            } else if (hit.userData['isWin']) {
              this.ngZone.run(() => {
                this.gamePoints += 50;
                this.gameState = 'WIN';
                this.tools.playSound('sfx_4');
              });
            } else {
              this.ball.position.y = platformTopY + this.ballRadius;
              this.ballVy = this.bounceVelocity;
              this.ball.scale.set(1.3, 0.7, 1.3);
              this.tools.playSound('sfx_1');
            }
          }
        } else if (this.ball.position.y < pData.y - this.platformThickness) {
          this.currentPlatformIndex++;
          this.ngZone.run(() => {
            this.gamePoints += 10;
          });
        }
      }

      this.camera.position.y += (this.ball.position.y + 3 - this.camera.position.y) * 0.1;
      this.camera.lookAt(0, this.ball.position.y - 1, 0);
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
