import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-dev-settings',
  imports: [],
  templateUrl: './dev-settings.component.html',
  styleUrl: './dev-settings.component.css'
})
export class DevSettingsComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("devSettings");
    this.tools.actPage = "devSettings";
  }

  resetToZero(): void {
    this.tools.resetToZero();
  }

  unlockAll(): void {
    this.tools.unlockAll();
  }

  addDogeCoins(): void {
    this.tools.dogeCoins += 100;
    localStorage.setItem("CheemsAppLiDogecoins", JSON.stringify(this.tools.dogeCoins));
    this.tools.showToast(this.tools.dev[this.tools.lang].success);
    this.tools.playSound('4');
  }

  addPoints(): void {
    this.tools.updateScore(1000);
    this.tools.showToast(this.tools.dev[this.tools.lang].success);
    this.tools.playSound('4');
  }
}
