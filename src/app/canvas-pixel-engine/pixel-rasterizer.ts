/**
 * @fileoverview Motor de rasterizado pixel-art nativo sobre HTML5 Canvas 2D.
 * Implementa renderizado discreto estilo Minecraft/JRPG (células o bloques atómicos de 5px)
 * para representar rotondas (círculo de punto medio de Bresenham), calles diagonales
 * (algoritmo de línea de Bresenham), polígonos de parques y cuantización cromática
 * de imágenes geográficas reales de Google Maps con capa superior de texto vectorial legible.
 */

import { quantizeRgbToPalette, VIBRANT_16BIT_PALETTE, PaletteEntry } from './pixel-palette';

/**
 * Coordenada 2D entera en la cuadrícula de píxeles/bloques.
 */
export interface PixelPoint {
  /** Coordenada X en la grilla */
  x: number;
  /** Coordenada Y en la grilla */
  y: number;
}

/**
 * Rótulo o etiqueta de calle/avenida para renderizado vectorial legible.
 */
export interface StreetLabel {
  /** Texto legible del nombre de la vía o punto de interés */
  text: string;
  /** Coordenada X en el canvas */
  x: number;
  /** Coordenada Y en el canvas */
  y: number;
  /** Ángulo de inclinación en grados para alineación con calles diagonales */
  angleDegrees?: number;
  /** Tipo semántico del elemento vial */
  type?: 'avenue' | 'street' | 'roundabout' | 'park';
}

/**
 * Opciones de configuración para el rasterizado de imágenes de mapas.
 */
export interface MapRasterizeOptions {
  /** Tamaño del bloque/píxel atómico en píxeles de pantalla (por defecto 5px) */
  blockSize: number;
  /** Si es true, cuantiza los colores a la paleta JRPG de 16-bits viva */
  quantizePalette: boolean;
  /** Si es true, agrega una cuadrícula sutil tipo voxel/Minecraft */
  showGridLines: boolean;
  /** Si es true, añade efecto retro de líneas de escaneo CRT */
  enableScanlines: boolean;
  /** Lista de etiquetas de calles legibles para renderizar en la capa superior */
  labels?: StreetLabel[];
  /** Si es true, dibuja los rótulos de calles legibles sobre el mapa rasterizado */
  showLabels?: boolean;
}

/**
 * Motor central de rasterizado pixel-art en HTML5 Canvas 2D.
 * Administra el búfer de píxeles y expone algoritmos matemáticos discretos sin dependencias externas.
 */
export class PixelRasterizer {
  /** Ancho de la grilla en unidades de píxeles/bloques discretos */
  public readonly gridWidth: number;
  /** Alto de la grilla en unidades de píxeles/bloques discretos */
  public readonly gridHeight: number;
  /** Búfer 2D de colores hexadecimales indexado por [y][x] */
  private grid: string[][];

  /**
   * Inicializa una nueva instancia del motor de rasterizado.
   *
   * @param gridWidth - Cantidad horizontal de bloques discretos.
   * @param gridHeight - Cantidad vertical de bloques discretos.
   * @param defaultColor - Color inicial de fondo (por defecto '#10b981' césped esmeralda vivo).
   */
  constructor(gridWidth: number, gridHeight: number, defaultColor = '#10b981') {
    this.gridWidth = Math.max(1, Math.floor(gridWidth));
    this.gridHeight = Math.max(1, Math.floor(gridHeight));
    this.grid = Array.from({ length: this.gridHeight }, () =>
      Array.from({ length: this.gridWidth }, () => defaultColor)
    );
  }

