import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/services/session.service';
import { MapService } from '../../core/services/map.service';
import { MapPoi } from '../../core/models/map.model';

@Component({
  selector: 'app-map-interactive',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-view-wrapper">
      
      <!-- Top HUD Header (Carga y Navegación del Mapa) -->
      <header class="map-hud">
        <div class="hud-left">
          <div class="user-chip-hud" (click)="sessionService.navigate('profile')">
            <img [src]="sessionService.session().avatar" alt="Avatar" class="hud-avatar" />
            <div>
              <span class="hud-username">{{ sessionService.session().username }}</span>
              <span class="hud-rank">🎖️ {{ sessionService.session().rank }} ({{ sessionService.session().xp }} XP)</span>
            </div>
          </div>
        </div>

        <div class="hud-center">
          @if (!mapService.isGpsLost()) {
            <div class="gps-status-pill online">
              <span class="pulse-dot"></span>
              <span>GPS Activo • Precisión ±3m</span>
            </div>
          } @else {
            <div class="gps-status-pill offline" (click)="mapService.retryGpsSignal()">
              <span class="pulse-dot-red"></span>
              <span>⚠️ GPS Interrumpido • Reintentar</span>
            </div>
          }
        </div>

        <div class="hud-right">
          <div class="camera-controls">
            <button class="btn-tool" (click)="mapService.zoomIn()" title="Acercar mapa">+</button>
            <button class="btn-tool" (click)="mapService.zoomOut()" title="Alejar mapa">−</button>
            <button class="btn-tool" (click)="mapService.recenterMap()" title="Centrar en avatar">🎯</button>
          </div>
          <button class="btn-hud" (click)="sessionService.navigate('landing')">
            <span>🏠 Portada</span>
          </button>
        </div>
      </header>

      <!-- Banner de Alerta: GPS Perdido (Diagrama 4) -->
      @if (mapService.isGpsLost()) {
        <div class="gps-lost-banner">
          <div class="gps-lost-content">
            <span class="gps-lost-icon">📡</span>
            <div class="gps-lost-text">
              <strong>Señal de Posicionamiento GPS Perdida</strong>
              <span>Las acciones de validación de proximidad y trazado en tiempo real han sido pausadas.</span>
            </div>
            <button class="btn-gps-retry" (click)="mapService.retryGpsSignal()">
              🔄 Reintentar Conexión GPS
            </button>
          </div>
        </div>
      }

      <!-- Feedback Toast Notification -->
      @if (mapService.mapFeedbackMessage(); as feedback) {
        <div class="feedback-toast" [class]="feedback.type">
          <span>{{ feedback.text }}</span>
        </div>
      }

      <!-- Main Interactive Map Canvas Container -->
      <div 
        class="map-canvas-container" 
        [style.transform]="'scale(' + mapService.zoomLevel() + ') translate(' + mapService.panOffset().x + 'px, ' + mapService.panOffset().y + 'px)'"
      >
        <!-- Background Map Image -->
        <img src="assets/hero_city.jpg" alt="Mapa de Exploración Vamoo" class="map-bg-image" />

        <!-- Dynamic Pedestrian Walking Trail (SVG) -->
        @if (mapService.isRouteVisible() && mapService.currentDestinationCoords(); as dest) {
          <svg class="route-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5c47ff" />
                <stop offset="100%" stop-color="#00d1b2" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <!-- Trazado de ruta peatonal animado -->
            <line 
              [attr.x1]="mapService.avatarPos().x" 
              [attr.y1]="mapService.avatarPos().y" 
              [attr.x2]="dest.x" 
              [attr.y2]="dest.y" 
              class="pedestrian-path"
              stroke="url(#routeGradient)"
            />
          </svg>

          <!-- Marcador de Distancia Peatonal flotante en la ruta -->
          <div 
            class="route-dist-tag" 
            [style.left.%]="(mapService.avatarPos().x + dest.x) / 2" 
            [style.top.%]="(mapService.avatarPos().y + dest.y) / 2"
          >
            <span>🚶 {{ mapService.liveDistanceToTarget() }} m</span>
          </div>
        }

        <!-- Avatar Explorer Marker (Tú estás aquí) -->
        <div 
          class="avatar-marker" 
          [style.top.%]="mapService.avatarPos().y" 
          [style.left.%]="mapService.avatarPos().x"
          title="Tu posición actual (Pingüino Explorador)"
        >
          <!-- Ondas de radar de proximidad -->
          <div class="radar-wave" [class.paused]="mapService.isGpsLost()"></div>
          <div class="radar-wave-outer" [class.paused]="mapService.isGpsLost()"></div>
          
          <div class="avatar-pin">
            <img [src]="sessionService.session().avatar" alt="Avatar Pin" class="avatar-pin-img" />
          </div>
          <div class="marker-label">
            <span>{{ sessionService.session().username }}</span>
          </div>
        </div>

        <!-- Interactive Points of Interest (POIs Verificados) -->
        @for (poi of mapService.pointsOfInterest(); track poi.id) {
          <div
            class="poi-marker"
            [class.selected]="mapService.selectedPoi()?.id === poi.id"
            [class.active-target]="mapService.activeMission()?.poiId === poi.id"
            [class.completed]="mapService.completedMissionIds().includes(poi.id)"
            [style.top.%]="poi.coords.y"
            [style.left.%]="poi.coords.x"
            (click)="mapService.selectPoi(poi)"
          >
            <!-- Aura del radio de llegada (35m) -->
            @if (mapService.activeMission()?.poiId === poi.id) {
              <div class="arrival-zone-ring" [class.in-range]="mapService.isWithinArrivalZone()"></div>
            }

            <div class="poi-icon-wrap">
              <span>{{ poi.icon }}</span>
              @if (mapService.completedMissionIds().includes(poi.id)) {
                <span class="done-badge">✓</span>
              }
            </div>
            
            <div class="poi-tag">
              <span class="poi-name">{{ poi.name }}</span>
              <span class="poi-xp">+{{ poi.xpReward }} XP</span>
            </div>
          </div>
        }
      </div>

      <!-- Simulator Walk Assist Bar (Floating Helper Controls) -->
      <div class="walk-simulator-dock">
        <span class="dock-label">🧭 Control de Movimiento GPS:</span>
        <button 
          class="btn-dock" 
          [disabled]="mapService.isGpsLost()"
          (click)="mapService.simulateWalkCloser()"
          title="Simula que el explorador camina hasta estar dentro del radio de 35m"
        >
          🚶 Acercar Avatar al Objetivo (Zona &lt; 35m)
        </button>
        <button 
          class="btn-dock secondary" 
          [disabled]="mapService.isGpsLost()"
          (click)="mapService.simulateWalkAway()"
          title="Simula alejarse del objetivo"
        >
          ↔️ Alejar Avatar (&gt; 35m)
        </button>
        <button 
          class="btn-dock warn" 
          (click)="mapService.toggleGpsLost()"
        >
          {{ mapService.isGpsLost() ? '📡 Restaurar GPS' : '📡 Simular Pérdida GPS' }}
        </button>
      </div>

      <!-- POI Detail Card Flyout ("Consultar punto" UML) -->
      @if (mapService.selectedPoi(); as poi) {
        <div class="poi-card-floating fade-in">
          <div class="poi-card-header">
            <div class="poi-header-left">
              <span class="poi-cat-badge">{{ poi.category }}</span>
              <span class="verified-tag">✓ Verificado</span>
              @if (mapService.completedMissionIds().includes(poi.id)) {
                <span class="completed-tag">🏆 Ya Completada</span>
              }
            </div>
            <button class="btn-close-poi" (click)="mapService.clearSelectedPoi()">✕</button>
          </div>

          <div class="poi-card-body">
            <div class="poi-title-row">
              <span class="poi-big-icon">{{ poi.icon }}</span>
              <div>
                <h3>{{ poi.name }}</h3>
                <span class="poi-dist">
                  🚶 A <strong>{{ mapService.liveDistanceToTarget() }} metros</strong> (~{{ poi.walkingMinutes }} min a pie)
                </span>
              </div>
            </div>

            <p class="poi-description">{{ poi.description }}</p>

            <div class="poi-fact-box">
              <span class="fact-icon">📜</span>
              <span><strong>Dato Histórico:</strong> {{ poi.historicalFact }}</span>
            </div>

            <div class="poi-rewards-row">
              <div class="reward-pill xp">
                <span>⚡ Recompensa: <strong>+{{ poi.xpReward }} XP</strong></span>
              </div>
              @if (poi.badgeUnlock) {
                <div class="reward-pill badge">
                  <span>🎖️ Insignia: <strong>{{ poi.badgeUnlock }}</strong></span>
                </div>
              }
            </div>
          </div>

          <div class="poi-card-footer">
            @if (mapService.activeMission()?.poiId === poi.id) {
              <!-- Misión ya activa en este punto -->
              <div class="active-mission-actions">
                @if (mapService.isWithinArrivalZone()) {
                  <button class="btn-complete-quest glowing" (click)="mapService.completeActiveMission()">
                    🎉 ¡Completar Misión y Recibir XP!
                  </button>
                } @else {
                  <button class="btn-complete-quest disabled" (click)="mapService.completeActiveMission()">
                    🔒 Acércate a menos de 35m (Aún a {{ mapService.liveDistanceToTarget() }}m)
                  </button>
                }
                <button class="btn-abandon-quest" (click)="mapService.abandonActiveMission()">
                  Abandonar Misión
                </button>
              </div>
            } @else {
              <!-- Iniciar nueva misión -->
              <button 
                class="btn-start-quest" 
                [disabled]="mapService.isGpsLost()"
                (click)="mapService.startMission(poi)"
              >
                🚀 Iniciar Misión Peatonal en {{ poi.name }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Floating Active Mission HUD Tracker (En curso) -->
      @if (mapService.activeMission(); as mission) {
        @if (!mapService.selectedPoi() || mapService.selectedPoi()?.id !== mission.poiId) {
          <div class="active-mission-hud-bar fade-in" (click)="focusActiveMission(mission.poiId)">
            <div class="tracker-info">
              <span class="tracker-icon">{{ mission.icon }}</span>
              <div>
                <span class="tracker-title">Misión en curso: <strong>{{ mission.poiName }}</strong></span>
                <span class="tracker-dist">
                  🚶 Distancia restante: <strong>{{ mapService.liveDistanceToTarget() }} m</strong>
                </span>
              </div>
            </div>

            <div class="tracker-actions">
              @if (mapService.isWithinArrivalZone()) {
                <button class="btn-action-complete glowing" (click)="$event.stopPropagation(); mapService.completeActiveMission()">
                  🎉 ¡Completar Ahora!
                </button>
              } @else {
                <button class="btn-action-complete outline" (click)="$event.stopPropagation(); mapService.completeActiveMission()">
                  Validar Llegada
                </button>
              }
              <button class="btn-action-abandon" (click)="$event.stopPropagation(); mapService.abandonActiveMission()" title="Abandonar misión">
                ✕
              </button>
            </div>
          </div>
        }
      }

      <!-- Conflict Modal: Ya tiene una misión activa (Diagrama 5) -->
      @if (mapService.missionConflictAlert(); as conflict) {
        <div class="conflict-backdrop">
          <div class="conflict-modal">
            <div class="conflict-icon">⚠️</div>
            <h3>Ya tienes una misión activa en curso</h3>
            <p>
              Actualmente estás realizando la misión <strong>"{{ conflict.activeMissionName }}"</strong>.
              En Vamoo debes completar o cancelar tu misión actual antes de iniciar una nueva.
            </p>
            <div class="conflict-actions">
              <button class="btn-conflict-replace" (click)="mapService.confirmReplaceMission()">
                Abandonar anterior e iniciar "{{ conflict.requestedPoi.name }}"
              </button>
              <button class="btn-conflict-keep" (click)="mapService.cancelConflictAlert()">
                Mantener misión en curso
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Reward Celebration Modal (Diagrama 5: Mostrar animación de recompensa) -->
      @if (mapService.showRewardModal(); as showModal) {
        @if (mapService.rewardModalData(); as reward) {
          <div class="celebration-backdrop" (click)="mapService.closeRewardModal()">
            <div class="celebration-card" (click)="$event.stopPropagation()">
              <div class="confetti-cannon">🎉✨🎊</div>
              <div class="trophy-badge">🏆</div>
              <h2>¡Misión Completada!</h2>
              <p class="celebration-subtitle">
                Has alcanzado con éxito <strong>{{ reward.poiName }}</strong> con verificación GPS.
              </p>

              <div class="reward-highlight-box">
                <div class="xp-bubble">
                  <span class="xp-number">+{{ reward.xpEarned }}</span>
                  <span class="xp-unit">XP Ganados</span>
                </div>

                <div class="progress-meta">
                  <div class="meta-row">
                    <span>Total acumulado:</span>
                    <strong>{{ reward.totalXpNow }} XP</strong>
                  </div>
                  <div class="meta-row">
                    <span>Rango actual:</span>
                    <strong class="rank-highlight">{{ reward.rankName }}</strong>
                  </div>
                  @if (reward.badgeName) {
                    <div class="meta-row badge-unlocked">
                      <span>Insignia Desbloqueada:</span>
                      <strong>🎖️ {{ reward.badgeName }}</strong>
                    </div>
                  }
                </div>
              </div>

              <div class="celebration-speech">
                <img src="assets/mascot.jpg" alt="Mascota Vamoo" class="mascot-thumb" />
                <div class="speech-bubble">
                  <span>"¡Gran trabajo explorador! Cada paso te acerca a la cima de la liga semanal."</span>
                </div>
              </div>

              <button class="btn-continue-exploring" (click)="mapService.closeRewardModal()">
                ¡Continuar Explorando el Mapa! ➔
              </button>
            </div>
          </div>
        }
      }

      <!-- Bottom Bar: Status Summary -->
      <footer class="map-footer-status">
        <div class="status-indicator">
          <span class="status-icon">✅</span>
          <div>
            <strong>Módulo 03 • Acceso y Exploración del Mapa Activo</strong>
            <small>Carga 2D • Tracking Avatar • Trazado Peatonal • Validación de Proximidad (&lt;35m) • Recompensas</small>
          </div>
        </div>

        <div class="quick-nav-actions">
          <button class="btn-action-nav" (click)="sessionService.navigate('missions')">
            🎯 Catálogo Misiones
          </button>
          <button class="btn-action-nav" (click)="sessionService.navigate('routes')">
            🚶 Recorridos
          </button>
          <button class="btn-action-nav" (click)="sessionService.navigate('achievements')">
            🏆 Logros y Rangos
          </button>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .map-view-wrapper {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 100px);
      min-height: 640px;
      position: relative;
      background: #0f172a;
      overflow: hidden;
      user-select: none;
    }

    /* Top HUD */
    .map-hud {
      position: absolute;
      top: 14px;
      left: 16px;
      right: 16px;
      z-index: 60;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }
    .hud-left, .hud-center, .hud-right {
      pointer-events: auto;
    }

    .user-chip-hud {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      padding: 6px 14px 6px 6px;
      border-radius: var(--radius-pill);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: transform 0.15s;
    }
    .user-chip-hud:hover {
      transform: scale(1.02);
    }
    .hud-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--color-primary);
    }
    .hud-username {
      font-size: 0.85rem;
      font-weight: 700;
      display: block;
      color: #0f172a;
    }
    .hud-rank {
      font-size: 0.72rem;
      color: var(--color-primary);
      font-weight: 700;
    }

    .gps-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
    }
    .gps-status-pill.online {
      background: rgba(16, 185, 129, 0.92);
      color: #ffffff;
    }
    .gps-status-pill.offline {
      background: rgba(239, 68, 68, 0.92);
      color: #ffffff;
      cursor: pointer;
      animation: pulse 1s infinite alternate;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 0 8px #ffffff;
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .pulse-dot-red {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fef08a;
    }

    .hud-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .camera-controls {
      display: flex;
      gap: 4px;
      background: rgba(255, 255, 255, 0.92);
      padding: 4px;
      border-radius: var(--radius-pill);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }
    .btn-tool {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: #1e293b;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .btn-tool:hover {
      background: #e2e8f0;
      color: var(--color-primary);
    }
    .btn-hud {
      padding: 8px 16px;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.92);
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      transition: all 0.15s;
    }
    .btn-hud:hover {
      background: #ffffff;
      color: var(--color-primary);
    }

    /* GPS Lost Banner */
    .gps-lost-banner {
      position: absolute;
      top: 68px;
      left: 16px;
      right: 16px;
      z-index: 55;
      animation: slideDown 0.3s ease-out;
    }
    .gps-lost-content {
      background: rgba(239, 68, 68, 0.95);
      backdrop-filter: blur(10px);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
      gap: 12px;
    }
    .gps-lost-icon {
      font-size: 1.4rem;
    }
    .gps-lost-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 0.82rem;
    }
    .btn-gps-retry {
      padding: 6px 14px;
      background: #ffffff;
      color: #dc2626;
      border: none;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      font-weight: 800;
      cursor: pointer;
    }

    /* Feedback Toast */
    .feedback-toast {
      position: absolute;
      top: 76px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 55;
      padding: 8px 18px;
      border-radius: var(--radius-pill);
      font-size: 0.84rem;
      font-weight: 700;
      color: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      animation: fadeIn 0.25s ease-out;
    }
    .feedback-toast.info { background: #3b82f6; }
    .feedback-toast.success { background: #10b981; }
    .feedback-toast.warn { background: #f59e0b; }
    .feedback-toast.error { background: #ef4444; }

    /* Canvas */
    .map-canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      cursor: grab;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .map-canvas-container:active {
      cursor: grabbing;
    }
    .map-bg-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: saturate(1.1) brightness(0.96);
    }

    /* SVG Route */
    .route-svg-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    .pedestrian-path {
      stroke-width: 1.2;
      stroke-dasharray: 2, 2;
      animation: dashMove 1.5s linear infinite;
      stroke-linecap: round;
      filter: url(#glow);
    }
    .route-dist-tag {
      position: absolute;
      transform: translate(-50%, -50%);
      z-index: 12;
      background: rgba(15, 23, 42, 0.88);
      color: #38bdf8;
      border: 1px solid #38bdf8;
      padding: 3px 8px;
      border-radius: var(--radius-pill);
      font-size: 0.72rem;
      font-weight: 800;
      pointer-events: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      white-space: nowrap;
    }

    /* Avatar Marker */
    .avatar-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      z-index: 25;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: top 0.4s ease-out, left 0.4s ease-out;
    }
    .avatar-pin {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      padding: 3px;
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.5);
      position: relative;
      z-index: 2;
    }
    .avatar-pin-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: #ffffff;
    }
    .marker-label {
      background: rgba(15, 23, 42, 0.88);
      color: #ffffff;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      font-size: 0.7rem;
      font-weight: 700;
      margin-top: 4px;
      white-space: nowrap;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .radar-wave {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 2px solid var(--color-primary);
      background: rgba(92, 71, 255, 0.15);
      animation: radarPulse 2.2s infinite;
      z-index: 1;
      pointer-events: none;
    }
    .radar-wave-outer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 110px;
      height: 110px;
      border-radius: 50%;
      border: 1.5px dashed rgba(0, 209, 178, 0.6);
      animation: radarPulse 3s infinite 0.5s;
      z-index: 0;
      pointer-events: none;
    }
    .radar-wave.paused, .radar-wave-outer.paused {
      animation-play-state: paused;
      opacity: 0.3;
    }

    /* POI Markers */
    .poi-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .poi-marker:hover {
      transform: translate(-50%, -50%) scale(1.15);
      z-index: 30;
    }
    .poi-marker.selected {
      transform: translate(-50%, -50%) scale(1.2);
      z-index: 35;
    }
    .poi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #6366f1;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      position: relative;
    }
    .poi-marker.active-target .poi-icon-wrap {
      border-color: #10b981;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
      animation: bounceMarker 1.8s infinite;
    }
    .poi-marker.completed .poi-icon-wrap {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    .done-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #f59e0b;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #ffffff;
    }
    .poi-tag {
      background: rgba(15, 23, 42, 0.9);
      color: #ffffff;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.68rem;
      font-weight: 700;
      margin-top: 4px;
      white-space: nowrap;
      display: flex;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .poi-xp {
      color: #38bdf8;
    }

    /* Arrival Zone Ring (35m) */
    .arrival-zone-ring {
      position: absolute;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 2px dashed #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      animation: pulseRing 2s infinite;
      pointer-events: none;
    }
    .arrival-zone-ring.in-range {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.22);
    }

    /* Walk Simulator Dock */
    .walk-simulator-dock {
      position: absolute;
      bottom: 58px;
      left: 16px;
      z-index: 40;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(12px);
      padding: 6px 12px;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .dock-label {
      font-size: 0.74rem;
      color: #94a3b8;
      font-weight: 700;
    }
    .btn-dock {
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      border: none;
      background: #4f46e5;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-dock:hover:not(:disabled) {
      background: #4338ca;
    }
    .btn-dock.secondary {
      background: #334155;
    }
    .btn-dock.warn {
      background: #b45309;
    }
    .btn-dock:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* POI Floating Flyout Card ("Consultar punto") */
    .poi-card-floating {
      position: absolute;
      bottom: 60px;
      right: 16px;
      width: 360px;
      max-width: calc(100vw - 32px);
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 18px 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      z-index: 45;
      border: 1px solid rgba(255, 255, 255, 0.8);
    }
    .poi-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .poi-header-left {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .poi-cat-badge {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
    }
    .verified-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #065f46;
      background: #d1fae5;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }
    .completed-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #92400e;
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }
    .btn-close-poi {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .poi-title-row {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
    }
    .poi-big-icon {
      font-size: 2rem;
    }
    .poi-title-row h3 {
      font-size: 1.15rem;
      margin: 0;
      color: #0f172a;
    }
    .poi-dist {
      font-size: 0.8rem;
      color: #64748b;
    }
    .poi-description {
      font-size: 0.82rem;
      color: #475569;
      line-height: 1.45;
      margin-bottom: 10px;
    }
    .poi-fact-box {
      display: flex;
      gap: 8px;
      background: #f8fafc;
      border-left: 3px solid var(--color-primary);
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.76rem;
      color: #334155;
      margin-bottom: 12px;
    }
    .poi-rewards-row {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .reward-pill {
      font-size: 0.76rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
    }
    .reward-pill.xp {
      background: #e0e7ff;
      color: #4338ca;
    }
    .reward-pill.badge {
      background: #fef3c7;
      color: #92400e;
    }
    .btn-start-quest {
      width: 100%;
      padding: 12px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(92, 71, 255, 0.4);
      transition: all 0.2s;
    }
    .btn-start-quest:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.5);
    }
    .active-mission-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }
    .btn-complete-quest {
      width: 100%;
      padding: 12px;
      border-radius: var(--radius-md);
      background: #10b981;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-complete-quest.glowing {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.5);
      animation: pulse 1s infinite alternate;
    }
    .btn-complete-quest.disabled {
      background: #cbd5e1;
      color: #475569;
      cursor: pointer;
    }
    .btn-abandon-quest {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
      padding: 4px;
    }

    /* Active Mission Mini HUD Bar */
    .active-mission-hud-bar {
      position: absolute;
      bottom: 58px;
      right: 16px;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(14px);
      border: 1.5px solid #10b981;
      border-radius: var(--radius-pill);
      padding: 8px 16px 8px 12px;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 42;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      cursor: pointer;
    }
    .tracker-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tracker-icon {
      font-size: 1.5rem;
    }
    .tracker-title {
      font-size: 0.82rem;
      color: #ffffff;
      display: block;
    }
    .tracker-dist {
      font-size: 0.74rem;
      color: #38bdf8;
    }
    .tracker-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-action-complete {
      padding: 6px 12px;
      border-radius: var(--radius-pill);
      font-size: 0.76rem;
      font-weight: 800;
      border: none;
      cursor: pointer;
    }
    .btn-action-complete.glowing {
      background: #10b981;
      color: #ffffff;
      animation: pulse 1s infinite alternate;
    }
    .btn-action-complete.outline {
      background: transparent;
      border: 1px solid #38bdf8;
      color: #38bdf8;
    }
    .btn-action-abandon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      font-size: 0.75rem;
      cursor: pointer;
    }

    /* Conflict Modal */
    .conflict-backdrop, .celebration-backdrop {
      position: fixed;
      inset: 0;
      z-index: 250;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .conflict-modal {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 440px;
      width: 100%;
      padding: 24px;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
    }
    .conflict-icon {
      font-size: 2.5rem;
      margin-bottom: 8px;
    }
    .conflict-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 18px;
    }
    .btn-conflict-replace {
      padding: 12px;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      color: #ffffff;
      font-weight: 800;
      border: none;
      cursor: pointer;
    }
    .btn-conflict-keep {
      padding: 10px;
      border-radius: var(--radius-md);
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }

    /* Celebration Card */
    .celebration-card {
      background: #ffffff;
      border-radius: var(--radius-2xl);
      max-width: 460px;
      width: 100%;
      padding: 28px 24px;
      text-align: center;
      position: relative;
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
    }
    .confetti-cannon {
      font-size: 2rem;
      margin-bottom: 4px;
      animation: bounce 1s infinite;
    }
    .trophy-badge {
      font-size: 3rem;
      margin-bottom: 6px;
    }
    .celebration-card h2 {
      font-size: 1.6rem;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .celebration-subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 18px;
    }
    .reward-highlight-box {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
      text-align: left;
    }
    .xp-bubble {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      text-align: center;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35);
    }
    .xp-number {
      font-size: 1.6rem;
      font-weight: 900;
      display: block;
      line-height: 1;
    }
    .xp-unit {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .progress-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.84rem;
      color: #334155;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
    }
    .rank-highlight {
      color: var(--color-primary);
    }
    .badge-unlocked {
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 4px;
      color: #92400e;
      font-size: 0.78rem;
    }
    .celebration-speech {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f1f5f9;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      margin-bottom: 18px;
      text-align: left;
    }
    .mascot-thumb {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .speech-bubble {
      font-size: 0.8rem;
      color: #334155;
      line-height: 1.35;
    }
    .btn-continue-exploring {
      width: 100%;
      padding: 14px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(92, 71, 255, 0.35);
      transition: all 0.2s;
    }
    .btn-continue-exploring:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.45);
    }

    /* Footer Status */
    .map-footer-status {
      height: 50px;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 50;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-icon {
      font-size: 1.2rem;
    }
    .status-indicator strong {
      display: block;
      font-size: 0.82rem;
      color: #f8fafc;
    }
    .status-indicator small {
      font-size: 0.72rem;
      color: #94a3b8;
    }
    .quick-nav-actions {
      display: flex;
      gap: 6px;
    }
    .btn-action-nav {
      padding: 6px 12px;
      border-radius: var(--radius-pill);
      font-size: 0.78rem;
      font-weight: 700;
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-action-nav:hover {
      background: #334155;
      color: #ffffff;
    }

    /* Keyframes */
    @keyframes radarPulse {
      0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
    }
    @keyframes pulseRing {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
      50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
    }
    @keyframes dashMove {
      to { stroke-dashoffset: -20; }
    }
    @keyframes bounceMarker {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.03); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    @media (max-width: 768px) {
      .walk-simulator-dock {
        bottom: 56px;
        left: 8px;
        right: 8px;
        border-radius: var(--radius-md);
        justify-content: center;
        flex-wrap: wrap;
      }
      .poi-card-floating {
        bottom: 110px;
        right: 8px;
        left: 8px;
        width: auto;
      }
      .active-mission-hud-bar {
        bottom: 110px;
        left: 8px;
        right: 8px;
      }
    }
  `]
})
export class MapInteractiveComponent {
  sessionService = inject(SessionService);
  mapService = inject(MapService);

  focusActiveMission(poiId: number): void {
    const poi = this.mapService.pointsOfInterest().find(p => p.id === poiId);
    if (poi) {
      this.mapService.selectPoi(poi);
    }
  }
}
