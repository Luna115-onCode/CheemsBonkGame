import { Component, OnInit, OnDestroy, AfterViewInit, inject, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-magic-sort',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './magic_sort.component.html',
  styleUrl: './magic_sort.component.css'
})
export class MagicSortComponent implements OnInit, AfterViewInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private renderer: Renderer2 = inject(Renderer2);
  private elRef: ElementRef = inject(ElementRef);

  gameState: 'START' | 'PLAYING' | 'WIN' = 'START';
  level = 0;

  tubes: string[][] = [];
  selectedTubeIndex: number | null = null;
  private initialTubesState: string[][] = [];
  private TUBE_CAPACITY = 4;
  private COLORS = [
    '#F44336', // Red
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FFEB3B', // Yellow
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63'  // Pink
  ];

  private stars: any[] = [];

  ngOnInit(): void {
    this.tools.setTitle("magic_sort" as any);
    this.tools.actPage = "magic_sort" as any;
    this.tools.sessionPoints = 0;
    this.startLevel(); // Set initial UI states
    this.gameState = 'START';
  }

  ngAfterViewInit(): void {
    this.createStars();
  }

  ngOnDestroy(): void {
    // Remove stars from body/host
    this.stars.forEach(star => {
      if (star.parentNode) {
        this.renderer.removeChild(star.parentNode, star);
      }
    });
    this.tools.leaveMinigame('magic_sort', this.tools.sessionPoints, this.level);
  }

  private createStars(): void {
    for (let i = 0; i < 50; i++) {
      let star = this.renderer.createElement('div');
      this.renderer.addClass(star, 'star');
      const size = Math.random() * 4 + 1;
      this.renderer.setStyle(star, 'width', `${size}px`);
      this.renderer.setStyle(star, 'height', `${size}px`);
      this.renderer.setStyle(star, 'left', `${Math.random() * 100}vw`);
      this.renderer.setStyle(star, 'top', `${Math.random() * 100}vh`);
      this.renderer.setStyle(star, 'animationDuration', `${Math.random() * 2 + 1}s`);
      this.renderer.setStyle(star, 'animationDelay', `${Math.random() * 2}s`);
      this.renderer.appendChild(this.elRef.nativeElement, star);
      this.stars.push(star);
    }
  }

  startLevel(): void {
    this.gameState = 'PLAYING';
    this.generateLevel(this.level);
  }

  nextLevel(): void {
    this.level++;
    this.tools.sessionPoints += 10; // Award points for completing the level
    this.tools.playSound('sfx_3'); // Win sound
    this.startLevel();
  }

  restartLevel(): void {
    this.tubes = JSON.parse(JSON.stringify(this.initialTubesState));
    this.selectedTubeIndex = null;
    this.gameState = 'PLAYING';
  }

  onTubeClick(index: number): void {
    if (this.gameState !== 'PLAYING') return;

    if (this.selectedTubeIndex === null) {
      if (this.tubes[index].length > 0 && !this.isTubeComplete(index)) {
        this.selectedTubeIndex = index;
        this.tools.playSound('sfx_1');
      }
    } else if (this.selectedTubeIndex === index) {
      this.selectedTubeIndex = null;
    } else {
      if (this.canPour(this.selectedTubeIndex, index)) {
        this.pour(this.selectedTubeIndex, index);
        this.selectedTubeIndex = null;
        this.tools.playSound('sfx_1'); // Pouring sound
        this.checkWinCondition();
      } else {
        if (this.tubes[index].length > 0 && !this.isTubeComplete(index)) {
          this.selectedTubeIndex = index;
          this.tools.playSound('sfx_1');
        } else {
          this.selectedTubeIndex = null;
          this.tools.playSound('sfx_8'); // Error sound
        }
      }
    }
  }

  private generateLevel(lvl: number): void {
    const numColors = Math.min(3 + Math.floor(lvl / 3), this.COLORS.length);
    const numEmpty = 2;
    const totalTubes = numColors + numEmpty;

    let colorPool: string[] = [];
    for (let i = 0; i < numColors; i++) {
      for (let j = 0; j < this.TUBE_CAPACITY; j++) {
        colorPool.push(this.COLORS[i]);
      }
    }

    for (let i = colorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
    }

    this.tubes = [];
    let poolIndex = 0;

    for (let i = 0; i < numColors; i++) {
      let tube: string[] = [];
      for (let j = 0; j < this.TUBE_CAPACITY; j++) {
        tube.push(colorPool[poolIndex++]);
      }
      this.tubes.push(tube);
    }

    for (let i = 0; i < numEmpty; i++) {
      this.tubes.push([]);
    }

    this.initialTubesState = JSON.parse(JSON.stringify(this.tubes));
    this.selectedTubeIndex = null;
  }

  private isTubeComplete(index: number): boolean {
    const tube = this.tubes[index];
    if (tube.length !== this.TUBE_CAPACITY) return false;
    const firstColor = tube[0];
    return tube.every(color => color === firstColor);
  }

  private canPour(srcIdx: number, tgtIdx: number): boolean {
    const srcTube = this.tubes[srcIdx];
    const tgtTube = this.tubes[tgtIdx];

    if (srcTube.length === 0 || tgtTube.length === this.TUBE_CAPACITY) return false;
    if (tgtTube.length === 0) return true;

    const srcTopColor = srcTube[srcTube.length - 1];
    const tgtTopColor = tgtTube[tgtTube.length - 1];

    return srcTopColor === tgtTopColor;
  }

  private pour(srcIdx: number, tgtIdx: number): void {
    const srcTube = this.tubes[srcIdx];
    const tgtTube = this.tubes[tgtIdx];
    const colorToMove = srcTube[srcTube.length - 1];

    let blocksToMove = 0;
    for (let i = srcTube.length - 1; i >= 0; i--) {
      if (srcTube[i] === colorToMove) blocksToMove++;
      else break;
    }

    const availableSpace = this.TUBE_CAPACITY - tgtTube.length;
    const actualMoves = Math.min(blocksToMove, availableSpace);

    for (let i = 0; i < actualMoves; i++) {
      const popped = srcTube.pop();
      if (popped) tgtTube.push(popped);
    }
  }

  private checkWinCondition(): void {
    const isWon = this.tubes.every((t, i) => t.length === 0 || this.isTubeComplete(i));
    
    if (isWon) {
      setTimeout(() => {
        this.gameState = 'WIN';
        this.tools.playSound('sfx_4');
      }, 300);
    }
  }
}
