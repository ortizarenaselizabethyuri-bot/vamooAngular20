import { Application, Container, Sprite, Graphics, Assets, Text, TextStyle, ColorMatrixFilter, Texture } from 'pixi.js';
import { GeoCoordinates } from '../../services/geolocation.service.js';
import { VamooMapPalette } from './map-palette.config.js';

/**
 * Opciones de configuración para la inicialización del motor gráfico RPG.
 */
export interface RpgMapEngineOptions {
  /** Nivel de zoom inicial (por defecto 19 para vista en primera persona) */
  initialZoom?: number;
  /** Coordenadas geográficas iniciales de la cámara */
  initialCenter?: GeoCoordinates;
  /** Plantilla de URL para tiles de OpenStreetMap o CartoDB */
  tileUrlTemplate?: string;
  /** Paleta cartográfica activa para coloración y estética */
  palette?: VamooMapPalette;
  /** Callback invocado cuando la cámara cambia de coordenadas o nivel de zoom */
  onCameraChange?: (center: GeoCoordinates, zoom: number) => void;
  /** Callback invocado al iniciar el arrastre manual */
  onDragStart?: () => void;
  /** Callback invocado al finalizar el arrastre manual */
  onDragEnd?: () => void;
}

/**
 * Estructura para identificar una tesela cartográfica (Tile) en la proyección Web Mercator.
 */
export interface TileCoordinate {
  /** Índice horizontal de la tesela en la cuadrícula OSM */
  x: number;
  /** Índice vertical de la tesela en la cuadrícula OSM */
  y: number;
  /** Nivel de zoom de la tesela */
  z: number;
}

/**
 * Motor de Renderizado Cartográfico 16-bits RPG basado en Pixi.js y OpenStreetMap (RpgMapEngine).
 *
 * Propósito: Ofrecer una experiencia visual auténtica de videojuego RPG retro (SNES / GameBoy Advance)
 * sobre coordenadas GPS reales en tiempo real, respetando fielmente la geometría urbana,
 * trazado de calles, manzanas y áreas verdes mediante teselas de OpenStreetMap / CartoDB Voyager,
 * con paleta cromática "Valle Andino", marcador de aventurero animado con física de bobbing idle,
 * halo satelital pulsante y trazado de expedición con piedras rúnicas doradas.
 */
export class RpgMapEngine {
  /** Instancia principal de la aplicación WebGL de Pixi.js */
  private app: Application | null = null;

  /** Contenedor HTML padre donde se aloja el lienzo WebGL */
  private containerElement: HTMLElement | null = null;

  /** Nivel de zoom actual (restringido entre 15 y 19) */
  private zoom: number = 19;

  /** Coordenadas centrales de la cámara en el mapa */
  private center: GeoCoordinates = { lat: -12.0681, lng: -75.2100 };

  /** Coordenadas satelitales en tiempo real del aventurero */
  private userPosition: GeoCoordinates | null = null;

  /** Emoji representativo de la fauna del aventurero según su rango */
  private userEmoji: string = '🐣';

  /** Nombre del aventurero para la placa de identificación flotante */
  private userName: string = 'Aventurero Vamoo';

  /** Historial ordenado de coordenadas del sendero recorrido */
  private pathHistory: GeoCoordinates[] = [];

  /** Contenedor raíz para todos los elementos del mapa */
  private worldContainer: Container | null = null;

  /** Contenedor específico para las teselas cartográficas de fondo */
  private tileContainer: Container | null = null;

  /** Capa gráfica dedicada para el trazado de expedición (Polyline RPG) */
  private trailGraphics: Graphics | null = null;

  /** Capa gráfica dedicada para el halo satelital de precisión */
  private accuracyGraphics: Graphics | null = null;

  /** Contenedor del avatar del aventurero (sombra, cuerpo, emoji, placa) */
  private playerContainer: Container | null = null;

  /** Capa gráfica del cuerpo del avatar */
  private playerBodyGraphics: Graphics | null = null;

  /** Texto del emoji de fauna del avatar */
  private playerEmojiText: Text | null = null;

