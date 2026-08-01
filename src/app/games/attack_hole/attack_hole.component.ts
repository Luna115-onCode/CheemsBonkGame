import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-attack-hole',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attack_hole.component.html',
  styleUrl: './attack_hole.component.css'
})
export class AttackHoleComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private ngZone: NgZone = inject(NgZone);

  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;

  gameState: 'START' | 'PLAYING' | 'WIN' | 'LOSE' = 'START';
  gamePoints = 0;
  bullets = 0;
  bombs = 0;
  timeLeft = 30;
  timeLeftFormatted = "00:30";

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private hole!: THREE.Mesh;
  private ring!: THREE.Mesh;
  private items: THREE.Mesh[] = [];
  private holeRadius = 1.8;
  private targetPosition = new THREE.Vector3(0, 0, 0);
  private animationFrameId: number | null = null;
  private timerInterval: any = null;

  private onResizeBound = this.onWindowResize.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("attack_hole" as any);
    this.tools.actPage = "attack_hole" as any;
  }

  ngAfterViewInit(): void {
    this.init3D();
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);

    if (this.renderer) {
      this.renderer.dispose();
      const dom = this.gameContainer?.nativeElement;
      if (dom && dom.contains(this.renderer.domElement)) {
        dom.removeChild(this.renderer.domElement);
      }
    }
    this.tools.leaveMinigame('attack_hole', this.gamePoints);
  }

  startGame(): void {
    this.gamePoints = 0;
    this.bullets = 0;
    this.bombs = 0;
    this.timeLeft = 30;
    this.updateTimeFormatted();
    this.gameState = 'PLAYING';
    this.resetScene();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.gameState === 'PLAYING') {
        this.timeLeft--;
        this.updateTimeFormatted();
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }
    }, 1000);
  }

  private updateTimeFormatted(): void {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    this.timeLeftFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private init3D(): void {
    const container = this.gameContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 18, 12);
    this.camera.lookAt(0, 0, 1);

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

    const groundGeo = new THREE.PlaneGeometry(30, 40);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const holeGeo = new THREE.CircleGeometry(this.holeRadius, 32);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    this.hole = new THREE.Mesh(holeGeo, holeMat);
    this.hole.rotation.x = -Math.PI / 2;
    this.hole.position.y = 0.01;
    this.scene.add(this.hole);

    const ringGeo = new THREE.RingGeometry(this.holeRadius, this.holeRadius + 0.15, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.scene.add(this.ring);

    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private resetScene(): void {
    this.items.forEach(item => this.scene.remove(item));
    this.items = [];

    const itemColors = [0xF44336, 0x4CAF50, 0x2196F3, 0xFF9800, 0x9C27B0];
    for (let i = 0; i < 35; i++) {
      const isBomb = Math.random() < 0.25;
      let mesh: THREE.Mesh;
      if (isBomb) {
        const geo = new THREE.SphereGeometry(0.6, 16, 16);
        const mat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { type: 'bomb', isFalling: false };
      } else {
        const geo = new THREE.BoxGeometry(0.8, 0.4, 1.4);
        const color = itemColors[Math.floor(Math.random() * itemColors.length)];
        const mat = new THREE.MeshLambertMaterial({ color });
        mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { type: 'bullet', isFalling: false };
      }
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        0.5,
        (Math.random() - 0.5) * 24 - 2
      );
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.items.push(mesh);
    }
  }

  private onWindowResize(): void {
    if (!this.camera || !this.renderer) return;
    const container = this.gameContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.gameState !== 'PLAYING') return;
    const container = this.gameContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.y / dir.y;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

    this.targetPosition.x = Math.max(-12, Math.min(12, pos.x));
    this.targetPosition.z = Math.max(-15, Math.min(15, pos.z));
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.gameState === 'PLAYING') {
      this.hole.position.x += (this.targetPosition.x - this.hole.position.x) * 0.15;
      this.hole.position.z += (this.targetPosition.z - this.hole.position.z) * 0.15;
      this.ring.position.x = this.hole.position.x;
      this.ring.position.z = this.hole.position.z;

      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (!item.userData['isFalling']) {
          const dx = item.position.x - this.hole.position.x;
          const dz = item.position.z - this.hole.position.z;
          const distSq = dx * dx + dz * dz;
          if (distSq < (this.holeRadius - 0.5) * (this.holeRadius - 0.5)) {
            item.userData['isFalling'] = true;
          }
        } else {
          item.position.y -= 0.15;
          item.scale.multiplyScalar(0.85);
          item.position.x += (this.hole.position.x - item.position.x) * 0.2;
          item.position.z += (this.hole.position.z - item.position.z) * 0.2;

          if (item.scale.x < 0.1) {
            if (item.userData['type'] === 'bullet') {
              this.bullets++;
              this.gamePoints += 10;
            } else {
              this.bombs++;
              this.gamePoints += 50;
            }
            this.scene.remove(item);
            this.items.splice(i, 1);
            if (this.items.length === 0) {
              this.ngZone.run(() => this.endGame(true));
            }
          }
        }
      }
      this.ring.rotation.z -= 0.02;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private endGame(won: boolean = false): void {
    this.gameState = won ? 'WIN' : 'LOSE';
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.tools.playSound(won ? 'sfx_4' : 'sfx_8');
  }

  private stopGameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
