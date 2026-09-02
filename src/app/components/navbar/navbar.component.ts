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

  boosterRemainingSeconds: number = 0;
  boosterFormattedTime: string = '00:00';

  updateBooster(): void {
    this.boosterRemainingSeconds = this.tools.getBoosterRemainingSeconds();
    if (this.boosterRemainingSeconds > 0) {
      this.boosterFormattedTime = this.tools.getBoosterFormattedTime();
    }
  }

  ngOnInit(): void {
    this.updateBooster();
    this.timerInterval = setInterval(() => {
      this.updateBooster();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onDogeCoinClick(): void {
  }
}
