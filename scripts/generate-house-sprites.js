/**
 * @fileoverview Generador determinista de sprites pixel-art PNG transparentes para casas estilo Pokémon RPG.
 * Produce las 3 variantes arquitectónicas en 32x32 y 64x64 px con canal alfa completo y codificación PNG pura.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Codifica un búfer RGBA crudo en un archivo binario PNG estándar.
 *
 * @param {number} width - Ancho en píxeles.
 * @param {number} height - Alto en píxeles.
 * @param {Buffer} rgbaBuffer - Búfer con formato [R, G, B, A] por cada píxel.
 * @returns {Buffer} Búfer binario con la especificación completa de PNG.
 */
function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    const crcVal = zlib.crc32(Buffer.concat([typeBuf, data]));
    crc.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // 8 bits por canal
  ihdr[9] = 6;  // RGBA con transparencia
  ihdr[10] = 0; // Compresión estándar Deflate
  ihdr[11] = 0; // Filtro None
  ihdr[12] = 0; // Sin entrelazado

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0; // Filter type 0
    rgbaBuffer.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idat = zlib.deflateSync(scanlines, { level: 9 });

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

/**
 * Lienzo pixel-art para rasterización en cuadrícula con soporte de transparencia alfa.
 */
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4, 0);
  }

  /**
   * Pinta un píxel con mezcla alfa (alpha blending).
   */
  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a < 255) {
      const bgA = this.buffer[idx + 3] / 255;
      const fgA = a / 255;
      const outA = fgA + bgA * (1 - fgA);
      if (outA > 0) {
        this.buffer[idx] = Math.round((r * fgA + this.buffer[idx] * bgA * (1 - fgA)) / outA);
        this.buffer[idx + 1] = Math.round((g * fgA + this.buffer[idx + 1] * bgA * (1 - fgA)) / outA);
        this.buffer[idx + 2] = Math.round((b * fgA + this.buffer[idx + 2] * bgA * (1 - fgA)) / outA);
        this.buffer[idx + 3] = Math.round(outA * 255);
      }
    } else {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    }
  }

  /**
   * Rellena un rectángulo.
   */
  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  /**
   * Dibuja el contorno de un rectángulo.
   */
  strokeRect(x, y, w, h, r, g, b, a = 255) {
    for (let px = x; px < x + w; px++) {
      this.setPixel(px, y, r, g, b, a);
      this.setPixel(px, y + h - 1, r, g, b, a);
    }
    for (let py = y; py < y + h; py++) {
      this.setPixel(x, py, r, g, b, a);
      this.setPixel(x + w - 1, py, r, g, b, a);
    }
  }

  /**
   * Rellena una elipse para sombras proyectadas.
   */
  fillEllipse(cx, cy, rx, ry, r, g, b, a = 255) {
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if ((dx * dx) / rx2 + (dy * dy) / ry2 <= 1) {
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  /**
   * Rellena un triángulo simétrico para techos a dos aguas.
   */
  fillGableRoof(leftX, baseY, topX, topY, rightX, r, g, b, a = 255) {
    for (let y = topY; y <= baseY; y++) {
      const t = (y - topY) / (baseY - topY);
      const xStart = Math.round(topX + (leftX - topX) * t);
      const xEnd = Math.round(topX + (rightX - topX) * t);
      for (let x = xStart; x <= xEnd; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  /**
   * Escala la imagen actual a un nuevo lienzo mediante Nearest-Neighbor (pixel art puro).
   */
  scaleNearest(factor) {
    const target = new PixelCanvas(this.width * factor, this.height * factor);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const srcIdx = (y * this.width + x) * 4;
        const r = this.buffer[srcIdx];
        const g = this.buffer[srcIdx + 1];
        const b = this.buffer[srcIdx + 2];
        const a = this.buffer[srcIdx + 3];
        if (a > 0) {
          target.fillRect(x * factor, y * factor, factor, factor, r, g, b, a);
        }
      }
    }
    return target;
  }
}

/**
 * Genera la Variante 0: Casa tradicional con techo terracota viva, chimenea y fachada cálida.
 */
function drawHouseVariant0() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra base proyectada en el suelo
  c.fillEllipse(16, 29, 13, 2.5, 0, 0, 0, 85);

  // 2. Muros de fachada de adobe marfil cálido (20px ancho x 14px alto)
  c.fillRect(6, 15, 20, 14, 255, 237, 213); // #FFEDD5
  // Sombra pared derecha
  c.fillRect(22, 15, 4, 14, 254, 215, 170); // #FED7AA
  // Zócalo de piedra en la base
  c.fillRect(6, 27, 20, 2, 217, 119, 6);   // #D97706
  // Contorno inferior y lateral
  c.strokeRect(6, 15, 20, 14, 124, 45, 18); // #7C2D12

  // 3. Chimenea de ladrillo
  c.fillRect(21, 3, 4, 7, 154, 52, 18);     // #9A3412
  c.strokeRect(21, 3, 4, 7, 67, 20, 7);     // #431407
  c.fillRect(20, 2, 6, 2, 124, 45, 18);     // Remate superior
  c.setPixel(21, 2, 67, 20, 7);             // Orificio
  c.setPixel(22, 2, 67, 20, 7);
  // Humo sutil
  c.setPixel(22, 0, 241, 245, 249, 140);
  c.setPixel(23, 1, 241, 245, 249, 180);

  // 4. Tejado a dos aguas de teja terracota andina
  c.fillGableRoof(3, 15, 16, 4, 28, 249, 115, 22); // #F97316
  // Sombra inferior en aleros
  for (let x = 4; x <= 27; x++) {
    c.setPixel(x, 15, 154, 52, 18); // #9A3412
    c.setPixel(x, 14, 234, 88, 12); // #EA580C
  }
  // Líneas decorativas de tejas
  for (let y = 7; y <= 13; y += 2) {
    const t = (y - 4) / 11;
    const xS = Math.round(16 + (3 - 16) * t) + 1;
    const xE = Math.round(16 + (28 - 16) * t) - 1;
    for (let x = xS; x <= xE; x += 3) {
      c.setPixel(x, y, 234, 88, 12);
    }
  }
  // Cumbrera superior
  c.fillRect(14, 4, 5, 2, 251, 146, 60); // #FB923C
  // Contorno del tejado
  for (let y = 4; y <= 15; y++) {
    const t = (y - 4) / 11;
    const xL = Math.round(16 + (3 - 16) * t);
    const xR = Math.round(16 + (28 - 16) * t);
    c.setPixel(xL, y, 124, 45, 18);
    c.setPixel(xR, y, 124, 45, 18);
  }
  c.fillRect(3, 15, 26, 1, 124, 45, 18);

  // 5. Puerta de madera con pomo dorado
  c.fillRect(9, 20, 6, 9, 133, 77, 14);    // #854D0E
  c.strokeRect(9, 20, 6, 9, 69, 26, 3);    // #451A03
  c.setPixel(13, 24, 250, 204, 21);        // Pomo oro #FACC15
  c.setPixel(13, 25, 202, 138, 4);

  // 6. Ventana azul con marco y cruceta blanca
  c.fillRect(17, 18, 6, 6, 96, 165, 250);   // Vidrio #60A5FA
  c.strokeRect(17, 18, 6, 6, 30, 58, 138);  // Marco #1E3A8A
  // Cruceta
  for (let y = 19; y <= 22; y++) c.setPixel(19, y, 255, 255, 255);
  for (let x = 18; x <= 21; x++) c.setPixel(x, 20, 255, 255, 255);
  // Destello en cristal
  c.setPixel(18, 19, 239, 246, 255);

  return c;
}

/**
 * Genera la Variante 1: Cabaña de sillar con tejado azul cobalto, ventana celeste y farol exterior.
 */
function drawHouseVariant1() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra base
  c.fillEllipse(16, 29, 13, 2.5, 0, 0, 0, 85);

  // 2. Muros de sillar blanco / crema (20px ancho x 14px alto)
  c.fillRect(6, 15, 20, 14, 248, 250, 252); // #F8FAFC
  c.fillRect(22, 15, 4, 14, 203, 213, 225); // Sombra sillar #CBD5E1
  c.fillRect(6, 27, 20, 2, 100, 116, 139);  // Zócalo granito #64748B
  c.strokeRect(6, 15, 20, 14, 51, 65, 85);   // Contorno #334155

  // 3. Tejado azul cobalto / pizarra
  c.fillGableRoof(3, 15, 16, 4, 28, 37, 99, 235); // #2563EB
  // Sombra aleros
  for (let x = 4; x <= 27; x++) {
    c.setPixel(x, 15, 30, 58, 138); // #1E3A8A
    c.setPixel(x, 14, 29, 78, 216); // #1D4ED8
  }
  // Textura tejas cobalto
  for (let y = 7; y <= 13; y += 2) {
    const t = (y - 4) / 11;
    const xS = Math.round(16 + (3 - 16) * t) + 1;
    const xE = Math.round(16 + (28 - 16) * t) - 1;
    for (let x = xS; x <= xE; x += 3) {
      c.setPixel(x, y, 29, 78, 216);
    }
  }
  // Cumbre zafiro brillante
  c.fillRect(14, 4, 5, 2, 96, 165, 250); // #60A5FA
  // Contornos tejado
  for (let y = 4; y <= 15; y++) {
    const t = (y - 4) / 11;
    const xL = Math.round(16 + (3 - 16) * t);
    const xR = Math.round(16 + (28 - 16) * t);
    c.setPixel(xL, y, 15, 23, 42); // #0F172A
    c.setPixel(xR, y, 15, 23, 42);
  }
  c.fillRect(3, 15, 26, 1, 15, 23, 42);

  // 4. Puerta de nogal oscuro
  c.fillRect(9, 20, 6, 9, 69, 26, 3);     // #451A03
  c.strokeRect(9, 20, 6, 9, 28, 25, 23);  // #1C1917
  c.setPixel(13, 24, 250, 204, 21);       // Pomo oro
  c.setPixel(13, 25, 202, 138, 4);

  // 5. Ventana glaciar celeste
  c.fillRect(17, 18, 6, 6, 147, 197, 253); // #93C5FD
  c.strokeRect(17, 18, 6, 6, 30, 58, 138); // #1E3A8A
  for (let y = 19; y <= 22; y++) c.setPixel(19, y, 255, 255, 255);
  for (let x = 18; x <= 21; x++) c.setPixel(x, 20, 255, 255, 255);
  c.setPixel(18, 19, 255, 255, 255);

  // 6. Farol exterior cálido
  c.setPixel(7, 21, 51, 65, 85);           // Brazo farol
  c.fillRect(7, 22, 2, 3, 250, 204, 21);   // Lámpara #FACC15
  c.setPixel(6, 23, 254, 240, 138, 160);   // Halo cálido
  c.setPixel(9, 23, 254, 240, 138, 160);

  return c;
}

