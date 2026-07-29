import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';
import { CheemsSkinItem, SoundEffectItem, MusicTrackItem } from '../../services/constants.service';

@Component({
  selector: 'app-closet',
  imports: [],
  templateUrl: './closet.component.html',
  styleUrl: './closet.component.css'
})
export class ClosetComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  activeTab: 'cheems' | 'sounds' | 'music' = 'cheems';

  ngOnInit(): void {
    this.tools.setTitle("closet");
    this.tools.actPage = "closet";
  }

  setTab(tab: 'cheems' | 'sounds' | 'music'): void {
    this.activeTab = tab;
  }

  onSelectCheems(skin: CheemsSkinItem): void {
    this.tools.buyOrSelectCheems(skin);
  }

  onSelectSound(sound: SoundEffectItem): void {
    this.tools.buyOrSelectSound(sound);
  }

  onSelectMusic(track: MusicTrackItem): void {
    this.tools.buyOrSelectMusic(track);
  }
}
