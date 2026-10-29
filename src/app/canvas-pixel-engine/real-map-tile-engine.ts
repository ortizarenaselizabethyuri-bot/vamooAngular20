/**
 * @fileoverview Motor de Carga y Ensamble de Teselas Cartográficas Reales (RealMapTileEngine).
 *
 * Propósito: Descargar y ensamblar en un lienzo off-screen las teselas geográficas reales
 * correspondientes a las coordenadas exactas del aventurero (latitud y longitud en proyección Web Mercator).
 *
 * Utiliza los servidores de teselas limpias sin etiquetas (CartoDB Voyager No-Labels / OpenStreetMap)
 * con cabeceras CORS permisivas (Access-Control-Allow-Origin: *). Esto permite renderizar en el Canvas 2D
 * la geografía auténtica de cualquier ubicación del mundo (Huancayo, Lima, Cusco, etc.) con fidelidad
 * idéntica a Google Maps, antes de aplicar el rasterizado de bloques de 5px y la paleta de 16-bits.
 */

/**
 * Coordenadas de tesela y píxel en proyección esférica Web Mercator (EPSG:3857).
 */
export interface MercatorCoords {
  /** Posición continua de tesela en el eje X */
  tileX: number;
  /** Posición continua de tesela en el eje Y */
  tileY: number;
  /** Posición del píxel en el lienzo global de la proyección */
  pixelX: number;
  /** Posición del píxel en el lienzo global de la proyección */
  pixelY: number;
}

/**
 * Opciones para la carga y ensamble de teselas del mapa real.
 */
export interface StitchedMapOptions {
  /** Nivel de zoom de las teselas cartográficas (14 a 17, por defecto 16) */
  zoom?: number;
  /** Ancho deseado del lienzo ensamblado en píxeles (por defecto 1200) */
  width?: number;
  /** Alto deseado del lienzo ensamblado en píxeles (por defecto 800) */
  height?: number;
  /** URL base del proveedor de teselas limpias */
  tileServerUrl?: string;
}

/**
 * Caché en memoria para evitar volver a descargar teselas ya obtenidas en la sesión activa.
 */
const TILE_MEMORY_CACHE = new Map<string, HTMLImageElement>();

/**
 * Convierte coordenadas geográficas estándar (latitud, longitud) a coordenadas
 * de tesela y píxel en la proyección Web Mercator para un nivel de zoom determinado.
 *
 * @param lat - Latitud en grados decimales (-85.0511 a 85.0511).
 * @param lng - Longitud en grados decimales (-180 a 180).
 * @param zoom - Nivel de zoom estándar (entero de 0 a 19).
 * @returns MercatorCoords con las posiciones continuas de tesela y píxel.
 */
export function latLngToMercator(lat: number, lng: number, zoom: number): MercatorCoords {
  const numTiles = Math.pow(2, zoom);

  // Proyección horizontal lineal (longitud -> X)
  const tileX = ((lng + 180) / 360) * numTiles;

  // Proyección vertical logarítmica de Mercator (latitud -> Y)
  const latRad = (lat * Math.PI) / 180;
  const sinLat = Math.sin(latRad);
  const clampedSin = Math.max(-0.9999, Math.min(0.9999, sinLat));
  const tileY = ((1 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (2 * Math.PI)) / 2) * numTiles;

  return {
    tileX,
    tileY,
    pixelX: tileX * 256,
    pixelY: tileY * 256,
  };
}

/**
 * Descarga una tesela cartográfica individual como un elemento HTMLImageElement con CORS habilitado.
 *
 * @param url - URL completa de la tesela PNG.
 * @returns Promise<HTMLImageElement> Resuelve cuando la imagen ha sido cargada en memoria.
 */
