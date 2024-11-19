import { CommonModule, PlatformLocation } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolsService } from './services/tools.service';
import { NavbarComponent } from "./components/navbar/navbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  constructor (private platformLocation: PlatformLocation) {}

  ngOnInit(): void {
    //!document.oncontextmenu = function(){return false};
    document.ondragstart = function(){return false};
    document.onselectstart = function(){return false};
    document.onmousedown = function() {return false};

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('beforeunload', this.handleReload);
    
    this.tools.loadApp();
  }

  handleReload(): void {
    //TODO: implement reload event
  }
  
  onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    //TODO: implement code for pressing key
    //! Maybe this event can be deleted with it's handler
  }

  onKeyUp(event: KeyboardEvent): void {
    //TODO: implement code for release keyboard
  }
}
