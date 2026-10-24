import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from './core/services/session.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FlowTesterBarComponent } from './shared/components/flow-tester-bar/flow-tester-bar.component';
import { LandingComponent } from './features/landing/landing.component';
import { MapInteractiveComponent } from './features/map/map-interactive.component';
import { InfoModalComponent } from './shared/components/info-modal/info-modal.component';
import { TutorialModalComponent } from './shared/components/tutorial-modal/tutorial-modal.component';
import { LocationModalComponent } from './shared/components/location-modal/location-modal.component';
import { SessionExpiredModalComponent } from './shared/components/session-expired-modal/session-expired-modal.component';
import { AuthModalComponent } from './shared/components/auth-modal/auth-modal.component';
import { AchievementsComponent } from './features/achievements/achievements.component';
import { MissionsComponent } from './features/missions/missions.component';
import { RoutesComponent } from './features/routes/routes.component';
import { ProfileComponent } from './features/profile/profile.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FlowTesterBarComponent,
    LandingComponent,
    MapInteractiveComponent,
    AchievementsComponent,
    MissionsComponent,
    RoutesComponent,
    ProfileComponent,
    InfoModalComponent,
    TutorialModalComponent,
    LocationModalComponent,
    SessionExpiredModalComponent,
    AuthModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  sessionService = inject(SessionService);
}
