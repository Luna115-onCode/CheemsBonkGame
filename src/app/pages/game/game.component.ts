import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
    selector: 'app-game',
    imports: [],
    templateUrl: './game.component.html',
    styleUrl: './game.component.css'
})
export class GameComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  clicked: boolean = false;

  ngOnInit(): void {
    this.tools.setTitle("game");
    this.tools.actPage = "game";
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === " ") {
      this.onClick(false, event);
    }
  }

  onTouchEnd(event: TouchEvent): void {
    this.onClick(false, event);
  }

  onClick(calledDirectly: boolean, event: any = null): void {
    if (calledDirectly || !calledDirectly && event.touches === undefined) {
      this.clickCheems();
    }
  }

  clickCheems(): void {
    this.clicked = true;
    this.tools.updateScore(1);
    this.tools.playSound();
    setTimeout(() => {
      this.clicked = false;
    }, 600);
  }
}
