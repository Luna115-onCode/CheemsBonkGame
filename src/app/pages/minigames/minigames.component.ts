import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-minigames',
  imports: [],
  templateUrl: './minigames.component.html',
  styleUrl: './minigames.component.css'
})
export class MinigamesComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("minigames");
    this.tools.actPage = "minigames";
  }

  openMinigame(id: string): void {
    if (this.tools.isMinigameUnlocked(id)) {
      this.tools.redirect('minigames/' + id);
    } else {
      this.tools.showToast(this.tools.minigames[this.tools.lang]?.buyMinigameInShop || "Unlock this Minigame in the Shop first!");
      this.tools.playSound('sfx_8');
    }
  }
}