/**
 * Genera la Variante 2: Casona colonial andina con tejado de arcilla ocre tostada, portón de arco y ventanas gemelas.
 */
function drawHouseVariant2() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra base
  c.fillEllipse(16, 29, 13, 2.5, 0, 0, 0, 85);

  // 2. Muros de adobe colonial ocre claro
  c.fillRect(6, 15, 20, 14, 254, 243, 199); // #FEF3C7
  c.fillRect(22, 15, 4, 14, 253, 230, 138); // Sombra ocre #FDE68A
  c.fillRect(6, 27, 20, 2, 146, 64, 14);    // Zócalo colonial #92400E
  c.strokeRect(6, 15, 20, 14, 120, 53, 15);  // Contorno #78350F

  // 3. Tejado de arcilla ocre tostada con cornisa colonial
  c.fillGableRoof(3, 15, 16, 4, 28, 180, 83, 9); // #B45309
  // Cornisa decorativa colonial
  for (let x = 4; x <= 27; x++) {
    c.setPixel(x, 15, 120, 53, 15); // #78350F
    c.setPixel(x, 14, 146, 64, 14); // #92400E
    c.setPixel(x, 13, 217, 119, 6); // Moldura dorada #D97706
  }
  // Líneas de teja colonial
  for (let y = 7; y <= 12; y += 2) {
    const t = (y - 4) / 11;
    const xS = Math.round(16 + (3 - 16) * t) + 1;
    const xE = Math.round(16 + (28 - 16) * t) - 1;
    for (let x = xS; x <= xE; x += 3) {
      c.setPixel(x, y, 146, 64, 14);
    }
  }
  // Cumbrera
  c.fillRect(14, 4, 5, 2, 217, 119, 6);
  // Contornos
  for (let y = 4; y <= 15; y++) {
    const t = (y - 4) / 11;
    const xL = Math.round(16 + (3 - 16) * t);
    const xR = Math.round(16 + (28 - 16) * t);
    c.setPixel(xL, y, 69, 26, 3);
    c.setPixel(xR, y, 69, 26, 3);
  }
  c.fillRect(3, 15, 26, 1, 69, 26, 3);

  // 4. Portón colonial central en arco
  c.fillRect(13, 21, 6, 8, 113, 63, 18);   // Madera #713F12
  // Arco superior
  c.fillRect(14, 20, 4, 1, 113, 63, 18);
  // Contorno portón
  c.strokeRect(13, 21, 6, 8, 69, 26, 3);
  c.fillRect(14, 20, 4, 1, 69, 26, 3);
  c.fillRect(14, 21, 4, 1, 113, 63, 18);
  // Herrajes y aldaba
  c.setPixel(14, 23, 28, 25, 23);
  c.setPixel(14, 26, 28, 25, 23);
  c.setPixel(17, 24, 250, 204, 21); // Aldaba oro

  // 5. Dos ventanitas coloniales gemelas
  // Ventana izquierda
  c.fillRect(8, 17, 4, 5, 56, 189, 248);  // #38BDF8
  c.strokeRect(8, 17, 4, 5, 120, 53, 15); // Marco colonial #78350F
  c.setPixel(9, 18, 186, 230, 253);       // Destello
  // Ventana derecha
  c.fillRect(20, 17, 4, 5, 56, 189, 248);
  c.strokeRect(20, 17, 4, 5, 120, 53, 15);
  c.setPixel(21, 18, 186, 230, 253);

  return c;
}

