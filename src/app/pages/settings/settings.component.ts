import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("settings");
    this.tools.actPage = "settings";
  }

  onMusicVolumeChange(event: any): void {
    const value = +event.target.value;
    this.tools.setMusicVolume(value);
  }

  onEffectsVolumeChange(event: any): void {
    const value = +event.target.value;
    this.tools.setEffectVolume(value);
  }

  changeLanguage(): void {
    this.tools.changeLanguage();
  }

  onLanguageChange(event: any): void {
    const key = event.target.value;
    this.tools.setLanguage(key);
  }

  selectTheme(index: number): void {
    this.tools.switchTheme(index);
  }

  selectFontSize(index: number): void {
    this.tools.setAccessibility(index);
  }
}
