/**
 * ============================================================================
 * CATÁLOGO MAESTRO DE PALETAS DE COLOR Y TEXTURAS DE VAMOO
 * ============================================================================
 *
 * Propósito: Proveer una Fuente Única de la Verdad (Single Source of Truth) para
 * todos los colores, contornos y parámetros de textura del mapa de expediciones.
 *
 * ¿CÓMO CAMBIAR DE PALETA?
 * Simplemente cambia el valor de PALETA_SELECCIONADA más abajo:
 *  - 'valleAndino'    -> Cálido, tradicional con tejas andinas y melocotón (#FDD7AA)
 *  - 'esmeraldaPixar' -> Radiante, fresco estilo Pixar/Ghibli con lima y marfil
 *  - 'retroRPG'       -> 16-bits clásico (SNES/GBA), tejados rojizos y bosque profundo
 *  - 'tierraLino'     -> Minimalista orgánico, adobe tostado y verde salvia
 *  - 'crepuscular'    -> Noche mágica, pizarra oscura con luminiscencia esmeralda y ámbar
 */

/**
 * Propiedades de relleno y contorno para elementos geográficos vectoriales.
 */
export interface MapFeatureColor {
  /** Color de relleno en formato HEX */
  readonly fill: string;
  /** Color del borde o contorno en formato HEX */
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
 * Estructura tipada de una paleta cartográfica completa en Vamoo.
 */
export interface VamooMapPalette {
  /** Nombre descriptivo de la paleta */
  readonly nombre: string;
  /** Resumen de la estética visual */
  readonly descripcion: string;

  /** Terreno base global */
  readonly terrenoBase: {
    readonly fondo: string;
  };

  /** Áreas verdes tipo 1: Parques urbanos, plazas y campos (Google Maps: #a8e7be) */
  readonly areasVerdesParques: MapFeatureColor & MapLabelStyle;

  /** Áreas verdes tipo 2: Praderas, cubierta vegetal y laderas (Google Maps: #c1efd1) */
  readonly areasVerdesVegetacion: MapFeatureColor;

  /** Manzanas urbanas: Fondo de los bloques residenciales */
  readonly manzanasUrbanas: {
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWeight: number;
  };

  /** Edificaciones y casas: Huellas de viviendas reales de Google Maps */
  readonly edificacionesCasas: MapFeatureColor;

  /** Red vial y carreteras de exploración */
  readonly redVial: {
    readonly callesLocales: MapFeatureColor;
    readonly avenidas: MapFeatureColor;
    readonly autopistas: MapFeatureColor;
    readonly etiquetas: MapLabelStyle;
  };

  /** Hidrografía: Ríos, lagos y lagunas */
  readonly hidrografia: MapFeatureColor & MapLabelStyle;

