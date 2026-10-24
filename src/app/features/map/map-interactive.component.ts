import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/services/session.service';

interface MapPoi {
  id: number;
  name: string;
  category: string;
  distance: string;
  xpReward: number;
  icon: string;
  description: string;
  verified: boolean;
}

@Component({
  selector: 'app-map-interactive',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-view-wrapper">
      <!-- Top HUD Header -->
      <div class="map-hud">
        <div class="hud-left">
          <div class="user-chip-hud">
            <img [src]="sessionService.session().avatar" alt="Mascota" class="hud-avatar" />
            <div>
              <span class="hud-username">{{ sessionService.session().username }}</span>
              <span class="hud-rank">🎖️ {{ sessionService.session().rank }} ({{ sessionService.session().xp }} XP)</span>
            </div>
          </div>
        </div>

        <div class="hud-center">
          <div class="gps-active-pill">
            <span class="pulse-dot"></span>
            <span>GPS Activo • Ubicación Validada</span>
          </div>
        </div>

        <div class="hud-right">
          <button class="btn-hud" (click)="recenterAvatar()">
            <span>🎯 Recentrar</span>
          </button>
          <button class="btn-hud" (click)="sessionService.navigate('landing')">
            <span>🏠 Portada</span>
          </button>
        </div>
      </div>

      <!-- Main Interactive Map Canvas / Display -->
      <div class="map-canvas-container">
        <!-- Background Map Image -->
        <img src="/assets/hero_city.jpg" alt="Mapa de Exploración Vamoo" class="map-bg-image" />

        <!-- Radar Pulse Center (Avatar Location) -->
        <div class="avatar-marker" [style.top.%]="avatarPos().y" [style.left.%]="avatarPos().x">
          <div class="radar-wave"></div>
          <div class="avatar-pin">
            <img src="/assets/mascot.jpg" alt="Avatar Pin" class="avatar-pin-img" />
          </div>
          <span class="marker-label">Tú estás aquí</span>
        </div>

        <!-- Interactive Verified POIs -->
        @for (poi of pointsOfInterest(); track poi.id) {
          <div
            class="poi-marker"
            [class.selected]="selectedPoi()?.id === poi.id"
            [style.top.%]="poiPositions[poi.id].y"
            [style.left.%]="poiPositions[poi.id].x"
            (click)="selectPoi(poi)"
          >
            <div class="poi-icon-wrap">
              <span>{{ poi.icon }}</span>
            </div>
            <div class="poi-tag">
              <span>{{ poi.name }}</span>
            </div>
          </div>
        }

        <!-- POI Detail Card Flyout -->
        @if (selectedPoi(); as poi) {
          <div class="poi-card-floating">
            <div class="poi-card-header">
              <div class="poi-header-left">
                <span class="poi-cat-badge">{{ poi.category }}</span>
                <span class="verified-tag">✓ Verificado</span>
              </div>
              <button class="btn-close-poi" (click)="selectedPoi.set(null)">✕</button>
            </div>

            <div class="poi-card-body">
              <div class="poi-title-row">
                <span class="poi-big-icon">{{ poi.icon }}</span>
                <div>
                  <h3>{{ poi.name }}</h3>
                  <span class="poi-dist">🚶 A {{ poi.distance }} de tu posición actual</span>
                </div>
              </div>

              <p class="poi-description">{{ poi.description }}</p>

              <div class="poi-rewards-row">
                <span class="reward-xp">⚡ +{{ poi.xpReward }} XP</span>
                <span class="reward-status">Proximidad GPS detectada</span>
              </div>
            </div>

            <div class="poi-card-footer">
              <button class="btn-start-quest" (click)="startQuest(poi)">
                Iniciar Misión de Descubrimiento 🚀
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Flowchart Status Card -->
      <div class="map-footer-status">
        <div class="status-indicator">
          <span class="status-icon">✅</span>
          <div>
            <strong>Estado del Diagrama 1: Inicio Disponible</strong>
            <small>Ubicación concedida • Mapa 2D cargado • Navegación adaptable activa</small>
          </div>
        </div>

        <div class="quick-nav-actions">
          <button class="btn-action-nav" (click)="sessionService.navigate('missions')">
            🎯 Ver Misiones
          </button>
          <button class="btn-action-nav" (click)="sessionService.navigate('routes')">
            🚶 Recorridos
          </button>
          <button class="btn-action-nav" (click)="sessionService.navigate('achievements')">
            🏆 Logros
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-view-wrapper {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 110px);
      min-height: 600px;
      position: relative;
      background: #0f172a;
      overflow: hidden;
    }

    .map-hud {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      z-index: 50;
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
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      padding: 6px 14px 6px 6px;
      border-radius: var(--radius-pill);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.8);
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
      font-weight: 600;
    }

    .gps-active-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.9);
      color: #ffffff;
      padding: 6px 16px;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffffff;
      animation: pulseGlow 1.5s infinite;
    }

    .hud-right {
      display: flex;
      gap: 8px;
    }

    .btn-hud {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      padding: 8px 14px;
      border-radius: var(--radius-pill);
      font-size: 0.82rem;
      font-weight: 700;
      color: #1e293b;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }
    .btn-hud:hover {
      background: #ffffff;
      transform: translateY(-2px);
    }

    /* Map Canvas */
    .map-canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .map-bg-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      filter: saturate(1.1) brightness(0.98);
      user-select: none;
    }

    /* Avatar Marker & Radar */
    .avatar-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      z-index: 25;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .radar-wave {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 90px;
      height: 90px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 2px solid rgba(92, 71, 255, 0.7);
      background: rgba(92, 71, 255, 0.15);
      animation: pulseGlow 2s infinite ease-out;
      pointer-events: none;
    }

    .avatar-pin {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      background: #ffffff;
      animation: floatAnimation 2.5s ease-in-out infinite;
    }

    .avatar-pin-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .marker-label {
      margin-top: 6px;
      background: rgba(15, 23, 42, 0.85);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      white-space: nowrap;
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
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .poi-marker:hover, .poi-marker.selected {
      transform: translate(-50%, -50%) scale(1.15);
      z-index: 30;
    }

    .poi-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
    }

    .poi-tag {
      margin-top: 4px;
      background: #ffffff;
      color: #0f172a;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      white-space: nowrap;
    }

    /* Floating POI Card */
    .poi-card-floating {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 60;
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 20px;
      width: 90%;
      max-width: 440px;
      box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.35);
      animation: modalContentPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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
    }

    .poi-cat-badge {
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 10px;
      border-radius: var(--radius-pill);
    }

    .verified-tag {
      font-size: 0.72rem;
      font-weight: 700;
      background: #ecfdf5;
      color: #059669;
      padding: 3px 8px;
      border-radius: var(--radius-pill);
    }

    .btn-close-poi {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      background: #f8fafc;
    }

    .poi-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .poi-big-icon {
      font-size: 2rem;
    }

    .poi-card-body h3 {
      font-size: 1.15rem;
      color: #0f172a;
    }

    .poi-dist {
      font-size: 0.78rem;
      color: #64748b;
    }

    .poi-description {
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 14px;
    }

    .poi-rewards-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      margin-bottom: 16px;
    }

    .reward-xp {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--color-primary);
    }

    .reward-status {
      font-size: 0.74rem;
      color: #10b981;
      font-weight: 600;
    }

    .btn-start-quest {
      width: 100%;
      padding: 12px;
      border-radius: var(--radius-pill);
      font-size: 0.92rem;
      font-weight: 700;
      color: #ffffff;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      box-shadow: 0 4px 14px rgba(92, 71, 255, 0.35);
      transition: all var(--transition-spring);
    }
    .btn-start-quest:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.45);
    }

    /* Map Footer Status Bar */
    .map-footer-status {
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      z-index: 40;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-icon {
      font-size: 1.5rem;
    }

    .status-indicator strong {
      display: block;
      font-size: 0.88rem;
      color: #0f172a;
    }

    .status-indicator small {
      font-size: 0.76rem;
      color: #64748b;
    }

    .quick-nav-actions {
      display: flex;
      gap: 8px;
    }

    .btn-action-nav {
      padding: 8px 14px;
      border-radius: var(--radius-pill);
      font-size: 0.82rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .btn-action-nav:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
  `]
})
export class MapInteractiveComponent {
  sessionService = inject(SessionService);

  avatarPos = signal<{ x: number; y: number }>({ x: 48, y: 56 });
  selectedPoi = signal<MapPoi | null>(null);

  poiPositions: Record<number, { x: number; y: number }> = {
    1: { x: 30, y: 35 },
    2: { x: 58, y: 32 },
    3: { x: 70, y: 38 },
    4: { x: 36, y: 68 }
  };

  pointsOfInterest = signal<MapPoi[]>([
    {
      id: 1,
      name: 'Bosque de los Susurros',
      category: 'Parque Natural',
      distance: '180 m',
      xpReward: 35,
      icon: '🌲',
      description: 'Hermosa arboleda con senderos peatonales históricos y áreas de descanso ecológico.',
      verified: true
    },
    {
      id: 2,
      name: 'Fuente Ancestral',
      category: 'Monumento Cultural',
      distance: '320 m',
      xpReward: 50,
      icon: '⛲',
      description: 'Punto de encuentro clásico de exploradores donde se celebran eventos de la liga semanal.',
      verified: true
    },
    {
      id: 3,
      name: 'Jardín Floral',
      category: 'Jardín Botánico',
      distance: '450 m',
      xpReward: 40,
      icon: '🌸',
      description: 'Colección de flores nativas de la región con códigos QR de exploración botánica.',
      verified: true
    },
    {
      id: 4,
      name: 'Pabellón de Cristal',
      category: 'Arquitectura Urbana',
      distance: '210 m',
      xpReward: 60,
      icon: '💎',
      description: 'Estructura prismática que refleja los colores del atardecer. Ideal para check-in de misiones.',
      verified: true
    }
  ]);

  selectPoi(poi: MapPoi): void {
    this.selectedPoi.set(poi);
  }

  recenterAvatar(): void {
    this.avatarPos.set({ x: 48, y: 56 });
  }

  startQuest(poi: MapPoi): void {
    alert(`¡Misión iniciada en ${poi.name}! Dirígete a la ubicación para registrar tu llegada con GPS.`);
    this.selectedPoi.set(null);
  }
}
