import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  ThematicRoute, 
  RouteStop, 
  RouteTheme, 
  RouteStatus, 
  RouteAbandonModalData, 
  RouteSuspensionModalData 
} from '../models/routes.model';
import { SessionService } from './session.service';
import { MapService } from './map.service';
import { AchievementsService } from './achievements.service';

@Injectable({
  providedIn: 'root'
})
export class RoutesService {
  private sessionService = inject(SessionService);
  private mapService = inject(MapService);
  private achievementsService = inject(AchievementsService);

  // Filter Theme: 'all' | 'patrimonio' | 'parques' | 'historico' | 'cultural'
  readonly activeThemeFilter = signal<'all' | RouteTheme>('all');

  // Active Selected Route for Detail Briefing
  readonly selectedRouteDetail = signal<ThematicRoute | null>(null);

  // Active Route in Progress or Paused (Página 14, 15 y 16)
  readonly activeRoute = signal<ThematicRoute | null>(null);

  // Current Target Stop Index in Active Route
  readonly activeStopIndex = signal<number>(0);

  // Modals Data
  readonly abandonModalData = signal<RouteAbandonModalData | null>(null);
  readonly suspensionModalData = signal<RouteSuspensionModalData | null>(null);
  readonly completedRouteCelebration = signal<{ route: ThematicRoute; xpEarned: number } | null>(null);
  readonly completedStopCelebration = signal<{ stop: RouteStop; nextStop: RouteStop | null } | null>(null);

  // Feedback Notification Toast
  readonly toastMessage = signal<{ text: string; type: 'info' | 'success' | 'warn' | 'error' } | null>(null);

