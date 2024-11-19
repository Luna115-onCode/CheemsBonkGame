import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolsService } from './services/tools.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    //document.oncontextmenu = function(){return false};
    document.ondragstart = function(){return false};
    document.onselectstart = function(){return false};
    document.onmousedown = function() {return false};
    
    this.tools.loadApp();
  }
  
}
