/**
 * @fileoverview Generador determinista de sprites pixel-art PNG transparentes para vegetación y arbustos estilo Pokémon Clásico.
 * Genera las variantes botánicas:
 * 0: Hierba alta clásica Pokémon (Tall grass)
 * 1: Parche de flores silvestres andinas (Wildflowers)
 * 2: Arbusto redondo bajo de jardín (Round Bush)
 * 3: Arbusto floral con bayas (Flowering Bush)
 * En 32x32 y 64x64 px con canal alfa puro y spritesheet combinado.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Codificador PNG estándar con Deflate y CRC32.
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
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0;
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
 * Lienzo pixel-art en cuadrícula con mezcla alfa.
 */
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4, 0);
  }

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

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

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

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

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

// ============================================================================
// DISEÑOS DE VEGETACIÓN Y ARBUSTOS ESTILO POKÉMON (32x32 px)
// ============================================================================

/**
 * VARIANTE 0: Hierba Alta Pokémon Clásica (Tall Grass de Ruta 1 / GBA).
 */
function drawVegetationVariant0() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra base en el suelo
  c.fillEllipse(16, 29, 10, 2, 0, 0, 0, 75);

  // 2. Base verde oscuro de césped
  c.fillRect(7, 26, 18, 3, 6, 78, 59);    // #064E3B
  c.strokeRect(7, 26, 18, 3, 2, 44, 34); // #022C22

  // 3. 5 Briznas de hierba alta estilizadas con contornos y degradados
  // Brizna 1 (Izquierda inclinada)
  const blade1 = [
    [9, 26], [9, 24], [8, 22], [8, 20], [7, 18], [6, 16], [5, 14]
  ];
  blade1.forEach(([bx, by], i) => {
    c.fillRect(bx, by, 2, 2, 21, 128, 61); // #15803D
    if (i >= 4) c.setPixel(bx, by, 74, 222, 128); // #4ADE80
  });

  // Brizna 2 (Centro-izquierda alta)
  const blade2 = [
    [12, 26], [12, 23], [12, 20], [11, 17], [11, 14], [10, 11], [10, 8]
  ];
  blade2.forEach(([bx, by], i) => {
    c.fillRect(bx, by, 2, 2, 34, 197, 94); // #22C55E
    if (i >= 4) c.setPixel(bx, by, 134, 239, 172); // #86EFAC
  });

  // Brizna 3 (Centro principal más alta)
  const blade3 = [
    [15, 26], [15, 22], [15, 18], [15, 14], [15, 10], [15, 7], [15, 5]
  ];
  blade3.forEach(([bx, by], i) => {
    c.fillRect(bx, by, 2, 2, 22, 163, 74); // #16A34A
    if (i >= 5) c.setPixel(bx, by, 187, 247, 208); // Destello cumbre
  });

  // Brizna 4 (Centro-derecha alta)
  const blade4 = [
    [18, 26], [18, 23], [19, 20], [19, 17], [20, 14], [21, 11], [21, 8]
  ];
  blade4.forEach(([bx, by], i) => {
    c.fillRect(bx, by, 2, 2, 34, 197, 94);
    if (i >= 4) c.setPixel(bx, by, 134, 239, 172);
  });

  // Brizna 5 (Derecha inclinada)
  const blade5 = [
    [21, 26], [22, 24], [23, 22], [24, 20], [25, 18], [26, 16], [27, 14]
  ];
  blade5.forEach(([bx, by], i) => {
    c.fillRect(bx, by, 2, 2, 21, 128, 61);
    if (i >= 4) c.setPixel(bx, by, 74, 222, 128);
  });

  return c;
}

/**
 * VARIANTE 1: Parche de Flores Silvestres Andinas (Wildflowers con flores rojas, amarillas y rosas).
 */
