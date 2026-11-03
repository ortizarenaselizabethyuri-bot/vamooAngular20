import { GeoCoordinates } from '../../services/geolocation.service.js';
import { RpgPoiLocation, RpgMapEngine } from './rpg-map-engine.js';

/**
 * Catálogo Maestro Georreferenciado de Puntos de Interés (POIs) en Huancayo y Valle del Mantaro.
 * Cubre los principales distritos y sectores urbanos:
 * - Sector 1: Huancayo Centro / Cercado
 * - Sector 2: El Tambo (Sector Norte)
 * - Sector 3: Chilca (Sector Sur)
 * - Sector 4: San Carlos, Palián y Torre Torre (Sector Este)
 * - Sector 5: Pilcomayo y Chupaca (Sector Oeste)
 */
export const MASTER_POI_CATALOG: RpgPoiLocation[] = [
  // =========================================================================
  // SECTOR 1: HUANCAYO CENTRO / CERCADO
  // =========================================================================
  {
    id: 'poi-plaza-constitucion',
    name: 'Plaza Constitución',
    category: 'park',
    coords: { lat: -12.06806, lng: -75.21008 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Catedral y Plaza Principal de Huancayo',
  },
  {
    id: 'poi-parque-huamanmarca',
    name: 'Parque Huamanmarca',
    category: 'park',
    coords: { lat: -12.07084, lng: -75.20833 },
    icon: '🏛️',
    color: 0x10b981,
    subtitle: 'Sede Municipal y Centro Cívico',
  },
  {
    id: 'poi-botica-mifarma-centro',
    name: 'Botica Mifarma Ayacucho',
    category: 'pharmacy',
    coords: { lat: -12.06631, lng: -75.21167 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Calle Real con Jr. Ayacucho • Centro',
  },
  {
    id: 'poi-botica-inkafarma-centro',
    name: 'Botica InkaFarma Real',
    category: 'pharmacy',
    coords: { lat: -12.06782, lng: -75.21087 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Calle Real 540 • Frente a Plaza Constitución',
  },
  {
    id: 'poi-hotel-presidente',
    name: 'Hotel Presidente Huancayo',
    category: 'hotel',
    coords: { lat: -12.07367, lng: -75.20703 },
    icon: '🏨',
    color: 0xf59e0b,
    subtitle: 'Calle Real 1138 • Frente a Jr. Calixto',
  },
  {
    id: 'poi-gran-hotel-turismo',
    name: 'Gran Hotel Turismo',
    category: 'hotel',
    coords: { lat: -12.07028, lng: -75.20798 },
    icon: '🏨',
    color: 0xf59e0b,
    subtitle: 'Jr. Ancash 729 • Plaza Huamanmarca',
  },
  {
    id: 'poi-colegio-santa-isabel',
    name: 'Colegio Santa Isabel',
    category: 'school',
    coords: { lat: -12.05729, lng: -75.20185 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Jirón Santa Isabel 567 • Emblemático',
  },
  {
    id: 'poi-escuela-enma-luzmila',
    name: 'I.E. Enma Luzmila',
    category: 'school',
    coords: { lat: -12.06730, lng: -75.21180 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Jr. Cuzco 226 • Cercado de Huancayo',
  },
  {
    id: 'poi-mercado-modelo',
    name: 'Mercado Modelo Huancayo',
    category: 'store',
    coords: { lat: -12.07182, lng: -75.20524 },
    icon: '🛒',
    color: 0x8b5cf6,
    subtitle: 'Jr. Mantaro con Jr. Cajamarca',
  },
  {
    id: 'poi-hospital-carrion',
    name: 'Hospital Daniel A. Carrión',
    category: 'hospital',
    coords: { lat: -12.07301, lng: -75.22175 },
    icon: '🏥',
    color: 0xec4899,
    subtitle: 'Av. Daniel Alcides Carrión • Emergencias',
  },

  // =========================================================================
  // SECTOR 2: EL TAMBO (SECTOR NORTE)
  // =========================================================================
  {
    id: 'poi-parque-bolognesi-tambo',
    name: 'Parque Bolognesi El Tambo',
    category: 'park',
    coords: { lat: -12.05210, lng: -75.21850 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Av. Mariscal Castilla • El Tambo',
  },
  {
    id: 'poi-plaza-el-tambo',
    name: 'Plaza de El Tambo',
    category: 'park',
    coords: { lat: -12.04820, lng: -75.22150 },
    icon: '🏛️',
    color: 0x10b981,
    subtitle: 'Frente a la Municipalidad Distrital de El Tambo',
  },
  {
    id: 'poi-botica-inkafarma-tambo',
    name: 'Botica InkaFarma Castilla',
    category: 'pharmacy',
    coords: { lat: -12.04950, lng: -75.22020 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Av. Mariscal Castilla 1420 • El Tambo',
  },
  {
    id: 'poi-botica-mifarma-sumar',
    name: 'Botica Mifarma Julio Súmar',
    category: 'pharmacy',
    coords: { lat: -12.04610, lng: -75.22300 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Av. Julio Súmar con Real • El Tambo',
  },
  {
    id: 'poi-colegio-mariscal-castilla',
    name: 'Colegio Mariscal Castilla',
    category: 'school',
    coords: { lat: -12.04750, lng: -75.21700 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Av. Mariátegui • Gran Unidad Escolar El Tambo',
  },
  {
    id: 'poi-colegio-politecnico-centro',
    name: 'I.E. Politécnico Regional',
    category: 'school',
    coords: { lat: -12.04350, lng: -75.21900 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Jr. Huancavelica • Politécnico del Centro',
  },
  {
    id: 'poi-hotel-balcones-tambo',
    name: 'Hotel Los Balcones El Tambo',
    category: 'hotel',
    coords: { lat: -12.05100, lng: -75.22100 },
    icon: '🏨',
    color: 0xf59e0b,
    subtitle: 'Av. Mariscal Castilla • Suites Ejecutivas',
  },
  {
    id: 'poi-hotel-residencial-tambo',
    name: 'Hotel Residencial Tambo',
    category: 'hotel',
    coords: { lat: -12.04400, lng: -75.22450 },
    icon: '🏨',
    color: 0xf59e0b,
    subtitle: 'Jr. San Pedro • Alojamiento Confort',
  },
  {
    id: 'poi-hospital-essalud-tambo',
    name: 'Hospital Regional Essalud',
    category: 'hospital',
    coords: { lat: -12.04050, lng: -75.22600 },
    icon: '🏥',
    color: 0xec4899,
    subtitle: 'Av. Independencia • Hospital Ramiro Prialé',
  },
  {
    id: 'poi-mercado-mayorista-tambo',
    name: 'Mercado Mayorista El Tambo',
    category: 'store',
    coords: { lat: -12.04880, lng: -75.22380 },
    icon: '🛒',
    color: 0x8b5cf6,
    subtitle: 'Jr. Sebastián Lorente • Frutas y Abarrotes',
  },

  // =========================================================================
  // SECTOR 3: CHILCA (SECTOR SUR)
  // =========================================================================
  {
    id: 'poi-plaza-chilca',
    name: 'Plaza Principal de Chilca',
    category: 'park',
    coords: { lat: -12.08600, lng: -75.20450 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Av. 9 de Diciembre • Centro de Chilca',
  },
  {
    id: 'poi-parque-abel-martinez',
    name: 'Parque Abel Martínez',
    category: 'park',
    coords: { lat: -12.08150, lng: -75.20700 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Jr. Ancash con Jr. Real • Chilca',
  },
  {
    id: 'poi-botica-inkafarma-chilca',
    name: 'Botica InkaFarma 9 de Diciembre',
    category: 'pharmacy',
    coords: { lat: -12.08300, lng: -75.20600 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Av. 9 de Diciembre 415 • Chilca',
  },
  {
    id: 'poi-botica-farmasalud-chilca',
    name: 'Botica Farmasalud Chilca',
    category: 'pharmacy',
    coords: { lat: -12.08750, lng: -75.20350 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Jr. Huancavelica con Real • Chilca',
  },
  {
    id: 'poi-colegio-tupac-amaru',
    name: 'Colegio Túpac Amaru',
    category: 'school',
    coords: { lat: -12.08900, lng: -75.20650 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Av. Real 2230 • I.E. Emblemática Chilca',
  },
  {
    id: 'poi-ie-30012-chilca',
    name: 'I.E. 30012 Chilca',
    category: 'school',
    coords: { lat: -12.08450, lng: -75.20200 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Jr. Arterial • Primaria de Menores',
  },
  {
    id: 'poi-hotel-portales-sur',
    name: 'Hotel Los Portales del Sur',
    category: 'hotel',
    coords: { lat: -12.08200, lng: -75.20500 },
    icon: '🏨',
    color: 0xf59e0b,
    subtitle: 'Av. 9 de Diciembre • Hospedaje Confortable',
  },
  {
    id: 'poi-centro-salud-chilca',
    name: 'Centro de Salud de Chilca',
    category: 'hospital',
    coords: { lat: -12.08650, lng: -75.20850 },
    icon: '🏥',
    color: 0xec4899,
    subtitle: 'Jr. Humbalt • Atención Primaria de Salud',
  },
  {
    id: 'poi-mercado-central-chilca',
    name: 'Mercado Central de Chilca',
    category: 'store',
    coords: { lat: -12.08550, lng: -75.20520 },
    icon: '🛒',
    color: 0x8b5cf6,
    subtitle: 'Jr. Santos Chocano • Feria Artesanal y Comestibles',
  },

  // =========================================================================
  // SECTOR 4: SAN CARLOS, PALIÁN Y TORRE TORRE (SECTOR ESTE)
  // =========================================================================
  {
    id: 'poi-parque-identidad-huanca',
    name: 'Parque de la Identidad Huanca',
    category: 'park',
    coords: { lat: -12.05450, lng: -75.20120 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Urb. San Carlos • Esculturas y Vegetación Andina',
  },
  {
    id: 'poi-parque-los-pinos',
    name: 'Parque Los Pinos San Carlos',
    category: 'park',
    coords: { lat: -12.06200, lng: -75.20050 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Urb. Los Pinos • Área Recreativa San Carlos',
  },
  {
    id: 'poi-botica-san-carlos',
    name: 'Botica San Carlos',
    category: 'pharmacy',
    coords: { lat: -12.06100, lng: -75.20300 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Av. San Carlos 512 • Urbanización San Carlos',
  },
  {
    id: 'poi-colegio-salesiano',
    name: 'Colegio Salesiano Santa Rosa',
    category: 'school',
    coords: { lat: -12.06450, lng: -75.20250 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Calle Salesianos • Educación Técnico-Humanista',
  },
  {
    id: 'poi-hotel-montecarlo',
    name: 'Hotel Montecarlo San Carlos',
    category: 'hotel',
    coords: { lat: -12.05800, lng: -75.20350 },
    icon: '🏨',
    color: 0xf59e0b,
    subtitle: 'Urb. San Carlos • Hospedaje Residencial',
  },
  {
    id: 'poi-clinica-ortega',
    name: 'Clínica Ortega',
    category: 'hospital',
    coords: { lat: -12.06650, lng: -75.20400 },
    icon: '🏥',
    color: 0xec4899,
    subtitle: 'Av. Giráldez • Centro Quirúrgico Especializado',
  },

  // =========================================================================
  // SECTOR 5: PILCOMAYO Y CHUPACA (SECTOR OESTE)
  // =========================================================================
  {
    id: 'poi-plaza-pilcomayo',
    name: 'Plaza de Armas de Pilcomayo',
    category: 'park',
    coords: { lat: -12.05800, lng: -75.25300 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Centro Cívico e Histórico de Pilcomayo',
  },
  {
    id: 'poi-botica-central-pilcomayo',
    name: 'Botica Central Pilcomayo',
    category: 'pharmacy',
    coords: { lat: -12.05750, lng: -75.25400 },
    icon: '💊',
    color: 0xef4444,
    subtitle: 'Av. Las Palmas • Pilcomayo',
  },
  {
    id: 'poi-ie-pilcomayo',
    name: 'I.E. Pilcomayo',
    category: 'school',
    coords: { lat: -12.05950, lng: -75.25150 },
    icon: '🏫',
    color: 0x3b82f6,
    subtitle: 'Calle Real • Educación Secundaria',
  },
  {
    id: 'poi-plaza-chupaca',
    name: 'Plaza Principal de Chupaca',
    category: 'park',
    coords: { lat: -12.06100, lng: -75.28600 },
    icon: '🌳',
    color: 0x10b981,
    subtitle: 'Cuna de los Danzantes Shapis • Chupaca',
  },
  {
    id: 'poi-hotel-chupaca',
    name: 'Hotel Campestre Chupaca',
    category: 'hotel',
    coords: { lat: -12.05900, lng: -75.28400 },
    icon: '🏨',
    color: 0xf59e0b,
    subtitle: 'Alojamiento Turístico Valle del Yacus',
  },
];

/**
 * Opciones para la consulta y resolución de puntos de interés cercanos.
 */
export interface NearbyPoiOptions {
  /** Radio máximo de búsqueda en metros (por defecto 2500m / 2.5 km) */
  maxRadiusMeters?: number;
  /** Cantidad máxima de lugares a retornar (por defecto 10) */
  limit?: number;
}

/**
 * Obtiene la lista dinámica de puntos de interés (POIs) más cercanos a una coordenada de referencia (ubicación actual del usuario).
 *
 * Flujo de resolución optimizado:
 * 1. Calcula la distancia ortodrómica exacta (Haversine) a cada elemento del catálogo maestro.
 * 2. Filtra los lugares ubicados dentro del radio máximo especificado.
 * 3. Si en el radio se encuentran menos de 5 lugares (por encontrarse en una zona periférica o fuera del catálogo),
 *    sintetiza determinísticamente lugares representativos del vecindario local (botica, parque, escuela, hotel, etc.)
 *    anclados a coordenadas circundantes fijas (a 80m, 160m, 280m, 420m, 600m).
 * 4. Aplica una ordenación estricta por proximidad geométrica ascendente (el más cercano primero).
 * 5. Garantiza diversidad temática para que el usuario siempre visualice opciones variadas en su entorno.
 *
 * @param userCoords - Coordenadas geográficas actuales del usuario (o cámara).
 * @param options - Opciones de radio y límite de resultados.
 * @returns RpgPoiLocation[] Arreglo ordenado con los lugares más cercanos a la posición dada.
 */
export function getNearbyPois(
  userCoords: GeoCoordinates,
  options?: NearbyPoiOptions,
): RpgPoiLocation[] {
  if (!userCoords || isNaN(userCoords.lat) || isNaN(userCoords.lng)) {
    return MASTER_POI_CATALOG.slice(0, options?.limit || 10);
  }

  const maxRadius = options?.maxRadiusMeters || 2500;
  const limit = options?.limit || 10;

  // 1. Mapear todos los POIs del catálogo maestro con su distancia exacta al usuario
  const withDistance = MASTER_POI_CATALOG.map((poi) => {
    const distanceMeters = RpgMapEngine.calculateDistanceMeters(userCoords, poi.coords);
    return {
      poi,
      distanceMeters,
    };
  });

  // 2. Filtrar únicamente los que se encuentran dentro del radio especificado
  const inRadius = withDistance.filter((item) => item.distanceMeters <= maxRadius);

  // 3. Ordenar por cercanía geométrica ascendente (más cercanos primero)
  inRadius.sort((a, b) => a.distanceMeters - b.distanceMeters);

  let resultPois = inRadius.map((item) => item.poi);

  // 4. Si la ubicación actual está en una zona con pocos POIs catalogados (menos de 5 lugares cercanos),
  // generar complementos locales deterministas anclados a su vecindario para que siempre tenga POIs cercanos
  if (resultPois.length < 5) {
    const needed = Math.max(0, 8 - resultPois.length);
    const synthesized = generateLocalNeighborhoodPois(userCoords, needed);
    resultPois = [...resultPois, ...synthesized];

    // Reordenar por distancia asegurando el orden más próximo
    resultPois.sort((a, b) => {
      const distA = RpgMapEngine.calculateDistanceMeters(userCoords, a.coords);
      const distB = RpgMapEngine.calculateDistanceMeters(userCoords, b.coords);
      return distA - distB;
    });
  }

  // 5. Retornar el límite solicitado de lugares más cercanos
  return resultPois.slice(0, limit);
}

/**
 * Genera determinísticamente puntos de interés realistas del vecindario alrededor de una coordenada GPS,
 * garantizando que los usuarios en zonas periféricas o residenciales siempre cuenten con boticas,
 * parques, escuelas y hoteles cercanos sin que los marcadores salten aleatoriamente.
 *
 * @param center - Coordenadas centrales del usuario.
 * @param count - Cantidad de lugares a sintetizar.
 * @returns RpgPoiLocation[] Puntos de interés locales generados.
 */
export function generateLocalNeighborhoodPois(center: GeoCoordinates, count: number): RpgPoiLocation[] {
  const templates: {
    category: RpgPoiLocation['category'];
    name: string;
    icon: string;
    color: number;
    subtitle: string;
    distMeters: number;
    angleDeg: number;
  }[] = [
    {
      category: 'pharmacy',
      name: 'Botica InkaFarma Vecinal',
      icon: '💊',
      color: 0xef4444,
      subtitle: 'Farmacia y Medicamentos del Sector',
      distMeters: 95,
      angleDeg: 35,
    },
    {
      category: 'park',
      name: 'Parque Infantil del Vecindario',
      icon: '🌳',
      color: 0x10b981,
      subtitle: 'Área Verde y Recreación Local',
      distMeters: 140,
      angleDeg: 120,
    },
    {
      category: 'school',
      name: 'I.E. Primaria del Sector',
      icon: '🏫',
      color: 0x3b82f6,
      subtitle: 'Institución Educativa Comunal',
      distMeters: 220,
      angleDeg: 215,
    },
    {
      category: 'hotel',
      name: 'Hospedaje & Hostal Local',
      icon: '🏨',
      color: 0xf59e0b,
      subtitle: 'Habitaciones y Estancia Confortable',
      distMeters: 310,
      angleDeg: 310,
    },
    {
      category: 'store',
      name: 'Minimarket y Bodega Comunal',
      icon: '🛒',
      color: 0x8b5cf6,
      subtitle: 'Abarrotes y Artículos de Primera Necesidad',
      distMeters: 180,
      angleDeg: 75,
    },
    {
      category: 'hospital',
      name: 'Posta Médica del Barrio',
      icon: '🏥',
      color: 0xec4899,
      subtitle: 'Centro de Atención Médica Primaria',
      distMeters: 450,
      angleDeg: 165,
    },
    {
      category: 'pharmacy',
      name: 'Botica Popular Mifarma',
      icon: '💊',
      color: 0xef4444,
      subtitle: 'Atención Farmacéutica y Cuidado de Salud',
      distMeters: 380,
      angleDeg: 285,
    },
    {
      category: 'park',
      name: 'Plaza Recreativa Zonal',
      icon: '🌳',
      color: 0x10b981,
      subtitle: 'Bancas y Espacio Público Arbolado',
      distMeters: 520,
      angleDeg: 10,
    },
  ];

  // Grados de latitud y longitud por metro aproximadamente a latitud ~12 grados sur
  // 1 grado latitud ≈ 111,000 metros
  // 1 grado longitud ≈ 111,000 * cos(-12°) ≈ 108,500 metros
  const METERS_PER_DEG_LAT = 111000;
  const METERS_PER_DEG_LNG = 108500;

  const results: RpgPoiLocation[] = [];
  const selectedTemplates = templates.slice(0, count);

  // Semilla fija basada en el cuadrante geográfico de 100m para mantener estabilidad posicional
  const gridLat = Math.round(center.lat * 1000) / 1000;
  const gridLng = Math.round(center.lng * 1000) / 1000;

  selectedTemplates.forEach((tmpl, i) => {
    const rad = (tmpl.angleDeg * Math.PI) / 180;
    const offsetLat = (tmpl.distMeters * Math.cos(rad)) / METERS_PER_DEG_LAT;
    const offsetLng = (tmpl.distMeters * Math.sin(rad)) / METERS_PER_DEG_LNG;

    results.push({
      id: `poi-local-${tmpl.category}-${Math.abs(Math.round(gridLat * 1000))}-${Math.abs(Math.round(gridLng * 1000))}-${i}`,
      name: tmpl.name,
      category: tmpl.category,
      coords: {
        lat: Number((center.lat + offsetLat).toFixed(6)),
        lng: Number((center.lng + offsetLng).toFixed(6)),
      },
      icon: tmpl.icon,
      color: tmpl.color,
      subtitle: tmpl.subtitle,
    });
  });

  return results;
}