function loadSingleTileImage(url: string): Promise<HTMLImageElement> {
  const cached = TILE_MEMORY_CACHE.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Requerido para no manchar (taint) el canvas 2D
    img.onload = () => {
      TILE_MEMORY_CACHE.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Reintentar con el servidor de respaldo de OpenStreetMap si CartoDB falla
      const fallbackUrl = url.replace(
        /https:\/\/[abc]\.basemaps\.cartocdn\.com\/rastertiles\/voyager_nolabels/,
        'https://tile.openstreetmap.org'
      );
      if (fallbackUrl !== url) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => {
          TILE_MEMORY_CACHE.set(url, fallbackImg);
          resolve(fallbackImg);
        };
        fallbackImg.onerror = (e) => reject(e);
        fallbackImg.src = fallbackUrl;
      } else {
        reject(new Error(`Error al cargar tesela: ${url}`));
      }
    };
    img.src = url;
  });
}

/**
 * Descarga y ensambla las teselas cartográficas de la ubicación real del usuario,
 * generando un lienzo único que representa fielmente la geografía urbana de Google Maps.
 *
 * El punto (lat, lng) queda ubicado con precisión sub-píxel exactamente en el centro (width/2, height/2)
 * del lienzo resultante.
 *
 * @param lat - Latitud central (ej. -12.0681 para Huancayo).
 * @param lng - Longitud central (ej. -75.2100 para Huancayo).
 * @param options - Opciones de resolución, dimensiones del lienzo y zoom.
 * @returns Promise<HTMLCanvasElement> Canvas con el mapa real ensamblado sin distorsión.
 */
export async function fetchStitchedMapCanvas(
  lat: number,
  lng: number,
  options: StitchedMapOptions = {}
): Promise<HTMLCanvasElement> {
  const zoom = options.zoom ?? 16;
  const width = options.width ?? 1200;
  const height = options.height ?? 800;
  const tileBaseUrl = options.tileServerUrl ?? 'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels';

  // 1. Calcular la posición del centro en píxeles del mundo Mercator
  const centerMercator = latLngToMercator(lat, lng, zoom);

  // 2. Determinar la ventana visible (Bounding Box) en coordenadas de píxeles
  const worldLeft = centerMercator.pixelX - width / 2;
  const worldTop = centerMercator.pixelY - height / 2;

  // 3. Identificar el rango de índices de teselas (X e Y) necesarios para cubrir la ventana
  const minTileX = Math.floor(worldLeft / 256);
  const maxTileX = Math.floor((worldLeft + width) / 256);
  const minTileY = Math.floor(worldTop / 256);
  const maxTileY = Math.floor((worldTop + height) / 256);

  // 4. Crear el canvas de ensamble de salida
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D para ensamble de teselas.');
  }

  // Fondo neutral antes de cargar teselas
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // 5. Preparar la lista de descargas concurrentes de teselas
  interface TileTask {
    tileX: number;
    tileY: number;
    drawX: number;
    drawY: number;
    url: string;
  }

  const tasks: TileTask[] = [];
  const subdomains = ['a', 'b', 'c'];

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      // Manejar envoltura horizontal del mundo (antimeridiano)
      const maxTiles = Math.pow(2, zoom);
      const wrappedTx = ((tx % maxTiles) + maxTiles) % maxTiles;

      // Asignar subdominio balanceado para acelerar la carga en paralelo por HTTP/2
      const subdomain = subdomains[Math.abs(tx + ty) % subdomains.length];
      const url = tileBaseUrl
        .replace(/https:\/\/[abc]\./, `https://${subdomain}.`)
        + `/${zoom}/${wrappedTx}/${ty}.png`;

      // Posición de dibujo en el canvas de ensamble
      const drawX = Math.round(tx * 256 - worldLeft);
      const drawY = Math.round(ty * 256 - worldTop);

      tasks.push({ tileX: tx, tileY: ty, drawX, drawY, url });
    }
  }

  // 6. Descargar todas las teselas en paralelo
  const downloadResults = await Promise.allSettled(
    tasks.map(async (task) => {
      const img = await loadSingleTileImage(task.url);
      return { img, drawX: task.drawX, drawY: task.drawY };
    })
  );

  // 7. Dibujar las teselas descargadas sobre el lienzo
  for (const res of downloadResults) {
    if (res.status === 'fulfilled') {
      const { img, drawX, drawY } = res.value;
      ctx.drawImage(img, drawX, drawY, 256, 256);
    }
  }

  return outputCanvas;
}