  /** Textura pixelada 2D */
  readonly textura2DPixel: {
    readonly tamanoBloquePx: number;
    readonly opacidadGeneral: number;
    readonly sombraCespedVerde: string;
    readonly sombraTejasAndinas: string;
  };
}

/**
 * ============================================================================
 * CATÁLOGO DE PALETAS DE EJEMPLO DISPONIBLES
 * ============================================================================
 */
export const PALETAS_PREDEFINIDAS = {
  /**
   * 1. VALLE ANDINO (Actual solicitada)
   * Manzanas en melocotón cálido (#FDD7AA), vías en marfil suave (#FFF7EE)
   * y casas con tejas andinas de arcilla (#f97316).
   */
  valleAndino: {
    nombre: 'Valle Andino Tradicional',
    descripcion: 'Inspirada en el Valle del Mantaro. Manzanas cálidas melocotón, vías de marfil suave y techos de teja andina.',
    terrenoBase: {
      fondo: '#f8fafc',
    },
    areasVerdesParques: {
      fill: '#10b981',                  // Verde esmeralda vivo
      stroke: '#059669',
      strokeWeight: 2.2,
      textFill: '#022c22',
      textStroke: '#ffffff',
      textStrokeWeight: 3.0,
    },
    areasVerdesVegetacion: {
      fill: '#34d399',                  // Verde menta andino armónico
      stroke: '#059669',
      strokeWeight: 1.5,
    },
    manzanasUrbanas: {
      fill: '#FDD7AA',                  // Melocotón cálido suave
      stroke: '#fbc28b',
      strokeWeight: 1.0,
    },
    edificacionesCasas: {
      fill: '#f97316',                  // Terracota vivo (teja andina de arcilla)
      stroke: '#9a3412',                // Sombra y alero de pared
      strokeWeight: 1.6,
    },
    redVial: {
      callesLocales: {
        fill: '#FFF7EE',                // Marfil cálido suave
        stroke: '#94a3b8',
        strokeWeight: 1.6,
      },
      avenidas: {
        fill: '#facc15',                // Amarillo sol
        stroke: '#a16207',
        strokeWeight: 2.0,
      },
      autopistas: {
        fill: '#f59e0b',                // Ámbar dorado
        stroke: '#b45309',
        strokeWeight: 2.6,
      },
      etiquetas: {
        textFill: '#1e293b',
        textStroke: '#ffffff',
        textStrokeWeight: 2.5,
      },
    },
    hidrografia: {
      fill: '#06b6d4',                  // Turquesa cristalino
      stroke: '#0891b2',
      strokeWeight: 1.8,
      textFill: '#083344',
      textStroke: '#ffffff',
      textStrokeWeight: 2.5,
    },
    textura2DPixel: {
      tamanoBloquePx: 8,
      opacidadGeneral: 0.70,
      sombraCespedVerde: 'rgba(6, 95, 70, 0.16)',
      sombraTejasAndinas: 'rgba(154, 52, 18, 0.18)',
    },
  },

  /**
   * 2. ESMERALDA PIXAR AVENTURA
   * Radiante, optimista y luminosa. Manzanas en marfil dorado suave (#FEF3C7),
   * césped verde lima brillante (#22c55e) y casas naranja alegre (#fb923c).
   */
  esmeraldaPixar: {
    nombre: 'Esmeralda Pixar Aventura',
    descripcion: 'Estética animada vibrante estilo Pixar/Ghibli. Máxima luminosidad, césped fresco y contraste alegre.',
    terrenoBase: {
      fondo: '#f0fdf4',
    },
    areasVerdesParques: {
      fill: '#22c55e',                  // Verde lima brillante y fresco
      stroke: '#15803d',
      strokeWeight: 2.2,
      textFill: '#14532d',
      textStroke: '#ffffff',
      textStrokeWeight: 3.0,
    },
    areasVerdesVegetacion: {
      fill: '#86efac',                  // Verde pradera suave primaveral
      stroke: '#16a34a',
      strokeWeight: 1.5,
    },
    manzanasUrbanas: {
      fill: '#FEF3C7',                  // Marfil dorado suave
      stroke: '#fde68a',
      strokeWeight: 1.0,
    },
    edificacionesCasas: {
      fill: '#fb923c',                  // Naranja calabaza alegre Pixar
      stroke: '#c2410c',
      strokeWeight: 1.6,
    },
    redVial: {
      callesLocales: {
        fill: '#ffffff',                // Blanco puro nítido
        stroke: '#cbd5e1',
        strokeWeight: 1.6,
      },
      avenidas: {
        fill: '#fde047',                // Amarillo luminoso
        stroke: '#ca8a04',
        strokeWeight: 2.0,
      },
      autopistas: {
        fill: '#f97316',                // Naranja sol
        stroke: '#c2410c',
        strokeWeight: 2.6,
      },
      etiquetas: {
        textFill: '#0f172a',
        textStroke: '#ffffff',
        textStrokeWeight: 2.5,
      },
    },
    hidrografia: {
      fill: '#38bdf8',                  // Azul cielo cristalino
      stroke: '#0284c7',
      strokeWeight: 1.8,
      textFill: '#0369a1',
      textStroke: '#ffffff',
      textStrokeWeight: 2.5,
    },
    textura2DPixel: {
      tamanoBloquePx: 8,
      opacidadGeneral: 0.65,
      sombraCespedVerde: 'rgba(21, 128, 61, 0.14)',
      sombraTejasAndinas: 'rgba(194, 65, 12, 0.16)',
    },
  },

  /**
   * 3. RETRO RPG 16-BITS
   * Clásico y nostálgico inspirado en Super Nintendo (EarthBound / Pokémon).
   * Tejados carmesí clásicos (#ef4444), parques verde bosque profundo (#059669) y manzanas ocre (#FDE68A).
   */
  retroRPG: {
    nombre: 'Retro RPG 16-Bits',
    descripcion: 'Pura nostalgia retro de consolas clásicas. Tejas rojas de pueblo RPG, verde bosque saturado y caminos de piedra suave.',
    terrenoBase: {
      fondo: '#f8fafc',
    },
    areasVerdesParques: {
      fill: '#059669',                  // Verde bosque profundo 16-bits
      stroke: '#064e3b',
      strokeWeight: 2.4,
      textFill: '#022c22',
      textStroke: '#ffffff',
      textStrokeWeight: 3.0,
    },
    areasVerdesVegetacion: {
      fill: '#34d399',                  // Verde colina
      stroke: '#047857',
      strokeWeight: 1.6,
    },
    manzanasUrbanas: {
      fill: '#FDE68A',                  // Amarillo ocre suave de villa RPG
      stroke: '#fcd34d',
      strokeWeight: 1.0,
    },
    edificacionesCasas: {
      fill: '#ef4444',                  // Tejado rojo carmesí de casitas RPG
      stroke: '#991b1b',                // Sombra oscura de tejado
      strokeWeight: 1.8,
    },
    redVial: {
      callesLocales: {
        fill: '#f1f5f9',                // Piedra suave
        stroke: '#64748b',
        strokeWeight: 1.6,
      },
      avenidas: {
        fill: '#fbbf24',                // Camino dorado
        stroke: '#b45309',
        strokeWeight: 2.2,
      },
      autopistas: {
        fill: '#ea580c',                // Ruta principal
        stroke: '#7c2d12',
        strokeWeight: 2.6,
      },
      etiquetas: {
        textFill: '#0f172a',
        textStroke: '#ffffff',
        textStrokeWeight: 2.5,
      },
    },
    hidrografia: {
      fill: '#0284c7',                  // Azul zafiro RPG
      stroke: '#0369a1',
      strokeWeight: 2.0,
      textFill: '#082f49',
      textStroke: '#ffffff',
      textStrokeWeight: 2.5,
    },
    textura2DPixel: {
      tamanoBloquePx: 8,
      opacidadGeneral: 0.75,
      sombraCespedVerde: 'rgba(4, 120, 87, 0.20)',
      sombraTejasAndinas: 'rgba(153, 27, 27, 0.22)',
    },
  },

  /**
   * 4. ECO-PUEBLO ARTESANAL (Lino y Adobe)
   * Tonos tierra suaves, serenos y muy elegantes.
   * Manzanas en lino arena (#F5EBE0), casas en adobe tostado (#D4A373) y parques verde salvia/oliva (#588157).
   */
  tierraLino: {
    nombre: 'Eco-Pueblo Artesanal',
    descripcion: 'Diseño sobrio, elegante y de bajo impacto visual. Tonos tierra, fibras naturales, adobe tostado y verde salvia.',
    terrenoBase: {
      fondo: '#faf8f5',
    },
    areasVerdesParques: {
      fill: '#588157',                  // Verde salvia / oliva natural
      stroke: '#344e41',
      strokeWeight: 2.0,
      textFill: '#1c2826',
      textStroke: '#ffffff',
      textStrokeWeight: 2.5,
    },
    areasVerdesVegetacion: {
      fill: '#a3b18a',                  // Verde musgo suave
      stroke: '#588157',
      strokeWeight: 1.4,
    },
    manzanasUrbanas: {
      fill: '#F5EBE0',                  // Lino / arena suave descansado
      stroke: '#e6ccb2',
      strokeWeight: 1.0,
    },
    edificacionesCasas: {
      fill: '#D4A373',                  // Adobe tostado / terracota suave
      stroke: '#8c5a3c',
      strokeWeight: 1.5,
    },
    redVial: {
      callesLocales: {
        fill: '#FAEDCD',                // Papiro crema suave
        stroke: '#b7b7a4',
        strokeWeight: 1.5,
      },
      avenidas: {
        fill: '#e9d8a6',                // Arena dorada
        stroke: '#bb9457',
        strokeWeight: 1.8,
      },
      autopistas: {
        fill: '#ddb892',                // Arcilla compactada
        stroke: '#9c6644',
        strokeWeight: 2.4,
      },
      etiquetas: {
        textFill: '#283618',
        textStroke: '#ffffff',
        textStrokeWeight: 2.5,
      },
    },
    hidrografia: {
      fill: '#64b5f6',                  // Azul río sereno
      stroke: '#1e88e5',
      strokeWeight: 1.8,
      textFill: '#0d47a1',
      textStroke: '#ffffff',
      textStrokeWeight: 2.5,
    },
    textura2DPixel: {
      tamanoBloquePx: 8,
      opacidadGeneral: 0.60,
      sombraCespedVerde: 'rgba(52, 78, 65, 0.14)',
      sombraTejasAndinas: 'rgba(140, 90, 60, 0.16)',
    },
  },

  /**
   * 5. AVENTURA CREPUSCULAR / NOCHE
   * Estilo nocturno de alto contraste para expediciones al atardecer o noche.
   * Manzanas en pizarra oscura (#1E293B), casas en ámbar (#F59E0B) y parques con verde luminiscente (#10B981).
   */
  crepuscular: {
    nombre: 'Aventura Crepuscular',
    descripcion: 'Contraste nocturno mágico. Manzanas en pizarra profunda, casas con brillo ámbar y parques en esmeralda luminiscente.',
    terrenoBase: {
      fondo: '#0f172a',
    },
    areasVerdesParques: {
      fill: '#059669',                  // Esmeralda bosque nocturno
      stroke: '#10b981',                // Borde luminiscente
      strokeWeight: 2.2,
      textFill: '#ecfdf5',
      textStroke: '#064e3b',
      textStrokeWeight: 3.0,
    },
    areasVerdesVegetacion: {
      fill: '#064e3b',                  // Abeto oscuro
      stroke: '#047857',
      strokeWeight: 1.5,
    },
    manzanasUrbanas: {
      fill: '#1E293B',                  // Pizarra azulada oscura
      stroke: '#334155',
      strokeWeight: 1.0,
    },
    edificacionesCasas: {
      fill: '#f59e0b',                  // Ámbar luminoso de ventana/tejado
      stroke: '#b45309',
      strokeWeight: 1.6,
    },
    redVial: {
      callesLocales: {
        fill: '#334155',                  // Asfalto nocturno contrastado
        stroke: '#475569',
        strokeWeight: 1.6,
      },
      avenidas: {
        fill: '#6366f1',                // Índigo neón
        stroke: '#4338ca',
        strokeWeight: 2.0,
      },
      autopistas: {
        fill: '#ec4899',                // Magenta fluorescente
        stroke: '#be185d',
        strokeWeight: 2.6,
      },
      etiquetas: {
        textFill: '#f8fafc',
        textStroke: '#020617',
        textStrokeWeight: 2.5,
      },
    },
    hidrografia: {
      fill: '#0ea5e9',                  // Azul cian brillante
      stroke: '#0284c7',
      strokeWeight: 2.0,
      textFill: '#e0f2fe',
      textStroke: '#0c4a6e',
      textStrokeWeight: 2.5,
    },
    textura2DPixel: {
      tamanoBloquePx: 8,
      opacidadGeneral: 0.70,
      sombraCespedVerde: 'rgba(16, 185, 129, 0.18)',
      sombraTejasAndinas: 'rgba(245, 158, 11, 0.20)',
    },
  },
} as const satisfies Record<string, VamooMapPalette>;

/**
 * ============================================================================
 * PALETA ACTIVA: Cambia el ID aquí para activar cualquier paleta al instante
 * Opciones disponibles: 'valleAndino' | 'esmeraldaPixar' | 'retroRPG' | 'tierraLino' | 'crepuscular'
 * ============================================================================
 */
export const PALETA_SELECCIONADA: keyof typeof PALETAS_PREDEFINIDAS = 'tierraLino';

/**
 * Paleta exportada consumida por toda la aplicación de forma reactiva.
 */
export const VAMOO_MAP_PALETTE: VamooMapPalette = PALETAS_PREDEFINIDAS[PALETA_SELECCIONADA];
