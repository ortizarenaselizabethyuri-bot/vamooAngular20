import { VAMOO_MAP_PALETTE } from './map-palette.config.js';

/**
 * Función fábrica que genera el array de estilos vectoriales para Google Maps Platform,
 * derivado directamente de la configuración centralizada VAMOO_MAP_PALETTE.
 *
 * Propósito: Mapear todas las capas de Google Maps (incluyendo las dos tonalidades de áreas verdes:
 * parques urbanos '#a8e7be' y vegetación natural '#c1efd1', manzanas '#FDD7AA' y vías '#FFF7EE')
 * hacia la paleta centralizada sin código duro disperso.
 *
 * @returns google.maps.MapTypeStyle[] Arreglo con la configuración de estilizado oficial de Google Maps.
 */
export function buildVamooMapTheme(): google.maps.MapTypeStyle[] {
  const p = VAMOO_MAP_PALETTE;

  return [
    // 1. Fondo general del terreno neutro
    {
      elementType: 'geometry',
      stylers: [{ color: p.terrenoBase.fondo }],
    },

    // 2. Ocultar comercios para priorizar la exploración ecológica
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },

    // ------------------------------------------------------------------------
    // 3. ÁREAS VERDES TIPO 1: PARQUES URBANOS, PLAZAS Y COMPLEJOS DEPORTIVOS
    // (En Google Maps nativo: #a8e7be)
    // ------------------------------------------------------------------------
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ color: p.areasVerdesParques.fill }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.areasVerdesParques.stroke },
        { weight: p.areasVerdesParques.strokeWeight },
      ],
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
    {
      featureType: 'poi.sports_complex',
      elementType: 'geometry.fill',
      stylers: [{ color: p.areasVerdesParques.fill }],
    },
    {
      featureType: 'poi.sports_complex',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.areasVerdesParques.stroke },
        { weight: p.areasVerdesParques.strokeWeight },
      ],
    },
    {
      featureType: 'poi.attraction',
      elementType: 'geometry.fill',
      stylers: [{ color: p.areasVerdesParques.fill }],
    },

    // ------------------------------------------------------------------------
    // 4. ÁREAS VERDES TIPO 2: PRADERAS, CUBIERTA VEGETAL Y TERRENO NATURAL
    // (En Google Maps nativo: #c1efd1)
    // ------------------------------------------------------------------------
    {
      featureType: 'landscape.natural',
      elementType: 'geometry.fill',
      stylers: [{ color: p.areasVerdesVegetacion.fill }],
    },
    {
      featureType: 'landscape.natural.landcover',
      elementType: 'geometry.fill',
      stylers: [{ color: p.areasVerdesVegetacion.fill }],
    },
    {
      featureType: 'landscape.natural.landcover',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.areasVerdesVegetacion.stroke },
        { weight: p.areasVerdesVegetacion.strokeWeight },
      ],
    },
    {
      featureType: 'landscape.natural.terrain',
      elementType: 'geometry.fill',
      stylers: [{ color: p.areasVerdesVegetacion.fill }],
    },

    // ------------------------------------------------------------------------
    // 5. MASAS DE AGUA Y RÍOS
    // ------------------------------------------------------------------------
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

    // ------------------------------------------------------------------------
    // 6. MANZANAS URBANAS / BLOQUES DE LA CIUDAD (#FDD7AA)
    // ------------------------------------------------------------------------
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.fill',
      stylers: [{ color: p.manzanasUrbanas.fill }],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.manzanasUrbanas.stroke },
        { weight: p.manzanasUrbanas.strokeWeight },
      ],
    },

    // ------------------------------------------------------------------------
    // 7. EDIFICACIONES Y CASAS (TEJAS ANDINAS: solo sobre huellas de casas reales)
    // ------------------------------------------------------------------------
    {
      featureType: 'landscape.man_made.building',
      elementType: 'geometry.fill',
      stylers: [{ color: p.edificacionesCasas.fill }],
    },
    {
      featureType: 'landscape.man_made.building',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.edificacionesCasas.stroke },
        { weight: p.edificacionesCasas.strokeWeight },
      ],
    },

    // ------------------------------------------------------------------------
    // 8. RED VIAL Y CARRETERAS DE EXPLORACIÓN (#FFF7EE)
    // ------------------------------------------------------------------------
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
      featureType: 'road.local',
      elementType: 'geometry.fill',
      stylers: [{ color: p.redVial.callesLocales.fill }],
    },
    {
      featureType: 'road.local',
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
      featureType: 'road.arterial',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.redVial.avenidas.stroke },
        { weight: p.redVial.avenidas.strokeWeight },
      ],
    },
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
