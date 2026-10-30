import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="sessionService.closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="tab-selectors">
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'info'"
              (click)="activeTab.set('info')"
            >
              ℹ️ Sobre Vamoo
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'privacy'"
              (click)="activeTab.set('privacy')"
            >
              🛡️ Privacidad y Seguridad
            </button>
          </div>
          <button class="btn-close" (click)="sessionService.closeModal()">✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          @if (activeTab() === 'info') {
            <div class="info-content">
              <div class="hero-badge">
                <span>🌟 Bienvenidos a la Aventura</span>
              </div>
              <h3>Vamoo: Tu ciudad convertida en un juego</h3>
              <p class="description">
                Vamoo es la plataforma web progresiva que fusiona la actividad física, la cultura urbana y la gamificación. Sal a caminar, descubre rincones patrimoniales, parques y comercios locales mientras desbloqueas misiones en tiempo real.
              </p>

              <div class="feature-pills">
                <div class="pill-card">
                  <span class="pill-icon">📍</span>
                  <div>
                    <h4>Exploración Georreferenciada</h4>
                    <p>Detecta puntos verificados a tu alrededor con radar de proximidad.</p>
                  </div>
                </div>
                <div class="pill-card">
                  <span class="pill-icon">🧭</span>
                  <div>
                    <h4>Recorridos Temáticos</h4>
                    <p>Rutas con paradas secuenciales e historias culturales.</p>
                  </div>
                </div>
                <div class="pill-card">
                  <span class="pill-icon">🐧</span>
                  <div>
                    <h4>Rangos y Progresión</h4>
                    <p>Inicias como Pingüino y acumulas XP hasta llegar a Flamenco y rangos legendarios.</p>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="privacy-content">
              <div class="hero-badge security-badge">
                <span>🔒 Compromiso de Privacidad</span>
              </div>
              <h3>Uso Seguro de Ubicación y Datos</h3>
              <p class="description">
                Tu seguridad es nuestra prioridad número uno. En Vamoo aplicamos estrictas políticas de protección de datos:
              </p>

              <ul class="policy-list">
                <li>
                  <strong>Geolocalización en tiempo real:</strong> Tu posición GPS solo se utiliza para validar proximidad a misiones mientras la aplicación está activa. No rastreamos tus movimientos en segundo plano.
                </li>
                <li>
                  <strong>Zonas de seguridad:</strong> Las misiones y recorridos se suspenden automáticamente si se reportan obras, zonas inseguras o incidencias viales.
                </li>
                <li>
                  <strong>Perfiles privados:</strong> Por defecto, tu perfil y estadísticas no son visibles para otros jugadores salvo que decidas participar voluntariamente en las Ligas Semanales.
                </li>
                <li>
                  <strong>Protección a menores:</strong> Los perfiles de usuarios menores de edad permanecen protegidos con restricciones de visibilidad estrictas.
                </li>
              </ul>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-secondary" (click)="sessionService.closeModal()">
            Cerrar
          </button>
          <button class="btn-primary" (click)="onPlayFromModal()">
            ¡Empezar a Jugar! 🚀
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: modalBackdropFade 0.25s ease-out;
    }

    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 620px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px 24px 12px 24px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .tab-selectors {
      display: flex;
      gap: 8px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: var(--radius-pill);
    }

    .tab-btn {
      padding: 8px 18px;
      border-radius: var(--radius-pill);
      font-size: 0.88rem;
      font-weight: 600;
      color: #64748b;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: #ffffff;
      color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      font-weight: 700;
    }

    .btn-close {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 1.1rem;
      background: #f8fafc;
      transition: background 0.2s;
    }
    .btn-close:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
    }

    .hero-badge {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      margin-bottom: 12px;
    }
    .security-badge {
      color: #059669;
      background: #ecfdf5;
    }

    h3 {
      font-size: 1.4rem;
      margin-bottom: 10px;
    }

    .description {
      color: #475569;
      line-height: 1.6;
      font-size: 0.98rem;
      margin-bottom: 20px;
    }

    .feature-pills {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pill-card {
      display: flex;
      gap: 14px;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
    }
    .pill-icon {
      font-size: 1.6rem;
    }
    .pill-card h4 {
      font-size: 0.95rem;
      margin-bottom: 4px;
    }
    .pill-card p {
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.4;
    }

    .policy-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .policy-list li {
      position: relative;
      padding-left: 24px;
      font-size: 0.92rem;
      line-height: 1.5;
      color: #475569;
    }
    .policy-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      top: 0;
      color: #10b981;
      font-weight: 800;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #f8fafc;
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    }
  `]
})
export class InfoModalComponent {
  sessionService = inject(SessionService);
  activeTab = signal<'info' | 'privacy'>('info');

  onPlayFromModal(): void {
    this.sessionService.closeModal();
    this.sessionService.handlePlayClick();
  }
}
