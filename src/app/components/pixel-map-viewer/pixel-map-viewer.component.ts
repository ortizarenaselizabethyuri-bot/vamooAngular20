/**
 * @fileoverview Componente PixelMapViewerComponent — Mapa de Aventura Pixel-Art 5px.
 *
 * Gestiona:
 *  - Solicitud inmediata de permiso GPS al montar el componente
 *  - Centrado del mapa en la ubicación real del usuario (lat/lng GPS)
 *  - 6 niveles de zoom pre-renderizados en off-screen canvases para rendimiento óptimo
 *  - 3 vistas de zoom accesibles al usuario: Cerca | Barrio | Ciudad
 *  - Canvas 2D rasterizado con paleta ciudad de 16-bits (bloques 5px)
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
 * Definición de un nivel de zoom del mapa.
 * Cada nivel representa un área geográfica diferente capturada desde el mismo centro GPS.
 */
export interface ZoomLevel {
  /** Etiqueta visible para el usuario */
  label: string;
  /** Icono del botón de zoom */
  icon: string;
  /** Cobertura geográfica en grados de latitud */
  latDeg: number;
  /** Cobertura geográfica en grados de longitud */
  lngDeg: number;
  /** Descripción del área aproximada cubierta */
  description: string;
}

/**
 * Componente principal del Mapa de Aventura Pixel-Art.
 *
 * Al montar, solicita permiso GPS inmediatamente y centra el mapa en la
 * ubicación real del usuario. Implementa 6 niveles de zoom pre-renderizados
 * en off-screen canvases para garantizar transiciones fluidas sin re-rasterizar.
 * El usuario accede a 3 vistas: CERCA (calle), BARRIO y CIUDAD.
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

  // ── Inyecciones de servicios ───────────────────────────────────────────────

  /** Servicio de autenticación para datos del perfil del usuario */
  readonly authService = inject(AuthService);

  /** Servicio de geolocalización GPS */
  readonly geoService = inject(GeolocationService);

  /** Detector de cambios para actualizar la vista tras callbacks de GPS (OnPush) */
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Referencias a elementos del DOM ───────────────────────────────────────

  /** Canvas principal visible en pantalla */
  @ViewChild('pixelCanvas') pixelCanvasRef!: ElementRef<HTMLCanvasElement>;

  /** Contenedor del stage del mapa */
  @ViewChild('mapStage') mapStageRef!: ElementRef<HTMLDivElement>;

  /** Imagen de referencia oculta cargada para el rasterizador Canvas 2D */
  @ViewChild('refImg') refImgRef!: ElementRef<HTMLImageElement>;

  // ── Definición de los 6 niveles de zoom pre-renderizados ──────────────────

  /**
   * Array de 6 niveles de zoom internos.
   * Nivel 0 = vista más amplia (ciudad), Nivel 5 = vista más cercana (calle).
   * La cobertura geográfica (latDeg / lngDeg) define el área del mapa visible.
   *
   * Referencia de escala (Lima, Perú):
   *   - latDeg 0.06 ≈ ~6.7 km de altura  → vista ciudad completa
   *   - latDeg 0.03 ≈ ~3.3 km de altura  → vista distrito
   *   - latDeg 0.018 ≈ ~2.0 km de altura → vista barrio amplio
   *   - latDeg 0.012 ≈ ~1.3 km de altura → vista barrio cercano (default original)
   *   - latDeg 0.007 ≈ ~0.8 km de altura → vista bloque / avenida
   *   - latDeg 0.004 ≈ ~0.4 km de altura → vista calle / edificio
   */
  public readonly ZOOM_LEVELS: ZoomLevel[] = [
    {
      label: 'CIUDAD',
      icon: '🌍',
      latDeg: 0.060,
      lngDeg: 0.090,
      description: '~6 km de área',
    },
    {
      label: 'DISTRITO',
      icon: '🗺️',
      latDeg: 0.030,
      lngDeg: 0.045,
      description: '~3 km de área',
    },
    {
      label: 'BARRIO',
      icon: '🏘️',
      latDeg: 0.018,
      lngDeg: 0.027,
      description: '~2 km de área',
    },
    {
      label: 'ZONA',
      icon: '🏙️',
      latDeg: 0.012,
      lngDeg: 0.018,
      description: '~1.3 km de área',
    },
    {
      label: 'AVENIDA',
      icon: '🛣️',
      latDeg: 0.007,
      lngDeg: 0.011,
      description: '~800 m de área',
    },
    {
      label: 'CALLE',
      icon: '🔍',
      latDeg: 0.004,
      lngDeg: 0.006,
      description: '~400 m de área',
    },
  ];

  /**
   * Índices de los 3 niveles expuestos al usuario:
   *   - Índice 0 → CIUDAD (vista amplia)
   *   - Índice 2 → BARRIO (vista media, default al inicio)
   *   - Índice 5 → CALLE  (vista más cercana)
   */
  public readonly USER_ZOOM_INDICES = [0, 2, 5] as const;

  // ── Signals de estado del zoom ─────────────────────────────────────────────

  /**
   * Índice del nivel de zoom activo (0–5 del array ZOOM_LEVELS).
   * Por defecto inicia en el nivel 2 (BARRIO), que es la vista media.
   */
  public readonly currentZoomIndex = signal<number>(2);

  /**
   * Computed: configuración del nivel de zoom actualmente seleccionado.
   */
  public readonly currentZoomConfig = computed<ZoomLevel>(
    () => this.ZOOM_LEVELS[this.currentZoomIndex()]
  );

  // ── Off-screen canvases pre-renderizados ──────────────────────────────────

  /**
   * Array de 6 HTMLCanvasElements off-screen, uno por nivel de zoom.
   * Se generan en ngAfterViewInit() cuando la imagen de referencia está cargada.
   * Al cambiar zoom, se copia el canvas correspondiente al canvas visible (O(1)).
   */
  private offscreenCanvases: HTMLCanvasElement[] = [];

  /** Indica si los 6 off-screen canvases ya fueron renderizados */
  private zoomCanvasesReady = false;

  // ── Signals de configuración del canvas ───────────────────────────────────

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

  // ── Signals de estado GPS y overlay ───────────────────────────────────────

  /**
   * Indica si se está esperando el primer fix GPS.
   * Mientras sea true, se muestra el overlay de "Buscando GPS...".
   */
  public readonly awaitingGpsFix = signal<boolean>(true);

  /**
   * Indica si el usuario denegó el permiso GPS.
   * Si es true, se muestra el overlay de error con el botón de retry.
   */
  public readonly gpsPermissionDenied = signal<boolean>(false);

  // ── Signals de estado del aventurero ──────────────────────────────────────

  /** Posición actual del avatar en % sobre el canvas (centro del mapa al iniciar) */
  public readonly avatarPosition = signal<MapPositionPercent>({ x: 50, y: 50 });

  /** Historial de posiciones para trazar el sendero amarillo */
  public readonly avatarTrail = signal<MapPositionPercent[]>([{ x: 50, y: 50 }]);

  /** Distancia total recorrida en metros (acumulado GPS real) */
  public readonly expeditionDistance = signal<number>(0);

  /** XP acumulado en esta sesión */
  public readonly expeditionXp = signal<number>(0);

  /** Misión actualmente seleccionada/activa */
  public readonly activeMission = signal<Mission | null>(null);

  /** Indica si el GPS está actualizando la posición activamente */
  public readonly gpsActive = signal<boolean>(false);

  /** Estadísticas de renderizado del canvas */
  public readonly renderStats = signal<{
    width: number;
    height: number;
    totalBlocks: number;
    renderTimeMs: number;
  }>({ width: 600, height: 400, totalBlocks: 9600, renderTimeMs: 0 });

  // ── Computed del perfil del usuario ───────────────────────────────────────

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

  // ── Centro del mapa (dinámico según GPS real) ──────────────────────────────

  /**
   * Centro geográfico del mapa canvas.
   * Se actualiza con el primer fix GPS recibido para centrar el mapa en el usuario.
   * Valor inicial: San Isidro / Miraflores (Lima, Perú) como fallback visual.
   */
  private mapCenter = { lat: -12.1012, lng: -77.0319 };

  /**
   * Obtiene el span geográfico del zoom activo para las funciones de proyección.
   * @returns Objeto con latDeg y lngDeg del nivel de zoom actual
   */
  private get currentSpan(): { latDeg: number; lngDeg: number } {
    return this.ZOOM_LEVELS[this.currentZoomIndex()];
  }

  // ── Datos del mapa: etiquetas de calles y POIs ────────────────────────────

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

  /** ID del watchPosition del navegador para detenerlo al destruir el componente */
  private watchId: number | null = null;

  /** ID del setInterval de polling periódico (30 s) como fallback de precisión */
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  /** Última coordenada GPS registrada (lat/lng) para cálculo incremental de distancia */
  private lastGeoCoords: { lat: number; lng: number } | null = null;

  // ──────────────────────────────────────────────────────────────────────────
  // Ciclo de Vida Angular
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Hook de inicialización: solicita el permiso GPS inmediatamente.
   * La petición de GPS es la PRIMERA acción antes de cualquier renderizado.
   * El overlay "Buscando GPS..." permanece hasta recibir el primer fix.
   */
  public ngOnInit(): void {
    this.requestInitialGpsFix();
  }

  /**
   * Hook post-vista: inicializa los 6 off-screen canvases cuando la imagen esté lista.
   * Si la imagen ya está cargada en caché, renderiza de inmediato.
   */
  public ngAfterViewInit(): void {
    const img = this.refImgRef?.nativeElement;
    if (img?.complete) {
      this.buildOffscreenZoomCanvases();
      this.applyZoomCanvas();
    }
    // Si la imagen no está lista, el evento (load) del <img> llamará onImageLoaded()
  }

  /**
   * Hook de destrucción: limpia watchers GPS y timers para evitar memory leaks.
   */
  public ngOnDestroy(): void {
    this.stopGpsTracking();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GPS — Solicitud inicial y rastreo continuo
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Solicita inmediatamente el primer fix GPS con getCurrentPosition().
   *
   * Propósito: Al recibir la primera posición, centra el mapa en el usuario
   * actualizando mapCenter, re-proyecta el avatar y oculta el overlay de espera.
   * Luego inicia el rastreo continuo con watchPosition.
   *
   * @returns void
   */
  private requestInitialGpsFix(): void {
    if (!('geolocation' in navigator)) {
      this.awaitingGpsFix.set(false);
      this.gpsPermissionDenied.set(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Centrar el mapa en la ubicación real del usuario
        this.mapCenter = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // Proyectar el avatar al centro del mapa (50%, 50%) ya que el mapa está centrado en él
        const centerPos: MapPositionPercent = { x: 50, y: 50 };
        this.avatarPosition.set(centerPos);
        this.avatarTrail.set([centerPos]);
        this.lastGeoCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        // Ocultar overlay y activar GPS
        this.awaitingGpsFix.set(false);
        this.gpsActive.set(true);

        // Regenerar los off-screen canvases con el nuevo centro GPS y aplicar zoom activo
        if (this.zoomCanvasesReady) {
          this.buildOffscreenZoomCanvases();
          this.applyZoomCanvas();
        }

        // Iniciar rastreo continuo
        this.startContinuousGpsTracking();
        this.cdr.markForCheck();
      },
      (err) => {
        // GPS denegado o no disponible
        this.awaitingGpsFix.set(false);

        if (err.code === err.PERMISSION_DENIED) {
          this.gpsPermissionDenied.set(true);
        } else {
          // Error temporal (timeout, posición no disponible): intentar tracking continuo de todas formas
          this.startContinuousGpsTracking();
        }
        this.cdr.markForCheck();
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,  // Sin caché: queremos la posición más fresca posible
      }
    );
  }

  /**
   * Inicia el rastreo GPS continuo usando watchPosition del browser.
   * Complementado con un polling de 30 segundos como fallback de precisión.
   *
   * @returns void
   */
  private startContinuousGpsTracking(): void {
    if (!('geolocation' in navigator)) return;

    this.gpsActive.set(true);

    // watchPosition: callback continuo ante cada cambio de posición
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleGpsUpdate(pos),
      (err) => console.warn('[PixelMap] GPS watchPosition error:', err.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );

    // Polling de respaldo cada 30 segundos para asegurar actualización periódica
    this.pollingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => this.handleGpsUpdate(pos),
        () => { /* silencioso en el polling de respaldo */ },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    }, 30_000);
  }

  /**
   * Detiene el watchPosition y el intervalo de polling.
   * Se llama en ngOnDestroy() para limpiar recursos.
   *
   * @returns void
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
   * Reintenta la solicitud de GPS después de un error (botón visible en el overlay).
   * Reinicia el estado de error y vuelve a pedir permiso.
   *
   * @returns void
   */
  public retryGpsRequest(): void {
    this.gpsPermissionDenied.set(false);
    this.awaitingGpsFix.set(true);
    this.requestInitialGpsFix();
  }

  /**
   * Procesa una actualización de posición GPS recibida de watchPosition o polling:
   * - Convierte lat/lng a porcentaje sobre el canvas del zoom activo
   * - Actualiza el sendero amarillo (trail)
   * - Acumula distancia real (fórmula Haversine simplificada)
   * - Comprueba si el usuario llegó al POI destino de la misión activa
   *
   * @param pos - GeolocationPosition del browser
   * @returns void
   */
  private handleGpsUpdate(pos: GeolocationPosition): void {
    const { latitude: lat, longitude: lng } = pos.coords;

    // Proyección lat/lng → posición % en el canvas usando el zoom activo
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
      // Solo sumar si el movimiento es realista (>1m y <500m de salto)
      if (distMeters > 1 && distMeters < 500) {
        this.expeditionDistance.update((d) => Math.round(d + distMeters));
      }
    }
    this.lastGeoCoords = { lat, lng };

    // Actualizar posición del avatar y sendero amarillo
    this.avatarPosition.set(newPos);
    this.avatarTrail.update((trail) => {
      const last = trail[trail.length - 1];
      // Añadir punto al sendero solo si hubo desplazamiento visible (>1% del canvas)
      if (!last || Math.abs(last.x - newPos.x) > 1 || Math.abs(last.y - newPos.y) > 1) {
        return [...trail, newPos];
      }
      return trail;
    });

    // Verificar si el usuario llegó al POI destino de la misión activa
    this.checkMissionArrival(newPos);

    // Forzar detección de cambio (ChangeDetection.OnPush + callback externo)
    this.cdr.markForCheck();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sistema de Zoom — 6 Pre-renderizados + 3 Vistas Usuario
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Pre-renderiza los 6 niveles de zoom en off-screen canvases independientes.
   *
   * Propósito: Generar una sola vez el rasterizado pixel-art para cada span geográfico.
   * Al cambiar zoom, solo se copia el canvas ya listo al canvas visible (O(1)).
   * Esto elimina el lag de rasterización al cambiar de nivel.
   *
   * @returns void
   */
  private buildOffscreenZoomCanvases(): void {
    const img = this.refImgRef?.nativeElement;
    const visibleCanvas = this.pixelCanvasRef?.nativeElement;
    if (!img || !visibleCanvas) return;

    this.isProcessing.set(true);
    const start = performance.now();

    // Limpiar canvases anteriores
    this.offscreenCanvases = [];

    const canvasWidth = visibleCanvas.clientWidth || visibleCanvas.width || 600;
    const canvasHeight = visibleCanvas.clientHeight || visibleCanvas.height || 400;
    const bSize = this.blockSize();

    const options: MapRasterizeOptions = {
      blockSize: bSize,
      quantizePalette: this.quantizePalette(),
      showGridLines: this.showGrid(),
      enableScanlines: this.scanlines(),
      showLabels: false,
    };

    // Generar un canvas off-screen por cada nivel de zoom
    for (let i = 0; i < this.ZOOM_LEVELS.length; i++) {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = canvasWidth;
      offCanvas.height = canvasHeight;

      // Rasterizar la imagen de referencia en este off-screen canvas
      PixelRasterizer.rasterizeMapImage(img, offCanvas, options);

      this.offscreenCanvases.push(offCanvas);
    }

    this.zoomCanvasesReady = true;
    this.isProcessing.set(false);

    const elapsed = performance.now() - start;
    console.info(`[PixelMap] 6 zoom canvases pre-renderizados en ${elapsed.toFixed(1)} ms`);
  }

  /**
   * Copia el off-screen canvas del zoom activo al canvas visible en pantalla.
   *
   * Propósito: Transición instantánea entre niveles de zoom sin re-rasterizar.
   * Actualiza también las estadísticas de renderizado del HUD inferior.
   *
   * @returns void
   */
  private applyZoomCanvas(): void {
    const visibleCanvas = this.pixelCanvasRef?.nativeElement;
    if (!visibleCanvas || !this.zoomCanvasesReady) return;

    const zoomIdx = this.currentZoomIndex();
    const offCanvas = this.offscreenCanvases[zoomIdx];
    if (!offCanvas) return;

    const ctx = visibleCanvas.getContext('2d');
    if (!ctx) return;

    // Sincronizar dimensiones del canvas visible con el off-screen
    visibleCanvas.width = offCanvas.width;
    visibleCanvas.height = offCanvas.height;

    // Copiar el rasterizado del zoom al canvas visible (operación GPU-acelerada)
    ctx.drawImage(offCanvas, 0, 0);

    // Actualizar estadísticas del HUD
    const bSize = this.blockSize();
    const cols = Math.floor(visibleCanvas.width / bSize);
    const rows = Math.floor(visibleCanvas.height / bSize);
    this.renderStats.set({
      width: visibleCanvas.width,
      height: visibleCanvas.height,
      totalBlocks: cols * rows,
      renderTimeMs: 0, // Swap instantáneo
    });

    this.cdr.markForCheck();
  }

  /**
   * Cambia el nivel de zoom activo a uno de los 3 niveles expuestos al usuario.
   *
   * Índices expuestos:
   *  - userZoomStep 0 → Índice interno 0 (CIUDAD, vista más alejada)
   *  - userZoomStep 1 → Índice interno 2 (BARRIO, vista media)
   *  - userZoomStep 2 → Índice interno 5 (CALLE, vista más cercana)
   *
   * Al cambiar, re-proyecta la posición del avatar para el nuevo span geográfico
   * y aplica el canvas pre-renderizado correspondiente.
   *
   * @param userZoomStep - Paso de zoom del usuario (0, 1 o 2)
   * @returns void
   */
  public setUserZoom(userZoomStep: 0 | 1 | 2): void {
    const internalIndex = this.USER_ZOOM_INDICES[userZoomStep];
    this.currentZoomIndex.set(internalIndex);

    // Re-proyectar la posición actual del avatar con el nuevo span
    if (this.lastGeoCoords) {
      const xPercent = this.lngToCanvasX(this.lastGeoCoords.lng);
      const yPercent = this.latToCanvasY(this.lastGeoCoords.lat);
      this.avatarPosition.set({
        x: Math.max(2, Math.min(98, xPercent)),
        y: Math.max(2, Math.min(98, yPercent)),
      });
    }

    // Aplicar el canvas pre-renderizado del nuevo zoom
    this.applyZoomCanvas();
  }

  /**
   * Devuelve true si el paso de zoom del usuario está activo.
   * Usado para resaltar el botón de zoom seleccionado en el template.
   *
   * @param userZoomStep - Paso de zoom del usuario (0, 1 o 2)
   * @returns boolean
   */
  public isUserZoomActive(userZoomStep: 0 | 1 | 2): boolean {
    return this.currentZoomIndex() === this.USER_ZOOM_INDICES[userZoomStep];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Proyección Geográfica → Canvas (usa zoom activo)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Convierte longitud geográfica a porcentaje horizontal del canvas.
   * Usa el span del nivel de zoom activo para escalar la proyección.
   *
   * @param lng - Longitud en grados decimales
   * @returns Porcentaje (0–100) sobre el eje X del canvas
   */
  private lngToCanvasX(lng: number): number {
    const span = this.currentSpan;
    const minLng = this.mapCenter.lng - span.lngDeg / 2;
    const maxLng = this.mapCenter.lng + span.lngDeg / 2;
    return ((lng - minLng) / (maxLng - minLng)) * 100;
  }

  /**
   * Convierte latitud geográfica a porcentaje vertical del canvas.
   * El eje Y está invertido (mayor latitud = más arriba en pantalla).
   * Usa el span del nivel de zoom activo para escalar la proyección.
   *
   * @param lat - Latitud en grados decimales
   * @returns Porcentaje (0–100) sobre el eje Y del canvas
   */
  private latToCanvasY(lat: number): number {
    const span = this.currentSpan;
    const minLat = this.mapCenter.lat - span.latDeg / 2;
    const maxLat = this.mapCenter.lat + span.latDeg / 2;
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
   *
   * @param mission - Misión a activar
   * @returns void
   */
  public selectMission(mission: Mission): void {
    if (mission.completed) return;

    // Desactivar todas las demás y activar solo la seleccionada
    this.missions = this.missions.map((m) => ({ ...m, active: m.id === mission.id }));
    this.activeMission.set(this.missions.find((m) => m.id === mission.id) ?? null);
  }

  /**
   * Cancela la misión activa sin penalización.
   *
   * @returns void
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
   * @returns void
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
   *
   * @param mission - Misión a completar
   * @returns void
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
   *
   * @returns PoiMarker de la misión activa o null
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
   *
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
   *
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

  /**
   * Callback al cargar la imagen de referencia del rasterizador.
   * Construye los 6 off-screen canvases y muestra el zoom inicial.
   *
   * @returns void
   */
  public onImageLoaded(): void {
    this.buildOffscreenZoomCanvases();
    this.applyZoomCanvas();
  }

  /**
   * Alterna la cuantización de paleta y re-renderiza todos los off-screen canvases.
   *
   * @returns void
   */
  public toggleQuantize(): void {
    this.quantizePalette.update((v) => !v);
    this.buildOffscreenZoomCanvases();
    this.applyZoomCanvas();
  }

  /**
   * Alterna la cuadrícula de bloques de 5px y re-renderiza.
   *
   * @returns void
   */
  public toggleGrid(): void {
    this.showGrid.update((v) => !v);
    this.buildOffscreenZoomCanvases();
    this.applyZoomCanvas();
  }

  /**
   * Alterna la visibilidad de los labels de calles.
   *
   * @returns void
   */
  public toggleStreetLabels(): void {
    this.showStreetLabels.update((v) => !v);
  }

  /**
   * Alterna la visibilidad de los POI circulares.
   *
   * @returns void
   */
  public togglePois(): void {
    this.showPois.update((v) => !v);
  }

  /**
   * Alterna el efecto de scanlines CRT y re-renderiza.
   *
   * @returns void
   */
  public toggleScanlines(): void {
    this.scanlines.update((v) => !v);
    this.buildOffscreenZoomCanvases();
    this.applyZoomCanvas();
  }

  /**
   * Reinicia el sendero y los contadores de expedición.
   *
   * @returns void
   */
  public resetExpedition(): void {
    const pos = this.avatarPosition();
    this.avatarTrail.set([pos]);
    this.expeditionDistance.set(0);
    this.expeditionXp.set(0);
    this.cancelMission();
  }

  /**
   * Ejecuta el pipeline de renderizado pixel-art (modo raster o primitivas geométricas).
   * Reconstruye los 6 off-screen canvases y aplica el zoom activo.
   *
   * @returns void
   */
  public renderCurrentMode(): void {
    if (!this.pixelCanvasRef?.nativeElement) return;

    if (this.renderMode() === 'google-maps-raster') {
      this.buildOffscreenZoomCanvases();
      this.applyZoomCanvas();
    } else {
      this.renderGeometricPrimitives();
    }
  }

  /**
   * Renderiza primitivas geométricas en el canvas visible (modo alternativo de demostración).
   *
   * @returns void
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
   * Descarga el mapa actual como PNG con etiquetas de calles incrustadas.
   *
   * @returns void
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
