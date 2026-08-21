import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  value: number;
}

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  clicked: boolean = false;
  floatingScores: FloatingScore[] = [];
  private nextScoreId: number = 0;
  private clickTimeout: any = null;

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
  }
}
