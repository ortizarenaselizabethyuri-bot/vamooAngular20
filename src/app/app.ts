import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  imports: [RouterOutlet, HeaderComponent],
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
  protected readonly title = signal('Vamoo');
}
