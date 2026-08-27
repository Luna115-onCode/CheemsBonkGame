import { Routes } from '@angular/router';
import { GameComponent } from './pages/game/game.component';
import { MenuComponent } from './pages/menu/menu.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { RedeemComponent } from './pages/redeem/redeem.component';
import { ClosetComponent } from './pages/closet/closet.component';
import { OnworkPageComponent } from './pages/onwork-page/onwork-page.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { P404Component } from './pages/p404/p404.component';
import { ShopComponent } from './pages/shop/shop.component';
import { BlockBreakerComponent } from './games/block_breaker/block_breaker.component';
import { AttackHoleComponent } from './games/attack_hole/attack_hole.component';
import { DogeRescueComponent } from './games/doge_rescue/doge_rescue.component';
import { FlappyDunkComponent } from './games/flappy_dunk/flappy_dunk.component';
import { HelixJumpComponent } from './games/helix_jump/helix_jump.component';
import { MagicSortComponent } from './games/magic_sort/magic_sort.component';
import { MobControlComponent } from './games/mob_control/mob_control.component';
import { PaperIoComponent } from './games/paper_io/paper_io.component';
import { SpiralRollComponent } from './games/spiral_roll/spiral_roll.component';
import { StackColorsComponent } from './games/stack_colors/stack_colors.component';
import { RockPaperPokeComponent } from './games/rock_paper_poke/rock_paper_poke.component';
import { TicTacToeComponent } from './games/tic_tac_toe/tic_tac_toe.component'; // Trigger recompile
import { MinigamesComponent } from './pages/minigames/minigames.component';
import { StatsComponent } from './pages/stats/stats.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { developmentGuard, devGuard, testingGuard, appGuard } from './guards/guard.guard';

export const routes: Routes = [
    {path: "game", component: GameComponent, pathMatch: "full"},
    {path: "menu", component: MenuComponent, pathMatch: "full"},
    {path: "settings", component: SettingsComponent, pathMatch: "full"},
    {path: "redeem", component: RedeemComponent, pathMatch: "full"},
    {path: "closet", component: ClosetComponent, pathMatch: "full"},
    {path: "gallery", component: GalleryComponent, pathMatch: "full"},
    {path: "onWork", component: OnworkPageComponent, pathMatch: "full"},
    {path: "licenses", component: LicensesComponent, pathMatch: "full"},
    {path: "shop", component: ShopComponent, pathMatch: "full"},
    {path: "stats", component: StatsComponent, pathMatch: "full"},
    {path: "minigames", component: MinigamesComponent, pathMatch: "full"},
    {path: "minigames/block-breaker", component: BlockBreakerComponent, pathMatch: "full"},
    {path: "minigames/block_breaker", component: BlockBreakerComponent, pathMatch: "full"},
    {path: "minigames/attack_hole", component: AttackHoleComponent, pathMatch: "full"},
    {path: "minigames/doge_rescue", component: DogeRescueComponent, pathMatch: "full"},
    {path: "minigames/flappy_dunk", component: FlappyDunkComponent, pathMatch: "full"},
    {path: "minigames/helix_jump", component: HelixJumpComponent, pathMatch: "full"},
    {path: "minigames/magic_sort", component: MagicSortComponent, pathMatch: "full"},
    {path: "minigames/mob_control", component: MobControlComponent, pathMatch: "full"},
    {path: "minigames/paper_io", component: PaperIoComponent, pathMatch: "full"},
    {path: "minigames/spiral_roll", component: SpiralRollComponent, pathMatch: "full"},
    {path: "minigames/stack_colors", component: StackColorsComponent, pathMatch: "full"},
    {path: "minigames/rock_paper_poke", component: RockPaperPokeComponent, pathMatch: "full"},
    {path: "minigames/tic_tac_toe", component: TicTacToeComponent, pathMatch: "full"},
    {path: "p404", component: P404Component, pathMatch: "full"},
    {path: "", redirectTo: "game", pathMatch: "full"},
    {path: "dev", component: GameComponent, canActivate: [devGuard]},
    {path: "dev/**", component: GameComponent, canActivate: [devGuard]},
    {path: "development", component: GameComponent, canActivate: [developmentGuard]},
    {path: "development/**", component: GameComponent, canActivate: [developmentGuard]},
    {path: "test", component: GameComponent, canActivate: [testingGuard]},
    {path: "test/**", component: GameComponent, canActivate: [testingGuard]},
    {path: "app", component: GameComponent, canActivate: [appGuard]},
    {path: "app/**", component: GameComponent, canActivate: [appGuard]},
    {path: "**", redirectTo: "p404"}
];

