import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GeolocationService, GeoCoordinates } from '../../services/geolocation.service.js';
import { AuthService } from '../../services/auth.service.js';
import { PALETAS_PREDEFINIDAS, PALETA_SELECCIONADA, VamooMapPalette } from './map-palette.config.js';
import { buildVamooMapTheme } from './pixar-map-theme.js';
import { RpgMapEngine, RpgPoiLocation, RpgPoiCategory } from './rpg-map-engine.js';
import { getNearbyPois, MASTER_POI_CATALOG } from './poi-catalog.js';

/**
 * Interfaz que define un modo de expedición o juego en Vamoo,
 * alineado a las entidades Route, UserActivity y reglas de bonificación del backend.
 */
export interface GameMode {
  /** Identificador único del modo */
  id: string;
  /** Título descriptivo en estilo pixel-art */
  title: string;
  /** Resumen de la mecánica de exploración */
  description: string;
  /** Emoji o icono pixel representativo */
  icon: string;
  /** Grado de exigencia física o tiempo mínimo */
  difficulty: 'Fácil' | 'Media' | 'Difícil' | 'Especial';
  /** Estado de disponibilidad en el ciclo actual */
  status: 'Disponible' | 'Edición Limitada' | 'Bonus Activo' | 'Próximamente';
  /** Recompensa de experiencia (XP) otorgada */
  xpReward: string;
  /** Mecanismo de auditoría técnica (GPS / QR / Grupo) */
  validationType: 'GPS (10 min)' | 'Escaneo QR' | 'GPS + Trofeo' | 'Multiplicador';
  /** Detalle expandido con los requerimientos técnicos del backend */
  detail: string;
}

/**
 * Modelo para el estado de la simulación de validación de ruta.
 */
export interface RouteSimulationState {
  /** Indica si la simulación está activa */
  isActive: boolean;
  /** Mensaje informativo con el resultado del chequeo */
  message: string;
  /** Cantidad de XP acreditada en la simulación */
  xpEarned: number;
  /** Tipo de validación ejecutada */
  validationMethod: 'GPS' | 'QR' | 'GRUPO';
}

/**
 * Componente principal de la sección Jugar (JugarComponent).
 *
 * Propósito: Renderizar la experiencia interactiva de expediciones mediante el motor
 * gráfico 16-bits RPG basado en Pixi.js y OpenStreetMap (Opción 2), rastreando
 * fielmente la ubicación satelital GPS en tiempo real (Huancayo: -12.0681, -75.2100),
 * aplicando la paleta Valle Andino, gestionando telemetría en vivo (distancia, XP, rango)
 * y permitiendo conmutar al catálogo de modalidades de expedición.
 */
