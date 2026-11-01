/// <reference types="@types/google.maps" />
import { VAMOO_MAP_PALETTE, VamooMapPalette } from './map-palette.config.js';

/**
 * Función fábrica que genera el array de estilos vectoriales para Google Maps Platform,
 * derivado directamente de una paleta especificada o de VAMOO_MAP_PALETTE por defecto.
 *
 * Propósito: Mapear de forma optimizada las capas oficiales soportadas por Google Maps JavaScript API,
 * garantizando una longitud serializada inferior a 1,000 caracteres para evitar el error interno
 * "Custom style string" que provocaba la anulación total del tema y la reversión al mapa normal.
 *
 * Capas urbanas diferenciadas:
 * 1. Manzanas / Áreas urbanas (landscape.man_made, landscape): Fondo melocotón cálido suave (#FDD7AA).
 * 2. Casas residenciales (administrative.land_parcel): Tejas andinas de arcilla terracota viva (#f97316).
 * 3. Edificios y equipamientos (poi): Adobe tostado / sillar colonial andino (#854d0e).
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

    // 2. Ocultar iconos y textos publicitarios de comercios para mantener la estética pixel aventura
    {
      featureType: 'poi',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },

    // 3. Manzanas Urbanas y Áreas Urbanas (#FDD7AA)
    // Delimita el suelo base suave de los bloques urbanos donde se asientan las casas y edificios
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
    {
      featureType: 'landscape',
      elementType: 'geometry.fill',
      stylers: [{ color: p.manzanasUrbanas.fill }],
    },

    // 4. Casas: Huellas y Lotes Residenciales (Estilo Tejas Andinas #f97316)
    // Colorea las parcelas y viviendas residenciales destacándolas sobre la manzana
    {
      featureType: 'administrative.land_parcel',
      elementType: 'geometry.fill',
      stylers: [{ color: p.casasResidenciales.fill }],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'geometry.stroke',
      stylers: [
        { color: p.casasResidenciales.stroke },
        { weight: p.casasResidenciales.strokeWeight },
      ],
    },

    // 5. Edificios: Estructuras cívicas, comerciales y equipamientos urbanos (#854d0e adobe tostado / sillar)
    // Permite que colegios, comercios, hospitales, iglesias y edificios públicos destaquen con su propio color
    {
      featureType: 'poi',
      elementType: 'geometry.fill',
      stylers: [{ color: p.edificiosEstructuras.fill }],
    },

    // 6. Áreas Verdes Tipo 1: Parques, jardines y plazas destacadas (#10b981 verde esmeralda vivo)
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
      featureType: 'poi.attraction',
      elementType: 'geometry',
      stylers: [{ color: p.areasVerdesParques.fill }],
    },

    // 7. Áreas Verdes Tipo 2: Paisaje natural, praderas y cubierta vegetal (#34d399 verde menta)
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: p.areasVerdesVegetacion.fill }],
    },

    // 8. Hidrografía: Masas de agua y ríos cristalinos (#06b6d4 turquesa)
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

    // 9. Carreteras y Red Vial de Exploración (#FFF7EE marfil suave)
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
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [{ color: p.redVial.autopistas.fill }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.fill',
      stylers: [{ color: p.redVial.avenidas.fill }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: p.redVial.etiquetas.textFill }],
    },

    // 10. Líneas administrativas territoriales
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

    // 11. Transporte y tránsito ecológico sutil
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#e0f2fe' }],
    },
  ];
}

/**
 * Instancia precompilada del tema cartográfico para Google Maps.
 */
export const PIXAR_MAP_THEME: google.maps.MapTypeStyle[] = buildVamooMapTheme();
