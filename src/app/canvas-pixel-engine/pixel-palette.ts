/**
 * @fileoverview Paleta de colores de 16-bits para renderizado de mapas retro en Canvas 2D.
 * Define la gama cromática RPG vibrante (tonos tierra saturados, asfalto carbón de alto contraste,
 * verdes esmeralda luminosos y aguas cristalinas) y algoritmos de cuantización euclidiana perceptual.
 */

/**
 * Representación RGB de un color en formato tupla [R, G, B].
 */
export type RgbColor = [number, number, number];

/**
 * Entrada de color nombrada en la paleta RPG de 16-bits.
 */
export interface PaletteEntry {
  /** Nombre semántico del color (ej. 'asfalto_carbon', 'cesped_esmeralda') */
  name: string;
  /** Representación hexadecimal del color */
  hex: string;
  /** Componentes numéricos [R, G, B] en rango 0-255 */
  rgb: RgbColor;
}

/**
 * Paleta de colores CIUDAD VIVA — tonos urbanos realistas con alta legibilidad pixel-art.
 * Diseñada para representar fielmente el tejido urbano:
 * - Asfalto en grises reales (gris oscuro, medio y claro según jerarquía vial)
 * - Parques en verde esmeralda saturado y vibrante
 * - Edificios en crema/beige cálido urbano (sin techos rojos artificiales)
 * - Aceras en gris claro distinguible del asfalto
 * - Agua en azul turquesa cristalino
 */
export const VIBRANT_16BIT_PALETTE: PaletteEntry[] = [
  // 1. ASFALTO Y CARRETERAS — Jerarquía de grises urbanos reales
  { name: 'asfalto_autopista',      hex: '#3d4451', rgb: [61, 68, 81] },   // Autopistas/vías rápidas — gris pizarra oscuro
  { name: 'asfalto_avenida',        hex: '#545b6b', rgb: [84, 91, 107] },  // Avenidas principales — gris medio cálido
  { name: 'asfalto_calle',          hex: '#6b7280', rgb: [107, 114, 128] }, // Calles locales — gris medio neutro
  { name: 'asfalto_callejon',       hex: '#7f8694', rgb: [127, 134, 148] }, // Callejones/senderos — gris claro
  { name: 'linea_blanca',           hex: '#e5e7eb', rgb: [229, 231, 235] }, // Líneas de demarcación blancas
  { name: 'linea_amarilla',         hex: '#fbbf24', rgb: [251, 191, 36] },  // Líneas amarillas de división

  // 2. ACERAS, VEREDAS Y PLAZAS — Gris claro diferenciado del asfalto
  { name: 'acera_clara',            hex: '#c9cdd4', rgb: [201, 205, 212] }, // Veredas y aceras — gris perla
  { name: 'plaza_adoquin',          hex: '#b8bcc4', rgb: [184, 188, 196] }, // Plazas adoquinadas — gris frío
  { name: 'vereda_beige',           hex: '#d4c9b8', rgb: [212, 201, 184] }, // Veredas beige cálido

  // 3. PARQUES, ÁREAS VERDES — Verde esmeralda vivo y saturado con texturas
  { name: 'pasto_esmeralda_vivo',   hex: '#10b981', rgb: [16, 185, 129] },  // Césped principal — esmeralda puro vibrante
  { name: 'pasto_verde_brillante',  hex: '#059669', rgb: [5, 150, 105] },   // Pasto más oscuro/sombras de césped
  { name: 'parque_verde_claro',     hex: '#34d399', rgb: [52, 211, 153] },  // Zonas claras del parque y copas de árboles
  { name: 'arboles_verde_profundo', hex: '#065f46', rgb: [6, 95, 70] },     // Masas arbóreas densas y sombras de follaje
  { name: 'arbol_resalte_verde',    hex: '#6ee7b7', rgb: [110, 231, 183] }, // Resalte luminoso de hojas y arbustos

  // 4. TECHOS Y CASITAS CON TEXTURA — Terracota, arcilla y ladrillo tradicional
  { name: 'techo_teja_terracota',    hex: '#c2410c', rgb: [194, 65, 12] },  // Techo de tejas terracota tradicional
  { name: 'techo_teja_rojo_arcilla', hex: '#b91c1c', rgb: [185, 28, 28] },  // Techo rojo arcilla / sombra de tejado
  { name: 'techo_teja_naranja_vivo', hex: '#ea580c', rgb: [234, 88, 12] },  // Caballete de tejado y teja soleada
  { name: 'techo_ladrillo_marron',   hex: '#9a3412', rgb: [154, 52, 18] },  // Alero y sombra profunda bajo tejado
  { name: 'techo_plano_cemento',     hex: '#94a3b8', rgb: [148, 163, 184] }, // Azotea plana moderna / parapeto

  // 5. FACHADAS, PAREDES Y VENTANAS — Estuco cálido y reflejos
  { name: 'edificio_crema',          hex: '#f5f0e8', rgb: [245, 240, 232] }, // Fachadas claras — crema puro
  { name: 'edificio_beige',          hex: '#e8dcc8', rgb: [232, 220, 200] }, // Fachadas beige medio
  { name: 'edificio_gris_claro',     hex: '#dde1e7', rgb: [221, 225, 231] }, // Fachadas modernas grises
  { name: 'pared_fachada_amarilla',  hex: '#fef08a', rgb: [254, 240, 138] }, // Fachada colonial amarilla cálida
  { name: 'pared_fachada_estuco',    hex: '#fde68a', rgb: [253, 230, 138] }, // Fachada estuco ocre suave
  { name: 'lote_arena',              hex: '#d4c4a0', rgb: [212, 196, 160] }, // Patios interiores / tierra
  { name: 'ventana_reflejo_celeste', hex: '#38bdf8', rgb: [56, 189, 248] },  // Reflejo diurno en cristales de ventana
  { name: 'ventana_sombra_oscura',   hex: '#0f172a', rgb: [15, 23, 42] },    // Interior oscuro de ventana o puerta

  // 6. HIDROGRAFÍA — Azul cristalino distinguible
  { name: 'agua_profunda',          hex: '#1e6091', rgb: [30, 96, 145] },   // Agua profunda — azul marino
  { name: 'agua_media',             hex: '#2980b9', rgb: [41, 128, 185] },  // Agua media — azul real
  { name: 'agua_cristalina',        hex: '#5dade2', rgb: [93, 173, 226] },  // Agua poco profunda — celeste
];

