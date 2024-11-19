import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '../../tools.service';
import { NavbarComponent } from "../../components/navbar/navbar.component";

@Component({
  selector: 'app-closet',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './closet.component.html',
  styleUrl: './closet.component.css'
})
export class ClosetComponent implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("Closet");
    this.tools.actPage = "/closet";
  }
}
