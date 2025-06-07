import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
    selector: 'app-closet',
    imports: [],
    templateUrl: './closet.component.html',
    styleUrl: './closet.component.css'
})
export class ClosetComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("closet");
    this.tools.actPage = "closet";
  }
}
