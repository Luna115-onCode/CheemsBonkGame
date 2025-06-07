import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
    selector: 'app-navbar',
    imports: [],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  tools: ToolsService = inject(ToolsService);


  enableDevOption(): void {
    if (this.tools.actPage === "menu") {
      console.log("Devb")
    }
  }

}
