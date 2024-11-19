import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../tools.service';
import { NavbarComponent } from "../../components/navbar/navbar.component";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("Settings");
    this.tools.actPage = "/settings";
  }
}
