/**
 * @fileoverview Pruebas unitarias para el motor de rasterizado PixelRasterizer y la paleta viva de 16-bits.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PixelRasterizer, StreetLabel } from './pixel-rasterizer';
import { quantizeRgbToPalette, VIBRANT_16BIT_PALETTE, RPG_16BIT_PALETTE } from './pixel-palette';

describe('PixelPalette - Cuantización de color', () => {
  it('debe mapear tonos verdes al color de césped de la paleta viva', () => {
    const match = quantizeRgbToPalette(40, 200, 110, VIBRANT_16BIT_PALETTE);
    expect(match.name).toMatch(/pasto|verde/);
  });

  it('debe mapear grises oscuros al color de asfalto carbón profundo', () => {
    const match = quantizeRgbToPalette(60, 68, 80, VIBRANT_16BIT_PALETTE);
    expect(match.name).toContain('asfalto');
  });

  it('debe mapear tonos azulados a agua oceánica vibrante', () => {
    const match = quantizeRgbToPalette(15, 120, 220, VIBRANT_16BIT_PALETTE);
    expect(match.name).toContain('agua');
  });

  it('debe mantener compatibilidad con la paleta RPG clásica', () => {
    const match = quantizeRgbToPalette(50, 180, 80, RPG_16BIT_PALETTE);
    expect(match.name).toContain('cesped');
  });
});

describe('PixelRasterizer - Algoritmos discretos nativos Canvas 2D', () => {
  let rasterizer: PixelRasterizer;

  beforeEach(() => {
    rasterizer = new PixelRasterizer(30, 30, '#000000');
  });

  it('debe inicializar la cuadrícula con el tamaño y color por defecto', () => {
    expect(rasterizer.gridWidth).toBe(30);
    expect(rasterizer.gridHeight).toBe(30);
    expect(rasterizer.getPixel(0, 0)).toBe('#000000');
    expect(rasterizer.getPixel(29, 29)).toBe('#000000');
    expect(rasterizer.getPixel(30, 30)).toBeNull();
  });

  it('debe dibujar una línea diagonal con el algoritmo de Bresenham', () => {
    rasterizer.drawBresenhamLine(0, 0, 10, 10, 1, '#ffffff');
    expect(rasterizer.getPixel(0, 0)).toBe('#ffffff');
    expect(rasterizer.getPixel(5, 5)).toBe('#ffffff');
    expect(rasterizer.getPixel(10, 10)).toBe('#ffffff');
  });

  it('debe dibujar una rotonda circular con el algoritmo de Bresenham', () => {
    const cx = 15;
    const cy = 15;
    const r = 8;
    rasterizer.drawBresenhamCircle(cx, cy, r, 2, '#ffd32a', false);

    expect(rasterizer.getPixel(cx + r, cy)).toBe('#ffd32a');
    expect(rasterizer.getPixel(cx - r, cy)).toBe('#ffd32a');
    expect(rasterizer.getPixel(cx, cy + r)).toBe('#ffd32a');
    expect(rasterizer.getPixel(cx, cy - r)).toBe('#ffd32a');
    expect(rasterizer.getPixel(cx, cy)).toBe('#000000');
  });

  it('debe rellenar un polígono de parque usando Scanline', () => {
    const polygon = [
      { x: 5, y: 5 },
      { x: 15, y: 5 },
      { x: 15, y: 15 },
      { x: 5, y: 15 },
    ];
    rasterizer.fillPolygon(polygon, '#10b981');

    expect(rasterizer.getPixel(10, 10)).toBe('#10b981');
    expect(rasterizer.getPixel(7, 7)).toBe('#10b981');
    expect(rasterizer.getPixel(2, 2)).toBe('#000000');
  });
});
