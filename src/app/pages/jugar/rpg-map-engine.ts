import { Application, Container, Sprite, Graphics, Assets, Text, TextStyle, ColorMatrixFilter, Texture } from 'pixi.js';
import { GeoCoordinates } from '../../services/geolocation.service.js';
import { VamooMapPalette } from './map-palette.config.js';

/**
 * Tipo representativo de la clasificación de terreno geográfico sobre una tesela.
 */
export type TerrainType = 'park' | 'road' | 'block' | 'water' | 'autumn_park' | 'unknown';

/**
 * Elemento decorativo precalculado y fijado a las coordenadas de una tesela para evitar mutaciones durante el desplazamiento.
 */
export interface CachedTileDecoration {
  /** Tipo de elemento visual RPG */
  type: 'grove' | 'house' | 'tree' | 'vegetation' | 'flowers';
  /** Coordenada horizontal local en la tesela (0 a 255) */
  localX: number;
  /** Coordenada vertical local en la tesela (0 a 255) */
  localY: number;
  /** Factor de escala proporcional dependiente del nivel de zoom */
  scale: number;
  /** Semilla determinista pseudo-aleatoria */
  seed: number;
  /** Variante de diseño (0, 1, 2 para casas/vegetación; 0, 1, 2, 3 para árboles incluyendo otoño) */
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

  /** Caché en memoria de texturas PNG de alta calidad para las variantes de casas */
  private readonly houseTextures = new Map<number, Texture>();

  /** Caché en memoria de texturas PNG de alta calidad para las variantes de árboles */
  private readonly treeTextures = new Map<number, Texture>();

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

