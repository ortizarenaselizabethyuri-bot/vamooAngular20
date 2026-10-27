/**
 * @fileoverview Componente PixelMapViewerComponent para visualización completa del Mapa de Aventura
 * en estética Pixel-Art nativa sobre HTML5 Canvas 2D con bloques de 5px, paleta viva de 16-bits,
 * capa vectorial de texto sobrepuesto (direcciones legibles sin pixelar) y avatar animado flotante.
 */

import {
  Component,
  ElementRef,
  ViewChild,
  signal,
  computed,
  inject,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service.js';
import { GeolocationService } from '../../services/geolocation.service.js';
import {
  PixelRasterizer,
  MapRasterizeOptions,
  StreetLabel,
} from '../../canvas-pixel-engine/pixel-rasterizer.js';

/**
 * Modo de renderizado activo del mapa.
 */
export type RenderMode = 'google-maps-raster' | 'geometric-primitives';

/**
 * Variante de imagen satelital/urbana para rasterizar en 5px.
 */
export type MapImageVariant = 'clean_standard' | 'clean_contrast';

/**
 * Interfaz que modela un punto de coordenada porcentual (0 a 100) en el mapa.
 */
export interface MapPositionPercent {
  /** Posición horizontal en porcentaje del ancho del mapa (0% a 100%) */
  x: number;
  /** Posición vertical en porcentaje del alto del mapa (0% a 100%) */
  y: number;
}

/**
 * Componente interactivo que reproduce el mapa de la ciudad en bloques discretos de 5px (Pixel-Art 16-bits),
 * superpone las direcciones como texto vectorial nítido y muestra el avatar del usuario flotando/saltando.
 */
@Component({
  selector: 'app-pixel-map-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pixel-map-viewer.component.html',
  styleUrls: ['./pixel-map-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelMapViewerComponent implements AfterViewInit {
  /** Servicio de autenticación para obtener perfil y foto del usuario */
  readonly authService = inject(AuthService);

  /** Servicio de geolocalización satelital */
  readonly geoService = inject(GeolocationService);

  /** Referencia al elemento canvas nativo de destino */
  @ViewChild('pixelCanvas') pixelCanvasRef!: ElementRef<HTMLCanvasElement>;

  /** Referencia al elemento contenedor interactivo del mapa */
  @ViewChild('mapStage') mapStageRef!: ElementRef<HTMLDivElement>;

  /** Referencia al elemento de imagen limpia de Google Maps */
  @ViewChild('refImg') refImgRef!: ElementRef<HTMLImageElement>;

  /** Variante de mapa activo (por defecto estándar limpio diurno) */
  public readonly mapVariant = signal<MapImageVariant>('clean_standard');

  /** URL de la imagen de referencia limpia sin textos incrustados */
  public readonly currentImageUrl = signal<string>('/google_maps_clean_standard.png');

  /** Tamaño de píxel/bloque atómico oficial fijado en 5px según requerimiento del proyecto */
  public readonly blockSize = signal<number>(5);

  /** Cuantización a la paleta viva de 16-bits */
  public readonly quantizePalette = signal<boolean>(true);

  /** Mostrar/ocultar cuadrícula sutil tipo voxel de 5px */
  public readonly showGrid = signal<boolean>(true);

  /** Activar/desactivar capa de texto sobrepuesto para las direcciones de calles */
  public readonly showStreetLabels = signal<boolean>(true);

  /** Activar/desactivar efecto de scanlines CRT */
  public readonly scanlines = signal<boolean>(false);

  /** Modo actual: rasterizado de mapa real o primitivas geométricas */
  public readonly renderMode = signal<RenderMode>('google-maps-raster');

  /** Estado de procesamiento del renderizado */
  public readonly isProcessing = signal<boolean>(false);

  /** Posición porcentual del avatar del aventurero sobre el mapa (0% - 100%) */
  public readonly avatarPosition = signal<MapPositionPercent>({ x: 38, y: 56 });

  /** Historial de puntos recorridos para trazar el sendero de expedición */
  public readonly avatarTrail = signal<MapPositionPercent[]>([{ x: 38, y: 56 }]);

  /** Distancia simulada o recorrida en metros */
  public readonly expeditionDistance = signal<number>(0);

  /** Puntos de experiencia (XP) ganados durante la expedición activa */
  public readonly expeditionXp = signal<number>(0);

  /** Estadísticas de rendimiento de renderizado */
  public readonly renderStats = signal<{
    width: number;
    height: number;
    totalBlocks: number;
    renderTimeMs: number;
  }>({
    width: 600,
    height: 400,
    totalBlocks: 9600,
    renderTimeMs: 0,
  });

  /** Perfil del usuario actualmente autenticado */
  public readonly userProfile = computed(() => this.authService.currentUser());

  /** Foto de perfil del usuario o null si no tiene */
  public readonly userAvatarUrl = computed(() => this.userProfile()?.picture || null);

  /** Nombre del usuario o fallback de aventurero */
  public readonly userName = computed(() => this.userProfile()?.name || 'Aventurero Vamoo');

  /** Rango competitivo del usuario en la liga de fauna silvestre */
  public readonly userRank = computed(() => this.userProfile()?.currentRank || 'Pichón');

  /** Emoji representativo de la fauna silvestre según el rango del usuario */
  public readonly userRankEmoji = computed<string>(() => {
    const rank = (this.userRank() || '').toLowerCase();
    if (rank.includes('pichon') || rank.includes('pichón')) return '🐣';
    if (rank.includes('pinguino') || rank.includes('pingüino')) return '🐧';
    if (rank.includes('flamenco')) return '🦩';
    if (rank.includes('halcon') || rank.includes('halcón')) return '🦅';
    if (rank.includes('condor') || rank.includes('cóndor')) return '👑';
    return '🧭';
  });

  /**
   * Catálogo de direcciones y puntos viales reales correspondientes a San Isidro y Miraflores
   * (Av. Felipe Pardo y Aliaga, Av. Santa Cruz, C. Los Libertadores, Bosque El Olivar, etc.)
   * configurados con proporciones relativas para el texto sobrepuesto vectorial.
   */
  public readonly relativeStreetLabels: Array<{
    text: string;
    relX: number;
    relY: number;
    angleDegrees?: number;
    type?: 'avenue' | 'street' | 'roundabout' | 'park';
    icon?: string;
  }> = [
    { text: 'Av. Felipe Pardo y Aliaga', relX: 0.28, relY: 0.60, angleDegrees: -10, type: 'avenue', icon: '🛣️' },
    { text: 'Av. Sta. Cruz', relX: 0.76, relY: 0.48, angleDegrees: -48, type: 'avenue', icon: '🛣️' },
    { text: 'C. Los Libertadores', relX: 0.13, relY: 0.38, angleDegrees: 80, type: 'street', icon: '📍' },
    { text: 'C. La República', relX: 0.39, relY: 0.45, angleDegrees: 80, type: 'street', icon: '📍' },
    { text: 'C. Agustín de la Torre Gonzales', relX: 0.58, relY: 0.36, angleDegrees: -52, type: 'street', icon: '📍' },
    { text: 'Ca. Alberto Lynch', relX: 0.15, relY: 0.82, angleDegrees: -40, type: 'street', icon: '📍' },
    { text: 'Bosque El Olivar', relX: 0.60, relY: 0.08, type: 'park', icon: '🌳' },
    { text: 'Colegio María Reina', relX: 0.48, relY: 0.91, type: 'street', icon: '🏫' },
    { text: 'Sta. María', relX: 0.66, relY: 0.83, angleDegrees: -22, type: 'street', icon: '📍' },
    { text: 'Teruel', relX: 0.86, relY: 0.82, type: 'street', icon: '📍' },
    { text: 'C. Independencia', relX: 0.93, relY: 0.42, angleDegrees: 84, type: 'street', icon: '📍' },
  ];

  /**
   * Hook del ciclo de vida ejecutado tras inicializar la vista del componente.
   * Dispara el renderizado inicial una vez que la imagen limpia esté en memoria.
   *
   * @returns void
   */
  public ngAfterViewInit(): void {
    if (this.refImgRef?.nativeElement?.complete) {
      this.renderCurrentMode();
    }
  }

  /**
   * Manejador ejecutado al completarse la carga de la imagen de referencia limpia.
   *
   * @returns void
   */
  public onImageLoaded(): void {
    this.renderCurrentMode();
  }

  /**
   * Modifica la variante de mapa activo entre estándar limpio y contraste limpio.
   *
   * @param variant - Variante elegida ('clean_standard' o 'clean_contrast').
   * @returns void
   */
  public setMapVariant(variant: MapImageVariant): void {
    this.mapVariant.set(variant);
    this.currentImageUrl.set(
      variant === 'clean_standard'
        ? '/google_maps_clean_standard.png'
        : '/google_maps_clean_contrast.png'
    );
    this.renderMode.set('google-maps-raster');
  }

  /**
   * Modifica el tamaño de bloque atómico y recalcula el canvas.
   *
   * @param size - Tamaño de píxel atómico en pantalla (por defecto 5px).
   * @returns void
   */
  public setBlockSize(size: number): void {
    this.blockSize.set(size);
    this.renderCurrentMode();
  }

  /**
   * Alterna la cuantización cromática a la paleta viva de 16-bits.
   *
   * @returns void
   */
  public toggleQuantize(): void {
    this.quantizePalette.update((val) => !val);
    this.renderCurrentMode();
  }

  /**
   * Alterna la visibilidad de la cuadrícula voxel de bloques de 5px.
   *
   * @returns void
   */
  public toggleGrid(): void {
    this.showGrid.update((val) => !val);
    this.renderCurrentMode();
  }

  /**
   * Alterna la visibilidad de la capa superior de direcciones sobrepuestas.
   *
   * @returns void
   */
  public toggleStreetLabels(): void {
    this.showStreetLabels.update((val) => !val);
  }

  /**
   * Alterna el efecto visual de líneas de escaneo CRT retro.
   *
   * @returns void
   */
  public toggleScanlines(): void {
    this.scanlines.update((val) => !val);
    this.renderCurrentMode();
  }

  /**
   * Cambia el modo de demostración entre rasterizado de mapa y primitivas matemáticas.
   *
   * @param mode - Modo deseado ('google-maps-raster' o 'geometric-primitives').
   * @returns void
   */
  public setRenderMode(mode: RenderMode): void {
    this.renderMode.set(mode);
    this.renderCurrentMode();
  }

  /**
   * Gestiona el clic interactivo del usuario sobre cualquier punto del mapa
   * para trasladar suavemente al avatar flotante y registrar el sendero de expedición.
   *
   * @param event - Evento de clic del mouse sobre el contenedor del mapa.
   * @returns void
   */
  public onMapClick(event: MouseEvent): void {
    const stage = this.mapStageRef?.nativeElement;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const xPercent = Math.max(3, Math.min(97, Math.round((clickX / rect.width) * 100)));
    const yPercent = Math.max(3, Math.min(97, Math.round((clickY / rect.height) * 100)));

    this.avatarPosition.set({ x: xPercent, y: yPercent });
    this.avatarTrail.update((trail) => [...trail, { x: xPercent, y: yPercent }]);
    this.expeditionDistance.update((dist) => dist + 35);
    this.expeditionXp.update((xp) => xp + 5);
  }

  /**
   * Simula el avance de un paso (+35m) del aventurero por la calzada principal,
   * acumulando telemetría y desplazando el avatar con animación de salto.
   *
   * @returns void
   */
  public advanceStep(): void {
    const current = this.avatarPosition();
    // Desplazamiento gradual hacia el este / norte en la avenida
    const nextX = Math.min(92, current.x + 4.5);
    const nextY = Math.max(8, current.y - 3.2);

    this.avatarPosition.set({ x: nextX, y: nextY });
    this.avatarTrail.update((trail) => [...trail, { x: nextX, y: nextY }]);
    this.expeditionDistance.update((dist) => dist + 35);
    this.expeditionXp.update((xp) => xp + 5);
  }

  /**
   * Re-centra la cámara y la posición del avatar en el punto focal de la expedición.
   *
   * @returns void
   */
  public centerOnAvatar(): void {
    this.avatarPosition.set({ x: 38, y: 56 });
    this.avatarTrail.update((trail) => [...trail, { x: 38, y: 56 }]);
  }

  /**
   * Reinicia el recorrido de expedición acumulado, restaurando el avatar a su punto inicial.
   *
   * @returns void
   */
  public resetExpedition(): void {
    this.avatarPosition.set({ x: 38, y: 56 });
    this.avatarTrail.set([{ x: 38, y: 56 }]);
    this.expeditionDistance.set(0);
    this.expeditionXp.set(0);
  }

  /**
   * Genera el trazado SVG para conectar la secuencia de puntos del sendero recorrido.
   *
   * @returns Cadena con la definición del path SVG en coordenadas relativas.
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
   * Ejecuta el pipeline de renderizado pixel-art en Canvas 2D según el modo configurado.
   *
   * @returns void
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
   * Rasteriza la imagen limpia (sin rótulos incrustados) a bloques discretos de 5px
   * con cuantización cromática a la paleta viva de 16-bits.
   *
   * @returns void
   */
  private renderFromImage(): void {
    const canvas = this.pixelCanvasRef.nativeElement;
    const img = this.refImgRef?.nativeElement;
    if (!img) return;

    const targetWidth = img.naturalWidth || 1200;
    const targetHeight = img.naturalHeight || 800;

    const options: MapRasterizeOptions = {
      blockSize: this.blockSize(),
      quantizePalette: this.quantizePalette(),
      showGridLines: this.showGrid(),
      enableScanlines: this.scanlines(),
      showLabels: false, // Las etiquetas en pantalla se renderizan en la capa HTML sobrepuesta
    };

    PixelRasterizer.rasterizeMapImage(img, canvas, options);
  }

  /**
   * Renderiza una maqueta urbana matemática pura con rotondas y calles diagonales (Bresenham).
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

    // Parque poligonal
    engine.fillPolygon(
      [
        { x: Math.floor(gridCols * 0.62), y: Math.floor(gridRows * 0.08) },
        { x: Math.floor(gridCols * 0.95), y: Math.floor(gridRows * 0.15) },
        { x: Math.floor(gridCols * 0.90), y: Math.floor(gridRows * 0.50) },
        { x: Math.floor(gridCols * 0.65), y: Math.floor(gridRows * 0.45) },
      ],
      '#2ecc71'
    );

    // Lago dentro del parque
    const lakeX = Math.floor(gridCols * 0.78);
    const lakeY = Math.floor(gridRows * 0.3);
    engine.drawBresenhamCircle(lakeX, lakeY, Math.floor(gridRows * 0.1), 0, '#0984e3', true);

    // Avenida diagonal principal
    const avenueWidth = Math.max(3, Math.floor(6 * (5 / bSize)));
    engine.drawBresenhamLine(0, gridRows, gridCols, Math.floor(gridRows * 0.25), avenueWidth, '#1e272e');
    engine.drawBresenhamLine(0, gridRows, gridCols, Math.floor(gridRows * 0.25), 1, '#ffd32a');

    // Rotonda central
    const rotondaX = Math.floor(gridCols * 0.5);
    const rotondaY = Math.floor(gridRows * 0.58);
    const radioExterior = Math.floor(gridRows * 0.24);
    const anchoPista = Math.max(2, Math.floor(5 * (5 / bSize)));

    engine.drawBresenhamCircle(rotondaX, rotondaY, radioExterior, anchoPista, '#1e272e', false);
    engine.drawBresenhamCircle(rotondaX, rotondaY, radioExterior - 2, 1, '#ffd32a', false);
    engine.drawBresenhamCircle(rotondaX, rotondaY, radioExterior - anchoPista, 0, '#00b894', true);
    engine.drawBresenhamCircle(rotondaX, rotondaY, 3, 0, '#f9ca24', true);

    // Vías perpendiculares
    const roadW = Math.max(2, Math.floor(4 * (5 / bSize)));
    engine.drawBresenhamLine(rotondaX, 0, rotondaX, rotondaY - radioExterior, roadW, '#1e272e');
    engine.drawBresenhamLine(rotondaX, rotondaY + radioExterior, rotondaX, gridRows, roadW, '#1e272e');
    engine.drawBresenhamLine(0, rotondaY, rotondaX - radioExterior, rotondaY, roadW, '#1e272e');
    engine.drawBresenhamLine(rotondaX + radioExterior, rotondaY, gridCols, rotondaY, roadW, '#1e272e');

    engine.renderToCanvas(canvas, bSize, {
      showGrid: this.showGrid(),
      scanlines: this.scanlines(),
    });
  }

  /**
   * Descarga la visualización del mapa pixel-art como un archivo PNG nativo
   * incorporando los rótulos de calles para portabilidad completa.
   *
   * @returns void
   */
  public downloadCanvas(): void {
    const canvas = this.pixelCanvasRef?.nativeElement;
    if (!canvas) return;

    // Crear un canvas temporal para exportar con las etiquetas sobrepuestas incrustadas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    // Dibujar las etiquetas sobre el canvas de exportación
    if (this.showStreetLabels()) {
      const labelsToDraw: StreetLabel[] = this.relativeStreetLabels.map((lbl) => ({
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
