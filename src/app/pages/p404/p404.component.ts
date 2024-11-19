import { Component, inject, OnInit } from '@angular/core';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'app-p404',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './p404.component.html',
  styleUrl: './p404.component.css'
})
export class P404Component implements OnInit {
  tools: ToolsService = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setTitle("p404");
    this.tools.actPage = "p404";
  }

}
