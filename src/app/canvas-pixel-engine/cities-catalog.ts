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
 * Genera un canvas base procedural con el plano urbanístico pixel-art de la ciudad.
 *
 * Dibuja el entramado vial principal, plazas, parques y accidentes geográficos
 * característicos de la ciudad (ej. Calle Real, Av. Giráldez y Río Shullcas para Huancayo).
 * Este canvas sirve como imagen fuente para el rasterizador de 5px y el sistema de 6 zooms.
 *
 * @param city - Configuración de la ciudad a dibujar.
 * @param width - Ancho del lienzo en píxeles (por defecto 1200px).
 * @param height - Alto del lienzo en píxeles (por defecto 800px).
 * @returns HTMLCanvasElement con el plano urbanístico vectorizado.
 */
export function generateCityBaseCanvas(city: CityConfig, width = 1200, height = 800): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Fondo urbano / bloques residenciales
  ctx.fillStyle = '#1e293b'; // Asfalto / base ciudad oscura pixelada
  ctx.fillRect(0, 0, width, height);

  // Cuadrícula de manzanas urbanas
  ctx.fillStyle = '#0f172a';
  const blockW = width / 12;
  const blockH = height / 8;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      ctx.fillRect(c * blockW + 4, r * blockH + 4, blockW - 8, blockH - 8);
    }
  }

  if (city.id === 'huancayo') {
    // 1. Río Shullcas en azul brillante
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.15);
    ctx.bezierCurveTo(width * 0.3, height * 0.22, width * 0.6, height * 0.18, width, height * 0.32);
    ctx.stroke();

    // 2. Parques principales (Plaza Constitución, Huamanmarca, Identidad Wanka)
    // Plaza Constitución
    ctx.fillStyle = '#059669';
    ctx.fillRect(width * 0.44, height * 0.36, width * 0.14, height * 0.14);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(width * 0.44, height * 0.36, width * 0.14, height * 0.14);

    // Parque Huamanmarca
    ctx.fillStyle = '#047857';
    ctx.fillRect(width * 0.40, height * 0.56, width * 0.12, height * 0.13);

    // Parque de la Identidad
    ctx.fillStyle = '#065f46';
    ctx.fillRect(width * 0.72, height * 0.10, width * 0.14, height * 0.14);

    // 3. Avenidas principales de Huancayo
    // Calle Real (Eje comercial central N-S)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(width * 0.50, 0);
    ctx.lineTo(width * 0.52, height);
    ctx.stroke();

    // Línea divisoria blanca en Calle Real
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(width * 0.50, 0);
    ctx.lineTo(width * 0.52, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Av. Ferrocarril (paralela a Calle Real)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(width * 0.35, 0);
    ctx.lineTo(width * 0.36, height);
    ctx.stroke();

    // Av. Giráldez (E-W conectando hacia la plaza)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(width * 0.44, height * 0.43);
    ctx.lineTo(width, height * 0.41);
    ctx.stroke();

    // Jr. Puno
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.40);
    ctx.lineTo(width, height * 0.38);
    ctx.stroke();

    // Jr. Calixto
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.58);
    ctx.lineTo(width, height * 0.56);
    ctx.stroke();
  } else {
    // Plano genérico con plaza central y cuadrícula de avenidas
    ctx.fillStyle = '#059669';
    ctx.fillRect(width * 0.42, height * 0.40, width * 0.16, height * 0.16);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, 0);
    ctx.lineTo(width * 0.5, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height * 0.48);
    ctx.lineTo(width, height * 0.48);
    ctx.stroke();
  }

  return canvas;
}
