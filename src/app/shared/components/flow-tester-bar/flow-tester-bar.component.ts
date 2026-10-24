import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-flow-tester-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tester-wrapper" [class.collapsed]="isCollapsed()">
      <!-- Toggle button -->
      <button class="toggle-btn" (click)="isCollapsed.set(!isCollapsed())" title="Simulador de Casos del Diagrama">
        <span>🧪 Panel de Pruebas (Flujos UML)</span>
        <span class="chevron">{{ isCollapsed() ? '▲' : '▼' }}</span>
      </button>

      @if (!isCollapsed()) {
        <div class="tester-content">
          <div class="status-summary">
            <span class="badge" [class.badge-active]="sessionService.isAuthenticated()">
              Sesión: {{ sessionService.isAuthenticated() ? '🟢 Autenticado' : '⚪ Visitante' }}
            </span>
            <span class="badge" [class.badge-active]="sessionService.session().tutorialCompleted">
              Tutorial: {{ sessionService.session().tutorialCompleted ? '✓ Completado' : '⏳ Pendiente' }}
            </span>
            <span class="badge" [class.badge-active]="sessionService.session().locationPermission === 'granted'" [class.badge-warn]="sessionService.session().locationPermission === 'denied' || sessionService.session().locationPermission === 'blocked'">
              GPS: {{ sessionService.session().locationPermission }}
            </span>
            <span class="badge badge-view">
              Vista: {{ sessionService.currentView() }}
            </span>
          </div>

          <div class="tester-actions">
            <button class="test-btn" (click)="sessionService.setAsVisitor()">
              🔄 Reset a Visitante
            </button>

            <button class="test-btn primary" (click)="sessionService.handlePlayClick()">
              ▶️ Ejecutar "¿Presiona Jugar?"
            </button>

            <button class="test-btn" (click)="triggerPendingTutorial()">
              👋 Forzar Tutorial
            </button>

            <button class="test-btn" (click)="sessionService.openModal('location')">
              📍 Probar Permiso GPS
            </button>

            <button class="test-btn warn" (click)="sessionService.simulateExpiredSession()">
              ⏳ Simular Sesión Expirada
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tester-wrapper {
      background: #0f172a;
      color: #f8fafc;
      font-size: 0.8rem;
      border-bottom: 2px solid #6366f1;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 999;
      position: relative;
    }

    .toggle-btn {
      width: 100%;
      padding: 6px 16px;
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
    }
    .toggle-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }

    .chevron {
      font-size: 0.7rem;
    }

    .tester-content {
      padding: 8px 16px 12px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .status-summary {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge {
      padding: 3px 8px;
      border-radius: var(--radius-pill);
      background: #1e293b;
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.74rem;
    }
    .badge-active {
      background: #065f46;
      color: #a7f3d0;
    }
    .badge-warn {
      background: #78350f;
      color: #fde68a;
    }
    .badge-view {
      background: #312e81;
      color: #c7d2fe;
    }

    .tester-actions {
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
    .test-btn.warn {
      background: #991b1b;
      border-color: #dc2626;
    }
    .test-btn.warn:hover {
      background: #7f1d1d;
    }
  `]
})
export class FlowTesterBarComponent {
  sessionService = inject(SessionService);
  isCollapsed = signal<boolean>(false);

  triggerPendingTutorial(): void {
    this.sessionService.session.update(s => ({
      ...s,
      isAuthenticated: true,
      tutorialCompleted: false
    }));
    this.sessionService.checkTutorialOrLocation();
  }
}
