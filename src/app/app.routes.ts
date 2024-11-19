import { Routes } from '@angular/router';
import { GameComponent } from './pages/game/game.component';
import { MenuComponent } from './pages/menu/menu.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { DevSettingsComponent } from './pages/dev-settings/dev-settings.component';
import { ClosetComponent } from './pages/closet/closet.component';
import { OnworkPageComponent } from './pages/onwork-page/onwork-page.component';
import { P404Component } from './pages/p404/p404.component';

export const routes: Routes = [
    {path: "", component: GameComponent, pathMatch: "full"},
    {path: "menu", component: MenuComponent, pathMatch: "full"},
    {path: "settings", component: SettingsComponent, pathMatch: "full"},
    {path: "dev-settings", component: DevSettingsComponent, pathMatch: "full"},
    {path: "closet", component: ClosetComponent, pathMatch: "full"},
    {path: "on-work", component: OnworkPageComponent, pathMatch: "full"},
    {path: "404", component: P404Component, pathMatch: "full"},
    {path: "**", redirectTo: "404"}
];
