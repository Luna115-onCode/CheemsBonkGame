import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  private timerInterval: any = null;

  ngOnInit(): void {
    this.timerInterval = setInterval(() => {
      // Trigger change detection for live booster countdown in navbar
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onDogeCoinClick(): void {
<<<<<<< HEAD
=======
    this.tools.registerDevClick();
>>>>>>> 978282b3d376db0a28f8a319cd5e15d9f5cddf20
  }
}