/**
 * Paleta clásica de tonos tierra (versión previa conservada para compatibilidad).
 */
export const RPG_16BIT_PALETTE: PaletteEntry[] = [
  { name: 'asfalto_oscuro', hex: '#222831', rgb: [34, 40, 49] },
  { name: 'asfalto_medio', hex: '#393e46', rgb: [57, 62, 70] },
  { name: 'linea_vial_blanca', hex: '#f0f3f4', rgb: [240, 243, 244] },
  { name: 'linea_vial_amarilla', hex: '#f9d342', rgb: [249, 211, 66] },
  { name: 'cesped_profundo', hex: '#2d6a4f', rgb: [45, 106, 79] },
  { name: 'cesped_vibrante', hex: '#40916c', rgb: [64, 145, 108] },
  { name: 'cesped_claro', hex: '#74c69d', rgb: [116, 198, 157] },
  { name: 'arboles_oscuro', hex: '#1b4332', rgb: [27, 67, 50] },
  { name: 'techo_teja_rojizo', hex: '#b7410e', rgb: [183, 65, 14] },
  { name: 'techo_teja_marron', hex: '#8b4513', rgb: [139, 69, 19] },
  { name: 'techo_teja_claro', hex: '#c86432', rgb: [200, 100, 50] },
  { name: 'pared_crema', hex: '#f5f0bb', rgb: [245, 240, 187] },
  { name: 'pared_beige', hex: '#e8d5b5', rgb: [232, 213, 181] },
  { name: 'pared_adobe', hex: '#c5a059', rgb: [197, 160, 89] },
  { name: 'agua_profunda', hex: '#1d3557', rgb: [29, 53, 87] },
  { name: 'agua_superficie', hex: '#457b9d', rgb: [69, 123, 157] },
  { name: 'agua_cristalina', hex: '#a8dadc', rgb: [168, 218, 220] },
  { name: 'sendero_tierra', hex: '#d4a373', rgb: [212, 163, 115] },
  { name: 'acera_adoquin', hex: '#ccd5ae', rgb: [204, 213, 174] },
];

/**
 * Cuantiza un color RGB al color más cercano en la paleta de 16-bits utilizando distancia euclidiana perceptual Redmean.
 *
 * @param r - Componente rojo (0-255).
 * @param g - Componente verde (0-255).
 * @param b - Componente azul (0-255).
 * @param palette - Lista de colores de referencia (por defecto VIBRANT_16BIT_PALETTE).
 * @returns La entrada de la paleta más representativa cromáticamente.
 */
export function quantizeRgbToPalette(
  r: number,
  g: number,
  b: number,
  palette: PaletteEntry[] = VIBRANT_16BIT_PALETTE
): PaletteEntry {
  let minDistance = Number.POSITIVE_INFINITY;
  let bestMatch = palette[0];

  for (let i = 0; i < palette.length; i++) {
    const entry = palette[i];
    const [pr, pg, pb] = entry.rgb;

    // Distancia perceptual humana ponderada (Redmean)
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const rMean = (r + pr) * 0.5;

    const distance = (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = entry;
    }
  }

  return bestMatch;
}
