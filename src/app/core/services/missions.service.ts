import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  MissionItem, 
  MissionCategory, 
  MissionStatus, 
  MissionHistoryEntry, 
  MissionConflictModalData, 
  MissionAbandonModalData, 
  MissionSecurityModalData 
} from '../models/mission.model';
import { SessionService } from './session.service';
import { MapService } from './map.service';
import { AchievementsService } from './achievements.service';

@Injectable({
  providedIn: 'root'
})
export class MissionsService {
  private sessionService = inject(SessionService);
  private mapService = inject(MapService);
  private achievementsService = inject(AchievementsService);

  // Active Category Filter: 'all' | 'descubrimiento' | 'exploracion' | 'reto'
  readonly activeCategoryFilter = signal<'all' | MissionCategory>('all');

  // Status Filter: 'all' | 'available' | 'completed'
  readonly activeStatusFilter = signal<'all' | 'available' | 'completed'>('all');

  // Selected Mission for Full Detail Modal / Briefing
  readonly selectedMissionDetail = signal<MissionItem | null>(null);

  // Conflict Modal Data (Diagrama Página 11: ¿Ya tiene una misión activa?)
  readonly conflictModalData = signal<MissionConflictModalData | null>(null);

  // Abandon Confirmation Modal (Diagrama Página 12: Abandono manual sin XP)
  readonly abandonModalData = signal<MissionAbandonModalData | null>(null);

  // Security Notice Modal (Conflicto C: Lugares seguros y horarios protegidos)
  readonly securityModalData = signal<MissionSecurityModalData | null>(null);

  // Celebration Modal for Completed Mission
  readonly completedMissionCelebration = signal<{ mission: MissionItem; xpEarned: number; isFirstTime: boolean } | null>(null);

  // Reconnection Grace Period Timer (Conflicto A: Margen técnico de reconexión tras cierre)
  readonly reconnectionSecondsLeft = signal<number | null>(null);
  private reconnectionIntervalId: any = null;

  // Feedback Notification Toast
  readonly toastMessage = signal<{ text: string; type: 'info' | 'success' | 'warn' | 'error' } | null>(null);

