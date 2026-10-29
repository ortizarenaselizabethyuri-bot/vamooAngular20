/**
 * @fileoverview Componente PixelMapViewerComponent — Mapa de Aventura Pixel-Art 5px.
 *
 * Gestiona:
 *  - Canvas 2D rasterizado con paleta ciudad de 16-bits
 *  - Movimiento del personaje exclusivamente por GPS real (watchPosition + polling 30s)
 *  - Etiquetas de calles como texto simple rotado (sin badges)
 *  - Marcadores POI circulares flotantes (parques, colegios, tiendas, farmacias, hoteles)
 *  - Sistema de misiones activas con recompensa XP al llegar al destino
 *  - Sendero SVG amarillo del recorrido real
 */

import {
  Component,
  ElementRef,
  ViewChild,
  signal,
  computed,
  inject,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service.js';
import { GeolocationService } from '../../services/geolocation.service.js';
import {
  PixelRasterizer,
  MapRasterizeOptions,
  StreetLabel,
} from '../../canvas-pixel-engine/pixel-rasterizer.js';

/** Modo de renderizado activo del mapa. */
export type RenderMode = 'google-maps-raster' | 'geometric-primitives';

/** Variante de imagen satelital/urbana para rasterizar. */
export type MapImageVariant = 'clean_standard' | 'clean_contrast';

/**
 * Punto de coordenada porcentual (0–100) sobre el canvas del mapa.
 */
export interface MapPositionPercent {
  /** Posición horizontal en porcentaje del ancho (0%–100%) */
  x: number;
  /** Posición vertical en porcentaje del alto (0%–100%) */
  y: number;
}

/**
 * Tipo de Punto de Interés (POI) con icono y color propios.
 */
export type PoiType = 'park' | 'school' | 'store' | 'pharmacy' | 'hotel' | 'restaurant' | 'landmark';

/**
 * Definición completa de un Punto de Interés visible en el mapa.
 */
export interface PoiMarker {
  /** Identificador único del POI */
  id: string;
  /** Nombre visible del lugar */
  name: string;
  /** Tipo de POI para determinar icono y color */
  type: PoiType;
  /** Posición relativa sobre el canvas (0–1) */
  relX: number;
  relY: number;
  /** Emoji representativo del POI */
  icon: string;
  /** Color del círculo flotante */
  color: string;
  /** Radio de proximidad en % del mapa para detectar llegada */
  proximityRadius: number;
}

/**
 * Misión de expedición que el aventurero debe completar caminando al POI destino.
 */
export interface Mission {
  /** Identificador único de la misión */
  id: string;
  /** Título corto de la misión */
  title: string;
  /** Descripción detallada */
  description: string;
  /** ID del POI destino */
  targetPoiId: string;
  /** XP que se gana al completarla */
  xpReward: number;
  /** Si la misión está completada */
  completed: boolean;
  /** Si la misión está activa/seleccionada */
  active: boolean;
  /** Icono de la misión */
  icon: string;
  /** Distancia estimada al objetivo en metros */
  estimatedDistanceM: number;
}

/**
 * Etiqueta de calle sin encuadre — solo texto rotado sobre el mapa.
 */
export interface StreetTextLabel {
  text: string;
  relX: number;
  relY: number;
  angleDegrees?: number;
  type?: 'avenue' | 'street';
}

/**
 * Componente principal del Mapa de Aventura Pixel-Art.
 * El avatar se mueve únicamente mediante GPS real. Las misiones se completan
 * acercándose al POI destino. El sendero amarillo muestra la ruta recorrida.
 */
@Component({
  selector: 'app-pixel-map-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pixel-map-viewer.component.html',
  styleUrls: ['./pixel-map-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelMapViewerComponent implements OnInit, AfterViewInit, OnDestroy {

  /** Servicio de autenticación */
  readonly authService = inject(AuthService);

  /** Servicio de geolocalización */
  readonly geoService = inject(GeolocationService);

  /** Detector de cambios para actualizar la vista tras callbacks de GPS */
  private readonly cdr = inject(ChangeDetectorRef);

  /** Referencia al canvas 2D */
  @ViewChild('pixelCanvas') pixelCanvasRef!: ElementRef<HTMLCanvasElement>;

  /** Referencia al contenedor del mapa */
  @ViewChild('mapStage') mapStageRef!: ElementRef<HTMLDivElement>;

  /** Imagen de referencia limpia para el rasterizador */
  @ViewChild('refImg') refImgRef!: ElementRef<HTMLImageElement>;

  // ── Signals de configuración del canvas ────────────────────────────────────

  public readonly mapVariant = signal<MapImageVariant>('clean_standard');
  public readonly currentImageUrl = signal<string>('/google_maps_clean_standard.png');
  public readonly blockSize = signal<number>(5);
  public readonly quantizePalette = signal<boolean>(true);
  public readonly showGrid = signal<boolean>(true);
  public readonly showStreetLabels = signal<boolean>(true);
  public readonly showPois = signal<boolean>(true);
  public readonly scanlines = signal<boolean>(false);
  public readonly renderMode = signal<RenderMode>('google-maps-raster');
  public readonly isProcessing = signal<boolean>(false);

  // ── Signals de estado del aventurero ───────────────────────────────────────

  /** Posición actual del avatar en % sobre el canvas */
  public readonly avatarPosition = signal<MapPositionPercent>({ x: 38, y: 56 });

  /** Historial de posiciones para trazar el sendero amarillo */
  public readonly avatarTrail = signal<MapPositionPercent[]>([{ x: 38, y: 56 }]);

  /** Distancia total recorrida en metros (acumulado GPS real) */
  public readonly expeditionDistance = signal<number>(0);

  /** XP acumulado en esta sesión */
  public readonly expeditionXp = signal<number>(0);

  /** Misión actualmente seleccionada/activa */
  public readonly activeMission = signal<Mission | null>(null);

  /** Indica si el GPS está actualizando la posición */
  public readonly gpsActive = signal<boolean>(false);

  /** Estadísticas de renderizado del canvas */
  public readonly renderStats = signal<{
    width: number;
    height: number;
    totalBlocks: number;
    renderTimeMs: number;
  }>({ width: 600, height: 400, totalBlocks: 9600, renderTimeMs: 0 });

  // ── Computed del perfil del usuario ────────────────────────────────────────

  public readonly userProfile = computed(() => this.authService.currentUser());
  public readonly userAvatarUrl = computed(() => this.userProfile()?.picture || null);
  public readonly userName = computed(() => this.userProfile()?.name || 'Aventurero Vamoo');
  public readonly userRank = computed(() => this.userProfile()?.currentRank || 'Pichón');

  /**
   * Mapea el rango del usuario a su emoji de fauna silvestre.
   * @returns Emoji representativo del rango.
   */
  public readonly userRankEmoji = computed<string>(() => {
    const rank = (this.userRank() || '').toLowerCase();
    if (rank.includes('pichon') || rank.includes('pichón')) return '🐣';
    if (rank.includes('pinguino') || rank.includes('pingüino')) return '🐧';
    if (rank.includes('flamenco')) return '🦩';
    if (rank.includes('halcon') || rank.includes('halcón')) return '🦅';
    if (rank.includes('condor') || rank.includes('cóndor')) return '👑';
    return '🧭';
  });

  // ── Datos del mapa: solo nombres de calles (texto plano sin badge) ──────────

  /**
   * Etiquetas de calles y avenidas — texto rotado simple, sin encuadre ni hover.
   * Solo se usan para orientación vial básica.
   */
  public readonly streetTextLabels: StreetTextLabel[] = [
    { text: 'Av. Felipe Pardo y Aliaga', relX: 0.28, relY: 0.60, angleDegrees: -10,  type: 'avenue' },
    { text: 'Av. Sta. Cruz',             relX: 0.76, relY: 0.48, angleDegrees: -48,  type: 'avenue' },
    { text: 'C. Los Libertadores',       relX: 0.13, relY: 0.38, angleDegrees: 80,   type: 'street' },
    { text: 'C. La República',           relX: 0.39, relY: 0.45, angleDegrees: 80,   type: 'street' },
    { text: 'C. Agustín de la Torre',   relX: 0.58, relY: 0.36, angleDegrees: -52,  type: 'street' },
    { text: 'Ca. Alberto Lynch',         relX: 0.15, relY: 0.82, angleDegrees: -40,  type: 'street' },
    { text: 'Sta. María',               relX: 0.66, relY: 0.83, angleDegrees: -22,  type: 'street' },
    { text: 'C. Independencia',         relX: 0.93, relY: 0.42, angleDegrees: 84,   type: 'street' },
    { text: 'Teruel',                   relX: 0.86, relY: 0.82, angleDegrees: 0,    type: 'street' },
  ];

  // ── Puntos de Interés (POI) — círculos flotantes ───────────────────────────

  /**
   * Catálogo de POIs visibles como marcadores circulares flotantes sobre el mapa.
   * Cada POI tiene su color e icono según su tipo.
   */
  public readonly poiMarkers: PoiMarker[] = [
    {
      id: 'bosque-olivar',
      name: 'Bosque El Olivar',
      type: 'park',
      relX: 0.60, relY: 0.08,
      icon: '🌳',
      color: '#10b981',
      proximityRadius: 8,
    },
    {
      id: 'colegio-maria-reina',
      name: 'Colegio María Reina',
      type: 'school',
      relX: 0.48, relY: 0.91,
      icon: '🏫',
      color: '#3b82f6',
      proximityRadius: 6,
    },
    {
      id: 'farmacia-central',
      name: 'Farmacia Central',
      type: 'pharmacy',
      relX: 0.22, relY: 0.52,
      icon: '💊',
      color: '#ef4444',
      proximityRadius: 5,
    },
    {
      id: 'tienda-deportes',
      name: 'Tienda Deportes',
      type: 'store',
      relX: 0.70, relY: 0.65,
      icon: '🏪',
      color: '#f59e0b',
      proximityRadius: 5,
    },
    {
      id: 'hotel-santa-cruz',
      name: 'Hotel Santa Cruz',
      type: 'hotel',
      relX: 0.85, relY: 0.32,
      icon: '🏨',
      color: '#8b5cf6',
      proximityRadius: 5,
    },
    {
      id: 'restaurante-mirador',
      name: 'Restaurante El Mirador',
      type: 'restaurant',
      relX: 0.32, relY: 0.28,
      icon: '🍽️',
      color: '#f97316',
      proximityRadius: 5,
    },
  ];

  // ── Misiones de expedición ─────────────────────────────────────────────────

  /**
   * Lista de misiones disponibles. Cada misión apunta a un POI destino
   * y se completa al acercarse a él vía GPS.
   */
  public missions: Mission[] = [
    {
      id: 'mision-bosque',
      title: 'Explorar el Bosque',
      description: 'Dirígete al Bosque El Olivar y realiza 10 minutos de caminata en su interior.',
      targetPoiId: 'bosque-olivar',
      xpReward: 30,
      completed: false,
      active: false,
      icon: '🌳',
      estimatedDistanceM: 420,
    },
    {
      id: 'mision-colegio',
      title: 'Visita al Colegio',
      description: 'Llega hasta el Colegio María Reina para registrar tu checkpoint educativo.',
      targetPoiId: 'colegio-maria-reina',
      xpReward: 20,
      completed: false,
      active: false,
      icon: '🏫',
      estimatedDistanceM: 280,
    },
    {
      id: 'mision-farmacia',
      title: 'Check-in Farmacia',
      description: 'Pasa por la Farmacia Central y registra tu visita de bienestar.',
      targetPoiId: 'farmacia-central',
      xpReward: 15,
      completed: false,
      active: false,
      icon: '💊',
      estimatedDistanceM: 190,
    },
    {
      id: 'mision-hotel',
      title: 'Ruta Turística',
      description: 'Llega al Hotel Santa Cruz completando la ruta por Av. Santa Cruz.',
      targetPoiId: 'hotel-santa-cruz',
      xpReward: 25,
      completed: false,
      active: false,
      icon: '🏨',
      estimatedDistanceM: 560,
    },
  ];

  // ── GPS: IDs para control de ciclo de vida ─────────────────────────────────

  /** ID del watchPosition del navegador para detenerlo al destruir */
  private watchId: number | null = null;

  /** ID del setInterval de polling periódico (30 s) */
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  /** Última coordenada GPS registrada (lat/lng) */
  private lastGeoCoords: { lat: number; lng: number } | null = null;

  /**
   * Coordenadas geográficas del centro del mapa (referencia de la imagen rasterizada).
   * Se usa para proyectar lat/lng → posición % en el canvas.
   * San Isidro / Miraflores — Lima, Perú
   */
  private readonly MAP_CENTER = { lat: -12.1012, lng: -77.0319 };
  private readonly MAP_SPAN   = { latDeg: 0.012, lngDeg: 0.018 };

  // ──────────────────────────────────────────────────────────────────────────
  // Ciclo de Vida Angular
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Inicia el rastreo GPS al montar el componente.
   */
  public ngOnInit(): void {
    this.startGpsTracking();
  }

  /**
   * Renderiza el canvas al estar disponible en la vista.
   */
  public ngAfterViewInit(): void {
    if (this.refImgRef?.nativeElement?.complete) {
      this.renderCurrentMode();
    }
  }

  /**
   * Limpia watchers y timers al destruir el componente.
   */
  public ngOnDestroy(): void {
    this.stopGpsTracking();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GPS Real
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Inicia el rastreo GPS continuo usando watchPosition del browser.
   * Complementado con un polling de 30 segundos como fallback de precisión.
   */
  private startGpsTracking(): void {
    if (!('geolocation' in navigator)) return;

    this.gpsActive.set(true);

    // watchPosition: callback continuo ante cambios de posición
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleGpsUpdate(pos),
      (err) => console.warn('[PixelMap] GPS error:', err.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );

    // Polling de respaldo cada 30 segundos para asegurar actualización
    this.pollingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => this.handleGpsUpdate(pos),
        () => { /* silencioso en el polling */ },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    }, 30_000);
  }

  /**
   * Detiene el watchPosition y el intervalo de polling.
   */
  private stopGpsTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.gpsActive.set(false);
  }

  /**
   * Procesa una actualización de posición GPS:
   * - Convierte lat/lng a porcentaje sobre el canvas
   * - Actualiza el sendero amarillo
   * - Acumula distancia real (fórmula Haversine simplificada)
   * - Comprueba si el usuario llegó al POI destino de la misión activa
   *
   * @param pos - GeolocationPosition del browser
   */
  private handleGpsUpdate(pos: GeolocationPosition): void {
    const { latitude: lat, longitude: lng } = pos.coords;

    // Proyección lat/lng → posición % en el canvas (0–100)
    const xPercent = this.lngToCanvasX(lng);
    const yPercent = this.latToCanvasY(lat);

    const newPos: MapPositionPercent = {
      x: Math.max(2, Math.min(98, xPercent)),
      y: Math.max(2, Math.min(98, yPercent)),
    };

    // Calcular distancia incremental desde la última posición GPS
    if (this.lastGeoCoords) {
      const distMeters = this.haversineMeters(
        this.lastGeoCoords.lat, this.lastGeoCoords.lng, lat, lng
      );
      // Solo sumar si el movimiento es realista (> 1m, < 500m salto)
      if (distMeters > 1 && distMeters < 500) {
        this.expeditionDistance.update((d) => Math.round(d + distMeters));
      }
    }
    this.lastGeoCoords = { lat, lng };

    // Actualizar posición del avatar y sendero
    this.avatarPosition.set(newPos);
    this.avatarTrail.update((trail) => {
      const last = trail[trail.length - 1];
      // Añadir punto solo si se movió mínimo 1% en algún eje
      if (!last || Math.abs(last.x - newPos.x) > 1 || Math.abs(last.y - newPos.y) > 1) {
        return [...trail, newPos];
      }
      return trail;
    });

    // Verificar llegada a POI de misión activa
    this.checkMissionArrival(newPos);

    // Forzar detección de cambio (ChangeDetection.OnPush + callback externo)
    this.cdr.markForCheck();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Proyección Geográfica → Canvas
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Convierte longitud geográfica a porcentaje horizontal del canvas.
   * @param lng - Longitud en grados decimales
   * @returns Porcentaje (0–100) sobre el eje X del canvas
   */
  private lngToCanvasX(lng: number): number {
    const minLng = this.MAP_CENTER.lng - this.MAP_SPAN.lngDeg / 2;
    const maxLng = this.MAP_CENTER.lng + this.MAP_SPAN.lngDeg / 2;
    return ((lng - minLng) / (maxLng - minLng)) * 100;
  }

  /**
   * Convierte latitud geográfica a porcentaje vertical del canvas.
   * El eje Y está invertido (mayor lat = más arriba).
   * @param lat - Latitud en grados decimales
   * @returns Porcentaje (0–100) sobre el eje Y del canvas
   */
  private latToCanvasY(lat: number): number {
    const minLat = this.MAP_CENTER.lat - this.MAP_SPAN.latDeg / 2;
    const maxLat = this.MAP_CENTER.lat + this.MAP_SPAN.latDeg / 2;
    return (1 - (lat - minLat) / (maxLat - minLat)) * 100;
  }

  /**
   * Calcula la distancia entre dos coordenadas usando la fórmula Haversine simplificada.
   * Suficientemente precisa para distancias menores de 1 km.
   *
   * @param lat1 - Latitud punto A
   * @param lng1 - Longitud punto A
   * @param lat2 - Latitud punto B
   * @param lng2 - Longitud punto B
   * @returns Distancia aproximada en metros
   */
  private haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sistema de Misiones
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Activa una misión y la marca como seleccionada. Solo una misión activa a la vez.
   * @param mission - Misión a activar
   */
  public selectMission(mission: Mission): void {
    if (mission.completed) return;

    // Desactivar misión anterior
    this.missions = this.missions.map((m) => ({ ...m, active: m.id === mission.id }));
    this.activeMission.set(this.missions.find((m) => m.id === mission.id) ?? null);
  }

  /**
   * Cancela la misión activa sin penalización.
   */
  public cancelMission(): void {
    this.missions = this.missions.map((m) => ({ ...m, active: false }));
    this.activeMission.set(null);
  }

  /**
   * Verifica si el avatar está dentro del radio de proximidad del POI destino.
   * Si es así, completa la misión y otorga XP.
   *
   * @param pos - Posición actual del avatar en porcentaje del canvas
   */
  private checkMissionArrival(pos: MapPositionPercent): void {
    const mission = this.activeMission();
    if (!mission || mission.completed) return;

    const poi = this.poiMarkers.find((p) => p.id === mission.targetPoiId);
    if (!poi) return;

    const dx = Math.abs(pos.x - poi.relX * 100);
    const dy = Math.abs(pos.y - poi.relY * 100);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= poi.proximityRadius) {
      this.completeMission(mission);
    }
  }

  /**
   * Marca la misión como completada, otorga XP y desactiva la misión activa.
   * @param mission - Misión a completar
   */
  private completeMission(mission: Mission): void {
    this.missions = this.missions.map((m) =>
      m.id === mission.id ? { ...m, completed: true, active: false } : m
    );
    this.expeditionXp.update((xp) => xp + mission.xpReward);
    this.activeMission.set(null);
    this.cdr.markForCheck();
  }

  /**
   * Retorna el POI correspondiente a la misión activa (para mostrar la línea destino).
   */
  public getActiveMissionPoi(): PoiMarker | null {
    const mission = this.activeMission();
    if (!mission) return null;
    return this.poiMarkers.find((p) => p.id === mission.targetPoiId) ?? null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sendero SVG
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Genera el path SVG del sendero recorrido (líneas amarillas).
   * @returns Cadena de comandos SVG path (M x y L x y ...)
   */
  public getTrailSvgPath(): string {
    const trail = this.avatarTrail();
    if (trail.length === 0) return '';
    return trail.reduce((acc, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point.x} ${point.y}`;
    }, '');
  }

  /**
   * Genera el path SVG de la línea punteada hacia el POI destino de la misión activa.
   * @returns Path SVG o cadena vacía si no hay misión activa
   */
  public getMissionTargetPath(): string {
    const poi = this.getActiveMissionPoi();
    const pos = this.avatarPosition();
    if (!poi) return '';
    return `M ${pos.x} ${pos.y} L ${poi.relX * 100} ${poi.relY * 100}`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Controles del mapa y canvas
  // ──────────────────────────────────────────────────────────────────────────

  /** Callback al cargar la imagen de referencia del rasterizador. */
  public onImageLoaded(): void {
    this.renderCurrentMode();
  }

  /** Alterna la cuantización de paleta y re-renderiza. */
  public toggleQuantize(): void {
    this.quantizePalette.update((v) => !v);
    this.renderCurrentMode();
  }

  /** Alterna la cuadrícula de bloques de 5px. */
  public toggleGrid(): void {
    this.showGrid.update((v) => !v);
    this.renderCurrentMode();
  }

  /** Alterna la visibilidad de los labels de calles. */
  public toggleStreetLabels(): void {
    this.showStreetLabels.update((v) => !v);
  }

  /** Alterna la visibilidad de los POI circulares. */
  public togglePois(): void {
    this.showPois.update((v) => !v);
  }

  /** Alterna el efecto de scanlines CRT. */
  public toggleScanlines(): void {
    this.scanlines.update((v) => !v);
    this.renderCurrentMode();
  }

  /** Re-centra el avatar en el punto inicial de expedición. */
  public centerOnAvatar(): void {
    // El GPS actualizará la posición real; centramos la vista visualmente
    const pos = this.avatarPosition();
    this.avatarTrail.update((trail) => [...trail, pos]);
  }

  /** Reinicia el sendero y los contadores de expedición. */
  public resetExpedition(): void {
    const pos = this.avatarPosition();
    this.avatarTrail.set([pos]);
    this.expeditionDistance.set(0);
    this.expeditionXp.set(0);
    this.cancelMission();
  }

  /**
   * Ejecuta el pipeline de renderizado pixel-art según el modo configurado.
   */
  public renderCurrentMode(): void {
    if (!this.pixelCanvasRef?.nativeElement) return;

    this.isProcessing.set(true);
    const start = performance.now();

    if (this.renderMode() === 'google-maps-raster') {
      this.renderFromImage();
    } else {
      this.renderGeometricPrimitives();
    }

    const end = performance.now();
    this.isProcessing.set(false);

    const canvas = this.pixelCanvasRef.nativeElement;
    const bSize = this.blockSize();
    const cols = Math.floor(canvas.width / bSize);
    const rows = Math.floor(canvas.height / bSize);

    this.renderStats.set({
      width: canvas.width,
      height: canvas.height,
      totalBlocks: cols * rows,
      renderTimeMs: Math.round((end - start) * 10) / 10,
    });
  }

  /**
   * Rasteriza la imagen de Google Maps a bloques de 5px con paleta ciudad.
   */
  private renderFromImage(): void {
    const canvas = this.pixelCanvasRef.nativeElement;
    const img = this.refImgRef?.nativeElement;
    if (!img) return;

    const options: MapRasterizeOptions = {
      blockSize: this.blockSize(),
      quantizePalette: this.quantizePalette(),
      showGridLines: this.showGrid(),
      enableScanlines: this.scanlines(),
      showLabels: false,
    };

    PixelRasterizer.rasterizeMapImage(img, canvas, options);
  }

  /**
   * Renderiza primitivas geométricas (modo alternativo de demostración).
   */
  private renderGeometricPrimitives(): void {
    const canvas = this.pixelCanvasRef.nativeElement;
    const bSize = this.blockSize();
    const width = 1200;
    const height = 800;
    const gridCols = Math.floor(width / bSize);
    const gridRows = Math.floor(height / bSize);

    const engine = new PixelRasterizer(gridCols, gridRows, '#f8fafc');
    engine.fillPolygon(
      [
        { x: Math.floor(gridCols * 0.62), y: Math.floor(gridRows * 0.08) },
        { x: Math.floor(gridCols * 0.95), y: Math.floor(gridRows * 0.15) },
        { x: Math.floor(gridCols * 0.90), y: Math.floor(gridRows * 0.50) },
        { x: Math.floor(gridCols * 0.65), y: Math.floor(gridRows * 0.45) },
      ],
      '#10b981'
    );

    const roadW = Math.max(2, Math.floor(4 * (5 / bSize)));
    engine.drawBresenhamLine(0, gridRows, gridCols, Math.floor(gridRows * 0.25), roadW, '#545b6b');
    engine.renderToCanvas(canvas, bSize, { showGrid: this.showGrid(), scanlines: this.scanlines() });
  }

  /**
   * Descarga el mapa actual como PNG con etiquetas incrustadas.
   */
  public downloadCanvas(): void {
    const canvas = this.pixelCanvasRef?.nativeElement;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    if (this.showStreetLabels()) {
      const labelsToDraw: StreetLabel[] = this.streetTextLabels.map((lbl) => ({
        text: lbl.text,
        x: Math.round(lbl.relX * exportCanvas.width),
        y: Math.round(lbl.relY * exportCanvas.height),
        angleDegrees: lbl.angleDegrees,
        type: lbl.type,
      }));
      PixelRasterizer.drawStreetLabels(ctx, labelsToDraw);
    }

    const link = document.createElement('a');
    link.download = `vamoo_mapa_aventura_${this.blockSize()}px_pixelart.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }
}
