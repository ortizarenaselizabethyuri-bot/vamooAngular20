import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { MapService } from '../../../core/services/map.service';
import { AchievementsService } from '../../../core/services/achievements.service';

@Component({
  selector: 'app-flow-tester-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tester-wrapper" [class.collapsed]="isCollapsed()">
      <!-- Toggle button -->
      <button class="toggle-btn" (click)="isCollapsed.set(!isCollapsed())" title="Simulador de Casos del Diagrama">
        <div class="toggle-title">
          <span>🧪 Panel de Pruebas de Flujos UML (Módulos 01 a 04)</span>
          <span class="active-step-badge">Paso 4: Logros y Ligas Activo</span>
        </div>
        <span class="chevron">{{ isCollapsed() ? '▲ Desplegar' : '▼ Ocultar' }}</span>
      </button>

      @if (!isCollapsed()) {
        <div class="tester-content">
          <!-- Resumen de Estados Reactivos -->
          <div class="status-summary">
            <span class="badge" [class.badge-active]="sessionService.isAuthenticated()">
              Sesión: {{ sessionService.isAuthenticated() ? '🟢 ' + sessionService.session().username : '⚪ Visitante' }}
            </span>
            <span class="badge" [class.badge-active]="sessionService.session().rank === 'Flamenco'" [class.badge-view]="sessionService.session().rank === 'Pingüino'">
              Rango: {{ sessionService.session().rank === 'Flamenco' ? '🦩' : '🐧' }} {{ sessionService.session().rank }} ({{ sessionService.session().xp }} XP)
            </span>
            <span class="badge" [class.badge-active]="achievementsService.leagueState().isEnrolled">
              Liga: {{ achievementsService.leagueState().isEnrolled ? 'Puesto #' + achievementsService.leagueState().userRank + ' (' + achievementsService.leagueState().userWeeklyXp + ' XP)' : 'No Inscrito' }}
            </span>
            <span class="badge" [class.badge-active]="sessionService.session().locationPermission === 'granted'" [class.badge-warn]="sessionService.session().locationPermission === 'denied' || sessionService.session().locationPermission === 'blocked' || mapService.isGpsLost()">
              GPS: {{ mapService.isGpsLost() ? '⚠️ Pérdida Señal' : sessionService.session().locationPermission }}
            </span>
            <span class="badge" [class.badge-active]="mapService.activeMission() !== null">
              Misión: {{ mapService.activeMission() ? '🎯 ' + mapService.activeMission()?.poiName : 'Ninguna' }}
            </span>
            <span class="badge badge-view">
              Vista: {{ sessionService.currentView() }}
            </span>
          </div>

          <!-- Botones de Acción de Prueba -->
          <div class="tester-actions-grid">
            <!-- GRUPO MÓDULO 04: LOGROS, RANGOS Y LIGAS -->
            <div class="action-group">
              <span class="group-label">Módulo 04: Logros & Ligas</span>
              <div class="buttons-row">
                <button class="test-btn primary" (click)="goToAchievements('ranks')">
                  🎖️ Ver Rangos
                </button>
                <button class="test-btn" (click)="goToAchievements('badges')">
                  🏅 Ver Insignias
                </button>
                <button class="test-btn accent" (click)="goToAchievements('rewards')">
                  🎁 Ver Premios & Cupones
                </button>
                <button class="test-btn primary" (click)="goToAchievements('leagues')">
                  🏆 Ver Liga Semanal
                </button>
                <button class="test-btn success" (click)="testAddXp50()">
                  ⚡ Simular Actividad (+50 XP)
                </button>
                <button class="test-btn success" (click)="testPromoteToFlamenco()">
                  🦩 Ascender a Flamenco (+200 XP)
                </button>
                <button class="test-btn accent" (click)="testClaimCoupon()">
                  🎟️ Canjear Cupón Café
                </button>
                <button class="test-btn" (click)="testUnlockBadge()">
                  🌟 Desbloquear Insignia
                </button>
              </div>
            </div>

            <!-- GRUPO MÓDULO 03: MAPA Y PROXIMIDAD -->
            <div class="action-group">
              <span class="group-label">Módulo 03: Mapa & Proximidad</span>
              <div class="buttons-row">
                <button class="test-btn primary" (click)="goToMap()">
                  🗺️ Ver Mapa 2D
                </button>
                <button class="test-btn accent" (click)="testSelectPoiAndRoute()">
                  📍 Trazar Ruta a POI
                </button>
                <button class="test-btn accent" (click)="testStartActiveMission()">
                  🚀 Iniciar Misión
                </button>
                <button class="test-btn success" (click)="mapService.simulateWalkCloser()">
                  🚶 Entrar en Zona (&lt;35m)
                </button>
                <button class="test-btn warn" (click)="mapService.simulateWalkAway()">
                  ↔️ Alejar Avatar (&gt;35m)
                </button>
                <button class="test-btn success" (click)="testCompleteWithReward()">
                  🎉 Completar y Recompensa
                </button>
                <button class="test-btn danger" (click)="mapService.toggleGpsLost()">
                  {{ mapService.isGpsLost() ? '📡 Restaurar GPS' : '📡 Pérdida GPS' }}
                </button>
              </div>
            </div>

            <!-- GRUPO MÓDULO 02: AUTENTICACIÓN -->
            <div class="action-group">
              <span class="group-label">Módulo 02: Autenticación</span>
              <div class="buttons-row">
                <button class="test-btn primary" (click)="openAuth('login')">
                  🔑 Ingresar (Login)
                </button>
                <button class="test-btn" (click)="testRegisterEmail()">
                  ✉️ Registro Correo + OTP
                </button>
                <button class="test-btn" (click)="testRegisterGoogle()">
                  🌐 Registro Google
                </button>
                <button class="test-btn warn" (click)="testAgeDenied()">
                  🚫 Edad &lt; 14
                </button>
                <button class="test-btn" (click)="testUsernameTaken()">
                  👥 Nombre Duplicado
                </button>
                @if (sessionService.isAuthenticated()) {
                  <button class="test-btn danger" (click)="authService.logout()">
                    🚪 Cerrar Sesión
                  </button>
                }
              </div>
            </div>

            <!-- GRUPO MÓDULO 01: INICIO & PORTADA -->
            <div class="action-group">
              <span class="group-label">Módulo 01: Inicio & Portada</span>
              <div class="buttons-row">
                <button class="test-btn" (click)="sessionService.setAsVisitor()">
                  🔄 Reset Visitante
                </button>
                <button class="test-btn" (click)="sessionService.handlePlayClick()">
                  ▶️ "Presiona Jugar"
                </button>
                <button class="test-btn" (click)="sessionService.openModal('location')">
                  📍 Permiso GPS
                </button>
                <button class="test-btn warn" (click)="sessionService.simulateExpiredSession()">
                  ⏳ Sesión Expirada
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tester-wrapper {
      background: #0b1120;
      color: #f8fafc;
      font-size: 0.8rem;
      border-bottom: 2px solid #6366f1;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
      z-index: 999;
      position: relative;
    }

    .toggle-btn {
      width: 100%;
      padding: 7px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #cbd5e1;
      font-weight: 700;
      font-size: 0.78rem;
      letter-spacing: 0.03em;
      cursor: pointer;
      background: transparent;
      border: none;
      transition: background 0.15s;
    }
    .toggle-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }

    .toggle-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .active-step-badge {
      font-size: 0.68rem;
      font-weight: 800;
      background: #06b6d4;
      color: #082f49;
      padding: 1px 8px;
      border-radius: var(--radius-pill);
    }

    .chevron {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .tester-content {
      padding: 10px 18px 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: #0f172a;
    }

    .status-summary {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .badge {
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      background: #1e293b;
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.74rem;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .badge-active {
      background: #064e3b;
      color: #a7f3d0;
      border-color: #059669;
    }
    .badge-warn {
      background: #78350f;
      color: #fde68a;
      border-color: #d97706;
    }
    .badge-danger {
      background: #7f1d1d;
      color: #fecaca;
      border-color: #ef4444;
      animation: pulse 1s infinite alternate;
    }
    .badge-view {
      background: #312e81;
      color: #c7d2fe;
      border-color: #4f46e5;
    }

    .tester-actions-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .group-label {
      font-size: 0.72rem;
      font-weight: 800;
      color: #818cf8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      min-width: 195px;
    }

    .buttons-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .test-btn {
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      background: #1e293b;
      color: #f1f5f9;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid #334155;
      cursor: pointer;
      transition: all 0.15s;
    }
    .test-btn:hover {
      background: #334155;
      border-color: #64748b;
    }
    .test-btn.primary {
      background: #4f46e5;
      border-color: #6366f1;
    }
    .test-btn.primary:hover {
      background: #4338ca;
    }
    .test-btn.accent {
      background: #0d9488;
      border-color: #14b8a6;
    }
    .test-btn.accent:hover {
      background: #0f766e;
    }
    .test-btn.success {
      background: #059669;
      border-color: #10b981;
    }
    .test-btn.success:hover {
      background: #047857;
    }
    .test-btn.warn {
      background: #b45309;
      border-color: #f59e0b;
    }
    .test-btn.warn:hover {
      background: #92400e;
    }
    .test-btn.danger {
      background: #991b1b;
      border-color: #dc2626;
    }
    .test-btn.danger:hover {
      background: #7f1d1d;
    }

    @keyframes pulse {
      from { opacity: 0.8; }
      to { opacity: 1; transform: scale(1.02); }
    }
  `]
})
export class FlowTesterBarComponent {
  sessionService = inject(SessionService);
  authService = inject(AuthService);
  mapService = inject(MapService);
  achievementsService = inject(AchievementsService);
  isCollapsed = signal<boolean>(false);

  // Módulo 04 Actions
  goToAchievements(tab: 'ranks' | 'badges' | 'rewards' | 'leagues' = 'ranks'): void {
    this.achievementsService.setActiveTab(tab);
    this.sessionService.navigate('achievements');
  }

  testAddXp50(): void {
    this.achievementsService.simulateAddWeeklyXp(50);
  }

  testPromoteToFlamenco(): void {
    this.achievementsService.simulateAddWeeklyXp(200);
  }

  testClaimCoupon(): void {
    this.goToAchievements('rewards');
    const available = this.achievementsService.couponRewards().find(c => !c.isClaimed);
    if (available) {
      this.achievementsService.claimCoupon(available);
    }
  }

  testUnlockBadge(): void {
    this.goToAchievements('badges');
    const locked = this.achievementsService.badges().find(b => !b.isUnlocked);
    if (locked) {
      this.achievementsService.unlockBadge(locked.id);
    }
  }

  // Módulo 03 Actions
  goToMap(): void {
    if (!this.sessionService.isAuthenticated()) {
      this.sessionService.simulateLogin();
    }
    this.sessionService.grantLocation();
    this.sessionService.navigate('map');
  }

  testSelectPoiAndRoute(): void {
    this.goToMap();
    const poi = this.mapService.pointsOfInterest()[1]; // Fuente Ancestral
    this.mapService.selectPoi(poi);
  }

  testStartActiveMission(): void {
    this.goToMap();
    const poi = this.mapService.pointsOfInterest()[1];
    this.mapService.startMission(poi);
  }

  testCompleteOutOfRange(): void {
    this.goToMap();
    if (!this.mapService.activeMission()) {
      this.testStartActiveMission();
    }
    this.mapService.simulateWalkAway();
    this.mapService.completeActiveMission();
  }

  testCompleteWithReward(): void {
    this.goToMap();
    if (!this.mapService.activeMission()) {
      this.testStartActiveMission();
    }
    this.mapService.simulateWalkCloser();
    this.mapService.completeActiveMission();
  }

  // Módulo 02 Actions
  openAuth(mode: 'login' | 'register' | 'recovery'): void {
    this.authService.setAuthMode(mode);
    this.sessionService.openModal('auth');
  }

  testRegisterEmail(): void {
    this.authService.setAuthMode('register');
    this.authService.setAuthMethod('email');
    this.sessionService.openModal('auth');
  }

  testRegisterGoogle(): void {
    this.authService.setAuthMode('register');
    this.authService.setAuthMethod('google');
    this.sessionService.openModal('auth');
  }

  testAgeDenied(): void {
    this.authService.setAuthMode('register');
    this.authService.registrationStep.set('age_denied');
    this.sessionService.openModal('auth');
  }

  testUsernameTaken(): void {
    this.authService.setAuthMode('register');
    this.authService.generateUsernameSuggestions('explorador');
    this.authService.registrationStep.set('username_taken');
    this.sessionService.openModal('auth');
  }

  testFailedAttempt(): void {
    this.authService.loginWithCredentials('usuario_inexistente', 'clave_erronea');
    this.sessionService.openModal('auth');
  }

  triggerPendingTutorial(): void {
    this.sessionService.session.update(s => ({
      ...s,
      isAuthenticated: true,
      tutorialCompleted: false
    }));
    this.sessionService.checkTutorialOrLocation();
  }
}
