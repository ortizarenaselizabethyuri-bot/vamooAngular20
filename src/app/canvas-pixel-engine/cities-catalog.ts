/**
 * @fileoverview Catálogo de Ciudades, Lugares (POIs), Calles y Misiones para Vamoo.
 *
 * Provee configuraciones urbanas completas y geolocalizadas para diferentes ciudades del Perú
 * (Huancayo, Lima, Cusco, Arequipa). Permite al mapa pixel-art adaptar dinámicamente
 * los puntos de interés, rótulos viales y misiones activas según la ubicación real del aventurero.
 */

import { PoiMarker, StreetTextLabel, Mission } from '../components/pixel-map-viewer/pixel-map-viewer.component';

/**
 * Coordenada geográfica básica (latitud y longitud).
 */
export interface CityCenterCoords {
  /** Latitud en grados decimales */
  lat: number;
  /** Longitud en grados decimales */
  lng: number;
}

/**
 * Límites geográficos de detección de una ciudad (Bounding Box).
 */
export interface CityBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Configuración completa de una ciudad para el motor de juego.
 */
export interface CityConfig {
  /** Identificador único de la ciudad (ej. 'huancayo', 'lima') */
  id: string;
  /** Nombre visible de la ciudad */
  name: string;
  /** Región o departamento */
  region: string;
  /** Emoji representativo */
  icon: string;
  /** Coordenadas centrales de la ciudad */
  center: CityCenterCoords;
  /** Límites para detección automática por GPS */
  bounds: CityBounds;
  /** Puntos de interés (POIs) ubicados en esta ciudad */
  pois: PoiMarker[];
  /** Rótulos de calles principales en esta ciudad */
  streetLabels: StreetTextLabel[];
  /** Misiones de aventura específicas para esta ciudad */
  missions: Mission[];
  /** Ruta de imagen de referencia si existe, o null para mapa procedural */
  imageSourceUrl: string | null;
}

/**
 * Catálogo maestro de ciudades soportadas en Vamoo.
 */
