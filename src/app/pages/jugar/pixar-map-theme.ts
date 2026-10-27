/// <reference types="@types/google.maps" />

/**
 * Tema de diseño vectorial "Pixar Aventura" para Google Maps Platform en Vamoo.
 *
 * Propósito: Transformar la representación estándar de Google Maps en un mapa de expedición
 * amigable, cálido y vibrante inspirado en el arte visual de Pixar.
 *
 * Características de la paleta:
 * - Aguas: Azul turquesa cristalino (#22d3ee / #0284c7)
 * - Parques y reservas naturales: Verde esmeralda y lima vibrante (#4ade80 / #16a34a)
 * - Caminos y senderos de exploración: Amarillo arena y dorado cálido (#fef08a / #facc15)
 * - Terreno urbano: Marfil suave (#f8fafc / #edf2f7)
 * - Comercios no esenciales: Ocultos para enfocar la interfaz en la exploración ecológica
 */
export const PIXAR_MAP_THEME: google.maps.MapTypeStyle[] = [
  // 1. Fondo general del terreno
  {
    elementType: 'geometry',
    stylers: [{ color: '#f8fafc' }],
  },
  // 2. Ocultar iconos comerciales no afines a la expedición
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.attraction',
    elementType: 'geometry',
    stylers: [{ color: '#bbf7d0' }],
  },
  // 3. Parques, humedales y áreas verdes destacadas (Verde Pixar)
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#4ade80' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#14532d' }],
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
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0369a1' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 2 }],
  },
  // 5. Paisaje natural y topografía suave
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#e2f5ea' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f1f5f9' }],
  },
  // 6. Carreteras y caminos estilo arena dorada
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }, { weight: 1 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fef08a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#facc15' }, { weight: 1.5 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fef9c3' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  // 7. Tipografía de calles y etiquetas
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 2 }],
  },
  // 8. Líneas administrativas y límites territoriales suaves
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1e293b' }],
  },
  // 9. Transporte y tránsito sutil
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