      // Precargar texturas PNG de casas y árboles para reemplazo de alta fidelidad
      this.loadHouseTextures();
      this.loadTreeTextures();
    } catch (error) {
      console.warn('[RpgMapEngine] No se pudo inicializar WebGL en este entorno:', error);
    }
  }

  /**
   * Precarga asíncrona de las texturas PNG transparentes de las 3 variantes de casas Pokémon.
   * Si la carga tiene éxito, refresca la capa de decoraciones para mostrar los sprites de alta fidelidad.
   *
   * @returns Promise<void>
   */
  public async loadHouseTextures(): Promise<void> {
    if (typeof window === 'undefined' || typeof Image === 'undefined') return;

    try {
      const variants = [0, 1, 2];
      let loadedAny = false;

      for (const v of variants) {
        const url = `/assets/sprites/house_${v}.png`;
        try {
          const texture = await Assets.load<Texture>({ src: url, loadParser: 'loadTextures' });
          if (texture && texture.source) {
            texture.source.scaleMode = 'nearest';
            this.houseTextures.set(v, texture);
            loadedAny = true;
          }
        } catch {
          // Si el archivo no está accesible, continúa con el respaldo procedural sin interrumpir
        }
      }

      if (loadedAny && this.isInitialized) {
        this.renderDecorations();
      }
    } catch {
      // Ignorar de forma segura en pruebas headless
    }
  }

  /**
   * Precarga asíncrona de las texturas PNG transparentes de las 4 variantes de árboles Pokémon.
   * Si la carga tiene éxito, refresca la capa de decoraciones para mostrar los sprites de alta fidelidad.
   *
   * @returns Promise<void>
   */
  public async loadTreeTextures(): Promise<void> {
    if (typeof window === 'undefined' || typeof Image === 'undefined') return;

    try {
      const variants = [0, 1, 2, 3];
      let loadedAny = false;

      for (const v of variants) {
        const url = `/assets/sprites/tree_${v}.png`;
        try {
          const texture = await Assets.load<Texture>({ src: url, loadParser: 'loadTextures' });
          if (texture && texture.source) {
            texture.source.scaleMode = 'nearest';
            this.treeTextures.set(v, texture);
            loadedAny = true;
          }
        } catch {
          // Si el archivo no está accesible, continúa con el respaldo procedural sin interrumpir
        }
      }

      if (loadedAny && this.isInitialized) {
        this.renderDecorations();
      }
    } catch {
      // Ignorar de forma segura en pruebas headless
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
        } else if (this.textureCache.has(tile.key)) {
          // Si la textura ya está en memoria pero los píxeles no, extraerlos y analizar de inmediato
          const tex = this.textureCache.get(tile.key);
          if (tex && tex.source) {
            const res = (tex.source as any).resource;
            if (res) {
              this.extractAndStoreTilePixels(tile.key, res);
            }
          }
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
            this.drawPokemonHouse(this.decorationsGraphics, posX, posY, item.scale, item.variant || 0);
            break;
          case 'tree':
            this.drawPokemonTree(this.decorationsGraphics, posX, posY, item.scale, item.variant || 0);
            break;
          case 'vegetation':
          case 'flowers':
            this.drawPokemonVegetation(this.decorationsGraphics, posX, posY, item.scale, item.variant || 0);
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
   * Vista fijada en Z19 para el jugador con escala ampliada 1.5x (casas cuadradas y árboles de 30x30 px),
   * garantizando calzadas libres de colisiones, presencia imponente y estética Pokémon nítida.
   *
   * @param zoom - Nivel de zoom (fijado en Z19 para el aventurero).
   * @returns number - Factor de escala visual (1.5 para vista Z19 con elementos 30x30px, 0 para vista macro <= 15).
   */
  public getZoomScaleFactor(zoom: number = 19): number {
    if (zoom <= 15) return 0;
    // Escala ampliada 1.5x: casitas cuadradas y árboles ampliados a 30x30 px para mayor protagonismo y legibilidad
    return 1.5;
  }

  /**
   * Determina con rigor si un color RGB corresponde a calzadas, asfalto, bordes/casings de calle,
   * textos con nombres de calles o avenidas vehiculares, evitando que casas o árboles se superpongan.
   *
   * @param r - Componente rojo (0 - 255).
   * @param g - Componente verde (0 - 255).
   * @param b - Componente azul (0 - 255).
   * @returns boolean - true si el píxel corresponde a carretera, calzada o texto vial.
   */
  public isRoadPixel(r: number, g: number, b: number): boolean {
    const diffRG = Math.abs(r - g);
    const diffGB = Math.abs(g - b);
    const diffRB = Math.abs(r - b);
    const maxDiff = Math.max(diffRG, Math.max(diffGB, diffRB));

    // 1. Asfalto blanco, blanco marfil o gris claro (calzadas vehiculares principales)
    if (r >= 205 && g >= 205 && b >= 195 && maxDiff <= 20) {
      return true;
    }

    // 2. Calzadas con casing, bordes de calle y asfalto medio neutro
    if (r >= 165 && g >= 165 && b >= 160 && maxDiff <= 16) {
      return true;
    }

    // 3. Textos y etiquetas con nombres de calles sobre calzadas (ej. "Pasaje Montevideo", "Avenida Chávez")
    if (r >= 70 && r < 180 && maxDiff <= 14) {
      return true;
    }

    // 4. Autopistas y avenidas arteriales amarillas / anaranjadas (ej. vías principales de penetración)
    // El componente rojo domina o empata con el verde (r >= g - 4) y es muy superior al azul (r - b >= 38)
    if (r >= 215 && g >= 160 && b <= 165 && r >= g - 4 && (r - b) >= 38) {
      return true;
    }

    return false;
  }

  /**
   * Determina con rigor si un píxel RGB corresponde a áreas verdes, parques, reservas naturales,
   * campos abiertos o zonas descampadas (praderas y terrenos abiertos de tono verde/oliva).
   *
   * @param r - Componente rojo (0 - 255).
   * @param g - Componente verde (0 - 255).
   * @param b - Componente azul (0 - 255).
   * @returns boolean - true si es área verde, parque, jardín público o descampado vegetal.
   */
  public isParkPixel(r: number, g: number, b: number): boolean {
    // 1. Zonas descampadas, campos abiertos y praderas verdes/oliva claros (ej. 216, 225, 164 o 218, 224, 178)
    if (g > r && (g - r) >= 2 && (g - b) >= 25) {
      return true;
    }

    // 2. Parques urbanos, plazas y jardines públicos de verde vivo
    if (g >= 125 && (g - r) >= 8 && (g - b) >= 15) {
      return true;
    }

    // 3. Follaje profundo / vegetación densa de arboledas
    if (g >= 90 && g > r * 1.04 && g > b * 1.04 && (g - r) >= 5) {
      return true;
    }

    return false;
  }

  /**
   * Determina si un píxel RGB corresponde a zonas deportivas, estadios, complejos cívicos o recreativos
   * de tono arena dorada / ocre (#F8E3A6 / #FFE8AA), donde se concentran árboles de otoño y vegetación sin casas.
   *
   * @param r - Componente rojo (0 - 255).
   * @param g - Componente verde (0 - 255).
   * @param b - Componente azul (0 - 255).
   * @returns boolean - true si es área recreativa / estadio de tono #F8E3A6.
   */
  public isAutumnAreaPixel(r: number, g: number, b: number): boolean {
    // Zona de color #F8E3A6 / #FFE8AA / #FCE1A3: arena dorada cálida
    // R >= 238, G entre 208 y 242, B entre 142 y 184, R - B >= 60, G - B >= 42
    return r >= 238 && g >= 208 && g <= 242 && b >= 142 && b <= 184 && (r - b) >= 60 && (g - b) >= 42;
  }

  /**
   * Clasifica el tipo de terreno a partir de una muestra de color RGB.
   *
   * @param r - Componente rojo (0 - 255).
   * @param g - Componente verde (0 - 255).
   * @param b - Componente azul (0 - 255).
   * @returns TerrainType - 'park' si es vegetación/parque, 'autumn_park' si es zona #F8E3A6, 'road' si es calzada, 'block' si es manzana urbana.
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

    // 3. Detección de zonas recreativas / estadios / campus de color #F8E3A6 (árboles de otoño predominantes)
    if (this.isAutumnAreaPixel(r, g, b)) {
      return 'autumn_park';
    }

    // 4. Detección estricta de parques / áreas verdes / plazas / vegetación
    if (this.isParkPixel(r, g, b)) {
      return 'park';
    }

    // 5. Manzana urbana / zona residencial por defecto (tonos tierra, beige, marfil, adobe)
    return 'block';
  }

  /**
   * Comprueba si una zona rectangular y circular alrededor de (localX, localY) está 100% libre de carreteras.
   * Muestrea una cuadrícula densa en la huella de la estructura más puntos radiales en la periferia.
   *
   * @param key - Clave única de la tesela ('z_x_y').
   * @param localX - Coordenada horizontal central (0 - 255).
   * @param localY - Coordenada vertical central (0 - 255).
   * @param clearanceRadius - Radio de seguridad en píxeles que debe estar completamente despejado de calzadas.
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

    // 2. Muestreo de cuadrícula densa en la huella total del elemento (5x5 puntos)
    const step = Math.max(3, Math.round(clearanceRadius / 2));
    for (let dx = -clearanceRadius; dx <= clearanceRadius; dx += step) {
      for (let dy = -clearanceRadius; dy <= clearanceRadius; dy += step) {
        if (checkPoint(localX + dx, localY + dy)) {
          return false;
        }
      }
    }

    // 3. Muestreo radial en 12 ángulos en la circunferencia exterior
    const numAngles = 12;
    for (let i = 0; i < numAngles; i++) {
      const angle = (i * 2 * Math.PI) / numAngles;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      if (checkPoint(localX + clearanceRadius * cosA, localY + clearanceRadius * sinA)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Comprueba si una zona está completamente libre de áreas verdes, parques, descampados y zonas de otoño (#F8E3A6).
   * Garantiza que ninguna casita se ubique dentro o en el borde de un área verde, descampado o estadio.
   *
   * @param key - Clave única de la tesela ('z_x_y').
   * @param localX - Coordenada horizontal central (0 - 255).
   * @param localY - Coordenada vertical central (0 - 255).
   * @param clearanceRadius - Radio de seguridad en píxeles.
   * @returns boolean - true si la zona está libre de áreas verdes/estadios; false si colisiona.
   */
  public isAreaClearOfPark(key: string, localX: number, localY: number, clearanceRadius: number): boolean {
    const imgData = this.tilePixelDataCache.get(key);
    if (!imgData || !imgData.data || imgData.data.length < 256 * 256 * 4) {
      const terrain = this.sampleTileTerrain(key, localX, localY);
      return terrain !== 'park' && terrain !== 'autumn_park';
    }

    const data = imgData.data;

    const checkPoint = (px: number, py: number): boolean => {
      const cx = Math.max(0, Math.min(255, Math.round(px)));
      const cy = Math.max(0, Math.min(255, Math.round(py)));
      const idx = (cy * 256 + cx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return this.isParkPixel(r, g, b) || this.isAutumnAreaPixel(r, g, b);
    };

    // 1. Verificar punto central
    if (checkPoint(localX, localY)) {
      return false;
    }

    // 2. Muestreo de cuadrícula densa en la huella de la casa
    const step = Math.max(3, Math.round(clearanceRadius / 2));
    for (let dx = -clearanceRadius; dx <= clearanceRadius; dx += step) {
      for (let dy = -clearanceRadius; dy <= clearanceRadius; dy += step) {
        if (checkPoint(localX + dx, localY + dy)) {
          return false;
        }
      }
    }

    // 3. Muestreo radial periférico
    const numAngles = 8;
    for (let i = 0; i < numAngles; i++) {
      const angle = (i * 2 * Math.PI) / numAngles;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      if (checkPoint(localX + clearanceRadius * cosA, localY + clearanceRadius * sinA)) {
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
   * @param img - Elemento CanvasImageSource cargado con la textura de la tesela.
   * @returns void
   */
  private extractAndStoreTilePixels(key: string, img: CanvasImageSource): void {
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

      // Limitar tamaño de caché a 256 teselas activas (~64MB) para garantizar retención en pantallas grandes y desplazamientos
      if (this.tilePixelDataCache.size > 256) {
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
   * con las siguientes reglas estrictas de diseño:
   * 1. Carreteras: NI CASAS NI ÁRBOLES sobre calzadas o nombres de calle.
   * 2. Vegetación: SÍ puede aparecer de forma normal (márgenes, aceras y plazas).
   * 3. Áreas verdes / Parques: CERO CASAS. Mayor cantidad y densidad de árboles y vegetación.
   * 4. Casas: Cuadradas de 20x20 px con 3 variantes arquitectónicas.
   * 5. Árboles: De 20x20 px con 3 variantes botánicas.
   * 6. Vegetación: Con 3 variantes (hierba alta, flores andinas, arbusto bajo).
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

    // Paso de cuadrícula adaptativo (48px en Z19 para una densidad balanceada)
    const gridStep = z === 19 ? 48 : z === 18 ? 64 : 80;

    for (let localX = gridStep / 2; localX < 256; localX += gridStep) {
      for (let localY = gridStep / 2; localY < 256; localY += gridStep) {
        const seed = Math.abs(
          Math.sin((tx * 256 + localX) * 12.9898 + (ty * 256 + localY) * 78.233 + z * 37.719) * 43758.5453
        ) % 1;

        const terrain = this.sampleTileTerrain(key, localX, localY);

        if (terrain === 'autumn_park') {
          // =========================================================================
          // REGLA 1A: ZONAS RECREATIVAS / ESTADIO / ÁREAS DE COLOR #F8E3A6
          // - CERO CASAS (puros árboles y vegetación).
          // - Árboles de otoño (variante 3) en mayor cantidad y predominancia.
          // - Vegetación abundante andina.
          // =========================================================================
          if (this.isAreaClearOfRoad(key, localX, localY, 9 * scaleFactor)) {
            // Alta densidad de árboles en zona #F8E3A6
            if (seed > 0.15) {
              // Predominan los árboles de otoño (variante 3) en más del 70% de las instancias
              const treeVariant = seed > 0.28 ? 3 : (Math.floor(seed * 7) % 3);
              items.push({
                type: 'tree',
                localX,
                localY,
                scale: scaleFactor,
                seed,
                variant: treeVariant,
              });
            }

            // Segundo árbol para formar arboledas otoñales tupidas en descampados amplios
            if (seed > 0.38 && seed < 0.90) {
              const secondX = Math.max(10, Math.min(245, localX + 15 * scaleFactor));
              const secondY = Math.max(10, Math.min(245, localY - 12 * scaleFactor));
              if (this.isAreaClearOfRoad(key, secondX, secondY, 9 * scaleFactor)) {
                items.push({
                  type: 'tree',
                  localX: secondX,
                  localY: secondY,
                  scale: scaleFactor * 0.95,
                  seed: (seed * 1.618) % 1,
                  variant: 3, // Árbol de otoño
                });
              }
            }
          }

          // Vegetación abundante en la zona #F8E3A6
          const vegVariant = Math.floor(seed * 11) % 3;
          items.push({
            type: 'vegetation',
            localX: Math.max(8, Math.min(248, localX + (seed > 0.5 ? 12 : -12) * scaleFactor)),
            localY: Math.max(8, Math.min(248, localY + (seed > 0.5 ? 10 : -10) * scaleFactor)),
            scale: scaleFactor,
            seed,
            variant: vegVariant,
          });

          if (seed > 0.30) {
            const extraX = Math.max(8, Math.min(248, localX + (seed > 0.65 ? -14 : 14) * scaleFactor));
            const extraY = Math.max(8, Math.min(248, localY + (seed > 0.65 ? 12 : -12) * scaleFactor));
            items.push({
              type: 'vegetation',
              localX: extraX,
              localY: extraY,
              scale: scaleFactor,
              seed: (seed * 2.3) % 1,
              variant: Math.floor(seed * 19) % 3,
            });
          }
        } else if (terrain === 'park') {
          // =========================================================================
          // REGLA 1: ÁREAS VERDES, PARQUES Y DESCAMPADOS
          // - CERO CASAS (prohibido que se generen casas aquí bajo cualquier circunstancia).
          // - Aumento sustancial de árboles (3 variantes) y vegetación (3 variantes).
          // =========================================================================
          // 1. Árbol principal del descampado / parque (no invade carreteras ni pistas)
          if (this.isAreaClearOfRoad(key, localX, localY, 9 * scaleFactor)) {
            if (seed > 0.20) {
              const treeVariant = Math.floor(seed * 7) % 3;
              items.push({
                type: 'tree',
                localX,
                localY,
                scale: scaleFactor,
                seed,
                variant: treeVariant,
              });
            }

            // En zonas descampadas amplias, generar un segundo árbol agrupado para mayor densidad
            if (seed > 0.42 && seed < 0.88) {
              const secondX = Math.max(10, Math.min(245, localX + 16 * scaleFactor));
              const secondY = Math.max(10, Math.min(245, localY - 12 * scaleFactor));
              if (this.isAreaClearOfRoad(key, secondX, secondY, 9 * scaleFactor)) {
                items.push({
                  type: 'tree',
                  localX: secondX,
                  localY: secondY,
                  scale: scaleFactor * 0.95,
                  seed: (seed * 1.618) % 1,
                  variant: Math.floor(seed * 13) % 3,
                });
              }
            }
          }

          // 2. Vegetación abundante en descampados y parques (puede aparecer normal)
          const vegVariant = Math.floor(seed * 11) % 3;
          items.push({
            type: 'vegetation',
            localX: Math.max(8, Math.min(248, localX + (seed > 0.5 ? 12 : -12) * scaleFactor)),
            localY: Math.max(8, Math.min(248, localY + (seed > 0.5 ? 10 : -10) * scaleFactor)),
            scale: scaleFactor,
            seed,
            variant: vegVariant,
          });

          // Vegetación secundaria para poblar y dar frondosidad al descampado
          if (seed > 0.30) {
            const extraX = Math.max(8, Math.min(248, localX + (seed > 0.65 ? -14 : 14) * scaleFactor));
            const extraY = Math.max(8, Math.min(248, localY + (seed > 0.65 ? 12 : -12) * scaleFactor));
            items.push({
              type: 'vegetation',
              localX: extraX,
              localY: extraY,
              scale: scaleFactor,
              seed: (seed * 2.3) % 1,
              variant: Math.floor(seed * 19) % 3,
            });
          }
        } else if (terrain === 'block') {
          // =========================================================================
          // REGLA 2: MANZANA URBANA / RESIDENCIAL
          // - REGLA ESTRICTA DE CARRETERAS: NI CASAS NI ÁRBOLES en carreteras.
          // - REGLA ESTRICTA DE ÁREAS VERDES: Casas 100% libres de parques/descampados.
          // - Casas cuadradas de 20x20 con 3 variantes arquitectónicas.
          // - Árboles individuales de jardín residencial con 3 variantes botánicas.
          // - Vegetación en aceras y bordes (la vegetación sí puede aparecer normal).
          // =========================================================================

          // Seguridad estricta para casas: libre de carreteras Y libre de áreas verdes/descampados
          let houseX = localX;
          let houseY = localY;
          let isClearForHouse =
            this.isAreaClearOfRoad(key, houseX, houseY, 12 * scaleFactor) &&
            this.isAreaClearOfPark(key, houseX, houseY, 10 * scaleFactor);

          // Si el centro de la celda colisiona con una calle, intentar un pequeño desplazamiento determinista en la manzana
          if (!isClearForHouse) {
            const offsets = [
              [10, 0], [-10, 0], [0, 10], [0, -10],
              [8, 8], [-8, 8], [8, -8], [-8, -8],
            ];
            for (const [ox, oy] of offsets) {
              const candX = Math.max(16, Math.min(240, localX + ox));
              const candY = Math.max(16, Math.min(240, localY + oy));
              if (
                this.isAreaClearOfRoad(key, candX, candY, 12 * scaleFactor) &&
                this.isAreaClearOfPark(key, candX, candY, 10 * scaleFactor)
              ) {
                houseX = candX;
                houseY = candY;
                isClearForHouse = true;
                break;
              }
            }
          }

          if (isClearForHouse) {
            if (seed > 0.35 && seed < 0.85) {
              // Casa cuadrada con 3 variantes rotativas
              const houseVariant = Math.floor(seed * 13) % 3;
              items.push({
                type: 'house',
                localX: houseX,
                localY: houseY,
                scale: scaleFactor,
                seed,
                variant: houseVariant,
              });
            } else if (seed >= 0.85) {
              // Árbol individual de jardín residencial (debe estar libre de carretera)
              let treeX = localX;
              let treeY = localY;
              let isClearForTree = this.isAreaClearOfRoad(key, treeX, treeY, 10 * scaleFactor);
              if (!isClearForTree) {
                const treeOffsets = [[-8, 8], [8, -8], [8, 8], [-8, -8]];
                for (const [ox, oy] of treeOffsets) {
                  const candX = Math.max(14, Math.min(242, localX + ox));
                  const candY = Math.max(14, Math.min(242, localY + oy));
                  if (this.isAreaClearOfRoad(key, candX, candY, 10 * scaleFactor)) {
                    treeX = candX;
                    treeY = candY;
                    isClearForTree = true;
                    break;
                  }
                }
              }
              if (isClearForTree) {
                const treeVariant = Math.floor(seed * 11) % 3;
                items.push({
                  type: 'tree',
                  localX: treeX,
                  localY: treeY,
                  scale: scaleFactor,
                  seed,
                  variant: treeVariant,
                });
              }
            }
          }

          // Vegetación en aceras / esquinas de manzana (puede aparecer normal)
          if (seed < 0.28) {
            const vegVariant = Math.floor(seed * 17) % 3;
            items.push({
              type: 'vegetation',
              localX,
              localY,
              scale: scaleFactor,
              seed,
              variant: vegVariant,
            });
          }
        }
      }
    }

    this.tileDecorationsCache.set(key, items);

    // Limitar tamaño de caché de decoraciones a 2048 teselas (~300KB) para garantizar persistencia durante toda la sesión
    if (this.tileDecorationsCache.size > 2048) {
      const oldestKey = this.tileDecorationsCache.keys().next().value;
      if (oldestKey) {
        this.tileDecorationsCache.delete(oldestKey);
      }
    }
  }

  /**
   * Dibuja una arboleda densa combinada para compatibilidad en áreas clasificadas como parque.
   *
   * @param g - Objeto Graphics sobre el cual pintar la arboleda.
   * @param centerX - Coordenada horizontal central del bosque en la pantalla.
   * @param centerY - Coordenada vertical central del bosque en la pantalla.
   * @param scale - Factor de escala visual dependiente del nivel de zoom actual.
   * @param seed - Semilla pseudo-aleatoria para variar la disposición.
   * @returns void
   */
  private drawPokemonGrove(g: Graphics, centerX: number, centerY: number, scale: number, seed: number): void {
    if (scale <= 0) return;

    // Sombra colectiva de base del bosque
    g.ellipse(centerX, centerY + 10 * scale, 28 * scale, 10 * scale)
      .fill({ color: 0x000000, alpha: 0.25 });

    // Configuración de árboles en el bosque
    const treeOffsets: Array<[number, number, number]> = [
      [-10 * scale, -4 * scale, 0],
      [10 * scale, -3 * scale, 1],
      [-5 * scale, 6 * scale, 0],
      [7 * scale, 5 * scale, 2],
      [0, -8 * scale, 1],
    ];

    treeOffsets.sort((a, b) => a[1] - b[1]);

    for (const [ox, oy, variant] of treeOffsets) {
      this.drawPokemonTree(g, centerX + ox, centerY + oy, scale, variant);
    }

    // Vegetación en bordes del claro
    this.drawPokemonVegetation(g, centerX - 14 * scale, centerY + 10 * scale, scale, 1);
    if (seed > 0.5) {
      this.drawPokemonVegetation(g, centerX + 12 * scale, centerY + 9 * scale, scale, 2);
    }
  }

  /**
   * Dibuja un árbol proporcional estilo pixel-art Pokémon con 4 variantes botánicas.
   * Si la textura PNG transparente de la variante está cargada en memoria, dibuja el sprite de alta fidelidad;
   * en caso contrario, recurre al dibujo procedural como respaldo continuo.
   *
   * @param g - Objeto Graphics de PixiJS sobre el cual pintar el árbol.
   * @param x - Posición horizontal central sobre la pantalla.
   * @param y - Posición vertical central sobre la pantalla.
   * @param scale - Factor de escala proporcional por nivel de zoom (por defecto 1.0).
   * @param variant - Variante botánica (0: Esférico clásico Pokémon, 1: Pino andino cónico, 2: Árbol frutal con bayas, 3: Árbol de otoño).
   * @returns void
   */
  private drawPokemonTree(g: Graphics, x: number, y: number, scale: number = 1.0, variant: number = 0): void {
    if (scale <= 0) return;

    // Verificar si la textura PNG transparente de la variante está disponible
    const tex = this.treeTextures.get(variant);
    if (tex && tex.source) {
      const treeSize = 34 * scale;
      // Dibuja el sprite PNG transparente centrado sobre las coordenadas designadas
      g.texture(tex, 0xffffff, x - treeSize / 2, y - treeSize / 2, treeSize, treeSize);
      return;
    }

    // Renderizado procedural de respaldo si la textura PNG aún no ha cargado
    this.drawPokemonTreeProcedural(g, x, y, scale, variant);
  }

  /**
   * Renderizado procedural de respaldo para los árboles cuando no hay texturas cargadas (headless/tests).
   *
   * @param g - Objeto Graphics sobre el cual pintar el árbol.
   * @param x - Posición horizontal central sobre la pantalla.
   * @param y - Posición vertical central sobre la pantalla.
   * @param scale - Factor de escala proporcional.
   * @param variant - Variante botánica (0, 1, 2 o 3).
   * @returns void
   */
  private drawPokemonTreeProcedural(g: Graphics, x: number, y: number, scale: number = 1.0, variant: number = 0): void {
    // Sombra ovalada en la base del árbol (16x4 px)
    g.ellipse(x, y + 9 * scale, 8 * scale, 2.5 * scale)
      .fill({ color: 0x000000, alpha: 0.25 });

    if (variant === 3) {
      // VARIANTE 3: Árbol de otoño andino con follaje dorado / naranja rojizo cálido (20x20 px)
      // Tronco leñoso oscuro
      g.rect(x - 2 * scale, y + 3 * scale, 4 * scale, 6 * scale)
        .fill({ color: 0x78350f })
        .stroke({ color: 0x451a03, width: 0.8 });

      // Hojitas otoñales caídas alrededor de la base
      g.rect(x - 6 * scale, y + 8 * scale, 1.5 * scale, 1.5 * scale).fill({ color: 0xea580c });
      g.rect(x + 5 * scale, y + 7 * scale, 1.5 * scale, 1.5 * scale).fill({ color: 0xf59e0b });

      // Copa esférica otoñal en 4 capas de pixel-art cálido
      const r = 8.5 * scale;
      g.circle(x, y - 1 * scale, r).fill({ color: 0x9a3412 });                    // Sombra marrón rojiza
      g.circle(x, y - 2 * scale, r * 0.85).fill({ color: 0xea580c });             // Naranja fuego otoñal
      g.circle(x, y - 3 * scale, r * 0.65).fill({ color: 0xf97316 });             // Naranja vivo
      g.circle(x - 1.5 * scale, y - 4.5 * scale, r * 0.38).fill({ color: 0xfacc15 }); // Destello dorado cálido

      // Píxel de brillo superior dorado pálido estilo GBA
      g.rect(x - 2.5 * scale, y - 5.5 * scale, 1.5 * scale, 1.5 * scale).fill({ color: 0xfef08a });
      return;
    }

    if (variant === 1) {
      // VARIANTE 1: Pino / Conífera Andina triangular en 3 niveles (20x20 px)
      // Tronco visible en la base
      g.rect(x - 2 * scale, y + 4 * scale, 4 * scale, 5 * scale)
        .fill({ color: 0x78350f })
        .stroke({ color: 0x451a03, width: 0.8 });

      // Piso inferior de ramas
      g.poly([
        x - 9 * scale, y + 4 * scale,
        x, y - 3 * scale,
        x + 9 * scale, y + 4 * scale,
      ]).fill({ color: 0x064e3b });

      // Piso intermedio de ramas
      g.poly([
        x - 7 * scale, y,
        x, y - 7 * scale,
        x + 7 * scale, y,
      ]).fill({ color: 0x166534 });

      // Copa superior de ramas
      g.poly([
        x - 5 * scale, y - 4 * scale,
        x, y - 10 * scale,
        x + 5 * scale, y - 4 * scale,
      ]).fill({ color: 0x22c55e });
      return;
    }

    if (variant === 2) {
      // VARIANTE 2: Árbol frutal con bayas rojas y doradas estilo ruta Pokémon (20x20 px)
      // Tronco leñoso
      g.rect(x - 2 * scale, y + 3 * scale, 4 * scale, 6 * scale)
        .fill({ color: 0x78350f })
        .stroke({ color: 0x451a03, width: 0.8 });

      // Copa esférica frondosa (diámetro 18px)
      const r = 9 * scale;
      g.circle(x, y - 1 * scale, r).fill({ color: 0x064e3b });
      g.circle(x, y - 2 * scale, r * 0.88).fill({ color: 0x15803d });
      g.circle(x - 1 * scale, y - 4 * scale, r * 0.5).fill({ color: 0x4ade80 });

      // Bayas y frutos silvestres incrustados
      g.circle(x - 4 * scale, y - 2 * scale, 1.2 * scale).fill({ color: 0xef4444 });
      g.circle(x + 3 * scale, y - 3 * scale, 1.2 * scale).fill({ color: 0xef4444 });
      g.circle(x, y - 6 * scale, 1.1 * scale).fill({ color: 0xfacc15 });
      g.circle(x - 2 * scale, y + 2 * scale, 1.1 * scale).fill({ color: 0xfacc15 });
      return;
    }

    // VARIANTE 0: Árbol esférico clásico Pokémon (20x20 px)
    // Tronco leñoso
    g.rect(x - 2 * scale, y + 3 * scale, 4 * scale, 6 * scale)
      .fill({ color: 0x78350f })
      .stroke({ color: 0x451a03, width: 0.8 });

    // 4 niveles de sombreado pixel-art concéntrico
    const r = 8.5 * scale;
    g.circle(x, y - 1 * scale, r).fill({ color: 0x064e3b });
    g.circle(x, y - 2 * scale, r * 0.85).fill({ color: 0x166534 });
    g.circle(x, y - 3 * scale, r * 0.65).fill({ color: 0x15803d });
    g.circle(x - 1.5 * scale, y - 4.5 * scale, r * 0.35).fill({ color: 0x4ade80 });

    // Píxel de brillo superior estilo Game Boy Advance
    g.rect(x - 2.5 * scale, y - 5.5 * scale, 1.5 * scale, 1.5 * scale).fill({ color: 0x86efac });
  }

  /**
   * Dibuja una casa estilo pixel-art Pokémon con 3 variantes arquitectónicas.
   * Si la textura PNG transparente de la variante está cargada en memoria, dibuja el sprite de alta fidelidad;
   * en caso contrario, utiliza el renderizado procedural como respaldo continuo.
   *
   * @param g - Objeto Graphics de PixiJS sobre el cual pintar la casita.
   * @param x - Posición horizontal central sobre la pantalla.
   * @param y - Posición vertical central sobre la pantalla.
   * @param scale - Factor de escala proporcional por nivel de zoom (por defecto 1.0).
   * @param variant - Variante arquitectónica (0: Teja terracota andina, 1: Tejado azul cobalto/pizarra, 2: Casona colonial ocre).
   * @returns void
   */
  private drawPokemonHouse(g: Graphics, x: number, y: number, scale: number = 1.0, variant: number = 0): void {
    if (scale <= 0) return;

    // Verificar si la textura PNG transparente de la variante ya está en memoria
    const tex = this.houseTextures.get(variant);
    if (tex && tex.source) {
      const houseSize = 34 * scale;
      // Dibuja el sprite PNG transparente centrado sobre las coordenadas designadas
      g.texture(tex, 0xffffff, x - houseSize / 2, y - houseSize / 2, houseSize, houseSize);
      return;
    }

    // Renderizado procedural de respaldo si la textura PNG aún no ha cargado
    this.drawPokemonHouseProcedural(g, x, y, scale, variant);
  }

  /**
   * Renderizado procedural de respaldo para las casitas cuando no hay texturas cargadas (headless/tests).
   *
   * @param g - Objeto Graphics sobre el cual pintar.
   * @param x - Posición horizontal central sobre la pantalla.
   * @param y - Posición vertical central sobre la pantalla.
   * @param scale - Factor de escala proporcional.
   * @param variant - Variante arquitectónica (0, 1 o 2).
   * @returns void
   */
  private drawPokemonHouseProcedural(g: Graphics, x: number, y: number, scale: number = 1.0, variant: number = 0): void {
    // Sombra proyectada en el suelo debajo de la casa (22x4 px)
    g.rect(x - 11 * scale, y + 8 * scale, 22 * scale, 4 * scale)
      .fill({ color: 0x000000, alpha: 0.22 });

    if (variant === 1) {
      // VARIANTE 1: Cabaña de sillar con tejado azul cobalto / pizarra (20x20 px)
      // Paredes de sillar crema/blanco (20px ancho x 13px alto)
      g.rect(x - 10 * scale, y - 3 * scale, 20 * scale, 13 * scale)
        .fill({ color: 0xf8fafc })
        .stroke({ color: 0x334155, width: Math.max(1, 1 * scale) });

      // Techo a dos aguas azul cobalto (base 22px, altura 7px)
      g.poly([
        x - 11 * scale, y - 3 * scale,
        x, y - 10 * scale,
        x + 11 * scale, y - 3 * scale,
      ])
        .fill({ color: 0x2563eb })
        .stroke({ color: 0x1e3a8a, width: Math.max(1, 1.2 * scale) });

      // Puerta rústica de madera oscura
      g.rect(x - 3 * scale, y + 2 * scale, 6 * scale, 8 * scale)
        .fill({ color: 0x451a03 })
        .stroke({ color: 0x1c1917, width: 0.8 });
      g.circle(x + 1.5 * scale, y + 6 * scale, 0.7 * scale).fill({ color: 0xfacc15 });

      // Ventana con cruceta blanca y reflejo celeste
      g.rect(x + 4 * scale, y, 4 * scale, 4 * scale)
        .fill({ color: 0x93c5fd })
        .stroke({ color: 0x1e3a8a, width: 0.8 });

      // Pequeño farol o buzón lateral amarillo
      g.rect(x - 7 * scale, y + 4 * scale, 2 * scale, 3 * scale).fill({ color: 0xfacc15 });
      return;
    }

    if (variant === 2) {
      // VARIANTE 2: Casona colonial andina con tejado de arcilla ocre tostada (20x20 px)
      // Paredes de adobe ocre cálido (20px ancho x 13px alto)
      g.rect(x - 10 * scale, y - 3 * scale, 20 * scale, 13 * scale)
        .fill({ color: 0xfef3c7 })
        .stroke({ color: 0x78350f, width: Math.max(1, 1 * scale) });

      // Techo a dos aguas de arcilla tostada (base 22px, altura 7px)
      g.poly([
        x - 11 * scale, y - 3 * scale,
        x, y - 10 * scale,
        x + 11 * scale, y - 3 * scale,
      ])
        .fill({ color: 0xb45309 })
        .stroke({ color: 0x78350f, width: Math.max(1, 1.2 * scale) });

      // Puerta central arqueada
      g.rect(x - 3 * scale, y + 2 * scale, 6 * scale, 8 * scale)
        .fill({ color: 0x713f12 })
        .stroke({ color: 0x451a03, width: 0.8 });

      // Dos ventanitas cuadradas gemelas en el piso superior
      g.rect(x - 8 * scale, y - 1 * scale, 3.5 * scale, 3.5 * scale)
        .fill({ color: 0x38bdf8 })
        .stroke({ color: 0x0369a1, width: 0.6 });
      g.rect(x + 4.5 * scale, y - 1 * scale, 3.5 * scale, 3.5 * scale)
        .fill({ color: 0x38bdf8 })
        .stroke({ color: 0x0369a1, width: 0.6 });
      return;
    }

    // VARIANTE 0 (Por defecto): Casa Andina tradicional con tejado terracota viva (20x20 px)
    // Paredes de adobe / marfil cálido (20px ancho x 13px alto)
    g.rect(x - 10 * scale, y - 3 * scale, 20 * scale, 13 * scale)
      .fill({ color: 0xffedd5 })
      .stroke({ color: 0x7c2d12, width: Math.max(1, 1 * scale) });

    // Puerta de madera
    g.rect(x - 3 * scale, y + 2 * scale, 6 * scale, 8 * scale)
      .fill({ color: 0x854d0e })
      .stroke({ color: 0x451a03, width: 0.8 });
    g.circle(x + 1.5 * scale, y + 6 * scale, 0.7 * scale).fill({ color: 0xfacc15 });

    // Ventana con cristal azul
    g.rect(x - 8 * scale, y, 4 * scale, 4 * scale)
      .fill({ color: 0x60a5fa })
      .stroke({ color: 0x1e3a8a, width: 0.8 });

    // Techo a dos aguas de teja andina terracota (base 22px, altura 7px)
    g.poly([
      x - 11 * scale, y - 3 * scale,
      x, y - 10 * scale,
      x + 11 * scale, y - 3 * scale,
    ])
      .fill({ color: 0xf97316 })
      .stroke({ color: 0x7c2d12, width: Math.max(1, 1.2 * scale) });

    // Chimenea de ladrillo
    g.rect(x + 5 * scale, y - 11 * scale, 3 * scale, 5 * scale)
      .fill({ color: 0x9a3412 })
      .stroke({ color: 0x431407, width: 0.6 });
  }

  /**
   * Dibuja vegetación estilo Pokémon con 3 variantes (hierba alta, flores andinas, arbusto bajo de jardín).
   * Puede ubicarse libremente en bordes de calzada, márgenes, aceras y plazas.
   *
   * @param g - Objeto Graphics de PixiJS sobre el cual pintar la vegetación.
   * @param x - Posición horizontal central sobre la pantalla.
   * @param y - Posición vertical central sobre la pantalla.
   * @param scale - Factor de escala proporcional.
   * @param variant - Variante botánica (0: Hierba alta silvestre, 1: Parche de flores andinas, 2: Arbusto bajo de jardín).
   * @returns void
   */
  private drawPokemonVegetation(g: Graphics, x: number, y: number, scale: number = 1.0, variant: number = 0): void {
    if (scale <= 0) return;

    if (variant === 2) {
      // VARIANTE 2: Arbusto redondo bajo de jardín (12x8 px)
      g.ellipse(x, y + 3 * scale, 6 * scale, 2 * scale).fill({ color: 0x000000, alpha: 0.2 });
      g.circle(x, y, 5 * scale).fill({ color: 0x064e3b });
      g.circle(x, y - 1 * scale, 4.2 * scale).fill({ color: 0x16a34a });
      g.circle(x - 1 * scale, y - 2 * scale, 2.2 * scale).fill({ color: 0x4ade80 });
      return;
    }

    if (variant === 1) {
      // VARIANTE 1: Parche de flores silvestres andinas (rojas, amarillas y rosas)
      // Briznas verdes de base
      g.rect(x - 5 * scale, y - 1 * scale, 1.5 * scale, 5 * scale).fill({ color: 0x15803d });
      g.rect(x - 1 * scale, y - 3 * scale, 1.5 * scale, 7 * scale).fill({ color: 0x16a34a });
      g.rect(x + 3 * scale, y - 2 * scale, 1.5 * scale, 6 * scale).fill({ color: 0x15803d });

      // Florecilla roja
      g.rect(x - 6 * scale, y - 3 * scale, 2 * scale, 2 * scale).fill({ color: 0xef4444 });
      g.rect(x - 5 * scale, y - 2 * scale, 1 * scale, 1 * scale).fill({ color: 0xfacc15 });

      // Florecilla amarilla
      g.rect(x + 2 * scale, y - 4 * scale, 2 * scale, 2 * scale).fill({ color: 0xfacc15 });
      g.rect(x + 3 * scale, y - 3 * scale, 1 * scale, 1 * scale).fill({ color: 0xf97316 });

      // Florecilla rosa andina
      g.rect(x - 1 * scale, y - 5 * scale, 1.8 * scale, 1.8 * scale).fill({ color: 0xec4899 });
      return;
    }

    // VARIANTE 0: Hierba alta Pokémon silvestre clásica
    g.rect(x - 6 * scale, y - 2 * scale, 2 * scale, 6 * scale).fill({ color: 0x15803d });
    g.rect(x - 2 * scale, y - 4 * scale, 2 * scale, 8 * scale).fill({ color: 0x16a34a });
    g.rect(x + 2 * scale, y - 3 * scale, 2 * scale, 7 * scale).fill({ color: 0x15803d });
    g.rect(x + 5 * scale, y - 1 * scale, 2 * scale, 5 * scale).fill({ color: 0x22c55e });
  }

  /**
   * Método de compatibilidad para dibujar parches de vegetación o flores silvestres.
   *
   * @param g - Objeto Graphics sobre el cual pintar el parche.
   * @param x - Posición horizontal sobre la pantalla.
   * @param y - Posición vertical sobre la pantalla.
   * @param scale - Factor de escala proporcional por nivel de zoom.
   * @returns void
   */
  private drawWildflowerPatch(g: Graphics, x: number, y: number, scale: number = 1.0): void {
    this.drawPokemonVegetation(g, x, y, scale, 1);
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

    // Margen de precarga amplio (512px = 2 teselas de anticipación en todas direcciones)
    // para evitar áreas vacías o parpadeos durante el desplazamiento rápido del mapa
    const preloadBuffer = 512;
    const minWorldX = centerPixels.x - width / 2 - preloadBuffer;
    const maxWorldX = centerPixels.x + width / 2 + preloadBuffer;
    const minWorldY = centerPixels.y - height / 2 - preloadBuffer;
    const maxWorldY = centerPixels.y + height / 2 + preloadBuffer;

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

        // Asegurar que si los píxeles no estaban en caché, los extraemos del recurso subyacente
        if (!this.tilePixelDataCache.has(key) && texture && texture.source) {
          const res = (texture.source as any).resource;
          if (res) {
            this.extractAndStoreTilePixels(key, res);
          }
        }

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
