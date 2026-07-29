import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);
  dailyPrice: number = 100;

  ngOnInit(): void {
    this.tools.setTitle("menu");
    this.tools.actPage = "menu";
    this.dailyPrice = this.tools.getDailyDogeCoinPrice();
  }

  buyDogeCoin(): void {
    this.tools.buyDogeCoin();
  }
}
