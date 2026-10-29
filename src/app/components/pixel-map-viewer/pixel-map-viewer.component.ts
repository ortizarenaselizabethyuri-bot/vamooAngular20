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
import {
  CITIES_CATALOG,
  CityConfig,
  getCityConfigById,
  detectCityByCoords,
  generateCityBaseCanvas,
} from '../../canvas-pixel-engine/cities-catalog.js';
import { fetchStitchedMapCanvas } from '../../canvas-pixel-engine/real-map-tile-engine.js';

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
 * Cada nivel representa un área geográfica y escala diferente capturada desde el mismo centro GPS.
 */
export interface ZoomLevel {
  /** Etiqueta visible para el usuario */
  label: string;
  /** Icono del botón de zoom */
  icon: string;
  /** Factor multiplicador de escala sobre la imagen fuente */
  scale: number;
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
   * Array de 6 niveles de zoom internos con factores de recorte proporcionales:
   *   - Nivel 0 (CIUDAD): Escala 1.0x (vista completa panorámica)
   *   - Nivel 1 (DISTRITO): Escala 1.35x
   *   - Nivel 2 (BARRIO): Escala 1.85x (vista media, default de inicio)
   *   - Nivel 3 (SECTOR): Escala 2.5x
   *   - Nivel 4 (AVENIDA): Escala 3.3x
   *   - Nivel 5 (CALLE): Escala 4.5x (vista cercana a nivel peatonal)
   */
  public readonly ZOOM_LEVELS: ZoomLevel[] = [
    {
      label: 'CIUDAD',
      icon: '🌍',
      scale: 1.0,
      latDeg: 0.054,
      lngDeg: 0.081,
      description: 'Vista completa (~6 km)',
    },
    {
      label: 'DISTRITO',
      icon: '🗺️',
      scale: 1.35,
      latDeg: 0.040,
      lngDeg: 0.060,
      description: 'Distrito (~4 km)',
    },
    {
      label: 'BARRIO',
      icon: '🏘️',
      scale: 1.85,
      latDeg: 0.029,
      lngDeg: 0.044,
      description: 'Barrio (~2.5 km)',
    },
    {
      label: 'SECTOR',
      icon: '🏙️',
      scale: 2.5,
      latDeg: 0.021,
      lngDeg: 0.032,
      description: 'Sector (~1.5 km)',
    },
    {
      label: 'AVENIDA',
      icon: '🛣️',
      scale: 3.3,
      latDeg: 0.016,
      lngDeg: 0.024,
      description: 'Avenida (~900 m)',
    },
    {
      label: 'CALLE',
      icon: '🔍',
      scale: 4.5,
      latDeg: 0.012,
      lngDeg: 0.018,
      description: 'Calle (~400 m)',
    },
  ];

  /**
   * Índices de los 3 niveles expuestos al usuario:
   *   - Índice 0 → CIUDAD (vista amplia panorámica 1.0x)
   *   - Índice 2 → BARRIO (vista intermedia 1.85x)
   *   - Índice 5 → CALLE  (vista cercana 4.5x)
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
   * Catálogo de todas las ciudades soportadas con POIs, calles y misiones reales.
   */
  public readonly availableCities = CITIES_CATALOG;

  /**
   * Ciudad actualmente activa en el mapa.
   * Por defecto: Huancayo (Junín) para responder a la ubicación del aventurero.
   */
  public readonly currentCity = signal<CityConfig>(getCityConfigById('huancayo'));

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

  /**
   * Coordenadas GPS reales del usuario en tiempo real { lat, lng }.
   * Inicializado con las coordenadas reales de Huancayo (-12.0681, -75.2100).
   */
  public readonly gpsCoordinates = signal<{ lat: number; lng: number } | null>({
    lat: getCityConfigById('huancayo').center.lat,
    lng: getCityConfigById('huancayo').center.lng,
  });

  /**
   * Precisión del fix GPS en metros.
   * Inicialmente calibrado para Huancayo.
   */
  public readonly gpsAccuracyMeters = signal<number | null>(8);

  /**
   * Indica si las coordenadas fueron copiadas al portapapeles recientemente.
   * Se usa para mostrar el icono ✅ en el botón de copia durante 2 segundos.
   */
  public readonly coordsCopied = signal<boolean>(false);

