import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './background.component.html',
  styleUrl: './background.component.css'
})
export class BackgroundComponent {
  tools = inject(ToolsService);
  
  get bgType(): 'color' | 'image' {
    return this.tools.selectedBackground === 'bg_none' ? 'color' : 'image';
  }

  get bgImageUrl(): string {
    return this.tools.getBackgroundImg(this.tools.selectedBackground);
  }
}
