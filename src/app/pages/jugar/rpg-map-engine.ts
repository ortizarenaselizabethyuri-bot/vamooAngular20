import { Application, Container, Sprite, Graphics, Assets, Text, TextStyle, ColorMatrixFilter, Texture } from 'pixi.js';
import { GeoCoordinates } from '../../services/geolocation.service.js';
import { VamooMapPalette } from './map-palette.config.js';

/**
 * Tipo representativo de la clasificación de terreno geográfico sobre una tesela.
 */
export type TerrainType = 'park' | 'road' | 'block' | 'water' | 'unknown';

/**
 * Elemento decorativo precalculado y fijado a las coordenadas de una tesela para evitar mutaciones durante el desplazamiento.
 */
export interface CachedTileDecoration {
  /** Tipo de elemento visual RPG */
  type: 'grove' | 'house' | 'tree' | 'flowers';
  /** Coordenada horizontal local en la tesela (0 a 255) */
  localX: number;
  /** Coordenada vertical local en la tesela (0 a 255) */
  localY: number;
  /** Factor de escala proporcional dependiente del nivel de zoom */
  scale: number;
  /** Semilla determinista pseudo-aleatoria */
  seed: number;
  /** Variante botánica opcional para árboles */
  variant?: number;
}

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

  /** Capa gráfica para decoraciones de temática Pokémon (árboles clásicos, casitas andinas, flores) */
  private decorationsGraphics: Graphics | null = null;

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

  /** Caché en memoria de datos de píxeles (ImageData) para análisis y muestreo de terreno */
  private readonly tilePixelDataCache = new Map<string, ImageData>();

  /** Caché en memoria de elementos decorativos analizados y fijados permanentemente por tesela ('z_x_y') */
  private readonly tileDecorationsCache = new Map<string, CachedTileDecoration[]>();

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

  /** Plantilla de URL para teselas cartográficas de alta velocidad (CDN libre, sin bloqueos 403, sin marcas de agua ni API key) */
  private tileUrlTemplate: string =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.jpg';

  /** Plantilla de URL de respaldo (Topográfica con relieve y vegetación andina) */
  private readonly fallbackTileUrlTemplate: string =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg';

  /** Claves de teselas actualmente en proceso de descarga activa */
  private readonly loadingTileKeys = new Set<string>();

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
      this.decorationsGraphics = new Graphics();
      this.trailGraphics = new Graphics();
      this.accuracyGraphics = new Graphics();
      this.playerContainer = new Container();

      // Aplicar filtro de saturación y contraste para estética vibrante RPG
      this.setupPaletteFilter();

      this.worldContainer.addChild(this.tileContainer);
      this.worldContainer.addChild(this.decorationsGraphics);
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
      // Incrementar contraste para acentuar caminos y manzanas
      colorFilter.contrast(0.24, false);
      // Realzar saturación para que la vegetación y tejados adquieran viveza clásica de GameBoy Advance
      colorFilter.saturate(0.36, false);
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

    // 1. Gráficos del Entrenador Pokémon estilo 16-bits
    this.playerBodyGraphics = new Graphics();
    this.playerContainer.addChild(this.playerBodyGraphics);

    // 2. Icono emoji representativo de la fauna (compañero Pokémon flotante)
    const style = new TextStyle({
      fontSize: 16,
      align: 'center',
    });
    this.playerEmojiText = new Text({
      text: this.userEmoji,
      style,
    });
    this.playerEmojiText.anchor.set(0.5);
    this.playerEmojiText.position.set(-36, -34);
    this.playerContainer.addChild(this.playerEmojiText);

    // 3. Placa de nombre flotante
    this.playerNameTag = new Container();
    const tagBg = new Graphics();
    tagBg.roundRect(-42, -43, 84, 18, 4)
      .fill({ color: 0x0f172a, alpha: 0.9 })
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
    tagText.position.set(0, -34);

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

    // Desactivar zoom manual con rueda del ratón: el jugador solo tiene vista de Z19 fija
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      // La vista permanece fija en Z19; el renderizado interno gestiona la escena
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

    // 1. Animación de bobbing (rebote idle) del entrenador Pokémon
    if (this.playerContainer && this.playerContainer.visible) {
      const bobOffset = Math.sin(this.animationTime * 4.5) * 1.8;

      if (this.playerBodyGraphics) {
        this.drawPokemonTrainerSprite(this.playerBodyGraphics, bobOffset);
      }

      if (this.playerEmojiText) {
        this.playerEmojiText.position.set(-36, -34 + bobOffset);
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
   * Refresca integralmente el escenario: calcula teselas visibles, actualiza trazado de sendero,
   * renderiza elementos decorativos Pokémon y reposiciona el avatar del aventurero.
   *
   * @returns void
   */
  public refreshMap(): void {
    if (!this.app || !this.isInitialized) return;

    this.renderVisibleTiles();
    this.renderDecorations();
    this.renderTrail();
    this.updatePlayerScreenPosition();
  }

  /**
   * Renderiza los elementos decorativos precalculados y fijados a las teselas visibles,
   * ejecutando el renderizado de forma progresiva desde el centro del jugador hacia los costados,
   * calibrado a vista de Z19 con tamaño compacto de Z15 (0.45x) y carreteras 100% despejadas.
   *
   * @returns void
   */
  private renderDecorations(): void {
    if (!this.decorationsGraphics || !this.app) return;
    this.decorationsGraphics.clear();

    const scaleFactor = this.getZoomScaleFactor(this.zoom);
    if (scaleFactor <= 0) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const centerPixels = this.latLngToWorldPixels(this.center.lat, this.center.lng, this.zoom);

    // Renderizado progresivo: del centro del jugador hacia sus costados
    const radialTiles = this.getVisibleTilesRadialOrder(centerPixels, width, height);

    for (const tile of radialTiles) {
      // Obtener decoraciones fijas de la caché o generarlas si los datos de la tesela ya están listos
      let decorations = this.tileDecorationsCache.get(tile.key);
      if (!decorations) {
        if (this.tilePixelDataCache.has(tile.key)) {
          this.analyzeAndCacheTileDecorations(tile.key, tile.tx, tile.ty, this.zoom);
          decorations = this.tileDecorationsCache.get(tile.key);
        }
      }

      // Si la tesela aún está descargando, no pintar elementos transitorios para evitar parpadeos
      if (!decorations || decorations.length === 0) continue;

      const tileScreenX = tile.tx * 256 - centerPixels.x + width / 2;
      const tileScreenY = tile.ty * 256 - centerPixels.y + height / 2;

      for (const item of decorations) {
        const posX = tileScreenX + item.localX;
        const posY = tileScreenY + item.localY;

        switch (item.type) {
          case 'grove':
            this.drawPokemonGrove(this.decorationsGraphics, posX, posY, item.scale, item.seed);
            break;
          case 'house':
            this.drawPokemonHouse(this.decorationsGraphics, posX, posY, item.scale);
            break;
          case 'tree':
            this.drawPokemonTree(this.decorationsGraphics, posX, posY, item.scale, item.variant || 0);
            break;
          case 'flowers':
            this.drawWildflowerPatch(this.decorationsGraphics, posX, posY, item.scale);
            break;
        }
      }
    }
  }

  /**
   * Dibuja proceduralmente el sprite pixel-art de 16-bits de un entrenador Pokémon clásico
   * con gorra roja y visera blanca, mochila de expedición, casaca, pantalón denim y botas.
   *
   * @param g - Objeto Graphics de Pixi sobre el cual pintar el sprite.
   * @param bobOffset - Desplazamiento vertical para la animación continua de respiración/idle.
   * @returns void
   */
  private drawPokemonTrainerSprite(g: Graphics, bobOffset: number): void {
    g.clear();

    // 1. Sombra suave ovalada proyectada sobre el suelo
    g.ellipse(0, 16, 18, 6).fill({ color: 0x000000, alpha: 0.32 });

    // 2. Base de plataforma de combate Pokémon (halo circular esmeralda y oro)
    g.ellipse(0, 16, 22, 7)
      .fill({ color: 0x10b981, alpha: 0.25 })
      .stroke({ color: 0x059669, width: 1.5, alpha: 0.6 });

    // 3. Botas de montañismo (Rojo oscuro con suela de goma negra)
    g.rect(-8, 9 + bobOffset, 6, 6)
      .fill({ color: 0x991b1b })
      .stroke({ color: 0x450a0a, width: 1 });
    g.rect(-8, 14 + bobOffset, 6, 2).fill({ color: 0x18181b });

    g.rect(2, 9 + bobOffset, 6, 6)
      .fill({ color: 0x991b1b })
      .stroke({ color: 0x450a0a, width: 1 });
    g.rect(2, 14 + bobOffset, 6, 2).fill({ color: 0x18181b });

    // 4. Pantalones Denim Pokémon (Azul vaquero con costura central)
    g.rect(-7, 2 + bobOffset, 14, 8)
      .fill({ color: 0x1d4ed8 })
      .stroke({ color: 0x1e3a8a, width: 1 });
    g.rect(-1, 4 + bobOffset, 2, 6).fill({ color: 0x172554 });

    // 5. Mochila de expedición andina visible a los lados
    g.rect(-11, -8 + bobOffset, 22, 10)
      .fill({ color: 0x15803d })
      .stroke({ color: 0x052e16, width: 1 });

    // 6. Casaca de Entrenador (Rojo vivo estilo clásico Pokémon Red/GBA)
    g.rect(-8, -9 + bobOffset, 16, 12)
      .fill({ color: 0xef4444 })
      .stroke({ color: 0x7f1d1d, width: 1 });

    // Pechera / cuello blanco
    g.rect(-3, -9 + bobOffset, 6, 6).fill({ color: 0xffffff });

    // Tirantes verdes de la mochila
    g.rect(-7, -8 + bobOffset, 2, 10).fill({ color: 0x166534 });
    g.rect(5, -8 + bobOffset, 2, 10).fill({ color: 0x166534 });

    // Manos / Guantes del aventurero
    g.rect(-10, -2 + bobOffset, 3, 4).fill({ color: 0xfde047 });
    g.rect(7, -2 + bobOffset, 3, 4).fill({ color: 0xfde047 });

    // 7. Rostro y Cabeza estilo Anime Pokémon
    // Piel cálida
    g.rect(-6, -18 + bobOffset, 12, 10)
      .fill({ color: 0xfef08a })
      .stroke({ color: 0xca8a04, width: 0.5 });

    // Pelo castaño oscuro estilo clásico GBA
    g.rect(-7, -21 + bobOffset, 14, 4).fill({ color: 0x451a03 });
    g.rect(-8, -18 + bobOffset, 2, 5).fill({ color: 0x451a03 });
    g.rect(6, -18 + bobOffset, 2, 5).fill({ color: 0x451a03 });

    // Ojos anime pixelados con destello blanco
    g.rect(-4, -15 + bobOffset, 2, 3).fill({ color: 0x0f172a });
    g.rect(-4, -15 + bobOffset, 1, 1).fill({ color: 0xffffff });
    g.rect(2, -15 + bobOffset, 2, 3).fill({ color: 0x0f172a });
    g.rect(2, -15 + bobOffset, 1, 1).fill({ color: 0xffffff });

    // 8. Gorra Clásica de Entrenador Pokémon
    // Base de la gorra roja
    g.rect(-9, -24 + bobOffset, 18, 5)
      .fill({ color: 0xdc2626 })
      .stroke({ color: 0x7f1d1d, width: 1 });

    // Símbolo blanco frontal Pokéball
    g.rect(-3, -24 + bobOffset, 6, 4).fill({ color: 0xffffff });
    g.rect(-1, -23 + bobOffset, 2, 2).fill({ color: 0xdc2626 });

    // Visera blanca frontal
    g.rect(-11, -20 + bobOffset, 22, 2.5)
      .fill({ color: 0xffffff })
      .stroke({ color: 0x94a3b8, width: 0.5 });
  }

  /**
   * Obtiene el factor de escala visual para decoraciones según la regla de diseño:
   * Vista de Z19 para el jugador con tamaño duplicado de casitas (32x20px) y árboles equilibrados (escala 0.88x)
   * garantizando que las carreteras se mantengan libres y con estética Pokémon retro nítida.
   *
   * @param zoom - Nivel de zoom (fijado en Z19 para el aventurero).
   * @returns number - Factor de escala visual (0.88 para casas de 32x20px, 0 para vista macro <= 15).
   */
  public getZoomScaleFactor(zoom: number = 19): number {
    if (zoom <= 15) return 0;
    // Escala calibrada exactamente para casas de 32x20px y árboles proporcionales (0.88x)
    return 0.88;
  }

  /**
   * Determina con alta fidelidad si un color RGB corresponde a una calzada, asfalto, borde de calle o pista vehicular.
   *
   * @param r - Componente rojo (0 - 255).
   * @param g - Componente verde (0 - 255).
   * @param b - Componente azul (0 - 255).
   * @returns boolean - true si el píxel corresponde a carretera o calzada.
   */
  public isRoadPixel(r: number, g: number, b: number): boolean {
    // 1. Asfalto blanco o neutro de calzada vehicular
    if (r >= 232 && g >= 232 && b >= 226 && Math.abs(r - g) <= 12 && Math.abs(g - b) <= 12) {
      return true;
    }
    // 2. Calzada gris clara o casing de borde de calle
    if (r >= 200 && g >= 200 && b >= 200 && Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8) {
      return true;
    }
    // 3. Autopistas y vías arteriales amarillas / anaranjadas
    if (r >= 215 && g >= 175 && b <= 165 && r - b >= 40) {
      return true;
    }
    return false;
  }

  /**
   * Determina con rigor si un píxel RGB corresponde genuinamente a vegetación o parque verde.
   * Excluye deliberadamente el terreno andino beige/oliva de fondo para que solo los parques reales tengan arboledas densas.
   *
   * @param r - Componente rojo (0 - 255).
   * @param g - Componente verde (0 - 255).
   * @param b - Componente azul (0 - 255).
   * @returns boolean - true si es área verde de parque o jardín público.
   */
  public isParkPixel(r: number, g: number, b: number): boolean {
    // Parques y jardines en ESRI/OSM: Verde dominante destacado sobre el fondo
    const isBrightPark = g >= 160 && (g - r) >= 14 && (g - b) >= 18;
    const isDeepFoliage = g >= 110 && g > r * 1.10 && g > b * 1.10 && (g - r) >= 10;
    return isBrightPark || isDeepFoliage;
  }

  /**
   * Clasifica el tipo de terreno a partir de una muestra de color RGB.
   *
   * @param r - Componente rojo (0 - 255).
   * @param g - Componente verde (0 - 255).
   * @param b - Componente azul (0 - 255).
   * @returns TerrainType - 'park' si es vegetación/parque, 'road' si es asfalto/carretera, 'block' si es manzana urbana.
   */
  public classifyColorTerrain(r: number, g: number, b: number): TerrainType {
    // 1. Detección de agua (ríos, lagunas, riachuelos andinos)
    if (b > 185 && b > r + 20 && b > g + 5) {
      return 'water';
    }

    // 2. Detección de carreteras / autopistas / calles transitables (REGLA PRIORITARIA)
    if (this.isRoadPixel(r, g, b)) {
      return 'road';
    }

    // 3. Detección estricta de parques / áreas verdes / plazas / vegetación
    if (this.isParkPixel(r, g, b)) {
      return 'park';
    }

    // 4. Manzana urbana / zona residencial por defecto (tonos tierra, beige, marfil, adobe)
    return 'block';
  }

  /**
   * Comprueba si una zona circular alrededor de (localX, localY) está 100% libre de calzadas y carreteras.
   * Muestrea el centro y múltiples puntos radiales en la circunferencia y radio intermedio.
   *
   * @param key - Clave única de la tesela ('z_x_y').
   * @param localX - Coordenada horizontal central (0 - 255).
   * @param localY - Coordenada vertical central (0 - 255).
   * @param clearanceRadius - Radio de seguridad en píxeles que debe estar completamente despejado.
   * @returns boolean - true si el área está completamente limpia de carreteras; false si colisiona.
   */
  public isAreaClearOfRoad(key: string, localX: number, localY: number, clearanceRadius: number): boolean {
    const imgData = this.tilePixelDataCache.get(key);
    if (!imgData || !imgData.data || imgData.data.length < 256 * 256 * 4) {
      return this.sampleTileTerrain(key, localX, localY) !== 'road';
    }

    const data = imgData.data;

    const checkPoint = (px: number, py: number): boolean => {
      const cx = Math.max(0, Math.min(255, Math.round(px)));
      const cy = Math.max(0, Math.min(255, Math.round(py)));
      const idx = (cy * 256 + cx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return this.isRoadPixel(r, g, b);
    };

    // 1. Verificar el punto central
    if (checkPoint(localX, localY)) {
      return false;
    }

    // 2. Muestreo radial en 12 ángulos a radio completo y radio medio
    const numAngles = 12;
    for (let i = 0; i < numAngles; i++) {
      const angle = (i * 2 * Math.PI) / numAngles;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Punto en el borde exterior del radio de seguridad
      const outerX = localX + clearanceRadius * cosA;
      const outerY = localY + clearanceRadius * sinA;
      if (checkPoint(outerX, outerY)) {
        return false;
      }

      // Punto en el radio intermedio
      const midX = localX + clearanceRadius * 0.5 * cosA;
      const midY = localY + clearanceRadius * 0.5 * sinA;
      if (checkPoint(midX, midY)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtiene la clasificación de terreno de un punto local (localX, localY) dentro de una tesela.
   * Utiliza el muestreo de píxeles del ImageData de la tesela si está disponible en memoria.
   * Si la tesela no ha cargado aún o el entorno no soporta lectura de píxeles (headless / tests),
   * aplica un modelo heurístico determinista espacial para garantizar estabilidad y continuidad.
   *
   * @param key - Clave única de la tesela ('z_x_y').
   * @param localX - Coordenada horizontal local dentro de la tesela (0 a 255).
   * @param localY - Coordenada vertical local dentro de la tesela (0 a 255).
   * @returns TerrainType - Clasificación del terreno en dicho punto.
   */
  public sampleTileTerrain(key: string, localX: number, localY: number): TerrainType {
    const clampedX = Math.max(0, Math.min(255, Math.floor(localX)));
    const clampedY = Math.max(0, Math.min(255, Math.floor(localY)));

    const imgData = this.tilePixelDataCache.get(key);
    if (imgData && imgData.data && imgData.data.length >= 256 * 256 * 4) {
      const index = (clampedY * 256 + clampedX) * 4;
      const r = imgData.data[index];
      const g = imgData.data[index + 1];
      const b = imgData.data[index + 2];
      return this.classifyColorTerrain(r, g, b);
    }

    // Heurística de respaldo cuando los píxeles no están disponibles en el DOM / tests
    return this.fallbackDeterministicTerrain(key, clampedX, clampedY);
  }

  /**
   * Heurística determinista para clasificar el terreno cuando los píxeles reales no están disponibles
   * (p. ej., durante pruebas unitarias automatizadas o retrasos de red).
   *
   * @param key - Clave única de la tesela ('z_x_y').
   * @param x - Coordenada horizontal local (0 - 255).
   * @param y - Coordenada vertical local (0 - 255).
   * @returns TerrainType - Clasificación simulada determinista.
   */
  private fallbackDeterministicTerrain(key: string, x: number, y: number): TerrainType {
    // Cuadrícula simulada de calles cada 64px
    const nearRoadX = (x % 64) < 12;
    const nearRoadY = (y % 64) < 12;
    if (nearRoadX || nearRoadY) {
      return 'road';
    }

    // Generación matemática determinista pseudo-aleatoria para áreas verdes
    const hash = Math.sin(x * 12.9898 + y * 78.233 + key.length * 43.123) * 43758.5453;
    const value = Math.abs(hash - Math.floor(hash));

    if (value > 0.68) {
      return 'park';
    }

    return 'block';
  }

  /**
   * Extrae los datos de píxeles brutos (ImageData) de una imagen de tesela mediante un lienzo offscreen
   * y los almacena en caché en memoria para muestreo instantáneo de terreno.
   *
   * @param key - Clave única de la tesela ('z_x_y').
   * @param img - Elemento HTMLImageElement cargado con la textura de la tesela.
   * @returns void
   */
  private extractAndStoreTilePixels(key: string, img: HTMLImageElement): void {
    try {
      if (typeof document === 'undefined') return;
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 256, 256);
      const imgData = ctx.getImageData(0, 0, 256, 256);
      this.tilePixelDataCache.set(key, imgData);

      // Limitar tamaño de caché a 48 teselas activas para mantener memoria baja (< 12MB)
      if (this.tilePixelDataCache.size > 48) {
        const oldestKey = this.tilePixelDataCache.keys().next().value;
        if (oldestKey) {
          this.tilePixelDataCache.delete(oldestKey);
        }
      }
    } catch (e) {
      // Ignorar de forma segura si el lienzo está protegido por CORS o entorno headless
    }
  }

  /**
   * Analiza el terreno de una tesela y almacena en caché sus elementos decorativos fijos
   * (casitas andinas espaciadas y arboledas densas exclusivas de parques), aplicando la regla
   * estricta de despeje para carreteras.
   *
   * @param key - Clave única de la tesela ('z_x_y').
   * @param tx - Índice horizontal de la tesela.
   * @param ty - Índice vertical de la tesela.
   * @param z - Nivel de zoom de la tesela.
   * @returns void
   */
  public analyzeAndCacheTileDecorations(key: string, tx: number, ty: number, z: number): void {
    const scaleFactor = this.getZoomScaleFactor(z);
    if (scaleFactor <= 0) {
      this.tileDecorationsCache.set(key, []);
      return;
    }

    const items: CachedTileDecoration[] = [];

    // Paso amplio para manzanas urbanas (72px a Z19, 84px a Z18, etc.) para evitar saturación y dejar espacio limpio
    const gridStep = z === 19 ? 72 : z === 18 ? 84 : z === 17 ? 96 : 112;

    for (let localX = gridStep / 2; localX < 256; localX += gridStep) {
      for (let localY = gridStep / 2; localY < 256; localY += gridStep) {
        const seed = Math.abs(
          Math.sin((tx * 256 + localX) * 12.9898 + (ty * 256 + localY) * 78.233 + z * 37.719) * 43758.5453
        ) % 1;

        const terrain = this.sampleTileTerrain(key, localX, localY);

        if (terrain === 'park') {
          // 1. ZONA EXCLUSIVA DE PARQUE: Arboleda densa solo si está 100% libre de calzadas
          if (this.isAreaClearOfRoad(key, localX, localY, 28 * scaleFactor)) {
            items.push({
              type: 'grove',
              localX,
              localY,
              scale: scaleFactor,
              seed,
            });
          }
        } else if (terrain === 'block') {
          // 2. MANZANA RESIDENCIAL: Casitas andinas limpiamente espaciadas
          // REGLA ESTRICTA DE CARRETERAS: clearanceRadius de 22px
          if (this.isAreaClearOfRoad(key, localX, localY, 22 * scaleFactor)) {
            if (seed > 0.40 && seed < 0.85) {
              items.push({
                type: 'house',
                localX,
                localY,
                scale: scaleFactor,
                seed,
              });
            } else if (seed >= 0.85) {
              // Árbol individual de jardín residencial (NO arboleda densa)
              items.push({
                type: 'tree',
                localX,
                localY,
                scale: scaleFactor * 0.85,
                seed,
                variant: seed > 0.92 ? 2 : 0,
              });
            } else if (seed < 0.18) {
              items.push({
                type: 'flowers',
                localX,
                localY,
                scale: scaleFactor,
                seed,
              });
            }
          }
        }
      }
    }

    this.tileDecorationsCache.set(key, items);

    // Limitar tamaño de caché de decoraciones a 64 teselas para ahorrar memoria
    if (this.tileDecorationsCache.size > 64) {
      const oldestKey = this.tileDecorationsCache.keys().next().value;
      if (oldestKey) {
        this.tileDecorationsCache.delete(oldestKey);
      }
    }
  }

  /**
   * Dibuja una arboleda densa de árboles clásicos de Pokémon en áreas clasificadas como parque o reserva natural.
   * Agrupa entre 4 y 7 árboles con copas superpuestas, sombras envolventes y parches de flores silvestres.
   *
   * @param g - Objeto Graphics sobre el cual pintar la arboleda.
   * @param centerX - Coordenada horizontal central del bosque en la pantalla.
   * @param centerY - Coordenada vertical central del bosque en la pantalla.
   * @param scale - Factor de escala visual dependiente del nivel de zoom actual.
   * @param seed - Semilla pseudo-aleatoria para variar sutilmente la disposición de copas.
   * @returns void
   */
  private drawPokemonGrove(g: Graphics, centerX: number, centerY: number, scale: number, seed: number): void {
    if (scale <= 0) return;

    // Sombra colectiva de base del bosque
    g.ellipse(centerX, centerY + 12 * scale, 34 * scale, 14 * scale)
      .fill({ color: 0x000000, alpha: 0.28 });

    // Configuración de offsets relativos para generar la masa vegetal densa
    const treeOffsets: Array<[number, number, number]> = [
      [-14 * scale, -6 * scale, 0],
      [14 * scale, -5 * scale, 1],
      [-7 * scale, 8 * scale, 0],
      [10 * scale, 7 * scale, 2],
      [0, -12 * scale, 1],
    ];

    if (seed > 0.35) {
      treeOffsets.push([-22 * scale, 2 * scale, 0]);
    }
    if (seed > 0.65) {
      treeOffsets.push([22 * scale, 2 * scale, 2]);
    }

    // Dibujar cada árbol de la arboleda en orden de profundidad (Y ascendente)
    treeOffsets.sort((a, b) => a[1] - b[1]);

    for (const [ox, oy, variant] of treeOffsets) {
      this.drawPokemonTree(g, centerX + ox, centerY + oy, scale * 0.95, variant);
    }

    // Flores silvestres en los bordes del claro del parque
    this.drawWildflowerPatch(g, centerX - 18 * scale, centerY + 14 * scale, scale);
    if (seed > 0.5) {
      this.drawWildflowerPatch(g, centerX + 16 * scale, centerY + 12 * scale, scale);
    }
  }

  /**
   * Dibuja un árbol esférico clásico al estilo de los juegos de Pokémon de GameBoy Advance / SNES.
   * Escala dinámicamente sus dimensiones proporcionales a partir del nivel de zoom activo.
   *
   * @param g - Objeto Graphics sobre el cual pintar el árbol.
   * @param x - Posición horizontal sobre la pantalla.
   * @param y - Posición vertical sobre la pantalla.
   * @param scale - Factor de escala proporcional por nivel de zoom (por defecto 1.0).
   * @param variant - Variante botánica (0: esférico clásico, 1: copa alta, 2: pino andino).
   * @returns void
   */
  private drawPokemonTree(g: Graphics, x: number, y: number, scale: number = 1.0, variant: number = 0): void {
    if (scale <= 0) return;

    // 1. Sombra ovalada en el suelo
    g.ellipse(x, y + 15 * scale, 14 * scale, 5 * scale)
      .fill({ color: 0x000000, alpha: 0.25 });

    // 2. Tronco de madera leñosa
    g.rect(x - 3 * scale, y + 7 * scale, 6 * scale, 9 * scale)
      .fill({ color: 0x78350f })
      .stroke({ color: 0x451a03, width: Math.max(1, 1 * scale) });

    if (variant === 2) {
      // Variante Pino Andino (conífera clásica de valle de altura)
      g.poly([
        x - 13 * scale, y + 8 * scale,
        x, y - 18 * scale,
        x + 13 * scale, y + 8 * scale,
      ]).fill({ color: 0x064e3b });

      g.poly([
        x - 11 * scale, y + 6 * scale,
        x, y - 16 * scale,
        x + 11 * scale, y + 6 * scale,
      ]).fill({ color: 0x166534 });

      g.poly([
        x - 8 * scale, y + 3 * scale,
        x, y - 13 * scale,
        x + 8 * scale, y + 3 * scale,
      ]).fill({ color: 0x15803d });

      g.poly([
        x - 5 * scale, y,
        x, y - 10 * scale,
        x + 5 * scale, y,
      ]).fill({ color: 0x4ade80 });
      return;
    }

    // 3. Copa esférica Pokémon en 4 niveles de sombreado pixel-art
    const r = (variant === 1 ? 16 : 14) * scale;
    g.circle(x, y, r).fill({ color: 0x064e3b });                         // Contorno oscuro profundo
    g.circle(x, y - 1 * scale, r * 0.86).fill({ color: 0x166534 });      // Sombra inferior follaje
    g.circle(x, y - 3 * scale, r * 0.65).fill({ color: 0x15803d });      // Verde medio follaje
    g.circle(x - 2 * scale, y - 5 * scale, r * 0.36).fill({ color: 0x4ade80 }); // Destello de luz superior

    // Brillo adicional pixel estilo GBA
    if (scale >= 0.7) {
      g.rect(x - 3 * scale, y - 6 * scale, 2 * scale, 2 * scale).fill({ color: 0x86efac });
    }
  }

  /**
   * Dibuja una casita andina con tejado terracota al estilo de los edificios de pueblos Pokémon.
   * Escala sus dimensiones de muros, ventanas, puerta y chimenea según el factor de zoom.
   *
   * @param g - Objeto Graphics sobre el cual pintar la casita.
   * @param x - Posición horizontal sobre la pantalla.
   * @param y - Posición vertical sobre la pantalla.
   * @param scale - Factor de escala proporcional por nivel de zoom (por defecto 1.0).
   * @returns void
   */
  private drawPokemonHouse(g: Graphics, x: number, y: number, scale: number = 1.0): void {
    if (scale <= 0) return;

    // Sombra proyectada
    g.rect(x - 20 * scale, y + 17 * scale, 40 * scale, 7 * scale)
      .fill({ color: 0x000000, alpha: 0.2 });

    // Paredes de adobe / marfil cálido
    g.rect(x - 18 * scale, y - 2 * scale, 36 * scale, 22 * scale)
      .fill({ color: 0xffedd5 })
      .stroke({ color: 0x7c2d12, width: Math.max(1, 1.5 * scale) });

    // Puerta de madera
    g.rect(x - 4 * scale, y + 6 * scale, 8 * scale, 14 * scale)
      .fill({ color: 0x854d0e })
      .stroke({ color: 0x451a03, width: Math.max(0.8, 1 * scale) });
    g.circle(x + 2 * scale, y + 13 * scale, Math.max(0.8, 1 * scale)).fill({ color: 0xfacc15 });

    // Ventanas con marco azul y reflejo
    g.rect(x - 13 * scale, y + 3 * scale, 6 * scale, 6 * scale)
      .fill({ color: 0x60a5fa })
      .stroke({ color: 0x1e3a8a, width: Math.max(0.8, 1 * scale) });
    g.rect(x + 7 * scale, y + 3 * scale, 6 * scale, 6 * scale)
      .fill({ color: 0x60a5fa })
      .stroke({ color: 0x1e3a8a, width: Math.max(0.8, 1 * scale) });

    // Techo a dos aguas de teja andina viva (#f97316)
    g.poly([
      x - 22 * scale, y - 2 * scale,
      x, y - 18 * scale,
      x + 22 * scale, y - 2 * scale,
    ])
      .fill({ color: 0xf97316 })
      .stroke({ color: 0x7c2d12, width: Math.max(1.2, 2 * scale) });

    // Chimenea con hilera de ladrillo
    g.rect(x + 10 * scale, y - 20 * scale, 5 * scale, 8 * scale)
      .fill({ color: 0x9a3412 })
      .stroke({ color: 0x431407, width: Math.max(0.8, 1 * scale) });

    // Voluta de humo animada/decorativa si la escala es suficiente
    if (scale >= 0.8) {
      g.circle(x + 12 * scale, y - 23 * scale, 2 * scale).fill({ color: 0xffffff, alpha: 0.7 });
      g.circle(x + 14 * scale, y - 27 * scale, 2.5 * scale).fill({ color: 0xffffff, alpha: 0.45 });
    }
  }

  /**
   * Dibuja un parche de hierba alta y flores silvestres estilo Pokémon.
   * Escala sus tallos y pétalos según el factor de zoom activo.
   *
   * @param g - Objeto Graphics sobre el cual pintar el parche.
   * @param x - Posición horizontal sobre la pantalla.
   * @param y - Posición vertical sobre la pantalla.
   * @param scale - Factor de escala proporcional por nivel de zoom (por defecto 1.0).
   * @returns void
   */
  private drawWildflowerPatch(g: Graphics, x: number, y: number, scale: number = 1.0): void {
    if (scale <= 0) return;

    // Puntas de hierba alta Pokémon
    g.rect(x - 6 * scale, y - 2 * scale, 2 * scale, 6 * scale).fill({ color: 0x15803d });
    g.rect(x - 2 * scale, y - 4 * scale, 2 * scale, 8 * scale).fill({ color: 0x16a34a });
    g.rect(x + 2 * scale, y - 3 * scale, 2 * scale, 7 * scale).fill({ color: 0x15803d });
    g.rect(x + 6 * scale, y - 1 * scale, 2 * scale, 5 * scale).fill({ color: 0x22c55e });

    // Flor silvestre roja
    g.rect(x - 5 * scale, y - 3 * scale, 2 * scale, 2 * scale).fill({ color: 0xef4444 });
    g.rect(x - 4 * scale, y - 2 * scale, 1 * scale, 1 * scale).fill({ color: 0xfacc15 });

    // Flor silvestre amarilla
    g.rect(x + 3 * scale, y - 4 * scale, 2 * scale, 2 * scale).fill({ color: 0xfacc15 });
    g.rect(x + 4 * scale, y - 3 * scale, 1 * scale, 1 * scale).fill({ color: 0xf97316 });
  }

  /**
   * Obtiene la lista de teselas visibles ordenadas progresivamente en anillos concéntricos
   * radiales desde el centro del aventurero hacia los costados de la pantalla.
   *
   * @param centerPixels - Coordenadas del centro en píxeles de mundo Web Mercator.
   * @param width - Ancho en píxeles del viewport de pantalla.
   * @param height - Alto en píxeles del viewport de pantalla.
   * @returns Array<{ tx: number; ty: number; dist: number; key: string }> Teselas ordenadas del centro hacia afuera.
   */
  public getVisibleTilesRadialOrder(
    centerPixels: { x: number; y: number },
    width: number,
    height: number,
  ): Array<{ tx: number; ty: number; dist: number; key: string }> {
    const centerTileX = centerPixels.x / 256;
    const centerTileY = centerPixels.y / 256;

    const minWorldX = centerPixels.x - width / 2 - 256;
    const maxWorldX = centerPixels.x + width / 2 + 256;
    const minWorldY = centerPixels.y - height / 2 - 256;
    const maxWorldY = centerPixels.y + height / 2 + 256;

    const minTileX = Math.floor(minWorldX / 256);
    const maxTileX = Math.floor(maxWorldX / 256);
    const minTileY = Math.floor(minWorldY / 256);
    const maxTileY = Math.floor(maxWorldY / 256);

    const tiles: Array<{ tx: number; ty: number; dist: number; key: string }> = [];

    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const key = `${this.zoom}_${tx}_${ty}`;
        // Distancia euclídea normalizada al centro de la cámara del aventurero
        const dist = Math.hypot((tx + 0.5) - centerTileX, (ty + 0.5) - centerTileY);
        tiles.push({ tx, ty, dist, key });
      }
    }

    // Ordenamiento progresivo: el centro del jugador primero, expandiéndose hacia los costados
    tiles.sort((a, b) => a.dist - b.dist);

    return tiles;
  }

  /**
   * Determina la ventana de visualización en píxeles y descarga/posiciona las teselas necesarias
   * en orden progresivo radial desde el centro del aventurero hacia los costados.
   *
   * @returns void
   */
  private renderVisibleTiles(): void {
    if (!this.app || !this.tileContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const centerPixels = this.latLngToWorldPixels(this.center.lat, this.center.lng, this.zoom);

    // Obtener teselas ordenadas progresivamente del centro del jugador hacia los bordes
    const radialTiles = this.getVisibleTilesRadialOrder(centerPixels, width, height);
    const neededTileKeys = new Set<string>();

    for (const tile of radialTiles) {
      neededTileKeys.add(tile.key);

      const screenX = tile.tx * 256 - centerPixels.x + width / 2;
      const screenY = tile.ty * 256 - centerPixels.y + height / 2;

      const existingSprite = this.activeTileSprites.get(tile.key);
      if (existingSprite) {
        existingSprite.position.set(screenX, screenY);
      } else {
        // Carga progresiva radial desde el centro hacia afuera
        this.loadAndPlaceTile(tile.tx, tile.ty, this.zoom, tile.key, screenX, screenY);
      }
    }

    // Purgar teselas que salieron de la vista
    for (const [key, sprite] of this.activeTileSprites.entries()) {
      if (!neededTileKeys.has(key)) {
        this.tileContainer.removeChild(sprite);
        this.activeTileSprites.delete(key);
      }
    }
  }

  /**
   * Carga la textura de una tesela mediante HTMLImageElement nativo con crossOrigin anónimo para permitir
   * lectura y muestreo de píxeles, o Pixi Assets en entornos compatibles.
   *
   * @param url - URL de la imagen de la tesela con extensión (.jpg / .png).
   * @param key - Clave única de la tesela ('z_x_y') para análisis de terreno.
   * @returns Promise<Texture> Textura WebGL lista para asociarse a un Sprite.
   */
  private async loadTileTexture(url: string, key?: string): Promise<Texture> {
    if (typeof Image !== 'undefined' && typeof document !== 'undefined') {
      return new Promise<Texture>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            if (key) {
              this.extractAndStoreTilePixels(key, img);
            }
            const texture = Texture.from(img);
            resolve(texture);
          } catch (err) {
            Assets.load<Texture>({ src: url, loadParser: 'loadTextures' })
              .then((t) => resolve(t))
              .catch((e) => reject(e));
          }
        };
        img.onerror = async () => {
          try {
            const texture = await Assets.load<Texture>({ src: url, loadParser: 'loadTextures' });
            resolve(texture);
          } catch (e) {
            reject(e);
          }
        };
        img.src = url;
      });
    }

    try {
      const texture = await Assets.load<Texture>({
        src: url,
        loadParser: 'loadTextures',
      });
      if (texture) return texture;
    } catch (e) {
      // Ignorar fallo en entorno headless
    }

    throw new Error(`No se pudo cargar la tesela en la URL: ${url}`);
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
    if (this.loadingTileKeys.has(key)) return;
    this.loadingTileKeys.add(key);

    const tileUrl = this.tileUrlTemplate
      .replace('{z}', z.toString())
      .replace('{y}', y.toString())
      .replace('{x}', x.toString());

    try {
      let texture: Texture;

      if (this.textureCache.has(key)) {
        texture = this.textureCache.get(key)!;
      } else {
        try {
          texture = await this.loadTileTexture(tileUrl, key);
        } catch (e) {
          // Intentar con el proveedor de respaldo en caso de fallo
          const fallbackUrl = this.fallbackTileUrlTemplate
            .replace('{z}', z.toString())
            .replace('{y}', y.toString())
            .replace('{x}', x.toString());
          texture = await this.loadTileTexture(fallbackUrl, key);
        }

        // Configuración de filtrado de píxel más cercano para estética 16-bits nítida
        if (texture && texture.source) {
          texture.source.scaleMode = 'nearest';
        }

        if (texture) {
          this.textureCache.set(key, texture);
        }
      }

      // Si aún corresponde a una tesela activa del zoom actual
      if (texture && this.zoom === z && !this.activeTileSprites.has(key) && this.tileContainer) {
        const sprite = new Sprite(texture);
        sprite.width = 256;
        sprite.height = 256;
        sprite.position.set(screenX, screenY);

        this.tileContainer.addChild(sprite);
        this.activeTileSprites.set(key, sprite);

        // Precalcular y fijar decoraciones de esta tesela una sola vez para evitar parpadeos
        this.analyzeAndCacheTileDecorations(key, x, y, z);

        // Refrescar decoraciones de terreno tan pronto se integra la nueva tesela
        this.renderDecorations();
      }
    } catch (err) {
      // Si la tesela no pudo ser cargada (ej. desconexión), se ignora silenciosamente
    } finally {
      this.loadingTileKeys.delete(key);
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

      // Purgar entradas de caché de píxeles no coincidentes con el nuevo zoom
      for (const cachedKey of this.tilePixelDataCache.keys()) {
        if (!cachedKey.startsWith(`${this.zoom}_`)) {
          this.tilePixelDataCache.delete(cachedKey);
        }
      }

      // Purgar entradas de caché de decoraciones no coincidentes con el nuevo zoom
      for (const decKey of this.tileDecorationsCache.keys()) {
        if (!decKey.startsWith(`${this.zoom}_`)) {
          this.tileDecorationsCache.delete(decKey);
        }
      }

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
    this.tilePixelDataCache.clear();
    this.tileDecorationsCache.clear();

    if (this.decorationsGraphics) {
      try {
        this.decorationsGraphics.destroy();
      } catch (e) {
        // Ignorar si ya fue liberado
      }
      this.decorationsGraphics = null;
    }

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