  // Catalog of Thematic Routes (Página 13 & 14)
  readonly routes = signal<ThematicRoute[]>([
    {
      id: 'route_01',
      title: 'Ruta del Patrimonio y la Independencia',
      theme: 'patrimonio',
      themeLabel: 'Patrimonio Cívico',
      difficulty: 'Moderado',
      totalDistanceKm: 1.8,
      estimatedDurationMinutes: 35,
      totalXpReward: 160,
      badgeRewardName: 'Insignia: Sendero Histórico',
      badgeRewardId: 'b_rec_01',
      completedStopsCount: 0,
      lastActiveStopIndex: 0,
      status: 'available',
      stops: [
        {
          id: 'stop_1_1',
          stopOrder: 1,
          name: 'Catedral Central — Puerta Mayor',
          description: 'Inicia en el portal barroco de la catedral donde se proclamó el primer cabildo abierto.',
          coords: { x: 25, y: 45 },
          icon: '🏛️',
          distanceFromPrevMeters: 0,
          isCompleted: false,
          isAccessible: true
        },
        {
          id: 'stop_1_2',
          stopOrder: 2,
          name: 'Fuente Ancestral del Virrey',
          description: 'Segunda parada en la pileta de piedra volcánica donde descansaban las patrullas cívicas.',
          coords: { x: 38, y: 32 },
          icon: '⛲',
          distanceFromPrevMeters: 620,
          isCompleted: false,
          isAccessible: true
        },
        {
          id: 'stop_1_3',
          stopOrder: 3,
          name: 'Monolito del Bicentenario',
          description: 'Parada final frente al obelisco de granito conmemorativo del pacto fundacional.',
          coords: { x: 56, y: 68 },
          icon: '🗿',
          distanceFromPrevMeters: 750,
          isCompleted: false,
          isAccessible: true
        }
      ]
    },
    {
      id: 'route_02',
      title: 'Circuito Verde de Parques y Alamedas',
      theme: 'parques',
      themeLabel: 'Naturaleza Urbana',
      difficulty: 'Fácil',
      totalDistanceKm: 1.2,
      estimatedDurationMinutes: 25,
      totalXpReward: 120,
      badgeRewardName: 'Insignia: Espíritu Botánico',
      badgeRewardId: 'b_desc_02',
      completedStopsCount: 0,
      lastActiveStopIndex: 0,
      status: 'available',
      stops: [
        {
          id: 'stop_2_1',
          stopOrder: 1,
          name: 'Jardín de los Naranjos',
          description: 'Entrada arbolada con ejemplares centenarios traídos en la época fundacional.',
          coords: { x: 42, y: 28 },
          icon: '🌳',
          distanceFromPrevMeters: 0,
          isCompleted: false,
          isAccessible: true
        },
        {
          id: 'stop_2_2',
          stopOrder: 2,
          name: 'Pérgola de los Poetas',
          description: 'Glorieta floral donde se realizan lecturas comunitarias al aire libre.',
          coords: { x: 50, y: 48 },
          icon: '🌸',
          distanceFromPrevMeters: 550,
          isCompleted: false,
          isAccessible: true
        },
        {
          id: 'stop_2_3',
          stopOrder: 3,
          name: 'Estanque de los Cisnes',
          description: 'Espejo de agua artificial con sistema de recirculación ecológica.',
          coords: { x: 62, y: 38 },
          icon: '🦢',
          distanceFromPrevMeters: 650,
          isCompleted: false,
          isAccessible: true
        }
      ]
    },
    {
      id: 'route_03',
      title: 'Sendero Colonial de los Conventos Ocultos',
      theme: 'historico',
      themeLabel: 'Historia Secreta',
      difficulty: 'Desafío',
      totalDistanceKm: 2.4,
      estimatedDurationMinutes: 48,
      totalXpReward: 220,
      badgeRewardName: 'Insignia: Maestro de Rutas',
      badgeRewardId: 'b_rec_02',
      completedStopsCount: 0,
      lastActiveStopIndex: 0,
      status: 'available',
      stops: [
        {
          id: 'stop_3_1',
          stopOrder: 1,
          name: 'Claustro de San Francisco',
          description: 'Patio de arquería mudéjar y azulejos sevillanos del siglo XVII.',
          coords: { x: 22, y: 55 },
          icon: '🔔',
          distanceFromPrevMeters: 0,
          isCompleted: false,
          isAccessible: true
        },
        {
          id: 'stop_3_2',
          stopOrder: 2,
          name: 'Pasaje de los Escribanos',
          description: 'Callejuela adoquinada donde operaban los antiguos notarios de la ciudad.',
          coords: { x: 34, y: 62 },
          icon: '📜',
          distanceFromPrevMeters: 800,
          isCompleted: false,
          isAccessible: true
        },
        {
          id: 'stop_3_3',
          stopOrder: 3,
          name: 'Plazoleta del Campanario Silente',
          description: 'Rincón escondido donde se conservan campanas de fundición de 1780.',
          coords: { x: 48, y: 72 },
          icon: '⛪',
          distanceFromPrevMeters: 900,
          isCompleted: false,
          isAccessible: true
        }
      ]
    },
    {
      id: 'route_04',
      title: 'Circuito de las Murallas y Baluartes',
      theme: 'cultural',
      themeLabel: 'Fortificaciones Defensivas',
      difficulty: 'Desafío',
      totalDistanceKm: 3.0,
      estimatedDurationMinutes: 60,
      totalXpReward: 250,
      badgeRewardName: 'Medalla Guardián de Piedra',
      badgeRewardId: 'b_rec_02',
      completedStopsCount: 0,
      lastActiveStopIndex: 0,
      status: 'suspended', // Página 16 & 17: Suspensión por seguridad / obras
      suspensionNotice: 'Ruta suspendida temporalmente por obras de restauración en el baluarte norte. Conserva tu progreso validado.',
      stops: [
        {
          id: 'stop_4_1',
          stopOrder: 1,
          name: 'Baluarte de Santa Lucía',
          description: 'Murallón de piedra y cal que vigilaba el acceso norte.',
          coords: { x: 18, y: 22 },
          icon: '🛡️',
          distanceFromPrevMeters: 0,
          isCompleted: false,
          isAccessible: false // Inaccesible por obras
        },
        {
          id: 'stop_4_2',
          stopOrder: 2,
          name: 'Polvorín del Virreinato',
          description: 'Depósito subterráneo con bóveda a prueba de bombardeos.',
          coords: { x: 28, y: 15 },
          icon: '💣',
          distanceFromPrevMeters: 1100,
          isCompleted: false,
          isAccessible: true
        }
      ]
    }
  ]);

  // Current Target Stop Computed
  readonly currentTargetStop = computed<RouteStop | null>(() => {
    const route = this.activeRoute();
    if (!route || route.status !== 'in_progress') return null;
    const idx = this.activeStopIndex();
    return route.stops[idx] || null;
  });

  // Current Live Distance to Target Stop
  readonly distanceToTargetStop = computed<number>(() => {
    const stop = this.currentTargetStop();
    if (!stop) return 0;
    const avatar = this.mapService.avatarPos();
    const dx = stop.coords.x - avatar.x;
    const dy = stop.coords.y - avatar.y;
    const meters = Math.round(Math.sqrt(dx * dx + dy * dy) * 6.5);
    return Math.max(8, meters);
  });

  // Proximity Check: <= 35m zone arrival for current stop
  readonly isWithinStopArrivalZone = computed<boolean>(() => {
    if (!this.currentTargetStop()) return false;
    return this.distanceToTargetStop() <= 35;
  });