export const CITIES_CATALOG: CityConfig[] = [
  // ── 1. HUANCAYO (JUNÍN) ─────────────────────────────────────────────────────
  {
    id: 'huancayo',
    name: 'Huancayo',
    region: 'Junín',
    icon: '🏔️',
    center: {
      lat: -12.0681,
      lng: -75.2100,
    },
    bounds: {
      minLat: -12.15,
      maxLat: -11.98,
      minLng: -75.28,
      maxLng: -75.14,
    },
    imageSourceUrl: null, // Generación procedural enriquecida de mapa wanka
    pois: [
      {
        id: 'plaza-constitucion',
        name: 'Plaza Constitución',
        type: 'landmark',
        relX: 0.50,
        relY: 0.42,
        icon: '🏛️',
        color: '#f59e0b',
        proximityRadius: 7,
      },
      {
        id: 'catedral-huancayo',
        name: 'Catedral de Huancayo',
        type: 'landmark',
        relX: 0.53,
        relY: 0.38,
        icon: '⛪',
        color: '#8b5cf6',
        proximityRadius: 6,
      },
      {
        id: 'parque-huamanmarca',
        name: 'Parque Huamanmarca',
        type: 'park',
        relX: 0.46,
        relY: 0.62,
        icon: '🌳',
        color: '#10b981',
        proximityRadius: 8,
      },
      {
        id: 'colegio-santa-isabel',
        name: 'Colegio Santa Isabel',
        type: 'school',
        relX: 0.28,
        relY: 0.22,
        icon: '🏫',
        color: '#3b82f6',
        proximityRadius: 7,
      },
      {
        id: 'botica-inkafarma-real',
        name: 'Botica Inkafarma Calle Real',
        type: 'pharmacy',
        relX: 0.52,
        relY: 0.51,
        icon: '💊',
        color: '#ef4444',
        proximityRadius: 5,
      },
      {
        id: 'gran-hotel-huancayo',
        name: 'Gran Hotel Huancayo',
        type: 'hotel',
        relX: 0.70,
        relY: 0.44,
        icon: '🏨',
        color: '#6366f1',
        proximityRadius: 6,
      },
      {
        id: 'restaurante-tradicion-wanka',
        name: 'Rest. Tradición Wanka',
        type: 'restaurant',
        relX: 0.38,
        relY: 0.32,
        icon: '🍽️',
        color: '#f97316',
        proximityRadius: 5,
      },
      {
        id: 'parque-identidad-wanka',
        name: 'Parque de la Identidad',
        type: 'park',
        relX: 0.78,
        relY: 0.16,
        icon: '🗿',
        color: '#10b981',
        proximityRadius: 8,
      },
    ],
    streetLabels: [
      { text: 'Calle Real (Eje Central)', relX: 0.50, relY: 0.52, angleDegrees: 85,  type: 'avenue' },
      { text: 'Av. Giráldez',            relX: 0.62, relY: 0.43, angleDegrees: -10, type: 'avenue' },
      { text: 'Av. Ferrocarril',         relX: 0.35, relY: 0.48, angleDegrees: 82,  type: 'avenue' },
      { text: 'Jr. Puno',                relX: 0.50, relY: 0.39, angleDegrees: -12, type: 'street' },
      { text: 'Jr. Calixto',             relX: 0.51, relY: 0.58, angleDegrees: -15, type: 'street' },
      { text: 'Av. Huancavelica',        relX: 0.20, relY: 0.50, angleDegrees: 86,  type: 'avenue' },
      { text: 'Jr. Ayacucho',            relX: 0.50, relY: 0.47, angleDegrees: -12, type: 'street' },
      { text: 'Paseo La Breña',          relX: 0.68, relY: 0.34, angleDegrees: -25, type: 'street' },
    ],
    missions: [
      {
        id: 'mision-hyo-constitucion',
        title: 'Corazón de Huancayo',
        description: 'Llega a la Plaza Constitución y realiza tu caminata alrededor del monumento cívico.',
        targetPoiId: 'plaza-constitucion',
        xpReward: 35,
        completed: false,
        active: false,
        icon: '🏛️',
        estimatedDistanceM: 260,
      },
      {
        id: 'mision-hyo-huamanmarca',
        title: 'Espíritu de Huamanmarca',
        description: 'Recorre la histórica plaza Huamanmarca y valida tu presencia en el centro wanka.',
        targetPoiId: 'parque-huamanmarca',
        xpReward: 30,
        completed: false,
        active: false,
        icon: '🌳',
        estimatedDistanceM: 380,
      },
      {
        id: 'mision-hyo-santa-isabel',
        title: 'Ruta Estudiantil Isabelina',
        description: 'Avanza hacia el emblemático Colegio Santa Isabel por la Av. Ferrocarril.',
        targetPoiId: 'colegio-santa-isabel',
        xpReward: 40,
        completed: false,
        active: false,
        icon: '🏫',
        estimatedDistanceM: 520,
      },
      {
        id: 'mision-hyo-salud-real',
        title: 'Punto de Salud Calle Real',
        description: 'Pasa por la Botica Inkafarma en el cruce central de Calle Real con Jr. Puno.',
        targetPoiId: 'botica-inkafarma-real',
        xpReward: 20,
        completed: false,
        active: false,
        icon: '💊',
        estimatedDistanceM: 180,
      },
    ],
  },

  // ── 2. LIMA (SAN ISIDRO / MIRAFLORES) ──────────────────────────────────────
  {
    id: 'lima',
    name: 'Lima',
    region: 'Lima Metropolitana',
    icon: '🌊',
    center: {
      lat: -12.1012,
      lng: -77.0319,
    },
    bounds: {
      minLat: -12.35,
      maxLat: -11.75,
      minLng: -77.20,
      maxLng: -76.80,
    },
    imageSourceUrl: '/google_maps_clean_standard.png',
    pois: [
      {
        id: 'bosque-olivar',
        name: 'Bosque El Olivar',
        type: 'park',
        relX: 0.60,
        relY: 0.08,
        icon: '🌳',
        color: '#10b981',
        proximityRadius: 8,
      },
      {
        id: 'colegio-maria-reina',
        name: 'Colegio María Reina',
        type: 'school',
        relX: 0.48,
        relY: 0.91,
        icon: '🏫',
        color: '#3b82f6',
        proximityRadius: 6,
      },
      {
        id: 'farmacia-central',
        name: 'Farmacia Central',
        type: 'pharmacy',
        relX: 0.22,
        relY: 0.52,
        icon: '💊',
        color: '#ef4444',
        proximityRadius: 5,
      },
      {
        id: 'tienda-deportes',
        name: 'Tienda Deportes',
        type: 'store',
        relX: 0.70,
        relY: 0.65,
        icon: '🏪',
        color: '#f59e0b',
        proximityRadius: 5,
      },
      {
        id: 'hotel-santa-cruz',
        name: 'Hotel Santa Cruz',
        type: 'hotel',
        relX: 0.85,
        relY: 0.32,
        icon: '🏨',
        color: '#8b5cf6',
        proximityRadius: 5,
      },
      {
        id: 'restaurante-mirador',
        name: 'Restaurante El Mirador',
        type: 'restaurant',
        relX: 0.32,
        relY: 0.28,
        icon: '🍽️',
        color: '#f97316',
        proximityRadius: 5,
      },
    ],
    streetLabels: [
      { text: 'Av. Felipe Pardo y Aliaga', relX: 0.28, relY: 0.60, angleDegrees: -10,  type: 'avenue' },
      { text: 'Av. Sta. Cruz',             relX: 0.76, relY: 0.48, angleDegrees: -48,  type: 'avenue' },
      { text: 'C. Los Libertadores',       relX: 0.13, relY: 0.38, angleDegrees: 80,   type: 'street' },
      { text: 'C. La República',           relX: 0.39, relY: 0.45, angleDegrees: 80,   type: 'street' },
      { text: 'C. Agustín de la Torre',   relX: 0.58, relY: 0.36, angleDegrees: -52,  type: 'street' },
      { text: 'Ca. Alberto Lynch',         relX: 0.15, relY: 0.82, angleDegrees: -40,  type: 'street' },
      { text: 'Sta. María',               relX: 0.66, relY: 0.83, angleDegrees: -22,  type: 'street' },
      { text: 'C. Independencia',         relX: 0.93, relY: 0.42, angleDegrees: 84,   type: 'street' },
      { text: 'Teruel',                   relX: 0.86, relY: 0.82, angleDegrees: 0,    type: 'street' },
    ],
    missions: [
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
    ],
  },

  // ── 3. CUSCO (CIUDAD IMPERIAL) ──────────────────────────────────────────────
  {
    id: 'cusco',
    name: 'Cusco',
    region: 'Cusco',
    icon: '☀️',
    center: {
      lat: -13.5167,
      lng: -71.9789,
    },
    bounds: {
      minLat: -13.60,
      maxLat: -13.45,
      minLng: -72.05,
      maxLng: -71.90,
    },
    imageSourceUrl: null,
    pois: [
      {
        id: 'plaza-armas-cusco',
        name: 'Plaza de Armas Cusco',
        type: 'landmark',
        relX: 0.50,
        relY: 0.45,
        icon: '🏛️',
        color: '#f59e0b',
        proximityRadius: 8,
      },
      {
        id: 'templo-qorikancha',
        name: 'Templo Qorikancha',
        type: 'landmark',
        relX: 0.62,
        relY: 0.68,
        icon: '☀️',
        color: '#eab308',
        proximityRadius: 7,
      },
      {
        id: 'barrio-san-blas',
        name: 'Barrio San Blas',
        type: 'landmark',
        relX: 0.65,
        relY: 0.28,
        icon: '🎨',
        color: '#8b5cf6',
        proximityRadius: 7,
      },
      {
        id: 'mercado-san-pedro',
        name: 'Mercado Central San Pedro',
        type: 'store',
        relX: 0.32,
        relY: 0.65,
        icon: '🏪',
        color: '#10b981',
        proximityRadius: 6,
      },
    ],
    streetLabels: [
      { text: 'Av. El Sol',       relX: 0.56, relY: 0.62, angleDegrees: 55,  type: 'avenue' },
      { text: 'Calle Triunfo',    relX: 0.58, relY: 0.38, angleDegrees: -30, type: 'street' },
      { text: 'Calle Hatun Rumiyoc', relX: 0.62, relY: 0.33, angleDegrees: -25, type: 'street' },
      { text: 'Calle Santa Clara', relX: 0.38, relY: 0.56, angleDegrees: -15, type: 'street' },
    ],
    missions: [
      {
        id: 'mision-cusco-plaza',
        title: 'Ombligo del Mundo',
        description: 'Camina alrededor de la Plaza de Armas del Cusco y admira la arquitectura inca y colonial.',
        targetPoiId: 'plaza-armas-cusco',
        xpReward: 35,
        completed: false,
        active: false,
        icon: '🏛️',
        estimatedDistanceM: 250,
      },
      {
        id: 'mision-cusco-qorikancha',
        title: 'Santuario del Sol',
        description: 'Desplázate por Av. El Sol hasta el templo Qorikancha para tu checkpoint andino.',
        targetPoiId: 'templo-qorikancha',
        xpReward: 40,
        completed: false,
        active: false,
        icon: '☀️',
        estimatedDistanceM: 450,
      },
    ],
  },

  // ── 4. AREQUIPA (CIUDAD BLANCA) ─────────────────────────────────────────────
  {
    id: 'arequipa',
    name: 'Arequipa',
    region: 'Arequipa',
    icon: '🌋',
    center: {
      lat: -16.3988,
      lng: -71.5369,
    },
    bounds: {
      minLat: -16.48,
      maxLat: -16.32,
      minLng: -71.60,
      maxLng: -71.46,
    },
    imageSourceUrl: null,
    pois: [
      {
        id: 'plaza-armas-aqp',
        name: 'Plaza de Armas Arequipa',
        type: 'landmark',
        relX: 0.50,
        relY: 0.48,
        icon: '🏛️',
        color: '#f59e0b',
        proximityRadius: 8,
      },
      {
        id: 'monasterio-santa-catalina',
        name: 'Monasterio Santa Catalina',
        type: 'landmark',
        relX: 0.44,
        relY: 0.30,
        icon: '⛪',
        color: '#3b82f6',
        proximityRadius: 7,
      },
      {
        id: 'mirador-yanahuara',
        name: 'Mirador de Yanahuara',
        type: 'park',
        relX: 0.35,
        relY: 0.12,
        icon: '🌋',
        color: '#10b981',
        proximityRadius: 8,
      },
      {
        id: 'mercado-san-camilo',
        name: 'Mercado San Camilo',
        type: 'store',
        relX: 0.62,
        relY: 0.66,
        icon: '🏪',
        color: '#ec4899',
        proximityRadius: 6,
      },
    ],
    streetLabels: [
      { text: 'Calle Mercaderes', relX: 0.58, relY: 0.52, angleDegrees: -15, type: 'street' },
      { text: 'Calle Santa Catalina', relX: 0.48, relY: 0.38, angleDegrees: 85, type: 'street' },
      { text: 'Av. Ejército', relX: 0.30, relY: 0.20, angleDegrees: -35, type: 'avenue' },
    ],
    missions: [
      {
        id: 'mision-aqp-plaza',
        title: 'Ciudad Blanca',
        description: 'Llega a la Plaza de Armas de Arequipa y contempla los portales de sillar volcánico.',
        targetPoiId: 'plaza-armas-aqp',
        xpReward: 35,
        completed: false,
        active: false,
        icon: '🏛️',
        estimatedDistanceM: 290,
      },
    ],
  },
];

