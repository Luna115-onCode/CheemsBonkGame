import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';
import { TextContainerComponent } from "../../components/text-container/text-container.component";

@Component({
    selector: 'app-menu',
    imports: [TextContainerComponent],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  

  ngOnInit(): void {
    this.tools.setTitle("menu");
    this.tools.actPage = "menu"
  }
}
