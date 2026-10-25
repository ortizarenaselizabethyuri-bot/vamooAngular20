import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionsService } from '../../core/services/missions.service';
import { SessionService } from '../../core/services/session.service';
import { MapService } from '../../core/services/map.service';
import { MissionItem, MissionCategory } from '../../core/models/mission.model';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="missions-page">
      <div class="missions-container">

        <!-- Banner de Margen Técnico de Reconexión (Conflicto A: Diagrama Página 12) -->
        @if (missionsService.reconnectionSecondsLeft(); as seconds) {
          <div class="reconnection-banner">
            <div class="reconnection-content">
              <span class="recon-icon">🔌</span>
              <div>
                <strong>Margen Técnico de Reconexión Activo (Conflicto A)</strong>
                <p>Se interrumpió la conexión o se detectó salida. Tienes <strong>{{ seconds }}s</strong> para reanudar antes de que la misión sea cancelada automáticamente.</p>
              </div>
              <button class="btn-restore-session" (click)="missionsService.restoreSessionGracePeriod()">
                🟢 Restablecer Sesión Ahora
              </button>
            </div>
          </div>
        }

        <!-- Resumen de Métricas de Misiones Urbanas (Diagrama Página 9 y 10) -->
        <section class="missions-header-card">
          <div class="header-main-row">
            <div class="header-text-col">
              <div class="header-badge-tag">
                <span class="badge-dot"></span>
                <span>Módulo 05 • Retos Peatonales y Descubrimiento</span>
              </div>
              <h1 class="header-title">Misiones Urbanas</h1>
              <p class="header-desc">
                Recorre a pie sitios patrimoniales, resuelve incógnitas históricas y valida tu llegada con GPS en un radio seguro de 35 metros.
              </p>
            </div>

            <!-- Stats Grid -->
            <div class="stats-cards-row">
              <div class="stat-box">
                <span class="stat-number">{{ missionsService.missionStats().total }}</span>
                <span class="stat-label">Disponibles</span>
              </div>
              <div class="stat-box completed">
                <span class="stat-number">{{ missionsService.missionStats().completedCount }}</span>
                <span class="stat-label">Superadas</span>
              </div>
              <div class="stat-box xp">
                <span class="stat-number">+{{ missionsService.missionStats().totalXpEarned }}</span>
                <span class="stat-label">XP Obtenido</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Barra de Misión Activa en Curso (Si existe) -->
        @if (missionsService.activeMission(); as active) {
          <section class="active-mission-banner" [class.in-range]="missionsService.isWithinArrivalZone()">
            <div class="active-badge-indicator">
              <span class="radar-pulse"></span>
              <strong>MISIÓN EN CURSO</strong>
            </div>

            <div class="active-details">
              <div class="active-title-row">
                <span class="active-icon">{{ active.categoryIcon }}</span>
                <div>
                  <h3 class="active-title">{{ active.title }}</h3>
                  <span class="active-poi">🎯 Objetivo: {{ active.targetPoiName }}</span>
                </div>
              </div>

              <div class="active-proximity-info">
                @if (missionsService.isWithinArrivalZone()) {
                  <span class="zone-tag arrived">
                    ✓ ¡Llegaste a la zona objetivo! (&lt;35m)
                  </span>
                } @else {
                  <span class="zone-tag walking">
                    🚶 Distancia restante: <strong>{{ missionsService.distanceToTarget() }}m</strong>
                  </span>
                }
              </div>
            </div>

            <div class="active-actions">
              <button class="btn-active-map" (click)="goToMapWithMission(active)">
                🗺️ Ver en Mapa
              </button>

              @if (missionsService.isWithinArrivalZone()) {
                <button class="btn-complete-active" (click)="missionsService.completeActiveMission()">
                  🎯 Validar Llegada (+{{ active.timesCompleted === 0 ? active.xpReward : active.repeatXpReward }} XP)
                </button>
              } @else {
                <button class="btn-complete-disabled" (click)="missionsService.completeActiveMission()" title="Acércate a menos de 35m">
                  🔒 Validar Llegada
                </button>
              }

              <button class="btn-abandon" (click)="missionsService.requestAbandonActiveMission()" title="Abandonar misión sin XP">
                ✕ Abandonar
              </button>
            </div>
          </section>
        }

        <!-- Feedback Notification Toast -->
        @if (missionsService.toastMessage(); as toast) {
          <div class="feedback-toast" [class]="toast.type">
            <span>{{ toast.text }}</span>
          </div>
        }

        <!-- Segmented Category Filters & Tabs Navigation (Página 10) -->
        <nav class="filters-nav">
          <div class="category-filters">
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="missionsService.activeCategoryFilter() === 'all'"
              (click)="missionsService.setCategoryFilter('all')"
            >
              Todas las Misiones
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="missionsService.activeCategoryFilter() === 'descubrimiento'"
              (click)="missionsService.setCategoryFilter('descubrimiento')"
            >
              🧭 Descubrimiento
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="missionsService.activeCategoryFilter() === 'exploracion'"
              (click)="missionsService.setCategoryFilter('exploracion')"
            >
              🚶 Exploración
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="missionsService.activeCategoryFilter() === 'reto'"
              (click)="missionsService.setCategoryFilter('reto')"
            >
              ⚡ Retos Peatonales
            </button>
          </div>

          <div class="status-tab-group">
            <button 
              type="button" 
              class="status-tab" 
              [class.active]="missionsService.activeStatusFilter() === 'all'"
              (click)="missionsService.setStatusFilter('all')"
            >
              Catálogo
            </button>
            <button 
              type="button" 
              class="status-tab" 
              [class.active]="missionsService.activeStatusFilter() === 'completed'"
              (click)="missionsService.setStatusFilter('completed')"
            >
              📜 Historial de Superadas
            </button>
          </div>
        </nav>

        <!-- ============================================== -->
        <!-- GRILLA DE MISIONES PUBLICADAS (Página 10)      -->
        <!-- ============================================== -->
        @if (missionsService.activeStatusFilter() !== 'completed') {
          <div class="missions-grid fade-in">
            @for (mission of missionsService.filteredMissions(); track mission.id) {
              <div 
                class="mission-card" 
                [class.card-active]="mission.status === 'active'"
                [class.card-completed]="mission.timesCompleted > 0"
                [class.card-disabled]="!mission.isAvailable"
              >
                <!-- Card Header -->
                <div class="mission-card-header">
                  <div class="card-icon-wrap">
                    <span class="cat-emoji">{{ mission.categoryIcon }}</span>
                  </div>

                  <div class="meta-column">
                    <div class="badge-row">
                      <span class="category-tag">{{ mission.categoryLabel }}</span>
                      
                      @if (mission.status === 'active') {
                        <span class="status-pill active">En Curso</span>
                      } @else if (mission.timesCompleted > 0) {
                        <span class="status-pill completed">✓ Superada (x{{ mission.timesCompleted }})</span>
                      } @else {
                        <span class="status-pill available">Disponible</span>
                      }
                    </div>

                    <h3 class="mission-card-title">{{ mission.title }}</h3>
                  </div>
                </div>

                <!-- Card Body Description -->
                <p class="mission-desc">{{ mission.description }}</p>

                <!-- Target POI & Coordinates -->
                <div class="mission-target-box">
                  <span class="target-label">📍 Objetivo Geográfico:</span>
                  <strong class="target-poi">{{ mission.targetPoiName }}</strong>
                </div>

                <!-- Parameters Chips (Distancia, Tiempo, Dificultad, XP) -->
                <div class="params-row">
                  <span class="param-chip">
                    📏 ~{{ mission.distanceMeters }}m
                  </span>
                  <span class="param-chip">
                    ⏱️ ~{{ mission.estimatedMinutes }} min
                  </span>
                  <span class="param-chip" [class]="mission.difficulty.toLowerCase()">
                    📊 {{ mission.difficulty }}
                  </span>
                  <span class="param-chip xp-chip">
                    ⚡ +{{ mission.timesCompleted === 0 ? mission.xpReward : mission.repeatXpReward }} XP
                  </span>
                </div>

                <!-- Conflicto B & C notices -->
                <div class="security-info-row">
                  @if (mission.securityStatus === 'safe') {
                    <span class="sec-tag safe">🛡️ Lugar seguro validado</span>
                  } @else if (mission.securityStatus === 'schedule_restricted') {
                    <span class="sec-tag restricted">⏳ {{ mission.operationalSchedule }}</span>
                  } @else {
                    <span class="sec-tag maintenance">⚠️ Obras / Mantenimiento</span>
                  }

                  @if (mission.timesCompleted > 0) {
                    <span class="repeat-tag" title="Regla de Conflicto B: Repetición otorga XP de mantenimiento reducida">
                      🔄 Repetible (+{{ mission.repeatXpReward }} XP)
                    </span>
                  }
                </div>

                <!-- Card Actions -->
                <div class="card-footer-actions">
                  <button class="btn-detail" (click)="missionsService.openMissionDetail(mission)">
                    🔍 Ver Detalle
                  </button>

                  @if (mission.status === 'active') {
                    <button class="btn-primary-action in-progress" (click)="goToMapWithMission(mission)">
                      🗺️ Ir al Mapa
                    </button>
                  } @else if (!mission.isAvailable) {
                    <button class="btn-primary-action disabled" (click)="missionsService.requestStartMission(mission)">
                      🔒 Restringida
                    </button>
                  } @else {
                    <button class="btn-primary-action" (click)="missionsService.requestStartMission(mission)">
                      🚀 Iniciar Misión
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- ============================================== -->
          <!-- TABLA DE HISTORIAL DE MISIONES (Página 9 & 13) -->
          <!-- ============================================== -->
          <div class="history-card fade-in">
            <div class="history-header">
              <h2>📜 Historial de Finalizaciones Anteriores</h2>
              <p>Registro auditado de misiones con validación GPS real a velocidad peatonal.</p>
            </div>

            <div class="history-table">
              <div class="table-head">
                <span>Fecha y Hora</span>
                <span>Misión</span>
                <span>Categoría</span>
                <span>Validación</span>
                <span>XP Ganado</span>
              </div>

              @for (entry of missionsService.missionHistory(); track entry.id) {
                <div class="table-row">
                  <span class="col-date">{{ entry.completedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  <div class="col-mission">
                    <strong>{{ entry.missionTitle }}</strong>
                    @if (entry.badgeEarned) {
                      <span class="badge-tag">🏆 {{ entry.badgeEarned }}</span>
                    }
                  </div>
                  <span class="col-cat">{{ entry.categoryIcon }} {{ entry.category | uppercase }}</span>
                  <span class="col-val">✓ GPS Radio {{ entry.arrivalDistanceMeters }}m (&lt;35m)</span>
                  <span class="col-xp">+{{ entry.xpEarned }} XP</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- ============================================== -->
      <!-- MODAL DE DETALLE DE MISIÓN (Página 10)         -->
      <!-- ============================================== -->
      @if (missionsService.selectedMissionDetail(); as detail) {
        <div class="modal-backdrop" (click)="missionsService.closeMissionDetail()">
          <div class="modal-card detail-modal" (click)="$event.stopPropagation()">
            <button class="btn-close-modal" (click)="missionsService.closeMissionDetail()">✕</button>

            <div class="modal-header-section">
              <div class="header-icon-box">{{ detail.categoryIcon }}</div>
              <div>
                <span class="category-meta">{{ detail.categoryLabel }} • Dificultad {{ detail.difficulty }}</span>
                <h2>{{ detail.title }}</h2>
              </div>
            </div>

            <div class="modal-lore-box">
              <span class="lore-label">📖 Historia Urbana y Trasfondo:</span>
              <p class="lore-text">"{{ detail.loreStory }}"</p>
            </div>

            <div class="modal-mission-summary">
              <div class="summary-item">
                <span class="summary-label">Objetivo</span>
                <strong>{{ detail.targetPoiName }}</strong>
              </div>
              <div class="summary-item">
                <span class="summary-label">Distancia Estimada</span>
                <strong>~{{ detail.distanceMeters }} metros</strong>
              </div>
              <div class="summary-item">
                <span class="summary-label">Tiempo a pie</span>
                <strong>~{{ detail.estimatedMinutes }} minutos</strong>
              </div>
              <div class="summary-item">
                <span class="summary-label">Recompensa</span>
                <strong class="xp-val">+{{ detail.timesCompleted === 0 ? detail.xpReward : detail.repeatXpReward }} XP</strong>
              </div>
            </div>

            @if (detail.badgeRewardName) {
              <div class="reward-highlight">
                <span>🏅 Recompensa Adicional:</span>
                <strong>{{ detail.badgeRewardName }}</strong>
              </div>
            }

            <div class="security-box">
              <span class="sec-label">🛡️ Parámetros de Seguridad Peatonal (Conflicto C):</span>
              <p>{{ detail.operationalSchedule }} — Cumple con iluminación y resguardo urbano.</p>
            </div>

            <div class="modal-actions-row">
              <button class="btn-modal-map" (click)="goToMapWithMission(detail)">
                📍 Mostrar Destino en Mapa
              </button>
              <button class="btn-modal-start" (click)="missionsService.requestStartMission(detail)">
                🚀 Confirmar e Iniciar Misión
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ============================================== -->
      <!-- MODAL DE CONFLICTO DE MISIÓN (Página 11)       -->
      <!-- ============================================== -->
      @if (missionsService.conflictModalData(); as conflict) {
        <div class="modal-backdrop" (click)="missionsService.cancelConflictModal()">
          <div class="modal-card conflict-modal" (click)="$event.stopPropagation()">
            <div class="conflict-icon">⚠️</div>
            <h2>Conflicto de Misión Activa</h2>
            <p class="conflict-desc">
              Ya tienes una misión en curso: <strong>"{{ conflict.currentActiveMissionName }}"</strong>.
            </p>
            <div class="rule-box-warn">
              <p>
                Según las reglas de exploración de Vamoo, solo puedes tener <strong>una misión activa a la vez</strong>. Si comienzas "{{ conflict.newMission.title }}", la misión anterior se cancelará y su progreso parcial se descartará <strong>sin otorgar XP</strong>.
              </p>
            </div>

            <div class="conflict-actions">
              <button class="btn-danger-confirm" (click)="missionsService.confirmAbandonAndStartNew()">
                ✓ Sí, Abandonar Anterior e Iniciar Nueva
              </button>
              <button class="btn-cancel" (click)="missionsService.cancelConflictModal()">
                Mantener Misión Actual
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ============================================== -->
      <!-- MODAL DE CONFIRMACIÓN DE ABANDONO (Página 12)  -->
      <!-- ============================================== -->
      @if (missionsService.abandonModalData(); as abandon) {
        <div class="modal-backdrop" (click)="missionsService.cancelAbandonModal()">
          <div class="modal-card abandon-modal" (click)="$event.stopPropagation()">
            <div class="conflict-icon">🚫</div>
            <h2>¿Abandonar Misión?</h2>
            <p>
              Estás a punto de cancelar <strong>"{{ abandon.mission.title }}"</strong>.
            </p>
            <p class="rule-note">
              Esta acción descartará tu trayecto actual y <strong>no se otorgará XP</strong>. Podrás volver a aceptarla más adelante.
            </p>

            <div class="conflict-actions">
              <button class="btn-danger-confirm" (click)="missionsService.confirmAbandonMission()">
                Confirmar Abandono sin XP
              </button>
              <button class="btn-cancel" (click)="missionsService.cancelAbandonModal()">
                Seguir con la Misión
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ============================================== -->
      <!-- MODAL DE RESTRICCIÓN DE SEGURIDAD (Conflicto C)-->
      <!-- ============================================== -->
      @if (missionsService.securityModalData(); as sec) {
        <div class="modal-backdrop" (click)="missionsService.closeSecurityModal()">
          <div class="modal-card security-modal" (click)="$event.stopPropagation()">
            <div class="conflict-icon">🛡️</div>
            <h2>Acceso Restringido por Seguridad</h2>
            <p class="sec-intro">
              La misión <strong>"{{ sec.mission.title }}"</strong> no puede iniciarse en este momento.
            </p>
            <div class="sec-reason-box">
              <strong>Motivo de seguridad ciudadana:</strong>
              <p>{{ sec.reason }}</p>
              <small>Horario seguro sugerido: <strong>{{ sec.scheduleAllowed }}</strong></small>
            </div>
            <button class="btn-primary" (click)="missionsService.closeSecurityModal()">
              Entendido
            </button>
          </div>
        </div>
      }

      <!-- ============================================== -->
      <!-- MODAL DE CELEBRACIÓN Y RECOMPENSA (Página 11)  -->
      <!-- ============================================== -->
      @if (missionsService.completedMissionCelebration(); as celeb) {
        <div class="modal-backdrop" (click)="missionsService.closeCelebrationModal()">
          <div class="modal-card celebration-modal" (click)="$event.stopPropagation()">
            <div class="celebration-badge">🎉 ¡MISIÓN SUPERADA!</div>
            
            <div class="celeb-icon-wrap">
              <span>{{ celeb.mission.categoryIcon }}</span>
            </div>

            <h2>{{ celeb.mission.title }}</h2>
            <p class="celeb-subtitle">Has validado tu llegada al objetivo con éxito mediante confirmación GPS.</p>

            <div class="celeb-reward-card">
              <div class="xp-gain-badge">
                <span class="xp-num">+{{ celeb.xpEarned }}</span>
                <span class="xp-word">XP ACUMULADOS</span>
              </div>
              <small>{{ celeb.isFirstTime ? '¡Primera completación de la misión!' : 'Completación repetida (XP de mantenimiento).' }}</small>
            </div>

            @if (celeb.mission.badgeRewardName && celeb.isFirstTime) {
              <div class="badge-unlocked-card">
                <span>🏅 Desbloqueaste:</span>
                <strong>{{ celeb.mission.badgeRewardName }}</strong>
              </div>
            }

            <div class="celeb-actions">
              <button class="btn-celeb-map" (click)="goToMapAfterSuccess()">
                🗺️ Explorar Más en el Mapa
              </button>
              <button class="btn-celeb-catalog" (click)="missionsService.closeCelebrationModal()">
                🎯 Ver Más Misiones
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .missions-page {
      background: #f8fafc;
      min-height: calc(100vh - 100px);
      padding: 24px 16px 60px 16px;
    }

    .missions-container {
      max-width: 1080px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Reconnection Banner (Conflicto A) */
    .reconnection-banner {
      background: linear-gradient(90deg, #78350f, #92400e);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: var(--radius-lg);
      box-shadow: 0 4px 15px rgba(180, 83, 9, 0.25);
      animation: pulse 1s infinite alternate;
    }
    .reconnection-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .reconnection-content p {
      margin: 2px 0 0 0;
      font-size: 0.85rem;
      color: #fde68a;
    }
    .btn-restore-session {
      padding: 8px 16px;
      background: #ffffff;
      color: #92400e;
      border: none;
      border-radius: var(--radius-pill);
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
    }

    /* Header Summary Card */
    .missions-header-card {
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
    .header-text-col {
      flex: 1;
      min-width: 280px;
    }
    .header-badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eef2ff;
      color: var(--color-primary);
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      font-size: 0.74rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-primary);
    }
    .header-title {
      font-size: 1.85rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .header-desc {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0;
      line-height: 1.45;
    }

    .stats-cards-row {
      display: flex;
      gap: 12px;
    }
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
    .stat-number {
      font-size: 1.35rem;
      font-weight: 900;
      color: #0f172a;
    }
    .stat-label {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .stat-box.completed .stat-number { color: #059669; }
    .stat-box.xp .stat-number { color: var(--color-primary); }

    /* Active Mission Banner */
    .active-mission-banner {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      color: #ffffff;
      border-radius: var(--radius-xl);
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      box-shadow: 0 8px 30px rgba(49, 46, 129, 0.25);
      border: 2px solid #6366f1;
    }
    .active-mission-banner.in-range {
      border-color: #10b981;
      background: linear-gradient(135deg, #064e3b, #065f46);
    }

    .active-badge-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.74rem;
      letter-spacing: 0.05em;
      color: #a5b4fc;
    }
    .radar-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 10px #38bdf8;
      animation: pulse 1s infinite alternate;
    }

    .active-details {
      flex: 1;
      min-width: 250px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .active-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .active-icon {
      font-size: 1.8rem;
    }
    .active-title {
      font-size: 1.15rem;
      margin: 0;
      color: #ffffff;
    }
    .active-poi {
      font-size: 0.82rem;
      color: #cbd5e1;
    }

    .zone-tag {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      display: inline-block;
    }
    .zone-tag.walking {
      background: rgba(255, 255, 255, 0.15);
      color: #f1f5f9;
    }
    .zone-tag.arrived {
      background: #10b981;
      color: #ffffff;
      animation: pulse 0.8s infinite alternate;
    }

    .active-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .btn-active-map {
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .btn-complete-active {
      padding: 9px 18px;
      background: #10b981;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
    .btn-complete-disabled {
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.82rem;
      cursor: not-allowed;
    }
    .btn-abandon {
      padding: 8px 12px;
      background: transparent;
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
    }

    /* Feedback Toast */
    .feedback-toast {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 0.86rem;
      font-weight: 700;
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }
    .feedback-toast.info { background: #3b82f6; }
    .feedback-toast.success { background: #10b981; }
    .feedback-toast.warn { background: #f59e0b; }
    .feedback-toast.error { background: #ef4444; }

    /* Filters Nav */
    .filters-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .category-filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .filter-pill {
      padding: 7px 14px;
      border-radius: var(--radius-pill);
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-pill:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .filter-pill.active {
      background: var(--color-primary);
      color: #ffffff;
      border-color: var(--color-primary);
    }

    .status-tab-group {
      display: flex;
      background: #e2e8f0;
      padding: 4px;
      border-radius: var(--radius-pill);
    }
    .status-tab {
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      border: none;
      background: transparent;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .status-tab.active {
      background: #ffffff;
      color: var(--color-primary);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    /* Missions Grid */
    .missions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .mission-card {
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
    .mission-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(15, 23, 42, 0.06);
      border-color: #cbd5e1;
    }
    .mission-card.card-active {
      border: 2px solid var(--color-primary);
      background: linear-gradient(180deg, #ffffff 0%, #faf8ff 100%);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.12);
    }
    .mission-card.card-completed {
      border-color: #a7f3d0;
      background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
    }
    .mission-card.card-disabled {
      opacity: 0.7;
      background: #f8fafc;
    }

    .mission-card-header {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .card-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }
    .meta-column {
      flex: 1;
    }
    .badge-row {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 4px;
    }
    .category-tag {
      font-size: 0.68rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-pill {
      font-size: 0.66rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: var(--radius-pill);
    }
    .status-pill.active { background: #e0e7ff; color: #4338ca; }
    .status-pill.completed { background: #ecfdf5; color: #065f46; }
    .status-pill.available { background: #f1f5f9; color: #475569; }

    .mission-card-title {
      font-size: 1.05rem;
      margin: 0;
      color: #0f172a;
      line-height: 1.25;
    }
    .mission-desc {
      font-size: 0.82rem;
      color: #475569;
      margin: 0;
      line-height: 1.4;
    }

    .mission-target-box {
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
    }
    .target-label { color: #64748b; }
    .target-poi { color: #0f172a; }

    .params-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .param-chip {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-pill);
      background: #f1f5f9;
      color: #334155;
    }
    .param-chip.fácil { color: #059669; background: #ecfdf5; }
    .param-chip.media { color: #d97706; background: #fffbeb; }
    .param-chip.avanzada { color: #dc2626; background: #fef2f2; }
    .xp-chip {
      background: #eef2ff;
      color: var(--color-primary);
      font-weight: 800;
    }

    .security-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      padding-top: 4px;
      border-top: 1px dashed #e2e8f0;
    }
    .sec-tag.safe { color: #059669; font-weight: 600; }
    .sec-tag.restricted { color: #d97706; font-weight: 600; }
    .sec-tag.maintenance { color: #dc2626; font-weight: 700; }
    .repeat-tag { color: var(--color-primary); font-weight: 700; }

    .card-footer-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .btn-detail {
      flex: 1;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      color: #334155;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-detail:hover {
      background: #f8fafc;
    }
    .btn-primary-action {
      flex: 1.2;
      padding: 8px 14px;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(92, 71, 255, 0.25);
    }
    .btn-primary-action.in-progress {
      background: #10b981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }
    .btn-primary-action.disabled {
      background: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* History Table */
    .history-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 24px;
    }
    .history-header h2 {
      margin: 0 0 4px 0;
      font-size: 1.25rem;
      color: #0f172a;
    }
    .history-header p {
      margin: 0 0 16px 0;
      font-size: 0.84rem;
      color: #64748b;
    }
    .history-table {
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .table-head {
      display: grid;
      grid-template-columns: 140px 1.5fr 120px 180px 100px;
      background: #f8fafc;
      padding: 10px 14px;
      font-size: 0.76rem;
      font-weight: 800;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-row {
      display: grid;
      grid-template-columns: 140px 1.5fr 120px 180px 100px;
      padding: 12px 14px;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.82rem;
    }
    .col-date { color: #64748b; }
    .col-mission strong { color: #0f172a; display: block; }
    .badge-tag { font-size: 0.72rem; color: var(--color-primary); font-weight: 700; }
    .col-val { color: #059669; font-weight: 600; font-size: 0.78rem; }
    .col-xp { color: var(--color-primary); font-weight: 900; }

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
      animation: fadeIn 0.2s ease-out;
    }
    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 28px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
      position: relative;
      animation: slideUp 0.25s ease-out;
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

    .modal-header-section {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 16px;
    }
    .header-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }
    .category-meta {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .modal-header-section h2 {
      margin: 2px 0 0 0;
      font-size: 1.35rem;
      color: #0f172a;
    }

    .modal-lore-box {
      background: #faf5ff;
      border-left: 3px solid #a855f7;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .lore-label {
      font-size: 0.72rem;
      font-weight: 800;
      color: #7e22ce;
      display: block;
      margin-bottom: 2px;
    }
    .lore-text {
      font-size: 0.82rem;
      font-style: italic;
      color: #4c1d95;
      margin: 0;
    }

    .modal-mission-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: #f8fafc;
      padding: 14px;
      border-radius: var(--radius-md);
      margin-bottom: 14px;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
    }
    .summary-label {
      font-size: 0.72rem;
      color: #64748b;
    }
    .summary-item strong {
      font-size: 0.88rem;
      color: #0f172a;
    }
    .xp-val { color: var(--color-primary); }

    .reward-highlight {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      margin-bottom: 14px;
      font-size: 0.82rem;
      display: flex;
      justify-content: space-between;
      color: #065f46;
    }

    .security-box {
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      margin-bottom: 18px;
      font-size: 0.75rem;
    }
    .sec-label { font-weight: 800; color: #334155; display: block; margin-bottom: 2px; }
    .security-box p { margin: 0; color: #64748b; }

    .modal-actions-row {
      display: flex;
      gap: 10px;
    }
    .btn-modal-map {
      flex: 1;
      padding: 10px 14px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
    }
    .btn-modal-start {
      flex: 1.3;
      padding: 10px 16px;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(92, 71, 255, 0.35);
    }

    /* Conflict & Abandon Modals */
    .conflict-modal, .abandon-modal, .security-modal, .celebration-modal {
      text-align: center;
    }
    .conflict-icon {
      font-size: 3rem;
      margin-bottom: 8px;
    }
    .conflict-desc {
      font-size: 0.92rem;
      color: #334155;
    }
    .rule-box-warn {
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 12px;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      color: #92400e;
      text-align: left;
      margin: 14px 0;
    }
    .rule-note {
      font-size: 0.84rem;
      color: #64748b;
    }
    .conflict-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }
    .btn-danger-confirm {
      padding: 11px 16px;
      background: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.86rem;
      cursor: pointer;
    }
    .btn-cancel {
      padding: 10px 16px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
    }

    /* Security Modal */
    .sec-reason-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md);
      padding: 14px;
      font-size: 0.82rem;
      color: #991b1b;
      margin: 14px 0;
      text-align: left;
    }

    /* Celebration Modal */
    .celebration-badge {
      background: #ecfdf5;
      color: #059669;
      font-weight: 900;
      font-size: 0.82rem;
      padding: 4px 14px;
      border-radius: var(--radius-pill);
      display: inline-block;
      margin-bottom: 12px;
    }
    .celeb-icon-wrap {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.4rem;
      margin: 0 auto 12px auto;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35);
    }
    .celeb-subtitle {
      font-size: 0.86rem;
      color: #64748b;
      margin: 0 0 16px 0;
    }
    .celeb-reward-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-bottom: 14px;
    }
    .xp-gain-badge {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 6px;
    }
    .xp-num {
      font-size: 2.2rem;
      font-weight: 900;
      color: var(--color-primary);
    }
    .xp-word {
      font-size: 0.85rem;
      font-weight: 800;
      color: #64748b;
    }
    .badge-unlocked-card {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      color: #6b21a8;
      padding: 10px;
      border-radius: var(--radius-md);
      font-size: 0.84rem;
      margin-bottom: 16px;
    }
    .celeb-actions {
      display: flex;
      gap: 10px;
    }
    .btn-celeb-map {
      flex: 1;
      padding: 10px 14px;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
    }
    .btn-celeb-catalog {
      flex: 1;
      padding: 10px 14px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
    }

    @keyframes pulse {
      from { opacity: 0.8; }
      to { opacity: 1; transform: scale(1.02); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 768px) {
      .table-head, .table-row {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .col-date, .col-cat { display: none; }
    }
  `]
})
export class MissionsComponent {
  missionsService = inject(MissionsService);
  sessionService = inject(SessionService);
  mapService = inject(MapService);

  goToMapWithMission(mission: MissionItem): void {
    if (!this.missionsService.activeMission() || this.missionsService.activeMission()?.id !== mission.id) {
      this.missionsService.requestStartMission(mission);
    }
    this.sessionService.navigate('map');
  }

  goToMapAfterSuccess(): void {
    this.missionsService.closeCelebrationModal();
    this.sessionService.navigate('map');
  }
}