/**
 * Genera una tira horizontal (spritesheet) que reúne las 3 casas una al lado de la otra.
 *
 * @param {Array<PixelCanvas>} variants - Lista de lienzos de cada casa.
 * @returns {PixelCanvas} Lienzo combinado con los sprites ordenados.
 */
function createSpriteSheet(variants) {
  const w = variants[0].width;
  const h = variants[0].height;
  const sheet = new PixelCanvas(w * variants.length, h);

  variants.forEach((v, idx) => {
    const offsetX = idx * w;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcIdx = (y * w + x) * 4;
        const r = v.buffer[srcIdx];
        const g = v.buffer[srcIdx + 1];
        const b = v.buffer[srcIdx + 2];
        const a = v.buffer[srcIdx + 3];
        if (a > 0) {
          sheet.setPixel(offsetX + x, y, r, g, b, a);
        }
      }
    }
  });

  return sheet;
}

// ============================================================================
// EJECUCIÓN PRINCIPAL: GENERACIÓN Y ESCRITURA DE ARCHIVOS
// ============================================================================

const outDirHouses = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'houses');
const outDirSprites = path.join(__dirname, '..', 'public', 'assets', 'sprites');

fs.mkdirSync(outDirHouses, { recursive: true });
fs.mkdirSync(outDirSprites, { recursive: true });

