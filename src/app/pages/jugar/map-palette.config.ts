/**
 * Catálogo Centralizado de Diseño Cartográfico y Texturas de Vamoo.
 *
 * Propósito: Servir como Fuente Única de la Verdad (Single Source of Truth) para
 * todos los colores, trazos de contorno y micro-texturas del mapa interactivo.
 *
 * Modificar los valores de este archivo actualiza en cascada tanto el tema de
 * Google Maps (pixar-map-theme.ts) como las capas de texturizado CSS sin romper dependencias.
 */

/**
 * Representa las propiedades cromáticas y de contorno para un elemento geográfico.
 */
export interface MapFeatureColor {
  /** Color de relleno principal en formato HEX */
  readonly fill: string;
  /** Color del trazo o contorno perimetral en formato HEX */
  readonly stroke: string;
  /** Grosor del contorno en píxeles */
  readonly strokeWeight: number;
}

/**
 * Representa la tipografía y halo de contraste para etiquetas geográficas.
 */
export interface MapLabelStyle {
  /** Color del cuerpo del texto */
  readonly textFill: string;
  /** Color del halo protector alrededor del texto */
  readonly textStroke: string;
  /** Grosor del halo en píxeles */
  readonly textStrokeWeight: number;
}

/**
 * Estructura completa de la paleta cartográfica de expediciones Vamoo.
 */
export interface VamooMapPalette {
  /** Fondo y terreno natural */
  readonly terreno: {
    readonly fondo: string;
    readonly praderaNatural: string;
  };
  /**
   * Edificaciones y casas con estilo de Tejas Andinas:
   * Proyectado exclusivamente sobre huellas de edificios reales de Google Maps.
   */
  readonly edificacionesTejasAndinas: MapFeatureColor;
  /**
   * Parques y reservas ecológicas:
   * Verde esmeralda vivo combinado con contorno y textura verde bosque oscuro.
   */
  readonly parquesEcologicos: MapFeatureColor & MapLabelStyle;
  /**
   * Cuerpos de agua (ríos, lagos y lagunas altoandinas):
   * Azul turquesa zafiro cristalino.
   */
  readonly hidrografia: MapFeatureColor & MapLabelStyle;
  /**
   * Red vial y caminos de expedición en alto contraste:
   */
  readonly vialidad: {
    readonly autopistas: MapFeatureColor;
    readonly avenidas: MapFeatureColor;
    readonly callesLocales: MapFeatureColor;
    readonly etiquetas: MapLabelStyle;
  };
  /**
   * Parámetros de la textura 2D pixelada (micro-trama orgánica):
   */
  readonly textura2D: {
    readonly tamanoBloquePx: number;
    readonly opacidadGeneral: number;
    readonly sombraVerdeOscuro: string;
    readonly realceEsmeralda: string;
    readonly sombraTejaAndina: string;
  };
}

/**
 * Paleta activa de Vamoo con estilo de Tejas Andinas y Parques Esmeralda Vivos.
 * Armonizada con la consola retro RPG (#172033) y los senderos dorados de expedición.
 */
export const VAMOO_MAP_PALETTE: VamooMapPalette = {
  terreno: {
    fondo: '#f0fdf4',
    praderaNatural: '#dcfce7',
  },

  // 1. Tejas Andinas (Terracota cálido de arcilla cocida con bisel de sombra de alero)
  edificacionesTejasAndinas: {
    fill: '#f97316',          // Terracota andino vivo (tejado cálido de arcilla)
    stroke: '#9a3412',        // Tostado oscuro profundo (sensación de alero y sombra de muro)
    strokeWeight: 1.6,
  },

  // 2. Parques Ecológicos (Verde Esmeralda Vivo + Verde Bosque Oscuro)
  parquesEcologicos: {
    fill: '#10b981',          // Verde esmeralda vivo y radiante
    stroke: '#065f46',        // Verde bosque oscuro para recorte nítido
    strokeWeight: 2.2,
    textFill: '#022c22',
    textStroke: '#ffffff',
    textStrokeWeight: 3.0,
  },

  // 3. Hidrografía (Ríos y lagunas cristalinas)
  hidrografia: {
    fill: '#06b6d4',          // Cian / Turquesa zafiro brillante
    stroke: '#0891b2',        // Borde turquesa profundo
    strokeWeight: 1.8,
    textFill: '#083344',
    textStroke: '#ffffff',
    textStrokeWeight: 2.5,
  },

  // 4. Red Vial en Alto Contraste (Preserva curvas y diagonales auténticas)
  vialidad: {
    autopistas: {
      fill: '#f59e0b',        // Ámbar dorado
      stroke: '#b45309',      // Borde caramelo tostado
      strokeWeight: 2.6,
    },
    avenidas: {
      fill: '#facc15',        // Amarillo solar
      stroke: '#a16207',      // Borde ocre dorado
      strokeWeight: 2.0,
    },
    callesLocales: {
      fill: '#ffffff',        // Blanco asfalto puro
      stroke: '#475569',      // Gris pizarra de alto contraste
      strokeWeight: 1.6,
    },
    etiquetas: {
      textFill: '#1e293b',
      textStroke: '#ffffff',
      textStrokeWeight: 2.5,
    },
  },

  // 5. Textura Pixelada 2D (Bicelado y Dithering armónico)
  textura2D: {
    tamanoBloquePx: 8,
    opacidadGeneral: 0.70,
    sombraVerdeOscuro: 'rgba(6, 95, 70, 0.16)',    // Textura de césped pixelado
    realceEsmeralda: 'rgba(16, 185, 129, 0.12)',   // Brillo de brizna de hierba
    sombraTejaAndina: 'rgba(154, 52, 18, 0.18)',   // Relieve de hilera de tejas
  },
};