  // Catalog of Missions (Catálogo estructurado según Especificación y POIs del Mapa)
  readonly missions = signal<MissionItem[]>([
    {
      id: 'mis_01',
      title: 'El Misterio de la Fuente Ancestral',
      category: 'descubrimiento',
      categoryLabel: 'Descubrimiento Patrimonial',
      categoryIcon: '🧭',
      description: 'Acércate a la pileta colonial tallada en piedra volcánica y descifra el grabado que simboliza el origen hídrico de la ciudad.',
      loreStory: 'Construida en 1892, esta fuente abasteció a los primeros exploradores y arrieros del valle. Cuenta la leyenda que quienes beben de su vertiente siempre regresan a estas tierras.',
      targetPoiId: 2,
      targetPoiName: 'Fuente Ancestral',
      targetCoords: { x: 38, y: 32 },
      difficulty: 'Fácil',
      estimatedMinutes: 6,
      distanceMeters: 65,
      xpReward: 50,
      repeatXpReward: 20, // Conflicto B
      badgeRewardId: 'b_desc_01',
      badgeRewardName: 'Insignia: Primer Paso Urbano',
      securityStatus: 'safe',
      operationalSchedule: 'Acceso peatonal libre las 24 horas',
      isAvailable: true,
      status: 'available',
      timesCompleted: 0
    },
    {
      id: 'mis_02',
      title: 'Guardián de la Catedral Central',
      category: 'exploracion',
      categoryLabel: 'Exploración Urbana',
      categoryIcon: '🚶',
      description: 'Camina por el atrio de la Catedral y valida tu presencia frente a sus imponentes arcos neoclásicos con confirmación GPS.',
      loreStory: 'La construcción tardó más de 45 años. Su campanario de bronce resonó en cada hecho histórico decisivo de nuestra república.',
      targetPoiId: 1,
      targetPoiName: 'Catedral Central',
      targetCoords: { x: 25, y: 45 },
      difficulty: 'Media',
      estimatedMinutes: 12,
      distanceMeters: 140,
      xpReward: 80,
      repeatXpReward: 25, // Conflicto B
      badgeRewardId: 'b_desc_03',
      badgeRewardName: 'Insignia: Cazador de Monumentos',
      couponRewardName: 'Cupón Café 2x1',
      securityStatus: 'schedule_restricted', // Conflicto C
      securityNotice: 'Zona con guardia diurna. Abierto de 07:00 a 19:00 para garantizar una caminata segura.',
      operationalSchedule: '07:00 a 19:00 (Protección ciudadana)',
      isAvailable: true,
      status: 'available',
      timesCompleted: 0
    },
    {
      id: 'mis_03',
      title: 'El Secreto del Monolito Bicentenario',
      category: 'descubrimiento',
      categoryLabel: 'Descubrimiento Patrimonial',
      categoryIcon: '🧭',
      description: 'Encuentra la placa conmemorativa oculta en la base del monolito y registra tu llegada en el radio de 35 metros.',
      loreStory: 'Erigido para celebrar dos siglos de vida cívica. Dentro de su estructura de granito descansa una cápsula del tiempo hermética que será develada en el tricentenario.',
      targetPoiId: 3,
      targetPoiName: 'Monolito del Bicentenario',
      targetCoords: { x: 56, y: 68 },
      difficulty: 'Fácil',
      estimatedMinutes: 8,
      distanceMeters: 120,
      xpReward: 45,
      repeatXpReward: 15,
      badgeRewardId: 'b_mis_03',
      badgeRewardName: 'Insignia: Precisión Impecable',
      securityStatus: 'safe',
      operationalSchedule: 'Iluminación nocturna reforzada (24h)',
      isAvailable: true,
      status: 'available',
      timesCompleted: 0
    },
    {
      id: 'mis_04',
      title: 'Reto del Caminante Veloz',
      category: 'reto',
      categoryLabel: 'Reto Peatonal de Velocidad',
      categoryIcon: '⚡',
      description: 'Desplázate a buen paso desde tu posición actual hasta el cruce de las alamedas antes de que expire el tiempo de reto.',
      loreStory: 'Un reto para estimular el ejercicio aeróbico diario. Se premia la constancia del paso sin utilizar vehículos motorizados.',
      targetPoiId: 2,
      targetPoiName: 'Fuente Ancestral',
      targetCoords: { x: 38, y: 32 },
      difficulty: 'Avanzada',
      estimatedMinutes: 10,
      distanceMeters: 180,
      xpReward: 100,
      repeatXpReward: 35,
      badgeRewardId: 'b_mis_02',
      badgeRewardName: 'Insignia: Caminante Constante',
      securityStatus: 'safe',
      operationalSchedule: 'Válido durante todo el día',
      isAvailable: true,
      status: 'available',
      timesCompleted: 0
    },
    {
      id: 'mis_05',
      title: 'La Pérgola Iluminada de los Poetas',
      category: 'exploracion',
      categoryLabel: 'Exploración Urbana',
      categoryIcon: '🚶',
      description: 'Recorre los jardines florales hasta el centro de la glorieta donde se leían versos en el siglo XX.',
      loreStory: 'Espacio de tertulias donde poetas locales inmortalizaron las plazas y balcones de la urbe.',
      targetPoiId: 3,
      targetPoiName: 'Monolito del Bicentenario',
      targetCoords: { x: 56, y: 68 },
      difficulty: 'Media',
      estimatedMinutes: 15,
      distanceMeters: 200,
      xpReward: 70,
      repeatXpReward: 25,
      couponRewardName: 'Cupón 25% Heladería Vamoo',
      securityStatus: 'safe',
      operationalSchedule: '06:00 a 22:00',
      isAvailable: true,
      status: 'available',
      timesCompleted: 0
    },
    {
      id: 'mis_06',
      title: 'Mirador del Bastión Histórico',
      category: 'reto',
      categoryLabel: 'Reto Peatonal',
      categoryIcon: '⚡',
      description: 'Sube por la pendiente peatonal hacia el antiguo bastión defensivo de la colina norte.',
      loreStory: 'Antigua atalaya de vigilancia con una vista panorámica de 360 grados de todo el centro urbano.',
      targetPoiId: 1,
      targetPoiName: 'Catedral Central',
      targetCoords: { x: 25, y: 45 },
      difficulty: 'Avanzada',
      estimatedMinutes: 20,
      distanceMeters: 280,
      xpReward: 120,
      repeatXpReward: 40,
      securityStatus: 'maintenance', // Conflicto C: Zona en mantenimiento / inaccesible temporalmente
      securityNotice: 'Zona en obras de conservación de senderos peatonales. El acceso está temporalmente suspendido por seguridad del explorador.',
      operationalSchedule: 'Suspendida por mantenimiento',
      isAvailable: false,
      status: 'available',
      timesCompleted: 0
    }
  ]);

