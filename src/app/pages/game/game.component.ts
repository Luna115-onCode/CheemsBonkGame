import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("game");
    this.tools.actPage = "game";
    this.tools.getTexts("game");
  }
}
