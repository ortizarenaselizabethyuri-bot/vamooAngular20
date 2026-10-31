/**
 * ============================================================================
 * CATÁLOGO MAESTRO DE COLORES Y TEXTURAS DE VAMOO (Single Source of Truth)
 * ============================================================================
 *
 * Propósito: Centralizar en un único lugar todos los colores, contornos y
 * parámetros de textura del mapa de juego de Vamoo.
 *
 * ¿CÓMO EDITAR UN COLOR?
 * Simplemente cambia el código HEX (ejemplo: '#10b981') en el objeto VAMOO_MAP_PALETTE
 * ubicado abajo. Todos los cambios se reflejan automáticamente en Google Maps y en
 * las texturas de la aplicación.
 */

/**
 * Propiedades de relleno y contorno para elementos geográficos vectoriales.
 */
export interface MapFeatureColor {
  /** Color de relleno en formato HEX (ej: '#10b981') */
  readonly fill: string;
  /** Color del borde o contorno en formato HEX (ej: '#059669') */
  readonly stroke: string;
  /** Grosor del contorno en píxeles */
  readonly strokeWeight: number;
}

/**
 * Propiedades tipográficas y de halo para nombres de calles, parques y ríos.
 */
export interface MapLabelStyle {
  /** Color del texto */
  readonly textFill: string;
  /** Color del contorno protector (halo) del texto */
  readonly textStroke: string;
  /** Grosor del halo protector en píxeles */
  readonly textStrokeWeight: number;
}

/**
 * Estructura tipada y documentada de la paleta cartográfica completa.
 */
export interface VamooMapPalette {
  /**
   * Terreno base y fondo general del mapa
   */
  readonly terrenoBase: {
    /** Color de fondo global del mapa (debajo de todo) */
    readonly fondo: string;
  };

  /**
   * ÁREAS VERDES TIPO 1: Parques, Plazas, Jardines Urbanos y Centros Deportivos
   * Corresponde en Google Maps nativo al verde '#a8e7be' (poi.park, poi.attraction, poi.sports_complex).
   */
  readonly areasVerdesParques: MapFeatureColor & MapLabelStyle;

  /**
   * ÁREAS VERDES TIPO 2: Praderas Naturales, Cubierta Vegetal, Laderas y Terreno Rústico
   * Corresponde en Google Maps nativo al verde '#c1efd1' (landscape.natural, landscape.natural.landcover, landscape.natural.terrain).
   */
  readonly areasVerdesVegetacion: MapFeatureColor;

  /**
   * MANZANAS URBANAS: Fondo de los bloques de la ciudad donde habitan las casas
   * Corresponde en Google Maps a 'landscape.man_made'.
   */
  readonly manzanasUrbanas: {
    /** Color de relleno del bloque urbano (solicitado: #FDD7AA) */
    readonly fill: string;
    /** Borde perimetral delimitador de la manzana */
    readonly stroke: string;
    /** Grosor del borde de la manzana */
    readonly strokeWeight: number;
  };

  /**
   * EDIFICACIONES Y CASAS: Huellas de viviendas y edificios reales
   * Proyectado exclusivamente sobre polígonos de edificios ('landscape.man_made.building').
   */
  readonly edificacionesCasas: MapFeatureColor;

  /**
   * RED VIAL Y CARRETERAS: Vías de tránsito y caminos de exploración
   * Corresponde a 'road', 'road.local', 'road.arterial' y 'road.highway'.
   */
  readonly redVial: {
    /** Carreteras locales, calles y jirones (solicitado: #FFF7EE) */
    readonly callesLocales: MapFeatureColor;
    /** Avenidas principales y vías conectoras */
    readonly avenidas: MapFeatureColor;
    /** Autopistas y carreteras interprovinciales */
    readonly autopistas: MapFeatureColor;
    /** Tipografía y nombres de las calles */
    readonly etiquetas: MapLabelStyle;
  };

  /**
   * HIDROGRAFÍA: Ríos, lagos, lagunas y mar
   * Corresponde a 'water'.
   */
  readonly hidrografia: MapFeatureColor & MapLabelStyle;

  /**
   * TEXTURA PIXELADA 2D: Micro-cuadrícula de cuantización táctil tipo Minecraft / 16-bit RPG
   */
  readonly textura2DPixel: {
    /** Tamaño en píxeles de cada celda de bloque (ej: 8px) */
    readonly tamanoBloquePx: number;
    /** Opacidad general de la capa de textura (0.0 a 1.0) */
    readonly opacidadGeneral: number;
    /** Tono de sombra para el césped pixelado */
    readonly sombraCespedVerde: string;
    /** Tono de relieve para las hileras de tejas */
    readonly sombraTejasAndinas: string;
  };
}

