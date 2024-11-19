import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../services/tools.service';
import { NavbarComponent } from "../../components/navbar/navbar.component";

@Component({
  selector: 'app-onwork-page',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './onwork-page.component.html',
  styleUrl: './onwork-page.component.css'
})
export class OnworkPageComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("onWork");
    this.tools.actPage = "onWork";
  }
}
