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
    console.log(this.tools.lang)
  }

  changeLanguage(): void {
    this.tools.changeLanguage();
  }
}