console.log('Generando sprites de casas estilo Pokémon...');

const var0_32 = drawHouseVariant0();
const var1_32 = drawHouseVariant1();
const var2_32 = drawHouseVariant2();

// Versiones 64x64 mediante escalado Nearest-Neighbor
const var0_64 = var0_32.scaleNearest(2);
const var1_64 = var1_32.scaleNearest(2);
const var2_64 = var2_32.scaleNearest(2);

// Spritesheets horizontales
const sheet_32 = createSpriteSheet([var0_32, var1_32, var2_32]);
const sheet_64 = createSpriteSheet([var0_64, var1_64, var2_64]);

// Archivos en public/assets/sprites/houses/
const filesToSave = [
  // Nombres descriptivos 32x32
  { name: 'house_variant_0_terracotta_32.png', canvas: var0_32, dir: outDirHouses },
  { name: 'house_variant_1_cobalt_32.png', canvas: var1_32, dir: outDirHouses },
  { name: 'house_variant_2_colonial_32.png', canvas: var2_32, dir: outDirHouses },
  // Nombres descriptivos 64x64
  { name: 'house_variant_0_terracotta_64.png', canvas: var0_64, dir: outDirHouses },
  { name: 'house_variant_1_cobalt_64.png', canvas: var1_64, dir: outDirHouses },
  { name: 'house_variant_2_colonial_64.png', canvas: var2_64, dir: outDirHouses },
  // Nombres directos por índice en houses/
  { name: 'house_0.png', canvas: var0_32, dir: outDirHouses },
  { name: 'house_1.png', canvas: var1_32, dir: outDirHouses },
  { name: 'house_2.png', canvas: var2_32, dir: outDirHouses },
  // Spritesheets combinados
  { name: 'house_spritesheet_32.png', canvas: sheet_32, dir: outDirHouses },
  { name: 'house_spritesheet_64.png', canvas: sheet_64, dir: outDirHouses },
  // Acceso directo en public/assets/sprites/ para el motor de juego
  { name: 'house_0.png', canvas: var0_32, dir: outDirSprites },
  { name: 'house_1.png', canvas: var1_32, dir: outDirSprites },
  { name: 'house_2.png', canvas: var2_32, dir: outDirSprites },
];

filesToSave.forEach((item) => {
  const filePath = path.join(item.dir, item.name);
  const pngData = encodePng(item.canvas.width, item.canvas.height, item.canvas.buffer);
  fs.writeFileSync(filePath, pngData);
  console.log(`[OK] Generado: ${filePath} (${pngData.length} bytes, ${item.canvas.width}x${item.canvas.height})`);
});

console.log('Todos los sprites de casas han sido generados exitosamente.');