/**
 * Busca una ciudad por su identificador único.
 *
 * @param cityId - Identificador de la ciudad (ej. 'huancayo', 'lima').
 * @returns CityConfig encontrada o la primera ciudad por defecto (Huancayo).
 */
export function getCityConfigById(cityId: string): CityConfig {
  const found = CITIES_CATALOG.find((c) => c.id.toLowerCase() === cityId.toLowerCase());
  return found || CITIES_CATALOG[0]; // Huancayo por defecto
}

/**
 * Detecta automáticamente la ciudad más cercana a un par de coordenadas geográficas.
 *
 * Utiliza verificación de Bounding Box primero, y luego distancia Haversine
 * para asignar la ciudad correcta sin necesidad de llamadas de red.
 *
 * @param lat - Latitud decimal del usuario.
 * @param lng - Longitud decimal del usuario.
 * @returns CityConfig correspondiente o la ciudad más próxima.
 */
export function detectCityByCoords(lat: number, lng: number): CityConfig {
  // 1. Verificación por Bounding Box exacto
  for (const city of CITIES_CATALOG) {
    const b = city.bounds;
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return city;
    }
  }

  // 2. Si está fuera de los bounding boxes, encontrar la más cercana por Haversine
  let closestCity = CITIES_CATALOG[0];
  let minDistance = Infinity;

  for (const city of CITIES_CATALOG) {
    const dist = calculateDistance(lat, lng, city.center.lat, city.center.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = city;
    }
  }

  return closestCity;
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas geográficas mediante Haversine.
 *
 * @param lat1 - Latitud punto 1.
 * @param lon1 - Longitud punto 1.
 * @param lat2 - Latitud punto 2.
 * @param lon2 - Longitud punto 2.
 * @returns Distancia en kilómetros.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Dibuja una manzana urbana completa rellena de casitas y edificios con texturas individuales.
 * Incluye techos de tejas terracota/arcilla, fachadas de estuco, ventanas con reflejo y patios interiores.
 *
 * @param ctx - Contexto Canvas 2D donde se dibuja la manzana.
 * @param bx - Coordenada X del origen de la manzana.
 * @param by - Coordenada Y del origen de la manzana.
 * @param bw - Ancho de la manzana en píxeles.
 * @param bh - Alto de la manzana en píxeles.
 * @param seed - Semilla numérica para variar los estilos arquitectónicos de cada lote.
 * @returns void
 */