  // Mission Completion History (Página 9 & 13)
  readonly missionHistory = signal<MissionHistoryEntry[]>([
    {
      id: 'hist_01',
      missionId: 'mis_03',
      missionTitle: 'El Secreto del Monolito Bicentenario',
      category: 'descubrimiento',
      categoryIcon: '🧭',
      completedAt: '2026-10-23T16:40:00Z',
      xpEarned: 45,
      isFirstTime: true,
      badgeEarned: 'Insignia: Precisión Impecable',
      validationMethod: 'GPS_VERIFIED_RADIUS',
      arrivalDistanceMeters: 14
    }
  ]);

  // Active Mission Computed Signal (Directly synchronized with MapService active mission)
  readonly activeMission = computed<MissionItem | null>(() => {
    const mapActive = this.mapService.activeMission();
    if (!mapActive) return null;
    return this.missions().find(m => m.id === `mis_0${mapActive.poiId}` || m.targetPoiId === mapActive.poiId) || null;
  });

  // Filtered Missions Computed
  readonly filteredMissions = computed(() => {
    const cat = this.activeCategoryFilter();
    const status = this.activeStatusFilter();
    const active = this.activeMission();

    return this.missions().filter(m => {
      // Category filter
      if (cat !== 'all' && m.category !== cat) return false;

      // Status filter
      if (status === 'available') {
        return m.status !== 'completed' || m.timesCompleted > 0;
      }
      if (status === 'completed') {
        return m.timesCompleted > 0;
      }

      return true;
    });
  });

  // Missions Stats Computed
  readonly missionStats = computed(() => {
    const list = this.missions();
    const total = list.length;
    const completedCount = list.filter(m => m.timesCompleted > 0).length;
    const totalXpEarned = this.missionHistory().reduce((acc, h) => acc + h.xpEarned, 0);

    return {
      total,
      completedCount,
      activeMission: this.activeMission(),
      totalXpEarned
    };
  });

  // Proximity to target computed via MapService
  readonly distanceToTarget = computed(() => this.mapService.liveDistanceToTarget());
  readonly isWithinArrivalZone = computed(() => this.mapService.isWithinArrivalZone());
  readonly isGpsLost = computed(() => this.mapService.isGpsLost());

  /**
   * Filtrar por categoría: 'all' | 'descubrimiento' | 'exploracion' | 'reto'
   */
  setCategoryFilter(category: 'all' | MissionCategory): void {
    this.activeCategoryFilter.set(category);
  }

  /**
   * Filtrar por estado: 'all' | 'available' | 'completed'
   */
  setStatusFilter(status: 'all' | 'available' | 'completed'): void {
    this.activeStatusFilter.set(status);
  }

  /**
   * Abrir detalle completo de la misión
   */
  openMissionDetail(mission: MissionItem): void {
    this.selectedMissionDetail.set(mission);
  }

  closeMissionDetail(): void {
    this.selectedMissionDetail.set(null);
  }

