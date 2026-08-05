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

  gameState: 'START' | 'PLAYING' | 'DYING' | 'WIN' | 'LOSE' = 'START';
  gamePoints = 0;
  levelPoints = 0;
  level = 0;
  
  levelsConfig: any[] = [];
  currentLevelConfig: any = null;
  timeLeft: number = 0;
  private timerInterval: any = null;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private towerGroup!: THREE.Group;
  private ball!: THREE.Mesh;
  private pillar!: THREE.Mesh;
  
  private explosionParticles: THREE.Points | null = null;
  private explosionVelocities: THREE.Vector3[] = [];

  private ballVy = 0;
  private gravity = -0.015;
  private bounceVelocity = 0.28;
  private ballRadius = 0.45;
  private platformThickness = 0.4;
  private currentPlatformIndex = 0;
  private platformsData: Array<{ y: number; group: THREE.Group; broken?: boolean }> = [];

  private consecutiveHoles = 0;
  private chargeTrail: THREE.Mesh[] = [];
  private breakingWedges: Array<{ mesh: THREE.Mesh, vx: number, vy: number, vz: number }> = [];

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
    this.fetchLevels();
  }


  async fetchLevels(): Promise<void> {
    try {
      const response = await fetch('/games/helix_jump/data/levels.json');
      if (response.ok) {
        this.levelsConfig = await response.json();
      }
    } catch (e) {
      console.error("Failed to load levels.json", e);
    }
  }

  ngAfterViewInit(): void {
    this.init3D();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    this.stopTimer();
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
    this.gameState = 'PLAYING';
    this.levelPoints = 0;
    this.resetLevel();
  }

  nextLevel(): void {
    this.level++;
    this.levelPoints = 0;
    this.gameState = 'PLAYING';
    this.resetLevel();
  }
  
  private startTimer(): void {
    this.stopTimer();
    if (this.currentLevelConfig && this.currentLevelConfig.time > 0) {
      this.ngZone.run(() => {
        this.timeLeft = this.currentLevelConfig.time;
      });
      this.timerInterval = setInterval(() => {
        if (this.tools.isWindowBlurred) return;
        this.ngZone.run(() => {
          this.timeLeft--;
          if (this.timeLeft <= 0) {
            this.stopTimer();
            this.triggerExplosion();
          }
        });
      }, 1000);
    } else {
      this.timeLeft = 0;
    }
  }
  
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
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

    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, 150, 32);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xD0D0D0 });
    this.pillar = new THREE.Mesh(pillarGeo, pillarMat);
    this.pillar.position.y = -50;
    this.towerGroup.add(this.pillar);

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
    if (this.explosionParticles) {
      this.scene.remove(this.explosionParticles);
      this.explosionParticles.geometry.dispose();
      (this.explosionParticles.material as THREE.Material).dispose();
      this.explosionParticles = null;
    }

    this.consecutiveHoles = 0;
    this.chargeTrail.forEach(p => {
       this.scene.remove(p);
       p.geometry.dispose();
       (p.material as THREE.Material).dispose();
    });
    this.chargeTrail = [];
    
    this.breakingWedges.forEach(w => {
       this.scene.remove(w.mesh);
       w.mesh.geometry.dispose();
       (w.mesh.material as THREE.Material).dispose();
    });
    this.breakingWedges = [];
    
    if (this.levelsConfig && this.levelsConfig.length > 0) {
      this.currentLevelConfig = this.levelsConfig[Math.floor(Math.random() * this.levelsConfig.length)];
    } else {
      this.currentLevelConfig = {
        floors: 6 + this.level * 2,
        safeFloorPercentage: 60,
        holeSizePercentage: 15,
        numberOfHoles: 1,
        holesSorting: "random",
        distanceBetweenFloors: 3.5,
        time: 30,
        tubeColor: "rgba(208, 208, 208, 1)",
        backgroundColor: "rgba(236, 236, 236, 1)",
        floorColor: "rgba(0, 230, 118, 1)",
        floorKillerColor: "rgba(211, 47, 47, 1)",
        ballColor: "rgba(255, 64, 129, 1)"
      };
    }

    this.scene.background = new THREE.Color(this.currentLevelConfig.backgroundColor);
    (this.pillar.material as THREE.MeshLambertMaterial).color = new THREE.Color(this.currentLevelConfig.tubeColor);
    (this.ball.material as THREE.MeshLambertMaterial).color = new THREE.Color(this.currentLevelConfig.ballColor);

    this.platformsData.forEach(p => this.towerGroup.remove(p.group));
    this.platformsData = [];

    this.currentPlatformIndex = 0;
    this.ball.visible = true;
    this.ball.position.set(0, 8, 2.5);
    this.ballVy = 0;
    this.towerGroup.rotation.y = 0;

    const numPlatforms = this.currentLevelConfig.floors;
    const gapY = this.currentLevelConfig.distanceBetweenFloors || 3.5;
    this.platformThickness = Math.min(0.4, gapY * 0.8);
    
    const tubeHeight = Math.max(150, numPlatforms * gapY + 50);
    this.pillar.scale.set(1, tubeHeight / 150, 1);
    this.pillar.position.y = 30 - (tubeHeight / 2);
    
    let previousRotationOffset = Math.random() * Math.PI * 2;
    let holesSorting = this.currentLevelConfig.holesSorting || "random";
    let alignDrift = Math.random() < 0.33 ? 0 : (Math.random() < 0.5 ? -1 : 1);
    
    for (let i = 0; i < numPlatforms; i++) {
      const y = 6 - i * gapY;
      const group = new THREE.Group();
      group.position.y = y;

      const isLast = i === numPlatforms - 1;
      const numSlices = 36;
      
      let safePercent = this.currentLevelConfig.safeFloorPercentage || 60;
      let holePercent = this.currentLevelConfig.holeSizePercentage || 15;
      
      if (isLast) {
         safePercent = 100;
         holePercent = 0;
      }

      const holeSlicesTotal = Math.floor(numSlices * (holePercent / 100));
      
      const minHoleSize = 3;
      let holes = isLast ? 0 : this.currentLevelConfig.numberOfHoles;
      let holeSize = holes > 0 ? Math.max(1, Math.floor(holeSlicesTotal / holes)) : 0;
      
      let rotationOffset = 0;
      if (holesSorting !== "random") {
         if (i === 0) {
            rotationOffset = previousRotationOffset;
         } else if (holesSorting === "oposite") {
            rotationOffset = previousRotationOffset + Math.PI;
         } else if (holesSorting === "aligned") {
            rotationOffset = previousRotationOffset + (alignDrift * 0.08);
         } else if (holesSorting === "serpent") {
            let serpentDrift = Math.random() < 0.5 ? -0.08 : 0.08;
            rotationOffset = previousRotationOffset + serpentDrift;
         }
         group.rotation.y = rotationOffset;
         previousRotationOffset = rotationOffset;
      }

      const holeStartIndices: number[] = [];
      if (holes > 0) {
        const interval = Math.floor(numSlices / holes);
        for (let h = 0; h < holes; h++) {
           if (holesSorting === "random") {
              let start = h * interval + Math.floor(Math.random() * (interval - holeSize + 1));
              holeStartIndices.push(start);
           } else {
              let start = h * interval;
              holeStartIndices.push(start);
           }
        }
      }

      const sliceAngle = (Math.PI * 2) / numSlices;
      let startAngle = 0;
      
      const dangerPercent = Math.max(0, 100 - safePercent - holePercent);
      let dangerSlices = Math.floor(numSlices * (dangerPercent / 100));
      if (isLast || i === 0) dangerSlices = 0;
      
      let nonHoleCount = numSlices - (holes * holeSize);
      let dangerArray = new Array(nonHoleCount).fill(false);
      for(let d = 0; d < dangerSlices; d++) {
         if (d < dangerArray.length) dangerArray[d] = true;
      }
      for (let j = dangerArray.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [dangerArray[j], dangerArray[k]] = [dangerArray[k], dangerArray[j]];
      }

      for (let s = 0; s < numSlices; s++) {
        let isHole = false;
        for (let startIdx of holeStartIndices) {
           if (s >= startIdx && s < startIdx + holeSize) {
             isHole = true;
             break;
           }
        }
        
        if (isHole) {
          startAngle += sliceAngle;
          continue;
        }

        const wedgeGeo = new THREE.CylinderGeometry(3.2, 3.2, this.platformThickness, 4, 1, false, startAngle, sliceAngle);
        let colorStr = this.currentLevelConfig.floorColor;
        let isDanger = false;
        let isWin = false;

        if (isLast) {
          colorStr = "rgba(255, 213, 79, 1)";
          isWin = true;
        } else {
          isDanger = dangerArray.pop() || false;
          if (isDanger) {
             colorStr = this.currentLevelConfig.floorKillerColor;
          }
        }

        const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(colorStr) });
        const wedge = new THREE.Mesh(wedgeGeo, mat);
        wedge.receiveShadow = true;
        wedge.userData = { isDanger, isWin };
        group.add(wedge);

        startAngle += sliceAngle;
      }

      this.towerGroup.add(group);
      this.platformsData.push({ y, group });
    }
    
    this.startTimer();
  }

  private breakFloor(pData: { y: number; group: THREE.Group; broken?: boolean }, isSmashed: boolean = false): void {
    if (pData.broken) return;
    pData.broken = true;

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const wedgesToBreak = [...pData.group.children];
    const speedMultiplier = isSmashed ? 1.5 : 0.8;

    wedgesToBreak.forEach((child) => {
      const wedge = child as THREE.Mesh;
      wedge.getWorldPosition(worldPos);
      wedge.getWorldQuaternion(worldQuat);
      this.scene.add(wedge);
      wedge.position.copy(worldPos);
      wedge.quaternion.copy(worldQuat);
      const r = Math.random() * Math.PI * 2;
      this.breakingWedges.push({
          mesh: wedge,
          vx: Math.cos(r) * 0.4 * speedMultiplier,
          vy: (Math.random() * 0.3 + 0.2) * speedMultiplier,
          vz: Math.sin(r) * 0.4 * speedMultiplier
      });
    });
    this.towerGroup.remove(pData.group);
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

  private triggerExplosion(): void {
    if (this.explosionParticles) return;
    
    this.ball.visible = false;
    this.gameState = 'LOSE';
    this.stopTimer();

    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.explosionVelocities = [];

    const ballColor = new THREE.Color(this.currentLevelConfig?.ballColor || 0xFF4081);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = this.ball.position.x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = this.ball.position.y + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = this.ball.position.z + (Math.random() - 0.5) * 0.5;

      this.explosionVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3 + 0.2,
        (Math.random() - 0.5) * 0.3
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({ 
      color: ballColor,
      size: 0.3,
    });

    this.explosionParticles = new THREE.Points(geometry, material);
    this.scene.add(this.explosionParticles);

    this.tools.playSound('sfx_8');
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'PLAYING') {
      this.ballVy += this.gravity;
      this.ball.position.y += this.ballVy;

      this.ball.scale.x += (1 - this.ball.scale.x) * 0.1;
      this.ball.scale.y += (1 - this.ball.scale.y) * 0.1;
      this.ball.scale.z += (1 - this.ball.scale.z) * 0.1;

      // Pass-through fix
      const lastPlatform = this.platformsData[this.platformsData.length - 1];
      if (lastPlatform && this.ball.position.y < lastPlatform.y - this.platformThickness) {
         this.ngZone.run(() => {
           this.gamePoints += 50;
           this.gameState = 'WIN';
           this.stopTimer();
           this.tools.playSound('sfx_4');
         });
         return; 
      }

      const pData = this.platformsData[this.currentPlatformIndex];
      if (pData) {
        let didHit = false;
        const platformTopY = pData.y + this.platformThickness / 2;

        if (!pData.broken && this.ballVy < 0 && this.ball.position.y - this.ballRadius <= platformTopY) {
          const rayPos = new THREE.Vector3(this.ball.position.x, platformTopY + 1.0, this.ball.position.z);
          this.raycaster.set(rayPos, this.downVector);
          const intersects = this.raycaster.intersectObjects(pData.group.children);

          if (intersects.length > 0) {
            didHit = true;
            const hit = intersects[0].object;
            
            if (this.consecutiveHoles >= 3) {
               this.consecutiveHoles = 0;
               this.ngZone.run(() => {
                 this.gamePoints += 20;
                 this.levelPoints += 20;
                 this.tools.playSound('sfx_1');
               });
               
               this.breakFloor(pData, true);
            } else {
               this.consecutiveHoles = 0;
               if (hit.userData['isDanger']) {
                 this.ngZone.run(() => {
                   this.triggerExplosion();
                 });
               } else if (hit.userData['isWin']) {
                 this.ngZone.run(() => {
                   this.gamePoints += 50;
                   this.levelPoints += 50;
                   this.gameState = 'WIN';
                   this.stopTimer();
                   this.tools.playSound('sfx_4');
                 });
               } else {
                 this.ball.position.y = platformTopY + this.ballRadius;
                 this.ballVy = this.bounceVelocity;
                 this.ball.scale.set(1.3, 0.7, 1.3);
                 this.tools.playSound('sfx_1');
               }
            }
          }
        } 
        
        if (!didHit && this.ball.position.y < pData.y - this.platformThickness) {
          this.currentPlatformIndex++;
          if (!pData.broken) {
             this.consecutiveHoles++;
             this.breakFloor(pData, false);
          }
          this.ngZone.run(() => {
            this.gamePoints += 10;
            this.levelPoints += 10;
          });
        }
      }

      if (this.consecutiveHoles >= 3) {
         const pGeo = new THREE.SphereGeometry(this.ballRadius * 0.6, 8, 8);
         const pMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 });
         const p = new THREE.Mesh(pGeo, pMat);
         p.position.copy(this.ball.position);
         p.position.x += (Math.random() - 0.5) * 0.6;
         p.position.z += (Math.random() - 0.5) * 0.6;
         this.scene.add(p);
         this.chargeTrail.push(p);
      }

      for(let i = this.chargeTrail.length - 1; i >= 0; i--) {
         const p = this.chargeTrail[i];
         p.scale.multiplyScalar(0.85);
         p.position.y += 0.1;
         (p.material as THREE.MeshBasicMaterial).opacity -= 0.05;
         if (p.scale.x < 0.1 || (p.material as THREE.MeshBasicMaterial).opacity <= 0) {
            this.scene.remove(p);
            p.geometry.dispose();
            (p.material as THREE.Material).dispose();
            this.chargeTrail.splice(i, 1);
         }
      }
      
      for(let i = this.breakingWedges.length - 1; i >= 0; i--) {
         const bw = this.breakingWedges[i];
         bw.vy += this.gravity;
         bw.mesh.position.x += bw.vx;
         bw.mesh.position.y += bw.vy;
         bw.mesh.position.z += bw.vz;
         bw.mesh.rotation.x += 0.1;
         bw.mesh.rotation.z += 0.1;
         if (bw.mesh.position.y < this.camera.position.y - 20) {
            this.scene.remove(bw.mesh);
            bw.mesh.geometry.dispose();
            (bw.mesh.material as THREE.Material).dispose();
            this.breakingWedges.splice(i, 1);
         }
      }

      this.camera.position.y += (this.ball.position.y + 3 - this.camera.position.y) * 0.1;
      this.camera.lookAt(0, this.ball.position.y - 1, 0);
    }

    if (this.explosionParticles) {
      const positions = this.explosionParticles.geometry.attributes['position'].array as Float32Array;
      for (let i = 0; i < this.explosionVelocities.length; i++) {
        this.explosionVelocities[i].y += this.gravity;
        positions[i * 3] += this.explosionVelocities[i].x;
        positions[i * 3 + 1] += this.explosionVelocities[i].y;
        positions[i * 3 + 2] += this.explosionVelocities[i].z;
      }
      this.explosionParticles.geometry.attributes['position'].needsUpdate = true;
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
