import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Barra Superior de Navegación -->
    <header class="navbar-wrapper">
      <div class="navbar-container">
        <!-- Brand Logo -->
        <div class="brand" (click)="sessionService.navigate('landing')">
          <div class="brand-icon">
            <span class="compass-needle">🧭</span>
          </div>
          <div class="brand-text">
            <span class="brand-name">Vamoo</span>
            <span class="brand-badge">Beta v2.0</span>
          </div>
        </div>

        <!-- Navigation Links (Desktop) -->
        <nav class="nav-links">
          <button
            class="nav-item"
            [class.active]="sessionService.currentView() === 'landing'"
            (click)="sessionService.navigate('landing')"
          >
            <span class="icon">🏠</span>
            <span>Inicio</span>
          </button>

          <button
            class="nav-item"
            [class.active]="sessionService.currentView() === 'map'"
            (click)="sessionService.navigate('map')"
          >
            <span class="icon">🗺️</span>
            <span>Mapa</span>
          </button>

          <button
            class="nav-item"
            [class.active]="sessionService.currentView() === 'missions'"
            (click)="sessionService.navigate('missions')"
          >
            <span class="icon">🎯</span>
            <span>Misiones</span>
          </button>

          <button
            class="nav-item"
            [class.active]="sessionService.currentView() === 'routes'"
            (click)="sessionService.navigate('routes')"
          >
            <span class="icon">🚶</span>
            <span>Recorridos</span>
          </button>

          <button
            class="nav-item"
            [class.active]="sessionService.currentView() === 'achievements'"
            (click)="sessionService.navigate('achievements')"
          >
            <span class="icon">🏆</span>
            <span>Logros</span>
          </button>

          <button
            class="nav-item"
            [class.active]="sessionService.currentView() === 'profile'"
            (click)="sessionService.navigate('profile')"
          >
            <span class="icon">👤</span>
            <span>Mi Perfil</span>
          </button>
        </nav>

        <!-- Right User Actions -->
        <div class="user-actions">
          @if (!sessionService.isAuthenticated()) {
            <button class="btn-info" (click)="sessionService.openModal('info')">
              <span>ℹ️ Info</span>
            </button>
            <button class="btn-play-nav" (click)="sessionService.handlePlayClick()">
              <span>¡Jugar Ahora! 🚀</span>
            </button>
          } @else {
            <div class="user-chip" (click)="sessionService.navigate('profile')">
              <div class="user-avatar-wrap">
                <img [src]="sessionService.session().avatar" alt="Avatar" class="user-avatar" />
                <span class="online-indicator"></span>
              </div>
              <div class="user-meta">
                <span class="user-name">{{ sessionService.session().username }}</span>
                <span class="user-rank">🎖️ {{ sessionService.session().rank }} ({{ sessionService.session().xp }} XP)</span>
              </div>
            </div>

            <button class="btn-logout" title="Cerrar sesión" (click)="authService.logout()">
              <span>🚪 Salir</span>
            </button>
          }
        </div>
      </div>
    </header>

    <!-- Bottom Navigation Bar for Mobile -->
    <nav class="bottom-nav">
      <button
        class="bottom-nav-item"
        [class.active]="sessionService.currentView() === 'landing'"
        (click)="sessionService.navigate('landing')"
      >
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Portada</span>
      </button>

      <button
        class="bottom-nav-item"
        [class.active]="sessionService.currentView() === 'map'"
        (click)="sessionService.navigate('map')"
      >
        <span class="nav-icon">🗺️</span>
        <span class="nav-label">Mapa</span>
      </button>

      <button
        class="bottom-nav-item action-center"
        (click)="sessionService.handlePlayClick()"
      >
        <div class="action-circle">
          <span>⚡</span>
        </div>
        <span class="nav-label">Jugar</span>
      </button>

      <button
        class="bottom-nav-item"
        [class.active]="sessionService.currentView() === 'missions'"
        (click)="sessionService.navigate('missions')"
      >
        <span class="nav-icon">🎯</span>
        <span class="nav-label">Misiones</span>
      </button>

      <button
        class="bottom-nav-item"
        [class.active]="sessionService.currentView() === 'achievements'"
        (click)="sessionService.navigate('achievements')"
      >
        <span class="nav-icon">🏆</span>
        <span class="nav-label">Logros</span>
      </button>
    </nav>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
    }

    .navbar-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
      transition: transform var(--transition-fast);
    }
    .brand:hover {
      transform: scale(1.03);
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      box-shadow: 0 4px 12px rgba(92, 71, 255, 0.3);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1;
    }

    .brand-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--color-secondary);
      background: #e6faf7;
      padding: 1px 6px;
      border-radius: 6px;
      width: fit-content;
      margin-top: 2px;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);
    }
    .nav-item:hover {
      color: var(--color-primary);
      background: var(--color-primary-light);
    }
    .nav-item.active {
      color: var(--color-primary);
      background: var(--color-primary-light);
      font-weight: 700;
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-info {
      padding: 8px 16px;
      border-radius: var(--radius-pill);
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border-subtle);
      background: #ffffff;
      transition: all var(--transition-fast);
    }
    .btn-info:hover {
      background: #f1f5f9;
      color: var(--color-text-main);
    }

    .btn-play-nav {
      padding: 9px 20px;
      border-radius: var(--radius-pill);
      font-size: 0.92rem;
      font-weight: 700;
      color: #ffffff;
      background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
      box-shadow: 0 4px 14px rgba(92, 71, 255, 0.35);
      transition: all var(--transition-spring);
    }
    .btn-play-nav:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(92, 71, 255, 0.45);
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 12px 5px 6px;
      border-radius: var(--radius-pill);
      background: #f8fafc;
      border: 1px solid var(--color-border-subtle);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .user-chip:hover {
      background: var(--color-primary-light);
      border-color: #c7d2fe;
    }

    .user-avatar-wrap {
      position: relative;
      width: 32px;
      height: 32px;
    }

    .user-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--color-primary);
    }

    .online-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #ffffff;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .user-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .user-rank {
      font-size: 0.72rem;
      color: var(--color-primary);
      font-weight: 600;
    }

    .btn-logout {
      font-size: 0.85rem;
      padding: 7px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      border: 1px solid var(--color-border-subtle);
      transition: all var(--transition-fast);
    }
    .btn-logout:hover {
      color: var(--color-accent-coral);
      border-color: #fecdd3;
      background: #fff1f2;
    }

    /* Mobile Bottom Navigation */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      border-top: 1px solid #e2e8f0;
      padding: 8px 12px 14px 12px;
      justify-content: space-around;
      align-items: center;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .bottom-nav-item.active {
      color: var(--color-primary);
      font-weight: 700;
    }

    .bottom-nav-item .nav-icon {
      font-size: 1.25rem;
    }

    .action-center {
      position: relative;
      top: -14px;
    }

    .action-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      box-shadow: 0 8px 20px rgba(92, 71, 255, 0.45);
    }

    @media (max-width: 860px) {
      .nav-links {
        display: none;
      }
      .bottom-nav {
        display: flex;
      }
      .navbar-container {
        padding: 10px 16px;
      }
    }
  `]
})
export class NavbarComponent {
  sessionService = inject(SessionService);
  authService = inject(AuthService);
}