  // Filtered Routes Computed
  readonly filteredRoutes = computed(() => {
    const filter = this.activeThemeFilter();
    if (filter === 'all') return this.routes();
    return this.routes().filter(r => r.theme === filter);
  });

  // Overall Routes Metrics Computed
  readonly routesMetrics = computed(() => {
    const list = this.routes();
    const total = list.length;
    const completed = list.filter(r => r.status === 'completed').length;
    const active = this.activeRoute();
    const totalKm = list.filter(r => r.status === 'completed').reduce((acc, r) => acc + r.totalDistanceKm, 0);

    return {
      total,
      completed,
      active,
      totalKm: Math.round(totalKm * 10) / 10
    };
  });

  /**
   * Filtrar por temática
   */
  setThemeFilter(theme: 'all' | RouteTheme): void {
    this.activeThemeFilter.set(theme);
  }

  /**
   * Abrir modal con itinerario y detalles
   */
  openRouteDetail(route: ThematicRoute): void {
    this.selectedRouteDetail.set(route);
  }

  closeRouteDetail(): void {
    this.selectedRouteDetail.set(null);
  }

  /**
   * INICIAR RECORRIDO (Página 15: Validar condiciones y crear intento)
   */
  startRoute(route: ThematicRoute): boolean {
    // 1. Validar sesión
    if (!this.sessionService.isAuthenticated()) {
      this.sessionService.simulateLogin();
      this.showToast('Sesión de explorador iniciada automáticamente.', 'info');
    }

    // 2. Validar GPS
    if (this.sessionService.session().locationPermission !== 'granted' || this.mapService.isGpsLost()) {
      this.sessionService.grantLocation();
      if (this.mapService.isGpsLost()) {
        this.mapService.toggleGpsLost();
      }
    }

    // 3. Validar disponibilidad y suspensión (Páginas 16 y 17)
    if (route.status === 'suspended') {
      this.suspensionModalData.set({
        route,
        reason: route.suspensionNotice || 'Recorrido suspendido temporalmente por seguridad u obras de vía pública.'
      });
      return false;
    }

    // 4. Si ya existe un recorrido activo diferente, avisar
    const currentActive = this.activeRoute();
    if (currentActive && currentActive.id !== route.id && currentActive.status === 'in_progress') {
      this.showToast(`Pausando recorrido previo '${currentActive.title}'. Tu progreso queda guardado.`, 'info');
      this.pauseActiveRoute();
    }

    // 5. Configurar recorrido activo y primer parada pendiente
    const pendingStopIdx = route.stops.findIndex(s => !s.isCompleted);
    const targetIdx = pendingStopIdx >= 0 ? pendingStopIdx : 0;

    const activatedRoute: ThematicRoute = {
      ...route,
      status: 'in_progress',
      lastActiveStopIndex: targetIdx
    };

    this.activeRoute.set(activatedRoute);
    this.activeStopIndex.set(targetIdx);

    // Actualizar catálogo
    this.routes.update(list =>
      list.map(r => r.id === route.id ? activatedRoute : (r.status === 'in_progress' ? { ...r, status: 'paused' } : r))
    );

    this.selectedRouteDetail.set(null);
    this.showToast(`🚶 ¡Recorrido iniciado: "${route.title}"! Parada 1: ${activatedRoute.stops[targetIdx].name}`, 'success');
    return true;
  }

  /**
   * GUARDAR Y PAUSAR RECORRIDO (Página 16: Guardar progreso confirmado)
   */
  pauseActiveRoute(): void {
    const active = this.activeRoute();
    if (!active) return;

    const paused: ThematicRoute = {
      ...active,
      status: 'paused'
    };

    this.activeRoute.set(paused);
    this.routes.update(list =>
      list.map(r => r.id === active.id ? paused : r)
    );

    this.showToast(`⏸️ Recorrido "${active.title}" pausado. Tu progreso de paradas completadas se conserva.`, 'info');
  }

  /**
   * RETOMAR RECORRIDO PAUSADO (Página 16: Mostrar botón Retomar)
   */
  resumeRoute(route: ThematicRoute): void {
    const pendingStopIdx = route.stops.findIndex(s => !s.isCompleted);
    const targetIdx = pendingStopIdx >= 0 ? pendingStopIdx : 0;

    const resumed: ThematicRoute = {
      ...route,
      status: 'in_progress',
      lastActiveStopIndex: targetIdx
    };

    this.activeRoute.set(resumed);
    this.activeStopIndex.set(targetIdx);

    this.routes.update(list =>
      list.map(r => r.id === route.id ? resumed : r)
    );

    this.showToast(`▶️ Recorrido retomado. Siguiente parada: ${resumed.stops[targetIdx].name}`, 'success');
  }

