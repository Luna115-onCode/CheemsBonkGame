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

  get unlockedCheemsSkins(): CheemsSkinItem[] {
    return this.tools.cheemsSkins.filter(skin => this.tools.isCheemsUnlocked(skin.id));
  }

  get unlockedSoundEffects(): SoundEffectItem[] {
    return this.tools.soundEffects.filter(sound => this.tools.isSoundUnlocked(sound.id));
  }

  get unlockedMusicTracks(): MusicTrackItem[] {
    return this.tools.musicTracks.filter(track => this.tools.isMusicUnlocked(track.id));
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