  /**
   * SOLICITAR INICIO DE MISIÓN (Diagrama Página 10 y 11)
   */
  requestStartMission(mission: MissionItem): boolean {
    // 1. Validar sesión
    if (!this.sessionService.isAuthenticated()) {
      this.sessionService.simulateLogin();
      this.showToast('Sesión de explorador iniciada automáticamente.', 'info');
    }

    // 2. Validar GPS
    if (this.isGpsLost() || this.sessionService.session().locationPermission !== 'granted') {
      this.sessionService.grantLocation();
      if (this.mapService.isGpsLost()) {
        this.mapService.toggleGpsLost();
      }
    }

    // 3. Verificar disponibilidad y seguridad (Conflicto C)
    if (!mission.isAvailable || mission.securityStatus === 'maintenance') {
      this.securityModalData.set({
        mission,
        reason: mission.securityNotice || 'Acceso restringido temporalmente por resguardo peatonal.',
        scheduleAllowed: mission.operationalSchedule
      });
      return false;
    }

    // 4. Consultar si ya tiene una misión activa (Diagrama Página 11)
    const currentActive = this.activeMission();
    if (currentActive && currentActive.id !== mission.id) {
      // Abrir modal de conflicto: "¿Confirma abandono de la misión anterior sin XP?"
      this.conflictModalData.set({
        newMission: mission,
        currentActiveMissionName: currentActive.title
      });
      return false;
    }

    // 5. Iniciar la misión directamente
    this.executeStartMission(mission);
    return true;
  }

  /**
   * Ejecución final de inicio de misión y enlace con mapa
   */
  private executeStartMission(mission: MissionItem): void {
    const poi = this.mapService.pointsOfInterest().find(p => p.id === mission.targetPoiId) || this.mapService.pointsOfInterest()[0];

    // Actualizar estado en mapa
    this.mapService.startMission(poi);

    // Actualizar estado de las misiones
    this.missions.update(list =>
      list.map(m => m.id === mission.id ? { ...m, status: 'active' } : (m.status === 'active' ? { ...m, status: 'available' } : m))
    );

    this.selectedMissionDetail.set(null);
    this.showToast(`🎯 ¡Misión iniciada: "${mission.title}"! Acércate al objetivo en el mapa.`, 'success');
  }

  /**
   * CONFIRMAR ABANDONO Y COMENZAR NUEVA MISIÓN (Diagrama Página 11: Cancelar anterior sin XP)
   */
  confirmAbandonAndStartNew(): void {
    const data = this.conflictModalData();
    if (!data) return;

    // Descartar progreso anterior sin XP
    this.cancelActiveMissionWithoutXp();

    // Iniciar nueva
    this.executeStartMission(data.newMission);
    this.conflictModalData.set(null);
  }

  cancelConflictModal(): void {
    this.conflictModalData.set(null);
  }

  /**
   * SOLICITAR ABANDONO MANUAL (Diagrama Página 12: Abandono manual)
   */
  requestAbandonActiveMission(): void {
    const active = this.activeMission();
    if (active) {
      this.abandonModalData.set({ mission: active });
    }
  }

  confirmAbandonMission(): void {
    const data = this.abandonModalData();
    if (!data) return;

    this.cancelActiveMissionWithoutXp();
    this.abandonModalData.set(null);
    this.showToast('Misión cancelada manualmente. No se otorgó XP y el progreso fue descartado.', 'warn');
  }

  cancelAbandonModal(): void {
    this.abandonModalData.set(null);
  }

  closeSecurityModal(): void {
    this.securityModalData.set(null);
  }

  /**
   * CANCELAR MISIÓN SIN XP (Diagramas 11 y 12)
   */
  private cancelActiveMissionWithoutXp(): void {
    this.mapService.abandonActiveMission();
    this.missions.update(list =>
      list.map(m => m.status === 'active' ? { ...m, status: 'available' } : m)
    );
  }

