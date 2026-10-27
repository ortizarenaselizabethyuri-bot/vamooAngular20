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
 * Paleta de colores vibrantes estilo JRPG de 16-bits de alta saturación.
 * Diseñada para resaltar la identidad gráfica retro con alto impacto visual.
 */
export const VIBRANT_16BIT_PALETTE: PaletteEntry[] = [
  // 1. Asfalto y Carreteras (Carbón profundo y líneas vivas)
  { name: 'asfalto_carbon_profundo', hex: '#1e272e', rgb: [30, 39, 46] },
  { name: 'asfalto_gris_oscuro', hex: '#2f3640', rgb: [47, 54, 64] },
  { name: 'linea_vial_blanca_pura', hex: '#ffffff', rgb: [255, 255, 255] },
  { name: 'linea_vial_oro_brillante', hex: '#ffd32a', rgb: [255, 211, 42] },

  // 2. Vegetación y Parques (Verdes vivos y esmeralda)
  { name: 'cesped_esmeralda_vivo', hex: '#10b981', rgb: [16, 185, 129] },
  { name: 'cesped_menta_brillante', hex: '#2ecc71', rgb: [46, 204, 113] },
  { name: 'cesped_turquesa_bosque', hex: '#00b894', rgb: [0, 184, 148] },
  { name: 'arboles_verde_profundo', hex: '#059669', rgb: [5, 150, 105] },

  // 3. Edificios y Urbanismo (Techos terracota saturados y muros cálidos)
  { name: 'techo_terracota_viva', hex: '#e74c3c', rgb: [231, 76, 60] },
  { name: 'techo_ladrillo_fuego', hex: '#ff5722', rgb: [255, 87, 34] },
  { name: 'techo_carmesí_oscuro', hex: '#c0392b', rgb: [192, 57, 43] },
  { name: 'pared_oro_calido', hex: '#f9ca24', rgb: [249, 202, 36] },
  { name: 'pared_crema_dorada', hex: '#ffeaa7', rgb: [255, 234, 167] },
  { name: 'pared_blanco_puro', hex: '#f8f9fa', rgb: [248, 249, 250] },

  // 4. Hidrografía (Aguas luminosas y cristalinas)
  { name: 'agua_oceano_vibrante', hex: '#0984e3', rgb: [9, 132, 227] },
  { name: 'agua_turquesa_cristalina', hex: '#00cec9', rgb: [0, 206, 201] },
  { name: 'agua_cielo_superficie', hex: '#74b9ff', rgb: [116, 185, 255] },

  // 5. Suelo y Veredas
  { name: 'sendero_arena_dorada', hex: '#e17055', rgb: [225, 112, 85] },
  { name: 'acera_adoquin_clara', hex: '#dff9fb', rgb: [223, 249, 251] },
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
