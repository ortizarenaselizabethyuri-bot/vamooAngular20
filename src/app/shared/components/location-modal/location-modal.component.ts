import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-location-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-card">
        @if (sessionService.session().locationPermission !== 'denied') {
          <!-- Estado 1: Solicitud inicial de GPS -->
          <div class="icon-bubble">
            <span class="icon-pulsing">📍</span>
          </div>

          <h2 class="title">Activa tu GPS para Explorar</h2>
          <p class="description">
            Vamoo utiliza tu ubicación en tiempo real para colocar tu avatar en el mapa, calcular distancias a los puntos de interés y validar misiones peatonales.
          </p>

          <div class="privacy-note">
            <span>🛡️ Tu ubicación no se almacena en segundo plano ni se comparte públicamente.</span>
          </div>

          <div class="actions">
            <button class="btn-deny" (click)="sessionService.denyLocation()">
              Denegar por ahora
            </button>
            <button class="btn-grant" (click)="requestBrowserLocation()">
              Conceder Permiso 🧭
            </button>
          </div>
        } @else {
          <!-- Estado 2: Diagrama 1: Explicar necesidad del permiso + ¿Reintentar? -->
          <div class="icon-bubble warning-bubble">
            <span>⚠️</span>
          </div>

          <h2 class="title text-warning">El GPS es Necesario para Jugar</h2>
          <p class="description">
            Al no conceder el permiso de ubicación, el sistema no puede cargar el mapa interactivo ni validar tus pasos en las misiones.
          </p>

          <div class="alert-box">
            <p><strong>¿Deseas reintentar la solicitud</strong> o prefieres mantener el acceso al mapa bloqueado?</p>
          </div>

          <div class="actions">
            <button class="btn-block" (click)="sessionService.keepMapBlocked()">
              Mantener acceso al mapa bloqueado
            </button>
            <button class="btn-retry" (click)="sessionService.retryLocation()">
              🔄 Reintentar permiso
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 250;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: modalBackdropFade 0.25s ease-out;
    }

    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 480px;
      width: 100%;
      padding: 32px 24px;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.3);
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .icon-bubble {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      margin-bottom: 20px;
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.25);
    }

    .warning-bubble {
      background: #fef3c7;
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.25);
    }

    .icon-pulsing {
      animation: floatAnimation 2s ease-in-out infinite;
    }

    .title {
      font-size: 1.5rem;
      color: var(--color-text-main);
      margin-bottom: 10px;
    }

    .text-warning {
      color: #b45309;
    }

    .description {
      font-size: 0.95rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin-bottom: 18px;
    }

    .privacy-note {
      font-size: 0.8rem;
      color: #64748b;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
      line-height: 1.4;
    }

    .alert-box {
      font-size: 0.9rem;
      color: #92400e;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .btn-deny, .btn-block {
      flex: 1;
      padding: 12px 14px;
      border-radius: var(--radius-pill);
      font-size: 0.88rem;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      transition: all 0.2s;
    }
    .btn-deny:hover, .btn-block:hover {
      background: #e2e8f0;
      color: var(--color-text-main);
    }

    .btn-grant, .btn-retry {
      flex: 1;
      padding: 12px 18px;
      border-radius: var(--radius-pill);
      font-size: 0.92rem;
      font-weight: 700;
      color: #ffffff;
      background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
      box-shadow: 0 4px 14px rgba(92, 71, 255, 0.35);
      transition: all var(--transition-spring);
    }
    .btn-grant:hover, .btn-retry:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.45);
    }
  `]
})
export class LocationModalComponent {
  sessionService = inject(SessionService);

  requestBrowserLocation(): void {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          this.sessionService.grantLocation();
        },
        () => {
          // Si el usuario deniega o falla en el navegador
          this.sessionService.denyLocation();
        },
        { timeout: 8000 }
      );
    } else {
      // Simular otorgado para fines de demostración si el navegador no tiene soporte directo
      this.sessionService.grantLocation();
    }
  }
}
