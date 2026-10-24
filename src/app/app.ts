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
import { AuthSimModalComponent } from './shared/components/auth-sim-modal/auth-sim-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FlowTesterBarComponent,
    LandingComponent,
    MapInteractiveComponent,
    InfoModalComponent,
    TutorialModalComponent,
    LocationModalComponent,
    SessionExpiredModalComponent,
    AuthSimModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  sessionService = inject(SessionService);
}
