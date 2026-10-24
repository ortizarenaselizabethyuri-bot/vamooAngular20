import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-flow-tester-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tester-wrapper" [class.collapsed]="isCollapsed()">
      <!-- Toggle button -->
      <button class="toggle-btn" (click)="isCollapsed.set(!isCollapsed())" title="Simulador de Casos del Diagrama">
        <div class="toggle-title">
          <span>🧪 Panel de Pruebas de Flujos UML (Módulo 01 y Módulo 02)</span>
          <span class="active-step-badge">Paso 2: Autenticación Activo</span>
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
            <span class="badge" [class.badge-active]="sessionService.session().tutorialCompleted">
              Tutorial: {{ sessionService.session().tutorialCompleted ? '✓ Completado' : '⏳ Pendiente' }}
            </span>
            <span class="badge" [class.badge-active]="sessionService.session().locationPermission === 'granted'" [class.badge-warn]="sessionService.session().locationPermission === 'denied' || sessionService.session().locationPermission === 'blocked'">
              GPS: {{ sessionService.session().locationPermission }}
            </span>
            <span class="badge" [class.badge-warn]="authService.failedLoginAttempts() > 0" [class.badge-danger]="authService.isLockedOut()">
              Intentos Fallidos: {{ authService.failedLoginAttempts() }}/{{ authService.maxFailedAttempts }}
              {{ authService.isLockedOut() ? ' (🔒 Bloqueado ' + authService.lockoutSecondsRemaining() + 's)' : '' }}
            </span>
            <span class="badge badge-view">
              Vista: {{ sessionService.currentView() }}
            </span>
          </div>

          <!-- Botones de Acción de Prueba -->
          <div class="tester-actions-grid">
            <div class="action-group">
              <span class="group-label">Módulo 02: Autenticación</span>
              <div class="buttons-row">
                <button class="test-btn primary" (click)="openAuth('login')">
                  🔑 Ingresar (Login)
                </button>
                <button class="test-btn accent" (click)="testRegisterEmail()">
                  ✉️ Registro Correo + OTP
                </button>
                <button class="test-btn" (click)="testRegisterGoogle()">
                  🌐 Registro con Google
                </button>
                <button class="test-btn warn" (click)="testAgeDenied()">
                  🚫 Simular Edad < 14 (Denegado)
                </button>
                <button class="test-btn" (click)="testUsernameTaken()">
                  👥 Probar Nombre Ocupado
                </button>
                <button class="test-btn danger" (click)="testFailedAttempt()">
                  ⚠️ Forzar Error e Intentos
                </button>
                <button class="test-btn" (click)="openAuth('recovery')">
                  🛡️ Recuperar Contraseña
                </button>
                @if (sessionService.isAuthenticated()) {
                  <button class="test-btn danger" (click)="authService.logout()">
                    🚪 Cerrar Sesión
                  </button>
                }
              </div>
            </div>

            <div class="action-group">
              <span class="group-label">Módulo 01: Inicio & GPS</span>
              <div class="buttons-row">
                <button class="test-btn" (click)="sessionService.setAsVisitor()">
                  🔄 Reset Visitante
                </button>
                <button class="test-btn" (click)="sessionService.handlePlayClick()">
                  ▶️ "¿Presiona Jugar?"
                </button>
                <button class="test-btn" (click)="triggerPendingTutorial()">
                  👋 Forzar Tutorial
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
      background: #10b981;
      color: #022c22;
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
      min-width: 175px;
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
  isCollapsed = signal<boolean>(false);

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