function drawTexturedUrbanBlock(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  seed: number
): void {
  // Base de la manzana (acera perimetral en gris claro)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(bx, by, bw, bh);

  // Vereda peatonal interior
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

  // Fondo del lote interior (tierra / patio interior)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(bx + 4, by + 4, bw - 8, bh - 8);

  const innerW = bw - 8;
  const innerH = bh - 8;
  if (innerW < 14 || innerH < 14) return;

  // Dividir la manzana en una cuadrícula de lotes residenciales (2 filas x 2-4 columnas)
  const cols = innerW >= 70 ? 4 : innerW >= 45 ? 3 : 2;
  const rows = innerH >= 50 ? 2 : 1;
  const lotW = Math.floor(innerW / cols);
  const lotH = Math.floor(innerH / rows);

  // Paleta de colores para tejados de casitas (terracota tradicional y arcilla)
  const roofColors = [
    { base: '#c2410c', light: '#ea580c', dark: '#9a3412', ridge: '#f97316' }, // Terracota clásico
    { base: '#b91c1c', light: '#dc2626', dark: '#7f1d1d', ridge: '#ef4444' }, // Arcilla andina
    { base: '#d97706', light: '#f59e0b', dark: '#b45309', ridge: '#fbbf24' }, // Ocre cerámico
    { base: '#9a3412', light: '#c2410c', dark: '#7c2d12', ridge: '#ea580c' }, // Teja rústica
  ];

  // Paleta de fachadas de estuco y piedra
  const wallColors = ['#fde68a', '#fef08a', '#e2e8f0', '#cbd5e1'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = bx + 4 + c * lotW + 1;
      const ly = by + 4 + r * lotH + 1;
      const lw = lotW - 2;
      const lh = lotH - 2;
      if (lw < 8 || lh < 8) continue;

      const lotSeed = (seed * 17 + r * 13 + c * 29) % 100;
      const roofPalette = roofColors[lotSeed % roofColors.length];
      const wallColor = wallColors[lotSeed % wallColors.length];

      const isTerraceRoof = lotSeed % 5 === 0; // 20% azoteas planas con tanque de agua
      const isLShaped = lotSeed % 7 === 0 && lw > 18 && lh > 18; // 14% casas en L con patio verde

      if (isTerraceRoof) {
        // Fachada de edificio moderno / azotea plana
        ctx.fillStyle = wallColor;
        ctx.fillRect(lx, ly, lw, lh);

        // Suelo de azotea
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(lx + 2, ly + 2, lw - 4, lh - 4);

        // Parapeto perimetral
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx + 1.5, ly + 1.5, lw - 3, lh - 3);

        // Tanque de agua elevado (tinaco azul pixelado característico)
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(lx + lw - 6, ly + 3, 4, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(lx + lw - 5, ly + 4, 2, 2);

        // Ventana en fachada frontal si hay altura
        if (lh >= 14) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(lx + 3, ly + lh - 4, 3, 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(lx + 4, ly + lh - 4, 1, 1);
        }
      } else if (isLShaped) {
        // Casa con patio interior y jardincito verde
        const mainW = Math.floor(lw * 0.7);
        ctx.fillStyle = roofPalette.base;
        ctx.fillRect(lx, ly, mainW, lh);

        // Pendiente iluminada
        ctx.fillStyle = roofPalette.light;
        ctx.fillRect(lx, ly, mainW, Math.floor(lh * 0.45));

        // Caballete
        ctx.fillStyle = roofPalette.ridge;
        ctx.fillRect(lx, ly + Math.floor(lh * 0.45), mainW, 1);

        // Patio interior con arbusto verde esmeralda
        ctx.fillStyle = '#d4c4a0'; // Suelo de tierra / adoquin
        ctx.fillRect(lx + mainW, ly + Math.floor(lh * 0.3), lw - mainW, lh - Math.floor(lh * 0.3));
        ctx.fillStyle = '#10b981'; // Arbusto esmeralda
        ctx.fillRect(lx + mainW + 1, ly + Math.floor(lh * 0.4), lw - mainW - 2, lh - Math.floor(lh * 0.4) - 2);
      } else {
        // Casita tradicional a dos aguas con textura de tejas
        // 1. Pared/Fachada visible
        ctx.fillStyle = wallColor;
        ctx.fillRect(lx, ly + Math.floor(lh * 0.7), lw, Math.floor(lh * 0.3));

        // Ventanas y puerta en fachada
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx + 2, ly + lh - 3, 2, 2);
        if (lw >= 14) {
          ctx.fillRect(lx + lw - 4, ly + lh - 3, 2, 2);
          // Destello celeste en cristal
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(lx + lw - 3, ly + lh - 3, 1, 1);
        }

        // 2. Tejado a dos aguas
        const roofH = Math.floor(lh * 0.75);
        const halfRoofH = Math.floor(roofH / 2);

        // Vertiente soleada (superior)
        ctx.fillStyle = roofPalette.light;
        ctx.fillRect(lx, ly, lw, halfRoofH);

        // Vertiente en sombra (inferior)
        ctx.fillStyle = roofPalette.dark;
        ctx.fillRect(lx, ly + halfRoofH, lw, roofH - halfRoofH);

        // Caballete central del tejado (cumbrera naranja/roja viva)
        ctx.fillStyle = roofPalette.ridge;
        ctx.fillRect(lx, ly + halfRoofH - 1, lw, 2);

        // Textura pixelada de tejas (líneas transversales tenues)
        ctx.fillStyle = roofPalette.base;
        for (let tx = lx + 3; tx < lx + lw - 2; tx += 4) {
          ctx.fillRect(tx, ly, 1, roofH);
        }
      }
    }
  }
}