@Component({
  selector: 'app-jugar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jugar.component.html',
  styleUrl: './jugar.component.css',
})
export class JugarComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Servicio de enrutamiento y navegación */
  private readonly router = inject(Router);

  /** Servicio de geolocalización satelital y telemetría de pasos */
  readonly geoService = inject(GeolocationService);

  /** Servicio de autenticación para consultar perfil y rango del aventurero */
  readonly authService = inject(AuthService);

  /** Referencia al contenedor HTML donde se monta el lienzo Pixi.js */
  @ViewChild('rpgCanvasContainer', { static: false })
  rpgCanvasContainer?: ElementRef<HTMLDivElement>;

  /** Instancia del motor gráfico de renderizado RPG en WebGL */
  private rpgEngine: RpgMapEngine | null = null;

  /** Pestaña activa en la interfaz ('mapa' interactivo o 'modos' de expedición) */
  readonly activeTab = signal<'mapa' | 'modos'>('mapa');

  /** Coordenadas centrales de la cámara del mapa (Huancayo por defecto) */
  readonly mapCenter = signal<GeoCoordinates>({
    lat: -12.0681,
    lng: -75.2100,
  });

  /** Nivel de zoom inicial del mapa (Zoom 19: vista principal donde el aventurero siempre estará) */
  readonly mapZoom = signal<number>(19);

  /** Estado de arrastre manual del mapa con el cursor de manito */
  readonly isDragging = signal<boolean>(false);

  /** Estado de inicialización del mapa */
  readonly isMapReady = signal<boolean>(true);

  /** Control para seguimiento automático de cámara al caminar */
  readonly autoFollow = signal<boolean>(true);

  /** Identificador de la paleta cartográfica activa actualmente */
  readonly selectedPaletteId = signal<keyof typeof PALETAS_PREDEFINIDAS>(PALETA_SELECCIONADA);

  /** Catálogo de paletas predefinidas para conmutación interactiva */
  readonly availablePalettes = PALETAS_PREDEFINIDAS;

  /** Posición actual del aventurero reactiva */
  readonly userCoords = computed(() => this.geoService.currentPosition());

  /** Historial ordenado de coordenadas del sendero caminado */
  readonly polylinePath = computed(() => this.geoService.pathHistory());

  /** Distancia total formateada en kilómetros o metros */
  readonly formattedDistance = computed(() => {
    const meters = this.geoService.totalDistanceMeters();
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters} m`;
  });

  /** Puntos de experiencia (XP) estimados para la caminata actual (+15 XP por km) */
  readonly currentExpeditionXp = computed(() => {
    const km = this.geoService.totalDistanceMeters() / 1000;
    return Math.floor(km * 15);
  });

  /** Emoji de fauna correspondiente al rango del aventurero */
  readonly rankEmoji = computed(() => {
    const user = this.authService.currentUser();
    const rank = user?.currentRank || 'Pichón';
    return this.getFaunaEmoji(rank);
  });

  /** Lista reactiva de puntos de interés (POIs) más cercanos a la ubicación del usuario (máximo 1 km estricto) */
  readonly nearbyPois = signal<RpgPoiLocation[]>(getNearbyPois({ lat: -12.0681, lng: -75.2100 }, { maxRadiusMeters: 1000, limit: 10 }));

  /** Coordenadas del último anclaje utilizado para calcular lugares cercanos */
  private lastPoiAnchorCoords: GeoCoordinates | null = null;

  /** Punto de interés actualmente seleccionado o inspeccionado */
  readonly selectedPoi = signal<RpgPoiLocation | null>(null);

  /** Distancia en metros desde el usuario (o anclaje de búsqueda) hacia el POI seleccionado */
  readonly selectedPoiDistanceMeters = computed(() => {
    const poi = this.selectedPoi();
    if (!poi) return 0;
    const user = this.userCoords() || this.lastPoiAnchorCoords || { lat: -12.0681, lng: -75.2100 };
    return Math.round(RpgMapEngine.calculateDistanceMeters(user, poi.coords));
  });

  /** Distancia formateada hacia el punto de interés seleccionado (ej. '95 m', '850 m') */
  readonly selectedPoiFormattedDistance = computed(() => {
    const m = this.selectedPoiDistanceMeters();
    return RpgMapEngine.formatDistance(m);
  });

  /**
   * Puntos de experiencia (XP) dinámicos que ganará el aventurero al llegar al lugar seleccionado.
   * La recompensa escala con la lejanía respecto a la ubicación del usuario (de 30 XP hasta 150 XP).
   */
  readonly selectedPoiRewardXp = computed(() => {
    const meters = this.selectedPoiDistanceMeters();
    const base = 30;
    const scaled = Math.round((meters / 1000) * 120);
    return Math.max(30, Math.min(150, base + scaled));
  });

  /**
   * Nivel y denominación de la travesía según la distancia hacia el lugar.
   */
  readonly selectedPoiRewardTier = computed(() => {
    const meters = this.selectedPoiDistanceMeters();
    if (meters <= 200) return { label: 'Paseo Cercano', icon: '🚶' };
    if (meters <= 500) return { label: 'Exploración Local', icon: '🏃' };
    if (meters <= 800) return { label: 'Expedición Zonal', icon: '🧭' };
    return { label: 'Gran Travesía (1 km)', icon: '🏆' };
  });

  /** Filtro de categoría temática de POI activa */
  readonly activePoiCategory = signal<RpgPoiCategory | 'all'>('all');

  /** Lista filtrada de POIs según la categoría seleccionada */
  readonly filteredPois = computed(() => {
    const category = this.activePoiCategory();
    if (category === 'all') {
      return this.nearbyPois();
    }
    return this.nearbyPois().filter((p) => p.category === category);
  });

  /** Opciones de mapa para compatibilidad con suites de pruebas unitarias */
  readonly currentMapOptions = computed(() => {
    const paleta = this.availablePalettes[this.selectedPaletteId()];
    const styles = buildVamooMapTheme(paleta);
    return {
      styles,
      zoom: this.mapZoom(),
      center: this.mapCenter(),
    };
  });

  /** Getter de compatibilidad con pruebas unitarias heredadas */
  get mapOptions(): { styles: any[]; zoom: number; center: GeoCoordinates } {
    return this.currentMapOptions();
  }

  /** Opciones de marcador para compatibilidad con pruebas unitarias */
  readonly adventurerMarkerOptions = computed(() => {
    const coords = this.userCoords();
    if (!coords) return null;
    return {
      position: coords,
      title: `Aventurero: ${this.authService.currentUser()?.name || 'Explorador Vamoo'}`,
    };
  });

  /** Opciones de halo de precisión para compatibilidad con pruebas unitarias */
  readonly accuracyCircleOptions = {
    fillColor: '#10b981',
    fillOpacity: 0.2,
    strokeColor: '#059669',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    radius: 25,
  };

  /** Opciones de polyline para compatibilidad con pruebas unitarias */
  readonly polylineOptions = {
    strokeColor: '#f59e0b',
    strokeOpacity: 0.95,
    strokeWeight: 5,
  };

  /** Catálogo de modos de expedición configurados a partir del backend de Vamoo */
  readonly gameModes: GameMode[] = [
    {
      id: 'rutas-predeterminadas',
      title: 'RUTAS ECOLÓGICAS',
      description: 'Recorre senderos y humedales protegidos con validación por GPS y tiempo de permanencia.',
      icon: '🗺️',
      difficulty: 'Fácil',
      status: 'Disponible',
      xpReward: '100 XP',
      validationType: 'GPS (10 min)',
      detail: 'Requiere permanencia mínima de 10 minutos y validación satelital en el radio de coordenadas GeoJSON.',
    },
    {
      id: 'locales-aliados-qr',
      title: 'LOCALES ALIADOS & QR',
      description: 'Descubre cafeterías y tiendas eco-sostenibles aliadas. Valida tu visita escaneando su código QR.',
      icon: '🏪',
      difficulty: 'Media',
      status: 'Disponible',
      xpReward: '50 - 100 XP',
      validationType: 'Escaneo QR',
      detail: 'Verificación instantánea con código alfanumérico único proporcionado por el establecimiento aliado.',
    },
    {
      id: 'eventos-temporada',
      title: 'FAUNA DE TEMPORADA',
      description: 'Eventos de edición limitada enfocados en avistamiento de especies migratorias e insignias conmemorativas.',
      icon: '🦩',
      difficulty: 'Difícil',
      status: 'Edición Limitada',
      xpReward: '150 XP',
      validationType: 'GPS + Trofeo',
      detail: 'Otorga un trofeo exclusivo coleccionable en tu perfil y 150 puntos para la liga semanal.',
    },
    {
      id: 'caminata-grupal',
      title: 'EXPEDICIÓN EN GRUPO',
      description: 'Sal a caminar en compañía de otros aventureros y activa la bonificación multiplicadora de experiencia.',
      icon: '👥',
      difficulty: 'Especial',
      status: 'Bonus Activo',
      xpReward: '+20% XP',
      validationType: 'Multiplicador',
      detail: 'El backend calcula automáticamente un bonus adicional del 20% al registrar salidas con amigos.',
    },
  ];

  /** Modo de juego seleccionado actualmente para inspección o simulación */
  selectedMode: GameMode | null = null;

  /** Estado de la simulación de ruta (GPS o QR) */
  simulationState: RouteSimulationState | null = null;

  /**
   * Constructor del componente.
   * Inicializa efectos reactivos para auto-centrado GPS y sincronización del motor Pixi.js.
   */
  constructor() {
    // Efecto 1: Sincronizar posición del usuario con la cámara y el avatar del motor RPG
    effect(() => {
      const userPos = this.geoService.currentPosition();
      if (userPos) {
        if (this.autoFollow()) {
          this.mapCenter.set(userPos);
          this.rpgEngine?.setCenter(userPos);
        }
        this.rpgEngine?.setUserPosition(
          userPos,
          this.rankEmoji(),
          this.authService.currentUser()?.name || 'Aventurero Vamoo',
        );
        this.updateNearbyPoisForLocation(userPos);
      }
    });

    // Efecto 2: Sincronizar historial de coordenadas (polyline) en el motor Pixi.js
    effect(() => {
      const path = this.polylinePath();
      this.rpgEngine?.setPath(path);
    });
  }

  /**
   * Ciclo de inicialización del componente.
   * Solicita permisos e inicia inmediatamente el rastreo satelital GPS en tiempo real.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.geoService.startTracking();
    this.isMapReady.set(true);
    this.updateNearbyPoisForLocation(this.mapCenter(), true);
  }

  /**
   * Ciclo posterior al renderizado del DOM.
   * Instancia e inicializa el motor gráfico Pixi.js en el contenedor de vista.
   *
   * @returns void
   */
  ngAfterViewInit(): void {
    if (this.rpgCanvasContainer?.nativeElement) {
      this.rpgEngine = new RpgMapEngine();
      this.rpgEngine
        .init(this.rpgCanvasContainer.nativeElement, {
          initialZoom: this.mapZoom(),
          initialCenter: this.mapCenter(),
          palette: this.availablePalettes[this.selectedPaletteId()],
          onCameraChange: (center, zoom) => {
            this.mapCenter.set(center);
            this.mapZoom.set(zoom);
          },
          onDragStart: () => {
            this.isDragging.set(true);
            this.autoFollow.set(false);
          },
          onDragEnd: () => {
            this.isDragging.set(false);
            // Si no hay señal GPS en tiempo real activa (ej. pruebas en escritorio navegando el mapa),
            // actualizar los POIs cercanos respecto al nuevo centro del mapa inspeccionado
            if (!this.geoService.currentPosition()) {
              this.updateNearbyPoisForLocation(this.mapCenter());
            }
          },
          onPoiClick: (poi) => {
            this.selectPoi(poi);
          },
        })
        .then(() => {
          const userPos = this.geoService.currentPosition();
          const initialCoords = userPos || this.mapCenter();
          if (userPos) {
            this.rpgEngine?.setUserPosition(
              userPos,
              this.rankEmoji(),
              this.authService.currentUser()?.name || 'Aventurero Vamoo',
            );
          }
          if (this.polylinePath().length > 0) {
            this.rpgEngine?.setPath(this.polylinePath());
          }
          this.updateNearbyPoisForLocation(initialCoords, true);
        });
    }
  }

  /**
   * Ciclo de destrucción del componente.
   * Libera los recursos WebGL y observadores del motor Pixi.js.
   *
   * @returns void
   */
  ngOnDestroy(): void {
    if (this.rpgEngine) {
      this.rpgEngine.destroy();
      this.rpgEngine = null;
    }
  }

  /**
   * Método de compatibilidad para eventos de inicialización de mapa.
   *
   * @returns void
   */
  onMapInitialized(): void {
    this.isMapReady.set(true);
  }

  /**
   * Se ejecuta al iniciar el arrastre del mapa con el ratón o gesto táctil.
   *
   * @returns void
   */
  onMapDragStart(): void {
    this.isDragging.set(true);
    this.autoFollow.set(false);
  }

  /**
   * Se ejecuta durante el arrastre continuo del mapa.
   *
   * @returns void
   */
  onMapDrag(): void {
    this.autoFollow.set(false);
  }

  /**
   * Se ejecuta al finalizar el arrastre del mapa.
   *
   * @returns void
   */
  onMapDragEnd(): void {
    this.isDragging.set(false);
  }

  /**
   * Manejador de cambio de zoom.
   *
   * @returns void
   */
  onZoomChanged(): void {
    // Sincronizado internamente por el motor RpgMapEngine
  }

  /**
   * Manejador de incremento o decremento de zoom.
   * La vista del jugador permanece fija en Z19 según las reglas de diseño.
   *
   * @param _delta - Variación ignorada para mantener vista fija en Z19.
   * @returns void
   */
  stepZoom(_delta: number): void {
    this.mapZoom.set(19);
    this.rpgEngine?.setZoom(19);
  }

  /**
   * Establece el nivel de zoom. La vista del jugador permanece fija en Z19.
   *
   * @param _level - Nivel objetivo fijado en Z19.
   * @returns void
   */
  setZoomPreset(_level: number): void {
    this.mapZoom.set(19);
    this.rpgEngine?.setZoom(19);
  }

  /**
   * Cambia la paleta activa en tiempo real.
   *
   * @param paletteId - Identificador de la paleta predefinida a activar.
   * @returns void
   */
  changePalette(paletteId: keyof typeof PALETAS_PREDEFINIDAS): void {
    this.selectedPaletteId.set(paletteId);
    this.rpgEngine?.refreshMap();
  }

  /**
   * Cambia la pestaña activa entre el mapa interactivo y los modos de juego.
   *
   * @param tab - Nombre de la pestaña seleccionada ('mapa' o 'modos').
   * @returns void
   */
  setActiveTab(tab: 'mapa' | 'modos'): void {
    this.activeTab.set(tab);
    if (tab === 'mapa') {
      setTimeout(() => {
        this.rpgEngine?.refreshMap();
      }, 50);
    }
  }

  /**
   * Inicia o pausa el seguimiento del GPS satelital en tiempo real.
   *
   * @returns void
   */
  toggleTracking(): void {
    if (this.geoService.isTracking()) {
      this.geoService.stopTracking();
    } else {
      this.geoService.startTracking();
      this.autoFollow.set(true);
    }
  }

  /**
   * Simula un paso de caminata de 35 metros para comprobar el movimiento y trazo polyline.
   *
   * @returns void
   */
  simulateStep(): void {
    this.geoService.simulateWalkStep();
    const current = this.geoService.currentPosition();
    if (current) {
      if (this.autoFollow()) {
        this.mapCenter.set(current);
        this.rpgEngine?.setCenter(current);
      }
      this.updateNearbyPoisForLocation(current);
    }
  }

  /**
   * Reinicia el sendero recorrido y pone a cero el contador de distancia.
   *
   * @returns void
   */
  resetExpedition(): void {
    this.geoService.resetPath();
    this.rpgEngine?.setPath([]);
  }

  /**
   * Centra la cámara del mapa en la ubicación satelital en tiempo real del aventurero,
   * reactiva el seguimiento automático de cámara (Zoom 19) y recalcula los lugares cercanos.
   *
   * @returns void
   */
  centerOnUser(): void {
    this.autoFollow.set(true);
    const userPos = this.geoService.currentPosition();
    if (userPos) {
      this.mapCenter.set(userPos);
      this.mapZoom.set(19);
      this.rpgEngine?.setCenter(userPos, 19);
      this.updateNearbyPoisForLocation(userPos, true);
    } else {
      this.geoService.startTracking();
    }
  }

  /**
   * Actualiza reactivamente los círculos flotantes de lugares (POIs) más cercanos a la ubicación del usuario.
   * Si el usuario se ha desplazado más de 25 metros desde el último cálculo, resuelve los POIs más cercanos
   * (con radio máximo estricto de 1 km / 1000m) y refresca los marcadores del motor gráfico RPG.
   *
   * @param coords - Coordenadas actuales del usuario o centro del mapa.
   * @param force - Forzar la actualización sin evaluar la distancia mínima de desplazamiento.
   * @returns void
   */
  updateNearbyPoisForLocation(coords: GeoCoordinates, force: boolean = false): void {
    if (!coords || isNaN(coords.lat) || isNaN(coords.lng)) return;

    if (!force && this.lastPoiAnchorCoords) {
      const movedDist = RpgMapEngine.calculateDistanceMeters(this.lastPoiAnchorCoords, coords);
      if (movedDist < 25) {
        return; // Evita recalcular innecesariamente ante micro-movimientos de GPS (< 25m)
      }
    }

    this.lastPoiAnchorCoords = { ...coords };
    const resolved = getNearbyPois(coords, { maxRadiusMeters: 1000, limit: 10 });
    this.nearbyPois.set(resolved);
    this.rpgEngine?.setPoiLocations(this.filteredPois());
  }

  /**
   * Selecciona un punto de interés, centra suavemente la cámara del mapa en su ubicación,
   * traza una ruta luminosa animada de navegación y activa la tarjeta superior de misión con recompensa XP.
   *
   * @param poi - Punto de interés seleccionado.
   * @returns void
   */
  selectPoi(poi: RpgPoiLocation): void {
    this.selectedPoi.set(poi);
    this.autoFollow.set(false);
    this.mapCenter.set(poi.coords);
    this.rpgEngine?.setCenter(poi.coords, 19);
    this.rpgEngine?.setNavigationTarget(poi.coords);
  }

  /**
   * Cierra la ficha superior de información del punto de interés y cancela la ruta de navegación trazada.
   *
   * @returns void
   */
  clearSelectedPoi(): void {
    this.selectedPoi.set(null);
    this.rpgEngine?.setNavigationTarget(null);
  }

  /**
   * Retorna el color hexadecimal representativo de una categoría de punto de interés.
   *
   * @param category - Categoría del lugar.
   * @returns string Color hexadecimal CSS.
   */
  getCategoryColorHex(category: string): string {
    switch (category) {
      case 'pharmacy': return '#ef4444';
      case 'park': return '#10b981';
      case 'school': return '#3b82f6';
      case 'hotel': return '#f59e0b';
      case 'store': return '#8b5cf6';
      case 'hospital': return '#ec4899';
      default: return '#0ea5e9';
    }
  }

  /**
   * Filtra los círculos flotantes de lugares por categoría temática (boticas, parques, escuelas, hoteles, etc.).
   *
   * @param category - Categoría seleccionada o 'all' para mostrar todos los lugares.
   * @returns void
   */
  filterPoiCategory(category: RpgPoiCategory | 'all'): void {
    this.activePoiCategory.set(category);
    this.rpgEngine?.setPoiLocations(this.filteredPois());
  }

  /**
   * Retorna el emoji de fauna correspondiente a un rango del usuario.
   *
   * @param rank - Rango del usuario.
   * @returns string Emoji representativo de fauna.
   */
  private getFaunaEmoji(rank: string): string {
    const r = (rank || '').toLowerCase();
    if (r.includes('bagre')) return '🐟';
    if (r.includes('tortuga')) return '🐢';
    if (r.includes('oso')) return '🐻';
    if (r.includes('flamenco')) return '🦩';
    if (r.includes('pingüino') || r.includes('pinguino')) return '🐧';
    return '🐣';
  }

  /**
   * Selecciona o deselecciona un modo de juego para ver sus especificaciones técnicas.
   *
   * @param mode - Modo de juego a inspeccionar.
   * @returns void
   */
  selectMode(mode: GameMode): void {
    if (this.selectedMode?.id === mode.id) {
      this.selectedMode = null;
    } else {
      this.selectedMode = mode;
      this.simulationState = null;
    }
  }

  /**
   * Ejecuta una simulación interactiva de validación técnica (GPS o QR)
   * correspondiente al modo de juego seleccionado.
   *
   * @param mode - Modo de juego para el cual se ejecuta la simulación.
   * @returns void
   */
  simulateValidation(mode: GameMode): void {
    if (mode.id === 'locales-aliados-qr') {
      this.simulationState = {
        isActive: true,
        message: '¡Código QR "VAMOO-LOCAL-01" validado con éxito en Cafetería Aliada!',
        xpEarned: 50,
        validationMethod: 'QR',
      };
    } else if (mode.id === 'caminata-grupal') {
      this.simulationState = {
        isActive: true,
        message: '¡Compañero vinculado! Multiplicador +20% activado para tu siguiente salida.',
        xpEarned: 20,
        validationMethod: 'GRUPO',
      };
    } else {
      this.simulationState = {
        isActive: true,
        message: '¡Punto de ruta alcanzado [-77.0282, -12.2034]! Tiempo de 10 min confirmado por GPS.',
        xpEarned: mode.id === 'eventos-temporada' ? 150 : 100,
        validationMethod: 'GPS',
      };
    }
  }

  /**
   * Cierra el modal o banner de simulación de ruta activa.
   *
   * @returns void
   */
  closeSimulation(): void {
    this.simulationState = null;
  }

  /**
   * Navega hacia la pantalla de inicio de sesión.
   *
   * @returns void
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
