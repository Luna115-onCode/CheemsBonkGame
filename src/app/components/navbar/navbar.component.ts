import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../tools.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  title: string = "";

  ngOnInit(): void {
    this.title = this.tools.getTitle();
  }

  enableDevOption(): void {
    if (this.tools.actPage === "/menu") {
      console.log("Devb")
    }
  }

}
