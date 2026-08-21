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

  modifyDogeCoins(amount: number): void {
    this.tools.dogeCoins += amount;
    if (amount > 0) {
      this.tools.totalDogeCoinsEarned += amount;
      this.tools.saveData("lifetime_dg", String(this.tools.totalDogeCoinsEarned));
    }
    if (this.tools.dogeCoins < 0) this.tools.dogeCoins = 0;
    this.tools.saveData("dg", String(this.tools.dogeCoins));
    this.tools.showToast(this.tools.dev[this.tools.lang].success || "Success");
    this.tools.playSound('4');
  }

  modifyPoints(amount: number): void {
    if (amount > 0) {
      this.tools.updateScore(amount);
    } else {
      this.tools.points += amount;
      if (this.tools.points < 0) this.tools.points = 0;
      this.tools.saveData("points", String(this.tools.points));
    }
    this.tools.showToast(this.tools.dev[this.tools.lang].success || "Success");
    this.tools.playSound('4');
  }

  modifyMinigameCoins(amount: number): void {
    if (amount > 0) {
      this.tools.addMinigameCoins(amount);
    } else {
      this.tools.minigameCoins += amount;
      if (this.tools.minigameCoins < 0) this.tools.minigameCoins = 0;
      this.tools.saveData("mg", String(this.tools.minigameCoins));
    }
    this.tools.showToast(this.tools.dev[this.tools.lang].success || "Success");
    this.tools.playSound('4');
  }
}