  /** Placa con el nombre del aventurero */
  private playerNameTag: Container | null = null;

  /** Caché en memoria de texturas ya descargadas para evitar descargas duplicadas */
  private readonly textureCache = new Map<string, Texture>();

  /** Mapa de teselas actualmente activas en el escenario (clave: 'z_x_y') */
  private readonly activeTileSprites = new Map<string, Sprite>();

  /** Temporizador de animación acumulado para efectos de bobbing y pulso */
  private animationTime: number = 0;

  /** Bandera que indica si el usuario está arrastrando el mapa manualmente */
  private isDragging: boolean = false;

  /** Coordenadas iniciales del puntero al iniciar un arrastre */
  private dragStartPointer: { x: number; y: number } = { x: 0, y: 0 };

  /** Centro de la cámara al iniciar un arrastre */
  private dragStartCenter: GeoCoordinates = { lat: 0, lng: 0 };

  /** Plantilla de URL para teselas cartográficas oficiales de OpenStreetMap con balanceo por subdominios (100% abiertas, sin marcas de agua ni API key) */
  private tileUrlTemplate: string = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  /** Plantilla de URL de respaldo (OSM Humanitario con tejados terracota y vegetación viva) */
  private readonly fallbackTileUrlTemplate: string = 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

  /** Callback para notificar cambios en la cámara */
  private onCameraChangeCallback?: (center: GeoCoordinates, zoom: number) => void;

  /** Callback para notificar inicio de arrastre */
  private onDragStartCallback?: () => void;

  /** Callback para notificar fin de arrastre */
  private onDragEndCallback?: () => void;

  /** Observador de cambio de tamaño del contenedor DOM */
  private resizeObserver: ResizeObserver | null = null;

  /** Bandera que indica si el motor ha sido inicializado exitosamente */
  private isInitialized: boolean = false;

