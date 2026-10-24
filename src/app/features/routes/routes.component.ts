import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutesService } from '../../core/services/routes.service';
import { SessionService } from '../../core/services/session.service';
import { ThematicRoute, RouteTheme } from '../../core/models/routes.model';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="routes-page">
      <div class="routes-container">

        <!-- Header Summary Card (Módulo 06: Recorridos Temáticos) -->
        <section class="routes-header-card">
          <div class="header-main-row">
            <div class="header-text-col">
              <div class="header-badge-tag">
                <span class="badge-dot"></span>
                <span>Módulo 06 • Circuitos Urbanos y Paradas Secuenciales</span>
              </div>
              <h1 class="header-title">Recorridos Temáticos</h1>
              <p class="header-desc">
                Explora circuitos peatonales guiados con paradas secuenciales. Tu progreso queda guardado permanentemente para pausar y retomar cuando desees.
              </p>
            </div>

            <!-- Stats Grid -->
            <div class="stats-cards-row">
              <div class="stat-box">
                <span class="stat-number">{{ routesService.routesMetrics().total }}</span>
                <span class="stat-label">Circuitos</span>
              </div>
              <div class="stat-box completed">
                <span class="stat-number">{{ routesService.routesMetrics().completed }}</span>
                <span class="stat-label">Completados</span>
              </div>
              <div class="stat-box distance">
                <span class="stat-number">{{ routesService.routesMetrics().totalKm }} km</span>
                <span class="stat-label">Recorridos</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Banner de Recorrido Activo / Pausado (Página 15 y 16) -->
        @if (routesService.activeRoute(); as active) {
          <section class="active-route-banner" [class.paused]="active.status === 'paused'">
            <div class="active-header-row">
              <div class="active-badge-indicator">
                <span class="pulse-indicator" [class.paused]="active.status === 'paused'"></span>
                <strong>{{ active.status === 'paused' ? 'RECORRIDO PAUSADO (Progreso Guardado)' : 'RECORRIDO EN CURSO' }}</strong>
              </div>
              <span class="theme-tag-mini">{{ active.themeLabel }}</span>
            </div>

            <div class="active-route-title-row">
              <div>
                <h2 class="active-route-title">{{ active.title }}</h2>
                <span class="active-route-meta">
                  📏 {{ active.totalDistanceKm }} km totales • ⏱️ ~{{ active.estimatedDurationMinutes }} min • ⚡ +{{ active.totalXpReward }} XP
                </span>
              </div>

              <div class="route-actions-top">
                @if (active.status === 'in_progress') {
                  <button class="btn-pause" (click)="routesService.pauseActiveRoute()" title="Pausar recorrido y guardar paradas">
                    ⏸️ Pausar
                  </button>
                } @else {
                  <button class="btn-resume" (click)="routesService.resumeRoute(active)">
                    ▶️ Retomar
                  </button>
                }
                <button class="btn-abandon" (click)="routesService.requestAbandonRoute()">
                  ✕ Abandonar
                </button>
              </div>
            </div>

            <!-- Stepper Visual de Paradas Secuenciales (Página 15) -->
            <div class="stops-stepper-box">
              <div class="stepper-track">
                @for (stop of active.stops; track stop.id; let idx = $index) {
                  <div 
                    class="stepper-node" 
                    [class.completed]="stop.isCompleted"
                    [class.current]="idx === routesService.activeStopIndex() && active.status === 'in_progress'"
                    (click)="routesService.selectTargetStop(idx)"
                  >
                    <div class="node-circle">
                      @if (stop.isCompleted) {
                        <span>✓</span>
                      } @else {
                        <span>{{ idx + 1 }}</span>
                      }
                    </div>
                    <span class="node-name">{{ stop.name }}</span>
                  </div>
                  @if (idx < active.stops.length - 1) {
                    <div class="stepper-line" [class.done]="stop.isCompleted"></div>
                  }
                }
              </div>
            </div>

            <!-- Parada Objetivo en Vivo y Botón de Validación GPS -->
            @if (routesService.currentTargetStop(); as targetStop) {
              <div class="target-stop-dock">
                <div class="target-info">
                  <span class="target-badge">🎯 PARADA OBJETIVO ACTUAL:</span>
                  <h3 class="target-name">{{ targetStop.icon }} {{ targetStop.name }}</h3>
                  <p class="target-desc">{{ targetStop.description }}</p>
                </div>

                <div class="target-proximity-card" [class.in-range]="routesService.isWithinStopArrivalZone()">
                  <div class="proximity-readout">
                    <span class="dist-val">{{ routesService.distanceToTargetStop() }}m</span>
                    <span class="dist-label">Distancia al objetivo</span>
                  </div>

                  @if (routesService.isWithinStopArrivalZone()) {
                    <button class="btn-validate-stop ready" (click)="routesService.confirmCurrentStop()">
                      ✓ Validar Parada GPS (&lt;35m)
                    </button>
                  } @else {
                    <button class="btn-validate-stop disabled" (click)="routesService.confirmCurrentStop()" title="Debes acercarte a menos de 35m">
                      🔒 Acércate a la Parada
                    </button>
                  }
                </div>
              </div>
            }
          </section>
        }

        <!-- Feedback Notification Toast -->
        @if (routesService.toastMessage(); as toast) {
          <div class="feedback-toast" [class]="toast.type">
            <span>{{ toast.text }}</span>
          </div>
        }

        <!-- Filtros por Temática (Página 14) -->
        <nav class="filters-nav">
          <div class="theme-filters">
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="routesService.activeThemeFilter() === 'all'"
              (click)="routesService.setThemeFilter('all')"
            >
              Todos los Circuitos
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="routesService.activeThemeFilter() === 'patrimonio'"
              (click)="routesService.setThemeFilter('patrimonio')"
            >
              🏛️ Patrimonio Cívico
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="routesService.activeThemeFilter() === 'parques'"
              (click)="routesService.setThemeFilter('parques')"
            >
              🌳 Naturaleza Urbana
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="routesService.activeThemeFilter() === 'historico'"
              (click)="routesService.setThemeFilter('historico')"
            >
              📜 Historia Secreta
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="routesService.activeThemeFilter() === 'cultural'"
              (click)="routesService.setThemeFilter('cultural')"
            >
              🛡️ Fortificaciones
            </button>
          </div>
        </nav>

        <!-- Grilla de Recorridos (Catálogo de Circuitos) -->
        <div class="routes-grid fade-in">
          @for (route of routesService.filteredRoutes(); track route.id) {
            <div 
              class="route-card" 
              [class.active]="route.id === routesService.activeRoute()?.id"
              [class.completed]="route.status === 'completed'"
              [class.suspended]="route.status === 'suspended'"
            >
              <div class="card-top-row">
                <span class="theme-badge">{{ route.themeLabel }}</span>
                
                @if (route.status === 'completed') {
                  <span class="status-tag completed">✓ Completado</span>
                } @else if (route.status === 'in_progress') {
                  <span class="status-tag in-progress">● En Curso</span>
                } @else if (route.status === 'paused') {
                  <span class="status-tag paused">⏸️ Pausado</span>
                } @else if (route.status === 'suspended') {
                  <span class="status-tag suspended">⚠️ Suspendido</span>
                } @else {
                  <span class="status-tag available">Disponible</span>
                }
              </div>

              <h3 class="route-title">{{ route.title }}</h3>

              <div class="route-quick-stats">
                <span>📍 {{ route.stops.length }} Paradas</span>
                <span>📏 {{ route.totalDistanceKm }} km</span>
                <span>⏱️ ~{{ route.estimatedDurationMinutes }} min</span>
                <span class="xp-tag">⚡ +{{ route.totalXpReward }} XP</span>
              </div>

              <!-- Mini Stepper Preview -->
              <div class="stops-preview-list">
                @for (stop of route.stops; track stop.id; let i = $index) {
                  <div class="preview-stop-item" [class.done]="stop.isCompleted">
                    <span class="stop-dot">{{ stop.isCompleted ? '✓' : (i + 1) }}</span>
                    <span class="stop-title-mini">{{ stop.name }}</span>
                  </div>
                }
              </div>

              <div class="badge-reward-preview">
                <span>🏆 Recompensa:</span>
                <strong>{{ route.badgeRewardName }}</strong>
              </div>

              @if (route.status === 'suspended') {
                <div class="suspension-banner-mini">
                  <small>{{ route.suspensionNotice }}</small>
                </div>
              }

              <div class="card-actions-row">
                <button class="btn-detail" (click)="routesService.openRouteDetail(route)">
                  🔍 Ver Itinerario
                </button>

                @if (route.status === 'paused') {
                  <button class="btn-route-action resume" (click)="routesService.resumeRoute(route)">
                    ▶️ Retomar
                  </button>
                } @else if (route.status === 'in_progress') {
                  <button class="btn-route-action in-progress" (click)="goToMap()">
                    🗺️ Ir al Mapa
                  </button>
                } @else if (route.status === 'suspended') {
                  <button class="btn-route-action suspended" (click)="routesService.startRoute(route)">
                    🔒 Suspendido
                  </button>
                } @else {
                  <button class="btn-route-action start" (click)="routesService.startRoute(route)">
                    🚀 Iniciar Recorrido
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Modal de Detalle de Recorrido e Itinerario Completo (Página 14) -->
      @if (routesService.selectedRouteDetail(); as route) {
        <div class="modal-backdrop" (click)="routesService.closeRouteDetail()">
          <div class="modal-card detail-modal" (click)="$event.stopPropagation()">
            <button class="btn-close-modal" (click)="routesService.closeRouteDetail()">✕</button>

            <span class="category-meta">{{ route.themeLabel }} • Dificultad {{ route.difficulty }}</span>
            <h2 class="modal-title">{{ route.title }}</h2>

            <div class="modal-itinerary-stats">
              <div>
                <span class="lbl">Distancia Total</span>
                <strong>{{ route.totalDistanceKm }} km</strong>
              </div>
              <div>
                <span class="lbl">Tiempo Estimado</span>
                <strong>~{{ route.estimatedDurationMinutes }} min</strong>
              </div>
              <div>
                <span class="lbl">Paradas</span>
                <strong>{{ route.stops.length }} estaciones</strong>
              </div>
              <div>
                <span class="lbl">Premio Total</span>
                <strong class="xp-val">+{{ route.totalXpReward }} XP</strong>
              </div>
            </div>

            <!-- Lista de Paradas Secuenciales -->
            <div class="itinerary-stops-list">
              <span class="itinerary-heading">Orden Sugerido de Paradas:</span>
              @for (stop of route.stops; track stop.id; let idx = $index) {
                <div class="itinerary-item">
                  <div class="stop-number-badge">{{ idx + 1 }}</div>
                  <div class="stop-info">
                    <strong>{{ stop.icon }} {{ stop.name }}</strong>
                    <p>{{ stop.description }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="modal-actions-row">
              <button class="btn-modal-map" (click)="goToMap()">
                📍 Ver en Mapa
              </button>
              <button class="btn-modal-start" (click)="routesService.startRoute(route)">
                🚀 Iniciar Este Recorrido
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Parada Validada (Feedback por Parada) -->
      @if (routesService.completedStopCelebration(); as celeb) {
        <div class="modal-backdrop" (click)="routesService.closeStopCelebration()">
          <div class="modal-card mini-celebration" (click)="$event.stopPropagation()">
            <div class="celeb-icon-circle">✓</div>
            <h2>¡Parada Validada con Éxito!</h2>
            <p>Has registrado tu llegada a <strong>{{ celeb.stop.name }}</strong>.</p>
            
            @if (celeb.nextStop) {
              <div class="next-stop-box">
                <span class="next-label">Siguiente estación sugerida:</span>
                <strong>{{ celeb.nextStop.icon }} {{ celeb.nextStop.name }}</strong>
                <small>{{ celeb.nextStop.description }}</small>
              </div>
            }

            <button class="btn-primary" (click)="routesService.closeStopCelebration()">
              Continuar Recorrido
            </button>
          </div>
        </div>
      }

      <!-- Modal de Recorrido Completo (Fanfarria y Recompensa) -->
      @if (routesService.completedRouteCelebration(); as routeCeleb) {
        <div class="modal-backdrop" (click)="routesService.closeRouteCelebration()">
          <div class="modal-card full-celebration" (click)="$event.stopPropagation()">
            <div class="trophy-badge">🏆 ¡CIRCUITO COMPLETADO!</div>
            <h2>{{ routeCeleb.route.title }}</h2>
            <p>¡Felicitaciones! Has recorrido todas las paradas secuenciales del itinerario.</p>

            <div class="xp-gain-card">
              <span class="xp-big">+{{ routeCeleb.xpEarned }}</span>
              <span class="xp-txt">XP DE RECORRIDO GANADOS</span>
            </div>

            <div class="badge-unlocked-pill">
              <span>🎖️ Insignia Desbloqueada:</span>
              <strong>{{ routeCeleb.route.badgeRewardName }}</strong>
            </div>

            <button class="btn-primary" (click)="routesService.closeRouteCelebration()">
              ¡Excelente! Ver Más Circuitos
            </button>
          </div>
        </div>
      }

      <!-- Modal de Suspensión por Seguridad / Obras (Página 16 & 17) -->
      @if (routesService.suspensionModalData(); as sus) {
        <div class="modal-backdrop" (click)="routesService.closeSuspensionModal()">
          <div class="modal-card suspension-modal" (click)="$event.stopPropagation()">
            <div class="warn-icon">⚠️</div>
            <h2>Ruta Temporalmente Suspendida</h2>
            <p>El recorrido <strong>"{{ sus.route.title }}"</strong> se encuentra suspendido.</p>
            
            <div class="suspension-reason-box">
              <strong>Motivo de suspensión técnica:</strong>
              <p>{{ sus.reason }}</p>
              <small>Tu progreso confirmado se conserva intacto en el servidor.</small>
            </div>

            <div class="admin-sim-actions">
              <button class="btn-primary" (click)="routesService.closeSuspensionModal()">
                Entendido
              </button>
              <button class="btn-admin-restore" (click)="routesService.simulateAdminRestoreRoute(sus.route.id); routesService.closeSuspensionModal()">
                🛠️ Simular Restauración de Vía Segura (Admin)
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Abandono de Recorrido -->
      @if (routesService.abandonModalData(); as ab) {
        <div class="modal-backdrop" (click)="routesService.cancelAbandonModal()">
          <div class="modal-card abandon-modal" (click)="$event.stopPropagation()">
            <div class="warn-icon">🚫</div>
            <h2>¿Abandonar Circuito?</h2>
            <p>Si abandonas <strong>"{{ ab.route.title }}"</strong>, se descartará el progreso de este intento y no se otorgará XP.</p>
            <div class="abandon-actions">
              <button class="btn-danger-confirm" (click)="routesService.confirmAbandonRoute()">
                Confirmar Abandono sin XP
              </button>
              <button class="btn-cancel" (click)="routesService.cancelAbandonModal()">
                Seguir en el Recorrido
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .routes-page {
      background: #f8fafc;
      min-height: calc(100vh - 100px);
      padding: 24px 16px 60px 16px;
    }
    .routes-container {
      max-width: 1080px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Header */
    .routes-header-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 24px 28px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
    }
    .header-main-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .header-text-col { flex: 1; min-width: 280px; }
    .header-badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #059669;
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      font-size: 0.74rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #059669; }
    .header-title { font-size: 1.85rem; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; }
    .header-desc { font-size: 0.9rem; color: #64748b; margin: 0; line-height: 1.45; }

    .stats-cards-row { display: flex; gap: 12px; }
    .stat-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 85px;
    }
    .stat-number { font-size: 1.35rem; font-weight: 900; color: #0f172a; }
    .stat-label { font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .stat-box.completed .stat-number { color: #059669; }
    .stat-box.distance .stat-number { color: var(--color-primary); }

    /* Active Route Banner */
    .active-route-banner {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #ffffff;
      border-radius: var(--radius-xl);
      padding: 22px 26px;
      border: 2px solid #0284c7;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.2);
    }
    .active-route-banner.paused {
      border-color: #f59e0b;
      background: linear-gradient(135deg, #1e1b4b, #1f2937);
    }

    .active-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .active-badge-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.74rem;
      letter-spacing: 0.05em;
      color: #38bdf8;
    }
    .pulse-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 10px #38bdf8;
      animation: pulse 1s infinite alternate;
    }
    .pulse-indicator.paused { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
    .theme-tag-mini {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      font-size: 0.74rem;
      color: #cbd5e1;
    }

    .active-route-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .active-route-title { margin: 0; font-size: 1.3rem; color: #ffffff; }
    .active-route-meta { font-size: 0.82rem; color: #94a3b8; }

    .route-actions-top { display: flex; gap: 8px; }
    .btn-pause {
      padding: 8px 14px;
      background: #d97706;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .btn-resume {
      padding: 8px 14px;
      background: #059669;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .btn-abandon {
      padding: 8px 12px;
      background: transparent;
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      cursor: pointer;
    }

    /* Stepper */
    .stops-stepper-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      padding: 16px;
      overflow-x: auto;
    }
    .stepper-track {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 500px;
    }
    .stepper-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
    }
    .node-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #334155;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 800;
      transition: all 0.2s;
    }
    .stepper-node.completed .node-circle {
      background: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }
    .stepper-node.current .node-circle {
      background: #38bdf8;
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.8);
      transform: scale(1.15);
    }
    .node-name { font-size: 0.72rem; color: #cbd5e1; max-width: 120px; text-align: center; }
    .stepper-line {
      flex: 1;
      height: 3px;
      background: #334155;
      margin: 0 8px;
    }
    .stepper-line.done { background: #10b981; }

    /* Target Stop Dock */
    .target-stop-dock {
      background: rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .target-info { flex: 1; min-width: 220px; }
    .target-badge { font-size: 0.7rem; font-weight: 800; color: #38bdf8; letter-spacing: 0.05em; }
    .target-name { margin: 2px 0 4px 0; font-size: 1.15rem; color: #ffffff; }
    .target-desc { margin: 0; font-size: 0.8rem; color: #94a3b8; }

    .target-proximity-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 18px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .target-proximity-card.in-range {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.2);
    }
    .proximity-readout { display: flex; flex-direction: column; text-align: right; }
    .dist-val { font-size: 1.4rem; font-weight: 900; color: #38bdf8; }
    .dist-label { font-size: 0.68rem; color: #cbd5e1; }
    .btn-validate-stop.ready {
      padding: 10px 18px;
      background: #10b981;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      animation: pulse 0.8s infinite alternate;
    }
    .btn-validate-stop.disabled {
      padding: 10px 18px;
      background: rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      cursor: not-allowed;
    }

    /* Filters */
    .filters-nav { display: flex; gap: 8px; flex-wrap: wrap; }
    .theme-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-pill {
      padding: 7px 14px;
      border-radius: var(--radius-pill);
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }
    .filter-pill.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
    }

    /* Routes Grid */
    .routes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .route-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
      transition: all 0.2s;
    }
    .route-card.active { border-color: #0284c7; box-shadow: 0 8px 25px rgba(2, 132, 199, 0.15); }
    .route-card.suspended { opacity: 0.75; }

    .card-top-row { display: flex; justify-content: space-between; align-items: center; }
    .theme-badge { font-size: 0.72rem; font-weight: 800; color: #0284c7; text-transform: uppercase; }
    .status-tag { font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-pill); }
    .status-tag.available { background: #f1f5f9; color: #475569; }
    .status-tag.in-progress { background: #e0f2fe; color: #0369a1; }
    .status-tag.paused { background: #fef3c7; color: #92400e; }
    .status-tag.completed { background: #ecfdf5; color: #065f46; }
    .status-tag.suspended { background: #fee2e2; color: #991b1b; }

    .route-title { margin: 0; font-size: 1.15rem; color: #0f172a; }
    .route-quick-stats { display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.74rem; color: #475569; font-weight: 600; }
    .xp-tag { color: var(--color-primary); font-weight: 800; }

    .stops-preview-list {
      background: #f8fafc;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .preview-stop-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #475569; }
    .preview-stop-item.done { color: #059669; font-weight: 700; }
    .stop-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 800;
    }
    .preview-stop-item.done .stop-dot { background: #a7f3d0; color: #065f46; }

    .badge-reward-preview {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      background: #ecfdf5;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      color: #065f46;
    }

    .suspension-banner-mini {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      color: #991b1b;
      font-size: 0.72rem;
    }

    .card-actions-row { display: flex; gap: 8px; margin-top: auto; }
    .btn-detail {
      flex: 1;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-route-action {
      flex: 1.3;
      padding: 8px 14px;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.8rem;
      color: #ffffff;
      cursor: pointer;
    }
    .btn-route-action.start { background: linear-gradient(135deg, #0284c7, #2563eb); }
    .btn-route-action.resume { background: #059669; }
    .btn-route-action.in-progress { background: #0284c7; }
    .btn-route-action.suspended { background: #94a3b8; cursor: not-allowed; }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 28px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
      position: relative;
    }
    .btn-close-modal {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: bold;
    }

    .modal-title { margin: 4px 0 16px 0; font-size: 1.35rem; color: #0f172a; }
    .modal-itinerary-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      padding: 12px;
      border-radius: var(--radius-md);
      margin-bottom: 16px;
      text-align: center;
    }
    .lbl { display: block; font-size: 0.68rem; color: #64748b; }
    .modal-itinerary-stats strong { font-size: 0.85rem; color: #0f172a; }

    .itinerary-stops-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
      max-height: 240px;
      overflow-y: auto;
    }
    .itinerary-heading { font-size: 0.78rem; font-weight: 800; color: #475569; }
    .itinerary-item {
      display: flex;
      gap: 12px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: var(--radius-md);
      border: 1px solid #e2e8f0;
    }
    .stop-number-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.78rem;
    }
    .stop-info p { margin: 2px 0 0 0; font-size: 0.78rem; color: #64748b; }

    .modal-actions-row { display: flex; gap: 10px; }
    .btn-modal-map {
      flex: 1;
      padding: 10px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
    }
    .btn-modal-start {
      flex: 1.3;
      padding: 10px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
    }

    /* Celebration & Suspension */
    .mini-celebration, .full-celebration, .suspension-modal, .abandon-modal { text-align: center; }
    .celeb-icon-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      margin: 0 auto 12px auto;
    }
    .next-stop-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px;
      border-radius: var(--radius-md);
      margin: 14px 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: left;
    }
    .next-label { font-size: 0.72rem; font-weight: 800; color: #166534; }

    .trophy-badge {
      background: #fef3c7;
      color: #92400e;
      font-weight: 900;
      padding: 4px 14px;
      border-radius: var(--radius-pill);
      display: inline-block;
      margin-bottom: 8px;
    }
    .xp-gain-card {
      background: #f8fafc;
      padding: 16px;
      border-radius: var(--radius-lg);
      margin: 14px 0;
    }
    .xp-big { font-size: 2.2rem; font-weight: 900; color: var(--color-primary); display: block; }
    .xp-txt { font-size: 0.8rem; font-weight: 800; color: #64748b; }
    .badge-unlocked-pill {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      color: #6b21a8;
      margin-bottom: 16px;
      font-size: 0.84rem;
    }

    .suspension-reason-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 14px;
      border-radius: var(--radius-md);
      color: #991b1b;
      margin: 14px 0;
      text-align: left;
      font-size: 0.82rem;
    }
    .admin-sim-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-admin-restore {
      background: #f1f5f9;
      color: #334155;
      border: 1px dashed #94a3b8;
      padding: 8px;
      border-radius: var(--radius-md);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-danger-confirm {
      padding: 11px 16px;
      background: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      cursor: pointer;
    }
    .btn-cancel {
      padding: 10px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      cursor: pointer;
    }
    .abandon-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }

    .feedback-toast {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 0.86rem;
      font-weight: 700;
      color: #ffffff;
    }
    .feedback-toast.info { background: #3b82f6; }
    .feedback-toast.success { background: #10b981; }
    .feedback-toast.warn { background: #f59e0b; }
    .feedback-toast.error { background: #ef4444; }

    @keyframes pulse { from { opacity: 0.8; } to { opacity: 1; transform: scale(1.02); } }
  `]
})
export class RoutesComponent {
  routesService = inject(RoutesService);
  sessionService = inject(SessionService);

  goToMap(): void {
    this.sessionService.navigate('map');
  }
}
