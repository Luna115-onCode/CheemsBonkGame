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

  gameState: 'START' | 'PLAYING' | 'ATTACK_READY' | 'ATTACKING' | 'ATTACK_END_DELAY' | 'WIN' | 'LOSE' = 'START';
  gamePoints = 0; // Keeping this for backward compatibility with leaveMinigame
  levelPoints = 0;
  sessionPoints = 0;
  level = 0;
  
  levelsConfig: any[] = [];
  currentLevelConfig: any = null;
  
  collectedItems: Record<string, number> = {};

  timeLeft = 30;
  timeLeftFormatted = "00:30";

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private hole!: THREE.Mesh;
  private ring!: THREE.Mesh;
  private items: THREE.Object3D[] = [];
  private holeRadius = 1.8;
  private targetPosition = new THREE.Vector3(0, 0, 0);
  private animationFrameId: number | null = null;
  private timerInterval: any = null;

  private onResizeBound = this.onWindowResize.bind(this);
  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);

  private mouseNDC = new THREE.Vector2(0, 0);
  private isPointerDown = false;
  
  private ground!: THREE.Mesh;
  private wall!: THREE.Mesh;
  wallCurrentHealth = 1000; // make public for HTML binding
  get wallMaxHealthValue(): number { return this.currentLevelConfig ? this.currentLevelConfig.wallLife : (1000 + (this.level * 500)); }
  private attackProjectiles: { mesh: THREE.Object3D, target: THREE.Vector3, damage: number, type: string, delay: number }[] = [];
  private activeExplosions: { particles: THREE.Points, velocities: THREE.Vector3[] }[] = [];
  itemsConfig: any[] = [];
  private modelCache: Record<string, THREE.Group> = {};

  ngOnInit(): void {
    this.tools.setTitle("attack_hole" as any);
    this.tools.actPage = "attack_hole" as any;
    this.loadModels();
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
    const container = this.gameContainer?.nativeElement;
    if (container) {
      container.removeEventListener('pointerdown', this.onPointerDownBound);
      window.removeEventListener('pointermove', this.onPointerMoveBound);
      window.removeEventListener('pointerup', this.onPointerUpBound);
      window.removeEventListener('pointercancel', this.onPointerUpBound);
    }

    if (this.renderer) {
      this.renderer.dispose();
      const dom = this.gameContainer?.nativeElement;
      if (dom && dom.contains(this.renderer.domElement)) {
        dom.removeChild(this.renderer.domElement);
      }
    }
    const totalPoints = this.sessionPoints + (['WIN', 'LOSE', 'START'].includes(this.gameState) ? 0 : this.levelPoints);
    this.tools.leaveMinigame('attack_hole', totalPoints, this.level);
  }

  startGame(): void {
    if (this.levelsConfig && this.levelsConfig.length > 1) {
      let nextLevel;
      do {
        nextLevel = this.levelsConfig[Math.floor(Math.random() * this.levelsConfig.length)];
      } while (this.currentLevelConfig && nextLevel.id === this.currentLevelConfig.id);
      this.currentLevelConfig = nextLevel;
    } else if (this.levelsConfig && this.levelsConfig.length > 0) {
      this.currentLevelConfig = this.levelsConfig[0];
    }

    this.levelPoints = 0;
    this.gamePoints = 0; // backward compat
    
    // reset ammo counters
    this.itemsConfig.forEach(item => {
      this.collectedItems[item.id] = 0;
    });
    
    this.timeLeft = this.currentLevelConfig ? (this.currentLevelConfig.time || 30) : 30;

    if (this.currentLevelConfig && this.ground) {
      const floorSize = this.currentLevelConfig.floorSize || 100;
      const scale = floorSize / 100;
      this.ground.scale.set(scale, scale, 1);

      if (this.currentLevelConfig.floorPattern) {
        const tex = this.generatePatternTexture(
          this.currentLevelConfig.floorPattern,
          this.currentLevelConfig.floorPrimaryColor,
          this.currentLevelConfig.floorSecondaryColor
        );
        (this.ground.material as THREE.MeshLambertMaterial).map = tex;
        (this.ground.material as THREE.MeshLambertMaterial).color.setHex(0xffffff);
        (this.ground.material as THREE.MeshLambertMaterial).needsUpdate = true;
      }
    }
    
    // Clear attack phase items
    if (this.wall && this.scene) {
      this.scene.remove(this.wall);
    }
    this.attackProjectiles.forEach(p => this.scene.remove(p.mesh));
    this.attackProjectiles = [];
    this.activeExplosions.forEach(expl => this.scene.remove(expl.particles));
    this.activeExplosions = [];
    
    // Reset hole scale instantly
    if (this.hole && this.ring) {
      this.hole.scale.set(1, 1, 1);
      this.ring.scale.set(1, 1, 1);
      this.hole.visible = true;
      this.ring.visible = true;
      this.holeRadius = 1.8;
      if (this.camera) {
        this.camera.position.set(0, 5, 6);
      }
    }

    this.updateTimeFormatted();
    this.gameState = 'PLAYING';
    this.resetScene();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.tools.isWindowBlurred) return;
      if (this.gameState === 'PLAYING') {
        this.timeLeft--;
        this.updateTimeFormatted();
        if (this.timeLeft <= 0) {
          this.ngZone.run(() => this.triggerAttackReady());
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
    this.camera.position.set(0, 5, 6);
    this.camera.lookAt(0, 0, 0);

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

    const groundGeo = new THREE.PlaneGeometry(60, 80);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

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
    container.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('pointercancel', this.onPointerUpBound);

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private async loadModels(): Promise<void> {
    try {
      const levelsResponse = await fetch('games/attack_hole/data/levels.json');
      this.levelsConfig = await levelsResponse.json();

      const response = await fetch('games/attack_hole/data/items.json');
      this.itemsConfig = await response.json();
      this.itemsConfig.forEach(item => {
        this.collectedItems[item.id] = 0;
      });

      const texLoader = new THREE.TextureLoader();
      
      for (const item of this.itemsConfig) {
        const texture = await texLoader.loadAsync(item.texture);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        const geoResponse = await fetch(item.model);
        const geoJson = await geoResponse.json();
        const geoData = geoJson['minecraft:geometry'][0];
        const texW = geoData.description.texture_width;
        const texH = geoData.description.texture_height;
        
        const group = new THREE.Group();
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const mat = new THREE.MeshStandardMaterial({ 
          map: texture,
          transparent: true, 
          alphaTest: 0.1,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(0x222222)
        });
        
        geoData.bones.forEach((bone: any) => {
          bone.cubes.forEach((cube: any) => {
            const [cx, cy, cz] = cube.size;
            const [ox, oy, oz] = cube.origin;
            
            const scale = 0.1;
            const geo = new THREE.BoxGeometry(cx * scale, cy * scale, cz * scale);
            
            if (cube.uv) {
              const uvs = geo.attributes['uv'].array as Float32Array;
              const faceMap: Record<number, string> = {
                0: 'east', 1: 'west', 2: 'up', 3: 'down', 4: 'south', 5: 'north'
              };
              for (let i = 0; i < 6; i++) {
                const faceName = faceMap[i];
                const uvData = cube.uv[faceName];
                if (uvData) {
                  const uvStart = uvData.uv;
                  const uvSize = uvData.uv_size;
                  const idx = i * 8;
                  
                  const u0 = uvStart[0];
                  const v0 = uvStart[1];
                  const u1 = u0 + uvSize[0];
                  const v1 = v0 + uvSize[1];

                  const webgl_u0 = u0 / texW;
                  const webgl_u1 = u1 / texW;
                  const webgl_v0 = 1.0 - (v0 / texH);
                  const webgl_v1 = 1.0 - (v1 / texH);

                  uvs[idx + 0] = webgl_u0; uvs[idx + 1] = webgl_v0;
                  uvs[idx + 2] = webgl_u1; uvs[idx + 3] = webgl_v0;
                  uvs[idx + 4] = webgl_u0; uvs[idx + 5] = webgl_v1;
                  uvs[idx + 6] = webgl_u1; uvs[idx + 7] = webgl_v1;
                }
              }
            }
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            mesh.position.set((ox + cx/2) * scale, (oy + cy/2) * scale, (oz + cz/2) * scale);
            group.add(mesh);
          });
        });
        
        this.modelCache[item.id] = group;
      }
    } catch(e) {
      console.error('Failed to load models', e);
    }
  }

  private createItem(type: string): { group: THREE.Group, points: number, category: string } {
    let itemGroup = new THREE.Group();
    let category = 'ammo';
    let points = 10;
    
    const config = this.itemsConfig.find(i => i.id === type);
    if (config) {
      category = config.category;
      points = config.points;
    }

    if (this.modelCache[type]) {
      itemGroup.add(this.modelCache[type].clone());
    } else {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({color: 0xff0000}));
      itemGroup.add(box);
    }
    
    return { group: itemGroup, points, category };
  }

  private generatePatternTexture(pattern: string, primaryColor: string, secondaryColor: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = primaryColor || '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = secondaryColor || '#000000';
    
    if (pattern === 'squares') {
      for (let y = 0; y < 512; y += 64) {
        for (let x = 0; x < 512; x += 64) {
          if ((x / 64 + y / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
        }
      }
    } else if (pattern === 'triangles') {
      for (let y = 0; y < 512; y += 64) {
        for (let x = 0; x < 512; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x + 32, y);
          ctx.lineTo(x + 64, y + 64);
          ctx.lineTo(x, y + 64);
          ctx.fill();
        }
      }
    } else if (pattern === 'pentagons') {
      for (let y = 0; y < 512; y += 64) {
        for (let x = 0; x < 512; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x + 32, y + 10);
          ctx.lineTo(x + 60, y + 30);
          ctx.lineTo(x + 50, y + 60);
          ctx.lineTo(x + 14, y + 60);
          ctx.lineTo(x + 4, y + 30);
          ctx.fill();
        }
      }
    } else if (pattern === 'hexagons') {
      for (let y = 0; y < 512; y += 64) {
        for (let x = 0; x < 512; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x + 32, y + 5);
          ctx.lineTo(x + 60, y + 20);
          ctx.lineTo(x + 60, y + 45);
          ctx.lineTo(x + 32, y + 60);
          ctx.lineTo(x + 4, y + 45);
          ctx.lineTo(x + 4, y + 20);
          ctx.fill();
        }
      }
    } else if (pattern === 'stars') {
      for (let y = 0; y < 512; y += 64) {
        for (let x = 0; x < 512; x += 64) {
          const cx = x + 32;
          const cy = y + 32;
          ctx.beginPath();
          let rot = Math.PI / 2 * 3;
          let xx = cx; let yy = cy;
          const step = Math.PI / 5;
          ctx.moveTo(cx, cy - 30);
          for (let i = 0; i < 5; i++) {
            xx = cx + Math.cos(rot) * 30;
            yy = cy + Math.sin(rot) * 30;
            ctx.lineTo(xx, yy);
            rot += step;
            xx = cx + Math.cos(rot) * 15;
            yy = cy + Math.sin(rot) * 15;
            ctx.lineTo(xx, yy);
            rot += step;
          }
          ctx.lineTo(cx, cy - 30);
          ctx.fill();
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  private spawnItem(type: string, x: number, z: number): void {
    const { group: itemGroup, points, category } = this.createItem(type);
    if (category === 'ammo') {
      itemGroup.rotation.x = Math.PI / 2;
      itemGroup.rotation.z = Math.random() * Math.PI * 2;
      itemGroup.position.y = 0.3;
    } else {
      itemGroup.position.y = 0.6;
    }
    
    itemGroup.userData = { category, type, points, isFalling: false };
    itemGroup.position.x = x;
    itemGroup.position.z = z;
    this.scene.add(itemGroup);
    this.items.push(itemGroup);
  }

  private resetScene(): void {
    this.items.forEach(item => this.scene.remove(item));
    this.items = [];

    if (this.itemsConfig.length === 0) return;

    const floorSize = this.currentLevelConfig ? (this.currentLevelConfig.floorSize || 100) : 100;
    const scale = floorSize / 100;
    const boundsX = 50 * scale;
    const boundsZ = 70 * scale;
    const grouping = this.currentLevelConfig ? (this.currentLevelConfig.ammoGrouping || 'random') : 'random';

    const itemsToSpawn: string[] = [];

    if (this.currentLevelConfig && this.currentLevelConfig.ammo) {
      const ammoConfig = this.currentLevelConfig.ammo;
      Object.keys(ammoConfig).forEach(type => {
        const [min, max] = ammoConfig[type];
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        for (let i = 0; i < count; i++) {
          itemsToSpawn.push(type);
        }
      });
    } else {
      const ammoItems = this.itemsConfig.filter(i => i.category === 'ammo');
      const bombItems = this.itemsConfig.filter(i => i.category === 'bomb');
      for (let i = 0; i < 100; i++) {
        let type = '';
        const rand = Math.random();
        if (rand < 0.25 && bombItems.length > 0) {
          type = bombItems[Math.floor(Math.random() * bombItems.length)].id;
        } else if (ammoItems.length > 0) {
          type = ammoItems[Math.floor(Math.random() * ammoItems.length)].id;
        } else {
          type = this.itemsConfig[0].id;
        }
        itemsToSpawn.push(type);
      }
    }

    if (grouping === 'grouped') {
      const typeCenters: Record<string, {x: number, z: number}> = {};
      itemsToSpawn.forEach(type => {
        if (!typeCenters[type]) {
          typeCenters[type] = {
            x: (Math.random() - 0.5) * boundsX,
            z: (Math.random() - 0.5) * boundsZ - 2
          };
        }
        const center = typeCenters[type];
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 5 * scale;
        const spawnX = Math.max(-boundsX/2, Math.min(boundsX/2, center.x + Math.cos(angle) * radius));
        const spawnZ = Math.max(-boundsZ/2 - 2, Math.min(boundsZ/2 - 2, center.z + Math.sin(angle) * radius));
        this.spawnItem(type, spawnX, spawnZ);
      });
    } else if (grouping === 'near') {
      // shuffle randomly
      for (let i = itemsToSpawn.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [itemsToSpawn[i], itemsToSpawn[j]] = [itemsToSpawn[j], itemsToSpawn[i]];
      }
      
      let angle = 0;
      let radius = 2;
      itemsToSpawn.forEach((type, index) => {
        const spawnX = Math.max(-boundsX/2, Math.min(boundsX/2, Math.cos(angle) * radius));
        const spawnZ = Math.max(-boundsZ/2 - 2, Math.min(boundsZ/2 - 2, -2 + Math.sin(angle) * radius));
        this.spawnItem(type, spawnX, spawnZ);
        
        angle += 1.5; // step angle
        if (index % 5 === 0) {
          radius += 1.2; // increase radius periodically to form a spiral/circle
        }
      });
    } else {
      // random
      itemsToSpawn.forEach(type => {
        const spawnX = (Math.random() - 0.5) * boundsX;
        const spawnZ = (Math.random() - 0.5) * boundsZ - 2;
        this.spawnItem(type, spawnX, spawnZ);
      });
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

  private updateMouseNDC(event: PointerEvent): void {
    const container = this.gameContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.gameState === 'ATTACK_READY') {
      this.triggerAttack();
      return;
    }
    if (this.gameState !== 'PLAYING') return;
    this.isPointerDown = true;
    this.updateMouseNDC(event);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isPointerDown || this.gameState !== 'PLAYING') return;
    this.updateMouseNDC(event);
  }

  private onPointerUp(event: PointerEvent): void {
    this.isPointerDown = false;
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'PLAYING') {
      if (this.isPointerDown && this.camera) {
        const vector = new THREE.Vector3(this.mouseNDC.x, this.mouseNDC.y, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.y / dir.y;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        const floorSize = this.currentLevelConfig ? (this.currentLevelConfig.floorSize || 100) : 100;
        const scale = floorSize / 100;
        this.targetPosition.x = Math.max(-28 * scale, Math.min(28 * scale, pos.x));
        this.targetPosition.z = Math.max(-38 * scale, Math.min(38 * scale, pos.z));
      }

      this.hole.position.x += (this.targetPosition.x - this.hole.position.x) * 0.15;
      this.hole.position.z += (this.targetPosition.z - this.hole.position.z) * 0.15;
      this.ring.position.x = this.hole.position.x;
      this.ring.position.z = this.hole.position.z;

      const growthFactor = this.currentLevelConfig ? ((this.currentLevelConfig.HoleSizeIncreasePercentage || 100) / 100) : 1.0;
      const targetScale = 1 + ((this.gamePoints / 800) * growthFactor);
      const currentScale = this.hole.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      
      this.hole.scale.set(newScale, newScale, 1);
      this.ring.scale.set(newScale, newScale, 1);
      this.holeRadius = 1.8 * newScale;
      this.hole.position.y = 0.02 * newScale;
      this.ring.position.y = 0.03 * newScale;

      const targetCamY = 5 * newScale;
      const targetCamZOffset = 6 * newScale;

      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.1;
      this.camera.position.x += (this.hole.position.x - this.camera.position.x) * 0.1;
      this.camera.position.z += ((this.hole.position.z + targetCamZOffset) - this.camera.position.z) * 0.1;
      this.camera.lookAt(this.hole.position);

      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (!item.userData['isFalling']) {
          const dx = item.position.x - this.hole.position.x;
          const dz = item.position.z - this.hole.position.z;
          const distSq = dx * dx + dz * dz;
          if (distSq < (this.holeRadius - 0.5) * (this.holeRadius - 0.5)) {
            item.userData['isFalling'] = true;
            // Disable shadows when falling
            item.children.forEach(c => c.castShadow = false);
          }
        } else {
          item.position.y -= 0.15;
          item.scale.multiplyScalar(0.85);
          item.position.x += (this.hole.position.x - item.position.x) * 0.2;
          item.position.z += (this.hole.position.z - item.position.z) * 0.2;

          if (item.scale.x < 0.1) {
            const itemType = item.userData['type'] as string;
            this.collectedItems[itemType] = (this.collectedItems[itemType] || 0) + 1;
            this.levelPoints += item.userData['points'];
            this.gamePoints = this.levelPoints; // compat
            
            this.scene.remove(item);
            this.items.splice(i, 1);
            if (this.items.length === 0) {
              this.ngZone.run(() => this.triggerAttackReady());
            }
          }
        }
      }
      this.ring.rotation.z -= 0.02;
    } else if (this.gameState === 'ATTACKING') {
      // Animate projectiles toward the wall
      let allHit = true;
      let damageThisFrame = 0;
      for (let i = this.attackProjectiles.length - 1; i >= 0; i--) {
        const proj = this.attackProjectiles[i];
        if (proj.delay > 0) {
          proj.delay--;
          if (proj.delay <= 0) {
            proj.mesh.visible = true;
            this.ngZone.run(() => {
              if (this.collectedItems[proj.type] > 0) {
                this.collectedItems[proj.type]--;
              }
            });
          }
          allHit = false;
        } else if (proj.mesh.position.z > proj.target.z) {
          proj.mesh.position.z -= 0.5; // speed
          proj.mesh.rotation.x += 0.2;
          proj.mesh.rotation.y += 0.2;
          allHit = false;
        } else if (proj.damage > 0) {
          // Hit the wall
          damageThisFrame += proj.damage;
          proj.damage = 0; // prevent multiple damage instances
          proj.mesh.visible = false;
        }
      }
      
      if (damageThisFrame > 0) {
        this.ngZone.run(() => {
          this.wallCurrentHealth = Math.max(0, this.wallCurrentHealth - damageThisFrame);
        });

        // Update wall color
        const healthRatio = this.wallCurrentHealth / this.wallMaxHealthValue;
        const r = 1.0;
        const g = healthRatio;
        const b = healthRatio;
        (this.wall.material as THREE.MeshLambertMaterial).color.setRGB(r, g, b);

        if (this.wallCurrentHealth <= 0) {
          this.ngZone.run(() => {
            this.triggerWallBreak();
            this.gameState = 'ATTACK_END_DELAY';
            setTimeout(() => this.ngZone.run(() => this.endLevel(true)), 2500);
          });
          return;
        }
      }
      
      if (allHit && this.wallCurrentHealth > 0) {
        this.ngZone.run(() => {
          this.gameState = 'ATTACK_END_DELAY';
          setTimeout(() => this.ngZone.run(() => this.endLevel(false)), 2500);
        });
      }
    }
    
    // Animate explosions
    for (const expl of this.activeExplosions) {
      const positions = expl.particles.geometry.attributes['position'].array as Float32Array;
      for (let i = 0; i < expl.velocities.length; i++) {
        positions[i * 3] += expl.velocities[i].x;
        positions[i * 3 + 1] += expl.velocities[i].y;
        positions[i * 3 + 2] += expl.velocities[i].z;
        expl.velocities[i].y -= 0.01; // gravity
      }
      expl.particles.geometry.attributes['position'].needsUpdate = true;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private triggerAttackReady(): void {
    if (this.gameState === 'PLAYING') {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.gameState = 'ATTACK_READY';
      this.setupAttackPhase();
    }
  }

  private setupAttackPhase(): void {
    // Hide hole and items on the floor
    this.hole.visible = false;
    this.ring.visible = false;
    this.items.forEach(item => item.visible = false);

    // Setup Camera for attack
    this.camera.position.set(0, 5, 20);
    this.camera.lookAt(0, 5, 0);

    // Setup Boss Wall
    this.wallCurrentHealth = this.wallMaxHealthValue;

    const wallGeo = new THREE.BoxGeometry(20, 20, 2);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    if (this.currentLevelConfig && this.currentLevelConfig.wallPattern) {
      const tex = this.generatePatternTexture(
        this.currentLevelConfig.wallPattern,
        this.currentLevelConfig.wallPrimaryColor,
        this.currentLevelConfig.wallSecondaryColor
      );
      wallMat.map = tex;
    }

    this.wall = new THREE.Mesh(wallGeo, wallMat);
    this.wall.position.set(0, 5, -10);
    this.scene.add(this.wall);
  }

  triggerAttack(): void {
    this.gameState = 'ATTACKING';
    
    // Instantiate a barrage of projectiles based on collectedItems
    this.attackProjectiles = [];
    
    let currentDelay = 0;
    
    const itemsList: {type: string, category: string, points: number}[] = [];
    Object.keys(this.collectedItems).forEach(type => {
      const count = this.collectedItems[type];
      const config = this.itemsConfig.find(i => i.id === type);
      const points = config ? config.points : 10;
      const category = config ? config.category : (type.includes('bomb') ? 'bomb' : 'ammo');

      for (let i = 0; i < count; i++) {
        itemsList.push({type, category, points});
      }
    });

    itemsList.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'ammo' ? -1 : 1;
      }
      return a.points - b.points;
    });

    itemsList.forEach((item) => {
      const { group, points, category } = this.createItem(item.type);
      group.position.set((Math.random() - 0.5) * 10, 5 + (Math.random() - 0.5) * 10, 15 + Math.random() * 5);
      
      currentDelay += category === 'bomb' ? 15 : 5;
      const delay = currentDelay;
      group.visible = false;
      
      this.scene.add(group);
      const target = new THREE.Vector3((Math.random() - 0.5) * 10, 5 + (Math.random() - 0.5) * 10, -9);
      this.attackProjectiles.push({ mesh: group, target, damage: points, type: item.type, delay });
    });
    
    if (this.attackProjectiles.length === 0) {
      // Player collected nothing
      this.endLevel(false);
    }
  }

  private triggerWallBreak(): void {
    this.wall.visible = false;
    
    // Boss explosion
    this.spawnExplosion(this.wall.position.clone(), 100, 10, 0xFF0000);
    this.tools.playSound('sfx_7'); // hit-minecraft.ogg for explosion
    
    // Blow up any mid-air projectiles so the screen is clear
    for (const proj of this.attackProjectiles) {
      if (proj.mesh.visible && proj.damage > 0) {
        proj.mesh.visible = false;
        proj.damage = 0;
        this.spawnExplosion(proj.mesh.position.clone(), 20, 2, 0xFFFF00);
      }
    }
  }

  private spawnExplosion(position: THREE.Vector3, count: number, spread: number, color: number): void {
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * (spread * 0.2);

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      ));
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color, size: 0.5 });
    const particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(particles);
    this.activeExplosions.push({ particles, velocities });
  }

  private endLevel(won: boolean): void {
    this.gameState = won ? 'WIN' : 'LOSE';
    if (won) {
      this.level++;
      this.sessionPoints += this.levelPoints;
    } else {
      this.sessionPoints += this.levelPoints;
    }
    this.tools.playSound(won ? 'sfx_4' : 'sfx_2');
  }

  private endGame(won: boolean = false): void {
    this.gameState = won ? 'WIN' : 'LOSE';
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.tools.playSound(won ? 'sfx_4' : 'sfx_2');
  }

  private stopGameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
