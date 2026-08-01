import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-magic-sort',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './magic_sort.component.html',
  styleUrl: './magic_sort.component.css'
})
export class MagicSortComponent implements OnInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);

  gameState: 'START' | 'PLAYING' | 'WIN' = 'START';
  gamePoints = 0;
  level = 1;

  tubes: string[][] = [];
  selectedTubeIndex: number | null = null;
  private initialTubesState: string[][] = [];
  private TUBE_CAPACITY = 4;
  private COLORS = [
    '#FF5252', '#4CAF50', '#2196F3', '#FFEB3B',
    '#9C27B0', '#FF9800', '#00BCD4', '#E91E63'
  ];

  ngOnInit(): void {
    this.tools.setTitle("magic_sort" as any);
    this.tools.actPage = "magic_sort" as any;
  }

  ngOnDestroy(): void {
    this.tools.leaveMinigame('magic_sort', this.gamePoints, this.level);
  }

  startLevel(): void {
    this.gameState = 'PLAYING';
    this.generateLevel(this.level);
  }

  nextLevel(): void {
    this.level++;
    this.startLevel();
  }

  restartLevel(): void {
    this.tubes = JSON.parse(JSON.stringify(this.initialTubesState));
    this.selectedTubeIndex = null;
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
        this.tools.playSound('sfx_1');
        this.checkWinCondition();
      } else {
        if (this.tubes[index].length > 0 && !this.isTubeComplete(index)) {
          this.selectedTubeIndex = index;
          this.tools.playSound('sfx_1');
        } else {
          this.selectedTubeIndex = null;
          this.tools.playSound('sfx_8');
        }
      }
    }
  }

  private generateLevel(levelNum: number): void {
    const numColors = Math.min(3 + Math.floor((levelNum - 1) / 2), this.COLORS.length);
    const numEmptyTubes = 2;
    const totalTubes = numColors + numEmptyTubes;

    let allBlocks: string[] = [];
    for (let i = 0; i < numColors; i++) {
      for (let b = 0; b < this.TUBE_CAPACITY; b++) {
        allBlocks.push(this.COLORS[i]);
      }
    }

    for (let i = allBlocks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allBlocks[i], allBlocks[j]] = [allBlocks[j], allBlocks[i]];
    }

    this.tubes = [];
    let blockIdx = 0;
    for (let i = 0; i < totalTubes; i++) {
      const tube: string[] = [];
      if (i < numColors) {
        for (let b = 0; b < this.TUBE_CAPACITY; b++) {
          tube.push(allBlocks[blockIdx++]);
        }
      }
      this.tubes.push(tube);
    }

    this.initialTubesState = JSON.parse(JSON.stringify(this.tubes));
    this.selectedTubeIndex = null;
  }

  private isTubeComplete(index: number): boolean {
    const tube = this.tubes[index];
    if (tube.length !== this.TUBE_CAPACITY) return false;
    return tube.every(color => color === tube[0]);
  }

  private canPour(srcIdx: number, tgtIdx: number): boolean {
    const srcTube = this.tubes[srcIdx];
    const tgtTube = this.tubes[tgtIdx];

    if (srcTube.length === 0) return false;
    if (tgtTube.length >= this.TUBE_CAPACITY) return false;

    const colorToMove = srcTube[srcTube.length - 1];
    if (tgtTube.length === 0) return true;

    const tgtTopColor = tgtTube[tgtTube.length - 1];
    return colorToMove === tgtTopColor;
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
        this.gamePoints += 25;
        this.gameState = 'WIN';
        this.tools.playSound('sfx_4');
      }, 300);
    }
  }
}