  /**
   * Inicializa de manera asíncrona la aplicación Pixi.js, monta el canvas en el contenedor
   * y configura las capas gráficas, eventos de entrada y ciclo de renderizado.
   *
   * @param container - Elemento HTML del DOM donde se insertará el canvas.
   * @param options - Parámetros opcionales de configuración inicial.
   * @returns Promise<void>
   */
  async init(container: HTMLElement, options?: RpgMapEngineOptions): Promise<void> {
    this.containerElement = container;

    if (options?.initialZoom !== undefined) {
      this.zoom = Math.min(19, Math.max(15, options.initialZoom));
    }
    if (options?.initialCenter) {
      this.center = { ...options.initialCenter };
    }
    if (options?.tileUrlTemplate) {
      this.tileUrlTemplate = options.tileUrlTemplate;
    }
    if (options?.onCameraChange) {
      this.onCameraChangeCallback = options.onCameraChange;
    }
    if (options?.onDragStart) {
      this.onDragStartCallback = options.onDragStart;
    }
    if (options?.onDragEnd) {
      this.onDragEndCallback = options.onDragEnd;
    }

    // Comprobación de seguridad en entornos headless, SSR o pruebas unitarias sin soporte de lienzo
    if (typeof window === 'undefined' || typeof document === 'undefined' || !container) {
      return;
    }

    try {
      const testCanvas = document.createElement('canvas');
      const hasCanvasSupport = !!(
        testCanvas.getContext &&
        (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('2d'))
      );
      if (!hasCanvasSupport) {
        // Entorno headless de pruebas sin GPU: marcar inicializado para pruebas y salir limpiamente
        this.isInitialized = true;
        return;
      }
    } catch (e) {
      this.isInitialized = true;
      return;
    }

    try {
      this.app = new Application();
      await this.app.init({
        resizeTo: container,
        background: '#FDD7AA', // Fondo melocotón cálido Valle Andino
        antialias: false,       // Garantiza píxeles nítidos estilo 16-bits
        roundPixels: true,      // Alineación entera de píxeles retro
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      container.appendChild(this.app.canvas);

      // Crear jerarquía de capas gráficas
      this.worldContainer = new Container();
      this.tileContainer = new Container();
      this.trailGraphics = new Graphics();
      this.accuracyGraphics = new Graphics();
      this.playerContainer = new Container();

      // Aplicar filtro de saturación y contraste para estética vibrante RPG
      this.setupPaletteFilter();

      this.worldContainer.addChild(this.tileContainer);
      this.worldContainer.addChild(this.trailGraphics);
      this.worldContainer.addChild(this.accuracyGraphics);
      this.worldContainer.addChild(this.playerContainer);

      this.app.stage.addChild(this.worldContainer);

      // Crear estructura del avatar
      this.setupPlayerVisuals();

      // Configurar eventos de interacción con el ratón y táctiles
      this.setupInteractionListeners();

      // Configurar observador de redimensionamiento
      this.setupResizeObserver();

      // Conectar el ticker principal para animaciones continuas
      this.app.ticker.add((ticker) => {
        this.onTick(ticker.deltaTime);
      });

      this.isInitialized = true;

      // Renderizar el primer fotograma
      this.refreshMap();
    } catch (error) {
      console.warn('[RpgMapEngine] No se pudo inicializar WebGL en este entorno:', error);
    }
  }

  /**
   * Configura los filtros cromáticos de la capa de teselas para alinearla con la paleta Valle Andino.
   *
   * @returns void
   */
  private setupPaletteFilter(): void {
    if (!this.tileContainer || typeof document === 'undefined') return;

    try {
      const colorFilter = new ColorMatrixFilter();
      // Incrementar ligeramente el contraste para acentuar caminos y manzanas
      colorFilter.contrast(0.2, false);
      // Realzar saturación para que la vegetación y tejados adquieran viveza de videojuego
      colorFilter.saturate(0.3, false);
      this.tileContainer.filters = [colorFilter];
    } catch (e) {
      // Entornos sin soporte de shader de lienzo continúan sin filtro
    }
  }

  /**
   * Construye los elementos gráficos constitutivos del avatar del aventurero.
   *
   * @returns void
   */
  private setupPlayerVisuals(): void {
    if (!this.playerContainer) return;

    // 1. Gráficos de sombra y cuerpo circular con borde dorado y esmeralda
    this.playerBodyGraphics = new Graphics();
    this.playerContainer.addChild(this.playerBodyGraphics);

    // 2. Icono emoji representativo de la fauna
    const style = new TextStyle({
      fontSize: 22,
      align: 'center',
    });
    this.playerEmojiText = new Text({
      text: this.userEmoji,
      style,
    });
    this.playerEmojiText.anchor.set(0.5);
    this.playerContainer.addChild(this.playerEmojiText);

    // 3. Placa de nombre flotante
    this.playerNameTag = new Container();
    const tagBg = new Graphics();
    tagBg.roundRect(-45, -38, 90, 18, 4)
      .fill({ color: 0x0f172a, alpha: 0.85 })
      .stroke({ color: 0xfacc15, width: 1.5 });

    const tagTextStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center',
    });
    const tagText = new Text({
      text: this.userName,
      style: tagTextStyle,
    });
    tagText.anchor.set(0.5);
    tagText.position.set(0, -29);

    this.playerNameTag.addChild(tagBg);
    this.playerNameTag.addChild(tagText);
    this.playerContainer.addChild(this.playerNameTag);

    // Ocultar hasta que se reciba la primera posición de GPS
    this.playerContainer.visible = false;
  }

  /**
   * Vincula los oyentes de eventos táctiles y de puntero para soporte de arrastre y zoom.
   *
   * @returns void
   */
  private setupInteractionListeners(): void {
    if (!this.app || !this.app.canvas) return;

    const canvas = this.app.canvas;

    // Arrastre con puntero (ratón o táctil)
    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isDragging = true;
      this.dragStartPointer = { x: e.clientX, y: e.clientY };
      this.dragStartCenter = { ...this.center };
      if (this.onDragStartCallback) {
        this.onDragStartCallback();
      }
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDragging || !this.app) return;

