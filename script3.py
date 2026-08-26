import re

with open('src/app/games/doge_rescue/doge_rescue.component.ts', 'r') as f:
    content = f.read()

# Fix the duplicate resetPhysics
content = content.replace("  private resetPhysics(): void {\n  private resetPhysics(): void {", "  private resetPhysics(): void {")

# Add helper methods: removeEntity and convertBlock
helpers = '''
  private removeEntity(body: Matter.Body, type: 'doge' | 'bee', color: string): void {
    const isBee = type === 'bee';
    
    // Spawn particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: body.position.x,
        y: body.position.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color,
        life: 0,
        maxLife: 30 + Math.random() * 20
      });
    }

    if (isBee) {
      this.bees = this.bees.filter(b => b.body !== body);
      Matter.World.remove(this.engine.world, body);
    } else {
      this.dogeBodies = this.dogeBodies.filter(b => b !== body);
      Matter.World.remove(this.engine.world, body);
      this.ngZone.run(() => {
        this.gameState = 'LOSE';
        if (this.attackTimer) clearInterval(this.attackTimer);
        if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
        this.tools.playSound('sfx_8');
      });
    }
  }

  private convertBlock(cell: any, newBlockId: string): void {
    const blockDef = this.blocksDef[newBlockId];
    if (cell.body) Matter.World.remove(this.engine.world, cell.body);
    cell.id = newBlockId;
    cell.body = null;
    cell.convertTimer = null;

    if (!blockDef) return;
    if (blockDef.solid || blockDef.kills || blockDef.slow_rate || blockDef.hit_converts) {
      const isStatic = !blockDef.physics;
      const isSensor = !blockDef.solid;
      const opts: Matter.IChamferableBodyDefinition = {
        isStatic: isStatic,
        isSensor: isSensor,
        friction: 1,
        restitution: 0.1,
        label: 'block_' + newBlockId
      };
      
      const centerX = cell.rect.x + cell.rect.w / 2;
      const centerY = cell.rect.y + cell.rect.h / 2;
      
      if (blockDef.shape === 'circle') {
        cell.body = Matter.Bodies.circle(centerX, centerY, cell.rect.w / 2, opts);
      } else if (blockDef.shape === 'triangle') {
        cell.body = Matter.Bodies.polygon(centerX, centerY, 3, cell.rect.w / 2, opts);
      } else {
        cell.body = Matter.Bodies.rectangle(centerX, centerY, cell.rect.w + 1, cell.rect.h + 1, opts);
      }
      Matter.World.add(this.engine.world, cell.body);
    }
  }

  private initPhysics'''
content = content.replace("  private initPhysics", helpers)

# Update collisionStart inside initPhysics
collision_logic = '''
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      if (this.gameState !== 'ATTACK') return;
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        
        // Check Bee vs Doge
        if ((bodyA.label === 'doge' && bodyB.label === 'bee') || (bodyA.label === 'bee' && bodyB.label === 'doge')) {
          this.ngZone.run(() => {
            this.gameState = 'LOSE';
            if (this.attackTimer) clearInterval(this.attackTimer);
            if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
            this.tools.playSound('sfx_8');
          });
          return;
        }

        const handleBlockCollision = (blockBody: Matter.Body, otherBody: Matter.Body) => {
          const isDoge = otherBody.label === 'doge';
          const isBee = otherBody.label === 'bee';
          const blockId = blockBody.label.replace('block_', '');
          const blockDef = this.blocksDef[blockId];
          
          if (!blockDef) return;

          // Kills check
          if (blockDef.kills) {
            if ((blockDef.kills === 'both' || blockDef.kills === 'doge') && isDoge) {
              this.removeEntity(otherBody, 'doge', '#ffaa00');
            }
            if ((blockDef.kills === 'both' || blockDef.kills === 'bee') && isBee) {
              this.removeEntity(otherBody, 'bee', '#ffff00');
            }
          }

          // Hit converts check
          if (blockDef.hit_converts && (isDoge || isBee || otherBody.isStatic === false)) {
            // find cell
            let targetCell = null;
            for (let r = 0; r < this.mapGrid.length; r++) {
              for (let c = 0; c < this.mapGrid[r].length; c++) {
                if (this.mapGrid[r][c].body === blockBody) {
                  targetCell = this.mapGrid[r][c];
                  break;
                }
              }
            }
            if (targetCell && !targetCell.convertTimer) {
              targetCell.convertTimer = setTimeout(() => {
                this.ngZone.runOutsideAngular(() => {
                  if (blockDef.hit_converts!.play_sound) {
                    this.tools.playSound(blockDef.hit_converts!.play_sound as any);
                  }
                  this.convertBlock(targetCell, blockDef.hit_converts!.to);
                });
              }, blockDef.hit_converts.after * 1000);
            }
          }
        };

        if (bodyA.label.startsWith('block_')) handleBlockCollision(bodyA, bodyB);
        if (bodyB.label.startsWith('block_')) handleBlockCollision(bodyB, bodyA);
      }
    });
'''
old_collision = '''    // Collision listener
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      if (this.gameState !== 'ATTACK') return;
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        if ((bodyA.label === 'doge' && bodyB.label === 'bee') || (bodyA.label === 'bee' && bodyB.label === 'doge')) {
          this.ngZone.run(() => {
            this.gameState = 'LOSE';
            if (this.attackTimer) clearInterval(this.attackTimer);
            if (this.beeSpawnTimer) clearInterval(this.beeSpawnTimer);
            this.tools.playSound('sfx_8');
          });
          return;
        }
      }
    });'''
content = content.replace(old_collision, collision_logic)

with open('src/app/games/doge_rescue/doge_rescue.component.ts', 'w') as f:
    f.write(content)
