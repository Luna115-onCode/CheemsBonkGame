import { Component, inject, OnInit, OnDestroy } from '@angular/core';
<<<<<<< HEAD
import { CommonModule } from '@angular/common';
=======
>>>>>>> 978282b3d376db0a28f8a319cd5e15d9f5cddf20
import { ToolsService } from '../../services/tools.service';

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  value: number;
}

@Component({
  selector: 'app-game',
<<<<<<< HEAD
  imports: [CommonModule],
=======
  imports: [],
>>>>>>> 978282b3d376db0a28f8a319cd5e15d9f5cddf20
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  clicked: boolean = false;
  floatingScores: FloatingScore[] = [];
  private nextScoreId: number = 0;
  private clickTimeout: any = null;
<<<<<<< HEAD
  showStatsModal: boolean = false;
=======
>>>>>>> 978282b3d376db0a28f8a319cd5e15d9f5cddf20

  private onKeyUpBound = this.onKeyUp.bind(this);

  ngOnInit(): void {
    this.tools.setTitle("game");
    this.tools.actPage = "game";
    document.addEventListener('keyup', this.onKeyUpBound);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keyup', this.onKeyUpBound);
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      this.onClick(false, event);
    }
  }

  onClick(calledDirectly: boolean, event: any = null): void {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (event) {
      if (event.clientX && event.clientY) {
        x = event.clientX;
        y = event.clientY;
      } else if (event.changedTouches && event.changedTouches.length > 0) {
        x = event.changedTouches[0].clientX;
        y = event.changedTouches[0].clientY;
      }
    }
    this.clickCheems(x, y);
  }

  clickCheems(x: number, y: number): void {
    this.clicked = true;
    const gained = this.tools.getActiveMultiplier();
    this.tools.updateScore(gained);
    this.tools.playSound();

    const scoreId = this.nextScoreId++;
    this.floatingScores.push({ id: scoreId, x, y, value: gained });
    setTimeout(() => {
      this.floatingScores = this.floatingScores.filter(item => item.id !== scoreId);
    }, 800);

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    this.clickTimeout = setTimeout(() => {
      this.clicked = false;
    }, 250);
<<<<<<< HEAD
  }

  get pointsPerHour(): number {
    return (3600 / this.tools.idleTime) * this.tools.idlePoints;
  }

  get offlinePointsPerHour(): number {
    return this.pointsPerHour / 4;
  }

  getFormattedPoints(ptsPerHour: number): { value: number, unitKey: string } {
    const perSec = ptsPerHour / 3600;
    if (perSec >= 1000) {
      return { value: perSec, unitKey: 'ptsPerSec' };
    }
    const perMin = ptsPerHour / 60;
    if (perMin >= 1000) {
      return { value: perMin, unitKey: 'ptsPerMin' };
    }
    return { value: ptsPerHour, unitKey: 'ptsPerHr' };
  }

  get activeStats() {
    return this.getFormattedPoints(this.pointsPerHour);
  }

  get offlineStats() {
    return this.getFormattedPoints(this.offlinePointsPerHour);
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return `${m}m ${s}s`;
  }

  get onlineIntervalStr(): string {
    return this.formatDuration(this.tools.idleTime);
  }

  get offlineIntervalStr(): string {
    return this.formatDuration(this.tools.idleTime);
  }

  toggleStatsModal(event: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showStatsModal = !this.showStatsModal;
=======
>>>>>>> 978282b3d376db0a28f8a319cd5e15d9f5cddf20
  }
}
