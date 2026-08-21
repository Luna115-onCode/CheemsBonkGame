import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToolsService } from '../../services/tools.service';
import { CommonModule } from '@angular/common';
import { CheemsSkinItem, MusicTrackItem, SoundEffectItem } from '../../services/constants.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  activeSection: 'skins' | 'sfx' | 'music' = 'skins';
  currentIndex: number = 0;

  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  currentVolume: number = 1;

  fullScreenImg: string | null = null;

  constructor(public tools: ToolsService) {}

  ngOnInit(): void {
    this.tools.actPage = "gallery" as any;
  }

  ngOnDestroy(): void {
    this.resumeBackgroundMusic();
  }

  get unlockedCheemsSkins(): CheemsSkinItem[] {
    return this.tools.cheemsSkins.filter(skin => skin.default || this.tools.unlockedCheems[skin.storageKey]);
  }

  get unlockedSoundEffects(): SoundEffectItem[] {
    return this.tools.soundEffects.filter(sound => sound.default || this.tools.unlockedSounds[sound.storageKey]);
  }

  get unlockedMusicTracks(): MusicTrackItem[] {
    // Only show valid tracks
    return this.tools.musicTracks.filter(track => (track.default || this.tools.unlockedMusic[track.storageKey]) && track.id !== 'music_0');
  }

  openSection(section: 'skins' | 'sfx' | 'music'): void {
    this.activeSection = section;
    this.currentIndex = 0;
    
    // Stop current audio if switching away
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.pause();
      this.audioPlayer.nativeElement.currentTime = 0;
      this.isPlaying = false;
    }

    if (section === 'sfx' || section === 'music') {
      this.pauseBackgroundMusic();
      this.loadAudio();
    } else {
      this.resumeBackgroundMusic();
    }
  }

  openFullScreen(imgUrl: string): void {
    this.fullScreenImg = imgUrl;
  }

  closeFullScreen(): void {
    this.fullScreenImg = null;
  }

  private pauseBackgroundMusic(): void {
    this.tools.pauseBackground();
  }

  private resumeBackgroundMusic(): void {
    this.tools.resumeBackground();
  }

  nextItem(): void {
    let listLength = 0;
    if (this.activeSection === 'skins') listLength = this.unlockedCheemsSkins.length;
    if (this.activeSection === 'sfx') listLength = this.unlockedSoundEffects.length;
    if (this.activeSection === 'music') listLength = this.unlockedMusicTracks.length;

    if (listLength > 0) {
      this.currentIndex = (this.currentIndex + 1) % listLength;
      if (this.activeSection !== 'skins') this.loadAudio();
    }
  }

  prevItem(): void {
    let listLength = 0;
    if (this.activeSection === 'skins') listLength = this.unlockedCheemsSkins.length;
    if (this.activeSection === 'sfx') listLength = this.unlockedSoundEffects.length;
    if (this.activeSection === 'music') listLength = this.unlockedMusicTracks.length;

    if (listLength > 0) {
      this.currentIndex = (this.currentIndex - 1 + listLength) % listLength;
      if (this.activeSection !== 'skins') this.loadAudio();
    }
  }

  loadAudio(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.pause();
    }
    setTimeout(() => {
      if (this.audioPlayer?.nativeElement) {
        this.audioPlayer.nativeElement.currentTime = 0;
        this.audioPlayer.nativeElement.load();
        this.audioPlayer.nativeElement.volume = this.currentVolume;
      }
    });
  }

  get currentAudioSrc(): string {
    if (this.activeSection === 'sfx' && this.unlockedSoundEffects.length > 0) {
      const sfx = this.unlockedSoundEffects[this.currentIndex];
      return sfx.basePath + (sfx.file || (sfx.files ? sfx.files[0] : ''));
    } else if (this.activeSection === 'music' && this.unlockedMusicTracks.length > 0) {
      const music = this.unlockedMusicTracks[this.currentIndex];
      return music.basePath + music.file;
    }
    return '';
  }

  get currentAudioName(): string {
    if (this.activeSection === 'sfx' && this.unlockedSoundEffects.length > 0) {
      return this.tools.getSoundName(this.unlockedSoundEffects[this.currentIndex]);
    } else if (this.activeSection === 'music' && this.unlockedMusicTracks.length > 0) {
      return this.tools.getMusicName(this.unlockedMusicTracks[this.currentIndex]);
    }
    return '';
  }

  get currentAudioCover(): string | null {
    if (this.activeSection === 'music' && this.unlockedMusicTracks.length > 0) {
      return this.unlockedMusicTracks[this.currentIndex].cover || 'img/music/no_image.png';
    }
    return null;
  }

  get currentAudioDesc(): string {
    if (this.activeSection === 'sfx' && this.unlockedSoundEffects.length > 0) {
      return this.tools.getSoundDescription(this.unlockedSoundEffects[this.currentIndex]);
    } else if (this.activeSection === 'music' && this.unlockedMusicTracks.length > 0) {
      return this.tools.getMusicDescription(this.unlockedMusicTracks[this.currentIndex]);
    }
    return '';
  }

  togglePlay(): void {
    if (this.activeSection === 'sfx' && this.unlockedSoundEffects.length > 0) {
      this.tools.playSound(this.unlockedSoundEffects[this.currentIndex].id);
      return;
    }

    if (this.audioPlayer?.nativeElement) {
      if (!this.audioPlayer.nativeElement.paused) {
        this.audioPlayer.nativeElement.pause();
      } else {
        if (this.audioPlayer.nativeElement.currentTime >= (this.audioPlayer.nativeElement.duration || 0)) {
          this.audioPlayer.nativeElement.currentTime = 0;
        }
        this.audioPlayer.nativeElement.play();
      }
    }
  }

  skip(seconds: number): void {
    if (this.audioPlayer?.nativeElement) {
      let newTime = this.audioPlayer.nativeElement.currentTime + seconds;
      const dur = this.audioPlayer.nativeElement.duration || 0;
      if (newTime > dur) newTime = dur;
      if (newTime < 0) newTime = 0;
      this.audioPlayer.nativeElement.currentTime = newTime;
    }
  }

  onVolumeChange(event: any): void {
    this.currentVolume = event.target.value;
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.volume = this.currentVolume;
    }
  }

  onLoadedMetadata(event: any): void {
    this.duration = event.target.duration || 0;
  }

  onAudioPlay(): void {
    this.isPlaying = true;
  }

  onAudioPause(): void {
    this.isPlaying = false;
  }

  onTimeUpdate(event: any): void {
    this.currentTime = event.target.currentTime;
    this.duration = event.target.duration || 0;
  }

  onAudioEnded(): void {
    this.isPlaying = false;
  }

  onSeek(event: any): void {
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.currentTime = event.target.value;
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
