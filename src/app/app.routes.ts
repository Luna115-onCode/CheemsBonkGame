import { Routes } from '@angular/router';
import { GameComponent } from './pages/game/game.component';
import { MenuComponent } from './pages/menu/menu.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { DevSettingsComponent } from './pages/dev-settings/dev-settings.component';
import { ClosetComponent } from './pages/closet/closet.component';
import { OnworkPageComponent } from './pages/onwork-page/onwork-page.component';
import { P404Component } from './pages/p404/p404.component';
import { OfflineComponent } from './pages/offline/offline.component';
import { ShopComponent } from './pages/shop/shop.component';
import { developmentGuard, devGuard, testingGuard, appGuard } from './guards/guard.guard';

export const routes: Routes = [
    {path: "game", component: GameComponent, pathMatch: "full"},
    {path: "menu", component: MenuComponent, pathMatch: "full"},
    {path: "settings", component: SettingsComponent, pathMatch: "full"},
    {path: "devSettings", component: DevSettingsComponent, pathMatch: "full"},
    {path: "closet", component: ClosetComponent, pathMatch: "full"},
    {path: "onWork", component: OnworkPageComponent, pathMatch: "full"},
    {path: "offline", component: OfflineComponent, pathMatch: "full"},
    {path: "shop", component: ShopComponent, pathMatch: "full"},
    {path: "p404", component: P404Component, pathMatch: "full"},
    {path: "", redirectTo: "game", pathMatch: "full"},
    {path: "dev", component: GameComponent, canActivate: [devGuard]},
    {path: "development", component: GameComponent, canActivate: [developmentGuard]},
    {path: "test", component: GameComponent, canActivate: [testingGuard]},
    {path: "app", component: GameComponent, canActivate: [appGuard]},
    {path: "**", redirectTo: "p404"}
];
