/**
 * Tema de diseño cartográfico "Pixar Aventura & Minecraft 2D" para Google Maps Platform en Vamoo.
 *
 * Propósito: Proveer una estilización vectorial de alto contraste y colores vivos y vibrantes,
 * sirviendo como base fidedigna a la geometría real de Google Maps para el renderizado pixelado en Zoom 15.
 *
 * Características principales de la paleta (Etapa 2):
 * - Parques y reservas naturales (poi.park): Verde esmeralda vivo y brillante (#10b981) con bordes delimitados (#059669).
 * - Paisaje natural y campos (landscape.natural): Verde pradera fresco (#dcfce7) para separar áreas abiertas de la ciudad.
 * - Manzanas urbanas y huellas de edificios (landscape.man_made): Tono terracota/tejado cálido (#fde68a / #fed7aa)
 *   que se proyecta ÚNICAMENTE donde Google Maps registra edificaciones y urbanizaciones reales.
 * - Carreteras y vías de transporte (road): Bordes de alto contraste (#475569 / #64748b) y asfalto limpio (#ffffff, #facc15, #f59e0b)
 *   que preservan la geometría exacta de cada curva, diagonal y callejón sin distorsión sintética.
 * - Cuerpos de agua (water): Azul turquesa zafiro cristalino (#06b6d4 / #0284c7).
 * - Ocultamiento de ruido comercial (poi.business): Silenciado para mantener la estética pura de expedición.
 */
export const PIXAR_MAP_THEME: google.maps.MapTypeStyle[] = [
  // 1. Fondo general del terreno natural (Praderas suaves)
  {
    elementType: 'geometry',
    stylers: [{ color: '#f0fdf4' }],
  },

  // 2. Ocultar iconos y comercios no esenciales para limpiar la interfaz de aventura
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.attraction',
    elementType: 'geometry',
    stylers: [{ color: '#bbf7d0' }],
  },

  // 3. Parques, jardines y áreas verdes protegidas (Verde Esmeralda Vivo)
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#10b981' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#059669' }, { weight: 2 }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#064e3b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 3 }],
  },

  // 4. Masas de agua cristalinas (Ríos, lagos, mar turquesa)
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#06b6d4' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0891b2' }, { weight: 1.5 }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#083344' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 2 }],
  },

  // 5. Paisaje natural y topografía suave
  {
    featureType: 'landscape.natural',
    elementType: 'geometry.fill',
    stylers: [{ color: '#dcfce7' }],
  },

  // 6. Manzanas urbanas y huellas de edificios (Solo donde Google Maps registra construcciones reales)
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fed7aa' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#f97316' }, { weight: 1.2 }],
  },

  // 7. Red vial y carreteras de exploración (Alto Contraste y Geometría Fidedigna)
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#64748b' }, { weight: 1.5 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f59e0b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#b45309' }, { weight: 2.5 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#facc15' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#a16207' }, { weight: 2 }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#475569' }, { weight: 1.5 }],
  },

  // 8. Tipografía de calles y jirones
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 2.5 }],
  },

  // 9. Líneas administrativas y límites territoriales suaves
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#94a3b8' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }],
  },

  // 10. Transporte y tránsito ecológico sutil
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#e0f2fe' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284c7' }],
  },
];
