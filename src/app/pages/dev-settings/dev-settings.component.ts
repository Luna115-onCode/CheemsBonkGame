import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';
import { NavbarComponent } from "../../components/navbar/navbar.component";

@Component({
  selector: 'app-dev-settings',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './dev-settings.component.html',
  styleUrl: './dev-settings.component.css'
})
export class DevSettingsComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("devSettings");
    this.tools.actPage = "devSettings";
  }
}
