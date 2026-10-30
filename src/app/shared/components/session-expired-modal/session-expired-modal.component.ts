import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-session-expired-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="icon-bubble">
          <span>⏳</span>
        </div>

        <div class="status-badge">
          <span>Caso Excepcional: Módulo 01</span>
        </div>

        <h2 class="title">Tu Sesión ha Expirado</h2>
        <p class="description">
          Por razones de seguridad y privacidad, las acciones privadas se han suspendido y los datos sensibles de la interfaz han sido limpiados. Has sido redirigido a la portada.
        </p>

        <div class="question-box">
          <p><strong>¿Deseas volver a ingresar a tu cuenta?</strong></p>
        </div>

        <div class="actions">
          <button class="btn-stay" (click)="sessionService.stayOnLanding()">
            Permanecer en Portada
          </button>
          <button class="btn-reauth" (click)="sessionService.reAuthenticate()">
            🔑 Volver a Ingresar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 260;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: modalBackdropFade 0.25s ease-out;
    }

    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 460px;
      width: 100%;
      padding: 32px 24px;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35);
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .icon-bubble {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 16px;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
    }

    .status-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #b91c1c;
      background: #fef2f2;
      padding: 3px 12px;
      border-radius: var(--radius-pill);
      margin-bottom: 12px;
      border: 1px solid #fecaca;
    }

    .title {
      font-size: 1.45rem;
      color: var(--color-text-main);
      margin-bottom: 8px;
    }

    .description {
      font-size: 0.92rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin-bottom: 18px;
    }

    .question-box {
      font-size: 0.95rem;
      color: #1e293b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      width: 100%;
    }

    .actions {
      display: flex;
      gap: 12px;
      width: 100%;
    }

    .btn-stay {
      flex: 1;
      padding: 12px 14px;
      border-radius: var(--radius-pill);
      font-size: 0.88rem;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      transition: all 0.2s;
    }
    .btn-stay:hover {
      background: #e2e8f0;
      color: var(--color-text-main);
    }

    .btn-reauth {
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
    .btn-reauth:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.45);
    }
  `]
})
export class SessionExpiredModalComponent {
  sessionService = inject(SessionService);
}
