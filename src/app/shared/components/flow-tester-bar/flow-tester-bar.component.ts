import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { MapService } from '../../../core/services/map.service';
import { AchievementsService } from '../../../core/services/achievements.service';
import { MissionsService } from '../../../core/services/missions.service';
import { RoutesService } from '../../../core/services/routes.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-flow-tester-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isCollapsed()) {
      <!-- Floating Trigger Button (Non-intrusive for end-users) -->
      <button class="floating-pill-trigger" (click)="isCollapsed.set(false)" title="Simulador de Casos y Pruebas UML">
        <span class="pill-glow"></span>
        <span class="pill-icon">🧪</span>
        <span class="pill-text">Simulador UML</span>
        <span class="pill-badge">v2.0</span>
      </button>
    } @else {
      <!-- Floating Modal/Drawer Overlay -->
      <div class="tester-backdrop" (click)="isCollapsed.set(true)"></div>
      
      <div class="tester-floating-panel">
        <div class="panel-header">
          <div class="header-left">
            <span class="header-icon">🧪</span>
            <div>
              <h3 class="header-title">Simulador de Flujos y Casos UML</h3>
              <p class="header-subtitle">Módulos 01 a 07 (Vamoo Web Gamificada)</p>
            </div>
          </div>
          <button class="close-btn" (click)="isCollapsed.set(true)" title="Ocultar Simulador">
            ✕
          </button>
        </div>

        <div class="tester-content">
          <!-- Resumen de Estados Reactivos -->
          <div class="status-summary">
            <span class="badge" [class.badge-active]="sessionService.isAuthenticated()">
              Sesión: {{ sessionService.isAuthenticated() ? '🟢 ' + sessionService.session().username : '⚪ Visitante' }}
            </span>
            <span class="badge" [class.badge-active]="routesService.activeRoute() !== null" [class.badge-warn]="routesService.activeRoute()?.status === 'paused'">
              Recorrido: {{ routesService.activeRoute() ? (routesService.activeRoute()?.status === 'paused' ? '⏸️ Pausado' : '🚶 ' + routesService.activeRoute()?.title) : 'Ninguno' }}
            </span>
            <span class="badge" [class.badge-active]="missionsService.activeMission() !== null">
              Misión: {{ missionsService.activeMission() ? '🎯 ' + missionsService.activeMission()?.title : 'Ninguna' }}
            </span>
            <span class="badge" [class.badge-active]="sessionService.session().rank === 'Flamenco'" [class.badge-view]="sessionService.session().rank === 'Pingüino'">
              Rango: {{ sessionService.session().rank === 'Flamenco' ? '🦩' : '🐧' }} {{ sessionService.session().rank }} ({{ sessionService.session().xp }} XP)
            </span>
            <span class="badge" [class.badge-active]="sessionService.session().locationPermission === 'granted'" [class.badge-warn]="sessionService.session().locationPermission === 'denied' || sessionService.session().locationPermission === 'blocked' || mapService.isGpsLost()">
              GPS: {{ mapService.isGpsLost() ? '⚠️ Pérdida Señal' : sessionService.session().locationPermission }}
            </span>
            <span class="badge badge-view">
              Vista: {{ sessionService.currentView() }}
            </span>
          </div>

          <!-- Botones de Acción de Prueba -->
          <div class="tester-actions-grid">
            <!-- GRUPO MÓDULO 07: PERFIL & AVATAR -->
            <div class="action-group">
              <span class="group-label">Módulo 07: Perfil & Avatar</span>
              <div class="buttons-row">
                <button class="test-btn primary" (click)="goToProfile('summary')">
                  👤 Mi Perfil
                </button>
                <button class="test-btn accent" (click)="goToProfile('avatar')">
                  🎨 Armario Avatar
                </button>
                <button class="test-btn" (click)="testEquipAccessory()">
                  🧢 Equipar Sombrero
                </button>
                <button class="test-btn success" (click)="testChangeUsername()">
                  ✏️ Cambiar Usuario
                </button>
                <button class="test-btn" (click)="goToProfile('settings')">
                  🛡️ Privacidad & Cuenta
                </button>
              </div>
            </div>

            <!-- GRUPO MÓDULO 06: RECORRIDOS TEMÁTICOS -->
            <div class="action-group">
              <span class="group-label">Módulo 06: Recorridos</span>
              <div class="buttons-row">
                <button class="test-btn primary" (click)="goToRoutes()">
                  🚶 Ver Recorridos
                </button>
                <button class="test-btn accent" (click)="testStartRoute1()">
                  🚀 Iniciar Ruta 1 (Patrimonio)
                </button>
                <button class="test-btn success" (click)="testValidateStop()">
                  ✓ Validar Parada (&lt;35m)
                </button>
                <button class="test-btn warn" (click)="routesService.pauseActiveRoute()">
                  ⏸️ Pausar Progreso
                </button>
                <button class="test-btn success" (click)="testResumeRoute()">
                  ▶️ Retomar Recorrido
                </button>
                <button class="test-btn" (click)="testSuspendedRoute()">
                  ⚠️ Simular Ruta Suspendida
                </button>
                <button class="test-btn danger" (click)="routesService.requestAbandonRoute()">
                  🚫 Abandonar Ruta
                </button>
              </div>
            </div>
            <!-- GRUPO MÓDULO 05: MISIONES URBANAS Y RETOS -->
            <div class="action-group">
              <span class="group-label">Módulo 05: Misiones Urbanas</span>
              <div class="buttons-row">
                <button class="test-btn primary" (click)="goToMissions()">
                  🎯 Ver Misiones
                </button>
                <button class="test-btn accent" (click)="testStartMission1()">
                  🚀 Iniciar Misión 1 (Fuente)
                </button>
                <button class="test-btn warn" (click)="testTriggerConflict()">
                  ⚠️ Simular Conflicto (M2)
                </button>
                <button class="test-btn success" (click)="mapService.simulateWalkCloser()">
                  🚶 Acercar Avatar (&lt;35m)
                </button>
                <button class="test-btn success" (click)="missionsService.completeActiveMission()">
                  🎉 Validar y Completar
                </button>
                <button class="test-btn danger" (click)="missionsService.requestAbandonActiveMission()">
                  🚫 Abandonar sin XP
                </button>
                <button class="test-btn warn" (click)="missionsService.simulateAppCloseGracePeriod()">
                  🔌 Desconexión / Margen 30s
                </button>
                <button class="test-btn" (click)="testSecurityRestriction()">
                  🛡️ Probar Restricción Seg.
                </button>
              </div>
            </div>
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
      </div>
    }
  `,
  styles: [`
    /* Floating Pill Trigger (discreet for end users) */
    .floating-pill-trigger {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: #0f172a;
      border: 1px solid #6366f1;
      border-radius: var(--radius-pill);
      color: #f8fafc;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
      transition: all var(--transition-fast);
      backdrop-filter: blur(8px);
    }
    .floating-pill-trigger:hover {
      transform: translateY(-2px) scale(1.04);
      background: #1e1b4b;
      box-shadow: 0 12px 30px rgba(99, 102, 241, 0.6);
      border-color: #818cf8;
    }
    .pill-icon {
      font-size: 1.1rem;
    }
    .pill-badge {
      background: #06b6d4;
      color: #082f49;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 1px 7px;
      border-radius: var(--radius-pill);
    }

    /* Modal Backdrop */
    .tester-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      z-index: 9998;
    }

    /* Floating Panel Drawer */
    .tester-floating-panel {
      position: fixed;
      bottom: 24px;
      left: 20px;
      right: 20px;
      max-width: 1040px;
      max-height: 82vh;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #6366f1;
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      z-index: 9999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .panel-header {
      padding: 12px 20px;
      background: #1e1b4b;
      border-bottom: 1px solid #312e81;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      font-size: 1.4rem;
    }
    .header-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
      line-height: 1.2;
    }
    .header-subtitle {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 0;
    }
    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #475569;
      background: #1e293b;
      color: #cbd5e1;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }
    .close-btn:hover {
      background: #dc2626;
      border-color: #ef4444;
      color: #ffffff;
    }

    .tester-content {
      padding: 16px 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
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

    @media (max-width: 860px) {
      .floating-pill-trigger {
        bottom: 74px;
        left: 14px;
        padding: 7px 12px;
        font-size: 0.75rem;
      }
      .tester-floating-panel {
        bottom: 12px;
        left: 10px;
        right: 10px;
        max-height: 85vh;
      }
    }
  `]
})
export class FlowTesterBarComponent {
  sessionService = inject(SessionService);
  authService = inject(AuthService);
  mapService = inject(MapService);
  achievementsService = inject(AchievementsService);
  missionsService = inject(MissionsService);
  routesService = inject(RoutesService);
  profileService = inject(ProfileService);
  isCollapsed = signal<boolean>(true);

  // Módulo 07 Actions: Perfil & Avatar
  goToProfile(tab: 'summary' | 'avatar' | 'stats' | 'settings' = 'summary'): void {
    if (!this.sessionService.isAuthenticated()) {
      this.sessionService.simulateLogin();
    }
    this.profileService.setSubTab(tab);
    this.sessionService.navigate('profile');
  }

  testEquipAccessory(): void {
    this.goToProfile('avatar');
    const hat = this.profileService.avatarOptions().find(o => o.type === 'hat' && o.isUnlocked);
    if (hat) {
      this.profileService.equipOption(hat);
    }
  }

  testChangeUsername(): void {
    this.goToProfile('settings');
    this.profileService.resetUsernameCooldownForTesting();
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    this.profileService.changeUsername(`Explorador_${randomSuffix}`);
  }

  // Módulo 06 Actions: Recorridos Temáticos
  goToRoutes(): void {
    if (!this.sessionService.isAuthenticated()) {
      this.sessionService.simulateLogin();
    }
    this.sessionService.grantLocation();
    this.sessionService.navigate('routes');
  }

  testStartRoute1(): void {
    this.goToRoutes();
    const r1 = this.routesService.routes()[0];
    if (r1) {
      this.routesService.startRoute(r1);
    }
  }

  testValidateStop(): void {
    this.goToRoutes();
    this.mapService.simulateWalkCloser();
    this.routesService.confirmCurrentStop();
  }

  testResumeRoute(): void {
    this.goToRoutes();
    const r1 = this.routesService.routes()[0];
    if (r1) {
      this.routesService.resumeRoute(r1);
    }
  }

  testSuspendedRoute(): void {
    this.goToRoutes();
    const suspended = this.routesService.routes().find(r => r.status === 'suspended');
    if (suspended) {
      this.routesService.startRoute(suspended);
    }
  }

  // Módulo 05 Actions
  goToMissions(): void {
    this.sessionService.navigate('missions');
  }

  testStartMission1(): void {
    const m1 = this.missionsService.missions()[0];
    this.missionsService.requestStartMission(m1);
    this.sessionService.navigate('missions');
  }

  testTriggerConflict(): void {
    // Si no tiene misión activa, inicia la 1
    if (!this.missionsService.activeMission()) {
      this.testStartMission1();
    }
    // Intenta iniciar la 2 para provocar el modal de conflicto
    const m2 = this.missionsService.missions()[1];
    this.missionsService.requestStartMission(m2);
    this.sessionService.navigate('missions');
  }

  testSecurityRestriction(): void {
    const m6 = this.missionsService.missions().find(m => m.securityStatus === 'maintenance');
    if (m6) {
      this.missionsService.requestStartMission(m6);
      this.sessionService.navigate('missions');
    }
  }

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
