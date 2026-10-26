/**
 * Configuración del tema y estilos Pixel Art para Mapbox GL JS.
 *
 * Propósito: Proveer esquemas de color, capas vectoriales y estilos de mapa
 * con estética retro 8-bit / 16-bit aplicables a la cartografía mundial de Mapbox GL.
 */

export interface MapboxThemeConfig {
  /** Estilo predeterminado de Mapbox o endpoint de estilo vectorial */
  styleUrl: string;
  /** Colores característicos de la paleta pixel-art */
  palette: {
    water: string;
    parks: string;
    roads: string;
    buildings: string;
    landuse: string;
    text: string;
  };
}

/**
 * Estilo Pixel-Art Retro para Mapbox GL.
 * Define la paleta de colores vibrantes tipo RPG (GBA/SNES) aplicable a capas de Mapbox.
 */
export const MAPBOX_PIXEL_THEME: MapboxThemeConfig = {
  styleUrl: 'mapbox://styles/mapbox/outdoors-v12',
  palette: {
    water: '#38bdf8',       // Azul vibrante pixel
    parks: '#4ade80',       // Verde esmeralda césped
    roads: '#fbbf24',       // Pistas amarillentas / tierra aventura
    buildings: '#64748b',   // Bloques contrastantes
    landuse: '#fef3c7',     // Arena / suelo claro cálido
    text: '#0f172a',        // Texto nítido oscuro
  },
};

/**
 * Genera el elemento HTML del marcador pixel-art para el aventurero en Mapbox GL.
 *
 * @param emoji - Icono o avatar seleccionado para el explorador.
 * @returns HTMLElement configurado con estilo pixel-art y animación.
 */
export function createPixelPlayerMarkerElement(emoji: string = '🦊'): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mapbox-pixel-avatar-marker';
  container.innerHTML = `
    <div class="pixel-avatar-halo"></div>
    <div class="pixel-avatar-box">
      <span class="pixel-avatar-emoji">${emoji}</span>
    </div>
    <div class="pixel-avatar-shadow"></div>
  `;
  return container;
}
