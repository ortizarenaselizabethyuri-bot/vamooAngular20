import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-tutorial-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-card">
        <!-- Top Mascot Graphic -->
        <div class="mascot-header">
          <div class="mascot-img-wrap">
            <img src="assets/mascot.jpg" alt="Vamoo Mascot" class="mascot-avatar" />
            <span class="greeting-badge">👋 ¡Bienvenido Explorador!</span>
          </div>
        </div>

        <!-- Dynamic Step Content -->
        <div class="step-container">
          <div class="step-badge">
            {{ currentStep().badge }}
          </div>
          <h2 class="step-title">{{ currentStep().title }}</h2>
          <h4 class="step-subtitle">{{ currentStep().subtitle }}</h4>
          <p class="step-desc">{{ currentStep().description }}</p>

          <!-- Step Indicators -->
          <div class="step-dots">
            @for (step of sessionService.tutorialSteps; track step.id; let i = $index) {
              <button
                class="dot"
                [class.active]="sessionService.currentTutorialStep() === i"
                (click)="sessionService.currentTutorialStep.set(i)"
              ></button>
            }
          </div>
        </div>

        <!-- Flowchart Decision: ¿Completar u omitir? -->
        <div class="modal-actions">
          <button class="btn-skip" (click)="sessionService.skipTutorial()">
            Omitir tutorial ⏭️
          </button>

          @if (sessionService.currentTutorialStep() < sessionService.tutorialSteps.length - 1) {
            <button class="btn-next" (click)="nextStep()">
              Siguiente paso ➔
            </button>
          } @else {
            <button class="btn-finish" (click)="sessionService.completeTutorial()">
              Finalizar tutorial y Explorar 🚀
            </button>
          }
        </div>
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
      max-width: 520px;
      width: 100%;
      padding: 32px 28px;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.3);
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .mascot-header {
      margin-bottom: 20px;
    }

    .mascot-img-wrap {
      position: relative;
      display: inline-block;
    }

    .mascot-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid var(--color-primary);
      box-shadow: 0 10px 25px rgba(92, 71, 255, 0.35);
      animation: floatAnimation 3s ease-in-out infinite;
    }

    .greeting-badge {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .step-badge {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--color-secondary-hover);
      background: var(--color-secondary-light);
      padding: 4px 14px;
      border-radius: var(--radius-pill);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .step-title {
      font-size: 1.6rem;
      color: var(--color-text-main);
      margin-bottom: 6px;
    }

    .step-subtitle {
      font-size: 1.05rem;
      color: var(--color-primary);
      font-weight: 600;
      margin-bottom: 12px;
    }

    .step-desc {
      font-size: 0.95rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      max-width: 420px;
      margin: 0 auto 24px auto;
    }

    .step-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 28px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e2e8f0;
      transition: all 0.25s ease;
    }
    .dot.active {
      width: 28px;
      border-radius: 8px;
      background: var(--color-primary);
    }

    .modal-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .btn-skip {
      padding: 10px 18px;
      font-size: 0.92rem;
      font-weight: 600;
      color: #64748b;
      border-radius: var(--radius-pill);
      transition: all 0.2s;
    }
    .btn-skip:hover {
      background: #f1f5f9;
      color: var(--color-text-main);
    }

    .btn-next, .btn-finish {
      padding: 12px 24px;
      border-radius: var(--radius-pill);
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
      background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
      box-shadow: 0 4px 14px rgba(92, 71, 255, 0.35);
      transition: all var(--transition-spring);
    }
    .btn-next:hover, .btn-finish:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.45);
    }
  `]
})
export class TutorialModalComponent {
  sessionService = inject(SessionService);

  get currentStep() {
    return () => this.sessionService.tutorialSteps[this.sessionService.currentTutorialStep()];
  }

  nextStep(): void {
    if (this.sessionService.currentTutorialStep() < this.sessionService.tutorialSteps.length - 1) {
      this.sessionService.currentTutorialStep.update(i => i + 1);
    } else {
      this.sessionService.completeTutorial();
    }
  }
}