function drawVegetationVariant1() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra base
  c.fillEllipse(16, 29, 10, 2, 0, 0, 0, 75);

  // 2. Base de hojas verdes
  c.fillRect(8, 25, 16, 4, 22, 101, 52); // #166534
  c.setPixel(7, 27, 21, 128, 61);
  c.setPixel(24, 27, 21, 128, 61);

  // Tallos de flores
  for (let y = 17; y <= 25; y++) c.setPixel(11, y, 22, 163, 74);
  for (let y = 13; y <= 25; y++) c.setPixel(16, y, 22, 163, 74);
  for (let y = 15; y <= 25; y++) c.setPixel(21, y, 22, 163, 74);

  // Hojitas laterales en los tallos
  c.setPixel(9, 22, 34, 197, 94);
  c.setPixel(14, 19, 34, 197, 94);
  c.setPixel(18, 20, 34, 197, 94);
  c.setPixel(23, 21, 34, 197, 94);

  // Flor 1: Roja amapola (izquierda)
  c.fillRect(9, 14, 5, 5, 239, 68, 68);    // Pétalos #EF4444
  c.strokeRect(9, 14, 5, 5, 153, 27, 27);  // Contorno #991B1B
  c.setPixel(11, 16, 250, 204, 21);        // Centro oro #FACC15

  // Flor 2: Amarilla girasol andino (centro alta)
  c.fillRect(14, 10, 5, 5, 250, 204, 21);  // Pétalos #FACC15
  c.strokeRect(14, 10, 5, 5, 180, 83, 9);  // Contorno #B45309
  c.setPixel(16, 12, 234, 88, 12);         // Centro naranja #EA580C

  // Flor 3: Rosa andina (derecha)
  c.fillRect(19, 12, 5, 5, 236, 72, 153);  // Pétalos #EC4899
  c.strokeRect(19, 12, 5, 5, 157, 23, 77); // Contorno #9D174D
  c.setPixel(21, 14, 255, 255, 255);       // Centro blanco perla

  return c;
}

/**
 * VARIANTE 2: Arbusto Redondo Bajo de Jardín (Round Garden Bush clásico Pokémon).
 */
function drawVegetationVariant2() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra ovalada en el suelo
  c.fillEllipse(16, 28, 11, 3, 0, 0, 0, 85);

  // 2. Cuerpo del arbusto lobulado estilo Pokémon GBA
  // Lóbulo izquierdo base
  c.fillCircle(11, 20, 6.5, 2, 44, 34);   // Contorno
  c.fillCircle(11, 20, 5.8, 6, 78, 59);   // Verde sombra #064E3B

  // Lóbulo derecho base
  c.fillCircle(21, 20, 6.5, 2, 44, 34);   // Contorno
  c.fillCircle(21, 20, 5.8, 6, 78, 59);   // Verde sombra #064E3B

  // Lóbulo central superior
  c.fillCircle(16, 15, 7.8, 2, 44, 34);   // Contorno
  c.fillCircle(16, 15, 7.2, 22, 101, 52); // Verde medio #166534

  // Relleno interior verde vivo
  c.fillCircle(16, 15, 5.8, 22, 163, 74); // #16A34A
  c.fillCircle(15, 13.5, 4.2, 34, 197, 94); // #22C55E

  // Lóbulos iluminados con destellos esmeralda
  c.fillCircle(11, 19, 4.2, 22, 163, 74);
  c.fillCircle(21, 19, 4.2, 22, 163, 74);
  c.fillCircle(10, 18, 2.5, 74, 222, 128); // #4ADE80
  c.fillCircle(20, 18, 2.5, 74, 222, 128);

  // Destello en pixel art superior
  c.setPixel(14, 10, 134, 239, 172); // #86EFAC
  c.setPixel(15, 10, 134, 239, 172);
  c.setPixel(14, 11, 134, 239, 172);

  return c;
}

/**
 * VARIANTE 3: Arbusto Floral / Seto con Bayas (Flowering / Berry Bush).
 */
function drawVegetationVariant3() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra en el suelo
  c.fillEllipse(16, 28, 11, 3, 0, 0, 0, 85);

  // 2. Arbusto base
  c.fillCircle(11, 20, 6.5, 2, 44, 34);
  c.fillCircle(11, 20, 5.8, 6, 78, 59);
  c.fillCircle(21, 20, 6.5, 2, 44, 34);
  c.fillCircle(21, 20, 5.8, 6, 78, 59);
  c.fillCircle(16, 15, 7.8, 2, 44, 34);
  c.fillCircle(16, 15, 7.2, 22, 101, 52);
  c.fillCircle(16, 15, 5.8, 22, 163, 74);
  c.fillCircle(15, 13.5, 4.2, 34, 197, 94);

  // 3. Florecillas incrustadas en el arbusto
  const flowers = [
    { x: 10, y: 17, color: [239, 68, 68] },  // Roja
    { x: 16, y: 12, color: [250, 204, 21] }, // Oro
    { x: 21, y: 16, color: [236, 72, 153] }, // Rosa
    { x: 14, y: 21, color: [239, 68, 68] },  // Roja
    { x: 19, y: 22, color: [250, 204, 21] }  // Oro
  ];

  flowers.forEach(f => {
    c.fillRect(f.x, f.y, 2, 2, f.color[0], f.color[1], f.color[2]);
    c.setPixel(f.x, f.y, 255, 255, 255); // Destello blanco
  });

  return c;
}