/**
 * Dibuja un parque o plaza en verde esmeralda vibrante con texturas de césped,
 * senderos adoquinados, arboledas densas y fuente o monumento central.
 *
 * @param ctx - Contexto Canvas 2D donde se dibuja el parque.
 * @param px - Coordenada X del parque.
 * @param py - Coordenada Y del parque.
 * @param pw - Ancho del parque en píxeles.
 * @param ph - Alto del parque en píxeles.
 * @param parkName - Nombre identificador del parque.
 * @param hasFountain - Si es true, dibuja una fuente octagonal con agua cristalina en el centro.
 * @returns void
 */
function drawEmeraldTexturedPark(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  parkName: string,
  hasFountain = true
): void {
  // 1. Acera perimetral adoquinada
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(px - 3, py - 3, pw + 6, ph + 6);

  // 2. Base de césped verde esmeralda profundo
  ctx.fillStyle = '#059669';
  ctx.fillRect(px, py, pw, ph);

  // 3. Textura de césped con esmeralda puro vibrante (#10b981) en patrón ajedrezado/orgánico
  ctx.fillStyle = '#10b981';
  const patchSize = 8;
  for (let gy = py; gy < py + ph; gy += patchSize) {
    for (let gx = px; gx < px + pw; gx += patchSize) {
      if ((Math.floor(gx / patchSize) + Math.floor(gy / patchSize)) % 2 === 0) {
        ctx.fillRect(gx, gy, Math.min(patchSize, px + pw - gx), Math.min(patchSize, py + ph - gy));
      }
    }
  }

  // Chispas de verde brillante / pasto claro (#34d399)
  ctx.fillStyle = '#34d399';
  for (let i = 0; i < (pw * ph) / 120; i++) {
    const rx = px + ((i * 37) % (pw - 4)) + 2;
    const ry = py + ((i * 59) % (ph - 4)) + 2;
    ctx.fillRect(rx, ry, 3, 2);
  }

  // 4. Senderos peatonales de adoquín / arena cálida (#fef3c7)
  const pathColor = '#fef3c7';
  const pathBorder = '#d4c4a0';
  ctx.fillStyle = pathBorder;
  // Sendero horizontal
  ctx.fillRect(px, py + ph / 2 - 4, pw, 8);
  // Sendero vertical
  ctx.fillRect(px + pw / 2 - 4, py, 8, ph);

  ctx.fillStyle = pathColor;
  ctx.fillRect(px, py + ph / 2 - 2, pw, 4);
  ctx.fillRect(px + pw / 2 - 2, py, 4, ph);

  // 5. Fuente o Monumento en el centro neurálgico
  const cx = px + pw / 2;
  const cy = py + ph / 2;
  if (hasFountain) {
    // Estanque octagonal de la fuente
    ctx.fillStyle = '#cbd5e1'; // Borde de piedra
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7'; // Agua cristalina
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();

    // Chorro de agua central
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff'; // Espuma blanca
    ctx.fillRect(cx - 1, cy - 1, 3, 3);
  } else {
    // Monumento / estatua histórica
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - 8, cy - 8, 16, 16);
    ctx.fillStyle = '#d97706'; // Estatua de bronce
    ctx.fillRect(cx - 4, cy - 4, 8, 8);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
  }

  // 6. Arboledas pixeladas con copas en capas (sombra profunda, verde esmeralda y resalte luminoso)
  const treePositions = [
    { x: px + pw * 0.2, y: py + ph * 0.2 },
    { x: px + pw * 0.8, y: py + ph * 0.2 },
    { x: px + pw * 0.2, y: py + ph * 0.8 },
    { x: px + pw * 0.8, y: py + ph * 0.8 },
    { x: px + pw * 0.35, y: py + ph * 0.25 },
    { x: px + pw * 0.65, y: py + ph * 0.75 },
  ];

  for (const t of treePositions) {
    if (t.x < px + 6 || t.x > px + pw - 6 || t.y < py + 6 || t.y > py + ph - 6) continue;
    // Sombra del árbol en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(t.x + 2, t.y + 3, 8, 0, Math.PI * 2);
    ctx.fill();

    // Copa base — verde bosque profundo (#065f46)
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Copa media — verde esmeralda puro (#10b981)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(t.x - 1, t.y - 1, 6, 0, Math.PI * 2);
    ctx.fill();

    // Resalte superior — verde menta claro (#6ee7b7)
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(t.x - 3, t.y - 4, 4, 3);

    // Tronco visible en el centro
    ctx.fillStyle = '#78350f';
    ctx.fillRect(t.x - 1, t.y + 3, 2, 3);
  }
}