  /**
   * URL de Google Maps apuntando a las coordenadas GPS actuales del usuario.
   * Se actualiza automáticamente cada vez que cambia gpsCoordinates.
   */
  public readonly googleMapsUrl = computed<string>(() => {
    const coords = this.gpsCoordinates();
    if (!coords) return 'https://maps.google.com';
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=17&t=m`;
  });

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
   * Se actualiza con el primer fix GPS recibido o la ciudad seleccionada.
   * Valor inicial: Huancayo (Junín, Perú).
   */
  private mapCenter = {
    lat: getCityConfigById('huancayo').center.lat,
    lng: getCityConfigById('huancayo').center.lng,
  };

  /**
   * Obtiene el span geográfico del zoom activo para las funciones de proyección.
   * @returns Objeto con latDeg y lngDeg del nivel de zoom actual
   */
  private get currentSpan(): { latDeg: number; lngDeg: number } {
    return this.ZOOM_LEVELS[this.currentZoomIndex()];
  }

  // ── Datos del mapa dinámicos según ciudad: etiquetas de calles, POIs y misiones ──

  /**
   * Etiquetas de calles y avenidas — cargadas dinámicamente según la ciudad activa.
   */
  public streetTextLabels: StreetTextLabel[] = [...getCityConfigById('huancayo').streetLabels];

  /**
   * Catálogo de POIs visibles como marcadores circulares flotantes sobre el mapa.
   * Cargados dinámicamente según la ciudad activa (Huancayo por defecto).
   */
  public poiMarkers: PoiMarker[] = [...getCityConfigById('huancayo').pois];

  /**
   * Lista de misiones activas de expedición correspondientes a la ciudad actual.
   */
  public missions: Mission[] = [...getCityConfigById('huancayo').missions];

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
   * Hook post-vista: inicializa los 6 off-screen canvases cuando la imagen o el plano estén listos.
   *
   * Usa requestAnimationFrame para dar tiempo al navegador de aplicar el layout CSS,
   * de modo que clientWidth/clientHeight del canvas tengan valores reales (no cero).
   *
   * @returns void
   */
  public ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.buildOffscreenZoomCanvases();
      this.applyZoomCanvas();
    });
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

    // Timeout de seguridad de 3 segundos para no bloquear la vista si el GPS demora
    const safetyTimer = setTimeout(() => {
      if (this.awaitingGpsFix()) {
        this.awaitingGpsFix.set(false);
        this.gpsActive.set(true);
        if (!this.zoomCanvasesReady) {
          this.buildOffscreenZoomCanvases();
          this.applyZoomCanvas();
        }
        this.cdr.markForCheck();
      }
    }, 3000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(safetyTimer);
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        // Detectar si las coordenadas corresponden a alguna ciudad del catálogo
        const detected = detectCityByCoords(lat, lng);

        // Si la precisión es mayor a 8000m (típico de IP residencial de escritorio que apunta a Lima),
        // y el aventurero está actualmente en Huancayo, conservamos Huancayo.
        const isSuspiciousDesktopIp = accuracy > 8000 && detected.id === 'lima' && this.currentCity().id === 'huancayo';

        if (!isSuspiciousDesktopIp) {
          this.mapCenter = { lat, lng };
          this.gpsCoordinates.set({ lat, lng });
          if (detected.id !== this.currentCity().id) {
            this.selectCity(detected.id);
          }
        }

        this.gpsAccuracyMeters.set(Math.round(accuracy));
        this.awaitingGpsFix.set(false);
        this.gpsActive.set(true);

        this.buildOffscreenZoomCanvases();
        this.applyZoomCanvas();
        this.startContinuousGpsTracking();
        this.cdr.markForCheck();
      },
      (err) => {
        clearTimeout(safetyTimer);
        this.awaitingGpsFix.set(false);

        if (err.code === err.PERMISSION_DENIED) {
          this.gpsPermissionDenied.set(true);
        } else {
          this.startContinuousGpsTracking();
        }
        this.cdr.markForCheck();
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }

  /**
   * Cambia la ciudad activa del mapa, cargando sus POIs, calles, misiones y plano pixel-art.
   *
   * @param cityId - Identificador de la ciudad (ej. 'huancayo', 'lima', 'cusco', 'arequipa').
   * @returns void
   */
  public selectCity(cityId: string): void {
    const config = getCityConfigById(cityId);
    this.currentCity.set(config);
    this.mapCenter = { ...config.center };

    // Actualizar coordenadas GPS para pruebas o cuando no haya fix satelital físico
    this.gpsCoordinates.set({ ...config.center });
    this.gpsAccuracyMeters.set(6);

    // Cargar los lugares (POIs), rótulos de calles y misiones correspondientes a esta ciudad
    this.poiMarkers = [...config.pois];
    this.streetTextLabels = [...config.streetLabels];
    this.missions = [...config.missions];
    this.activeMission.set(null);

    // Centrar al personaje en el corazón de la ciudad
    const centerPos: MapPositionPercent = { x: 50, y: 50 };
    this.avatarPosition.set(centerPos);
    this.avatarTrail.set([centerPos]);

    if (config.imageSourceUrl) {
      this.currentImageUrl.set(config.imageSourceUrl);
    }

    // Reconstruir el mapa en los 6 niveles de zoom para la nueva ciudad
    this.buildOffscreenZoomCanvases();
    this.applyZoomCanvas();
    this.cdr.markForCheck();
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
   * Copia las coordenadas GPS actuales al portapapeles del sistema en formato
   * "lat, lng" compatible con Google Maps.
   * Muestra el icono ✅ en el botón durante 2 segundos tras copiar.
   *
   * @returns void
   */
  public copyCoordinates(): void {
    const coords = this.gpsCoordinates();
    if (!coords) return;

    const text = `${coords.lat.toFixed(7)}, ${coords.lng.toFixed(7)}`;
    navigator.clipboard.writeText(text).then(() => {
      this.coordsCopied.set(true);
      this.cdr.markForCheck();
      // Restaurar icono de copia después de 2 segundos
      setTimeout(() => {
        this.coordsCopied.set(false);
        this.cdr.markForCheck();
      }, 2000);
    }).catch(() => {
      // Fallback para navegadores que bloquean clipboard API
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.coordsCopied.set(true);
      this.cdr.markForCheck();
      setTimeout(() => {
        this.coordsCopied.set(false);
        this.cdr.markForCheck();
      }, 2000);
    });
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

    // Actualizar coordenadas reales y precisión visibles al usuario
    this.gpsCoordinates.set({ lat, lng });
    this.gpsAccuracyMeters.set(Math.round(pos.coords.accuracy));

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
   * Propósito: Descarga y ensambla las teselas geográficas reales correspondientes
   * a la ubicación actual del usuario (Huancayo, Lima o cualquier coordenada GPS en el mundo).
   * Al utilizar teselas cartográficas de alta fidelidad, la representación pixelada conserva
   * todas las calles, curvas, avenidas, manzanas y parques reales idénticos a Google Maps.
   *
   * Aplica los 6 factores de recorte proporcional exponencial sobre el mapa real para
   * permitir el intercambio instantáneo (O(1)) entre vistas de CIUDAD, BARRIO y CALLE.
   *
   * @returns Promise<void>
   */
  private async buildOffscreenZoomCanvases(): Promise<void> {
    const visibleCanvas = this.pixelCanvasRef?.nativeElement;
    if (!visibleCanvas) return;

    this.isProcessing.set(true);
    const start = performance.now();

    // Tamaño de salida: usar dimensiones reales del canvas DOM (o fallback)
    const outW  = visibleCanvas.clientWidth  || 600;
    const outH  = visibleCanvas.clientHeight || 400;
    const bSize = this.blockSize();
    const total = this.ZOOM_LEVELS.length;  // 6

    const baseOptions: Omit<MapRasterizeOptions, 'crop'> = {
      blockSize      : bSize,
      quantizePalette: this.quantizePalette(),
      showGridLines  : this.showGrid(),
      enableScanlines: this.scanlines(),
      showLabels     : false,
    };

    const city = this.currentCity();
    // Generar plano urbano de alta fidelidad con texturas de casitas (techos terracota),
    // áreas verdes en verde esmeralda (#10b981) y calzadas de asfalto de alto contraste
    const sourceImage: CanvasImageSource = generateCityBaseCanvas(city, 1200, 800);

    const imgW = (sourceImage as any).naturalWidth || (sourceImage as any).width || 1200;
    const imgH = (sourceImage as any).naturalHeight || (sourceImage as any).height || 800;

    // Limpiar canvases anteriores
    this.offscreenCanvases = [];

    for (let i = 0; i < total; i++) {
      const offCanvas    = document.createElement('canvas');
      offCanvas.width    = outW;
      offCanvas.height   = outH;

      /**
       * Factor de recorte:
       *   - i = 0 (CIUDAD)  → factor = 1.0  → muestra el plano amplio completo
       *   - i = 2 (BARRIO)  → factor ≈ 0.44 → zoom medio del vecindario
       *   - i = 5 (CALLE)   → factor ≈ 0.20 → zoom cercano a nivel peatonal (5× ampliado)
       */
      const zoomFactor  = Math.pow(0.2, i / (total - 1));
      const cropW       = Math.round(imgW * zoomFactor);
      const cropH       = Math.round(imgH * zoomFactor);
      const cropX       = Math.round((imgW - cropW) / 2);
      const cropY       = Math.round((imgH - cropH) / 2);

      const options: MapRasterizeOptions = {
        ...baseOptions,
        crop: { x: cropX, y: cropY, width: cropW, height: cropH },
      };

      PixelRasterizer.rasterizeMapImage(sourceImage, offCanvas, options);
      this.offscreenCanvases.push(offCanvas);
    }

    this.zoomCanvasesReady = true;
    this.isProcessing.set(false);

    // Aplicar de inmediato el zoom activo al canvas visible
    this.applyZoomCanvas();

    const elapsed = performance.now() - start;
    console.info(`[PixelMap] 6 zoom canvases de alta fidelidad pre-renderizados para ${city.name} en ${elapsed.toFixed(1)} ms`);
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

  // ── Proyección Dinámica de Iconos Flotantes según Nivel de Zoom ───────────

  /**
   * Retorna el factor de escala o magnificación geométrica del nivel de zoom activo.
   * Corresponde exactamente a la transformación aplicada a los 6 canvases pre-renderizados:
   *   zoomFactor(i) = 0.2 ^ (i / 5), por lo que el factor de magnificación es 1 / zoomFactor.
   *   - Nivel 0 (CIUDAD): Escala 1.0x (vista amplia completa)
   *   - Nivel 2 (BARRIO): Escala ~1.90x (vista media del vecindario)
   *   - Nivel 5 (CALLE):  Escala 5.0x (vista cercana a nivel peatonal)
   *
   * @returns Factor multiplicador de distancia respecto al centro (1.0x a 5.0x)
   */
  public currentZoomScale(): number {
    const idx = Math.max(0, Math.min(5, this.currentZoomIndex()));
    const cropFactor = Math.pow(0.2, idx / 5);
    return 1 / cropFactor;
  }

  /**
   * Calcula la coordenada X en porcentaje (0-100%) sobre el canvas visible
   * para un elemento flotante (POI, rótulo o marcador) ubicado en relX (0.0 - 1.0).
   * Al hacer zoom in, la distancia horizontal desde el centro (0.5) se multiplica proporcionalmente.
   * Al alejar el zoom, la distancia se reduce hacia el centro.
   *
   * @param relX - Coordenada X relativa original dentro del plano de la ciudad (0.0 a 1.0).
   * @returns Porcentaje horizontal (0-100%) en el viewport actual del canvas.
   */
  public getZoomedX(relX: number): number {
    const scale = this.currentZoomScale();
    return ((relX - 0.5) * scale + 0.5) * 100;
  }

  /**
   * Calcula la coordenada Y en porcentaje (0-100%) sobre el canvas visible
   * para un elemento flotante (POI, rótulo o marcador) ubicado en relY (0.0 - 1.0).
   * Al hacer zoom in, la distancia vertical desde el centro (0.5) se multiplica proporcionalmente.
   * Al alejar el zoom, la distancia se reduce hacia el centro.
   *
   * @param relY - Coordenada Y relativa original dentro del plano de la ciudad (0.0 a 1.0).
   * @returns Porcentaje vertical (0-100%) en el viewport actual del canvas.
   */
  public getZoomedY(relY: number): number {
    const scale = this.currentZoomScale();
    return ((relY - 0.5) * scale + 0.5) * 100;
  }

  /**
   * Determina si un elemento proyectado con el zoom activo se encuentra dentro
   * del viewport visible del mapa (con un pequeño margen perimetral del 10%
   * para suavizar transiciones y evitar desbordes).
   *
   * @param relX - Coordenada X relativa original (0.0 a 1.0).
   * @param relY - Coordenada Y relativa original (0.0 a 1.0).
   * @returns True si el elemento cae dentro de la pantalla visible (-10% a 110%).
   */
  public isPointVisible(relX: number, relY: number): boolean {
    const x = this.getZoomedX(relX);
    const y = this.getZoomedY(relY);
    return x >= -10 && x <= 110 && y >= -10 && y <= 110;
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
   * Proyecta dinámicamente las coordenadas del destino con la escala de zoom activa.
   *
   * @returns Path SVG o cadena vacía si no hay misión activa
   */
  public getMissionTargetPath(): string {
    const poi = this.getActiveMissionPoi();
    const pos = this.avatarPosition();
    if (!poi) return '';
    const targetX = this.getZoomedX(poi.relX);
    const targetY = this.getZoomedY(poi.relY);
    return `M ${pos.x} ${pos.y} L ${targetX} ${targetY}`;
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
