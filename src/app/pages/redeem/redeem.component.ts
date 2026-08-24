import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';
import codesJson from './codes.json';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-redeem',
  imports: [FormsModule, CommonModule],
  templateUrl: './redeem.component.html',
  styleUrl: './redeem.component.css'
})
export class RedeemComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  inputCode: string = '';

  ngOnInit(): void {
    this.tools.setTitle("redeem");
    this.tools.actPage = "redeem";
  }

  redeemCode(): void {
    const codeToRedeem = this.inputCode.trim().toUpperCase();
    if (!codeToRedeem) return;

    let matchedConfig: any = null;
    let matchedId: string = '';

    const codesData: any = codesJson;
    for (const id in codesData) {
      if (codesData[id].code.toUpperCase() === codeToRedeem) {
        matchedConfig = codesData[id];
        matchedId = id;
        break;
      }
    }

    if (!matchedConfig) {
      this.tools.showToast(this.tools.redeem[this.tools.lang]?.invalidCode || "Invalid code!");
      return;
    }

    if (matchedConfig.one_time_redeem && this.tools.redeemedCodes.includes(matchedConfig.code)) {
      this.tools.showToast(this.tools.redeem[this.tools.lang]?.alreadyRedeemed || "Code already redeemed!");
      return;
    }

    // Apply Rewards
    if (matchedConfig.dg) {
      this.tools.dogeCoins += matchedConfig.dg;
      if (this.tools.dogeCoins < 0) {
        this.tools.dogeCoins = 0;
      } else if (matchedConfig.dg > 0) {
        this.tools.totalDogeCoinsEarned += matchedConfig.dg;
        this.tools.saveData("lifetime_dg", String(this.tools.totalDogeCoinsEarned));
      }
      this.tools.saveData("dg", String(this.tools.dogeCoins));
    }
    
    if (matchedConfig.mg) {
      this.tools.minigameCoins += matchedConfig.mg;
      if (this.tools.minigameCoins < 0) {
        this.tools.minigameCoins = 0;
      } else if (matchedConfig.mg > 0) {
        this.tools.totalMinigameCoinsEarned += matchedConfig.mg;
        this.tools.saveData("lifetime_mg", String(this.tools.totalMinigameCoinsEarned));
      }
      this.tools.saveData("mg", String(this.tools.minigameCoins));
    }

    if (matchedConfig.pt) {
      if (matchedConfig.pt > 0) {
        this.tools.updateScore(matchedConfig.pt);
      } else {
        this.tools.points += matchedConfig.pt;
        if (this.tools.points < 0) this.tools.points = 0;
        this.tools.saveData("points", String(this.tools.points));
      }
    }

    // Unlocks
    if (matchedConfig.cheems && Array.isArray(matchedConfig.cheems)) {
      matchedConfig.cheems.forEach((c: string) => {
        this.tools.unlockedCheems[c] = true;
      });
      this.tools.saveUnlockedCheems();
    }
    if (matchedConfig.sfx && Array.isArray(matchedConfig.sfx)) {
      matchedConfig.sfx.forEach((s: string) => {
        this.tools.unlockedSounds[s] = true;
      });
      this.tools.saveUnlockedSounds();
    }
    if (matchedConfig.music && Array.isArray(matchedConfig.music)) {
      matchedConfig.music.forEach((m: string) => {
        this.tools.unlockedMusic[m] = true;
      });
      this.tools.saveUnlockedMusic();
    }

    // Save to history
    this.tools.redeemedCodes.push(matchedConfig.code);
    this.tools.saveRedeemedCodes();

    this.inputCode = '';
    this.tools.playSound('sfx_4'); // Success sound
    this.tools.showToast(this.tools.redeem[this.tools.lang]?.success || "Code redeemed successfully!");
  }
}