      const deltaX = e.clientX - this.dragStartPointer.x;
      const deltaY = e.clientY - this.dragStartPointer.y;

      // Convertir el desplazamiento en pantalla a desplazamiento geográfico
      const startPixels = this.latLngToWorldPixels(this.dragStartCenter.lat, this.dragStartCenter.lng, this.zoom);
      const newWorldPixels = {
        x: startPixels.x - deltaX,
        y: startPixels.y - deltaY,
      };

      this.center = this.worldPixelsToLatLng(newWorldPixels.x, newWorldPixels.y, this.zoom);
      this.refreshMap();

      if (this.onCameraChangeCallback) {
        this.onCameraChangeCallback(this.center, this.zoom);
      }
    });

    const stopDragging = () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.onDragEndCallback) {
          this.onDragEndCallback();
        }
      }
    };

    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    // Zoom con rueda del ratón
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      this.stepZoom(delta);
    }, { passive: false });
  }

  /**
   * Configura la escucha reactiva al cambio de tamaño de la ventana o del contenedor padre.
   *
   * @returns void
   */
  private setupResizeObserver(): void {
    if (!this.containerElement || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.app) {
        this.refreshMap();
      }
    });
    this.resizeObserver.observe(this.containerElement);
  }

  /**
   * Ciclo de actualización continuo invocado en cada fotograma del Ticker de Pixi.js.
   * Maneja las animaciones procedurales: pulso del halo GPS y oscilación idle del avatar.
   *
   * @param deltaTime - Factor de paso de tiempo normalizado respecto a 60 FPS.
   * @returns void
   */
  private onTick(deltaTime: number): void {
    this.animationTime += deltaTime * 0.05;

    // 1. Animación de bobbing (rebote idle) del aventurero
    if (this.playerContainer && this.playerContainer.visible) {
      const bobOffset = Math.sin(this.animationTime * 4) * 2.5;

      if (this.playerBodyGraphics) {
        this.playerBodyGraphics.clear();
        // Sombra suave proyectada en el suelo
        this.playerBodyGraphics.ellipse(0, 14, 16, 6)
          .fill({ color: 0x000000, alpha: 0.28 });

        // Aro exterior dorado
        this.playerBodyGraphics.circle(0, -6 + bobOffset, 22)
          .fill({ color: 0xfacc15 });

        // Anillo interior verde esmeralda
        this.playerBodyGraphics.circle(0, -6 + bobOffset, 19)
          .fill({ color: 0x10b981 });

        // Núcleo verde selva profunda
        this.playerBodyGraphics.circle(0, -6 + bobOffset, 16)
          .fill({ color: 0x064e3b });
      }

      if (this.playerEmojiText) {
        this.playerEmojiText.position.set(0, -6 + bobOffset);
      }

      if (this.playerNameTag) {
        this.playerNameTag.position.set(0, bobOffset);
      }
    }

    // 2. Animación de expansión pulsante del halo satelital GPS
    if (this.accuracyGraphics && this.userPosition && this.app) {
      const screenPos = this.latLngToScreenPixels(this.userPosition.lat, this.userPosition.lng);
      const pulsePhase = (Math.sin(this.animationTime * 2.5) + 1) / 2; // Rango 0 a 1
      const currentRadius = 24 + pulsePhase * 16;                     // De 24px a 40px
      const currentAlpha = 0.35 - pulsePhase * 0.25;                  // De 0.35 a 0.10

      this.accuracyGraphics.clear();
      this.accuracyGraphics.circle(screenPos.x, screenPos.y, currentRadius)
        .fill({ color: 0x10b981, alpha: currentAlpha })
        .stroke({ color: 0x059669, width: 1.5, alpha: currentAlpha * 1.5 });
    }
  }

  /**
   * Refresca integralmente el escenario: calcula teselas visibles, actualiza trazado de sendero
   * y reposiciona el avatar del aventurero.
   *
   * @returns void
   */
  public refreshMap(): void {
    if (!this.app || !this.isInitialized) return;

    this.renderVisibleTiles();
    this.renderTrail();
    this.updatePlayerScreenPosition();
  }

  /**
   * Determina la ventana de visualización en píxeles y descarga/posiciona las teselas necesarias.
   *
   * @returns void
   */
  private renderVisibleTiles(): void {
    if (!this.app || !this.tileContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const centerPixels = this.latLngToWorldPixels(this.center.lat, this.center.lng, this.zoom);

    // Calcular límites en coordenadas de teselas (con margen de seguridad de 1 tesela)
    const minWorldX = centerPixels.x - width / 2 - 256;
    const maxWorldX = centerPixels.x + width / 2 + 256;
    const minWorldY = centerPixels.y - height / 2 - 256;
    const maxWorldY = centerPixels.y + height / 2 + 256;

    const minTileX = Math.floor(minWorldX / 256);
    const maxTileX = Math.floor(maxWorldX / 256);
    const minTileY = Math.floor(minWorldY / 256);
    const maxTileY = Math.floor(maxWorldY / 256);

    const neededTileKeys = new Set<string>();

    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const key = `${this.zoom}_${tx}_${ty}`;
        neededTileKeys.add(key);

        const screenX = tx * 256 - centerPixels.x + width / 2;
        const screenY = ty * 256 - centerPixels.y + height / 2;

        const existingSprite = this.activeTileSprites.get(key);
        if (existingSprite) {
          existingSprite.position.set(screenX, screenY);
        } else {
          this.loadAndPlaceTile(tx, ty, this.zoom, key, screenX, screenY);
        }
      }
    }

    // Purgar teselas que quedaron fuera del campo de visión ampliado
    for (const [key, sprite] of this.activeTileSprites.entries()) {
      if (!neededTileKeys.has(key)) {
        this.tileContainer.removeChild(sprite);
        this.activeTileSprites.delete(key);
      }
    }
  }

  /**
   * Descarga la textura de una tesela desde la caché o la red y la ubica en el escenario.
   *
   * @param x - Índice horizontal de la tesela.
   * @param y - Índice vertical de la tesela.
   * @param z - Nivel de zoom de la tesela.
   * @param key - Clave de identificación única ('z_x_y').
   * @param screenX - Coordenada horizontal en píxeles sobre la pantalla.
   * @param screenY - Coordenada vertical en píxeles sobre la pantalla.
   * @returns Promise<void>
   */
  private async loadAndPlaceTile(
    x: number,
    y: number,
    z: number,
    key: string,
    screenX: number,
    screenY: number,
  ): Promise<void> {
    const sub = ['a', 'b', 'c'][Math.abs(x + y) % 3];
    const tileUrl = this.tileUrlTemplate
      .replace('{s}', sub)
      .replace('{z}', z.toString())
      .replace('{x}', x.toString())
      .replace('{y}', y.toString());

    try {
      let texture: Texture;

      if (this.textureCache.has(key)) {
        texture = this.textureCache.get(key)!;
      } else {
        try {
          texture = await Assets.load(tileUrl);
        } catch (e) {
          // Intentar con el proveedor de respaldo en caso de fallo
          const fallbackUrl = this.fallbackTileUrlTemplate
            .replace('{z}', z.toString())
            .replace('{x}', x.toString())
            .replace('{y}', y.toString());
          texture = await Assets.load(fallbackUrl);
        }

        // Configuración de filtrado de píxel más cercano para estética 16-bits nítida
        if (texture.source) {
          texture.source.scaleMode = 'nearest';
        }

        this.textureCache.set(key, texture);
      }

      // Si aún corresponde a una tesela activa del zoom actual
      if (this.zoom === z && !this.activeTileSprites.has(key) && this.tileContainer) {
        const sprite = new Sprite(texture);
        sprite.width = 256;
        sprite.height = 256;
        sprite.position.set(screenX, screenY);

        this.tileContainer.addChild(sprite);
        this.activeTileSprites.set(key, sprite);
      }
    } catch (err) {
      // Si la tesela no pudo ser cargada (ej. desconexión), se ignora silenciosamente
    }
  }

  /**
   * Dibuja el trazado continuo de la expedición como una senda de piedras rúnicas y luz dorada.
   *
   * @returns void
   */
  private renderTrail(): void {
    if (!this.trailGraphics || this.pathHistory.length < 2) {
      if (this.trailGraphics) this.trailGraphics.clear();
      return;
    }

    this.trailGraphics.clear();

    const screenPoints = this.pathHistory.map((pt) =>
      this.latLngToScreenPixels(pt.lat, pt.lng),
    );

    // 1. Capa base: contorno tostado andino (#854d0e) para dar profundidad y contraste
    this.trailGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
    for (let i = 1; i < screenPoints.length; i++) {
      this.trailGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
    }
    this.trailGraphics.stroke({
      color: 0x854d0e,
      width: 7,
      cap: 'round',
      join: 'round',
    });

    // 2. Línea central luminosa: ámbar radiante (#f59e0b)
    this.trailGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
    for (let i = 1; i < screenPoints.length; i++) {
      this.trailGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
    }
    this.trailGraphics.stroke({
      color: 0xf59e0b,
      width: 4,
      cap: 'round',
      join: 'round',
    });

    // 3. Destellos en los vértices del recorrido (pequeñas gemas de expedición)
    for (let i = 0; i < screenPoints.length; i++) {
      const pt = screenPoints[i];
      this.trailGraphics.circle(pt.x, pt.y, 2.5)
        .fill({ color: 0xfacc15 })
        .stroke({ color: 0x78350f, width: 1 });
    }
  }

  /**
   * Actualiza la posición del contenedor del jugador sobre la pantalla en función de su GPS actual.
   *
   * @returns void
   */
  private updatePlayerScreenPosition(): void {
    if (!this.playerContainer || !this.userPosition) return;

    const screenPos = this.latLngToScreenPixels(this.userPosition.lat, this.userPosition.lng);
    this.playerContainer.position.set(screenPos.x, screenPos.y);
    this.playerContainer.visible = true;
  }

  /**
   * Actualiza la posición GPS satelital del aventurero y opcionalmente su avatar y nombre.
   *
   * @param coords - Coordenadas lat/lng actuales del usuario.
   * @param emoji - Emoji de fauna correspondiente al rango alcanzado.
   * @param name - Nombre descriptivo del aventurero.
   * @returns void
   */
  public setUserPosition(coords: GeoCoordinates, emoji?: string, name?: string): void {
    this.userPosition = { ...coords };

    if (emoji && emoji !== this.userEmoji) {
      this.userEmoji = emoji;
      if (this.playerEmojiText) {
        this.playerEmojiText.text = emoji;
      }
    }

    if (name && name !== this.userName) {
      this.userName = name;
      // Reconstruir visuales del jugador si cambió de nombre
      this.setupPlayerVisuals();
    }

    this.updatePlayerScreenPosition();
  }

  /**
   * Actualiza el sendero de expedición recorrido y redibuja la polilínea.
   *
   * @param path - Arreglo secuencial de coordenadas geográficas.
   * @returns void
   */
  public setPath(path: GeoCoordinates[]): void {
    this.pathHistory = [...path];
    this.renderTrail();
  }

  /**
   * Centra la cámara de forma instantánea sobre un par de coordenadas geográficas.
   *
   * @param coords - Coordenadas objetivo.
   * @param zoom - Nivel de zoom opcional al que se desea posicionar la cámara.
   * @returns void
   */
  public setCenter(coords: GeoCoordinates, zoom?: number): void {
    this.center = { ...coords };
    if (zoom !== undefined) {
      this.zoom = Math.min(19, Math.max(15, zoom));
    }
    this.refreshMap();

    if (this.onCameraChangeCallback) {
      this.onCameraChangeCallback(this.center, this.zoom);
    }
  }

  /**
   * Modifica el nivel de zoom asegurando que permanezca en el rango calibrado [15 - 19].
   *
   * @param zoom - Nuevo nivel de zoom objetivo.
   * @returns void
   */
  public setZoom(zoom: number): void {
    const target = Math.min(19, Math.max(15, zoom));
    if (target !== this.zoom) {
      this.zoom = target;
      // Limpiar teselas del nivel anterior para evitar colisiones visuales
      this.clearActiveTiles();
      this.refreshMap();

      if (this.onCameraChangeCallback) {
        this.onCameraChangeCallback(this.center, this.zoom);
      }
    }
  }

  /**
   * Incrementa o decrementa el nivel de zoom en un paso (+1 o -1).
   *
   * @param delta - Incremento de zoom.
   * @returns void
   */
  public stepZoom(delta: number): void {
    this.setZoom(this.zoom + delta);
  }

  /**
   * Elimina del escenario todas las teselas activas.
   *
   * @returns void
   */
  private clearActiveTiles(): void {
    if (this.tileContainer) {
      for (const sprite of this.activeTileSprites.values()) {
        this.tileContainer.removeChild(sprite);
      }
    }
    this.activeTileSprites.clear();
  }

  /**
   * Convierte coordenadas geográficas (latitud, longitud) a píxeles globales en proyección Web Mercator.
   *
   * @param lat - Latitud en grados decimales.
   * @param lng - Longitud en grados decimales.
   * @param zoom - Nivel de zoom.
   * @returns { x: number, y: number } Píxeles absolutos del mapa a dicho nivel de zoom.
   */
  public latLngToWorldPixels(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = ((lng + 180) / 360) * (256 * n);
    const latRad = (lat * Math.PI) / 180;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * (256 * n);
    return { x, y };
  }

  /**
   * Convierte píxeles globales en proyección Web Mercator a coordenadas geográficas (latitud, longitud).
   *
   * @param x - Píxel horizontal absoluto.
   * @param y - Píxel vertical absoluto.
   * @param zoom - Nivel de zoom.
   * @returns GeoCoordinates Coordenadas geográficas resultantes.
   */
  public worldPixelsToLatLng(x: number, y: number, zoom: number): GeoCoordinates {
    const n = Math.pow(2, zoom);
    const totalPixels = 256 * n;
    const lng = (x / totalPixels) * 360 - 180;
    const yNorm = 0.5 - y / totalPixels;
    const latRad = Math.atan(Math.sinh(yNorm * 2 * Math.PI));
    const lat = (latRad * 180) / Math.PI;
    return { lat, lng };
  }

  /**
   * Convierte coordenadas geográficas a píxeles locales relativos a la pantalla del canvas.
   *
   * @param lat - Latitud en grados.
   * @param lng - Longitud en grados.
   * @returns { x: number, y: number } Coordenadas en píxeles del viewport actual.
   */
  public latLngToScreenPixels(lat: number, lng: number): { x: number; y: number } {
    if (!this.app) return { x: 0, y: 0 };

    const worldPoint = this.latLngToWorldPixels(lat, lng, this.zoom);
    const centerPoint = this.latLngToWorldPixels(this.center.lat, this.center.lng, this.zoom);

    const screenX = worldPoint.x - centerPoint.x + this.app.screen.width / 2;
    const screenY = worldPoint.y - centerPoint.y + this.app.screen.height / 2;

    return { x: screenX, y: screenY };
  }

  /**
   * Retorna el nivel de zoom actual.
   *
   * @returns number
   */
  public getZoom(): number {
    return this.zoom;
  }

  /**
   * Retorna las coordenadas geográficas del centro de la cámara.
   *
   * @returns GeoCoordinates
   */
  public getCenter(): GeoCoordinates {
    return { ...this.center };
  }

  /**
   * Libera todos los recursos WebGL, desvincula eventos y destruye la aplicación Pixi.js
   * para prevenir fugas de memoria al cambiar de vista.
   *
   * @returns void
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.clearActiveTiles();
    this.textureCache.clear();

    if (this.app) {
      try {
        this.app.destroy(true, { children: true, texture: false });
      } catch (e) {
        // Ignorar si el contexto ya fue destruido
      }
      this.app = null;
    }

    this.isInitialized = false;
  }
}
