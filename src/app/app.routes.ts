import { Routes } from '@angular/router';
import { GameComponent } from './pages/game/game.component';
import { MenuComponent } from './pages/menu/menu.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { DevSettingsComponent } from './pages/dev-settings/dev-settings.component';
import { ClosetComponent } from './pages/closet/closet.component';
import { OnworkPageComponent } from './pages/onwork-page/onwork-page.component';
import { P404Component } from './pages/p404/p404.component';
import { developmentGuard, testingGuard } from './guards/guard.guard';

export const routes: Routes = [
    {path: "game", component: GameComponent, pathMatch: "full"},
    {path: "menu", component: MenuComponent, pathMatch: "full"},
    {path: "settings", component: SettingsComponent, pathMatch: "full"},
    {path: "devSettings", component: DevSettingsComponent, pathMatch: "full"},
    {path: "closet", component: ClosetComponent, pathMatch: "full"},
    {path: "onWork", component: OnworkPageComponent, pathMatch: "full"},
    {path: "p404", component: P404Component, pathMatch: "full"},
    {path: "", redirectTo: "game", pathMatch: "full"},
    {path: "**", redirectTo: "p404"}
];