  /**
   * COMPLETAR MISIÓN ACTIVA (Diagrama Página 11 y Módulo 04 XP)
   */
  completeActiveMission(): boolean {
    const active = this.activeMission();
    if (!active) {
      this.showToast('No hay ninguna misión activa en curso.', 'warn');
      return false;
    }

    // 1. Validar proximidad (Radio <= 35 metros)
    if (!this.isWithinArrivalZone()) {
      const dist = this.distanceToTarget();
      this.showToast(`Estás a ${dist}m del objetivo. Debes acercarte a menos de 35m para validar tu llegada.`, 'warn');
      return false;
    }

    // 2. Calcular XP (Conflicto B: primera vez vs repetición)
    const isFirstTime = active.timesCompleted === 0;
    const xpToAward = isFirstTime ? active.xpReward : active.repeatXpReward;

    // 3. Registrar en historial
    const historyEntry: MissionHistoryEntry = {
      id: `hist_${Date.now()}`,
      missionId: active.id,
      missionTitle: active.title,
      category: active.category,
      categoryIcon: active.categoryIcon,
      completedAt: new Date().toISOString(),
      xpEarned: xpToAward,
      isFirstTime,
      badgeEarned: isFirstTime ? active.badgeRewardName : undefined,
      validationMethod: 'GPS_VERIFIED_RADIUS',
      arrivalDistanceMeters: this.distanceToTarget()
    };

    this.missionHistory.update(h => [historyEntry, ...h]);

    // 4. Actualizar estado de la misión
    this.missions.update(list =>
      list.map(m => m.id === active.id ? {
        ...m,
        status: 'completed',
        timesCompleted: m.timesCompleted + 1,
        lastCompletedDate: new Date().toISOString()
      } : m)
    );

    // 5. Otorgar recompensas en Módulo 04 y Sesión
    this.achievementsService.simulateAddWeeklyXp(xpToAward);

    if (active.badgeRewardId) {
      this.achievementsService.unlockBadge(active.badgeRewardId);
    }

    // 6. Notificar y liberar en mapa
    this.mapService.abandonActiveMission();

    // 7. Desplegar celebración
    this.completedMissionCelebration.set({
      mission: active,
      xpEarned: xpToAward,
      isFirstTime
    });

    this.showToast(`🎉 ¡Misión cumplida! +${xpToAward} XP acumulados.`, 'success');
    return true;
  }

  closeCelebrationModal(): void {
    this.completedMissionCelebration.set(null);
  }

  /**
   * SIMULAR MARGEN DE RECONEXIÓN (Conflicto A: Abandono o cierre de la web)
   */
  simulateAppCloseGracePeriod(): void {
    if (!this.activeMission()) {
      this.showToast('Inicia una misión primero para probar el margen técnico de reconexión.', 'info');
      return;
    }

    // Iniciar temporizador de 30 segundos
    if (this.reconnectionIntervalId) {
      clearInterval(this.reconnectionIntervalId);
    }

    this.reconnectionSecondsLeft.set(30);
    this.showToast('🔌 Simulación: Desconexión / Salida del navegador activada.', 'warn');

    this.reconnectionIntervalId = setInterval(() => {
      const left = this.reconnectionSecondsLeft();
      if (left === null || left <= 1) {
        clearInterval(this.reconnectionIntervalId);
        this.reconnectionSecondsLeft.set(null);
        // Si no se restableció en el margen técnico -> cancelar sin XP (Diagrama 12)
        this.cancelActiveMissionWithoutXp();
        this.showToast('⏳ Margen técnico de reconexión expirado. Misión cancelada automáticamente.', 'error');
      } else {
        this.reconnectionSecondsLeft.set(left - 1);
      }
    }, 1000);
  }

  restoreSessionGracePeriod(): void {
    if (this.reconnectionIntervalId) {
      clearInterval(this.reconnectionIntervalId);
      this.reconnectionIntervalId = null;
    }
    this.reconnectionSecondsLeft.set(null);
    this.showToast('🟢 Sesión de juego restablecida dentro del margen técnico. ¡Misión continuada!', 'success');
  }

  private showToast(text: string, type: 'info' | 'success' | 'warn' | 'error'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      if (this.toastMessage()?.text === text) {
        this.toastMessage.set(null);
      }
    }, 4500);
  }
}
