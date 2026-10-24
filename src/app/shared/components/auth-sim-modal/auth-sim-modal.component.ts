import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-auth-sim-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="sessionService.closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="brand-mini">
            <span class="brand-icon">🧭</span>
            <span class="brand-name">Vamoo Acceso</span>
          </div>
          <button class="btn-close" (click)="sessionService.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="badge-flow">
            <span>Diagrama 1 • Acceso a la Plataforma</span>
          </div>
          <h2 class="title">Comienza tu viaje</h2>
          <p class="subtitle">
            Inicia sesión o crea una cuenta para guardar tu progreso, subir de rango y ganar recompensas.
          </p>

          <div class="auth-buttons">
            <button class="btn-demo-login" (click)="sessionService.simulateLogin()">
              <span class="btn-icon">⚡</span>
              <div class="btn-text">
                <strong>Ingresar como Explorador</strong>
                <small>Acceso rápido de prueba (Rango Pingüino)</small>
              </div>
            </button>

            <button class="btn-social" (click)="sessionService.simulateLogin()">
              <span class="btn-icon">🌐</span>
              <div class="btn-text">
                <span>Continuar con Google</span>
              </div>
            </button>

            <button class="btn-email" (click)="sessionService.simulateLogin()">
              <span class="btn-icon">✉️</span>
              <div class="btn-text">
                <span>Continuar con Correo</span>
              </div>
            </button>
          </div>

          <p class="terms-hint">
            Al continuar, aceptas las <a href="javascript:void(0)" (click)="openPrivacy()">Políticas de Privacidad</a> de Vamoo.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 240;
      background: rgba(15, 23, 42, 0.65);
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
      max-width: 440px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.3);
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .brand-mini {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-icon {
      font-size: 1.3rem;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-weight: 800;
      color: var(--color-primary);
      font-size: 1.1rem;
    }

    .btn-close {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      background: #f8fafc;
    }

    .badge-flow {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      margin-bottom: 8px;
    }

    .title {
      font-size: 1.5rem;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 22px;
    }

    .auth-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }

    .btn-demo-login {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
      color: #ffffff;
      text-align: left;
      box-shadow: 0 4px 14px rgba(92, 71, 255, 0.35);
      transition: all var(--transition-spring);
    }
    .btn-demo-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.45);
    }
    .btn-demo-login small {
      display: block;
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.76rem;
    }

    .btn-social, .btn-email {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 18px;
      border-radius: var(--radius-md);
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-size: 0.92rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-social:hover, .btn-email:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .btn-icon {
      font-size: 1.3rem;
    }

    .terms-hint {
      font-size: 0.78rem;
      color: #94a3b8;
      text-align: center;
    }
    .terms-hint a {
      color: var(--color-primary);
      text-decoration: underline;
    }
  `]
})
export class AuthSimModalComponent {
  sessionService = inject(SessionService);

  openPrivacy(): void {
    this.sessionService.openModal('privacy');
  }
}
