import { VAMOO_MAP_PALETTE, VamooMapPalette } from './map-palette.config.js';

/**
 * Función fábrica que genera el array de estilos vectoriales para Google Maps Platform,
 * derivado directamente de una paleta especificada o de VAMOO_MAP_PALETTE por defecto.
 *
 * Propósito: Mapear estrictamente las capas oficiales soportadas por Google Maps JavaScript API
 * para evitar errores de serialización "Custom style string" y garantizar renderizado visual instantáneo.
 *
 * @param palette - Paleta opcional a utilizar (por defecto VAMOO_MAP_PALETTE).
 * @returns google.maps.MapTypeStyle[] Arreglo con la configuración de estilizado oficial de Google Maps.
 */
export function buildVamooMapTheme(palette?: VamooMapPalette): google.maps.MapTypeStyle[] {
  const p = palette || VAMOO_MAP_PALETTE;

  return [
    // 1. Fondo general del terreno
    {
      elementType: 'geometry',
      stylers: [{ color: p.terrenoBase.fondo }],
    },

    // 2. Ocultar comercios para priorizar la exploración ecológica
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi.attraction',
      elementType: 'geometry',
      stylers: [{ color: p.areasVerdesParques.fill }],
    },

    // 3. Áreas verdes tipo 1: Parques, jardines y áreas verdes destacadas (Google Maps: #a8e7be)
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ color: p.areasVerdesParques.fill }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: p.areasVerdesParques.textFill }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: p.areasVerdesParques.textStroke },
        { weight: p.areasVerdesParques.textStrokeWeight },
      ],
    },

    // 4. Masas de agua cristalinas (Ríos, lagos, mar turquesa)
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: p.hidrografia.fill }],
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

    // 5. Áreas verdes tipo 2: Paisaje natural, praderas y cubierta vegetal (Google Maps: #c1efd1)
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: p.areasVerdesVegetacion.fill }],
    },

    // 6. Manzanas urbanas / Terreno edificado
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.fill',
      stylers: [{ color: p.manzanasUrbanas.fill }],
    },

    // 7. Carreteras y caminos locales
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [{ color: p.redVial.callesLocales.fill }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.redVial.callesLocales.stroke },
        { weight: p.redVial.callesLocales.strokeWeight },
      ],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [{ color: p.redVial.autopistas.fill }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.redVial.autopistas.stroke },
        { weight: p.redVial.autopistas.strokeWeight },
      ],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.fill',
      stylers: [{ color: p.redVial.avenidas.fill }],
    },
    {
      featureType: 'road.local',
      elementType: 'geometry.fill',
      stylers: [{ color: p.redVial.callesLocales.fill }],
    },

    // 8. Tipografía de calles y etiquetas
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: p.redVial.etiquetas.textFill }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: p.redVial.etiquetas.textStroke },
        { weight: p.redVial.etiquetas.textStrokeWeight },
      ],
    },

    // 9. Líneas administrativas y límites territoriales
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

    // 10. Transporte y tránsito sutil
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
