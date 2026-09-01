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
  
  bgType: 'color' | 'image' = 'image';
  bgImageUrl = 'img/background/test-bg.jpg';
}
