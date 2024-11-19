import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    //document.oncontextmenu = function(){return false};
    document.ondragstart = function(){return false};
    document.onselectstart = function(){return false};
    document.onmousedown = function() {return false};
  }
  
}
