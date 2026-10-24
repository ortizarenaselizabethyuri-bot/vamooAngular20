import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="landing-page">
      <!-- Banner de Alerta si el Acceso al Mapa está Bloqueado (Diagrama 1) -->
      @if (sessionService.isLocationBlocked()) {
        <div class="blocked-access-banner">
          <div class="blocked-content">
            <span class="blocked-icon">🔒</span>
            <div class="blocked-text">
              <strong>Acceso al mapa interactivo bloqueado:</strong>
              <span>No se ha concedido el permiso GPS requerido para posicionar tu avatar y validar misiones en vivo.</span>
            </div>
            <button class="btn-retry-banner" (click)="sessionService.retryLocation()">
              🔄 Reintentar Permiso GPS
            </button>
          </div>
        </div>
      }

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <!-- Left Column: Copy & Actions -->
          <div class="hero-text-col">
            <div class="release-tag">
              <span class="tag-dot"></span>
              <span>Gamificación Urbana • Paso 4: Logros, Rangos y Ligas Activo</span>
            </div>

            <h1 class="hero-title">
              Explora tu ciudad, <br />
              <span class="gradient-text">supera misiones</span> <br />
              y sube de nivel.
            </h1>

            <p class="hero-subtitle">
              Transforma tu caminata diaria en una emocionante aventura de rol en el mundo real. Descubre puntos patrimoniales ocultos, supera retos peatonales, asciende de rango y desbloquea recompensas exclusivas.
            </p>

            <!-- Main CTA Buttons (Diagrama 1: ¿Presiona Jugar? / Información y Privacidad) -->
            <div class="hero-actions">
              <button class="btn-play-hero" (click)="sessionService.handlePlayClick()">
                <span class="play-icon">⚡</span>
                <span>¡Presiona Jugar!</span>
                <span class="arrow-icon">➔</span>
              </button>

              <button class="btn-hero-info" (click)="sessionService.openModal('info')">
                <span>ℹ️ Información del Juego</span>
              </button>

              <button class="btn-hero-privacy" (click)="sessionService.openModal('privacy')">
                <span>🛡️ Privacidad</span>
              </button>
            </div>

            <!-- Gamification Teaser Pill -->
            <div class="rank-teaser">
              <div class="rank-badge">
                <span class="rank-icon">🐧</span>
                <span>Rango Inicial: <strong>Pingüino</strong></span>
              </div>
              <div class="rank-progress-text">
                <span>210 XP acumulados</span>
                <span class="rank-next">➔ Meta: 🦩 Flamenco (200 XP)</span>
              </div>
            </div>
          </div>

          <!-- Right Column: 3D Mascot & Visual Card -->
          <div class="hero-visual-col">
            <div class="mascot-card">
              <!-- Speech Bubble -->
              <div class="mascot-speech">
                <span class="speech-emoji">🧭</span>
                <span>"¡Hola explorador! Soy <strong>Vamoo</strong>. ¡Ponte las zapatillas y salgamos a descubrir tu ciudad!"</span>
              </div>

              <!-- 3D Mascot Image with Animation -->
              <div class="mascot-frame">
                <img src="/assets/mascot.jpg" alt="Vamoo Pingüino Explorador" class="mascot-img" />
                <div class="mascot-glow"></div>
              </div>

              <!-- Quick Highlights Floating Badges -->
              <div class="floating-badge badge-top-right">
                <span class="badge-icon">📍</span>
                <div class="badge-info">
                  <strong>Puntos Cercanos</strong>
                  <small>Verificación GPS activa</small>
                </div>
              </div>

              <div class="floating-badge badge-bottom-left">
                <span class="badge-icon">🏆</span>
                <div class="badge-info">
                  <strong>Ligas Semanales</strong>
                  <small>Compite y gana cupones</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Architecture Modules Roadmap Grid -->
      <section class="modules-overview">
        <div class="section-header">
          <span class="sub-heading">Arquitectura del Proyecto</span>
          <h2>Módulos del Sistema Vamoo</h2>
          <p>Dividido paso a paso para evaluación progresiva con tu equipo de desarrollo.</p>
        </div>

        <div class="modules-grid">
          <!-- Módulo 1 (Completado) -->
          <div class="module-card completed-step">
            <div class="card-status status-active">
              <span>✓ Paso 1: Portada e Inicio</span>
            </div>
            <div class="card-icon">🏠</div>
            <h3>01. Inicio y Portada</h3>
            <p>Portada pública, sesión, información, privacidad, tutorial interactivo de bienvenida y gestión de GPS.</p>
            <div class="card-footer">
              <span class="step-label">✓ Implementado</span>
            </div>
          </div>

          <!-- Módulo 2 (Completado) -->
          <div class="module-card completed-step" (click)="sessionService.openModal('auth')">
            <div class="card-status status-active">
              <span>✓ Paso 2: Autenticación</span>
            </div>
            <div class="card-icon">🔑</div>
            <h3>02. Autenticación y Cuentas</h3>
            <p>Registro Google/Correo, validación de edad >= 14, nombre único con sugerencias, OTP por email, recuperación y control de intentos fallidos.</p>
            <div class="card-footer">
              <span class="step-label">✓ Implementado</span>
            </div>
          </div>

          <!-- Módulo 3 (Implementado y Activo) -->
          <div class="module-card active-step" (click)="sessionService.navigate('map')">
            <div class="card-status status-active">
              <span>● Paso 3: Mapa y Proximidad Activo</span>
            </div>
            <div class="card-icon">🗺️</div>
            <h3>03. Acceso y Exploración del Mapa</h3>
            <p>Mapa 2D interactivo, radar en vivo, trazado peatonal SVG, radio de llegada (&lt;35m), eventos de pérdida/recuperación de GPS y celebración de recompensas.</p>
            <div class="card-footer">
              <button class="btn-module-action" (click)="$event.stopPropagation(); sessionService.navigate('map')">
                Explorar Mapa ➔
              </button>
            </div>
          </div>

          <!-- Módulo 4 (Implementado y Activo) -->
          <div class="module-card active-step" (click)="sessionService.navigate('achievements')">
            <div class="card-status status-active">
              <span>● Paso 4: Logros y Ligas Activo</span>
            </div>
            <div class="card-icon">🎖️</div>
            <h3>04. Logros, Rangos y Ligas</h3>
            <p>Escalafón Pingüino a Cóndor, insignias por vertiente, cupones de comercios aliados («include» Validar Campaña) y podio de liga semanal en vivo.</p>
            <div class="card-footer">
              <button class="btn-module-action" (click)="$event.stopPropagation(); sessionService.navigate('achievements')">
                Ver Logros y Ligas ➔
              </button>
            </div>
          </div>

          <!-- Módulo 5 -->
          <div class="module-card">
            <div class="card-status status-pending">
              <span>○ Paso 5</span>
            </div>
            <div class="card-icon">🎯</div>
            <h3>05. Misiones Urbanas</h3>
            <p>Catálogo de retos de descubrimiento y exploración, rutas peatonales y validación GPS segura.</p>
            <div class="card-footer">
              <span class="step-label">Diagramas 9 a 13</span>
            </div>
          </div>

          <!-- Módulo 6 -->
          <div class="module-card">
            <div class="card-status status-pending">
              <span>○ Paso 6</span>
            </div>
            <div class="card-icon">🚶</div>
            <h3>06. Recorridos Temáticos</h3>
            <p>Rutas con paradas secuenciales sugeridas, check-in manual/GPS y suspensión por seguridad.</p>
            <div class="card-footer">
              <span class="step-label">Diagramas 13 a 18</span>
            </div>
          </div>

          <!-- Módulo 7 -->
          <div class="module-card">
            <div class="card-status status-pending">
              <span>○ Paso 7</span>
            </div>
            <div class="card-icon">👤</div>
            <h3>07. Perfil y Personalización</h3>
            <p>Personalización de colores y accesorios para el avatar (/yo/avatar), estadísticas y privacidad.</p>
            <div class="card-footer">
              <span class="step-label">Diagramas 18 a 23</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Bar -->
      <section class="stats-section">
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-number">+1,200</span>
            <span class="stat-label">Puntos Verificados</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">4 Rangos</span>
            <span class="stat-label">Pingüino, Flamenco y más</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">Exploración Peatonal Segura</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">GPS</span>
            <span class="stat-label">Validación de Proximidad</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing-page {
      display: flex;
      flex-direction: column;
      gap: 32px;
      padding-bottom: 80px;
    }

    /* Alerta de Acceso Bloqueado */
    .blocked-access-banner {
      background: #fef2f2;
      border-bottom: 1.5px solid #fecaca;
      padding: 12px 20px;
      animation: bannerSlide 0.3s ease-out;
    }

    .blocked-content {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .blocked-icon {
      font-size: 1.5rem;
    }

    .blocked-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 0.9rem;
      color: #991b1b;
      line-height: 1.4;
    }

    .btn-retry-banner {
      padding: 8px 16px;
      background: #dc2626;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      border-radius: var(--radius-pill);
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
      transition: all 0.2s;
    }
    .btn-retry-banner:hover {
      background: #b91c1c;
      transform: scale(1.02);
    }

    /* Hero Section */
    .hero-section {
      max-width: 1240px;
      margin: 0 auto;
      padding: 40px 24px 20px 24px;
      width: 100%;
    }

    .hero-container {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      align-items: center;
      gap: 48px;
    }

    .release-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      color: var(--color-primary);
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: 20px;
    }

    .tag-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .hero-title {
      font-size: 3.4rem;
      line-height: 1.1;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f172a;
      margin-bottom: 20px;
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--color-primary) 0%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 1.12rem;
      color: #475569;
      line-height: 1.65;
      margin-bottom: 32px;
      max-width: 560px;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }

    .btn-play-hero {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 16px 32px;
      border-radius: var(--radius-pill);
      font-size: 1.1rem;
      font-weight: 800;
      box-shadow: 0 8px 30px rgba(92, 71, 255, 0.4);
      transition: all var(--transition-spring);
    }
    .btn-play-hero:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 36px rgba(92, 71, 255, 0.55);
    }
    .play-icon {
      font-size: 1.3rem;
    }
    .arrow-icon {
      font-size: 1.1rem;
      transition: transform 0.2s;
    }
    .btn-play-hero:hover .arrow-icon {
      transform: translateX(4px);
    }

    .btn-hero-info, .btn-hero-privacy {
      padding: 14px 22px;
      border-radius: var(--radius-pill);
      font-size: 0.95rem;
      font-weight: 600;
      color: #334155;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      transition: all 0.2s;
    }
    .btn-hero-info:hover, .btn-hero-privacy:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      color: #0f172a;
    }

    .rank-teaser {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 18px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      width: fit-content;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    }

    .rank-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
      color: #1e293b;
    }

    .rank-icon {
      font-size: 1.25rem;
    }

    .rank-progress-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      color: #64748b;
    }

    .rank-next {
      color: var(--color-primary);
      font-weight: 700;
    }

    /* Mascot Visual Card */
    .hero-visual-col {
      display: flex;
      justify-content: center;
    }

    .mascot-card {
      position: relative;
      background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
      padding: 32px 28px 28px 28px;
      border-radius: 36px;
      box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 440px;
      width: 100%;
    }

    .mascot-speech {
      position: relative;
      background: #ffffff;
      border: 1.5px solid #c7d2fe;
      border-radius: var(--radius-lg);
      padding: 10px 16px;
      font-size: 0.88rem;
      color: #334155;
      line-height: 1.4;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(92, 71, 255, 0.1);
    }
    .mascot-speech::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 8px 8px 0;
      border-style: solid;
      border-color: #ffffff transparent;
      display: block;
      width: 0;
    }

    .mascot-frame {
      position: relative;
      width: 260px;
      height: 260px;
      margin-bottom: 12px;
    }

    .mascot-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      border: 6px solid #ffffff;
      box-shadow: 0 16px 36px rgba(92, 71, 255, 0.3);
      animation: floatAnimation 3.5s ease-in-out infinite;
    }

    .mascot-glow {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(92, 71, 255, 0.25) 0%, transparent 70%);
      z-index: -1;
    }

    .floating-badge {
      position: absolute;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      padding: 8px 14px;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-top-right {
      top: 24px;
      right: -16px;
    }

    .badge-bottom-left {
      bottom: 16px;
      left: -20px;
    }

    .badge-icon {
      font-size: 1.4rem;
    }

    .badge-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .badge-info strong {
      font-size: 0.82rem;
      color: #0f172a;
    }
    .badge-info small {
      font-size: 0.72rem;
      color: #64748b;
    }

    /* Modules Overview */
    .modules-overview {
      max-width: 1240px;
      margin: 0 auto;
      padding: 20px 24px;
      width: 100%;
    }

    .section-header {
      text-align: center;
      margin-bottom: 36px;
    }

    .sub-heading {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .section-header h2 {
      font-size: 2.2rem;
      margin-top: 6px;
      margin-bottom: 8px;
    }

    .section-header p {
      color: #64748b;
      font-size: 1rem;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .module-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      transition: all 0.25s ease;
      position: relative;
    }
    .module-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: #cbd5e1;
    }

    .module-card.active-step {
      border: 2px solid var(--color-primary);
      box-shadow: 0 10px 30px rgba(92, 71, 255, 0.15);
      background: linear-gradient(180deg, #ffffff 0%, #faf8ff 100%);
      cursor: pointer;
    }

    .btn-module-action {
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      background: var(--color-primary);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(92, 71, 255, 0.3);
    }
    .btn-module-action:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
    }

    .card-status {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      width: fit-content;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status-active {
      background: #ecfdf5;
      color: #059669;
    }
    .status-pending {
      background: #f1f5f9;
      color: #64748b;
    }

    .card-icon {
      font-size: 2rem;
      margin-bottom: 12px;
    }

    .module-card h3 {
      font-size: 1.18rem;
      margin-bottom: 8px;
      color: #0f172a;
    }

    .module-card p {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
      flex: 1;
      margin-bottom: 18px;
    }

    .card-footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    .step-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    /* Stats Section */
    .stats-section {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      padding: 36px 24px;
      margin-top: 20px;
    }

    .stats-container {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 20px;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-number {
      font-family: var(--font-heading);
      font-size: 2.2rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Responsive adjustments */
    @media (max-width: 960px) {
      .hero-container {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .hero-actions {
        justify-content: center;
      }
      .rank-teaser {
        margin: 0 auto;
      }
      .hero-subtitle {
        margin-left: auto;
        margin-right: auto;
      }
      .badge-top-right {
        right: 0;
      }
      .badge-bottom-left {
        left: 0;
      }
      .stat-divider {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .hero-title {
        font-size: 2.4rem;
      }
      .btn-play-hero {
        width: 100%;
        justify-content: center;
      }
      .btn-hero-info, .btn-hero-privacy {
        flex: 1;
      }
    }
  `]
})
export class LandingComponent {
  sessionService = inject(SessionService);
}