  /**
   * Limpia toda la grilla asignando un color base uniforme.
   *
   * @param color - Color hexadecimal a rellenar.
   */
  public clear(color = '#10b981'): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = color;
      }
    }
  }

  /**
   * Asigna un color a una celda específica de la grilla verificando límites.
   *
   * @param x - Posición X en la grilla entera.
   * @param y - Posición Y en la grilla entera.
   * @param color - Color hexadecimal a pintar.
   */
  public setPixel(x: number, y: number, color: string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix >= 0 && ix < this.gridWidth && iy >= 0 && iy < this.gridHeight) {
      this.grid[iy][ix] = color;
    }
  }

  /**
   * Obtiene el color de una celda de la grilla.
   *
   * @param x - Posición X entera.
   * @param y - Posición Y entera.
   * @returns El color hexadecimal almacenado o null si está fuera de límites.
   */
  public getPixel(x: number, y: number): string | null {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix >= 0 && ix < this.gridWidth && iy >= 0 && iy < this.gridHeight) {
      return this.grid[iy][ix];
    }
    return null;
  }

  /**
   * Dibuja un segmento de recta mediante el algoritmo de Bresenham con grosor configurable.
   * Ideal para avenidas rectas, diagonales y senderos urbanos.
   *
   * @param x0 - Coordenada X inicial.
   * @param y0 - Coordenada Y inicial.
   * @param x1 - Coordenada X final.
   * @param y1 - Coordenada Y final.
   * @param width - Grosor de la línea en bloques discretos (mínimo 1).
   * @param color - Color hexadecimal del trazado.
   */
  public drawBresenhamLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    width: number,
    color: string
  ): void {
    let currX = Math.floor(x0);
    let currY = Math.floor(y0);
    const targetX = Math.floor(x1);
    const targetY = Math.floor(y1);

    const dx = Math.abs(targetX - currX);
    const dy = Math.abs(targetY - currY);
    const sx = currX < targetX ? 1 : -1;
    const sy = currY < targetY ? 1 : -1;
    let err = dx - dy;

    const halfW = Math.floor(Math.max(1, width) / 2);

    while (true) {
      for (let oy = -halfW; oy <= halfW; oy++) {
        for (let ox = -halfW; ox <= halfW; ox++) {
          this.setPixel(currX + ox, currY + oy, color);
        }
      }

      if (currX === targetX && currY === targetY) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currY += sy;
      }
    }
  }

  /**
   * Dibuja una rotonda o anillo circular mediante el algoritmo de círculo de punto medio de Bresenham.
   * Produce una curvatura escalonada simétrica (estilo esferas/círculos de Minecraft).
   *
   * @param cx - Centro X del círculo en la grilla.
   * @param cy - Centro Y del círculo en la grilla.
   * @param radius - Radio en bloques discretos.
   * @param ringWidth - Grosor de la pared del anillo en bloques (si es relleno se ignora).
   * @param color - Color hexadecimal del círculo.
   * @param filled - Si es true, rellena el disco completo; si es false, solo dibuja el anillo vial.
   */
  public drawBresenhamCircle(
    cx: number,
    cy: number,
    radius: number,
    ringWidth: number,
    color: string,
    filled = false
  ): void {
    const centerIntX = Math.floor(cx);
    const centerIntY = Math.floor(cy);
    const rInt = Math.floor(radius);

    if (filled) {
      for (let y = -rInt; y <= rInt; y++) {
        for (let x = -rInt; x <= rInt; x++) {
          if (x * x + y * y <= rInt * rInt) {
            this.setPixel(centerIntX + x, centerIntY + y, color);
          }
        }
      }
      return;
    }

    const innerRadius = Math.max(0, rInt - Math.floor(ringWidth));
    const rOuterSq = rInt * rInt;
    const rInnerSq = innerRadius * innerRadius;

    for (let y = -rInt; y <= rInt; y++) {
      for (let x = -rInt; x <= rInt; x++) {
        const distSq = x * x + y * y;
        if (distSq <= rOuterSq && distSq >= rInnerSq) {
          this.setPixel(centerIntX + x, centerIntY + y, color);
        }
      }
    }
  }

  /**
   * Rellena un polígono convexo o cóncavo mediante el algoritmo de rasterizado Scanline.
   * Ideal para parques irregulares, manzanas urbanas y lagos.
   *
   * @param vertices - Lista ordenada de puntos que definen los vértices del polígono.
   * @param color - Color hexadecimal de relleno.
   */
  public fillPolygon(vertices: PixelPoint[], color: string): void {
    if (vertices.length < 3) return;

    let minY = vertices[0].y;
    let maxY = vertices[0].y;
    for (let i = 1; i < vertices.length; i++) {
      if (vertices[i].y < minY) minY = vertices[i].y;
      if (vertices[i].y > maxY) maxY = vertices[i].y;
    }

    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(this.gridHeight - 1, Math.floor(maxY));

    for (let y = minY; y <= maxY; y++) {
      const nodeX: number[] = [];
      let j = vertices.length - 1;

      for (let i = 0; i < vertices.length; i++) {
        const vi = vertices[i];
        const vj = vertices[j];

        if ((vi.y < y && vj.y >= y) || (vj.y < y && vi.y >= y)) {
          const intersectX = vi.x + ((y - vi.y) / (vj.y - vi.y)) * (vj.x - vi.x);
          nodeX.push(intersectX);
        }
        j = i;
      }

      nodeX.sort((a, b) => a - b);

      for (let k = 0; k < nodeX.length; k += 2) {
        if (k + 1 >= nodeX.length) break;
        const startX = Math.max(0, Math.ceil(nodeX[k]));
        const endX = Math.min(this.gridWidth - 1, Math.floor(nodeX[k + 1]));

        for (let x = startX; x <= endX; x++) {
          this.setPixel(x, y, color);
        }
      }
    }
  }

  /**
   * Dibuja un rótulo o etiqueta de texto normal legible con placa o halo sobre el Canvas.
   * Garantiza legibilidad perfecta y elimina los artefactos borrosos de texto pixelado.
   *
   * @param ctx - Contexto 2D del Canvas de destino.
   * @param label - Datos de la etiqueta de calle (texto, posición, orientación).
   */
  public static drawStreetLabel(
    ctx: CanvasRenderingContext2D,
    label: StreetLabel
  ): void {
    ctx.save();
    ctx.translate(label.x, label.y);

    if (label.angleDegrees) {
      ctx.rotate((label.angleDegrees * Math.PI) / 180);
    }

    // Configurar tipografía nítida normal
    const isAvenue = label.type === 'avenue' || label.type === 'roundabout';
    ctx.font = isAvenue
      ? 'bold 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : 'bold 9.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(label.text);
    const paddingX = 7;
    const paddingY = 3.5;
    const badgeWidth = textMetrics.width + paddingX * 2;
    const badgeHeight = 16;

    // Placa de fondo con contraste oscuro y borde sutil
    ctx.fillStyle = label.type === 'park'
      ? 'rgba(5, 150, 105, 0.92)'
      : 'rgba(30, 39, 46, 0.92)';
    ctx.strokeStyle = label.type === 'avenue'
      ? 'rgba(255, 211, 42, 0.9)'
      : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;

    const cornerRadius = 4;
    const rx = -badgeWidth / 2;
    const ry = -badgeHeight / 2;

    // Dibujar rectángulo redondeado
    ctx.beginPath();
    ctx.roundRect(rx, ry, badgeWidth, badgeHeight, cornerRadius);
    ctx.fill();
    ctx.stroke();

    // Texto frontal blanco/oro nítido
    ctx.fillStyle = label.type === 'avenue' ? '#ffd32a' : '#ffffff';
    ctx.fillText(label.text, 0, 1);

    ctx.restore();
  }

  /**
   * Dibuja una colección de rótulos viales sobre el canvas.
   *
   * @param ctx - Contexto 2D del canvas.
   * @param labels - Lista de etiquetas a renderizar.
   */
  public static drawStreetLabels(
    ctx: CanvasRenderingContext2D,
    labels: StreetLabel[]
  ): void {
    for (let i = 0; i < labels.length; i++) {
      PixelRasterizer.drawStreetLabel(ctx, labels[i]);
    }
  }

  /**
   * Transfiere el búfer de píxeles discreto a un elemento HTMLCanvasElement destino.
   *
   * @param canvas - Elemento canvas nativo de HTML5 donde se dibujará.
   * @param blockSize - Tamaño de visualización de cada bloque en píxeles de pantalla (por defecto 5).
   * @param options - Parámetros de efectos visuales (grilla, scanlines, etiquetas).
   */
  public renderToCanvas(
    canvas: HTMLCanvasElement,
    blockSize = 5,
    options: { showGrid?: boolean; scanlines?: boolean; labels?: StreetLabel[] } = {}
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    canvas.width = this.gridWidth * blockSize;
    canvas.height = this.gridHeight * blockSize;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        ctx.fillStyle = this.grid[y][x];
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

        if (options.showGrid && blockSize >= 4) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
      }
    }

    if (options.scanlines) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let sy = 0; sy < canvas.height; sy += 2) {
        ctx.fillRect(0, sy, canvas.width, 1);
      }
    }

    if (options.labels && options.labels.length > 0) {
      PixelRasterizer.drawStreetLabels(ctx, options.labels);
    }
  }

  /**
   * Rasteriza una imagen fuente (ej. mapa de Google Maps sin texto) convirtiéndola en un mapa de píxeles de 5px.
   * Realiza submuestreo por bloques atómicos y cuantización cromática a la paleta viva de 16-bits,
   * seguida del renderizado opcional de la capa de rótulos viales legibles normales.
   *
   * @param sourceImage - Imagen o Canvas fuente a procesar.
   * @param targetCanvas - Canvas destino donde se renderizará el resultado pixelado.
   * @param options - Opciones de configuración de tamaño de bloque, paleta y etiquetas.
   */
  public static rasterizeMapImage(
    sourceImage: CanvasImageSource,
    targetCanvas: HTMLCanvasElement,
    options: MapRasterizeOptions
  ): void {
    const targetCtx = targetCanvas.getContext('2d');
    if (!targetCtx) return;

    const naturalWidth = (sourceImage as HTMLImageElement).naturalWidth || (sourceImage as any).width || 600;
    const naturalHeight = (sourceImage as HTMLImageElement).naturalHeight || (sourceImage as any).height || 400;

    const blockSize = Math.max(2, Math.floor(options.blockSize || 5));
    const gridCols = Math.floor(naturalWidth / blockSize);
    const gridRows = Math.floor(naturalHeight / blockSize);

    const offscreen = document.createElement('canvas');
    offscreen.width = naturalWidth;
    offscreen.height = naturalHeight;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.drawImage(sourceImage, 0, 0, naturalWidth, naturalHeight);
    const imgData = offCtx.getImageData(0, 0, naturalWidth, naturalHeight);
    const data = imgData.data;

    targetCtx.imageSmoothingEnabled = false;
    targetCanvas.width = naturalWidth;
    targetCanvas.height = naturalHeight;

    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        const sampleX = Math.min(naturalWidth - 1, gx * blockSize + Math.floor(blockSize / 2));
        const sampleY = Math.min(naturalHeight - 1, gy * blockSize + Math.floor(blockSize / 2));
        const pixelIdx = (sampleY * naturalWidth + sampleX) * 4;

        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        let finalColorHex: string;

        if (options.quantizePalette) {
          const match = quantizeRgbToPalette(r, g, b, VIBRANT_16BIT_PALETTE);
          finalColorHex = match.hex;
        } else {
          finalColorHex = `rgb(${r}, ${g}, ${b})`;
        }

        targetCtx.fillStyle = finalColorHex;
        targetCtx.fillRect(gx * blockSize, gy * blockSize, blockSize, blockSize);

        if (options.showGridLines && blockSize >= 4) {
          targetCtx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          targetCtx.lineWidth = 1;
          targetCtx.strokeRect(gx * blockSize, gy * blockSize, blockSize, blockSize);
        }
      }
    }

    if (options.enableScanlines) {
      targetCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let sy = 0; sy < targetCanvas.height; sy += 2) {
        targetCtx.fillRect(0, sy, targetCanvas.width, 1);
      }
    }

    // Renderizar la capa de texto legible normal por encima de los bloques pixelados
    if (options.showLabels && options.labels && options.labels.length > 0) {
      PixelRasterizer.drawStreetLabels(targetCtx, options.labels);
    }
  }
}