/**
 * Genera una tira horizontal (spritesheet).
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
// EJECUCIÓN PRINCIPAL: GUARDAR SPRITES EN PUBLIC/ASSETS/SPRITES
// ============================================================================

const outDirVeg = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'vegetation');
const outDirBushes = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'bushes');
const outDirSprites = path.join(__dirname, '..', 'public', 'assets', 'sprites');

fs.mkdirSync(outDirVeg, { recursive: true });
fs.mkdirSync(outDirBushes, { recursive: true });
fs.mkdirSync(outDirSprites, { recursive: true });

console.log('Generando vegetación y arbustos estilo Pokémon clásico...');

const v0_32 = drawVegetationVariant0();
const v1_32 = drawVegetationVariant1();
const v2_32 = drawVegetationVariant2();
const v3_32 = drawVegetationVariant3();

const v0_64 = v0_32.scaleNearest(2);
const v1_64 = v1_32.scaleNearest(2);
const v2_64 = v2_32.scaleNearest(2);
const v3_64 = v3_32.scaleNearest(2);

const sheet32 = createSpriteSheet([v0_32, v1_32, v2_32, v3_32]);
const sheet64 = createSpriteSheet([v0_64, v1_64, v2_64, v3_64]);

const files = [
  // 32x32 nativo en vegetation/
  { name: 'veg_variant_0_tall_grass_32.png', canvas: v0_32, dir: outDirVeg },
  { name: 'veg_variant_1_wildflowers_32.png', canvas: v1_32, dir: outDirVeg },
  { name: 'veg_variant_2_round_bush_32.png', canvas: v2_32, dir: outDirVeg },
  { name: 'veg_variant_3_flowering_bush_32.png', canvas: v3_32, dir: outDirVeg },
  // 64x64 HD en vegetation/
  { name: 'veg_variant_0_tall_grass_64.png', canvas: v0_64, dir: outDirVeg },
  { name: 'veg_variant_1_wildflowers_64.png', canvas: v1_64, dir: outDirVeg },
  { name: 'veg_variant_2_round_bush_64.png', canvas: v2_64, dir: outDirVeg },
  { name: 'veg_variant_3_flowering_bush_64.png', canvas: v3_64, dir: outDirVeg },
  // Sprites primarios en vegetation/
  { name: 'veg_0.png', canvas: v0_64, dir: outDirVeg },
  { name: 'veg_1.png', canvas: v1_64, dir: outDirVeg },
  { name: 'veg_2.png', canvas: v2_64, dir: outDirVeg },
  { name: 'veg_3.png', canvas: v3_64, dir: outDirVeg },
  // Sprites primarios en bushes/
  { name: 'bush_0.png', canvas: v2_64, dir: outDirBushes },
  { name: 'bush_1.png', canvas: v3_64, dir: outDirBushes },
  // Spritesheets
  { name: 'veg_spritesheet_32.png', canvas: sheet32, dir: outDirVeg },
  { name: 'veg_spritesheet_64.png', canvas: sheet64, dir: outDirVeg },
  // Sprites directos para el motor cartográfico
  { name: 'veg_0.png', canvas: v0_64, dir: outDirSprites },
  { name: 'veg_1.png', canvas: v1_64, dir: outDirSprites },
  { name: 'veg_2.png', canvas: v2_64, dir: outDirSprites },
  { name: 'veg_3.png', canvas: v3_64, dir: outDirSprites },
  { name: 'bush_0.png', canvas: v2_64, dir: outDirSprites },
  { name: 'bush_1.png', canvas: v3_64, dir: outDirSprites },
];

files.forEach(f => {
  const filePath = path.join(f.dir, f.name);
  const data = encodePng(f.canvas.width, f.canvas.height, f.canvas.buffer);
  fs.writeFileSync(filePath, data);
  console.log(`[OK] Guardado: ${f.name} (${f.canvas.width}x${f.canvas.height})`);
});

console.log('Vegetación y arbustos estilo Pokémon clásico generados con éxito.');
