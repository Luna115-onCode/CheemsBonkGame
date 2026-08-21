import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-stats',
  imports: [],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("stats");
    this.tools.actPage = "stats";
  }
}