  /**
   * SELECCIONAR PARADA PENDIENTE (Página 15: Jugador elige parada pendiente)
   */
  selectTargetStop(stopIndex: number): void {
    const active = this.activeRoute();
    if (!active) return;

    this.activeStopIndex.set(stopIndex);
    this.showToast(`🎯 Objetivo de parada cambiado a: "${active.stops[stopIndex].name}"`, 'info');
  }

  /**
   * VALIDAR Y CONFIRMAR PARADA (Página 15: Validar proximidad GPS <= 35m)
   */
  confirmCurrentStop(): boolean {
    const active = this.activeRoute();
    const stop = this.currentTargetStop();
    if (!active || !stop) return false;

    // Validar proximidad (Radio <= 35 metros)
    if (!this.isWithinStopArrivalZone()) {
      const dist = this.distanceToTargetStop();
      this.showToast(`Estás a ${dist}m de la parada. Debes acercarte a menos de 35m para validar tu llegada.`, 'warn');
      return false;
    }

    // Marcar parada como completada
    const updatedStops = active.stops.map((s, idx) => 
      idx === this.activeStopIndex() ? { ...s, isCompleted: true, completedAt: new Date().toISOString() } : s
    );

    const completedCount = updatedStops.filter(s => s.isCompleted).length;
    const allCompleted = completedCount === updatedStops.length;

    // Buscar siguiente parada pendiente
    const nextPendingIdx = updatedStops.findIndex(s => !s.isCompleted);
    const nextStop = nextPendingIdx >= 0 ? updatedStops[nextPendingIdx] : null;

    if (!allCompleted && nextStop) {
      this.activeStopIndex.set(nextPendingIdx);
    }

    const updatedRoute: ThematicRoute = {
      ...active,
      stops: updatedStops,
      completedStopsCount: completedCount,
      lastActiveStopIndex: nextPendingIdx >= 0 ? nextPendingIdx : active.lastActiveStopIndex,
      status: allCompleted ? 'completed' : 'in_progress'
    };

    this.activeRoute.set(allCompleted ? null : updatedRoute);
    this.routes.update(list =>
      list.map(r => r.id === active.id ? updatedRoute : r)
    );

    // Si todas las paradas están completas -> Finalizar y entregar XP + Insignia
    if (allCompleted) {
      this.achievementsService.simulateAddWeeklyXp(active.totalXpReward);
      this.achievementsService.unlockBadge(active.badgeRewardId);

      this.completedRouteCelebration.set({
        route: active,
        xpEarned: active.totalXpReward
      });

      this.showToast(`🏆 ¡RECORRIDO COMPLETADO! Todas las paradas validadas. +${active.totalXpReward} XP.`, 'success');
    } else {
      this.completedStopCelebration.set({
        stop,
        nextStop
      });
      this.showToast(`✓ Parada "${stop.name}" validada con éxito. ¡Avanza a la siguiente parada!`, 'success');
    }

    return true;
  }

  closeStopCelebration(): void {
    this.completedStopCelebration.set(null);
  }

  closeRouteCelebration(): void {
    this.completedRouteCelebration.set(null);
  }

  /**
   * ABANDONAR RECORRIDO MANUALMENTE (Página 16: Descartar progreso del intento sin XP)
   */
  requestAbandonRoute(): void {
    const active = this.activeRoute();
    if (active) {
      this.abandonModalData.set({ route: active });
    }
  }

  confirmAbandonRoute(): void {
    const data = this.abandonModalData();
    if (!data) return;

    const resetRoute: ThematicRoute = {
      ...data.route,
      status: 'available',
      completedStopsCount: 0,
      lastActiveStopIndex: 0,
      stops: data.route.stops.map(s => ({ ...s, isCompleted: false }))
    };

    this.activeRoute.set(null);
    this.routes.update(list =>
      list.map(r => r.id === data.route.id ? resetRoute : r)
    );

    this.abandonModalData.set(null);
    this.showToast('Recorrido cancelado. El progreso del intento fue descartado y no se otorgó XP.', 'warn');
  }

  cancelAbandonModal(): void {
    this.abandonModalData.set(null);
  }

  closeSuspensionModal(): void {
    this.suspensionModalData.set(null);
  }

  /**
   * ADMINISTRADOR: Simular restauración de ruta suspendida (Página 17)
   */
  simulateAdminRestoreRoute(routeId: string): void {
    this.routes.update(list =>
      list.map(r => r.id === routeId ? {
        ...r,
        status: 'available',
        suspensionNotice: undefined,
        stops: r.stops.map(s => ({ ...s, isAccessible: true }))
      } : r)
    );
    this.showToast('🛠️ Verificación técnica completada: Sendero seguro habilitado. ¡Ruta disponible!', 'success');
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
