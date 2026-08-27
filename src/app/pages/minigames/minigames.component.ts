import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

interface MinigameItem {
  id: string;
  key: string;
  defaultTitle: string;
}

@Component({
  selector: 'app-minigames',
  imports: [],
  templateUrl: './minigames.component.html',
  styleUrl: './minigames.component.css'
})
export class MinigamesComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  gamesList: MinigameItem[] = [
    { id: 'block_breaker', key: 'title', defaultTitle: 'Merge Diggers' },
    { id: 'attack_hole', key: 'attack_hole_title', defaultTitle: 'Attack Hole' },
    { id: 'doge_rescue', key: 'doge_rescue_title', defaultTitle: 'Doge Rescue' },
    { id: 'flappy_dunk', key: 'flappy_dunk_title', defaultTitle: 'Flappy Dunk' },
    { id: 'helix_jump', key: 'helix_jump_title', defaultTitle: 'Helix Jump' },
    { id: 'magic_sort', key: 'magic_sort_title', defaultTitle: 'Magic Sort' },
    { id: 'mob_control', key: 'mob_control_title', defaultTitle: 'Mob Control' },
    { id: 'paper_io', key: 'paper_io_title', defaultTitle: 'Paper.io' },
    { id: 'spiral_roll', key: 'spiral_roll_title', defaultTitle: 'Spiral Roll' },
    { id: 'stack_colors', key: 'stack_colors_title', defaultTitle: 'Stack Colors' },
    { id: 'rock_paper_poke', key: 'rock_paper_poke_title', defaultTitle: 'Rock-Paper-Poke' },
    { id: 'tic_tac_toe', key: 'tic_tac_toe_title', defaultTitle: 'Tic Tac Toe' },
    { id: 'black_jack', key: 'black_jack_title', defaultTitle: 'Black Jack' }
  ];

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
