import { Component, inject } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  tools: ToolsService = inject(ToolsService);

  onDogeCoinClick(): void {
    this.tools.registerDevClick();
  }
}
