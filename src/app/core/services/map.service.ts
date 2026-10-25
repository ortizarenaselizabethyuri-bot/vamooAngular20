import { Injectable, signal, computed, inject } from '@angular/core';
import { MapCoordinates, MapPoi, ActiveMission, RewardCelebrationData } from '../models/map.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private sessionService = inject(SessionService);

  // Avatar position (percentage within map canvas)
  readonly avatarPos = signal<MapCoordinates>({ x: 48, y: 56 });

  // Map Navigation & Camera state
  readonly zoomLevel = signal<number>(1);
  readonly panOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  // GPS Signal Status (Diagrama 4: Carga y navegación del mapa)
  readonly isGpsLost = signal<boolean>(false);
  readonly isGpsTrackingActive = signal<boolean>(true);

  // Points of Interest Catalog (Verified Landmarks)
  readonly pointsOfInterest = signal<MapPoi[]>([
    {
      id: 1,
      name: 'Bosque de los Susurros',
      category: 'Parque',
      icon: '🌲',
      coords: { x: 28, y: 32 },
      description: 'Arboleda centenaria con senderos de piedra y fauna urbana protegida.',
      historicalFact: 'Fue el primer parque ecológico fundado en la ciudad en el siglo XIX.',
      distanceMeters: 180,
      walkingMinutes: 2,
      xpReward: 40,
      verified: true
    },
    {
      id: 2,
      name: 'Fuente Ancestral',
      category: 'Monumento',
      icon: '⛲',
      coords: { x: 64, y: 28 },
      description: 'Monumento emblemático donde brota agua mineral natural.',
      historicalFact: 'Punto de encuentro de las antiguas expediciones y gremios de artesanos.',
      distanceMeters: 280,
      walkingMinutes: 4,
      xpReward: 50,
      badgeUnlock: 'Guardián de la Fuente',
      verified: true
    },
    {
      id: 3,
      name: 'Jardín Floral Encantado',
      category: 'Cultura',
      icon: '🌸',
      coords: { x: 76, y: 46 },
      description: 'Invernadero botánico con especies endémicas y aroma primaveral continuo.',
      historicalFact: 'Alberga más de 120 variedades de orquídeas descubiertas por naturalistas.',
      distanceMeters: 390,
      walkingMinutes: 5,
      xpReward: 45,
      verified: true
    },
    {
      id: 4,
      name: 'Pabellón de Cristal',
      category: 'Cultura',
      icon: '💎',
      coords: { x: 34, y: 72 },
      description: 'Estructura geométrica de acero y cristal que refleja la luz del atardecer.',
      historicalFact: 'Diseñada por arquitectos modernistas para albergar exposiciones universales.',
      distanceMeters: 210,
      walkingMinutes: 3,
      xpReward: 60,
      badgeUnlock: 'Brillo Urbano',
      verified: true
    },
    {
      id: 5,
      name: 'Monolito del Bicentenario',
      category: 'Monumento',
      icon: '🏛️',
      coords: { x: 56, y: 68 },
      description: 'Torre de granito que conmemora la independencia cívica de la región.',
      historicalFact: 'Contiene una cápsula del tiempo sellada que se abrirá en el tricentenario.',
      distanceMeters: 120,
      walkingMinutes: 1,
      xpReward: 35,
      verified: true
    }
  ]);

  // Selected POI for information card flyout ("Consultar punto" UML)
  readonly selectedPoi = signal<MapPoi | null>(null);

  // Active Mission State (Diagrama 5: Seleccionar, iniciar y completar misión)
  readonly activeMission = signal<ActiveMission | null>(null);

  // Completed Missions Memory (Assign rewards only once per POI)
  readonly completedMissionIds = signal<number[]>([]);

  // Pedestrian Route Path Visibility
  readonly isRouteVisible = computed(() => {
    return this.activeMission() !== null || this.selectedPoi() !== null;
  });

  // Target Destination Coords for Route Rendering
  readonly currentDestinationCoords = computed<MapCoordinates | null>(() => {
    const mission = this.activeMission();
    if (mission) return mission.targetCoords;
    const poi = this.selectedPoi();
    if (poi) return poi.coords;
    return null;
  });

  // Current Live Distance to Destination
  readonly liveDistanceToTarget = computed<number>(() => {
    const dest = this.currentDestinationCoords();
    if (!dest) return 0;
    const dx = dest.x - this.avatarPos().x;
    const dy = dest.y - this.avatarPos().y;
    // Scale factor to convert percentage delta to approximate urban meters
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 6.5);
    return Math.max(8, dist);
  });

  // Proximity Check: <= 35m zone arrival
  readonly isWithinArrivalZone = computed<boolean>(() => {
    if (!this.activeMission()) return false;
    return this.liveDistanceToTarget() <= 35;
  });

  // Reward Celebration Modal State
  readonly rewardModalData = signal<RewardCelebrationData | null>(null);
  readonly showRewardModal = signal<boolean>(false);

  // Status Alerts
  readonly mapFeedbackMessage = signal<{ text: string; type: 'info' | 'warn' | 'success' | 'error' } | null>(null);

  // Active Mission Conflict Alert
  readonly missionConflictAlert = signal<{ requestedPoi: MapPoi; activeMissionName: string } | null>(null);

  /**
   * SELECCIONAR PUNTO ("Consultar punto" UML)
   */
  selectPoi(poi: MapPoi): void {
    if (this.isGpsLost()) {
      this.showFeedback('Señal GPS suspendida. Restablece la señal para consultar puntos.', 'warn');
      return;
    }
    this.selectedPoi.set(poi);
    this.showFeedback(`Punto seleccionado: ${poi.name}. Ruta peatonal calculada.`, 'info');
  }

  clearSelectedPoi(): void {
    this.selectedPoi.set(null);
  }

  /**
   * INICIAR MISIÓN (Diagrama 5)
   */
  startMission(poi: MapPoi): boolean {
    // 1. Validar GPS
    if (this.isGpsLost()) {
      this.showFeedback('No se puede iniciar misión: señal GPS no disponible.', 'error');
      return false;
    }

    // 2. Consultar misión activa en servidor: ¿Ya tiene una misión activa?
    const currentActive = this.activeMission();
    if (currentActive && currentActive.poiId !== poi.id) {
      // Conflicto: Ya tiene una misión activa -> avisar al usuario
      this.missionConflictAlert.set({
        requestedPoi: poi,
        activeMissionName: currentActive.poiName
      });
      return false;
    }

    // 3. Registrar misión activa
    const newMission: ActiveMission = {
      poiId: poi.id,
      poiName: poi.name,
      icon: poi.icon,
      category: poi.category,
      xpReward: poi.xpReward,
      startedAt: new Date(),
      targetCoords: poi.coords,
      currentDistanceMeters: poi.distanceMeters,
      isWithinArrivalZone: false,
      status: 'in_progress'
    };

    this.activeMission.set(newMission);
    this.selectedPoi.set(poi);
    this.missionConflictAlert.set(null);
    this.showFeedback(`¡Misión iniciada: ${poi.name}! Camina hacia el objetivo.`, 'success');
    return true;
  }

  /**
   * Forzar cambio de misión cancelando la anterior
   */
  confirmReplaceMission(): void {
    const conflict = this.missionConflictAlert();
    if (conflict) {
      this.activeMission.set(null);
      this.startMission(conflict.requestedPoi);
    }
  }

  cancelConflictAlert(): void {
    this.missionConflictAlert.set(null);
  }

  /**
   * ABANDONAR MISIÓN
   */
  abandonActiveMission(): void {
    const mission = this.activeMission();
    if (mission) {
      this.activeMission.set(null);
      this.showFeedback(`Misión '${mission.poiName}' cancelada. El mapa vuelve al modo libre.`, 'info');
    }
  }

  /**
   * COMPLETAR MISIÓN (Diagrama 5: ¿Presiona Completar?)
   */
  completeActiveMission(): boolean {
    const mission = this.activeMission();
    if (!mission) return false;

    // 1. Validar señal GPS
    if (this.isGpsLost()) {
      this.showFeedback('Error de validación: Señal GPS perdida.', 'error');
      return false;
    }

    // 2. ¿Está dentro de zona de llegada? (Validación de proximidad en servidor)
    const withinZone = this.isWithinArrivalZone();
    if (!withinZone) {
      // "Mostrar aviso sin dar puntos" (Diagrama 5)
      this.showFeedback(
        `Aún estás a ${this.liveDistanceToTarget()}m del objetivo. Debes acercarte a menos de 35m para validar tu llegada.`,
        'warn'
      );
      return false;
    }

    // 3. Validar si ya fue completada antes (asignar puntos una sola vez)
    const isAlreadyCompleted = this.completedMissionIds().includes(mission.poiId);
    const xpToAdd = isAlreadyCompleted ? Math.round(mission.xpReward * 0.25) : mission.xpReward;

    // 4. Marcar misión completada
    if (!isAlreadyCompleted) {
      this.completedMissionIds.update(ids => [...ids, mission.poiId]);
    }

    // 5. Asignar puntos en la sesión del usuario
    const currentSession = this.sessionService.session();
    const newTotalXp = currentSession.xp + xpToAdd;
    let newRank = currentSession.rank;

    if (newTotalXp >= 200 && currentSession.rank === 'Pingüino') {
      newRank = 'Flamenco';
    }

    this.sessionService.session.update(s => ({
      ...s,
      xp: newTotalXp,
      rank: newRank
    }));

    // 6. Mostrar animación de recompensa (Diagrama 5)
    const celebration: RewardCelebrationData = {
      poiName: mission.poiName,
      xpEarned: xpToAdd,
      badgeName: isAlreadyCompleted ? undefined : 'Explorador Urbano Verificado',
      totalXpNow: newTotalXp,
      rankName: newRank
    };

    this.rewardModalData.set(celebration);
    this.showRewardModal.set(true);

    // 7. Liberar espacio de misión activa
    this.activeMission.set(null);
    this.selectedPoi.set(null);
    this.showFeedback(`¡Misión completada con éxito! +${xpToAdd} XP sumados a tu cuenta.`, 'success');
    return true;
  }

  closeRewardModal(): void {
    this.showRewardModal.set(false);
    this.rewardModalData.set(null);
  }

  /**
   * SIMULADOR: Caminar hacia el punto (Entrar a zona de llegada <= 35m)
   */
  simulateWalkCloser(): void {
    const dest = this.currentDestinationCoords();
    if (!dest) {
      // Si no hay destino, mueve el avatar cerca del primer POI
      const poi1 = this.pointsOfInterest()[0];
      this.selectPoi(poi1);
      this.avatarPos.set({ x: poi1.coords.x + 2, y: poi1.coords.y + 2 });
      this.showFeedback('Avatar posicionado a 15 metros del objetivo (Dentro de zona de llegada).', 'success');
      return;
    }

    // Mueve el avatar a escasos puntos porcentuales del objetivo
    this.avatarPos.set({
      x: Number((dest.x + 1.8).toFixed(1)),
      y: Number((dest.y + 1.8).toFixed(1))
    });

    this.showFeedback(
      `¡Has llegado a la zona! Distancia: ${this.liveDistanceToTarget()}m (Dentro del radio de 35m).`,
      'success'
    );
  }

  /**
   * SIMULADOR: Alejarse del objetivo (> 35m)
   */
  simulateWalkAway(): void {
    const dest = this.currentDestinationCoords();
    if (dest) {
      this.avatarPos.set({
        x: Number((dest.x - 16).toFixed(1)),
        y: Number((dest.y + 16).toFixed(1))
      });
      this.showFeedback(`Avatar alejado a ${this.liveDistanceToTarget()}m del objetivo.`, 'info');
    } else {
      this.avatarPos.set({ x: 48, y: 56 });
    }
  }

  /**
   * GESTIONAR PÉRDIDA Y RECUPERACIÓN DE GPS (Diagrama 4)
   */
  toggleGpsLost(isLost?: boolean): void {
    const newState = isLost !== undefined ? isLost : !this.isGpsLost();
    this.isGpsLost.set(newState);

    if (newState) {
      // Pausar acciones dependientes de ubicación
      this.showFeedback('⚠️ Señal GPS perdida. Acciones de proximidad pausadas.', 'warn');
    } else {
      // GPS recuperado
      this.showFeedback('✅ Señal GPS recuperada. Radar y posicionamiento restablecidos.', 'success');
    }
  }

  retryGpsSignal(): void {
    this.toggleGpsLost(false);
  }

  /**
   * CÁMARA Y RECENTRADO (Diagrama 4: "Recentrar" -> "Centrar en avatar")
   */
  recenterMap(): void {
    this.panOffset.set({ x: 0, y: 0 });
    this.zoomLevel.set(1);
    this.showFeedback('Cámara recentrada en la posición del avatar.', 'info');
  }

  zoomIn(): void {
    const current = this.zoomLevel();
    if (current < 1.8) {
      this.zoomLevel.set(Number((current + 0.2).toFixed(1)));
    }
  }

  zoomOut(): void {
    const current = this.zoomLevel();
    if (current > 0.8) {
      this.zoomLevel.set(Number((current - 0.2).toFixed(1)));
    }
  }

  resetZoom(): void {
    this.zoomLevel.set(1);
  }

  private showFeedback(text: string, type: 'info' | 'warn' | 'success' | 'error'): void {
    this.mapFeedbackMessage.set({ text, type });
    setTimeout(() => {
      if (this.mapFeedbackMessage()?.text === text) {
        this.mapFeedbackMessage.set(null);
      }
    }, 4500);
  }
}
