import { CommonModule, PlatformLocation } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolsService } from './services/tools.service';
import { NavbarComponent } from "./components/navbar/navbar.component";

@Component({
    selector: 'app-root',
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

    document.addEventListener('keydown', this.onKeyDown.bind(this), { passive: false });
    document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });

    window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Changes may not be saved';
      return 'Changes may not be saved';
    });
    
    this.tools.loadApp();
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space' || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
      if (event.cancelable) {
        event.preventDefault();
      }
    }
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length >= 2 && event.cancelable) {
      event.preventDefault();
    }
  }
}
