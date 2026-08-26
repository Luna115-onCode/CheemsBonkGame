import re

with open('src/app/games/doge_rescue/doge_rescue.component.ts', 'r') as f:
    content = f.read()

loop_pattern = r'  private loop\(\): void \{.*?(?=  private draw\(\): void \{)'
draw_pattern = r'  private draw\(\): void \{.*?(?=  private onResize\(\): void \{)'

new_loop = '''  private loop(): void {
    this.animationFrameId = requestAnimationFrame(() => this.loop());
    if (this.tools.isWindowBlurred) return;

    if (this.gameState === 'ATTACK') {
      Matter.Engine.update(this.engine, 1000 / 60);

      // Particle update
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.life++;
        if (p.life > p.maxLife) {
          this.particles.splice(i, 1);
        }
      }

      // Water Slow Rate
      for (let r = 0; r < this.mapGrid.length; r++) {
        for (let c = 0; c < this.mapGrid[r].length; c++) {
          const cell = this.mapGrid[r][c];
          const blockDef = this.blocksDef[cell.id];
          if (blockDef && blockDef.slow_rate && cell.body) {
             const slowMultiplier = 1 - blockDef.slow_rate; // 0.128 -> 0.872
             
             this.dogeBodies.forEach(doge => {
                if (Matter.Collision.collides(doge, cell.body)) {
                    Matter.Body.setVelocity(doge, { x: doge.velocity.x * slowMultiplier, y: doge.velocity.y * slowMultiplier });
                }
             });
             this.bees.forEach(bee => {
                if (Matter.Collision.collides(bee.body, cell.body)) {
                    Matter.Body.setVelocity(bee.body, { x: bee.body.velocity.x * slowMultiplier, y: bee.body.velocity.y * slowMultiplier });
                }
             });
             if (this.drawnLineBody && Matter.Collision.collides(this.drawnLineBody, cell.body)) {
                Matter.Body.setVelocity(this.drawnLineBody, { x: this.drawnLineBody.velocity.x * slowMultiplier, y: this.drawnLineBody.velocity.y * slowMultiplier });
             }
          }
        }
      }

      // Bee AI
      if (this.dogeBodies.length > 0) {
        this.bees.forEach(bee => {
          let nearestDoge = this.dogeBodies[0];
          let minDist = Infinity;
          for (let doge of this.dogeBodies) {
             const dist = Math.hypot(doge.position.x - bee.body.position.x, doge.position.y - bee.body.position.y);
             if (dist < minDist) {
                minDist = dist;
                nearestDoge = doge;
             }
          }

          const dx = nearestDoge.position.x - bee.body.position.x;
          const dy = nearestDoge.position.y - bee.body.position.y;
          if (minDist > 0) {
            Matter.Body.applyForce(bee.body, bee.body.position, {
              x: (dx / minDist) * this.currentLevelDef.brutality.force,
              y: (dy / minDist) * this.currentLevelDef.brutality.force
            });
          }

          if (bee.body.speed > this.currentLevelDef.brutality.maxSpeed) {
            Matter.Body.setVelocity(bee.body, {
              x: (bee.body.velocity.x / bee.body.speed) * this.currentLevelDef.brutality.maxSpeed,
              y: (bee.body.velocity.y / bee.body.speed) * this.currentLevelDef.brutality.maxSpeed
            });
          }
        });
      }

      // Check Doge out of bounds
      const canvas = this.canvasRef.nativeElement;
      for (let doge of this.dogeBodies) {
        if (doge.position.y > canvas.height + 50 || doge.position.x < -50 || doge.position.x > canvas.width + 50) {
          this.removeEntity(doge, 'doge', '#ffaa00');
          break; // removeEntity handles LOSE state
        }
      }
    }

    this.draw();
  }

'''

new_draw = '''  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map Blocks
    for (let r = 0; r < this.mapGrid.length; r++) {
      for (let c = 0; c < this.mapGrid[r].length; c++) {
        const cell = this.mapGrid[r][c];
        const blockDef = this.blocksDef[cell.id];
        if (blockDef && blockDef.src && this.textures[cell.id]) {
          if (cell.body && blockDef.physics) {
            ctx.save();
            ctx.translate(cell.body.position.x, cell.body.position.y);
            ctx.rotate(cell.body.angle);
            // rect w/h
            ctx.drawImage(this.textures[cell.id], -cell.rect.w/2, -cell.rect.h/2, cell.rect.w, cell.rect.h);
            ctx.restore();
          } else {
            ctx.drawImage(this.textures[cell.id], cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
          }
        }
      }
    }

    // Draw Doges
    if (this.textures['doge']) {
      for (let dogeBody of this.dogeBodies) {
        ctx.save();
        ctx.translate(dogeBody.position.x, dogeBody.position.y);
        ctx.rotate(dogeBody.angle);
        const rad = dogeBody.circleRadius || 20;
        ctx.drawImage(this.textures['doge'], -rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      }
    }

    // Draw Pre-physics Line
    if (this.isDrawing && this.currentDrawing.length > 1) {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      this.currentDrawing.forEach((p, i) => {
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    // Draw Physical Line
    if (this.drawnLineBody) {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      for (let i = 1; i < this.drawnLineBody.parts.length; i++) {
        const part = this.drawnLineBody.parts[i];
        ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
        for (let j = 1; j < part.vertices.length; j++) {
          ctx.lineTo(part.vertices[j].x, part.vertices[j].y);
        }
        ctx.lineTo(part.vertices[0].x, part.vertices[0].y);
      }
      ctx.fill();
    }

    // Draw Bees
    if (this.textures['bee']) {
      this.bees.forEach(bee => {
        ctx.save();
        ctx.translate(bee.body.position.x, bee.body.position.y);
        let angle = Math.atan2(bee.body.velocity.y, bee.body.velocity.x);
        ctx.rotate(angle);
        const rad = bee.circleRadius * 1.5;
        ctx.drawImage(this.textures['bee'], -rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      });
    }

    // Draw Particles
    for (let p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Ink Bar UI
    if (this.gameState === 'DRAWING' || this.gameState === 'ATTACK') {
      const barWidth = canvas.width * 0.8;
      const barHeight = 15;
      const x = (canvas.width - barWidth) / 2;
      const y = 80;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, 8);
      else ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();

      const remainingRatio = Math.max(0, 1 - (this.lineLength / this.maxLineLength));
      if (remainingRatio > 0) {
        ctx.fillStyle = remainingRatio > 0.25 ? '#4CAF50' : '#F44336';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barWidth * remainingRatio, barHeight, 8);
        else ctx.rect(x, y, barWidth * remainingRatio, barHeight);
        ctx.fill();
      }

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, 8);
      else ctx.rect(x, y, barWidth, barHeight);
      ctx.stroke();
    }
  }

'''

content = re.sub(loop_pattern, new_loop, content, flags=re.DOTALL)
content = re.sub(draw_pattern, new_draw, content, flags=re.DOTALL)

with open('src/app/games/doge_rescue/doge_rescue.component.ts', 'w') as f:
    f.write(content)