/**
 * Dibuja un tramo vial con asfalto de alto contraste, veredas laterales y demarcación vial.
 *
 * @param ctx - Contexto Canvas 2D donde se dibuja la vía.
 * @param x1 - Coordenada X inicial.
 * @param y1 - Coordenada Y inicial.
 * @param x2 - Coordenada X final.
 * @param y2 - Coordenada Y final.
 * @param roadWidth - Ancho total de la calzada en píxeles.
 * @param isAvenue - Si es true, añade doble línea amarilla y veredas más anchas.
 * @param isRail - Si es true, añade durmientes de madera y rieles de acero (ferrocarril).
 * @returns void
 */
function drawRoadWithMarkings(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  roadWidth: number,
  isAvenue = false,
  isRail = false
): void {
  // 1. Veredas peatonales laterales (gris medio claro)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = roadWidth + 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 2. Calzada principal de asfalto carbón de alto contraste (#1e293b)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = roadWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (isRail) {
    // Vía férrea con rieles y durmientes
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const steps = Math.floor(len / 8);

    ctx.strokeStyle = '#451a03'; // Durmientes de madera oscura
    ctx.lineWidth = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      const nx = -dy / len;
      const ny = dx / len;
      ctx.beginPath();
      ctx.moveTo(px - nx * 5, py - ny * 5);
      ctx.lineTo(px + nx * 5, py + ny * 5);
      ctx.stroke();
    }

    // Dos rieles metálicos brillantes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    const nx = -dy / len;
    const ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(x1 - nx * 3, y1 - ny * 3);
    ctx.lineTo(x2 - nx * 3, y2 - ny * 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1 + nx * 3, y1 + ny * 3);
    ctx.lineTo(x2 + nx * 3, y2 + ny * 3);
    ctx.stroke();
  } else if (isAvenue) {
    // Doble línea divisoria amarilla (#fbbf24) para avenidas principales
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else {
    // Línea divisoria blanca segmentada para calles regulares
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Dibuja un cruce peatonal (paso de cebra) en las intersecciones viales.
 *
 * @param ctx - Contexto Canvas 2D.
 * @param cx - Coordenada X central del cruce.
 * @param cy - Coordenada Y central del cruce.
 * @param width - Ancho del paso peatonal.
 * @param isVertical - True si el cruce es en dirección vertical.
 * @returns void
 */
function drawZebraCrossing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  isVertical = false
): void {
  ctx.fillStyle = '#ffffff';
  const stripeCount = 4;
  const stripeLen = 10;
  const stripeThickness = 2.5;

  for (let i = 0; i < stripeCount; i++) {
    const offset = (i - (stripeCount - 1) / 2) * 5;
    if (isVertical) {
      ctx.fillRect(cx + offset - stripeThickness / 2, cy - stripeLen / 2, stripeThickness, stripeLen);
    } else {
      ctx.fillRect(cx - stripeLen / 2, cy + offset - stripeThickness / 2, stripeLen, stripeThickness);
    }
  }
}

/**
 * Genera un canvas base procedural con el plano urbanístico pixel-art de la ciudad.
 *
 * Dibuja el entramado vial principal con asfalto de alto contraste y veredas,
 * manzanas urbanas densamente pobladas con casitas de techos terracota y fachadas de estuco,
 * áreas verdes y parques en verde esmeralda vibrante (#10b981) con texturas y arboledas,
 * y accidentes geográficos reales característicos (ej. Calle Real, Av. Giráldez y Río Shullcas para Huancayo).
 * Este canvas sirve como imagen fuente para el rasterizador de 5px y el sistema de 6 zooms.
 *
 * @param city - Configuración de la ciudad a dibujar.
 * @param width - Ancho del lienzo en píxeles (por defecto 1200px).
 * @param height - Alto del lienzo en píxeles (por defecto 800px).
 * @returns HTMLCanvasElement con el plano urbanístico vectorizado de alta fidelidad.
 */
export function generateCityBaseCanvas(city: CityConfig, width = 1200, height = 800): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Suelo base urbano / asfalto de fondo
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  // 2. Cuadrícula de manzanas residenciales con casitas y edificios texturizados
  const cols = 12;
  const rows = 8;
  const blockW = width / cols;
  const blockH = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = c * blockW + 6;
      const by = r * blockH + 6;
      const bw = blockW - 12;
      const bh = blockH - 12;

      // Saltar manzanas ocupadas por parques principales o ríos para no taparlos
      if (city.id === 'huancayo') {
        // Área reservada para Plaza Constitución
        if (c >= 5 && c <= 6 && r >= 2 && r <= 3) continue;
        // Área reservada para Parque Huamanmarca
        if (c >= 4 && c <= 5 && r >= 4 && r <= 5) continue;
        // Área reservada para Parque de la Identidad
        if (c >= 8 && c <= 9 && r >= 0 && r <= 1) continue;
        // Área reservada para Río Shullcas
        if (r === 1 && (c === 0 || c === 1 || c === 2 || c === 3 || c === 4)) continue;
        if (r === 2 && (c >= 5 && c <= 11)) continue;
      } else {
        // En ciudades genéricas reservar el centro
        if (c >= 5 && c <= 6 && r >= 3 && r <= 4) continue;
      }

      drawTexturedUrbanBlock(ctx, bx, by, bw, bh, r * 13 + c * 31);
    }
  }

  // 3. Geografía y urbanismo específico por ciudad
  if (city.id === 'huancayo') {
    // ── Río Shullcas (accidente natural del norte de Huancayo) ────────────────
    // Ribera de piedra
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.15);
    ctx.bezierCurveTo(width * 0.3, height * 0.22, width * 0.6, height * 0.18, width, height * 0.32);
    ctx.stroke();

    // Agua profunda
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.15);
    ctx.bezierCurveTo(width * 0.3, height * 0.22, width * 0.6, height * 0.18, width, height * 0.32);
    ctx.stroke();

    // Ondas y corrientes de agua cristalina
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.15);
    ctx.bezierCurveTo(width * 0.3, height * 0.22, width * 0.6, height * 0.18, width, height * 0.32);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Parques en verde esmeralda con texturas y fuentes ───────────────────────
    // Plaza Constitución (Centro histórico, catedral y gran fuente)
    drawEmeraldTexturedPark(
      ctx,
      width * 0.44,
      height * 0.34,
      width * 0.14,
      height * 0.15,
      'Plaza Constitución',
      true
    );

    // Parque Huamanmarca (Sede municipal y monumento arqueológico Huanca)
    drawEmeraldTexturedPark(
      ctx,
      width * 0.38,
      height * 0.54,
      width * 0.13,
      height * 0.14,
      'Parque Huamanmarca',
      false
    );

    // Parque de la Identidad Wanka (Zona norte-este, arquitectura vernácula)
    drawEmeraldTexturedPark(
      ctx,
      width * 0.72,
      height * 0.08,
      width * 0.15,
      height * 0.15,
      'Parque de la Identidad',
      true
    );

    // ── Vías Principales de Huancayo ──────────────────────────────────────────
    // Calle Real (Eje comercial central N-S de alto tránsito)
    drawRoadWithMarkings(ctx, width * 0.50, 0, width * 0.52, height, 18, true, false);

    // Av. Ferrocarril (Vía con rieles del Ferrocarril Central Andino)
    drawRoadWithMarkings(ctx, width * 0.35, 0, width * 0.36, height, 16, false, true);

    // Av. Giráldez (Eje Este-Oeste conectando la Plaza hacia el cerrito La Libertad)
    drawRoadWithMarkings(ctx, width * 0.44, height * 0.42, width, height * 0.40, 16, true, false);

    // Jr. Puno (Calle transversal histórica)
    drawRoadWithMarkings(ctx, 0, height * 0.38, width, height * 0.36, 12, false, false);

    // Jr. Calixto (Calle transversal del mercado)
    drawRoadWithMarkings(ctx, 0, height * 0.56, width, height * 0.54, 12, false, false);

    // Jr. Ancash
    drawRoadWithMarkings(ctx, 0, height * 0.48, width, height * 0.46, 12, false, false);

    // Jr. Ayacucho
    drawRoadWithMarkings(ctx, 0, height * 0.28, width, height * 0.26, 12, false, false);

    // ── Cruces peatonales de cebra en intersecciones de Calle Real ──────────
    drawZebraCrossing(ctx, width * 0.51, height * 0.37, 18, false);
    drawZebraCrossing(ctx, width * 0.51, height * 0.42, 18, false);
    drawZebraCrossing(ctx, width * 0.51, height * 0.47, 18, false);
    drawZebraCrossing(ctx, width * 0.51, height * 0.55, 18, false);
  } else if (city.id === 'lima') {
    // ── Lima: Plaza Mayor, Río Rímac y avenidas ──────────────────────────────
    // Río Rímac
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.18);
    ctx.bezierCurveTo(width * 0.4, height * 0.22, width * 0.7, height * 0.16, width, height * 0.20);
    ctx.stroke();

    // Plaza Mayor de Lima (Plaza de Armas)
    drawEmeraldTexturedPark(ctx, width * 0.44, height * 0.38, width * 0.14, height * 0.14, 'Plaza Mayor', true);

    // Parque de la Reserva (Circuito Mágico)
    drawEmeraldTexturedPark(ctx, width * 0.42, height * 0.65, width * 0.16, height * 0.18, 'Parque Reserva', true);

    // Av. Abancay (N-S de 6 carriles)
    drawRoadWithMarkings(ctx, width * 0.60, 0, width * 0.61, height, 20, true, false);

    // Av. Tacna (N-S)
    drawRoadWithMarkings(ctx, width * 0.38, 0, width * 0.39, height, 18, true, false);

    // Jirón de la Unión
    drawRoadWithMarkings(ctx, width * 0.48, height * 0.20, width * 0.49, height * 0.60, 10, false, false);
  } else if (city.id === 'cusco') {
    // ── Cusco: Plaza de Armas, Sacsayhuamán y calles incas ──────────────────
    // Sacsayhuamán (colinas verdes al norte)
    drawEmeraldTexturedPark(ctx, width * 0.25, height * 0.05, width * 0.50, height * 0.16, 'Sacsayhuamán', false);

    // Plaza de Armas del Cusco
    drawEmeraldTexturedPark(ctx, width * 0.44, height * 0.40, width * 0.15, height * 0.15, 'Plaza de Armas', true);

    // Plaza Regocijo
    drawEmeraldTexturedPark(ctx, width * 0.35, height * 0.43, width * 0.08, height * 0.08, 'Plaza Regocijo', true);

    // Av. El Sol (eje principal)
    drawRoadWithMarkings(ctx, width * 0.50, height * 0.40, width * 0.65, height, 16, true, false);
  } else if (city.id === 'arequipa') {
    // ── Arequipa: Plaza de Armas, Río Chili y Yanahuara ──────────────────────
    // Río Chili
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(width * 0.30, 0);
    ctx.bezierCurveTo(width * 0.35, height * 0.4, width * 0.32, height * 0.7, width * 0.38, height);
    ctx.stroke();

    // Plaza de Armas de Arequipa (Sillar blanco y gran fuente)
    drawEmeraldTexturedPark(ctx, width * 0.48, height * 0.42, width * 0.14, height * 0.14, 'Plaza de Armas', true);

    // Mirador y Parque de Yanahuara
    drawEmeraldTexturedPark(ctx, width * 0.22, height * 0.24, width * 0.10, height * 0.10, 'Yanahuara', true);

    // Calles principales
    drawRoadWithMarkings(ctx, width * 0.48, 0, width * 0.49, height, 16, true, false);
    drawRoadWithMarkings(ctx, 0, height * 0.46, width, height * 0.45, 14, false, false);
  } else {
    // ── Plano urbano estándar con gran parque central ─────────────────────────
    drawEmeraldTexturedPark(ctx, width * 0.42, height * 0.38, width * 0.16, height * 0.16, 'Plaza Central', true);
    drawRoadWithMarkings(ctx, width * 0.5, 0, width * 0.5, height, 16, true, false);
    drawRoadWithMarkings(ctx, 0, height * 0.48, width, height * 0.48, 14, false, false);
  }

  return canvas;
}
