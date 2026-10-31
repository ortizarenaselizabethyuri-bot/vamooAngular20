import { VAMOO_MAP_PALETTE } from './map-palette.config.js';

/**
 * Función fábrica que genera el array de estilos vectoriales para Google Maps Platform,
 * derivado directamente de la configuración centralizada VAMOO_MAP_PALETTE.
 *
 * Propósito: Garantizar que cualquier cambio en la paleta de colores de casas (tejas andinas),
 * parques esmeralda o vialidad se refleje inmediatamente en el mapa sin alterar lógica externa.
 *
 * @returns google.maps.MapTypeStyle[] Arreglo con la configuración de estilizado oficial de Google Maps.
 */
export function buildVamooMapTheme(): google.maps.MapTypeStyle[] {
  const p = VAMOO_MAP_PALETTE;

  return [
    // 1. Fondo general del terreno natural
    {
      elementType: 'geometry',
      stylers: [{ color: p.terreno.fondo }],
    },

    // 2. Ocultar comercios para priorizar la exploración ecológica
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi.attraction',
      elementType: 'geometry',
      stylers: [{ color: '#bbf7d0' }],
    },

    // 3. Parques, reservas y áreas verdes (Verde Esmeralda Vivo + Borde Verde Bosque)
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ color: p.parquesEcologicos.fill }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.parquesEcologicos.stroke },
        { weight: p.parquesEcologicos.strokeWeight },
      ],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: p.parquesEcologicos.textFill }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: p.parquesEcologicos.textStroke },
        { weight: p.parquesEcologicos.textStrokeWeight },
      ],
    },

    // 4. Masas de agua y ríos (Azul Turquesa Zafiro Cristalino)
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: p.hidrografia.fill }],
    },
    {
      featureType: 'water',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.hidrografia.stroke },
        { weight: p.hidrografia.strokeWeight },
      ],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: p.hidrografia.textFill }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: p.hidrografia.textStroke },
        { weight: p.hidrografia.textStrokeWeight },
      ],
    },

    // 5. Paisaje natural y topografía suave
    {
      featureType: 'landscape.natural',
      elementType: 'geometry.fill',
      stylers: [{ color: p.terreno.praderaNatural }],
    },

    // 6. Edificaciones y Manzanas Urbanas (Estilo Tejas Andinas: solo en huellas reales de Google Maps)
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.fill',
      stylers: [{ color: p.edificacionesTejasAndinas.fill }],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.edificacionesTejasAndinas.stroke },
        { weight: p.edificacionesTejasAndinas.strokeWeight },
      ],
    },

    // 7. Red vial y carreteras de exploración (Alto Contraste y Geometría Fiel)
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [{ color: p.vialidad.callesLocales.fill }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.vialidad.callesLocales.stroke },
        { weight: p.vialidad.callesLocales.strokeWeight },
      ],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [{ color: p.vialidad.autopistas.fill }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.vialidad.autopistas.stroke },
        { weight: p.vialidad.autopistas.strokeWeight },
      ],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.fill',
      stylers: [{ color: p.vialidad.avenidas.fill }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.vialidad.avenidas.stroke },
        { weight: p.vialidad.avenidas.strokeWeight },
      ],
    },
    {
      featureType: 'road.local',
      elementType: 'geometry.fill',
      stylers: [{ color: p.vialidad.callesLocales.fill }],
    },
    {
      featureType: 'road.local',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.vialidad.callesLocales.stroke },
        { weight: p.vialidad.callesLocales.strokeWeight },
      ],
    },

    // 8. Tipografía de calles y avenidas
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: p.vialidad.etiquetas.textFill }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: p.vialidad.etiquetas.textStroke },
        { weight: p.vialidad.etiquetas.textStrokeWeight },
      ],
    },

    // 9. Líneas administrativas y límites territoriales
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

    // 10. Transporte y estaciones sutiles
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
}

/**
 * Instancia precompilada del tema cartográfico para Google Maps.
 */
export const PIXAR_MAP_THEME: google.maps.MapTypeStyle[] = buildVamooMapTheme();