/**
 * ============================================================================
 * VALORES ACTIVOS DE LA PALETA (Modifica aquí los colores)
 * ============================================================================
 */
export const VAMOO_MAP_PALETTE: VamooMapPalette = {
  // --------------------------------------------------------------------------
  // 1. TERRENO BASE
  // --------------------------------------------------------------------------
  terrenoBase: {
    fondo: '#f8fafc',                   // Fondo marfil neutro
  },

  // --------------------------------------------------------------------------
  // 2. ÁREAS VERDES TIPO 1: PARQUES URBANOS Y RESERVAS (Google Maps: #a8e7be)
  // Utilizado en: poi.park, poi.attraction, poi.sports_complex
  // --------------------------------------------------------------------------
  areasVerdesParques: {
    fill: '#10b981',                    // Verde esmeralda vivo y brillante
    stroke: '#059669',                  // Borde verde bosque oscuro para recorte nítido
    strokeWeight: 2.2,
    textFill: '#022c22',                // Texto verde oscuro legible
    textStroke: '#ffffff',              // Halo blanco para máxima legibilidad
    textStrokeWeight: 3.0,
  },

  // --------------------------------------------------------------------------
  // 3. ÁREAS VERDES TIPO 2: PRADERAS Y VEGETACIÓN NATURAL (Google Maps: #c1efd1)
  // Utilizado en: landscape.natural, landscape.natural.landcover, landscape.natural.terrain
  // Nota: Si deseas que sea idéntico a los parques, puedes colocar '#10b981' aquí también.
  // Actualmente usa un verde menta esmeralda armónico para dar riqueza visual.
  // --------------------------------------------------------------------------
  areasVerdesVegetacion: {
    fill: '#34d399',                    // Verde menta esmeralda armónico (o usa '#10b981')
    stroke: '#059669',                  // Borde verde bosque
    strokeWeight: 1.5,
  },

  // --------------------------------------------------------------------------
  // 4. MANZANAS URBANAS / BLOQUES DE LA CIUDAD
  // Utilizado en: landscape.man_made (fondo del bloque residencial)
  // --------------------------------------------------------------------------
  manzanasUrbanas: {
    fill: '#FDD7AA',                    // Melocotón / arena cálido suave solicitado
    stroke: '#fbc28b',                  // Borde cálido sutil de la manzana
    strokeWeight: 1.0,
  },

  // --------------------------------------------------------------------------
  // 5. EDIFICACIONES Y CASAS (TEJAS ANDINAS)
  // Utilizado en: landscape.man_made.building (solo sobre las casas reales)
  // --------------------------------------------------------------------------
  edificacionesCasas: {
    fill: '#f97316',                    // Terracota vivo (teja andina de arcilla cocida)
    stroke: '#9a3412',                  // Tostado oscuro profundo (efecto alero y sombra)
    strokeWeight: 1.6,
  },

  // --------------------------------------------------------------------------
  // 6. RED VIAL Y CARRETERAS
  // --------------------------------------------------------------------------
  redVial: {
    callesLocales: {
      fill: '#FFF7EE',                  // Marfil cálido suave solicitado para vías y calles
      stroke: '#94a3b8',                // Contorno gris pizarra suave para contraste con #FDD7AA
      strokeWeight: 1.6,
    },
    avenidas: {
      fill: '#facc15',                  // Amarillo solar para avenidas principales
      stroke: '#a16207',                // Borde ocre dorado
      strokeWeight: 2.0,
    },
    autopistas: {
      fill: '#f59e0b',                  // Ámbar dorado para carreteras y autopistas
      stroke: '#b45309',                // Borde tostado
      strokeWeight: 2.6,
    },
    etiquetas: {
      textFill: '#1e293b',              // Nombres de calles en azul gris oscuro
      textStroke: '#ffffff',            // Halo blanco
      textStrokeWeight: 2.5,
    },
  },

  // --------------------------------------------------------------------------
  // 7. HIDROGRAFÍA (RÍOS, LAGOS Y LAGUNAS)
  // Utilizado en: water
  // --------------------------------------------------------------------------
  hidrografia: {
    fill: '#06b6d4',                    // Turquesa / cian zafiro brillante
    stroke: '#0891b2',                  // Borde turquesa profundo
    strokeWeight: 1.8,
    textFill: '#083344',
    textStroke: '#ffffff',
    textStrokeWeight: 2.5,
  },

  // --------------------------------------------------------------------------
  // 8. TEXTURA PIXELADA 2D
  // --------------------------------------------------------------------------
  textura2DPixel: {
    tamanoBloquePx: 8,
    opacidadGeneral: 0.70,
    sombraCespedVerde: 'rgba(6, 95, 70, 0.16)',    // Textura de césped pixelado
    sombraTejasAndinas: 'rgba(154, 52, 18, 0.18)',   // Relieve de hileras de tejas
  },
};
