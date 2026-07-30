import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';
import { OfflineCategory } from '../../services/constants.service';

@Component({
  selector: 'app-offline',
  imports: [],
  templateUrl: './offline.component.html',
  styleUrl: './offline.component.css'
})
export class OfflineComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  cachedStatus: Record<string, boolean> = {
    essentials: false,
    sfx: false,
    music: false
  };
  downloadingStatus: Record<string, boolean> = {
    essentials: false,
    sfx: false,
    music: false
  };
  downloadProgress: Record<string, number> = {
    essentials: 0,
    sfx: 0,
    music: 0
  };
  isDownloadingAll = false;

  ngOnInit(): void {
    this.tools.setTitle("offline");
    this.tools.actPage = "offline";
    this.checkAllCached();
  }

  async checkAllCached(): Promise<void> {
    for (const cat of this.tools.offlineCategories) {
      this.cachedStatus[cat.id] = await this.tools.checkCategoryCached(cat);
    }
  }

  async downloadCategory(cat: OfflineCategory): Promise<void> {
    if (this.downloadingStatus[cat.id] || this.cachedStatus[cat.id]) return;
    this.downloadingStatus[cat.id] = true;
    this.downloadProgress[cat.id] = 0;

    const success = await this.tools.cacheCategory(cat, (progress) => {
      this.downloadProgress[cat.id] = progress;
    });

    this.downloadingStatus[cat.id] = false;
    if (success) {
      this.cachedStatus[cat.id] = true;
      this.tools.showToast(this.tools.offline[this.tools.lang]?.successToast || "Downloaded successfully!");
      this.tools.playSound();
    } else {
      this.tools.showToast(this.tools.offline[this.tools.lang]?.errorToast || "Error downloading resources.");
    }
  }

  async downloadAll(): Promise<void> {
    if (this.isDownloadingAll) return;
    this.isDownloadingAll = true;
    for (const cat of this.tools.offlineCategories) {
      if (!this.cachedStatus[cat.id]) {
        await this.downloadCategory(cat);
      }
    }
    this.isDownloadingAll = false;
  }
}
